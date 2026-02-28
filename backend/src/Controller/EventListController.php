<?php

declare(strict_types=1);

namespace Omekan\Controller;

use Omekan\Database\Connection;

class EventListController
{
    public function index(): void
    {
        $language = $_GET['language'] ?? 'de';
        $db = Connection::getInstance();
        
        $stmt = $db->prepare(
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
        $events = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        $result = [];
        foreach ($events as $event) {
            // Communities laden
            $commStmt = $db->prepare(
                'SELECT c.id, c.name, c.slug 
                 FROM communities c
                 INNER JOIN event_communities ec ON c.id = ec.community_id
                 WHERE ec.event_id = ?'
            );
            $commStmt->execute([$event['id']]);
            $communities = $commStmt->fetchAll(\PDO::FETCH_ASSOC);
            
            // Categories laden
            $catStmt = $db->prepare(
                'SELECT c.id, c.name, c.slug 
                 FROM categories c
                 INNER JOIN event_categories ec ON c.id = ec.category_id
                 WHERE ec.event_id = ?'
            );
            $catStmt->execute([$event['id']]);
            $categories = $catStmt->fetchAll(\PDO::FETCH_ASSOC);
            
            $result[] = [
                'id' => (int) $event['id'],
                'slug' => $event['slug'],
                'title' => $event['title'],
                'location_name' => $event['location_name'] ?? '',
                'start_datetime' => $event['start_datetime'] ?? '',
                'hero_video_path' => $event['is_promoted'] ? $event['hero_video_path'] : null,
                'image_path' => $event['image_path'],
                'communities' => $communities,
                'categories' => $categories
            ];
        }
        
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => $result
        ]);
    }
}
