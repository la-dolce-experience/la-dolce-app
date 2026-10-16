import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '../../../components/Button/Button';
import { requireSupabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../services/errors';
import { useAuth } from '../auth/AuthProvider';
import { nextLockState } from '../auth/password';
import { TextField } from '../components/Fields';
import styles from './AuthPages.module.css';

const LOCK_KEY = 'ld-admin-login-lock';
const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin;

function readLock(): { failures: number; lockedUntil: number } {
  try {
    const raw = sessionStorage.getItem(LOCK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* armazenamento indisponível: sem bloqueio local */
  }
  return { failures: 0, lockedUntil: 0 };
}

function writeLock(state: { failures: number; lockedUntil: number }) {
  try {
    sessionStorage.setItem(LOCK_KEY, JSON.stringify(state));
  } catch {
    /* ignora */
  }
}

export function LoginPage() {
  const { status } = useAuth();
  const [mode, setMode] = useState<'login' | 'forgot'>('login');

  useEffect(() => {
    document.title = 'Entrar | Painel La Dolce';
  }, []);

  if (status === 'admin') return <Navigate to="/admin" replace />;

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <img src="/images/logo.webp" alt="La Dolce Experience" width={480} height={303} className={styles.logo} />
        {mode === 'login' ? (
          <LoginForm onForgot={() => setMode('forgot')} />
        ) : (
          <ForgotForm onBack={() => setMode('login')} />
        )}
        <a href="/" className={styles.back}>
          ← Voltar para o site
        </a>
      </div>
    </main>
  );
}

function LoginForm({ onForgot }: { onForgot: () => void }) {
  const { status, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lock, setLock] = useState(readLock);
  const [now, setNow] = useState(() => Date.now());
  const locked = lock.lockedUntil > now;

  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [locked]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (locked || busy) return;
    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: authError } = await requireSupabase().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (authError) {
      const next = nextLockState(lock.failures, Date.now());
      setLock(next);
      writeLock(next);
      setNow(Date.now());
      setError(toFriendlyError(authError));
      setPassword('');
      return;
    }
    writeLock({ failures: 0, lockedUntil: 0 });
  }

  const seconds = Math.ceil((lock.lockedUntil - now) / 1000);

  return (
    <form onSubmit={submit} noValidate className={styles.form} aria-labelledby="login-title">
      <h1 id="login-title">Painel administrativo</h1>
      <p className={styles.lead}>Entre para editar o conteúdo do site.</p>

      {status === 'notAdmin' && (
        <div className={styles.error} role="alert">
          Esta conta não tem acesso ao painel.{' '}
          <button type="button" className={styles.link} onClick={signOut}>
            Sair
          </button>
        </div>
      )}
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
      {locked && (
        <div className={styles.error} role="status">
          Muitas tentativas. Aguarde {seconds}s para tentar novamente.
        </div>
      )}

      <TextField
        id="login-email"
        label="E-mail"
        type="email"
        autoComplete="username"
        inputMode="email"
        value={email}
        onValueChange={setEmail}
        required
      />
      <div className={styles.passwordRow}>
        <TextField
          id="login-password"
          label="Senha"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onValueChange={setPassword}
          required
        />
        <button
          type="button"
          className={styles.reveal}
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={showPassword}
        >
          {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>

      <Button type="submit" block disabled={busy || locked} aria-busy={busy}>
        {busy ? 'Entrando…' : 'Entrar'}
      </Button>
      <button type="button" className={styles.link} onClick={onForgot}>
        Esqueci minha senha
      </button>
    </form>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError('Informe um e-mail válido.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: resetError } = await requireSupabase().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${SITE_URL}/admin/redefinir-senha`,
    });
    setBusy(false);
    // Mensagem igual exista ou não a conta, para não revelar quais e-mails estão cadastrados.
    if (resetError && /rate limit|429/i.test(resetError.message)) setError(toFriendlyError(resetError));
    else setSent(true);
  }

  return (
    <form onSubmit={submit} noValidate className={styles.form} aria-labelledby="forgot-title">
      <h1 id="forgot-title">Redefinir senha</h1>
      {sent ? (
        <p className={styles.success} role="status">
          Se este e-mail tiver acesso ao painel, você receberá um link para criar uma nova senha. Confira também a caixa
          de spam.
        </p>
      ) : (
        <>
          <p className={styles.lead}>Informe o e-mail da sua conta para receber um link de redefinição.</p>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}
          <TextField
            id="forgot-email"
            label="E-mail"
            type="email"
            autoComplete="username"
            value={email}
            onValueChange={setEmail}
            required
          />
          <Button type="submit" block disabled={busy}>
            {busy ? 'Enviando…' : 'Enviar link'}
          </Button>
        </>
      )}
      <button type="button" className={styles.link} onClick={onBack}>
        Voltar para o login
      </button>
    </form>
  );
}
