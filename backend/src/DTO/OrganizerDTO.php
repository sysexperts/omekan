<?php

declare(strict_types=1);

namespace Omekan\DTO;

class OrganizerDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $userId,
        public readonly string $displayName,
        public readonly ?string $website,
        public readonly bool $isPartner,
        public readonly int $tokenBalance
    ) {
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->userId,
            'display_name' => $this->displayName,
            'website' => $this->website,
            'is_partner' => $this->isPartner,
            'token_balance' => $this->tokenBalance,
        ];
    }
}
