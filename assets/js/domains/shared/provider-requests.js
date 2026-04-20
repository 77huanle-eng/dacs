import { getCurrentRole } from "../../core/auth.js";

let initialized = false;
let latestRequest = null;

function profileHref() {
  const body = document.body;
  const base = body?.dataset?.base || ".";
  const prefix = base === "." ? "./" : "../";
  return `${prefix}pages/profile.html#profileProviderRequest`.replace(/\\/g, "/");
}

function labelStatus(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "approved") return "Đã duyệt";
  if (normalized === "rejected") return "Từ chối";
  if (normalized === "pending") return "Đang duyệt";
  return "Chưa gửi";
}

function statusClass(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "approved") return "text-success";
  if (normalized === "rejected") return "text-danger";
  if (normalized === "pending") return "text-primary";
  return "text-muted";
}

function mountProviderRequestIndicator() {
  if (getCurrentRole() !== "user") return;
  const dropdownMenu = Array.from(document.querySelectorAll(".dropdown-menu")).find((menu) =>
    menu.querySelector('[data-action="logout"]')
  );
  if (!dropdownMenu) return;

  dropdownMenu.querySelector("[data-vht-provider-request-item]")?.remove();

  const item = document.createElement("li");
  item.setAttribute("data-vht-provider-request-item", "1");
  item.innerHTML = `
    <a class="dropdown-item d-flex justify-content-between align-items-center" href="${profileHref()}">
      <span><i class="bi bi-shop-window me-2"></i>Hồ sơ đối tác</span>
      <span class="small fw-semibold ${statusClass(latestRequest?.status)}">${labelStatus(latestRequest?.status)}</span>
    </a>
  `;

  const divider = dropdownMenu.querySelector(".dropdown-divider");
  if (divider?.parentElement) {
    divider.parentElement.insertBefore(item, divider);
  } else {
    dropdownMenu.appendChild(item);
  }
}

export function initProviderRequestsModule() {
  if (initialized) return;
  initialized = true;

  window.addEventListener("vht:provider-request-updated", (event) => {
    latestRequest = event.detail?.latestRequest || null;
    mountProviderRequestIndicator();
  });

  window.addEventListener("vht:page-mounted", () => {
    mountProviderRequestIndicator();
  });
}
