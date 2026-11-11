<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>PERMEASE – RFID Student Test Permit Management System</title>
        <link rel="icon" type="image/jpeg" href="/images/logox.jpg">
        <link rel="shortcut icon" href="/favicon.ico">
        <link rel="apple-touch-icon" href="/images/logox.jpg">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        @viteReactRefresh
        @vite(['resources/css/app.css', 'src/main.tsx'])
    </head>
    <body class="bg-[#07132B] text-slate-100 font-sans antialiased min-h-screen">
        <div id="app"></div>
    </body>
</html>
