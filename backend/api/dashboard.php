<?php
require_once __DIR__ . '/../config/bootstrap.php';
$pdo = get_pdo();
require_role(['administrator', 'manager'], $pdo);

respond([
    'customers' => (int)$pdo->query("SELECT COUNT(*) c FROM customers")->fetch()['c'],
    'vehicles' => (int)$pdo->query("SELECT COUNT(*) c FROM vehicles")->fetch()['c'],
    'pending_appointments' => (int)$pdo->query("SELECT COUNT(*) c FROM appointments WHERE status='Pending'")->fetch()['c'],
    'active_jobs' => (int)$pdo->query("SELECT COUNT(*) c FROM jobs WHERE status NOT IN ('Collected')")->fetch()['c'],
    'jobs_awaiting_approval' => (int)$pdo->query("SELECT COUNT(*) c FROM jobs WHERE status='Awaiting Approval'")->fetch()['c'],
    'low_stock_parts' => (int)$pdo->query("SELECT COUNT(*) c FROM parts WHERE quantity <= min_stock")->fetch()['c'],
    'pending_orders' => (int)$pdo->query("SELECT COUNT(*) c FROM orders WHERE status='Pending'")->fetch()['c'],
    'unpaid_invoices' => (int)$pdo->query("SELECT COUNT(*) c FROM invoices WHERE status IN ('Unpaid','Partially Paid')")->fetch()['c'],
    'revenue_collected' => (float)$pdo->query("SELECT COALESCE(SUM(amount_paid),0) s FROM invoices")->fetch()['s'],
]);
