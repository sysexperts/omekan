<?php

declare(strict_types=1);

namespace Omekan\Service;

use Omekan\Repository\CommunityRepository;

class CommunityService
{
    private CommunityRepository $communityRepository;

    public function __construct()
    {
        $this->communityRepository = new CommunityRepository();
    }

    public function getAllCommunities(): array
    {
        $communities = $this->communityRepository->findAll();
        return array_map(fn($community) => $community->toArray(), $communities);
    }

    public function getCommunityById(int $id): ?array
    {
        $community = $this->communityRepository->findById($id);
        return $community?->toArray();
    }

    public function createCommunity(array $data): ?array
    {
        if (!isset($data['name']) || !isset($data['slug'])) {
            return null;
        }

        $id = $this->communityRepository->create(
            $data['name'],
            $data['slug'],
            $data['flag_icon'] ?? null,
            $data['preview_image'] ?? null,
            $data['is_active'] ?? true
        );

        return $this->getCommunityById($id);
    }

    public function updateCommunity(int $id, array $data): ?array
    {
        if (!isset($data['name']) || !isset($data['slug'])) {
            return null;
        }

        $success = $this->communityRepository->update(
            $id,
            $data['name'],
            $data['slug'],
            $data['flag_icon'] ?? null,
            $data['preview_image'] ?? null,
            $data['is_active'] ?? true
        );

        return $success ? $this->getCommunityById($id) : null;
    }

    public function deleteCommunity(int $id): bool
    {
        return $this->communityRepository->delete($id);
    }
}
