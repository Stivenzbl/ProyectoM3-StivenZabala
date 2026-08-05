export function renderAbout() {
  const $app = document.querySelector("#app");
  $app.className = "view-about";

  $app.innerHTML = `
    <div class="about">
      <h1 class="about__title">Acerca del PIM3</h1>
      <p class="about__desc">
        Proyecto integrador final: chat engine, historial multisesión, payload, serverless
        function, OpenRouter API Gateway seguro, normalización de respuestas y tests unitarios.
      </p>
      <div class="about__features">
        <div class="about__feature">🤖 <span>Chat AI con 4 personajes</span></div>
        <div class="about__feature">🔐 <span>OpenRouter API Key protegida en backend</span></div>
        <div class="about__feature">⚡ <span>Vercel Serverless Function en /api/chat</span></div>
        <div class="about__feature">📜 <span>Historial Multisesión con LocalStorage</span></div>
        <div class="about__feature">🧪 <span>Suite de tests con Vitest</span></div>
      </div>
      <a href="/" class="about__back">← Volver al inicio</a>
    </div>
  `;
}
