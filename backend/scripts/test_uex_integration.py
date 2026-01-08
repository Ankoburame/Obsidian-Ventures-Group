"""
Script de test pour l'intégration UEX API.
Vérifie que tout fonctionne correctement.

Usage:
    python scripts/test_uex_integration.py
"""
import sys
import os

# CORRECTIF : Ajouter le dossier backend au path Python
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from database import SessionLocal
from services.uex.uex_service import (
    fetch_all_commodities_from_uex,
    fetch_commodity_prices,
    is_cache_valid,
)
from models.material import Material
from models.market import MarketPrice, PriceSnapshot
from models.location import Location


def test_api_connection():
    """Test de la connexion à l'API UEX."""
    print("\n" + "=" * 60)
    print("TEST 1: Connexion à l'API UEX")
    print("=" * 60)
    
    try:
        commodities = fetch_all_commodities_from_uex()
        print(f"✅ API UEX accessible")
        print(f"   Commodities disponibles: {len(commodities)}")
        
        if commodities:
            sample = commodities[0]
            print(f"   Exemple: {sample.get('name')} (ID: {sample.get('id')})")
        
        return True
    except Exception as e:
        print(f"❌ Erreur de connexion à l'API UEX: {e}")
        return False


def test_commodity_prices():
    """Test de récupération des prix détaillés."""
    print("\n" + "=" * 60)
    print("TEST 2: Récupération des prix détaillés")
    print("=" * 60)
    
    try:
        # Essayer avec Quantanium (généralement ID 148 ou similaire)
        # On récupère les commodities pour trouver Quantanium
        commodities = fetch_all_commodities_from_uex()
        quantanium = next((c for c in commodities if 'quantanium' in c.get('name', '').lower()), None)
        
        if not quantanium:
            print("⚠️  Quantanium non trouvé, utilisation de la première commodity")
            quantanium = commodities[0]
        
        commodity_id = quantanium.get('id')
        commodity_name = quantanium.get('name')
        
        print(f"   Testing avec: {commodity_name} (ID: {commodity_id})")
        
        prices = fetch_commodity_prices(commodity_id)
        print(f"✅ Prix détaillés récupérés")
        print(f"   Locations avec prix: {len(prices)}")
        
        if prices:
            sample = prices[0]
            print(f"   Exemple: {sample.get('name', 'Unknown')}")
            print(f"   - Buy: {sample.get('price_buy', 'N/A')} aUEC")
            print(f"   - Sell: {sample.get('price_sell', 'N/A')} aUEC")
        
        return True
    except Exception as e:
        print(f"❌ Erreur lors de la récupération des prix: {e}")
        return False


def test_database_structure():
    """Test de la structure de la base de données."""
    print("\n" + "=" * 60)
    print("TEST 3: Structure de la base de données")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Test materials
        materials_count = db.query(Material).count()
        materials_with_uex_id = db.query(Material).filter(Material.uex_id.isnot(None)).count()
        print(f"✅ Table materials:")
        print(f"   Total: {materials_count}")
        print(f"   Avec UEX ID: {materials_with_uex_id}")
        
        # Test locations
        locations_count = db.query(Location).count()
        print(f"✅ Table locations:")
        print(f"   Total: {locations_count}")
        
        # Test market_prices
        prices_count = db.query(MarketPrice).count()
        print(f"✅ Table market_prices:")
        print(f"   Total: {prices_count}")
        
        # Test price_snapshots
        snapshots_count = db.query(PriceSnapshot).count()
        print(f"✅ Table price_snapshots:")
        print(f"   Total: {snapshots_count}")
        
        return True
    except Exception as e:
        print(f"❌ Erreur lors du test de la base de données: {e}")
        return False
    finally:
        db.close()


def test_cache_system():
    """Test du système de cache."""
    print("\n" + "=" * 60)
    print("TEST 4: Système de cache")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Test cache global
        cache_valid = is_cache_valid(db)
        print(f"✅ Cache global: {'Valide' if cache_valid else 'Invalide ou vide'}")
        
        # Test cache pour un matériau spécifique
        first_material = db.query(Material).filter(Material.uex_id.isnot(None)).first()
        if first_material:
            material_cache_valid = is_cache_valid(db, first_material.id)
            print(f"✅ Cache pour {first_material.name}: {'Valide' if material_cache_valid else 'Invalide ou vide'}")
        else:
            print("⚠️  Aucun matériau avec UEX ID pour tester le cache spécifique")
        
        return True
    except Exception as e:
        print(f"❌ Erreur lors du test du cache: {e}")
        return False
    finally:
        db.close()


def test_sample_price_refresh():
    """Test d'un refresh de prix sur un échantillon."""
    print("\n" + "=" * 60)
    print("TEST 5: Refresh de prix (échantillon)")
    print("=" * 60)
    print("⚠️  Ce test va réellement rafraîchir les prix dans la DB")
    print("   Voulez-vous continuer? (o/n): ", end="")
    
    response = input().strip().lower()
    if response != 'o':
        print("⏭️  Test ignoré")
        return None
    
    db = SessionLocal()
    
    try:
        from services.uex.uex_service import refresh_all_prices
        
        # Refresh avec force pour tester
        print("   Lancement du refresh...")
        stats = refresh_all_prices(db, force=True)
        
        print(f"✅ Refresh terminé:")
        print(f"   Updated: {stats.get('updated', 0)}")
        print(f"   Created: {stats.get('created', 0)}")
        print(f"   Skipped: {stats.get('skipped', 0)}")
        print(f"   Errors: {stats.get('errors', 0)}")
        
        return True
    except Exception as e:
        print(f"❌ Erreur lors du refresh: {e}")
        return False
    finally:
        db.close()


def main():
    """Point d'entrée principal."""
    print("=" * 60)
    print("TEST D'INTÉGRATION UEX - Obsidian Ventures Group")
    print("=" * 60)
    
    results = []
    
    # Test 1: Connexion API
    results.append(("Connexion API", test_api_connection()))
    
    # Test 2: Prix détaillés
    results.append(("Prix détaillés", test_commodity_prices()))
    
    # Test 3: Structure DB
    results.append(("Structure DB", test_database_structure()))
    
    # Test 4: Cache
    results.append(("Système de cache", test_cache_system()))
    
    # Test 5: Refresh (optionnel)
    refresh_result = test_sample_price_refresh()
    if refresh_result is not None:
        results.append(("Refresh de prix", refresh_result))
    
    # Résumé
    print("\n" + "=" * 60)
    print("RÉSUMÉ DES TESTS")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print("\n" + "=" * 60)
    print(f"Résultat final: {passed}/{total} tests réussis")
    
    if passed == total:
        print("🎉 Tous les tests sont passés!")
        print("\nProchaines étapes:")
        print("1. python scripts\\import_materials_from_uex.py")
        print("2. python scripts\\import_locations_from_uex.py")
        print("3. python scripts\\refresh_prices.py --force")
        print("4. python scripts\\capture_price_snapshot.py")
    else:
        print("⚠️  Certains tests ont échoué. Vérifiez la configuration.")
    
    print("=" * 60)


if __name__ == "__main__":
    main()