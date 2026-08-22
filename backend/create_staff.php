<?php
// Run once from the backend/ folder to create a staff login:
//   php create_staff.php "Jane Admin" jane@uptowngarage.com "a-strong-password" administrator
//   php create_staff.php "Sam Manager" sam@uptowngarage.com "another-password" manager
require_once __DIR__ . '/config/database.php';
load_env(__DIR__ . '/.env');

if ($argc < 5) {
    echo "Usage: php create_staff.php \"Full Name\" email@example.com password [administrator|manager]\n";
    exit(1);
}

[$_, $name, $email, $password, $role] = $argv;

if (!in_array($role, ['administrator', 'manager'])) {
    echo "Role must be 'administrator' or 'manager'\n";
    exit(1);
}

$pdo = get_pdo();
$stmt = $pdo->prepare("INSERT INTO staff (name, email, password_hash, role) VALUES (:name, :email, :hash, :role) RETURNING id");
$stmt->execute([
    ':name' => $name, ':email' => $email,
    ':hash' => password_hash($password, PASSWORD_BCRYPT), ':role' => $role,
]);
$id = $stmt->fetch()['id'];
echo "Created staff #$id — $name ($role) — $email\n";
