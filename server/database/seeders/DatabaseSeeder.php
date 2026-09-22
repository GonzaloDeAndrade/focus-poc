<?php

namespace Database\Seeders;

use App\Models\Producto;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $productos = [
            ['nombre' => 'Alfajor de Maicena', 'precio' => 800, 'stock' => 50],
            ['nombre' => 'Alfajor de Chocolate', 'precio' => 900, 'stock' => 40],
            ['nombre' => 'Alfajor de Dulce de Leche', 'precio' => 850, 'stock' => 60],
            ['nombre' => 'Alfajor Triple', 'precio' => 1200, 'stock' => 30],
            ['nombre' => 'Alfajor de Nuez', 'precio' => 1000, 'stock' => 25],
        ];

        foreach ($productos as $producto) {
            Producto::create($producto);
        }
    }
}
