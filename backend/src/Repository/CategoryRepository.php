<?php

declare(strict_types=1);

namespace Omekan\Repository;

use Omekan\Database\Connection;
use Omekan\DTO\CategoryDTO;
use PDO;

class CategoryRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Connection::getInstance();
    }

    public function findAll(): array
    {
        $stmt = $this->db->query(
            'SELECT id, name, slug FROM categories ORDER BY name ASC'
        );
        
        $rows = $stmt->fetchAll();
        
        return array_map(fn($row) => new CategoryDTO(
            id: (int) $row['id'],
            name: $row['name'],
            slug: $row['slug']
        ), $rows);
    }

    public function findById(int $id): ?CategoryDTO
    {
        $stmt = $this->db->prepare(
            'SELECT id, name, slug FROM categories WHERE id = ?'
        );
        
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        return new CategoryDTO(
            id: (int) $row['id'],
            name: $row['name'],
            slug: $row['slug']
        );
    }

    public function create(string $name, string $slug): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO categories (name, slug) VALUES (?, ?)'
        );
        
        $stmt->execute([$name, $slug]);
        
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, string $name, string $slug): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE categories SET name = ?, slug = ? WHERE id = ?'
        );
        
        return $stmt->execute([$name, $slug, $id]);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM categories WHERE id = ?');
        return $stmt->execute([$id]);
    }
}
