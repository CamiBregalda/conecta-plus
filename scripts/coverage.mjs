// Executa os testes com cobertura e grava o relatório em coverage/lcov.info

import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(resolve(raiz, 'coverage'), { recursive: true });

const resultado = spawnSync(
  process.execPath,
  [
    '--test',
    '--experimental-test-coverage',
    '--test-coverage-include=js/**',
    '--test-coverage-include=scripts/healthcheck.mjs',
    '--test-reporter=spec',
    '--test-reporter-destination=stdout',
    '--test-reporter=lcov',
    '--test-reporter-destination=coverage/lcov.info',
    'tests/**/*.test.mjs',
  ],
  { cwd: raiz, stdio: 'inherit' }
);

process.exit(resultado.status ?? 1);
