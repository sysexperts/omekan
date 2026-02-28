<?php

declare(strict_types=1);

namespace Omekan\Repository;

use Omekan\Database\Connection;
use Omekan\DTO\CommunityDTO;
use PDO;

class CommunityRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Connection::getInstance();
    }

    public function findAll(): array
    {
        $stmt = $this->db->query(
            'SELECT id, name, slug, flag_icon, preview_image, is_active 
             FROM communities 
             ORDER BY name ASC'
        );
        
        $rows = $stmt->fetchAll();
        
        return array_map(fn($row) => new CommunityDTO(
            id: (int) $row['id'],
            name: $row['name'],
            slug: $row['slug'],
            flagIcon: $row['flag_icon'],
            previewImage: $row['preview_image'],
            isActive: (bool) $row['is_active']
        ), $rows);
    }

    public function findById(int $id): ?CommunityDTO
    {
        $stmt = $this->db->prepare(
            'SELECT id, name, slug, flag_icon, preview_image, is_active 
             FROM communities 
             WHERE id = ?'
        );
        
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        return new CommunityDTO(
            id: (int) $row['id'],
            name: $row['name'],
            slug: $row['slug'],
            flagIcon: $row['flag_icon'],
            previewImage: $row['preview_image'],
            isActive: (bool) $row['is_active']
        );
    }

    public function create(string $name, string $slug, ?string $flagIcon, ?string $previewImage, bool $isActive): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO communities (name, slug, flag_icon, preview_image, is_active) 
             VALUES (?, ?, ?, ?, ?)'
        );
        
        $stmt->execute([$name, $slug, $flagIcon, $previewImage, $isActive ? 1 : 0]);
        
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, string $name, string $slug, ?string $flagIcon, ?string $previewImage, bool $isActive): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE communities 
             SET name = ?, slug = ?, flag_icon = ?, preview_image = ?, is_active = ? 
             WHERE id = ?'
        );
        
        return $stmt->execute([$name, $slug, $flagIcon, $previewImage, $isActive ? 1 : 0, $id]);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM communities WHERE id = ?');
        return $stmt->execute([$id]);
    }
}
