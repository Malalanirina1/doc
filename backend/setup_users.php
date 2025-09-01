<?php
require_once 'config.php';

// Créer/mettre à jour les utilisateurs pour la production

try {
    // Créer la table users si elle n'existe pas
    $createTable = "
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'assistant') NOT NULL,
        nom_complet VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    
    $pdo->exec($createTable);
    echo "Table users créée/vérifiée\n";
    
    // Hash des mots de passe
    $adminPassword = password_hash('newtest123', PASSWORD_DEFAULT);
    $assistantPassword = password_hash('password123', PASSWORD_DEFAULT);
    
    // Supprimer les anciens utilisateurs s'ils existent
    $pdo->exec("DELETE FROM users WHERE username IN ('admin', 'assistant')");
    
    // Insérer les nouveaux utilisateurs
    $stmt = $pdo->prepare("INSERT INTO users (username, password, role, nom_complet) VALUES (?, ?, ?, ?)");
    
    // Utilisateur admin
    $stmt->execute(['admin', $adminPassword, 'admin', 'Administrateur']);
    echo "Utilisateur admin créé: admin / newtest123\n";
    
    // Utilisateur assistant
    $stmt->execute(['assistant', $assistantPassword, 'assistant', 'Assistant']);
    echo "Utilisateur assistant créé: assistant / password123\n";
    
    echo "\n✅ Utilisateurs de production configurés avec succès!\n";
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}
?>
