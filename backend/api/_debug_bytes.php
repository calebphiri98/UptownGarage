<?php
$f = fopen(__DIR__ . "/auth.php", "rb");
$bytes = fread($f, 10);
fclose($f);
foreach (str_split($bytes) as $b) {
    printf("%02X ", ord($b));
}
