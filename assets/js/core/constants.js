export const LS_KEYS = {
  wishlist: "vh_wishlist",
  profile: "vh_profile",
  bookingDraft: "vh_booking_draft",
  recentFilters: "vh_recent_filters",
  providerFeedbackTemplate: "vh_provider_feedback_template",
  theme: "vh_theme",
  accessToken: "vh_access_token",
  refreshToken: "vh_refresh_token",
  authUser: "vh_auth_user",
  devRole: "vh_dev_role",
  apiBase: "vh_api_base"
};

export const LEGACY_STORAGE_KEYS = [
  "vh_orders",
  "vh_cancelled_codes",
  "vh_allow_local_fallback"
];

export const DEFAULTS = {
  theme: "light",
  apiBase: "http://localhost:8080/api"
};

export const DOMAIN_PAGES = {
  public: new Set([
    "home",
    "tours",
    "promotions",
    "tour-detail",
    "login",
    "register",
    "forgot-password",
    "profile",
    "profile-edit",
    "booking",
    "payment",
    "booking-history",
    "booking-detail",
    "invoice",
    "wishlist",
    "posts",
    "post-detail",
    "contact"
  ]),
  provider: new Set([
    "provider-dashboard",
    "provider-profile",
    "provider-tours",
    "provider-tour-form",
    "provider-tour-edit",
    "provider-promotion-create",
    "provider-promotion-edit",
    "provider-bookings",
    "provider-booking-detail",
    "provider-services",
    "provider-promotions",
    "provider-feedback"
  ]),
  admin: new Set([
    "admin-dashboard",
    "admin-users",
    "admin-roles",
    "admin-tours",
    "admin-tour-create",
    "admin-tour-edit",
    "admin-categories",
    "admin-bookings",
    "admin-payments",
    "admin-invoices",
    "admin-posts",
    "admin-post-create",
    "admin-post-edit",
    "admin-promotions",
    "admin-promotion-create",
    "admin-promotion-edit",
    "admin-providers",
    "admin-comments",
    "admin-stats"
  ])
};

export const ROLES = {
  user: "user",
  provider: "provider",
  admin: "admin",
  guest: "guest"
};

export const AUTH_REQUIRED_PUBLIC_PAGES = new Set([
  "profile",
  "profile-edit",
  "booking",
  "payment",
  "booking-history",
  "booking-detail",
  "invoice",
  "wishlist"
]);
