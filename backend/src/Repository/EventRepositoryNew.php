<?php

declare(strict_types=1);

namespace Omekan\Repository;

use Omekan\Database\Connection;
use Omekan\DTO\EventListDTO;
use Omekan\DTO\EventDetailDTO;
use PDO;

class EventRepositoryNew
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Connection::getInstance();
    }

    public function findAllForList(string $language = 'de'): array
    {
        $stmt = $this->db->prepare(
            'SELECT 
                e.id,
                e.slug,
                e.is_promoted,
                e.hero_video_path,
                e.image_path,
                et.title,
                et.location_name,
                MIN(eo.start_datetime) as start_datetime
             FROM events e
             INNER JOIN event_translations et ON e.id = et.event_id
             LEFT JOIN event_occurrences eo ON e.id = eo.event_id AND eo.is_cancelled = 0
             WHERE et.language = ?
             GROUP BY e.id, e.slug, e.is_promoted, e.hero_video_path, e.image_path, et.title, et.location_name
             ORDER BY start_datetime ASC'
        );
        
        $stmt->execute([$language]);
        $events = $stmt->fetchAll();
        
        $result = [];
        foreach ($events as $event) {
            $communities = $this->getEventCommunities((int) $event['id']);
            $categories = $this->getEventCategories((int) $event['id']);
            
            $result[] = new EventListDTO(
                id: (int) $event['id'],
                slug: $event['slug'],
                title: $event['title'],
                location_name: $event['location_name'] ?? '',
                start_datetime: $event['start_datetime'] ?? '',
                hero_video_path: $event['is_promoted'] ? $event['hero_video_path'] : null,
                image_path: $event['image_path'],
                communities: $communities,
                categories: $categories
            );
        }
        
        return $result;
    }

    public function findBySlugForDetail(string $slug, string $language = 'de'): ?EventDetailDTO
    {
        $stmt = $this->db->prepare(
            'SELECT 
                e.id,
                e.slug,
                e.is_promoted,
                e.hero_video_path,
                e.image_path,
                e.affiliate_url,
                et.title,
                et.description,
                et.location_name,
                o.display_name as organizer_name
             FROM events e
             INNER JOIN event_translations et ON e.id = et.event_id
             INNER JOIN organizers o ON e.organizer_id = o.id
             WHERE e.slug = ? AND et.language = ?'
        );
        
        $stmt->execute([$slug, $language]);
        $event = $stmt->fetch();
        
        if (!$event) {
            return null;
        }
        
        $eventId = (int) $event['id'];
        
        $occurrences = $this->getEventOccurrences($eventId);
        $artists = $this->getEventArtists($eventId);
        $communities = $this->getEventCommunities($eventId);
        $categories = $this->getEventCategories($eventId);
        
        return new EventDetailDTO(
            id: $eventId,
            slug: $event['slug'],
            title: $event['title'],
            description: $event['description'],
            location_name: $event['location_name'] ?? '',
            hero_video_path: $event['is_promoted'] ? $event['hero_video_path'] : null,
            image_path: $event['image_path'],
            affiliate_url: $event['affiliate_url'],
            is_promoted: (bool) $event['is_promoted'],
            occurrences: $occurrences,
            artists: $artists,
            communities: $communities,
            categories: $categories,
            organizer_name: $event['organizer_name']
        );
    }

    private function getEventOccurrences(int $eventId): array
    {
        $stmt = $this->db->prepare(
            'SELECT start_datetime, end_datetime, is_cancelled
             FROM event_occurrences
             WHERE event_id = ?
             ORDER BY start_datetime ASC'
        );
        
        $stmt->execute([$eventId]);
        
        return $stmt->fetchAll();
    }

    private function getEventArtists(int $eventId): array
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

    private function getEventCommunities(int $eventId): array
    {
        $stmt = $this->db->prepare(
            'SELECT c.id, c.name, c.slug
             FROM communities c
             INNER JOIN event_communities ec ON c.id = ec.community_id
             WHERE ec.event_id = ?'
        );
        
        $stmt->execute([$eventId]);
        
        return $stmt->fetchAll();
    }

    private function getEventCategories(int $eventId): array
    {
        $stmt = $this->db->prepare(
            'SELECT c.id, c.name, c.slug
             FROM categories c
             INNER JOIN event_categories ec ON c.id = ec.category_id
             WHERE ec.event_id = ?'
        );
        
        $stmt->execute([$eventId]);
        
        return $stmt->fetchAll();
    }

    public function findByIdForDetail(int $id, string $language = 'de'): ?array
    {
        // Erst Event-Basis-Daten laden
        $stmt = $this->db->prepare(
            'SELECT 
                id,
                organizer_id,
                slug,
                affiliate_url,
                is_promoted,
                hero_video_path,
                image_path,
                created_at
             FROM events 
             WHERE id = ?'
        );
        
        $stmt->execute([$id]);
        $eventData = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$eventData) {
            return null;
        }
        
        // Übersetzung laden (falls vorhanden)
        $stmt = $this->db->prepare(
            'SELECT title, description, location_name 
             FROM event_translations 
             WHERE event_id = ? AND language = ?'
        );
        $stmt->execute([$id, $language]);
        $translation = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        // Übersetzung zu Event-Daten hinzufügen
        if ($translation) {
            $eventData['title'] = $translation['title'];
            $eventData['description'] = $translation['description'];
            $eventData['location_name'] = $translation['location_name'];
        } else {
            // Fallback wenn keine Übersetzung vorhanden
            $eventData['title'] = $eventData['slug'];
            $eventData['description'] = null;
            $eventData['location_name'] = null;
        }
        
        // Communities laden
        $stmt = $this->db->prepare(
            'SELECT c.id, c.name, c.slug 
             FROM communities c
             INNER JOIN event_communities ec ON c.id = ec.community_id
             WHERE ec.event_id = ?'
        );
        $stmt->execute([$id]);
        $eventData['communities'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Categories laden
        $stmt = $this->db->prepare(
            'SELECT c.id, c.name, c.slug 
             FROM categories c
             INNER JOIN event_categories ec ON c.id = ec.category_id
             WHERE ec.event_id = ?'
        );
        $stmt->execute([$id]);
        $eventData['categories'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Artists laden
        $stmt = $this->db->prepare(
            'SELECT a.id, a.name, a.spotify_id, a.image_path 
             FROM artists a
             INNER JOIN event_artists ea ON a.id = ea.artist_id
             WHERE ea.event_id = ?'
        );
        $stmt->execute([$id]);
        $eventData['artists'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Occurrences laden
        $stmt = $this->db->prepare(
            'SELECT id, start_datetime, end_datetime, is_cancelled 
             FROM event_occurrences 
             WHERE event_id = ? 
             ORDER BY start_datetime ASC'
        );
        $stmt->execute([$id]);
        $eventData['occurrences'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Direkt Array zurückgeben
        return $eventData;
    }

    public function create(int $organizerId, string $slug, ?string $affiliateUrl, bool $isPromoted, ?string $heroVideoPath, ?string $imagePath): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO events (organizer_id, slug, affiliate_url, is_promoted, hero_video_path, image_path) 
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        
        $stmt->execute([$organizerId, $slug, $affiliateUrl, $isPromoted ? 1 : 0, $heroVideoPath, $imagePath]);
        
        return (int) $this->db->lastInsertId();
    }

    public function createTranslation(int $eventId, string $language, string $title, ?string $description, ?string $locationName): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO event_translations (event_id, language, title, description, location_name) 
             VALUES (?, ?, ?, ?, ?)'
        );
        
        $stmt->execute([$eventId, $language, $title, $description, $locationName]);
    }

    public function createOccurrence(int $eventId, string $startDatetime, string $endDatetime): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO event_occurrences (event_id, start_datetime, end_datetime) 
             VALUES (?, ?, ?)'
        );
        
        $stmt->execute([$eventId, $startDatetime, $endDatetime]);
    }

    public function linkArtist(int $eventId, int $artistId): void
    {
        $stmt = $this->db->prepare(
            'INSERT IGNORE INTO event_artists (event_id, artist_id) 
             VALUES (?, ?)'
        );
        
        $stmt->execute([$eventId, $artistId]);
    }

    public function linkCommunity(int $eventId, int $communityId): void
    {
        $stmt = $this->db->prepare(
            'INSERT IGNORE INTO event_communities (event_id, community_id) 
             VALUES (?, ?)'
        );
        
        $stmt->execute([$eventId, $communityId]);
    }

    public function linkCategory(int $eventId, int $categoryId): void
    {
        $stmt = $this->db->prepare(
            'INSERT IGNORE INTO event_categories (event_id, category_id) 
             VALUES (?, ?)'
        );
        
        $stmt->execute([$eventId, $categoryId]);
    }

    public function update(int $eventId, string $slug, ?string $affiliateUrl, bool $isPromoted, ?string $heroVideoPath, ?string $imagePath): void
    {
        $stmt = $this->db->prepare(
            'UPDATE events 
             SET slug = ?, affiliate_url = ?, is_promoted = ?, hero_video_path = ?, image_path = ?
             WHERE id = ?'
        );
        
        $stmt->execute([$slug, $affiliateUrl, $isPromoted ? 1 : 0, $heroVideoPath, $imagePath, $eventId]);
    }

    public function updateTranslation(int $eventId, string $language, string $title, ?string $description, ?string $locationName): void
    {
        $stmt = $this->db->prepare(
            'UPDATE event_translations 
             SET title = ?, description = ?, location_name = ?
             WHERE event_id = ? AND language = ?'
        );
        
        $stmt->execute([$title, $description, $locationName, $eventId, $language]);
    }

    public function updateCommunities(int $eventId, array $communityIds): void
    {
        $stmt = $this->db->prepare('DELETE FROM event_communities WHERE event_id = ?');
        $stmt->execute([$eventId]);
        
        if (!empty($communityIds)) {
            $stmt = $this->db->prepare('INSERT INTO event_communities (event_id, community_id) VALUES (?, ?)');
            foreach ($communityIds as $communityId) {
                $stmt->execute([$eventId, (int)$communityId]);
            }
        }
    }

    public function updateCategories(int $eventId, array $categoryIds): void
    {
        $stmt = $this->db->prepare('DELETE FROM event_categories WHERE event_id = ?');
        $stmt->execute([$eventId]);
        
        if (!empty($categoryIds)) {
            $stmt = $this->db->prepare('INSERT INTO event_categories (event_id, category_id) VALUES (?, ?)');
            foreach ($categoryIds as $categoryId) {
                $stmt->execute([$eventId, (int)$categoryId]);
            }
        }
    }

    public function updateArtists(int $eventId, array $artistIds): void
    {
        $stmt = $this->db->prepare('DELETE FROM event_artists WHERE event_id = ?');
        $stmt->execute([$eventId]);
        
        if (!empty($artistIds)) {
            $stmt = $this->db->prepare('INSERT INTO event_artists (event_id, artist_id) VALUES (?, ?)');
            foreach ($artistIds as $artistId) {
                $stmt->execute([$eventId, (int)$artistId]);
            }
        }
    }

    public function delete(int $eventId): bool
    {
        try {
            $stmt = $this->db->prepare('DELETE FROM event_communities WHERE event_id = ?');
            $stmt->execute([$eventId]);
            
            $stmt = $this->db->prepare('DELETE FROM event_categories WHERE event_id = ?');
            $stmt->execute([$eventId]);
            
            $stmt = $this->db->prepare('DELETE FROM event_artists WHERE event_id = ?');
            $stmt->execute([$eventId]);
            
            $stmt = $this->db->prepare('DELETE FROM event_occurrences WHERE event_id = ?');
            $stmt->execute([$eventId]);
            
            $stmt = $this->db->prepare('DELETE FROM event_translations WHERE event_id = ?');
            $stmt->execute([$eventId]);
            
            $stmt = $this->db->prepare('DELETE FROM events WHERE id = ?');
            $stmt->execute([$eventId]);
            
            return $stmt->rowCount() > 0;
        } catch (\PDOException $e) {
            error_log("Error deleting event: " . $e->getMessage());
            return false;
        }
    }
}
