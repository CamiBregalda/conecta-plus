// Lint sem dependências: verifica sintaxe e um conjunto pequeno de boas práticas.
//
// Regras (qualquer violação encerra com código 1 e reprova o pipeline):
//   sintaxe          o arquivo precisa ser JavaScript válido (node --check)
//   no-var           use const/let em vez de var
//   eqeqeq           use === e !== em vez de == e !=
//   no-eval          proibido eval() e new Function()
//   no-debugger      proibido deixar "debugger" no código
//   no-console-log   no código do navegador (js/), use console.error para erros; sem console.log

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pastas = ['js', 'scripts', 'tests'];
const extensoes = ['.js', '.mjs'];

function listar(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return listar(caminho);
    return extensoes.some((e) => nome.endsWith(e)) ? [caminho] : [];
  });
}

const regras = [
  { id: 'no-var', regex: /(^|[^\w$.])var\s+[\w$]/, msg: 'use const ou let em vez de var' },
  { id: 'eqeqeq', regex: /(^|[^=!<>])==([^=]|$)|!=([^=]|$)/, msg: 'use === ou !== em vez de == / !=' },
  { id: 'no-eval', regex: /\beval\s*\(|new\s+Function\s*\(/, msg: 'eval() e new Function() são proibidos' },
  { id: 'no-debugger', regex: /\bdebugger\b/, msg: 'remova o "debugger"' },
  {
    id: 'no-console-log',
    regex: /\bconsole\.log\s*\(/,
    msg: 'sem console.log no código do navegador',
    somenteEm: 'js/',
  },
];

const problemas = [];
const arquivos = pastas.flatMap((p) => listar(join(raiz, p)));

for (const arquivo of arquivos) {
  const nome = relative(raiz, arquivo).replaceAll('\\', '/');

  try {
    execFileSync(process.execPath, ['--check', arquivo], { stdio: 'pipe' });
  } catch (e) {
    problemas.push(`${nome}: sintaxe inválida\n${String(e.stderr).trim()}`);
    continue;
  }

  // Este arquivo descreve as regras em regex, então só a sintaxe dele é verificada.
  if (nome === 'scripts/lint.mjs') continue;

  readFileSync(arquivo, 'utf8')
    .split('\n')
    .forEach((linha, i) => {
      const codigo = linha.trim();
      if (codigo.startsWith('//') || codigo.startsWith('*') || codigo.startsWith('/*')) return;
      // Ignora o conteúdo de strings e de comentários no fim da linha.
      const semTexto = linha
        .replace(/(['"`])(?:\\.|(?!\1).)*\1/g, '""')
        .replace(/\/\/.*$/, '');
      for (const r of regras) {
        if (r.somenteEm && !nome.startsWith(r.somenteEm)) continue;
        if (r.regex.test(semTexto)) problemas.push(`${nome}:${i + 1}  [${r.id}] ${r.msg}`);
      }
    });
}

if (problemas.length) {
  console.error(`✖ Lint encontrou ${problemas.length} problema(s):\n`);
  for (const p of problemas) console.error(` - ${p}`);
  process.exit(1);
}
console.log(`✔ Lint sem problemas (${arquivos.length} arquivos verificados)`);
