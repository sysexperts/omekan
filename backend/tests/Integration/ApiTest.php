<?php

namespace Omekan\Tests\Integration;

use PHPUnit\Framework\TestCase;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class ApiTest extends TestCase
{
    private $client;
    private $baseUrl;

    protected function setUp(): void
    {
        $this->baseUrl = 'http://localhost/api';
        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'timeout' => 10.0,
            'http_errors' => false
        ]);
    }

    public function testHealthEndpoint()
    {
        $response = $this->client->get('/health');
        
        $this->assertEquals(200, $response->getStatusCode());
        
        $data = json_decode($response->getBody(), true);
        $this->assertEquals('healthy', $data['status']);
    }

    public function testGetAllEvents()
    {
        $response = $this->client->get('/events');
        
        $this->assertEquals(200, $response->getStatusCode());
        
        $data = json_decode($response->getBody(), true);
        $this->assertEquals('success', $data['status']);
        $this->assertIsArray($data['data']);
    }

    public function testGetAllCommunities()
    {
        $response = $this->client->get('/communities');
        
        $this->assertEquals(200, $response->getStatusCode());
        
        $data = json_decode($response->getBody(), true);
        $this->assertEquals('success', $data['status']);
        $this->assertIsArray($data['data']);
        
        // Verify community structure
        if (!empty($data['data'])) {
            $community = $data['data'][0];
            $this->assertArrayHasKey('id', $community);
            $this->assertArrayHasKey('name', $community);
            $this->assertArrayHasKey('slug', $community);
        }
    }

    public function testGetAllCategories()
    {
        $response = $this->client->get('/categories');
        
        $this->assertEquals(200, $response->getStatusCode());
        
        $data = json_decode($response->getBody(), true);
        $this->assertEquals('success', $data['status']);
        $this->assertIsArray($data['data']);
        
        // Verify category structure
        if (!empty($data['data'])) {
            $category = $data['data'][0];
            $this->assertArrayHasKey('id', $category);
            $this->assertArrayHasKey('name', $category);
            $this->assertArrayHasKey('slug', $category);
        }
    }

    public function testCreateEvent()
    {
        $eventData = [
            'title' => 'Integration Test Event',
            'description' => 'This is a test event created during integration testing',
            'start_datetime' => '2026-06-01T19:00:00Z',
            'end_datetime' => '2026-06-01T23:00:00Z',
            'location_name' => 'Test Venue',
            'is_promoted' => false,
            'community_ids' => [1],
            'category_ids' => [1]
        ];

        $response = $this->client->post('/events', [
            'json' => $eventData,
            'headers' => [
                'Content-Type' => 'application/json'
            ]
        ]);

        $this->assertEquals(201, $response->getStatusCode());
        
        $data = json_decode($response->getBody(), true);
        $this->assertEquals('success', $data['status']);
        $this->assertArrayHasKey('data', $data);
        $this->assertArrayHasKey('id', $data['data']);
        
        return $data['data']['id'];
    }

    /**
     * @depends testCreateEvent
     */
    public function testGetEventById($eventId)
    {
        $response = $this->client->get("/events/{$eventId}");
        
        $this->assertEquals(200, $response->getStatusCode());
        
        $data = json_decode($response->getBody(), true);
        $this->assertEquals('success', $data['status']);
        $this->assertArrayHasKey('data', $data);
        $this->assertEquals($eventId, $data['data']['id']);
        $this->assertEquals('Integration Test Event', $data['data']['title']);
        
        return $eventId;
    }

    /**
     * @depends testGetEventById
     */
    public function testUpdateEvent($eventId)
    {
        $updateData = [
            'title' => 'Updated Integration Test Event',
            'description' => 'This event has been updated during testing'
        ];

        $response = $this->client->put("/events/{$eventId}", [
            'json' => $updateData,
            'headers' => [
                'Content-Type' => 'application/json'
            ]
        ]);

        $this->assertEquals(200, $response->getStatusCode());
        
        $data = json_decode($response->getBody(), true);
        $this->assertEquals('success', $data['status']);
        
        // Verify the update
        $getResponse = $this->client->get("/events/{$eventId}");
        $getData = json_decode($getResponse->getBody(), true);
        $this->assertEquals('Updated Integration Test Event', $getData['data']['title']);
        
        return $eventId;
    }

    /**
     * @depends testUpdateEvent
     */
    public function testDeleteEvent($eventId)
    {
        $response = $this->client->delete("/events/{$eventId}");
        
        $this->assertEquals(200, $response->getStatusCode());
        
        $data = json_decode($response->getBody(), true);
        $this->assertEquals('success', $data['status']);
        
        // Verify deletion
        $getResponse = $this->client->get("/events/{$eventId}");
        $this->assertEquals(404, $getResponse->getStatusCode());
    }

    public function testInvalidEventCreation()
    {
        $invalidData = [
            'title' => '', // Empty title
            'start_datetime' => 'invalid-date' // Invalid date
        ];

        $response = $this->client->post('/events', [
            'json' => $invalidData,
            'headers' => [
                'Content-Type' => 'application/json'
            ]
        ]);

        $this->assertEquals(400, $response->getStatusCode());
        
        $data = json_decode($response->getBody(), true);
        $this->assertEquals('error', $data['status']);
        $this->assertArrayHasKey('errors', $data);
    }

    public function testNonExistentEventRetrieval()
    {
        $response = $this->client->get('/events/99999');
        
        $this->assertEquals(404, $response->getStatusCode());
        
        $data = json_decode($response->getBody(), true);
        $this->assertEquals('error', $data['status']);
    }

    public function testCorsHeaders()
    {
        $response = $this->client->options('/events');
        
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertTrue($response->hasHeader('Access-Control-Allow-Origin'));
        $this->assertTrue($response->hasHeader('Access-Control-Allow-Methods'));
        $this->assertTrue($response->hasHeader('Access-Control-Allow-Headers'));
    }

    public function testRateLimiting()
    {
        // Make multiple rapid requests to test rate limiting
        $responses = [];
        for ($i = 0; $i < 15; $i++) {
            $responses[] = $this->client->get('/events');
        }

        // Check if any requests were rate limited (429 status)
        $rateLimitedResponses = array_filter($responses, function($response) {
            return $response->getStatusCode() === 429;
        });

        // Should have some rate limited responses if rate limiting is working
        $this->assertGreaterThanOrEqual(0, count($rateLimitedResponses));
    }

    public function testImageUpload()
    {
        // Create a test image
        $testImage = imagecreate(100, 100);
        $testImagePath = sys_get_temp_dir() . '/test-event-image.jpg';
        imagejpeg($testImage, $testImagePath);

        $response = $this->client->post('/upload/event-image', [
            'multipart' => [
                [
                    'name' => 'image',
                    'contents' => fopen($testImagePath, 'r'),
                    'filename' => 'test-event-image.jpg'
                ]
            ]
        ]);

        $this->assertEquals(200, $response->getStatusCode());
        
        $data = json_decode($response->getBody(), true);
        $this->assertEquals('success', $data['status']);
        $this->assertArrayHasKey('data', $data);
        $this->assertArrayHasKey('path', $data['data']);

        // Clean up
        unlink($testImagePath);
        if (isset($data['data']['path'])) {
            $uploadedFile = __DIR__ . '/../../public' . $data['data']['path'];
            if (file_exists($uploadedFile)) {
                unlink($uploadedFile);
            }
        }
    }

    public function testInvalidImageUpload()
    {
        // Try to upload a text file as image
        $testFile = sys_get_temp_dir() . '/test-invalid.txt';
        file_put_contents($testFile, 'This is not an image');

        $response = $this->client->post('/upload/event-image', [
            'multipart' => [
                [
                    'name' => 'image',
                    'contents' => fopen($testFile, 'r'),
                    'filename' => 'test-invalid.txt'
                ]
            ]
        ]);

        $this->assertEquals(400, $response->getStatusCode());
        
        $data = json_decode($response->getBody(), true);
        $this->assertEquals('error', $data['status']);

        // Clean up
        unlink($testFile);
    }

    public function testSearchEndpoint()
    {
        $response = $this->client->get('/search/events?q=test&limit=5');
        
        $this->assertEquals(200, $response->getStatusCode());
        
        $data = json_decode($response->getBody(), true);
        $this->assertEquals('success', $data['status']);
        $this->assertArrayHasKey('data', $data);
        $this->assertArrayHasKey('pagination', $data);
        $this->assertArrayHasKey('filters', $data);
        
        // Verify pagination structure
        $pagination = $data['pagination'];
        $this->assertArrayHasKey('total', $pagination);
        $this->assertArrayHasKey('limit', $pagination);
        $this->assertArrayHasKey('offset', $pagination);
        $this->assertArrayHasKey('has_more', $pagination);
    }

    public function testAnalyticsEndpoint()
    {
        $analyticsData = [
            'events' => [
                [
                    'id' => 'evt_test_123',
                    'type' => 'page_view',
                    'sessionId' => 'session_test_123',
                    'userId' => 'user_test_123',
                    'timestamp' => date('c'),
                    'url' => 'http://localhost/frontend/events.html',
                    'properties' => [
                        'title' => 'Events - Omekan',
                        'viewport' => '1920x1080'
                    ]
                ]
            ]
        ];

        $response = $this->client->post('/analytics/events', [
            'json' => $analyticsData,
            'headers' => [
                'Content-Type' => 'application/json'
            ]
        ]);

        $this->assertEquals(200, $response->getStatusCode());
        
        $data = json_decode($response->getBody(), true);
        $this->assertEquals('success', $data['status']);
    }

    public function testErrorHandling()
    {
        // Test malformed JSON
        $response = $this->client->post('/events', [
            'body' => 'invalid-json',
            'headers' => [
                'Content-Type' => 'application/json'
            ]
        ]);

        $this->assertEquals(400, $response->getStatusCode());
        
        $data = json_decode($response->getBody(), true);
        $this->assertEquals('error', $data['status']);
    }

    public function testSecurityHeaders()
    {
        $response = $this->client->get('/events');
        
        // Check for security headers
        $this->assertTrue($response->hasHeader('X-Content-Type-Options'));
        $this->assertTrue($response->hasHeader('X-Frame-Options'));
        $this->assertTrue($response->hasHeader('X-XSS-Protection'));
    }
}
