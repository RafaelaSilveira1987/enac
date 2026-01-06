<?php

require_once __DIR__ . '../../../helpers/cpf.php';
require_once __DIR__ . '../../../helpers/token.php';
require_once __DIR__ . '../../../helpers/response.php';
require_once __DIR__ . '../../../connection/connection.php';

class InscricaoController
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

    public static function insertInscricao()
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

            if (empty($body['nome']) || empty($body['nascimento'])) {
                jsonResponse(['success' => false, 'error' => 'Nome e nascimento são obrigatórios'], 400);
                exit;
            }

            // Confirma que o participante existe
            $stmt = $pdo->prepare("SELECT p.uuid, p.status FROM participante p WHERE p.uuid = ?");
            $stmt->execute([$uuid]);
            $participante = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($participante['status'] === 'N') {
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
            }

            //busca id do participante para inserção
            $stmt = $pdo->prepare("SELECT id FROM participante WHERE uuid = ?");
            $stmt->execute([$payload['uuid']]);
            $participante = $stmt->fetch(PDO::FETCH_ASSOC);

            $stmt = $pdo->prepare(
                "INSERT INTO inscricoes 
                        (
                        uuid,
                        event_id,
                        participante_id,
                        modalitie,
                        translado, 
                        tipo,
                        grupo_mentoria,
                        restricoes_alimentares,
                        termo,
                        status,
                        nome_inscrito,
                        nascimento,
                        valor_original,
                        cupom,
                        desconto,
                        liquido,
                        created_at
                        ) VALUES 
                        (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())"
            );
            $stmt->execute(
                [
                    gerarToken(),
                    $participante['id'],
                    $body['modalitie'],
                    $body['translado'] ?? null,
                    $body['tipo'] ?? null,
                    $body['grupo_mentoria'] ?? null,
                    $body['restricoes_alimentares'] ?? null,
                    $body['termo'] ?? null,
                    $body['status'],
                    $body['nome'],
                    $body['nascimento'],
                    $body['preco'] ?? 0,
                    $body['cupom'] ?? null,
                    $body['desconto'] ?? 0,
                    $body['liquido'] ?? 0,
                ]
            );

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
                                            i.*
                                            FROM participante p 
                                            WHERE p.uuid = ?
                                            limit 1");

            $stmt->execute([$uuid]);
            $inscricao_aberta = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$inscricao_aberta) {
                jsonResponse(['success' => false, 'error' => 'nenhuma inscrição encontrada'], 400);
            }

            jsonResponse([
                "nome" => $inscricao_aberta['nome'],
                "nome_inscrito" => $inscricao_aberta['nome_inscrito'],
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
                                            i.*,
                                            case
                                            	when i.modalitie = 0 then 'Adulto'
                                                when i.modalitie = 1 then 'Até 3 anos'
                                                when i.modalitie = 2 then '4 a 9 anos'
                                                else 'Adulto' end as desc_modalitie,
                                            p.cpf as responsavel,
                                            p.nome as nome_responsavel,
                                            c.cupom as descricao_cupom,
                                            c.percentual
                                            FROM participante p 
                                            inner join inscricoes i on i.participante_id = p.id
                                            left join cupom c on c.id = i.cupom
                                            WHERE p.uuid = ?
                                            and i.deleted = 0");

            $stmt->execute([$uuid]);
            $inscricao_aberta = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!$inscricao_aberta) {
                jsonResponse(['success' => false, 'error' => 'nenhuma inscrição encontrada'], 400);
            }

            $insc = [];
            foreach ($inscricao_aberta as $r) {
                if (isset($r['nascimento'])) {
                    $dataNascimento = $r['nascimento'];
                    $nascimento = new DateTime($dataNascimento);
                    $hoje = new DateTime();
                    $idade = $nascimento->diff($hoje)->y;
                }

                $insc[] = [
                    "id" => $r['id'],
                    "nome_inscrito" => $r['nome_inscrito'],
                    "nascimento" => $r['nascimento'],
                    "nascimento_formatado" => isset($r['nascimento']) ? date('d/m/Y', strtotime($r['nascimento'])) : '',
                    "translado" => $r['translado'],
                    "idade" => $idade ?? "",
                    "tipo" => $r['tipo'],
                    "grupo_mentoria" => $r['grupo_mentoria'],
                    "restricoes_alimentares" => $r['restricoes_alimentares'],
                    "termo" => $r['termo'],
                    "valor_original" => $r['valor_original'],
                    "desconto" => $r['desconto'],
                    "liquido" => $r['liquido'],
                    "desc_modalitie" => $r['desc_modalitie'],
                    "responsavel" => $r['responsavel'],
                    "nome_responsavel" => $r['nome_responsavel'],
                    "descricao_cupom" => $r['descricao_cupom'],
                    "percentual" => $r['percentual'],
                    "modalitie" => $r['modalitie']
                ];
            }

            jsonResponse($insc);
        } catch (\Exception $e) {
            jsonResponse(['success' => false, 'error' => 'Erro interno'], 500);
        }
    }

    public static function listAllInscricoes()
    {
        try {
            $pdo = Conexao::getConexao();

            // Parâmetros GET
            $buscaInput = $_GET['pesquisa'] ?? null;
            $tipo       = $_GET['tipo'] ?? null;
            $ordenacao  = $_GET['ordenacao'] ?? null;

            // SQL base
            $sql = "
            SELECT 
                i.*,
                CASE
                    WHEN i.modalitie = 0 THEN 'Adulto'
                    WHEN i.modalitie = 1 THEN 'Até 3 anos'
                    WHEN i.modalitie = 2 THEN '4 a 9 anos'
                    ELSE 'Adulto'
                END AS desc_modalitie,
                p.cpf AS responsavel,
                p.nome AS nome_responsavel,
                c.cupom AS descricao_cupom,
                c.percentual
            FROM participante p
            INNER JOIN inscricoes i ON i.participante_id = p.id
            LEFT JOIN cupom c ON c.id = i.cupom
            WHERE i.deleted = 0
        ";

            $params = [];

            //busca
            if (isset($buscaInput) && trim($buscaInput) !== '') {
                $sql .= "
                AND (
                    i.nome_inscrito LIKE ?
                    OR p.cpf LIKE ?
                )
            ";

                $term = '%' . $buscaInput . '%';

                $params[] = $term;
                $params[] = $term;
            }

            // 🎯 Filtro por tipo
            if ($tipo !== null && $tipo !== '') {
                $sql .= " AND i.modalitie = ?";
                $params[] = $tipo;
            }

            //ornenação
            $ordenacoesPermitidas = [
                'date-desc'  => 'i.id DESC',
                'date-asc'   => 'i.id ASC',
                'name-desc'  => 'i.nome_inscrito DESC',
                'name-asc'   => 'i.nome_inscrito ASC',
                'price-desc' => 'i.liquido DESC',
                'price-asc'  => 'i.liquido ASC'
            ];

            if (!empty($ordenacao) && isset($ordenacoesPermitidas[$ordenacao])) {
                $sql .= " ORDER BY " . $ordenacoesPermitidas[$ordenacao];
            } else {
                $sql .= " ORDER BY i.id DESC";
            }

            // Executa
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!$result) {
                jsonResponse(['success' => false, 'error' => 'Nenhuma inscrição encontrada'], 200);
                return;
            }

            // Monta retorno final
            $insc = [];

            foreach ($result as $r) {
                $idade = '';

                if (!empty($r['nascimento'])) {
                    $nascimento = new DateTime($r['nascimento']);
                    $hoje = new DateTime();
                    $idade = $nascimento->diff($hoje)->y;
                }

                $insc[] = [
                    "id" => $r['id'],
                    "nome_inscrito" => $r['nome_inscrito'],
                    "nascimento" => $r['nascimento'],
                    "nascimento_formatado" => !empty($r['nascimento'])
                        ? date('d/m/Y', strtotime($r['nascimento']))
                        : '',
                    "idade" => $idade,
                    "translado" => $r['translado'],
                    "tipo" => $r['tipo'],
                    "grupo_mentoria" => $r['grupo_mentoria'],
                    "restricoes_alimentares" => $r['restricoes_alimentares'],
                    "termo" => $r['termo'],
                    "valor_original" => $r['valor_original'],
                    "desconto" => $r['desconto'],
                    "liquido" => $r['liquido'],
                    "modalitie" => $r['modalitie'],
                    "desc_modalitie" => $r['desc_modalitie'],
                    "responsavel" => $r['responsavel'],
                    "nome_responsavel" => $r['nome_responsavel'],
                    "descricao_cupom" => $r['descricao_cupom'],
                    "percentual" => $r['percentual']
                ];
            }

            jsonResponse($insc);
        } catch (\Exception $e) {
            jsonResponse([
                'success' => false,
                'error' => 'Erro interno',
                'details' => $e->getMessage()
            ], 500);
        }
    }


    public static function verifyCoupon($descricao)
    {
        try {
            $pdo = Conexao::getConexao();

            $payload = AuthMiddleware::protect();
            $uuid = $payload['uuid'] ?? null;

            if (!$uuid) {
                jsonResponse(['success' => false, 'error' => 'Token inválido'], 401);
                exit;
            }

            $stmt = $pdo->prepare("
            SELECT id, cupom, percentual
            FROM cupom
            WHERE LOWER(cupom) = LOWER(?)
            LIMIT 1
            ");

            $stmt->execute([$descricao]);
            $cupom = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$cupom) {
                jsonResponse(['success' => false, 'error' => 'Cupom não identificado'], 400);
                exit;
            }

            jsonResponse([
                "success" => true,
                "coupon_id" => $cupom['id'],
                "coupon_name" => $cupom['cupom'],
                "percent" => $cupom['percentual']
            ]);
        } catch (\Exception $e) {
            jsonResponse(['success' => false, 'error' => 'Erro interno'], 500);
        }
    }

    public static function deleteInscricao($id)
    {
        try {
            $pdo = Conexao::getConexao();

            // 🔐 Valida token
            $payload = AuthMiddleware::protect();
            $uuid = $payload['uuid'] ?? null;

            if (!$uuid) {
                jsonResponse(['success' => false, 'error' => 'Token inválido'], 401);
                return;
            }

            $stmt = $pdo->prepare("
            update inscricoes i set i.deleted = 1 
            WHERE id = ?
        ");

            $stmt->execute([$id]);

            // 🔎 Verifica se realmente apagou algo
            if ($stmt->rowCount() === 0) {
                jsonResponse([
                    'success' => false,
                    'error' => 'Registro não encontrado ou sem permissão'
                ], 404);
                return;
            }

            jsonResponse([
                'success' => true
            ]);
        } catch (\Exception $e) {
            jsonResponse([
                'success' => false,
                'error' => 'Erro interno: ' . $e
            ], 500);
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
