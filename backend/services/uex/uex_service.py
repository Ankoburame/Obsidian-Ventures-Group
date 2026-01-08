"""
Service UEX pour récupérer les prix des commodities depuis l'API UEX.
Adapté pour Obsidian Ventures Group avec MarketPrice et PriceSnapshot.
"""
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import requests

from sqlalchemy import desc
from sqlalchemy.orm import Session

from core.config import settings
from models.market import MarketPrice, PriceSnapshot
from models.material import Material
from models.location import Location

# Configuration
UEX_API_BASE_URL = "https://api.uexcorp.space/2.0"
CACHE_TTL_HOURS = 12

def get_headers() -> dict:
    """Retourne les headers pour les requêtes UEX API."""
    headers = {
        "Accept": "application/json",
        "User-Agent": "ObsidianVenturesGroup/1.0",
    }
    if settings.UEX_API_KEY:
        headers["Authorization"] = f"Bearer {settings.UEX_API_KEY}"
    return headers


def is_cache_valid(db: Session, material_id: Optional[int] = None) -> bool:
    """
    Vérifie si le cache des prix UEX est encore valide.
    
    Args:
        db: Session de base de données
        material_id: ID du matériau spécifique (None = vérification globale)
        
    Returns:
        True si le cache est valide, False sinon
    """
    cache_threshold = datetime.utcnow() - timedelta(hours=CACHE_TTL_HOURS)
    
    query = db.query(MarketPrice)
    
    if material_id:
        query = query.filter(MarketPrice.material_id == material_id)
    
    latest = query.order_by(desc(MarketPrice.last_updated)).first()
    
    if not latest:
        return False
    
    return latest.last_updated >= cache_threshold


def fetch_all_commodities_from_uex() -> List[Dict]:
    """
    Récupère toutes les commodities depuis l'API UEX.
    
    Returns:
        Liste de dictionnaires contenant les données des commodities
        
    Raises:
        RuntimeError: Si l'appel API échoue
    """
    url = f"{UEX_API_BASE_URL}/commodities"
    
    print(f"🌐 Fetching all commodities from UEX API...")
    
    response = requests.get(url, headers=get_headers(), timeout=30)
    
    if response.status_code != 200:
        raise RuntimeError(f"UEX API error: HTTP {response.status_code}")
    
    payload = response.json()
    commodities = payload.get("data", [])
    
    print(f"✅ Received {len(commodities)} commodities from UEX")
    
    return commodities


def fetch_commodity_prices(commodity_id: int) -> List[Dict]:
    """
    Récupère les prix d'une commodity spécifique pour toutes les locations.
    
    Args:
        commodity_id: ID de la commodity sur UEX
        
    Returns:
        Liste des prix par location
        
    Raises:
        RuntimeError: Si l'appel API échoue
    """
    url = f"{UEX_API_BASE_URL}/commodities/{commodity_id}/prices"
    
    response = requests.get(url, headers=get_headers(), timeout=15)
    
    if response.status_code != 200:
        raise RuntimeError(f"UEX API error for commodity {commodity_id}: HTTP {response.status_code}")
    
    payload = response.json()
    return payload.get("data", [])


def map_uex_commodity_to_material(
    db: Session,
    uex_commodity: Dict
) -> Optional[Material]:
    """
    Trouve le matériau correspondant dans la DB à partir d'une commodity UEX.
    
    Args:
        db: Session de base de données
        uex_commodity: Dictionnaire de commodity UEX
        
    Returns:
        Objet Material correspondant ou None si non trouvé
    """
    uex_id = uex_commodity.get("id")
    uex_name = uex_commodity.get("name", "").strip()
    
    if not uex_name:
        return None
    
    # Recherche par uex_id d'abord
    if uex_id:
        material = db.query(Material).filter(Material.uex_id == uex_id).first()
        if material:
            return material
    
    # Recherche par nom (case insensitive)
    material = db.query(Material).filter(
        Material.name.ilike(uex_name)
    ).first()
    
    return material


