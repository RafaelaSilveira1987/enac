<?php

session_start();

require __DIR__ . '/Router.php';

$url = $_GET['url'] ?? null;

$router = new Router();

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/
if ($url && str_starts_with($url, 'api/')) {
    require __DIR__ . '/api/handleApi.php';
    exit;
}

/*
|--------------------------------------------------------------------------
| WEB
|--------------------------------------------------------------------------
*/
$router->add('/', function () {
    include 'landing-page/home.html';
});

$router->add('/home', function () {
    include 'landing-page/home.html';
});

$router->add('/login', function () {
    include 'landing-page/login.html';
});

$router->add('/modalities', function () {
    include 'landing-page/modalities.html';
});

$router->add('/form-participant', function () {
    include 'landing-page/form-participant.html';
});

$router->add('/form-adult', function () {
    include 'landing-page/form-adult.html';
});

$router->add('/form-unified', function () {
    include 'landing-page/form-unified.html';
});

$router->add('/form', function () {
    include 'landing-page/form.html';
});

$router->add('/checkout', function () {
    include 'landing-page/checkout.html';
});

$router->add('/processing', function () {
    include 'landing-page/processing.html';
});

$router->add('/summary', function () {
    include 'landing-page/summary.html';
});

$router->add('/verify', function () {
    include 'landing-page/verify.html';
});

$router->add('/login', function () {
    include 'landing-page/admin-login.html';
});

$router->add('/reports', function () {
    include 'landing-page/admin-reports.html';
});

$router->handle($url);
