import React, { createContext, useContext, useEffect, useState } from 'react';
import { Item, Request, Assignment } from './types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store';

type Ctx = {
  items: Item[];
  requests: Request[];
  assignments: Assignment[];
  requestsEnabled: boolean;
  addItem: (input: { name: string; quantity: number; dateISO: string }) => void;
  updateItem: (id: string, patch: Partial<Pick<Item, 'name' | 'quantity' | 'dateISO'>>) => void;
  removeItem: (id: string) => void;
  addRequest: (input: { itemId: string; quantity: number }) => void;
  removeRequest: (id: string) => void;
  decrementRequest: (id: string, by: number) => Promise<void>;
  addAssignment: (input: { itemId: string; assigneeName: string; quantity: number }) => void;
  removeAssignment: (id: string) => void;
  clearAll: () => void;
};

const LootContext = createContext<Ctx | null>(null);

export const LootProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useLootStore();
  return <LootContext.Provider value={store}>{children}</LootContext.Provider>;
};

export function useLoot(): Ctx {
  const ctx = useContext(LootContext);
  if (!ctx) throw new Error('useLoot must be used within LootProvider');
  return ctx;
}

function useLootStore(): Ctx {
  const { profile } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [requestsEnabled, setRequestsEnabled] = useState<boolean>(true);

  // Initial load
  useEffect(() => {
    const load = async () => {
      const { data: itemsData, error: e1 } = await supabase
        .from('items')
        .select('id, name, quantity, date_iso, created_at')
        .order('created_at', { ascending: false });
      if (!e1 && itemsData) {
        setItems(
          itemsData.map((r: any) => ({
            id: r.id,
            name: r.name,
            quantity: r.quantity,
            dateISO: r.date_iso,
            createdAt: r.created_at,
          }))
        );
      }

      const { data: reqData, error: e2 } = await supabase
        .from('requests')
        .select('id, item_id, member_name, quantity, requester_id, created_at')
        .order('created_at', { ascending: false });
      if (!e2 && reqData) {
        setRequests(
          reqData.map((r: any) => ({
            id: r.id,
            itemId: r.item_id,
            memberName: r.member_name,
            quantity: r.quantity,
            requesterId: r.requester_id ?? undefined,
            createdAt: r.created_at,
          }))
        );
      }

      const { data: asnData, error: e3 } = await supabase
        .from('assignments')
        .select('id, item_id, assignee_id, assignee_name, quantity, assigned_by, created_at')
        .order('created_at', { ascending: true });
      if (!e3 && asnData) {
        setAssignments(
          asnData.map((a: any) => ({
            id: a.id,
            itemId: a.item_id,
            assigneeId: a.assignee_id ?? undefined,
            assigneeName: a.assignee_name,
            quantity: a.quantity,
            assignedBy: a.assigned_by ?? undefined,
            createdAt: a.created_at,
          }))
        );
      }

      // Settings
      const { data: settings } = await supabase
        .from('settings')
        .select('requests_enabled')
        .eq('id', 1)
        .maybeSingle();
      if (settings && typeof (settings as any).requests_enabled === 'boolean') {
        setRequestsEnabled((settings as any).requests_enabled as boolean);
      }
    };
    load();

    // realtime subscriptions
    const channel = supabase.channel('loot_changes');
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const r: any = payload.new;
          setItems((prev) => [
            { id: r.id, name: r.name, quantity: r.quantity, dateISO: r.date_iso, createdAt: r.created_at },
            ...prev.filter((i) => i.id !== r.id),
          ]);
        } else if (payload.eventType === 'UPDATE') {
          const r: any = payload.new;
          setItems((prev) => prev.map((i) => (i.id === r.id ? { id: r.id, name: r.name, quantity: r.quantity, dateISO: r.date_iso, createdAt: r.created_at } : i)));
        } else if (payload.eventType === 'DELETE') {
          const r: any = payload.old;
          setItems((prev) => prev.filter((i) => i.id !== r.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const r: any = payload.new;
          setRequests((prev) => [
            { id: r.id, itemId: r.item_id, memberName: r.member_name, quantity: r.quantity, requesterId: r.requester_id ?? undefined, createdAt: r.created_at },
            ...prev.filter((x) => x.id !== r.id),
          ]);
        } else if (payload.eventType === 'UPDATE') {
          const r: any = payload.new;
          setRequests((prev) => prev.map((x) => (x.id === r.id ? { id: r.id, itemId: r.item_id, memberName: r.member_name, quantity: r.quantity, requesterId: r.requester_id ?? undefined, createdAt: r.created_at } : x)));
        } else if (payload.eventType === 'DELETE') {
          const r: any = payload.old;
          setRequests((prev) => prev.filter((x) => x.id !== r.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const a: any = payload.new;
          setAssignments((prev) => [
            {
              id: a.id,
              itemId: a.item_id,
              assigneeId: a.assignee_id ?? undefined,
              assigneeName: a.assignee_name,
              quantity: a.quantity,
              assignedBy: a.assigned_by ?? undefined,
              createdAt: a.created_at,
            },
            ...prev.filter((x) => x.id !== a.id),
          ]);
        } else if (payload.eventType === 'UPDATE') {
          const a: any = payload.new;
          setAssignments((prev) => prev.map((x) => (x.id === a.id ? {
            id: a.id,
            itemId: a.item_id,
            assigneeId: a.assignee_id ?? undefined,
            assigneeName: a.assignee_name,
            quantity: a.quantity,
            assignedBy: a.assigned_by ?? undefined,
            createdAt: a.created_at,
          } : x)));
        } else if (payload.eventType === 'DELETE') {
          const a: any = payload.old;
          setAssignments((prev) => prev.filter((x) => x.id !== a.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const r: any = payload.new;
          if (typeof r?.requests_enabled === 'boolean') setRequestsEnabled(r.requests_enabled);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addItem: Ctx['addItem'] = async (input) => {
    // Merge by case-insensitive name + same date
    const { data: existing, error: findErr } = await supabase
      .from('items')
      .select('id, name, quantity, date_iso, created_at')
      .eq('date_iso', input.dateISO)
      .ilike('name', input.name)
      .maybeSingle();

    if (findErr && findErr.code !== 'PGRST116') {
      // PGRST116: no rows returned for maybeSingle
      alert(`Failed to check duplicates: ${findErr.message}`);
      return;
    }

    if (existing) {
      const newQty = (existing.quantity || 0) + input.quantity;
      const { data, error } = await supabase
        .from('items')
        .update({ quantity: newQty })
        .eq('id', existing.id)
        .select('id, name, quantity, date_iso, created_at')
        .single();
      if (error) {
        alert(`Failed to update quantity: ${error.message}`);
        return;
      }
      const it: Item = { id: data.id, name: data.name, quantity: data.quantity, dateISO: data.date_iso, createdAt: data.created_at };
      setItems((prev) => prev.map((x) => (x.id === it.id ? it : x)));
      return;
    }

    const { data, error } = await supabase
      .from('items')
      .insert({ name: input.name, quantity: input.quantity, date_iso: input.dateISO })
      .select('id, name, quantity, date_iso, created_at')
      .single();
    if (error) {
      alert(`Failed to add item: ${error.message}`);
      return;
    }
    const it: Item = { id: data.id, name: data.name, quantity: data.quantity, dateISO: data.date_iso, createdAt: data.created_at };
    setItems((prev) => [it, ...prev.filter((x) => x.id !== it.id)]);
  };

  const updateItem: Ctx['updateItem'] = async (id, patch) => {
    const update: any = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.quantity !== undefined) update.quantity = patch.quantity;
    if (patch.dateISO !== undefined) update.date_iso = patch.dateISO;
    const { error } = await supabase.from('items').update(update).eq('id', id);
    if (error) {
      alert(`Failed to update item: ${error.message}`);
    } else {
      // Optimistic local update
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    }
  };

  const removeItem: Ctx['removeItem'] = async (id) => {
    // requests have ON DELETE CASCADE in schema; otherwise delete manually first
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) {
      alert(`Failed to delete item: ${error.message}`);
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id));
      setRequests((prev) => prev.filter((r) => r.itemId !== id));
    }
  };

  const addRequest: Ctx['addRequest'] = async (input) => {
    if (!requestsEnabled) {
      alert('Requests are currently disabled by an admin.');
      return;
    }
    const user = (await supabase.auth.getUser()).data.user;
    if (!user || !profile?.username) {
      alert('Please sign in to request items.');
      return;
    }
    const memberName = profile.username;
    // Do NOT merge; create a new request row with its own timestamp
    const { data, error } = await supabase
      .from('requests')
      .insert({ item_id: input.itemId, member_name: memberName, quantity: input.quantity, requester_id: user.id })
      .select('id, item_id, member_name, quantity, requester_id, created_at')
      .single();
    if (error) {
      alert(`Failed to add request: ${error.message}`);
      return;
    }
    const rq: Request = {
      id: data.id,
      itemId: data.item_id,
      memberName: data.member_name,
      quantity: data.quantity,
      requesterId: data.requester_id ?? user.id,
      createdAt: data.created_at,
    };
    setRequests((prev) => [rq, ...prev.filter((x) => x.id !== rq.id)]);
  };

  const removeRequest: Ctx['removeRequest'] = async (id) => {
    const { error } = await supabase.from('requests').delete().eq('id', id);
    if (error) {
      alert(`Failed to remove request: ${error.message}`);
    } else {
      setRequests((prev) => prev.filter((x) => x.id !== id));
    }
  };

  const decrementRequest: Ctx['decrementRequest'] = async (id, by) => {
    const current = requests.find((r) => r.id === id);
    if (!current) return;
    const newQty = Math.max(0, (current.quantity || 0) - Math.max(0, by || 0));
    // Optimistic local update
    if (newQty === 0) {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      const { error } = await supabase.from('requests').delete().eq('id', id);
      if (error) {
        // revert on failure
        setRequests((prev) => [current, ...prev]);
        alert(`Failed to update request: ${error.message}`);
      }
    } else {
      const next = { ...current, quantity: newQty } as Request;
      setRequests((prev) => prev.map((r) => (r.id === id ? next : r)));
      const { error } = await supabase.from('requests').update({ quantity: newQty }).eq('id', id);
      if (error) {
        // revert on failure
        setRequests((prev) => prev.map((r) => (r.id === id ? current : r)));
        alert(`Failed to update request: ${error.message}`);
      }
    }
  };

  const clearAll = async () => {
    if (!confirm('Clear all items and requests?')) return;
    // Order matters if no cascade
    const e1 = await supabase.from('requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const e2 = await supabase.from('assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const e3 = await supabase.from('items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e1.error || e2.error || e3.error) alert(`Failed to clear: ${(e1.error || e2.error || e3.error)?.message}`);
  };

  const addAssignment: Ctx['addAssignment'] = async ({ itemId, assigneeName, quantity }) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      alert('Sign in required');
      return;
    }
    // Try to resolve assignee id by username
    const { data: prof } = await supabase.from('profiles').select('id').eq('username', assigneeName).maybeSingle();
    const payload: any = {
      item_id: itemId,
      assignee_name: assigneeName,
      quantity,
      assigned_by: user.id,
    };
    if (prof?.id) payload.assignee_id = prof.id;
    const { data, error } = await supabase
      .from('assignments')
      .insert(payload)
      .select('id, item_id, assignee_id, assignee_name, quantity, assigned_by, created_at')
      .single();
    if (error) {
      alert(`Failed to assign: ${error.message}`);
      return;
    }
    const a: Assignment = {
      id: data.id,
      itemId: data.item_id,
      assigneeId: data.assignee_id ?? undefined,
      assigneeName: data.assignee_name,
      quantity: data.quantity,
      assignedBy: data.assigned_by ?? undefined,
      createdAt: data.created_at,
    };
    setAssignments((prev) => [a, ...prev.filter((x) => x.id !== a.id)]);

    // Decrement item quantity on hand to reflect assignment
    const current = items.find((i) => i.id === itemId);
    if (current) {
      const newQty = Math.max(0, (current.quantity || 0) - quantity);
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i)));
      const { error: updErr } = await supabase
        .from('items')
        .update({ quantity: newQty })
        .eq('id', itemId);
      if (updErr) {
        // Revert on failure
        setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity: current.quantity } : i)));
        alert(`Failed to update item quantity: ${updErr.message}`);
      }
    }
  };

  const removeAssignment: Ctx['removeAssignment'] = async (id) => {
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) alert(`Failed to remove assignment: ${error.message}`);
    else setAssignments((prev) => prev.filter((x) => x.id !== id));
  };

  return { items, requests, assignments, requestsEnabled, addItem, updateItem, removeItem, addRequest, removeRequest, decrementRequest, addAssignment, removeAssignment, clearAll };
}
