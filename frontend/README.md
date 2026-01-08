This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

🛰 Star Citizen – Economy & Market Tool

Outil personnel puis collaboratif destiné à l’analyse économique de Star Citizen :
marchés, commodités, historiques de prix, aide à la décision achat / vente / production.

Le projet est séparé en backend (FastAPI) et frontend (Next.js / React).

🧱 Architecture globale
Star_Citizen_App/
├─ backend/          # API FastAPI + logique métier
└─ frontend/         # Application web Next.js (React + TS)

🔙 Backend (FastAPI)
Stack

Python 3.13+

FastAPI

SQLAlchemy

PostgreSQL

Uvicorn

API externe : UEX Corp API

📁 Arborescence backend (simplifiée)
backend/
├─ main.py
├─ core/
│  └─ config.py          # variables d’environnement
├─ database.py
├─ models/
├─ api/
│  ├─ dashboard.py
│  ├─ pricing.py
│  └─ market.py          # endpoints market / commodities
├─ services/
│  ├─ pricing_service.py
│  └─ uex/
│     └─ quantanium_service.py
└─ .env                  # NON versionné

🔐 Configuration & sécurité (.env)
Emplacement
backend/.env

Contenu minimal
UEX_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
DATABASE_URL=postgresql://user:password@localhost:5432/starcitizen_prod


❌ Ne jamais commit le .env

✅ .env chargé via python-dotenv

🔒 Pas de chiffrement local requis (clé stockée en clair, usage local/dev)

🔜 Secret manager envisagé plus tard (prod / déploiement public)

🔌 API UEX – points importants

Base URL : https://api.uexcorp.space/2.0

Authentification OBLIGATOIRE :

Authorization: Bearer <UEX_API_TOKEN>


⚠️ L’endpoint /commodities retourne ~180 commodités,
Quantanium n’est PAS garanti d’y apparaître selon les filtres.

➡️ Le code gère maintenant :

erreurs 404

absence de ressource

logs explicites

pas de crash bloquant au démarrage

▶️ Lancer le backend

Depuis backend/ :

python -m uvicorn main:app --reload


Backend dispo sur :

http://127.0.0.1:8000

🎨 Frontend (Next.js / React)
Stack

Next.js 16 (App Router)

React

TypeScript

TailwindCSS

Lucide Icons

📁 Arborescence frontend (réelle)
frontend/
├─ app/
│  ├─ layout.tsx         # layout global Next.js
│  ├─ page.tsx           # dashboard
│  ├─ market/
│  │  └─ page.tsx        # page Market (prévisualisation)
│  └─ components/
│     └─ layout/
│        ├─ AppShell.tsx
│        ├─ Sidebar.tsx
│        └─ Topbar.tsx
├─ components/           # composants UI métiers
├─ lib/
├─ public/
└─ package.json

🧩 Layout – règle d’or (IMPORTANT)

app/layout.tsx
👉 SEUL layout global reconnu par Next.js

components/layout/AppShell.tsx
👉 Shell UI (Sidebar + Topbar)

❗ Ne pas confondre avec un éventuel components/Layout.tsx
→ source principale des erreurs rencontrées précédemment.

✅ AppShell actuel (validé)
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar />
        <main className="p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

🧭 Navigation

Sidebar actuelle :

Dashboard (/)

Production (/production)

Commerce (/commerce)

Market (/market) ← outil de prévisualisation (prix, tendances)

📊 Page Market – vision fonctionnelle

La page Market est un outil de référence, pas une page transactionnelle.

Structure prévue (et faisable)

Barre de recherche (commodities)

Grille des commodités (CommodityGrid)

Sélection d’une commodité

Graphique d’évolution des prix

Résumé :

Nom / Code

Meilleur vendeur (1–32 SCU)

Meilleur acheteur (1–32 SCU)

Prix min / max

Historique local

➡️ La partie achat/vente restera dans /commerce
➡️ Pas de doublon fonctionnel

🔄 Communication Front ↔ Back

Appels directs REST (fetch)

URL backend définie dans lib/api.ts

Exemple :

fetch("http://127.0.0.1:8000/market/commodities")


⚠️ En dev :

CORS activé côté backend

Backend DOIT être lancé avant le frontend

▶️ Lancer le frontend

Depuis frontend/ :

npm install
npm run dev


Frontend dispo sur :

http://localhost:3000

🧹 Leçons clés / décisions actées

❌ Pas de mock API (source de bugs + désync)

✅ Données réelles dès le départ

❌ Pas de duplication de layouts

✅ Séparation claire :

Market = analyse

Commerce = action

✅ React + Next.js confirmé

🚧 État du projet

Backend : fonctionnel

Frontend : structure saine

Market : en cours de construction

Nettoyage & refactor : prévu après reboot


# Rapport d'amélioration - seed_materials.py

## 📋 Résumé des modifications

Le fichier `seed_materials.py` a été entièrement refondu pour améliorer sa robustesse, sa maintenabilité et sa traçabilité.

---

## 🔧 Améliorations apportées

