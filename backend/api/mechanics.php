<?php
require_once __DIR__ . '/../config/bootstrap.php';
$pdo = get_pdo();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM mechanics WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch();
            $row ? respond($row) : respond(['error' => 'Mechanic not found'], 404);
        } else {
            respond($pdo->query("SELECT * FROM mechanics ORDER BY id DESC")->fetchAll());
        }
        break;

    case 'POST':
        require_role(['administrator', 'manager'], $pdo);
        $data = json_input();
        if (empty($data['name'])) respond(['error' => 'name is required'], 422);
        $stmt = $pdo->prepare("INSERT INTO mechanics (name, phone, specialty) VALUES (:name, :phone, :specialty) RETURNING id");
        $stmt->execute([':name' => $data['name'], ':phone' => $data['phone'] ?? null, ':specialty' => $data['specialty'] ?? null]);
        respond(['id' => $stmt->fetch()['id'], 'message' => 'Mechanic added'], 201);
        break;

    case 'PUT':
        require_role(['administrator', 'manager'], $pdo);
        if (!$id) respond(['error' => 'id is required'], 422);
        $data = json_input();
        $stmt = $pdo->prepare("UPDATE mechanics SET name=:name, phone=:phone, specialty=:specialty WHERE id=:id");
        $stmt->execute([':name'=>$data['name'], ':phone'=>$data['phone'] ?? null, ':specialty'=>$data['specialty'] ?? null, ':id'=>$id]);
        respond(['message' => 'Mechanic updated']);
        break;

    case 'DELETE':
        require_role(['administrator', 'manager'], $pdo);
        if (!$id) respond(['error' => 'id is required'], 422);
        $pdo->prepare("DELETE FROM mechanics WHERE id = :id")->execute([':id' => $id]);
        respond(['message' => 'Mechanic deleted']);
        break;

    default:
        respond(['error' => 'Method not allowed'], 405);
}
