import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verificar, verificarComTentativas } from '../scripts/healthcheck.mjs';

const CSS = 'body{}';
const JS = 'export {};';
const DADOS = JSON.stringify([{ id: 1 }]);

/** Sobe um servidor local que simula a aplicação publicada. */
function servidor(rotas) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const rota = rotas[req.url];
      if (!rota) {
        res.writeHead(404).end('nao encontrado');
        return;
      }
      res.writeHead(rota.status ?? 200).end(rota.corpo);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, url: `http://127.0.0.1:${srv.address().port}/` }));
  });
}

const saudavel = {
  '/': { corpo: '<title>Conecta+ | início</title>' },
  '/data/profissionais.json': { corpo: DADOS },
  '/css/styles.css': { corpo: CSS },
  '/js/main.js': { corpo: JS },
};

test('aplicação saudável é considerada disponível', async () => {
  const { srv, url } = await servidor(saudavel);
  const r = await verificar(url);
  srv.close();
  assert.equal(r.ok, true);
  assert.equal(r.verificacoes.length, 4);
});

test('HTTP 500 na página inicial é indisponibilidade', async () => {
  const { srv, url } = await servidor({ ...saudavel, '/': { status: 500, corpo: 'erro' } });
  const r = await verificar(url);
  srv.close();
  assert.equal(r.ok, false);
  assert.match(r.verificacoes[0].detalhe, /HTTP 500/);
});

test('página com status 200 mas sem o conteúdo esperado é indisponibilidade', async () => {
  const { srv, url } = await servidor({ ...saudavel, '/': { corpo: '<h1>Site em manutenção</h1>' } });
  const r = await verificar(url);
  srv.close();
  assert.equal(r.ok, false);
  assert.match(r.verificacoes[0].detalhe, /texto esperado/);
});

test('arquivo de dados inválido é indisponibilidade', async () => {
  const { srv, url } = await servidor({ ...saudavel, '/data/profissionais.json': { corpo: '[]' } });
  const r = await verificar(url);
  srv.close();
  assert.equal(r.ok, false);
});

test('servidor fora do ar é falha de acesso', async () => {
  const { srv, url } = await servidor(saudavel);
  await new Promise((r) => srv.close(r));
  const r = await verificar(url, { timeoutMs: 2000 });
  assert.equal(r.ok, false);
  assert.match(r.verificacoes[0].detalhe, /falha de acesso/);
});

test('novas tentativas: recupera quando a aplicação volta durante as tentativas', async () => {
  let chamadas = 0;
  const srv = http.createServer((req, res) => {
    // Falha na primeira rodada (a primeira requisição) e responde normalmente depois.
    if (chamadas++ === 0) return void res.writeHead(503).end('indisponivel');
    const rota = saudavel[req.url];
    return void (rota ? res.writeHead(200).end(rota.corpo) : res.writeHead(404).end());
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${srv.address().port}/`;
  const r = await verificarComTentativas(url, { tentativas: 3, esperaMs: 10 });
  srv.close();
  assert.equal(r.ok, true);
  assert.equal(r.tentativa, 2);
});

// ---- CLI: o código de saída é o que o GitHub Actions usa para aprovar ou reprovar o job ----
const SCRIPT = fileURLToPath(new URL('../scripts/healthcheck.mjs', import.meta.url));

function executarCli(args, env = {}) {
  return new Promise((resolve) => {
    const filho = spawn(process.execPath, [SCRIPT, ...args], {
      env: { ...process.env, HC_DELAY: '0', HC_RETRIES: '1', HC_TIMEOUT: '3', ...env },
    });
    let saida = '';
    filho.stdout.on('data', (d) => (saida += d));
    filho.stderr.on('data', (d) => (saida += d));
    filho.on('close', (codigo) => resolve({ codigo, saida }));
  });
}

test('CLI: aplicação saudável sai com código 0 e escreve o resumo da execução', async () => {
  const { srv, url } = await servidor(saudavel);
  const resumo = join(mkdtempSync(join(tmpdir(), 'hc-')), 'summary.md');
  const { codigo, saida } = await executarCli([url], { GITHUB_STEP_SUMMARY: resumo });
  srv.close();
  assert.equal(codigo, 0);
  assert.match(saida, /DISPONÍVEL/);
  assert.match(readFileSync(resumo, 'utf8'), /Aplicação disponível/);
});

test('CLI: aplicação com falha sai com código 1', async () => {
  const { srv, url } = await servidor({ ...saudavel, '/': { status: 503, corpo: 'fora' } });
  const { codigo, saida } = await executarCli([url]);
  srv.close();
  assert.equal(codigo, 1);
  assert.match(saida, /INDISPONÍVEL/);
});

test('CLI: sem URL válida sai com código 2', async () => {
  const { codigo } = await executarCli([]);
  assert.equal(codigo, 2);
});
