# 🚀 Guide d'Installation - Intégration UEX pour Obsidian Ventures Group

## 📦 Fichiers livrés

```
uex_integration/
├── uex/                                    # Service UEX
│   ├── __init__.py
│   └── uex_service.py                     # Service principal d'intégration UEX
├── scripts/                                # Scripts de maintenance
│   ├── import_materials_from_uex.py       # Import initial des matériaux
│   ├── import_locations_from_uex.py       # Import initial des locations
│   ├── refresh_prices.py                  # Refresh régulier des prix
│   ├── capture_price_snapshot.py          # Capture quotidienne pour historique
│   └── test_uex_integration.py            # Script de test complet
├── migrations/
│   └── uex_integration.sql                # Migration SQL pour la DB
├── market.py                               # API endpoints mis à jour
└── UEX_INTEGRATION.md                      # Documentation complète
```

## 🔧 Installation

### Étape 1 : Copier les fichiers

```bash
# Depuis la racine de ton projet Obsidian-Ventures-Group

# Copier le service UEX
cp -r uex_integration/uex backend/services/

# Copier les scripts
cp uex_integration/scripts/*.py backend/scripts/

# Remplacer l'API market
cp uex_integration/market.py backend/api/market.py

# Copier la migration SQL (optionnel si tu veux l'exécuter manuellement)
mkdir -p backend/migrations
cp uex_integration/migrations/uex_integration.sql backend/migrations/
```

### Étape 2 : Configurer l'environnement

Ajoute à ton fichier `.env` :

```env
# UEX API Configuration
UEX_API_KEY=ton_token_uex_ici  # Optionnel mais recommandé
UEX_API_URL=https://uexcorp.space/api/2.0/commodities
```

> **Note**: Tu peux obtenir une clé API UEX sur https://uexcorp.space (gratuit)

### Étape 3 : Exécuter la migration SQL

**Option A : Directement dans PostgreSQL**
```bash
psql -d your_database_name -f backend/migrations/uex_integration.sql
```

**Option B : Via Railway CLI**
```bash
railway run psql < backend/migrations/uex_integration.sql
```

**Option C : Avec Python/SQLAlchemy**
Les modèles Material, MarketPrice et PriceSnapshot sont déjà définis. 
Lance simplement :
```bash
cd backend
python -c "from database import Base, engine; Base.metadata.create_all(engine)"
```

### Étape 4 : Tester l'intégration

```bash
cd backend
python scripts/test_uex_integration.py
```

Ce script va :
- ✅ Tester la connexion à l'API UEX
- ✅ Vérifier la structure de la DB
- ✅ Tester le système de cache
- ✅ (Optionnel) Faire un refresh de test

### Étape 5 : Import initial des données

**5.1 - Importer les matériaux**
```bash
# Test d'abord (dry-run)
python scripts/import_materials_from_uex.py --dry-run

# Import réel
python scripts/import_materials_from_uex.py
```

Résultat attendu : ~300-400 matériaux importés

**5.2 - Importer les locations**
```bash
# Test d'abord (dry-run)
python scripts/import_locations_from_uex.py --dry-run

# Import réel
python scripts/import_locations_from_uex.py
```

Résultat attendu : ~500-600 locations importées

**5.3 - Premier refresh des prix**
```bash
python scripts/refresh_prices.py --force
```

⏱️ Cela peut prendre 3-5 minutes (appels API pour chaque commodity)

**5.4 - Première capture de snapshot**
```bash
python scripts/capture_price_snapshot.py
```

## 🔄 Configuration des tâches automatiques

### Option 1 : Crontab (Linux/Mac)

Édite ta crontab :
```bash
crontab -e
```

Ajoute ces lignes :
```cron
# Refresh des prix toutes les 12h (6h et 18h UTC)
0 6,18 * * * cd /path/to/Obsidian-Ventures-Group/backend && python scripts/refresh_prices.py >> /var/log/uex_refresh.log 2>&1

# Capture des snapshots quotidiens à 1h UTC
0 1 * * * cd /path/to/Obsidian-Ventures-Group/backend && python scripts/capture_price_snapshot.py >> /var/log/uex_snapshot.log 2>&1

# Nettoyage mensuel de l'historique > 90 jours (1er du mois à 2h)
0 2 1 * * cd /path/to/Obsidian-Ventures-Group/backend && python scripts/capture_price_snapshot.py --clean 90 >> /var/log/uex_cleanup.log 2>&1
```

### Option 2 : GitHub Actions (si hébergé sur GitHub)

Crée `.github/workflows/uex_sync.yml` :
```yaml
name: UEX Price Sync

on:
  schedule:
    - cron: '0 6,18 * * *'  # Toutes les 12h
  workflow_dispatch:  # Permet de déclencher manuellement

jobs:
  sync-prices:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Refresh UEX prices
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          UEX_API_KEY: ${{ secrets.UEX_API_KEY }}
        run: |
          cd backend
          python scripts/refresh_prices.py
      
      - name: Capture price snapshot
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          cd backend
          python scripts/capture_price_snapshot.py
```

