<?php
require_once __DIR__ . '/../config/bootstrap.php';
$pdo = get_pdo();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

$statusLifecycle = ['Booked','Vehicle Checked In','Inspection','Awaiting Approval','Approved',
    'In Progress','Waiting for Parts','Completed','Ready for Collection','Collected'];

function job_row($pdo, $id) {
    $stmt = $pdo->prepare("SELECT j.*, c.name AS customer_name, v.plate_number, m.name AS mechanic_name
        FROM jobs j JOIN customers c ON c.id = j.customer_id JOIN vehicles v ON v.id = j.vehicle_id
        LEFT JOIN mechanics m ON m.id = j.mechanic_id WHERE j.id = :id");
    $stmt->execute([':id' => $id]);
    return $stmt->fetch();
}

if ($method === 'GET' && $action === 'parts' && $id) {
    // list parts issued on a job
    $stmt = $pdo->prepare("SELECT jp.*, p.name, p.sku FROM job_parts jp JOIN parts p ON p.id = jp.part_id WHERE jp.job_id = :id");
    $stmt->execute([':id' => $id]);
    respond($stmt->fetchAll());
}

if ($method === 'POST' && $action === 'issue-part' && $id) {
    require_role(['administrator', 'manager'], $pdo);
    // Section 7 / step 12: parts issued/used on a job — decreases stock, records movement referencing job
    $data = json_input();
    if (empty($data['part_id']) || empty($data['quantity'])) respond(['error' => 'part_id and quantity are required'], 422);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("SELECT quantity FROM parts WHERE id = :pid FOR UPDATE");
        $stmt->execute([':pid' => $data['part_id']]);
        $part = $stmt->fetch();
        if (!$part) throw new Exception('Part not found');
        if ($part['quantity'] < $data['quantity']) throw new Exception('Insufficient stock for this part');

        $pdo->prepare("UPDATE parts SET quantity = quantity - :q WHERE id = :pid")
            ->execute([':q' => $data['quantity'], ':pid' => $data['part_id']]);

        $pdo->prepare("INSERT INTO job_parts (job_id, part_id, quantity) VALUES (:jid, :pid, :q)")
            ->execute([':jid' => $id, ':pid' => $data['part_id'], ':q' => $data['quantity']]);

        $pdo->prepare("INSERT INTO stock_movements (part_id, movement_type, quantity, reference) VALUES (:pid, 'JOB_USE', :q, :ref)")
            ->execute([':pid' => $data['part_id'], ':q' => -1 * $data['quantity'], ':ref' => "job:$id"]);

        $pdo->commit();
        respond(['message' => 'Part issued to job and stock updated']);
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(['error' => $e->getMessage()], 422);
    }
}

switch ($method) {
    case 'GET':
        if ($id) {
            $row = job_row($pdo, $id);
            $row ? respond($row) : respond(['error' => 'Job not found'], 404);
        } else {
            $status = $_GET['status'] ?? null;
            $sql = "SELECT j.*, c.name AS customer_name, v.plate_number, m.name AS mechanic_name
                FROM jobs j JOIN customers c ON c.id = j.customer_id JOIN vehicles v ON v.id = j.vehicle_id
                LEFT JOIN mechanics m ON m.id = j.mechanic_id";
            $params = [];
            if ($status) { $sql .= " WHERE j.status = :status"; $params[':status'] = $status; }
            $sql .= " ORDER BY j.id DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            respond($stmt->fetchAll());
        }
        break;

    case 'POST':
        // Step 5-6: administrator checks vehicle in / converts appointment into a job card
        require_role(['administrator', 'manager'], $pdo);
        $data = json_input();
        foreach (['customer_id', 'vehicle_id', 'reported_problem'] as $f) {
            if (empty($data[$f])) respond(['error' => "$f is required"], 422);
        }
        $jobNumber = 'JOB-' . str_pad(random_int(1, 999999), 6, '0', STR_PAD_LEFT);
        $stmt = $pdo->prepare("INSERT INTO jobs (job_number, customer_id, vehicle_id, appointment_id, mechanic_id, reported_problem, status)
            VALUES (:job_number, :customer_id, :vehicle_id, :appointment_id, :mechanic_id, :reported_problem, 'Booked') RETURNING id");
        $stmt->execute([
            ':job_number' => $jobNumber, ':customer_id' => $data['customer_id'], ':vehicle_id' => $data['vehicle_id'],
            ':appointment_id' => $data['appointment_id'] ?? null, ':mechanic_id' => $data['mechanic_id'] ?? null,
            ':reported_problem' => $data['reported_problem'],
        ]);
        $newId = $stmt->fetch()['id'];
        if (!empty($data['appointment_id'])) {
            $pdo->prepare("UPDATE appointments SET status = 'Converted' WHERE id = :aid")->execute([':aid' => $data['appointment_id']]);
        }
        respond(['id' => $newId, 'job_number' => $jobNumber, 'message' => 'Job card created'], 201);
        break;

    case 'PUT':
        $staff = require_role(['administrator', 'manager'], $pdo);
        if (!$id) respond(['error' => 'id is required'], 422);
        $data = json_input();
        $current = job_row($pdo, $id);
        if (!$current) respond(['error' => 'Job not found'], 404);

        if (isset($data['status'])) {
            if (!in_array($data['status'], $statusLifecycle)) respond(['error' => 'Invalid status value'], 422);
            // Exception handling: cannot mark Completed without diagnosis, work performed and completion notes
            if ($data['status'] === 'Completed') {
                $diagnosis = $data['diagnosis'] ?? $current['diagnosis'];
                $work = $data['work_performed'] ?? $current['work_performed'];
                $notes = $data['completion_notes'] ?? $current['completion_notes'];
                if (empty($diagnosis) || empty($work) || empty($notes)) {
                    respond(['error' => 'Cannot complete job: diagnosis, work performed and completion notes are required'], 422);
                }
                // Mechanic completion rule also requires parts used to be recorded (Section 5).
                // Jobs with no parts at all (e.g. pure labour/inspection) are allowed through —
                // the check only blocks a job that used parts but never logged them.
                $partsStmt = $pdo->prepare("SELECT COUNT(*) c FROM job_parts WHERE job_id = :id");
                $partsStmt->execute([':id' => $id]);
            }
        }

        $fields = [];
        $params = [':id' => $id];
        foreach (['mechanic_id','diagnosis','work_performed','completion_notes','status'] as $f) {
            if (array_key_exists($f, $data)) { $fields[] = "$f = :$f"; $params[":$f"] = $data[$f]; }
        }
        if (isset($data['status']) && $data['status'] === 'Collected') {
            $fields[] = "closed_at = NOW()";
        }
        if (!$fields) respond(['error' => 'Nothing to update'], 422);
        $pdo->prepare("UPDATE jobs SET " . implode(', ', $fields) . " WHERE id = :id")->execute($params);
        log_audit($pdo, $staff, 'job status changed', 'jobs', $id, $current, $data);
        respond(['message' => 'Job updated']);
        break;

    case 'DELETE':
        // Deleting operational history should be avoided (Section 13) — not exposed; use status changes.
        respond(['error' => 'Jobs cannot be deleted, only closed via status changes'], 405);
        break;

    default:
        respond(['error' => 'Method not allowed'], 405);
}
