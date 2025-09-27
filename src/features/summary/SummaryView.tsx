import React, { useMemo, useState } from 'react';
import { useLoot } from '@/features/loot/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type RangeKey = '1m' | '3m' | '6m' | '12m' | 'all';

const RANGE_OPTIONS: Array<{ id: RangeKey; label: string; months?: number }> = [
  { id: 'all', label: 'All time' },
  { id: '1m', label: 'Last month', months: 1 },
  { id: '3m', label: 'Last 3 months', months: 3 },
  { id: '6m', label: 'Last 6 months', months: 6 },
  { id: '12m', label: 'Last year', months: 12 },
];

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

type MemberSnapshot = {
  name: string;
  totalQuantity: number;
  lastAssignedAt?: string;
  itemBreakdown: Array<{
    itemName: string;
    quantity: number;
    lastAssignedAt?: string;
  }>;
};

function formatTimestamp(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return timestampFormatter.format(date);
}

function getCutoff(range: RangeKey): number | null {
  const option = RANGE_OPTIONS.find((opt) => opt.id === range);
  const months = option?.months;
  if (!months) return null;
  const now = new Date();
  const cutoff = new Date(now.getTime());
  cutoff.setMonth(cutoff.getMonth() - months);
  return cutoff.getTime();
}

function getRangeLabel(range: RangeKey): string {
  return RANGE_OPTIONS.find((opt) => opt.id === range)?.label ?? 'All time';
}

export const SummaryView: React.FC = () => {
  const { assignments, items } = useLoot();
  const [range, setRange] = useState<RangeKey>('all');

  const itemNameById = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((item) => map.set(item.id, item.name));
    return map;
  }, [items]);

  const memberSnapshots = useMemo<MemberSnapshot[]>(() => {
    const cutoff = getCutoff(range);
    const byMember = new Map<
      string,
      {
        total: number;
        lastAssignedAt?: string;
        itemBreakdown: Map<string, { quantity: number; lastAssignedAt?: string }>;
      }
    >();

    assignments.forEach((assignment) => {
      if (!assignment.assigneeName) return;
      const createdAtMs = assignment.createdAt ? new Date(assignment.createdAt).getTime() : undefined;
      if (
        cutoff !== null &&
        (createdAtMs === undefined || Number.isNaN(createdAtMs) || createdAtMs < cutoff)
      ) {
        return;
      }

      const bucket =
        byMember.get(assignment.assigneeName) ?? {
          total: 0,
          lastAssignedAt: undefined,
          itemBreakdown: new Map<string, { quantity: number; lastAssignedAt?: string }>(),
        };

      bucket.total += assignment.quantity;

      if (createdAtMs !== undefined && !Number.isNaN(createdAtMs)) {
        if (!bucket.lastAssignedAt || createdAtMs > new Date(bucket.lastAssignedAt).getTime()) {
          bucket.lastAssignedAt = assignment.createdAt;
        }
      }

      const itemName = itemNameById.get(assignment.itemId) ?? 'Unknown item';
      const entry = bucket.itemBreakdown.get(itemName) ?? { quantity: 0, lastAssignedAt: undefined };
      entry.quantity += assignment.quantity;
      if (createdAtMs !== undefined && !Number.isNaN(createdAtMs)) {
        if (!entry.lastAssignedAt || createdAtMs > new Date(entry.lastAssignedAt).getTime()) {
          entry.lastAssignedAt = assignment.createdAt;
        }
      }
      bucket.itemBreakdown.set(itemName, entry);

      byMember.set(assignment.assigneeName, bucket);
    });

    return Array.from(byMember.entries())
      .map(([name, bucket]) => ({
        name,
        totalQuantity: bucket.total,
        lastAssignedAt: bucket.lastAssignedAt,
        itemBreakdown: Array.from(bucket.itemBreakdown.entries())
          .map(([itemName, entry]) => ({
            itemName,
            quantity: entry.quantity,
            lastAssignedAt: entry.lastAssignedAt,
          }))
          .sort((a, b) => b.quantity - a.quantity || a.itemName.localeCompare(b.itemName)),
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity || a.name.localeCompare(b.name));
  }, [assignments, itemNameById, range]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Assignments Snapshot</CardTitle>
              <p className="text-sm text-gray-400">Member totals for {getRangeLabel(range)}.</p>
              <p className="text-xs text-gray-500">
                This view pulls from the assignments history and reflects loot delivered after approval.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {RANGE_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  size="sm"
                  variant={option.id === range ? 'default' : 'ghost'}
                  onClick={() => setRange(option.id)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {memberSnapshots.length === 0 ? (
            <p className="text-sm text-gray-400">No assignments in this timeframe.</p>
          ) : (
            <ul className="space-y-4">
              {memberSnapshots.map((member) => (
                <li key={member.name} className="rounded-md bg-gray-950/40 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-base font-medium text-gray-100">{member.name}</span>
                    <span className="text-sm text-gray-300">Total assigned: {member.totalQuantity}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {member.itemBreakdown.length > 0 ? (
                      member.itemBreakdown.map((item) => (
                        <span
                          key={item.itemName}
                          className="inline-flex items-center rounded-full bg-gray-800/80 px-2.5 py-1 text-xs font-medium text-gray-100"
                          title={item.lastAssignedAt ? `Last given ${formatTimestamp(item.lastAssignedAt)}` : undefined}
                        >
                          <span>{item.itemName}</span>
                          <span className="ml-1 text-gray-300">x {item.quantity}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">No loot records yet.</span>
                    )}
                  </div>
                  {member.lastAssignedAt && (
                    <p className="mt-2 text-xs text-gray-500">
                      Last assignment {formatTimestamp(member.lastAssignedAt)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-gray-500">
            Switch the range to focus on recent raid nights or view lifetime distribution.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
