# Conecta+

Catálogo web de profissionais autônomos e pequenos estabelecimentos de serviços da sua região. Projeto realizado para a matéria Integração Contínua da UTFP

## Sobre o projeto

O **Conecta+** é uma SPA (Single Page Application) que facilita a busca por profissionais autônomos e pequenos estabelecimentos que oferecem serviços em determinada região. A aplicação permite que os usuários encontrem profissionais de diferentes áreas, consultem informações sobre os serviços oferecidos, visualizem avaliações e encontrem formas de contato.

O objetivo é aproximar clientes e prestadores de serviços, facilitando a divulgação de pequenos negócios e a contratação de profissionais locais.

> Esta é a primeira versão do projeto. Os profissionais, telefones e avaliações exibidos são **fictícios** e servem apenas para demonstração.

## Problema que o serviço pretende resolver

Hoje, encontrar um bom eletricista, diarista ou técnico costuma depender de indicações informais ou de buscas dispersas na internet, sem comparação de preços ou avaliações confiáveis. Do outro lado, muitos profissionais autônomos e pequenos negócios locais têm pouca visibilidade e poucos canais acessíveis de divulgação.

O Conecta+ reúne essas informações em um só lugar: o cliente encontra, compara e entra em contato com profissionais da região; o profissional ganha vitrine para o seu trabalho.

## Público-alvo

- Usuários que precisam encontrar assistência técnica.
- Profissionais autônomos que desejam divulgar seus serviços.
- Pequenos estabelecimentos que buscam ampliar sua visibilidade.

## Funcionalidades

| Funcionalidade | Descrição |
| --- | --- |
| Catálogo de serviços | Exibe os profissionais cadastrados na plataforma. |
| Pesquisa | Busca profissionais pelo nome ou serviço (ignora acentos e maiúsculas). |
| Filtros | Filtra por categoria, localização, faixa de preço e disponibilidade; permite ordenar os resultados. Os filtros ficam na URL e podem ser compartilhados. |
| Perfil profissional | Mostra descrição, serviços com valores de referência e contato (WhatsApp, telefone e e-mail). |
| Avaliações | Exibe notas, distribuição e comentários de clientes. É possível enviar uma nova avaliação (salva no `localStorage` do navegador). |
| Destaques | Exibe profissionais patrocinados na página inicial e nas primeiras posições da busca. |
| Publicidade | Espaços reservados para anúncios de estabelecimentos locais. |

Navegação (rotas por hash):

- `#/` – página inicial
- `#/profissionais` – catálogo com busca e filtros
- `#/profissional/:id` – perfil do profissional
- `#/sobre` – sobre o projeto

## Tecnologias utilizadas

- HTML5, CSS3 e JavaScript (ES Modules), sem frameworks
- Roteamento próprio baseado em hash (`hashchange`)
- Dados estáticos em arquivo JSON (`data/profissionais.json`)
- `localStorage` para persistir avaliações no navegador
- Node.js e npm para os scripts de build e de testes (sem dependências de terceiros)
- Git e GitHub para versionamento
- GitHub Actions para CI/CD e monitoramento, e GitHub Pages para hospedagem

## Possibilidades de monetização

1. **Anúncios patrocinados:** profissionais pagam para aparecer em posições de destaque (já representados pelo selo "Patrocinado" e pela prioridade na ordenação por relevância).
2. **Publicidade:** espaços destinados a anúncios de estabelecimentos e empresas locais (já reservados na lateral e entre os resultados do catálogo).

## Como executar o projeto localmente

Não há dependências para instalar. Como a aplicação carrega o arquivo JSON via `fetch` e usa ES Modules, é necessário servi-la por um servidor HTTP local (abrir o `index.html` direto pelo navegador não funciona).

1. Clone o repositório e entre na pasta:

   ```bash
   git clone https://github.com/CamiBregalda/conecta-plus.git
   cd conecta-plus
   ```

2. Inicie um servidor local (use uma das opções):

   ```bash
   # Python 3
   python3 -m http.server 3000

   # ou, com Node.js
   npx serve .
   ```

3. Acesse <http://localhost:3000> no navegador.

Também é possível usar a extensão **Live Server** do VS Code.

Para executar localmente as mesmas verificações do pipeline (requer Node.js 20 ou superior):

