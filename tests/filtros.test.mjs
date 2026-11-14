import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filtrarProfissionais, filtrosParaQuery, queryParaFiltros } from '../js/filtros.js';
import { esc, menorPreco, linkWhatsApp, mediaNotas } from '../js/utils.js';

const dados = JSON.parse(readFileSync(new URL('../data/profissionais.json', import.meta.url), 'utf8'));

test('sem filtros retorna todos, com patrocinados primeiro', () => {
  const lista = filtrarProfissionais(dados, {});
  assert.equal(lista.length, dados.length);
  assert.ok(lista.slice(0, 3).every((p) => p.patrocinado));
});

test('busca ignora acentos e maiúsculas, e encontra por serviço', () => {
  assert.ok(filtrarProfissionais(dados, { q: 'ELETRICA' }).some((p) => p.id === 1));
  assert.ok(filtrarProfissionais(dados, { q: 'geladeira' }).some((p) => p.id === 7));
});

test('filtros de categoria, cidade e disponibilidade', () => {
  assert.equal(filtrarProfissionais(dados, { categoria: 'Jardinagem' }).length, 2);
  assert.equal(filtrarProfissionais(dados, { cidade: 'Cascavel' }).length, 2);
  assert.ok(filtrarProfissionais(dados, { novos: true }).every((p) => p.aceitandoClientes));
});

test('faixa de preço e ordenação por preço', () => {
  const baratos = filtrarProfissionais(dados, { preco: 'ate-100' });
  assert.ok(baratos.every((p) => menorPreco(p.servicos) > 0 && menorPreco(p.servicos) < 100));
  const precos = filtrarProfissionais(dados, { ordem: 'preco' }).map((p) => menorPreco(p.servicos));
  assert.ok(precos.every((v, i) => i === 0 || precos[i - 1] <= v));
});

test('filtros sobrevivem à ida e volta pela query string', () => {
  const filtros = { q: 'a b', categoria: 'Elétrica', novos: true, ordem: 'nome' };
  const volta = queryParaFiltros(Object.fromEntries(new URLSearchParams(filtrosParaQuery(filtros))));
  assert.equal(volta.q, 'a b');
  assert.equal(volta.categoria, 'Elétrica');
  assert.equal(volta.novos, true);
  assert.equal(volta.ordem, 'nome');
});

test('utilitários: escape de HTML, WhatsApp e média', () => {
  assert.equal(esc('<img onerror=1>'), '&lt;img onerror=1&gt;');
  assert.ok(linkWhatsApp('(46) 99100-0001').includes('5546991000001'));
  assert.equal(mediaNotas([{ nota: 5 }, { nota: 3 }]), 4);
  assert.equal(mediaNotas([]), 0);
});
