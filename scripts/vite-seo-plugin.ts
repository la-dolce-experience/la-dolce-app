import type { Plugin } from 'vite';

interface Options {
  siteUrl: string;
  supabaseUrl?: string;
  anonKey?: string;
}

interface SeoData {
  title: string;
  description: string;
  image: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Busca título, descrição e imagem de compartilhamento cadastrados no painel. */
async function fetchSeo({ siteUrl, supabaseUrl, anonKey }: Options): Promise<SeoData | null> {
  if (!supabaseUrl || !anonKey) return null;
  const select = 'seo_title,seo_description,og:media!site_settings_og_media_id_fkey(src_lg)';
  const res = await fetch(`${supabaseUrl}/rest/v1/site_settings?id=eq.1&select=${encodeURIComponent(select)}`, {
    headers: { apikey: anonKey },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const [row] = (await res.json()) as { seo_title: string; seo_description: string; og: { src_lg: string } | null }[];
  if (!row) return null;
  const path = row.og?.src_lg;
  const image = !path
    ? `${siteUrl}/images/og-la-dolce.jpg`
    : path.startsWith('/')
      ? `${siteUrl}${path}`
      : /^https?:/.test(path)
        ? path
        : `${supabaseUrl}/storage/v1/object/public/media/${path}`;
  return { title: row.seo_title, description: row.seo_description, image };
}

/**
 * No build de produção:
 * - grava no index.html o SEO cadastrado no painel (WhatsApp/Facebook/LinkedIn não executam JS);
 * - gera robots.txt e sitemap.xml com a URL pública do site.
 * Se o banco não responder, mantém os valores padrão do index.html.
 */
export function seoPlugin(options: Options): Plugin {
  let seo: SeoData | null = null;
  return {
    name: 'la-dolce-seo',
    // Só no build do navegador; o build de pré-renderização (--ssr) não gera HTML.
    apply: (config, { command }) => command === 'build' && !config.build?.ssr,
    async buildStart() {
      try {
        seo = await fetchSeo(options);
        if (seo) this.info?.(`SEO carregado do banco: "${seo.title}"`);
      } catch (e) {
        this.warn(`Não foi possível buscar o SEO no banco (${(e as Error).message}); usando valores padrão.`);
      }
    },
    transformIndexHtml(html) {
      // Abre a conexão com o banco enquanto o JavaScript ainda baixa (o conteúdo vem de lá).
      if (options.supabaseUrl) {
        const origin = escapeHtml(new URL(options.supabaseUrl).origin);
        html = html.replace(
          '</title>',
          `</title>
    <link rel="preconnect" href="${origin}" crossorigin />`,
        );
      }
      if (!seo) return html;
      const t = escapeHtml(seo.title);
      const d = escapeHtml(seo.description);
      const img = escapeHtml(seo.image);
      return html
        .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
        .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${d}$2`)
        .replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/, `$1${t}$2`)
        .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${d}$2`)
        .replace(/(<meta\s+property="og:image"\s+content=")[^"]*(")/, `$1${img}$2`);
    },
    generateBundle() {
      const { siteUrl } = options;
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${siteUrl}/</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n  </url>\n</urlset>\n`,
      });
    },
  };
}
