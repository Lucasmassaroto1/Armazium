<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="shortcut icon" href="favicon.ico" type="image/x-icon">
  <title>Armazium - Criar Conta</title>
  <meta name="csrf-token" content="{{ csrf_token() }}">
  @viteReactRefresh
  @vite('resources/js/register.jsx')
</head>
<body>
  <div id="app"></div>
</body>
</html>