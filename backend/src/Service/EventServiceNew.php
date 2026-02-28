<?php

declare(strict_types=1);

namespace Omekan\Service;

use Omekan\Repository\EventRepositoryNew;

class EventServiceNew
{
    private EventRepositoryNew $eventRepository;

    public function __construct()
    {
        $this->eventRepository = new EventRepositoryNew();
    }

    public function getAllEvents(string $language = 'de'): array
    {
        $events = $this->eventRepository->findAllForList($language);
        return array_map(fn($event) => $event->toArray(), $events);
    }

    public function getEventBySlug(string $slug, string $language = 'de'): ?array
    {
        $event = $this->eventRepository->findBySlugForDetail($slug, $language);
        return $event?->toArray();
    }

    public function createEvent(array $data): ?array
    {
        if (!isset($data['organizer_id'], $data['slug'], $data['title'], $data['location_name'])) {
            return null;
        }

        $eventId = $this->eventRepository->create(
            organizerId: (int) $data['organizer_id'],
            slug: $data['slug'],
            affiliateUrl: $data['affiliate_url'] ?? null,
            isPromoted: (bool) ($data['is_promoted'] ?? false),
            heroVideoPath: $data['hero_video_path'] ?? null,
            imagePath: $data['image_path'] ?? null
        );

        $this->eventRepository->createTranslation(
            eventId: $eventId,
            language: $data['language'] ?? 'de',
            title: $data['title'],
            description: $data['description'] ?? null,
            locationName: $data['location_name']
        );

        if (isset($data['start_datetime'], $data['end_datetime'])) {
            $this->eventRepository->createOccurrence(
                eventId: $eventId,
                startDatetime: $data['start_datetime'],
                endDatetime: $data['end_datetime']
            );
        }

        if (isset($data['additional_occurrences']) && is_array($data['additional_occurrences'])) {
            foreach ($data['additional_occurrences'] as $occurrence) {
                if (isset($occurrence['start_datetime'], $occurrence['end_datetime'])) {
                    $this->eventRepository->createOccurrence(
                        eventId: $eventId,
                        startDatetime: $occurrence['start_datetime'],
                        endDatetime: $occurrence['end_datetime']
                    );
                }
            }
        }

        if (isset($data['artist_ids']) && is_array($data['artist_ids'])) {
            foreach ($data['artist_ids'] as $artistId) {
                $this->eventRepository->linkArtist($eventId, (int) $artistId);
            }
        }

        if (isset($data['community_ids']) && is_array($data['community_ids'])) {
            foreach ($data['community_ids'] as $communityId) {
                $this->eventRepository->linkCommunity($eventId, (int) $communityId);
            }
        }

        if (isset($data['category_ids']) && is_array($data['category_ids'])) {
            foreach ($data['category_ids'] as $categoryId) {
                $this->eventRepository->linkCategory($eventId, (int) $categoryId);
            }
        }

        return $this->getEventBySlug($data['slug']);
    }
}
