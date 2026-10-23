import { ChevronRight, CircleAlert, CircleCheck, ExternalLink, Layers, LoaderCircle } from 'lucide-react';
import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, ButtonLink } from '../../../components/Button/Button';
import { getSettings, listItems, type SectionRow } from '../../../services/adminService';
import { toFriendlyError } from '../../../services/errors';
import type { SectionType } from '../../../types/content';
import a from '../admin.module.css';
import { MetricsPanel } from '../components/MetricsPanel';
import { useLoad } from '../hooks';
import { sectionTypeConfig } from '../sectionTypes';
import { useSections } from '../SectionsContext';
import { PageHeader } from './PageHeader';

interface ChecklistItem {
  done: boolean;
  label: string;
  to: string;
}

/** O que falta preencher: contatos básicos e seções de lista que ainda estão vazias. */
async function loadOverview(sections: SectionRow[]) {
  const [settings, items] = await Promise.all([getSettings(), listItems('section_items')]);
  const count = new Map<string, number>();
  for (const i of items) count.set(i.section_id, (count.get(i.section_id) ?? 0) + 1);

  const contact = sections.find((s) => s.type === 'contato');
  const contactLink = contact ? `/admin/secoes/${contact.id}` : '/admin/contato';
  const gallery = sections.find((s) => s.type === 'galeria');
  const checklist: ChecklistItem[] = [
    { done: !!settings.instagram_url, label: 'Link do Instagram', to: '/admin/contato' },
    { done: !!settings.email, label: 'E-mail comercial', to: '/admin/contato' },
    { done: !!settings.opening_hours, label: 'Horário de atendimento', to: contactLink },
    {
      done: !!settings.address_street || settings.service_area.length > 0,
      label: 'Área de atendimento ou endereço',
      to: contactLink,
    },
    ...(gallery
      ? [
          {
            done: (count.get(gallery.id) ?? 0) > 3,
            label: 'Fotos de eventos reais na galeria',
            to: `/admin/secoes/${gallery.id}`,
          },
        ]
      : []),
    ...sections
      .filter((s) => s.visible && sectionTypeConfig[s.type as SectionType]?.hiddenWhenEmpty && !count.get(s.id))
      .map((s) => ({
        done: false,
        label: `Itens de “${s.name}” (a seção está oculta sem eles)`,
        to: `/admin/secoes/${s.id}`,
      })),
  ];
  return { checklist, count };
}

export function DashboardPage() {
  const { sections, error: sectionsError, reload: reloadSections } = useSections();
  const navigate = useNavigate();
  const loader = useCallback(() => loadOverview(sections ?? []), [sections]);
  const { data, error, loading, reload } = useLoad(loader);
  const pending = data?.checklist.filter((c) => !c.done).length ?? 0;
  const failure = error ?? sectionsError;

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Escolha o que deseja editar. As alterações aparecem no site assim que você salva."
        previewAnchor=""
      />

      {(loading || !sections) && !failure && (
        <p className={a.loading} role="status">
          <LoaderCircle className={a.spin} aria-hidden="true" /> Carregando…
        </p>
      )}
      {!!failure && (
        <div className={`${a.notice} ${a.noticeError}`} role="alert">
          <p>{typeof failure === 'string' ? failure : toFriendlyError(failure)}</p>
          <button
            type="button"
            onClick={() => {
              reloadSections();
              reload();
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      <MetricsPanel />

      {data && sections && (
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
              <div className={a.inlineActions}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/secoes')}
                  icon={<Layers aria-hidden="true" />}
                >
                  Organizar seções
                </Button>
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
            </div>
            <ul className={a.cardGrid}>
              {sections.map((s) => {
                const config = sectionTypeConfig[s.type as SectionType];
                const items = data.count.get(s.id) ?? 0;
                const status = !s.visible
                  ? 'Oculta no site'
                  : config?.list
                    ? `${config.label} · ${items} ${items === 1 ? 'item' : 'itens'}`
                    : config?.label;
                return (
                  <li key={s.id}>
                    <Link to={`/admin/secoes/${s.id}`} className={a.linkCard}>
                      <div style={{ flex: 1 }}>
                        <strong>{s.name}</strong>
                        <span>{status}</span>
                      </div>
                      <ChevronRight aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
