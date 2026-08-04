export function renderHome() {
  const $app = document.querySelector("#app");
  $app.className = "view-home";

  $app.innerHTML = `
    <section class="home-hero">
      <p class="home-hero__eyebrow">Proyecto Integrador · M3</p>
      <h1 class="home-hero__title">🤖 PIM3 Chat AI</h1>
      <p class="home-hero__subtitle">Proyecto final resuelto con chat engine, serverless function, Gemini seguro y tests.</p>

      <div class="character-grid">
        <a class="character-card theme-science" href="/chat/science">
          <span class="character-card__avatar">🧪</span>
          <span class="character-card__name">Dr. Science</span>
          <span class="character-card__desc">Explica con analogias simples.</span>
        </a>
        <a class="character-card theme-chef" href="/chat/chef">
          <span class="character-card__avatar">👨‍🍳</span>
          <span class="character-card__name">Chef Claude</span>
          <span class="character-card__desc">Responde con sabor culinario.</span>
        </a>
        <a class="character-card theme-detective" href="/chat/detective">
          <span class="character-card__avatar">🕵️</span>
          <span class="character-card__name">Detective</span>
          <span class="character-card__desc">Analiza con logica y evidencia.</span>
        </a>
      </div>
    </section>
  `;
}
