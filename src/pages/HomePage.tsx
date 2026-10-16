import { WhatsAppFloat } from '../components/WhatsAppFloat/WhatsAppFloat';
import { QuoteIntentProvider } from '../features/quote/QuoteIntentContext';
import { QuoteSection } from '../features/quote/QuoteSection';
import {
  EventsSection,
  FaqSection,
  GallerySection,
  PersonalizationSection,
  StepsSection,
  TestimonialsSection,
} from '../features/site/ContentSections';
import { Footer } from '../features/site/Footer';
import { Header } from '../features/site/Header';
import { HeroSection } from '../features/site/HeroSection';
import { LocationSection } from '../features/site/LocationSection';
import { SplitSection } from '../features/site/SplitSection';
import { StructuredData } from '../features/site/StructuredData';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useSiteContent } from '../hooks/useSiteContent';
import styles from './HomePage.module.css';

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin;

export function HomePage() {
  const { content, status } = useSiteContent();
  const { settings, sections } = content;

  useDocumentMeta({
    title: settings.seoTitle,
    description: settings.seoDescription,
    image: settings.ogImage?.src,
    url: SITE_URL,
  });

  return (
    <QuoteIntentProvider>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Header />
      <main
        id="conteudo"
        className={status === 'loading' ? styles.loading : undefined}
        aria-busy={status === 'loading'}
      >
        <span id="inicio" />
        <HeroSection />
        <SplitSection id="experiencia" section={sections.experience} />
        <EventsSection />
        <SplitSection section={sections.flavors} imageRight contain />
        <PersonalizationSection />
        <StepsSection />
        <GallerySection />
        <TestimonialsSection />
        <QuoteSection />
        <LocationSection />
        <FaqSection />
      </main>
      <Footer />
      <WhatsAppFloat
        number={settings.whatsappNumber}
        greeting={settings.whatsappGreeting}
        hideWhenVisibleId="orcamento"
      />
      <StructuredData content={content} siteUrl={SITE_URL} />
    </QuoteIntentProvider>
  );
}
