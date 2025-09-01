<?php
header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gestion de la requête OPTIONS pour CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

try {
    // Vérifier que c'est une requête POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Méthode non autorisée');
    }

    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validation des données requises
    $required = ['user_id', 'current_password', 'new_password'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || empty(trim($input[$field]))) {
            throw new Exception("Le champ $field est requis");
        }
    }

    $userId = (int)$input['user_id'];
    $currentPassword = trim($input['current_password']);
    $newPassword = trim($input['new_password']);
    
    // Validation de la longueur du nouveau mot de passe
    if (strlen($newPassword) < 6) {
        throw new Exception('Le nouveau mot de passe doit contenir au moins 6 caractères');
    }

    // Récupérer l'utilisateur
    $stmt = $pdo->prepare("SELECT id, mot_de_passe, nom, prenom FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception('Utilisateur non trouvé');
    }

    // Vérifier le mot de passe actuel
    if (!password_verify($currentPassword, $user['mot_de_passe'])) {
        throw new Exception('Mot de passe actuel incorrect');
    }

    // Hasher le nouveau mot de passe
    $hashedNewPassword = password_hash($newPassword, PASSWORD_DEFAULT);

    // Mettre à jour le mot de passe
    $updateStmt = $pdo->prepare("
        UPDATE users 
        SET mot_de_passe = ?, updated_at = NOW() 
        WHERE id = ?
    ");
    $updateStmt->execute([$hashedNewPassword, $userId]);

    echo json_encode([
        'success' => true,
        'message' => 'Mot de passe modifié avec succès'
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
