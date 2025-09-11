import React, { useMemo, useState } from 'react';
import { useLoot } from '@/features/loot/store';
import { useAuth } from '@/features/auth/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
            <Input placeholder="Item name" value={name} onChange={(e) => { setName(e.target.value); setOpenSuggest(true); }} onFocus={() => setOpenSuggest(true)} onBlur={() => setTimeout(() => setOpenSuggest(false), 150)} required autoComplete="off" />
            {openSuggest && filtered.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {filtered.map((n) => (
                  <button key={n} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700" onMouseDown={(e) => { e.preventDefault(); setName(n); setOpenSuggest(false); }}>{n}</button>
                ))}
              </div>
            )}
          </div>
          <Input className="w-full sm:w-28" type="number" min={1} value={qty} onChange={(e) => setQty(parseInt(e.target.value || '0', 10))} />
          <Input className="w-full sm:w-auto" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Button className="w-full sm:w-auto" type="submit">Add</Button>
        </form>
      )}
      {items.length === 0 ? (
        <p className="text-sm opacity-80">No items yet. Add a drop above.</p>
      ) : (
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
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>
                  <button className="text-brand-600 hover:underline" onClick={() => openItem(it.id)}>{it.name}</button>
                </TableCell>
                <TableCell>{it.quantity}</TableCell>
                <TableCell>{it.dateISO}</TableCell>
                <TableCell>{requestTotal(it.id)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input className="w-20 px-2 py-1" type="number" min={1} value={getRqQty(it.id)} onChange={(e) => setRqQtyFor(it.id, parseInt(e.target.value || '1', 10))} />
                    <Button disabled={!session} onClick={() => { const q = getRqQty(it.id); if (q > 0) { addRequest({ itemId: it.id, quantity: q }); setRqQtyFor(it.id, 1); } }}>Request</Button>
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
      )}
    </div>
  );
};
