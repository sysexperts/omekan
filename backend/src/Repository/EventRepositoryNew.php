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

    public function create(int $organizerId, string $slug, ?string $affiliateUrl, bool $isPromoted, ?string $heroVideoPath, ?string $imagePath): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO events (organizer_id, slug, affiliate_url, is_promoted, hero_video_path, image_path) 
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        
        $stmt->execute([$organizerId, $slug, $affiliateUrl, $isPromoted, $heroVideoPath, $imagePath]);
        
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
}
