import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WIDTHS = [360, 390, 768, 1024, 1440];

/** Captura window.open em vez de sair para o WhatsApp. */
async function captureWindowOpen(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __opened: string[] }).__opened = [];
    window.open = (url?: string | URL) => {
      (window as unknown as { __opened: string[] }).__opened.push(String(url));
      return null;
    };
  });
}

function collectCspErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && /Content Security Policy|Refused to/i.test(m.text())) errors.push(m.text());
  });
  return errors;
}

test.describe('Responsividade', () => {
  for (const width of WIDTHS) {
    test(`${width}px: sem rolagem horizontal, navegação adequada e CTA visível`, async ({ page }) => {
      await page.setViewportSize({ width, height: 860 });
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);

      const toggle = page.getByRole('button', { name: 'Abrir menu' });
      if (width < 960) await expect(toggle).toBeVisible();
      else await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible();

      // O botão flutuante do WhatsApp não cobre o CTA principal na primeira dobra.
      const cta = await page.getByRole('link', { name: 'Solicitar orçamento' }).first().boundingBox();
      const float = await page.getByRole('link', { name: /Conversar pelo WhatsApp/ }).boundingBox();
      const overlaps =
        cta &&
        float &&
        cta.x < float.x + float.width &&
        float.x < cta.x + cta.width &&
        cta.y < float.y + float.height &&
        float.y < cta.y + cta.height;
      expect(overlaps).toBeFalsy();

      // Alvos de toque com tamanho confortável.
      const submit = await page.getByRole('button', { name: /Solicitar orçamento pelo WhatsApp/ }).boundingBox();
      expect(submit!.height).toBeGreaterThanOrEqual(44);
    });
  }

  test('menu móvel navega até a seção e fecha', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('navigation', { name: 'Menu móvel' }).getByRole('link', { name: 'Galeria' }).click();
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('heading', { name: /Produto bonito/ })).toBeInViewport();
  });
});

test.describe('WhatsApp', () => {
  test('botão flutuante tem o link e a mensagem inicial corretos', async ({ page }) => {
    await page.goto('/');
    const href = await page.getByRole('link', { name: /Conversar pelo WhatsApp/ }).getAttribute('href');
    const url = new URL(href!);
    expect(url.host).toBe('wa.me');
    expect(url.pathname).toBe('/5511920102743');
    expect(url.searchParams.get('text')).toBe('Olá! Vim pelo site e quero tirar algumas dúvidas.');
  });

  test('formulário monta a mensagem de orçamento com acentos e quebras de linha', async ({ page }) => {
    await captureWindowOpen(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const form = page.locator('#orcamento form');
    await form.getByLabel(/^Nome/).fill('José Antônio');
    await form.getByLabel(/WhatsApp para retorno/).fill('11987654321');
    await form.getByLabel(/Tipo de evento/).selectOption('Evento social');
    await form.getByLabel(/Cidade ou local/).fill('Moóca, São Paulo');
    await form.getByLabel(/Conte um pouco/).fill('Aniversário de 15 anos 🎉\nTema: rosa & dourado');
    await page.waitForTimeout(1600); // tempo mínimo anti-bot
    await form.getByRole('button', { name: /Solicitar orçamento pelo WhatsApp/ }).click();

    const opened = await page.evaluate(() => (window as unknown as { __opened: string[] }).__opened);
    expect(opened).toHaveLength(1);
    const text = new URL(opened[0]).searchParams.get('text')!;
    expect(text).toContain('Nome: José Antônio');
    expect(text).toContain('Contato: (11) 98765-4321');
    expect(text).toContain('Local: Moóca, São Paulo');
    expect(text).toContain('Descrição: Aniversário de 15 anos 🎉\nTema: rosa & dourado');
    expect(text).not.toContain('E-mail:');
    await expect(form.getByRole('status')).toContainText('toque em Enviar');
  });

  test('erros de validação aparecem e os dados são mantidos', async ({ page }) => {
    await captureWindowOpen(page);
    await page.goto('/');
    const form = page.locator('#orcamento form');
    await form.getByLabel(/E-mail/).fill('invalido@');
    await page.waitForTimeout(1600);
    await form.getByRole('button', { name: /Solicitar orçamento pelo WhatsApp/ }).click();
    await expect(form.getByRole('alert')).toContainText('Corrija os 4 campos destacados');
    await expect(form.getByLabel(/^Nome/)).toBeFocused();
    await expect(form.getByLabel(/E-mail/)).toHaveValue('invalido@');
    expect(await page.evaluate(() => (window as unknown as { __opened: string[] }).__opened)).toHaveLength(0);
  });
});

test.describe('Robustez, SEO e segurança', () => {
  test('com o banco indisponível, o site continua no ar com o conteúdo padrão', async ({ page }) => {
    await page.route('**/rest/v1/**', (route) => route.abort('failed'));
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('A sorveteria mais desejada do seu evento.');
    await expect(page.getByRole('link', { name: /Conversar pelo WhatsApp/ })).toBeVisible();
  });

  test('carrega o conteúdo do banco sem violar a CSP', async ({ page }) => {
    const cspErrors = collectCspErrors(page);
    const response = page.waitForResponse((r) => r.url().includes('/rest/v1/sections') && r.status() === 200);
    await page.goto('/');
    await response;
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(cspErrors).toEqual([]);
  });

  test('metatags, dados estruturados, robots e sitemap', async ({ page, request }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/La Dolce Experience/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/images\/og-la-dolce\.jpg$/);
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(ld['@type']).toBe('IceCreamShop');
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /admin');
    expect((await request.get('/sitemap.xml')).ok()).toBe(true);
  });

  test('rota inexistente mostra página 404 sem indexação', async ({ page }) => {
    await page.goto('/pagina-que-nao-existe');
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('headers de segurança presentes', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(res.headers()['x-content-type-options']).toBe('nosniff');
  });
});

test.describe('Acessibilidade', () => {
  test('página inicial sem violações graves (axe)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });

  test('navegação por teclado: link de pular conteúdo e foco visível', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Tab');
    const shadow = await page.evaluate(() => getComputedStyle(document.activeElement!).boxShadow);
    expect(shadow).not.toBe('none');
  });

  test('respeita a preferência por movimento reduzido', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  });
});
