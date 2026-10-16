import { useEffect } from 'react';

interface Meta {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  noindex?: boolean;
}

function setMeta(attr: 'name' | 'property', key: string, value: string | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!value) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

function absolute(url: string | undefined) {
  if (!url) return undefined;
  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return undefined;
  }
}

/**
 * Atualiza título e metatags da página. As versões estáticas em index.html
 * (geradas no build) atendem robôs que não executam JavaScript.
 */
export function useDocumentMeta({ title, description, image, url, noindex }: Meta) {
  useEffect(() => {
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', absolute(image));
    setMeta('property', 'og:url', absolute(url));
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', absolute(image));
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
  }, [title, description, image, url, noindex]);
}
