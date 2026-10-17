import { useEffect } from 'react';
import { PreviewBanner } from '../components/PreviewBanner/PreviewBanner';
import { WhatsAppFloat } from '../components/WhatsAppFloat/WhatsAppFloat';
import { QuoteIntentProvider } from '../features/quote/QuoteIntentContext';
import { QuoteSection } from '../features/quote/QuoteSection';
import { EventsSection, FaqSection, PersonalizationSection, StepsSection } from '../features/site/ContentSections';
import { FlavorsSection } from '../features/site/FlavorsSection';
import { Footer } from '../features/site/Footer';
import { GallerySection } from '../features/site/GallerySection';
import { Header } from '../features/site/Header';
import { HeroSection } from '../features/site/HeroSection';
import { LocationSection } from '../features/site/LocationSection';
import { SplitSection } from '../features/site/SplitSection';
import { StructuredData } from '../features/site/StructuredData';
import { TestimonialsSection } from '../features/site/TestimonialsSection';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useSiteContent } from '../hooks/useSiteContent';
import { listenWhatsAppClicks, trackVisit } from '../lib/metrics';
import { isEmbeddedPreview, isPreviewMode } from '../lib/preview';
import styles from './HomePage.module.css';

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin;

export function HomePage() {
  const { content, status } = useSiteContent();
  const preview = isPreviewMode();
  const embedded = isEmbeddedPreview();
  const { settings, sections } = content;

  useDocumentMeta({
    title: settings.seoTitle,
    description: settings.seoDescription,
    image: settings.ogImage?.src,
    url: SITE_URL,
    noindex: preview,
  });

  // Estatística anônima: visita e cliques nos botões de WhatsApp (ver lib/metrics).
  useEffect(() => {
    trackVisit();
    return listenWhatsAppClicks();
  }, []);

  // Na pré-visualização, a seção editada só existe depois que o conteúdo carrega: rola até ela nesse momento.
  useEffect(() => {
    if (!preview || status !== 'ready' || !window.location.hash) return;
    document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView({ block: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, status === 'ready']);

  return (
    <QuoteIntentProvider>
      {preview && !embedded && <PreviewBanner />}
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
        <FlavorsSection />
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
