<?php

namespace Omekan\Middleware;

class RateLimitMiddleware
{
    private $limits;
    private $storage;

    public function __construct()
    {
        $this->limits = [
            '/api/auth' => ['requests' => 5, 'window' => 60], // 5 requests per minute
            '/api/upload' => ['requests' => 10, 'window' => 60], // 10 requests per minute
            '/api/search' => ['requests' => 30, 'window' => 60], // 30 requests per minute
            'default' => ['requests' => 100, 'window' => 60] // 100 requests per minute
        ];
        
        // Use file-based storage for simplicity (Redis would be better for production)
        $this->storage = sys_get_temp_dir() . '/omekan_rate_limits/';
        if (!is_dir($this->storage)) {
            mkdir($this->storage, 0755, true);
        }
    }

    public function handle($request, $next)
    {
        if (!$this->isRateLimitEnabled()) {
            return $next($request);
        }

        $clientId = $this->getClientId();
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $limit = $this->getLimitForPath($path);
        
        $key = $this->generateKey($clientId, $path);
        $current = $this->getCurrentCount($key);
        
        // Check if limit exceeded
        if ($current >= $limit['requests']) {
            return $this->rateLimitExceededResponse($limit);
        }
        
        // Increment counter
        $this->incrementCounter($key, $limit['window']);
        
        // Add rate limit headers
        $this->addRateLimitHeaders($current + 1, $limit['requests'], $this->getResetTime($key, $limit['window']));
        
        return $next($request);
    }

    private function isRateLimitEnabled()
    {
        return ($_ENV['RATE_LIMIT_ENABLED'] ?? 'true') === 'true';
    }

    private function getClientId()
    {
        // Use IP address as client identifier
        return $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }

    private function getLimitForPath($path)
    {
        foreach ($this->limits as $pattern => $limit) {
            if ($pattern !== 'default' && str_starts_with($path, $pattern)) {
                return $limit;
            }
        }
        
        return $this->limits['default'];
    }

    private function generateKey($clientId, $path)
    {
        $window = floor(time() / 60); // 1-minute windows
        return md5($clientId . $path . $window);
    }

    private function getCurrentCount($key)
    {
        $file = $this->storage . $key;
        
        if (!file_exists($file)) {
            return 0;
        }
        
        $data = json_decode(file_get_contents($file), true);
        
        if (!$data || $data['expires'] < time()) {
            return 0;
        }
        
        return $data['count'];
    }

    private function incrementCounter($key, $window)
    {
        $file = $this->storage . $key;
        $expires = time() + $window;
        
        if (file_exists($file)) {
            $data = json_decode(file_get_contents($file), true);
            if ($data && $data['expires'] >= time()) {
                $data['count']++;
            } else {
                $data = ['count' => 1, 'expires' => $expires];
            }
        } else {
            $data = ['count' => 1, 'expires' => $expires];
        }
        
        file_put_contents($file, json_encode($data));
    }

    private function getResetTime($key, $window)
    {
        $file = $this->storage . $key;
        
        if (file_exists($file)) {
            $data = json_decode(file_get_contents($file), true);
            return $data['expires'] ?? time() + $window;
        }
        
        return time() + $window;
    }

    private function addRateLimitHeaders($current, $limit, $resetTime)
    {
        header("X-RateLimit-Limit: {$limit}");
        header("X-RateLimit-Remaining: " . max(0, $limit - $current));
        header("X-RateLimit-Reset: {$resetTime}");
    }

    private function rateLimitExceededResponse($limit)
    {
        http_response_code(429);
        header('Content-Type: application/json');
        header("Retry-After: {$limit['window']}");
        
        echo json_encode([
            'status' => 'error',
            'message' => 'Rate limit exceeded',
            'code' => 429,
            'retry_after' => $limit['window']
        ]);
        
        exit;
    }

    // Cleanup old rate limit files
    public function cleanup()
    {
        $files = glob($this->storage . '*');
        $now = time();
        
        foreach ($files as $file) {
            $data = json_decode(file_get_contents($file), true);
            if (!$data || $data['expires'] < $now) {
                unlink($file);
            }
        }
    }
}
