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
}
