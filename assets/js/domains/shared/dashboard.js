let initialized = false;
let lastApiStatus = { connected: true, usingFallback: false, page: "" };

function mountDataSourceBanner() {
  const page = document.body?.dataset?.page || "";
  const shell = document.querySelector(".dash-main") || document.getElementById("app");
  if (!shell) return;

  shell.querySelector("[data-vht-data-source-banner]")?.remove();

  if (lastApiStatus.connected && !lastApiStatus.usingFallback) return;

  const alert = document.createElement("div");
  alert.setAttribute("data-vht-data-source-banner", "1");
  alert.className = `alert ${lastApiStatus.usingFallback ? "alert-warning" : "alert-danger"} d-flex align-items-center gap-2 mb-3`;
  alert.innerHTML = `
    <i class="bi ${lastApiStatus.usingFallback ? "bi-exclamation-triangle" : "bi-cloud-slash"}"></i>
    <div>
      <strong>${lastApiStatus.usingFallback ? "Đang dùng fallback local (DEV)." : "Không kết nối được API backend."}</strong>
      <div class="small">${lastApiStatus.usingFallback ? "Dữ liệu hiện tại không phải dữ liệu thật từ hệ thống." : "Trang đang hiển thị trạng thái lỗi thay vì đổ dữ liệu giả để tránh nhầm lẫn."}</div>
    </div>
  `;

  const anchor = shell.querySelector(".dash-topbar") || shell.firstElementChild;
  if (anchor) {
    anchor.insertAdjacentElement("afterend", alert);
  } else {
    shell.prepend(alert);
  }
}

export function initDashboardModule() {
  if (initialized) return;
  initialized = true;

  window.addEventListener("vht:api-status", (event) => {
    lastApiStatus = {
      connected: Boolean(event.detail?.connected),
      usingFallback: Boolean(event.detail?.usingFallback),
      page: event.detail?.page || ""
    };
    mountDataSourceBanner();
  });

  window.addEventListener("vht:page-mounted", () => {
    mountDataSourceBanner();
  });
}
