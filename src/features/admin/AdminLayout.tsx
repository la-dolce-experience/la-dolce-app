import { ExternalLink, House, Images, KeyRound, LayoutDashboard, LogOut, Menu, Phone, Search, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { markOnboardingCompleted } from '../../services/adminService';
import a from './admin.module.css';
import { useAuth } from './auth/AuthProvider';
import { useFeedback } from './components/Feedback';
import { useAnyDirty } from './components/UnsavedChanges';
import { HelpMenu } from './onboarding/HelpMenu';
import { GuidedTour } from './onboarding/GuidedTour';
import { SECTION_CONFIG } from './sectionConfig';

export function AdminLayout() {
  const { session, signOut } = useAuth();
  const { confirm } = useFeedback();
  const dirty = useAnyDirty();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  // Primeiro acesso: o tour abre sozinho até ser concluído ou pulado uma vez.
  const [guideOpen, setGuideOpen] = useState(() => !session?.user.user_metadata?.onboarding_completed_at);

  function closeGuide() {
    setGuideOpen(false);
    if (!session?.user.user_metadata?.onboarding_completed_at) {
      // Se falhar, o tour só volta a aparecer no próximo acesso; não vale interromper o uso com um erro.
      markOnboardingCompleted().catch((e: unknown) => console.warn('Não foi possível registrar o tour como visto.', e));
    }
  }

  // Ao trocar de página: leva o foco ao título (leitores de tela) e volta ao topo.
  // Durante o tour, quem controla foco e rolagem é o próprio tour.
  useEffect(() => {
    if (guideOpen) return;
    requestAnimationFrame(() => document.getElementById('admin-page-title')?.focus({ preventScroll: true }));
    window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  async function logout() {
    if (dirty) {
      const ok = await confirm({
        title: 'Sair sem salvar?',
        message: 'Há alterações que ainda não foram salvas.',
        confirmLabel: 'Sair mesmo assim',
        danger: true,
      });
      if (!ok) return;
    }
    await signOut();
  }

  const link = (to: string, label: string, icon: ReactNode, end = false, extra?: string) => (
    <li key={to}>
      <NavLink to={to} end={end} className={a.navLink}>
        {icon}
        {label}
        {extra && <span className={a.navMuted}>{extra}</span>}
      </NavLink>
    </li>
  );

  return (
    <div className={a.shell}>
      <a className="skip-link" href="#admin-main">
        Pular para o conteúdo
      </a>
      <div className={a.topbar} inert={guideOpen}>
        <img src="/images/logo.webp" alt="La Dolce Experience — painel" width={480} height={303} />
        <button
          type="button"
          className={a.menuButton}
          data-tour="menu-button"
          aria-expanded={menuOpen}
          aria-controls="admin-sidebar"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          Menu
        </button>
      </div>

      <aside id="admin-sidebar" className={`${a.sidebar} ${menuOpen ? a.sidebarOpen : ''}`} inert={guideOpen}>
        <img src="/images/logo.webp" alt="La Dolce Experience" width={480} height={303} className={a.sidebarLogo} />
        {/* Fecha o menu móvel ao escolher um destino. */}
        <nav aria-label="Painel" onClick={(e) => (e.target as HTMLElement).closest('a') && setMenuOpen(false)}>
          <ul className={a.navGroup}>{link('/admin', 'Visão geral', <LayoutDashboard aria-hidden="true" />, true)}</ul>

          <p className={a.navTitle} id="nav-home">
            Página inicial
          </p>
          <ul className={a.navGroup} aria-labelledby="nav-home" data-tour="nav-sections">
            {SECTION_CONFIG.map((s) => link(`/admin/secoes/${s.key}`, s.label, <House aria-hidden="true" />))}
          </ul>

          <p className={a.navTitle} id="nav-config">
            Configurações
          </p>
          <ul className={a.navGroup} aria-labelledby="nav-config" data-tour="nav-config">
            {link('/admin/contato', 'Contato e marca', <Phone aria-hidden="true" />)}
            {link('/admin/seo', 'Google e compartilhamento', <Search aria-hidden="true" />)}
            {link('/admin/imagens', 'Biblioteca de imagens', <Images aria-hidden="true" />)}
            {link('/admin/conta', 'Minha conta', <KeyRound aria-hidden="true" />)}
          </ul>
        </nav>

        <div className={a.sidebarFooter}>
          <HelpMenu
            guideDisabled={dirty}
            onOpenGuide={() => {
              setMenuOpen(false);
              setGuideOpen(true);
            }}
          />
          <a className={a.navLink} href="/" target="_blank" rel="noopener">
            <ExternalLink aria-hidden="true" /> Ver o site
          </a>
          <button type="button" onClick={logout}>
            <LogOut aria-hidden="true" width={18} height={18} /> Sair
          </button>
          {session?.user.email && <p className={a.userEmail}>{session.user.email}</p>}
        </div>
      </aside>

      <main id="admin-main" className={a.main} inert={guideOpen}>
        <div className={a.content}>
          <Outlet />
        </div>
      </main>
      {guideOpen && <GuidedTour onClose={closeGuide} />}
    </div>
  );
}
