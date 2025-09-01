<?php
require_once 'config.php';

try {
    // Mettre à jour les mots de passe des utilisateurs existants
    $adminPassword = password_hash('newtest123', PASSWORD_DEFAULT);
    $assistantPassword = password_hash('password123', PASSWORD_DEFAULT);
    
    // Mettre à jour le mot de passe de l'admin
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE username = 'admin'");
    $stmt->execute([$adminPassword]);
    echo "✅ Mot de passe admin mis à jour: admin / newtest123\n";
    
    // Mettre à jour le mot de passe de l'assistant
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE username = 'assistant'");
    $stmt->execute([$assistantPassword]);
    echo "✅ Mot de passe assistant mis à jour: assistant / password123\n";
    
    echo "\n🎯 CREDENTIALS DE PRODUCTION CONFIGURÉS:\n";
    echo "👤 Admin: admin / newtest123\n";
    echo "👤 Assistant: assistant / password123\n";
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}
?>
