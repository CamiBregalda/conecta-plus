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

- HTML5, CSS3 e JavaScript (ES Modules), sem frameworks e sem etapa de build
- Roteamento próprio baseado em hash (`hashchange`)
- Dados estáticos em arquivo JSON (`data/profissionais.json`)
- `localStorage` para persistir avaliações no navegador
- Git e GitHub para versionamento

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
   python3 -m http.server 8080

   # ou, com Node.js
   npx serve .
   ```

3. Acesse <http://localhost:8080> no navegador.

Também é possível usar a extensão **Live Server** do VS Code.

## Estrutura do projeto

```text
conecta-plus/
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
