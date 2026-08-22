<?php
require_once __DIR__ . '/../config/bootstrap.php';
$pdo = get_pdo();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

if ($method === 'GET' && $action === 'low-stock') {
    // Section 7: Low stock alert — quantity <= min_stock
    respond($pdo->query("SELECT * FROM parts WHERE quantity <= min_stock ORDER BY name")->fetchAll());
}

if ($method === 'POST' && $action === 'stock-in' && $id) {
    require_role(['administrator', 'manager'], $pdo);
    // Stock received — quantity increases with a stock-in transaction recorded
    $data = json_input();
    if (empty($data['quantity']) || $data['quantity'] <= 0) respond(['error' => 'quantity must be positive'], 422);
    $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE parts SET quantity = quantity + :q WHERE id = :id")->execute([':q' => $data['quantity'], ':id' => $id]);
        $pdo->prepare("INSERT INTO stock_movements (part_id, movement_type, quantity, reason) VALUES (:id, 'IN', :q, :reason)")
            ->execute([':id' => $id, ':q' => $data['quantity'], ':reason' => $data['reason'] ?? 'Stock received']);
        $pdo->commit();
        respond(['message' => 'Stock received and recorded']);
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(['error' => $e->getMessage()], 422);
    }
}

if ($method === 'POST' && $action === 'adjust' && $id) {
    require_role(['administrator', 'manager'], $pdo);
    // Manual adjustment — requires a reason, visible in audit trail
    $data = json_input();
    if (!isset($data['quantity']) || empty($data['reason'])) respond(['error' => 'quantity and reason are required'], 422);
    $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE parts SET quantity = quantity + :q WHERE id = :id")->execute([':q' => $data['quantity'], ':id' => $id]);
        $pdo->prepare("INSERT INTO stock_movements (part_id, movement_type, quantity, reason) VALUES (:id, 'ADJUSTMENT', :q, :reason)")
            ->execute([':id' => $id, ':q' => $data['quantity'], ':reason' => $data['reason']]);
        log_audit($pdo, current_staff(), 'stock adjusted', 'parts', $id, null, $data, $data['reason']);
        $pdo->commit();
        respond(['message' => 'Stock adjusted']);
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(['error' => $e->getMessage()], 422);
    }
}

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM parts WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch();
            $row ? respond($row) : respond(['error' => 'Part not found'], 404);
        } else {
            respond($pdo->query("SELECT * FROM parts ORDER BY name")->fetchAll());
        }
        break;

    case 'POST':
        require_role(['administrator', 'manager'], $pdo);
        $data = json_input();
        foreach (['name', 'sku'] as $f) if (empty($data[$f])) respond(['error' => "$f is required"], 422);
        $stmt = $pdo->prepare("INSERT INTO parts (name, sku, quantity, min_stock, unit_price)
            VALUES (:name, :sku, :quantity, :min_stock, :unit_price) RETURNING id");
        $stmt->execute([
            ':name' => $data['name'], ':sku' => $data['sku'],
            ':quantity' => $data['quantity'] ?? 0, ':min_stock' => $data['min_stock'] ?? 0,
            ':unit_price' => $data['unit_price'] ?? 0,
        ]);
        respond(['id' => $stmt->fetch()['id'], 'message' => 'Part added'], 201);
        break;

    case 'PUT':
        require_role(['administrator', 'manager'], $pdo);
        if (!$id) respond(['error' => 'id is required'], 422);
        $data = json_input();
        $stmt = $pdo->prepare("UPDATE parts SET name=:name, sku=:sku, min_stock=:min_stock, unit_price=:unit_price WHERE id=:id");
        $stmt->execute([':name'=>$data['name'], ':sku'=>$data['sku'], ':min_stock'=>$data['min_stock'] ?? 0, ':unit_price'=>$data['unit_price'] ?? 0, ':id'=>$id]);
        respond(['message' => 'Part updated']);
        break;

    case 'DELETE':
        require_role(['administrator', 'manager'], $pdo);
        if (!$id) respond(['error' => 'id is required'], 422);
        $pdo->prepare("DELETE FROM parts WHERE id = :id")->execute([':id' => $id]);
        respond(['message' => 'Part deleted']);
        break;

    default:
        respond(['error' => 'Method not allowed'], 405);
}
