<?php
require_once __DIR__ . '/../config/bootstrap.php';
$pdo = get_pdo();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$customerId = $_GET['customer_id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM vehicles WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch();
            $row ? respond($row) : respond(['error' => 'Vehicle not found'], 404);
        } elseif ($customerId) {
            $stmt = $pdo->prepare("SELECT * FROM vehicles WHERE customer_id = :cid ORDER BY id DESC");
            $stmt->execute([':cid' => $customerId]);
            respond($stmt->fetchAll());
        } else {
            require_role(['administrator', 'manager'], $pdo);
            respond($pdo->query("SELECT v.*, c.name AS customer_name FROM vehicles v JOIN customers c ON c.id = v.customer_id ORDER BY v.id DESC")->fetchAll());
        }
        break;

    case 'POST':
        $data = json_input();
        foreach (['customer_id', 'plate_number'] as $f) {
            if (empty($data[$f])) respond(['error' => "$f is required"], 422);
        }
        $stmt = $pdo->prepare("INSERT INTO vehicles (customer_id, make, model, year, plate_number) VALUES (:customer_id, :make, :model, :year, :plate_number) RETURNING id");
        $stmt->execute([
            ':customer_id' => $data['customer_id'],
            ':make' => $data['make'] ?? null,
            ':model' => $data['model'] ?? null,
            ':year' => $data['year'] ?? null,
            ':plate_number' => $data['plate_number'],
        ]);
        respond(['id' => $stmt->fetch()['id'], 'message' => 'Vehicle registered'], 201);
        break;

    case 'PUT':
        if (!$id) respond(['error' => 'id is required'], 422);
        $data = json_input();
        $stmt = $pdo->prepare("UPDATE vehicles SET make=:make, model=:model, year=:year, plate_number=:plate_number WHERE id=:id");
        $stmt->execute([':make'=>$data['make'] ?? null, ':model'=>$data['model'] ?? null, ':year'=>$data['year'] ?? null, ':plate_number'=>$data['plate_number'], ':id'=>$id]);
        respond(['message' => 'Vehicle updated']);
        break;

    case 'DELETE':
        if (!$id) respond(['error' => 'id is required'], 422);
        $pdo->prepare("DELETE FROM vehicles WHERE id = :id")->execute([':id' => $id]);
        respond(['message' => 'Vehicle deleted']);
        break;

    default:
        respond(['error' => 'Method not allowed'], 405);
}
