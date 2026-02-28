<?php

namespace Omekan\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Mockery;
use Omekan\Service\EventServiceNew;
use Omekan\Repository\EventRepositoryNew;

class EventServiceTest extends TestCase
{
    private $eventService;
    private $mockRepository;

    protected function setUp(): void
    {
        $this->mockRepository = Mockery::mock(EventRepositoryNew::class);
        $this->eventService = new EventServiceNew($this->mockRepository);
    }

    protected function tearDown(): void
    {
        Mockery::close();
    }

    public function testGetAllEvents()
    {
        // Arrange
        $expectedEvents = [
            [
                'id' => 1,
                'slug' => 'test-event',
                'title' => 'Test Event',
                'description' => 'Test Description',
                'start_datetime' => '2026-03-01 19:00:00'
            ]
        ];

        $this->mockRepository
            ->shouldReceive('findAll')
            ->once()
            ->andReturn($expectedEvents);

        // Act
        $result = $this->eventService->getAllEvents();

        // Assert
        $this->assertEquals($expectedEvents, $result);
    }

    public function testGetEventById()
    {
        // Arrange
        $eventId = 1;
        $expectedEvent = [
            'id' => 1,
            'slug' => 'test-event',
            'title' => 'Test Event',
            'description' => 'Test Description'
        ];

        $this->mockRepository
            ->shouldReceive('findByIdForDetail')
            ->with($eventId)
            ->once()
            ->andReturn($expectedEvent);

        // Act
        $result = $this->eventService->getEventById($eventId);

        // Assert
        $this->assertEquals($expectedEvent, $result);
    }

    public function testGetEventByIdNotFound()
    {
        // Arrange
        $eventId = 999;

        $this->mockRepository
            ->shouldReceive('findByIdForDetail')
            ->with($eventId)
            ->once()
            ->andReturn(null);

        // Act
        $result = $this->eventService->getEventById($eventId);

        // Assert
        $this->assertNull($result);
    }

    public function testCreateEvent()
    {
        // Arrange
        $eventData = [
            'title' => 'New Event',
            'description' => 'New Description',
            'start_datetime' => '2026-03-01T19:00:00Z',
            'location_name' => 'Test Location'
        ];

        $expectedEventId = 123;

        $this->mockRepository
            ->shouldReceive('create')
            ->with($eventData)
            ->once()
            ->andReturn($expectedEventId);

        // Act
        $result = $this->eventService->createEvent($eventData);

        // Assert
        $this->assertEquals($expectedEventId, $result);
    }

    public function testUpdateEvent()
    {
        // Arrange
        $eventId = 1;
        $eventData = [
            'title' => 'Updated Event',
            'description' => 'Updated Description'
        ];

        $this->mockRepository
            ->shouldReceive('update')
            ->with($eventId, $eventData)
            ->once()
            ->andReturn(true);

        // Act
        $result = $this->eventService->updateEvent($eventId, $eventData);

        // Assert
        $this->assertTrue($result);
    }

    public function testDeleteEvent()
    {
        // Arrange
        $eventId = 1;

        $this->mockRepository
            ->shouldReceive('delete')
            ->with($eventId)
            ->once()
            ->andReturn(true);

        // Act
        $result = $this->eventService->deleteEvent($eventId);

        // Assert
        $this->assertTrue($result);
    }

    public function testValidateEventData()
    {
        // Test valid data
        $validData = [
            'title' => 'Valid Event',
            'description' => 'Valid Description',
            'start_datetime' => '2026-03-01T19:00:00Z',
            'location_name' => 'Valid Location'
        ];

        $errors = $this->eventService->validateEventData($validData);
        $this->assertEmpty($errors);

        // Test invalid data
        $invalidData = [
            'title' => '', // Empty title
            'start_datetime' => 'invalid-date', // Invalid date
        ];

        $errors = $this->eventService->validateEventData($invalidData);
        $this->assertNotEmpty($errors);
        $this->assertArrayHasKey('title', $errors);
        $this->assertArrayHasKey('start_datetime', $errors);
    }

    public function testFormatEventForResponse()
    {
        // Arrange
        $rawEvent = [
            'id' => 1,
            'slug' => 'test-event',
            'title' => 'Test Event',
            'start_datetime' => '2026-03-01 19:00:00',
            'created_at' => '2026-02-28 10:00:00'
        ];

        // Act
        $formatted = $this->eventService->formatEventForResponse($rawEvent);

        // Assert
        $this->assertArrayHasKey('formatted_date', $formatted);
        $this->assertArrayHasKey('formatted_time', $formatted);
        $this->assertEquals('01.03.2026', $formatted['formatted_date']);
        $this->assertEquals('19:00', $formatted['formatted_time']);
    }
}
