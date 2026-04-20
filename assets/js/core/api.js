import {
  clearSession,
  getAccessToken,
  getApiBase,
  getRefreshToken,
  setSession
} from "./auth.js";

function dispatchApiEvent(name, detail = {}) {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return;
  window.dispatchEvent(new CustomEvent(`vht:${name}`, { detail }));
}

function withTimeout(promise, timeoutMs = 15000) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Yeu cau API qua thoi gian cho phep.")), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

function unwrapApiData(payload) {
  if (!payload || typeof payload !== "object") return payload;
  if (Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload.data;
  }
  return payload;
}

function getApiErrorMessage(payload, statusCode) {
  if (payload && typeof payload === "object") {
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }

    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  }

  return `API loi (${statusCode})`;
}

function readAuthPayload(payload) {
  const body = unwrapApiData(payload) || {};

  return {
    accessToken: body.accessToken || body.token || payload?.accessToken || payload?.token || "",
    refreshToken: body.refreshToken || payload?.refreshToken || "",
    user: body.user || payload?.user || null,
    role: body.role || payload?.role || ""
  };
}

function normalizeBase(base) {
  return String(base || "").trim().replace(/\/+$/, "");
}

function buildBaseCandidates(initialBase) {
  const candidates = [];
  const push = (value) => {
    const normalized = normalizeBase(value);
    if (normalized) candidates.push(normalized);
  };

  push(initialBase);

  if (typeof window !== "undefined" && window.location) {
    const { origin, pathname } = window.location;
    const segments = pathname.split("/").filter(Boolean);
    const projectRoot = segments.length > 0 ? `${origin}/${segments[0]}` : origin;

    push(`${origin}/backend/public/api`);
    push(`${projectRoot}/backend/public/api`);
    push(`${origin}/api`);
  }

  push("http://localhost:8080/api");

  return [...new Set(candidates)];
}

function persistApiBase(base) {
  try {
    localStorage.setItem("vh_api_base", base);
  } catch (_error) {
    // Không chặn luồng gọi API nếu trình duyệt chặn localStorage.
  }
}

async function parseErrorPayload(response) {
  const isJson = response.headers.get("content-type")?.includes("application/json");
  if (isJson) {
    try {
      return await response.json();
    } catch (_error) {
      return null;
    }
  }

  try {
    return await response.text();
  } catch (_error) {
    return null;
  }
}

async function request(path, options = {}, context = {}) {
  const baseCandidates = context.baseCandidates || buildBaseCandidates(context.baseOverride || getApiBase());
  const baseIndex = Number.isInteger(context.baseIndex) ? context.baseIndex : 0;
  const base = baseCandidates[baseIndex] || normalizeBase(getApiBase());
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = { ...(options.headers || {}) };
  const hasContentType = Object.keys(headers).some((key) => key.toLowerCase() === "content-type");

  if (!isFormData && !hasContentType) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const requestMeta = {
    path,
    method: options.method || "GET",
    base,
    url
  };

  dispatchApiEvent("request-start", requestMeta);

  let response;
  try {
    response = await withTimeout(fetch(url, { ...options, headers }));
  } catch (error) {
    dispatchApiEvent("request-end", { ...requestMeta, ok: false, error: error?.message || "network-error" });
    if (baseIndex + 1 < baseCandidates.length) {
      return request(path, options, {
        ...context,
        baseCandidates,
        baseIndex: baseIndex + 1
      });
    }

    throw error;
  }

  if (baseIndex > 0) {
    persistApiBase(base);
  }

  if (response.status === 404 && baseIndex + 1 < baseCandidates.length) {
    dispatchApiEvent("request-end", { ...requestMeta, ok: false, status: response.status, message: "fallback-next-base" });
    return request(path, options, {
      ...context,
      baseCandidates,
      baseIndex: baseIndex + 1
    });
  }

  if (!response.ok && context.probeFallback && baseIndex + 1 < baseCandidates.length) {
    dispatchApiEvent("request-end", { ...requestMeta, ok: false, status: response.status, message: "probe-fallback-next-base" });
    return request(path, options, {
      ...context,
      baseCandidates,
      baseIndex: baseIndex + 1
    });
  }

  if (response.status === 401 && !context.skipRefresh && getRefreshToken()) {
    try {
      await refreshToken(true);
      dispatchApiEvent("request-end", { ...requestMeta, ok: false, status: response.status, message: "retry-after-refresh" });
      return request(path, options, {
        ...context,
        baseCandidates,
        baseIndex,
        skipRefresh: true
      });
    } catch (_error) {
      clearSession();
    }
  }

  if (!response.ok) {
    const payload = await parseErrorPayload(response);
    dispatchApiEvent("request-end", {
      ...requestMeta,
      ok: false,
      status: response.status,
      message: getApiErrorMessage(payload, response.status)
    });
    throw new Error(getApiErrorMessage(payload, response.status));
  }

  if (context.responseType === "blob") {
    dispatchApiEvent("request-end", { ...requestMeta, ok: true, status: response.status });
    return {
      blob: await response.blob(),
      headers: response.headers,
      status: response.status
    };
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  if (isJson) {
    dispatchApiEvent("request-end", { ...requestMeta, ok: true, status: response.status });
    return response.json();
  }

  dispatchApiEvent("request-end", { ...requestMeta, ok: true, status: response.status });
  return response.text();
}

export async function apiRequest(path, options = {}, context = {}) {
  return request(path, options, context);
}

export async function apiGet(path, params = {}, context = {}) {
  const query = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value === undefined || value === null || value === "") return acc;
      acc[key] = value;
      return acc;
    }, {})
  ).toString();

  const payload = await request(`${path}${query ? `?${query}` : ""}`, { method: "GET" }, context);
  return unwrapApiData(payload);
}

