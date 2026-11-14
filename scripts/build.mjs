// Build da SPA: valida o projeto e gera a pasta dist/ pronta para publicação estática.
//
// Verificações (qualquer falha encerra o processo com código 1 e reprova o pipeline):
//   1. data/profissionais.json é um JSON válido com os campos obrigatórios;
//   2. todos os arquivos .js têm sintaxe válida;
//   3. todo import relativo aponta para um arquivo existente;
//   4. os arquivos referenciados pelo index.html existem.
// Se tudo estiver certo, copia os arquivos da aplicação para dist/.

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(raiz, 'dist');
const erros = [];

const falhar = (msg) => erros.push(msg);
const rel = (p) => relative(raiz, p).replaceAll('\\', '/');

function listarJs(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return listarJs(caminho);
    return nome.endsWith('.js') ? [caminho] : [];
  });
}

// 1. Dados
const camposObrigatorios = ['id', 'nome', 'categoria', 'descricao', 'cidade', 'telefone', 'servicos', 'avaliacoes'];
try {
  const dados = JSON.parse(readFileSync(join(raiz, 'data/profissionais.json'), 'utf8'));
  if (!Array.isArray(dados) || dados.length === 0) falhar('data/profissionais.json deve ser uma lista não vazia');
  const ids = new Set();
  for (const p of dados) {
    for (const campo of camposObrigatorios) {
      if (p[campo] === undefined) falhar(`profissional ${p.id ?? '?'} sem o campo "${campo}"`);
    }
    if (ids.has(p.id)) falhar(`id duplicado em profissionais.json: ${p.id}`);
    ids.add(p.id);
  }
  console.log(`✔ Dados válidos (${dados.length} profissionais)`);
} catch (e) {
  falhar(`data/profissionais.json inválido: ${e.message}`);
}

// 2 e 3. JavaScript: sintaxe e imports relativos
const arquivosJs = listarJs(join(raiz, 'js'));
for (const arquivo of arquivosJs) {
  try {
    execFileSync(process.execPath, ['--check', arquivo], { stdio: 'pipe' });
  } catch (e) {
    falhar(`erro de sintaxe em ${rel(arquivo)}:\n${String(e.stderr).trim()}`);
    continue;
  }
  const codigo = readFileSync(arquivo, 'utf8');
  for (const [, alvo] of codigo.matchAll(/(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
    if (!existsSync(resolve(dirname(arquivo), alvo))) {
      falhar(`import quebrado em ${rel(arquivo)}: "${alvo}" não existe`);
    }
  }
}
if (!erros.length) console.log(`✔ Sintaxe e imports válidos (${arquivosJs.length} arquivos JS)`);

// 4. Referências do index.html
const html = readFileSync(join(raiz, 'index.html'), 'utf8');
for (const [, alvo] of html.matchAll(/(?:href|src)="((?!https?:|data:|#)[^"]+)"/g)) {
  if (!existsSync(join(raiz, alvo))) falhar(`index.html referencia "${alvo}", que não existe`);
}

if (erros.length) {
  console.error('\n✖ Build falhou:\n');
  for (const e of erros) console.error(` - ${e}`);
  process.exit(1);
}

// Gera dist/
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const item of ['index.html', 'css', 'js', 'data']) {
  cpSync(join(raiz, item), join(dist, item), { recursive: true });
}
console.log('✔ Build concluído: arquivos gerados em dist/');
