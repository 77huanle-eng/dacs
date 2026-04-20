function resolveElement(target) {
  if (!target) return null;
  if (typeof target === "string") return document.querySelector(target);
  return target;
}

export function ensureStatusSlot(target, options = {}) {
  const element = resolveElement(target);
  if (!element) return null;

  const selector = options.selector || "[data-vht-status-slot]";
  const existing = element.querySelector(selector);
  if (existing) return existing;

  const slot = document.createElement("div");
  slot.setAttribute("data-vht-status-slot", "1");
  slot.className = options.className || "mt-3";

  if (options.position === "before") {
    element.prepend(slot);
  } else {
    element.append(slot);
  }

  return slot;
}

export function clearStatusSlot(target) {
  const slot = resolveElement(target);
  if (!slot) return;
  slot.innerHTML = "";
  slot.classList.add("d-none");
}

export function renderStatusMessage(target, { type = "info", title = "", message = "" } = {}) {
  const slot = resolveElement(target);
  if (!slot) return;

  const body = [title ? `<div class="fw-semibold mb-1">${title}</div>` : "", message ? `<div class="small">${message}</div>` : ""]
    .filter(Boolean)
    .join("");

  if (!body) {
    clearStatusSlot(slot);
    return;
  }

  slot.classList.remove("d-none");
  slot.innerHTML = `<div class="alert alert-${type} mb-0" role="alert">${body}</div>`;
}

export function setButtonPending(button, pending, pendingLabel = "Đang xử lý...") {
  const element = resolveElement(button);
  if (!element) return;

  if (!element.dataset.vhtDefaultLabel) {
    element.dataset.vhtDefaultLabel = element.innerHTML;
  }

  element.disabled = Boolean(pending);
  element.setAttribute("aria-busy", pending ? "true" : "false");
  element.innerHTML = pending ? pendingLabel : element.dataset.vhtDefaultLabel;
}

export async function withPendingButton(button, pendingLabel, task) {
  const element = resolveElement(button);
  setButtonPending(element, true, pendingLabel);
  try {
    return await task();
  } finally {
    setButtonPending(element, false);
  }
}

