import { useEffect, useState, type FormEvent } from 'react';
import { actualizarStock, crearProducto, fetchProductos } from '../api/productos';
import type { ProductoRecord } from '../db';

export default function Productos() {
  const [productos, setProductos] = useState<ProductoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [stockInicial, setStockInicial] = useState('0');

  const load = async () => {
    setLoading(true);
    setProductos(await fetchProductos());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCrear = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !precio) return;
    await crearProducto({
      nombre: nombre.trim(),
      precio: Number(precio),
      stock: Number(stockInicial) || 0,
    });
    setNombre('');
    setPrecio('');
    setStockInicial('0');
    load();
  };

  const handleDelta = async (id: number, delta: number) => {
    await actualizarStock(id, delta);
    load();
  };

  return (
    <div>
      <form
        onSubmit={handleCrear}
        className="mb-6 grid grid-cols-1 gap-2 rounded-lg border border-gray-200 p-4 sm:grid-cols-4"
      >
        <input
          className="rounded border border-gray-300 px-2 py-1 sm:col-span-2"
          placeholder="Nombre del producto"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          className="rounded border border-gray-300 px-2 py-1"
          placeholder="Precio"
          type="number"
          step="0.01"
          min="0"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
        />
        <input
          className="rounded border border-gray-300 px-2 py-1"
          placeholder="Stock inicial"
          type="number"
          min="0"
          value={stockInicial}
          onChange={(e) => setStockInicial(e.target.value)}
        />
        <button
          type="submit"
          className="rounded bg-amber-600 px-3 py-1 font-semibold text-white hover:bg-amber-700 sm:col-span-4"
        >
          + Agregar producto
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : productos.length === 0 ? (
        <p className="text-sm text-gray-500">No hay productos todavía.</p>
      ) : (
        <div className="space-y-2">
          {productos.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
            >
              <div>
                <p className="font-medium text-gray-900">{p.nombre}</p>
                <p className="text-sm text-gray-500">${p.precio.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelta(p.id, -1)}
                  className="h-8 w-8 rounded-full border border-gray-300 font-bold text-gray-700 hover:bg-gray-100"
                  aria-label={`Restar stock de ${p.nombre}`}
                >
                  −
                </button>
                <span className="w-10 text-center font-semibold">{p.stock}</span>
                <button
                  onClick={() => handleDelta(p.id, 1)}
                  className="h-8 w-8 rounded-full border border-gray-300 font-bold text-gray-700 hover:bg-gray-100"
                  aria-label={`Sumar stock de ${p.nombre}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
