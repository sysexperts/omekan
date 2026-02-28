<?php

declare(strict_types=1);

namespace Omekan\Controller;

use Omekan\Service\EventServiceNew;

class EventControllerNew
{
    private EventServiceNew $eventService;

    public function __construct()
    {
        $this->eventService = new EventServiceNew();
    }

    public function index(): void
    {
        $language = $_GET['language'] ?? 'de';
        
        $events = $this->eventService->getAllEvents($language);
        
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => $events
        ]);
    }

    public function show(string $slug): void
    {
        $language = $_GET['language'] ?? 'de';
        
        $event = $this->eventService->getEventBySlug($slug, $language);
        
        if ($event === null) {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'Event not found'
            ]);
            return;
        }

        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => $event
        ]);
    }

    public function create(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $event = $this->eventService->createEvent($data);
        
        if ($event === null) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid event data'
            ]);
            return;
        }

        http_response_code(201);
        echo json_encode([
            'status' => 'success',
            'data' => $event,
            'message' => 'Event created successfully'
        ]);
    }
}
