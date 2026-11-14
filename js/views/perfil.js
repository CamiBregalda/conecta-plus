import { obterProfissional, adicionarAvaliacao } from '../dados.js';
import { avatar, estrelas } from '../componentes.js';
import {
  esc,
  mediaNotas,
  formatarPreco,
  formatarData,
  linkWhatsApp,
  linkTelefone,
} from '../utils.js';

function distribuicao(avaliacoes) {
  const total = avaliacoes.length || 1;
  return [5, 4, 3, 2, 1]
    .map((n) => {
      const qtd = avaliacoes.filter((a) => a.nota === n).length;
      const pct = Math.round((qtd / total) * 100);
      return `
        <div class="dist-linha">
          <span>${n} ★</span>
          <div class="dist-barra"><div style="width:${pct}%"></div></div>
          <span class="muted pequeno">${qtd}</span>
        </div>`;
    })
    .join('');
}

export async function perfilView(outlet, ctx) {
  const p = await obterProfissional(ctx.params.id);

  if (!p) {
    document.title = 'Profissional não encontrado | Conecta+';
    outlet.innerHTML = `
      <section class="container estado-vazio">
        <h1>Profissional não encontrado</h1>
        <p>O perfil que você procura não existe ou foi removido.</p>
        <a class="btn" href="#/profissionais">Ver todos os profissionais</a>
      </section>`;
    return;
  }

  const media = mediaNotas(p.avaliacoes);
  const mensagem = `Olá, ${p.nome}! Encontrei seu perfil no Conecta+ e gostaria de um orçamento.`;
  document.title = `${p.nome} | Conecta+`;

  outlet.innerHTML = `
    <div class="container">
      <nav class="migalhas" aria-label="Você está em">
        <a href="#/">Início</a> › <a href="#/profissionais">Profissionais</a> › <span>${esc(p.nome)}</span>
      </nav>

      <div class="perfil">
        <div class="perfil-principal">
          <header class="perfil-cabecalho">
            ${avatar(p, 'avatar-grande')}
            <div>
              ${p.patrocinado ? '<span class="selo selo-patrocinado">Patrocinado</span>' : ''}
              <h1>${esc(p.nome)}</h1>
              <p class="categoria">${esc(p.categoria)} · 📍 ${esc(p.bairro)}, ${esc(p.cidade)}</p>
              <div class="nota-linha">
                ${estrelas(media)} <strong>${media.toFixed(1)}</strong>
                <span class="muted">(${p.avaliacoes.length} ${p.avaliacoes.length === 1 ? 'avaliação' : 'avaliações'})</span>
              </div>
              <span class="selo ${p.aceitandoClientes ? 'selo-ok' : 'selo-off'}">
                ${p.aceitandoClientes ? 'Aceitando novos clientes' : 'Agenda cheia no momento'}
              </span>
            </div>
          </header>

          <section class="bloco">
            <h2>Sobre</h2>
            <p>${esc(p.descricao)}</p>
          </section>

          <section class="bloco">
            <h2>Serviços oferecidos</h2>
            <ul class="lista-servicos">
              ${p.servicos
                .map(
                  (s) => `<li><span>${esc(s.nome)}</span><strong>${s.preco ? 'a partir de ' : ''}${esc(formatarPreco(s.preco))}</strong></li>`
                )
                .join('')}
            </ul>
            <p class="muted pequeno">Valores de referência. O preço final é combinado diretamente com o profissional.</p>
          </section>

          <section class="bloco" id="avaliacoes">
            <h2>Avaliações</h2>
            <div class="resumo-avaliacoes">
              <div class="resumo-nota">
                <div class="nota-grande">${media.toFixed(1)}</div>
                ${estrelas(media)}
                <span class="muted pequeno">${p.avaliacoes.length} avaliações</span>
              </div>
              <div class="dist">${distribuicao(p.avaliacoes)}</div>
            </div>

            <ul class="lista-avaliacoes">
              ${p.avaliacoes
                .map(
                  (a) => `
                <li>
                  <div class="avaliacao-topo">
                    <strong>${esc(a.autor)}</strong>
                    ${estrelas(a.nota)}
                    <span class="muted pequeno">${esc(formatarData(a.data))}</span>
                  </div>
                  <p>${esc(a.comentario)}</p>
                </li>`
                )
                .join('')}
            </ul>

            <form class="form-avaliacao" id="form-avaliacao" novalidate>
              <h3>Deixe sua avaliação</h3>
              <div class="campo">
                <label for="av-autor">Seu nome</label>
                <input id="av-autor" name="autor" maxlength="40" required />
              </div>
              <div class="campo">
                <label for="av-nota">Nota</label>
                <select id="av-nota" name="nota" required>
                  <option value="">Selecione…</option>
                  <option value="5">5 – Excelente</option>
                  <option value="4">4 – Muito bom</option>
                  <option value="3">3 – Bom</option>
                  <option value="2">2 – Regular</option>
                  <option value="1">1 – Ruim</option>
                </select>
              </div>
              <div class="campo">
                <label for="av-comentario">Comentário</label>
                <textarea id="av-comentario" name="comentario" rows="3" maxlength="300" required></textarea>
              </div>
              <p class="erro" id="av-erro" role="alert" hidden></p>
              <button class="btn" type="submit">Enviar avaliação</button>
              <p class="muted pequeno">Nesta versão, as avaliações ficam salvas apenas no seu navegador.</p>
            </form>
          </section>
        </div>

        <aside class="perfil-lateral">
          <div class="contato">
            <h2>Contato</h2>
            <a class="btn btn-whats btn-bloco" href="${esc(linkWhatsApp(p.telefone, mensagem))}" target="_blank" rel="noopener noreferrer">Chamar no WhatsApp</a>
            <a class="btn btn-secundario btn-bloco" href="${esc(linkTelefone(p.telefone))}">Ligar ${esc(p.telefone)}</a>
            <a class="btn btn-secundario btn-bloco" href="mailto:${esc(p.email)}">Enviar e-mail</a>
          </div>
          <a class="btn btn-secundario btn-bloco" href="#/profissionais">← Voltar ao catálogo</a>
        </aside>
      </div>
    </div>`;

  outlet.querySelector('#form-avaliacao').addEventListener('submit', (e) => {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(e.target));
    const erro = outlet.querySelector('#av-erro');
    const autor = (dados.autor || '').trim();
    const comentario = (dados.comentario || '').trim();

    if (!autor || !dados.nota || comentario.length < 5) {
      erro.textContent = 'Preencha seu nome, escolha uma nota e escreva um comentário de pelo menos 5 caracteres.';
      erro.hidden = false;
      return;
    }
    if (!adicionarAvaliacao(p.id, { autor, nota: dados.nota, comentario })) {
      erro.textContent = 'Não foi possível salvar a avaliação neste navegador.';
      erro.hidden = false;
      return;
    }
    // Recarrega o perfil para refletir a nova avaliação e mantém a posição na seção.
    perfilView(outlet, ctx).then(() => outlet.querySelector('#avaliacoes')?.scrollIntoView());
  });
}
