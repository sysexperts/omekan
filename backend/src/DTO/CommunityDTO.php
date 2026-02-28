<?php

declare(strict_types=1);

namespace Omekan\DTO;

class CommunityDTO
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $flagIcon,
        public readonly ?string $previewImage,
        public readonly bool $isActive
    ) {
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'flag_icon' => $this->flagIcon,
            'preview_image' => $this->previewImage,
            'is_active' => $this->isActive
        ];
    }
}