### Option 3 : Railway (si hébergé sur Railway)

Railway ne supporte pas nativement les cron jobs, mais tu peux :

1. Utiliser un service externe comme **Render Cron Jobs** (gratuit)
2. Créer des endpoints API et les appeler avec **Uptime Robot** ou **Cronhub**
3. Utiliser **GitHub Actions** (voir Option 2)

## 📡 Utilisation des endpoints API

Une fois l'intégration installée, tu as accès à ces nouveaux endpoints :

### Lister tous les prix
```http
GET http://localhost:8000/api/market/prices?limit=100
```

### Prix d'un matériau spécifique
```http
GET http://localhost:8000/api/market/prices/123
```

### Historique des prix (courbe)
```http
GET http://localhost:8000/api/market/prices/123/history?days=30
```

Retourne les snapshots quotidiens pour construire une courbe.

### Refresh manuel (admin)
```http
POST http://localhost:8000/api/market/prices/refresh?force=true
```

### Statistiques de l'historique
```http
GET http://localhost:8000/api/market/prices/history/stats
```

## 🎨 Exemple d'intégration Frontend

### Afficher les prix actuels

```typescript
// frontend/src/services/marketApi.ts
export const getMarketPrices = async (category?: string) => {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  
  const response = await fetch(`/api/market/prices?${params}`);
  return response.json();
};
```

### Afficher une courbe de prix

```typescript
// frontend/src/components/PriceChart.tsx
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export function PriceChart({ materialId }: { materialId: number }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch(`/api/market/prices/${materialId}/history?days=30`)
      .then(res => res.json())
      .then(data => setHistory(data.history));
  }, [materialId]);

  return (
    <LineChart width={600} height={300} data={history}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="avg_sell_price" stroke="#00d9ff" name="Sell" />
      <Line type="monotone" dataKey="avg_buy_price" stroke="#ff9500" name="Buy" />
    </LineChart>
  );
}
```

## 🐛 Troubleshooting

### Erreur : "ModuleNotFoundError: No module named 'services'"
➡️ Assure-toi que le dossier `services/uex/` contient bien `__init__.py`

### Erreur : "column materials.uex_id does not exist"
➡️ Exécute la migration SQL : `backend/migrations/uex_integration.sql`

### Erreur : "UEX API error: HTTP 401"
➡️ Vérifie ton `UEX_API_KEY` dans le `.env`

### Les prix ne se rafraîchissent pas
➡️ Vérifie les logs : `python scripts/refresh_prices.py --force`
➡️ Le cache a un TTL de 12h, utilise `--force` pour forcer

### L'historique est vide
➡️ Normal au début, attends la première exécution de `capture_price_snapshot.py`
➡️ Ou lance-le manuellement : `python scripts/capture_price_snapshot.py`

## 📊 Monitoring et logs

Pour surveiller l'intégration :

```bash
# Voir les statistiques de l'historique
python scripts/capture_price_snapshot.py --stats

# Tester la connexion UEX
python scripts/test_uex_integration.py

# Voir les logs du dernier refresh
tail -f /var/log/uex_refresh.log  # Si tu as configuré les cron jobs
```

## ✅ Checklist de vérification

Avant de passer en production :

- [ ] Migration SQL exécutée
- [ ] Variables d'environnement configurées (UEX_API_KEY)
- [ ] Test d'intégration réussi (`test_uex_integration.py`)
- [ ] Matériaux importés (~300+)
- [ ] Locations importées (~500+)
- [ ] Premier refresh de prix effectué
- [ ] Premier snapshot capturé
- [ ] Cron jobs ou tâches planifiées configurés
- [ ] Endpoints API testés et fonctionnels

## 🎯 Prochaines étapes

1. **Intégration Frontend** : Utilise les endpoints API pour afficher les prix
2. **Courbes de prix** : Implémente des graphiques avec l'historique
3. **Alertes** : Notifie les meilleurs deals quand les prix changent
4. **Optimisation** : Cache les résultats côté frontend avec React Query
5. **Dashboard Admin** : Ajoute des boutons pour refresh manuel

## 📚 Documentation complète

Pour plus de détails, consulte `UEX_INTEGRATION.md` qui contient :
- Architecture détaillée
- Modèles de données
- Fonctions du service UEX
- Exemples d'utilisation avancés

---

## 🆘 Support

Si tu rencontres des problèmes :

1. Vérifie les logs des scripts
2. Lance `test_uex_integration.py` pour diagnostiquer
3. Consulte la documentation UEX : https://uexcorp.space/api
4. Vérifie que ta DB est à jour avec la migration

---

**Bon courage pour l'intégration ! 🚀**

*Xavier / Ankoburame*
*Obsidian Ventures Group - Star Citizen Operations Management*
