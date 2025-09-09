import React from 'react';
import { useAuth } from '@/features/auth/store';

export type View = { name: 'items' } | { name: 'item'; id: string } | { name: 'summary' } | { name: 'admin' };

export const TopBar: React.FC<{ setView: (v: View) => void }> = ({ setView }) => {
  const { session, profile, isLeader, signOut } = useAuth();
  return (
    <header className="mb-4 flex flex-wrap items-center gap-3">
      <h1 className="m-0 text-2xl font-semibold">DropSplit — Lineage 2 Loot</h1>
      <nav className="ml-auto flex w-full flex-wrap gap-2 sm:w-auto">
        <button className="inline-flex w-full items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 sm:w-auto" onClick={() => setView({ name: 'items' })}>Items</button>
        {isLeader && (
          <>
            <button className="inline-flex w-full items-center gap-1 rounded-md border border-transparent bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-500 sm:w-auto" onClick={() => setView({ name: 'summary' })}>Split Summary</button>
            <button className="inline-flex w-full items-center gap-1 rounded-md border border-transparent bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-500 sm:w-auto" onClick={() => setView({ name: 'admin' })}>Admin</button>
          </>
        )}
        {!session ? null : (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm opacity-80">{profile?.username}{profile?.approved ? '' : ' (pending)'}{isLeader ? ' • leader' : ''}</span>
            <button className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700" onClick={() => signOut()}>Sign out</button>
          </div>
        )}
      </nav>
    </header>
  );
};

