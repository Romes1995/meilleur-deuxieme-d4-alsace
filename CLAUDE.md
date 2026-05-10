# D4 Alsace — Meilleurs 2ᵉ

Application locale pour calculer les meilleurs deuxièmes de la D4 District Alsace.

## Stack
- **Backend** : Python + FastAPI (port 8001)
- **Frontend** : React + Vite (port 5175)

## Configuration requise

**Important** : avant de lancer, définir `CP_NO` dans `backend/main.py` avec le numéro de compétition D4 Alsace trouvé sur epreuves.fff.fr.

## Lancer le projet

### Script tout-en-un
```bash
chmod +x start.sh && ./start.sh
```

### Ou manuellement

**Backend** :
```bash
cd backend
pip3 install -r requirements.txt
uvicorn main:app --reload --port 8001
```

**Frontend** (dans un autre terminal) :
```bash
cd frontend
npm install
npm run dev
```

Puis ouvrir : http://localhost:5175

## Structure
```
d4-alsace/
├── backend/
│   ├── main.py          # FastAPI + scraping FFF + calcul meilleurs 2e
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── Header.jsx     # Header + bouton Calculer
    │   │   ├── Classement.jsx # Classement général des 9 deuxièmes
    │   │   └── Groupes.jsx    # Détail par poule (résultats vs top5)
    │   └── index.css
    ├── index.html
    └── package.json
```

## Différences avec D5
- **CP_NO** : numéro de compétition D4 (à configurer)
- **9 poules** (A à I) au lieu de 10
- **Backend port 8001** (D5 = 8000)
- **Frontend port 5175** (D5 = 5174)

## Règle DAF (Art. 24.2)
Le classement des 2ᵉ est établi sur les **points obtenus contre les équipes classées 1ᵉ à 5ᵉ** du groupe.
Départage : fair-play → goal-average général.
