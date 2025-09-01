<?php
require_once 'config.php';

try {
    // Afficher tous les utilisateurs existants
    $stmt = $pdo->query("SELECT id, username, role, nom_complet FROM users");
    $users = $stmt->fetchAll();
    
    echo "=== UTILISATEURS EXISTANTS ===\n";
    foreach ($users as $user) {
        echo "ID: {$user['id']} | Username: {$user['username']} | Role: {$user['role']} | Nom: {$user['nom_complet']}\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}
?>
