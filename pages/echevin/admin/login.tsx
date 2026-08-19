import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AdminLogin() {
  const router = useRouter();
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || 'Erreur');
      }
      router.replace('/echevin/admin');
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <>
      <Head>
        <title>Admin — Anas Ben Abdelmoumen</title>
      </Head>
      <div className="ec-admin-login">
        <form onSubmit={submit} className="ec-admin-login__card">
          <h1>Administration</h1>
          <p>Connexion pour gérer le contenu du site.</p>
          <input
            type="password"
            placeholder="Mot de passe"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoFocus
            required
          />
          {err && <div className="ec-admin-login__err">{err}</div>}
          <button disabled={busy} type="submit">
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </>
  );
}
