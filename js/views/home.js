import { carregarProfissionais } from '../dados.js';
import { cardProfissional } from '../componentes.js';
import { esc } from '../utils.js';

const ICONES = {
  'Elétrica': '⚡',
  'Hidráulica': '🚰',
  'Limpeza': '🧽',
  'Marcenaria': '🪚',
  'Pintura': '🎨',
  'Jardinagem': '🌿',
  'Assistência técnica': '🔧',
  'Montagem de móveis': '🪑',
  'Manutenção geral': '🏠',
};

export async function homeView(outlet) {
  const profissionais = await carregarProfissionais();
  const categorias = [...new Set(profissionais.map((p) => p.categoria))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );
  const destaques = profissionais.filter((p) => p.patrocinado).slice(0, 3);

  document.title = 'Conecta+ | Encontre profissionais perto de você';
  outlet.innerHTML = `
    <section class="hero">
      <div class="container hero-conteudo">
        <h1>Encontre o profissional certo, <span>perto de você</span></h1>
        <p>O Conecta+ aproxima clientes de profissionais autônomos e pequenos negócios da sua região.
        Compare avaliações, veja os serviços e entre em contato direto.</p>
        <form class="busca-hero" id="form-busca" role="search">
          <label class="sr-only" for="busca-home">Buscar profissional ou serviço</label>
          <input id="busca-home" name="q" type="search" placeholder="Ex.: eletricista, limpeza, conserto de geladeira…" autocomplete="off" />
          <button class="btn" type="submit">Buscar</button>
        </form>
        <p class="hero-numeros">
          <strong>${profissionais.length}</strong> profissionais ·
          <strong>${categorias.length}</strong> categorias ·
          <strong>${profissionais.reduce((s, p) => s + p.avaliacoes.length, 0)}</strong> avaliações
        </p>
      </div>
    </section>

    <section class="container secao">
      <h2>Categorias</h2>
      <div class="grade-categorias">
        ${categorias
          .map(
            (c) => `
          <a class="categoria-item" href="#/profissionais?categoria=${encodeURIComponent(c)}">
            <span class="categoria-icone" aria-hidden="true">${ICONES[c] || '🛠️'}</span>
            <span>${esc(c)}</span>
          </a>`
          )
          .join('')}
      </div>
    </section>

    <section class="container secao">
      <div class="secao-cabecalho">
        <h2>Em destaque</h2>
        <a href="#/profissionais">Ver todos →</a>
      </div>
      <div class="grade-cards">${destaques.map(cardProfissional).join('')}</div>
    </section>

    <section class="container secao">
      <h2>Como funciona</h2>
      <ol class="passos">
        <li><strong>Busque</strong><span>Pesquise pelo serviço ou nome e use os filtros de categoria e cidade.</span></li>
        <li><strong>Compare</strong><span>Veja descrição, serviços, preços e avaliações de outros clientes.</span></li>
        <li><strong>Entre em contato</strong><span>Fale direto com o profissional por WhatsApp, telefone ou e-mail.</span></li>
      </ol>
    </section>`;

  outlet.querySelector('#form-busca').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = new FormData(e.target).get('q').trim();
    location.hash = q ? `#/profissionais?q=${encodeURIComponent(q)}` : '#/profissionais';
  });
}
