<?php

declare(strict_types=1);

namespace Omekan\DTO;

class EventOccurrenceDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $eventId,
        public readonly string $startDatetime,
        public readonly string $endDatetime,
        public readonly bool $isCancelled
    ) {
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'event_id' => $this->eventId,
            'start_datetime' => $this->startDatetime,
            'end_datetime' => $this->endDatetime,
            'is_cancelled' => $this->isCancelled,
        ];
    }
}
