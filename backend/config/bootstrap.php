<?php
require_once __DIR__ . '/database.php';

// Credentialed CORS: browsers refuse to send/receive cookies with a wildcard
// origin, so this must be an explicit origin (set FRONTEND_URL in .env if it's
// not the Vite default).
load_env(__DIR__ . '/../.env');
$allowedOrigin = getenv('FRONTEND_URL') ?: 'http://localhost:5173';
header("Access-Control-Allow-Origin: $allowedOrigin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_set_cookie_params([
    'lifetime' => 60 * 60 * 8, // 8 hour shift
    'path' => '/',
    'samesite' => 'Lax',
]);
session_start();

require_once __DIR__ . '/session_guard.php';

function json_input() {
    $data = json_decode(file_get_contents('php://input'), true);
    return $data ?: [];
}

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

// Records who did what. Pass $staff (from require_role/current_staff) so the
// log reflects the real logged-in identity, not a client-supplied string.
function log_audit($pdo, $staffOrRole, $action, $table, $affectedId, $prev = null, $new = null, $reason = null) {
    $role = is_array($staffOrRole) ? $staffOrRole['role'] : $staffOrRole;
    $stmt = $pdo->prepare("INSERT INTO audit_log (user_role, action, affected_table, affected_id, previous_value, new_value, reason)
        VALUES (:role, :action, :table, :id, :prev, :new, :reason)");
    $stmt->execute([
        ':role' => $role, ':action' => $action, ':table' => $table, ':id' => $affectedId,
        ':prev' => $prev ? json_encode($prev) : null,
        ':new' => $new ? json_encode($new) : null,
        ':reason' => $reason,
    ]);
}