def calculate_price_statistics(prices: List[Dict]) -> Dict:
    """
    Calcule les statistiques de prix à partir d'une liste de prix UEX.
    
    Args:
        prices: Liste des prix par location depuis UEX
        
    Returns:
        Dictionnaire avec avg_buy_price, avg_sell_price, min_buy_price, max_sell_price, etc.
    """
    buy_prices = [p.get("price_buy") for p in prices if p.get("price_buy") and p.get("price_buy") > 0]
    sell_prices = [p.get("price_sell") for p in prices if p.get("price_sell") and p.get("price_sell") > 0]
    
    stats = {
        "avg_buy_price": sum(buy_prices) / len(buy_prices) if buy_prices else None,
        "avg_sell_price": sum(sell_prices) / len(sell_prices) if sell_prices else None,
        "min_buy_price": min(buy_prices) if buy_prices else None,
        "max_sell_price": max(sell_prices) if sell_prices else None,
        "available_at": len([p for p in prices if p.get("price_sell") and p.get("price_sell") > 0]),
    }
    
    # Trouver les meilleures locations
    if buy_prices:
        best_buy = min(prices, key=lambda p: p.get("price_buy", float('inf')) if p.get("price_buy") else float('inf'))
        stats["best_buy_location_code"] = best_buy.get("code")
    else:
        stats["best_buy_location_code"] = None
        
    if sell_prices:
        best_sell = max(prices, key=lambda p: p.get("price_sell", 0) if p.get("price_sell") else 0)
        stats["best_sell_location_code"] = best_sell.get("code")
    else:
        stats["best_sell_location_code"] = None
    
    return stats


def refresh_all_prices(db: Session, force: bool = False) -> Dict[str, int]:
    """
    Rafraîchit les prix de tous les matériaux depuis UEX.
    
    Args:
        db: Session de base de données
        force: Si True, ignore le cache et force le refresh
        
    Returns:
        Dictionnaire avec statistiques (updated, skipped, errors)
    """
    if not force and is_cache_valid(db):
        print("⏭️  Cache still valid, skipping refresh")
        return {"updated": 0, "skipped": 0, "errors": 0, "message": "Cache valid"}
    
    print("🔄 Starting full price refresh...")
    
    stats = {
        "updated": 0,
        "skipped": 0,
        "errors": 0,
        "created": 0,
    }
    
    try:
        # Récupérer toutes les commodities
        commodities = fetch_all_commodities_from_uex()
        
        for commodity in commodities:
            try:
                # Trouver ou créer le matériau
                material = map_uex_commodity_to_material(db, commodity)
                
                if not material:
                    # CRÉER le matériau s'il n'existe pas
                    uex_name = commodity.get('name', '').strip()
                    uex_id = commodity.get('id')
                    
                    if uex_name and uex_id:
                        material = Material(
                            uex_id=uex_id,
                            name=uex_name,
                            category=commodity.get('type', 'Commodity'),
                            is_trade_good=True
                        )
                        db.add(material)
                        db.flush()  # Pour avoir l'ID
                        stats["created"] += 1
                        print(f"✨ Created new material: {material.name}")
                    else:
                        stats["skipped"] += 1
                        continue
                
                # Utiliser les prix de la commodity directement
                # L'API UEX retourne déjà price_buy et price_sell moyens
                avg_buy = commodity.get("price_buy")
                avg_sell = commodity.get("price_sell")
                
                if not avg_sell and not avg_buy:
                    print(f"⚠️  No prices found for {material.name}")
                    stats["skipped"] += 1
                    continue
                
                # Créer les stats à partir des données de base
                price_stats = {
                    "avg_buy_price": avg_buy if avg_buy and avg_buy > 0 else None,
                    "avg_sell_price": avg_sell if avg_sell and avg_sell > 0 else None,
                    "min_buy_price": avg_buy if avg_buy and avg_buy > 0 else None,  # UEX ne fournit pas min/max
                    "max_sell_price": avg_sell if avg_sell and avg_sell > 0 else None,
                    "best_buy_location_code": None,  # Pas disponible dans l'endpoint /commodities
                    "best_sell_location_code": None,
                    "available_at": 0,  # Pas disponible dans l'endpoint /commodities
                }
                
                # Les best locations ne sont pas disponibles dans /commodities
                # Il faudrait fetch_commodity_prices() pour ça mais c'est trop lent
                best_buy_loc_id = None
                best_sell_loc_id = None
                
                # Créer ou mettre à jour le prix
                now = datetime.utcnow()
                
                market_price = db.query(MarketPrice).filter(
                    MarketPrice.material_id == material.id
                ).first()
                
                if market_price:
                    # Mise à jour
                    market_price.avg_buy_price = price_stats["avg_buy_price"]
                    market_price.avg_sell_price = price_stats["avg_sell_price"]
                    market_price.min_buy_price = price_stats["min_buy_price"]
                    market_price.max_sell_price = price_stats["max_sell_price"]
                    market_price.best_buy_location_id = best_buy_loc_id
                    market_price.best_sell_location_id = best_sell_loc_id
                    market_price.available_at = price_stats["available_at"]
                    market_price.last_updated = now
                else:
                    # Création
                    market_price = MarketPrice(
                        material_id=material.id,
                        avg_buy_price=price_stats["avg_buy_price"],
                        avg_sell_price=price_stats["avg_sell_price"],
                        min_buy_price=price_stats["min_buy_price"],
                        max_sell_price=price_stats["max_sell_price"],
                        best_buy_location_id=best_buy_loc_id,
                        best_sell_location_id=best_sell_loc_id,
                        available_at=price_stats["available_at"],
                        last_updated=now,
                    )
                    db.add(market_price)
                
                stats["updated"] += 1
                
                if price_stats["avg_sell_price"]:
                    print(f"✅ Updated {material.name}: avg sell {price_stats['avg_sell_price']:.2f} aUEC")
                
            except Exception as e:
                print(f"❌ Error processing commodity {commodity.get('name', 'Unknown')}: {e}")
                stats["errors"] += 1
                continue
        
        db.commit()
        print(f"🎉 Refresh complete! Updated: {stats['updated']}, Created: {stats['created']}, Skipped: {stats['skipped']}, Errors: {stats['errors']}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Fatal error during refresh: {e}")
        raise
    
    return stats


