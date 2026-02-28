<?php

declare(strict_types=1);

namespace Omekan\Controller;

use Omekan\Service\AdminService;

class AdminController
{
    private AdminService $adminService;

    public function __construct()
    {
        $this->adminService = new AdminService();
    }

    public function getStats(): void
    {
        $stats = $this->adminService->getStatistics();
        
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => $stats
        ]);
    }

    public function getUsers(): void
    {
        $users = $this->adminService->getAllUsers();
        
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => $users
        ]);
    }

    public function getOrganizers(): void
    {
        $organizers = $this->adminService->getAllOrganizers();
        
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => $organizers
        ]);
    }
}
