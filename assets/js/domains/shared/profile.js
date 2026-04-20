let initialized = false;

function mountProfileAnchors() {
  const page = document.body?.dataset?.page || "";
  if (!["profile", "profile-edit"].includes(page)) return;

  const hash = window.location.hash;
  if (!hash) return;

  const target = document.querySelector(hash);
  if (!target) return;

  setTimeout(() => {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 80);
}

export function initProfileModule() {
  if (initialized) return;
  initialized = true;

  window.addEventListener("vht:page-mounted", () => {
    mountProfileAnchors();
  });
}
