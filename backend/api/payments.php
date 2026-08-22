<?php
require_once __DIR__ . '/../config/bootstrap.php';
$pdo = get_pdo();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM payments WHERE invoice_id = :id ORDER BY paid_at DESC");
            $stmt->execute([':id' => $id]);
            respond($stmt->fetchAll());
        } else {
            respond($pdo->query("SELECT * FROM payments ORDER BY id DESC")->fetchAll());
        }
        break;

    case 'POST':
        // Section 9: balance = total - amount_paid; prevent overpayment beyond balance
        $staff = require_role(['administrator', 'manager'], $pdo);
        $data = json_input();
        foreach (['invoice_id', 'amount'] as $f) if (empty($data[$f])) respond(['error' => "$f is required"], 422);

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("SELECT * FROM invoices WHERE id = :id FOR UPDATE");
            $stmt->execute([':id' => $data['invoice_id']]);
            $invoice = $stmt->fetch();
            if (!$invoice) throw new Exception('Invoice not found');
            if ($invoice['status'] === 'Cancelled') throw new Exception('Cannot pay a cancelled invoice');
            if ($data['amount'] > $invoice['balance']) {
                throw new Exception('Payment exceeds invoice balance — use refund/overpayment handling');
            }

            $pdo->prepare("INSERT INTO payments (invoice_id, amount, method) VALUES (:iid, :amount, :method)")
                ->execute([':iid' => $data['invoice_id'], ':amount' => $data['amount'], ':method' => $data['method'] ?? 'cash']);

            $newPaid = $invoice['amount_paid'] + $data['amount'];
            $newBalance = $invoice['total'] - $newPaid;
            $newStatus = $newBalance <= 0 ? 'Paid' : 'Partially Paid';

            $pdo->prepare("UPDATE invoices SET amount_paid = :paid, balance = :balance, status = :status WHERE id = :id")
                ->execute([':paid' => $newPaid, ':balance' => $newBalance, ':status' => $newStatus, ':id' => $data['invoice_id']]);

            log_audit($pdo, $staff, 'payment recorded', 'invoices', $data['invoice_id'], null, ['amount' => $data['amount']]);
            $pdo->commit();
            respond(['message' => 'Payment recorded', 'invoice_status' => $newStatus, 'balance' => $newBalance], 201);
        } catch (Exception $e) {
            $pdo->rollBack();
            respond(['error' => $e->getMessage()], 422);
        }
        break;

    default:
        respond(['error' => 'Method not allowed'], 405);
}
