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

export const SECTION_KEYS = [
  'hero',
  'experience',
  'events',
  'flavors',
  'personalization',
  'steps',
  'gallery',
  'testimonials',
  'quote',
  'location',
  'faq',
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export interface Section {
  key: SectionKey;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  /** Texto curto auxiliar (ex.: nota ao lado do CTA no hero). */
  note: string;
  /** Legenda sobreposta à imagem (ex.: selo do hero). */
  imageCaption: string;
  image: ImageRef | null;
  visible: boolean;
}

export interface SiteSettings {
  businessName: string;
  footerTagline: string;
  logo: ImageRef;
  /** Somente dígitos, com DDI e DDD. Ex.: 5511920102743 */
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

export interface EventType {
  id: string;
  title: string;
  description: string;
  /** Rótulo usado no campo "Tipo de evento" do formulário. */
  formLabel: string;
}

export interface Feature {
  id: string;
  label: string;
}

export interface Step {
  id: string;
  title: string;
  description: string;
}

export interface GalleryItem {
  id: string;
  image: ImageRef;
  caption: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export interface Testimonial {
  id: string;
  author: string;
  context: string;
  quote: string;
}

export interface SiteContent {
  settings: SiteSettings;
  sections: Record<SectionKey, Section>;
  eventTypes: EventType[];
  features: Feature[];
  steps: Step[];
  gallery: GalleryItem[];
  faqs: Faq[];
  testimonials: Testimonial[];
}
