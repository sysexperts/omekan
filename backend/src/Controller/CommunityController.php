<?php

declare(strict_types=1);

namespace Omekan\Controller;

use Omekan\Service\CommunityService;

class CommunityController
{
    private CommunityService $communityService;

    public function __construct()
    {
        $this->communityService = new CommunityService();
    }

    public function index(): void
    {
        $communities = $this->communityService->getAllCommunities();
        
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => $communities
        ]);
    }

    public function show(int $id): void
    {
        $community = $this->communityService->getCommunityById($id);
        
        if ($community === null) {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'Community not found'
            ]);
            return;
        }

        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => $community
        ]);
    }

    public function create(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $community = $this->communityService->createCommunity($data);
        
        if ($community === null) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid community data'
            ]);
            return;
        }

        http_response_code(201);
        echo json_encode([
            'status' => 'success',
            'data' => $community,
            'message' => 'Community created successfully'
        ]);
    }

    public function update(int $id): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $community = $this->communityService->updateCommunity($id, $data);
        
        if ($community === null) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to update community'
            ]);
            return;
        }

        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => $community,
            'message' => 'Community updated successfully'
        ]);
    }

    public function delete(int $id): void
    {
        $success = $this->communityService->deleteCommunity($id);
        
        if (!$success) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to delete community'
            ]);
            return;
        }

        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => 'Community deleted successfully'
        ]);
    }
}
