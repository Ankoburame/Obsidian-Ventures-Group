# Guide de Déploiement - Intégration UEX

Ce guide explique comment déployer et configurer l'intégration UEX avec les nouvelles fonctionnalités d'historique des prix.

## 📋 Prérequis

1. **Token API UEX** : Obtenir un token sur https://uexcorp.space/
2. **Base de données PostgreSQL** configurée et accessible
3. **Python 3.10+** installé
4. **Variables d'environnement** configurées dans `.env`

## ⚙️ Configuration

### 1. Fichier `.env`

Créer ou mettre à jour le fichier `.env` dans le dossier `backend/` :

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# UEX API
UEX_API_TOKEN=votre_token_uex_ici
UEX_API_URL=https://api.uexcorp.space/2.0

# Security
SECRET_KEY=votre_secret_key_ici
```

### 2. Installation des dépendances

```bash
cd backend
pip install -r requirements.txt
```

## 🚀 Déploiement Initial

### Étape 1 : Import des données de base

```bash
# 1. Importer les matériaux depuis UEX
python -m scripts.import_materials_from_uex

# 2. Importer les locations depuis UEX  
python -m scripts.import_locations_from_uex

# Résultat attendu :
# ✅ ~200+ matériaux importés
# ✅ ~50+ locations importées
```

### Étape 2 : Premier refresh des prix

```bash
# Via script Python (recommandé pour le setup initial)
python -c "
from database import SessionLocal
from services import uex_service
db = SessionLocal()
try:
    stats = uex_service.refresh_all_prices(db, force=True)
    print(f'✅ Updated: {stats[\"updated\"]} prices')
finally:
    db.close()
"

# OU via l'API (backend doit être lancé)
curl -X POST http://localhost:8000/api/market/prices/refresh?force=true
```

### Étape 3 : Premier snapshot de prix

```bash
python -m scripts.capture_price_snapshot

# Résultat attendu :
# ✅ Captured X price snapshots
```

## 🔄 Configuration de la Maintenance Automatique

### Option 1 : Cron Jobs (Linux/Mac)

Éditer le crontab :

```bash
crontab -e
```

Ajouter ces lignes :

```cron
# Capture quotidienne des prix à 2h du matin
0 2 * * * cd /path/to/Obsidian-Ventures-Group/backend && /path/to/python -m scripts.capture_price_snapshot >> /var/log/ovg_snapshot.log 2>&1

# Refresh des prix à 3h du matin (optionnel, l'API le fait auto)
0 3 * * * curl -X POST http://localhost:8000/api/market/prices/refresh?force=true >> /var/log/ovg_refresh.log 2>&1

# Nettoyage mensuel des vieux snapshots (> 90 jours)
0 4 1 * * cd /path/to/Obsidian-Ventures-Group/backend && /path/to/python -m scripts.capture_price_snapshot --clean 90 >> /var/log/ovg_clean.log 2>&1
```

### Option 2 : Task Scheduler (Windows)

Créer des tâches planifiées dans le Task Scheduler :

**Tâche 1 : Snapshot quotidien**
- Déclencheur : Tous les jours à 2h00
- Action : `python.exe -m scripts.capture_price_snapshot`
- Dossier de départ : `C:\path\to\backend`

**Tâche 2 : Refresh des prix (optionnel)**
- Déclencheur : Tous les jours à 3h00
- Action : `curl.exe -X POST http://localhost:8000/api/market/prices/refresh?force=true`

**Tâche 3 : Nettoyage mensuel**
- Déclencheur : Le 1er de chaque mois à 4h00
- Action : `python.exe -m scripts.capture_price_snapshot --clean 90`
- Dossier de départ : `C:\path\to\backend`

### Option 3 : Railway / Services Cloud

Pour Railway ou autres plateformes cloud, ajouter ces commandes dans un fichier `cron.yaml` ou utiliser un service de cron externe comme :

- **EasyCron** : https://www.easycron.com/
- **Cron-job.org** : https://cron-job.org/
- **Railway Cron** : Via Railway plugins

Configuration exemple pour Railway Cron :

```yaml
jobs:
  - name: "Daily Price Snapshot"
    schedule: "0 2 * * *"
    command: "python -m scripts.capture_price_snapshot"
    
  - name: "Monthly Cleanup"
    schedule: "0 4 1 * *"
    command: "python -m scripts.capture_price_snapshot --clean 90"
```

