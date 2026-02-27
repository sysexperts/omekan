<?php

declare(strict_types=1);

namespace Omekan\Repository;

use Omekan\Database\Connection;
use Omekan\DTO\EventOccurrenceDTO;
use PDO;

class EventOccurrenceRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Connection::getInstance();
    }

    public function create(int $eventId, string $startDatetime, string $endDatetime): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO event_occurrences (event_id, start_datetime, end_datetime, is_cancelled) 
             VALUES (?, ?, ?, 0)'
        );
        
        $stmt->execute([$eventId, $startDatetime, $endDatetime]);
        
        return (int) $this->db->lastInsertId();
    }

    public function findByEventId(int $eventId): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, event_id, start_datetime, end_datetime, is_cancelled 
             FROM event_occurrences 
             WHERE event_id = ? 
             ORDER BY start_datetime ASC'
        );
        
        $stmt->execute([$eventId]);
        $rows = $stmt->fetchAll();

        return array_map(fn($row) => new EventOccurrenceDTO(
            id: (int) $row['id'],
            eventId: (int) $row['event_id'],
            startDatetime: $row['start_datetime'],
            endDatetime: $row['end_datetime'],
            isCancelled: (bool) $row['is_cancelled']
        ), $rows);
    }
}
