# 🌐 Intégration UEX API - Obsidian Ventures Group

> **Récupération automatique des prix, matériaux et locations depuis l'API UEX Corp pour Star Citizen**

## 🎯 Objectif

Cette intégration permet à Obsidian Ventures Group de :
- ✅ **Importer automatiquement** tous les matériaux tradables depuis UEX
- ✅ **Importer automatiquement** toutes les locations de trading (stations, outposts, cities)
- ✅ **Récupérer les prix du marché** en temps réel pour chaque matériau
- ✅ **Construire un historique** des prix pour afficher des courbes du marché galactique
- ✅ **Identifier les meilleures locations** d'achat et de vente

## 📦 Contenu du package

| Fichier/Dossier | Description |
|-----------------|-------------|
| `uex/` | Service principal d'intégration UEX |
| `scripts/` | Scripts de maintenance et d'import |
| `migrations/` | Migration SQL pour la base de données |
| `market.py` | API REST endpoints mis à jour |
| `INSTALLATION.md` | **Guide d'installation complet** ⭐ |
| `UEX_INTEGRATION.md` | Documentation technique détaillée |

## 🚀 Démarrage rapide

### 1. Installation

Suis le guide complet dans **[INSTALLATION.md](./INSTALLATION.md)** qui contient :
- Instructions pas à pas
- Configuration des variables d'environnement
- Migration de la base de données
- Premiers imports de données
- Configuration des tâches automatiques

### 2. Test de l'intégration

```bash
cd backend
python scripts/test_uex_integration.py
```

### 3. Import initial des données

```bash
# Importer les matériaux
python scripts/import_materials_from_uex.py

# Importer les locations
python scripts/import_locations_from_uex.py

# Premier refresh des prix
python scripts/refresh_prices.py --force

# Première capture de snapshot
python scripts/capture_price_snapshot.py
```

## 🔄 Maintenance automatique

### Scripts disponibles

| Script | Fréquence recommandée | Description |
|--------|----------------------|-------------|
| `refresh_prices.py` | Toutes les 12h | Refresh des prix du marché |
| `capture_price_snapshot.py` | 1x par jour | Capture pour historique |
| `import_materials_from_uex.py` | 1x par mois | Mise à jour des matériaux |
| `import_locations_from_uex.py` | 1x par mois | Mise à jour des locations |

Configuration via **crontab** (voir INSTALLATION.md).

## 📊 Fonctionnalités

### 1. Prix du marché en temps réel

- Récupération automatique depuis UEX API
- Prix moyens, min et max d'achat/vente
- Identification des meilleures locations
- Cache intelligent (TTL 12h)

### 2. Historique des prix

- Capture quotidienne des prix
- Stockage dans `price_snapshots`
- Permet la construction de courbes d'évolution
- Nettoyage automatique des données anciennes

### 3. Base de données complète

- **~300-400 matériaux** : Ores, Metals, Minerals, Gas, Salvage, Commodities
- **~500-600 locations** : Stations, Cities, Outposts, Rest Stops
- **Métadonnées enrichies** : Catégories, flags (mineable, salvage, trade_good), UEX IDs

## 🔌 API Endpoints

### Nouveaux endpoints ajoutés

```http
# Liste des prix
GET /api/market/prices?category=Metal&limit=100

# Prix d'un matériau
GET /api/market/prices/{material_id}

# Historique des prix (courbe)
GET /api/market/prices/{material_id}/history?days=30

# Refresh manuel (admin)
POST /api/market/prices/refresh?force=true

# Statistiques
GET /api/market/prices/history/stats
```

Voir `market.py` pour les détails complets.

## 🗃️ Modèles de données

### Material (matériau)
- `uex_id` : ID depuis UEX API
- `name` : Nom du matériau
- `category` : Metal, Ore, Gas, Mineral, Salvage, Commodity
- `is_mineable`, `is_salvage`, `is_trade_good` : Flags

### MarketPrice (prix actuel)
- Prix moyens, min, max d'achat/vente
- Meilleures locations d'achat/vente
- Nombre de locations disponibles
- Dernière mise à jour

