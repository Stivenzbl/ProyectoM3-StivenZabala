/*
 * api/chat.js — Vercel Serverless Function del proyecto integrador PIM3
 *
 * Arquitectura Híbrida:
 * 1. OpenRouter API Gateway (OpenAI Compatible) si se detecta OPENROUTER_API_KEY o clave sk-or-*.
 * 2. Google Generative AI SDK si se detecta GEMINI_API_KEY de Google AI Studio (AIzaSy*).
 * 3. Fallback inteligente entre proveedores y modelos.
 *
 * La API key nunca se envía al cliente.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { isRateLimitError, isInvalidApiKeyError, getHttpStatus } from "./utils/errors.js";
import { toGeminiContents } from "./utils/gemini.js";
import { parseJsonBody, getMessages, getGenerationSettings } from "./utils/request.js";
import { createChatResponse } from "./utils/response.js";
import { callOpenRouter, isOpenRouterKey } from "./utils/openrouter.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = parseJsonBody(req.body);
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const activeKey = openRouterKey || geminiKey;

    if (!activeKey) {
      return res.status(500).json({
        error: "No se encontró OPENROUTER_API_KEY ni GEMINI_API_KEY en las variables de entorno.",
      });
    }

    const messages = getMessages(payload);
    const { system, modelName, temperature, maxOutputTokens } = getGenerationSettings(payload);

    // -------------------------------------------------------------
    // RUTA 1: OpenRouter API Gateway (si hay OPENROUTER_API_KEY o la clave es sk-or-*)
    // -------------------------------------------------------------
    if (openRouterKey || isOpenRouterKey(geminiKey)) {
      const apiKeyToUse = openRouterKey || geminiKey;
      const openRouterResponse = await callOpenRouter({
        apiKey: apiKeyToUse,
        model: payload.model,
        system,
        messages,
        temperature,
        maxTokens: maxOutputTokens,
      });

      return res.status(200).json(openRouterResponse);
    }

    // -------------------------------------------------------------
    // RUTA 2: Google Generative AI Native SDK
    // -------------------------------------------------------------
    const genAI = new GoogleGenerativeAI(geminiKey);
    const contents = toGeminiContents(messages);

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
        break; // Petición exitosa
      } catch (err) {
        lastError = err;

        if (isRateLimitError(err) || isInvalidApiKeyError(err)) {
          break;
        }

        const errText = String(err?.message || "");
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
        error: "Límite de peticiones por minuto alcanzado. Espera 15 segundos antes de reintentar.",
        retryAfterSeconds: 15,
      });
    }

    if (isInvalidApiKeyError(error)) {
      return res.status(400).json({
        error: "🔑 Clave de API no válida o expirada. Verifica tu API Key de OpenRouter (sk-or-...) o de Google AI Studio (AIzaSy...).",
      });
    }

    return res.status(getHttpStatus(error)).json({
      error: error.message || "Error generando respuesta del chat",
    });
  }
}