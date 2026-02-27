<?php

declare(strict_types=1);

namespace Omekan\Service;

use Omekan\Repository\UserRepository;

class AuthService
{
    private UserRepository $userRepository;

    public function __construct()
    {
        $this->userRepository = new UserRepository();
    }

    public function login(string $email, string $password): ?array
    {
        $user = $this->userRepository->findByEmail($email);
        
        if (!$user) {
            return null;
        }

        $passwordHash = $this->userRepository->getPasswordHash($email);
        
        if (!password_verify($password, $passwordHash)) {
            return null;
        }

        return $user->toArray();
    }

    public function register(string $name, string $email, string $password): ?array
    {
        if ($this->userRepository->findByEmail($email)) {
            return null;
        }

        $userCount = $this->userRepository->countUsers();
        $role = $userCount === 0 ? 'admin' : 'organizer';

        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        
        $userId = $this->userRepository->create($name, $email, $passwordHash, $role);
        
        $user = $this->userRepository->findByEmail($email);
        
        return $user?->toArray();
    }
}
