<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Venta extends Model
{
    protected $fillable = ['productos', 'total', 'fecha'];

    protected $casts = [
        'productos' => 'array',
        'total' => 'decimal:2',
        'fecha' => 'datetime',
    ];
}
