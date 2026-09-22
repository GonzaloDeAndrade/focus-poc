import { useEffect, useState } from 'react';
import { fetchProductos } from '../api/productos';
import { fetchVentas, registrarVenta } from '../api/ventas';
import type { ProductoRecord, VentaItem, VentaRecord } from '../db';

export default function Ventas() {
  const [productos, setProductos] = useState<ProductoRecord[]>([]);
  const [ventas, setVentas] = useState<VentaRecord[]>([]);
  const [carrito, setCarrito] = useState<VentaItem[]>([]);
  const [productoId, setProductoId] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState('1');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [prods, vts] = await Promise.all([fetchProductos(), fetchVentas()]);
    setProductos(prods);
    setVentas(vts);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const agregarAlCarrito = () => {
    const producto = productos.find((p) => p.id === productoId);
    const cant = Number(cantidad);
    if (!producto || !cant || cant <= 0) return;

    setCarrito((prev) => [
      ...prev,
      {
        producto_id: producto.id,
        nombre: producto.nombre,
        cantidad: cant,
        precio_unitario: producto.precio,
        subtotal: producto.precio * cant,
      },
    ]);
    setProductoId('');
    setCantidad('1');
  };

  const quitarDelCarrito = (index: number) => {
    setCarrito((prev) => prev.filter((_, i) => i !== index));
  };

  const total = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  const confirmarVenta = async () => {
    if (carrito.length === 0) return;
    await registrarVenta(carrito);
    setCarrito([]);
    load();
  };

  return (
    <div>
      <div className="mb-6 rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 font-semibold text-gray-900">Nueva venta</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          <select
            className="flex-1 rounded border border-gray-300 px-2 py-1"
            value={productoId}
            onChange={(e) => setProductoId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Seleccionar producto...</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} — ${p.precio.toFixed(2)} (stock: {p.stock})
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            className="w-24 rounded border border-gray-300 px-2 py-1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
          <button
            onClick={agregarAlCarrito}
            className="rounded bg-gray-800 px-3 py-1 font-semibold text-white hover:bg-gray-900"
          >
            Agregar
          </button>
        </div>

        {carrito.length > 0 && (
          <div className="mb-3 space-y-1">
            {carrito.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>
                  {item.cantidad}× {item.nombre}
                </span>
                <span className="flex items-center gap-2">
                  ${item.subtotal.toFixed(2)}
                  <button
                    onClick={() => quitarDelCarrito(i)}
                    className="text-red-500 hover:text-red-700"
                    aria-label="Quitar del carrito"
                  >
                    ✕
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-3">
          <span className="font-semibold">Total: ${total.toFixed(2)}</span>
          <button
            onClick={confirmarVenta}
            disabled={carrito.length === 0}
            className="rounded bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirmar venta
          </button>
        </div>
      </div>

      <h2 className="mb-3 font-semibold text-gray-900">Ventas registradas</h2>
      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : ventas.length === 0 ? (
        <p className="text-sm text-gray-500">No hay ventas todavía.</p>
      ) : (
        <div className="space-y-2">
          {ventas.map((v) => (
            <div key={v.id} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {new Date(v.fecha).toLocaleString('es-AR')}
                </span>
                <span className="flex items-center gap-2">
                  {!v.sincronizado && (
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      pendiente de sincronizar
                    </span>
                  )}
                  <span className="font-semibold">${v.total.toFixed(2)}</span>
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {v.productos.map((p) => `${p.cantidad}× ${p.nombre}`).join(', ')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
