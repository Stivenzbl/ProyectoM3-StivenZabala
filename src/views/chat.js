/*
 * views/chat.js — Vista y Motor principal de Chat PIM3
 *
 * Pipeline:
 *   submit → appendUserMessage → getTrimmedHistory → buildPayload
 *   → callAI → normalizeAIResponse → appendAssistantMessage → appendMessage
 *
 * Funcionalidades:
 * - LocalStorage Persistence: guarda y restaura historial entre recargas
 * - UI Lock/Unlock: previene doble submit durante fetching
 * - Auto Retry: manejo inteligente de 429 Rate Limit
 * - Copy to clipboard & Timestamps en cada mensaje
 * - Easter eggs (ping, pong, 42, gracias)
 */

import { appendUserMessage, appendAssistantMessage, getTrimmedHistory, resetHistory } from "../engine/history.js";
import { buildPayload, getCharacter, getAllCharacters } from "../engine/payload.js";
import { callAI } from "../engine/aiClient.js";
import { normalizeAIResponse } from "../engine/normalizer.js";
import { saveHistory, loadHistory, clearStorageHistory } from "../engine/storage.js";
import { navigateTo } from "../router.js";
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
let activeCharacterKey = "science";
let isLoading = false;

const EASTER_EGGS = {
  ping: { text: "🏓 ¡pong!", meta: "🥚 Easter egg" },
  pong: { text: "🏓 ¡ping!", meta: "🥚 Easter egg" },
  "42": { text: "🌌 La respuesta al sentido de la vida, el universo y todo lo demás.", meta: "🥚 Easter egg" },
  gracias: { text: "¡De nada! 😊 Recordá: la ciencia y la curiosidad nunca terminan.", meta: "" },
};

function checkEasterEgg(text) {
  return EASTER_EGGS[text.toLowerCase().trim()] || null;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryWithBackoff(initialErr, payload, maxAttempts = 2) {
  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt++;
    const waitSecs = initialErr.retryAfterSeconds ? initialErr.retryAfterSeconds + attempt * 3 : 10;
    for (let i = waitSecs; i > 0; i -= 1) {
      showStatus("retrying", `⏳ Límite de cuota Gemini (15 req/min). Reintentando (${attempt}/${maxAttempts}) en ${i}s...`);
      await wait(1000);
    }
    showTyping();
    showStatus("loading", `Reintentando (${attempt}/${maxAttempts})...`);
    try {
      const raw = await callAI(payload);
      hideTyping();
      const { text: aiText, truncated } = normalizeAIResponse(raw);
      const finalResponse = aiText || "No recibí texto en la respuesta.";
      chatHistory = appendAssistantMessage(chatHistory, finalResponse);
      saveHistory(activeCharacterKey, chatHistory);
      appendMessage("assistant", finalResponse, truncated ? "⚠️ truncada" : "");
      showStatus("hidden");
      return;
    } catch (err) {
      hideTyping();
      if (err.status !== 429 || attempt >= maxAttempts) {
        throw err;
      }
    }
  }
}

async function sendMessage(text) {
  if (isLoading) return;
  const trimmed = text.trim();
  if (!trimmed) return;

  const inputEl = document.querySelector("#composer-input");
  if (inputEl) inputEl.value = "";
  isLoading = true;
  lockUI();

  chatHistory = appendUserMessage(chatHistory, trimmed);
  saveHistory(activeCharacterKey, chatHistory);
  appendMessage("user", trimmed);

  const egg = checkEasterEgg(trimmed);
  if (egg) {
    chatHistory = appendAssistantMessage(chatHistory, egg.text);
    saveHistory(activeCharacterKey, chatHistory);
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
    const finalResponse = aiText || "No recibí texto en la respuesta.";
    chatHistory = appendAssistantMessage(chatHistory, finalResponse);
    saveHistory(activeCharacterKey, chatHistory);
    appendMessage("assistant", finalResponse);
    showStatus("hidden");
  } catch (err) {
    hideTyping();
    if (err.status === 429) {
      console.warn("[sendMessage 429]", err);
      try {
        await retryWithBackoff(err, payload, 2);
      } catch (retryErr) {
        hideTyping();
        showStatus("error", "⏳ Límite de tasa gratuito de Google Gemini (15 peticiones/min) alcanzado. Espera 10 segundos antes de enviar otro mensaje.");
        console.warn("[retryWithBackoff ended]", retryErr);
      }
    } else {
      console.error("[sendMessage error]", err);
      showStatus("error", "❌ Error de conexión con la IA. Verifica tu API Key o conexión.");
    }
  } finally {
    isLoading = false;
    unlockUI();
  }
}

