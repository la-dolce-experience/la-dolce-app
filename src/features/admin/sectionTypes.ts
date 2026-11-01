import {
  CircleHelp,
  ClipboardList,
  Images,
  LayoutGrid,
  ListChecks,
  ListOrdered,
  MapPin,
  MessageSquareQuote,
  PanelsTopLeft,
  ShoppingBag,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { SectionType } from '../../types/content';
import { HERO_FOCUS, HERO_FORMATS } from '../site/heroImage';
import { CAROUSEL_SECONDS } from '../site/sectionHelpers';
import { SECTION_THEMES } from '../site/sectionThemes';
import type { FieldDef } from './components/ListEditor';

type SectionField = 'eyebrow' | 'title' | 'body' | 'ctaLabel' | 'note' | 'imageCaption' | 'image';

/** Opção específica do tipo, gravada em sections.options. */
export type OptionDef =
  | { key: string; label: string; type: 'text'; maxLength: number; help?: string; default: string }
  | { key: string; label: string; type: 'toggle'; help?: string; default: boolean }
  | {
      key: string;
      label: string;
      type: 'select';
      help?: string;
      choices: { value: string; label: string }[];
      default: string;
    };

export interface ListConfig {
  title: string;
  description?: string;
  /** Nome de um item no singular, ex.: "pergunta". */
  itemName: string;
  titleField: string;
  fields: FieldDef[];
  defaults: Record<string, string | number | boolean | string[] | null>;
  emptyText: string;
}

export interface SectionTypeConfig {
  type: SectionType;
  /** Nome do tipo no painel. */
  label: string;
  /** Para que serve (aparece ao escolher o tipo de uma seção nova). */
  description: string;
  icon: LucideIcon;
  /** Só pode existir uma seção deste tipo na página. */
  single?: boolean;
  fields: Partial<Record<SectionField, { label: string; help?: string }>>;
  options?: OptionDef[];
  /** O título pode ficar em branco (ver CatalogSection). */
  titleOptional?: boolean;
  /** A seção só aparece no site quando a lista tem itens. */
  hiddenWhenEmpty?: boolean;
  list?: ListConfig;
  /** Textos iniciais de uma seção nova deste tipo. */
  starter: { name: string; slug: string; eyebrow?: string; title: string; body?: string; ctaLabel?: string };
}

const visibleField: FieldDef = { key: 'visible', label: 'Exibir no site', type: 'checkbox' };

const altField: FieldDef = {
  key: 'alt',
  label: 'Descrição da foto (texto alternativo)',
  type: 'text',
  maxLength: 200,
  help: 'Descreva o que aparece na foto. Se ficar em branco, o site usa o título.',
};

const heading = {
  eyebrow: { label: 'Texto acima do título', help: 'Frase curta em letras maiúsculas.' },
  title: { label: 'Título' },
  body: { label: 'Texto' },
};

const imagePositionOption: OptionDef = {
  key: 'imagePosition',
  label: 'Lado da foto no computador',
  type: 'select',
  choices: [
    { value: 'esquerda', label: 'Foto à esquerda do texto' },
    { value: 'direita', label: 'Foto à direita do texto' },
  ],
  default: 'esquerda',
  help: 'No celular, a foto sempre fica acima do texto.',
};

/** Cor de fundo (ver site/sectionThemes.ts): só nos tipos de THEMED_SECTION_TYPES. */
const themeOption: OptionDef = {
  key: 'theme',
  label: 'Cor de fundo da seção',
  type: 'select',
  choices: SECTION_THEMES.map(({ value, label }) => ({ value, label })),
  default: 'padrao',
  help: 'Destaca a seção com uma faixa colorida de ponta a ponta. No roxo açaí, os textos ficam brancos.',
};

const whatsappButtonField = {
  label: 'Texto do botão do WhatsApp (opcional)',
  help: 'Aparece abaixo do texto e abre o WhatsApp com a mensagem de saudação. Em branco, sem botão.',
};

export const SECTION_TYPE_CONFIG: SectionTypeConfig[] = [
  {
    type: 'hero',
    label: 'Destaque principal',
    description: 'Primeira coisa que o visitante vê: título principal da página, botões e uma foto.',
    icon: Sparkles,
    single: true,
    fields: {
      eyebrow: heading.eyebrow,
      title: { label: 'Título principal', help: 'É o título da página para o Google. Seja claro e direto.' },
      body: { label: 'Texto de apoio' },
      ctaLabel: {
        label: 'Texto do botão principal',
        help: 'Leva ao formulário de contato. Sem formulário na página, abre o WhatsApp.',
      },
      note: { label: 'Nota abaixo dos botões', help: 'Ex.: região de atendimento.' },
      image: {
        label: 'Foto principal',
        help: 'Tamanho ideal: 1600 × 1280 px, foto deitada na proporção 5:4 (mínimo 1000 × 800 px). Fotos em outra proporção são cortadas nas bordas: escolha o formato e o ponto de foco abaixo e confira na prévia.',
      },
      imageCaption: {
        label: 'Selo sobre a foto',
        help: 'Fica no canto de baixo, à esquerda, por cima da foto. Evite deixar o produto nesse canto.',
      },
    },
    options: [
      {
        key: 'whatsappLabel',
        label: 'Texto do botão do WhatsApp',
        type: 'text',
        maxLength: 40,
        default: 'Tirar dúvidas no WhatsApp',
        help: 'Segundo botão, ao lado do principal. Deixe em branco para não exibir.',
      },
      {
        key: 'imageFormat',
        label: 'Formato da foto',
        type: 'select',
        choices: HERO_FORMATS.map((f) => ({ value: f.value, label: `${f.label}: ideal ${f.ideal}` })),
        default: 'horizontal',
        help: 'O mesmo formato vale para o celular e o computador. Escolha o que mais se parece com a sua foto.',
      },
      {
        key: 'imageFocus',
        label: 'Parte da foto que deve aparecer sempre',
        type: 'select',
        choices: HERO_FOCUS.map((f) => ({ value: f.value, label: f.label })),
        default: 'centro',
        help: 'Quando a foto tem outra proporção, o site corta as bordas e mantém esta parte visível.',
      },
    ],
    starter: { name: 'Destaque principal', slug: 'destaque', title: 'Um título claro sobre o que você oferece.' },
  },
  {
    type: 'texto_imagem',
    label: 'Texto com imagem',
    description:
      'Um bloco de texto com uma foto ao lado, ou várias fotos que trocam sozinhas (carrossel). Bom para "Sobre", história ou um produto em destaque.',
    icon: PanelsTopLeft,
    fields: {
      ...heading,
      ctaLabel: whatsappButtonField,
      image: {
        label: 'Foto (opcional)',
        help: 'Com fotos em "Fotos do carrossel", mais abaixo, esta é a primeira do carrossel.',
      },
    },
    options: [
      imagePositionOption,
      {
        key: 'imageFit',
        label: 'Enquadramento da foto',
        type: 'select',
        choices: [
          { value: 'cortada', label: 'Preencher o espaço (pode cortar as bordas)' },
          { value: 'inteira', label: 'Mostrar a foto inteira (bom para PNG com fundo transparente)' },
        ],
        default: 'cortada',
      },
      {
        key: 'carouselSeconds',
        label: 'Tempo de cada foto no carrossel',
        type: 'select',
        choices: CAROUSEL_SECONDS.map((s) => ({ value: s, label: `${s} segundos` })),
        default: '5',
        help: 'Só vale quando há fotos em "Fotos do carrossel". O carrossel para quando o visitante passa o mouse ou usa o teclado.',
      },
      themeOption,
    ],
    list: {
      title: 'Fotos do carrossel (opcional)',
      description:
        'Com uma ou mais fotos aqui, a foto da seção vira um carrossel que troca sozinho: primeiro a foto acima, depois estas, na ordem da lista. No celular, o visitante também pode arrastar para os lados.',
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
          help: 'Descreva o que aparece na foto (ex.: "Casquinha com sorvete de pistache"). Importante para acessibilidade e Google.',
        },
        visibleField,
      ],
      defaults: { visible: true, media_id: null },
      emptyText: 'Nenhuma foto no carrossel. A seção mostra só a foto acima.',
    },
    starter: { name: 'Sobre', slug: 'sobre', eyebrow: 'Sobre', title: 'Quem está por trás do negócio.' },
  },
  {
    type: 'cartoes',
    label: 'Cartões',
    description:
      'Cartões com título e descrição: serviços, ocasiões atendidas, planos. Cada cartão pode virar uma opção do formulário.',
    icon: LayoutGrid,
    hiddenWhenEmpty: true,
    fields: {
      ...heading,
      ctaLabel: {
        label: 'Texto do botão abaixo dos cartões',
        help: 'Leva ao formulário. Deixe em branco para não exibir.',
      },
    },
    options: [
      {
        key: 'linkLabel',
        label: 'Texto do link em cada cartão',
        type: 'text',
        maxLength: 40,
        default: 'Pedir orçamento',
        help: 'Aparece nos cartões que têm "Opção no formulário", seguido da opção (ex.: "Pedir orçamento para evento social"), e já deixa a opção escolhida.',
      },
      themeOption,
    ],
    list: {
      title: 'Cartões',
      itemName: 'cartão',
      titleField: 'title',
      fields: [
        { key: 'title', label: 'Título do cartão', type: 'text', required: true, maxLength: 80 },
        { key: 'description', label: 'Descrição', type: 'textarea', maxLength: 400 },
        {
          key: 'label',
          label: 'Opção no formulário (opcional)',
          type: 'text',
          maxLength: 60,
          help: 'Como aparece no campo "Tipo de evento" do formulário (ex.: "Evento corporativo"). Em branco, o cartão não vira opção.',
        },
        visibleField,
      ],
      defaults: { visible: true },
      emptyText: 'Nenhum cartão cadastrado. A seção fica oculta até haver ao menos um.',
    },
    starter: { name: 'Serviços', slug: 'servicos', eyebrow: 'O que fazemos', title: 'Serviços' },
  },
  {
    type: 'catalogo',
    label: 'Catálogo',
    description: 'Produtos ou serviços com foto, descrição e preço (ou outro detalhe), em grade.',
    icon: ShoppingBag,
    hiddenWhenEmpty: true,
    fields: {
      eyebrow: heading.eyebrow,
      title: {
        label: 'Título (opcional)',
        help: 'Sem título, texto e foto, a grade aparece logo abaixo da seção anterior (ex.: a lista de sabores abaixo de "Sabores e apresentação").',
      },
      body: heading.body,
      ctaLabel: whatsappButtonField,
      image: { label: 'Foto da seção (opcional)', help: 'Fotos com fundo transparente (PNG) ficam melhores aqui.' },
    },
    titleOptional: true,
    options: [
      { ...imagePositionOption, default: 'direita' },
      {
        key: 'listTitle',
        label: 'Título acima da grade (opcional)',
        type: 'text',
        maxLength: 60,
        default: '',
      },
      themeOption,
    ],
    list: {
      title: 'Itens do catálogo',
      itemName: 'item',
      titleField: 'title',
      fields: [
        { key: 'title', label: 'Nome', type: 'text', required: true, maxLength: 80 },
        {
          key: 'label',
          label: 'Preço ou detalhe (opcional)',
          type: 'text',
          maxLength: 60,
          help: 'Ex.: "A partir de R$ 90" ou "Sob encomenda".',
        },
        { key: 'description', label: 'Descrição (opcional)', type: 'textarea', maxLength: 300 },
        { key: 'media_id', label: 'Foto (opcional)', type: 'media' },
        altField,
        visibleField,
      ],
      defaults: { visible: true, media_id: null },
      emptyText: 'Nenhum item cadastrado. A seção fica oculta até haver ao menos um.',
    },
    starter: { name: 'Catálogo', slug: 'catalogo', eyebrow: 'Catálogo', title: 'Conheça as opções.' },
  },
  {
    type: 'destaques',
    label: 'Faixa de destaques',
    description: 'Faixa de contraste com uma lista de diferenciais e o botão do WhatsApp.',
    icon: ListChecks,
    fields: {
      ...heading,
      ctaLabel: { label: 'Texto do botão do WhatsApp', help: 'Deixe em branco para não exibir o botão.' },
    },
    list: {
      title: 'Diferenciais',
      itemName: 'diferencial',
      titleField: 'title',
      fields: [{ key: 'title', label: 'Diferencial', type: 'text', required: true, maxLength: 100 }, visibleField],
      defaults: { visible: true },
      emptyText: 'Nenhum diferencial cadastrado. A faixa aparece só com os textos.',
    },
    starter: {
      name: 'Diferenciais',
      slug: 'diferenciais',
      eyebrow: 'Por que escolher',
      title: 'Os diferenciais do negócio.',
      ctaLabel: 'Falar no WhatsApp',
    },
  },
  {
    type: 'etapas',
    label: 'Passo a passo',
    description: 'Etapas numeradas: como funciona a contratação, o atendimento ou a entrega.',
    icon: ListOrdered,
    hiddenWhenEmpty: true,
    fields: heading,
    options: [themeOption],
    list: {
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
    starter: { name: 'Como funciona', slug: 'como-funciona', eyebrow: 'Como funciona', title: 'Passo a passo.' },
  },
  {
    type: 'galeria',
    label: 'Galeria de fotos',
    description:
      'Fotos em grade. A primeira aparece em destaque; com mais de 3, as demais abrem em tela cheia, em carrossel.',
    icon: Images,
    hiddenWhenEmpty: true,
    fields: { eyebrow: heading.eyebrow, title: heading.title, body: { label: 'Texto (opcional)' } },
    options: [themeOption],
    list: {
      title: 'Fotos',
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
        { key: 'description', label: 'Legenda visível (opcional)', type: 'text', maxLength: 160 },
        visibleField,
      ],
      defaults: { visible: true, media_id: null },
      emptyText: 'Nenhuma foto na galeria. A seção está oculta no site.',
    },
    starter: { name: 'Galeria', slug: 'galeria', eyebrow: 'Galeria', title: 'Trabalhos realizados.' },
  },
  {
    type: 'depoimentos',
    label: 'Depoimentos',
    description:
      'Depoimentos reais, com autorização de uso, em carrossel: estrelas, foto de perfil e até 5 fotos de cada um.',
    icon: MessageSquareQuote,
    hiddenWhenEmpty: true,
    fields: { eyebrow: heading.eyebrow, title: heading.title, body: { label: 'Texto (opcional)' } },
    options: [themeOption],
    list: {
      title: 'Depoimentos',
      itemName: 'depoimento',
      titleField: 'title',
      fields: [
        { key: 'title', label: 'Nome de quem deu o depoimento', type: 'text', required: true, maxLength: 80 },
        {
          key: 'label',
          label: 'Contexto',
          type: 'text',
          maxLength: 120,
          help: 'Ex.: "Cliente desde 2023" ou "Empresa X".',
        },
        { key: 'description', label: 'Depoimento', type: 'textarea', required: true, maxLength: 800, rows: 4 },
        { key: 'rating', label: 'Avaliação', type: 'rating', help: 'Toque nas estrelas: de 1 a 5.' },
        {
          key: 'photo_media_ids',
          label: 'Fotos (opcional)',
          type: 'media-list',
          max: 5,
          help: 'Até 5 fotos. No site aparecem abaixo do depoimento; ao tocar, abrem em tela cheia.',
        },
        {
          key: 'media_id',
          label: 'Foto de perfil (opcional)',
          type: 'media',
          help: 'Foto de quem deu o depoimento. Aparece em círculo ao lado do nome.',
        },
        {
          key: 'authorized',
          label: 'Tenho autorização para publicar este depoimento',
          type: 'checkbox',
          help: 'Sem esta confirmação o depoimento não aparece no site.',
        },
        visibleField,
      ],
      defaults: { visible: true, authorized: false, rating: 5, media_id: null, photo_media_ids: [] },
      emptyText: 'Nenhum depoimento cadastrado. A seção está oculta no site.',
    },
    starter: { name: 'Depoimentos', slug: 'depoimentos', eyebrow: 'Depoimentos', title: 'O que dizem os clientes' },
  },
  {
    type: 'formulario',
    label: 'Formulário de contato',
    description: 'Formulário que abre o WhatsApp com a mensagem pronta. Nada fica salvo no site.',
    icon: ClipboardList,
    single: true,
    fields: { ...heading, ctaLabel: { label: 'Texto do botão de envio' } },
    options: [
      {
        key: 'subjectLabel',
        label: 'Nome do campo de tipo de evento',
        type: 'text',
        maxLength: 40,
        default: 'Tipo de evento',
        help: 'As opções vêm dos cartões de "Tipos de evento" que têm "Opção no formulário". Sem opções, o campo não aparece.',
      },
      { key: 'showDate', label: 'Pedir uma data', type: 'toggle', default: true },
      { key: 'dateLabel', label: 'Nome do campo de data', type: 'text', maxLength: 40, default: 'Data desejada' },
      { key: 'showQuantity', label: 'Pedir uma quantidade', type: 'toggle', default: false },
      {
        key: 'quantityLabel',
        label: 'Nome do campo de quantidade',
        type: 'text',
        maxLength: 40,
        default: 'Quantidade',
        help: 'Ex.: "Nº de convidados", "Quantidade de peças".',
      },
      { key: 'showLocation', label: 'Pedir cidade ou local', type: 'toggle', default: true },
      {
        key: 'locationLabel',
        label: 'Nome do campo de local',
        type: 'text',
        maxLength: 40,
        default: 'Cidade ou bairro',
      },
      {
        key: 'messageLabel',
        label: 'Nome do campo de mensagem',
        type: 'text',
        maxLength: 60,
        default: 'Conte um pouco sobre o que você precisa',
      },
    ],
    starter: {
      name: 'Formulário de contato',
      slug: 'contato',
      eyebrow: 'Fale com a gente',
      title: 'Vamos conversar?',
      ctaLabel: 'Enviar pelo WhatsApp',
    },
  },
  {
    type: 'contato',
    label: 'Atendimento e localização',
    description: 'Área atendida, endereço, horários, telefone, e-mail e mapa.',
    icon: MapPin,
    single: true,
    fields: heading,
    starter: { name: 'Atendimento', slug: 'atendimento', eyebrow: 'Atendimento', title: 'Onde atendemos' },
  },
  {
    type: 'faq',
    label: 'Perguntas frequentes',
    description: 'Dúvidas comuns antes de contratar. Cada pergunta abre a resposta.',
    icon: CircleHelp,
    hiddenWhenEmpty: true,
    fields: { eyebrow: heading.eyebrow, title: heading.title, body: { label: 'Texto (opcional)' } },
    options: [themeOption],
    list: {
      title: 'Perguntas',
      itemName: 'pergunta',
      titleField: 'title',
      fields: [
        { key: 'title', label: 'Pergunta', type: 'text', required: true, maxLength: 200 },
        { key: 'description', label: 'Resposta', type: 'textarea', required: true, maxLength: 1500, rows: 4 },
        visibleField,
      ],
      defaults: { visible: true },
      emptyText: 'Nenhuma pergunta cadastrada. A seção está oculta no site.',
    },
    starter: { name: 'Perguntas frequentes', slug: 'duvidas', eyebrow: 'Dúvidas', title: 'Perguntas frequentes' },
  },
];

