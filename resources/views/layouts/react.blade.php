<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="shortcut icon" href="favicon.ico" type="image/x-icon">
  <title>@yield('title', 'Armazium')</title>
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <script>window.csrfToken = "{{ csrf_token() }}";</script>
</head>
<body>
  <div id="header"></div>
  <div id="welcome" data-user='@json(Auth::user())'></div>
  <div id="app"></div>
  <div id="footer"></div>

  @viteReactRefresh
  @vite('resources/js/includes/common.jsx')
  @yield('entry')
</body>
</html>