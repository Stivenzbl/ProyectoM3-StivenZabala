/*
 * storage.js — Gestor Avanzado de Sesiones e Historial Multiconversación (Extra Credit Pro)
 *
 * Permite gestionar múltiples sesiones de conversación guardadas independientemente
 * por personaje, con títulos autogenerados, creación de nuevos chats y navegación entre sesiones.
 */

const SESSIONS_KEY = "pim3_chat_sessions_v2";
const ACTIVE_SESSION_PREFIX = "pim3_active_session_";

export function getAllSessions() {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("[Storage] Error al leer sesiones:", err);
    return [];
  }
}

export function saveAllSessions(sessions) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.warn("[Storage] Error al guardar sesiones:", err);
  }
}

export function getCharacterSessions(characterKey) {
  return getAllSessions().filter((s) => s.characterKey === characterKey);
}

export function getActiveSessionId(characterKey) {
  try {
    return localStorage.getItem(`${ACTIVE_SESSION_PREFIX}${characterKey}`) || null;
  } catch {
    return null;
  }
}

export function setActiveSessionId(characterKey, sessionId) {
  try {
    if (sessionId) {
      localStorage.setItem(`${ACTIVE_SESSION_PREFIX}${characterKey}`, sessionId);
    } else {
      localStorage.removeItem(`${ACTIVE_SESSION_PREFIX}${characterKey}`);
    }
  } catch (err) {
    console.warn("[Storage] Error al fijar sesión activa:", err);
  }
}

export function createNewSession(characterKey, initialMessages = []) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newSession = {
    id: sessionId,
    characterKey,
    title: "Nueva conversación",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: initialMessages,
  };

  const sessions = getAllSessions();
  sessions.unshift(newSession); // La conversación más reciente queda al inicio
  saveAllSessions(sessions);
  setActiveSessionId(characterKey, sessionId);
  return newSession;
}

export function saveSessionMessages(characterKey, sessionId, messages) {
  const sessions = getAllSessions();
  let session = sessions.find((s) => s.id === sessionId);

  if (!session) {
    session = {
      id: sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      characterKey,
      title: "Nueva conversación",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    sessions.unshift(session);
  }

  session.messages = messages;
  session.updatedAt = new Date().toISOString();

  // Generar título dinámico a partir del primer mensaje del usuario
  if ((session.title === "Nueva conversación" || !session.title) && messages.length > 0) {
    const firstUserMsg = messages.find((m) => m.role === "user");
    if (firstUserMsg && firstUserMsg.content) {
      const text = firstUserMsg.content.trim();
      session.title = text.length > 28 ? text.substring(0, 28).trim() + "..." : text;
    }
  }

  saveAllSessions(sessions);
  setActiveSessionId(characterKey, session.id);
  return session;
}

export function deleteSession(sessionId, characterKey) {
  const sessions = getAllSessions().filter((s) => s.id !== sessionId);
  saveAllSessions(sessions);

  const activeId = getActiveSessionId(characterKey);
  if (activeId === sessionId) {
    const remainingForChar = sessions.filter((s) => s.characterKey === characterKey);
    const nextActive = remainingForChar.length > 0 ? remainingForChar[0].id : null;
    setActiveSessionId(characterKey, nextActive);
  }
}

export function clearAllCharacterSessions(characterKey) {
  const sessions = getAllSessions().filter((s) => s.characterKey !== characterKey);
  saveAllSessions(sessions);
  setActiveSessionId(characterKey, null);
}

// ------------------------------------------------------------------
// Compatibilidad con la API de almacenamiento original
// ------------------------------------------------------------------
export function saveHistory(characterKey, history) {
  const activeId = getActiveSessionId(characterKey);
  if (activeId) {
    saveSessionMessages(characterKey, activeId, history);
  } else {
    const newSession = createNewSession(characterKey, history);
    saveSessionMessages(characterKey, newSession.id, history);
  }
}

export function loadHistory(characterKey) {
  const activeId = getActiveSessionId(characterKey);
  if (activeId) {
    const session = getAllSessions().find((s) => s.id === activeId);
    if (session) return session.messages;
  }
  const charSessions = getCharacterSessions(characterKey);
  if (charSessions.length > 0) {
    setActiveSessionId(characterKey, charSessions[0].id);
    return charSessions[0].messages;
  }
  return [];
}

export function clearStorageHistory(characterKey) {
  const activeId = getActiveSessionId(characterKey);
  if (activeId) {
    deleteSession(activeId, characterKey);
  } else {
    clearAllCharacterSessions(characterKey);
  }
}

export function hasSavedHistory(characterKey) {
  return getCharacterSessions(characterKey).length > 0;
}
