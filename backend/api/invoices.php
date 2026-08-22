<?php
require_once __DIR__ . '/../config/bootstrap.php';
$pdo = get_pdo();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

function compute_total($pdo, $jobId, $orderId, $laborCharge, $discount) {
    $total = floatval($laborCharge) - floatval($discount);
    if ($jobId) {
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(jp.quantity * p.unit_price),0) AS parts_total FROM job_parts jp JOIN parts p ON p.id = jp.part_id WHERE jp.job_id = :jid");
        $stmt->execute([':jid' => $jobId]);
        $total += floatval($stmt->fetch()['parts_total']);
    }
    if ($orderId) {
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(quantity * unit_price),0) AS order_total FROM order_items WHERE order_id = :oid");
        $stmt->execute([':oid' => $orderId]);
        $total += floatval($stmt->fetch()['order_total']);
    }
    return $total;
}

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM invoices WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch();
            $row ? respond($row) : respond(['error' => 'Invoice not found'], 404);
        } else {
            respond($pdo->query("SELECT * FROM invoices ORDER BY id DESC")->fetchAll());
        }
        break;

    case 'POST':
        // Section 9: Invoice total = service/labour + parts − approved discounts + applicable charges
        require_role(['administrator', 'manager'], $pdo);
        $data = json_input();
        if (empty($data['job_id']) && empty($data['order_id'])) {
            respond(['error' => 'job_id or order_id is required'], 422);
        }
        $total = compute_total($pdo, $data['job_id'] ?? null, $data['order_id'] ?? null, $data['labor_charge'] ?? 0, $data['discount'] ?? 0);
        $stmt = $pdo->prepare("INSERT INTO invoices (job_id, order_id, total, amount_paid, balance, status)
            VALUES (:job_id, :order_id, :total, 0, :total, 'Unpaid') RETURNING id");
        $stmt->execute([':job_id' => $data['job_id'] ?? null, ':order_id' => $data['order_id'] ?? null, ':total' => $total]);
        respond(['id' => $stmt->fetch()['id'], 'total' => $total, 'message' => 'Invoice generated'], 201);
        break;

    case 'PUT':
        // Section 11: invoice cancellation is Administrator=Request, Manager=Approve/Reject —
        // only a manager can actually perform the cancellation/refund.
        $staff = require_role(['manager'], $pdo);
        if (!$id) respond(['error' => 'id is required'], 422);
        $data = json_input();
        if (!in_array($data['status'] ?? '', ['Cancelled', 'Refunded'])) {
            respond(['error' => 'Only Cancelled or Refunded status transitions are allowed here'], 422);
        }
        $pdo->prepare("UPDATE invoices SET status = :status WHERE id = :id")->execute([':status' => $data['status'], ':id' => $id]);
        log_audit($pdo, $staff, 'invoice ' . strtolower($data['status']), 'invoices', $id, null, $data, $data['reason'] ?? null);
        respond(['message' => 'Invoice status updated']);
        break;

    case 'DELETE':
        respond(['error' => 'Invoices cannot be deleted; cancel via PUT instead'], 405);
        break;

    default:
        respond(['error' => 'Method not allowed'], 405);
}
