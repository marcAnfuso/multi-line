'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Group {
  id: number;
  name: string;
  slug: string;
}

interface Line {
  id: number;
  group_id: number;
  name: string;
  phone: string;
  message: string;
  active: boolean;
  clicks: number;
}

export default function AdminPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);

  // New line form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newMessage, setNewMessage] = useState('');

  // Edit line
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editMessage, setEditMessage] = useState('');

  // New group form
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSlug, setNewGroupSlug] = useState('');

  // Edit group
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupSlug, setEditGroupSlug] = useState('');

  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/groups');
      if (res.status === 401) {
        router.push('/login');
        return [];
      }
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
        return data as Group[];
      }
    } catch {
      console.error('Error fetching groups');
    }
    return [];
  }, [router]);

  const fetchLines = useCallback(async (groupId: number) => {
    try {
      const res = await fetch(`/api/lines?group_id=${groupId}`);
      if (res.ok) {
        setLines(await res.json());
      }
    } catch {
      console.error('Error fetching lines');
    }
  }, []);

  useEffect(() => {
    (async () => {
      const data = await fetchGroups();
      if (data.length > 0) {
        setSelectedGroup(data[0]);
        await fetchLines(data[0].id);
      }
      setLoading(false);
    })();
  }, [fetchGroups, fetchLines]);

  async function selectGroup(group: Group) {
    setSelectedGroup(group);
    setEditingId(null);
    await fetchLines(group.id);
  }

  // ---- Group CRUD ----

  async function handleAddGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupSlug.trim()) return;

    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGroupName.trim(), slug: newGroupSlug.trim() }),
    });

    if (res.ok) {
      const group = await res.json();
      setNewGroupName('');
      setNewGroupSlug('');
      setShowNewGroup(false);
      await fetchGroups();
      setSelectedGroup(group);
      await fetchLines(group.id);
    } else {
      const err = await res.json();
      alert(err.error || 'Error creando canal');
    }
  }

  async function handleSaveGroupEdit(id: number) {
    await fetch(`/api/groups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editGroupName, slug: editGroupSlug }),
    });
    setEditingGroupId(null);
    const data = await fetchGroups();
    const updated = data.find((g: Group) => g.id === id);
    if (updated) setSelectedGroup(updated);
  }

  async function handleDeleteGroup(id: number) {
    if (!confirm('Eliminar este canal y todas sus líneas?')) return;
    await fetch(`/api/groups/${id}`, { method: 'DELETE' });
    const data = await fetchGroups();
    if (data.length > 0) {
      setSelectedGroup(data[0]);
      await fetchLines(data[0].id);
    } else {
      setSelectedGroup(null);
      setLines([]);
    }
  }

  // ---- Line CRUD ----

  async function handleAddLine(e: React.FormEvent) {
    e.preventDefault();
    if (!newPhone.trim() || !selectedGroup) return;

    const res = await fetch('/api/lines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        group_id: selectedGroup.id,
        name: newName.trim(),
        phone: newPhone.trim(),
        message: newMessage,
      }),
    });

    if (res.ok) {
      setNewName('');
      setNewPhone('');
      setNewMessage('');
      fetchLines(selectedGroup.id);
    }
  }

  async function handleToggle(line: Line) {
    await fetch(`/api/lines/${line.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: line.name, phone: line.phone, message: line.message, active: !line.active }),
    });
    if (selectedGroup) fetchLines(selectedGroup.id);
  }

  async function handleDeleteLine(id: number) {
    if (!confirm('Eliminar esta línea?')) return;
    await fetch(`/api/lines/${id}`, { method: 'DELETE' });
    if (selectedGroup) fetchLines(selectedGroup.id);
  }

  async function handleResetClicks(id: number) {
    await fetch(`/api/lines/${id}`, { method: 'PATCH' });
    if (selectedGroup) fetchLines(selectedGroup.id);
  }

  function startEditLine(line: Line) {
    setEditingId(line.id);
    setEditName(line.name);
    setEditPhone(line.phone);
    setEditMessage(line.message);
  }

  async function handleSaveEditLine(id: number) {
    await fetch(`/api/lines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        phone: editPhone,
        message: editMessage,
        active: lines.find(l => l.id === id)?.active ?? true,
      }),
    });
    setEditingId(null);
    if (selectedGroup) fetchLines(selectedGroup.id);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  function copyUrl() {
    if (!selectedGroup) return;
    const url = `${window.location.origin}/${selectedGroup.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <svg className="animate-spin h-6 w-6 text-indigo-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const activeCount = lines.filter(l => l.active).length;
  const totalClicks = lines.reduce((sum, l) => sum + (l.clicks || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Multilinea
            </h1>
            {selectedGroup && (
              <div className="flex gap-2 mt-1">
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                  {lines.length} líneas
                </span>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                  {activeCount} activas
                </span>
                <span className="text-xs bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full">
                  {totalClicks} clicks
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-slate-200 text-sm px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all duration-200 cursor-pointer"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Channels selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {groups.map(group => (
            <div key={group.id} className="flex items-center">
              {editingGroupId === group.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editGroupName}
                    onChange={e => setEditGroupName(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 w-20 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Nombre"
                  />
                  <input
                    type="text"
                    value={editGroupSlug}
                    onChange={e => setEditGroupSlug(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 w-20 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="slug"
                  />
                  <button
                    onClick={() => handleSaveGroupEdit(group.id)}
                    className="text-emerald-400 hover:text-emerald-300 text-xs px-1 cursor-pointer"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditingGroupId(null)}
                    className="text-slate-500 hover:text-slate-300 text-xs px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => selectGroup(group)}
                  onDoubleClick={() => {
                    setEditingGroupId(group.id);
                    setEditGroupName(group.name);
                    setEditGroupSlug(group.slug);
                  }}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                    selectedGroup?.id === group.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  }`}
                  title="Doble click para editar"
                >
                  {group.name}
                </button>
              )}
              {selectedGroup?.id === group.id && editingGroupId !== group.id && groups.length > 1 && (
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="text-red-400/50 hover:text-red-400 text-xs ml-1 cursor-pointer"
                  title="Eliminar canal"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {/* New group */}
          {showNewGroup ? (
            <form onSubmit={handleAddGroup} className="flex items-center gap-1">
              <input
                type="text"
                value={newGroupName}
                onChange={e => {
                  setNewGroupName(e.target.value);
                  setNewGroupSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 w-24 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Nombre"
                autoFocus
              />
              <input
                type="text"
                value={newGroupSlug}
                onChange={e => setNewGroupSlug(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 w-24 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="slug (URL)"
              />
              <button type="submit" className="text-emerald-400 hover:text-emerald-300 text-xs px-1 cursor-pointer">
                ✓
              </button>
              <button
                type="button"
                onClick={() => { setShowNewGroup(false); setNewGroupName(''); setNewGroupSlug(''); }}
                className="text-slate-500 hover:text-slate-300 text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowNewGroup(true)}
              className="text-sm px-3 py-1.5 rounded-lg bg-slate-800/50 text-slate-500 hover:text-slate-300 hover:bg-slate-800 border border-dashed border-slate-700 transition-all duration-200 cursor-pointer"
            >
              + Canal
            </button>
          )}
        </div>

        {selectedGroup ? (
          <>
            {/* Add new line */}
            <form onSubmit={handleAddLine} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Agregar línea</h2>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Nombre (ej: Juan, Línea 1)"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  />
                  <input
                    type="text"
                    placeholder="Número (ej: 5491155551234)"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Mensaje predeterminado (opcional)"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-500 whitespace-nowrap transition-all duration-200 cursor-pointer"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            </form>

            {/* Lines list */}
            <div className="space-y-2">
              {lines.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                  <div className="text-4xl mb-3">📱</div>
                  <p className="text-slate-400 text-sm">No hay líneas en este canal</p>
                  <p className="text-slate-600 text-xs mt-1">Agregá una línea de WhatsApp arriba para empezar</p>
                </div>
              ) : (
                lines.map(line => (
                  <div
                    key={line.id}
                    className={`bg-slate-900 border rounded-xl p-4 transition-all duration-200 ${
                      editingId === line.id
                        ? 'border-indigo-500/50'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {editingId === line.id ? (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                            placeholder="Nombre"
                          />
                          <input
                            type="text"
                            value={editPhone}
                            onChange={e => setEditPhone(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                            placeholder="Número"
                          />
                        </div>
                        <input
                          type="text"
                          value={editMessage}
                          onChange={e => setEditMessage(e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="Mensaje"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-slate-400 hover:text-slate-200 text-sm px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all duration-200 cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveEditLine(line.id)}
                            className="bg-emerald-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-emerald-500 transition-all duration-200 cursor-pointer"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        {/* Toggle */}
                        <button
                          onClick={() => handleToggle(line)}
                          className={`w-10 h-[22px] rounded-full relative transition-colors duration-200 shrink-0 cursor-pointer ${
                            line.active ? 'bg-emerald-500' : 'bg-slate-600'
                          }`}
                        >
                          <span
                            className={`absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                              line.active ? 'translate-x-[18px]' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-medium ${line.active ? 'text-slate-100' : 'text-slate-500'}`}>
                              {line.name || line.phone}
                            </p>
                            {line.name && (
                              <span className="text-xs font-mono text-slate-500">{line.phone}</span>
                            )}
                            <span
                              className="text-xs text-violet-400/60 cursor-pointer hover:text-violet-300 transition-colors"
                              onClick={() => handleResetClicks(line.id)}
                              title="Click para resetear"
                            >
                              {line.clicks || 0} clicks
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {line.message || '(sin mensaje)'}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => startEditLine(line)}
                            className="text-indigo-400 hover:text-indigo-300 text-sm px-2 py-1 rounded-md hover:bg-indigo-500/10 transition-all duration-200 cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteLine(line.id)}
                            className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded-md hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* URL info */}
            <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-indigo-300 font-medium">URL de redirección</p>
                  <p className="text-xs font-mono text-indigo-400/60 mt-0.5">
                    /{selectedGroup.slug}
                  </p>
                </div>
                <button
                  onClick={copyUrl}
                  className={`text-sm px-4 py-2 rounded-lg font-medium transition-all duration-200 shrink-0 cursor-pointer ${
                    copied
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
                >
                  {copied ? 'Copiado!' : 'Copiar URL'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">📡</div>
            <p className="text-slate-400 text-sm">No hay canales configurados</p>
            <p className="text-slate-600 text-xs mt-1">Creá un canal con el botón &quot;+ Canal&quot; para empezar</p>
          </div>
        )}
      </main>
    </div>
  );
}