## 🧪 Tests et Validation

### Test de l'import des matériaux

```bash
# Dry run (ne modifie pas la DB)
python -m scripts.import_materials_from_uex --dry-run

# Vérifier dans la DB
python -c "
from database import SessionLocal
from models.material import Material
db = SessionLocal()
count = db.query(Material).count()
print(f'Materials in DB: {count}')
db.close()
"
```

### Test du refresh des prix

```bash
# Via l'API
curl http://localhost:8000/api/market/prices | jq

# Vérifier un matériau spécifique
curl http://localhost:8000/api/market/prices/1 | jq
```

### Test de l'historique

```bash
# Capturer un snapshot
python -m scripts.capture_price_snapshot --dry-run

# Afficher les stats
python -m scripts.capture_price_snapshot --stats

# Récupérer l'historique via l'API
curl http://localhost:8000/api/market/prices/1/history?days=30 | jq
```

## 📊 Monitoring et Logs

### Vérifier les snapshots

```bash
python -m scripts.capture_price_snapshot --stats
```

Sortie attendue :
```
============================================================
STATISTIQUES DE L'HISTORIQUE
============================================================
📊 Total d'entrées:         1,500
📦 Matériaux avec historique: 200
📅 Premier snapshot:        2025-01-08
📅 Dernier snapshot:        2025-01-08
🕐 Snapshots aujourd'hui:   200
============================================================
```

### Logs de l'application

Les scripts affichent des logs détaillés :
- `✅` : Succès
- `⚠️` : Avertissement
- `❌` : Erreur
- `📊` : Information

Rediriger les logs vers des fichiers :

```bash
python -m scripts.capture_price_snapshot >> logs/snapshot.log 2>&1
```

## 🐛 Dépannage

### Erreur : "UEX API error: 401"
- **Cause** : Token API invalide ou expiré
- **Solution** : Vérifier `UEX_API_TOKEN` dans `.env`

### Erreur : "Material X not found"
- **Cause** : Matériau pas encore importé
- **Solution** : Lancer `python -m scripts.import_materials_from_uex`

### Erreur : "IntegrityError: duplicate key"
- **Cause** : Tentative de créer un doublon
- **Solution** : Normal, le script skip automatiquement les doublons

### Cache des prix ne s'actualise pas
- **Cause** : Cache valide pendant 12h
- **Solution** : Utiliser `force=true` pour forcer le refresh
  ```bash
  curl -X POST http://localhost:8000/api/market/prices/refresh?force=true
  ```

### Pas de données dans l'historique
- **Cause** : Aucun snapshot capturé
- **Solution** : 
  1. Vérifier que le cron job fonctionne
  2. Lancer manuellement : `python -m scripts.capture_price_snapshot`
  3. Vérifier avec `--stats`

## 📈 Utilisation de l'Historique dans le Frontend

### Récupérer l'historique pour un graphique

```typescript
// frontend/src/services/marketService.ts
export async function getMaterialPriceHistory(materialId: number, days: number = 30) {
  const response = await fetch(
    `${API_URL}/api/market/prices/${materialId}/history?days=${days}`
  );
  return response.json();
}

// Utilisation dans un composant
const history = await getMaterialPriceHistory(1, 30);

// Format des données pour Chart.js ou Recharts
const chartData = history.history.map(entry => ({
  date: entry.date,
  price: entry.avg_sell_price
}));
```

### Exemple de graphique avec Recharts

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

<LineChart data={chartData} width={600} height={300}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="price" stroke="#00d9ff" />
</LineChart>
```

## 🎯 Checklist de Déploiement

- [ ] Variables d'environnement configurées
- [ ] Base de données créée et accessible
- [ ] Dépendances installées (`pip install -r requirements.txt`)
- [ ] Matériaux importés
- [ ] Locations importées  
- [ ] Premier refresh des prix effectué
- [ ] Premier snapshot capturé
- [ ] Cron jobs / tâches planifiées configurés
- [ ] Logs vérifiés
- [ ] Endpoints API testés
- [ ] Frontend connecté à l'API

## 📞 Support

En cas de problème :
1. Vérifier les logs
2. Tester en mode `--dry-run`
3. Consulter le fichier `UEX_INTEGRATION.md`
4. Vérifier la documentation UEX API : https://uexcorp.space/api.html
