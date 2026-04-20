export function readLS(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch (_error) {
    return fallback;
  }
}

export function writeLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeLS(key) {
  localStorage.removeItem(key);
}

export function readSession(key, fallback = null) {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch (_error) {
    return fallback;
  }
}

export function writeSession(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function removeSession(key) {
  sessionStorage.removeItem(key);
}