export const sectionTypeConfig = Object.fromEntries(SECTION_TYPE_CONFIG.map((c) => [c.type, c])) as Record<
  SectionType,
  SectionTypeConfig
>;

/** Opções da seção com os valores padrão do tipo preenchidos. */
export function withDefaultOptions(type: SectionType, options: unknown): Record<string, string | boolean> {
  const defs = sectionTypeConfig[type]?.options ?? [];
  const current = options && typeof options === 'object' && !Array.isArray(options) ? options : {};
  return Object.fromEntries(
    defs.map((d) => {
      const value = (current as Record<string, unknown>)[d.key];
      return [d.key, typeof value === typeof d.default ? (value as string | boolean) : d.default];
    }),
  );
}

/** "Sobre nós!" -> "sobre-nos": endereço (âncora) válido para a seção. */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

export const RESERVED_SLUGS = ['inicio', 'conteudo', 'admin'];

/** Endereço livre: acrescenta -2, -3... se já existir. */
export function uniqueSlug(base: string, taken: string[]): string {
  const root = slugify(base) || 'secao';
  const used = new Set([...taken, ...RESERVED_SLUGS]);
  if (!used.has(root)) return root;
  for (let n = 2; ; n++) {
    const candidate = `${root.slice(0, 40 - String(n).length - 1)}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}
