# Implementación de Inteligencia Artificial (Google Gemini AI Engine)

Este documento detalla la arquitectura técnica, la ingeniería de prompts y el flujo de datos para la integración segura del motor de IA en el Proyecto Integrador PIM3.

---

## 🔒 Arquitectura de Conexión y Seguridad

El sistema utiliza una arquitectura desvinculada de tres capas para garantizar que **la API Key de Google Gemini nunca se exponga en el navegador cliente**.

```
[ Frontend SPA ] ---> (POST /api/chat) ---> [ Vercel Serverless Function ] ---> [ Google Gemini API ]
 (Historial recortado)                         (Inyecta GEMINI_API_KEY)            (gemini-1.5-flash)
```

### 1. Capa de Presentación y Estado (Frontend)
- **Archivos:** `src/views/chat.js`, `src/engine/history.js`, `src/engine/payload.js`, `src/engine/storage.js`.
- **Gestión de Context Window:** La IA no conserva memoria entre solicitudes HTTP. Por ello, `history.js` mantiene un historial recortado con `getTrimmedHistory(messages, 10)` enviando solo las últimas interacciones para controlar tokens, costos y rate limits.
- **Persistencia en LocalStorage:** `storage.js` guarda y restaura automáticamente las conversaciones por personaje (`pim3_chat_history_<key>`).

### 2. Capa de Pasarela y Proxy (Backend / Serverless)
- **Archivos:** `api/chat.js` y `api/utils/`.
- La Serverless Function de Vercel actúa como el único punto seguro donde se lee `process.env.GEMINI_API_KEY`.
- Recibe el payload estandarizado del cliente, valida los tipos de datos en `request.js` y maneja excepciones HTTP como `429 Too Many Requests`.

### 3. Capa de Adaptación (Gemini Adapter)
- **Archivo:** `api/utils/gemini.js`.
- Función principal: `toGeminiContents(messages)`.
- **Mapeo de Roles:**
  - `user` $\rightarrow$ `user`
  - `assistant` $\rightarrow$ `model`
- **Generación de Contenido:** Transforma las conversaciones en la estructura de `parts: [{ text }]` requerida por el SDK `@google/generative-ai`.

---

## 🎭 Ingeniería de Prompts (System Prompts)

Cada personaje posee un `systemInstruction` único configurado en `src/engine/payload.js` para moldear su personalidad y restringir la longitud de las respuestas:

### 🧪 Dr. Science
```text
Actúa como el Dr. Science, un científico apasionado y didáctico.
Explica conceptos científicos de forma clara y entusiasta.
Responde en máximo 3 líneas. Usa analogías simples.
Si no sabes la respuesta, admítelo y propone un experimento mental.
```

### 👨‍🍳 Chef Claude
```text
Actúa como el Chef Claude, un chef creativo y entusiasta.
Hablas de comida, recetas y técnicas culinarias con pasión.
Responde en máximo 3 líneas. Usa metáforas culinarias cuando sea posible.
Si no sabes algo de cocina, sugerí experimentar con ingredientes.
```

### 🕵️ Detective
```text
Actúa como un detective perspicaz y metódico.
Analizas situaciones con lógica y deducción. Respondes de forma directa.
Máximo 3 líneas. Nunca especulas sin evidencia.
Si algo es incierto, lo señalas claramente y pedís más datos.
```

### 🚀 Astro Explorer
```text
Actúa como Astro Explorer, un intrépido astronauta y divulgador astronómico.
Hablas sobre estrellas, galaxias y la inmensidad del espacio con fascinación y asombro.
Responde en máximo 3 líneas. Usa referencias espaciales.
Si algo es un misterio del cosmos, propone contemplar las estrellas.
```

---

## 🔄 Manejo de Errores y Rate Limiting

1. **429 Rate Limit Handling:** Si Gemini retorna `429`, la Serverless Function devuelve una respuesta estructurada con `retryAfterSeconds`. El cliente realiza un reintento automático dinámico (`retryOnceAfter429`) mostrando la cuenta regresiva en la UI.
2. **Normalización de Respuestas:** `normalizer.js` analiza la respuesta de la API y extrae de forma segura el bloque de texto `content[].text`, detectando también si la respuesta fue truncada por la bandera `stop_reason === "max_tokens"`.
