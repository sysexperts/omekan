<?php

declare(strict_types=1);

namespace Omekan\Database;

use PDO;
use PDOException;

class Connection
{
    private static ?PDO $instance = null;

    private function __construct()
    {
    }

    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            $config = require __DIR__ . '/../../config/database.php';

            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=%s',
                $config['host'],
                $config['name'],
                $config['charset']
            );

            try {
                self::$instance = new PDO(
                    $dsn,
                    $config['user'],
                    $config['pass'],
                    $config['options']
                );
            } catch (PDOException $e) {
                throw new PDOException('Database connection failed: ' . $e->getMessage());
            }
        }

        return self::$instance;
    }

    private function __clone()
    {
    }

    public function __wakeup()
    {
        throw new \Exception('Cannot unserialize singleton');
    }
}