export async function apiGetBlob(path, params = {}, context = {}) {
  const query = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value === undefined || value === null || value === "") return acc;
      acc[key] = value;
      return acc;
    }, {})
  ).toString();

  return request(`${path}${query ? `?${query}` : ""}`, { method: "GET" }, { ...context, responseType: "blob" });
}

export async function apiPost(path, body = {}, context = {}) {
  const options = { method: "POST" };
  if (body instanceof FormData) {
    options.body = body;
  } else {
    options.body = JSON.stringify(body || {});
  }

  const payload = await request(path, options, context);
  return unwrapApiData(payload);
}

export async function apiPut(path, body = {}, context = {}) {
  const options = { method: "PUT" };
  if (body instanceof FormData) {
    options.body = body;
  } else {
    options.body = JSON.stringify(body || {});
  }

  const payload = await request(path, options, context);
  return unwrapApiData(payload);
}

export async function apiDelete(path, body = null, context = {}) {
  const options = { method: "DELETE" };
  if (body && typeof body === "object") {
    options.body = JSON.stringify(body);
  }

  const payload = await request(path, options, context);
  return unwrapApiData(payload);
}

export async function loginWithApi({ email, password }) {
  const response = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  const auth = readAuthPayload(response);

  if (!auth.accessToken) {
    throw new Error("Dang nhap thanh cong nhung khong nhan duoc access token.");
  }

  setSession({
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    user: auth.user
  });

  return {
    ...auth,
    raw: response
  };
}

export async function registerWithApi(payload) {
  const response = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const auth = readAuthPayload(response);
  if (auth.accessToken) {
    setSession({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      user: auth.user
    });
  }

  return {
    ...auth,
    raw: response
  };
}

export async function forgotPasswordWithApi(email) {
  const response = await request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email })
  });

  return unwrapApiData(response);
}

export async function refreshToken(silent = false) {
  const refreshValue = getRefreshToken();
  if (!refreshValue) {
    throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
  }

  const response = await request(
    "/auth/refresh",
    {
      method: "POST",
      headers: { "X-Refresh-Token": refreshValue },
      body: JSON.stringify({ refreshToken: refreshValue })
    },
    { skipRefresh: true }
  );

  const auth = readAuthPayload(response);
  if (!auth.accessToken) {
    throw new Error("Không nhận được access token mới từ API.");
  }

  setSession({
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken || refreshValue,
    user: auth.user
  });

  if (!silent) {
    return {
      ...auth,
      raw: response
    };
  }

  return auth;
}

export async function getCurrentProfile() {
  const payload = await request("/auth/me", { method: "GET" });
  return unwrapApiData(payload);
}

export async function getToursFromApi(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const payload = await request(`/tours${qs ? `?${qs}` : ""}`, { method: "GET" });
  return unwrapApiData(payload);
}

export async function createBooking(payload) {
  const response = await request("/bookings", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return unwrapApiData(response);
}

export async function pingApi() {
  const bases = buildBaseCandidates(getApiBase());

  for (let i = 0; i < bases.length; i += 1) {
    const base = bases[i];
    const url = `${base}/health`;

    try {
      const response = await withTimeout(
        fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" }
        }),
        8000
      );

      if (!response.ok) continue;

      if (i > 0) {
        persistApiBase(base);
      }

      return true;
    } catch (_error) {
      // thử base tiếp theo
    }
  }

  return false;
}

export async function logoutWithApi() {
  const refreshValue = getRefreshToken();
  try {
    await request(
      "/auth/logout",
      {
        method: "POST",
        body: JSON.stringify(refreshValue ? { refreshToken: refreshValue } : {})
      },
      { skipRefresh: true }
    );
  } finally {
    clearSession();
  }
}

export function logout() {
  clearSession();
}
