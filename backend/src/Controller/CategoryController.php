<?php

declare(strict_types=1);

namespace Omekan\Controller;

use Omekan\Service\CategoryService;

class CategoryController
{
    private CategoryService $categoryService;

    public function __construct()
    {
        $this->categoryService = new CategoryService();
    }

    public function index(): void
    {
        $categories = $this->categoryService->getAllCategories();
        
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => $categories
        ]);
    }

    public function show(int $id): void
    {
        $category = $this->categoryService->getCategoryById($id);
        
        if ($category === null) {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'Category not found'
            ]);
            return;
        }

        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => $category
        ]);
    }

    public function create(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $category = $this->categoryService->createCategory($data);
        
        if ($category === null) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid category data'
            ]);
            return;
        }

        http_response_code(201);
        echo json_encode([
            'status' => 'success',
            'data' => $category,
            'message' => 'Category created successfully'
        ]);
    }

    public function update(int $id): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $category = $this->categoryService->updateCategory($id, $data);
        
        if ($category === null) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to update category'
            ]);
            return;
        }

        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => $category,
            'message' => 'Category updated successfully'
        ]);
    }

    public function delete(int $id): void
    {
        $success = $this->categoryService->deleteCategory($id);
        
        if (!$success) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to delete category'
            ]);
            return;
        }

        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => 'Category deleted successfully'
        ]);
    }
}
