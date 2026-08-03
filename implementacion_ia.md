# Implementación de Inteligencia Artificial

Este documento detalla la arquitectura técnica y el flujo de datos para la implementación del motor de IA en el proyecto.

## Arquitectura de Conexión
El sistema utiliza una estructura de tres capas diseñada para separar la lógica de presentación, la gestión del estado de la conversación y la comunicación con proveedores externos.

### 1. Capa de UI/Cliente (Frontend)
- **Archivo:** `src/view/chat.js` y `src/engine/aiClient.js`.
- El cliente no se comunica directamente con la API externa para proteger las credenciales. En su lugar, envía el payload del usuario a un endpoint interno `/api/chat`.

### 2. Capa de Pasarela (Backend/Middleware)
- **Archivo:** `api/chat.js` y `api/utils/`.
- Funciona como una función "Serverless". Recibe la petición del frontend, añade las cabeceras necesarias y actúa como el único punto donde se utiliza la clave de API real (`GEMINI_API_KEY`).

### 3. Capa de Adaptación (Gemini Adapter)
- **Archivo:** `api/utils/gemini.js`.
- Implementa una función crítica: `toGeminiContents(messages)`.
- **Mapeo de Roles:** Convierte el esquema interno a los requerimientos de Google:
  - `assistant` $\rightarrow$ `model`
  - `user` $\rightarrow$ `user`
- **Preservación de Contexto:** Transforma todo el array de mensajes históricos en un formato de "partes" requerido por Gemini, asegurando que el modelo mantenga la coherencia del chat.

## Flujo de Datos (Data Flow)
1. El usuario envía un mensaje en la interfaz.
2. `aiClient.js` captura el evento del formulario y construye el objeto JSON.
3. La petición viaja a `/api/chat`.
4. En el servidor, se procesa con `gemini.js` para reformatear los datos antes de enviarlos a Google.
5. El resultado vuelve al cliente como un objeto refinado, que es renderizado mediante el motor de UI.

## Tecnologías Clave
- **Modelo:** Google Gemini.
- **Protobuf/JSON Parsing:** Manejado por las clases en `api/utils`.
- **Request Management:** Implementado en `request.js` para manejo de errores y tiempos de espera de red.
