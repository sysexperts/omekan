<?php
// Enhanced Event Search API Endpoint
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../src/Database/Connection.php';

try {
    $db = \Omekan\Database\Connection::getInstance();
    
    // Get search parameters
    $search = $_GET['q'] ?? '';
    $community = $_GET['community'] ?? '';
    $category = $_GET['category'] ?? '';
    $date = $_GET['date'] ?? '';
    $limit = min((int)($_GET['limit'] ?? 20), 50); // Max 50 results
    $offset = (int)($_GET['offset'] ?? 0);
    $sort = $_GET['sort'] ?? 'date';
    
    // Build base query
    $sql = "SELECT DISTINCT
                e.id,
                e.organizer_id,
                e.slug,
                e.affiliate_url,
                e.is_promoted,
                e.hero_video_path,
                e.image_path,
                e.created_at,
                COALESCE(et.title, e.slug) as title,
                et.description,
                et.location_name,
                eo.start_datetime,
                eo.end_datetime
            FROM events e
            LEFT JOIN event_translations et ON e.id = et.event_id AND et.language = 'de'
            LEFT JOIN event_occurrences eo ON e.id = eo.event_id
            LEFT JOIN event_communities ec ON e.id = ec.event_id
            LEFT JOIN event_categories ecat ON e.id = ecat.event_id
            WHERE 1=1";
    
    $params = [];
    
    // Add search filter
    if (!empty($search)) {
        $sql .= " AND (
            LOWER(et.title) LIKE LOWER(?) OR 
            LOWER(et.description) LIKE LOWER(?) OR 
            LOWER(et.location_name) LIKE LOWER(?) OR
            LOWER(e.slug) LIKE LOWER(?)
        )";
        $searchTerm = "%{$search}%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    // Add community filter
    if (!empty($community)) {
        $sql .= " AND ec.community_id = ?";
        $params[] = $community;
    }
    
    // Add category filter
    if (!empty($category)) {
        $sql .= " AND ecat.category_id = ?";
        $params[] = $category;
    }
    
    // Add date filter
    if (!empty($date)) {
        $sql .= " AND DATE(eo.start_datetime) = ?";
        $params[] = $date;
    }
    
    // Add sorting
    switch ($sort) {
        case 'title':
            $sql .= " ORDER BY et.title ASC";
            break;
        case 'location':
            $sql .= " ORDER BY et.location_name ASC";
            break;
        case 'date':
        default:
            $sql .= " ORDER BY eo.start_datetime ASC";
            break;
    }
    
    // Add pagination
    $sql .= " LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get total count for pagination
    $countSql = str_replace('SELECT DISTINCT e.id, e.organizer_id, e.slug, e.affiliate_url, e.is_promoted, e.hero_video_path, e.image_path, e.created_at, COALESCE(et.title, e.slug) as title, et.description, et.location_name, eo.start_datetime, eo.end_datetime', 'SELECT COUNT(DISTINCT e.id)', $sql);
    $countSql = str_replace(" LIMIT ? OFFSET ?", "", $countSql);
    array_pop($params); // Remove offset
    array_pop($params); // Remove limit
    
    $countStmt = $db->prepare($countSql);
    $countStmt->execute($params);
    $totalCount = $countStmt->fetchColumn();
    
    // Enhance events with related data
    foreach ($events as &$event) {
        // Get communities
        $commStmt = $db->prepare("
            SELECT c.id, c.name, c.slug, c.flag_emoji 
            FROM communities c
            INNER JOIN event_communities ec ON c.id = ec.community_id
            WHERE ec.event_id = ?
        ");
        $commStmt->execute([$event['id']]);
        $event['communities'] = $commStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get categories
        $catStmt = $db->prepare("
            SELECT c.id, c.name, c.slug 
            FROM categories c
            INNER JOIN event_categories ec ON c.id = ec.category_id
            WHERE ec.event_id = ?
        ");
        $catStmt->execute([$event['id']]);
        $event['categories'] = $catStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get artists
        $artStmt = $db->prepare("
            SELECT a.id, a.name, a.spotify_id, a.image_path 
            FROM artists a
            INNER JOIN event_artists ea ON a.id = ea.artist_id
            WHERE ea.event_id = ?
        ");
        $artStmt->execute([$event['id']]);
        $event['artists'] = $artStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format dates
        if ($event['start_datetime']) {
            $event['formatted_date'] = date('d.m.Y', strtotime($event['start_datetime']));
            $event['formatted_time'] = date('H:i', strtotime($event['start_datetime']));
        }
    }
    
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'data' => $events,
        'pagination' => [
            'total' => (int)$totalCount,
            'limit' => $limit,
            'offset' => $offset,
            'has_more' => ($offset + $limit) < $totalCount
        ],
        'filters' => [
            'search' => $search,
            'community' => $community,
            'category' => $category,
            'date' => $date,
            'sort' => $sort
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Search failed: ' . $e->getMessage()
    ]);
}
?>
