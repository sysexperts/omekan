<?php

declare(strict_types=1);

namespace Omekan\DTO;

class EventListDTO
{
    public function __construct(
        public readonly int $id,
        public readonly string $slug,
        public readonly string $title,
        public readonly string $location_name,
        public readonly string $start_datetime,
        public readonly ?string $hero_video_path,
        public readonly ?string $image_path,
        public readonly array $communities,
        public readonly array $categories
    ) {
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'location_name' => $this->location_name,
            'start_datetime' => $this->start_datetime,
            'hero_video_path' => $this->hero_video_path,
            'image_path' => $this->image_path,
            'communities' => $this->communities,
            'categories' => $this->categories
        ];
    }
}
