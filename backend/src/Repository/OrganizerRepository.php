<?php

declare(strict_types=1);

namespace Omekan\Repository;

use Omekan\Database\Connection;
use Omekan\DTO\OrganizerDTO;
use PDO;

class OrganizerRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Connection::getInstance();
    }

    public function create(int $userId, string $displayName, ?string $website = null): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO organizers (user_id, display_name, website, is_partner, token_balance) 
             VALUES (?, ?, ?, 0, 0)'
        );
        
        $stmt->execute([$userId, $displayName, $website]);
        
        return (int) $this->db->lastInsertId();
    }

    public function findByUserId(int $userId): ?OrganizerDTO
    {
        $stmt = $this->db->prepare(
            'SELECT id, user_id, display_name, website, is_partner, token_balance 
             FROM organizers 
             WHERE user_id = ?'
        );
        
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        return new OrganizerDTO(
            id: (int) $row['id'],
            userId: (int) $row['user_id'],
            displayName: $row['display_name'],
            website: $row['website'],
            isPartner: (bool) $row['is_partner'],
            tokenBalance: (int) $row['token_balance']
        );
    }

    public function findById(int $id): ?OrganizerDTO
    {
        $stmt = $this->db->prepare(
            'SELECT id, user_id, display_name, website, is_partner, token_balance 
             FROM organizers 
             WHERE id = ?'
        );
        
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        return new OrganizerDTO(
            id: (int) $row['id'],
            userId: (int) $row['user_id'],
            displayName: $row['display_name'],
            website: $row['website'],
            isPartner: (bool) $row['is_partner'],
            tokenBalance: (int) $row['token_balance']
        );
    }

    public function findAll(): array
    {
        $stmt = $this->db->query(
            'SELECT id, user_id, display_name, website, is_partner, token_balance 
             FROM organizers 
             ORDER BY id DESC'
        );
        
        $rows = $stmt->fetchAll();
        
        return array_map(fn($row) => new OrganizerDTO(
            id: (int) $row['id'],
            userId: (int) $row['user_id'],
            displayName: $row['display_name'],
            website: $row['website'],
            isPartner: (bool) $row['is_partner'],
            tokenBalance: (int) $row['token_balance']
        ), $rows);
    }
}
