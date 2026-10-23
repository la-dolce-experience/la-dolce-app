import type { ReactNode } from 'react';
import type { SectionRow } from '../../../services/adminService';

export interface TourStep {
  /**
   * Tela do painel aberta neste passo. "/admin/secoes/@tipo" abre a primeira seção daquele tipo
   * (ver resolveTourSteps); sem seção do tipo, o passo é pulado.
   */
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
        <p>Cada item do menu é uma seção do site, na mesma ordem em que o visitante vê.</p>
        <p>
          No celular, o menu fica no botão <strong>Menu</strong>, no topo da tela.
        </p>
      </>
    ),
  },
  {
    route: '/admin/secoes',
    target: '[data-tour="sections-order"]',
    title: 'Monte a página',
    body: (
      <>
        <p>
          Aqui fica a ordem das seções. Arraste pela alça (no computador) ou use as setas ↑ ↓. A nova ordem vale na hora
          no site.
        </p>
        <p>
          Em cada linha dá para <strong>ocultar</strong>, <strong>duplicar</strong>, <strong>editar</strong> ou{' '}
          <strong>excluir</strong> a seção. Seções excluídas ficam na Lixeira por 30 dias.
        </p>
      </>
    ),
  },
  {
    route: '/admin/secoes',
    target: '[data-tour="sections-add"]',
    title: 'Adicionar seções',
    body: (
      <p>
        Escolha o tipo (texto com imagem, cartões, galeria, depoimentos, perguntas…), dê um nome e diga onde ela entra.
        Passando o mouse entre duas seções aparece <strong>Adicionar seção aqui</strong>.
      </p>
    ),
  },
  {
    route: '/admin/secoes/@hero',
    target: '[data-tour="image-picker"]',
    title: 'Textos e fotos',
    body: (
      <>
        <p>
          Este é o <strong>Destaque principal</strong>, a primeira parte do site. Altere os textos nos campos e use{' '}
          <strong>Trocar imagem</strong> para escolher outra foto.
        </p>
        <p>A descrição da foto é importante: ela ajuda pessoas com deficiência visual e o Google.</p>
      </>
    ),
  },
  {
    route: '/admin/secoes/@hero',
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
    route: '/admin/secoes/@hero',
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
    route: '/admin/secoes/@hero',
    target: '[data-tour="section-identity"]',
    title: 'Nome, menu e endereço',
    body: (
      <p>
        Cada seção tem um nome (só no painel), um item opcional no menu do site e um endereço, usado nos links do menu.
      </p>
    ),
  },
  {
    route: '/admin/secoes/@cartoes',
    target: '[data-tour="list-add"]',
    title: 'Listas: adicionar itens',
    body: (
      <p>
        Cartões, galeria, depoimentos, perguntas e outras seções têm listas. <strong>Adicionar</strong> cria um item no
        fim da lista, que é onde ele aparece no site.
      </p>
    ),
  },
  {
    route: '/admin/secoes/@cartoes',
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
    route: '/admin/secoes/@catalogo',
    target: '[data-tour="list-catalogo"]',
    title: 'Sabores e apresentações',
    body: (
      <p>
        Cadastre quantos <strong>sabores</strong> e <strong>apresentações</strong> (copinho, casquinha...) quiser, com
        descrição e foto opcionais. Cada lista é uma seção: no site, elas aparecem abaixo de &ldquo;Sabores e
        apresentação&rdquo;.
      </p>
    ),
  },
  {
    route: '/admin/secoes/@galeria',
    target: '[data-tour="list-galeria"]',
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
    route: '/admin/secoes/@depoimentos',
    target: '[data-tour="list-depoimentos"]',
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
    route: '/admin/secoes/@formulario',
    target: '[data-tour="section-options"]',
    title: 'Formulário de orçamento',
    body: (
      <p>
        Escolha quais campos o formulário pede e o nome de cada um. Ao enviar, ele abre o WhatsApp com a mensagem
        pronta; as opções de &ldquo;Tipo de evento&rdquo; vêm dos cartões da seção <strong>Tipos de evento</strong>.
      </p>
    ),
  },
  {
    route: '/admin/secoes/@contato',
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
        O número que recebe as mensagens do site e a mensagem inicial da conversa. Use <strong>Teste o número</strong>{' '}
        para conferir. Mais abaixo ficam e-mail, redes sociais e logotipo.
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

/** Troca "/admin/secoes/@tipo" pelo endereço da primeira seção do tipo; sem seção do tipo, o passo sai do tour. */
export function resolveTourSteps(steps: TourStep[], sections: Pick<SectionRow, 'id' | 'type'>[]): TourStep[] {
  return steps.flatMap((step) => {
    const match = /^\/admin\/secoes\/@(.+)$/.exec(step.route);
    if (!match) return [step];
    const section = sections.find((s) => s.type === match[1]);
    return section ? [{ ...step, route: `/admin/secoes/${section.id}` }] : [];
  });
}
