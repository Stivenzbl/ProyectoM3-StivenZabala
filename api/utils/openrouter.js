/*
 * openrouter.js — Adaptador e integrador de OpenRouter API (OpenAI Compatible)
 *
 * Permite conectarse a cientos de modelos (Gemini, Llama, DeepSeek, Mistral, Gemma)
 * usando el formato estándar de Chat Completions.
 */

export function toOpenRouterMessages(systemPrompt, messages) {
  const result = [];
  if (systemPrompt && typeof systemPrompt === "string" && systemPrompt.trim()) {
    result.push({ role: "system", content: systemPrompt.trim() });
  }

  if (Array.isArray(messages)) {
    messages
      .filter((msg) => msg?.role === "user" || msg?.role === "assistant")
      .forEach((msg) => {
        result.push({
          role: msg.role,
          content: String(msg.content ?? ""),
        });
      });
  }

  return result;
}

export function isOpenRouterKey(key) {
  if (!key || typeof key !== "string") return false;
  return key.startsWith("sk-or-") || Boolean(process.env.OPENROUTER_API_KEY);
}

export async function callOpenRouter({ apiKey, model, system, messages, temperature, maxTokens }) {
  const formattedMessages = toOpenRouterMessages(system, messages);
  // Usa por defecto 'openrouter/free', el router automático oficial de modelos gratuitos de OpenRouter
  const targetModel =
    process.env.OPENROUTER_MODEL ||
    (model && model.includes("/") ? model : "openrouter/free");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/Stivenzbl/ProyectoM3-StivenZabala",
      "X-Title": "PIM3 Chat AI Serverless",
    },
    body: JSON.stringify({
      model: targetModel,
      messages: formattedMessages,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 150,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || `OpenRouter HTTP ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }

  const choice = data?.choices?.[0];
  const text = (choice?.message?.content || "").trim();
  const stopReason = choice?.finish_reason;

  return {
    id: data?.id || `msg_or_${Date.now()}`,
    type: "message",
    role: "assistant",
    content: [{ type: "text", text }],
    stop_reason: stopReason === "length" ? "max_tokens" : "end_turn",
    usage: {
      input_tokens: data?.usage?.prompt_tokens ?? 0,
      output_tokens: data?.usage?.completion_tokens ?? 0,
    },
  };
}
