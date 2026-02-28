<?php

namespace Omekan\Core;

use Omekan\Middleware\CorsMiddleware;
use Omekan\Middleware\SecurityMiddleware;
use Omekan\Middleware\RateLimitMiddleware;
use Omekan\Middleware\ValidationMiddleware;
use Omekan\Middleware\AuthMiddleware;

class Application
{
    private $middlewares = [];
    private $routes = [];
    private $container;

    public function __construct()
    {
        $this->loadEnvironment();
        $this->setupErrorHandling();
        $this->setupMiddlewares();
        $this->container = new Container();
    }

    private function loadEnvironment()
    {
        if (file_exists(__DIR__ . '/../../.env')) {
            $lines = file(__DIR__ . '/../../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (str_starts_with(trim($line), '#')) {
                    continue;
                }
                list($name, $value) = explode('=', $line, 2);
                $_ENV[trim($name)] = trim($value);
            }
        }
    }

    private function setupErrorHandling()
    {
        set_error_handler([$this, 'handleError']);
        set_exception_handler([$this, 'handleException']);
        register_shutdown_function([$this, 'handleShutdown']);
    }

    private function setupMiddlewares()
    {
        $this->middlewares = [
            new SecurityMiddleware(),
            new CorsMiddleware(),
            new RateLimitMiddleware(),
            new ValidationMiddleware(),
            new AuthMiddleware()
        ];
    }

    public function run()
    {
        try {
            $request = $this->createRequest();
            $response = $this->processRequest($request);
            $this->sendResponse($response);
        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    private function createRequest()
    {
        return [
            'method' => $_SERVER['REQUEST_METHOD'],
            'uri' => $_SERVER['REQUEST_URI'],
            'path' => parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH),
            'query' => $_GET,
            'body' => $this->getRequestBody(),
            'headers' => $this->getRequestHeaders(),
            'files' => $_FILES,
            'ip' => $this->getClientIp()
        ];
    }

    private function getRequestBody()
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        
        if (str_contains($contentType, 'application/json')) {
            $input = file_get_contents('php://input');
            return json_decode($input, true) ?? [];
        }
        
        return $_POST;
    }

    private function getRequestHeaders()
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $header = str_replace('_', '-', substr($key, 5));
                $headers[strtolower($header)] = $value;
            }
        }
        return $headers;
    }

    private function getClientIp()
    {
        $ipKeys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                if (str_contains($ip, ',')) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return 'unknown';
    }

    private function processRequest($request)
    {
        // Process through middleware chain
        $pipeline = array_reduce(
            array_reverse($this->middlewares),
            function ($next, $middleware) {
                return function ($request) use ($middleware, $next) {
                    return $middleware->handle($request, $next);
                };
            },
            function ($request) {
                return $this->handleRoute($request);
            }
        );

        return $pipeline($request);
    }

    private function handleRoute($request)
    {
        $method = $request['method'];
        $path = $request['path'];

        // Route matching logic
        $route = $this->matchRoute($method, $path);
        
        if (!$route) {
            return $this->notFoundResponse();
        }

        // Execute route handler
        try {
            return $route['handler']($request);
        } catch (\Exception $e) {
            return $this->errorResponse('Route handler error: ' . $e->getMessage(), 500);
        }
    }

    private function matchRoute($method, $path)
    {
        // Simple route matching - in production, use a proper router
        $routes = [
            'GET /api/health' => [$this, 'healthCheck'],
            'GET /api/events' => [$this, 'getEvents'],
            'GET /api/events/{id}' => [$this, 'getEvent'],
            'POST /api/events' => [$this, 'createEvent'],
            'PUT /api/events/{id}' => [$this, 'updateEvent'],
            'DELETE /api/events/{id}' => [$this, 'deleteEvent'],
            'GET /api/communities' => [$this, 'getCommunities'],
            'GET /api/categories' => [$this, 'getCategories'],
            'GET /api/search/events' => [$this, 'searchEvents'],
            'POST /api/analytics/events' => [$this, 'trackAnalytics'],
            'POST /api/auth/login' => [$this, 'login'],
            'POST /api/auth/register' => [$this, 'register'],
            'POST /api/upload/event-image' => [$this, 'uploadEventImage']
        ];

        $routeKey = "{$method} {$path}";
        
        // Exact match
        if (isset($routes[$routeKey])) {
            return ['handler' => $routes[$routeKey]];
        }

        // Pattern matching for routes with parameters
        foreach ($routes as $pattern => $handler) {
            if ($this->matchRoutePattern($pattern, "{$method} {$path}")) {
                return ['handler' => $handler];
            }
        }

        return null;
    }

    private function matchRoutePattern($pattern, $route)
    {
        $pattern = preg_replace('/\{[^}]+\}/', '([^/]+)', $pattern);
        return preg_match("#^{$pattern}$#", $route);
    }

    private function sendResponse($response)
    {
        if (is_array($response)) {
            header('Content-Type: application/json');
            echo json_encode($response);
        } else {
            echo $response;
        }
    }

    // Route handlers
    public function healthCheck($request)
    {
        return [
            'status' => 'healthy',
            'timestamp' => date('c'),
            'version' => '2.0.0',
            'uptime' => time() - $_SERVER['REQUEST_TIME'],
            'memory_usage' => memory_get_usage(true),
            'peak_memory' => memory_get_peak_usage(true)
        ];
    }

    public function getEvents($request)
    {
        // Delegate to existing controller logic
        require_once __DIR__ . '/../Controller/EventListController.php';
        $controller = new \Omekan\Controller\EventListController();
        return $controller->index();
    }

    public function getEvent($request)
    {
        $id = $this->extractIdFromPath($request['path']);
        require_once __DIR__ . '/../Controller/EventControllerNew.php';
        $controller = new \Omekan\Controller\EventControllerNew();
        return $controller->showById($id);
    }

    public function createEvent($request)
    {
        require_once __DIR__ . '/../Controller/EventControllerNew.php';
        $controller = new \Omekan\Controller\EventControllerNew();
        return $controller->create();
    }

    public function updateEvent($request)
    {
        $id = $this->extractIdFromPath($request['path']);
        require_once __DIR__ . '/../Controller/EventControllerNew.php';
        $controller = new \Omekan\Controller\EventControllerNew();
        return $controller->update($id);
    }

    public function deleteEvent($request)
    {
        $id = $this->extractIdFromPath($request['path']);
        require_once __DIR__ . '/../Controller/EventControllerNew.php';
        $controller = new \Omekan\Controller\EventControllerNew();
        return $controller->delete($id);
    }

    public function getCommunities($request)
    {
        require_once __DIR__ . '/../Controller/CommunityController.php';
        $controller = new \Omekan\Controller\CommunityController();
        return $controller->index();
    }

    public function getCategories($request)
    {
        require_once __DIR__ . '/../Controller/CategoryController.php';
        $controller = new \Omekan\Controller\CategoryController();
        return $controller->index();
    }

    public function searchEvents($request)
    {
        require_once __DIR__ . '/../api-search.php';
        return null; // Handled by included file
    }

    public function trackAnalytics($request)
    {
        // Simple analytics storage
        $events = $request['body']['events'] ?? [];
        
        foreach ($events as $event) {
            // Log to file or database
            error_log("Analytics: " . json_encode($event));
        }
        
        return [
            'status' => 'success',
            'message' => 'Events tracked successfully',
            'processed' => count($events)
        ];
    }

    public function login($request)
    {
        // Mock authentication - implement proper auth logic
        $email = $request['body']['email'] ?? '';
        $password = $request['body']['password'] ?? '';
        
        if (empty($email) || empty($password)) {
            return $this->errorResponse('Email and password required', 400);
        }
        
        // Mock user validation
        $user = ['id' => 1, 'name' => 'Test User', 'email' => $email];
        $token = AuthMiddleware::generateToken($user['id'], $user['email']);
        
        return [
            'status' => 'success',
            'message' => 'Login successful',
            'data' => [
                'token' => $token,
                'user' => $user
            ]
        ];
    }

    public function register($request)
    {
        // Mock registration - implement proper registration logic
        $name = $request['body']['name'] ?? '';
        $email = $request['body']['email'] ?? '';
        $password = $request['body']['password'] ?? '';
        
        if (empty($name) || empty($email) || empty($password)) {
            return $this->errorResponse('Name, email and password required', 400);
        }
        
        return [
            'status' => 'success',
            'message' => 'User registered successfully',
            'data' => [
                'user' => [
                    'id' => rand(1000, 9999),
                    'name' => $name,
                    'email' => $email,
                    'created_at' => date('c')
                ]
            ]
        ];
    }

    public function uploadEventImage($request)
    {
        if (!isset($_FILES['image'])) {
            return $this->errorResponse('No image file provided', 400);
        }
        
        $validation = SecurityMiddleware::validateUpload($_FILES['image']);
        if (isset($validation['error'])) {
            return $this->errorResponse($validation['error'], 400);
        }
        
        // Mock upload - implement proper file handling
        return [
            'status' => 'success',
            'message' => 'Image uploaded successfully',
            'data' => [
                'filename' => 'event_' . time() . '.jpg',
                'path' => '/uploads/events/event_' . time() . '.jpg',
                'size' => $_FILES['image']['size'],
                'mime_type' => $_FILES['image']['type']
            ]
        ];
    }

    private function extractIdFromPath($path)
    {
        $parts = explode('/', trim($path, '/'));
        return end($parts);
    }

    private function notFoundResponse()
    {
        http_response_code(404);
        return [
            'status' => 'error',
            'message' => 'Endpoint not found',
            'code' => 404
        ];
    }

    private function errorResponse($message, $code = 500)
    {
        http_response_code($code);
        return [
            'status' => 'error',
            'message' => $message,
            'code' => $code,
            'timestamp' => date('c')
        ];
    }

    // Error handlers
    public function handleError($severity, $message, $file, $line)
    {
        if (!(error_reporting() & $severity)) {
            return false;
        }

        $error = [
            'type' => 'error',
            'severity' => $severity,
            'message' => $message,
            'file' => $file,
            'line' => $line,
            'timestamp' => date('c')
        ];

        error_log(json_encode($error));
        
        if ($_ENV['APP_DEBUG'] === 'true') {
            throw new \ErrorException($message, 0, $severity, $file, $line);
        }

        return true;
    }

    public function handleException($exception)
    {
        $error = [
            'type' => 'exception',
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString(),
            'timestamp' => date('c')
        ];

        error_log(json_encode($error));

        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json');
        }

        $response = [
            'status' => 'error',
            'message' => 'Internal server error',
            'code' => 500
        ];

        if ($_ENV['APP_DEBUG'] === 'true') {
            $response['debug'] = [
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTrace()
            ];
        }

        echo json_encode($response);
        exit;
    }

    public function handleShutdown()
    {
        $error = error_get_last();
        
        if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
            $this->handleException(new \ErrorException(
                $error['message'],
                0,
                $error['type'],
                $error['file'],
                $error['line']
            ));
        }
    }
}

// Simple DI Container
class Container
{
    private $bindings = [];
    private $instances = [];

    public function bind($abstract, $concrete)
    {
        $this->bindings[$abstract] = $concrete;
    }

    public function singleton($abstract, $concrete)
    {
        $this->bind($abstract, $concrete);
        $this->instances[$abstract] = null;
    }

    public function make($abstract)
    {
        if (isset($this->instances[$abstract])) {
            return $this->instances[$abstract];
        }

        if (!isset($this->bindings[$abstract])) {
            throw new \Exception("No binding found for {$abstract}");
        }

        $concrete = $this->bindings[$abstract];
        
        if (is_callable($concrete)) {
            $instance = $concrete($this);
        } else {
            $instance = new $concrete();
        }

        if (isset($this->instances[$abstract])) {
            $this->instances[$abstract] = $instance;
        }

        return $instance;
    }
}
