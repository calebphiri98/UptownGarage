<?php
require_once __DIR__ . '/../config/bootstrap.php';
$pdo = get_pdo();
$action = $_GET['action'] ?? '';

if ($action === 'me') {
    $staff = current_staff();
    $staff ? respond(['staff' => $staff]) : respond(['staff' => null]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Method not allowed'], 405);
$data = json_input();

if ($action === 'login') {
    if (empty($data['email']) || empty($data['password'])) {
        respond(['error' => 'email and password are required'], 422);
    }
    $stmt = $pdo->prepare("SELECT * FROM staff WHERE email = :email");
    $stmt->execute([':email' => $data['email']]);
    $staff = $stmt->fetch();
    if (!$staff || !password_verify($data['password'], $staff['password_hash'])) {
        respond(['error' => 'Invalid credentials'], 401);
    }
    $_SESSION['staff_id'] = $staff['id'];
    $_SESSION['staff_name'] = $staff['name'];
    $_SESSION['staff_role'] = $staff['role'];
    respond(['staff' => ['id' => $staff['id'], 'name' => $staff['name'], 'role' => $staff['role']]]);
}

if ($action === 'logout') {
    $_SESSION = [];
    session_destroy();
    respond(['message' => 'Logged out']);
}

respond(['error' => 'Unknown action'], 400);
