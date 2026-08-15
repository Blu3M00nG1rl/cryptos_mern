#!/bin/bash

echo "🔻 Arrêt des conteneurs..."
docker compose down

echo "🚀 Démarrage des conteneurs..."
docker compose up -d