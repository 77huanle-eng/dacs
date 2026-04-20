import { readSession, removeSession } from "./storage.js";

const NOTICE_KEY = "vh_auth_notice";

export function pushNotice(message, type = "warning") {
  sessionStorage.setItem(NOTICE_KEY, JSON.stringify({ message, type }));
}

export function consumeNotice() {
  const payload = readSession(NOTICE_KEY, null);
  removeSession(NOTICE_KEY);
  return payload;
}

export function showToast(message, type = "success") {
  const wrap = document.getElementById("global-toast");
  if (!wrap || typeof bootstrap === "undefined") return;

  const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const bg =
    type === "danger"
      ? "text-bg-danger"
      : type === "warning"
      ? "text-bg-warning"
      : type === "info"
      ? "text-bg-info"
      : "text-bg-success";

  wrap.insertAdjacentHTML(
    "beforeend",
    `<div id="${id}" class="toast align-items-center ${bg} border-0" role="alert"><div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>`
  );

  const el = document.getElementById(id);
  const toast = new bootstrap.Toast(el, { delay: 2800 });
  toast.show();
  el.addEventListener("hidden.bs.toast", () => el.remove());
}
