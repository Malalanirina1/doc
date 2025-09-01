#!/bin/bash

# Script pour corriger les headers CORS dans tous les fichiers API

files=(
    "api_actions.php"
    "api_auth.php" 
    "api_change_password.php"
    "api_clients.php"
    "api_pieces_communes_new.php"
    "api_pieces_communes_old.php"
    "api_pieces_communes.php"
    "api_search.php"
    "api_stats.php"
    "api_types.php"
    "clients_simple.php"
)

for file in "${files[@]}"; do
    if [ -f "backend/$file" ]; then
        echo "Correction de $file..."
        sed -i "s/header('Access-Control-Allow-Origin: \*');/\$origin = \$_SERVER['HTTP_ORIGIN'] ?? 'http:\/\/localhost:5173';\nheader(\"Access-Control-Allow-Origin: \$origin\");/" "backend/$file"
    fi
done

echo "Correction terminée!"
