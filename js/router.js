// Roteador simples baseado em hash (#/rota?param=valor).

function compilar(padrao) {
  const nomes = [];
  const regex = padrao.replace(/:([a-zA-Z]+)/g, (_, nome) => {
    nomes.push(nome);
    return '([^/]+)';
  });
  return { nomes, regex: new RegExp(`^${regex}$`) };
}

export function lerHash() {
  const bruto = location.hash.replace(/^#/, '') || '/';
  const [caminho, queryString = ''] = bruto.split('?');
  const query = Object.fromEntries(new URLSearchParams(queryString));
  return { caminho: caminho || '/', query };
}

/**
 * @param {Array<{path: string, view: Function, titulo?: string}>} rotas
 * @param {{outlet: HTMLElement, naoEncontrada: Function, aoNavegar?: Function}} opcoes
 */
export function iniciarRoteador(rotas, { outlet, naoEncontrada, aoNavegar }) {
  const tabela = rotas.map((r) => ({ ...r, ...compilar(r.path) }));
  let ultimaNavegacao = 0;

  async function navegar() {
    const { caminho, query } = lerHash();
    const id = ++ultimaNavegacao;

    let rota = null;
    let params = {};
    for (const r of tabela) {
      const m = caminho.match(r.regex);
      if (m) {
        rota = r;
        params = Object.fromEntries(
          r.nomes.map((nome, i) => [nome, decodeURIComponent(m[i + 1])])
        );
        break;
      }
    }

    const view = rota ? rota.view : naoEncontrada;
    try {
      await view(outlet, { params, query, caminho });
    } catch (erro) {
      console.error(erro);
      if (id === ultimaNavegacao) {
        outlet.innerHTML = `
          <section class="container estado-vazio">
            <h1>Algo deu errado</h1>
            <p>Não foi possível carregar esta página. Se você abriu o arquivo direto no navegador,
            execute o projeto com um servidor local (veja o README).</p>
            <a class="btn" href="#/">Voltar ao início</a>
          </section>`;
      }
    }
    if (id !== ultimaNavegacao) return;
    aoNavegar?.({ caminho, rota });
  }

  window.addEventListener('hashchange', navegar);
  navegar();
}
