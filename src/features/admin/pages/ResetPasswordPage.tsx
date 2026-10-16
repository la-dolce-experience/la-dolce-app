import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ButtonLink } from '../../../components/Button/Button';
import { useAuth } from '../auth/AuthProvider';
import { ChangePasswordForm } from './AccountPage';
import styles from './AuthPages.module.css';

export function ResetPasswordPage() {
  const { status, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Nova senha | Painel La Dolce';
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <img src="/images/logo.webp" alt="La Dolce Experience" width={480} height={303} className={styles.logo} />
        <div className={styles.form}>
          <h1>Criar nova senha</h1>
          {status === 'loading' && <p role="status">Verificando o link…</p>}
          {status !== 'loading' && !session && (
            <>
              <p className={styles.error} role="alert">
                O link é inválido ou expirou. Solicite um novo na tela de login.
              </p>
              <ButtonLink href="/admin/login">Ir para o login</ButtonLink>
            </>
          )}
          {session && <ChangePasswordForm onDone={() => navigate('/admin', { replace: true })} />}
        </div>
      </div>
    </main>
  );
}
