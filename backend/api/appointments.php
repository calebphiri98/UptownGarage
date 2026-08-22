<?php
require_once __DIR__ . '/../config/bootstrap.php';
$pdo = get_pdo();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$customerId = $_GET['customer_id'] ?? null;

$validStatuses = ['Pending', 'Confirmed', 'Arrived', 'Converted', 'Cancelled', 'No-show'];

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $pdo->prepare("SELECT a.*, c.name AS customer_name, v.plate_number FROM appointments a
                JOIN customers c ON c.id = a.customer_id JOIN vehicles v ON v.id = a.vehicle_id WHERE a.id = :id");
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch();
            $row ? respond($row) : respond(['error' => 'Appointment not found'], 404);
        } elseif ($customerId) {
            // A customer viewing their own bookings — no staff login required, but
            // scoped strictly to their own records (Section 14: no cross-customer access).
            $stmt = $pdo->prepare("SELECT a.*, c.name AS customer_name, v.plate_number FROM appointments a
                JOIN customers c ON c.id = a.customer_id JOIN vehicles v ON v.id = a.vehicle_id
                WHERE a.customer_id = :cid ORDER BY a.id DESC");
            $stmt->execute([':cid' => $customerId]);
            respond($stmt->fetchAll());
        } else {
            // Full list (every customer's appointments) is staff-only.
            require_role(['administrator', 'manager'], $pdo);
            respond($pdo->query("SELECT a.*, c.name AS customer_name, v.plate_number FROM appointments a
                JOIN customers c ON c.id = a.customer_id JOIN vehicles v ON v.id = a.vehicle_id ORDER BY a.id DESC")->fetchAll());
        }
        break;

    case 'POST':
        $data = json_input();
        foreach (['customer_id', 'vehicle_id', 'service_type', 'requested_date'] as $f) {
            if (empty($data[$f])) respond(['error' => "$f is required"], 422);
        }
        $stmt = $pdo->prepare("INSERT INTO appointments (customer_id, vehicle_id, service_type, requested_date, status)
            VALUES (:customer_id, :vehicle_id, :service_type, :requested_date, 'Pending') RETURNING id");
        $stmt->execute([
            ':customer_id' => $data['customer_id'], ':vehicle_id' => $data['vehicle_id'],
            ':service_type' => $data['service_type'], ':requested_date' => $data['requested_date'],
        ]);
        respond(['id' => $stmt->fetch()['id'], 'message' => 'Appointment requested (Pending)'], 201);
        break;

    case 'PUT':
        // Rule 4: only the Garage Administrator (or Manager overseeing) may confirm/reschedule/cancel.
        $staff = require_role(['administrator', 'manager'], $pdo);
        if (!$id) respond(['error' => 'id is required'], 422);
        $data = json_input();
        if (isset($data['status']) && !in_array($data['status'], $validStatuses)) {
            respond(['error' => 'Invalid status value'], 422);
        }
        $fields = [];
        $params = [':id' => $id];
        foreach (['service_type', 'requested_date', 'status'] as $f) {
            if (isset($data[$f])) { $fields[] = "$f = :$f"; $params[":$f"] = $data[$f]; }
        }
        if (!$fields) respond(['error' => 'Nothing to update'], 422);
        $pdo->prepare("UPDATE appointments SET " . implode(', ', $fields) . " WHERE id = :id")->execute($params);
        log_audit($pdo, $staff, 'appointment updated', 'appointments', $id, null, $data);
        respond(['message' => 'Appointment updated']);
        break;

    case 'DELETE':
        require_role(['administrator', 'manager'], $pdo);
        if (!$id) respond(['error' => 'id is required'], 422);
        $pdo->prepare("DELETE FROM appointments WHERE id = :id")->execute([':id' => $id]);
        respond(['message' => 'Appointment deleted']);
        break;

    default:
        respond(['error' => 'Method not allowed'], 405);
}
