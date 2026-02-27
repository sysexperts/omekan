<?php

declare(strict_types=1);

namespace Omekan\Repository;

use Omekan\Database\Connection;
use PDO;

class EventCategoryRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Connection::getInstance();
    }

    public function create(int $eventId, int $categoryId): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO event_categories (event_id, category_id) VALUES (?, ?)'
        );
        
        $stmt->execute([$eventId, $categoryId]);
    }

    public function findByEventId(int $eventId): array
    {
        $stmt = $this->db->prepare(
            'SELECT category_id FROM event_categories WHERE event_id = ?'
        );
        
        $stmt->execute([$eventId]);
        
        return array_map(fn($row) => (int) $row['category_id'], $stmt->fetchAll());
    }
}
