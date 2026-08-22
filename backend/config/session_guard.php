<?php
// Call require_role() at the top of any endpoint action that only administrators
// or managers should reach. This is enforced server-side — hiding a button in the
// UI is not access control; this is. (Section 14: "Unauthorized role accesses
// administration function -> Deny action and record security event.")

function current_staff() {
    if (empty($_SESSION['staff_id'])) return null;
    return [
        'id' => $_SESSION['staff_id'],
        'name' => $_SESSION['staff_name'],
        'role' => $_SESSION['staff_role'],
    ];
}

function require_role(array $allowedRoles, $pdo = null) {
    $staff = current_staff();
    if (!$staff) {
        if ($pdo) {
            $stmt = $pdo->prepare("INSERT INTO audit_log (user_role, action, affected_table, reason) VALUES ('anonymous', 'unauthorized access attempt', :path, 'no active session')");
            $stmt->execute([':path' => $_SERVER['REQUEST_URI'] ?? 'unknown']);
        }
        respond(['error' => 'Not logged in. Staff login required.'], 401);
    }
    if (!in_array($staff['role'], $allowedRoles)) {
        if ($pdo) {
            $stmt = $pdo->prepare("INSERT INTO audit_log (user_role, action, affected_table, reason) VALUES (:role, 'unauthorized access attempt', :path, :reason)");
            $stmt->execute([
                ':role' => $staff['role'], ':path' => $_SERVER['REQUEST_URI'] ?? 'unknown',
                ':reason' => "requires one of: " . implode(',', $allowedRoles),
            ]);
        }
        respond(['error' => 'You do not have permission to perform this action.'], 403);
    }
    return $staff;
}
