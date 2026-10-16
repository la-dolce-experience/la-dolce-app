import { useState, type FormEvent } from 'react';
import { Button } from '../../../components/Button/Button';
import { requireSupabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../services/errors';
import a from '../admin.module.css';
import { useAuth } from '../auth/AuthProvider';
import { validateNewPassword } from '../auth/password';
import { useFeedback } from '../components/Feedback';
import { TextField } from '../components/Fields';
import { PageHeader } from './PageHeader';

export function AccountPage() {
  const { session } = useAuth();
  return (
    <>
      <PageHeader breadcrumb="Conta" title="Minha conta" description={`Conectado como ${session?.user.email ?? ''}.`} />
      <section className={a.panel} aria-labelledby="pw-title" data-tour="password">
        <div className={a.panelHeader}>
          <div>
            <h2 id="pw-title">Trocar senha</h2>
            <p>Use ao menos 10 caracteres, com letras maiúsculas, minúsculas e números.</p>
          </div>
        </div>
        <ChangePasswordForm />
      </section>
    </>
  );
}

export function ChangePasswordForm({ onDone }: { onDone?: () => void }) {
  const { notify } = useFeedback();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const invalid = validateNewPassword(password, confirmation);
    setError(invalid ?? undefined);
    if (invalid) return;
    setBusy(true);
    try {
      const { error: updateError } = await requireSupabase().auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword('');
      setConfirmation('');
      notify('success', 'Senha alterada com sucesso.');
      onDone?.();
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className={a.grid2}>
      <TextField
        id="new-password"
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        value={password}
        onValueChange={setPassword}
        required
      />
      <TextField
        id="confirm-password"
        label="Repita a nova senha"
        type="password"
        autoComplete="new-password"
        value={confirmation}
        onValueChange={setConfirmation}
        error={error}
        required
      />
      <div className={a.span2}>
        <Button type="submit" disabled={busy} aria-busy={busy}>
          {busy ? 'Salvando…' : 'Salvar nova senha'}
        </Button>
      </div>
    </form>
  );
}
