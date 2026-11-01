import { ArrowLeft, Copy, Info, LoaderCircle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../components/Button/Button';
import { clearPreviewDraft, notifyPublishedChange, updatePreviewDraft, type SectionDraft } from '../../../lib/preview';
import { getSection, listMedia, updateSection, type MediaRow, type SectionRow } from '../../../services/adminService';
import { toFriendlyError } from '../../../services/errors';
import type { SectionType } from '../../../types/content';
import a from '../admin.module.css';
import { useFeedback } from '../components/Feedback';
import { SelectField, TextAreaField, TextField, ToggleField } from '../components/Fields';
import { HeroImagePreview } from '../components/HeroImagePreview';
import { ImagePicker } from '../components/ImagePicker';
import { ListEditor } from '../components/ListEditor';
import { SaveBar } from '../components/SaveBar';
import { useTrackDirty } from '../components/UnsavedChanges';
import { useFormState } from '../hooks';
import { useLivePreview } from '../preview/LivePreview';
import { useSectionActions } from '../sectionActions';
import {
  RESERVED_SLUGS,
  sectionTypeConfig,
  slugify,
  withDefaultOptions,
  type SectionTypeConfig,
} from '../sectionTypes';
import { defaultIconKey } from '../sectionIcons';
import { useSections } from '../SectionsContext';
import { IconPicker } from '../components/IconPicker';
import { LocationSettings } from './LocationSettings';
import { PageHeader } from './PageHeader';

interface SectionForm {
  name: string;
  nav_label: string;
  slug: string;
  icon: string;
  eyebrow: string;
  title: string;
  body: string;
  cta_label: string;
  note: string;
  image_caption: string;
  image_media_id: string | null;
  image_alt: string;
  options: Record<string, string | boolean>;
  visible: boolean;
}

const LIMITS = {
  name: 60,
  nav_label: 30,
  slug: 40,
  eyebrow: 80,
  title: 140,
  body: 1200,
  cta_label: 60,
  note: 160,
  image_caption: 120,
  image_alt: 200,
};

type TextKey = keyof typeof LIMITS;

function toForm(row: SectionRow): SectionForm {
  return {
    name: row.name,
    nav_label: row.nav_label,
    slug: row.slug,
    icon: row.icon || defaultIconKey(row.type as SectionType),
    eyebrow: row.eyebrow,
    title: row.title,
    body: row.body,
    cta_label: row.cta_label,
    note: row.note,
    image_caption: row.image_caption,
    image_media_id: row.image_media_id,
    image_alt: row.image_alt,
    options: withDefaultOptions(row.type as SectionType, row.options),
    visible: row.visible,
  };
}

export function SectionPage() {
  const { id } = useParams();
  if (!id) return <Navigate to="/admin/secoes" replace />;
  // key no componente reinicia o estado ao trocar de seção pelo menu.
  return <SectionEditor key={id} id={id} />;
}

function SectionEditor({ id }: { id: string }) {
  const { notify } = useFeedback();
  const navigate = useNavigate();
  const { sections, setSections } = useSections();
  const actions = useSectionActions();
  const form = useFormState<SectionForm>();
  const [row, setRow] = useState<SectionRow | null>(null);
  const [media, setMedia] = useState<Map<string, MediaRow>>(new Map());
  const [loadError, setLoadError] = useState<{ message: string; missing: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<TextKey, string>>>({});
  const { open: previewing, show: showPreview } = useLivePreview();
  useTrackDirty(`section:${id}`, form.dirty);

  const config: SectionTypeConfig | undefined = row ? sectionTypeConfig[row.type as SectionType] : undefined;

  const draft = (): SectionDraft | null =>
    row && form.values
      ? (({ updated_at: _ignored, ...rest }) => rest)({
          ...row,
          ...form.values,
          media: form.values.image_media_id ? (media.get(form.values.image_media_id) ?? null) : null,
        })
      : null;

  // Com a pré-visualização aberta, cada alteração aparece nela (com uma pequena pausa enquanto digita).
  useEffect(() => {
    const d = draft();
    if (!previewing || !d) return;
    const timer = setTimeout(() => updatePreviewDraft({ section: d }), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewing, form.values, media]);

  // Ao sair da tela, o rascunho desta seção deixa de valer.
  useEffect(() => () => clearPreviewDraft({ section: id }), [id]);

  function preview() {
    const d = draft();
    if (!d) return;
    updatePreviewDraft({ section: d });
    showPreview();
  }

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([getSection(id), listMedia()]).then(
      ([section, mediaRows]) => {
        if (!active) return;
        setMedia(new Map(mediaRows.map((m) => [m.id, m])));
        setRow(section);
        form.reset(toForm(section));
      },
      (e: unknown) =>
        active &&
        setLoadError({
          message: toFriendlyError(e),
          // Seção excluída (ou link antigo): .single() sem linhas.
          missing: (e as { code?: string }).code === 'PGRST116',
        }),
    );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, id]);

  function validate(v: SectionForm): boolean {
    const next: Partial<Record<TextKey, string>> = {};
    if (!v.name.trim()) next.name = 'Dê um nome para a seção.';
    const slug = v.slug.trim();
    if (!slug) next.slug = 'Preencha o endereço da seção.';
    else if (slug !== slugify(slug)) next.slug = 'Use só letras minúsculas sem acento, números e hífens.';
    else if (RESERVED_SLUGS.includes(slug)) next.slug = 'Este endereço é reservado. Escolha outro.';
    else if (sections?.some((s) => s.id !== id && s.slug === slug)) next.slug = 'Outra seção já usa este endereço.';
    if (config?.fields.title && !config.titleOptional && !v.title.trim()) next.title = 'O título não pode ficar vazio.';
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) document.getElementById(`section-${first}`)?.focus();
    return !first;
  }

  async function save() {
    if (!form.values || !validate(form.values)) return;
    setSaving(true);
    try {
      const trimmed = Object.fromEntries(
        Object.entries(form.values).map(([k, val]) => [k, typeof val === 'string' ? val.trim() : val]),
      ) as unknown as SectionForm;
      const saved = await updateSection(id, trimmed);
      setRow(saved);
      form.reset(toForm(saved));
      setSections((list) => list.map((s) => (s.id === saved.id ? saved : s)));
      clearPreviewDraft({ section: id });
      notifyPublishedChange();
      notify('success', 'Seção salva. As alterações já aparecem no site.');
    } catch (e) {
      const code = (e as { code?: string }).code;
      notify('error', code === '23505' ? 'Outra seção já usa este endereço. Escolha outro.' : toFriendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  if (loadError?.missing) return <Navigate to="/admin/secoes" replace />;

  const v = form.values;
  const f = config?.fields ?? {};
  const text = (field: TextKey, label: string, help?: string, multiline = false) => {
    const common = {
      id: `section-${field}`,
      label,
      help,
      maxLength: LIMITS[field],
      value: (v?.[field] as string) ?? '',
      onValueChange: (val: string) => {
        form.set(field, field === 'slug' ? val.toLowerCase() : val);
        if (errors[field]) setErrors(({ [field]: _removed, ...rest }) => rest);
      },
      error: errors[field],
      required: (field === 'title' && !config?.titleOptional) || field === 'name' || field === 'slug',
    };
    return multiline ? <TextAreaField {...common} rows={4} /> : <TextField {...common} />;
  };

  const setOption = (key: string, value: string | boolean) =>
    form.set('options', { ...(form.values?.options ?? {}), [key]: value });

  return (
    <>
      <PageHeader
        breadcrumb="Página inicial"
        title={row?.name ?? 'Seção'}
        description={config ? `${config.label}: ${config.description}` : undefined}
        previewAnchor={row?.slug ?? undefined}
      />

      <p className={a.backLink}>
        <Link to="/admin/secoes">
          <ArrowLeft aria-hidden="true" /> Todas as seções e a ordem da página
        </Link>
      </p>

      {loadError && (
        <div className={`${a.notice} ${a.noticeError}`} role="alert">
          <p>{loadError.message}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setLoadError(null);
              setAttempt((n) => n + 1);
            }}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {!v && !loadError && (
        <p className={a.loading} role="status">
          <LoaderCircle className={a.spin} aria-hidden="true" /> Carregando…
        </p>
      )}

      {v && row && config && (
        <form
          className={a.panel}
          aria-labelledby="section-form-title"
          data-tour="section-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className={a.panelHeader}>
            <div>
              <h2 id="section-form-title">Textos da seção</h2>
              <p>Quebras de linha no texto são mantidas no site.</p>
            </div>
          </div>

          <ToggleField
            id="section-visible"
            label="Exibir esta seção no site"
            help={
              config.hiddenWhenEmpty
                ? 'Mesmo marcada, a seção só aparece quando houver itens cadastrados abaixo.'
                : undefined
            }
            checked={v.visible}
            onChange={(checked) => form.set('visible', checked)}
          />

          {f.eyebrow && text('eyebrow', f.eyebrow.label, f.eyebrow.help)}
          {f.title && text('title', f.title.label, f.title.help)}
          {f.body && text('body', f.body.label, f.body.help, true)}
          {f.ctaLabel && text('cta_label', f.ctaLabel.label, f.ctaLabel.help)}
          {f.note && text('note', f.note.label, f.note.help)}

          {f.image && (
            <>
              <ImagePicker
                label={f.image.label}
                help={f.image.help}
                media={v.image_media_id ? (media.get(v.image_media_id) ?? null) : null}
                optional
                onChange={(m) => {
                  if (m) {
                    setMedia((prev) => new Map(prev).set(m.id, m));
                    form.set('image_alt', m.alt);
                  }
                  form.set('image_media_id', m?.id ?? null);
                }}
              />
              {v.image_media_id &&
                text(
                  'image_alt',
                  'Descrição da foto (texto alternativo)',
                  'Descreva o que aparece na foto. Lido por leitores de tela e pelo Google.',
                )}
            </>
          )}
          {f.imageCaption && text('image_caption', f.imageCaption.label, f.imageCaption.help)}

          {config.options && config.options.length > 0 && (
            <fieldset className={a.fieldset} data-tour="section-options">
              <legend>Opções de {config.label.toLowerCase()}</legend>
              {config.options.map((o) => {
                const id = `section-option-${o.key}`;
                const value = v.options[o.key];
                if (o.type === 'toggle') {
                  return (
                    <ToggleField
                      key={o.key}
                      id={id}
                      label={o.label}
                      help={o.help}
                      checked={value === true}
                      onChange={(checked) => setOption(o.key, checked)}
                    />
                  );
                }
                if (o.type === 'select') {
                  return (
                    <SelectField
                      key={o.key}
                      id={id}
                      label={o.label}
                      help={o.help}
                      value={String(value ?? o.default)}
                      options={o.choices}
                      onValueChange={(val) => setOption(o.key, val)}
                    />
                  );
                }
                return (
                  <TextField
                    key={o.key}
                    id={id}
                    label={o.label}
                    help={o.help}
                    maxLength={o.maxLength}
                    value={String(value ?? '')}
                    onValueChange={(val) => setOption(o.key, val)}
                  />
                );
              })}
            </fieldset>
          )}

          {row.type === 'hero' && v.image_media_id && media.get(v.image_media_id) && (
            <HeroImagePreview
              media={media.get(v.image_media_id)!}
              format={v.options.imageFormat}
              focus={v.options.imageFocus}
              caption={v.image_caption}
            />
          )}

          <fieldset className={a.fieldset} data-tour="section-identity">
            <legend>Nome, menu e endereço</legend>
            {text('name', 'Nome da seção no painel', 'Só você vê. Aparece no menu do painel.')}
            <IconPicker
              id="section-icon"
              label="Ícone no menu do painel"
              help="Aparece ao lado do nome no menu lateral."
              value={v.icon}
              onChange={(key) => form.set('icon', key)}
            />
            {row.type !== 'hero' &&
              text(
                'nav_label',
                row.type === 'formulario' ? 'Texto do botão do cabeçalho' : 'Item no menu do site (opcional)',
                row.type === 'formulario'
                  ? 'O formulário vira o botão de destaque no topo do site. Em branco: "Fale conosco".'
                  : 'Em branco, a seção não aparece no menu. Use uma ou duas palavras.',
              )}
            {text(
              'slug',
              'Endereço da seção (âncora)',
              `Usado nos links do menu: seusite.com.br/#${v.slug || 'endereco'}. Letras minúsculas, números e hífens.`,
            )}
          </fieldset>

          <SaveBar
            sticky={false}
            dirty={form.dirty}
            saving={saving}
            onSave={save}
            onDiscard={() => {
              form.discard();
              setErrors({});
              clearPreviewDraft({ section: id });
            }}
            onPreview={preview}
          />
        </form>
      )}

      {row?.type === 'contato' && <LocationSettings />}

      {row?.type === 'formulario' && (
        <div className={a.notice}>
          <Info aria-hidden="true" />
          <p>
            As opções de “Tipo de evento” vêm dos cartões da seção <strong>Tipos de evento</strong> que têm “Opção no
            formulário”. O número que recebe as mensagens é configurado em <strong>Contato e marca</strong>.
          </p>
        </div>
      )}

      {row && config?.list && (
        <ListEditor
          key={row.id}
          table="section_items"
          scope={{ column: 'section_id', value: row.id }}
          tourId={row.type}
          {...config.list}
        />
      )}

      {row && config && (
        <section className={a.panel} aria-labelledby="section-actions-title">
          <div className={a.panelHeader}>
            <div>
              <h2 id="section-actions-title">Esta seção</h2>
              <p>
                {config.single
                  ? 'Só pode haver uma seção deste tipo na página.'
                  : 'Duplique para criar outra parecida (a cópia nasce oculta, logo abaixo desta).'}
              </p>
            </div>
          </div>
          <div className={a.inlineActions}>
            {!config.single && (
              <Button
                variant="outline"
                size="sm"
                icon={<Copy aria-hidden="true" />}
                disabled={form.dirty}
                onClick={async () => {
                  const copy = await actions.duplicate(row);
                  if (copy) navigate(`/admin/secoes/${copy.id}`);
                }}
              >
                Duplicar seção
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 aria-hidden="true" />}
              onClick={async () => {
                if (await actions.remove(row)) {
                  form.reset(toForm(row));
                  navigate('/admin/secoes');
                }
              }}
            >
              Excluir seção
            </Button>
          </div>
          {form.dirty && !config.single && <p className={a.muted}>Salve as alterações antes de duplicar.</p>}
        </section>
      )}
    </>
  );
}
