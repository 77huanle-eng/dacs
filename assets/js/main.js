import { guardRoute, resolveDomain } from "./core/route-guard.js";
import { pushNotice } from "./core/ui.js";
import { initPublicDomain } from "./domains/public/index.js";
import { initProviderDomain } from "./domains/provider/index.js";
import { initAdminDomain } from "./domains/admin/index.js";
import { initGlobalEnhancers } from "./domains/shared/enhancers.js";
import { clearSession, getAccessToken, getRefreshToken, isTokenExpired, setDevRole } from "./core/auth.js";
import { refreshToken } from "./core/api.js";

function pathByBase(base, target) {
  const cleaned = target.replace(/^\.?\//, "");
  const prefix = base === "." ? "./" : "../";
  return `${prefix}${cleaned}`.replace(/\\/g, "/");
}

async function restoreSessionIfNeeded() {
  const accessToken = getAccessToken();
  if (!accessToken || !isTokenExpired(accessToken)) return;

  if (!getRefreshToken()) {
    clearSession();
    return;
  }

  try {
    await refreshToken(true);
  } catch (_error) {
    clearSession();
  }
}

function mountDomain(page, domain) {
  if (domain === "admin") return initAdminDomain(page);
  if (domain === "provider") return initProviderDomain(page);
  return initPublicDomain(page);
}

function buildGuardOptions(body) {
  const page = body.dataset.page || "home";
  const base = body.dataset.base || ".";
  const loginUrl = pathByBase(base, "pages/login.html");
  const homeUrl = pathByBase(base, "index.html");
  const profileUrl = pathByBase(base, "pages/profile.html");
  const providerDashboardUrl = pathByBase(base, "pages/provider-dashboard.html");
  const adminDashboardUrl = pathByBase(base, "pages/admin-dashboard.html");

  return {
    page,
    base,
    loginUrl,
    homeUrl,
    profileUrl,
    providerDashboardUrl,
    adminDashboardUrl
  };
}

function enforceRouteAccess(guardOptions) {
  const guard = guardRoute({
    page: guardOptions.page,
    loginUrl: guardOptions.loginUrl,
    homeUrl: guardOptions.homeUrl,
    profileUrl: guardOptions.profileUrl,
    providerDashboardUrl: guardOptions.providerDashboardUrl,
    adminDashboardUrl: guardOptions.adminDashboardUrl
  });

  if (guard.allowed) return true;

  pushNotice(guard.reason || "Bạn không có quyền truy cập.", "warning");
  window.location.href = guard.redirectTo || guardOptions.homeUrl;
  return false;
}

async function bootstrap() {
  const body = document.body;
  if (!body) return;
  const guardOptions = buildGuardOptions(body);
  const devRole = new URLSearchParams(window.location.search).get("devRole");
  if (devRole) {
    setDevRole(devRole);
  }

  await restoreSessionIfNeeded();

  if (!enforceRouteAccess(guardOptions)) {
    return;
  }

  const domain = resolveDomain(guardOptions.page);
  const mounted = mountDomain(guardOptions.page, domain);

  if (!mounted && domain !== "public") {
    mountDomain(guardOptions.page, "public");
  }

  initGlobalEnhancers({ page: guardOptions.page, domain });

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    enforceRouteAccess(guardOptions);
  });
}

bootstrap();
