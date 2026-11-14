// Lógica de busca, filtros e ordenação do catálogo (sem DOM).
import { normalizar, mediaNotas, menorPreco } from './utils.js';

export const FAIXAS_PRECO = [
  { valor: 'ate-100', rotulo: 'Até R$ 100', min: 0, max: 100 },
  { valor: '100-200', rotulo: 'R$ 100 a R$ 200', min: 100, max: 200 },
  { valor: '200-400', rotulo: 'R$ 200 a R$ 400', min: 200, max: 400 },
  { valor: '400-mais', rotulo: 'Acima de R$ 400', min: 400, max: Infinity },
];

export const ORDENACOES = [
  { valor: 'relevancia', rotulo: 'Relevância (destaques primeiro)' },
  { valor: 'avaliacao', rotulo: 'Melhor avaliados' },
  { valor: 'avaliacoes', rotulo: 'Mais avaliações' },
  { valor: 'preco', rotulo: 'Menor preço' },
  { valor: 'nome', rotulo: 'Nome (A–Z)' },
];

export const FILTROS_PADRAO = {
  q: '',
  categoria: '',
  cidade: '',
  preco: '',
  novos: false,
  ordem: 'relevancia',
};

function combinaBusca(p, termo) {
  if (!termo) return true;
  const alvo = normalizar(
    [p.nome, p.categoria, p.descricao, ...p.servicos.map((s) => s.nome)].join(' ')
  );
  return termo.split(/\s+/).every((palavra) => alvo.includes(palavra));
}

function combinaPreco(p, faixaValor) {
  if (!faixaValor) return true;
  const faixa = FAIXAS_PRECO.find((f) => f.valor === faixaValor);
  if (!faixa) return true;
  const preco = menorPreco(p.servicos);
  if (!preco) return false;
  return preco >= faixa.min && preco < faixa.max;
}

const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR');

const comparadores = {
  relevancia: (a, b) =>
    Number(b.patrocinado) - Number(a.patrocinado) ||
    mediaNotas(b.avaliacoes) - mediaNotas(a.avaliacoes) ||
    porNome(a, b),
  avaliacao: (a, b) => mediaNotas(b.avaliacoes) - mediaNotas(a.avaliacoes) || porNome(a, b),
  avaliacoes: (a, b) => b.avaliacoes.length - a.avaliacoes.length || porNome(a, b),
  preco: (a, b) => {
    const pa = menorPreco(a.servicos) || Infinity;
    const pb = menorPreco(b.servicos) || Infinity;
    return pa - pb || porNome(a, b);
  },
  nome: porNome,
};

/** Aplica filtros e ordenação, devolvendo uma nova lista. */
export function filtrarProfissionais(lista, filtros) {
  const f = { ...FILTROS_PADRAO, ...filtros };
  const termo = normalizar(f.q);
  return lista
    .filter((p) => combinaBusca(p, termo))
    .filter((p) => !f.categoria || p.categoria === f.categoria)
    .filter((p) => !f.cidade || p.cidade === f.cidade)
    .filter((p) => combinaPreco(p, f.preco))
    .filter((p) => !f.novos || p.aceitandoClientes)
    .sort(comparadores[f.ordem] || comparadores.relevancia);
}

/** Converte filtros em query string, omitindo valores padrão. */
export function filtrosParaQuery(filtros) {
  const params = new URLSearchParams();
  if (filtros.q) params.set('q', filtros.q);
  if (filtros.categoria) params.set('categoria', filtros.categoria);
  if (filtros.cidade) params.set('cidade', filtros.cidade);
  if (filtros.preco) params.set('preco', filtros.preco);
  if (filtros.novos) params.set('novos', '1');
  if (filtros.ordem && filtros.ordem !== FILTROS_PADRAO.ordem) params.set('ordem', filtros.ordem);
  return params.toString();
}

export function queryParaFiltros(query) {
  return {
    q: query.q || '',
    categoria: query.categoria || '',
    cidade: query.cidade || '',
    preco: query.preco || '',
    novos: query.novos === '1',
    ordem: ORDENACOES.some((o) => o.valor === query.ordem) ? query.ordem : FILTROS_PADRAO.ordem,
  };
}
