<?php

declare(strict_types=1);

namespace Omekan\Repository;

use Omekan\Database\Connection;
use PDO;

class EventCommunityRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Connection::getInstance();
    }

    public function create(int $eventId, int $communityId): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO event_communities (event_id, community_id) VALUES (?, ?)'
        );
        
        $stmt->execute([$eventId, $communityId]);
    }

    public function findByEventId(int $eventId): array
    {
        $stmt = $this->db->prepare(
            'SELECT community_id FROM event_communities WHERE event_id = ?'
        );
        
        $stmt->execute([$eventId]);
        
        return array_map(fn($row) => (int) $row['community_id'], $stmt->fetchAll());
    }
}
