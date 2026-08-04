/*
 * render.js — Capa de render del chat
 * Usa queries en vivo (no cachea) para funcionar con DOM dinámico.
 */

function $(sel) { return document.querySelector(sel); }

function getCounter() { return $("#counter-badge"); }
function getStatusPanel() { return $("#status-panel"); }
function getStatusText() { return $("#status-text"); }
function getSendBtn() { return $("#send-btn"); }
function getInput() { return $("#composer-input"); }
function getMessages() { return $("#messages"); }
function getEmpty() { return $("#messages-empty"); }

let messageCount = 0;

const PLACEHOLDERS = [
  "Escribí tu mensaje...",
  "💡 Hacé una pregunta...",
  "🤔 Tirame un dato curioso...",
  "🎯 Decime algo para analizar...",
];

let placeholderIndex = 0;
let placeholderInterval;

function startPlaceholderRotation() {
  stopPlaceholderRotation();
  placeholderInterval = setInterval(() => {
    placeholderIndex = (placeholderIndex + 1) % PLACEHOLDERS.length;
    const input = getInput();
    if (input) input.placeholder = PLACEHOLDERS[placeholderIndex];
  }, 4000);
}

function stopPlaceholderRotation() {
  clearInterval(placeholderInterval);
}

startPlaceholderRotation();

export function lockUI() {
  const btn = getSendBtn();
  const input = getInput();
  if (btn) { btn.disabled = true; btn.classList.add("is-sending"); btn.textContent = "⏳"; }
  if (input) input.disabled = true;
}

export function unlockUI() {
  const btn = getSendBtn();
  const input = getInput();
  if (btn) { btn.disabled = false; btn.classList.remove("is-sending"); btn.textContent = "↑"; }
  if (input) { input.disabled = false; input.focus(); }
}

export function showTyping() {
  const $empty = getEmpty();
  if ($empty) $empty.classList.add("hidden");
  hideTyping();

  const $msgs = getMessages();
  if (!$msgs) return;

  const el = document.createElement("div");
  el.className = "message message--assistant";
  el.id = "typing-indicator";
  el.innerHTML = `
    <span class="message__author">${getCurrentCharacterName()}</span>
    <div class="typing-indicator"><span></span><span></span><span></span></div>
  `;
  $msgs.appendChild(el);
  scrollToBottom();
}

export function hideTyping() {
  document.querySelector("#typing-indicator")?.remove();
}

export function appendMessage(role, text, meta = "", isEasterEgg = false) {
  const $empty = getEmpty();
  const $msgs = getMessages();
  if ($empty) $empty.classList.add("hidden");
  if (!$msgs) return;

  const div = document.createElement("div");
  let className = `message message--${role}`;
  if (isEasterEgg) className += " message--easter-egg";
  div.className = className;
  div.innerHTML = `
    <span class="message__author">${role === "user" ? "Vos" : getCurrentCharacterName()}</span>
    <div class="message__bubble">${escapeHtml(String(text))}</div>
    ${meta ? `<span class="message__meta">${escapeHtml(meta)}</span>` : ""}
  `;
  $msgs.appendChild(div);
  scrollToBottom();

  messageCount += 1;
  const counter = getCounter();
  if (counter) counter.textContent = `💬 #${messageCount}`;
}

export function showStatus(type, text = "") {
  const panel = getStatusPanel();
  const statusText = getStatusText();
  const dot = document.querySelector("#connection-status") || createStatusDot();

  if (type === "hidden") {
    if (panel) { panel.classList.add("hidden"); panel.className = "status-panel hidden"; }
    if (statusText) statusText.textContent = "";
    dot.className = "status-dot status--online";
    return;
  }

  if (panel) panel.classList.remove("hidden");
  if (statusText) statusText.textContent = text;

  if (type === "retrying") {
    if (panel) panel.className = "status-panel status--retrying";
    dot.className = "status-dot status--busy";
  } else if (type === "error") {
    if (panel) panel.className = "status-panel status--error-msg";
    dot.className = "status-dot status--error";
  } else {
    if (panel) panel.className = "status-panel";
    dot.className = "status-dot status--busy";
  }
}

function createStatusDot() {
  const dot = document.createElement("span");
  dot.id = "connection-status";
  dot.className = "status-dot status--online";
  const header = document.querySelector(".chat-header__info");
  if (header) header.appendChild(dot);
  return dot;
}

export function updateCharacterUI(character) {
  const empty = getEmpty();
  if (empty) {
    empty.innerHTML = `
      <div class="messages-empty__avatar">${escapeHtml(character.avatar)}</div>
      <p>👋 ¡Hola! Soy el <strong>${escapeHtml(character.name)}</strong>.<br>Preguntame lo que quieras.</p>
    `;
  }
}

export function clearMessages() {
  const $msgs = getMessages();
  const $empty = getEmpty();
  if ($msgs) {
    [...$msgs.children].forEach((el) => {
      if (el.id !== "messages-empty") el.remove();
    });
  }
  if ($empty) $empty.classList.remove("hidden");
  showStatus("hidden");
  messageCount = 0;
  const counter = getCounter();
  if (counter) counter.textContent = "💬 #0";
}

function scrollToBottom() {
  const $msgs = getMessages();
  if ($msgs) $msgs.scrollTop = $msgs.scrollHeight;
}

function getCurrentCharacterName() {
  const el = document.querySelector(".chat-header__name");
  return el ? el.textContent : "Asistente";
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
