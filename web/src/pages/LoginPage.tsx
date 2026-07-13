import { useState } from 'react';
import { api } from '../api/client';
import { COLORS } from '../theme';
import type { User } from '../api/types';

export default function LoginPage({ onLoggedIn }: { onLoggedIn: (user: User) => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (pending) return;
    setPending(true);
    try {
      const { user } = await api.login(email);
      onLoggedIn(user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível entrar.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        background: COLORS.white,
        minHeight: '100vh',
      }}
    >
      <div style={{ width: 72, height: 72, borderRadius: 20, background: COLORS.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: COLORS.orange }} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 6, textAlign: 'center' }}>
        Rotina &amp; Bem-estar
      </div>
      <div style={{ fontSize: 15, color: COLORS.textMuted, marginBottom: 36, textAlign: 'center' }}>
        Entre com seu e-mail para acessar seu plano
      </div>

      <input
        type="email"
        placeholder="seu@email.com"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setError(''); }}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        style={{
          width: '100%', maxWidth: 340, height: 52, borderRadius: 16, border: `1px solid ${COLORS.border}`,
          background: '#F7F8FA', padding: '0 18px', fontSize: 16, color: COLORS.textPrimary, outline: 'none', marginBottom: 12,
        }}
      />

      {error && (
        <div style={{ width: '100%', maxWidth: 340, fontSize: 13, color: COLORS.danger, marginBottom: 12, padding: '0 2px' }}>
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={pending}
        style={{
          width: '100%', maxWidth: 340, height: 52, borderRadius: 16, border: 'none', background: COLORS.navy,
          color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 4, opacity: pending ? 0.7 : 1,
        }}
      >
        Entrar
      </button>

      <div style={{ fontSize: 12, color: COLORS.textFaint, marginTop: 28, textAlign: 'center', lineHeight: 1.5 }}>
        Monique · moniquebeck1996@gmail.com<br />
        Matheus · e.matheus.avila@gmail.com
      </div>
    </div>
  );
}
