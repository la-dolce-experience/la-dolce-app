/** Imagem pronta para renderização (URL pública + variantes responsivas). */
export interface ImageRef {
  /** id da tabela `media` (ausente nas imagens estáticas do fallback). */
  mediaId?: string | null;
  src: string;
  srcSet?: string;
  alt: string;
  width?: number;
  height?: number;
}

/** Tipos de seção que o site sabe desenhar (mesma lista do check em sections.type no banco). */
export const SECTION_TYPES = [
  'hero',
  'texto_imagem',
  'cartoes',
  'catalogo',
  'destaques',
  'etapas',
  'galeria',
  'depoimentos',
  'formulario',
  'contato',
  'faq',
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

/** Opções específicas do tipo (lado da foto, campos do formulário...), gravadas em sections.options. */
export type SectionOptions = Record<string, string | boolean>;

/**
 * Item da lista de uma seção. Cada tipo usa só alguns campos:
 * cartões (title, description, label = opção no formulário), depoimentos (title = autor, label = contexto,
 * description = texto, rating, image = foto de perfil, photos), FAQ (title = pergunta, description = resposta)...
 */
export interface SectionItem {
  id: string;
  title: string;
  description: string;
  label: string;
  image: ImageRef | null;
  /** Fotos extras (até 5), na ordem escolhida no painel. */
  photos: ImageRef[];
  /** Nota de 1 a 5 estrelas (depoimentos). */
  rating: number;
}

export interface Section {
  id: string;
  type: SectionType;
  /** Âncora da seção no site (#slug). */
  slug: string;
  /** Item do menu do site ('' = fora do menu). */
  navLabel: string;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  /** Texto curto auxiliar (ex.: nota abaixo dos botões no destaque). */
  note: string;
  /** Legenda sobreposta à imagem (ex.: selo do destaque). */
  imageCaption: string;
  image: ImageRef | null;
  options: SectionOptions;
  /** Itens visíveis, na ordem do site. */
  items: SectionItem[];
}

export interface SiteSettings {
  businessName: string;
  footerTagline: string;
  /** Sem logotipo, o cabeçalho e o rodapé mostram o nome do negócio. */
  logo: ImageRef | null;
  /** Somente dígitos, com DDI e DDD. Ex.: 5511999999999 */
  whatsappNumber: string;
  whatsappGreeting: string;
  phone: string;
  email: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  addressStreet: string;
  addressDistrict: string;
  city: string;
  state: string;
  postalCode: string;
  serviceArea: string;
  openingHours: string;
  mapsUrl: string;
  showMap: boolean;
  seoTitle: string;
  seoDescription: string;
  ogImage: ImageRef | null;
}

export interface SiteContent {
  settings: SiteSettings;
  /** Seções visíveis, na ordem da página. */
  sections: Section[];
}
