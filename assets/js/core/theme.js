import { DEFAULTS, LS_KEYS } from "./constants.js";

export function getCurrentTheme() {
  return localStorage.getItem(LS_KEYS.theme) || DEFAULTS.theme;
}

export function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
}

export function setTheme(theme) {
  localStorage.setItem(LS_KEYS.theme, theme);
  applyTheme(theme);
}

export function mountThemeToggle() {
  const existing = document.getElementById("themeToggleBtn");
  if (existing) return;

  const targetContainer =
    document.querySelector(".public-header .d-flex.flex-wrap.gap-2.mt-3.mt-lg-0") ||
    document.querySelector(".dash-topbar .d-flex.align-items-center.gap-2");

  if (!targetContainer) return;

  const theme = getCurrentTheme();
  const button = document.createElement("button");
  button.type = "button";
  button.id = "themeToggleBtn";
  button.className = "btn btn-outline-primary";
  button.innerHTML =
    theme === "dark"
      ? '<i class="bi bi-moon-stars me-1"></i>Dark'
      : '<i class="bi bi-sun me-1"></i>Light';

  button.addEventListener("click", () => {
    const next = getCurrentTheme() === "dark" ? "light" : "dark";
    setTheme(next);
    button.innerHTML =
      next === "dark"
        ? '<i class="bi bi-moon-stars me-1"></i>Dark'
        : '<i class="bi bi-sun me-1"></i>Light';
  });

  targetContainer.prepend(button);
}
