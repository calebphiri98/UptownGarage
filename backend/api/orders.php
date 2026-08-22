<?php
require_once __DIR__ . '/../config/bootstrap.php';
$pdo = get_pdo();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

function order_with_items($pdo, $id) {
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $order = $stmt->fetch();
    if (!$order) return null;
    $stmt = $pdo->prepare("SELECT oi.*, p.name, p.sku FROM order_items oi JOIN parts p ON p.id = oi.part_id WHERE oi.order_id = :id");
    $stmt->execute([':id' => $id]);
    $order['items'] = $stmt->fetchAll();
    return $order;
}

if ($method === 'POST' && $action === 'confirm' && $id) {
    require_role(['administrator', 'manager'], $pdo);
    // Section 8: administrator confirms an order — must not exceed available stock, quantity is reserved
    $order = order_with_items($pdo, $id);
    if (!$order) respond(['error' => 'Order not found'], 404);
    $pdo->beginTransaction();
    try {
        foreach ($order['items'] as $item) {
            $stmt = $pdo->prepare("SELECT quantity FROM parts WHERE id = :pid FOR UPDATE");
            $stmt->execute([':pid' => $item['part_id']]);
            $part = $stmt->fetch();
            if (!$part || $part['quantity'] < $item['quantity']) {
                throw new Exception("Insufficient stock for {$item['name']} (available: " . ($part['quantity'] ?? 0) . ")");
            }
        }
        foreach ($order['items'] as $item) {
            $pdo->prepare("UPDATE parts SET quantity = quantity - :q WHERE id = :pid")
                ->execute([':q' => $item['quantity'], ':pid' => $item['part_id']]);
            $pdo->prepare("INSERT INTO stock_movements (part_id, movement_type, quantity, reference) VALUES (:pid, 'SALE', :q, :ref)")
                ->execute([':pid' => $item['part_id'], ':q' => -1 * $item['quantity'], ':ref' => "order:$id"]);
        }
        $pdo->prepare("UPDATE orders SET status = 'Confirmed' WHERE id = :id")->execute([':id' => $id]);
        $pdo->commit();
        respond(['message' => 'Order confirmed and stock reserved']);
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(['error' => $e->getMessage()], 422);
    }
}

if ($method === 'POST' && $action === 'reject' && $id) {
    require_role(['administrator', 'manager'], $pdo);
    $pdo->prepare("UPDATE orders SET status = 'Rejected' WHERE id = :id")->execute([':id' => $id]);
    respond(['message' => 'Order rejected']);
}

switch ($method) {
    case 'GET':
        if ($id) {
            $order = order_with_items($pdo, $id);
            $order ? respond($order) : respond(['error' => 'Order not found'], 404);
        } else {
            // Full order list (every customer's orders) is staff-only.
            require_role(['administrator', 'manager'], $pdo);
            respond($pdo->query("SELECT o.*, c.name AS customer_name FROM orders o LEFT JOIN customers c ON c.id = o.customer_id ORDER BY o.id DESC")->fetchAll());
        }
        break;

    case 'POST':
        // Customer submits an order (items: [{part_id, quantity}])
        $data = json_input();
        if (empty($data['items']) || !is_array($data['items'])) respond(['error' => 'items array is required'], 422);
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO orders (customer_id, status) VALUES (:cid, 'Pending') RETURNING id");
            $stmt->execute([':cid' => $data['customer_id'] ?? null]);
            $orderId = $stmt->fetch()['id'];
            foreach ($data['items'] as $item) {
                $p = $pdo->prepare("SELECT unit_price, quantity FROM parts WHERE id = :pid");
                $p->execute([':pid' => $item['part_id']]);
                $part = $p->fetch();
                if (!$part) throw new Exception('Part not found: ' . $item['part_id']);
                $pdo->prepare("INSERT INTO order_items (order_id, part_id, quantity, unit_price) VALUES (:oid, :pid, :q, :price)")
                    ->execute([':oid' => $orderId, ':pid' => $item['part_id'], ':q' => $item['quantity'], ':price' => $part['unit_price']]);
            }
            $pdo->commit();
            respond(['id' => $orderId, 'message' => 'Order submitted (Pending)'], 201);
        } catch (Exception $e) {
            $pdo->rollBack();
            respond(['error' => $e->getMessage()], 422);
        }
        break;

    case 'PUT':
        if (!$id) respond(['error' => 'id is required'], 422);
        $data = json_input();
        $stmt = $pdo->prepare("UPDATE orders SET status = :status WHERE id = :id");
        $stmt->execute([':status' => $data['status'], ':id' => $id]);
        respond(['message' => 'Order updated']);
        break;

    case 'DELETE':
        if (!$id) respond(['error' => 'id is required'], 422);
        $pdo->prepare("DELETE FROM order_items WHERE order_id = :id")->execute([':id' => $id]);
        $pdo->prepare("DELETE FROM orders WHERE id = :id")->execute([':id' => $id]);
        respond(['message' => 'Order deleted']);
        break;

    default:
        respond(['error' => 'Method not allowed'], 405);
}
