<?php
$url = $_GET['url'] ?? '';
$parts = explode('/', $url);

$version = $parts[1] ?? 'v1';
$route = $parts[2] ?? '';

$apiIndex = __DIR__ . "/$version/index.php";

if(file_exists($apiIndex)) {
    $_GET['r'] = $route;
    require $apiIndex;
} else {
    http_response_code(404);
    echo json_encode(["error"=>"Versão da API não encontrada"]);
}
