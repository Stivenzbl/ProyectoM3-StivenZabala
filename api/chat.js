/*
 * api/chat.js — Vercel Serverless Function del proyecto integrador PIM3
 *
 * Responsabilidad:
 * - Recibir el payload construido por el engine del frontend.
 * - Leer GEMINI_API_KEY desde process.env.
 * - Adaptar el payload interno del chat a Gemini.
 * - Incluir sistema de Fallback Automático entre modelos (gemini-2.0-flash, gemini-2.5-flash, gemini-1.5-flash-latest, etc.)
 * - Devolver un shape compatible con normalizer.js: content[].
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

    // Lista priorizada de modelos candidatos con fallback automático si uno no está disponible en la cuenta/región
    const candidateModels = Array.from(
      new Set([
        process.env.GEMINI_MODEL,
        modelName,
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash",
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
        break; // Petición exitosa
      } catch (err) {
        lastError = err;
        const errText = String(err?.message || "");
        // Si el modelo retorna 404 Not Found, probamos automáticamente con el siguiente modelo de la lista
        if (errText.includes("404") || errText.toLowerCase().includes("not found")) {
          console.warn(`[GEMINI FALLBACK] Modelo '${modelToTry}' no disponible. Probando alternativa...`);
          continue;
        }
        // Para otros errores (rate limits, etc.), salimos del bucle para tratarlos en el catch principal
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
        error: "Rate limit de Gemini. Reintentá en unos segundos.",
        retryAfterSeconds: 8,
      });
    }

    return res.status(getHttpStatus(error)).json({
      error: error.message || "Error generando respuesta del chat",
    });
  }
}