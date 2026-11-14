export async function sobreView(outlet) {
  document.title = 'Sobre | Conecta+';
  outlet.innerHTML = `
    <div class="container texto-pagina">
      <h1>Sobre o Conecta+</h1>
      <p>O Conecta+ é uma plataforma web que facilita a busca por profissionais autônomos e pequenos
      estabelecimentos que oferecem serviços em determinada região. Aqui você encontra profissionais de
      diferentes áreas, consulta os serviços oferecidos, vê avaliações de outros clientes e descobre
      como entrar em contato.</p>
      <p>Nosso objetivo é aproximar clientes e prestadores de serviços, ajudando a divulgar pequenos
      negócios e facilitando a contratação de profissionais locais.</p>

      <h2>Para quem é</h2>
      <ul>
        <li>Pessoas que procuram profissionais para serviços domésticos.</li>
        <li>Usuários que precisam encontrar assistência técnica.</li>
        <li>Profissionais autônomos que desejam divulgar seus serviços.</li>
        <li>Pequenos estabelecimentos que buscam ampliar sua visibilidade.</li>
      </ul>

      <h2>Para profissionais e empresas</h2>
      <p>Profissionais podem ganhar mais visibilidade com <strong>destaques patrocinados</strong> nas
      primeiras posições da busca, e estabelecimentos locais poderão anunciar nos espaços de
      <strong>publicidade</strong> da plataforma.</p>

      <a class="btn" href="#/profissionais">Encontrar profissionais</a>
    </div>`;
}
