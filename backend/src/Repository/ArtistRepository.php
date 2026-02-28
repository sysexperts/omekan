<?php

declare(strict_types=1);

namespace Omekan\Repository;

use Omekan\Database\Connection;
use PDO;

class ArtistRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Connection::getInstance();
    }

    public function findAll(): array
    {
        $stmt = $this->db->query(
            'SELECT id, name, spotify_id, image_path, description 
             FROM artists 
             ORDER BY name ASC'
        );
        
        return $stmt->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, name, spotify_id, image_path, description 
             FROM artists 
             WHERE id = ?'
        );
        
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        
        return $result ?: null;
    }

    public function findByEventId(int $eventId): array
    {
        $stmt = $this->db->prepare(
            'SELECT a.id, a.name, a.spotify_id, a.image_path 
             FROM artists a
             INNER JOIN event_artists ea ON a.id = ea.artist_id
             WHERE ea.event_id = ?
             ORDER BY a.name ASC'
        );
        
        $stmt->execute([$eventId]);
        
        return $stmt->fetchAll();
    }

    public function create(string $name, ?string $spotifyId, ?string $imagePath, ?string $description): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO artists (name, spotify_id, image_path, description) 
             VALUES (?, ?, ?, ?)'
        );
        
        $stmt->execute([$name, $spotifyId, $imagePath, $description]);
        
        return (int) $this->db->lastInsertId();
    }
}
