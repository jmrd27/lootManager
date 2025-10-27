import React from 'react';
import { useAuth } from '@/features/auth/store';
import { Button } from '@/components/ui/button';

export type View = { name: 'items' } | { name: 'item'; id: string } | { name: 'summary' } | { name: 'admin' };

export const TopBar: React.FC<{ setView: (v: View) => void }> = ({ setView }) => {
  const { session, profile, isLeader, signOut } = useAuth();
  const isApproved = profile?.approved === true;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-gray-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 text-gray-100 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold">WP</span>
          <span className="text-sm font-semibold tracking-tight">EternalBite Loot Manager</span>
        </div>
        <nav className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            onClick={() => setView({ name: 'items' })}
            className="text-sm text-gray-300 hover:text-white"
          >
            Items
          </Button>
          {isApproved && (
            <Button
              variant="ghost"
              onClick={() => setView({ name: 'summary' })}
              className="text-sm text-gray-300 hover:text-white"
            >
              Summary
            </Button>
          )}
          {isLeader && (
            <Button
              variant="ghost"
              onClick={() => setView({ name: 'admin' })}
              className="text-sm text-gray-300 hover:text-white"
            >
              Admin
            </Button>
          )}
          {session && (
            <div className="ml-2 hidden items-center gap-2 sm:flex">
              <span className="text-xs opacity-80">
                {profile?.username}
                {profile?.approved ? '' : ' (pending)'}
                {isLeader ? ' (Leader)' : ''}
              </span>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
