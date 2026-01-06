<?php
require_once __DIR__ . "/routes.php";
require_once __DIR__ . "/../core/AuthMiddleware.php";

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['url'] ?? ($_GET['r'] ?? '');
$path = trim($path, '/');

// Remove automaticamente o prefixo api/v1/
$path = preg_replace('#^api/v1/#', '', $path);

$path = strtolower($path);

$key = "$method:$path";

if (isset($routes[$key])) {
    // rota estática
    call_user_func($routes[$key]);
    exit;
}

foreach ($routes as $route => $handler) {
    if (str_contains($route, '{id}')) {
        // transforma "GET:avaliation/{id}" em um padrão de match
        $pattern = str_replace('{id}', '([a-zA-Z0-9\-]+)', $route);
        $pattern = '#^' . $pattern . '$#';

        if (preg_match($pattern, $key, $matches)) {
            // $matches[1] é o id
            call_user_func($handler, $matches[1]);
            exit;
        }
    }
}

if (isset($routes[$key])) {
    call_user_func($routes[$key]);
} else {
    http_response_code(404);
    echo json_encode(["error" => "Rota não encontrada"]);
}
