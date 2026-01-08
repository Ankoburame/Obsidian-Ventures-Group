"""
Script pour rafraîchir tous les prix depuis l'API UEX.
À exécuter régulièrement (toutes les 12h recommandé) via cron job.

Usage:
    python scripts/refresh_prices.py              # Refresh avec cache
    python scripts/refresh_prices.py --force      # Refresh forcé (ignore cache)
    python scripts/refresh_prices.py --material 123  # Refresh un seul matériau
"""
import sys
import os

# Ajouter le dossier parent au path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from services.uex.uex_service import refresh_all_prices, refresh_single_material


def main():
    """Point d'entrée principal du script."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Refresh prices from UEX API"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force refresh even if cache is valid"
    )
    parser.add_argument(
        "--material",
        type=int,
        metavar="ID",
        help="Refresh only a specific material by ID"
    )
    
    args = parser.parse_args()
    
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("UEX PRICE REFRESH - Obsidian Ventures Group")
        print("=" * 60)
        
        if args.force:
            print("⚠️  FORCE MODE - Cache will be ignored")
        
        print()
        
        if args.material:
            # Refresh un seul matériau
            print(f"🔄 Refreshing material ID {args.material}...")
            success = refresh_single_material(db, args.material, force=args.force)
            if success:
                print("\n✅ Material price refreshed successfully!")
            else:
                print("\n⏭️  Material price was not refreshed (cache valid or no data)")
        else:
            # Refresh tous les matériaux
            stats = refresh_all_prices(db, force=args.force)
            
            print("\n" + "=" * 60)
            print("REFRESH RESULTS")
            print("=" * 60)
            print(f"✅ Updated:  {stats.get('updated', 0)}")
            print(f"✨ Created:  {stats.get('created', 0)}")
            print(f"⏭️  Skipped:  {stats.get('skipped', 0)}")
            print(f"❌ Errors:   {stats.get('errors', 0)}")
            print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        db.rollback()
        raise
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
