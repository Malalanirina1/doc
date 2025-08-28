#!/bin/bash

# Script de surveillance automatique pour copier les fichiers backend modifiés vers XAMPP
# Usage: ./watch_and_copy.sh

SOURCE_DIR="/home/noums/projet/doc/backend"
DEST_DIR="/opt/lampp/htdocs/doc/backend"

echo "👀 Surveillance du répertoire: $SOURCE_DIR"
echo "🎯 Destination: $DEST_DIR"
echo "🔄 Copie automatique activée. Appuyez sur Ctrl+C pour arrêter."

# Créer le répertoire de destination s'il n'existe pas
sudo mkdir -p "$DEST_DIR"

# Fonction de copie
copy_file() {
    local file="$1"
    echo "📝 Fichier modifié: $(basename "$file")"
    echo "🔄 Copie vers XAMPP..."
    
    sudo cp -v "$file" "$DEST_DIR/"
    sudo chown www-data:www-data "$DEST_DIR/$(basename "$file")"
    sudo chmod 644 "$DEST_DIR/$(basename "$file")"
    
    echo "✅ $(basename "$file") copié avec succès!"
    echo "⏰ $(date '+%H:%M:%S')"
    echo "---"
}

# Surveillance avec inotifywait
if command -v inotifywait &> /dev/null; then
    echo "🚀 Démarrage de la surveillance..."
    inotifywait -m -e modify,create,delete "$SOURCE_DIR" --format '%w%f %e' | while read file event; do
        if [[ "$file" == *.php ]] || [[ "$file" == *.sql ]]; then
            copy_file "$file"
        fi
    done
else
    echo "❌ inotifywait n'est pas installé."
    echo "📦 Installation avec: sudo apt-get install inotify-tools"
    echo "🔄 Mode manuel: ./copy_to_xampp.sh"
fi