### 1. **Gestion d'erreurs robuste**
- ✅ Ajout de `try/except` pour capturer les erreurs SQLAlchemy
- ✅ `db.rollback()` en cas d'erreur pour maintenir l'intégrité de la DB
- ✅ Gestion des exceptions inattendues
- ✅ Fermeture garantie de la session via `finally`

### 2. **Logging complet**
```python
# Avant: simple print
print("✅ Seed materials terminé")

# Après: logging détaillé
logger.info("Début de l'import des matériaux...")
logger.debug(f"Matériau ajouté: {name} ({category})")
logger.error(f"❌ Erreur lors de l'import: {e}")
```

### 3. **Structure modulaire**
- ✅ Code encapsulé dans une fonction `seed_materials()`
- ✅ Docstring complète avec description, comportement et exceptions
- ✅ Possibilité d'importer le module sans exécution automatique
- ✅ Type hints pour meilleure documentation

### 4. **Rapport d'exécution détaillé**
```
==================================================
Rapport d'import des matériaux:
  ✅ Matériaux ajoutés: 95
  ⏭️  Matériaux existants ignorés: 2
  📊 Total traité: 97
==================================================
```

### 5. **Optimisation des performances**
```python
# Avant: commit à chaque insertion
for material in MATERIALS:
    db.add(material)
    # Commit implicite ou multiple

# Après: commit unique à la fin
for material in MATERIALS:
    db.add(material)
db.commit()  # Une seule transaction
```

### 6. **Documentation améliorée**
- Docstring de module
- Docstring de fonction détaillée
- Commentaires pour chaque section de matériaux
- Type alias pour clarifier les structures de données

### 7. **Bonnes pratiques Python**
- ✅ Respect PEP 8
- ✅ Type hints (Python 3.5+)
- ✅ Constantes en MAJUSCULES
- ✅ Noms de variables explicites
- ✅ Structure claire et lisible

---

## 📊 Comparaison avant/après

| Aspect | Avant | Après |
|--------|-------|-------|
| **Gestion d'erreurs** | ❌ Aucune | ✅ Complète avec rollback |
| **Logging** | ❌ Simple print | ✅ Logging détaillé (INFO, DEBUG, ERROR) |
| **Modularité** | ❌ Code global | ✅ Fonction réutilisable |
| **Documentation** | ❌ Aucune | ✅ Docstrings + commentaires |
| **Rapport** | ❌ Message unique | ✅ Statistiques détaillées |
| **Performance** | ⚠️ Multiple commits | ✅ Commit unique |
| **Type hints** | ❌ Aucun | ✅ Complet |
| **Fermeture DB** | ⚠️ Non garantie | ✅ Via finally |

---

## 🚀 Utilisation

### Exécution directe
```bash
python seed_materials.py
```

### Import comme module
```python
from seed_materials import seed_materials

# Utiliser dans votre code
seed_materials()
```

---

## 🔍 Points de vigilance

### Données vérifiées
- ✅ 34 minéraux minables
- ✅ 3 matériaux de salvage
- ✅ 60 biens commerciaux
- ✅ **Total: 97 matériaux**

### Cohérence des flags
Certains matériaux ont des flags multiples:
- **Taranite**: minable ET commerce (✅ cohérent)
- **Gold**: minable ET commerce (✅ cohérent)
- **RMC**: salvage ET commerce (✅ cohérent)

---

## 📝 Recommandations futures

### 1. Externaliser les données
```python
# Charger depuis un fichier JSON/YAML
import json
with open('materials.json', 'r') as f:
    MATERIALS = json.load(f)
```

### 2. Ajouter des validations
```python
def validate_material(material: MaterialData) -> bool:
    """Valide les données d'un matériau."""
    name, category, unit, *flags = material
    if not name or len(name) > 100:
        return False
    if category not in ['mineral', 'salvage', 'trade']:
        return False
    return True
```

### 3. Support des mises à jour
```python
# Permettre la mise à jour des matériaux existants
if existing_material:
    existing_material.category = category
    existing_material.is_mineable = is_mineable
    # ...
    updated_count += 1
```

### 4. Mode dry-run
```python
def seed_materials(dry_run: bool = False) -> None:
    """
    dry_run: Si True, affiche les changements sans les appliquer
    """
    if not dry_run:
        db.commit()
```

---

## ✅ Checklist de migration

- [ ] Sauvegarder l'ancien fichier
- [ ] Remplacer par le nouveau fichier
- [ ] Tester en environnement de développement
- [ ] Vérifier les logs générés
- [ ] Valider le nombre de matériaux importés
- [ ] Déployer en production

---

## 🎯 Résultat final

Le nouveau fichier est:
- **Plus robuste**: gestion d'erreurs complète
- **Plus maintenable**: code modulaire et documenté
- **Plus informatif**: logging et rapports détaillés
- **Plus performant**: optimisation des transactions DB
- **Plus professionnel**: respect des standards Python

---

**Date**: 30 décembre 2024  
**Projet**: Star Citizen App  
**Fichier**: `seed_materials.py`
