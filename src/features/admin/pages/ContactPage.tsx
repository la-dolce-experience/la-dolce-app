import { formatBrazilianPhone } from '../../../utils/phone';
import { buildWhatsAppUrl } from '../../../utils/whatsapp';
import a from '../admin.module.css';
import { TextAreaField, TextField } from '../components/Fields';
import { ImagePicker } from '../components/ImagePicker';
import { SettingsEditor } from '../components/SettingsEditor';
import { PageHeader } from './PageHeader';

export function ContactPage() {
  return (
    <>
      <PageHeader
        breadcrumb="Configurações"
        title="Contato e marca"
        description="WhatsApp usado em todos os botões do site, contatos, redes sociais e logotipo."
      />
      <SettingsEditor
        formKey="settings:contact"
        fields={[
          'business_name',
          'footer_tagline',
          'logo_media_id',
          'whatsapp_number',
          'whatsapp_greeting',
          'phone',
          'email',
          'instagram_url',
          'facebook_url',
          'tiktok_url',
        ]}
      >
        {({ values, set, errors, media, addMedia }) => (
          <>
            <section className={a.panel} aria-labelledby="wa-title" data-tour="whatsapp">
              <div className={a.panelHeader}>
                <div>
                  <h2 id="wa-title">WhatsApp</h2>
                  <p>Todos os botões de WhatsApp e o formulário de orçamento usam este número.</p>
                </div>
              </div>
              <div className={a.grid2}>
                <TextField
                  id="settings-whatsapp_number"
                  label="Número do WhatsApp"
                  help="Com DDI e DDD. Ex.: 55 11 92010-2743"
                  inputMode="tel"
                  value={values.whatsapp_number}
                  onValueChange={(v) => set('whatsapp_number', v)}
                  error={errors.whatsapp_number}
                  required
                />
                <div className={a.notice}>
                  <p>
                    Teste o número:{' '}
                    <a
                      href={buildWhatsAppUrl(values.whatsapp_number, values.whatsapp_greeting)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      abrir conversa com {formatBrazilianPhone(values.whatsapp_number.replace(/\D/g, ''))}
                    </a>
                  </p>
                </div>
                <div className={a.span2}>
                  <TextAreaField
                    id="settings-whatsapp_greeting"
                    label="Mensagem inicial do botão flutuante"
                    help="Texto que já vem escrito quando o visitante abre a conversa."
                    rows={2}
                    maxLength={300}
                    value={values.whatsapp_greeting}
                    onValueChange={(v) => set('whatsapp_greeting', v)}
                    error={errors.whatsapp_greeting}
                    required
                  />
                </div>
              </div>
            </section>

            <section className={a.panel} aria-labelledby="contacts-title">
              <div className={a.panelHeader}>
                <div>
                  <h2 id="contacts-title">Outros contatos e redes sociais</h2>
                  <p>Campos em branco não aparecem no site.</p>
                </div>
              </div>
              <div className={a.grid2}>
                <TextField
                  id="settings-phone"
                  label="Telefone fixo (opcional)"
                  inputMode="tel"
                  help="DDD + número."
                  value={values.phone}
                  onValueChange={(v) => set('phone', v)}
                  error={errors.phone}
                />
                <TextField
                  id="settings-email"
                  label="E-mail comercial (opcional)"
                  type="email"
                  inputMode="email"
                  maxLength={120}
                  value={values.email}
                  onValueChange={(v) => set('email', v)}
                  error={errors.email}
                />
                <TextField
                  id="settings-instagram_url"
                  label="Instagram (link)"
                  type="url"
                  placeholder="https://instagram.com/..."
                  value={values.instagram_url}
                  onValueChange={(v) => set('instagram_url', v)}
                  error={errors.instagram_url}
                />
                <TextField
                  id="settings-facebook_url"
                  label="Facebook (link)"
                  type="url"
                  placeholder="https://facebook.com/..."
                  value={values.facebook_url}
                  onValueChange={(v) => set('facebook_url', v)}
                  error={errors.facebook_url}
                />
                <TextField
                  id="settings-tiktok_url"
                  label="TikTok (link)"
                  type="url"
                  placeholder="https://tiktok.com/@..."
                  value={values.tiktok_url}
                  onValueChange={(v) => set('tiktok_url', v)}
                  error={errors.tiktok_url}
                />
              </div>
            </section>

            <section className={a.panel} aria-labelledby="brand-title">
              <div className={a.panelHeader}>
                <div>
                  <h2 id="brand-title">Marca</h2>
                </div>
              </div>
              <div className={a.grid2}>
                <TextField
                  id="settings-business_name"
                  label="Nome do negócio"
                  maxLength={80}
                  value={values.business_name}
                  onValueChange={(v) => set('business_name', v)}
                  error={errors.business_name}
                  required
                />
                <TextField
                  id="settings-footer_tagline"
                  label="Frase do rodapé"
                  maxLength={200}
                  value={values.footer_tagline}
                  onValueChange={(v) => set('footer_tagline', v)}
                />
                <div className={a.span2}>
                  <ImagePicker
                    label="Logotipo"
                    help="Use PNG com fundo transparente: o logo aparece no topo claro e no rodapé escuro."
                    media={values.logo_media_id ? (media.get(values.logo_media_id) ?? null) : null}
                    optional
                    onChange={(m) => {
                      if (m) addMedia(m);
                      set('logo_media_id', m?.id ?? null);
                    }}
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </SettingsEditor>
    </>
  );
}
