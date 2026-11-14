export async function naoEncontradaView(outlet) {
  document.title = 'Página não encontrada | Conecta+';
  outlet.innerHTML = `
    <section class="container estado-vazio">
      <h1>Página não encontrada</h1>
      <p>O endereço acessado não existe no Conecta+.</p>
      <a class="btn" href="#/">Ir para o início</a>
    </section>`;
}
