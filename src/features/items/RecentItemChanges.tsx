import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

type ItemEvent = {
  id: string;
  item_id: string | null;
  item_name: string;
  type: 'added' | 'increased';
  amount: number;
  new_qty: number;
  created_at: string;
};

export const RecentItemChanges: React.FC<{ limit?: number }> = ({ limit = 8 }) => {
  const [events, setEvents] = useState<ItemEvent[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data, error } = await supabase
        .from('item_events')
        .select('id, item_id, item_name, type, amount, new_qty, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!error && data && alive) setEvents(data as unknown as ItemEvent[]);
    };
    load();

    const channel = supabase
      .channel('item_events_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'item_events' }, (payload) => {
        const r = payload.new as ItemEvent;
        setEvents((prev) => {
          const next = [r, ...prev.filter((x) => x.id !== r.id)];
          return next.slice(0, limit);
        });
      })
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [limit]);

  const rows = useMemo(() => events, [events]);

  return (
    <aside>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Item Changes</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm opacity-80">No recent item changes.</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {e.type === 'added' ? (
                      <div className="truncate text-sm font-medium flex items-center gap-1.5">
                        <span className="sr-only">New</span>
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-emerald-700/40 bg-emerald-900/30 text-emerald-400">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                            <path d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" />
                          </svg>
                        </span>
                        <span className="truncate">{e.item_name} x {e.amount}</span>
                      </div>
                    ) : (
                      <div className="truncate text-sm font-medium flex items-center gap-1.5">
                        <span className="sr-only">Increased</span>
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-indigo-700/40 bg-indigo-900/30 text-indigo-400">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                            <path d="M10 3l5 5h-3v7H8V8H5l5-5z" />
                          </svg>
                        </span>
                        <span className="truncate">{e.item_name} +{e.amount} (now {e.new_qty})</span>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-xs opacity-70">{new Date(e.created_at).toLocaleDateString()}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </aside>
  );
};
