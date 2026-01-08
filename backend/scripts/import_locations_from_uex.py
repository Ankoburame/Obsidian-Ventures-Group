"""
Script pour importer automatiquement toutes les locations (stations, outposts, cities)
depuis l'API UEX dans la base de données.

Usage:
    python scripts/import_locations_from_uex.py                 # Import réel
    python scripts/import_locations_from_uex.py --dry-run      # Test sans modification
    python scripts/import_locations_from_uex.py --update       # Met à jour les locations existantes
"""
import sys
import os
from typing import Dict, List, Any

# Ajouter le dossier parent au path pour les imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import SessionLocal
from models.location import Location
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


def fetch_all_terminals() -> List[Dict[str, Any]]:
    """
    Récupère tous les terminaux de trading depuis UEX.
    
    Returns:
        Liste des terminaux avec leurs informations
        
    Raises:
        RuntimeError: Si l'API UEX retourne une erreur
    """
    url = f"{UEX_API_BASE_URL}/terminals"
    
    print("🌐 Fetching terminals from UEX API...")
    response = requests.get(url, headers=get_headers(), timeout=30)
    
    if response.status_code != 200:
        raise RuntimeError(
            f"UEX API error: {response.status_code} - {response.text}"
        )
    
    terminals = response.json().get("data", [])
    print(f"✅ Received {len(terminals)} terminals from UEX")
    
    return terminals


def normalize_location_type(terminal_type: str) -> str:
    """
    Normalise le type de terminal UEX en type de location standard.
    
    Args:
        terminal_type: Type depuis UEX (ex: "trading_terminal", "refinery")
        
    Returns:
        Type normalisé: Station, City, Outpost, Rest Stop, Mining Facility
    """
    type_mapping = {
        "space_station": "Station",
        "station": "Station",
        "rest_stop": "Rest Stop",
        "orbital": "Station",
        "city": "City",
        "landing_zone": "City",
        "outpost": "Outpost",
        "mining": "Mining Facility",
        "settlement": "Outpost",
    }
    
    terminal_type_lower = terminal_type.lower()
    
    for key, value in type_mapping.items():
        if key in terminal_type_lower:
            return value
    
    return "Outpost"  # Défaut


