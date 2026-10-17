import type { ImageRef, Section, SectionKey, SiteContent } from '../types/content';

/**
 * Conteúdo REAL extraído do site original (benevolent-dodol-11d90b.netlify.app).
 * Serve como fallback quando o Supabase não está configurado ou não responde,
 * e como base do seed inicial do banco (supabase/seed.sql).
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

const empty: Omit<Section, 'key'> = {
  eyebrow: '',
  title: '',
  body: '',
  ctaLabel: '',
  note: '',
  imageCaption: '',
  image: null,
  visible: true,
};

const sections: Record<SectionKey, Section> = {
  hero: {
    ...empty,
    key: 'hero',
    eyebrow: 'Sorveteria premium para eventos',
    title: 'A sorveteria mais desejada do seu evento.',
    body: 'Levamos uma estação elegante de sorvete soft premium para aniversários, casamentos, eventos corporativos, feiras e celebrações especiais.',
    ctaLabel: 'Solicitar orçamento',
    note: 'Atendimento personalizado em São Paulo',
    imageCaption: 'Uma atração doce, elegante e fotografável.',
    image: IMAGES.station,
  },
  experience: {
    ...empty,
    key: 'experience',
    eyebrow: 'Mais que sobremesa',
    title: 'Uma experiência que vira assunto.',
    body: 'Cada detalhe foi pensado para surpreender seus convidados: a apresentação, o serviço, os toppings, a cremosidade e a possibilidade de personalizar a estação para combinar com a identidade do seu evento.',
    image: IMAGES.cup,
  },
  events: {
    ...empty,
    key: 'events',
    eyebrow: 'Para diferentes ocasiões',
    title: 'Levamos a La Dolce Experience até você.',
    body: 'Uma operação compacta, charmosa e memorável para eventos sociais e corporativos.',
    ctaLabel: 'Solicitar orçamento para meu evento',
  },
  flavors: {
    ...empty,
    key: 'flavors',
    eyebrow: 'Sabores e apresentação',
    title: 'Sorvete servido na hora, com presença de marca.',
    body: 'Do copinho à casquinha, dos toppings aos detalhes visuais, a experiência pode ser adaptada ao clima da festa ou à identidade da empresa. O resultado é um serviço bonito, gostoso e altamente compartilhável.',
    image: IMAGES.cone,
  },
  personalization: {
    ...empty,
    key: 'personalization',
    eyebrow: 'Personalização',
    title: 'Seu evento, com a sua cara.',
    body: 'Podemos adaptar a experiência para criar uma entrega mais exclusiva, alinhada ao perfil dos convidados e ao objetivo da celebração.',
    ctaLabel: 'Conversar sobre personalização',
  },
  steps: { ...empty, key: 'steps', eyebrow: 'Como funciona', title: 'Do primeiro contato ao dia do evento.' },
  gallery: {
    ...empty,
    key: 'gallery',
    eyebrow: 'Galeria',
    title: 'Produto bonito antes mesmo da primeira colherada.',
  },
  testimonials: { ...empty, key: 'testimonials', eyebrow: 'Depoimentos', title: 'Quem já viveu a experiência' },
  quote: {
    ...empty,
    key: 'quote',
    eyebrow: 'Solicite um orçamento',
    title: 'Vamos criar uma experiência inesquecível?',
    body: 'Preencha os dados do seu evento. Ao enviar, abriremos uma conversa no WhatsApp com todas as informações organizadas para agilizar seu atendimento.',
    ctaLabel: 'Solicitar orçamento pelo WhatsApp',
  },
  location: {
    ...empty,
    key: 'location',
    eyebrow: 'Atendimento',
    title: 'Onde atendemos',
    body: 'Levamos a estação até o local do seu evento.',
  },
  faq: { ...empty, key: 'faq', eyebrow: 'Dúvidas frequentes', title: 'Perguntas frequentes' },
};

export const defaultContent: SiteContent = {
  settings: {
    businessName: 'La Dolce Experience',
    footerTagline: 'Sorveteria premium para eventos sociais e corporativos.',
    logo: { src: '/images/logo.webp', alt: 'La Dolce Experience', width: 480, height: 303 },
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
  eventTypes: [
    {
      id: 'corporativo',
      title: 'Eventos corporativos',
      description: 'Confraternizações, lançamentos, ativações de marca, festas internas e ações para clientes.',
      formLabel: 'Evento corporativo',
    },
    {
      id: 'feiras',
      title: 'Feiras e exposições',
      description:
        'Uma forma elegante de atrair visitantes, gerar conversa e transformar o estande em ponto de desejo.',
      formLabel: 'Feira ou exposição',
    },
    {
      id: 'social',
      title: 'Eventos sociais',
      description: 'Casamentos, aniversários, formaturas e celebrações nas quais cada detalhe precisa encantar.',
      formLabel: 'Evento social',
    },
  ],
  features: [
    { id: 'f1', label: 'Copinhos e comunicação visual' },
    { id: 'f2', label: 'Toppings e combinações especiais' },
    { id: 'f3', label: 'Estação elegante e instagramável' },
    { id: 'f4', label: 'Atendimento direto e personalizado' },
  ],
  flavors: [],
  presentations: [
    { id: 'p1', title: 'Copinho', description: '', image: IMAGES.cup },
    { id: 'p2', title: 'Casquinha', description: '', image: IMAGES.cone },
  ],
  steps: [],
  gallery: [
    { id: 'g1', image: { ...IMAGES.station, alt: 'Balcão La Dolce Experience para eventos' }, caption: '' },
    { id: 'g2', image: { ...IMAGES.cup, alt: 'Sorvete no copinho La Dolce Soft' }, caption: '' },
    { id: 'g3', image: { ...IMAGES.cone, alt: 'Casquinha de sorvete soft La Dolce' }, caption: '' },
  ],
  faqs: [],
  testimonials: [],
};
