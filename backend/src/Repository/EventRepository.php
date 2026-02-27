<?php

declare(strict_types=1);

namespace Omekan\Repository;

use Omekan\Database\Connection;
use Omekan\DTO\EventDTO;
use PDO;

class EventRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Connection::getInstance();
    }

    public function findAll(): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, organizer_id, slug, affiliate_url, is_promoted, hero_video_path, created_at 
             FROM events 
             ORDER BY created_at DESC'
        );
        
        $stmt->execute();
        $rows = $stmt->fetchAll();

        return array_map(fn($row) => new EventDTO(
            id: (int) $row['id'],
            organizerId: (int) $row['organizer_id'],
            slug: $row['slug'],
            affiliateUrl: $row['affiliate_url'],
            isPromoted: (bool) $row['is_promoted'],
            heroVideoPath: $row['hero_video_path'],
            createdAt: $row['created_at']
        ), $rows);
    }

    public function findBySlug(string $slug): ?EventDTO
    {
        $stmt = $this->db->prepare(
            'SELECT id, organizer_id, slug, affiliate_url, is_promoted, hero_video_path, created_at 
             FROM events 
             WHERE slug = ?'
        );
        
        $stmt->execute([$slug]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        return new EventDTO(
            id: (int) $row['id'],
            organizerId: (int) $row['organizer_id'],
            slug: $row['slug'],
            affiliateUrl: $row['affiliate_url'],
            isPromoted: (bool) $row['is_promoted'],
            heroVideoPath: $row['hero_video_path'],
            createdAt: $row['created_at']
        );
    }
}
