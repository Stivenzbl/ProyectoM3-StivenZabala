# PIM3 — Chat AI Serverless Gemini

Proyecto integrador final resuelto del Modulo 3.

La app es una Single Page Application responsive que permite chatear con personajes ficticios usando Google Gemini AI de forma segura mediante una Vercel Serverless Function.

---

## Personajes elegidos

La app incluye una galeria inicial con tres personajes:

| Personaje | Personalidad |
|-----------|--------------|
| Dr. Science | Cientifico didactico que explica con analogias simples |
| Chef Claude | Chef creativo que responde con metaforas culinarias |
| Detective | Investigador metodico que responde con logica y evidencia |

Cada personaje tiene su propio `system prompt` en `src/engine/payload.js`.

---

## Que integra del modulo

- SPA con rutas `/home`, `/chat`, `/chat/:character` y `/about`.
- Navegacion con History API sin recargar la pagina.
- Chat con historial de conversacion durante la sesion.
- UI responsive mobile-first.
- Estados de carga, error y typing.
- Serverless Function `/api/chat`.
- API key protegida con `process.env.GEMINI_API_KEY`.
- Adaptador de historial a formato Gemini.
- Tests unitarios con Vitest.

---

## Como correr localmente

Instalar dependencias:

```bash
npm install
```

Crear `.env` desde el ejemplo:

```powershell
Copy-Item .env.example .env
```

Completar `.env`:

```txt
GEMINI_API_KEY=tu-api-key-real
```

Levantar con Vercel Dev:

```bash
npm run local
```

Abrir:

```txt
http://localhost:3000
```

No usar Live Server para este proyecto, porque Live Server no ejecuta la carpeta `api/`.

---

## Como ejecutar tests

```bash
npm run test:run
```

Los tests cubren:

| Archivo | Que valida |
|---------|------------|
| `tests/history.test.js` | Historial inmutable y recorte |
| `tests/payload.test.js` | Payload correcto con historial |
| `tests/gemini.test.js` | Adaptacion a `contents[]` |
| `tests/aiClient.test.js` | `fetch("/api/chat")` mockeado |

---

## Arquitectura

```txt
src/views/chat.js
  -> history.js
  -> payload.js
  -> aiClient.js
  -> /api/chat
  -> api/utils/gemini.js
  -> Gemini
```

La API key nunca llega al navegador.

El historial se manda en cada request:

```txt
chatHistory
  -> getTrimmedHistory(chatHistory, 10)
  -> buildPayload(character, trimmedHistory)
  -> payload.messages
  -> toGeminiContents(messages)
  -> Gemini
```

---

## Deploy en Vercel

1. Subir el proyecto a GitHub.
2. Importarlo en Vercel.
3. Configurar Environment Variable:

```txt
GEMINI_API_KEY=tu-api-key-real
```

4. Hacer deploy.
5. Probar `/home`, `/chat`, `/chat/science` y `/about`.

Antes de deploy:

```bash
npm run test:run
```

---

## Capturas

Agregar capturas de:

- Home con galeria de personajes.
- Chat en mobile.
- Chat en desktop.
- Network mostrando request a `/api/chat`.

---

## Link desplegado

Completar al entregar:

```txt
URL de Vercel: https://...
Repositorio GitHub: https://...
```

---

## Registro de uso de AI

Durante el desarrollo se uso IA para:

- organizar la arquitectura por modulos;
- revisar el flujo de historial hacia Gemini;
- generar tests unitarios;
- mejorar documentacion y checklist de entrega.

Las decisiones tecnicas finales se mantuvieron alineadas con el recorrido del modulo:

- M3L2: routing SPA;
- M3L6: chat engine con historial;
- M3L7: serverless function segura;
- M3L8: tests unitarios con Vitest.

---

## Checklist de entrega

- [x] SPA funcional.
- [x] Rutas `/home`, `/chat`, `/chat/:character` y `/about`.
- [x] Chat con personajes.
- [x] Historial de conversacion durante la sesion.
- [x] Serverless Function `/api/chat`.
- [x] Gemini conectado desde backend.
- [x] API key protegida.
- [x] `.env.example` incluido sin secretos reales.
- [x] Tests unitarios.
- [x] Deep links funcionando con `vercel.json`.
