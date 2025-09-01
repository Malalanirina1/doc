#!/bin/bash

echo "🚀 PRÉPARATION DE L'APPLICATION POUR LA PRODUCTION"
echo "================================================="

# 1. Build de l'application React
echo "📦 Building React application..."
cd /home/noums/projet/doc
npm run build

# 2. Copie des fichiers de build vers un dossier de production
echo "📂 Copying build files..."
sudo mkdir -p /opt/lampp/htdocs/doc-app
sudo cp -r dist/* /opt/lampp/htdocs/doc-app/

# 3. Vérification des permissions
echo "🔐 Setting permissions..."
sudo chown -R daemon:daemon /opt/lampp/htdocs/doc-app
sudo chmod -R 755 /opt/lampp/htdocs/doc-app

# 4. Copie finale des APIs
echo "🔧 Updating APIs..."
sudo cp backend/* /opt/lampp/htdocs/doc/

echo ""
echo "✅ APPLICATION PRÊTE POUR LA PRODUCTION!"
echo ""
echo "🌐 URLs d'accès:"
echo "   Admin: http://localhost/doc-app/"
echo "   Assistant: http://localhost/doc-app/"
echo ""
echo "👤 Credentials:"
echo "   Admin: admin / newtest123"
echo "   Assistant: assistant / password123"
echo ""
echo "🔗 APIs disponibles sur: http://localhost/doc/"
