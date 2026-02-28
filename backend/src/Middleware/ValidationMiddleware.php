<?php

namespace Omekan\Middleware;

class ValidationMiddleware
{
    private $rules;

    public function __construct()
    {
        $this->rules = [
            'events' => [
                'title' => ['required', 'string', 'max:255'],
                'description' => ['string', 'max:2000'],
                'start_datetime' => ['required', 'datetime'],
                'end_datetime' => ['datetime', 'after:start_datetime'],
                'location_name' => ['string', 'max:255'],
                'is_promoted' => ['boolean'],
                'affiliate_url' => ['url', 'max:500'],
                'community_ids' => ['array'],
                'category_ids' => ['array'],
                'artist_ids' => ['array']
            ],
            'auth' => [
                'email' => ['required', 'email', 'max:255'],
                'password' => ['required', 'string', 'min:6', 'max:255'],
                'name' => ['required', 'string', 'max:255']
            ],
            'upload' => [
                'image' => ['required', 'file', 'image', 'max:10240'] // 10MB max
            ]
        ];
    }

    public function handle($request, $next)
    {
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $method = $_SERVER['REQUEST_METHOD'];
        
        // Only validate POST, PUT, PATCH requests
        if (!in_array($method, ['POST', 'PUT', 'PATCH'])) {
            return $next($request);
        }

        $validationRules = $this->getRulesForPath($path);
        
        if (empty($validationRules)) {
            return $next($request);
        }

        $data = $this->getRequestData();
        $errors = $this->validate($data, $validationRules);

        if (!empty($errors)) {
            return $this->validationErrorResponse($errors);
        }

        return $next($request);
    }

    private function getRulesForPath($path)
    {
        if (str_contains($path, '/events')) {
            return $this->rules['events'];
        }
        
        if (str_contains($path, '/auth')) {
            return $this->rules['auth'];
        }
        
        if (str_contains($path, '/upload')) {
            return $this->rules['upload'];
        }
        
        return [];
    }

    private function getRequestData()
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        
        if (str_contains($contentType, 'application/json')) {
            $input = file_get_contents('php://input');
            return json_decode($input, true) ?? [];
        }
        
        if (str_contains($contentType, 'multipart/form-data')) {
            return array_merge($_POST, $_FILES);
        }
        
