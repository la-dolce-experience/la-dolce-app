import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
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
    // Com o menu lateral mais alto que a tela, a rolagem suave até o elemento leva um instante: o balão
    // se reposiciona quando ela termina.
    await expect
      .poll(async () => {
        const [card, t] = await Promise.all([page.getByRole('dialog').boundingBox(), target.boundingBox()]);
        return coveredFraction(card!, t!);
      })
      .toBeLessThanOrEqual(0.1);
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
    await expect(dialog).toContainText('Passo 1 de 23');
    // Durante o tour, o restante do painel fica bloqueado para teclado e mouse.
    await expect(page.locator('#admin-main')).toHaveAttribute('inert', '');
    await expect(page.locator('#admin-sidebar')).toHaveAttribute('inert', '');
    const results = await new AxeBuilder({ page }).include('#tour').withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual([]);

    await next.click();
    await expect(dialog).toHaveAccessibleName('Resultados do site');
    await expectSpotlightOn(page, '[data-tour="metrics"]');

    await next.click();
    await expect(dialog).toHaveAccessibleName('O que falta preencher');
    await expectSpotlightOn(page, '[data-tour="checklist"]');

    await next.click();
    await expect(dialog).toHaveAccessibleName('O site, parte por parte');
    await expectSpotlightOn(page, '[data-tour="nav-sections"]');

    const sectionUrl = /\/admin\/secoes\/[0-9a-f-]{36}$/;
    for (const [url, name, selector] of [
      [/\/admin\/secoes$/, 'Monte a página', '[data-tour="sections-order"]'],
      [/\/admin\/secoes$/, 'Adicionar seções', '[data-tour="sections-add"]'],
      [sectionUrl, 'Textos e fotos', '[data-tour="image-picker"]'],
      [sectionUrl, 'Pré-visualização ao vivo', '[data-tour="preview-open"]'],
      [sectionUrl, 'Salvar ou descartar', '[data-tour="save-bar"]'],
      [sectionUrl, 'Nome, menu e endereço', '[data-tour="section-identity"]'],
      [sectionUrl, 'Listas: adicionar itens', '[data-tour="list-add"]'],
    ] as const) {
      await next.click();
      await expect(page).toHaveURL(url);
      await expect(dialog).toHaveAccessibleName(name);
      await expectSpotlightOn(page, selector);
    }

    // Voltar também volta para a tela do passo anterior.
    const listUrl = page.url();
    await page.getByRole('button', { name: 'Voltar' }).click();
    await expect(dialog).toHaveAccessibleName('Nome, menu e endereço');
    await expect(page).not.toHaveURL(listUrl);
    await next.click();
    await expect(dialog).toHaveAccessibleName('Listas: adicionar itens');

    for (const [url, name, selector] of [
      [sectionUrl, 'Ordenar, ocultar e excluir', '[data-tour="list-item"]'],
      [sectionUrl, 'Sabores e apresentações', '[data-tour="list-catalogo"]'],
      [sectionUrl, 'Galeria de fotos', '[data-tour="list-galeria"]'],
      [sectionUrl, 'Depoimentos', '[data-tour="list-depoimentos"]'],
      [sectionUrl, 'Formulário de orçamento', '[data-tour="section-options"]'],
      [sectionUrl, 'Atendimento e localização', '[data-tour="location"]'],
      [/\/admin\/imagens$/, 'Biblioteca de imagens', '[data-tour="media-upload"]'],
      [/\/admin\/contato$/, 'WhatsApp e contatos', '[data-tour="whatsapp"]'],
      [/\/admin\/seo$/, 'Google e compartilhamento', '[data-tour="seo"]'],
      [/\/admin\/lixeira$/, 'Lixeira e cópia de segurança', '[data-tour="trash"]'],
      [/\/admin\/conta$/, 'Sua conta', '[data-tour="password"]'],
      [/\/admin$/, 'Precisa de ajuda?', '[data-tour="help"]'],
    ] as const) {
      await next.click();
      await expect(page).toHaveURL(url);
      await expect(dialog).toHaveAccessibleName(name);
      await expectSpotlightOn(page, selector);
    }

    await expect(dialog).toContainText('Passo 23 de 23');
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
    await next.click();
    await expect(dialog).toHaveAccessibleName('O site, parte por parte');
    await expectSpotlightOn(page, '[data-tour="menu-button"]');
    await expect(dialog).toBeInViewport({ ratio: 1 });

    for (let i = 0; i < 5; i++) await next.click();
    await expect(dialog).toHaveAccessibleName('Salvar ou descartar');
    await expectSpotlightOn(page, '[data-tour="save-bar"]');
    await expect(dialog).toBeInViewport({ ratio: 1 });
    await page.keyboard.press('Escape');
  });
});

