<?php

declare(strict_types=1);

namespace Omekan\Service;

use Omekan\Repository\EventRepository;

class EventService
{
    private EventRepository $eventRepository;

    public function __construct()
    {
        $this->eventRepository = new EventRepository();
    }

    public function getAllEvents(): array
    {
        $events = $this->eventRepository->findAll();
        
        return array_map(fn($event) => $event->toArray(), $events);
    }

    public function getEventBySlug(string $slug): ?array
    {
        $event = $this->eventRepository->findBySlug($slug);
        
        return $event?->toArray();
    }
}
