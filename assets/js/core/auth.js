import { DEFAULTS, LS_KEYS, ROLES } from "./constants.js";
import { readLS, removeLS, writeLS } from "./storage.js";

function decodeSegment(segment) {
  try {
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (_error) {
    return null;
  }
}

function normalizeRole(rawRole = "") {
  const role = String(rawRole || "").toLowerCase();
  if (role.includes("admin")) return ROLES.admin;
  if (role.includes("provider") || role.includes("supplier") || role.includes("ncc")) return ROLES.provider;
  if (role.includes("user") || role.includes("customer")) return ROLES.user;
  return ROLES.guest;
}

function devRoleEnabled() {
  return typeof window !== "undefined" && window.__VHT_ENABLE_DEV_ROLE__ === true;
}

export function parseJwt(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const payload = token.split(".")[1];
  if (!payload) return null;
  return decodeSegment(payload);
}

export function getAccessToken() {
  return localStorage.getItem(LS_KEYS.accessToken) || "";
}

export function getRefreshToken() {
  return localStorage.getItem(LS_KEYS.refreshToken) || "";
}

export function getAuthUser() {
  return readLS(LS_KEYS.authUser, null);
}

export function getCurrentUser() {
  const user = getAuthUser();
  if (user && typeof user === "object") return user;

  const payload = parseJwt(getAccessToken());
  if (!payload) return null;

  return {
    id: payload.sub || null,
    email: payload.email || "",
    role: normalizeRole(payload.role || payload.roles?.[0] || "")
  };
}

export function isTokenExpired(token) {
  const payload = parseJwt(token);
  if (!payload || typeof payload !== "object") return true;

  if (!payload.exp) return false;

  const now = Math.floor(Date.now() / 1000);
  return Number(payload.exp) <= now;
}

export function isAuthenticated() {
  const token = getAccessToken();
  if (!token) return false;

  const payload = parseJwt(token);
  if (!payload) return false;

  return !isTokenExpired(token);
}

export function isLoggedIn() {
  return isAuthenticated();
}

export function getCurrentRole() {
  if (devRoleEnabled()) {
    const devRole = localStorage.getItem(LS_KEYS.devRole);
    if (devRole) return normalizeRole(devRole);
  }

  const user = getCurrentUser();
  if (user?.role) return normalizeRole(user.role);
  if (user?.role_name) return normalizeRole(user.role_name);

  const payload = parseJwt(getAccessToken());
  if (payload?.role) return normalizeRole(payload.role);
  if (Array.isArray(payload?.roles) && payload.roles.length > 0) {
    return normalizeRole(payload.roles[0]);
  }

  return ROLES.guest;
}

export function hasRole(role) {
  const normalizedTarget = normalizeRole(role);
  if (normalizedTarget === ROLES.guest) {
    return getCurrentRole() === ROLES.guest;
  }
  return isLoggedIn() && getCurrentRole() === normalizedTarget;
}

export function hasAnyRole(roles = []) {
  if (!Array.isArray(roles) || roles.length === 0) return false;
  if (!isLoggedIn()) return false;

  const currentRole = getCurrentRole();
  return roles.some((role) => normalizeRole(role) === currentRole);
}

export function hasDevRoleOverride() {
  return devRoleEnabled() && Boolean(localStorage.getItem(LS_KEYS.devRole));
}

export function setSession({ accessToken = "", refreshToken = "", user = null }) {
  if (accessToken) localStorage.setItem(LS_KEYS.accessToken, accessToken);
  if (refreshToken) localStorage.setItem(LS_KEYS.refreshToken, refreshToken);
  if (user) writeLS(LS_KEYS.authUser, user);
}

export function clearSession() {
  removeLS(LS_KEYS.authUser);
  removeLS(LS_KEYS.devRole);
  localStorage.removeItem(LS_KEYS.accessToken);
  localStorage.removeItem(LS_KEYS.refreshToken);
}

export function setDevRole(role) {
  if (!devRoleEnabled()) {
    removeLS(LS_KEYS.devRole);
    return;
  }

  if (!role) {
    removeLS(LS_KEYS.devRole);
    return;
  }

  localStorage.setItem(LS_KEYS.devRole, String(role).toLowerCase());
}

export function getApiBase() {
  return window.__VHT_API_BASE__ || localStorage.getItem(LS_KEYS.apiBase) || DEFAULTS.apiBase;
}
