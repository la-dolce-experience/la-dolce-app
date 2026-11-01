import { useNavigate } from 'react-router-dom';
import { notifyPublishedChange } from '../../lib/preview';
import { createSection, deleteSection, duplicateSection, type SectionRow } from '../../services/adminService';
import { toFriendlyError } from '../../services/errors';
import type { SectionType } from '../../types/content';
import type { AddSectionChoice } from './components/AddSectionDialog';
import { useFeedback } from './components/Feedback';
import { sectionTypeConfig, uniqueSlug, withDefaultOptions } from './sectionTypes';
import { useSections } from './SectionsContext';

/** Move o item de `from` para `to` (índices), sem alterar a lista original. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Criar, duplicar e excluir seções, com os avisos do painel. Usado na lista de seções e no editor. */
export function useSectionActions() {
  const { sections, setSections } = useSections();
  const { notify, confirm } = useFeedback();
  const navigate = useNavigate();
  const slugs = () => (sections ?? []).map((s) => s.slug);

  /** Insere a seção na lista local na mesma posição em que o banco a gravou. */
  function insertLocal(row: SectionRow) {
    setSections((list) => {
      const shifted = list.map((s) => (s.position >= row.position ? { ...s, position: s.position + 1 } : s));
      return [...shifted, row].sort((a, b) => a.position - b.position);
    });
  }

  async function create({ type, name, icon, position, theme }: AddSectionChoice): Promise<SectionRow | null> {
    const starter = sectionTypeConfig[type].starter;
    try {
      const row = await createSection(
        {
          type,
          name,
          icon,
          slug: uniqueSlug(name || starter.slug, slugs()),
          eyebrow: starter.eyebrow ?? '',
          title: starter.title,
          body: starter.body ?? '',
          cta_label: starter.ctaLabel ?? '',
          options: withDefaultOptions(type as SectionType, theme ?? {}),
        },
        position,
      );
      insertLocal(row);
      notifyPublishedChange();
      notify('success', `Seção “${row.name}” criada. Agora preencha os textos.`);
      navigate(`/admin/secoes/${row.id}`);
      return row;
    } catch (e) {
      notify('error', toFriendlyError(e));
      return null;
    }
  }

  async function duplicate(section: SectionRow): Promise<SectionRow | null> {
    try {
      const name = `${section.name} (cópia)`.slice(0, 60);
      const row = await duplicateSection(section.id, uniqueSlug(`${section.slug}-copia`, slugs()), name);
      insertLocal(row);
      notifyPublishedChange();
      notify('success', `Cópia criada logo abaixo, oculta no site até você exibi-la.`);
      return row;
    } catch (e) {
      notify('error', toFriendlyError(e));
      return null;
    }
  }

  async function remove(section: SectionRow): Promise<boolean> {
    const ok = await confirm({
      title: 'Excluir seção?',
      message: (
        <p>
          “{section.name}” e todos os itens dela saem do site. Se mudar de ideia, restaure em{' '}
          <strong>Lixeira e backup</strong> por 30 dias.
        </p>
      ),
      confirmLabel: 'Excluir seção',
      danger: true,
    });
    if (!ok) return false;
    try {
      await deleteSection(section.id);
      setSections((list) => list.filter((s) => s.id !== section.id));
      notifyPublishedChange();
      notify('success', `Seção “${section.name}” excluída.`);
      return true;
    } catch (e) {
      notify('error', toFriendlyError(e));
      return false;
    }
  }

  return { create, duplicate, remove };
}
