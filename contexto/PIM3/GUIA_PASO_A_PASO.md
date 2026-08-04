# Guia paso a paso — PIM3 Chat AI Serverless Gemini

Esta guia acompana el desarrollo del Proyecto Integrador del Modulo 3.

La idea no es copiar todo de una vez. La idea es construir el proyecto por partes, probando en cada etapa que lo anterior funciona antes de avanzar.

El resultado final sera una SPA responsive donde el usuario puede chatear con personajes ficticios usando Gemini de forma segura mediante una Vercel Serverless Function.

---

## Objetivo final

Construir una aplicacion que tenga:

- una pantalla Home;
- una pantalla Chat;
- una pantalla About;
- navegacion SPA sin recargar la pagina;
- chat con historial de conversacion;
- conexion segura con Gemini desde backend;
- tests unitarios con Vitest;
- deploy en Vercel.

---

## Parte 0 — Preparar el proyecto

Antes de escribir codigo, preparar la estructura:

```txt
project/
├── api/
├── src/
├── tests/
├── index.html
├── styles.css
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

Que tiene que quedar claro:

- `src/` contiene codigo frontend.
- `api/` contiene funciones serverless.
- `tests/` contiene tests unitarios.
- `.env` no se sube.
- `.env.example` si se sube.

Checklist:

- [ ] Crear estructura de carpetas.
- [ ] Crear `.gitignore`.
- [ ] Agregar `.env` al `.gitignore`.
- [ ] Crear `.env.example` con `GEMINI_API_KEY=`.

---

## Parte 1 — Crear la SPA base

Primero construir la app sin Gemini.

Archivos sugeridos:

```txt
index.html
styles.css
src/main.js
src/router.js
src/navigation.js
src/views/home.js
src/views/chat.js
src/views/about.js
src/views/notFound.js
```

Que se busca practicar:

- separar vistas en archivos;
- renderizar contenido dentro de `#app`;
- usar ES Modules;
- mantener una estructura clara.

Rutas minimas:

```txt
/home
/chat
/about
```

En el proyecto final tambien se permite:

```txt
/chat/science
/chat/chef
/chat/detective
```

Checklist:

- [ ] `index.html` carga `src/main.js`.
- [ ] `main.js` inicializa el router.
- [ ] `router.js` decide que vista renderizar.
- [ ] Home se ve correctamente.
- [ ] Chat se ve correctamente.
- [ ] About se ve correctamente.

---

## Parte 2 — Implementar routing con History API

Ahora la navegacion debe cambiar la URL sin recargar la pagina.

Conceptos que hay que usar:

- `history.pushState(...)`;
- evento `popstate`;
- interceptar clicks en links internos;
- renderizar segun `window.location.pathname`.

Flujo esperado:

```txt
click en link interno
-> preventDefault()
-> history.pushState(...)
-> router()
```

Cuando el usuario usa Back o Forward:

```txt
back/forward
-> popstate
-> router()
```

Checklist:

- [ ] Click en Home cambia la vista sin recargar.
- [ ] Click en Chat cambia la vista sin recargar.
- [ ] Click en About cambia la vista sin recargar.
- [ ] Back/Forward funciona.
- [ ] Entrar directo a `/chat` funciona.
- [ ] Entrar directo a una ruta inexistente muestra 404.

---

## Parte 3 — Construir la interfaz del chat

Antes de conectar Gemini, el chat debe existir visualmente.

Elementos minimos:

- area de mensajes;
- mensaje del usuario;
- mensaje del personaje;
- input;
- boton enviar;
- estado de "escribiendo...";
- estado de error.

La UI debe diferenciar:

```txt
mensaje usuario      -> alineado a la derecha
mensaje personaje    -> alineado a la izquierda
estado cargando      -> visible mientras espera respuesta
error                -> mensaje claro para el usuario
```

Checklist:

- [ ] El usuario puede escribir.
- [ ] Enter o boton envia el mensaje.
- [ ] El input se limpia al enviar.
- [ ] El mensaje del usuario aparece en pantalla.
- [ ] Hay indicador de carga.
- [ ] Hay mensaje de error.
- [ ] El chat hace scroll al ultimo mensaje.

---

## Parte 4 — Crear el historial de conversacion

Gemini no recuerda conversaciones por si solo.

Si queremos que el personaje tenga contexto, debemos mandar el historial en cada request.

Formato interno sugerido:

```js
[
  { role: "user", content: "Hola" },
  { role: "assistant", content: "Hola, soy tu personaje." },
  { role: "user", content: "Como me llamo?" }
]
```

Funciones sugeridas:

```txt
appendUserMessage()
appendAssistantMessage()
getTrimmedHistory()
resetHistory()
```

Que hace cada una:

- `appendUserMessage`: agrega mensaje del usuario.
- `appendAssistantMessage`: agrega respuesta del personaje.
- `getTrimmedHistory`: deja solo los ultimos mensajes para controlar tokens.
- `resetHistory`: limpia la conversacion.

Checklist:

- [ ] El historial se guarda en memoria.
- [ ] Cada mensaje del usuario entra al historial.
- [ ] Cada respuesta del personaje entra al historial.
- [ ] Se manda historial recortado, no historial infinito.
- [ ] El boton reset limpia el historial.

---

## Parte 5 — Crear el payload del chat

El payload es el objeto que el frontend envia al backend.

Debe incluir:

```js
{
  model: "gemini-2.5-flash",
  system: "prompt del personaje",
  messages: [...historial],
  max_tokens: 150,
  temperature: 0.7
}
```

Puntos importantes:

- `system` define como debe hablar el personaje.
- `messages[]` contiene el historial.
- `temperature` controla variacion/creatividad.
- `max_tokens` limita la respuesta.

Checklist:

