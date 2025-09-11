import React from 'react';
import { useAuth } from '@/features/auth/store';
import { Button } from '@/components/ui/button';

export type View = { name: 'items' } | { name: 'item'; id: string } | { name: 'summary' } | { name: 'admin' };

export const TopBar: React.FC<{ setView: (v: View) => void }> = ({ setView }) => {
  const { session, profile, isLeader, signOut } = useAuth();
  return (
    <header className="mb-4 flex flex-wrap items-center gap-3">
      <h1 className="m-0 text-2xl font-semibold">DropSplit — Lineage 2 Loot</h1>
      <nav className="ml-auto flex w-full flex-wrap gap-2 sm:w-auto">
        <Button variant="outline" onClick={() => setView({ name: 'items' })} className="w-full sm:w-auto">Items</Button>
        {isLeader && (
          <>
            <Button onClick={() => setView({ name: 'summary' })} className="w-full sm:w-auto">Split Summary</Button>
            <Button onClick={() => setView({ name: 'admin' })} className="w-full sm:w-auto">Admin</Button>
          </>
        )}
        {!session ? null : (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm opacity-80">{profile?.username}{profile?.approved ? '' : ' (pending)'}{isLeader ? ' · leader' : ''}</span>
            <Button variant="outline" onClick={() => signOut()}>Sign out</Button>
          </div>
        )}
      </nav>
    </header>
  );
};

