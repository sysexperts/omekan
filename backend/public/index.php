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

error_log("Request: $requestMethod $requestUri");

// Event-spezifische Endpoints MÜSSEN vor dem Regex-Pattern kommen
if ($requestMethod === 'GET' && $requestUri === '/api/events/list') {
    error_log("Matched /api/events/list - calling EventControllerNew::index()");
    $controller = new \Omekan\Controller\EventControllerNew();
    $controller->index();
    exit;
}

if ($requestMethod === 'POST' && $requestUri === '/api/events/create') {
    $controller = new \Omekan\Controller\EventControllerNew();
    $controller->create();
    exit;
}

if ($requestMethod === 'GET' && $requestUri === '/api/events') {
    $controller = new \Omekan\Controller\EventListController();
    $controller->index();
    exit;
}

// Event Update (PUT /api/events/{id})
if ($requestMethod === 'PUT' && preg_match('#^/api/events/(\d+)$#', $requestUri, $matches)) {
    $controller = new \Omekan\Controller\EventControllerNew();
    $controller->update((int)$matches[1]);
    exit;
}

// Event Delete (DELETE /api/events/{id})
if ($requestMethod === 'DELETE' && preg_match('#^/api/events/(\d+)$#', $requestUri, $matches)) {
    $controller = new \Omekan\Controller\EventControllerNew();
    $controller->delete((int)$matches[1]);
    exit;
}

// Event-Detail-Route (Slug) - MUSS nach allen spezifischen /api/events/* Routes kommen
if ($requestMethod === 'GET' && preg_match('#^/api/events/([a-z0-9\-]+)$#', $requestUri, $matches)) {
    error_log("Matched event slug pattern: " . $matches[1]);
    $controller = new \Omekan\Controller\EventControllerNew();
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

if ($requestMethod === 'GET' && $requestUri === '/api/categories') {
    $controller = new \Omekan\Controller\CategoryController();
    $controller->index();
    exit;
}

if ($requestMethod === 'POST' && $requestUri === '/api/categories') {
    $controller = new \Omekan\Controller\CategoryController();
    $controller->create();
    exit;
}

if ($requestMethod === 'PUT' && preg_match('#^/api/categories/(\d+)$#', $requestUri, $matches)) {
    $controller = new \Omekan\Controller\CategoryController();
    $controller->update((int) $matches[1]);
    exit;
}

if ($requestMethod === 'DELETE' && preg_match('#^/api/categories/(\d+)$#', $requestUri, $matches)) {
    $controller = new \Omekan\Controller\CategoryController();
    $controller->delete((int) $matches[1]);
    exit;
}

if ($requestMethod === 'GET' && $requestUri === '/api/artists') {
    $controller = new \Omekan\Controller\ArtistController();
    $controller->index();
    exit;
}

if ($requestMethod === 'POST' && $requestUri === '/api/artists') {
    $controller = new \Omekan\Controller\ArtistController();
    $controller->create();
    exit;
}

if ($requestMethod === 'POST' && $requestUri === '/api/upload/event-image') {
    $controller = new \Omekan\Controller\UploadController();
    $controller->uploadEventImage();
    exit;
}

http_response_code(404);
echo json_encode([
    'status' => 'error',
    'message' => 'Endpoint not found'
]);
