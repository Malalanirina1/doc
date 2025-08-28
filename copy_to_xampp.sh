#!/bin/bash

# Script pour copier les fichiers backend vers XAMPP
# Usage: ./copy_to_xampp.sh

SOURCE_DIR="/home/noums/projet/doc/backend"
DEST_DIR="/opt/lampp/htdocs/doc/backend"

echo "🔄 Copie des fichiers backend vers XAMPP..."

# Créer le répertoire de destination s'il n'existe pas
sudo mkdir -p "$DEST_DIR"

# Copier tous les fichiers PHP
echo "📁 Copie des fichiers PHP..."
sudo cp -v "$SOURCE_DIR"/*.php "$DEST_DIR/"

# Copier le fichier SQL s'il existe
if [ -f "$SOURCE_DIR"/*.sql ]; then
    echo "📄 Copie des fichiers SQL..."
    sudo cp -v "$SOURCE_DIR"/*.sql "$DEST_DIR/"
fi

# Définir les permissions appropriées
echo "🔐 Configuration des permissions..."
sudo chown -R www-data:www-data "$DEST_DIR"
sudo chmod -R 755 "$DEST_DIR"
sudo chmod -R 644 "$DEST_DIR"/*.php
sudo chmod -R 644 "$DEST_DIR"/*.sql 2>/dev/null || true

echo "✅ Copie terminée! Les fichiers sont maintenant disponibles dans XAMPP."
echo "🌐 URL: http://localhost/doc/backend/"

# Lister les fichiers copiés
echo ""
echo "📋 Fichiers copiés:"
ls -la "$DEST_DIR"
