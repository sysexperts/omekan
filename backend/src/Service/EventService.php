<?php

declare(strict_types=1);

namespace Omekan\Service;

use Omekan\Repository\EventRepository;
use Omekan\Repository\EventTranslationRepository;
use Omekan\Repository\EventOccurrenceRepository;
use Omekan\Repository\EventCommunityRepository;
use Omekan\Repository\EventCategoryRepository;
use Omekan\Repository\OrganizerRepository;

class EventService
{
    private EventRepository $eventRepository;
    private EventTranslationRepository $translationRepository;
    private EventOccurrenceRepository $occurrenceRepository;
    private EventCommunityRepository $communityRepository;
    private EventCategoryRepository $categoryRepository;
    private OrganizerRepository $organizerRepository;

    public function __construct()
    {
        $this->eventRepository = new EventRepository();
        $this->translationRepository = new EventTranslationRepository();
        $this->occurrenceRepository = new EventOccurrenceRepository();
        $this->communityRepository = new EventCommunityRepository();
        $this->categoryRepository = new EventCategoryRepository();
        $this->organizerRepository = new OrganizerRepository();
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

    public function createEvent(int $userId, array $data): ?array
    {
        $organizer = $this->organizerRepository->findByUserId($userId);
        
        if (!$organizer) {
            return null;
        }

        if (!isset($data['title']) || !isset($data['start_datetime'])) {
            return null;
        }

        $endDatetime = $data['end_datetime'] ?? $data['start_datetime'];

        $slug = $this->generateSlug($data['title']);
        
        $eventId = $this->eventRepository->create(
            $organizer->id,
            $slug,
            $data['affiliate_url'] ?? null
        );

        $this->translationRepository->create(
            $eventId,
            'de',
            $data['title'],
            $data['description'] ?? null,
            $data['location_name'] ?? null
        );

        $this->occurrenceRepository->create(
            $eventId,
            $data['start_datetime'],
            $endDatetime
        );

        if (isset($data['community_ids']) && is_array($data['community_ids'])) {
            foreach ($data['community_ids'] as $communityId) {
                $this->communityRepository->create($eventId, (int) $communityId);
            }
        }

        if (isset($data['category_ids']) && is_array($data['category_ids'])) {
            foreach ($data['category_ids'] as $categoryId) {
                $this->categoryRepository->create($eventId, (int) $categoryId);
            }
        }

        return [
            'id' => $eventId,
            'slug' => $slug,
            'organizer_id' => $organizer->id
        ];
    }

    private function generateSlug(string $title): string
    {
        $slug = strtolower($title);
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');
        $slug = substr($slug, 0, 200);
        
        $baseSlug = $slug;
        $counter = 1;
        
        while ($this->eventRepository->findBySlug($slug) !== null) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }
        
        return $slug;
    }
}
