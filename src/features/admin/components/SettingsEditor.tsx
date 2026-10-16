import { LoaderCircle } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '../../../components/Button/Button';
import { getSettings, listMedia, updateSettings, type MediaRow } from '../../../services/adminService';
import { toFriendlyError } from '../../../services/errors';
import a from '../admin.module.css';
import { useFormState } from '../hooks';
import {
  normalizeSettings,
  rowToForm,
  validateSettings,
  type SettingsErrors,
  type SettingsForm,
} from '../settingsValidation';
import { useFeedback } from './Feedback';
import { SaveBar } from './SaveBar';
import { useTrackDirty } from './UnsavedChanges';

export interface SettingsRenderApi {
  values: SettingsForm;
  set: <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => void;
  errors: SettingsErrors;
  media: Map<string, MediaRow>;
  addMedia: (m: MediaRow) => void;
}

interface Props {
  /** Identificador para o controle de alterações não salvas. */
  formKey: string;
  /** Campos que esta tela edita (somente eles são validados e enviados). */
  fields: (keyof SettingsForm)[];
  children: (api: SettingsRenderApi) => ReactNode;
}

/** Carrega, valida e salva um subconjunto das configurações comerciais. */
export function SettingsEditor({ formKey, fields, children }: Props) {
  const { notify } = useFeedback();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [media, setMedia] = useState<Map<string, MediaRow>>(new Map());
  const form = useFormState<SettingsForm>();
  useTrackDirty(formKey, form.dirty);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([getSettings(), listMedia()]).then(
      ([row, mediaRows]) => {
        if (!active) return;
        form.reset(rowToForm(row));
        setMedia(new Map(mediaRows.map((m) => [m.id, m])));
        setLoaded(true);
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
    const normalized = normalizeSettings(form.values);
    const found = validateSettings(normalized, fields);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      notify('error', 'Revise os campos destacados antes de salvar.');
      const first = fields.find((f) => found[f]);
      if (first) document.getElementById(`settings-${first}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      const patch = Object.fromEntries(fields.map((f) => [f, normalized[f]]));
      const row = await updateSettings(patch);
      form.reset(rowToForm(row));
      notify('success', 'Alterações salvas. Elas já aparecem no site.');
    } catch (e) {
      notify('error', toFriendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
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
    );
  }
  if (!loaded || !form.values) {
    return (
      <p className={a.loading} role="status">
        <LoaderCircle className={a.spin} aria-hidden="true" /> Carregando…
      </p>
    );
  }

  const values = form.values;
  const api: SettingsRenderApi = {
    values,
    set: (key, value) => {
      form.set(key, value);
      if (errors[key]) setErrors(({ [key]: _removed, ...rest }) => rest);
    },
    errors,
    media,
    addMedia: (m) => setMedia((prev) => new Map(prev).set(m.id, m)),
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      noValidate
      className={a.content}
    >
      {children(api)}
      <SaveBar
        dirty={form.dirty}
        saving={saving}
        onSave={save}
        onDiscard={() => {
          form.discard();
          setErrors({});
        }}
      />
    </form>
  );
}
