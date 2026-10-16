import { LoaderCircle } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from './AdminLayout';
import a from './admin.module.css';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { FeedbackProvider } from './components/Feedback';
import { UnsavedChangesProvider } from './components/UnsavedChanges';
import { AccountPage } from './pages/AccountPage';
import { ContactPage } from './pages/ContactPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { MediaPage } from './pages/MediaPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { SectionPage } from './pages/SectionPage';
import { SeoPage } from './pages/SeoPage';
import { TrashPage } from './pages/TrashPage';
import authStyles from './pages/AuthPages.module.css';

function useNoIndex() {
  useEffect(() => {
    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = 'noindex, nofollow';
  }, []);
}

/** Protege as rotas: só administradores veem o painel (o banco também impõe isso via RLS). */
function RequireAdmin({ children }: { children: ReactNode }) {
  const { status, signOut } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <p className={a.loading} role="status">
        <LoaderCircle className={a.spin} aria-hidden="true" /> Verificando acesso…
      </p>
    );
  }
  if (status === 'error') {
    return (
      <main className={authStyles.page}>
        <div className={authStyles.card}>
          <p className={authStyles.error} role="alert">
            Não foi possível verificar seu acesso. Verifique a conexão e tente novamente.
          </p>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
          <Button variant="ghost" onClick={signOut}>
            Sair
          </Button>
        </div>
      </main>
    );
  }
  if (status !== 'admin') return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

function NotConfigured() {
  return (
    <main className={authStyles.page}>
      <div className={authStyles.card}>
        <h1>Painel não configurado</h1>
        <p className={authStyles.lead}>
          Defina as variáveis <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> e publique o site
          novamente. Consulte o README.
        </p>
      </div>
    </main>
  );
}

export default function AdminApp() {
  useNoIndex();
  if (!supabase) return <NotConfigured />;

  return (
    <AuthProvider>
      <FeedbackProvider>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route path="redefinir-senha" element={<ResetPasswordPage />} />
          <Route
            element={
              <RequireAdmin>
                <UnsavedChangesProvider>
                  <AdminLayout />
                </UnsavedChangesProvider>
              </RequireAdmin>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="secoes/:key" element={<SectionPage />} />
            <Route path="contato" element={<ContactPage />} />
            <Route path="seo" element={<SeoPage />} />
            <Route path="imagens" element={<MediaPage />} />
            <Route path="lixeira" element={<TrashPage />} />
            <Route path="conta" element={<AccountPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </FeedbackProvider>
    </AuthProvider>
  );
}
