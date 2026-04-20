import { initLegacyApp } from "../legacy-app.js";
import { DOMAIN_PAGES } from "../../core/constants.js";
import { initNotificationsModule } from "../shared/notifications.js";
import { initProviderRequestsModule } from "../shared/provider-requests.js";
import { initDashboardModule } from "../shared/dashboard.js";
import { initAdminActionsModule } from "../shared/admin-actions.js";
import { initProfileModule } from "../shared/profile.js";
import { initStorageCleanupModule } from "../shared/storage-cleanup.js";

export function initProviderDomain(page) {
  if (!DOMAIN_PAGES.provider.has(page)) return false;
  initStorageCleanupModule();
  initNotificationsModule();
  initProviderRequestsModule();
  initDashboardModule();
  initAdminActionsModule();
  initProfileModule();
  initLegacyApp();
  return true;
}
