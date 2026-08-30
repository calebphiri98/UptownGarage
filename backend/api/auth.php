<?php
require_once __DIR__ . '/../config/bootstrap.php';
$pdo = get_pdo();
$data = json_input();
$action = $_GET['action'] ?? 'login';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Method not allowed'], 405);

if ($action === 'login') {
    if (empty($data['email']) || empty($data['password'])) {
        respond(['error' => 'email and password are required'], 422);
    }

    $stmt = $pdo->prepare("SELECT * FROM staff WHERE email = :email");
    $stmt->execute([':email' => $data['email']]);
    $staff = $stmt->fetch();
    if ($staff && password_verify($data['password'], $staff['password_hash'])) {
        $_SESSION['staff_id'] = $staff['id'];
        $_SESSION['staff_name'] = $staff['name'];
        $_SESSION['staff_role'] = $staff['role'];
        respond(['type' => 'staff', 'user' => ['id' => $staff['id'], 'name' => $staff['name'], 'role' => $staff['role']]]);
    }

    $stmt = $pdo->prepare("SELECT * FROM customers WHERE email = :email");
    $stmt->execute([':email' => $data['email']]);
    $customer = $stmt->fetch();
    if ($customer && password_verify($data['password'], $customer['password_hash'])) {
        unset($customer['password_hash']);
        respond(['type' => 'customer', 'user' => $customer]);
    }

    respond(['error' => 'Invalid credentials'], 401);
} else {
    respond(['error' => 'Unknown action'], 400);
}
