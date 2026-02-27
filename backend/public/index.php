<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$requestMethod = $_SERVER['REQUEST_METHOD'];

if ($requestMethod === 'GET' && $requestUri === '/api/events') {
    $controller = new \Omekan\Controller\EventController();
    $controller->index();
    exit;
}

if ($requestMethod === 'GET' && preg_match('#^/api/events/([a-z0-9\-]+)$#', $requestUri, $matches)) {
    $controller = new \Omekan\Controller\EventController();
    $controller->show($matches[1]);
    exit;
}

if ($requestMethod === 'POST' && $requestUri === '/api/login') {
    $controller = new \Omekan\Controller\AuthController();
    $controller->login();
    exit;
}

if ($requestMethod === 'POST' && $requestUri === '/api/register') {
    $controller = new \Omekan\Controller\AuthController();
    $controller->register();
    exit;
}

if ($requestMethod === 'POST' && $requestUri === '/api/events') {
    $controller = new \Omekan\Controller\EventController();
    $controller->create();
    exit;
}

http_response_code(404);
echo json_encode([
    'status' => 'error',
    'message' => 'Endpoint not found'
]);
