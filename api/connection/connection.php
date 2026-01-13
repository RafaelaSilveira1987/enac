<?php

class Conexao
{
    public static $instance;

    private function __construct()
    {
        //
    }

    public static function getConexao()
    {
        if (!isset(self::$instance)) {

            // Define ambiente local ou produção
            $ambiente = self::detectarAmbiente();

            if ($ambiente == 'local') {
                $dsn = 'mysql:host=localhost;dbname=enac';
                $user = 'root';
                $pass = '';
            } else {
                $dsn = 'mysql:host=localhost;dbname=frontiers09';
                $user = 'frontiers09';
                $pass = 'frontiers7232';
            }

            self::$instance = new PDO($dsn, $user, $pass, array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"));
            self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            self::$instance->setAttribute(PDO::ATTR_ORACLE_NULLS, PDO::NULL_EMPTY_STRING);
        }

        return self::$instance;
    }

    private static function detectarAmbiente()
    {
        // Se estiver rodando via navegador
        if (isset($_SERVER['HTTP_HOST'])) {
            return in_array($_SERVER['HTTP_HOST'], ['localhost', 'localhost:80', '127.0.0.1']) ? 'local' : 'producao';
        }

        // Se estiver rodando via CLI (linha de comando)
        if (php_sapi_name() === 'cli') {
            return 'local';
        }

        // Fallback para produção, por segurança
        return 'producao';
    }
}
