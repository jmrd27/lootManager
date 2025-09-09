import React from 'react';
import { useLoot } from '@/features/loot/store';
import { useAuth } from '@/features/auth/store';
import { computeSplit } from '@/features/loot/logic';
import { AssignmentForm } from '@/features/assignments/AssignmentForm';

export const ItemDetailView: React.FC<{ id: string; goBack: () => void }> = ({ id, goBack }) => {
  const { items, requests, assignments, removeRequest, removeAssignment, updateItem, addAssignment } = useLoot();
  const { isLeader, session } = useAuth();
  const item = items.find((x) => x.id === id);
  if (!item) return <div className="text-sm opacity-80">Item not found.</div>;

  const myRequests = requests.filter((r) => r.itemId === id);
  const myAssignments = assignments.filter((a) => a.itemId === id);
  const assignedQty = myAssignments.reduce((s, a) => s + a.quantity, 0);
  const remainingQty = Math.max(0, item.quantity - assignedQty);
  const allocations = computeSplit([item], myRequests)[item.id];

  const setItemQty = (newQty: number) => updateItem(item.id, { quantity: Math.max(0, newQty) });

  return (
    <div>
      <button className="inline-flex w-full items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 sm:w-auto" onClick={goBack}>← Back</button>
      <h2 className="mt-2 text-xl font-semibold">{item.name}</h2>
      <div className="mb-2 mt-1 flex items-center gap-3">
        <label className="text-sm">
          Quantity:
          <input className="ml-2 w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 sm:w-28" type="number" min={0} value={item.quantity} onChange={(e) => setItemQty(parseInt(e.target.value || '0', 10))} />
        </label>
        <span className="text-sm opacity-80">Date: {item.dateISO}</span>
      </div>

      <h3 className="mt-4 text-lg font-semibold">Requests</h3>
      <p className="mb-2 text-sm opacity-80">Use the Items list to add a quick request.</p>
      {myRequests.length === 0 ? <p className="text-sm opacity-80">No requests yet.</p> : (
        <ul className="space-y-1">
          {myRequests.map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <span>{r.memberName} × {r.quantity}</span>
              {(isLeader || (session?.user?.id && r.requesterId === session.user.id)) ? (
                <button className="inline-flex items-center gap-1 rounded-md border border-transparent bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-500" onClick={() => removeRequest(r.id)}>Remove</button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-5 text-lg font-semibold">Suggested Split</h3>
      {isLeader && allocations ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <ul className="list-disc space-y-1 pl-6">
            {allocations.assignments.map((a) => (
              <li key={a.memberName}><span className="font-medium">{a.memberName}</span>: {a.qty}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm opacity-80">Leftover: {allocations.leftover}</p>
        </div>
      ) : isLeader ? <p className="text-sm opacity-80">No split suggestion.</p> : null}

      <h3 className="mt-5 text-lg font-semibold">Assignments</h3>
      <p className="text-sm opacity-80">Assigned: {assignedQty} / {item.quantity} • Remaining: {remainingQty}</p>
      {myAssignments.length === 0 ? (
        <p className="text-sm opacity-80">No assignments yet.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {myAssignments.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <span>
                {a.assigneeName} × {a.quantity}
                <span className="ml-2 text-xs opacity-70">{new Date(a.createdAt).toLocaleDateString()}</span>
              </span>
              {isLeader && (
                <button className="inline-flex items-center gap-1 rounded-md border border-transparent bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-500" onClick={() => removeAssignment(a.id)}>Remove</button>
              )}
            </li>
          ))}
        </ul>
      )}

      {isLeader && (
        <AssignmentForm
          remaining={remainingQty}
          onAssign={(payload) => addAssignment({ itemId: id, assigneeName: payload.name, quantity: payload.qty })}
          suggestNames={[...new Set(myRequests.map((r) => r.memberName).concat(myAssignments.map((a) => a.assigneeName)))]}
        />
      )}
    </div>
  );
};

