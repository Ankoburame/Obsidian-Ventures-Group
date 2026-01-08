# UEX API Integration - Obsidian Ventures Group

## Vue d'ensemble

Cette intégration connecte l'application Obsidian Ventures Group à l'API UEX Corp pour récupérer automatiquement :
- Les matériaux/commodities tradables
- Les locations de trading (stations, outposts, cities)
- Les prix de marché en temps réel
- L'historique des prix pour les courbes du marché galactique

## Configuration

### Variables d'environnement

Ajoutez à votre fichier `.env` :

```env
UEX_API_KEY=your_uex_api_key_here
UEX_API_URL=https://uexcorp.space/api/2.0/commodities
```

> **Note**: L'API key est optionnelle mais recommandée pour éviter les limitations de rate limiting.

## Structure des fichiers

```
backend/
├── services/
│   └── uex/
│       ├── __init__.py
│       └── uex_service.py          # Service principal pour les appels UEX API
└── scripts/
    ├── import_materials_from_uex.py    # Import initial des matériaux
    ├── import_locations_from_uex.py    # Import initial des locations
    ├── refresh_prices.py               # Refresh régulier des prix
    └── capture_price_snapshot.py       # Capture quotidienne pour historique
```

## Scripts d'import et de maintenance

### 1. Import initial des matériaux

Récupère tous les matériaux/commodities depuis UEX et les ajoute à la base de données.

```bash
# Test (dry-run)
python backend/scripts/import_materials_from_uex.py --dry-run

# Import réel
python backend/scripts/import_materials_from_uex.py
```

**Résultat** :
- Crée les matériaux dans la table `materials`
- Assigne automatiquement les catégories (Metal, Ore, Gas, Mineral, Salvage, Commodity)
- Définit les flags `is_mineable`, `is_salvage`, `is_trade_good`
- Stocke l'`uex_id` pour le mapping futur

### 2. Import initial des locations

Récupère toutes les stations de trading depuis UEX.

```bash
# Test (dry-run)
python backend/scripts/import_locations_from_uex.py --dry-run

# Import réel
python backend/scripts/import_locations_from_uex.py

# Mise à jour des locations existantes
python backend/scripts/import_locations_from_uex.py --update
```

**Résultat** :
- Crée les locations dans la table `locations`
- Normalise les types (Station, City, Outpost, Rest Stop, Mining Facility)
- Construit le `full_path` hiérarchique (System > Planet > Location > Name)

### 3. Refresh des prix de marché

Récupère les prix actuels depuis UEX et met à jour la table `market_prices`.

```bash
# Refresh avec cache (skip si < 12h)
python backend/scripts/refresh_prices.py

# Refresh forcé (ignore le cache)
python backend/scripts/refresh_prices.py --force

# Refresh un seul matériau
python backend/scripts/refresh_prices.py --material 123
```

**Résultat** :
- Met à jour `avg_buy_price`, `avg_sell_price`, `min_buy_price`, `max_sell_price`
- Identifie les meilleures locations d'achat/vente
- Compte le nombre de locations où le matériau est disponible
- Crée automatiquement les matériaux manquants

**Recommandation** : Exécuter toutes les 12h via cron job.

### 4. Capture des snapshots de prix

Capture un instantané quotidien des prix pour construire l'historique des courbes.

```bash
# Capture du jour
python backend/scripts/capture_price_snapshot.py

# Test (dry-run)
python backend/scripts/capture_price_snapshot.py --dry-run

# Voir les statistiques
python backend/scripts/capture_price_snapshot.py --stats

# Nettoyer l'historique > 90 jours
python backend/scripts/capture_price_snapshot.py --clean 90
```

**Résultat** :
- Crée un snapshot dans `price_snapshots` pour chaque matériau
- Un seul snapshot par jour et par matériau
- Permet de construire des courbes d'évolution des prix

**Recommandation** : Exécuter 1x par jour via cron job.

## Endpoints API

### Liste des prix

```http
GET /api/market/prices?category=Metal&limit=100
```

### Prix d'un matériau spécifique

```http
GET /api/market/prices/{material_id}
```

### Historique des prix (courbe)

```http
GET /api/market/prices/{material_id}/history?days=30
```

Retourne les snapshots quotidiens pour les `days` derniers jours.

### Refresh manuel des prix

```http
POST /api/market/prices/refresh?force=true
```

Déclenche un refresh manuel des prix (utile pour les admins).

### Refresh d'un matériau spécifique

