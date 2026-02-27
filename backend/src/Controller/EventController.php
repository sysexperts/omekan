<?php

declare(strict_types=1);

namespace Omekan\Controller;

use Omekan\Service\EventService;

class EventController
{
    private EventService $eventService;

    public function __construct()
    {
        $this->eventService = new EventService();
    }

    public function index(): void
    {
        $events = $this->eventService->getAllEvents();
        
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => $events
        ]);
    }

    public function show(string $slug): void
    {
        $event = $this->eventService->getEventBySlug($slug);
        
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
        
        if (!isset($data['user_id'])) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'User ID required'
            ]);
            return;
        }

        $event = $this->eventService->createEvent((int) $data['user_id'], $data);
        
        if ($event === null) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid event data or user is not an organizer'
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
