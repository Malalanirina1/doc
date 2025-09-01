<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Gérer les requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

// Vérifier que c'est une requête POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée'
    ]);
    exit();
}

// Récupérer les données JSON
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode([
        'success' => false,
        'message' => 'Données JSON invalides'
    ]);
    exit();
}

// Vérifier les champs requis
$requiredFields = ['user_id', 'current_password', 'new_password'];
foreach ($requiredFields as $field) {
    if (!isset($input[$field]) || empty($input[$field])) {
        echo json_encode([
            'success' => false,
            'message' => "Le champ '$field' est requis"
        ]);
        exit();
    }
}

$user_id = (int)$input['user_id'];
$current_password = $input['current_password'];
$new_password = $input['new_password'];

// Validation du nouveau mot de passe
if (strlen($new_password) < 6) {
    echo json_encode([
        'success' => false,
        'message' => 'Le nouveau mot de passe doit contenir au moins 6 caractères'
    ]);
    exit();
}

try {
    // Vérifier que l'utilisateur existe et récupérer son mot de passe actuel
    $stmt = $pdo->prepare("SELECT id, password FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode([
            'success' => false,
            'message' => 'Utilisateur non trouvé'
        ]);
        exit();
    }
    
    // Vérifier le mot de passe actuel
    if (!password_verify($current_password, $user['password'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Mot de passe actuel incorrect'
        ]);
        exit();
    }
    
    // Hasher le nouveau mot de passe
    $new_password_hash = password_hash($new_password, PASSWORD_DEFAULT);
    
    // Mettre à jour le mot de passe
    $updateStmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
    $updateResult = $updateStmt->execute([$new_password_hash, $user_id]);
    
    if ($updateResult) {
        echo json_encode([
            'success' => true,
            'message' => 'Mot de passe modifié avec succès'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Erreur lors de la mise à jour du mot de passe'
        ]);
    }
    
} catch (PDOException $e) {
    error_log("Erreur changement mot de passe: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données'
    ]);
} catch (Exception $e) {
    error_log("Erreur générale changement mot de passe: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur'
    ]);
}
?>
