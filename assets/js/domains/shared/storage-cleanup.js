import { LEGACY_STORAGE_KEYS } from "../../core/constants.js";

let initialized = false;

export function initStorageCleanupModule() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  try {
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch (_error) {
    // Không chặn bootstrap nếu trình duyệt khóa localStorage.
  }
}

