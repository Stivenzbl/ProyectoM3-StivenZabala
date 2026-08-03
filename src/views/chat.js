/*
 * views/chat.js â€” Chat engine completo (Resolution)
 *
 * Pipeline:
 *   submit â†’ appendUserMessage â†’ getTrimmedHistory â†’ buildPayload
 *   â†’ callAI â†’ normalizeAIResponse â†’ appendAssistantMessage â†’ appendMessage
 *
 * Defensas: isLoading, lockUI, debounce, retry 429, easter eggs
 */

import { appendUserMessage, appendAssistantMessage, getTrimmedHistory, resetHistory } from "../engine/history.js";
import { buildPayload, getCharacter } from "../engine/payload.js";
import { callAI } from "../engine/aiClient.js";
import { normalizeAIResponse } from "../engine/normalizer.js";
import {
  lockUI,
  unlockUI,
  showTyping,
  hideTyping,
  appendMessage,
  showStatus,
  updateCharacterUI,
  clearMessages,
} from "../ui/render.js";

let chatHistory = [];
let currentCharacter = null;
let isLoading = false;

const EASTER_EGGS = {
  ping: { text: "ðŸ“ Â¡pong!", meta: "ðŸ¥š Easter egg" },
  pong: { text: "ðŸ“ Â¡ping!", meta: "ðŸ¥š Easter egg" },
  "42": { text: "ðŸŒŒ La respuesta al sentido de la vida, el universo y todo lo demÃ¡s.", meta: "ðŸ¥š Easter egg" },
  gracias: { text: "Â¡De nada! ðŸ˜Š RecordÃ¡: la ciencia nunca termina, solo encuentra nuevas preguntas.", meta: "" },
};

function checkEasterEgg(text) {
  return EASTER_EGGS[text.toLowerCase().trim()] || null;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

async function retryOnceAfter429(error, payload) {
  const seconds = error.retryAfterSeconds ?? 5;
  for (let i = seconds; i > 0; i -= 1) {
    showStatus("retrying", `â³ Rate limit. Reintentando en ${i}s...`);
    await wait(1000);
  }
  showTyping();
  showStatus("loading", "Reintentando...");
  const raw = await callAI(payload);
  hideTyping();
  const { text: aiText, truncated } = normalizeAIResponse(raw);
  chatHistory = appendAssistantMessage(chatHistory, aiText);
  appendMessage("assistant", aiText || "No recibÃ­ texto en la respuesta.", truncated ? "âš ï¸ truncada" : "");
  showStatus("hidden");
}

async function sendMessage(text) {
  if (isLoading) return;
  const trimmed = text.trim();
  if (!trimmed) return;

  document.querySelector("#composer-input").value = "";
  isLoading = true;
  lockUI();

  chatHistory = appendUserMessage(chatHistory, trimmed);
  appendMessage("user", trimmed);

  const egg = checkEasterEgg(trimmed);
  if (egg) {
    chatHistory = appendAssistantMessage(chatHistory, egg.text);
    appendMessage("assistant", egg.text, egg.meta, true);
    isLoading = false;
    unlockUI();
    return;
  }

  const trimmedHistory = getTrimmedHistory(chatHistory, 10);
  const payload = buildPayload(currentCharacter, trimmedHistory);

  showTyping();
  showStatus("loading", "Pensando...");

  try {
    const raw = await callAI(payload);
    hideTyping();
    const { text: aiText } = normalizeAIResponse(raw);
    chatHistory = appendAssistantMessage(chatHistory, aiText);
    appendMessage("assistant", aiText || "No recibÃ­ texto en la respuesta.");
    showStatus("hidden");
  } catch (err) {
    hideTyping();
    if (err.status === 429) {
      console.warn("[sendMessage 429]", err);
      try {
        await retryOnceAfter429(err, payload);
      } catch (retryErr) {
        hideTyping();
        showStatus("error", "âŒ Error al reintentar. IntentÃ¡ mÃ¡s tarde.");
        console.error("[retry failed]", retryErr);
      }
    } else {
      console.error("[sendMessage error]", err);
      showStatus("error", "âŒ Error de conexiÃ³n. RevisÃ¡ la consola.");
    }
  } finally {
    isLoading = false;
    unlockUI();
  }
}

export function renderChat(characterKey) {
  const key = characterKey || "science";
  currentCharacter = getCharacter(key);
  chatHistory = resetHistory();

  const $app = document.querySelector("#app");
  $app.className = "view-chat";

  $app.innerHTML = `
    <div class="chat-app">
      <header class="chat-header">
        <a href="/" class="chat-header__back">â† Volver</a>
        <div class="chat-header__info">
          <span class="chat-header__avatar">${currentCharacter.avatar}</span>
          <h2 class="chat-header__name">${currentCharacter.name}</h2>
        </div>
        <div class="chat-header__actions">
          <span class="counter-badge" id="counter-badge">ðŸ’¬ #0</span>
          <button id="reset-btn" class="chat-header__reset" title="Nueva conversaciÃ³n">â†º</button>
        </div>
      </header>

      <main class="chat-messages" id="messages" aria-live="polite" aria-label="Mensajes del chat">
        <div class="messages-empty" id="messages-empty">
          <div class="messages-empty__avatar">${currentCharacter.avatar}</div>
          <p>ðŸ‘‹ Â¡Hola! Soy el <strong>${currentCharacter.name}</strong>.<br>Preguntame lo que quieras.</p>
        </div>
      </main>

      <div id="status-panel" class="status-panel hidden" aria-live="assertive">
        <span id="status-text" class="status-text"></span>
      </div>

      <form class="composer" id="composer-form" autocomplete="off" novalidate>
        <input class="composer__input" id="composer-input" type="text"
          placeholder="EscribÃ­ tu mensaje..." aria-label="Mensaje" maxlength="500">
        <button class="composer__btn" id="send-btn" type="submit" aria-label="Enviar">â†‘</button>
      </form>
    </div>
  `;

  const themeKey = getThemeKey(currentCharacter.name);
  $app.classList.add(`theme-${themeKey}`);

  clearMessages();
  updateCharacterUI(currentCharacter);

  const debouncedSend = debounce(() => {
    const text = document.querySelector("#composer-input").value;
    sendMessage(text);
  }, 300);

  document.querySelector("#composer-form").addEventListener("submit", (event) => {
    event.preventDefault();
    debouncedSend();
  });

  document.querySelector("#reset-btn").addEventListener("click", () => {
    chatHistory = resetHistory();
    clearMessages();
  });
}

function getThemeKey(name) {
  if (name.includes("Chef")) return "chef";
  if (name.includes("Detective")) return "detective";
  return "science";
}
