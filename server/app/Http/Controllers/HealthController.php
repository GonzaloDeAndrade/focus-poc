<?php

namespace App\Http\Controllers;

class HealthController extends Controller
{
    /**
     * Usado por el cliente para detectar reconexion real
     * (no solo navigator.onLine) y disparar la sincronizacion.
     */
    public function __invoke()
    {
        return response()->json(['ok' => true]);
    }
}
