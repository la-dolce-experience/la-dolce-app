import { Info } from 'lucide-react';
import a from '../admin.module.css';
import { TextAreaField, TextField } from '../components/Fields';
import { ImagePicker } from '../components/ImagePicker';
import { OG_PRESETS } from '../cropPresets';
import { RepublishPanel } from '../components/RepublishPanel';
import { SettingsEditor } from '../components/SettingsEditor';
import { PageHeader } from './PageHeader';
import styles from './SeoPage.module.css';

export function SeoPage() {
  return (
    <>
      <PageHeader
        breadcrumb="Configurações"
        title="Google e compartilhamento"
        description="Como o site aparece nos resultados do Google e quando o link é compartilhado no WhatsApp ou redes sociais."
      />
      <SettingsEditor formKey="settings:seo" fields={['seo_title', 'seo_description', 'og_media_id']}>
        {({ values, set, errors, media, addMedia }) => (
          <>
            <section className={a.panel} aria-labelledby="seo-title" data-tour="seo">
              <div className={a.panelHeader}>
                <div>
                  <h2 id="seo-title">Resultado de busca</h2>
                </div>
              </div>
              <TextField
                id="settings-seo_title"
                label="Título da página"
                help="Ideal: até 60 caracteres, com o nome da marca e o que ela oferece."
                maxLength={70}
                value={values.seo_title}
                onValueChange={(v) => set('seo_title', v)}
                error={errors.seo_title}
                required
              />
              <TextAreaField
                id="settings-seo_description"
                label="Descrição"
                help="Ideal: entre 120 e 160 caracteres. Resume o serviço e convida ao clique."
                rows={3}
                maxLength={170}
                value={values.seo_description}
                onValueChange={(v) => set('seo_description', v)}
                error={errors.seo_description}
                required
              />
              <div className={styles.serp} aria-label="Pré-visualização no Google">
                <p className={styles.serpLabel}>Pré-visualização aproximada</p>
                <p className={styles.serpTitle}>{values.seo_title || 'Título da página'}</p>
                <p className={styles.serpDesc}>{values.seo_description || 'Descrição da página'}</p>
              </div>
            </section>

            <section className={a.panel} aria-labelledby="og-title">
              <div className={a.panelHeader}>
                <div>
                  <h2 id="og-title">Imagem de compartilhamento</h2>
                  <p>Aparece quando alguém envia o link do site. Formato ideal: horizontal (1200 × 630 px).</p>
                </div>
              </div>
              <ImagePicker
                label="Imagem"
                crop={OG_PRESETS}
                media={values.og_media_id ? (media.get(values.og_media_id) ?? null) : null}
                optional
                onChange={(m) => {
                  if (m) addMedia(m);
                  set('og_media_id', m?.id ?? null);
                }}
              />
              <div className={a.notice}>
                <Info aria-hidden="true" />
                <p>
                  Depois de salvar, o site é republicado sozinho em cerca de 2 minutos, e o WhatsApp e as redes sociais
                  passam a mostrar o novo título, descrição e imagem. Para atualizar na hora, use{' '}
                  <strong>Atualizar a prévia do link</strong>, logo abaixo.
                </p>
              </div>
            </section>
          </>
        )}
      </SettingsEditor>
      <RepublishPanel />
    </>
  );
}
