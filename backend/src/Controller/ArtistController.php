<?php

declare(strict_types=1);

namespace Omekan\Controller;

use Omekan\Repository\ArtistRepository;

class ArtistController
{
    private ArtistRepository $artistRepository;

    public function __construct()
    {
        $this->artistRepository = new ArtistRepository();
    }

    public function index(): void
    {
        $artists = $this->artistRepository->findAll();
        
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => $artists
        ]);
    }

    public function show(int $id): void
    {
        $artist = $this->artistRepository->findById($id);
        
        if ($artist === null) {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'Artist not found'
            ]);
            return;
        }

        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => $artist
        ]);
    }

    public function create(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['name'])) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Artist name is required'
            ]);
            return;
        }

        $artistId = $this->artistRepository->create(
            name: $data['name'],
            spotifyId: $data['spotify_id'] ?? null,
            imagePath: $data['image_path'] ?? null,
            description: $data['description'] ?? null
        );

        $artist = $this->artistRepository->findById($artistId);

        http_response_code(201);
        echo json_encode([
            'status' => 'success',
            'data' => $artist,
            'message' => 'Artist created successfully'
        ]);
    }
}
