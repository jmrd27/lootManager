import React, { useMemo, useState } from 'react';
import { LootProvider, useLoot } from './features/loot/store';
import { AuthProvider, useAuth } from './features/auth/store';
import { TopBar } from './components/TopBar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
    <div className="min-h-screen bg-black text-gray-100">
      <TopBar setView={setView} />
      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 lg:px-6">
        {!session && <AuthInline />}
        {view.name === 'items' && (
          <ItemsView openItem={(id) => setView({ name: 'item', id })} />
        )}
        {view.name === 'item' && <ItemDetailView id={view.id} goBack={() => setView({ name: 'items' })} />}
        {view.name === 'summary' && <SummaryView />}
        {view.name === 'admin' && <AdminView />}
        <footer className="mt-10 text-center text-xs opacity-70">Data is stored in Supabase for your project.</footer>
      </main>
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
      <Input className="min-w-[160px] flex-1" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <Input className="min-w-[160px] flex-1" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button disabled={busy} type="submit">{mode === 'signin' ? 'Sign in' : 'Sign up'}</Button>
      <Button type="button" variant="link" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? 'Create account' : 'Have an account? Sign in'}
      </Button>
    </form>
  );
};
