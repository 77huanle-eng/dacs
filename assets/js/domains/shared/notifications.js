import { apiPut } from "../../core/api.js";
import { getCurrentUser, isLoggedIn } from "../../core/auth.js";
import { showToast } from "../../core/ui.js";

let initialized = false;
let notifications = [];
let notificationsLoaded = false;

function profileHref() {
  const body = document.body;
  const base = body?.dataset?.base || ".";
  const prefix = base === "." ? "./" : "../";
  return `${prefix}pages/profile.html#profileNotifications`.replace(/\\/g, "/");
}

function unreadCount() {
  return notifications.filter((item) => !item.isRead).length;
}

function renderDropdownMarkup() {
  const count = unreadCount();
  const items = notifications.slice(0, 6);
  const bodyContent = !notificationsLoaded
    ? '<div class="px-3 py-4 text-center text-muted small">Đang tải thông báo...</div>'
    : items.length
      ? items.map((item) => `
            <a href="${profileHref()}" class="list-group-item list-group-item-action px-3 py-3 ${item.isRead ? "" : "bg-primary-subtle"}" data-vht-notification-item data-notification-id="${item.id}">
              <div class="d-flex justify-content-between align-items-start gap-2">
                <div>
                  <div class="fw-semibold">${item.title || "Thông báo"}</div>
                  <div class="small text-muted">${item.content || ""}</div>
                </div>
                ${item.isRead ? '<span class="badge text-bg-light border">Đã đọc</span>' : '<span class="badge text-bg-primary">Mới</span>'}
              </div>
            </a>
          `).join("")
      : '<div class="px-3 py-4 text-center text-muted small">Chưa có thông báo nào.</div>';

  return `
    <div class="dropdown vht-notification-dropdown">
      <button class="btn btn-outline-primary position-relative" type="button" data-bs-toggle="dropdown" aria-expanded="false">
        <i class="bi bi-bell"></i>
        ${count > 0 ? `<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">${count}</span>` : ""}
      </button>
      <div class="dropdown-menu dropdown-menu-end shadow-sm p-0 overflow-hidden" style="min-width: 320px;">
        <div class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <div>
            <div class="fw-semibold">Thông báo</div>
            <small class="text-muted">${notificationsLoaded ? `${count} chưa đọc` : "Đang đồng bộ dữ liệu"}</small>
          </div>
          ${notificationsLoaded && count > 0 ? `<button type="button" class="btn btn-sm btn-link text-decoration-none" data-vht-notification-read-all>Đọc hết</button>` : ""}
        </div>
        <div class="list-group list-group-flush">
          ${bodyContent}
        </div>
        <div class="border-top px-3 py-2 text-end">
          <a href="${profileHref()}" class="small fw-semibold text-decoration-none">Xem tất cả</a>
        </div>
      </div>
    </div>
  `;
}

function bindDropdownActions(root) {
  root.querySelector("[data-vht-notification-read-all]")?.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await apiPut("/notifications/read-all", {});
      notifications = notifications.map((item) => ({ ...item, isRead: true }));
      window.dispatchEvent(new CustomEvent("vht:notifications-updated", { detail: { notifications } }));
      showToast("Đã đánh dấu tất cả thông báo là đã đọc.", "success");
    } catch (error) {
      showToast(error?.message || "Không thể cập nhật thông báo.", "danger");
    }
  });

  root.querySelectorAll("[data-vht-notification-item]").forEach((link) => {
    link.addEventListener("click", async () => {
      const notificationId = Number(link.getAttribute("data-notification-id") || 0);
      if (!notificationId) return;

      const current = notifications.find((item) => Number(item.id) === notificationId);
      if (!current || current.isRead) return;

      try {
        await apiPut(`/notifications/${notificationId}/read`, {});
        notifications = notifications.map((item) =>
          Number(item.id) === notificationId ? { ...item, isRead: true } : item
        );
        window.dispatchEvent(new CustomEvent("vht:notifications-updated", { detail: { notifications } }));
      } catch (_error) {
        // Không chặn điều hướng sang trang profile khi đánh dấu đọc thất bại.
      }
    });
  });
}

function mountNotificationDropdowns() {
  if (!isLoggedIn()) return;

  const dashboardBellButtons = Array.from(document.querySelectorAll(".dash-topbar .btn"))
    .filter((button) => button.querySelector(".bi-bell"));

  dashboardBellButtons.forEach((button) => {
    if (button.closest(".vht-notification-dropdown")) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderDropdownMarkup();
    const dropdown = wrapper.firstElementChild;
    if (!dropdown) return;
    button.replaceWith(dropdown);
    bindDropdownActions(dropdown);
  });

  const publicAuthWrap = document.querySelector(".public-header .navbar-collapse .d-flex.flex-wrap.gap-2");
  if (publicAuthWrap && !publicAuthWrap.querySelector(".vht-notification-dropdown") && getCurrentUser()) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderDropdownMarkup();
    const dropdown = wrapper.firstElementChild;
    if (dropdown) {
      publicAuthWrap.insertBefore(dropdown, publicAuthWrap.firstChild);
      bindDropdownActions(dropdown);
    }
  }
}

export function initNotificationsModule() {
  if (initialized) return;
  initialized = true;

  window.addEventListener("vht:notifications-updated", (event) => {
    notifications = Array.isArray(event.detail?.notifications) ? event.detail.notifications : [];
    notificationsLoaded = true;
    mountNotificationDropdowns();
  });

  window.addEventListener("vht:page-mounted", () => {
    mountNotificationDropdowns();
  });
}
