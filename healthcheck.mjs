// Health check da aplicação publicada. Sem dependências (usa o fetch do Node 18+).
//
// Uso:   node scripts/healthcheck.mjs <url-da-aplicacao>
// Opções (variáveis de ambiente):
//   HC_RETRIES   número de tentativas            (padrão 3)
//   HC_DELAY     segundos entre tentativas       (padrão 15)
//   HC_TIMEOUT   timeout de cada requisição, s   (padrão 15)
//   HC_TEXTO     texto esperado na página inicial (padrão "Conecta+")
//
// A aplicação é considerada DISPONÍVEL quando todas as verificações passam:
//   1. a página inicial responde HTTP 200 dentro do timeout;
//   2. a página contém o texto esperado (garante que é a aplicação, e não uma página de erro);
//   3. o arquivo de dados responde 200 e é uma lista JSON não vazia (garante que está funcional);
//   4. os arquivos principais (CSS e JavaScript) respondem 200.
// Qualquer outro resultado é INDISPONIBILIDADE: o processo termina com código 1.

import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function buscar(url, timeoutMs) {
  const inicio = Date.now();
  const resposta = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'user-agent': 'conecta-plus-healthcheck', 'cache-control': 'no-cache' },
    redirect: 'follow',
  });
  const corpo = await resposta.text();
  return { status: resposta.status, corpo, ms: Date.now() - inicio };
}

/** Executa uma única rodada de verificações. Retorna { ok, verificacoes }. */
export async function verificar(urlBase, { texto = 'Conecta+', timeoutMs = 15000 } = {}) {
  const base = urlBase.endsWith('/') ? urlBase : `${urlBase}/`;
  const verificacoes = [];
  const registrar = (nome, ok, detalhe, ms = null) => verificacoes.push({ nome, ok, detalhe, ms });

  async function etapa(nome, caminho, validar) {
    try {
      const r = await buscar(base + caminho, timeoutMs);
      if (r.status !== 200) return registrar(nome, false, `HTTP ${r.status}`, r.ms);
      const problema = validar ? validar(r.corpo) : null;
      registrar(nome, !problema, problema || `HTTP 200`, r.ms);
    } catch (erro) {
      const motivo = erro.name === 'TimeoutError' ? `sem resposta em ${timeoutMs / 1000}s` : erro.cause?.code || erro.message;
      registrar(nome, false, `falha de acesso: ${motivo}`);
    }
  }

  await etapa('Página inicial', '', (html) =>
    html.includes(texto) ? null : `texto esperado "${texto}" não encontrado`
  );
  await etapa('Dados (profissionais.json)', 'data/profissionais.json', (corpo) => {
    try {
      const dados = JSON.parse(corpo);
      return Array.isArray(dados) && dados.length > 0 ? null : 'lista de dados vazia ou inválida';
    } catch {
      return 'JSON inválido';
    }
  });
  await etapa('Estilos (css/styles.css)', 'css/styles.css');
  await etapa('Script principal (js/main.js)', 'js/main.js');

  return { ok: verificacoes.every((v) => v.ok), verificacoes };
}

/** Repete a verificação até passar ou esgotar as tentativas. */
export async function verificarComTentativas(urlBase, { tentativas = 3, esperaMs = 15000, log = () => {}, ...opcoes } = {}) {
  let resultado;
  for (let i = 1; i <= tentativas; i++) {
    resultado = await verificar(urlBase, opcoes);
    log(i, resultado);
    if (resultado.ok) return { ...resultado, tentativa: i };
    if (i < tentativas) await dormir(esperaMs);
  }
  return { ...resultado, tentativa: tentativas };
}

function resumoMarkdown(url, r, tentativas) {
  const linhas = r.verificacoes.map(
    (v) => `| ${v.ok ? '✅' : '❌'} | ${v.nome} | ${v.detalhe} | ${v.ms ?? '-'} ${v.ms != null ? 'ms' : ''} |`
  );
  return [
    `## ${r.ok ? '✅ Aplicação disponível' : '❌ Aplicação indisponível'}`,
    '',
    `- **URL:** ${url}`,
    `- **Tentativa:** ${r.tentativa} de ${tentativas}`,
    `- **Data/hora (UTC):** ${new Date().toISOString()}`,
    '',
    '| | Verificação | Resultado | Tempo |',
    '| --- | --- | --- | --- |',
    ...linhas,
    '',
  ].join('\n');
}

async function principal() {
  const url = process.argv[2];
  if (!url || !/^https?:\/\//.test(url)) {
    console.error('Uso: node scripts/healthcheck.mjs <url-da-aplicacao>');
    process.exit(2);
  }
  const tentativas = Number(process.env.HC_RETRIES || 3);
  const esperaMs = Number(process.env.HC_DELAY || 15) * 1000;
  const timeoutMs = Number(process.env.HC_TIMEOUT || 15) * 1000;
  const texto = process.env.HC_TEXTO || 'Conecta+';

  console.log(`Verificando ${url} (até ${tentativas} tentativas)`);
  const resultado = await verificarComTentativas(url, {
    tentativas,
    esperaMs,
    timeoutMs,
    texto,
    log: (n, r) => {
      console.log(`\nTentativa ${n}:`);
      for (const v of r.verificacoes) console.log(`  ${v.ok ? '✔' : '✖'} ${v.nome}: ${v.detalhe}${v.ms != null ? ` (${v.ms} ms)` : ''}`);
    },
  });

  const md = resumoMarkdown(url, resultado, tentativas);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);

  if (resultado.ok) {
    console.log('\n✔ Aplicação DISPONÍVEL');
  } else {
    console.error('\n✖ Aplicação INDISPONÍVEL');
    process.exit(1);
  }
}

// Só executa a CLI quando chamado diretamente (e não quando importado pelos testes).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal();
}
