import type { SiteContent } from '../types/content';
import { hasPhysicalAddress, safeExternalUrl } from './location';

/** Dados estruturados (schema.org) para o Google entender o negócio. */
export function buildStructuredData(content: SiteContent, siteUrl: string) {
  const s = content.settings;
  const abs = (path?: string) => (path ? new URL(path, siteUrl).toString() : undefined);
  const sameAs = [s.instagramUrl, s.facebookUrl, s.tiktokUrl].map(safeExternalUrl).filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'IceCreamShop',
    name: s.businessName,
    description: s.seoDescription,
    url: siteUrl,
    image: abs(s.ogImage?.src ?? content.sections.hero.image?.src),
    logo: abs(s.logo.src),
    telephone: `+${s.whatsappNumber}`,
    ...(s.email && { email: s.email }),
    ...(s.serviceArea && { areaServed: s.serviceArea }),
    ...(hasPhysicalAddress(s) && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: s.addressStreet,
        addressLocality: s.city,
        addressRegion: s.state,
        postalCode: s.postalCode || undefined,
        addressCountry: 'BR',
      },
    }),
    ...(sameAs.length > 0 && { sameAs }),
  };
}
