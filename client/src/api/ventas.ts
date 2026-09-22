import { apiFetch } from './client';
import { addToQueue } from '../sync/queue';
import { ajustarStockLocal } from './productos';
import { getAllVentasLocal, putVentaLocal, type VentaItem, type VentaRecord } from '../db';

/** Network-first: intenta Laravel, guarda copia en IndexedDB; si falla, muestra lo cacheado. */
export async function fetchVentas(): Promise<VentaRecord[]> {
  try {
    const res = await apiFetch('/ventas');
    if (!res.ok) throw new Error('Error de red');
    const data = await res.json();
    for (const v of data) {
      await putVentaLocal({
        id: v.id,
        productos: v.productos,
        total: Number(v.total),
        fecha: v.fecha,
        sincronizado: true,
        timestamp: new Date(v.fecha).getTime() || Date.now(),
      });
    }
    return getAllVentasLocal();
  } catch {
    return getAllVentasLocal();
  }
}

export async function registrarVenta(productos: VentaItem[]): Promise<VentaRecord> {
  const total = productos.reduce((sum, p) => sum + p.subtotal, 0);
  const timestamp = Date.now();
  const fecha = new Date(timestamp).toISOString();
  const localId = `local-${timestamp}`;
  const payload = { productos, total, fecha, _localId: localId };

  try {
    const res = await apiFetch('/ventas', { method: 'POST', body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('Error de red');
    const data = await res.json();
    const venta: VentaRecord = {
      id: data.id,
      productos: data.productos,
      total: Number(data.total),
      fecha: data.fecha,
      sincronizado: true,
      timestamp,
    };
    await putVentaLocal(venta);
    for (const item of productos) {
      await ajustarStockLocal(item.producto_id, -item.cantidad);
    }
    return venta;
  } catch {
    const venta: VentaRecord = { id: localId, productos, total, fecha, sincronizado: false, timestamp };
    await putVentaLocal(venta);
    await addToQueue('POST', '/ventas', payload);
    // El delta de stock tambien se encola (como PUT independiente) para
    // que se aplique en el servidor en el mismo orden al reconectar.
    for (const item of productos) {
      await actualizarStockConCola(item.producto_id, -item.cantidad);
    }
    return venta;
  }
}

async function actualizarStockConCola(id: number, deltaStock: number): Promise<void> {
  await ajustarStockLocal(id, deltaStock);
  await addToQueue('PUT', `/productos/${id}`, { delta_stock: deltaStock });
}
