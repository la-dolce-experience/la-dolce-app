import type { ReactNode } from 'react';

export interface TourStep {
  /** Tela do painel aberta neste passo. */
  route: string;
  /** Elemento destacado (seletor CSS). Sem alvo, o balão aparece centralizado. */
  target?: string;
  /** Alvo usado quando o principal não está visível (ex.: menu lateral fechado no celular). */
  fallbackTarget?: string;
  title: string;
  body: ReactNode;
}

const MENU_BUTTON = '[data-tour="menu-button"]';

/** Tour guiado: percorre o painel na ordem em que a pessoa vai usá-lo. */
export const TOUR_STEPS: TourStep[] = [
  {
    route: '/admin',
    title: 'Boas-vindas ao painel',
    body: (
      <>
        <p>Aqui você altera os textos, as fotos e os contatos do site, sem precisar de programador.</p>
        <p>
          Neste tour rápido, o painel abre cada tela e destaca onde clicar. Use <strong>Próximo</strong> e{' '}
          <strong>Voltar</strong> para navegar.
        </p>
      </>
    ),
  },
  {
    route: '/admin',
    target: '[data-tour="checklist"]',
    title: 'Visão geral',
    body: (
      <p>
        Esta é a primeira tela depois de entrar. A lista mostra as informações que ainda faltam no site, com um atalho
        para preencher cada uma.
      </p>
    ),
  },
  {
    route: '/admin',
    target: '[data-tour="nav-sections"]',
    fallbackTarget: MENU_BUTTON,
    title: 'Página inicial, seção por seção',
    body: (
      <>
        <p>Cada item deste menu é uma parte do site, na mesma ordem em que aparece para o visitante.</p>
        <p>
          No celular, o menu fica no botão <strong>Menu</strong>, no topo da tela.
        </p>
      </>
    ),
  },
  {
    route: '/admin/secoes/hero',
    target: '[data-tour="image-picker"]',
    title: 'Textos e fotos',
    body: (
      <>
        <p>
          Abrimos o <strong>Destaque principal</strong>, a primeira parte do site. Altere os textos nos campos e use{' '}
          <strong>Trocar imagem</strong> para escolher outra foto.
        </p>
        <p>A descrição da imagem é obrigatória: ela ajuda pessoas com deficiência visual e o Google.</p>
      </>
    ),
  },
  {
    route: '/admin/secoes/hero',
    target: '[data-tour="save-bar"]',
    title: 'Salvar alterações',
    body: (
      <ul>
        <li>
          Depois de mudar algo, esta barra mostra <strong>Alterações não salvas</strong>.
        </li>
        <li>
          <strong>Salvar alterações</strong> publica na hora; <strong>Descartar</strong> volta ao que estava salvo.
        </li>
        <li>Se tentar sair sem salvar, o painel pergunta antes.</li>
      </ul>
    ),
  },
  {
    route: '/admin/secoes/hero',
    target: '[data-tour="view-site"]',
    title: 'Conferir no site',
    body: (
      <p>
        <strong>Ver no site</strong> abre esta parte do site em outra aba. Depois de salvar, recarregue a aba para ver a
        mudança.
      </p>
    ),
  },
  {
    route: '/admin/secoes/events',
    target: '[data-tour="list-add"]',
    title: 'Listas: adicionar itens',
    body: (
      <p>
        Tipos de evento, galeria, perguntas frequentes e outras partes do site são listas. <strong>Adicionar</strong>{' '}
        cria um item no fim da lista, que é onde ele aparece no site.
      </p>
    ),
  },
  {
    route: '/admin/secoes/events',
    target: '[data-tour="list-item"]',
    title: 'Ordenar, ocultar e excluir',
    body: (
      <ul>
        <li>As setas ↑ ↓ mudam a ordem no site.</li>
        <li>
          Desmarcar <strong>Exibir no site</strong> esconde o item sem apagá-lo.
        </li>
        <li>
          <strong>Excluir</strong> pede confirmação e não pode ser desfeito.
        </li>
      </ul>
    ),
  },
  {
    route: '/admin/imagens',
    target: '[data-tour="media-upload"]',
    title: 'Biblioteca de imagens',
    body: (
      <p>
        Envie fotos aqui (JPG, PNG ou WebP de até 10 MB). O painel reduz e otimiza cada uma, e todas ficam disponíveis
        para usar em qualquer seção.
      </p>
    ),
  },
  {
    route: '/admin/contato',
    target: '[data-tour="whatsapp"]',
    title: 'WhatsApp e contatos',
    body: (
      <p>
        Aqui fica o número que recebe os pedidos de orçamento e a mensagem inicial da conversa. Use{' '}
        <strong>Teste o número</strong> para conferir. Mais abaixo ficam e-mail, redes sociais e logotipo.
      </p>
    ),
  },
  {
    route: '/admin/seo',
    target: '[data-tour="seo"]',
    title: 'Google e compartilhamento',
    body: (
      <p>
        O título e a descrição que aparecem no Google. Logo abaixo, a imagem mostrada quando alguém envia o link do site
        pelo WhatsApp ou pelas redes sociais.
      </p>
    ),
  },
  {
    route: '/admin/conta',
    target: '[data-tour="password"]',
    title: 'Sua conta',
    body: (
      <p>
        Troque sua senha aqui. Esqueceu? Use <strong>Esqueci minha senha</strong> na tela de entrada.
      </p>
    ),
  },
  {
    route: '/admin',
    target: '[data-tour="help"]',
    fallbackTarget: MENU_BUTTON,
    title: 'Precisa de ajuda?',
    body: (
      <p>
        Em <strong>Ajuda</strong>, no fim do menu, você refaz este tour ou fala com o suporte quando precisar.
      </p>
    ),
  },
];
