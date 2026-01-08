"""
Script pour importer automatiquement tous les matériaux depuis UEX dans la DB.
À exécuter une fois pour remplir la table materials.

Usage:
    python scripts/import_materials_from_uex.py                 # Import réel
    python scripts/import_materials_from_uex.py --dry-run      # Test sans modification
"""
import sys
import os

# Ajouter le dossier parent au path pour les imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from sqlalchemy.orm import Session

from database import SessionLocal
from models.material import Material
from core.config import settings

UEX_API_BASE_URL = "https://api.uexcorp.space/2.0"

def get_headers():
    """Retourne les headers pour les requêtes UEX API."""
    headers = {
        "Accept": "application/json",
        "User-Agent": "ObsidianVenturesGroup/1.0",
    }
    if settings.UEX_API_KEY:
        headers["Authorization"] = f"Bearer {settings.UEX_API_KEY}"
    return headers


def fetch_all_commodities():
    """Récupère toutes les commodities depuis UEX."""
    url = f"{UEX_API_BASE_URL}/commodities"
    
    print("🌐 Fetching commodities from UEX...")
    response = requests.get(url, headers=get_headers(), timeout=30)
    
    if response.status_code != 200:
        raise RuntimeError(f"UEX API error: {response.status_code}")
    
    commodities = response.json().get("data", [])
    print(f"✅ Received {len(commodities)} commodities")
    
    return commodities


def categorize_commodity(commodity):
    """
    Détermine la catégorie et les flags d'un matériau.
    
    Returns:
        dict avec category, is_mineable, is_salvage, is_trade_good
    """
    name = commodity.get("name", "").lower()
    code = commodity.get("code", "").lower()
    kind = commodity.get("kind", "").lower()
    
    # Minerais bruts
    if "(ore)" in name or "(raw)" in name or "raw" in name:
        return {
            "category": "Ore",
            "is_mineable": True,
            "is_salvage": False,
            "is_trade_good": False,
        }
    
    # Minerais raffinés (gems et métaux)
    mineral_keywords = [
        "agricium", "aluminum", "beryl", "bexalite", "borase", "copper",
        "corundum", "diamond", "gold", "hadanite", "hephaestanite", "iron",
        "laranite", "quantanium", "quartz", "taranite", "titanium", "tungsten",
        "aphorite", "dolivine", "janalite", "bexalite", "laranite",
        "cobalt", "riccite", "silicon", "tin", "saldynium", "jaclium",
        "carinite", "lindinium", "torite", "savrilium"
    ]
    
    if any(kw in name for kw in mineral_keywords):
        return {
            "category": "Metal",
            "is_mineable": True,
            "is_salvage": False,
            "is_trade_good": True,
        }
    
    # Salvage
    salvage_keywords = [
        "scrap", "rmc", "recycled", "construction materials", "rubble",
        "pebbles", "salvage", "waste"
    ]
    
    if any(kw in name for kw in salvage_keywords):
        return {
            "category": "Salvage",
            "is_mineable": False,
            "is_salvage": True,
            "is_trade_good": True,
        }
    
    # Gaz
    gas_keywords = [
        "helium", "hydrogen", "neon", "argon", "nitrogen", "chlorine",
        "fluorine", "iodine", "ammonia", "methane", "krypton", "xenon",
        "anti-hydrogen"
    ]
    
    if any(kw in name for kw in gas_keywords) or "gas" in kind:
        return {
            "category": "Gas",
            "is_mineable": False,
            "is_salvage": False,
            "is_trade_good": True,
        }
    
    # Gemmes précieuses
    gem_keywords = ["diamond", "hadanite", "bexalite", "dolivine", "aphorite", "taranite"]
    if any(kw in name for kw in gem_keywords):
        return {
            "category": "Mineral",
            "is_mineable": True,
            "is_salvage": False,
            "is_trade_good": True,
        }
    
    # Drogues
    drug_keywords = [
        "widow", "slam", "maze", "e'tam", "neon", "altruciatoxin",
        "dopple", "freeze", "glow", "mala", "thrust", "zip"
    ]
    
    if any(kw in name for kw in drug_keywords):
        return {
            "category": "Commodity",
            "is_mineable": False,
            "is_salvage": False,
            "is_trade_good": True,
        }
    
    # Nourriture et agriculture
    food_keywords = [
        "food", "berries", "root", "egg", "medmon", "pitambu", "prota",
        "dung", "limes", "lunes"
    ]
    
    if any(kw in name for kw in food_keywords):
        return {
            "category": "Commodity",
            "is_mineable": False,
            "is_salvage": False,
            "is_trade_good": True,
        }
    
    # Médical
    medical_keywords = [
        "medical", "medstick", "stim", "plague"
    ]
    
    if any(kw in name for kw in medical_keywords):
        return {
            "category": "Commodity",
            "is_mineable": False,
            "is_salvage": False,
            "is_trade_good": True,
        }
    
    # Items événementiels
    if "envelope" in name or "luminalia" in name or "year of" in name:
        return {
            "category": "Commodity",
            "is_mineable": False,
            "is_salvage": False,
            "is_trade_good": True,
        }
    
    # Par défaut : commodity trade good
    return {
        "category": "Commodity",
        "is_mineable": False,
        "is_salvage": False,
        "is_trade_good": True,
    }


