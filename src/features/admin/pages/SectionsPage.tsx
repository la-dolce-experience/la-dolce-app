import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, GripVertical, LoaderCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/Button/Button';
import { notifyPublishedChange } from '../../../lib/preview';
import { reorderSections, updateSection, type SectionRow } from '../../../services/adminService';
import { toFriendlyError } from '../../../services/errors';
import a from '../admin.module.css';
import { AddSectionDialog } from '../components/AddSectionDialog';
import { useFeedback } from '../components/Feedback';
import { moveItem, useSectionActions } from '../sectionActions';
import { sectionIcon } from '../sectionIcons';
import { sectionTypeConfig } from '../sectionTypes';
import { useSections } from '../SectionsContext';
import { PageHeader } from './PageHeader';
import styles from './SectionsPage.module.css';

/** "Seções da página": ordem, inclusão, cópia, visibilidade e exclusão das seções. */
export function SectionsPage() {
  const { sections, error, reload, setSections } = useSections();
  const { notify } = useFeedback();
  const actions = useSectionActions();
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState<{ position?: number } | null>(null);
  const [creating, setCreating] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  async function applyOrder(next: SectionRow[], focusId?: string, focusDelta?: number) {
    if (!sections) return;
    const previous = sections;
    setSections(() => next.map((s, position) => ({ ...s, position })));
    setSaving(true);
    try {
      await reorderSections(next.map((s) => s.id));
      notifyPublishedChange();
      notify('success', 'Ordem atualizada. O site já mostra as seções nessa ordem.');
      if (focusId) setRefocus({ id: focusId, delta: focusDelta });
    } catch (e) {
      setSections(() => previous);
      notify('error', toFriendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  // Teclado: depois de mover pelas setas, o foco volta para a mesma seta da seção movida (ou a outra, se essa
  // ficou desabilitada no topo ou no fim). Só depois de salvar: enquanto isso as setas ficam desabilitadas.
  const [refocus, setRefocus] = useState<{ id: string; delta?: number } | null>(null);
  useEffect(() => {
    if (!refocus || saving) return;
    const row = document.getElementById(`section-row-${refocus.id}`);
    const button =
      row?.querySelector<HTMLElement>(`[data-move="${refocus.delta}"]:not(:disabled)`) ??
      row?.querySelector<HTMLElement>('[data-move]:not(:disabled)');
    button?.focus();
    setRefocus(null);
  }, [refocus, saving]);

  function move(index: number, delta: -1 | 1) {
    if (!sections) return;
    const target = index + delta;
    if (target < 0 || target >= sections.length) return;
    void applyOrder(moveItem(sections, index, target), sections[index].id, delta);
  }

  async function toggleVisible(section: SectionRow) {
    setBusyId(section.id);
    try {
      const row = await updateSection(section.id, { visible: !section.visible });
      setSections((list) => list.map((s) => (s.id === row.id ? row : s)));
      notifyPublishedChange();
      notify('success', row.visible ? `“${row.name}” voltou a aparecer no site.` : `“${row.name}” foi ocultada.`);
    } catch (e) {
      notify('error', toFriendlyError(e));
    } finally {
      setBusyId(null);
    }
  }

  async function run(section: SectionRow, action: (s: SectionRow) => Promise<unknown>) {
    setBusyId(section.id);
    try {
      await action(section);
    } finally {
      setBusyId(null);
    }
  }

  // Arrastar e soltar (mouse). No celular e no teclado, as setas fazem o mesmo.
  function onDragStart(e: DragEvent, index: number) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }

  function onDrop(e: DragEvent, index: number) {
    e.preventDefault();
    if (sections && dragIndex !== null && dragIndex !== index) void applyOrder(moveItem(sections, dragIndex, index));
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <>
      <PageHeader
        breadcrumb="Página inicial"
        title="Seções da página"
        description="Monte a página: escolha a ordem das seções, adicione novas, duplique, oculte ou exclua."
        previewAnchor=""
      />

      {error && (
        <div className={`${a.notice} ${a.noticeError}`} role="alert">
          <p>{error}</p>
          <Button size="sm" variant="outline" onClick={reload}>
            Tentar novamente
          </Button>
        </div>
      )}
      {!sections && !error && (
        <p className={a.loading} role="status">
          <LoaderCircle className={a.spin} aria-hidden="true" /> Carregando…
        </p>
      )}

      {sections && (
        <section className={a.panel} aria-labelledby="sections-order-title" data-tour="sections-order">
          <div className={a.panelHeader}>
            <div>
              <h2 id="sections-order-title">Ordem no site</h2>
              <p>
                De cima para baixo, como o visitante vê. Arraste pela alça ou use as setas; a ordem é salva na hora.
              </p>
            </div>
            <Button size="sm" icon={<Plus aria-hidden="true" />} onClick={() => setAdding({})} data-tour="sections-add">
              Adicionar seção
            </Button>
          </div>

          {sections.length === 0 && <p className={a.empty}>A página está vazia. Use “Adicionar seção” para começar.</p>}

          <ol className={styles.list} aria-busy={saving}>
            {sections.map((section, index) => {
              const config = sectionTypeConfig[section.type as keyof typeof sectionTypeConfig];
              const Icon = sectionIcon(section);
              const busy = busyId === section.id || saving;
              return (
                <li
                  key={section.id}
                  id={`section-row-${section.id}`}
                  className={`${styles.row} ${dragIndex === index ? styles.dragging : ''} ${
                    overIndex === index && dragIndex !== index ? styles.dropTarget : ''
                  } ${section.visible ? '' : styles.hidden}`}
                  draggable={!busy}
                  onDragStart={(e) => onDragStart(e, index)}
                  onDragOver={(e) => {
                    if (dragIndex === null) return;
                    e.preventDefault();
                    setOverIndex(index);
                  }}
                  onDragLeave={() => setOverIndex((i) => (i === index ? null : i))}
                  onDrop={(e) => onDrop(e, index)}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                >
                  <span className={styles.handle} aria-hidden="true" title="Arraste para mudar a ordem">
                    <GripVertical />
                  </span>
                  <span className={styles.index} aria-hidden="true">
                    {index + 1}
                  </span>
                  <div className={styles.info}>
                    <p className={styles.name}>
                      {Icon && <Icon aria-hidden="true" />}
                      <Link to={`/admin/secoes/${section.id}`}>{section.name}</Link>
                    </p>
                    <p className={styles.meta}>
                      {config?.label ?? section.type}
                      {section.nav_label ? ` · no menu como “${section.nav_label}”` : ' · fora do menu'}
                      {` · #${section.slug}`}
                    </p>
                  </div>
                  <div className={styles.badges}>
                    {!section.visible && <span className={`${a.badge} ${a.badgeOff}`}>Oculta</span>}
                  </div>
                  <div className={styles.tools}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      data-move={-1}
                      onClick={() => move(index, -1)}
                      disabled={index === 0 || busy}
                      aria-label={`Mover “${section.name}” para cima`}
                      title="Mover para cima"
                    >
                      <ArrowUp aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      data-move={1}
                      onClick={() => move(index, 1)}
                      disabled={index === sections.length - 1 || busy}
                      aria-label={`Mover “${section.name}” para baixo`}
                      title="Mover para baixo"
                    >
                      <ArrowDown aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => toggleVisible(section)}
                      disabled={busy}
                      aria-label={
                        section.visible ? `Ocultar “${section.name}” no site` : `Exibir “${section.name}” no site`
                      }
                      title={section.visible ? 'Ocultar no site' : 'Exibir no site'}
                    >
                      {section.visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => run(section, actions.duplicate)}
                      disabled={busy || (config?.single ?? false)}
                      aria-label={`Duplicar “${section.name}”`}
                      title={config?.single ? 'Só pode haver uma seção deste tipo' : 'Duplicar'}
                    >
                      <Copy aria-hidden="true" />
                    </button>
                    <Link
                      to={`/admin/secoes/${section.id}`}
                      className={styles.iconBtn}
                      aria-label={`Editar “${section.name}”`}
                      title="Editar"
                    >
                      <Pencil aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.danger}`}
                      onClick={() => run(section, actions.remove)}
                      disabled={busy}
                      aria-label={`Excluir “${section.name}”`}
                      title="Excluir"
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                  {/* Adicionar uma seção logo abaixo desta. */}
                  <button
                    type="button"
                    className={styles.insert}
                    onClick={() => setAdding({ position: index + 1 })}
                    disabled={saving}
                  >
                    <Plus aria-hidden="true" /> Adicionar seção aqui
                  </button>
                </li>
              );
            })}
          </ol>

          {sections.length > 0 && (
            <p className={a.muted}>
              Seções com lista (cartões, galeria, perguntas…) só aparecem no site quando têm ao menos um item.
            </p>
          )}
        </section>
      )}

      {adding && sections && (
        <AddSectionDialog
          sections={sections}
          initialPosition={adding.position}
          busy={creating}
          onClose={() => setAdding(null)}
          onConfirm={async (choice) => {
            setCreating(true);
            const created = await actions.create(choice);
            setCreating(false);
            if (created) setAdding(null);
          }}
        />
      )}
    </>
  );
}
