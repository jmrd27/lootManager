import React, { useMemo, useState } from 'react';
import { useAuth, Profile } from '@/features/auth/store';
import { supabase } from '@/lib/supabase';

export const AdminView: React.FC = () => {
  const { isLeader, session } = useAuth();
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, role, approved, created_at')
      .order('created_at', { ascending: true });
    if (!error) setProfiles(data as unknown as Profile[]);
    else alert(`Failed to load profiles: ${error.message}`);
    setLoading(false);
  };

  useMemo(() => { if (isLeader) load(); }, [isLeader]);

  if (!isLeader) return <p className="text-sm opacity-80">Admins only.</p>;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Admin — Users</h2>
        <button className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
      </div>
      {!profiles ? (
        <p className="text-sm opacity-80">Loading users…</p>
      ) : profiles.length === 0 ? (
        <p className="text-sm opacity-80">No users yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table className="min-w-[640px] divide-y divide-gray-200 dark:divide-gray-800">
            <thead>
              <tr>
                <th className="py-2 text-left text-sm font-semibold">Username</th>
                <th className="py-2 text-left text-sm font-semibold">Role</th>
                <th className="py-2 text-left text-sm font-semibold">Approved</th>
                <th className="py-2 text-left text-sm font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {profiles.map((p) => (
                <AdminRow key={p.id} p={p} leadersCount={profiles.filter((x) => x.role === 'leader' && x.approved).length} currentUserId={session?.user.id || ''} onSaved={(np) => setProfiles((prev) => prev ? prev.map(x => x.id === np.id ? np : x) : prev)} savingId={savingId} setSavingId={setSavingId} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const AdminRow: React.FC<{ p: Profile; leadersCount: number; currentUserId: string; onSaved: (p: Profile) => void; savingId: string | null; setSavingId: (id: string | null) => void }> = ({ p, leadersCount, currentUserId, onSaved, savingId, setSavingId }) => {
  const [role, setRole] = useState<Profile['role']>(p.role);
  const [approved, setApproved] = useState<boolean>(p.approved);
  const saving = savingId === p.id;

  const save = async () => {
    const wasLeader = p.role === 'leader' && p.approved === true;
    const willBeLeader = role === 'leader' && approved === true;
    const removingLeader = wasLeader && !willBeLeader;
    if (removingLeader && leadersCount <= 1) {
      alert('Cannot remove the last approved leader. Assign another leader first.');
      return;
    }
    if (p.id === currentUserId && removingLeader) {
      alert('You cannot demote or unapprove your own leader account.');
      return;
    }

    setSavingId(p.id);
    const { data, error } = await supabase
      .from('profiles')
      .update({ role, approved })
      .eq('id', p.id)
      .select('id, username, role, approved')
      .single();
    setSavingId(null);
    if (error) {
      alert(`Failed to save: ${error.message}`);
      return;
    }
    onSaved(data as unknown as Profile);
  };

  return (
    <tr>
      <td className="py-2 text-sm">{p.username}</td>
      <td className="py-2 text-sm">
        <select value={role} onChange={(e) => setRole(e.target.value as Profile['role'])} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800">
          <option value="member">member</option>
          <option value="leader">leader</option>
        </select>
      </td>
      <td className="py-2 text-sm">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} />
          <span>Approved</span>
        </label>
      </td>
      <td className="py-2 text-right text-sm">
        <button disabled={saving} onClick={save} className="inline-flex items-center gap-1 rounded-md border border-transparent bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-500 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </td>
    </tr>
  );
};

