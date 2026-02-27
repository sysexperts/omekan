<?php

declare(strict_types=1);

namespace Omekan\DTO;

class EventTranslationDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $eventId,
        public readonly string $language,
        public readonly string $title,
        public readonly ?string $description,
        public readonly ?string $locationName
    ) {
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'event_id' => $this->eventId,
            'language' => $this->language,
            'title' => $this->title,
            'description' => $this->description,
            'location_name' => $this->locationName,
        ];
    }
}
