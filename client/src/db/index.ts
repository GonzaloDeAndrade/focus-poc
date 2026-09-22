import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface ProductoRecord {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
}

export interface VentaItem {
  producto_id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface VentaRecord {
  /** Id numerico del servidor, o "local-<timestamp>" mientras esta pendiente de sync. */
  id: number | string;
  productos: VentaItem[];
  total: number;
  fecha: string;
  sincronizado: boolean;
  timestamp: number;
}

export type SyncMethod = 'POST' | 'PUT' | 'DELETE';

export interface SyncQueueItem {
  id?: number;
  metodo: SyncMethod;
  endpoint: string;
  payload: unknown;
  timestamp: number;
  intentos: number;
}

interface FocusDB extends DBSchema {
  ventas: {
    key: number | string;
    value: VentaRecord;
    indexes: { 'by-timestamp': number };
  };
  productos: {
    key: number;
    value: ProductoRecord;
  };
  sync_queue: {
    key: number;
    value: SyncQueueItem;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'focusDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<FocusDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<FocusDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FocusDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('ventas')) {
          const store = db.createObjectStore('ventas', { keyPath: 'id' });
          store.createIndex('by-timestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains('productos')) {
          db.createObjectStore('productos', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

// ---- productos ----

export async function getAllProductosLocal(): Promise<ProductoRecord[]> {
  const db = await getDB();
  const all = await db.getAll('productos');
  return all.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function getProductoLocal(id: number): Promise<ProductoRecord | undefined> {
  const db = await getDB();
  return db.get('productos', id);
}

export async function putProductoLocal(producto: ProductoRecord): Promise<void> {
  const db = await getDB();
  await db.put('productos', producto);
}

export async function putProductosLocal(productos: ProductoRecord[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('productos', 'readwrite');
  await Promise.all(productos.map((p) => tx.store.put(p)));
  await tx.done;
}

// ---- ventas ----

export async function getAllVentasLocal(): Promise<VentaRecord[]> {
  const db = await getDB();
  const all = await db.getAll('ventas');
  return all.sort((a, b) => b.timestamp - a.timestamp);
}

export async function putVentaLocal(venta: VentaRecord): Promise<void> {
  const db = await getDB();
  await db.put('ventas', venta);
}

export async function deleteVentaLocal(id: number | string): Promise<void> {
  const db = await getDB();
  await db.delete('ventas', id);
}
