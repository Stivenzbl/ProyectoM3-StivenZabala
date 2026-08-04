# 🤖 PIM3 - Chat AI Serverless con Gemini

Una aplicación full-stack que integra capacidades de procesamiento de lenguaje natural utilizando la API de Google Gemini. El sistema permite a los usuarios interactuar con diferentes personajes de IA en una interfaz conversacional fluida, gestionando el historial del chat y transformando la comunicación para cumplir con los requisitos del esquema de modelos.

## ✨ Características Principales

- **🤖 Interfaz Conversacional Avanzada**: Interfaz dinámica diseñada para interacción constante con múltiples personajes de IA
- **🧠 Gestión Inteligente de Estado**: Manejo interno de las rondas del diálogo (Context Window) con límite de 10 mensajes
- **⚡ Backend Serverless**: Implementación optimizada mediante funciones serverless de Vercel para comunicación segura con la API de Google
- **🔄 Adaptador Inteligente**: Adaptador nativo que ajusta los roles del usuario/asistente a los requisitos específicos de Gemini (`user` → `user`, `assistant` → `model`)
- **🎭 Múltiples Personajes de IA**: Dr. Science, Chef Claude y Detective, cada uno con personalidad única
- **🎨 Interfaz Temática**: Diseño visual adaptativo basado en el personaje seleccionado
- **🥇 Funcionalidades Avanzadas**: Sistema de huevos de Pascua, retry automático para rate limits, UI optimizada para accesibilidad
- **🧪 Suite de Pruebas**: Cobertura de pruebas unitarias con Vitest para validación de lógica crítica

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript Moderno (ES Modules)
- **Backend**: Node.js / Serverless Functions (Vercel)
- **IA Integrada**: Google Gemini (via API)
- **Infraestructura**: Vercel (plataforma de despliegue)
- **Testing**: Vitest (framework de testing)
- **Estilos**: CSS3 moderno con variables CSS y temas personalizados

## 📦 Instalación y Ejecución Local

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd trabajo-final
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   Crear un archivo `.env` en la raíz del proyecto:
   ```env
   GEMINI_API_KEY=tu_clave_de_api_de_google_aqui
   ```

4. **Ejecutar el servidor local**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:3000`

## 🧪 Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests una sola vez (modo CI)
npm run test:run
```

## 🚀 Despliegue a Vercel

1. Instalar Vercel CLI (si no lo tienes):
   ```bash
   npm i -g vercel
   ```

2. Iniciar sesión en Vercel:
   ```bash
   vercel login
   ```

3. Desplegar el proyecto:
   ```bash
   vercel
   ```

4. Configurar las variables de entorno en el dashboard de Vercel:
   - `GEMINI_API_KEY`: Tu clave de API de Google Gemini

## 📁 Estructura del Proyecto

```
trabajo-final/
├── .github/                 # Configuración de GitHub (workflows, etc.)
├── .vercel/                 # Configuración de Vercel
├── api/                     # Funciones serverless (backend)
│   ├── chat.js              # Función principal de chat
│   └── utils/               # Utilidades del backend
│       ├── errors.js        # Manejo de errores
│       ├── gemini.js        # Adaptador de Gemini
│       ├── request.js       # Utilidades de request
│       └── response.js      # Utilidades de response
├── contexto/                # Documentación y consignas del proyecto
├── docs/                    # Documentación adicional del proyecto
├── src/                     # Código fuente del frontend
│   ├── engine/              # Lógica core del motor de IA
│   │   ├── aiClient.js      # Cliente de comunicación con API
│   │   ├── history.js       # Gestión del historial de chat
│   │   ├── normalizer.js    # Normalización de respuestas de IA
│   │   └── payload.js       # Construcción y validación de payloads
│   ├── components/          # Componentes reutilizables de UI
│   ├── hooks/               # Custom hooks (si se usa un framework)
│   ├── lib/                 # Bibliotecas y utilities compartidas
│   ├── styles/              # Estilos CSS
│   ├── utils/               # Utilidades del frontend
│   ├── views/               # Vistas de la aplicación
│   │   ├── about.js         # Vista "Acerca de"
│   │   ├── chat.js          # Vista principal de chat
│   │   ├── home.js          # Vista de inicio
│   │   └── notFound.js      # Vista 404
│   ├── main.js              # Punto de entrada de la aplicación
│   ├── navigation.js        # Manejo de navegación SPA
│   └── router.js            # Sistema de routing
├── tests/                   # Suite de pruebas
│   ├── unit/                # Tests unitarios
│   └── integration/         # Tests de integración
├── .env                     # Variables de entorno (no subir a gitignore)
├── .env.local               # Variables de entorno locales
├── .gitignore               # Archivos a ignorar en git
├── index.html               # Punto de entrada HTML
├── package.json             # Dependencias y scripts
├── vercel.json              # Configuración de Vercel
└── vitest.config.js         # Configuración de Vitest
```

## 🎯 Personajes de IA Disponibles

### 🧪 Dr. Science
Un científico apasionado y didáctico que explica conceptos científicos de forma clara y entusiasta usando analogías simples.

### 👨‍🍳 Chef Claude
Un chef creativo y entusiasta que habla de comida, recetas y técnicas culinarias con pasión, usando metáforas culinarias.

### 🕵️ Detective
Un detective perspicaz y metódico que analiza situaciones con lógica y deducción, respondiendo de forma directa y basada en evidencia.

## 🥚 Huevos de Pascua

Descubre mensajes especiales escribiendo ciertas palabras clave:
- `ping` / `pong` - Respuesta lúdica de ping-pong
- `42` - La respuesta al sentido de la vida, el universo y todo lo demás
- `gracias` - Mensaje de apreciación científica

## 📊 Estado del Proyecto

- ✅ Funcionalidad completa del chat con múltiples personajes
- ✅ Backend serverless funcionando en Vercel
- ✅ Gestión de estado y historial de conversación
- ✅ Manejo de errores y rate limiting con retry automático
- ✅ Interfaz responsive y accesible
- ✅ Suite de pruebas unitarias
- ✅ Documentación completa
- ✅ Despliegue en producción

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Créditos

Desarrollado como parte del Proyecto Integrador Módulo 3 - Facultad de Ciencias Exactas y Tecnología.

---

> **Nota**: Este proyecto utiliza la API de Google Gemini. Para obtener tu propia API key, visita [Google AI Studio](https://makersuite.google.com/).