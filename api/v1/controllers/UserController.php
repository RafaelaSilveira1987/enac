<?php

require_once __DIR__ . '../../../helpers/cpf.php';
require_once __DIR__ . '../../../helpers/token.php';
require_once __DIR__ . '../../../helpers/response.php';
require_once __DIR__ . '../../../connection/connection.php';

class UserController
{
    public static function login()
    {
        try {
            $pdo = Conexao::getConexao();

            $body = json_decode(file_get_contents('php://input'), true);

            if (!$body) {
                jsonResponse(['success' => false, 'error' => 'JSON inválido'], 400);
                return;
            }

            $login = trim($body['login'] ?? '');
            $senha = $body['senha'] ?? '';

            //$hash = password_hash($senha, PASSWORD_DEFAULT);
            //var_dump($hash);

            if ($login === '' || $senha === '') {
                jsonResponse(['success' => false, 'error' => 'Login e senha obrigatórios'], 400);
                return;
            }

            // Normaliza login (ex: CPF)
            $login = strtolower($login);

            //var_dump($login, $senha);

            $stmt = $pdo->prepare("
            SELECT uuid, senha 
            FROM usuario 
            WHERE LOWER(usuario) = ?
            LIMIT 1
            ");
            $stmt->execute([$login]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario || !password_verify($senha, $usuario['senha'])) {
                // pequeno atraso anti brute-force
                usleep(500000); // 0.5s
                jsonResponse(['success' => false, 'error' => 'Usuário ou senha invalidos!'], 401);
                return;
            }

            // JWT seguro (SEM senha)
            $jwt = Jwt::generate([
                'uuid'  => $usuario['uuid'],
                'login' => $login
            ], 60 * 60 * 24);

            jsonResponse([
                'success' => true,
                'token'   => $jwt
            ]);
            
        } catch (\Throwable $e) {
            jsonResponse(['success' => false, 'error' => 'Erro interno: ' . $e], 500);
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
}
