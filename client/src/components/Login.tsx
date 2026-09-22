import { useState, type FormEvent } from 'react';

interface LoginProps {
  onLogin: (usuario: string) => void;
}

/**
 * Login local de demostracion: no pega al backend (el POC no tiene
 * autenticacion server-side). Es solo una pantalla de acceso para la
 * demo; el PIN es fijo a proposito.
 */
export default function Login({ onLogin }: LoginProps) {
  const [usuario, setUsuario] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!usuario.trim()) {
      setError('Ingresá tu nombre de usuario');
      return;
    }
    if (pin !== '1234') {
      setError('PIN incorrecto (usá 1234 en este POC)');
      return;
    }
    localStorage.setItem('focus_usuario', usuario.trim());
    onLogin(usuario.trim());
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-amber-900">🍪 Focus Alfajorería</h1>
          <p className="mt-1 text-sm text-gray-500">Sistema de gestión — POC offline-first</p>
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Usuario</span>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="ej: maria"
            autoFocus
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium text-gray-700">PIN</span>
          <input
            type="password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="1234"
          />
        </label>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white transition hover:bg-amber-700"
        >
          Ingresar
        </button>

        <p className="mt-4 text-center text-xs text-gray-400">
          Login local de demostración (sin backend) — PIN fijo: 1234
        </p>
      </form>
    </div>
  );
}
