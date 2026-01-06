<?php
require_once __DIR__ . "/Jwt.php";
require_once __DIR__ . "/Response.php";

class AuthMiddleware {
    public static function protect() {
        $headers = getallheaders();

        if(!isset($headers['Authorization'])) {
            Response::json(["error"=>"Token não fornecido"], 401);
        }

        $token = str_replace("Bearer ", "", $headers['Authorization']);
        $payload = Jwt::validate($token);

        if(!$payload) {
            Response::json(["error"=>"Token inválido ou expirado"], 401);
        }

        return $payload;
    }
}
