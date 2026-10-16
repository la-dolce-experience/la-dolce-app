import { ChevronRight, CircleAlert, CircleCheck, ExternalLink, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ButtonLink } from '../../../components/Button/Button';
import { getSettings, listItems, listSections } from '../../../services/adminService';
import { toFriendlyError } from '../../../services/errors';
import a from '../admin.module.css';
import { useLoad } from '../hooks';
import { SECTION_CONFIG } from '../sectionConfig';
import { PageHeader } from './PageHeader';

interface ChecklistItem {
  done: boolean;
  label: string;
  to: string;
}

async function loadOverview() {
  const [settings, sections, faqs, steps, testimonials, gallery] = await Promise.all([
    getSettings(),
    listSections(),
    listItems('faqs'),
    listItems('steps'),
    listItems('testimonials'),
    listItems('gallery_items'),
  ]);
  const checklist: ChecklistItem[] = [
    { done: !!settings.instagram_url, label: 'Link do Instagram', to: '/admin/contato' },
    { done: !!settings.email, label: 'E-mail comercial', to: '/admin/contato' },
    { done: !!settings.opening_hours, label: 'Horário de atendimento', to: '/admin/secoes/location' },
    {
      done: !!settings.address_street || settings.service_area.length > 0,
      label: 'Área de atendimento ou endereço',
      to: '/admin/secoes/location',
    },
    { done: steps.length > 0, label: 'Etapas de "Como funciona"', to: '/admin/secoes/steps' },
    { done: faqs.length > 0, label: 'Perguntas frequentes', to: '/admin/secoes/faq' },
    {
      done: testimonials.some((t) => t.authorized),
      label: 'Depoimentos autorizados',
      to: '/admin/secoes/testimonials',
    },
    { done: gallery.length > 3, label: 'Fotos de eventos reais na galeria', to: '/admin/secoes/gallery' },
  ];
  const visibility = new Map(sections.map((s) => [s.key, s.visible]));
  return { checklist, visibility };
}

export function DashboardPage() {
  const { data, error, loading, reload } = useLoad(loadOverview);
  const pending = data?.checklist.filter((c) => !c.done).length ?? 0;

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Escolha o que deseja editar. As alterações aparecem no site assim que você salva."
        previewAnchor=""
      />

      {loading && (
        <p className={a.loading} role="status">
          <LoaderCircle className={a.spin} aria-hidden="true" /> Carregando…
        </p>
      )}
      {!!error && (
        <div className={`${a.notice} ${a.noticeError}`} role="alert">
          <p>{toFriendlyError(error)}</p>
          <button type="button" onClick={reload}>
            Tentar novamente
          </button>
        </div>
      )}

      {data && (
        <>
          <section className={a.panel} aria-labelledby="checklist-title" data-tour="checklist">
            <div className={a.panelHeader}>
              <div>
                <h2 id="checklist-title">Informações para completar o site</h2>
                <p>
                  {pending === 0
                    ? 'Tudo preenchido. Ótimo trabalho!'
                    : `${pending} ${pending === 1 ? 'item pode' : 'itens podem'} deixar o site mais completo e passar mais confiança.`}
                </p>
              </div>
            </div>
            <ul className={a.checklist}>
              {data.checklist.map((c) => (
                <li key={c.label}>
                  {c.done ? (
                    <CircleCheck className={a.ok} aria-label="Concluído" />
                  ) : (
                    <CircleAlert className={a.todo} aria-label="Pendente" />
                  )}
                  {c.done ? c.label : <Link to={c.to}>{c.label}</Link>}
                </li>
              ))}
            </ul>
          </section>

          <section className={a.panel} aria-labelledby="sections-title">
            <div className={a.panelHeader}>
              <div>
                <h2 id="sections-title">Seções da página inicial</h2>
                <p>Na mesma ordem em que aparecem no site.</p>
              </div>
              <ButtonLink
                variant="outline"
                size="sm"
                href="/"
                target="_blank"
                rel="noopener"
                icon={<ExternalLink aria-hidden="true" />}
              >
                Abrir o site
              </ButtonLink>
            </div>
            <ul className={a.cardGrid}>
              {SECTION_CONFIG.map((s) => (
                <li key={s.key}>
                  <Link to={`/admin/secoes/${s.key}`} className={a.linkCard}>
                    <div style={{ flex: 1 }}>
                      <strong>{s.label}</strong>
                      <span>{data.visibility.get(s.key) === false ? 'Oculta no site' : s.description}</span>
                    </div>
                    <ChevronRight aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
