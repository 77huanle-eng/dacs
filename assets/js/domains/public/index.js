import { initLegacyApp } from "../legacy-app.js";
import { DOMAIN_PAGES } from "../../core/constants.js";
import { initNotificationsModule } from "../shared/notifications.js";
import { initProviderRequestsModule } from "../shared/provider-requests.js";
import { initCommentsRatingsModule } from "../shared/comments-ratings.js";
import { initDashboardModule } from "../shared/dashboard.js";
import { initAdminActionsModule } from "../shared/admin-actions.js";
import { initProfileModule } from "../shared/profile.js";
import { initStorageCleanupModule } from "../shared/storage-cleanup.js";

export function initPublicDomain(page) {
  if (!DOMAIN_PAGES.public.has(page)) return false;
  initStorageCleanupModule();
  initNotificationsModule();
  initProviderRequestsModule();
  initCommentsRatingsModule();
  initDashboardModule();
  initAdminActionsModule();
  initProfileModule();
  initLegacyApp();
  return true;
}
