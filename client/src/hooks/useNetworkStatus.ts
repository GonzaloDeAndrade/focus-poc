import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isOfflineSimulated,
  onOfflineSimulationChange,
  pingHealth,
  setOfflineSimulated,
} from '../api/client';
import { getQueueCount } from '../sync/queue';
import { onSyncStatusChange, processSyncQueue } from '../sync/processor';

export type ConnectionState = 'online' | 'offline' | 'syncing';

export interface NetworkStatus {
  state: ConnectionState;
  pending: number;
  simulatedOffline: boolean;
  toggleSimulateOffline: () => void;
}

const PING_INTERVAL_MS = 10_000;

export function useNetworkStatus(): NetworkStatus {
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pending, setPending] = useState(0);
  const [simulatedOffline, setSimulatedOffline] = useState(isOfflineSimulated());
  const wasOffline = useRef(false);

  const refreshPending = useCallback(async () => {
    setPending(await getQueueCount());
  }, []);

  const checkConnection = useCallback(async () => {
    const ok = await pingHealth();
    setOnline(ok);

    if (ok && wasOffline.current) {
      wasOffline.current = false;
      await processSyncQueue();
    }
    if (!ok) {
      wasOffline.current = true;
    }

    await refreshPending();
  }, [refreshPending]);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, PING_INTERVAL_MS);

    const unsubSync = onSyncStatusChange((status) => {
      setSyncing(status.syncing);
      setPending(status.pending);
    });

    const unsubSim = onOfflineSimulationChange((sim) => {
      setSimulatedOffline(sim);
      checkConnection();
    });

    const handleOnline = () => checkConnection();
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // En mobile (sobre todo iOS/PWA instalada) los timers se pausan en
    // background: sin esto, la app solo se entera de que volvio la
    // conexion cuando el intervalo llega a disparar, o nunca si quedo
    // suspendida. Forzamos un chequeo inmediato apenas vuelve a primer
    // plano, para no depender de reabrir la app a mano.
    const handleVisible = () => {
      if (document.visibilityState === 'visible') checkConnection();
    };
    document.addEventListener('visibilitychange', handleVisible);
    window.addEventListener('focus', handleVisible);
    window.addEventListener('pageshow', handleVisible);

    return () => {
      clearInterval(interval);
      unsubSync();
      unsubSim();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisible);
      window.removeEventListener('focus', handleVisible);
      window.removeEventListener('pageshow', handleVisible);
    };
  }, [checkConnection]);

  const toggleSimulateOffline = useCallback(() => {
    setOfflineSimulated(!simulatedOffline);
  }, [simulatedOffline]);

  const state: ConnectionState = syncing ? 'syncing' : online && !simulatedOffline ? 'online' : 'offline';

  return { state, pending, simulatedOffline, toggleSimulateOffline };
}
