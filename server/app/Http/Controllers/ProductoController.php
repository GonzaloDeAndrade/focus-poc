<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use Illuminate\Http\Request;

class ProductoController extends Controller
{
    public function index()
    {
        return response()->json(Producto::orderBy('nombre')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'precio' => ['required', 'numeric', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
        ]);

        $producto = Producto::create([
            'nombre' => $data['nombre'],
            'precio' => $data['precio'],
            'stock' => $data['stock'] ?? 0,
        ]);

        return response()->json($producto, 201);
    }

    /**
     * Acepta "stock" (valor absoluto) o "delta_stock" (+3 / -2) para sumar
     * o restar sin pisar el valor actual. Si viene delta_stock se aplica
     * sobre el stock existente; es lo que usa la cola de sincronizacion
     * offline para no perder cambios concurrentes.
     */
    public function update(Request $request, Producto $producto)
    {
        $data = $request->validate([
            'nombre' => ['sometimes', 'string', 'max:255'],
            'precio' => ['sometimes', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'delta_stock' => ['sometimes', 'integer'],
        ]);

        if (array_key_exists('nombre', $data)) {
            $producto->nombre = $data['nombre'];
        }

        if (array_key_exists('precio', $data)) {
            $producto->precio = $data['precio'];
        }

        if (array_key_exists('delta_stock', $data)) {
            $producto->stock = max(0, $producto->stock + $data['delta_stock']);
        } elseif (array_key_exists('stock', $data)) {
            $producto->stock = $data['stock'];
        }

        $producto->save();

        return response()->json($producto);
    }
}
