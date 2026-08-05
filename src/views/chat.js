/*
 * views/chat.js — Vista y Motor principal de Chat PIM3
 *
 * Funcionalidades Avanzadas:
 * - Historial Multisesión Estilo ChatGPT / Claude: Guarda automáticamente cada conversación por separado.
 * - Botón "+ Nuevo Chat": Inicia una conversación limpia sin perder los chats anteriores.
 * - Sidebar de Sesiones: Lista lateral interactiva para reabrir, navegar o eliminar chats guardados.
 * - Indicador de estado y badge de memoria activa.
 * - UI Lock/Unlock, Auto Retry para 429 Rate Limit.
 * - Copiar al portapapeles & Timestamps por mensaje.
 */

import { appendUserMessage, appendAssistantMessage, getTrimmedHistory, resetHistory } from "../engine/history.js";
import { buildPayload, getCharacter, getAllCharacters } from "../engine/payload.js";
import { callAI } from "../engine/aiClient.js";
import { normalizeAIResponse } from "../engine/normalizer.js";
import {
  getCharacterSessions,
  getActiveSessionId,
  setActiveSessionId,
  createNewSession,
  saveSessionMessages,
  deleteSession,
  getAllSessions,
} from "../engine/storage.js";
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
let activeSessionId = null;
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
    const waitSecs = initialErr.retryAfterSeconds ? initialErr.retryAfterSeconds : 15;
    for (let i = waitSecs; i > 0; i -= 1) {
      showStatus("retrying", `⏳ Cuota gratuita Gemini (15 req/min). Reintentando (${attempt}/${maxAttempts}) en ${i}s...`);
      await wait(1000);
    }
    showTyping();
    showStatus("loading", `Reintentando conexión...`);
    try {
      const raw = await callAI(payload);
      hideTyping();
      const { text: aiText, truncated } = normalizeAIResponse(raw);
      const finalResponse = aiText || "No recibí texto en la respuesta.";
      chatHistory = appendAssistantMessage(chatHistory, finalResponse);
      saveSessionMessages(activeCharacterKey, activeSessionId, chatHistory);
      appendMessage("assistant", finalResponse, truncated ? "⚠️ truncada" : "");
      renderSidebarSessions();
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

  // Asegurar que exista una sesión activa
  if (!activeSessionId) {
    const newSession = createNewSession(activeCharacterKey);
    activeSessionId = newSession.id;
  }

  chatHistory = appendUserMessage(chatHistory, trimmed);
  saveSessionMessages(activeCharacterKey, activeSessionId, chatHistory);
  appendMessage("user", trimmed);
  renderSidebarSessions();

  const egg = checkEasterEgg(trimmed);
  if (egg) {
    chatHistory = appendAssistantMessage(chatHistory, egg.text);
    saveSessionMessages(activeCharacterKey, activeSessionId, chatHistory);
    appendMessage("assistant", egg.text, egg.meta, true);
    renderSidebarSessions();
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
    saveSessionMessages(activeCharacterKey, activeSessionId, chatHistory);
    appendMessage("assistant", finalResponse);
    renderSidebarSessions();
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
    <div class="chat-app-wrapper">
      <!-- Sidebar de Historial Multisesión -->
      <aside class="chat-sidebar" id="chat-sidebar" aria-label="Historial de conversaciones">
        <div class="chat-sidebar__header">
          <button class="btn-new-chat" id="btn-new-chat" type="button" aria-label="Iniciar nueva conversación">
            <span>➕</span> Nuevo Chat
          </button>
        </div>
        <div class="chat-sidebar__section-title">
          <span>📜 Conversaciones Guardadas</span>
        </div>
        <div class="chat-sidebar__list" id="sidebar-sessions-list">
          <!-- Renderizado dinámico de sesiones -->
        </div>
      </aside>

      <!-- Panel Principal de Chat -->
      <div class="chat-app">
        <header class="chat-header">
          <button id="toggle-sidebar-btn" class="chat-header__sidebar-toggle" title="Abrir/Cerrar Historial" aria-label="Abrir historial">📜 Historial</button>
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
            <button id="reset-btn" class="chat-header__reset" title="Limpiar sesión actual" aria-label="Limpiar sesión">🗑️ Reset</button>
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
    </div>
  `;

  const themeKey = getThemeKey(currentCharacter.name);
  $app.classList.add(`theme-${themeKey}`);

  // Cargar o crear sesión activa
  const sessions = getCharacterSessions(activeCharacterKey);
  activeSessionId = getActiveSessionId(activeCharacterKey);

  if (!activeSessionId && sessions.length > 0) {
    activeSessionId = sessions[0].id;
    setActiveSessionId(activeCharacterKey, activeSessionId);
  }

  if (activeSessionId) {
    loadSession(activeSessionId);
  } else {
    // Si no hay sesiones previas, iniciar una limpia
    chatHistory = resetHistory();
    clearMessages();
    updateCharacterUI(currentCharacter);
  }

  renderSidebarSessions();

  // Event Listeners
  const newChatBtn = document.querySelector("#btn-new-chat");
  if (newChatBtn) {
    newChatBtn.addEventListener("click", () => {
      startNewSession();
    });
  }

  const toggleSidebarBtn = document.querySelector("#toggle-sidebar-btn");
  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener("click", () => {
      const sidebar = document.querySelector("#chat-sidebar");
      if (sidebar) sidebar.classList.toggle("is-open");
    });
  }

  const charSelect = document.querySelector("#char-select");
  if (charSelect) {
    charSelect.addEventListener("change", (e) => {
      const selectedKey = e.target.value;
      if (selectedKey !== activeCharacterKey) {
        navigateTo(`/chat/${selectedKey}`);
      }
    });
  }

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
      if (confirm(`¿Deseas borrar la sesión actual con ${currentCharacter.name}?`)) {
        if (activeSessionId) {
          deleteSession(activeSessionId, activeCharacterKey);
        }
        startNewSession();
      }
    });
  }
}

function startNewSession() {
  const newSession = createNewSession(activeCharacterKey);
  activeSessionId = newSession.id;
  chatHistory = resetHistory();
  clearMessages();
  updateCharacterUI(currentCharacter);
  renderSidebarSessions();
  const input = document.querySelector("#composer-input");
  if (input) input.focus();
}

function loadSession(sessionId) {
  const sessions = getAllSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return;

  activeSessionId = session.id;
  setActiveSessionId(activeCharacterKey, activeSessionId);
  chatHistory = session.messages || [];

  clearMessages();
  updateCharacterUI(currentCharacter);

  if (chatHistory.length > 0) {
    chatHistory.forEach((msg) => {
      appendMessage(msg.role, msg.content);
    });
    const storageBadge = document.querySelector("#storage-badge");
    if (storageBadge) {
      storageBadge.textContent = `💾 ${session.title}`;
      storageBadge.classList.add("restored");
    }
  } else {
    const storageBadge = document.querySelector("#storage-badge");
    if (storageBadge) {
      storageBadge.textContent = "💾 Sesión limpia";
      storageBadge.classList.remove("restored");
    }
  }

  renderSidebarSessions();
}

function renderSidebarSessions() {
  const listEl = document.querySelector("#sidebar-sessions-list");
  if (!listEl) return;

  const charSessions = getCharacterSessions(activeCharacterKey);

  if (charSessions.length === 0) {
    listEl.innerHTML = `
      <div class="sidebar-empty">
        <p>No hay conversaciones guardadas.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = charSessions
    .map((session) => {
      const isActive = session.id === activeSessionId;
      const timeStr = new Date(session.updatedAt || session.createdAt).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      return `
        <div class="session-item ${isActive ? "active" : ""}" data-id="${session.id}">
          <div class="session-item__info">
            <span class="session-item__avatar">${currentCharacter.avatar}</span>
            <div class="session-item__text">
              <span class="session-item__title" title="${escapeHtml(session.title)}">${escapeHtml(session.title)}</span>
              <span class="session-item__date">${escapeHtml(timeStr)}</span>
            </div>
          </div>
          <button class="session-item__delete" type="button" data-delete-id="${session.id}" title="Eliminar conversación" aria-label="Eliminar conversación">🗑️</button>
        </div>
      `;
    })
    .join("");

  // Listeners para seleccionar y borrar sesiones desde el sidebar
  listEl.querySelectorAll(".session-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (e.target.closest(".session-item__delete")) return;
      const sid = item.dataset.id;
      if (sid && sid !== activeSessionId) {
        loadSession(sid);
        const sidebar = document.querySelector("#chat-sidebar");
        if (sidebar) sidebar.classList.remove("is-open");
      }
    });
  });

  listEl.querySelectorAll(".session-item__delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const sid = btn.dataset.deleteId;
      if (sid && confirm("¿Deseas borrar esta conversación guardada?")) {
        deleteSession(sid, activeCharacterKey);
        const remaining = getCharacterSessions(activeCharacterKey);
        if (remaining.length > 0) {
          loadSession(remaining[0].id);
        } else {
          startNewSession();
        }
      }
    });
  });
}

function getThemeKey(name) {
  if (name.includes("Chef")) return "chef";
  if (name.includes("Detective")) return "detective";
  if (name.includes("Astro")) return "astro";
  return "science";
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}