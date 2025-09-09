import React, { useMemo, useState } from 'react';
import { useLoot } from '@/features/loot/store';
import { useAuth } from '@/features/auth/store';

export const ItemsView: React.FC<{ openItem: (id: string) => void }> = ({ openItem }) => {
  const { items, addItem, removeItem, requests, addRequest } = useLoot();
  const { isLeader, session } = useAuth();
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rqQty, setRqQty] = useState<Record<string, number>>({});
  const getRqQty = (id: string) => rqQty[id] ?? 1;
  const setRqQtyFor = (id: string, val: number) => setRqQty((prev) => ({ ...prev, [id]: Math.max(1, val) }));

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || qty <= 0) return;
    addItem({ name: name.trim(), quantity: qty, dateISO: date });
    setName('');
    setQty(1);
  };

  const requestTotal = (itemId: string) => requests.filter((r) => r.itemId === itemId).reduce((s, r) => s + r.quantity, 0);

  const allNames = useMemo(() => Array.from(new Set(items.map((i) => i.name))).sort((a, b) => a.localeCompare(b)), [items]);
  const filtered = useMemo(() => (name.trim() ? allNames.filter((n) => n.toLowerCase().includes(name.toLowerCase())) : []), [name, allNames]);
  const [openSuggest, setOpenSuggest] = useState(false);

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">Items</h2>
      {isLeader && (
        <form onSubmit={onAdd} className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-[200px] flex-1">
            <input className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800" placeholder="Item name" value={name} onChange={(e) => { setName(e.target.value); setOpenSuggest(true); }} onFocus={() => setOpenSuggest(true)} onBlur={() => setTimeout(() => setOpenSuggest(false), 150)} required autoComplete="off" />
            {openSuggest && filtered.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {filtered.map((n) => (
                  <button key={n} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700" onMouseDown={(e) => { e.preventDefault(); setName(n); setOpenSuggest(false); }}>{n}</button>
                ))}
              </div>
            )}
          </div>
          <input className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 sm:w-28" type="number" min={1} value={qty} onChange={(e) => setQty(parseInt(e.target.value || '0', 10))} />
          <input className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 sm:w-auto" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="inline-flex w-full items-center gap-1 rounded-md border border-transparent bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-500 sm:w-auto" type="submit">Add</button>
        </form>
      )}
      {items.length === 0 ? (
        <p className="text-sm opacity-80">No items yet. Add a drop above.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table className="min-w-[820px] divide-y divide-gray-200 dark:divide-gray-800">
            <thead>
              <tr>
                <th className="py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Name</th>
                <th className="py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Qty</th>
                <th className="py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Date</th>
                <th className="py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Requested Qty</th>
                <th className="py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Quick Request</th>
                <th className="py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="py-2 text-sm text-gray-800 dark:text-gray-100">
                    <button className="text-brand-600 hover:underline" onClick={() => openItem(it.id)}>{it.name}</button>
                  </td>
                  <td className="py-2 text-sm text-gray-800 dark:text-gray-100">{it.quantity}</td>
                  <td className="py-2 text-sm text-gray-800 dark:text-gray-100">{it.dateISO}</td>
                  <td className="py-2 text-sm text-gray-800 dark:text-gray-100">{requestTotal(it.id)}</td>
                  <td className="py-2 text-sm text-gray-800 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <input className="w-20 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800" type="number" min={1} value={getRqQty(it.id)} onChange={(e) => setRqQtyFor(it.id, parseInt(e.target.value || '1', 10))} />
                      <button disabled={!session} className="inline-flex items-center gap-1 rounded-md border border-transparent bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-500 disabled:opacity-60" onClick={() => { const q = getRqQty(it.id); if (q > 0) { addRequest({ itemId: it.id, quantity: q }); setRqQtyFor(it.id, 1); } }}>Request</button>
                    </div>
                  </td>
                  <td className="py-2 text-right text-sm text-gray-800 dark:text-gray-100">
                    {isLeader && (
                      <button className="inline-flex items-center gap-1 rounded-md border border-transparent bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-500" onClick={() => removeItem(it.id)}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

