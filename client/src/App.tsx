import { useEffect, useState } from 'react';
import StatusBar from './components/StatusBar';
import Login from './components/Login';
import Productos from './components/Productos';
import Ventas from './components/Ventas';

type Tab = 'ventas' | 'productos';

export default function App() {
  const [usuario, setUsuario] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('ventas');

  useEffect(() => {
    const saved = localStorage.getItem('focus_usuario');
    if (saved) setUsuario(saved);
  }, []);

  if (!usuario) {
    return <Login onLogin={setUsuario} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('focus_usuario');
    setUsuario(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StatusBar />

      <header className="border-b bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">🍪 Focus Alfajorería</h1>
            <p className="text-xs text-gray-500">Hola, {usuario}</p>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800">
            Salir
          </button>
        </div>
      </header>

      <nav className="mx-auto flex max-w-3xl gap-2 px-4 pt-4">
        <button
          onClick={() => setTab('ventas')}
          className={`rounded-t-lg px-4 py-2 text-sm font-semibold ${
            tab === 'ventas' ? 'bg-white text-amber-700 shadow' : 'bg-gray-100 text-gray-500'
          }`}
        >
          Ventas
        </button>
        <button
          onClick={() => setTab('productos')}
          className={`rounded-t-lg px-4 py-2 text-sm font-semibold ${
            tab === 'productos' ? 'bg-white text-amber-700 shadow' : 'bg-gray-100 text-gray-500'
          }`}
        >
          Stock / Productos
        </button>
      </nav>

      <main className="mx-auto max-w-3xl bg-white p-4 shadow-sm">
        {tab === 'ventas' ? <Ventas /> : <Productos />}
      </main>
    </div>
  );
}
