<?php

declare(strict_types=1);

namespace Omekan\Controller;

class UploadController
{
    private string $uploadDir;

    public function __construct()
    {
        // Docker-Container-Pfad verwenden
        $this->uploadDir = '/var/www/uploads/events/';
        
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0777, true);
        }
    }

    public function uploadEventImage(): void
    {
        header('Content-Type: application/json');

        try {
            if (!isset($_FILES['image'])) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'No file uploaded'
                ]);
                return;
            }

            if ($_FILES['image']['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Upload error: ' . $_FILES['image']['error']
                ]);
                return;
            }

        $file = $_FILES['image'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        
        if (!in_array($file['type'], $allowedTypes)) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid file type. Only JPG, PNG, GIF, WEBP allowed'
            ]);
            return;
        }

        $maxSize = 5 * 1024 * 1024; // 5MB
        if ($file['size'] > $maxSize) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'File too large. Max 5MB allowed'
            ]);
            return;
        }

        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid('event_', true) . '.' . $extension;
        $filepath = $this->uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to save file'
            ]);
            return;
        }

        $publicPath = '/uploads/events/' . $filename;

        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => [
                'path' => $publicPath,
                'filename' => $filename
            ],
            'message' => 'File uploaded successfully'
        ]);
        
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Server error: ' . $e->getMessage()
            ]);
        }
    }
}
