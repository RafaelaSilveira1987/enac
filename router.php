<?php

class Router
{
    private array $routes = [];

    public function add(string $path, callable $callback): void
    {
        $this->routes[$this->normalize($path)] = $callback;
    }

    public function handle(?string $url): void
    {
        $path = $this->normalize($url ?? '/');

        if (isset($this->routes[$path])) {
            call_user_func($this->routes[$path]);
            return;
        }

        // fallback simples
        http_response_code(404);
        echo 'Página não encontrada';
    }

    private function normalize(string $path): string
    {
        $path = trim($path, '/');
        return $path === '' ? '/' : '/' . $path;
    }
}
