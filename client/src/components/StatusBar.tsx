import { useEffect, useRef, useState } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function StatusBar() {
  const { state, pending, simulatedOffline, toggleSimulateOffline } = useNetworkStatus();
  const [justSynced, setJustSynced] = useState(false);
  const prevPending = useRef(pending);

  useEffect(() => {
    if (prevPending.current > 0 && pending === 0 && state === 'online') {
      setJustSynced(true);
      const t = setTimeout(() => setJustSynced(false), 4000);
      prevPending.current = pending;
      return () => clearTimeout(t);
    }
    prevPending.current = pending;
  }, [pending, state]);

  let emoji = '🟢';
  let text = 'En línea';
  let classes = 'bg-green-100 text-green-800 border-green-300';

  if (state === 'syncing') {
    emoji = '🔵';
    text = 'Sincronizando...';
    classes = 'bg-blue-100 text-blue-800 border-blue-300';
  } else if (state === 'offline') {
    emoji = '🔴';
    text = `Sin internet — ${pending} cambio${pending === 1 ? '' : 's'} pendiente${pending === 1 ? '' : 's'}`;
    classes = 'bg-red-100 text-red-800 border-red-300';
  } else if (justSynced) {
    emoji = '✅';
    text = 'Todo sincronizado';
    classes = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  }

  return (
    <div
      className={`sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 text-sm font-medium ${classes}`}
    >
      <span className="flex items-center gap-2">
        <span aria-hidden="true">{emoji}</span>
        {text}
      </span>
      <button
        onClick={toggleSimulateOffline}
        className={`rounded-md border px-3 py-1 text-xs font-semibold transition ${
          simulatedOffline
            ? 'border-red-400 bg-red-500 text-white hover:bg-red-600'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        {simulatedOffline ? 'Quitar simulación offline' : 'Simular sin internet'}
      </button>
    </div>
  );
}
