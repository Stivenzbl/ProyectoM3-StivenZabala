/*
 * api/chat.js — Vercel Serverless Function del proyecto integrador PIM3
 *
 * Responsabilidad:
 * - Recibir el payload construido por el engine del frontend.
 * - Leer GEMINI_API_KEY desde process.env.
 * - Adaptar el payload interno del chat a Gemini.
 * - Fallback inteligente solo para errores 404 de modelo no encontrado.
 * - Retorno inmediato de 429 Rate Limit.
 *
 * La API key nunca se envía al navegador.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { isRateLimitError, getHttpStatus } from "./utils/errors.js";
import { toGeminiContents } from "./utils/gemini.js";
import { parseJsonBody, getMessages, getGenerationSettings } from "./utils/request.js";
import { createChatResponse } from "./utils/response.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = parseJsonBody(req.body);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY no configurada en las variables de entorno" });
    }

    const messages = getMessages(payload);
    const { system, modelName, temperature, maxOutputTokens } = getGenerationSettings(payload);

    const genAI = new GoogleGenerativeAI(apiKey);
    const contents = toGeminiContents(messages);

    // Modelos oficiales de Google Generative AI
    const candidateModels = Array.from(
      new Set([
        process.env.GEMINI_MODEL,
        modelName,
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-pro",
      ])
    ).filter(Boolean);

    let lastError = null;
    let text = "";

    for (const modelToTry of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelToTry,
          systemInstruction: system,
        });

        const result = await model.generateContent({
          contents,
          generationConfig: {
            temperature,
            maxOutputTokens,
          },
        });

        text = result.response.text().trim();
        lastError = null;
        break; // Éxito
      } catch (err) {
        lastError = err;

        // Si es 429 Rate Limit, no probar otros modelos (el rate limit aplica a la API Key entera)
        if (isRateLimitError(err)) {
          break;
        }

        const errText = String(err?.message || "");
        // Si el modelo específico no existe (404), intentar con el siguiente modelo de la lista
        if (errText.includes("404") || errText.toLowerCase().includes("not found")) {
          console.warn(`[GEMINI FALLBACK] Modelo '${modelToTry}' no disponible (404). Intentando siguiente...`);
          continue;
        }

        break;
      }
    }

    if (lastError) {
      throw lastError;
    }

    return res.status(200).json(createChatResponse({ text, payload }));
  } catch (error) {
    console.error("[/api/chat] Error:", error);

    if (isRateLimitError(error)) {
      return res.status(429).json({
        error: "Límite de peticiones por minuto alcanzado (Google Gemini Free Tier). Espera 15 segundos.",
        retryAfterSeconds: 15,
      });
    }

    return res.status(getHttpStatus(error)).json({
      error: error.message || "Error generando respuesta del chat",
    });
  }
}