<?php
require_once __DIR__ . '/../config/bootstrap.php';
$pdo = get_pdo();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $pdo->prepare("SELECT id, name, email, phone, created_at FROM customers WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch();
            $row ? respond($row) : respond(['error' => 'Customer not found'], 404);
        } else {
            require_role(['administrator', 'manager'], $pdo);
            $rows = $pdo->query("SELECT id, name, email, phone, created_at FROM customers ORDER BY id DESC")->fetchAll();
            respond($rows);
        }
        break;

    case 'POST':
        $data = json_input();
        if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
            respond(['error' => 'name, email and password are required'], 422);
        }
        $stmt = $pdo->prepare("INSERT INTO customers (name, email, phone, password_hash) VALUES (:name, :email, :phone, :password_hash) RETURNING id");
        $stmt->execute([
            ':name' => $data['name'],
            ':email' => $data['email'],
            ':phone' => $data['phone'] ?? null,
            ':password_hash' => password_hash($data['password'], PASSWORD_BCRYPT),
        ]);
        $newId = $stmt->fetch()['id'];
        log_audit($pdo, $data['role'] ?? 'customer', 'customer created', 'customers', $newId, null, $data);
        respond(['id' => $newId, 'message' => 'Customer registered'], 201);
        break;

    case 'PUT':
        // Staff-only for now — customer self-service profile editing isn't built yet.
        $staff = require_role(['administrator', 'manager'], $pdo);
        if (!$id) respond(['error' => 'id is required'], 422);
        $data = json_input();
        $stmt = $pdo->prepare("UPDATE customers SET name = :name, email = :email, phone = :phone WHERE id = :id");
        $stmt->execute([
            ':name' => $data['name'], ':email' => $data['email'], ':phone' => $data['phone'] ?? null, ':id' => $id,
        ]);
        log_audit($pdo, $staff, 'customer updated', 'customers', $id, null, $data);
        respond(['message' => 'Customer updated']);
        break;

    case 'DELETE':
        require_role(['administrator', 'manager'], $pdo);
        if (!$id) respond(['error' => 'id is required'], 422);
        $pdo->prepare("DELETE FROM customers WHERE id = :id")->execute([':id' => $id]);
        respond(['message' => 'Customer deleted']);
        break;

    default:
        respond(['error' => 'Method not allowed'], 405);
}