        return $_POST;
    }

    private function validate($data, $rules)
    {
        $errors = [];

        foreach ($rules as $field => $fieldRules) {
            $value = $data[$field] ?? null;
            $fieldErrors = $this->validateField($field, $value, $fieldRules, $data);
            
            if (!empty($fieldErrors)) {
                $errors[$field] = $fieldErrors;
            }
        }

        return $errors;
    }

    private function validateField($field, $value, $rules, $allData)
    {
        $errors = [];

        foreach ($rules as $rule) {
            $ruleParts = explode(':', $rule);
            $ruleName = $ruleParts[0];
            $ruleValue = $ruleParts[1] ?? null;

            switch ($ruleName) {
                case 'required':
                    if (empty($value) && $value !== '0' && $value !== 0) {
                        $errors[] = "{$field} is required";
                    }
                    break;

                case 'string':
                    if (!is_null($value) && !is_string($value)) {
                        $errors[] = "{$field} must be a string";
                    }
                    break;

                case 'email':
                    if (!is_null($value) && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                        $errors[] = "{$field} must be a valid email address";
                    }
                    break;

                case 'url':
                    if (!is_null($value) && !filter_var($value, FILTER_VALIDATE_URL)) {
                        $errors[] = "{$field} must be a valid URL";
                    }
                    break;

                case 'datetime':
                    if (!is_null($value) && !$this->isValidDateTime($value)) {
                        $errors[] = "{$field} must be a valid datetime";
                    }
                    break;

                case 'boolean':
                    if (!is_null($value) && !is_bool($value) && !in_array($value, ['0', '1', 0, 1, 'true', 'false'])) {
                        $errors[] = "{$field} must be a boolean";
                    }
                    break;

                case 'array':
                    if (!is_null($value) && !is_array($value)) {
                        $errors[] = "{$field} must be an array";
                    }
                    break;

                case 'min':
                    if (!is_null($value)) {
                        if (is_string($value) && strlen($value) < (int)$ruleValue) {
                            $errors[] = "{$field} must be at least {$ruleValue} characters";
                        } elseif (is_numeric($value) && $value < (int)$ruleValue) {
                            $errors[] = "{$field} must be at least {$ruleValue}";
                        }
                    }
                    break;

                case 'max':
                    if (!is_null($value)) {
                        if (is_string($value) && strlen($value) > (int)$ruleValue) {
                            $errors[] = "{$field} must not exceed {$ruleValue} characters";
                        } elseif (is_numeric($value) && $value > (int)$ruleValue) {
                            $errors[] = "{$field} must not exceed {$ruleValue}";
                        }
                    }
                    break;

                case 'file':
                    if (!is_null($value) && !$this->isValidFile($value)) {
                        $errors[] = "{$field} must be a valid file";
                    }
                    break;

                case 'image':
                    if (!is_null($value) && !$this->isValidImage($value)) {
                        $errors[] = "{$field} must be a valid image file (JPG, PNG, GIF, WEBP)";
                    }
                    break;

                case 'after':
                    if (!is_null($value) && isset($allData[$ruleValue])) {
                        $compareValue = $allData[$ruleValue];
                        if ($this->isValidDateTime($value) && $this->isValidDateTime($compareValue)) {
                            if (strtotime($value) <= strtotime($compareValue)) {
                                $errors[] = "{$field} must be after {$ruleValue}";
                            }
                        }
                    }
                    break;
            }
        }

        return $errors;
    }

    private function isValidDateTime($value)
    {
        if (empty($value)) {
            return false;
        }

        $formats = [
            'Y-m-d H:i:s',
            'Y-m-d\TH:i:s\Z',
            'Y-m-d\TH:i:sP',
            'Y-m-d'
        ];

        foreach ($formats as $format) {
            $date = \DateTime::createFromFormat($format, $value);
            if ($date && $date->format($format) === $value) {
                return true;
            }
        }

        return false;
    }

    private function isValidFile($file)
    {
        return is_array($file) && 
               isset($file['tmp_name']) && 
               isset($file['error']) && 
               $file['error'] === UPLOAD_ERR_OK &&
               is_uploaded_file($file['tmp_name']);
    }

    private function isValidImage($file)
    {
        if (!$this->isValidFile($file)) {
            return false;
        }

        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $fileType = mime_content_type($file['tmp_name']);
        
        if (!in_array($fileType, $allowedTypes)) {
            return false;
        }

        $maxSize = ($_ENV['UPLOAD_MAX_SIZE'] ?? 10485760); // 10MB default
        if ($file['size'] > $maxSize) {
            return false;
        }

        // Verify it's actually an image
        $imageInfo = getimagesize($file['tmp_name']);
        return $imageInfo !== false;
    }

    private function validationErrorResponse($errors)
    {
        http_response_code(400);
        header('Content-Type: application/json');
        
        echo json_encode([
            'status' => 'error',
            'message' => 'Validation failed',
            'errors' => $errors,
            'code' => 400
        ]);
        
        exit;
    }

    // Sanitize input data
    public static function sanitizeInput($data)
    {
        if (is_array($data)) {
            return array_map([self::class, 'sanitizeInput'], $data);
        }
        
        if (is_string($data)) {
            // Remove potential XSS
            $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
            // Trim whitespace
            $data = trim($data);
            // Remove null bytes
            $data = str_replace("\0", '', $data);
        }
        
        return $data;
    }

    // Custom validation rules
    public function addRule($name, $callback)
    {
        $this->customRules[$name] = $callback;
    }

    // Validate specific data types
    public static function validateEventSlug($slug)
    {
        return preg_match('/^[a-z0-9-]+$/', $slug) && strlen($slug) >= 3 && strlen($slug) <= 100;
    }

    public static function validateCommunityId($id)
    {
        return is_numeric($id) && $id > 0;
    }

    public static function validateCategoryId($id)
    {
        return is_numeric($id) && $id > 0;
    }

    public static function validateArtistId($id)
    {
        return is_numeric($id) && $id > 0;
    }
}