export function renderChat(characterKey) {
  activeCharacterKey = characterKey || "science";
  currentCharacter = getCharacter(activeCharacterKey);
  chatHistory = resetHistory();

  const allChars = getAllCharacters();
  const selectOptionsHtml = allChars
    .map(
      (c) =>
        `<option value="${c.id}" ${c.id === activeCharacterKey ? "selected" : ""}>${c.avatar} ${c.name}</option>`
    )
    .join("");

  const $app = document.querySelector("#app");
  $app.className = "view-chat";

  $app.innerHTML = `
    <div class="chat-app">
      <header class="chat-header">
        <a href="/" class="chat-header__back" title="Volver al inicio">← Inicio</a>
        <div class="chat-header__info">
          <span class="chat-header__avatar">${currentCharacter.avatar}</span>
          <div class="chat-header__titles">
            <h2 class="chat-header__name">${currentCharacter.name}</h2>
            <span class="chat-header__status-badge" id="storage-badge">💾 Memoria activa</span>
          </div>
        </div>
        <div class="chat-header__actions">
          <div class="character-select-wrapper">
            <select id="char-select" class="chat-header__select" aria-label="Cambiar personaje">
              ${selectOptionsHtml}
            </select>
          </div>
          <span class="counter-badge" id="counter-badge">💬 #0</span>
          <button id="reset-btn" class="chat-header__reset" title="Limpiar historial de conversación" aria-label="Limpiar historial">🗑️ Reset</button>
        </div>
      </header>

      <main class="chat-messages" id="messages" aria-live="polite" aria-label="Mensajes del chat">
        <div class="messages-empty" id="messages-empty">
          <div class="messages-empty__avatar">${currentCharacter.avatar}</div>
          <p>👋 ¡Hola! Soy el <strong>${currentCharacter.name}</strong>.<br>Pregúntame lo que quieras.</p>
        </div>
      </main>

      <div id="status-panel" class="status-panel hidden" aria-live="assertive">
        <span id="status-text" class="status-text"></span>
      </div>

      <form class="composer" id="composer-form" autocomplete="off" novalidate>
        <input class="composer__input" id="composer-input" type="text"
          placeholder="Escribí tu mensaje... (presiona Enter para enviar)" aria-label="Mensaje" maxlength="500">
        <button class="composer__btn" id="send-btn" type="submit" aria-label="Enviar mensaje">↑</button>
      </form>
    </div>
  `;

  const themeKey = getThemeKey(currentCharacter.name);
  $app.classList.add(`theme-${themeKey}`);

  clearMessages();
  updateCharacterUI(currentCharacter);

  // Restaurar historial guardado desde LocalStorage si existe
  const savedMessages = loadHistory(activeCharacterKey);
  if (savedMessages.length > 0) {
    chatHistory = savedMessages;
    savedMessages.forEach((msg) => {
      appendMessage(msg.role, msg.content);
    });
    const storageBadge = document.querySelector("#storage-badge");
    if (storageBadge) {
      storageBadge.textContent = "💾 Historial restaurado";
      storageBadge.classList.add("restored");
    }
  }

  // Listener para cambio rápido de personaje
  const charSelect = document.querySelector("#char-select");
  if (charSelect) {
    charSelect.addEventListener("change", (e) => {
      const selectedKey = e.target.value;
      if (selectedKey !== activeCharacterKey) {
        navigateTo(`/chat/${selectedKey}`);
      }
    });
  }

  // Manejo de envío con formulario o tecla Enter
  const formEl = document.querySelector("#composer-form");
  const inputEl = document.querySelector("#composer-input");

  if (inputEl) {
    inputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage(inputEl.value);
      }
    });
  }

  if (formEl) {
    formEl.addEventListener("submit", (event) => {
      event.preventDefault();
      if (inputEl) sendMessage(inputEl.value);
    });
  }

  const resetBtn = document.querySelector("#reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm(`¿Deseas borrar el historial con ${currentCharacter.name}?`)) {
        chatHistory = resetHistory();
        clearStorageHistory(activeCharacterKey);
        clearMessages();
        const storageBadge = document.querySelector("#storage-badge");
        if (storageBadge) {
          storageBadge.textContent = "💾 Memoria limpia";
          storageBadge.classList.remove("restored");
        }
      }
    });
  }
}

function getThemeKey(name) {
  if (name.includes("Chef")) return "chef";
  if (name.includes("Detective")) return "detective";
  if (name.includes("Astro")) return "astro";
  return "science";
}