def import_materials(db: Session, dry_run: bool = False):
    """
    Importe tous les matériaux depuis UEX dans la DB.
    
    Args:
        db: Session database
        dry_run: Si True, affiche seulement ce qui serait importé sans modifier la DB
    """
    commodities = fetch_all_commodities()
    
    # Récupérer les matériaux existants
    existing_by_uex_id = {m.uex_id: m for m in db.query(Material).filter(Material.uex_id.isnot(None)).all()}
    existing_by_name = {m.name.lower(): m for m in db.query(Material).all()}
    
    print(f"📦 {len(existing_by_name)} matériaux déjà en DB")
    
    stats = {
        "added": 0,
        "skipped": 0,
        "updated": 0,
    }
    
    for commodity in commodities:
        uex_id = commodity.get("id")
        name = commodity.get("name", "").strip()
        
        if not name or not uex_id:
            continue
        
        name_lower = name.lower()
        
        # Vérifier si existe déjà par UEX ID
        if uex_id in existing_by_uex_id:
            stats["skipped"] += 1
            continue
        
        # Vérifier si existe déjà par nom
        if name_lower in existing_by_name:
            # Mettre à jour l'UEX ID si manquant
            existing_material = existing_by_name[name_lower]
            if not existing_material.uex_id:
                if not dry_run:
                    existing_material.uex_id = uex_id
                    stats["updated"] += 1
                    print(f"🔄 Updated UEX ID for: {name}")
                else:
                    print(f"  🔄 Would update UEX ID for: {name}")
                    stats["updated"] += 1
            else:
                stats["skipped"] += 1
            continue
        
        # Catégoriser
        props = categorize_commodity(commodity)
        
        if dry_run:
            print(f"  ➕ Would add: {name} ({props['category']}, UEX ID: {uex_id})")
            stats["added"] += 1
        else:
            # Créer le matériau
            material = Material(
                uex_id=uex_id,
                name=name,
                category=props["category"],
                unit="SCU",
                is_mineable=props["is_mineable"],
                is_salvage=props["is_salvage"],
                is_trade_good=props["is_trade_good"],
            )
            
            db.add(material)
            stats["added"] += 1
            print(f"✅ Added: {name} ({props['category']}, UEX ID: {uex_id})")
    
    if not dry_run:
        db.commit()
        print(f"\n🎉 Import complete!")
    else:
        print(f"\n📊 Dry run complete (no changes made)")
    
    print(f"   Added: {stats['added']}")
    print(f"   Updated: {stats['updated']}")
    print(f"   Skipped (already exists): {stats['skipped']}")


def main():
    """Point d'entrée du script."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Import materials from UEX")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be imported without making changes"
    )
    
    args = parser.parse_args()
    
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("UEX MATERIALS IMPORT - Obsidian Ventures Group")
        print("=" * 60)
        
        if args.dry_run:
            print("⚠️  DRY RUN MODE - No changes will be made")
            print()
        
        import_materials(db, dry_run=args.dry_run)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
