<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'Focus POC API',
        'status' => 'ok',
    ]);
});
