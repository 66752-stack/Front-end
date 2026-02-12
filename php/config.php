<?php
/**

Databas Konfiguration
IT-Inventariesystem*/

// Databas inställningar
define('DB_HOST', 'inventory.its.ax');
define('DB_NAME', 'it_inventory');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Skapa PDO-anslutning
function getDatabaseConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;

    } catch (PDOException $e) {
        // Logga felet istället för att visa det direkt
        error_log("Databasanslutning misslyckades: " . $e->getMessage());
        die(json_encode([
            'success' => false,
            'message' => 'Kunde inte ansluta till databasen'
        ]));
    }
}

// Tidszon
date_default_timezone_set('Europe/Stockholm');

// Felhantering
error_reporting(E_ALL);
ini_set('display_errors', 0); // Dölj fel i produktion
ini_set('log_errors', 1);
?>
