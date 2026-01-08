"""
Script pour capturer un snapshot des prix actuels dans l'historique.
À exécuter quotidiennement via cron job pour construire l'historique des courbes.

Usage:
    python scripts/capture_price_snapshot.py              # Capture tous les prix
    python scripts/capture_price_snapshot.py --dry-run    # Test sans enregistrement
    python scripts/capture_price_snapshot.py --stats      # Affiche les stats uniquement
    python scripts/capture_price_snapshot.py --clean 90   # Nettoie l'historique > 90 jours
"""
import sys
import os
from datetime import datetime, timedelta, date
from typing import Dict

# Ajouter le dossier parent au path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from sqlalchemy import func

from database import SessionLocal
from models.market import MarketPrice, PriceSnapshot
from models.material import Material


def capture_snapshot(db: Session, dry_run: bool = False) -> Dict[str, int]:
    """
    Capture un snapshot de tous les prix actuels dans l'historique.
    
    Args:
        db: Session SQLAlchemy
        dry_run: Si True, n'enregistre pas dans la DB
        
    Returns:
        Statistiques de capture
    """
    stats = {
        "captured": 0,
        "skipped": 0,
        "errors": 0,
    }
    
    # Récupérer tous les prix actuels
    current_prices = db.query(MarketPrice).all()
    
    print(f"📊 {len(current_prices)} prix actuels à capturer")
    
    # Date du snapshot (aujourd'hui)
    today = date.today()
    
    for price in current_prices:
        try:
            # Vérifier si on a déjà un snapshot pour aujourd'hui
            existing_snapshot = db.query(PriceSnapshot).filter(
                PriceSnapshot.material_id == price.material_id,
                PriceSnapshot.snapshot_date == today
            ).first()
            
            if existing_snapshot:
                # Mettre à jour le snapshot existant
                if not dry_run:
                    existing_snapshot.avg_buy_price = price.avg_buy_price
                    existing_snapshot.avg_sell_price = price.avg_sell_price
                stats["skipped"] += 1
                continue
            
            # Vérifier que nous avons des prix valides
            if not price.avg_sell_price and not price.avg_buy_price:
                stats["skipped"] += 1
                continue
            
            if dry_run:
                material = db.query(Material).filter(Material.id == price.material_id).first()
                material_name = material.name if material else f"ID {price.material_id}"
                print(f"  [DRY RUN] Would capture: {material_name}")
                stats["captured"] += 1
            else:
                # Créer un nouveau snapshot
                snapshot = PriceSnapshot(
                    material_id=price.material_id,
                    avg_buy_price=price.avg_buy_price,
                    avg_sell_price=price.avg_sell_price,
                    snapshot_date=today,
                )
                db.add(snapshot)
                stats["captured"] += 1
        
        except Exception as e:
            print(f"❌ Error capturing price for material {price.material_id}: {e}")
            stats["errors"] += 1
    
    if not dry_run:
        try:
            db.commit()
            print(f"\n✅ Snapshot capturé avec succès!")
        except Exception as e:
            db.rollback()
            print(f"\n❌ Échec du commit: {e}")
            raise
    else:
        print(f"\n📊 Mode dry-run: aucune modification")
    
    return stats


def get_stats(db: Session) -> Dict:
    """
    Récupère les statistiques de l'historique.
    
    Args:
        db: Session SQLAlchemy
        
    Returns:
        Statistiques d'historique
    """
    # Total d'entrées
    total_entries = db.query(func.count(PriceSnapshot.id)).scalar()
    
    # Nombre de matériaux avec historique
    materials_with_history = db.query(
        func.count(func.distinct(PriceSnapshot.material_id))
    ).scalar()
    
    # Date du premier snapshot
    first_snapshot = db.query(
        func.min(PriceSnapshot.snapshot_date)
    ).scalar()
    
    # Date du dernier snapshot
    last_snapshot = db.query(
        func.max(PriceSnapshot.snapshot_date)
    ).scalar()
    
    # Nombre de snapshots aujourd'hui
    today = date.today()
    today_snapshots = db.query(func.count(PriceSnapshot.id)).filter(
        PriceSnapshot.snapshot_date == today
    ).scalar()
    
    # Nombre de jours d'historique
    if first_snapshot and last_snapshot:
        history_days = (last_snapshot - first_snapshot).days + 1
    else:
        history_days = 0
    
    return {
        "total_entries": total_entries,
        "materials_with_history": materials_with_history,
        "first_snapshot": first_snapshot,
        "last_snapshot": last_snapshot,
        "today_snapshots": today_snapshots,
        "history_days": history_days,
    }


