// Acesso aos dados. Hoje: JSON estático + avaliações salvas no localStorage.
// Quando houver backend/API, apenas este módulo precisa ser trocado.

const URL_DADOS = 'data/profissionais.json';
const CHAVE_AVALIACOES = 'conectaplus:avaliacoes';

let cache = null;

function lerAvaliacoesLocais() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_AVALIACOES)) || {};
  } catch {
    return {};
  }
}

function salvarAvaliacoesLocais(obj) {
  try {
    localStorage.setItem(CHAVE_AVALIACOES, JSON.stringify(obj));
    return true;
  } catch {
    return false;
  }
}

async function carregarBase() {
  if (!cache) {
    const resposta = await fetch(URL_DADOS);
    if (!resposta.ok) throw new Error(`Falha ao carregar dados (${resposta.status})`);
    cache = await resposta.json();
  }
  return cache;
}

/** Lista de profissionais, já com as avaliações do usuário mescladas (mais recentes primeiro). */
export async function carregarProfissionais() {
  const base = await carregarBase();
  const locais = lerAvaliacoesLocais();
  return base.map((p) => ({
    ...p,
    avaliacoes: [...(locais[p.id] || []), ...p.avaliacoes].sort((a, b) =>
      b.data.localeCompare(a.data)
    ),
  }));
}

export async function obterProfissional(id) {
  const lista = await carregarProfissionais();
  return lista.find((p) => p.id === Number(id)) || null;
}

/** Salva uma nova avaliação no navegador do usuário. Retorna false se o armazenamento falhar. */
export function adicionarAvaliacao(idProfissional, { autor, nota, comentario }) {
  const locais = lerAvaliacoesLocais();
  const hoje = new Date().toISOString().slice(0, 10);
  const nova = { autor, nota: Number(nota), comentario, data: hoje };
  locais[idProfissional] = [nova, ...(locais[idProfissional] || [])];
  return salvarAvaliacoesLocais(locais);
}