/** Abre o editor de uma seção pelo menu lateral (o endereço tem o id da seção). */
async function openSection(page: Page, name: string) {
  await page.getByRole('navigation', { name: 'Painel' }).getByRole('link', { name, exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
  await expect(page.locator('#section-title')).toBeVisible();
}

/** Linha de uma seção na tela "Seções da página". */
const sectionRow = (page: Page, name: string) => page.locator('li[id^="section-row-"]', { hasText: name });

/** Nomes das seções, na ordem da tela "Seções da página". */
const sectionNames = (page: Page) => page.locator('li[id^="section-row-"] p:first-child a').allInnerTexts();

test.describe('Edição de conteúdo', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('editar o destaque principal reflete no site e persiste', async ({ page, context }) => {
    await openSection(page, 'Destaque principal');
    const title = page.locator('#section-title');
    const original = await title.inputValue();
    const edited = `${original} (e2e)`;

    await title.fill(edited);
    await expect(page.getByText('Alterações não salvas')).toBeVisible();
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('Seção salva').last()).toBeVisible();

    const site = await context.newPage();
    await site.goto('/');
    await expect(site.getByRole('heading', { level: 1 })).toHaveText(edited);

    await page.reload();
    await expect(page.locator('#section-title')).toHaveValue(edited);

    await page.locator('#section-title').fill(original);
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('Seção salva').last()).toBeVisible();
    await site.reload();
    await expect(site.getByRole('heading', { level: 1 })).toHaveText(original);
  });

  test('título vazio e endereço inválido não são salvos', async ({ page }) => {
    await openSection(page, 'Experiência');
    await page.locator('#section-title').fill('');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('O título não pode ficar vazio.')).toBeVisible();
    await expect(page.locator('#section-title')).toBeFocused();
    await page.getByRole('button', { name: 'Descartar' }).click();

    await page.locator('#section-slug').fill('eventos');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('Outra seção já usa este endereço.')).toBeVisible();
    await page.getByRole('button', { name: 'Descartar' }).click();
  });

  test('aviso de alterações não salvas ao sair da página', async ({ page }) => {
    await openSection(page, 'Formulário de orçamento');
    await page.locator('#section-title').fill('Rascunho não salvo');
    await page.getByRole('link', { name: 'Contato e marca' }).click();
    const dialog = page.getByRole('dialog', { name: 'Sair sem salvar?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Continuar editando' }).click();
    await expect(page.locator('#section-title')).toHaveValue('Rascunho não salvo');
    await page.getByRole('button', { name: 'Descartar' }).click();
  });

  test('criar, editar e excluir pergunta frequente (reflete no site)', async ({ page, context }) => {
    await openSection(page, 'Perguntas frequentes');
    const addButtons = page.getByRole('button', { name: 'Adicionar pergunta' });
    await addButtons.first().click();
    // O rascunho entra no fim da lista, aparece na tela e recebe o foco.
    const question = page.locator('input[id$="-title"]').last();
    await expect(question).toBeFocused();
    await expect(question).toBeInViewport();
    await expect(page.locator('ol > li').last()).toContainText('Rascunho');
    await expect(addButtons).toHaveCount(2);
    await question.fill('Vocês atendem aos sábados? (e2e)');
    await page.locator('textarea[id$="-description"]').last().fill('Sim, com agendamento.');
    await page.getByRole('button', { name: 'Salvar pergunta' }).click();
    await expect(page.getByText('Pergunta adicionado(a).')).toBeVisible();

    const site = await context.newPage();
    await site.goto('/#duvidas');
    await expect(site.getByText('Vocês atendem aos sábados? (e2e)')).toBeVisible();

    await page.reload();
    const card = page.locator('li', { has: page.locator('input[value="Vocês atendem aos sábados? (e2e)"]') });
    await card.locator('textarea').fill('Sim, das 9h às 13h.');
    await card.getByRole('button', { name: 'Salvar', exact: true }).click();
    await expect(page.getByText('Alterações salvas.')).toBeVisible();

    await card.getByRole('button', { name: 'Excluir' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
    await expect(page.getByText('Pergunta excluído(a).')).toBeVisible();
    await site.reload();
    await expect(site.getByText('Vocês atendem aos sábados? (e2e)')).toHaveCount(0);

    // Limpeza: apaga da lixeira de vez (inclusive sobras de execuções anteriores).
    await page.goto('/admin/lixeira');
    await expect(page.locator('#admin-main li', { hasText: 'Vocês atendem aos sábados? (e2e)' }).first()).toBeVisible();
    const leftover = page.getByRole('button', { name: 'Excluir definitivamente “Vocês atendem aos sábados? (e2e)”' });
    for (let n = await leftover.count(); n > 0; n--) {
      await leftover.first().click();
      await page.getByRole('dialog').getByRole('button', { name: 'Excluir definitivamente' }).click();
      await expect(leftover).toHaveCount(n - 1);
    }
  });

  test('reordenar itens de uma lista', async ({ page }) => {
    await openSection(page, 'Personalização');
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
    // O foco acompanha o item movido, na mesma seta (teclado).
    await expect(
      page
        .locator('ol li')
        .nth(1)
        .getByRole('button', { name: /para baixo/ }),
    ).toBeFocused();
    await page
      .locator('ol li')
      .nth(1)
      .getByRole('button', { name: /para cima/ })
      .click();
    await expect.poll(async () => (await headings.allInnerTexts()).join('|')).toBe(before.join('|'));
  });

  test('o formulário mostra só os campos ligados no painel', async ({ page, context }) => {
    await openSection(page, 'Formulário de orçamento');
    const label = page.locator('#section-option-quantityLabel');
    const original = await label.inputValue();
    await page.getByLabel('Pedir uma quantidade').uncheck();
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('Seção salva').last()).toBeVisible();

    const site = await context.newPage();
    await site.goto('/#orcamento');
    await expect(site.locator('#orcamento form').getByLabel(/convidados/)).toHaveCount(0);

    await page.getByLabel('Pedir uma quantidade').check();
    await label.fill('Quantas pessoas e2e');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('Seção salva').last()).toBeVisible();
    await site.reload();
    await expect(site.locator('#orcamento form').getByLabel(/Quantas pessoas e2e/)).toBeVisible();

    await label.fill(original);
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('Seção salva').last()).toBeVisible();
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

test.describe('Seções da página', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Seções e ordem' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Seções da página' })).toBeVisible();
    await expect(sectionRow(page, 'Destaque principal')).toBeVisible();
  });

  test('mudar a ordem com as setas reflete no site e no menu do painel', async ({ page, context }) => {
    const before = await sectionNames(page);
    const i = before.indexOf('Experiência');
    await sectionRow(page, 'Experiência').getByRole('button', { name: 'Mover “Experiência” para baixo' }).click();
    await expect(page.getByText('Ordem atualizada.', { exact: false })).toBeVisible();
    await expect
      .poll(() => sectionNames(page))
      .toEqual([...before.slice(0, i), before[i + 1], 'Experiência', ...before.slice(i + 2)]);
    // O foco acompanha a seção movida, na mesma seta (teclado).
    await expect(
      sectionRow(page, 'Experiência').getByRole('button', { name: 'Mover “Experiência” para baixo' }),
    ).toBeFocused();

    const sidebar = await page
      .getByRole('navigation', { name: 'Painel' })
      .locator('[aria-labelledby="nav-home"] a')
      .allInnerTexts();
    expect(sidebar.slice(1).map((t) => t.replace(/oculta$/, '').trim())).toEqual(await sectionNames(page));

    // O site segue a mesma ordem (seções de lista vazias não aparecem).
    const slugs = await page
      .locator('li[id^="section-row-"] p:nth-child(2)')
      .allInnerTexts()
      .then((metas) => metas.map((m) => m.split('#').pop()!.trim()));
    const site = await context.newPage();
    await site.goto('/');
    // A página abre com o HTML do último build e se atualiza com o banco logo em seguida.
    await expect
      .poll(async () => {
        const ids = await site.locator('main > section[id]').evaluateAll((els) => els.map((e) => e.id));
        return JSON.stringify(ids) === JSON.stringify(slugs.filter((slug) => ids.includes(slug)));
      })
      .toBe(true);

    // Volta à ordem original.
    await sectionRow(page, 'Experiência').getByRole('button', { name: 'Mover “Experiência” para cima' }).click();
    await expect.poll(() => sectionNames(page)).toEqual(before);
  });

  test('arrastar uma seção muda a ordem', async ({ page }) => {
    const before = await sectionNames(page);
    await sectionRow(page, before[3]).dragTo(sectionRow(page, before[1]));
    await expect
      .poll(() => sectionNames(page))
      .toEqual([before[0], before[3], before[1], before[2], ...before.slice(4)]);
    // Restaura pelo arrasto inverso.
    await sectionRow(page, before[3]).dragTo(sectionRow(page, before[2]));
    await expect.poll(() => sectionNames(page)).toEqual(before);
  });

  test('adicionar seção na posição escolhida, preencher e excluir', async ({ page, context }) => {
    const name = `Planos e2e ${Date.now()}`;
    const before = await sectionNames(page);
    const anchor = before[1];

    // "+ Adicionar seção aqui" abaixo da segunda seção.
    await sectionRow(page, anchor).getByRole('button', { name: 'Adicionar seção aqui' }).click();
    const dialog = page.getByRole('dialog', { name: 'Adicionar seção' });
    await expect(dialog.getByLabel('Onde a seção entra na página')).toHaveValue('2');
    // Tipos que só podem existir uma vez ficam indisponíveis.
    await expect(dialog.getByRole('radio', { name: /Destaque principal/ })).toBeDisabled();
    await dialog.getByRole('button', { name: 'Criar seção' }).click();
    await expect(dialog.getByRole('alert')).toHaveText('Escolha o tipo da seção.');
    await dialog.getByText('Cartões', { exact: true }).click();
    await expect(dialog.getByLabel('Nome da seção no painel')).toHaveValue('Serviços');
    await dialog.getByLabel('Nome da seção no painel').fill(name);
    // O ícone sugerido é o do tipo; dá para escolher outro para o menu lateral.
    await expect(dialog.getByRole('radio', { name: 'Grade', exact: true })).toBeChecked();
    await dialog.getByRole('radio', { name: 'Presente', exact: true }).check();
    await dialog.getByRole('button', { name: 'Criar seção' }).click();

    // Abre o editor da seção nova, que já aparece no menu lateral.
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Presente', exact: true })).toBeChecked();
    await expect(page.getByRole('navigation', { name: 'Painel' }).getByRole('link', { name })).toBeVisible();
    await page.locator('#section-title').fill('Nossos planos');
    await page.locator('#section-nav_label').fill('Planos');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('Seção salva').last()).toBeVisible();
    await page.getByRole('button', { name: 'Adicionar cartão' }).first().click();
    await page.locator('input[id$="-title"]').last().fill('Plano básico');
    await page.locator('input[id$="-label"]').last().fill('Plano básico');
    await page.getByRole('button', { name: 'Salvar cartão' }).click();
    await expect(page.getByText('Cartão adicionado(a).')).toBeVisible();

    // No site: na posição escolhida, no menu e como opção do formulário.
    const site = await context.newPage();
    await site.goto('/');
    // A página abre com o HTML do último build e se atualiza com o banco logo em seguida.
    await expect.poll(async () => (await site.locator('main h2').allInnerTexts())[1]).toBe('Nossos planos');
    await expect(
      site.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Planos' }),
    ).toBeVisible();
    await expect(
      site
        .locator('#orcamento form')
        .getByLabel(/Tipo de evento/)
        .locator('option', { hasText: 'Plano básico' }),
    ).toHaveCount(1);

    // Excluir pelo editor: vai para a lixeira com o cartão.
    await page.getByRole('button', { name: 'Excluir seção' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir seção' }).click();
    await expect(page).toHaveURL(/\/admin\/secoes$/);
    await expect(sectionRow(page, name)).toHaveCount(0);
    await site.reload();
    await expect(site.getByRole('heading', { name: 'Nossos planos' })).toHaveCount(0);

    // Limpeza: apaga de vez da lixeira (o cartão vai junto).
    await page.goto('/admin/lixeira');
    const trashed = page.locator('li', { hasText: name });
    await expect(trashed).toContainText('Seção · com 1 item');
    await page.getByRole('button', { name: `Excluir definitivamente “${name}”` }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir definitivamente' }).click();
    await expect(trashed).toHaveCount(0);
    await expect(page.locator('li', { hasText: 'Plano básico' })).toHaveCount(0);
  });

  test('ocultar e exibir uma seção', async ({ page, context }) => {
    const row = sectionRow(page, 'Galeria');
    const heading = 'Produto bonito antes mesmo da primeira colherada.';
    await row.getByRole('button', { name: 'Ocultar “Galeria” no site' }).click();
    await expect(row).toContainText('Oculta');
    const site = await context.newPage();
    await site.goto('/');
    // A página abre com o HTML do último build e se atualiza com o banco logo em seguida.
    await expect(site.getByRole('heading', { name: heading })).toHaveCount(0);
    await expect(
      site.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Galeria' }),
    ).toHaveCount(0);

    await row.getByRole('button', { name: 'Exibir “Galeria” no site' }).click();
    await expect(row).not.toContainText('Oculta');
    await site.reload();
    await expect(site.getByRole('heading', { name: heading })).toBeVisible();
  });

  test('duplicar cria uma cópia oculta logo abaixo, com os itens', async ({ page }) => {
    await expect(sectionRow(page, 'Destaque principal').getByRole('button', { name: /Duplicar/ })).toBeDisabled();
    const before = await sectionNames(page);
    await sectionRow(page, 'Personalização').getByRole('button', { name: 'Duplicar “Personalização”' }).click();
    await expect(page.getByText('Cópia criada logo abaixo', { exact: false })).toBeVisible();
    const after = await sectionNames(page);
    const i = before.indexOf('Personalização');
    expect(after[i + 1]).toBe('Personalização (cópia)');
    const copy = sectionRow(page, 'Personalização (cópia)');
    await expect(copy).toContainText('Oculta');
    await expect(copy).toContainText('#personalizacao-copia');

    await copy.getByRole('link', { name: 'Editar “Personalização (cópia)”' }).click();
    await expect(page.locator('ol li h3')).toHaveCount(4);

    // Limpeza.
    await page.getByRole('button', { name: 'Excluir seção' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir seção' }).click();
    await page.goto('/admin/lixeira');
    await page.getByRole('button', { name: 'Excluir definitivamente “Personalização (cópia)”' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir definitivamente' }).click();
  });

  test('tela de seções acessível (axe)', async ({ page }) => {
    const results = await new AxeBuilder({ page }).include('#admin-main').withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual([]);
  });
});

test.describe('Carrossel, cor de fundo e foto do topo', () => {
  test.beforeEach(async ({ page }) => login(page));

  /** Imagem gerada no navegador (sem arquivo no repositório). */
  async function pngOf(page: Page, width: number, height: number, color: string) {
    const dataUrl = await page.evaluate(
      ([w, h, c]) => {
        const canvas = Object.assign(document.createElement('canvas'), { width: w, height: h });
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = c as string;
        ctx.fillRect(0, 0, w as number, h as number);
        return canvas.toDataURL('image/png');
      },
      [width, height, color],
    );
    return Buffer.from(dataUrl.split(',')[1], 'base64');
  }

  test('fotos do carrossel em "Sabores e apresentação" e fundo roxo açaí refletem no site', async ({
    page,
    context,
  }) => {
    const alt = `Foto do carrossel e2e ${Date.now()}`;
    await openSection(page, 'Sabores e apresentação');
    await expect(page.getByRole('heading', { name: 'Fotos do carrossel (opcional)' })).toBeVisible();

    // Nova foto no carrossel: envio pela biblioteca, já escolhida para o item.
    await page.getByRole('button', { name: 'Adicionar foto' }).first().click();
    const item = page.locator('ol > li').last();
    await item.getByRole('button', { name: 'Escolher imagem' }).click();
    const library = page.getByRole('dialog');
    await library
      .locator('input[type="file"]')
      .setInputFiles({ name: 'carrossel.png', mimeType: 'image/png', buffer: await pngOf(page, 1000, 800, '#7a3b7f') });
    await library.getByLabel(/Descrição da imagem/).fill(alt);
    await library.getByRole('button', { name: 'Enviar imagem' }).click();
    await expect(library).toHaveCount(0);
    await item.locator('input[id$="-alt"]').fill(alt);
    await item.getByRole('button', { name: 'Salvar foto' }).click();
    await expect(page.getByText('Foto adicionado(a).')).toBeVisible();

    // Cor de fundo roxo açaí.
    await page.locator('#section-option-theme').selectOption('acai');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('Seção salva').last()).toBeVisible();

    const site = await context.newPage();
    await site.goto('/#sabores');
    const carousel = site.getByRole('region', { name: /^Fotos:/ });
    await expect(carousel).toBeVisible();
    await expect(carousel.getByRole('button', { name: /Ir para a foto/ })).toHaveCount(2);
    await expect(carousel.getByRole('button', { name: 'Pausar a troca automática das fotos' })).toBeVisible();
    await carousel.getByRole('button', { name: 'Próxima foto' }).click();
    await expect(carousel.getByRole('button', { name: 'Ir para a foto 2' })).toHaveAttribute('aria-current', 'true');
    await expect(site.locator('[data-tema="acai"] section#sabores')).toBeVisible();
    await expect(site.locator('[data-tema="acai"]')).toHaveCSS('background-color', 'rgb(75, 30, 79)');
    const axe = await new AxeBuilder({ page: site }).include('[data-tema="acai"]').analyze();
    expect(axe.violations).toEqual([]);

    // Limpeza: fundo padrão, foto fora do carrossel e da lixeira, imagem fora da biblioteca.
    await page.locator('#section-option-theme').selectOption('padrao');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('Seção salva').last()).toBeVisible();
    const saved = page.locator('li', { has: page.locator(`input[value="${alt}"]`) });
    await saved.getByRole('button', { name: 'Excluir' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
    await expect(page.getByText('Foto excluído(a).')).toBeVisible();
    await site.reload();
    await expect(site.getByRole('region', { name: /^Fotos:/ })).toHaveCount(0);
    await expect(site.locator('[data-tema]')).toHaveCount(0);

    await page.goto('/admin/lixeira');
    await page.getByRole('button', { name: `Excluir definitivamente “${alt}”` }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir definitivamente' }).click();
    await page.goto('/admin/imagens');
    const card = page.locator('li', { has: page.locator(`input[value="${alt}"]`) });
    await card.getByRole('button', { name: 'Excluir' }).click();
    await page.getByRole('dialog', { name: 'Excluir imagem?' }).getByRole('button', { name: 'Excluir imagem' }).click();
    await expect(card).toHaveCount(0);
  });

  test('foto do topo: prévia do recorte com formato e ponto de foco', async ({ page }) => {
    await openSection(page, 'Destaque principal');
    const preview = page.getByTestId('hero-preview');
    await expect(preview).toContainText('Como a foto aparece no site');
    await expect(page.getByText(/Tamanho ideal: 1600 × 1280 px/)).toBeVisible();
    await page.locator('#section-option-imageFormat').selectOption('vertical');
    await page.locator('#section-option-imageFocus').selectOption('topo');
    await expect(preview.locator('div').first()).toHaveCSS('aspect-ratio', '0.8 / 1');
    await expect(preview.locator('img')).toHaveCSS('object-position', '50% 0%');
    await page.getByRole('button', { name: 'Descartar' }).click();
  });
});

test.describe('Imagens', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('upload com pré-visualização, otimização, uso numa seção e exclusão', async ({ page, context }) => {
    await page.goto('/admin/imagens');
    const input = page.locator('input[type="file"]');

    // Tipo inválido
    await input.setInputFiles({ name: 'anim.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') });
    await expect(page.getByRole('alert')).toContainText('Formato não aceito');

    // Upload válido: uma imagem 800×600 gerada no próprio navegador.
    const dataUrl = await page.evaluate(() => {
      const canvas = Object.assign(document.createElement('canvas'), { width: 800, height: 600 });
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#888';
      ctx.fillRect(0, 0, 800, 600);
      return canvas.toDataURL('image/png');
    });
    await input.setInputFiles({
      name: 'teste.png',
      mimeType: 'image/png',
      buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
    });
    await expect(page.getByText('Pré-visualização:')).toBeVisible();
    await page.getByRole('button', { name: 'Enviar imagem' }).click();
    await expect(page.getByText(/Descreva a imagem/)).toBeVisible(); // texto alternativo obrigatório
    await page.getByLabel(/Descrição da imagem/).fill('Imagem de teste e2e');
    await page.getByRole('button', { name: 'Enviar imagem' }).click();
    await expect(page.getByText('Imagem enviada.')).toBeVisible();

    const card = page.locator('li', { has: page.locator('input[value="Imagem de teste e2e"]') });
    await expect(card).toBeVisible();
    const thumb = await card.locator('img').getAttribute('src');
    expect(thumb).toMatch(/\/storage\/v1\/object\/public\/media\/uploads\/.+-sm\.webp$/);
    const fileResponse = await context.request.get(thumb!);
    expect(fileResponse.ok()).toBe(true);
    expect(fileResponse.headers()['content-type']).toBe('image/webp');

    // Usa na seção "Sabores": o aviso de exclusão cita onde ela aparece.
    await openSection(page, 'Sabores');
    await page.getByRole('button', { name: 'Escolher imagem' }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /Imagem de teste e2e/ })
      .click();
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('Seção salva').last()).toBeVisible();

    await page.goto('/admin/imagens');
    await card.getByRole('button', { name: 'Excluir' }).click();
    const dialog = page.getByRole('dialog', { name: 'Excluir imagem?' });
    await expect(dialog).toContainText('Seção "Sabores"');
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
    await expect(dialog).toContainText('Seção "Destaque principal"');
    await expect(dialog).toContainText('Galeria');
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(used).toBeVisible();
  });
});

test.describe('Fotos do iPhone (HEIC)', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('foto HEIC é convertida no navegador, otimizada e enviada', async ({ page, context }) => {
    await page.goto('/admin/imagens');
    // No Windows o navegador entrega o HEIC sem tipo: a extensão basta.
    await page.locator('input[type="file"]').setInputFiles({
      name: 'IMG_0001.HEIC',
      mimeType: '',
      buffer: readFileSync(path.resolve('e2e/fixtures/foto-iphone.heic')),
    });
    await expect(page.getByText('Pré-visualização:')).toBeVisible({ timeout: 30_000 });
    await page.getByLabel(/Descrição da imagem/).fill('Foto HEIC de teste e2e');
    await page.getByRole('button', { name: 'Enviar imagem' }).click();
    await expect(page.getByText('Imagem enviada.')).toBeVisible();

    const card = page.locator('li', { has: page.locator('input[value="Foto HEIC de teste e2e"]') });
    await expect(card).toContainText('667×1000px');
    const thumb = await card.locator('img').getAttribute('src');
    expect((await context.request.get(thumb!)).headers()['content-type']).toBe('image/webp');

    await card.getByRole('button', { name: 'Excluir' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir imagem' }).click();
    await expect(card).toHaveCount(0);
  });
});

test.describe('Resultados do site', () => {
  test('conta a visita e o clique no WhatsApp de um visitante', async ({ page, browser }) => {
    await login(page);
    await page.getByRole('button', { name: '7 dias' }).click();
    const value = (label: string) =>
      page
        .locator('dt', { hasText: label })
        .locator('xpath=following-sibling::dd')
        .innerText()
        .then((t) => Number(t.replace(/\D/g, '')));
    const visitsBefore = await value('Visitas');
    const clicksBefore = await value('Cliques no WhatsApp');

    // Visitante em outro navegador (sem sessão do painel).
    const visitor = await browser.newContext();
    await visitor.route('https://wa.me/**', (route) => route.fulfill({ body: 'ok' }));
    const site = await visitor.newPage();
    const visit = site.waitForResponse((r) => r.url().endsWith('/rpc/track_event'));
    await site.goto('/');
    await visit;
    const click = site.waitForResponse((r) => r.url().endsWith('/rpc/track_event'));
    await site.getByRole('link', { name: /Conversar pelo WhatsApp/ }).click();
    await click;
    await visitor.close();

    await expect
      .poll(async () => {
        await page.reload();
        await page.getByRole('button', { name: '7 dias' }).click();
        return [await value('Visitas'), await value('Cliques no WhatsApp')];
      })
      .toEqual([visitsBefore + 1, clicksBefore + 1]);
    await expect(page.locator('[data-tour="metrics"]')).toContainText('Botão flutuante');
  });
});

test.describe('Lixeira e cópia de segurança', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('item excluído pode ser restaurado da lixeira', async ({ page }) => {
    const question = `Lixeira e2e ${Date.now()}`;
    await openSection(page, 'Perguntas frequentes');
    await page.getByRole('button', { name: 'Adicionar pergunta' }).first().click();
    await page.locator('input[id$="-title"]').last().fill(question);
    await page.locator('textarea[id$="-description"]').last().fill('Resposta de teste.');
    await page.getByRole('button', { name: 'Salvar pergunta' }).click();
    await expect(page.getByText('Pergunta adicionado(a).')).toBeVisible();

    const card = page.locator('li', { has: page.locator(`input[value="${question}"]`) });
    await card.getByRole('button', { name: 'Excluir' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Lixeira e backup');
    await dialog.getByRole('button', { name: 'Excluir' }).click();
    await expect(card).toHaveCount(0);

    await page.goto('/admin/lixeira');
    const trashed = page.locator('li', { hasText: question });
    await expect(trashed).toContainText('Item de seção');
    await expect(trashed.getByRole('link', { name: 'Perguntas frequentes' })).toBeVisible();
    await trashed.getByRole('button', { name: `Restaurar “${question}”` }).click();
    await expect(page.getByText(`“${question}” foi restaurado.`)).toBeVisible();
    await expect(trashed).toHaveCount(0);

    await openSection(page, 'Perguntas frequentes');
    await expect(card).toBeVisible();

    // Limpeza: exclui de novo e apaga da lixeira de vez.
    await card.getByRole('button', { name: 'Excluir' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
    await expect(card).toHaveCount(0);
    await page.goto('/admin/lixeira');
    await page.getByRole('button', { name: `Excluir definitivamente “${question}”` }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir definitivamente' }).click();
    await expect(page.locator('li', { hasText: question })).toHaveCount(0);
  });

  test('seção excluída volta da lixeira com os itens, no mesmo lugar', async ({ page }) => {
    await page.getByRole('link', { name: 'Seções e ordem' }).click();
    await expect(sectionRow(page, 'Destaque principal')).toBeVisible();
    const before = await sectionNames(page);
    await sectionRow(page, 'Personalização').getByRole('button', { name: 'Excluir “Personalização”' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir seção' }).click();
    await expect(sectionRow(page, 'Personalização')).toHaveCount(0);

    await page.goto('/admin/lixeira');
    // Só a lista da lixeira (o menu lateral também tem um item "Personalização").
    const trashed = page.locator('#admin-main li', { hasText: 'Personalização' });
    await expect(trashed).toContainText('Seção · com 4 itens');
    await trashed.getByRole('button', { name: 'Restaurar “Personalização”' }).click();
    await expect(page.getByText('voltou para a página', { exact: false })).toBeVisible();
    await expect(trashed).toHaveCount(0);

    await page.getByRole('link', { name: 'Seções e ordem' }).click();
    await expect.poll(() => sectionNames(page)).toEqual(before);
  });

  test('baixa uma cópia de todo o conteúdo em JSON', async ({ page }) => {
    await page.goto('/admin/lixeira');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Baixar cópia do conteúdo' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/^la-dolce-conteudo-\d{4}-\d{2}-\d{2}\.json$/);
    const backup = JSON.parse(readFileSync((await file.path())!, 'utf8'));
    expect(backup.formato).toBe('la-dolce-backup');
    expect(backup.versao).toBe(2);
    expect(backup.dados.sections.length).toBeGreaterThan(0);
    expect(backup.dados.site_settings[0].whatsapp_number).toMatch(/^55\d+$/);
    expect(Object.keys(backup.dados).sort()).toEqual(['media', 'section_items', 'sections', 'site_settings']);
  });
});

test.describe('Pré-visualização', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('mostra alterações não salvas no site, ao vivo, sem publicar', async ({ page, browser }) => {
    await openSection(page, 'Destaque principal');
    const title = page.locator('#section-title');
    const original = await title.inputValue();

    await title.fill('Prévia e2e: primeira versão');
    // O botão do cabeçalho e o da barra de salvar abrem a mesma pré-visualização, ao lado do formulário.
    await page.getByRole('button', { name: 'Pré-visualizar' }).first().click();
    await expect(page.getByRole('complementary', { name: 'Pré-visualização' })).toBeVisible();
    const preview = page.frameLocator('iframe[title="Pré-visualização do site"]');
    await expect(page.locator('iframe[title="Pré-visualização do site"]')).toHaveAttribute('src', /\?previa=1/);
    await expect(preview.getByRole('heading', { level: 1 })).toHaveText('Prévia e2e: primeira versão');

    // Ao vivo: a aba da prévia acompanha o que é digitado no painel.
    await title.fill('Prévia e2e: segunda versão');
    await expect(preview.getByRole('heading', { level: 1 })).toHaveText('Prévia e2e: segunda versão');

    // Ninguém mais vê: o site publicado continua igual.
    const visitor = await browser.newPage();
    await visitor.goto('/');
    await expect(visitor.getByRole('heading', { level: 1 })).toHaveText(original);
    await visitor.close();

    // Descartar volta a prévia ao conteúdo publicado.
    await page.getByRole('button', { name: 'Descartar' }).click();
    await expect(preview.getByRole('heading', { level: 1 })).toHaveText(original);
    await expect(title).toHaveValue(original);
  });
});

test.describe('Atualizar prévia do link', () => {
  test.beforeEach(async ({ page }) => login(page));

  async function mockFunction(page: Page, status: number, body: Record<string, unknown>) {
    await page.unroute('**/functions/v1/republicar-site');
    await page.route('**/functions/v1/republicar-site', (route) =>
      route.fulfill({
        status: route.request().method() === 'OPTIONS' ? 204 : status,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
          'content-type': 'application/json',
        },
        body: route.request().method() === 'OPTIONS' ? '' : JSON.stringify(body),
      }),
    );
  }

  test('explica cada resposta da republicação', async ({ page }) => {
    await page.goto('/admin/seo');
    const button = page.getByRole('button', { name: 'Atualizar prévia do link' });

    await mockFunction(page, 503, { error: 'nao_configurado' });
    await button.click();
    await expect(page.getByText('A publicação automática ainda não foi configurada.', { exact: false })).toBeVisible();

    await mockFunction(page, 429, { error: 'aguarde', retry_after_seconds: 240 });
    await button.click();
    await expect(page.getByText('Aguarde 4 minutos', { exact: false })).toBeVisible();

    await mockFunction(page, 202, { ok: true });
    await button.click();
    await expect(page.getByText('Atualização iniciada.', { exact: false })).toBeVisible();

    // Com alterações não salvas, o botão fica indisponível e explica o motivo.
    await page.locator('#settings-seo_title').fill('Título alterado e2e');
    await expect(button).toBeDisabled();
    await expect(page.getByText('Salve as alterações desta página antes de atualizar a prévia.')).toBeVisible();
    await page.getByRole('button', { name: 'Descartar' }).click();
  });
});

test.describe('Tela de erro', () => {
  test('arquivo de uma versão antiga do site: explica e oferece recarregar', async ({ page }) => {
    await page.route('**/assets/AdminApp-*.js', (route) => route.abort());
    await page.goto('/admin');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('O site foi atualizado');
    await expect(page.getByRole('button', { name: 'Recarregar a página' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Voltar à Visão geral' })).toHaveAttribute('href', '/admin');
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
