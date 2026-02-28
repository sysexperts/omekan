<?php

namespace Omekan\Middleware;

class SecurityMiddleware
{
    private $cspEnabled;
    private $securityHeaders;

    public function __construct()
    {
        $this->cspEnabled = ($_ENV['CSP_ENABLED'] ?? 'true') === 'true';
        $this->securityHeaders = [
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
            'X-XSS-Protection' => '1; mode=block',
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            'Permissions-Policy' => 'geolocation=(), microphone=(), camera=()',
            'X-Permitted-Cross-Domain-Policies' => 'none'
        ];
    }

    public function handle($request, $next)
    {
        // Add security headers
        foreach ($this->securityHeaders as $header => $value) {
            header("{$header}: {$value}");
        }

        // Add Content Security Policy
        if ($this->cspEnabled) {
            $csp = $this->buildContentSecurityPolicy();
            header("Content-Security-Policy: {$csp}");
        }

        // Add HSTS for HTTPS
        if ($this->isHttps()) {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
        }

        // Sanitize input data
        $this->sanitizeGlobalInputs();

        // Check for suspicious patterns
        if ($this->detectSuspiciousActivity()) {
            return $this->suspiciousActivityResponse();
        }

        return $next($request);
    }

    private function buildContentSecurityPolicy()
    {
        $directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.google.com https://www.gstatic.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://api.github.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests"
        ];

        return implode('; ', $directives);
    }

    private function isHttps()
    {
        return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
               $_SERVER['SERVER_PORT'] == 443 ||
               (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
    }

    private function sanitizeGlobalInputs()
    {
        // Sanitize GET parameters
        $_GET = $this->sanitizeArray($_GET);
        
        // Sanitize POST parameters
        $_POST = $this->sanitizeArray($_POST);
        
        // Sanitize COOKIE parameters
        $_COOKIE = $this->sanitizeArray($_COOKIE);
    }

    private function sanitizeArray($array)
    {
        if (!is_array($array)) {
            return $this->sanitizeString($array);
        }

        $sanitized = [];
        foreach ($array as $key => $value) {
            $sanitizedKey = $this->sanitizeString($key);
            $sanitized[$sanitizedKey] = is_array($value) ? 
                $this->sanitizeArray($value) : 
                $this->sanitizeString($value);
        }

        return $sanitized;
    }

    private function sanitizeString($string)
    {
        if (!is_string($string)) {
            return $string;
        }

        // Remove null bytes
        $string = str_replace("\0", '', $string);
        
        // Remove potential XSS
        $string = htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
        
        // Remove potential SQL injection patterns (basic)
        $sqlPatterns = [
            '/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i',
            '/(\b(OR|AND)\s+\d+\s*=\s*\d+)/i',
            '/(\'|\"|`|;|--|\*|\/\*|\*\/)/i'
        ];
        
        foreach ($sqlPatterns as $pattern) {
            if (preg_match($pattern, $string)) {
                // Log suspicious activity
                error_log("Suspicious SQL pattern detected: {$string} from IP: " . $this->getClientIp());
                $string = preg_replace($pattern, '', $string);
            }
        }

        return trim($string);
    }

    private function detectSuspiciousActivity()
    {
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $requestUri = $_SERVER['REQUEST_URI'] ?? '';
        $clientIp = $this->getClientIp();

        // Check for common attack patterns
        $suspiciousPatterns = [
            // SQL Injection
            '/(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i',
            // XSS
            '/(<script|javascript:|vbscript:|onload=|onerror=)/i',
            // Path traversal
            '/(\.\.|\/etc\/|\/proc\/|\/var\/)/i',
            // Command injection
            '/(\||;|`|\$\(|\${)/i'
        ];

        foreach ($suspiciousPatterns as $pattern) {
            if (preg_match($pattern, $requestUri) || preg_match($pattern, $userAgent)) {
                // Log the suspicious activity
                error_log("Suspicious activity detected from IP {$clientIp}: {$requestUri} - UA: {$userAgent}");
                return true;
            }
        }

        // Check for bot/scanner user agents
        $botPatterns = [
            '/sqlmap/i',
            '/nikto/i',
            '/nessus/i',
            '/openvas/i',
            '/nmap/i'
        ];

        foreach ($botPatterns as $pattern) {
            if (preg_match($pattern, $userAgent)) {
                error_log("Security scanner detected from IP {$clientIp}: {$userAgent}");
                return true;
            }
        }

        return false;
    }

    private function getClientIp()
    {
        $ipKeys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                // Handle comma-separated IPs (X-Forwarded-For)
                if (str_contains($ip, ',')) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }

        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }

    private function suspiciousActivityResponse()
    {
        http_response_code(403);
        header('Content-Type: application/json');
        
        echo json_encode([
            'status' => 'error',
            'message' => 'Suspicious activity detected',
            'code' => 403
        ]);
        
        exit;
    }

    // CSRF Protection
    public static function generateCsrfToken()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        
        return $_SESSION['csrf_token'];
    }

    public static function validateCsrfToken($token)
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
    }

    // Password hashing utilities
    public static function hashPassword($password)
    {
        return password_hash($password, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536, // 64 MB
            'time_cost' => 4,       // 4 iterations
            'threads' => 3          // 3 threads
        ]);
    }

    public static function verifyPassword($password, $hash)
    {
        return password_verify($password, $hash);
    }

    // Generate secure random strings
    public static function generateSecureToken($length = 32)
    {
        return bin2hex(random_bytes($length));
    }

    // Validate file uploads securely
    public static function validateUpload($file, $allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'])
    {
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            return ['error' => 'Invalid file upload'];
        }

        // Check file size
        $maxSize = $_ENV['UPLOAD_MAX_SIZE'] ?? 10485760; // 10MB
        if ($file['size'] > $maxSize) {
            return ['error' => 'File too large'];
        }

        // Check MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        $allowedMimes = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp'
        ];

        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        if (!in_array($extension, $allowedTypes) || 
            !isset($allowedMimes[$extension]) || 
            $allowedMimes[$extension] !== $mimeType) {
            return ['error' => 'Invalid file type'];
        }

        // Additional security: check for embedded PHP code
        $content = file_get_contents($file['tmp_name']);
        if (str_contains($content, '<?php') || str_contains($content, '<?=')) {
            return ['error' => 'Suspicious file content'];
        }

        return ['success' => true];
    }
}
