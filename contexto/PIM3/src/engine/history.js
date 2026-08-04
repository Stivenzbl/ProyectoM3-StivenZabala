/*
 * history.js — Gestión del historial de conversación
 *
 * La AI no tiene memoria entre requests. Cada vez que enviamos un mensaje,
 * mandamos el historial necesario para que el modelo reciba contexto.
 *
 * Estas funciones son puras: reciben un array y devuelven otro array.
 * No mutar el original vuelve el flujo más predecible y fácil de testear.
 */

/*
 * appendUserMessage(messages, text)
 * Devuelve un nuevo historial con el mensaje del usuario agregado.
 */
export function appendUserMessage(messages, text) {
  return [...messages, { role: "user", content: text }];
}

/*
 * appendAssistantMessage(messages, text)
 * Devuelve un nuevo historial con la respuesta del asistente agregada.
 */
export function appendAssistantMessage(messages, text) {
  return [...messages, { role: "assistant", content: text }];
}

/*
 * getTrimmedHistory(messages, maxTurns)
 * Devuelve los últimos N mensajes para controlar tokens, costo y rate limits.
 */
export function getTrimmedHistory(messages, maxTurns = 10) {
  return messages.slice(-maxTurns);
}

/*
 * resetHistory()
 * Limpia el historial cuando cambia el personaje o empieza una conversación nueva.
 */
export function resetHistory() {
  return [];
}