def clean_old_history(db: Session, days: int = 90, dry_run: bool = False) -> int:
    """
    Supprime l'historique ancien pour éviter la surcharge.
    
    Args:
        db: Session SQLAlchemy
        days: Nombre de jours à conserver
        dry_run: Si True, n'effectue pas la suppression
        
    Returns:
        Nombre d'entrées supprimées
    """
    cutoff_date = date.today() - timedelta(days=days)
    
    old_entries = db.query(PriceSnapshot).filter(
        PriceSnapshot.snapshot_date < cutoff_date
    )
    
    count = old_entries.count()
    
    if dry_run:
        print(f"📊 [DRY RUN] {count} entrées seraient supprimées (> {days} jours)")
    else:
        old_entries.delete()
        db.commit()
        print(f"🗑️  {count} entrées supprimées (> {days} jours)")
    
    return count


def print_stats(stats: Dict):
    """Affiche les statistiques de manière formatée."""
    print("\n" + "=" * 60)
    print("STATISTIQUES DE L'HISTORIQUE")
    print("=" * 60)
    print(f"📊 Total d'entrées:           {stats['total_entries']:,}")
    print(f"📦 Matériaux avec historique:   {stats['materials_with_history']}")
    print(f"📅 Premier snapshot:           {stats['first_snapshot']}")
    print(f"📅 Dernier snapshot:           {stats['last_snapshot']}")
    print(f"🕐 Snapshots aujourd'hui:      {stats['today_snapshots']}")
    print(f"📈 Jours d'historique:         {stats['history_days']}")
    print("=" * 60)


def main():
    """Point d'entrée principal du script."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Capture snapshots des prix pour l'historique"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Affiche ce qui serait fait sans modifier la DB"
    )
    parser.add_argument(
        "--stats",
        action="store_true",
        help="Affiche uniquement les statistiques"
    )
    parser.add_argument(
        "--clean",
        type=int,
        metavar="DAYS",
        help="Nettoie l'historique plus ancien que N jours"
    )
    
    args = parser.parse_args()
    
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("PRICE SNAPSHOT - Obsidian Ventures Group")
        print("=" * 60)
        
        if args.dry_run:
            print("⚠️  MODE DRY RUN - Aucune modification ne sera effectuée")
        
        print()
        
        # Stats uniquement
        if args.stats:
            stats = get_stats(db)
            print_stats(stats)
            return
        
        # Nettoyage
        if args.clean:
            clean_old_history(db, days=args.clean, dry_run=args.dry_run)
            return
        
        # Capture normale
        capture_stats = capture_snapshot(db, dry_run=args.dry_run)
        
        # Afficher les résultats
        print("\n" + "=" * 60)
        print("RÉSULTATS DE LA CAPTURE")
        print("=" * 60)
        print(f"✅ Capturés:  {capture_stats['captured']}")
        print(f"⏭️  Ignorés:   {capture_stats['skipped']}")
        print(f"❌ Erreurs:   {capture_stats['errors']}")
        print("=" * 60)
        
        # Stats globales
        if not args.dry_run and capture_stats['captured'] > 0:
            print()
            stats = get_stats(db)
            print_stats(stats)
        
    except Exception as e:
        print(f"\n❌ Erreur inattendue: {e}")
        db.rollback()
        raise
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
