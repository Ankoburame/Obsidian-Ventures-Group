# Intégration API UEX

Cette intégration permet d'importer et de mettre à jour automatiquement les données de marché depuis l'API UEX (materials, locations, prix et historique).

## Configuration

Ajouter dans votre `.env` :

```env
UEX_API_TOKEN=votre_token_uex_ici
UEX_API_URL=https://api.uexcorp.space/2.0
```

## Scripts d'import

### 1. Import des matériaux

Importe tous les matériaux disponibles depuis UEX dans la table `materials`.

```bash
# Test (dry-run)
python -m scripts.import_materials_from_uex --dry-run

# Import réel
python -m scripts.import_materials_from_uex
```

Catégories automatiquement détectées :
- `mineral` : Minerais bruts et raffinés
- `salvage` : Matériaux de récupération
- `trade` : Marchandises diverses (gaz, nourriture, drogues, etc.)

### 2. Import des locations

Importe toutes les stations et locations de trading depuis UEX dans la table `locations`.

```bash
# Test (dry-run)
python -m scripts.import_locations_from_uex --dry-run

# Import réel
python -m scripts.import_locations_from_uex

# Mettre à jour les locations existantes
python -m scripts.import_locations_from_uex --update
```

### 3. Capture des snapshots de prix (Nouveau!)

Capture un snapshot quotidien des prix pour l'historique. **À exécuter quotidiennement via cron job.**

```bash
# Test (dry-run)
python -m scripts.capture_price_snapshot --dry-run

# Capture réelle
python -m scripts.capture_price_snapshot

# Afficher les statistiques
python -m scripts.capture_price_snapshot --stats

# Nettoyer les snapshots anciens (> 90 jours)
python -m scripts.capture_price_snapshot --clean 90
```

## Routes API

### Refresh tous les prix

```
POST /api/market/prices/refresh?force=false
```

Rafraîchit tous les prix depuis UEX. Le cache est valide pendant 12 heures.

**Paramètres :**
- `force` (query, optional) : Si `true`, force le refresh même si le cache est valide

**Réponse :**
```json
{
  "success": true,
  "stats": {
    "updated": 150,
    "skipped": 5,
    "errors": 0
  }
}
```

### Refresh un prix spécifique

```
POST /api/market/prices/refresh/{material_id}?force=false
```

Rafraîchit le prix d'un seul matériau.

**Réponse :**
```json
{
  "success": true,
  "material_id": 42,
  "price": {
    "avg_buy_price": 125.50,
    "avg_sell_price": 150.00,
    "last_updated": "2025-01-08T18:30:00"
  }
}
```

### Historique des prix (Nouveau!)

```
GET /api/market/prices/{material_id}/history?days=30
```

Récupère l'historique des prix d'un matériau pour afficher des graphiques.

**Paramètres :**
- `days` (query, optional) : Nombre de jours d'historique (1-365, défaut: 30)

**Réponse :**
```json
{
  "material_id": 42,
  "material_name": "Quantanium",
  "days": 30,
  "history": [
    {
      "date": "2025-01-01",
      "avg_buy_price": 88.50,
      "avg_sell_price": 90.00
    },
    {
      "date": "2025-01-02",
      "avg_buy_price": 89.00,
      "avg_sell_price": 91.50
    }
  ]
}
```

### Capturer un snapshot manuel (Nouveau!)

```
POST /api/market/snapshots/capture
```

Capture un snapshot quotidien de tous les prix actuels. Normalement appelé par un cron job.

**Réponse :**
```json
{
  "success": true,
  "stats": {
    "captured": 150,
    "skipped": 0,
    "errors": 0
  },
  "message": "Captured 150 price snapshots"
}
```

## Service UEX

Le service est disponible dans `services/uex_service.py` et fournit :

- `fetch_all_commodities_from_uex()` : Récupère toutes les commodities UEX
- `refresh_all_prices(db, force=False)` : Rafraîchit tous les prix
- `refresh_single_material(db, material_id, force=False)` : Rafraîchit un prix
- `is_cache_valid(db, material_id=None)` : Vérifie la validité du cache
- `get_material_price_history(db, material_id, days=30)` : Récupère l'historique (Nouveau!)
- `capture_price_snapshot(db)` : Capture un snapshot quotidien (Nouveau!)

## Workflow recommandé

1. **Setup initial** :
   ```bash
   # 1. Importer les matériaux
   python -m scripts.import_materials_from_uex
   
   # 2. Importer les locations
   python -m scripts.import_locations_from_uex
   
   # 3. Refresh les prix
   curl -X POST http://localhost:8000/api/market/prices/refresh
   
   # 4. Capturer le premier snapshot
   python -m scripts.capture_price_snapshot
   ```

2. **Maintenance quotidienne (via cron)** :
   ```bash
   # Cron job quotidien pour capturer les snapshots
   0 2 * * * cd /path/to/backend && python -m scripts.capture_price_snapshot
   
   # Cron job pour refresh des prix (optionnel, fait automatiquement via l'API)
   0 3 * * * curl -X POST http://localhost:8000/api/market/prices/refresh?force=true
   ```

3. **Nettoyage périodique (optionnel)** :
   ```bash
   # Nettoyer les snapshots > 90 jours tous les mois
   0 4 1 * * cd /path/to/backend && python -m scripts.capture_price_snapshot --clean 90
   ```

## Notes

- Les prix sont stockés dans la table `market_prices`
- Les snapshots historiques sont dans la table `price_snapshots`
- Le cache des prix est valide pendant 12 heures
- Les nouveaux matériaux sont automatiquement créés lors du refresh des prix
- Les doublons sont automatiquement détectés et ignorés lors de l'import
- Les snapshots permettent de générer des graphiques d'évolution des prix
- Un snapshot par matériau par jour maximum (évite les doublons)
