<?php

declare(strict_types=1);

namespace Omekan\Service;

use Omekan\Repository\CategoryRepository;

class CategoryService
{
    private CategoryRepository $categoryRepository;

    public function __construct()
    {
        $this->categoryRepository = new CategoryRepository();
    }

    public function getAllCategories(): array
    {
        $categories = $this->categoryRepository->findAll();
        return array_map(fn($category) => $category->toArray(), $categories);
    }

    public function getCategoryById(int $id): ?array
    {
        $category = $this->categoryRepository->findById($id);
        return $category?->toArray();
    }

    public function createCategory(array $data): ?array
    {
        if (!isset($data['name']) || !isset($data['slug'])) {
            return null;
        }

        $id = $this->categoryRepository->create($data['name'], $data['slug']);
        return $this->getCategoryById($id);
    }

    public function updateCategory(int $id, array $data): ?array
    {
        if (!isset($data['name']) || !isset($data['slug'])) {
            return null;
        }

        $success = $this->categoryRepository->update($id, $data['name'], $data['slug']);
        return $success ? $this->getCategoryById($id) : null;
    }

    public function deleteCategory(int $id): bool
    {
        return $this->categoryRepository->delete($id);
    }
}
