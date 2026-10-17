import { Info, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Button } from '../../../components/Button/Button';
import { clearPreviewDraft, updatePreviewDraft, type SectionDraft } from '../../../lib/preview';
import { getSection, listMedia, updateSection, type MediaRow, type SectionRow } from '../../../services/adminService';
import { toFriendlyError } from '../../../services/errors';
import { SECTION_KEYS, type SectionKey } from '../../../types/content';
import a from '../admin.module.css';
import { useFeedback } from '../components/Feedback';
import { TextAreaField, TextField, ToggleField } from '../components/Fields';
import { ImagePicker } from '../components/ImagePicker';
import { ListEditor } from '../components/ListEditor';
import { SaveBar } from '../components/SaveBar';
import { useTrackDirty } from '../components/UnsavedChanges';
import { useFormState } from '../hooks';
import { useLivePreview } from '../preview/LivePreview';
import { sectionConfigByKey, type SectionConfig } from '../sectionConfig';
import { LocationSettings } from './LocationSettings';
import { PageHeader } from './PageHeader';

interface SectionForm {
  eyebrow: string;
  title: string;
  body: string;
  cta_label: string;
  note: string;
  image_caption: string;
  image_media_id: string | null;
  image_alt: string;
  visible: boolean;
}

const LIMITS = { eyebrow: 80, title: 140, body: 1200, cta_label: 60, note: 160, image_caption: 120, image_alt: 200 };

function toForm(row: SectionRow): SectionForm {
  return {
    eyebrow: row.eyebrow,
    title: row.title,
    body: row.body,
    cta_label: row.cta_label,
    note: row.note,
    image_caption: row.image_caption,
    image_media_id: row.image_media_id,
    image_alt: row.image_alt,
    visible: row.visible,
  };
}

export function SectionPage() {
  const { key } = useParams();
  if (!key || !(SECTION_KEYS as readonly string[]).includes(key)) return <Navigate to="/admin" replace />;
  const config = sectionConfigByKey[key as SectionKey];
  // key no componente reinicia o estado ao trocar de seção pelo menu.
  return <SectionEditor key={key} config={config} />;
}

function SectionEditor({ config }: { config: SectionConfig }) {
  const { notify } = useFeedback();
  const form = useFormState<SectionForm>();
  const [media, setMedia] = useState<Map<string, MediaRow>>(new Map());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState<string>();
  const { open: previewing, show: showPreview } = useLivePreview();
  useTrackDirty(`section:${config.key}`, form.dirty);

  const draft = (): SectionDraft | null =>
    form.values && {
      ...form.values,
      media: form.values.image_media_id ? (media.get(form.values.image_media_id) ?? null) : null,
    };

  // Com a pré-visualização aberta, cada alteração aparece nela (com uma pequena pausa enquanto digita).
  useEffect(() => {
    const d = draft();
    if (!previewing || !d) return;
    const timer = setTimeout(() => updatePreviewDraft({ section: [config.key, d] }), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewing, form.values, media]);

  // Ao sair da tela, o rascunho desta seção deixa de valer.
  useEffect(() => () => clearPreviewDraft({ section: config.key }), [config.key]);

  function preview() {
    const d = draft();
    if (!d) return;
    updatePreviewDraft({ section: [config.key, d] });
    showPreview();
  }

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([getSection(config.key), config.fields.image ? listMedia() : Promise.resolve([])]).then(
      ([row, mediaRows]) => {
        if (!active) return;
        setMedia(new Map(mediaRows.map((m) => [m.id, m])));
        form.reset(toForm(row));
      },
      (e: unknown) => active && setLoadError(toFriendlyError(e)),
    );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  async function save() {
    if (!form.values) return;
    const v = form.values;
    if (config.fields.title && !v.title.trim()) {
      setTitleError('O título não pode ficar vazio.');
      document.getElementById(`section-title`)?.focus();
      return;
    }
    setSaving(true);
    try {
      const trimmed = Object.fromEntries(
        Object.entries(v).map(([k, val]) => [k, typeof val === 'string' ? val.trim() : val]),
      ) as unknown as SectionForm;
      const row = await updateSection(config.key, trimmed);
      form.reset(toForm(row));
      clearPreviewDraft({ section: config.key });
      notify('success', 'Seção salva. As alterações já aparecem no site.');
    } catch (e) {
      notify('error', toFriendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  const v = form.values;
  const f = config.fields;
  const text = (field: keyof typeof LIMITS, label: string, help?: string, multiline = false) => {
    const common = {
      id: `section-${field === 'title' ? 'title' : field}`,
      label,
      help,
      maxLength: LIMITS[field],
      value: (v?.[field] as string) ?? '',
      onValueChange: (val: string) => {
        form.set(field, val);
        if (field === 'title') setTitleError(undefined);
      },
      error: field === 'title' ? titleError : undefined,
      required: field === 'title',
    };
    return multiline ? <TextAreaField {...common} rows={4} /> : <TextField {...common} />;
  };

  return (
    <>
      <PageHeader
        breadcrumb="Página inicial"
        title={config.label}
        description={config.description}
        previewAnchor={config.anchor}
      />

      {loadError && (
        <div className={`${a.notice} ${a.noticeError}`} role="alert">
          <p>{loadError}</p>
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

      {v && (
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

          <SaveBar
            sticky={false}
            dirty={form.dirty}
            saving={saving}
            onSave={save}
            onDiscard={() => {
              form.discard();
              setTitleError(undefined);
              clearPreviewDraft({ section: config.key });
            }}
            onPreview={preview}
          />
        </form>
      )}

      {config.key === 'location' && <LocationSettings />}

      {config.key === 'quote' && (
        <div className={a.notice}>
          <Info aria-hidden="true" />
          <p>
            As opções de "Tipo de evento" do formulário vêm da seção <strong>Tipos de evento</strong>. O número que
            recebe as mensagens é configurado em <strong>Contato e marca</strong>.
          </p>
        </div>
      )}

      {config.lists?.map((list) => (
        <ListEditor key={`${list.table}:${list.scope?.value ?? ''}`} {...list} />
      ))}
    </>
  );
}
