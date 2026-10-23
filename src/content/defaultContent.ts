import type { ImageRef, Section, SectionItem, SiteContent } from '../types/content';

/**
 * Conteúdo REAL extraído do site original (benevolent-dodol-11d90b.netlify.app).
 * Serve como fallback quando o Supabase não está configurado ou não responde,
 * e como base do seed inicial do banco (la-dolce-data/seed/seed.sql).
 * Não adicione aqui informações comerciais que o cliente não confirmou.
 */

function staticImage(name: string, alt: string, variants: [w: number, h: number][]): ImageRef {
  const [small, large] = variants;
  return {
    src: `/images/${name}-1600.webp`,
    srcSet: `/images/${name}-800.webp ${small[0]}w, /images/${name}-1600.webp ${large[0]}w`,
    alt,
    width: large[0],
    height: large[1],
  };
}

export const IMAGES = {
  station: staticImage('estacao-balcao', 'Balcão rosa da La Dolce Experience montado para eventos', [
    [800, 640],
    [1402, 1122],
  ]),
  cup: staticImage('copinho-la-dolce-soft', 'Sorvete La Dolce servido em copinho rosa com toppings coloridos', [
    [533, 800],
    [1066, 1600],
  ]),
  cone: staticImage('casquinha-morango', 'Casquinha de sorvete soft de morango', [
    [297, 800],
    [594, 1600],
  ]),
};

const item = (id: string, title: string, patch: Partial<SectionItem> = {}): SectionItem => ({
  id,
  title,
  description: '',
  label: '',
  image: null,
  photos: [],
  rating: 5,
  ...patch,
});

const base = {
  navLabel: '',
  eyebrow: '',
  title: '',
  body: '',
  ctaLabel: '',
  note: '',
  imageCaption: '',
  image: null,
  options: {},
  items: [],
} satisfies Partial<Section>;

