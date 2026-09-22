import { getDB, type SyncMethod, type SyncQueueItem } from '../db';

/**
 * La cola vive en IndexedDB (no en memoria) para sobrevivir recargas de
 * pagina y cierres del navegador mientras el dispositivo esta offline.
 */
export async function addToQueue(
  metodo: SyncMethod,
  endpoint: string,
  payload: unknown
): Promise<SyncQueueItem> {
  const db = await getDB();
  const item: SyncQueueItem = {
    metodo,
    endpoint,
    payload,
    timestamp: Date.now(),
    intentos: 0,
  };
  const id = await db.add('sync_queue', item);
  return { ...item, id };
}

export async function getQueueOrdered(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('sync_queue', 'by-timestamp');
}

export async function removeFromQueue(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('sync_queue', id);
}

export async function incrementIntentos(id: number): Promise<void> {
  const db = await getDB();
  const item = await db.get('sync_queue', id);
  if (item) {
    item.intentos += 1;
    await db.put('sync_queue', item);
  }
}

export async function getQueueCount(): Promise<number> {
  const db = await getDB();
  return db.count('sync_queue');
}
