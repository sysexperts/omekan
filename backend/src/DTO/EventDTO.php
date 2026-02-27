<?php

declare(strict_types=1);

namespace Omekan\DTO;

class EventDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $organizerId,
        public readonly string $slug,
        public readonly ?string $affiliateUrl,
        public readonly bool $isPromoted,
        public readonly ?string $heroVideoPath,
        public readonly string $createdAt
    ) {
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'organizer_id' => $this->organizerId,
            'slug' => $this->slug,
            'affiliate_url' => $this->affiliateUrl,
            'is_promoted' => $this->isPromoted,
            'hero_video_path' => $this->heroVideoPath,
            'created_at' => $this->createdAt,
        ];
    }
}
