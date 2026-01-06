<?php

require_once __DIR__ . '../../../helpers/cpf.php';
require_once __DIR__ . '../../../helpers/token.php';
require_once __DIR__ . '../../../helpers/response.php';
require_once __DIR__ . '../../../connection/connection.php';

class ParticipantController
{
    public static function start()
    {
        try {
            $pdo = Conexao::getConexao();
            $status = 'S';

            $body = json_decode(file_get_contents('php://input'), true);

            if (!$body) {
                jsonResponse(['success' => false, 'error' => 'JSON inválido ou não enviado'], 400);
                exit;
            }

            $cpf = $body['cpf'] ?? null;

            if (!$cpf || !validarCPF($cpf)) {
                jsonResponse(['success' => false, 'error' => 'CPF inválido'], 400);
                exit;
            }

            // Busca participante
            $stmt = $pdo->prepare("SELECT uuid FROM participante WHERE cpf = ?");
            $stmt->execute([str_replace(['.', '-'], '', $cpf)]);
            $inscricao = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$inscricao) {
                $uuid = gerarToken();
                $status = 'N';

                $stmt = $pdo->prepare(
                    "INSERT INTO participante (uuid, cpf) VALUES (?, ?)"
                );
                $stmt->execute([$uuid, str_replace(['.', '-'], '', $cpf)]);
            } else {
                $uuid = $inscricao['uuid'];
            }

            // 🔐 GERA JWT COM 1 DIA
            $jwt = Jwt::generate(
                [
                    'uuid' => $uuid
                ],
                60 * 60 * 24 // 1 dia
            );

            jsonResponse([
                'success' => true,
                'token'   => $jwt,
                'status_cadastro' => $status
            ]);
        } catch (\Exception $e) {
            jsonResponse(['success' => false, 'error' => 'Erro interno'], 500);
        }
    }

    public static function updateParticipant()
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

            $body = json_decode(file_get_contents('php://input'), true);

            if (!$body) {
                jsonResponse(['success' => false, 'error' => 'JSON inválido ou não enviado'], 400);
                exit;
            }

            if (empty($body['nome']) || empty($body['nascimento'])) {
                jsonResponse(['success' => false, 'error' => 'Nome e nascimento são obrigatórios'], 400);
                exit;
            }

            // Confirma que o participante existe
            $stmt = $pdo->prepare("SELECT uuid FROM participante WHERE uuid = ?");
            $stmt->execute([$uuid]);

            if (!$stmt->fetch()) {
                jsonResponse(['success' => false, 'error' => 'Participante não encontrado'], 404);
                exit;
            }

            // Atualiza dados
            $stmt = $pdo->prepare(
                "UPDATE participante SET 
                nome = ?,
                nascimento = ?,
                cidade = ?,
                estado = ?,
                email = ?,
                telefone = ?,
                updated_at = NOW(),
                status = 'S'
             WHERE uuid = ?"
            );

            $stmt->execute([
                $body['nome'],
                $body['nascimento'],
                $body['cidade'],
                $body['estado'],
                $body['email'],
                $body['telefone'],
                $uuid
            ]);

            jsonResponse([
                'success' => true
            ]);
        } catch (\Exception $e) {
            jsonResponse(['success' => false, 'error' => 'Erro interno'], 500);
        }
    }

    public static function insertUpdateInscricao()
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

            $body = json_decode(file_get_contents('php://input'), true);

            //var_dump($body);

            if (!$body) {
                jsonResponse(['success' => false, 'error' => 'JSON inválido ou não enviado'], 400);
                exit;
            }

            // Busca inscrição ativa
            $stmt = $pdo->prepare("SELECT p.id FROM participante p 
                                    inner join inscricoes i on i.participante_id = p.id
                                    WHERE p.uuid = ?");
            $stmt->execute([$uuid]);

            $inscricao = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$inscricao) {

                $uuid = gerarToken();

                //busca id do participante para inserção
                $stmt = $pdo->prepare("SELECT id FROM participante WHERE uuid = ?");
                $stmt->execute([$payload['uuid']]);
                $participante = $stmt->fetch(PDO::FETCH_ASSOC);

                $stmt = $pdo->prepare(
                    "INSERT INTO inscricoes 
                        (
                        uuid,
                        participante_id,
                        modalitie,
                        translado, 
                        tipo,
                        grupo_mentoria,
                        restricoes_alimentares,
                        termo,
                        status,
                        created_at
                        ) VALUES 
                        (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())"
                );
                $stmt->execute(
                    [
                        $uuid,
                        $participante['id'],
                        $body['modalitie'],
                        $body['translado'],
                        $body['tipo'],
                        $body['grupo_mentoria'],
                        $body['restricoes_alimentares'],
                        $body['termo'],
                        $body['status'],
                    ]
                );
            } else {
                //
            }

            jsonResponse([
                'success' => true,
            ]);
        } catch (\Exception $e) {
            jsonResponse(['success' => false, 'error' => 'Erro interno: ' . $e], 500);
        }
    }

    public static function showInscricao()
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
                                            p.nome,
                                            i.*
                                            FROM participante p 
                                            inner join inscricoes i on i.participante_id = p.id
                                            WHERE p.uuid = ?
                                            limit 1");

            $stmt->execute([$uuid]);
            $inscricao_aberta = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$inscricao_aberta) {
                jsonResponse(['success' => false, 'error' => 'nenhuma inscrição encontrada'], 400);
            }

            jsonResponse([
                "nome" => $inscricao_aberta['nome'],
                "translado" => $inscricao_aberta['translado'],
                "tipo" => $inscricao_aberta['tipo'],
                "grupo_mentoria" => $inscricao_aberta['grupo_mentoria'],
                "restricoes_alimentares" => $inscricao_aberta['restricoes_alimentares'],
                "termo" => $inscricao_aberta['termo'],
            ]);
        } catch (\Exception $e) {
            jsonResponse(['success' => false, 'error' => 'Erro interno'], 500);
        }
    }

    public static function listInscricoes()
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
                                            p.nome,
                                            i.*
                                            FROM participante p 
                                            inner join inscricoes i on i.participante_id = p.id
                                            WHERE p.uuid = ?");

            $stmt->execute([$uuid]);
            $inscricao_aberta = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!$inscricao_aberta) {
                jsonResponse(['success' => false, 'error' => 'nenhuma inscrição encontrada'], 400);
            }

            $insc = [];
            foreach ($inscricao_aberta as $r) {
                $insc[] = [
                    "id" => $r['id'],
                    "nome" => $r['nome'],
                    "translado" => $r['translado'],
                    "tipo" => $r['tipo'],
                    "grupo_mentoria" => $r['grupo_mentoria'],
                    "restricoes_alimentares" => $r['restricoes_alimentares'],
                    "termo" => $r['termo']
                ];
            }

            jsonResponse($insc);

        } catch (\Exception $e) {
            jsonResponse(['success' => false, 'error' => 'Erro interno'], 500);
        }
    }



    public static function step($inscricao)
    {
        $pdo = Conexao::getConexao();

        $body = json_decode(file_get_contents('php://input'), true);

        if (!$body) {
            jsonResponse(['error' => 'JSON inválido'], 400);
        }

        $etapa = $body['etapa'] ?? null;
        $dados = $body['dados'] ?? null;

        if ($etapa != $inscricao['etapa_atual']) {
            jsonResponse(['error' => 'Etapa inválida'], 400);
        }

        $dadosAtual = json_decode($inscricao['dados_json'], true) ?? [];
        $dadosNovo = array_merge($dadosAtual, $dados);

        $stmt = $pdo->prepare(
            "UPDATE enac SET dados_json = ?, etapa_atual = etapa_atual + 1 WHERE id = ?"
        );
        $stmt->execute([json_encode($dadosNovo), $inscricao['id']]);

        jsonResponse(['success' => true]);
    }
}
