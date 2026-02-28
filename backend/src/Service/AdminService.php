<?php

declare(strict_types=1);

namespace Omekan\Service;

use Omekan\Repository\UserRepository;
use Omekan\Repository\OrganizerRepository;
use Omekan\Repository\EventRepository;

class AdminService
{
    private UserRepository $userRepository;
    private OrganizerRepository $organizerRepository;
    private EventRepository $eventRepository;

    public function __construct()
    {
        $this->userRepository = new UserRepository();
        $this->organizerRepository = new OrganizerRepository();
        $this->eventRepository = new EventRepository();
    }

    public function getStatistics(): array
    {
        $allUsers = $this->userRepository->findAll();
        $allOrganizers = $this->organizerRepository->findAll();
        $allEvents = $this->eventRepository->findAll();
        
        $totalUsers = count($allUsers);
        $totalOrganizers = count($allOrganizers);
        $totalEvents = count($allEvents);
        
        $adminCount = 0;
        $organizerCount = 0;
        
        foreach ($allUsers as $user) {
            if ($user->role === 'admin') {
                $adminCount++;
            } elseif ($user->role === 'organizer') {
                $organizerCount++;
            }
        }
        
        return [
            'total_users' => $totalUsers,
            'total_admins' => $adminCount,
            'total_organizers' => $totalOrganizers,
            'total_events' => $totalEvents,
            'organizer_users' => $organizerCount
        ];
    }

    public function getAllUsers(): array
    {
        $users = $this->userRepository->findAll();
        return array_map(fn($user) => $user->toArray(), $users);
    }

    public function getAllOrganizers(): array
    {
        $organizers = $this->organizerRepository->findAll();
        
        $result = [];
        foreach ($organizers as $organizer) {
            $user = $this->userRepository->findById($organizer->userId);
            $result[] = [
                'id' => $organizer->id,
                'user_id' => $organizer->userId,
                'display_name' => $organizer->displayName,
                'website' => $organizer->website,
                'is_partner' => $organizer->isPartner,
                'token_balance' => $organizer->tokenBalance,
                'user_email' => $user ? $user->email : null,
                'user_name' => $user ? $user->name : null
            ];
        }
        
        return $result;
    }
}
