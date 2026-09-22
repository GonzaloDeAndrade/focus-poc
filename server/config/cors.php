<?php

return [
    // Rutas a las que se les aplica CORS. La app cliente (Vite) corre en
    // otro puerto, asi que la API necesita habilitar CORS explicitamente.
    'paths' => ['api/*', 'up'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
