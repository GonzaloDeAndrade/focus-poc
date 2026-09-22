import { apiFetch } from './client';
import { addToQueue } from '../sync/queue';
import {
  getAllProductosLocal,
  putProductoLocal,
  putProductosLocal,
  type ProductoRecord,
} from '../db';

function normalizar(p: any): ProductoRecord {
  return { id: p.id, nombre: p.nombre, precio: Number(p.precio), stock: Number(p.stock) };
}

/** Network-first: intenta Laravel, guarda copia en IndexedDB; si falla, muestra lo cacheado. */
export async function fetchProductos(): Promise<ProductoRecord[]> {
  try {
    const res = await apiFetch('/productos');
    if (!res.ok) throw new Error('Error de red');
    const data = await res.json();
    const productos = data.map(normalizar);
    await putProductosLocal(productos);
    return productos;
  } catch {
    return getAllProductosLocal();
  }
}

export async function crearProducto(input: {
  nombre: string;
  precio: number;
  stock: number;
}): Promise<ProductoRecord> {
  try {
    const res = await apiFetch('/productos', { method: 'POST', body: JSON.stringify(input) });
    if (!res.ok) throw new Error('Error de red');
    const data = normalizar(await res.json());
    await putProductoLocal(data);
    return data;
  } catch {
    // Id temporal negativo para no chocar con ids reales del servidor
    // mientras el POST espera en la cola.
    const local: ProductoRecord = { id: -Date.now(), ...input };
    await putProductoLocal(local);
    await addToQueue('POST', '/productos', input);
    return local;
  }
}

/** Ajusta el stock local sin tocar la red (para cuando el cambio ya se confirmo en el servidor). */
export async function ajustarStockLocal(id: number, deltaStock: number): Promise<void> {
  const productos = await getAllProductosLocal();
  const producto = productos.find((p) => p.id === id);
  if (producto) {
    await putProductoLocal({ ...producto, stock: Math.max(0, producto.stock + deltaStock) });
  }
}

/** Escritura con cola: intenta Laravel con delta_stock; si falla, aplica el delta local y encola. */
export async function actualizarStock(
  id: number,
  deltaStock: number
): Promise<ProductoRecord | undefined> {
  try {
    const res = await apiFetch(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ delta_stock: deltaStock }),
    });
    if (!res.ok) throw new Error('Error de red');
    const data = normalizar(await res.json());
    await putProductoLocal(data);
    return data;
  } catch {
    await ajustarStockLocal(id, deltaStock);
    await addToQueue('PUT', `/productos/${id}`, { delta_stock: deltaStock });
    const productos = await getAllProductosLocal();
    return productos.find((p) => p.id === id);
  }
}
