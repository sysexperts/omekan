<?php

declare(strict_types=1);

namespace Omekan\DTO;

class EventDetailDTO
{
    public function __construct(
        public readonly int $id,
        public readonly string $slug,
        public readonly string $title,
        public readonly ?string $description,
        public readonly string $location_name,
        public readonly ?string $hero_video_path,
        public readonly ?string $image_path,
        public readonly ?string $affiliate_url,
        public readonly bool $is_promoted,
        public readonly array $occurrences,
        public readonly array $artists,
        public readonly array $communities,
        public readonly array $categories,
        public readonly string $organizer_name
    ) {
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'description' => $this->description,
            'location_name' => $this->location_name,
            'hero_video_path' => $this->hero_video_path,
            'image_path' => $this->image_path,
            'affiliate_url' => $this->affiliate_url,
            'is_promoted' => $this->is_promoted,
            'occurrences' => $this->occurrences,
            'artists' => $this->artists,
            'communities' => $this->communities,
            'categories' => $this->categories,
            'organizer_name' => $this->organizer_name
        ];
    }
}
