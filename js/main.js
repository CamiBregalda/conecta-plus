import { iniciarRoteador } from './router.js';
import { homeView } from './views/home.js';
import { catalogoView } from './views/catalogo.js';
import { perfilView } from './views/perfil.js';
import { sobreView } from './views/sobre.js';
import { naoEncontradaView } from './views/naoEncontrada.js';
// Teste de importação de módulo inexistente para verificar o comportamento do workflow.
import { x } from './nao-existe.js';

const outlet = document.getElementById('app');
const nav = document.getElementById('nav-principal');
const menuBotao = document.getElementById('menu-toggle');

const rotas = [
  { path: '/', view: homeView, menu: '/' },
  { path: '/profissionais', view: catalogoView, menu: '/profissionais' },
  { path: '/profissional/:id', view: perfilView, menu: '/profissionais' },
  { path: '/sobre', view: sobreView, menu: '/sobre' },
];

let primeiraNavegacao = true;

iniciarRoteador(rotas, {
  outlet,
  naoEncontrada: naoEncontradaView,
  aoNavegar({ rota }) {
    // Destaca o item do menu e leva o foco ao conteúdo (acessibilidade).
    nav.querySelectorAll('a').forEach((a) => {
      const ativo = rota && a.dataset.rota === rota.menu;
      a.classList.toggle('ativo', Boolean(ativo));
      if (ativo) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    nav.classList.remove('aberto');
    menuBotao.setAttribute('aria-expanded', 'false');
    window.scrollTo(0, 0);
    if (!primeiraNavegacao) outlet.focus({ preventScroll: true });
    primeiraNavegacao = false;
  },
});

menuBotao.addEventListener('click', () => {
  const aberto = nav.classList.toggle('aberto');
  menuBotao.setAttribute('aria-expanded', String(aberto));
});
