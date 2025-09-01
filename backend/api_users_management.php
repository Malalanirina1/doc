<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

// Fonction pour vérifier si l'utilisateur est admin
function verifyAdminToken($token) {
    if (empty($token)) {
        return false;
    }
    
    try {
        $decodedToken = json_decode(base64_decode($token), true);
        if (!$decodedToken || !isset($decodedToken['role']) || $decodedToken['role'] !== 'admin') {
            return false;
        }
        return $decodedToken;
    } catch (Exception $e) {
        return false;
    }
}

// Vérification de l'authentification admin
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

// Extraire le token (enlever "Bearer " si présent)
$token = str_replace('Bearer ', '', $authHeader);

$userInfo = verifyAdminToken($token);
if (!$userInfo) {
    echo json_encode(['success' => false, 'message' => 'Token d\'authentification requis ou invalide']);
    exit();
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);

    switch ($method) {
        case 'GET':
            // Récupérer tous les utilisateurs
            if (isset($_GET['action']) && $_GET['action'] === 'list') {
                $stmt = $pdo->query("SELECT id, username, role, nom_complet, created_at FROM users ORDER BY created_at DESC");
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'users' => $users
                ]);
            }
            break;

        case 'POST':
            // Créer un nouvel utilisateur
            if (isset($input['action']) && $input['action'] === 'create') {
                $username = $input['username'] ?? '';
                $password = $input['password'] ?? '';
                $role = $input['role'] ?? 'assistant';
                $nom_complet = $input['nom_complet'] ?? '';

                // Validation
                if (empty($username) || empty($password) || empty($nom_complet)) {
                    echo json_encode(['success' => false, 'message' => 'Tous les champs sont obligatoires']);
                    exit();
                }

                if (strlen($password) < 6) {
                    echo json_encode(['success' => false, 'message' => 'Le mot de passe doit contenir au moins 6 caractères']);
                    exit();
                }

                // Vérifier si l'utilisateur existe déjà
                $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
                $stmt->execute([$username]);
                if ($stmt->fetch()) {
                    echo json_encode(['success' => false, 'message' => 'Ce nom d\'utilisateur existe déjà']);
                    exit();
                }

                // Créer l'utilisateur
                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("INSERT INTO users (username, password, role, nom_complet, created_at) VALUES (?, ?, ?, ?, NOW())");
                
                if ($stmt->execute([$username, $hashedPassword, $role, $nom_complet])) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Utilisateur créé avec succès',
                        'user_id' => $pdo->lastInsertId()
                    ]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création de l\'utilisateur']);
                }
            }
            break;

        case 'PUT':
            // Modifier un utilisateur
            if (isset($input['action']) && $input['action'] === 'update') {
                $userId = $input['user_id'] ?? 0;
                $username = $input['username'] ?? '';
                $role = $input['role'] ?? '';
                $nom_complet = $input['nom_complet'] ?? '';

                if (!$userId || empty($username) || empty($role) || empty($nom_complet)) {
                    echo json_encode(['success' => false, 'message' => 'Données incomplètes']);
                    exit();
                }

                $stmt = $pdo->prepare("UPDATE users SET username = ?, role = ?, nom_complet = ? WHERE id = ?");
                
                if ($stmt->execute([$username, $role, $nom_complet, $userId])) {
                    echo json_encode(['success' => true, 'message' => 'Utilisateur modifié avec succès']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Erreur lors de la modification']);
                }
            }
            
            // Changer le mot de passe d'un utilisateur (admin seulement)
            if (isset($input['action']) && $input['action'] === 'change_password') {
                $userId = $input['user_id'] ?? 0;
                $newPassword = $input['new_password'] ?? '';

                if (!$userId || empty($newPassword)) {
                    echo json_encode(['success' => false, 'message' => 'Données incomplètes']);
                    exit();
                }

                if (strlen($newPassword) < 6) {
                    echo json_encode(['success' => false, 'message' => 'Le mot de passe doit contenir au moins 6 caractères']);
                    exit();
                }

                $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
                
                if ($stmt->execute([$hashedPassword, $userId])) {
                    echo json_encode(['success' => true, 'message' => 'Mot de passe modifié avec succès']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Erreur lors de la modification du mot de passe']);
                }
            }
            break;

        case 'DELETE':
            // Supprimer un utilisateur
            if (isset($input['user_id'])) {
                $userId = $input['user_id'];

                // Vérifier qu'on ne supprime pas le dernier admin
                $stmt = $pdo->prepare("SELECT COUNT(*) as admin_count FROM users WHERE role = 'admin'");
                $stmt->execute();
                $adminCount = $stmt->fetch()['admin_count'];

                $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $userToDelete = $stmt->fetch();

                if ($userToDelete && $userToDelete['role'] === 'admin' && $adminCount <= 1) {
                    echo json_encode(['success' => false, 'message' => 'Impossible de supprimer le dernier administrateur']);
                    exit();
                }

                $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
                
                if ($stmt->execute([$userId])) {
                    echo json_encode(['success' => true, 'message' => 'Utilisateur supprimé avec succès']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression']);
                }
            }
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
            break;
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?>
