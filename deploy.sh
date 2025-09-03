#!/bin/bash

echo "🚀 Déploiement automatique sur Apache..."

# Build de l'application
echo "📦 Build en cours..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build réussi"
    
    # Nettoyage du répertoire de déploiement
    echo "🧹 Nettoyage du répertoire Apache..."
    sudo rm -rf /opt/lampp/htdocs/docfront/*
    
    # Copie des fichiers
    echo "📁 Copie des fichiers..."
    sudo cp -R dist/* /opt/lampp/htdocs/docfront/
    
    # Copie du .htaccess
    echo "⚙️  Configuration Apache..."
    sudo cp public/.htaccess /opt/lampp/htdocs/docfront/
    
    echo "🎉 Déploiement terminé avec succès!"
    echo "📍 Application disponible sur: http://localhost/docfront/"
    
else
    echo "❌ Erreur lors du build"
    exit 1
fi