- [ ] Cada personaje tiene su propio system prompt.
- [ ] `buildPayload()` recibe personaje e historial.
- [ ] `messages[]` no pierde el historial.
- [ ] No se pone `role: "system"` dentro de `messages[]`.

---

## Parte 6 — Crear la Serverless Function

La API key no puede vivir en frontend.

Por eso la llamada real a Gemini se hace en:

```txt
api/chat.js
```

Flujo:

```txt
frontend
-> fetch("/api/chat")
-> api/chat.js
-> process.env.GEMINI_API_KEY
-> Gemini
-> respuesta al frontend
```

Checklist:

- [ ] Crear `api/chat.js`.
- [ ] Aceptar solo metodo `POST`.
- [ ] Leer el body del request.
- [ ] Leer `process.env.GEMINI_API_KEY`.
- [ ] Si falta la key, devolver error claro.
- [ ] Llamar a Gemini desde backend.
- [ ] Devolver JSON al frontend.

---

## Parte 7 — Adaptar el historial a Gemini

La app guarda mensajes asi:

```js
{ role: "assistant", content: "respuesta" }
```

Gemini espera:

```js
{ role: "model", parts: [{ text: "respuesta" }] }
```

Por eso conviene crear un adaptador:

```txt
api/utils/gemini.js
```

Responsabilidad:

- recibir `messages[]`;
- convertir `assistant` en `model`;
- envolver texto en `parts`;
- mantener todo el historial.

Checklist:

- [ ] `user` sigue siendo `user`.
- [ ] `assistant` se convierte en `model`.
- [ ] `content` se convierte en `parts: [{ text }]`.
- [ ] No se manda solo el ultimo mensaje.

---

## Parte 8 — Conectar el frontend con `/api/chat`

Crear un cliente del lado frontend:

```txt
src/engine/aiClient.js
```

Responsabilidad:

- hacer `fetch("/api/chat")`;
- mandar el payload como JSON;
- leer la respuesta;
- lanzar error si `response.ok` es false.

Checklist:

- [ ] `callAI(payload)` hace POST a `/api/chat`.
- [ ] Usa header `Content-Type: application/json`.
- [ ] Hace `JSON.stringify(payload)`.
- [ ] Si el backend falla, muestra error en la UI.
- [ ] Si responde bien, pinta la respuesta en el chat.

---

## Parte 9 — Manejar estados de UI

El usuario debe entender que esta pasando.

Estados minimos:

```txt
idle      -> chat listo
loading   -> esperando respuesta
error     -> hubo un problema
success   -> se recibio respuesta
```

En este proyecto:

- se bloquea el input mientras carga;
- se muestra "escribiendo...";
- se muestra error si falla la request;
- se desbloquea al finalizar.

Checklist:

- [ ] Mientras carga no se pueden mandar mensajes duplicados.
- [ ] Se ve indicador de typing.
- [ ] Si hay error, se muestra mensaje claro.
- [ ] Al terminar, input y boton vuelven a estar habilitados.

---

## Parte 10 — Escribir tests con Vitest

No hace falta testear todo.

Para este PI, conviene testear:

- funciones puras;
- transformaciones de datos;
- payload;
- cliente `fetch` con mock.

Tests sugeridos:

```txt
tests/history.test.js
tests/payload.test.js
tests/gemini.test.js
tests/aiClient.test.js
```

Comando:

```bash
npm run test:run
```

Checklist:

- [ ] Hay al menos 4 tests unitarios.
- [ ] No se llama a Gemini real desde los tests.
- [ ] `fetch` se mockea con `vi.fn()`.
- [ ] Los tests pasan antes de deployar.

---

## Parte 11 — Probar localmente

Levantar con Vercel Dev:

```bash
npm run local
```

Probar:

```txt
/home
/chat
/chat/science
/about
```

Tambien probar:

- escribir mensaje;
- recibir respuesta;
- cambiar personaje;
- resetear conversacion;
- apagar internet o usar key invalida para ver error.

Checklist:

- [ ] La app carga.
- [ ] Las rutas funcionan.
- [ ] El chat manda mensajes.
- [ ] La API key no aparece en DevTools.
- [ ] `/api/chat` aparece en Network.

---

## Parte 12 — Preparar deploy

Antes de deployar:

```bash
npm run test:run
```

Verificar `.gitignore`:

```txt
node_modules
.env
.env.local
.env*.local
.vercel
```

En Vercel:

- crear/importar proyecto;
- agregar `GEMINI_API_KEY` en Environment Variables;
- hacer deploy;
- probar URL publica.

Checklist:

- [ ] `.env` no esta en GitHub.
- [ ] `.env.example` si esta en GitHub.
- [ ] `GEMINI_API_KEY` esta configurada en Vercel.
- [ ] La URL publica funciona.
- [ ] El chat responde desde produccion.

---

## Parte 13 — Completar README de entrega

El README final debe incluir:

- descripcion del proyecto;
- personaje o personajes elegidos;
- como correr localmente;
- como configurar `.env`;
- como correr tests;
- como desplegar;
- capturas;
- link a Vercel;
- link a GitHub;
- registro de uso de AI.

Checklist:

- [ ] README explica el proyecto.
- [ ] README tiene pasos claros.
- [ ] README tiene capturas.
- [ ] README tiene link desplegado.
- [ ] README documenta uso de AI.

---

## Orden recomendado para trabajar

```txt
1. UI base
2. Routing SPA
3. Chat visual
4. Historial
5. Payload
6. Serverless function
7. Adaptador Gemini
8. Cliente fetch
9. Estados de UI
10. Tests
11. Deploy
12. README final
```

No avances a la siguiente parte si la anterior no funciona.

Ese es el criterio principal del proyecto: construir por capas y verificar en cada paso.
