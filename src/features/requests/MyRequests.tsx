import React, { useMemo } from 'react';
import { useLoot } from '@/features/loot/store';
import { useAuth } from '@/features/auth/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const MyRequests: React.FC<{ limit?: number }> = ({ limit = 8 }) => {
  const { requests, items } = useLoot();
  const { profile } = useAuth();
  const username = profile?.username || '';

  const rows = useMemo(() => {
    if (!username) return [] as { id: string; itemName: string; quantity: number; createdAt: string }[];
    const byId = new Map(items.map((i) => [i.id, i] as const));
    return requests
      .filter((r) => r.memberName === username)
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map((r) => ({ id: r.id, itemName: byId.get(r.itemId)?.name || 'Unknown Item', quantity: r.quantity, createdAt: r.createdAt }));
  }, [requests, items, username, limit]);

  return (
    <aside>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">My Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm opacity-80">No unfulfilled requests.</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{r.itemName} x {r.quantity}</div>
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

