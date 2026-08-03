# Proyecto Integrador - Módulo de Inteligencia Artificial

## Descripción
Este proyecto es una aplicación full-stack que integra capacidades de procesamiento de lenguaje natural utilizando la API de Google Gemini. El sistema permite a los usuarios interactuar con un modelo de IA en una interfaz conversacional fluida, gestionando el historial del chat y transformando la comunicación para cumplir con los requerimientos del esquema de modelos.

## Características Principales
- **Interfaz Conversacional:** Interfaz dinámica diseñada para interacción constante con IA.
- **Gestión de Estado:** Manejo interno de las rondas del diálogo (Context Window).
- **Backend Serverless:** Implementación optimizada mediante funciones serverless para la comunicación segura entre el cliente y la API de Google.
- **Transformación Automática:** Adaptador nativo que ajusta los roles del usuario/asistente a los requisitos específicos de Gemini (`user` $\rightarrow$ `user`, `assistant` $\rightarrow$ `model`).

## Tecnologías Utilizadas
- **Frontend:** HTML5, CSS3, JavaScript Moderno.
- **Backend:** Node.js / Serverless Functions.
- **IA Integrada:** Google Gemini (vía API).
- **Infraestructura de Despliegue:** Configurado para Vercel/Netlify (Vercel CLI compatible).

## Instalación y Ejecución Local
1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno en un archivo `.env`:
   - `GEMINI_API_KEY`: Tu clave de API obtenida desde Google AI Studio.
4. Ejecutar el servidor local:
   ```bash
   npm run dev
   ```

## Estructura del Proyecto
- `/src`: Lógica del frontend (motor, UI, rutas y vistas).
- `/api`: Funciones backend que actúan como puente hacia servicios externos de IA.
- `/tests`: Suite de pruebas unitarias para validación de lógica crítica.
