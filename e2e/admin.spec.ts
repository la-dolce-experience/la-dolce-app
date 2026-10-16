import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';

const EMAIL = process.env.E2E_ADMIN_EMAIL;
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.skip(!EMAIL || !PASSWORD, 'Defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD (admin do Supabase local).');

async function login(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel('E-mail').fill(EMAIL!);
  await page.getByLabel('Senha', { exact: false }).first().fill(PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible();
  // O tour abre no primeiro acesso; os outros testes não dependem dele.
  const tour = page.locator('#tour');
  if (await tour.count()) {
    const saved = waitForGuideSaved(page);
    await tour.getByRole('button', { name: 'Fechar tour' }).click();
    await saved;
  }
}

/** Espera o painel registrar na conta do usuário que o guia foi visto. */
const waitForGuideSaved = (page: Page) =>
  page.waitForResponse((r) => r.url().endsWith('/auth/v1/user') && r.request().method() === 'PUT' && r.ok());

test.describe('Acesso', () => {
  test('rotas do painel exigem login', async ({ page }) => {
    await page.goto('/admin/contato');
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('senha incorreta mostra mensagem clara', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('E-mail').fill(EMAIL!);
    await page.locator('#login-password').fill('SenhaErrada123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('alert')).toHaveText('E-mail ou senha incorretos.');
    await expect(page.locator('#login-password')).toHaveValue('');
  });

  test('login, sessão mantida após recarregar e logout', async ({ page }) => {
    await login(page);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible();
    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test('tela de login acessível (axe)', async ({ page }) => {
    await page.goto('/admin/login');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual([]);
  });
});

test.describe('Tour guiado e ajuda', () => {
  type Box = { x: number; y: number; width: number; height: number };
  const contains = (outer: Box, inner: Box) =>
    outer.x <= inner.x &&
    outer.y <= inner.y &&
    outer.x + outer.width >= inner.x + inner.width &&
    outer.y + outer.height >= inner.y + inner.height;
  /** Fração do destaque coberta pelo balão. */
  const coveredFraction = (card: Box, target: Box) =>
    (Math.max(0, Math.min(card.x + card.width, target.x + target.width) - Math.max(card.x, target.x)) *
      Math.max(0, Math.min(card.y + card.height, target.y + target.height) - Math.max(card.y, target.y))) /
    (target.width * target.height);

  /**
   * Confere que o destaque envolve o elemento e que o balão não o esconde. Em telas baixas, um elemento alto
   * pode não deixar lado livre; o balão então cobre só uma pequena parte dele.
   */
  async function expectSpotlightOn(page: Page, selector: string) {
    const target = page.locator(selector).first();
    const spotlight = page.locator('#tour [class*="spotlight"]');
    await expect
      .poll(async () => {
        const [s, t] = await Promise.all([spotlight.boundingBox(), target.boundingBox()]);
        return !!s && !!t && contains(s, t);
      })
      .toBe(true);
    const [card, t] = await Promise.all([page.getByRole('dialog').boundingBox(), target.boundingBox()]);
    expect(coveredFraction(card!, t!)).toBeLessThanOrEqual(0.1);
  }

  test('primeiro acesso: percorre o painel abrindo cada tela e não volta depois de concluído', async ({ page }) => {
    // Captura a URL e a chave pública do Supabase usadas pelo painel.
    const apiRequest = page.waitForRequest((r) => r.url().includes('/rest/v1/'));
    await login(page);
    const request = await apiRequest;
    const origin = new URL(request.url()).origin;
    const apikey = request.headers()['apikey'];

    // Simula um primeiro acesso: apaga o registro de que o tour foi visto.
    const token = await page.evaluate(() => {
      const key = Object.keys(localStorage).find((k) => /^sb-.+-auth-token$/.test(k))!;
      return JSON.parse(localStorage.getItem(key)!).access_token as string;
    });
    const reset = await page.request.put(`${origin}/auth/v1/user`, {
      headers: { apikey, Authorization: `Bearer ${token}` },
      data: { data: { onboarding_completed_at: null } },
    });
    expect(reset.ok()).toBe(true);
    await page.evaluate(() => {
      // A sessão salva no navegador também guarda os dados do usuário.
      const key = Object.keys(localStorage).find((k) => /^sb-.+-auth-token$/.test(k))!;
      const stored = JSON.parse(localStorage.getItem(key)!);
      delete stored.user.user_metadata.onboarding_completed_at;
      localStorage.setItem(key, JSON.stringify(stored));
    });
    await page.reload();

    const dialog = page.getByRole('dialog');
    const next = page.getByRole('button', { name: 'Próximo' });
    await expect(dialog).toHaveAccessibleName('Boas-vindas ao painel');
    await expect(dialog).toContainText('Passo 1 de 13');
    // Durante o tour, o restante do painel fica bloqueado para teclado e mouse.
    await expect(page.locator('#admin-main')).toHaveAttribute('inert', '');
    await expect(page.locator('#admin-sidebar')).toHaveAttribute('inert', '');
    const results = await new AxeBuilder({ page }).include('#tour').withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual([]);

    await next.click();
    await expect(dialog).toHaveAccessibleName('Visão geral');
    await expectSpotlightOn(page, '[data-tour="checklist"]');

    await next.click();
    await expect(dialog).toHaveAccessibleName('Página inicial, seção por seção');
    await expectSpotlightOn(page, '[data-tour="nav-sections"]');

    await next.click();
    await expect(page).toHaveURL(/\/admin\/secoes\/hero$/);
    await expect(dialog).toHaveAccessibleName('Textos e fotos');
    await expectSpotlightOn(page, '[data-tour="image-picker"]');

    await next.click();
    await expect(dialog).toHaveAccessibleName('Salvar alterações');
    await expectSpotlightOn(page, '[data-tour="save-bar"]');

    await next.click();
    await expect(dialog).toHaveAccessibleName('Conferir no site');
    await expectSpotlightOn(page, '[data-tour="view-site"]');

    await next.click();
    await expect(page).toHaveURL(/\/admin\/secoes\/events$/);
    await expect(dialog).toHaveAccessibleName('Listas: adicionar itens');
    await expectSpotlightOn(page, '[data-tour="list-add"]');

    // Voltar também volta para a tela do passo anterior.
    await page.getByRole('button', { name: 'Voltar' }).click();
    await expect(page).toHaveURL(/\/admin\/secoes\/hero$/);
    await expect(dialog).toHaveAccessibleName('Conferir no site');
    await next.click();
    await expect(dialog).toHaveAccessibleName('Listas: adicionar itens');

    for (const [url, name, selector] of [
      ['/admin/secoes/events', 'Ordenar, ocultar e excluir', '[data-tour="list-item"]'],
      ['/admin/imagens', 'Biblioteca de imagens', '[data-tour="media-upload"]'],
      ['/admin/contato', 'WhatsApp e contatos', '[data-tour="whatsapp"]'],
      ['/admin/seo', 'Google e compartilhamento', '[data-tour="seo"]'],
      ['/admin/conta', 'Sua conta', '[data-tour="password"]'],
      ['/admin', 'Precisa de ajuda?', '[data-tour="help"]'],
    ]) {
      await next.click();
      await expect(page).toHaveURL(new RegExp(`${url}$`));
      await expect(dialog).toHaveAccessibleName(name);
      await expectSpotlightOn(page, selector);
    }

    await expect(dialog).toContainText('Passo 13 de 13');
    const saved = waitForGuideSaved(page);
    await page.getByRole('button', { name: 'Concluir' }).click();
    await saved;
    await expect(page.locator('#tour')).toHaveCount(0);
    await expect(page.locator('#admin-main')).not.toHaveAttribute('inert');

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible();
    await expect(page.locator('#tour')).toHaveCount(0);
  });

  test('o menu Ajuda refaz o tour; Esc encerra', async ({ page }) => {
    await login(page);
    const help = page.getByRole('button', { name: 'Ajuda' });
    await help.click();
    await expect(help).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('button', { name: 'Refazer o tour do painel' }).click();

    await expect(page.getByRole('dialog')).toHaveAccessibleName('Boas-vindas ao painel');
    await page.keyboard.press('Escape');
    await expect(page.locator('#tour')).toHaveCount(0);
  });

  test('no celular, destaca o botão Menu e o balão não cobre o destaque', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('button', { name: 'Ajuda' }).click();
    await page.getByRole('button', { name: 'Refazer o tour do painel' }).click();

    const dialog = page.getByRole('dialog');
    const next = page.getByRole('button', { name: 'Próximo' });
    await expect(dialog).toHaveAccessibleName('Boas-vindas ao painel');
    await next.click();
    await next.click();
    await expect(dialog).toHaveAccessibleName('Página inicial, seção por seção');
    await expectSpotlightOn(page, '[data-tour="menu-button"]');
    await expect(dialog).toBeInViewport({ ratio: 1 });

    await next.click();
    await next.click();
    await expect(dialog).toHaveAccessibleName('Salvar alterações');
    await expectSpotlightOn(page, '[data-tour="save-bar"]');
    await expect(dialog).toBeInViewport({ ratio: 1 });
    await page.keyboard.press('Escape');
  });
});

test.describe('Edição de conteúdo', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('editar o destaque principal reflete no site e persiste', async ({ page, context }) => {
    await page.getByRole('link', { name: 'Destaque principal' }).first().click();
    const title = page.locator('#section-title');
    const original = await title.inputValue();
    const edited = `${original} (e2e)`;

    await title.fill(edited);
    await expect(page.getByText('Alterações não salvas')).toBeVisible();
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('Seção salva')).toBeVisible();

    const site = await context.newPage();
    await site.goto('/');
    await expect(site.getByRole('heading', { level: 1 })).toHaveText(edited);

    await page.reload();
    await expect(page.locator('#section-title')).toHaveValue(edited);

    await page.locator('#section-title').fill(original);
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('Seção salva')).toBeVisible();
    await site.reload();
    await expect(site.getByRole('heading', { level: 1 })).toHaveText(original);
  });

  test('título vazio não é salvo', async ({ page }) => {
    await page.goto('/admin/secoes/experience');
    await page.locator('#section-title').fill('');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('O título não pode ficar vazio.')).toBeVisible();
    await expect(page.locator('#section-title')).toBeFocused();
  });

  test('aviso de alterações não salvas ao sair da página', async ({ page }) => {
    await page.goto('/admin/secoes/quote');
    await page.locator('#section-title').fill('Rascunho não salvo');
    await page.getByRole('link', { name: 'Contato e marca' }).click();
    const dialog = page.getByRole('dialog', { name: 'Sair sem salvar?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Continuar editando' }).click();
    await expect(page).toHaveURL(/secoes\/quote$/);
    await expect(page.locator('#section-title')).toHaveValue('Rascunho não salvo');
    await page.getByRole('button', { name: 'Descartar' }).click();
  });

  test('criar, editar e excluir pergunta frequente (reflete no site)', async ({ page, context }) => {
    await page.goto('/admin/secoes/faq');
    const addButtons = page.getByRole('button', { name: 'Adicionar pergunta' });
    await addButtons.first().click();
    // O rascunho entra no fim da lista, aparece na tela e recebe o foco.
    const question = page.locator('input[id$="-question"]').last();
    await expect(question).toBeFocused();
    await expect(question).toBeInViewport();
    await expect(page.locator('li', { has: question })).toContainText('Rascunho');
    // Com itens na lista, há também um botão de adicionar no fim dela.
    await expect(addButtons).toHaveCount(2);
    await question.fill('Vocês levam a máquina? (e2e)');
    await page.locator('textarea[id$="-answer"]').last().fill('Sim, levamos toda a estação.');
    await page.getByRole('button', { name: 'Salvar pergunta' }).click();
    await expect(page.getByText('Pergunta adicionado(a).')).toBeVisible();

    const site = await context.newPage();
    await site.goto('/#duvidas');
    await expect(site.getByText('Vocês levam a máquina? (e2e)')).toBeVisible();

    await page.reload();
    const card = page.locator('li', { hasText: 'Vocês levam a máquina? (e2e)' });
    await card.locator('textarea').fill('Sim, levamos a estação completa.');
    await card.getByRole('button', { name: 'Salvar', exact: true }).click();
    await expect(page.getByText('Alterações salvas.')).toBeVisible();

    await card.getByRole('button', { name: 'Excluir' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
    await expect(page.getByText('Pergunta excluído(a).')).toBeVisible();
    await site.reload();
    await expect(site.getByText('Vocês levam a máquina? (e2e)')).toHaveCount(0);
  });

  test('novo tipo de evento entra no fim da lista e a tela rola até ele', async ({ page }) => {
    await page.goto('/admin/secoes/events');
    const cards = page.locator('ol > li');
    await expect(cards.first()).toBeVisible();
    const before = await cards.count();

    await page.getByRole('button', { name: 'Adicionar tipo de evento' }).first().click();
    await expect(cards).toHaveCount(before + 1);
    const draft = cards.last();
    await expect(draft).toContainText('Rascunho');
    await expect(draft).toContainText(String(before + 1)); // numeração = posição no site
    await expect(draft.locator('input[id$="-title"]')).toBeFocused();
    await expect(draft.locator('input[id$="-title"]')).toBeInViewport();

    await draft.getByRole('button', { name: 'Descartar' }).click();
    await expect(cards).toHaveCount(before);
  });

  test('reordenar diferenciais', async ({ page }) => {
    await page.goto('/admin/secoes/personalization');
    const headings = page.locator('ol li h3');
    await expect(headings.first()).toBeVisible();
    const before = await headings.allInnerTexts();
    await page
      .getByRole('button', { name: /para baixo/ })
      .first()
      .click();
    await expect(page.getByText('Ordem atualizada.')).toBeVisible();
    const after = await headings.allInnerTexts();
    expect(after[1]).toContain(before[0].replace(/^\d+\s*/, ''));
    await page
      .locator('ol li')
      .nth(1)
      .getByRole('button', { name: /para cima/ })
      .click();
    await expect.poll(async () => (await headings.allInnerTexts()).join('|')).toBe(before.join('|'));
  });

  test('WhatsApp inválido é recusado com mensagem clara', async ({ page }) => {
    await page.goto('/admin/contato');
    const field = page.locator('#settings-whatsapp_number');
    const original = await field.inputValue();
    await field.fill('123');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText(/Número inválido/)).toBeVisible();
    await field.fill(original);
  });
});

test.describe('Imagens', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('upload com pré-visualização, otimização e exclusão', async ({ page, context }) => {
    await page.goto('/admin/imagens');
    const input = page.locator('input[type="file"]');

    // Tipo inválido
    await input.setInputFiles({ name: 'anim.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') });
    await expect(page.getByRole('alert')).toContainText('Formato não aceito');

    // Upload válido
    await input.setInputFiles(path.resolve('../la-dolce-data/assets/copinho-la-dolce-soft.jpg'));
    await expect(page.getByText('Pré-visualização:')).toBeVisible();
    await page.getByRole('button', { name: 'Enviar imagem' }).click();
    await expect(page.getByText(/Descreva a imagem/)).toBeVisible(); // texto alternativo obrigatório
    await page.getByLabel(/Descrição da imagem/).fill('Copinho de teste e2e');
    await page.getByRole('button', { name: 'Enviar imagem' }).click();
    await expect(page.getByText('Imagem enviada.')).toBeVisible();

    const card = page.locator('li', { has: page.locator('input[value="Copinho de teste e2e"]') });
    await expect(card).toBeVisible();
    await expect(card).toContainText('1066×1600px');
    const thumb = await card.locator('img').getAttribute('src');
    expect(thumb).toMatch(/\/storage\/v1\/object\/public\/media\/uploads\/.+-sm\.webp$/);
    const fileResponse = await context.request.get(thumb!);
    expect(fileResponse.ok()).toBe(true);
    expect(fileResponse.headers()['content-type']).toBe('image/webp');

    await card.getByRole('button', { name: 'Excluir' }).click();
    const dialog = page.getByRole('dialog', { name: 'Excluir imagem?' });
    await expect(dialog).toContainText('não está em uso');
    await dialog.getByRole('button', { name: 'Excluir imagem' }).click();
    await expect(page.getByText('Imagem excluída.')).toBeVisible();
    await expect(card).toHaveCount(0);
    await expect.poll(async () => (await context.request.get(thumb!)).status()).not.toBe(200);
  });

  test('aviso de uso ao excluir imagem usada no site', async ({ page }) => {
    await page.goto('/admin/imagens');
    const used = page.locator('li', {
      has: page.locator('input[value="Balcão rosa da La Dolce Experience montado para eventos"]'),
    });
    await used.getByRole('button', { name: 'Excluir' }).click();
    const dialog = page.getByRole('dialog', { name: 'Excluir imagem?' });
    await expect(dialog).toContainText('Destaque principal');
    await expect(dialog).toContainText('Galeria');
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(used).toBeVisible();
  });
});

test.describe('Painel no celular', () => {
  test('menu e formulários utilizáveis a 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Contato e marca' }).click();
    await expect(page.getByRole('heading', { name: 'Contato e marca' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
});
