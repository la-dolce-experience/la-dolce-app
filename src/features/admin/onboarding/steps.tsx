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

/** Tour guiado: percorre todas as funções do painel, na ordem em que a pessoa vai usá-las. */
export const TOUR_STEPS: TourStep[] = [
  {
    route: '/admin',
    title: 'Boas-vindas ao painel',
    body: (
      <>
        <p>Aqui você altera os textos, as fotos e os contatos do site, sem precisar de programador.</p>
        <p>
          Neste tour, o painel abre cada tela e destaca onde tocar. Use <strong>Próximo</strong> e{' '}
          <strong>Voltar</strong> para navegar. Você pode refazê-lo depois em <strong>Ajuda</strong>.
        </p>
      </>
    ),
  },
  {
    route: '/admin',
    target: '[data-tour="metrics"]',
    title: 'Resultados do site',
    body: (
      <p>
        Quantas pessoas visitaram o site e quantas tocaram para falar no WhatsApp, por dia e por botão. Escolha 7, 30 ou
        90 dias.
      </p>
    ),
  },
  {
    route: '/admin',
    target: '[data-tour="checklist"]',
    title: 'O que falta preencher',
    body: <p>A lista mostra o que ainda falta no site, com um atalho para preencher cada item.</p>,
  },
  {
    route: '/admin',
    target: '[data-tour="nav-sections"]',
    fallbackTarget: MENU_BUTTON,
    title: 'O site, parte por parte',
    body: (
      <>
        <p>Cada item do menu é uma parte do site, na mesma ordem em que o visitante vê.</p>
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
          Este é o <strong>Destaque principal</strong>, a primeira parte do site. Altere os textos nos campos e use{' '}
          <strong>Trocar imagem</strong> para escolher outra foto.
        </p>
        <p>A descrição da foto é obrigatória: ela ajuda pessoas com deficiência visual e o Google.</p>
      </>
    ),
  },
  {
    route: '/admin/secoes/hero',
    target: '[data-tour="preview-open"]',
    title: 'Pré-visualização ao vivo',
    body: (
      <>
        <p>
          <strong>Pré-visualizar</strong> mostra o site dentro do painel, já com o que você está digitando, antes de
          salvar. Só você vê.
        </p>
        <p>
          Dá para alternar entre <strong>Celular</strong> e <strong>Computador</strong>. Toda tela do site tem esse
          botão, inclusive as listas.
        </p>
      </>
    ),
  },
  {
    route: '/admin/secoes/hero',
    target: '[data-tour="save-bar"]',
    title: 'Salvar ou descartar',
    body: (
      <>
        <p>
          Depois de mudar algo, esta barra mostra <strong>Alterações não salvas</strong>.
        </p>
        <p>
          <strong>Salvar alterações</strong> publica na hora; <strong>Descartar</strong> volta ao que estava salvo. Se
          tentar sair sem salvar, o painel pergunta antes.
        </p>
      </>
    ),
  },
  {
    route: '/admin/secoes/hero',
    target: '[data-tour="view-site"]',
    title: 'Conferir no site',
    body: (
      <p>
        <strong>Ver no site</strong> abre esta parte do site publicado em outra aba, do jeito que os visitantes veem.
      </p>
    ),
  },
  {
    route: '/admin/secoes/events',
    target: '[data-tour="list-add"]',
    title: 'Listas: adicionar itens',
    body: (
      <p>
        Tipos de evento, sabores, galeria, depoimentos, perguntas e outras partes do site são listas.{' '}
        <strong>Adicionar</strong> cria um item no fim da lista, que é onde ele aparece no site.
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
          <strong>Excluir</strong> manda o item para a <strong>Lixeira</strong>, de onde ele volta por 30 dias.
        </li>
      </ul>
    ),
  },
  {
    route: '/admin/secoes/flavors',
    target: '[data-tour="list-sabor"]',
    title: 'Sabores e apresentações',
    body: (
      <p>
        Cadastre quantos <strong>sabores</strong> e <strong>apresentações</strong> (copinho, casquinha...) quiser, com
        descrição e foto opcionais. Eles aparecem no site abaixo do texto da seção.
      </p>
    ),
  },
  {
    route: '/admin/secoes/gallery',
    target: '[data-tour="list-gallery_items"]',
    title: 'Galeria de fotos',
    body: (
      <>
        <p>Adicione fotos de eventos e produtos. A primeira aparece em destaque.</p>
        <p>
          Com mais de 3 fotos, o site mostra as duas primeiras e a terceira desfocada com <strong>+N</strong>. Ao tocar,
          todas abrem em tela cheia, em carrossel.
        </p>
      </>
    ),
  },
  {
    route: '/admin/secoes/testimonials',
    target: '[data-tour="list-testimonials"]',
    title: 'Depoimentos',
    body: (
      <>
        <p>
          Cada depoimento tem nota de <strong>1 a 5 estrelas</strong> e pode ter até <strong>5 fotos do evento</strong>,
          que abrem em tela cheia como na galeria, além de uma foto de perfil. No site, eles passam em carrossel.
        </p>
        <p>
          Só aparecem os marcados com <strong>Tenho autorização para publicar</strong>.
        </p>
      </>
    ),
  },
  {
    route: '/admin/secoes/quote',
    target: '[data-tour="section-form"]',
    title: 'Formulário de orçamento',
    body: (
      <p>
        Os textos do formulário que abre o WhatsApp com os dados do evento. As opções de &ldquo;Tipo de evento&rdquo;
        vêm da tela <strong>Tipos de evento</strong>.
      </p>
    ),
  },
  {
    route: '/admin/secoes/location',
    target: '[data-tour="location"]',
    title: 'Atendimento e localização',
    body: <p>Região atendida, horários, endereço e o mapa do Google. Campos em branco não aparecem no site.</p>,
  },
  {
    route: '/admin/imagens',
    target: '[data-tour="media-upload"]',
    title: 'Biblioteca de imagens',
    body: (
      <p>
        Envie fotos aqui, inclusive direto do iPhone (JPG, PNG, WebP ou HEIC de até 10 MB). O painel reduz e otimiza
        cada uma, e todas ficam disponíveis em qualquer parte do site.
      </p>
    ),
  },
  {
    route: '/admin/contato',
    target: '[data-tour="whatsapp"]',
    title: 'WhatsApp e contatos',
    body: (
      <p>
        O número que recebe os pedidos de orçamento e a mensagem inicial da conversa. Use{' '}
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
        O título e a descrição que aparecem no Google e a imagem mostrada quando alguém envia o link do site. O site é
        republicado sozinho alguns minutos depois de salvar; para atualizar na hora, use{' '}
        <strong>Atualizar prévia do link</strong>, no fim da página.
      </p>
    ),
  },
  {
    route: '/admin/lixeira',
    target: '[data-tour="trash"]',
    title: 'Lixeira e cópia de segurança',
    body: (
      <p>
        Excluiu algo por engano? Restaure aqui por até 30 dias. Nesta tela você também baixa uma{' '}
        <strong>cópia de todo o conteúdo</strong> do site.
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
