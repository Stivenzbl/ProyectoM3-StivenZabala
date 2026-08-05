import { getAllCharacters } from "../engine/payload.js";

export function renderHome() {
  const $app = document.querySelector("#app");
  $app.className = "view-home";

  const characters = getAllCharacters();
  const cardsHtml = characters
    .map(
      (char) => `
        <a class="character-card theme-${char.id}" href="/chat/${char.id}">
          <span class="character-card__avatar">${char.avatar}</span>
          <span class="character-card__name">${char.name}</span>
          <span class="character-card__desc">${char.desc || char.system.split('\n')[0]}</span>
        </a>
      `
    )
    .join("");

  $app.innerHTML = `
    <section class="home-hero">
      <p class="home-hero__eyebrow">Proyecto Integrador · M3</p>
      <h1 class="home-hero__title">🤖 PIM3 Chat AI</h1>
      <p class="home-hero__subtitle">Elige a tu personaje favorito e inicia una conversación inteligente impulsada por Gemini Serverless.</p>

      <div class="character-grid">
        ${cardsHtml}
      </div>
    </section>
  `;
}

