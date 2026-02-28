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
        error_log("EventControllerNew::index() called");
        $language = $_GET['language'] ?? 'de';
        
        $events = $this->eventService->getAllEvents($language);
        
        error_log("Events found: " . count($events));
        
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => $events
        ]);
    }

    public function show(string $slug): void
    {
        error_log("EventControllerNew::show() called with slug: " . $slug);
        $language = $_GET['language'] ?? 'de';
        
        $event = $this->eventService->getEventBySlug($slug, $language);
        
        if ($event === null) {
            error_log("Event not found for slug: " . $slug);
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
        header('Content-Type: application/json');
        
        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);
        
        if ($data === null) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid JSON data',
                'debug' => [
                    'json_error' => json_last_error_msg(),
                    'raw_input_length' => strlen($rawInput)
                ]
            ]);
            return;
        }
        
        $event = $this->eventService->createEvent($data);
        
        if ($event === null) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid event data - missing required fields'
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

    public function update(int $id): void
    {
        header('Content-Type: application/json');
        
        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);
        
        if ($data === null) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid JSON data'
            ]);
            return;
        }
        
        $data['id'] = $id;
        $event = $this->eventService->updateEvent($data);
        
        if ($event === null) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to update event'
            ]);
            return;
        }

        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => $event,
            'message' => 'Event updated successfully'
        ]);
    }

    public function delete(int $id): void
    {
        header('Content-Type: application/json');
        
        $success = $this->eventService->deleteEvent($id);
        
        if (!$success) {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'Event not found or could not be deleted'
            ]);
            return;
        }

        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => 'Event deleted successfully'
        ]);
    }
}
