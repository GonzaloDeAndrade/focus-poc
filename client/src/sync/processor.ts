import { getDB, type SyncQueueItem } from '../db';
import { apiBaseUrl, isOfflineSimulated } from '../api/client';
import { getQueueOrdered, removeFromQueue, incrementIntentos } from './queue';

export interface SyncStatus {
  syncing: boolean;
  pending: number;
}

type SyncListener = (status: SyncStatus) => void;
let listeners: SyncListener[] = [];
let isSyncing = false;

export function onSyncStatusChange(listener: SyncListener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function notify(pending: number) {
  listeners.forEach((l) => l({ syncing: isSyncing, pending }));
}

/**
 * Procesa sync_queue en orden de timestamp. Por cada item: request a
 * Laravel; si responde OK se borra de la cola y se aplica el resultado
 * al cache local; si falla, se corta ahi (se preserva el orden) y se
 * reintenta en el proximo ciclo.
 */
export async function processSyncQueue(): Promise<void> {
  if (isSyncing) return;
  if (isOfflineSimulated()) return;

  const queue = await getQueueOrdered();
  if (queue.length === 0) return;

  isSyncing = true;
  notify(queue.length);

  for (const item of queue) {
    try {
      const res = await fetch(`${apiBaseUrl}${item.endpoint}`, {
        method: item.metodo,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: item.metodo === 'DELETE' ? undefined : JSON.stringify(item.payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json().catch(() => null);

      if (item.id !== undefined) {
        await applyServerResult(item, data);
        await removeFromQueue(item.id);
      }
    } catch {
      if (item.id !== undefined) {
        await incrementIntentos(item.id);
      }
      break;
    }
  }

  const remaining = await getQueueOrdered();
  isSyncing = false;
  notify(remaining.length);
}

async function applyServerResult(item: SyncQueueItem, data: any): Promise<void> {
  const db = await getDB();

  if (item.endpoint === '/ventas' && item.metodo === 'POST') {
    const localId = (item.payload as { _localId?: string })?._localId;
    if (localId && data) {
      const local = await db.get('ventas', localId);
      if (local) {
        await db.delete('ventas', localId);
        await db.put('ventas', {
          ...local,
          id: data.id,
          sincronizado: true,
        });
      }
    }
    return;
  }

  if (
    data &&
    ((item.endpoint === '/productos' && item.metodo === 'POST') ||
      (item.endpoint.startsWith('/productos/') && item.metodo === 'PUT'))
  ) {
    await db.put('productos', {
      id: data.id,
      nombre: data.nombre,
      precio: Number(data.precio),
      stock: Number(data.stock),
    });
  }
}
