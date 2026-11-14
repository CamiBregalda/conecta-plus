// Componentes de UI reutilizáveis (retornam strings HTML já escapadas).
import {
  esc,
  mediaNotas,
  iniciais,
  matizDoId,
  menorPreco,
  formatarPreco,
} from './utils.js';

export function estrelas(nota) {
  const cheias = Math.round(nota);
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="estrela ${i <= cheias ? 'cheia' : ''}" aria-hidden="true">★</span>`;
  }
  return `<span class="estrelas" role="img" aria-label="Nota ${nota.toFixed(1)} de 5">${html}</span>`;
}

export function avatar(p, tamanho = '') {
  const h = matizDoId(p.id);
  return `<div class="avatar ${tamanho}" style="--matiz:${h}" aria-hidden="true">${esc(
    iniciais(p.nome)
  )}</div>`;
}

export function cardProfissional(p) {
  const media = mediaNotas(p.avaliacoes);
  const preco = menorPreco(p.servicos);
  return `
    <article class="card ${p.patrocinado ? 'card-destaque' : ''}">
      <div class="card-topo">
        ${avatar(p)}
        <div class="card-titulo">
          ${p.patrocinado ? '<span class="selo selo-patrocinado">Patrocinado</span>' : ''}
          <h3><a href="#/profissional/${p.id}">${esc(p.nome)}</a></h3>
          <p class="categoria">${esc(p.categoria)}</p>
        </div>
      </div>
      <div class="nota-linha">
        ${estrelas(media)}
        <strong>${media.toFixed(1)}</strong>
        <span class="muted">(${p.avaliacoes.length} ${p.avaliacoes.length === 1 ? 'avaliação' : 'avaliações'})</span>
      </div>
      <p class="local">📍 ${esc(p.bairro)}, ${esc(p.cidade)}</p>
      <p class="descricao-curta">${esc(p.descricao)}</p>
      <div class="card-rodape">
        <div>
          <span class="muted pequeno">A partir de</span>
          <div class="preco">${esc(formatarPreco(preco))}</div>
        </div>
        <span class="selo ${p.aceitandoClientes ? 'selo-ok' : 'selo-off'}">
          ${p.aceitandoClientes ? 'Aceitando clientes' : 'Agenda cheia'}
        </span>
      </div>
      <a class="btn btn-bloco" href="#/profissional/${p.id}">Ver detalhes</a>
    </article>`;
}

/** Espaço reservado para publicidade de estabelecimentos locais (monetização). */
export function anuncio(variante = 'faixa') {
  return `
    <aside class="anuncio anuncio-${variante}" aria-label="Publicidade">
      <span class="anuncio-rotulo">Publicidade</span>
      <strong>Sua empresa pode aparecer aqui</strong>
      <span>Divulgue seu estabelecimento para quem procura serviços na sua região.</span>
    </aside>`;
}