### PriceSnapshot (historique)
- Prix moyens quotidiens
- Date du snapshot
- Un snapshot par jour et par matériau

### Location (lieu)
- Code et nom
- Hiérarchie (System > Planet > Location)
- Type (Station, City, Outpost, etc.)
- Full path pour affichage

## 🏗️ Architecture

```
┌─────────────┐
│   UEX API   │
└──────┬──────┘
       │ Appels HTTP
       ▼
┌─────────────────┐
│  uex_service.py │ ← Service principal
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│   PostgreSQL (DB)    │
│  - materials         │
│  - locations         │
│  - market_prices     │
│  - price_snapshots   │
└──────────────────────┘
         │
         ▼
┌──────────────────┐
│   FastAPI (API)  │ ← Endpoints REST
└──────────────────┘
         │
         ▼
┌──────────────────┐
│  Next.js (UI)    │ ← Frontend
└──────────────────┘
```

## ⚙️ Configuration

### Variables d'environnement

```env
# .env
UEX_API_KEY=your_key_here        # Optionnel mais recommandé
UEX_API_URL=https://uexcorp.space/api/2.0/commodities
DATABASE_URL=postgresql://...     # Ta DB Railway
```

### Cache

- **TTL par défaut** : 12 heures
- **Ignore cache** : Utilise `--force` dans les scripts ou `force=true` dans l'API
- **Vérification automatique** : Vérifie le cache avant chaque refresh

## 📈 Métriques et monitoring

### Test de santé
```bash
python scripts/test_uex_integration.py
```

### Statistiques d'historique
```bash
python scripts/capture_price_snapshot.py --stats
```

### Logs recommandés
- `/var/log/uex_refresh.log` : Logs des refresh de prix
- `/var/log/uex_snapshot.log` : Logs des captures de snapshots
- `/var/log/uex_cleanup.log` : Logs du nettoyage

## 🐛 Troubleshooting rapide

| Problème | Solution |
|----------|----------|
| Erreur 401 UEX API | Vérifie `UEX_API_KEY` dans `.env` |
| Migration SQL échoue | Vérifie que PostgreSQL >= 12 |
| Aucun prix récupéré | Lance `refresh_prices.py --force` |
| Historique vide | Lance `capture_price_snapshot.py` |

Voir [INSTALLATION.md](./INSTALLATION.md) pour plus de détails.

## 📚 Documentation

- **[INSTALLATION.md](./INSTALLATION.md)** : Guide d'installation complet ⭐
- **[UEX_INTEGRATION.md](./UEX_INTEGRATION.md)** : Documentation technique détaillée
- **API UEX** : https://uexcorp.space/api

## ✅ Checklist de validation

Avant de considérer l'intégration comme terminée :

- [ ] Migration SQL exécutée sans erreur
- [ ] Variables d'environnement configurées
- [ ] Test d'intégration passé (5/5 tests)
- [ ] Matériaux importés (~300+)
- [ ] Locations importées (~500+)
- [ ] Prix rafraîchis au moins une fois
- [ ] Premier snapshot capturé
- [ ] Cron jobs configurés (refresh + snapshot)
- [ ] Endpoints API testés et fonctionnels
- [ ] Frontend connecté aux nouveaux endpoints

## 🎯 Roadmap

- [x] Import automatique des matériaux
- [x] Import automatique des locations
- [x] Refresh automatique des prix
- [x] Historique des prix (snapshots)
- [x] Endpoints API REST
- [ ] Webhook pour notifications de changements de prix
- [ ] Alertes sur les meilleurs deals
- [ ] Prédiction des tendances de prix (ML)
- [ ] Intégration avec Discord bot

## 🤝 Contribution

Cette intégration a été créée pour Obsidian Ventures Group.
Pour toute amélioration ou bug report, contacte **Xavier / Ankoburame**.

## 📄 Licence

Propriétaire - Obsidian Ventures Group

---

**Status** : ✅ Prêt pour la production  
**Version** : 1.0.0  
**Dernière mise à jour** : Janvier 2026

🚀 **Ready to launch!**