/** Na mesma ordem e com os mesmos endereços (âncoras) do seed. */
const sections: Section[] = [
  {
    ...base,
    id: 'destaque',
    type: 'hero',
    slug: 'destaque',
    eyebrow: 'Sorveteria premium para eventos',
    title: 'A sorveteria mais desejada do seu evento.',
    body: 'Levamos uma estação elegante de sorvete soft premium para aniversários, casamentos, eventos corporativos, feiras e celebrações especiais.',
    ctaLabel: 'Solicitar orçamento',
    note: 'Atendimento personalizado em São Paulo',
    imageCaption: 'Uma atração doce, elegante e fotografável.',
    image: IMAGES.station,
    options: { whatsappLabel: 'Tirar dúvidas no WhatsApp' },
  },
  {
    ...base,
    id: 'experiencia',
    type: 'texto_imagem',
    slug: 'experiencia',
    navLabel: 'Experiência',
    eyebrow: 'Mais que sobremesa',
    title: 'Uma experiência que vira assunto.',
    body: 'Cada detalhe foi pensado para surpreender seus convidados: a apresentação, o serviço, os toppings, a cremosidade e a possibilidade de personalizar a estação para combinar com a identidade do seu evento.',
    image: IMAGES.cup,
    options: { imagePosition: 'esquerda', imageFit: 'cortada' },
  },
  {
    ...base,
    id: 'eventos',
    type: 'cartoes',
    slug: 'eventos',
    navLabel: 'Eventos',
    eyebrow: 'Para diferentes ocasiões',
    title: 'Levamos a La Dolce Experience até você.',
    body: 'Uma operação compacta, charmosa e memorável para eventos sociais e corporativos.',
    ctaLabel: 'Solicitar orçamento para meu evento',
    options: { linkLabel: 'Pedir orçamento' },
    items: [
      item('corporativo', 'Eventos corporativos', {
        description: 'Confraternizações, lançamentos, ativações de marca, festas internas e ações para clientes.',
        label: 'Evento corporativo',
      }),
      item('feiras', 'Feiras e exposições', {
        description:
          'Uma forma elegante de atrair visitantes, gerar conversa e transformar o estande em ponto de desejo.',
        label: 'Feira ou exposição',
      }),
      item('social', 'Eventos sociais', {
        description: 'Casamentos, aniversários, formaturas e celebrações nas quais cada detalhe precisa encantar.',
        label: 'Evento social',
      }),
    ],
  },
  {
    ...base,
    id: 'sabores',
    type: 'texto_imagem',
    slug: 'sabores',
    eyebrow: 'Sabores e apresentação',
    title: 'Sorvete servido na hora, com presença de marca.',
    body: 'Do copinho à casquinha, dos toppings aos detalhes visuais, a experiência pode ser adaptada ao clima da festa ou à identidade da empresa. O resultado é um serviço bonito, gostoso e altamente compartilhável.',
    image: IMAGES.cone,
    options: { imagePosition: 'direita', imageFit: 'inteira' },
  },
  {
    ...base,
    id: 'lista-de-sabores',
    type: 'catalogo',
    slug: 'lista-de-sabores',
    options: { imagePosition: 'direita', listTitle: 'Sabores' },
  },
  {
    ...base,
    id: 'apresentacoes',
    type: 'catalogo',
    slug: 'apresentacoes',
    options: { imagePosition: 'direita', listTitle: 'Apresentações' },
    items: [item('p1', 'Copinho', { image: IMAGES.cup }), item('p2', 'Casquinha', { image: IMAGES.cone })],
  },
  {
    ...base,
    id: 'personalizacao',
    type: 'destaques',
    slug: 'personalizacao',
    eyebrow: 'Personalização',
    title: 'Seu evento, com a sua cara.',
    body: 'Podemos adaptar a experiência para criar uma entrega mais exclusiva, alinhada ao perfil dos convidados e ao objetivo da celebração.',
    ctaLabel: 'Conversar sobre personalização',
    items: [
      item('f1', 'Copinhos e comunicação visual'),
      item('f2', 'Toppings e combinações especiais'),
      item('f3', 'Estação elegante e instagramável'),
      item('f4', 'Atendimento direto e personalizado'),
    ],
  },
  {
    ...base,
    id: 'como-funciona',
    type: 'etapas',
    slug: 'como-funciona',
    eyebrow: 'Como funciona',
    title: 'Do primeiro contato ao dia do evento.',
  },
  {
    ...base,
    id: 'galeria',
    type: 'galeria',
    slug: 'galeria',
    navLabel: 'Galeria',
    eyebrow: 'Galeria',
    title: 'Produto bonito antes mesmo da primeira colherada.',
    items: [
      item('g1', '', { image: { ...IMAGES.station, alt: 'Balcão La Dolce Experience para eventos' } }),
      item('g2', '', { image: { ...IMAGES.cup, alt: 'Sorvete no copinho La Dolce Soft' } }),
      item('g3', '', { image: { ...IMAGES.cone, alt: 'Casquinha de sorvete soft La Dolce' } }),
    ],
  },
  {
    ...base,
    id: 'depoimentos',
    type: 'depoimentos',
    slug: 'depoimentos',
    eyebrow: 'Depoimentos',
    title: 'Quem já viveu a experiência',
  },
  {
    ...base,
    id: 'orcamento',
    type: 'formulario',
    slug: 'orcamento',
    navLabel: 'Pedir orçamento',
    eyebrow: 'Solicite um orçamento',
    title: 'Vamos criar uma experiência inesquecível?',
    body: 'Preencha os dados do seu evento. Ao enviar, abriremos uma conversa no WhatsApp com todas as informações organizadas para agilizar seu atendimento.',
    ctaLabel: 'Solicitar orçamento pelo WhatsApp',
    options: {
      subjectLabel: 'Tipo de evento',
      showDate: true,
      dateLabel: 'Data prevista',
      showQuantity: true,
      quantityLabel: 'Nº estimado de convidados',
      showLocation: true,
      locationLabel: 'Cidade ou local do evento',
      messageLabel: 'Conte um pouco sobre o evento',
    },
  },
  {
    ...base,
    id: 'atendimento',
    type: 'contato',
    slug: 'atendimento',
    navLabel: 'Atendimento',
    eyebrow: 'Atendimento',
    title: 'Onde atendemos',
    body: 'Levamos a estação até o local do seu evento.',
  },
  {
    ...base,
    id: 'duvidas',
    type: 'faq',
    slug: 'duvidas',
    navLabel: 'Dúvidas',
    eyebrow: 'Dúvidas frequentes',
    title: 'Perguntas frequentes',
  },
];

export const defaultContent: SiteContent = {
  settings: {
    businessName: 'La Dolce Experience',
    footerTagline: 'Sorveteria premium para eventos sociais e corporativos.',
    logo: {
      src: '/images/logo.webp',
      srcSet: '/images/logo-280.webp 280w, /images/logo.webp 480w',
      alt: 'La Dolce Experience',
      width: 480,
      height: 303,
    },
    whatsappNumber: '5511920102743',
    whatsappGreeting: 'Olá! Vim pelo site e quero tirar algumas dúvidas.',
    phone: '',
    email: '',
    instagramUrl: '',
    facebookUrl: '',
    tiktokUrl: '',
    addressStreet: '',
    addressDistrict: '',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '',
    serviceArea: 'Atendimento personalizado em São Paulo',
    openingHours: '',
    mapsUrl: '',
    showMap: false,
    seoTitle: 'La Dolce Experience | Sorveteria Premium para Eventos',
    seoDescription:
      'Leve uma sorveteria premium para seu evento corporativo, feira, casamento, aniversário ou celebração social.',
    ogImage: { src: '/images/og-la-dolce.jpg', alt: 'Estação La Dolce Experience', width: 1200, height: 630 },
  },
  sections,
};
