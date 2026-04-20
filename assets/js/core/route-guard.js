import { AUTH_REQUIRED_PUBLIC_PAGES, DOMAIN_PAGES, ROLES } from "./constants.js";
import { getCurrentRole, isLoggedIn } from "./auth.js";

export function resolveDomain(page) {
  if (DOMAIN_PAGES.admin.has(page) || page.startsWith("admin-")) return "admin";
  if (DOMAIN_PAGES.provider.has(page) || page.startsWith("provider-")) return "provider";
  return "public";
}

export function canAccessUserPages({ authenticated = isLoggedIn() } = {}) {
  return Boolean(authenticated);
}

export function canAccessProviderPages({ role = getCurrentRole() } = {}) {
  return role === ROLES.provider || role === ROLES.admin;
}

export function canAccessAdminPages({ role = getCurrentRole() } = {}) {
  return role === ROLES.admin;
}

function buildLoginRedirect(loginUrl) {
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  return `${loginUrl}?next=${next}`;
}

function buildForbiddenRedirect({ domain, role, homeUrl, profileUrl, providerDashboardUrl, adminDashboardUrl }) {
  if (domain === "admin") {
    if (role === ROLES.provider) return providerDashboardUrl || homeUrl;
    if (role === ROLES.user) return profileUrl || homeUrl;
    return adminDashboardUrl || homeUrl;
  }

  if (domain === "provider") {
    if (role === ROLES.user) return profileUrl || homeUrl;
    if (role === ROLES.admin) return adminDashboardUrl || homeUrl;
    return providerDashboardUrl || homeUrl;
  }

  return homeUrl;
}

export function guardRoute({
  page,
  loginUrl,
  homeUrl,
  profileUrl = homeUrl,
  providerDashboardUrl = homeUrl,
  adminDashboardUrl = homeUrl
}) {
  const domain = resolveDomain(page);
  const authenticated = isLoggedIn();
  const role = getCurrentRole();

  if (domain === "public") {
    if (!AUTH_REQUIRED_PUBLIC_PAGES.has(page)) {
      return { allowed: true, domain };
    }

    if (canAccessUserPages({ authenticated })) {
      return { allowed: true, domain };
    }

    return {
      allowed: false,
      domain,
      redirectTo: buildLoginRedirect(loginUrl),
      reason: "Vui lòng đăng nhập để tiếp tục."
    };
  }

  if (!canAccessUserPages({ authenticated })) {
    return {
      allowed: false,
      domain,
      redirectTo: buildLoginRedirect(loginUrl),
      reason: "Vui lòng đăng nhập để truy cập trang này."
    };
  }

  if (domain === "admin" && !canAccessAdminPages({ role })) {
    return {
      allowed: false,
      domain,
      redirectTo: buildForbiddenRedirect({
        domain,
        role,
        homeUrl,
        profileUrl,
        providerDashboardUrl,
        adminDashboardUrl
      }),
      reason: "Bạn không có quyền truy cập khu vực quản trị."
    };
  }

  if (domain === "provider" && !canAccessProviderPages({ role })) {
    return {
      allowed: false,
      domain,
      redirectTo: buildForbiddenRedirect({
        domain,
        role,
        homeUrl,
        profileUrl,
        providerDashboardUrl,
        adminDashboardUrl
      }),
      reason: "Bạn không có quyền truy cập khu vực nhà cung cấp."
    };
  }

  return { allowed: true, domain };
}
