import { Item, Request, ItemAlloc } from './types';

export function computeSplit(items: Item[], requests: Request[]): Record<string, ItemAlloc> {
  const byItem: Record<string, Request[]> = {};
  for (const r of requests) {
    (byItem[r.itemId] ||= []).push(r);
  }

  const out: Record<string, ItemAlloc> = {};

  for (const item of items) {
    const rs = (byItem[item.id] || []).slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (rs.length === 0) continue;

    // Build demand per member and a stable order based on first request time
    const demand = new Map<string, number>();
    const order: string[] = [];
    for (const r of rs) {
      if (!demand.has(r.memberName)) order.push(r.memberName);
      demand.set(r.memberName, (demand.get(r.memberName) || 0) + Math.max(0, r.quantity));
    }

    const assigned = new Map<string, number>();
    let remaining = item.quantity;
    let anyAllocated = true;
    while (remaining > 0 && anyAllocated) {
      anyAllocated = false;
      for (const name of order) {
        const need = demand.get(name) || 0;
        if (need <= 0) continue;
        // allocate one unit
        demand.set(name, need - 1);
        assigned.set(name, (assigned.get(name) || 0) + 1);
        remaining--;
        anyAllocated = true;
        if (remaining === 0) break;
      }
    }

    const assignments = Array.from(assigned.entries())
      .map(([memberName, qty]) => ({ memberName, qty }))
      .sort((a, b) => a.memberName.localeCompare(b.memberName));

    out[item.id] = { assignments, leftover: remaining };
  }

  return out;
}

export function summarizeByMember(items: Item[], requests: Request[]): Record<string, number> {
  const split = computeSplit(items, requests);
  const totals: Record<string, number> = {};
  for (const item of items) {
    const alloc = split[item.id];
    if (!alloc) continue;
    for (const a of alloc.assignments) {
      totals[a.memberName] = (totals[a.memberName] || 0) + a.qty;
    }
  }
  return totals;
}