def refresh_single_material(
    db: Session,
    material_id: int,
    force: bool = False
) -> bool:
    """
    Rafraîchit le prix d'un seul matériau.
    
    Args:
        db: Session de base de données
        material_id: ID du matériau à rafraîchir
        force: Si True, ignore le cache
        
    Returns:
        True si mis à jour avec succès, False sinon
    """
    if not force and is_cache_valid(db, material_id):
        print(f"⏭️  Cache valid for material {material_id}")
        return False
    
    material = db.query(Material).filter(Material.id == material_id).first()
    
    if not material:
        raise ValueError(f"Material {material_id} not found")
    
    if not material.uex_id:
        raise ValueError(f"Material {material_id} has no UEX ID")
    
    print(f"🔄 Refreshing price for {material.name}...")
    
    try:
        # Récupérer les prix détaillés
        prices = fetch_commodity_prices(material.uex_id)
        
        if not prices:
            print(f"⚠️  No prices found for {material.name}")
            return False
        
        # Calculer les statistiques
        price_stats = calculate_price_statistics(prices)
        
        # Trouver les IDs des locations
        best_buy_loc_id = None
        best_sell_loc_id = None
        
        if price_stats["best_buy_location_code"]:
            best_buy_loc = db.query(Location).filter(
                Location.code == price_stats["best_buy_location_code"]
            ).first()
            if best_buy_loc:
                best_buy_loc_id = best_buy_loc.id
        
        if price_stats["best_sell_location_code"]:
            best_sell_loc = db.query(Location).filter(
                Location.code == price_stats["best_sell_location_code"]
            ).first()
            if best_sell_loc:
                best_sell_loc_id = best_sell_loc.id
        
        now = datetime.utcnow()
        
        market_price = db.query(MarketPrice).filter(
            MarketPrice.material_id == material.id
        ).first()
        
        if market_price:
            # Mise à jour
            market_price.avg_buy_price = price_stats["avg_buy_price"]
            market_price.avg_sell_price = price_stats["avg_sell_price"]
            market_price.min_buy_price = price_stats["min_buy_price"]
            market_price.max_sell_price = price_stats["max_sell_price"]
            market_price.best_buy_location_id = best_buy_loc_id
            market_price.best_sell_location_id = best_sell_loc_id
            market_price.available_at = price_stats["available_at"]
            market_price.last_updated = now
        else:
            # Création
            market_price = MarketPrice(
                material_id=material.id,
                avg_buy_price=price_stats["avg_buy_price"],
                avg_sell_price=price_stats["avg_sell_price"],
                min_buy_price=price_stats["min_buy_price"],
                max_sell_price=price_stats["max_sell_price"],
                best_buy_location_id=best_buy_loc_id,
                best_sell_location_id=best_sell_loc_id,
                available_at=price_stats["available_at"],
                last_updated=now,
            )
            db.add(market_price)
        
        db.commit()
        
        if price_stats["avg_sell_price"]:
            print(f"✅ Updated {material.name}: avg {price_stats['avg_sell_price']:.2f} aUEC")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error refreshing {material.name}: {e}")
        raise


def get_material_price_history(
    db: Session,
    material_id: int,
    days: int = 30
) -> List[PriceSnapshot]:
    """
    Récupère l'historique des prix d'un matériau.
    
    Args:
        db: Session de base de données
        material_id: ID du matériau
        days: Nombre de jours d'historique
        
    Returns:
        Liste des snapshots de prix historiques
    """
    since = datetime.utcnow() - timedelta(days=days)
    
    return (
        db.query(PriceSnapshot)
        .filter(
            PriceSnapshot.material_id == material_id,
            PriceSnapshot.snapshot_date >= since.date()
        )
        .order_by(PriceSnapshot.snapshot_date.desc())
        .all()
    )