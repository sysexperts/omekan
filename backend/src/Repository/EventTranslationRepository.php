<?php

declare(strict_types=1);

namespace Omekan\Repository;

use Omekan\Database\Connection;
use Omekan\DTO\EventTranslationDTO;
use PDO;

class EventTranslationRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Connection::getInstance();
    }

    public function create(int $eventId, string $language, string $title, ?string $description, ?string $locationName): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO event_translations (event_id, language, title, description, location_name) 
             VALUES (?, ?, ?, ?, ?)'
        );
        
        $stmt->execute([$eventId, $language, $title, $description, $locationName]);
        
        return (int) $this->db->lastInsertId();
    }

    public function findByEventId(int $eventId): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, event_id, language, title, description, location_name 
             FROM event_translations 
             WHERE event_id = ?'
        );
        
        $stmt->execute([$eventId]);
        $rows = $stmt->fetchAll();

        return array_map(fn($row) => new EventTranslationDTO(
            id: (int) $row['id'],
            eventId: (int) $row['event_id'],
            language: $row['language'],
            title: $row['title'],
            description: $row['description'],
            locationName: $row['location_name']
        ), $rows);
    }
}
