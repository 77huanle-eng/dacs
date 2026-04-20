import { getCurrentProfile, loginWithApi } from "../../core/api.js";
import { getAccessToken, setSession } from "../../core/auth.js";
import { LS_KEYS } from "../../core/constants.js";
import { readLS, writeLS } from "../../core/storage.js";
import { applyTheme, getCurrentTheme, mountThemeToggle } from "../../core/theme.js";
import { consumeNotice, showToast } from "../../core/ui.js";

function getRedirectByRole(role) {
  if (role === "admin") return "admin-dashboard.html";
  if (role === "provider") return "provider-dashboard.html";
  return "../index.html";
}

function normalizeRole(rawRole = "") {
  const role = String(rawRole || "").toLowerCase();
  if (role.includes("admin")) return "admin";
  if (role.includes("provider") || role.includes("supplier")) return "provider";
  return "user";
}

export function initGlobalEnhancers({ page }) {
  applyTheme(getCurrentTheme());

  const notice = consumeNotice();
  if (notice?.message) {
    showToast(notice.message, notice.type || "warning");
  }

  setTimeout(() => {
    mountThemeToggle();
    bindAuthWithApi(page);
    syncProfileFromApi();
  }, 0);
}

async function syncProfileFromApi() {
  if (!getAccessToken()) return;

  try {
    const payload = await getCurrentProfile();
    const profile = payload?.user || payload?.data || payload;
    if (!profile || typeof profile !== "object") return;

    const mapped = {
      name: profile.full_name || profile.fullName || profile.name || "",
      email: profile.email || "",
      phone: profile.phone || profile.phoneNumber || "",
      avatar: profile.avatar || "",
      city: profile.city || profile.profile?.city || "",
      address: profile.address || profile.profile?.address || "",
      birthday: profile.birthday || profile.dateOfBirth || profile.profile?.date_of_birth || "",
      bio: profile.bio || profile.description || profile.profile?.bio || ""
    };

    const current = readLS(LS_KEYS.profile, {});
    const next = { ...current };
    Object.entries(mapped).forEach(([key, value]) => {
      if (value) next[key] = value;
    });
    writeLS(LS_KEYS.profile, next);

    if (profile.role || profile.id) {
      setSession({ user: profile });
    }
  } catch (_error) {
    // Không chặn UI khi endpoint profile tạm lỗi.
  }
}

function bindAuthWithApi(page) {
  if (page !== "login") return;

  const form = document.getElementById("loginForm");
  if (!form) return;

  const cloned = form.cloneNode(true);
  form.parentNode.replaceChild(cloned, form);

  cloned.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!cloned.checkValidity()) {
      cloned.classList.add("was-validated");
      return;
    }

    const emailInput = cloned.querySelector('input[type="email"]');
    const passInput = cloned.querySelector("[data-password-input]");
    const email = emailInput?.value?.trim() || "";
    const password = passInput?.value || "";

    let resolvedRole = "user";
    try {
      const apiData = await loginWithApi({ email, password });
      const roleFromApi = normalizeRole(apiData?.user?.role || apiData?.role);
      resolvedRole = roleFromApi || "user";
      showToast("Đăng nhập thành công.");
    } catch (error) {
      showToast(error?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.", "danger");
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");
    if (next) {
      window.location.href = decodeURIComponent(next);
      return;
    }

    if (window.location.pathname.includes("/pages/")) {
      if (resolvedRole === "user") {
        window.location.href = "../index.html";
      } else {
        window.location.href = getRedirectByRole(resolvedRole);
      }
      return;
    }

    window.location.href =
      resolvedRole === "user" ? "./index.html" : `./pages/${getRedirectByRole(resolvedRole)}`;
  });
}
