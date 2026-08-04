export function renderNotFound() {
  const $app = document.querySelector("#app");
  $app.className = "view-notfound";

  $app.innerHTML = `
    <div class="not-found">
      <div class="not-found__code">404</div>
      <h2 class="not-found__title">Página no encontrada</h2>
      <p class="not-found__text">La ruta <code class="not-found__path">${window.location.pathname}</code> no existe.</p>
      <a href="/" class="not-found__link">← Volver al inicio</a>
    </div>
  `;
}
