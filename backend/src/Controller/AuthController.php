<?php

declare(strict_types=1);

namespace Omekan\Controller;

use Omekan\Service\AuthService;

class AuthController
{
    private AuthService $authService;

    public function __construct()
    {
        $this->authService = new AuthService();
    }

    public function login(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['email']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Email and password required'
            ]);
            return;
        }

        $user = $this->authService->login($data['email'], $data['password']);
        
        if ($user === null) {
            http_response_code(401);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid credentials'
            ]);
            return;
        }

        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => $user
        ]);
    }

    public function register(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Name, email and password required'
            ]);
            return;
        }

        $website = $data['website'] ?? null;
        $user = $this->authService->register($data['name'], $data['email'], $data['password'], $website);
        
        if ($user === null) {
            http_response_code(409);
            echo json_encode([
                'status' => 'error',
                'message' => 'User already exists'
            ]);
            return;
        }

        http_response_code(201);
        echo json_encode([
            'status' => 'success',
            'data' => $user,
            'message' => $user['role'] === 'admin' ? 'Erster User als Admin erstellt' : 'Veranstalter registriert'
        ]);
    }
}
