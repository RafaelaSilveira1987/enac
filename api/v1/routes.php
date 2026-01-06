<?php
require_once __DIR__ . "/controllers/InscricaoController.php";
require_once __DIR__ . "/controllers/UserController.php";
require_once __DIR__ . "/controllers/EventController.php";

$routes = [
    //rotas de login
    'POST:start'                        => [InscricaoController::class, 'start'],
    'POST:update-participant'           => [InscricaoController::class, 'updateParticipant'],
    'POST:insert-update-inscricao'      => [InscricaoController::class, 'insertInscricao'],

    'POST:login-admin'                  => [UserController::class, 'login'],

    'GET:inscricao'                     => [InscricaoController::class, 'showInscricao'],
    'GET:list-inscricao'                => [InscricaoController::class, 'listInscricoes'],
    'GET:list-all-inscricao'            => [InscricaoController::class, 'listAllInscricoes'],
    'GET:coupon/{id}'                   => [InscricaoController::class, 'verifyCoupon'],


    'GET:event'                         => [EventController::class, 'findEvent'],

    'DELETE:delete-inscricao/{id}'      => [InscricaoController::class, 'deleteInscricao'],
];
