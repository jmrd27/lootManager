import React, { useState } from 'react';
import { useLoot } from '@/features/loot/store';
import { useAuth } from '@/features/auth/store';
import { computeSplit } from '@/features/loot/logic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export const ItemManagerCard: React.FC<{ id: string; onClose?: () => void }> = ({ id, onClose }) => {
  const { items, requests, assignments, removeRequest, updateItem, addAssignment, decrementRequest, requestsEnabled } = useLoot();
  const { isLeader, canManageItems, session } = useAuth();
  const item = items.find((x) => x.id === id);
  if (!item) return null;

  const myRequests = requests.filter((r) => r.itemId === id);
  const myAssignments = assignments.filter((a) => a.itemId === id);
  const assignedQty = myAssignments.reduce((s, a) => s + a.quantity, 0);
  const remainingQty = item.quantity; // quantity reflects on-hand
  const allocations = computeSplit([item], myRequests)[item.id];

  const setItemQty = (newQty: number) => updateItem(item.id, { quantity: Math.max(0, newQty) });

  const [assignQty, setAssignQty] = useState<Record<string, number>>({});
  const getAssignQty = (reqId: string) => assignQty[reqId] ?? 1;
  const setAssignQtyFor = (reqId: string, val: number) =>
    setAssignQty((prev) => ({ ...prev, [reqId]: Math.max(1, val) }));

  return (
    <aside>
      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{item.name}</h2>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
            )}
          </div>
          <div className="mb-3 mt-1 flex items-center gap-3">
            {canManageItems ? (
              <label className="text-sm">
                Quantity:
                <Input className="ml-2 w-full sm:w-28" type="number" min={0} value={item.quantity} onChange={(e) => setItemQty(parseInt(e.target.value || '0', 10))} />
              </label>
            ) : (
              <span className="text-sm">Quantity: <span className="font-medium">{item.quantity}</span></span>
            )}
            <span className="text-sm opacity-80">Date: {item.dateISO}</span>
          </div>

          <h3 className="mt-4 text-base font-semibold">Requests</h3>
          <p className="mb-2 text-sm opacity-80">{requestsEnabled ? 'Use the Items list to add a quick request.' : 'Requests are disabled by an admin.'}</p>
          {myRequests.length === 0 ? <p className="text-sm opacity-80">No requests yet.</p> : (
            <ul className="space-y-1">
              {myRequests.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="min-w-0">
                    <span className="truncate">
                      {r.memberName} × {r.quantity}
                      <span className="ml-2 text-xs opacity-70">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    {isLeader && (
                      <>
                        <Input
                          className="w-20 px-2 py-1"
                          type="number"
                          min={1}
                          value={getAssignQty(r.id)}
                          onChange={(e) => setAssignQtyFor(r.id, parseInt(e.target.value || '1', 10))}
                        />
                        <Button
                          onClick={async () => {
                            const q = Math.min(getAssignQty(r.id), r.quantity, remainingQty);
                            if (q > 0) {
                              await addAssignment({ itemId: id, assigneeName: r.memberName, quantity: q });
                              await decrementRequest(r.id, q);
                              setAssignQtyFor(r.id, 1);
                            }
                          }}
                        >
                          Assign
                        </Button>
                      </>
                    )}
                    {(isLeader || (session?.user?.id && r.requesterId === session.user.id)) ? (
                      <Button variant="destructive" onClick={() => removeRequest(r.id)}>Remove</Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-5 text-base font-semibold">Suggested Split</h3>
          {isLeader && allocations ? (
            <Card className="mt-2">
              <CardContent className="p-4">
                <ul className="list-disc space-y-1 pl-6">
                  {allocations.assignments.map((a) => (
                    <li key={a.memberName}><span className="font-medium">{a.memberName}</span>: {a.qty}</li>
                  ))}
                </ul>
                <p className="mt-2 text-sm opacity-80">Leftover: {allocations.leftover}</p>
              </CardContent>
            </Card>
          ) : isLeader ? <p className="text-sm opacity-80">No split suggestion.</p> : null}

          <h3 className="mt-5 text-base font-semibold">Totals</h3>
          <p className="text-sm opacity-80">On hand: {item.quantity} · Assigned so far: {assignedQty}</p>
        </CardContent>
      </Card>
    </aside>
  );
};
