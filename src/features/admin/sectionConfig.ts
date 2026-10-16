import type { SectionKey } from '../../types/content';
import type { FieldDef } from './components/ListEditor';

type SectionField = 'eyebrow' | 'title' | 'body' | 'ctaLabel' | 'note' | 'imageCaption' | 'image';

export interface ListConfig {
  table: 'event_types' | 'features' | 'steps' | 'gallery_items' | 'faqs' | 'testimonials';
  title: string;
  description?: string;
  itemName: string;
  titleField: string;
  fields: FieldDef[];
  defaults: Record<string, string | boolean | null>;
  emptyText: string;
}

export interface SectionConfig {
  key: SectionKey;
  /** Nome exibido no painel. */
  label: string;
  description: string;
  /** Âncora da seção no site (para o link "Ver no site"). */
  anchor?: string;
  fields: Partial<Record<SectionField, { label: string; help?: string }>>;
  /** Se a seção só aparece quando a lista tem itens. */
  hiddenWhenEmpty?: boolean;
  list?: ListConfig;
}

const visibleField: FieldDef = { key: 'visible', label: 'Exibir no site', type: 'checkbox' };

export const SECTION_CONFIG: SectionConfig[] = [
  {
    key: 'hero',
    label: 'Destaque principal',
    description: 'Primeira coisa que o visitante vê: título, chamada, botão e a foto da estação.',
    anchor: '',
    fields: {
      eyebrow: { label: 'Texto acima do título', help: 'Frase curta em letras maiúsculas.' },
      title: { label: 'Título principal' },
      body: { label: 'Texto de apoio' },
      ctaLabel: { label: 'Texto do botão de orçamento' },
      note: { label: 'Nota abaixo dos botões', help: 'Ex.: região de atendimento.' },
      image: { label: 'Foto principal' },
      imageCaption: { label: 'Selo sobre a foto' },
    },
  },
  {
    key: 'experience',
    label: 'Experiência',
    description: 'Apresentação da experiência La Dolce, com foto ao lado.',
    anchor: 'experiencia',
    fields: {
      eyebrow: { label: 'Texto acima do título' },
      title: { label: 'Título' },
      body: { label: 'Texto' },
      image: { label: 'Foto' },
    },
  },
  {
    key: 'events',
    label: 'Tipos de evento',
    description: 'Ocasiões atendidas. Cada tipo também aparece como opção no formulário de orçamento.',
    anchor: 'eventos',
    hiddenWhenEmpty: true,
    fields: {
      eyebrow: { label: 'Texto acima do título' },
      title: { label: 'Título' },
      body: { label: 'Texto' },
      ctaLabel: { label: 'Texto do botão abaixo dos cartões', help: 'Deixe em branco para não exibir o botão.' },
    },
    list: {
      table: 'event_types',
      title: 'Cartões de tipo de evento',
      itemName: 'tipo de evento',
      titleField: 'title',
      fields: [
        { key: 'title', label: 'Título do cartão', type: 'text', required: true, maxLength: 80 },
        { key: 'description', label: 'Descrição', type: 'textarea', maxLength: 400 },
        {
          key: 'form_label',
          label: 'Nome no formulário de orçamento',
          type: 'text',
          required: true,
          maxLength: 60,
          help: 'Como aparece na lista "Tipo de evento". Ex.: "Evento corporativo".',
        },
        visibleField,
      ],
      defaults: { visible: true },
      emptyText: 'Nenhum tipo de evento cadastrado. A seção fica oculta até haver ao menos um.',
    },
  },
  {
    key: 'flavors',
    label: 'Sabores e apresentação',
    description: 'Destaque do produto, com a foto da casquinha.',
    fields: {
      eyebrow: { label: 'Texto acima do título' },
      title: { label: 'Título' },
      body: { label: 'Texto' },
      image: { label: 'Foto do produto', help: 'Fotos de produto com fundo transparente (PNG) ficam melhores aqui.' },
    },
  },
  {
    key: 'personalization',
    label: 'Personalização',
    description: 'Faixa rosa com os diferenciais e o botão para falar no WhatsApp.',
    fields: {
      eyebrow: { label: 'Texto acima do título' },
      title: { label: 'Título' },
      body: { label: 'Texto' },
      ctaLabel: { label: 'Texto do botão do WhatsApp', help: 'Deixe em branco para não exibir o botão.' },
    },
    list: {
      table: 'features',
      title: 'Diferenciais',
      itemName: 'diferencial',
      titleField: 'label',
      fields: [{ key: 'label', label: 'Diferencial', type: 'text', required: true, maxLength: 100 }, visibleField],
      defaults: { visible: true },
      emptyText: 'Nenhum diferencial cadastrado.',
    },
  },
  {
    key: 'steps',
    label: 'Como funciona',
    description: 'Etapas da contratação. Só aparece no site quando houver ao menos uma etapa.',
    anchor: 'como-funciona',
    hiddenWhenEmpty: true,
    fields: {
      eyebrow: { label: 'Texto acima do título' },
      title: { label: 'Título' },
      body: { label: 'Texto' },
    },
    list: {
      table: 'steps',
      title: 'Etapas',
      itemName: 'etapa',
      titleField: 'title',
      fields: [
        { key: 'title', label: 'Título da etapa', type: 'text', required: true, maxLength: 80 },
        { key: 'description', label: 'Descrição', type: 'textarea', maxLength: 400 },
        visibleField,
      ],
      defaults: { visible: true },
      emptyText: 'Nenhuma etapa cadastrada. A seção está oculta no site.',
    },
  },
  {
    key: 'gallery',
    label: 'Galeria',
    description: 'Fotos da estação, dos produtos e de eventos. A primeira foto aparece em destaque.',
    anchor: 'galeria',
    hiddenWhenEmpty: true,
    fields: {
      eyebrow: { label: 'Texto acima do título' },
      title: { label: 'Título' },
      body: { label: 'Texto (opcional)' },
    },
    list: {
      table: 'gallery_items',
      title: 'Fotos da galeria',
      itemName: 'foto',
      titleField: 'alt',
      fields: [
        { key: 'media_id', label: 'Foto', type: 'media', required: true },
        {
          key: 'alt',
          label: 'Descrição da foto (texto alternativo)',
          type: 'text',
          required: true,
          maxLength: 200,
          help: 'Descreva o que aparece na foto. Importante para acessibilidade e Google.',
        },
        { key: 'caption', label: 'Legenda visível (opcional)', type: 'text', maxLength: 160 },
        visibleField,
      ],
      defaults: { visible: true, media_id: null },
      emptyText: 'Nenhuma foto na galeria. A seção está oculta no site.',
    },
  },
  {
    key: 'testimonials',
    label: 'Depoimentos',
    description: 'Somente depoimentos reais, com autorização de uso. Só aparece quando houver depoimento autorizado.',
    anchor: 'depoimentos',
    hiddenWhenEmpty: true,
    fields: {
      eyebrow: { label: 'Texto acima do título' },
      title: { label: 'Título' },
      body: { label: 'Texto (opcional)' },
    },
    list: {
      table: 'testimonials',
      title: 'Depoimentos',
      itemName: 'depoimento',
      titleField: 'author',
      fields: [
        { key: 'author', label: 'Nome de quem deu o depoimento', type: 'text', required: true, maxLength: 80 },
        {
          key: 'context',
          label: 'Contexto',
          type: 'text',
          maxLength: 120,
          help: 'Ex.: "Casamento em Campinas" ou "Empresa X".',
        },
        { key: 'quote', label: 'Depoimento', type: 'textarea', required: true, maxLength: 800, rows: 4 },
        {
          key: 'authorized',
          label: 'Tenho autorização para publicar este depoimento',
          type: 'checkbox',
          help: 'Sem esta confirmação o depoimento não aparece no site.',
        },
        visibleField,
      ],
      defaults: { visible: true, authorized: false },
      emptyText: 'Nenhum depoimento cadastrado. A seção está oculta no site.',
    },
  },
  {
    key: 'quote',
    label: 'Formulário de orçamento',
    description: 'Textos da seção do formulário que abre o WhatsApp com os dados do evento.',
    anchor: 'orcamento',
    fields: {
      eyebrow: { label: 'Texto acima do título' },
      title: { label: 'Título' },
      body: { label: 'Texto' },
      ctaLabel: { label: 'Texto do botão de envio' },
    },
  },
  {
    key: 'location',
    label: 'Atendimento e localização',
    description: 'Área atendida, endereço, horários e mapa.',
    anchor: 'atendimento',
    fields: {
      eyebrow: { label: 'Texto acima do título' },
      title: { label: 'Título' },
      body: { label: 'Texto' },
    },
  },
  {
    key: 'faq',
    label: 'Perguntas frequentes',
    description: 'Dúvidas comuns antes de contratar. Só aparece quando houver ao menos uma pergunta.',
    anchor: 'duvidas',
    hiddenWhenEmpty: true,
    fields: {
      eyebrow: { label: 'Texto acima do título' },
      title: { label: 'Título' },
      body: { label: 'Texto (opcional)' },
    },
    list: {
      table: 'faqs',
      title: 'Perguntas',
      itemName: 'pergunta',
      titleField: 'question',
      fields: [
        { key: 'question', label: 'Pergunta', type: 'text', required: true, maxLength: 200 },
        { key: 'answer', label: 'Resposta', type: 'textarea', required: true, maxLength: 1500, rows: 4 },
        visibleField,
      ],
      defaults: { visible: true },
      emptyText: 'Nenhuma pergunta cadastrada. A seção está oculta no site.',
    },
  },
];

export const sectionConfigByKey = Object.fromEntries(SECTION_CONFIG.map((c) => [c.key, c])) as Record<
  SectionKey,
  SectionConfig
>;
