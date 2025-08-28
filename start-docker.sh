#!/bin/bash

echo "🚀 Démarrage du serveur PHP Docker (remplace WAMP)..."

# Arrêter les conteneurs existants
docker-compose down

# Construire et démarrer le service PHP
docker-compose up --build -d

echo "✅ Serveur PHP démarré!"
echo ""
echo "📋 URL d'accès:"
echo "   - Backend PHP: http://localhost"
echo ""
echo "🔧 Configuration:"
echo "   - Le serveur PHP utilise votre MySQL existant sur localhost"
echo "   - Base de données: gestion_doc"
echo "   - Assurez-vous que MySQL est démarré sur votre machine"
echo ""
echo "📄 Pour voir les logs:"
echo "   docker-compose logs -f php-apache"
echo ""
echo "🛑 Pour arrêter:"
echo "   docker-compose down"
