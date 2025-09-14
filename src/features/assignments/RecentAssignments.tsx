import React, { useMemo } from 'react';
import { useLoot } from '@/features/loot/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const RecentAssignments: React.FC<{ limit?: number }> = ({ limit = 8 }) => {
  const { assignments, items } = useLoot();

  const rows = useMemo(() => {
    const byId = new Map(items.map((i) => [i.id, i] as const));
    return [...assignments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map((a) => ({
        id: a.id,
        itemName: byId.get(a.itemId)?.name || 'Unknown Item',
        assigneeName: a.assigneeName,
        quantity: a.quantity,
        createdAt: a.createdAt,
      }));
  }, [assignments, items, limit]);

  return (
    <aside>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm opacity-80">No recent assignments.</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{r.assigneeName} × {r.quantity}</div>
                    <div className="truncate text-xs opacity-70">{r.itemName}</div>
                  </div>
                  <div className="shrink-0 text-xs opacity-70">{new Date(r.createdAt).toLocaleDateString()}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </aside>
  );
};