```http
POST /api/market/prices/refresh/{material_id}?force=true
```

### Statistiques de l'historique

```http
GET /api/market/prices/history/stats
```

Retourne :
- Nombre total de snapshots
- Nombre de matériaux avec historique
- Date du premier et dernier snapshot
- Nombre de jours d'historique

## Service UEX

### Fonctions principales

#### `fetch_all_commodities_from_uex()`
Récupère toutes les commodities depuis UEX API.

#### `fetch_commodity_prices(commodity_id)`
Récupère les prix détaillés d'une commodity pour toutes les locations.

#### `refresh_all_prices(db, force=False)`
Rafraîchit tous les prix. Retourne des statistiques (updated, created, skipped, errors).

#### `refresh_single_material(db, material_id, force=False)`
Rafraîchit le prix d'un seul matériau.

#### `get_material_price_history(db, material_id, days=30)`
Récupère l'historique des snapshots pour un matériau.

#### `calculate_price_statistics(prices)`
Calcule les statistiques (avg, min, max) à partir d'une liste de prix UEX.

## Modèles de données

### Material
```python
id: int
uex_id: int                 # ID depuis UEX API
name: str
category: str               # Metal, Ore, Gas, Mineral, Salvage, Commodity
is_mineable: bool
is_salvage: bool
is_trade_good: bool
```

### MarketPrice
```python
id: int
material_id: int
avg_buy_price: Decimal
avg_sell_price: Decimal
min_buy_price: Decimal
max_sell_price: Decimal
best_buy_location_id: int
best_sell_location_id: int
available_at: int           # Nombre de locations
last_updated: datetime
```

### PriceSnapshot
```python
id: int
material_id: int
avg_buy_price: Decimal
avg_sell_price: Decimal
snapshot_date: date          # Un seul snapshot par jour
```

### Location
```python
id: int
code: str                   # Code UEX unique
name: str
system: str
planet: str
location: str
location_type: str          # Station, City, Outpost, Rest Stop, Mining Facility
full_path: str              # Stanton > Crusader > Port Olisar
```

## Configuration des cron jobs (recommandé)

### Option 1 : Crontab Unix

```bash
# Refresh des prix toutes les 12h (6h et 18h)
0 6,18 * * * cd /path/to/project && python backend/scripts/refresh_prices.py

# Capture des snapshots quotidiens à 1h du matin
0 1 * * * cd /path/to/project && python backend/scripts/capture_price_snapshot.py

# Nettoyage mensuel de l'historique > 90 jours (1er du mois à 2h)
0 2 1 * * cd /path/to/project && python backend/scripts/capture_price_snapshot.py --clean 90
```

### Option 2 : Task scheduler Windows

Créez des tâches planifiées avec les mêmes fréquences.

## Gestion du cache

Le service UEX implémente un système de cache intelligent :
- **TTL par défaut** : 12 heures
- **Vérification** : Avant chaque refresh, vérifie si le dernier update est < 12h
- **Force** : L'option `--force` ou `force=True` ignore le cache

## Troubleshooting

### Erreur : "UEX API error: HTTP 401"
➡️ Vérifiez que votre `UEX_API_KEY` est valide dans le `.env`

### Erreur : "Material {id} has no UEX ID"
➡️ Le matériau n'a pas été importé depuis UEX. Relancez `import_materials_from_uex.py`

### Pas de prix pour certains matériaux
➡️ Normal, UEX ne fournit pas de prix pour tous les matériaux (ex: items événementiels)

### L'historique est vide
➡️ Attendez la première exécution du script `capture_price_snapshot.py` (1x par jour)

## Performance

- Import initial des matériaux : ~30 secondes (300+ items)
- Import initial des locations : ~45 secondes (500+ locations)
- Refresh des prix : ~2-5 minutes (appels API individuels par commodity)
- Capture de snapshot : ~5 secondes

## Roadmap

- [x] Import automatique des matériaux
- [x] Import automatique des locations
- [x] Refresh automatique des prix
- [x] Historique des prix (snapshots)
- [x] Endpoints API REST
- [ ] Webhook pour notifications de changements de prix
- [ ] Alertes sur les meilleurs deals
- [ ] Prédiction des tendances de prix (ML)

## Support

Pour toute question ou problème avec l'intégration UEX :
1. Vérifiez les logs des scripts
2. Testez avec `--dry-run` d'abord
3. Consultez la documentation UEX API : https://uexcorp.space/api

---

*Intégration créée pour Obsidian Ventures Group - Star Citizen Operations Management*
