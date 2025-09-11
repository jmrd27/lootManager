import React, { useState } from 'react';
import { useAuth } from '@/features/auth/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const AuthPage: React.FC = () => {
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
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-3 py-10 text-gray-100 sm:px-4">
      <div className="w-full rounded-xl border border-gray-800 bg-gray-900/70 p-6 shadow">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold">DS</div>
          <h1 className="text-2xl font-bold tracking-tight">DropSplit</h1>
          <p className="mt-1 text-sm opacity-80">Sign in to continue</p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button disabled={busy} type="submit">{mode === 'signin' ? 'Sign in' : 'Sign up'}</Button>
          <Button type="button" variant="link" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? 'Create account' : 'Have an account? Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
};

