let initialized = false;
let pendingRequests = 0;

function ensureLoadingBar() {
  let bar = document.getElementById("vhtGlobalLoadingBar");
  if (bar) return bar;

  bar = document.createElement("div");
  bar.id = "vhtGlobalLoadingBar";
  bar.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "width:100%",
    "height:3px",
    "background:linear-gradient(90deg,#0d6efd,#20c997)",
    "transform-origin:left center",
    "transform:scaleX(0)",
    "transition:transform .2s ease",
    "z-index:2000"
  ].join(";");

  document.body.appendChild(bar);
  return bar;
}

function renderLoadingBar() {
  const bar = ensureLoadingBar();
  bar.style.transform = pendingRequests > 0 ? "scaleX(1)" : "scaleX(0)";
  document.body.toggleAttribute("data-vht-request-pending", pendingRequests > 0);
}

export function initAdminActionsModule() {
  if (initialized) return;
  initialized = true;

  window.addEventListener("vht:request-start", () => {
    pendingRequests += 1;
    renderLoadingBar();
  });

  window.addEventListener("vht:request-end", () => {
    pendingRequests = Math.max(0, pendingRequests - 1);
    renderLoadingBar();
  });
}
