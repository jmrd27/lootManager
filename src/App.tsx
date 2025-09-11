import React, { useMemo, useState } from 'react';
import { LootProvider, useLoot } from './features/loot/store';
import { AuthProvider, useAuth } from './features/auth/store';
import { TopBar } from './components/TopBar';
import { ItemsView } from './features/items/ItemsView';
import { SummaryView } from './features/summary/SummaryView';
import { AdminView } from './features/admin/AdminView';
import { computeSplit } from './features/loot/logic';
import { AuthPage } from '@/features/auth/AuthPage';
import { PendingPage } from '@/features/auth/PendingPage';

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
  const { session, profile, loading } = useAuth();
  useMemo(() => computeSplit(items, requests), [items, requests]);

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Gate: show nothing until auth evaluated */}
      {loading ? null : !session ? (
        <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 lg:px-6"><AuthPage /></main>
      ) : profile && profile.approved !== true ? (
        <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 lg:px-6"><PendingPage /></main>
      ) : (
      <>
      <TopBar setView={setView} />
      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 lg:px-6">
        {view.name === 'items' && (
          <ItemsView />
        )}
        {view.name === 'summary' && <SummaryView />}
        {view.name === 'admin' && <AdminView />}
      </main>
      </>
      )}
    </div>
  );
};

// AuthInline removed in favor of dedicated AuthPage
