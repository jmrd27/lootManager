import React, { useMemo, useState } from 'react';
import { LootProvider, useLoot } from './features/loot/store';
import { AuthProvider, useAuth } from './features/auth/store';
import { TopBar } from './components/TopBar';
import { ItemsView } from './features/items/ItemsView';
import { ItemDetailView } from './features/items/ItemDetailView';
import { SummaryView } from './features/summary/SummaryView';
import { AdminView } from './features/admin/AdminView';
import { computeSplit } from './features/loot/logic';

export type View = { name: 'items' } | { name: 'item'; id: string } | { name: 'summary' } | { name: 'admin' };

export const App: React.FC = () => (
  <AuthProvider>
    <LootProvider>
      <Shell />
    </LootProvider>
  </AuthProvider>
);

const Shell: React.FC = () => {
  const [view, setView] = useState<View>({ name: 'items' });
  const { items, requests } = useLoot();
  const { session } = useAuth();
  useMemo(() => computeSplit(items, requests), [items, requests]);

  return (
    <div className="w-full min-h-screen bg-gray-50 p-3 text-gray-900 dark:bg-gray-900 dark:text-gray-100 sm:p-4 lg:p-6">
      <TopBar setView={setView} />
      {!session && <AuthInline />}
      {view.name === 'items' && <ItemsView openItem={(id) => setView({ name: 'item', id })} />}
      {view.name === 'item' && <ItemDetailView id={view.id} goBack={() => setView({ name: 'items' })} />}
      {view.name === 'summary' && <SummaryView />}
      {view.name === 'admin' && <AdminView />}
      <footer className="mt-6 text-xs opacity-70">Data is stored in Supabase for your project.</footer>
    </div>
  );
};

const AuthInline: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signin') await signIn(username, password);
      else await signUp(username, password);
    } catch (err: any) {
      alert(err.message || 'Auth error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="mb-4 flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <input className="min-w-[160px] flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input className="min-w-[160px] flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button disabled={busy} className="inline-flex items-center gap-1 rounded-md border border-transparent bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-500" type="submit">{mode === 'signin' ? 'Sign in' : 'Sign up'}</button>
      <button type="button" className="text-sm underline opacity-80" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? 'Create account' : 'Have an account? Sign in'}
      </button>
    </form>
  );
};

