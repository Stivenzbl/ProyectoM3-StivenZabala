/*
 * payload.js — Construccion y validacion del payload interno del chat
 *
 * Este contrato viene de M3L6 y se mantiene igual en M3L7:
 * {
 *   model: string,
 *   system: string,
 *   messages: [
 *     { role: "user" | "assistant", content: string }
 *   ],
 *   max_tokens: number,
 *   temperature: number
 * }
 *
 * messages[] es el historial recortado con getTrimmedHistory().
 * En M3L7, api/chat.js adapta ese historial a Gemini:
 *   role "user"      -> role "user"
 *   role "assistant" -> role "model"
 *
 * Lo importante: no se manda solo el ultimo mensaje. Se manda el historial
 * recortado para que el modelo tenga contexto conversacional.
 */

const CHARACTERS = {
  science: {
    name: "Dr. Science",
    avatar: "🧪",
    system: `Actua como el Dr. Science, un cientifico apasionado y didactico.
Explica conceptos cientificos de forma clara y entusiasta.
Responde en maximo 3 lineas. Usa analogias simples.
Si no sabes la respuesta, admitelo y propone un experimento mental.`,
    temperature: 0.7,
  },
  chef: {
    name: "Chef Claude",
    avatar: "👨‍🍳",
    system: `Actua como el Chef Claude, un chef creativo y entusiasta.
Hablas de comida, recetas y tecnicas culinarias con pasion.
Responde en maximo 3 lineas. Usa metaforas culinarias cuando sea posible.
Si no sabes algo de cocina, sugeri experimentar con ingredientes.`,
    temperature: 0.8,
  },
  detective: {
    name: "Detective",
    avatar: "🕵️",
    system: `Actua como un detective perspicaz y metodico.
Analizas situaciones con logica y deduccion. Respondes de forma directa.
Maximo 3 lineas. Nunca especulas sin evidencia.
Si algo es incierto, lo senalas claramente y pedis mas datos.`,
    temperature: 0.4,
  },
};

/*
 * getCharacter(key)
 * Devuelve el perfil del personaje pedido o el default si la key no existe.
 */
export function getCharacter(key) {
  return CHARACTERS[key] ?? CHARACTERS.science;
}

/*
 * createSystemPrompt(character)
 * Esta separado para poder enriquecer el prompt con datos dinamicos
 * sin mezclar esa decision con buildPayload().
 */
export function createSystemPrompt(character) {
  return character.system;
}

/*
 * buildPayload(character, messages)
 * Recibe el historial de M3L6 y lo deja listo para enviarlo a /api/chat.
 * La adaptacion a Gemini ocurre en backend, dentro de api/utils/gemini.js.
 */
export function buildPayload(character, messages) {
  return {
    model: "gemini-2.5-flash",
    system: createSystemPrompt(character),
    messages,
    max_tokens: 150,
    temperature: character.temperature,
  };
}

/*
 * isValidPayload(payload)
 * Valida el contrato minimo y detecta el bug de role: "system" dentro de messages[].
 */
export function isValidPayload(payload) {
  if (typeof payload?.model !== "string") return false;
  if (typeof payload?.system !== "string") return false;
  if (!Array.isArray(payload?.messages)) return false;

  return payload.messages.every((msg) => {
    const hasValidRole = msg?.role === "user" || msg?.role === "assistant";
    const hasTextContent = typeof msg?.content === "string";
    return hasValidRole && hasTextContent;
  });
}
