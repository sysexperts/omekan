<?php

declare(strict_types=1);

namespace Omekan\Repository;

use Omekan\Database\Connection;
use Omekan\DTO\UserDTO;
use PDO;

class UserRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Connection::getInstance();
    }

    public function findByEmail(string $email): ?UserDTO
    {
        $stmt = $this->db->prepare(
            'SELECT id, name, email, role FROM users WHERE email = ?'
        );
        
        $stmt->execute([$email]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        return new UserDTO(
            id: (int) $row['id'],
            name: $row['name'],
            email: $row['email'],
            role: $row['role']
        );
    }

    public function getPasswordHash(string $email): ?string
    {
        $stmt = $this->db->prepare(
            'SELECT password_hash FROM users WHERE email = ?'
        );
        
        $stmt->execute([$email]);
        $row = $stmt->fetch();

        return $row ? $row['password_hash'] : null;
    }

    public function create(string $name, string $email, string $passwordHash, string $role): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
        );
        
        $stmt->execute([$name, $email, $passwordHash, $role]);
        
        return (int) $this->db->lastInsertId();
    }

    public function countUsers(): int
    {
        $stmt = $this->db->query('SELECT COUNT(*) as count FROM users');
        $row = $stmt->fetch();
        
        return (int) $row['count'];
    }
}
