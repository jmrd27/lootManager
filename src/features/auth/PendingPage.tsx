import React from 'react';
import { useAuth } from '@/features/auth/store';
import { Button } from '@/components/ui/button';

export const PendingPage: React.FC = () => {
  const { signOut } = useAuth();
  return (
    <div className="mx-auto grid min-h-screen place-items-center px-3 py-10 text-gray-100 sm:px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-800 bg-gray-900/70 p-8 text-center shadow">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold">WP</div>
        <h1 className="text-3xl font-extrabold tracking-tight">Account Pending Approval</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-gray-300">
          Your account was created successfully, but it must be approved by a leader before you can access WarPigs Loot Manager. Please contact a leader to finish setup.
        </p>
        <div className="mt-8">
          <Button variant="outline" onClick={() => signOut()}>Sign out</Button>
        </div>
      </div>
    </div>
  );
};
