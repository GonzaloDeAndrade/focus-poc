export const apiBaseUrl: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

const OFFLINE_SIM_KEY = 'focus_simulate_offline';

type SimListener = (simulated: boolean) => void;
let simListeners: SimListener[] = [];

/** Estado del boton "Simular sin internet": fuerza error en todo fetch sin desconectar el router. */
export function isOfflineSimulated(): boolean {
  return localStorage.getItem(OFFLINE_SIM_KEY) === '1';
}

export function setOfflineSimulated(value: boolean): void {
  localStorage.setItem(OFFLINE_SIM_KEY, value ? '1' : '0');
  simListeners.forEach((l) => l(value));
}

export function onOfflineSimulationChange(listener: SimListener): () => void {
  simListeners.push(listener);
  return () => {
    simListeners = simListeners.filter((l) => l !== listener);
  };
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  if (isOfflineSimulated()) {
    throw new Error('Offline simulado');
  }
  return fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

/** Reconexion real: pega a /api/health en vez de confiar solo en navigator.onLine. */
export async function pingHealth(): Promise<boolean> {
  if (isOfflineSimulated()) return false;
  try {
    const res = await fetch(`${apiBaseUrl}/health`, { cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}
