import test from 'node:test';
import assert from 'node:assert/strict';
import {
  esc,
  normalizar,
  formatarPreco,
  formatarData,
  iniciais,
  matizDoId,
  menorPreco,
  linkWhatsApp,
  linkTelefone,
} from '../js/utils.js';

test('esc trata valores nulos e escapa aspas', () => {
  assert.equal(esc(null), '');
  assert.equal(esc(undefined), '');
  assert.equal(esc(`a"b'c&d`), 'a&quot;b&#39;c&amp;d');
});

test('normalizar remove acentos, espaços e maiúsculas', () => {
  assert.equal(normalizar('  Elétrica '), 'eletrica');
  assert.equal(normalizar(null), '');
});

test('formatarPreco formata em reais e trata "sob consulta"', () => {
  assert.equal(formatarPreco(0), 'Sob consulta');
  const texto = formatarPreco(1200);
  assert.ok(texto.includes('R$') && texto.includes('1.200'));
});

test('formatarData converte ISO para data brasileira e ignora valores inválidos', () => {
  const texto = formatarData('2026-09-12');
  assert.ok(texto.includes('2026') && texto.includes('12'));
  assert.equal(formatarData(''), '');
});

test('iniciais usa as duas primeiras palavras do nome', () => {
  assert.equal(iniciais('Marcos Ribeiro Elétrica'), 'MR');
  assert.equal(iniciais('Lar Brilhante Limpeza'), 'LB');
  assert.equal(iniciais('Info'), 'I');
});

test('matizDoId é estável e fica entre 0 e 359', () => {
  assert.equal(matizDoId(1), 207);
  assert.equal(matizDoId(1), matizDoId('1'));
  for (let id = 1; id <= 50; id++) {
    const h = matizDoId(id);
    assert.ok(h >= 0 && h < 360);
  }
});

test('menorPreco ignora serviços "sob consulta"', () => {
  assert.equal(menorPreco([{ preco: 0 }, { preco: 80 }, { preco: 120 }]), 80);
  assert.equal(menorPreco([{ preco: 0 }]), 0);
  assert.equal(menorPreco(undefined), 0);
});

test('links de contato', () => {
  assert.equal(linkTelefone('(46) 99100-0001'), 'tel:+5546991000001');
  const link = linkWhatsApp('(46) 99100-0001', 'Olá, tudo bem?');
  assert.ok(link.startsWith('https://wa.me/5546991000001?text='));
  assert.ok(link.includes(encodeURIComponent('Olá, tudo bem?')));
});
