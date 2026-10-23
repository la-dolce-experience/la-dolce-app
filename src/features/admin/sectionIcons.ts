import {
  Award,
  Baby,
  Building2,
  Cake,
  CalendarDays,
  Camera,
  CircleHelp,
  ClipboardList,
  Clock,
  Gift,
  GlassWater,
  Heart,
  HeartHandshake,
  IceCreamBowl,
  IceCreamCone,
  Images,
  Info,
  LayoutGrid,
  ListChecks,
  ListOrdered,
  MapPin,
  Megaphone,
  MessageSquareQuote,
  Music,
  Palette,
  PanelsTopLeft,
  PartyPopper,
  Phone,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { SectionType } from '../../types/content';
import { sectionTypeConfig } from './sectionTypes';

export interface SectionIconOption {
  /** Nome gravado em sections.icon. */
  key: string;
  /** Descrição do ícone (leitores de tela e dica ao passar o mouse). */
  label: string;
  icon: LucideIcon;
}

/** Ícones que a pessoa pode escolher para uma seção no menu lateral do painel. */
export const SECTION_ICONS: SectionIconOption[] = [
  { key: 'sparkles', label: 'Brilho', icon: Sparkles },
  { key: 'heart-handshake', label: 'Aperto de mão', icon: HeartHandshake },
  { key: 'party-popper', label: 'Festa', icon: PartyPopper },
  { key: 'ice-cream-cone', label: 'Casquinha', icon: IceCreamCone },
  { key: 'ice-cream-bowl', label: 'Taça de sorvete', icon: IceCreamBowl },
  { key: 'palette', label: 'Paleta de cores', icon: Palette },
  { key: 'list-ordered', label: 'Lista numerada', icon: ListOrdered },
  { key: 'list-checks', label: 'Lista de itens', icon: ListChecks },
  { key: 'camera', label: 'Câmera', icon: Camera },
  { key: 'images', label: 'Fotos', icon: Images },
  { key: 'message-square-quote', label: 'Depoimento', icon: MessageSquareQuote },
  { key: 'clipboard-list', label: 'Formulário', icon: ClipboardList },
  { key: 'map-pin', label: 'Localização', icon: MapPin },
  { key: 'circle-help', label: 'Dúvida', icon: CircleHelp },
  { key: 'layout-grid', label: 'Grade', icon: LayoutGrid },
  { key: 'shopping-bag', label: 'Sacola', icon: ShoppingBag },
  { key: 'panels-top-left', label: 'Texto com imagem', icon: PanelsTopLeft },
  { key: 'cake', label: 'Bolo', icon: Cake },
  { key: 'gift', label: 'Presente', icon: Gift },
  { key: 'glass-water', label: 'Bebida', icon: GlassWater },
  { key: 'baby', label: 'Infantil', icon: Baby },
  { key: 'building-2', label: 'Empresa', icon: Building2 },
  { key: 'users', label: 'Pessoas', icon: Users },
  { key: 'calendar-days', label: 'Calendário', icon: CalendarDays },
  { key: 'clock', label: 'Horário', icon: Clock },
  { key: 'truck', label: 'Entrega', icon: Truck },
  { key: 'music', label: 'Música', icon: Music },
  { key: 'megaphone', label: 'Novidade', icon: Megaphone },
  { key: 'tag', label: 'Preço', icon: Tag },
  { key: 'star', label: 'Estrela', icon: Star },
  { key: 'award', label: 'Prêmio', icon: Award },
  { key: 'heart', label: 'Coração', icon: Heart },
  { key: 'info', label: 'Informação', icon: Info },
  { key: 'phone', label: 'Telefone', icon: Phone },
];

const byKey = new Map(SECTION_ICONS.map((i) => [i.key, i]));

/** Ícone padrão de um tipo de seção, como opção do catálogo. */
export function defaultIconKey(type: SectionType): string {
  const icon = sectionTypeConfig[type]?.icon;
  return SECTION_ICONS.find((i) => i.icon === icon)?.key ?? 'panels-top-left';
}

/** Ícone da seção no menu: o escolhido no painel ou, sem escolha (ou com um nome desconhecido), o do tipo. */
export function sectionIcon(section: { type: string; icon?: string | null }): LucideIcon {
  return (
    (section.icon && byKey.get(section.icon)?.icon) ||
    sectionTypeConfig[section.type as SectionType]?.icon ||
    PanelsTopLeft
  );
}
