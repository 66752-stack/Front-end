<?php
/**
 * Databas Konfiguration
 * IT-Inventariesystem (PostgreSQL-version)
 */

// Databas inställningar
define('DB_HOST', 'database.its.ax');
define('DB_NAME', 'it_inventory');
define('DB_USER', 'database');
define('DB_PASS', 'database');
define('DB_CHARSET', 'utf8'); // PostgreSQL använder 'client_encoding' istället för charset i DSN

// Skapa PDO-anslutning
function getDatabaseConnection() {
    try {
        // PostgreSQL DSN-format
        $dsn = "pgsql:host=" . DB_HOST . ";dbname=" . DB_NAME;

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

        // Sätt teckenkodning för sessionen
        $pdo->exec("SET NAMES 'UTF8'");

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