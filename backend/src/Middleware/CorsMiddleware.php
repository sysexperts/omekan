<?php

namespace Omekan\Middleware;

class CorsMiddleware
{
    private $allowedOrigins;
    private $allowedMethods;
    private $allowedHeaders;
    private $maxAge;

    public function __construct()
    {
        $this->allowedOrigins = explode(',', $_ENV['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost,https://localhost');
        $this->allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];
        $this->allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'];
        $this->maxAge = 86400; // 24 hours
    }

    public function handle($request, $next)
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        // Set CORS headers
        if ($this->isAllowedOrigin($origin)) {
            header("Access-Control-Allow-Origin: {$origin}");
        } else {
            header("Access-Control-Allow-Origin: " . $this->allowedOrigins[0]);
        }
        
        header("Access-Control-Allow-Methods: " . implode(', ', $this->allowedMethods));
        header("Access-Control-Allow-Headers: " . implode(', ', $this->allowedHeaders));
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Max-Age: {$this->maxAge}");

        // Handle preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        return $next($request);
    }

    private function isAllowedOrigin($origin)
    {
        if (empty($origin)) {
            return false;
        }

        foreach ($this->allowedOrigins as $allowedOrigin) {
            if (trim($allowedOrigin) === $origin) {
                return true;
            }
        }

        return false;
    }
}
