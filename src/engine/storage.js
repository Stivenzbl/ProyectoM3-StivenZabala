/*
 * storage.js — Persistencia del historial de chat en LocalStorage (Extra Credit)
 *
 * Permite guardar, recuperar y limpiar las conversaciones por personaje
 * para que no se pierdan al recargar la pagina.
 */

const STORAGE_PREFIX = "pim3_chat_history_";

export function saveHistory(characterKey, history) {
  try {
    const key = `${STORAGE_PREFIX}${characterKey}`;
    localStorage.setItem(key, JSON.stringify(history));
  } catch (err) {
    console.warn("[Storage] No se pudo guardar el historial:", err);
  }
}

export function loadHistory(characterKey) {
  try {
    const key = `${STORAGE_PREFIX}${characterKey}`;
    const data = localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("[Storage] No se pudo cargar el historial:", err);
    return [];
  }
}

export function clearStorageHistory(characterKey) {
  try {
    const key = `${STORAGE_PREFIX}${characterKey}`;
    localStorage.removeItem(key);
  } catch (err) {
    console.warn("[Storage] No se pudo limpiar el historial:", err);
  }
}

export function hasSavedHistory(characterKey) {
  try {
    const history = loadHistory(characterKey);
    return history.length > 0;
  } catch {
    return false;
  }
}
