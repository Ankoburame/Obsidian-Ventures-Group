FROM python:3.11-slim

WORKDIR /app

# Copier requirements
COPY backend/requirements.txt .

# Installer dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code backend
COPY backend/ .

ENV DATABASE_URL=${DATABASE_URL}

# Exposer le port
EXPOSE 8000

# Lancer l'app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
