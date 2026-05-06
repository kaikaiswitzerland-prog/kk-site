import { useState } from 'react';
import { supabase } from '../../lib/supabase.js';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : err.message
      );
    }
    setLoading(false);
  };

  const inputCls =
    'w-full rounded-lg border border-line-strong bg-bg-elev px-4 py-3 text-ink ' +
    'placeholder:text-ink-3 focus:border-accent focus:outline-none transition-colors';

  return (
    <div className="kk-admin flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-display text-5xl italic leading-none tracking-[-0.04em]">
            Kaï<em className="text-accent">Kaï</em>
          </h1>
          <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
            Admin · Tableau de bord
          </div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputCls}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputCls}
          />
          {error && (
            <div className="rounded-lg border border-accent-red/30 bg-accent-red/10 px-3 py-2 text-xs text-accent-red">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-accent px-4 py-3 font-semibold text-black transition-colors hover:bg-[#c4ee5b] disabled:opacity-60"
          >
            {loading ? 'Connexion…' : 'Se connecter →'}
          </button>
        </form>
      </div>
    </div>
  );
}
