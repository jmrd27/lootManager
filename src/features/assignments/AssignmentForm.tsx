import React, { useMemo, useState } from 'react';

export const AssignmentForm: React.FC<{ remaining: number; suggestNames: string[]; onAssign: (p: { name: string; qty: number }) => void }>
  = ({ remaining, suggestNames, onAssign }) => {
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => name.trim() ? suggestNames.filter(n => n.toLowerCase().includes(name.toLowerCase())) : suggestNames, [name, suggestNames]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || qty <= 0) return;
    onAssign({ name: name.trim(), qty: Math.min(qty, Math.max(0, remaining)) || 0 });
    setName('');
    setQty(1);
  };

  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <input
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
          placeholder="Member name"
          value={name}
          onChange={(e) => { setName(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          autoComplete="off"
        />
        {open && filtered.length > 0 && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {filtered.map((n) => (
              <button key={n} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700" onMouseDown={(e) => { e.preventDefault(); setName(n); setOpen(false); }}>
                {n}
              </button>
            ))}
          </div>
        )}
      </div>
      <input className="w-28 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800" type="number" min={1} max={remaining} value={qty} onChange={(e) => setQty(parseInt(e.target.value || '0', 10))} />
      <button disabled={remaining <= 0} className="inline-flex items-center gap-1 rounded-md border border-transparent bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-500 disabled:opacity-60" type="submit">Assign</button>
    </form>
  );
};

