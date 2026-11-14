// Funções utilitárias puras, sem dependência de DOM.

const entidades = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa texto para uso seguro dentro de HTML. */
export function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => entidades[c]);
}

/** Remove acentos e coloca em minúsculas, para buscas tolerantes. */
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function formatarPreco(valor) {
  if (!valor) return 'Sob consulta';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

export function formatarData(iso) {
  const [ano, mes, dia] = String(iso).split('-').map(Number);
  if (!ano) return '';
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Média das notas (0 quando não há avaliações). */
export function mediaNotas(avaliacoes) {
  if (!avaliacoes || !avaliacoes.length) return 0;
  const soma = avaliacoes.reduce((acc, a) => acc + a.nota, 0);
  return soma / avaliacoes.length;
}

export function iniciais(nome) {
  const partes = String(nome).split(/\s+/).filter((p) => p && /[A-Za-zÀ-ÿ]/.test(p[0]));
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
}

/** Matiz estável (0-359) derivado do id, usado nas cores dos avatares. */
export function matizDoId(id) {
  return (Number(id) * 47 + 160) % 360;
}

/** Menor preço entre os serviços (ignora serviços "sob consulta"). */
export function menorPreco(servicos) {
  const precos = (servicos || []).map((s) => s.preco).filter((p) => p > 0);
  return precos.length ? Math.min(...precos) : 0;
}

/** Link do WhatsApp (assume DDI 55 - Brasil). */
export function linkWhatsApp(telefone, mensagem) {
  const digitos = String(telefone).replace(/\D/g, '');
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : '';
  return `https://wa.me/55${digitos}${texto}`;
}

export function linkTelefone(telefone) {
  return `tel:+55${String(telefone).replace(/\D/g, '')}`;
}
