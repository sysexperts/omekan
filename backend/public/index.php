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

if ($requestMethod === 'GET' && $requestUri === '/api/admin/stats') {
    $controller = new \Omekan\Controller\AdminController();
    $controller->getStats();
    exit;
}

if ($requestMethod === 'GET' && $requestUri === '/api/admin/users') {
    $controller = new \Omekan\Controller\AdminController();
    $controller->getUsers();
    exit;
}

if ($requestMethod === 'GET' && $requestUri === '/api/admin/organizers') {
    $controller = new \Omekan\Controller\AdminController();
    $controller->getOrganizers();
    exit;
}

if ($requestMethod === 'GET' && $requestUri === '/api/communities') {
    $controller = new \Omekan\Controller\CommunityController();
    $controller->index();
    exit;
}

if ($requestMethod === 'POST' && $requestUri === '/api/communities') {
    $controller = new \Omekan\Controller\CommunityController();
    $controller->create();
    exit;
}

if ($requestMethod === 'PUT' && preg_match('#^/api/communities/(\d+)$#', $requestUri, $matches)) {
    $controller = new \Omekan\Controller\CommunityController();
    $controller->update((int) $matches[1]);
    exit;
}

if ($requestMethod === 'DELETE' && preg_match('#^/api/communities/(\d+)$#', $requestUri, $matches)) {
    $controller = new \Omekan\Controller\CommunityController();
    $controller->delete((int) $matches[1]);
    exit;
}

http_response_code(404);
echo json_encode([
    'status' => 'error',
    'message' => 'Endpoint not found'
]);
