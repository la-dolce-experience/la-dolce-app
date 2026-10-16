import { Info } from 'lucide-react';
import a from '../admin.module.css';
import { TextAreaField, TextField, ToggleField } from '../components/Fields';
import { SettingsEditor } from '../components/SettingsEditor';

/** Dados de atendimento e endereço (parte das configurações comerciais). */
export function LocationSettings() {
  return (
    <SettingsEditor
      formKey="settings:location"
      fields={[
        'service_area',
        'opening_hours',
        'address_street',
        'address_district',
        'city',
        'state',
        'postal_code',
        'maps_url',
        'show_map',
      ]}
    >
      {({ values, set, errors }) => (
        <section className={a.panel} aria-labelledby="location-data-title">
          <div className={a.panelHeader}>
            <div>
              <h2 id="location-data-title">Dados de atendimento</h2>
              <p>Campos em branco não aparecem no site.</p>
            </div>
          </div>

          <TextAreaField
            id="settings-service_area"
            label="Área de atendimento"
            help='Ex.: "Atendimento personalizado em São Paulo e Grande SP".'
            rows={2}
            maxLength={300}
            value={values.service_area}
            onValueChange={(v) => set('service_area', v)}
          />
          <TextAreaField
            id="settings-opening_hours"
            label="Horário de atendimento"
            help="Uma linha por período. Ex.: Segunda a sexta, 9h às 18h"
            rows={3}
            maxLength={500}
            value={values.opening_hours}
            onValueChange={(v) => set('opening_hours', v)}
          />

          <div className={a.notice}>
            <Info aria-hidden="true" />
            <p>
              Preencha o endereço somente se houver um local físico de atendimento. Sem endereço, o site mostra apenas a
              área de atendimento.
            </p>
          </div>

          <div className={a.grid2}>
            <div className={a.span2}>
              <TextField
                id="settings-address_street"
                label="Endereço (rua e número)"
                maxLength={160}
                autoComplete="street-address"
                value={values.address_street}
                onValueChange={(v) => set('address_street', v)}
              />
            </div>
            <TextField
              id="settings-address_district"
              label="Bairro"
              maxLength={80}
              value={values.address_district}
              onValueChange={(v) => set('address_district', v)}
            />
            <TextField
              id="settings-city"
              label="Cidade"
              maxLength={80}
              value={values.city}
              onValueChange={(v) => set('city', v)}
            />
            <TextField
              id="settings-state"
              label="Estado (sigla)"
              maxLength={2}
              placeholder="SP"
              value={values.state}
              onValueChange={(v) => set('state', v.toUpperCase())}
              error={errors.state}
            />
            <TextField
              id="settings-postal_code"
              label="CEP"
              inputMode="numeric"
              maxLength={9}
              placeholder="00000-000"
              value={values.postal_code}
              onValueChange={(v) => set('postal_code', v)}
              error={errors.postal_code}
            />
            <div className={a.span2}>
              <TextField
                id="settings-maps_url"
                label="Link do Google Maps (opcional)"
                help="Se ficar em branco e houver endereço, o link é gerado automaticamente."
                type="url"
                placeholder="https://maps.app.goo.gl/..."
                value={values.maps_url}
                onValueChange={(v) => set('maps_url', v)}
                error={errors.maps_url}
              />
            </div>
          </div>

          <ToggleField
            id="settings-show_map"
            label="Mostrar mapa no site"
            help="O mapa só carrega quando o visitante clicar em “Carregar mapa” (privacidade e velocidade)."
            checked={values.show_map}
            onChange={(v) => set('show_map', v)}
          />
          {errors.show_map && <p className={`${a.notice} ${a.noticeError}`}>{errors.show_map}</p>}
        </section>
      )}
    </SettingsEditor>
  );
}
