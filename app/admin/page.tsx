'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Line {
  id: number;
  phone: string;
  message: string;
  active: boolean;
}

export default function AdminPage() {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPhone, setNewPhone] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [dbReady, setDbReady] = useState(true);
  const router = useRouter();

  const fetchLines = useCallback(async () => {
    try {
      const res = await fetch('/api/lines');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.ok) {
        setLines(await res.json());
      }
    } catch {
      console.error('Error fetching lines');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchLines();
  }, [fetchLines]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newPhone.trim()) return;

    const res = await fetch('/api/lines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: newPhone.trim(), message: newMessage }),
    });

    if (res.ok) {
      setNewPhone('');
      setNewMessage('');
      fetchLines();
    }
  }

  async function handleToggle(line: Line) {
    await fetch(`/api/lines/${line.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: line.phone, message: line.message, active: !line.active }),
    });
    fetchLines();
  }

  async function handleDelete(id: number) {
    if (!confirm('Eliminar esta linea?')) return;
    await fetch(`/api/lines/${id}`, { method: 'DELETE' });
    fetchLines();
  }

  function startEdit(line: Line) {
    setEditingId(line.id);
    setEditPhone(line.phone);
    setEditMessage(line.message);
  }

  async function handleSaveEdit(id: number) {
    await fetch(`/api/lines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: editPhone,
        message: editMessage,
        active: lines.find(l => l.id === id)?.active ?? true,
      }),
    });
    setEditingId(null);
    fetchLines();
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  async function handleInitDb() {
    const res = await fetch('/api/init', { method: 'POST' });
    if (res.ok) {
      setDbReady(true);
      fetchLines();
    } else {
      alert('Error inicializando la base de datos');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  const activeCount = lines.filter(l => l.active).length;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Multilinea</h1>
            <p className="text-sm text-gray-500">
              {lines.length} lineas ({activeCount} activas)
            </p>
          </div>
          <div className="flex gap-2">
            {!dbReady && (
              <button
                onClick={handleInitDb}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
              >
                Inicializar DB
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Add new line */}
        <form onSubmit={handleAdd} className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="font-semibold mb-3">Agregar linea</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Numero (ej: 5491155551234)"
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Mensaje default"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 whitespace-nowrap"
            >
              Agregar
            </button>
          </div>
        </form>

        {/* Lines list */}
        <div className="bg-white rounded-lg shadow">
          {lines.length === 0 ? (
            <p className="p-6 text-center text-gray-500">
              No hay lineas configuradas. Agrega una arriba.
            </p>
          ) : (
            <div className="divide-y divide-gray-200">
              {lines.map(line => (
                <div key={line.id} className="p-4 flex items-center gap-4">
                  {editingId === line.id ? (
                    <>
                      <div className="flex-1 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={editPhone}
                          onChange={e => setEditPhone(e.target.value)}
                          className="border border-gray-300 rounded px-3 py-1 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={editMessage}
                          onChange={e => setEditMessage(e.target.value)}
                          className="border border-gray-300 rounded px-3 py-1 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveEdit(line.id)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleToggle(line)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${
                          line.active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            line.active ? 'left-6' : 'left-0.5'
                          }`}
                        />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-medium">{line.phone}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {line.message || '(sin mensaje)'}
                        </p>
                      </div>
                      <button
                        onClick={() => startEdit(line)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(line.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* URL info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>URL de redirección:</strong>{' '}
            <code className="bg-blue-100 px-2 py-0.5 rounded">/wpp</code>
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Cada visita redirige a una linea activa al azar.
          </p>
        </div>
      </main>
    </div>
  );
}
