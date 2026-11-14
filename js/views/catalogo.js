import { carregarProfissionais } from '../dados.js';
import { cardProfissional, anuncio } from '../componentes.js';
import {
  FAIXAS_PRECO,
  ORDENACOES,
  FILTROS_PADRAO,
  filtrarProfissionais,
  filtrosParaQuery,
  queryParaFiltros,
} from '../filtros.js';
import { esc } from '../utils.js';

export async function catalogoView(outlet, { query }) {
  const todos = await carregarProfissionais();
  const categorias = [...new Set(todos.map((p) => p.categoria))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );
  const cidades = [...new Set(todos.map((p) => p.cidade))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );
  const filtros = queryParaFiltros(query);

  document.title = 'Profissionais | Conecta+';
  outlet.innerHTML = `
    <div class="container">
      <nav class="migalhas" aria-label="Você está em"><a href="#/">Início</a> › <span>Todos os profissionais</span></nav>
      <div class="catalogo">
        <button class="btn btn-secundario filtros-toggle" id="filtros-toggle" aria-expanded="false" aria-controls="filtros">Filtros</button>
        <aside class="filtros" id="filtros" aria-label="Filtros">
          <div class="filtros-cabecalho">
            <h2>Filtros</h2>
            <button type="button" class="link-botao" id="limpar">Limpar</button>
          </div>

          <label class="campo-check">
            <input type="checkbox" id="f-novos" ${filtros.novos ? 'checked' : ''} />
            <span>Apenas aceitando novos clientes</span>
          </label>

          <fieldset>
            <legend>Categoria</legend>
            <label class="campo-radio"><input type="radio" name="categoria" value="" ${!filtros.categoria ? 'checked' : ''} /> <span>Todas</span></label>
            ${categorias
              .map(
                (c) => `<label class="campo-radio"><input type="radio" name="categoria" value="${esc(c)}" ${
                  filtros.categoria === c ? 'checked' : ''
                } /> <span>${esc(c)}</span></label>`
              )
              .join('')}
          </fieldset>

          <div class="campo">
            <label for="f-preco">Preço (a partir de)</label>
            <select id="f-preco">
              <option value="">Qualquer preço</option>
              ${FAIXAS_PRECO.map(
                (f) => `<option value="${f.valor}" ${filtros.preco === f.valor ? 'selected' : ''}>${f.rotulo}</option>`
              ).join('')}
            </select>
          </div>

          <div class="campo">
            <label for="f-cidade">Localização</label>
            <select id="f-cidade">
              <option value="">Todas as cidades</option>
              ${cidades
                .map((c) => `<option value="${esc(c)}" ${filtros.cidade === c ? 'selected' : ''}>${esc(c)}</option>`)
                .join('')}
            </select>
          </div>

          ${anuncio('lateral')}
        </aside>

        <section class="resultados" aria-live="polite">
          <div class="barra-busca">
            <label class="sr-only" for="f-q">Buscar por nome ou serviço</label>
            <input id="f-q" type="search" placeholder="Buscar por nome ou serviço" value="${esc(filtros.q)}" autocomplete="off" />
            <div class="ordenar">
              <label for="f-ordem">Ordenar por</label>
              <select id="f-ordem">
                ${ORDENACOES.map(
                  (o) => `<option value="${o.valor}" ${filtros.ordem === o.valor ? 'selected' : ''}>${o.rotulo}</option>`
                ).join('')}
              </select>
            </div>
          </div>
          <div id="chips" class="chips"></div>
          <h1 class="titulo-resultados">Profissionais e serviços na sua região</h1>
          <p id="contagem" class="muted"></p>
          <div id="lista"></div>
        </section>
      </div>
    </div>`;

  const $ = (sel) => outlet.querySelector(sel);

  function atualizar() {
    const lista = filtrarProfissionais(todos, filtros);

    // Mantém os filtros na URL (permite compartilhar/recarregar) sem disparar nova navegação.
    const qs = filtrosParaQuery(filtros);
    history.replaceState(null, '', `#/profissionais${qs ? `?${qs}` : ''}`);

    $('#contagem').textContent = `${lista.length} ${lista.length === 1 ? 'resultado' : 'resultados'}`;

    const chips = [];
    if (filtros.q) chips.push(['q', `Busca: “${filtros.q}”`]);
    if (filtros.categoria) chips.push(['categoria', filtros.categoria]);
    if (filtros.cidade) chips.push(['cidade', filtros.cidade]);
    if (filtros.preco) chips.push(['preco', FAIXAS_PRECO.find((f) => f.valor === filtros.preco)?.rotulo]);
    if (filtros.novos) chips.push(['novos', 'Aceitando novos clientes']);
    $('#chips').innerHTML = chips.length
      ? `<span class="muted pequeno">Filtros ativos:</span>` +
        chips
          .map(
            ([chave, rotulo]) =>
              `<button type="button" class="chip" data-remover="${chave}" aria-label="Remover filtro ${esc(rotulo)}">${esc(rotulo)} ✕</button>`
          )
          .join('')
      : '';

    if (!lista.length) {
      $('#lista').innerHTML = `
        <div class="estado-vazio">
          <h2>Nenhum profissional encontrado</h2>
          <p>Tente mudar a busca ou remover alguns filtros.</p>
          <button type="button" class="btn" id="limpar-vazio">Limpar filtros</button>
        </div>`;
      $('#limpar-vazio').addEventListener('click', limpar);
      return;
    }

    const cards = lista.map(cardProfissional);
    // Faixa de publicidade entre os resultados.
    if (cards.length > 6) cards.splice(6, 0, `<div class="grade-item-cheio">${anuncio('faixa')}</div>`);
    $('#lista').innerHTML = `<div class="grade-cards">${cards.join('')}</div>`;
  }

  function sincronizarControles() {
    $('#f-q').value = filtros.q;
    $('#f-novos').checked = filtros.novos;
    $('#f-preco').value = filtros.preco;
    $('#f-cidade').value = filtros.cidade;
    $('#f-ordem').value = filtros.ordem;
    const radio = outlet.querySelector(`input[name="categoria"][value="${CSS.escape(filtros.categoria)}"]`);
    if (radio) radio.checked = true;
  }

  function limpar() {
    Object.assign(filtros, FILTROS_PADRAO);
    sincronizarControles();
    atualizar();
  }

  $('#f-q').addEventListener('input', (e) => {
    filtros.q = e.target.value;
    atualizar();
  });
  $('#f-novos').addEventListener('change', (e) => {
    filtros.novos = e.target.checked;
    atualizar();
  });
  $('#f-preco').addEventListener('change', (e) => {
    filtros.preco = e.target.value;
    atualizar();
  });
  $('#f-cidade').addEventListener('change', (e) => {
    filtros.cidade = e.target.value;
    atualizar();
  });
  $('#f-ordem').addEventListener('change', (e) => {
    filtros.ordem = e.target.value;
    atualizar();
  });
  outlet.querySelectorAll('input[name="categoria"]').forEach((r) =>
    r.addEventListener('change', (e) => {
      filtros.categoria = e.target.value;
      atualizar();
    })
  );
  $('#limpar').addEventListener('click', limpar);
  $('#chips').addEventListener('click', (e) => {
    const botao = e.target.closest('[data-remover]');
    if (!botao) return;
    const chave = botao.dataset.remover;
    filtros[chave] = FILTROS_PADRAO[chave];
    sincronizarControles();
    atualizar();
  });
  $('#filtros-toggle').addEventListener('click', (e) => {
    const aberto = $('#filtros').classList.toggle('aberto');
    e.currentTarget.setAttribute('aria-expanded', String(aberto));
  });

  atualizar();
}
