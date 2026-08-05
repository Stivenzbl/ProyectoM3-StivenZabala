import { router } from "./router.js";
import { setupLinkInterception } from "./navigation.js";
import { initTheme, toggleTheme } from "./utils/theme.js";

// Inicializar tema guardado u OS default
initTheme();

document.querySelector("#theme-toggle-btn")?.addEventListener("click", () => {
  toggleTheme();
});

window.addEventListener("popstate", router);
setupLinkInterception();
router();

