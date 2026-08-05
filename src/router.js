import { renderHome } from "./views/home.js";
import { renderChat } from "./views/chat.js";
import { renderAbout } from "./views/about.js";
import { renderNotFound } from "./views/notFound.js";
import { isValidCharacterKey } from "./engine/payload.js";

/*
 * cleanPath(pathname)
 * Normaliza la URL removiendo barras inclinadas sobrantes (trailing slashes),
 * query strings y fragmentos hash. Si la ruta es válida (ej. /chat/science/),
 * la limpia a /chat/science. Si la ruta no existe (ej. /algo), retorna la ruta limpia
 * para que el enrutador muestre la vista 404 Not Found.
 */
export function cleanPath(pathname) {
  if (!pathname || typeof pathname !== "string") return "/";
  let cleaned = pathname.trim().split("?")[0].split("#")[0];
  while (cleaned.length > 1 && cleaned.endsWith("/")) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned || "/";
}

export function router() {
  const rawPath = window.location.pathname;
  const path = cleanPath(rawPath);

  // 1. Ruta Inicio (/ o /home)
  if (/^\/(?:home)?$/i.test(path)) {
    renderHome();
    updateActiveLink(path);
    return;
  }

  // 2. Ruta Chat sin personaje especifico -> abre chat con Dr. Science por defecto
  if (/^\/chat$/i.test(path)) {
    renderChat("science");
    updateActiveLink(path);
    return;
  }

  // 3. Ruta Chat con personaje específico (/chat/:characterKey)
  const chatMatch = path.match(/^\/chat\/([a-zA-Z0-9_-]+)$/i);
  if (chatMatch) {
    const characterKey = chatMatch[1];
    // Verificar si el personaje realmente existe en el sistema
    if (isValidCharacterKey(characterKey)) {
      renderChat(characterKey);
      updateActiveLink(path);
      return;
    }
    // Si el personaje no existe (ej. /chat/personaje-falso), mostrar vista 404
    renderNotFound();
    updateActiveLink(path);
    return;
  }

  // 4. Ruta Acerca de (/about)
  if (/^\/about$/i.test(path)) {
    renderAbout();
    updateActiveLink(path);
    return;
  }

  // 5. Cualquier otra ruta inexistente (ej. /algo, /xyz, /contacto, /test) -> Vista 404 Not Found
  renderNotFound();
  updateActiveLink(path);
}

export function navigateTo(targetPath) {
  const normalized = cleanPath(targetPath);
  if (window.location.pathname === normalized) return;
  history.pushState(null, "", normalized);
  router();
}

function updateActiveLink(currentPath) {
  const current = currentPath || cleanPath(window.location.pathname);
  document.querySelectorAll(".navbar__links a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("http")) return;
    const cleanHref = cleanPath(href);
    link.classList.toggle("active", cleanHref === current);
  });
}
