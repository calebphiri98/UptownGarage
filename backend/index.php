<?php
require_once __DIR__ . '/config/bootstrap.php';
respond([
    'message' => 'Uptown Garage API is running',
    'endpoints' => [
        '/api/customers.php', '/api/auth.php?action=login', '/api/vehicles.php',
        '/api/mechanics.php', '/api/appointments.php', '/api/jobs.php',
        '/api/parts.php', '/api/orders.php', '/api/invoices.php',
        '/api/payments.php', '/api/dashboard.php',
    ],
]);
