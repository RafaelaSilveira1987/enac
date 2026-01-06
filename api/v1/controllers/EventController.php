<?php

require_once __DIR__ . '../../../helpers/cpf.php';
require_once __DIR__ . '../../../helpers/token.php';
require_once __DIR__ . '../../../helpers/response.php';
require_once __DIR__ . '../../../connection/connection.php';

class EventController
{

    public static function findEvent()
    {
        try {
            $pdo = Conexao::getConexao();

            // 🔐 Valida JWT e pega payload
            $payload = AuthMiddleware::protect();
            $uuid = $payload['uuid'] ?? null;

            if (!$uuid) {
                jsonResponse(['success' => false, 'error' => 'Token inválido'], 401);
                exit;
            }

            // Busca inscrição ativa
            $stmt = $pdo->prepare("SELECT 
                                            *
                                            FROM evento p 
                                            WHERE p.id = 1
                                            limit 1");

            $stmt->execute();
            $evento = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$evento) {
                jsonResponse(['success' => false, 'error' => 'evento não encontrado'], 400);
            }

            jsonResponse([
                'evento' => $evento['nome_evento'],
                'data_inicio_inscricoes' => $evento['data_inicio_inscricoes'],
                'data_fim_inscricoes' => $evento['data_fim_inscricoes'],
                'data_evento' => $evento['data_evento'],
                'valor_periodo' => $evento['valor_periodo'],
                'valor_fora_periodo' => $evento['valor_fora_periodo'],
                'taxa_inscricao' => $evento['taxa_inscricao'],
            ]);
        } catch (\Exception $e) {
            jsonResponse(['success' => false, 'error' => 'Erro interno'], 500);
        }
    }

}
