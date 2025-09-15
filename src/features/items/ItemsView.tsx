import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLoot } from '@/features/loot/store';
import { useAuth } from '@/features/auth/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RecentAssignments } from '@/features/assignments/RecentAssignments';
import { ItemManagerCard } from '@/features/items/ItemManagerCard';
import { LatestRequests } from '@/features/requests/LatestRequests';
import { Tooltip } from '@/components/ui/tooltip';
import { RecentItemChanges } from '@/features/items/RecentItemChanges';
import { MyRequests } from '@/features/requests/MyRequests';

export const ItemsView: React.FC<{ openItem?: (id: string) => void }> = () => {
  const { items, addItem, removeItem, requests, addRequest, updateItem, requestsEnabled } = useLoot();
  const { isLeader, canManageItems, session } = useAuth();
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rqQty, setRqQty] = useState<Record<string, number>>({});
  const getRqQty = (id: string) => rqQty[id] ?? 1;
  const setRqQtyFor = (id: string, val: number) => setRqQty((prev) => ({ ...prev, [id]: Math.max(1, val) }));

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || qty < 0) return;
    addItem({ name: name.trim(), quantity: qty, dateISO: date });
    setName('');
    setQty(1);
  };

  const requestTotal = (itemId: string) => requests.filter((r) => r.itemId === itemId).reduce((s, r) => s + r.quantity, 0);

  const allNames = useMemo(() => Array.from(new Set(items.map((i) => i.name))).sort((a, b) => a.localeCompare(b)), [items]);
  const filtered = useMemo(() => (name.trim() ? allNames.filter((n) => n.toLowerCase().includes(name.toLowerCase())) : []), [name, allNames]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<string>(() => localStorage.getItem('itemsSort') || 'default');
  const setSort = (m: string) => { setSortMode(m); localStorage.setItem('itemsSort', m); };

  // Default order uses position; others are client-side derivations
  const baseItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items;
    return q ? list.filter((i) => i.name.toLowerCase().includes(q)) : list;
  }, [items, query]);

  const requestedMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) m.set(it.id, 0);
    for (const r of requests) m.set(r.itemId, (m.get(r.itemId) || 0) + r.quantity);
    return m;
  }, [items, requests]);

  const sortedItems = useMemo(() => {
    if (sortMode === 'default') {
      return [...baseItems].sort((a, b) => (a.position || 0) - (b.position || 0) || a.dateISO.localeCompare(b.dateISO));
    }
    const [key, dir] = sortMode.split(':');
    const mul = dir === 'desc' ? -1 : 1;
    const list = [...baseItems];
    switch (key) {
      case 'name':
        list.sort((a, b) => mul * a.name.localeCompare(b.name));
        break;
      case 'qty':
        list.sort((a, b) => mul * (a.quantity - b.quantity));
        break;
      case 'date':
        list.sort((a, b) => mul * a.dateISO.localeCompare(b.dateISO));
        break;
      case 'requested':
        list.sort((a, b) => mul * ((requestedMap.get(a.id) || 0) - (requestedMap.get(b.id) || 0)));
        break;
      default:
        break;
    }
    return list;
  }, [baseItems, sortMode, requestedMap]);

  // Drag and drop reordering (default mode only)
  const [orderIds, setOrderIds] = useState<string[]>([]);
  useEffect(() => {
    if (sortMode === 'default') {
      setOrderIds(sortedItems.map((i) => i.id));
    }
  }, [sortMode, sortedItems]);

  const onDragStart = (id: string) => (e: React.DragEvent) => {
    if (sortMode !== 'default' || !canManageItems) return;
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDropOver = (targetId: string) => (e: React.DragEvent) => {
    if (sortMode !== 'default' || !canManageItems) return;
    e.preventDefault();
    const srcId = e.dataTransfer.getData('text/plain');
    if (!srcId || srcId === targetId) return;
    setOrderIds((prev) => {
      const arr = prev.filter((x) => x !== srcId);
      const idx = arr.indexOf(targetId);
      if (idx === -1) return prev;
      arr.splice(idx, 0, srcId);
      return arr;
    });
  };
  const allowDrop = (e: React.DragEvent) => {
    if (sortMode !== 'default' || !canManageItems) return;
    e.preventDefault();
  };

  const saveOrder = async () => {
    if (sortMode !== 'default' || !canManageItems) return;
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.rpc('reorder_items', { ids: orderIds });
      if (error) throw error;
    } catch (err: any) {
      alert(err.message || 'Failed to save order');
    }
  };
  
  // Inline quantity edit (autosave with debounce)
  const [qtyEdits, setQtyEdits] = useState<Record<string, string>>({});
  const timersRef = useRef<Record<string, any>>({});
  const scheduleQtySave = (id: string, raw: string) => {
    if (timersRef.current[id]) clearTimeout(timersRef.current[id]);
    timersRef.current[id] = setTimeout(() => {
      const n = Math.max(0, parseInt(raw || '0', 10) || 0);
      updateItem(id, { quantity: n });
      delete timersRef.current[id];
    }, 400);
  };
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div>
      <section className="mb-6">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">Claim Your Loot</span>
            <span className="block">In Three Simple Steps</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-300">Follow the flow below to request and receive your share quickly.</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4 text-center">
            <div className="mb-2 text-2xl">🔎</div>
            <div className="text-sm font-semibold">1. Find an item</div>
            <div className="mt-1 text-xs text-gray-300">Browse the raid drops list and pick what you need.</div>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4 text-center">
            <div className="mb-2 text-2xl">📝</div>
            <div className="text-sm font-semibold">2. Send a request</div>
            <div className="mt-1 text-xs text-gray-300">Enter the quantity and add your request. Leaders see this queue.</div>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4 text-center">
            <div className="mb-2 text-2xl">🎁</div>
            <div className="text-sm font-semibold">3. Receive your loot</div>
            <div className="mt-1 text-xs text-gray-300">Leaders assign items. Watch for updates and enjoy the spoils.</div>
          </div>
        </div>
      </section>
      {selectedId ? (
        <div>
          <div className="mb-4">
            <Button variant="outline" onClick={() => setSelectedId(null)}>← Back to Items</Button>
          </div>
          <ItemManagerCard id={selectedId} onClose={() => setSelectedId(null)} />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            {canManageItems && (
              <form onSubmit={onAdd} className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/60 p-3">
                <div className="relative min-w-[200px] flex-1">
                  <Input placeholder="Item name" value={name} onChange={(e) => { setName(e.target.value); setOpenSuggest(true); }} onFocus={() => setOpenSuggest(true)} onBlur={() => setTimeout(() => setOpenSuggest(false), 150)} required autoComplete="off" />
                  {openSuggest && filtered.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-gray-700 bg-gray-800 shadow-lg">
                      {filtered.map((n) => (
                        <button key={n} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-700" onMouseDown={(e) => { e.preventDefault(); setName(n); setOpenSuggest(false); }}>{n}</button>
                      ))}
                    </div>
                  )}
                </div>
                <Input className="w-full sm:w-28" type="number" min={0} value={qty} onChange={(e) => setQty(parseInt(e.target.value || '0', 10))} />
                <Input className="w-full sm:w-auto" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <Button className="w-full sm:w-auto" type="submit">Add New Item</Button>
              </form>
            )}
            <div className="mb-4">
              <Input
                placeholder="Search items..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search items"
              />
            </div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs opacity-80">Sort</label>
                <select value={sortMode} onChange={(e) => setSort(e.target.value)} className="rounded-md border border-gray-700 bg-gray-900/60 px-2 py-1 text-xs">
                  <option value="default">Default (Leader Order)</option>
                  <option value="name:asc">Name ↑</option>
                  <option value="name:desc">Name ↓</option>
                  <option value="qty:asc">Qty ↑</option>
                  <option value="qty:desc">Qty ↓</option>
                  <option value="date:asc">Date ↑</option>
                  <option value="date:desc">Date ↓</option>
                  <option value="requested:asc">Requested ↑</option>
                  <option value="requested:desc">Requested ↓</option>
                </select>
              </div>
              {sortMode !== 'default' ? (
                <Button size="sm" variant="outline" onClick={() => setSort('default')}>Reset to Default</Button>
              ) : canManageItems ? (
                <Button size="sm" onClick={saveOrder}>Save Order</Button>
              ) : null}
            </div>
            {items.length === 0 ? (
              <p className="text-sm opacity-80">No items yet. Add a drop above.</p>
            ) : (
              <>
                <div className="sm:hidden space-y-3">
                  {(sortMode === 'default' ? orderIds.map(id => sortedItems.find(i => i.id === id)!).filter(Boolean) : sortedItems).map((it) => {
                    const total = requestTotal(it.id);
                    return (
                      <div key={it.id} className="rounded-lg border border-gray-800 bg-gray-900/60 p-3" draggable={sortMode==='default' && canManageItems} onDragStart={onDragStart(it.id)} onDragOver={allowDrop} onDrop={onDropOver(it.id)}>
                        <div className="flex items-start justify-between gap-2">
                          <button className="text-indigo-400 underline-offset-2 hover:underline" onClick={() => setSelectedId(it.id)}>{it.name}</button>
                          {canManageItems ? (
                            <Input
                              className="!w-[3rem] pr-0 pl-1 py-1 text-xs text-center"
                              type="number"
                              min={0}
                              value={qtyEdits[it.id] ?? String(it.quantity)}
                              onChange={(e) => { const v = e.target.value; setQtyEdits((p) => ({ ...p, [it.id]: v })); scheduleQtySave(it.id, v); }}
                              onBlur={(e) => { const n = Math.max(0, parseInt(e.target.value || '0', 10) || 0); updateItem(it.id, { quantity: n }); setQtyEdits((p) => ({ ...p, [it.id]: String(n) })); }}
                              aria-label={`Quantity for ${it.name}`}
                              title="Auto-saves"
                            />
                          ) : (
                            <span className="text-xs opacity-80">Qty: {it.quantity}</span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2 text-xs opacity-80">
                          <span>Date: {it.dateISO}</span>
                          <span>Requested: {total}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Input className="!w-[3rem] pr-0 pl-1 py-1 text-xs text-center" type="number" min={1} value={getRqQty(it.id)} onChange={(e) => setRqQtyFor(it.id, parseInt(e.target.value || '1', 10))} />
                            <Button size="sm" disabled={!session || !requestsEnabled} onClick={() => { const q = getRqQty(it.id); if (q > 0) { addRequest({ itemId: it.id, quantity: q }); setRqQtyFor(it.id, 1); } }}>{requestsEnabled ? 'Request' : 'Disabled'}</Button>
                          </div>
                          {isLeader && (
                            <Button size="sm" variant="destructive" onClick={() => removeItem(it.id)}>Delete</Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="hidden sm:block">
                  <Table className="min-w-[820px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-sm">Name</TableHead>
                        <TableHead className="text-sm">Qty</TableHead>
                        <TableHead className="text-sm">Date</TableHead>
                        <TableHead className="text-sm">Requested Qty</TableHead>
                        <TableHead className="text-sm">Quick Request</TableHead>
                        <TableHead className="text-sm"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(sortMode === 'default' ? orderIds.map(id => sortedItems.find(i => i.id === id)!).filter(Boolean) : sortedItems).map((it) => (
                        <TableRow key={it.id} draggable={sortMode==='default' && canManageItems} onDragStart={onDragStart(it.id)} onDragOver={allowDrop} onDrop={onDropOver(it.id)}>
                          <TableCell>
                            <button className="text-indigo-400 hover:underline" onClick={() => setSelectedId(it.id)}>{it.name}</button>
                          </TableCell>
                          <TableCell>
                            {canManageItems ? (
                              <Input
                                className="!w-[3rem] pr-0 pl-1 py-1 text-xs text-center"
                                type="number"
                                min={0}
                                value={qtyEdits[it.id] ?? String(it.quantity)}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setQtyEdits((prev) => ({ ...prev, [it.id]: v }));
                                  scheduleQtySave(it.id, v);
                                }}
                                onBlur={(e) => {
                                  const n = Math.max(0, parseInt(e.target.value || '0', 10) || 0);
                                  updateItem(it.id, { quantity: n });
                                  setQtyEdits((prev) => ({ ...prev, [it.id]: String(n) }));
                                }}
                                aria-label={`Quantity for ${it.name}`}
                                title="Auto-saves"
                              />
                            ) : (
                              it.quantity
                            )}
                          </TableCell>
                          <TableCell>{it.dateISO}</TableCell>
                          <TableCell>
                            <Tooltip
                              content={(() => {
                                const unfulfilled = requests
                                  .filter((r) => r.itemId === it.id)
                                  .slice()
                                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                                if (unfulfilled.length === 0) return <span className="opacity-70">No unfulfilled requests</span>;
                                return (
                                  <div>
                                    <div className="mb-2 text-[10px] uppercase tracking-wide opacity-70">Unfulfilled Requests</div>
                                    <ul className="max-h-64 space-y-1 overflow-auto">
                                      {unfulfilled.map((r) => (
                                        <li key={r.id} className="flex items-center justify-between gap-2">
                                          <span className="truncate">{r.memberName}</span>
                                          <span className="shrink-0">× {r.quantity}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                );
                              })()}
                            >
                              <span className="underline decoration-dotted underline-offset-2" title={`Unfulfilled requests for ${it.name}`}>{requestTotal(it.id)}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input className="!w-[3rem] pr-0 pl-1 py-1 text-xs text-center" type="number" min={1} value={getRqQty(it.id)} onChange={(e) => setRqQtyFor(it.id, parseInt(e.target.value || '1', 10))} />
                              <Button disabled={!session || !requestsEnabled} onClick={() => { const q = getRqQty(it.id); if (q > 0) { addRequest({ itemId: it.id, quantity: q }); setRqQtyFor(it.id, 1); } }}>{requestsEnabled ? 'Request' : 'Disabled'}</Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {isLeader && (
                              <Button variant="destructive" onClick={() => removeItem(it.id)}>Delete</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
          <div className="space-y-4">
            <RecentItemChanges />
            <MyRequests />
            <RecentAssignments />
            <LatestRequests />
          </div>
        </div>
      )}
    </div>
  );
};

