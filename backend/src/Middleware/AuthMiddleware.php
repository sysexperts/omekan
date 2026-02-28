<?php

namespace Omekan\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class AuthMiddleware
{
    private $jwtSecret;
    private $excludedPaths;

    public function __construct()
    {
        $this->jwtSecret = $_ENV['JWT_SECRET'] ?? 'default-secret-change-in-production';
        $this->excludedPaths = [
            '/api/health',
            '/api/events',
            '/api/communities', 
            '/api/categories',
            '/api/search',
            '/api/auth/login',
            '/api/auth/register'
        ];
    }

    public function handle($request, $next)
    {
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Skip authentication for excluded paths
        if ($this->isExcludedPath($path)) {
            return $next($request);
        }

        // Check for Authorization header
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return $this->unauthorizedResponse();
        }

        $token = substr($authHeader, 7);

        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            
            // Add user info to request
            $_REQUEST['auth_user'] = [
                'id' => $decoded->user_id,
                'email' => $decoded->email,
                'role' => $decoded->role ?? 'user'
            ];

            return $next($request);
            
        } catch (Exception $e) {
            return $this->unauthorizedResponse('Invalid token: ' . $e->getMessage());
        }
    }

    private function isExcludedPath($path)
    {
        foreach ($this->excludedPaths as $excludedPath) {
            if (str_starts_with($path, $excludedPath)) {
                return true;
            }
        }
        return false;
    }

    private function unauthorizedResponse($message = 'Authentication required')
    {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'error',
            'message' => $message,
            'code' => 401
        ]);
        exit;
    }

    public static function generateToken($userId, $email, $role = 'user')
    {
        $jwtSecret = $_ENV['JWT_SECRET'] ?? 'default-secret-change-in-production';
        $expiration = time() + ($_ENV['JWT_EXPIRATION'] ?? 86400); // 24 hours default

        $payload = [
            'iss' => $_ENV['APP_URL'] ?? 'http://localhost',
            'aud' => $_ENV['APP_URL'] ?? 'http://localhost',
            'iat' => time(),
            'exp' => $expiration,
            'user_id' => $userId,
            'email' => $email,
            'role' => $role
        ];

        return JWT::encode($payload, $jwtSecret, 'HS256');
    }

    public static function refreshToken($token)
    {
        $jwtSecret = $_ENV['JWT_SECRET'] ?? 'default-secret-change-in-production';
        
        try {
            $decoded = JWT::decode($token, new Key($jwtSecret, 'HS256'));
            
            // Check if token expires within next hour
            if ($decoded->exp - time() < 3600) {
                return self::generateToken($decoded->user_id, $decoded->email, $decoded->role);
            }
            
            return $token; // Token is still valid
            
        } catch (Exception $e) {
            throw new Exception('Token refresh failed: ' . $e->getMessage());
        }
    }
}