```bash
npm ci          # instala as dependências (o projeto não possui dependências de terceiros)
npm run build   # valida o projeto e gera a pasta dist/
npm test        # executa os testes automatizados (inclui os do health check)
```

## Integração Contínua

O projeto possui um pipeline de CI/CD que processa automaticamente cada alteração enviada ao repositório, do código até a aplicação publicada:

```text
Código → Testes → Qualidade → Segurança → Build → Deploy → Aplicação
```

### Ferramenta utilizada

[GitHub Actions](https://docs.github.com/pt/actions). O workflow está definido em `.github/workflows/ci.yml` e é executado em máquinas virtuais `ubuntu-latest` fornecidas pelo próprio GitHub.

### Quando o pipeline é executado

Automaticamente, a cada:

- **push** na branch `main` (executa todas as etapas, **incluindo o deploy**);
- **pull request** destinado à branch `main` (executa as verificações e o build, **sem deploy**).

### Etapas do pipeline

```text
PUSH / PULL REQUEST
        │
        ├──► 1 TESTES ──► 2 QUALIDADE (SonarQube) ──┐
        │      lint + unitários + cobertura          │
        │                                            │
        ├──► 3 SAST     (Semgrep)    ────────────────┤   (jobs independentes,
        ├──► 3 SCA      (npm audit)  ────────────────┼──  executam em paralelo)
        └──► 3 SECRETS  (Gitleaks)   ────────────────┘
                                                     │
                                                     ▼
                                      GATE  reúne os resultados e bloqueia se algo falhou
                                                     │
                                     ├── falha ──► ✗  (nada é construído nem publicado)
                                     ▼ sucesso
                                      4 BUILD    npm run build → artefato dist/
                                                     │
                                                     ▼
                                      5 DEPLOY   GitHub Pages (somente em push na main)
                                                     │
                                                     ▼
                                      APLICAÇÃO PUBLICADA ✓
```

Testes e qualidade rodam em sequência (`qualidade` depende de `testes`); as verificações de segurança são jobs independentes e rodam ao mesmo tempo, para o pipeline terminar mais rápido. O `gate` espera todos eles, e o `build` só começa se o gate aprovar:

| Job | O que faz |
| --- | --- |
| `testes` | Checkout, Node.js 22, `npm ci`, `npm run lint`, `npm test` e `npm run coverage`. O relatório de cobertura é guardado como artefato para a etapa seguinte. |
| `qualidade` | Baixa a cobertura e executa o SonarQube com `-Dsonar.qualitygate.wait=true`, que reprova se o Quality Gate não for atendido. O token vem do secret `SONAR_TOKEN`. |
| `sast`, `sca`, `secrets` | Verificações de segurança (veja a seção **Segurança**). |
| `gate` | Espera `testes`, `qualidade`, `sast`, `sca` e `secrets` e reprova se alguma não terminou em `success`. |
| `build` | Gera o artefato da aplicação (veja **Build e artefato**). |
| `deploy` | Publica o artefato no GitHub Pages (veja **Deploy**). |

Se qualquer etapa falhar, o pipeline é marcado como reprovado (✗), as etapas seguintes não são executadas e o GitHub informa qual etapa e qual mensagem causaram o problema.

### Como verificar uma execução

1. Acesse o repositório no GitHub e abra a aba **Actions**.
2. Selecione a execução desejada (cada commit ou pull request gera uma). O nome da execução é a mensagem do commit.
3. Um ícone verde (✓) indica sucesso; um ícone vermelho (✗) indica falha. O gráfico da execução mostra a sequência de jobs.
4. Clique no job desejado para ver o log de cada passo. Em caso de falha, o passo com erro fica destacado e o log mostra o motivo (por exemplo, `import quebrado em js/main.js`).

Os dois cenários possíveis:

```text
Commit → Pipeline → Build ✓ → Deploy
Commit → Pipeline → Falha ✗ (bloqueado no gate, sem deploy)
```

## Segurança

O pipeline incorpora verificações de segurança que rodam em paralelo com os testes e a análise de qualidade, **antes do build**, e são consolidadas pelo gate. Se qualquer verificação falhar, o gate reprova a execução e o build e o deploy não acontecem.

```text
          ┌─► SAST     (Semgrep)    ─┐
Código ───┼─► SCA      (npm audit)  ─┼─► GATE ─► sucesso ✓ → Build → Deploy
          └─► Secrets  (Gitleaks)   ─┘     └──► falha  ✗ (bloqueia)
```

| Etapa | Ferramenta | O que verifica | Quando reprova |
| --- | --- | --- | --- |
| 1. SAST | [Semgrep](https://semgrep.dev) | Analisa o código-fonte em busca de padrões inseguros (ex.: `innerHTML` com dados não tratados, `eval`, XSS), usando as regras `p/javascript`, `p/owasp-top-ten` e `p/cwe-top-25`. | Qualquer achado (`--error`) |
| 2. SCA | `npm audit` | Compara as dependências do `package-lock.json` com a base de vulnerabilidades conhecidas (CVEs / GitHub Advisory Database). | Vulnerabilidade de severidade **alta** ou **crítica** |
| 3. Secrets | [Gitleaks](https://github.com/gitleaks/gitleaks) | Procura chaves de API, tokens e chaves privadas no código **e em todo o histórico do Git** (`fetch-depth: 0`). | Qualquer segredo encontrado |
| Gate | Job `gate` do workflow | Reúne o resultado dos testes, da qualidade e das verificações de segurança. | Qualquer etapa diferente de `success` |

### Por que essas ferramentas

- **Semgrep (SAST):** é gratuito, roda sem conta ou token e entende JavaScript. Suas regras são legíveis e cobrem OWASP Top 10 e CWE Top 25, e a execução é rápida o suficiente para rodar a cada push.
- **npm audit (SCA):** já vem com o npm, então não adiciona nenhuma dependência nova à cadeia de suprimentos. Lê diretamente o `package-lock.json`, que o `npm ci` garante ser o que de fato é instalado.
- **Gitleaks (secret scanning):** examina também o histórico, o que importa porque um segredo removido num commit posterior continua exposto nos commits antigos. Usa regras padrão mantidas pela comunidade e é configurável em `.gitleaks.toml`.
- **Gate:** transforma os resultados em uma única decisão. Marcando o job **Gate (bloquear falhas)** como verificação obrigatória na proteção da branch `main` (*Settings → Branches → Branch protection rules → Require status checks*), nenhum pull request com falha de segurança pode ser integrado.

### Segredos e credenciais

- **Nenhuma credencial está no código-fonte.** A aplicação é estática, não usa chaves de API, e os dados do repositório são fictícios.
- Valores sensíveis do pipeline, como o `SONAR_TOKEN`, ficam em **GitHub Secrets** (*Settings → Secrets and variables → Actions*) e são lidos no workflow como `${{ secrets.SONAR_TOKEN }}`. O GitHub mascara esses valores nos logs.
- O `.gitignore` bloqueia o versionamento de `.env`, `*.pem` e `*.key`. Configurações locais devem ir em `.env` (nunca versionado), com um `.env.example` sem valores reais como modelo.
- Se um segredo for exposto, ele deve ser **revogado e substituído imediatamente**; apagá-lo do código não basta, pois ele permanece no histórico.

### Segurança da cadeia de suprimentos

- **`npm ci`** instala exatamente as versões do `package-lock.json`, de forma reproduzível.
- **Dependabot** (`.github/dependabot.yml`) abre pull requests semanais para atualizar dependências npm e as versões das actions do pipeline, que também fazem parte da cadeia de suprimentos.
- **Menor privilégio:** o workflow declara `permissions: contents: read`, então o `GITHUB_TOKEN` não consegue alterar o repositório.
- **Poucas dependências:** o projeto não usa bibliotecas de terceiros em tempo de execução, o que reduz a superfície de ataque.

### Como verificar

Na aba **Actions**, abra a execução e veja os jobs **SAST (Semgrep)**, **SCA (npm audit)**, **Secrets (Gitleaks)** e **Gate (bloquear falhas)**. O relatório completo do Semgrep fica disponível como artefato (`semgrep-report`) ao final da execução. Para testar o `npm audit` localmente:

```bash
npm audit --audit-level=high
```

## Build e artefato

```text
Código-fonte → Validações → Testes → Build → Artefato → Deploy
```

**Como o build é realizado.** O job `build` só começa depois que o gate aprova testes, qualidade e segurança. Ele executa `npm ci` e `npm run build`, que roda `scripts/build.mjs`. Como a SPA é feita em HTML, CSS e JavaScript puros, não há transpilação nem empacotamento: o build **valida e copia**. Ele verifica o JSON de dados, a sintaxe do JavaScript, os `import` e as referências do `index.html`; se tudo estiver correto, copia os arquivos da aplicação para a pasta `dist/`. Qualquer erro encerra o script com código 1 e reprova o pipeline.

**Quais arquivos constituem o artefato.** O conteúdo de `dist/`, apenas o que o navegador precisa para executar a aplicação:

| Arquivo | Função |
| --- | --- |
| `index.html` | Página única da SPA |
| `css/` | Estilos |
| `js/` | Módulos JavaScript (roteador, views, filtros, componentes) |
| `data/profissionais.json` | Dados fictícios carregados via `fetch` |

Ficam **fora** do artefato: testes, scripts de build, `package.json`, `.github/`, `README.md` e as configurações de segurança.

**Em qual etapa ele é produzido.** No job `build` (etapa 4), depois do gate. O passo `actions/upload-pages-artifact` empacota `dist/` num artefato chamado `github-pages`, que pode ser baixado na aba **Actions**, na própria execução.

**Como é usado na publicação.** O job `deploy` não reconstrói nada: ele recebe o artefato exatamente como o `build` o gerou (`actions/deploy-pages`) e o publica. Assim, o que foi testado, verificado e construído é o que vai ao ar.

## Deploy e aplicação publicada

- **Hospedagem:** [GitHub Pages](https://pages.github.com), integrado ao próprio repositório e gratuito para repositórios públicos. Serve arquivos estáticos, que é exatamente o que a SPA precisa.
- **Publicação automatizada:** o job `deploy` roda a cada push na `main`, depois do build, usando o ambiente `github-pages`. Ele não é executado em pull requests.
- **Segurança do deploy:** o job recebe só as permissões `pages: write` e `id-token: write`, e nenhuma senha ou chave é guardada. A autenticação é feita por OIDC.
- **Rotas:** a navegação usa hash (`#/profissionais`) e os caminhos de arquivos são relativos, por isso a aplicação funciona normalmente no subcaminho `/conecta-plus/` do GitHub Pages, sem configuração de servidor.
- **Endereço da aplicação:** https://camibregalda.github.io/conecta-plus/

### Configuração inicial (uma única vez)

No repositório, acesse **Settings → Pages → Build and deployment** e, em **Source**, selecione **GitHub Actions**. Depois disso, o próximo push na `main` publica a aplicação.

## Monitoramento

Depois do deploy, um workflow separado verifica automaticamente se a aplicação publicada continua disponível e funcional, sem serviços externos pagos, usando apenas o GitHub Actions.

```text
GitHub Actions → Aplicação publicada → Health Check → Sucesso ✓ / Falha ✗
```

### CI/CD × Monitoramento

| | CI/CD (`ci.yml`) | Monitoramento (`monitoramento.yml`) |
| --- | --- | --- |
| **Pergunta que responde** | Esta nova versão pode ser validada e entregue? | A versão **já publicada** continua no ar? |
| **Quando roda** | A cada push ou pull request para a `main` | A cada 30 minutos, após cada deploy e sob demanda |
| **O que verifica** | Código: testes, qualidade, segurança e build | A URL pública da aplicação |
| **Se falhar** | Bloqueia o merge e o deploy | Abre uma Issue de indisponibilidade |

### Quando o monitoramento é executado

O workflow `.github/workflows/monitoramento.yml` possui três gatilhos:

- **Periodicamente (`schedule`):** a cada 30 minutos (`*/30 * * * *`, horário UTC; o GitHub pode atrasar a execução em alguns minutos).
- **Após o deploy (`workflow_run`):** quando o workflow `CI` termina com sucesso na `main`, ou seja, logo depois de uma nova versão ser publicada.
- **Manualmente (`workflow_dispatch`):** pela aba **Actions → Monitoramento → Run workflow**, com a opção de informar outra URL.

### Como a disponibilidade é identificada

O script `scripts/healthcheck.mjs` (Node.js, sem dependências) acessa a URL pública e executa quatro verificações:

| Verificação | A aplicação é considerada indisponível quando… |
| --- | --- |
| Página inicial | não responde HTTP 200, demora mais de 15 s ou falha o acesso (DNS, conexão recusada etc.) |
| Conteúdo esperado | responde 200, mas a página não contém o texto `Conecta+` (por exemplo, uma página de erro ou de manutenção) |
| Dados (`data/profissionais.json`) | não responde 200 ou não é uma lista JSON válida e não vazia |
| Arquivos principais (`css/styles.css` e `js/main.js`) | não respondem HTTP 200 |

- **Disponível ✅:** todas as verificações passam. O job termina com sucesso (✓).
- **Indisponível ❌:** alguma verificação falha em todas as tentativas. O script sai com código 1 e o job termina com falha (✗).
- **Novas tentativas:** são feitas até 3 tentativas, com intervalo de 15 s (30 s após um deploy, para dar tempo de o GitHub Pages propagar). Assim, uma oscilação momentânea não gera alarme falso.
- **URL monitorada:** a variável do repositório `APP_URL`, se existir; caso contrário, a URL padrão do GitHub Pages (`https://<usuário>.github.io/<repositório>/`).

### Como o resultado é registrado e comunicado

- **Histórico do GitHub Actions:** cada execução aparece na aba **Actions** com ✓ ou ✗, e o **resumo da execução** traz a tabela com o resultado e o tempo de cada verificação.
- **Issue automática:** quando a aplicação fica indisponível, o workflow abre uma Issue com o rótulo `indisponibilidade`, contendo a URL, o horário e o link da execução. Se a Issue já estiver aberta, apenas comenta. Quando a aplicação volta, a Issue é **fechada automaticamente** com um comentário de recuperação.
- **Notificações:** a abertura da Issue e a falha do workflow geram as notificações padrão do GitHub (e-mail e/ou central de notificações) para quem acompanha o repositório.

### Como demonstrar uma execução

1. Abra **Actions → Monitoramento → Run workflow** (ou aguarde a execução agendada).
2. Abra a execução e o job **Health check da aplicação**: o log mostra cada verificação com ✔ ou ✖, e o resumo traz a tabela.
3. Para demonstrar uma falha, execute manualmente informando uma URL inexistente (por exemplo, `https://camibregalda.github.io/url-que-nao-existe/`). A execução termina com ✗ e uma Issue de indisponibilidade é aberta. Ao executar novamente com a URL correta, a Issue é fechada.

O mesmo script pode ser executado localmente:

```bash
node scripts/healthcheck.mjs https://camibregalda.github.io/conecta-plus/
```

> **Observação:** o GitHub desativa workflows agendados em repositórios públicos sem atividade por 60 dias. Se isso acontecer, basta reativar o workflow na aba **Actions**.

## Estrutura do projeto

```text
conecta-plus/
├── .github/workflows/ci.yml  # Pipeline de CI e segurança (GitHub Actions)
├── .github/workflows/monitoramento.yml  # Monitoramento da aplicação publicada
├── .github/dependabot.yml    # Atualização automática de dependências e actions
├── .gitleaks.toml        # Configuração do secret scanning
├── .semgrepignore        # Pastas ignoradas pelo SAST
├── scripts/build.mjs     # Build: valida o projeto e gera o artefato dist/
├── scripts/healthcheck.mjs   # Health check da aplicação publicada
├── tests/                # Testes automatizados
├── package.json          # Scripts npm (build e test)
├── index.html            # Casca da SPA (cabeçalho, área principal, rodapé)
├── css/styles.css        # Estilos e responsividade
├── data/profissionais.json   # Dados fictícios (mock)
└── js/
    ├── main.js           # Inicialização, rotas e menu
    ├── router.js         # Roteador por hash
    ├── dados.js          # Acesso aos dados (JSON + localStorage)
    ├── filtros.js        # Busca, filtros e ordenação (lógica pura)
    ├── componentes.js    # Componentes de UI reutilizáveis
    ├── utils.js          # Funções utilitárias
    └── views/            # Uma "página" por arquivo (home, catálogo, perfil, sobre)
```

A camada de dados está isolada em `js/dados.js`. A evolução para um backend ou uma API pública, pode ser feito em um módulo posterior.