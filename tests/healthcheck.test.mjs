import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
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
