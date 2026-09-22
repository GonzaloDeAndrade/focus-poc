<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Models\Venta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VentaController extends Controller
{
    public function index()
    {
        return response()->json(Venta::orderByDesc('fecha')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'productos' => ['required', 'array', 'min:1'],
            'productos.*.producto_id' => ['required', 'integer', 'exists:productos,id'],
            'productos.*.nombre' => ['required', 'string'],
            'productos.*.cantidad' => ['required', 'integer', 'min:1'],
            'productos.*.precio_unitario' => ['required', 'numeric', 'min:0'],
            'productos.*.subtotal' => ['required', 'numeric', 'min:0'],
            'total' => ['required', 'numeric', 'min:0'],
            'fecha' => ['nullable', 'date'],
        ]);

        $venta = DB::transaction(function () use ($data) {
            $venta = Venta::create([
                'productos' => $data['productos'],
                'total' => $data['total'],
                'fecha' => $data['fecha'] ?? now(),
            ]);

            // Descuenta stock via delta (misma logica que usa la cola offline),
            // nunca pisando el valor absoluto.
            foreach ($data['productos'] as $item) {
                $producto = Producto::find($item['producto_id']);
                if ($producto) {
                    $producto->stock = max(0, $producto->stock - $item['cantidad']);
                    $producto->save();
                }
            }

            return $venta;
        });

        return response()->json($venta, 201);
    }
}