def extract_location_data(terminal: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extrait et transforme les données d'un terminal UEX en données de location.
    
    Args:
        terminal: Données brutes du terminal depuis UEX
        
    Returns:
        Dictionnaire avec les données formatées pour le modèle Location
    """
    name = terminal.get("name", "").strip()
    code = terminal.get("code", "").strip()
    
    # Extraire la hiérarchie (system > planet > moon/location)
    system = terminal.get("system", "Stanton")
    planet = terminal.get("planet", terminal.get("celestial_object", ""))
    location = terminal.get("moon", terminal.get("location", None))
    
    # Type de location
    terminal_type = terminal.get("type", "outpost")
    location_type = normalize_location_type(terminal_type)
    
    # Construire le full_path
    path_parts = [system]
    if planet:
        path_parts.append(planet)
    if location:
        path_parts.append(location)
    if name and name not in path_parts:
        path_parts.append(name)
    
    full_path = " > ".join(path_parts)
    
    return {
        "name": name,
        "code": code,
        "system": system,
        "planet": planet,
        "location": location,
        "location_type": location_type,
        "full_path": full_path,
        "distance_from_reference": None,  # À calculer plus tard si nécessaire
        "qt_time_minutes": None,  # À calculer plus tard si nécessaire
    }


def import_locations(db: Session, dry_run: bool = False, update_existing: bool = False):
    """
    Importe toutes les locations depuis UEX dans la base de données.
    
    Args:
        db: Session SQLAlchemy
        dry_run: Si True, affiche ce qui serait fait sans modifier la DB
        update_existing: Si True, met à jour les locations existantes
        
    Returns:
        Dict avec les statistiques d'import
    """
    terminals = fetch_all_terminals()
    
    # Récupérer les locations existantes
    existing_locations = {loc.code: loc for loc in db.query(Location).all()}
    print(f"📦 {len(existing_locations)} locations déjà en DB")
    
    stats = {
        "added": 0,
        "updated": 0,
        "skipped": 0,
        "errors": 0,
    }
    
    # Dictionnaires pour détecter les doublons dans le batch actuel
    seen_codes_in_batch = set(existing_locations.keys())
    seen_names_in_batch = {loc.name.lower() for loc in existing_locations.values()}
    
    for terminal in terminals:
        try:
            data = extract_location_data(terminal)
            
            # Validation des données
            if not data["name"] or not data["code"]:
                print(f"⚠️  Skipping terminal with missing name/code: {terminal}")
                stats["errors"] += 1
                continue
            
            code = data["code"]
            name = data["name"]
            name_lower = name.lower()
            
            # Vérifier les doublons de code
            if code in seen_codes_in_batch:
                print(f"⚠️  Duplicate code in batch, skipping: {name} ({code})")
                stats["skipped"] += 1
                continue
            
            # Vérifier les doublons de name
            if name_lower in seen_names_in_batch:
                print(f"⚠️  Duplicate name in batch, skipping: {name} ({code})")
                stats["skipped"] += 1
                continue
            
            # Vérifier si existe déjà
            if code in existing_locations:
                if update_existing:
                    if dry_run:
                        print(f"  🔄 Would update: {data['name']} ({code})")
                        stats["updated"] += 1
                    else:
                        # Mettre à jour la location existante
                        existing_loc = existing_locations[code]
                        for key, value in data.items():
                            if key != "code":  # Ne pas modifier le code
                                setattr(existing_loc, key, value)
                        
                        stats["updated"] += 1
                        print(f"🔄 Updated: {data['name']} ({code})")
                else:
                    stats["skipped"] += 1
                    continue
            else:
                # Ajouter nouvelle location
                if dry_run:
                    print(f"  ➕ Would add: {data['name']} ({code}) - {data['location_type']}")
                    stats["added"] += 1
                else:
                    location = Location(**data)
                    db.add(location)
                    seen_codes_in_batch.add(code)
                    seen_names_in_batch.add(name_lower)
                    stats["added"] += 1
                    print(f"✅ Added: {data['name']} ({code}) - {data['location_type']}")
        
        except IntegrityError as e:
            db.rollback()
            print(f"❌ IntegrityError for {terminal.get('name', 'Unknown')}: {e}")
            stats["errors"] += 1
            
        except Exception as e:
            print(f"❌ Error processing {terminal.get('name', 'Unknown')}: {e}")
            stats["errors"] += 1
    
    if not dry_run:
        try:
            db.commit()
            print(f"\n🎉 Import complete!")
        except Exception as e:
            db.rollback()
            print(f"\n❌ Commit failed: {e}")
            raise
    else:
        print(f"\n📊 Dry run complete (no changes made)")
    
    return stats


def print_stats(stats: Dict[str, int]):
    """Affiche les statistiques d'import de manière formatée."""
    print("\n" + "=" * 60)
    print("IMPORT STATISTICS")
    print("=" * 60)
    print(f"  ✅ Added:     {stats['added']}")
    print(f"  🔄 Updated:   {stats['updated']}")
    print(f"  ⏭️  Skipped:   {stats['skipped']}")
    print(f"  ❌ Errors:    {stats['errors']}")
    print(f"  📊 Total:     {sum(stats.values())}")
    print("=" * 60)


def main():
    """Point d'entrée principal du script."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Import trading locations from UEX API"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be imported without making changes"
    )
    parser.add_argument(
        "--update",
        action="store_true",
        help="Update existing locations with fresh data from UEX"
    )
    
    args = parser.parse_args()
    
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("UEX LOCATIONS IMPORT - Obsidian Ventures Group")
        print("=" * 60)
        
        if args.dry_run:
            print("⚠️  DRY RUN MODE - No changes will be made")
        
        if args.update:
            print("🔄 UPDATE MODE - Existing locations will be updated")
        
        print()
        
        stats = import_locations(
            db, 
            dry_run=args.dry_run, 
            update_existing=args.update
        )
        
        print_stats(stats)
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Network error: {e}")
        print("Please check your internet connection and UEX API token.")
        db.rollback()
        sys.exit(1)
        
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        db.rollback()
        raise
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
