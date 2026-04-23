import { applyTourFilters, calcBookingTotals, sortTours } from "../core/logic.js";
import { apiDelete, apiGet, apiGetBlob, apiPost, apiPut, createBooking, forgotPasswordWithApi, loginWithApi, logoutWithApi, pingApi, registerWithApi } from "../core/api.js";
import { getApiBase, getCurrentRole, getCurrentUser, isLoggedIn } from "../core/auth.js";
import { showToast } from "../core/ui.js";
import { LS_KEYS as CORE_LS_KEYS } from "../core/constants.js";
import { initAuthPages as initSharedAuthPages } from "./shared/auth-pages.js";
import {
  initAdminPostFormPage as initSharedAdminPostFormPage,
  initAdminPromotionFormPage as initSharedAdminPromotionFormPage,
  initAdminTourFormPage as initSharedAdminTourFormPage,
  initProfileEditPage as initSharedProfileEditPage,
  initProviderBookingsPage as initSharedProviderBookingsPage,
  initProviderProfilePage as initSharedProviderProfilePage,
  initProviderPromotionFormPage as initSharedProviderPromotionFormPage,
  initProviderServicesPage as initSharedProviderServicesPage,
  initProviderTourFormPage as initSharedProviderTourFormPage
} from "./shared/form-pages.js";
import { initBookingActions, initBookingHistoryActions, initContactActions, initHomeActions, initPaymentActions } from "./shared/public-actions.js";
import { clearStatusSlot, ensureStatusSlot, renderStatusMessage, withPendingButton } from "./shared/ui-state.js";
export function initLegacyApp() {
  "use strict";

  const body = document.body;
  const app = document.getElementById("app");
  if (!body || !app) return;

  const page = body.dataset.page || "home";
  const base = body.dataset.base || ".";
  const path = (target = "") => {
    const cleaned = target.replace(/^\.?\//, "");
    const prefix = base === "." ? "./" : "../";
    return `${prefix}${cleaned}`.replace(/\\/g, "/");
  };

  const routes = {
    home: path("index.html"),
    tours: path("pages/tours.html"),
    promotions: path("pages/promotions.html"),
    tourDetail: path("pages/tour-detail.html"),
    login: path("pages/login.html"),
    register: path("pages/register.html"),
    forgotPassword: path("pages/forgot-password.html"),
    profile: path("pages/profile.html"),
    profileEdit: path("pages/profile-edit.html"),
    booking: path("pages/booking.html"),
    payment: path("pages/payment.html"),
    bookingHistory: path("pages/booking-history.html"),
    bookingDetail: path("pages/booking-detail.html"),
    invoice: path("pages/invoice.html"),
    wishlist: path("pages/wishlist.html"),
    posts: path("pages/posts.html"),
    postDetail: path("pages/post-detail.html"),
    contact: path("pages/contact.html"),
    providerDashboard: path("pages/provider-dashboard.html"),
    providerProfile: path("pages/provider-profile.html"),
    providerTours: path("pages/provider-tours.html"),
    providerTourForm: path("pages/provider-tour-form.html"),
    providerTourEdit: path("pages/provider-tour-edit.html"),
    providerPromotionCreate: path("pages/provider-promotion-create.html"),
    providerPromotionEdit: path("pages/provider-promotion-edit.html"),
    providerBookings: path("pages/provider-bookings.html"),
    providerBookingDetail: path("pages/provider-booking-detail.html"),
    providerServices: path("pages/provider-services.html"),
    providerPromotions: path("pages/provider-promotions.html"),
    providerFeedback: path("pages/provider-feedback.html"),
    adminDashboard: path("pages/admin-dashboard.html"),
    adminUsers: path("pages/admin-users.html"),
    adminRoles: path("pages/admin-roles.html"),
    adminTours: path("pages/admin-tours.html"),
    adminTourCreate: path("pages/admin-tour-create.html"),
    adminTourEdit: path("pages/admin-tour-edit.html"),
    adminCategories: path("pages/admin-categories.html"),
    adminBookings: path("pages/admin-bookings.html"),
    adminPayments: path("pages/admin-payments.html"),
    adminInvoices: path("pages/admin-invoices.html"),
    adminPosts: path("pages/admin-posts.html"),
    adminPostCreate: path("pages/admin-post-create.html"),
    adminPostEdit: path("pages/admin-post-edit.html"),
    adminPromotions: path("pages/admin-promotions.html"),
    adminPromotionCreate: path("pages/admin-promotion-create.html"),
    adminPromotionEdit: path("pages/admin-promotion-edit.html"),
    adminProviders: path("pages/admin-providers.html"),
    adminComments: path("pages/admin-comments.html"),
    adminStats: path("pages/admin-stats.html")
  };

  const LS_KEYS = {
    ...CORE_LS_KEYS,
    providerFeedbackTemplate: CORE_LS_KEYS.providerFeedbackTemplate || "vh_provider_feedback_template"
  };

  const readLS = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      if (!value) return fallback;
      return JSON.parse(value);
    } catch (_error) {
      return fallback;
    }
  };

  const writeLS = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const isLocalHost =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(String(window.location?.hostname || "").toLowerCase());

  const allowLocalFallback =
    isLocalHost &&
    (
      (typeof window !== "undefined" && window.__VHT_ALLOW_LOCAL_FALLBACK__ === true) ||
      (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("allowFallback") === "1")
    );

  const vnd = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(value || 0);

  const dateVN = (value) => {
    if (!value) return "-";
    return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
  };

  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const starHTML = (rating) => {
    const full = Math.floor(rating);
    return `<span class="rating-stars">${Array.from({ length: 5 }, (_, i) =>
      i < full ? '<i class="bi bi-star-fill"></i>' : '<i class="bi bi-star"></i>'
    ).join("")}</span>`;
  };

  const statusClass = (value) => {
    const map = {
      "Đã xác nhận": "status-success",
      "Hoàn tất": "status-info",
      "Đang hoạt động": "status-success",
      "Đã thanh toán": "status-success",
      "Thành công": "status-success",
      "Chờ xác nhận": "status-warning",
      "Chưa thanh toán": "status-warning",
      "Chờ xử lý": "status-warning",
      "Tạm dừng": "status-warning",
      "Nháp": "status-warning",
      "Đã hủy": "status-danger",
      "Thất bại": "status-danger",
      "Khóa": "status-danger",
      "Từ chối": "status-danger",
      "Công khai": "status-info",
      "Đang duyệt": "status-info"
    };
    return map[value] || "status-info";
  };

  const statusBadge = (value) => `<span class="status-badge ${statusClass(value)}">${value}</span>`;


  const bookingStatusMap = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    cancelled: "Đã hủy",
    completed: "Hoàn tất"
  };

  const paymentStatusMap = {
    unpaid: "Chưa thanh toán",
    paid: "Đã thanh toán",
    failed: "Thất bại",
    pending: "Chờ xử lý",
    success: "Thành công"
  };

  const providerStatusMap = {
    active: "Đang hoạt động",
    pending: "Đang duyệt",
    inactive: "Tạm dừng",
    suspended: "Tạm dừng",
    draft: "Nháp",
    hidden: "Đã ẩn",
    rejected: "Từ chối"
  };

  const userStatusMap = {
    active: "Đang hoạt động",
    inactive: "Tạm dừng",
    blocked: "Khóa",
    locked: "Khóa"
  };

  const postStatusMap = {
    published: "Công khai",
    draft: "Nháp",
    archived: "Đã ẩn"
  };

  const normalizeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const normalizeDate = (value) => {
    if (!value) return "";
    const iso = new Date(value).toISOString();
    return iso.slice(0, 10);
  };

  const splitTextLines = (value) => {
    if (!value) return [];
    return String(value)
      .split(/\r?\n|;|\./)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const parseListField = (value, separators = /[\r\n,;]/) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || "").trim()).filter(Boolean);
    }

    if (!value) return [];

    const raw = String(value).trim();
    if (!raw) return [];

    try {
      const decoded = JSON.parse(raw);
      if (Array.isArray(decoded)) {
        return decoded.map((item) => String(item || "").trim()).filter(Boolean);
      }
    } catch (_error) {
      // fallback parse theo text thường.
    }

    return raw
      .split(separators)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const parseServicePrice = (service = {}) => {
    const directPrice = Number(service.price);
    if (Number.isFinite(directPrice) && directPrice > 0) return directPrice;

    const text = String(service.description || "");
    const digits = text.replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  };

  const labelBookingStatus = (value) => bookingStatusMap[String(value || "").toLowerCase()] || value || "Chờ xác nhận";
  const labelPaymentStatus = (value) => paymentStatusMap[String(value || "").toLowerCase()] || value || "Chưa thanh toán";
  const labelProviderStatus = (value) => providerStatusMap[String(value || "").toLowerCase()] || value || "Đang hoạt động";
  const labelUserStatus = (value) => userStatusMap[String(value || "").toLowerCase()] || value || "Đang hoạt động";
  const labelPostStatus = (value) => postStatusMap[String(value || "").toLowerCase()] || value || "Công khai";
  const normalizePromotionType = (value) => (String(value || "").toLowerCase() === "percent" ? "percent" : "fixed");

  const toBackendBookingStatus = (value) => {
    const normalized = String(value || "").toLowerCase();
    if (normalized.includes("xác nhận")) return "confirmed";
    if (normalized.includes("hủy")) return "cancelled";
    if (normalized.includes("hoàn tất")) return "completed";
    return "pending";
  };

  const toBackendPaymentStatus = (value) => {
    const normalized = String(value || "").toLowerCase();
    if (normalized.includes("thanh toán")) return "paid";
    if (normalized.includes("thất bại")) return "failed";
    if (normalized.includes("chờ")) return "pending";
    return "unpaid";
  };

  const mapTourFromApi = (tour = {}) => {
    const priceAdult = normalizeNumber(tour.price_adult);
    const discount = normalizeNumber(tour.discount_price, priceAdult);
    const finalPrice = discount > 0 ? discount : priceAdult;
    const oldPrice = priceAdult > finalPrice ? priceAdult : Math.round(finalPrice * 1.12);
    const departureDate = normalizeDate(tour.departure_date || tour.created_at || new Date());

    return {
      id: normalizeNumber(tour.id),
      name: tour.title || "Tour chưa đặt tên",
      location: tour.destination || "Đang cập nhật",
      region: tour.destination || "",
      category: tour.category_name || "Khám phá",
      duration: normalizeNumber(tour.duration_days, 1),
      nights: normalizeNumber(tour.duration_nights, 0),
      price: finalPrice,
      oldPrice,
      rating: normalizeNumber(tour.rating_avg, 0),
      reviews: normalizeNumber(tour.reviews_count || tour.rating_count, 0),
      booked: normalizeNumber(tour.bookings_count, 0),
      views: normalizeNumber(tour.views_count, 0),
      departureDates: [departureDate],
      type: tour.category_name || "Tiêu chuẩn",
      startPoint: tour.departure_location || "",
      endPoint: tour.destination || "",
      providerId: String(tour.provider_id || ""),
      providerName: tour.provider_name || tour.company_name || "",
      providerEmail: tour.provider_email || tour.contact_email || "",
      providerPhone: tour.provider_phone || tour.contact_phone || "",
      badge: oldPrice > finalPrice ? `Giảm ${Math.max(1, Math.round(((oldPrice - finalPrice) / oldPrice) * 100))}%` : "",
      image: tour.thumbnail || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80",
      gallery: [tour.thumbnail].filter(Boolean),
      shortDesc: tour.short_description || tour.description || "Đang cập nhật mô tả.",
      itinerary: splitTextLines(tour.itinerary),
      includes: splitTextLines(tour.included_services),
      policy: splitTextLines(tour.policy),
      status: tour.status || "active",
      maxGuests: normalizeNumber(tour.max_guests, 50),
      availableSlots: normalizeNumber(tour.available_slots, 0)
    };
  };

  const mapPostFromApi = (post = {}) => ({
    id: normalizeNumber(post.id),
    slug: post.slug || "",
    title: post.title || "Bài viết",
    category: post.category || "Cẩm nang",
    date: normalizeDate(post.published_at || post.created_at || new Date()),
    author: post.author_name || "Ban biên tập",
    image: post.thumbnail || "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=1200&q=80",
    excerpt: post.excerpt || "",
    content: splitTextLines(post.content || post.excerpt),
    contentRaw: String(post.content || ""),
    tags: parseListField(post.tags, /[\r\n,;]/),
    gallery: parseListField(post.gallery, /[\r\n,;]/),
    metaTitle: String(post.meta_title || post.metaTitle || ""),
    metaDescription: String(post.meta_description || post.metaDescription || ""),
    isFeatured: Boolean(Number(post.is_featured || 0)),
    status: labelPostStatus(post.status || "published")
  });

  const mapProviderFromApi = (provider = {}) => ({
    id: String(provider.provider_id || provider.id || provider.request_id || ""),
    providerId: normalizeNumber(provider.provider_id || provider.id, 0),
    requestId: normalizeNumber(provider.request_id || 0, 0),
    name: provider.company_name || "Nhà cung cấp",
    email: provider.contact_email || "",
    phone: provider.contact_phone || "",
    city: provider.city || provider.address || "",
    status: labelProviderStatus(provider.status),
    joinedAt: normalizeDate(provider.created_at || new Date()),
    rating: normalizeNumber(provider.rating_avg || provider.rating, 0),
    totalTours: normalizeNumber(provider.total_tours || provider.totalTours, 0),
    description: provider.description || "",
    supportPolicy: provider.support_policy || provider.supportPolicy || ""
  });

  const mapUserFromApi = (user = {}) => ({
    id: String(user.id || ""),
    name: user.full_name || user.name || "Người dùng",
    email: user.email || "",
    phone: user.phone || "",
    role: String(user.role_name || user.role || "user").replace(/^\w/, (ch) => ch.toUpperCase()),
    city: user.city || user.address || "",
    status: labelUserStatus(user.status),
    joinedAt: normalizeDate(user.created_at || new Date())
  });

  const mapBookingFromApi = (booking = {}) => ({
    id: normalizeNumber(booking.id || booking.booking_id),
    code: booking.booking_code || booking.code || "",
    userId: String(booking.user_id || booking.userId || ""),
    tourId: normalizeNumber(booking.tour_id || booking.tourId),
    bookingDate: normalizeDate(booking.created_at || booking.booking_date || new Date()),
    departureDate: normalizeDate(booking.departure_date || new Date()),
    travelers: normalizeNumber(booking.total_guests || booking.travelers, 1),
    amount: normalizeNumber(booking.total_amount || booking.amount, 0),
    status: labelBookingStatus(booking.booking_status || booking.status),
    paymentStatus: labelPaymentStatus(booking.payment_status || booking.paymentStatus),
    providerId: String(booking.provider_id || booking.providerId || ""),
    paymentMethod: booking.payment_method || "",
    invoiceId: normalizeNumber(booking.invoice_id || booking.invoiceId, 0),
    customerName: booking.customer_name || booking.contact_name || "",
    customerEmail: booking.customer_email || booking.contact_email || "",
    customerPhone: booking.customer_phone || booking.contact_phone || "",
    note: booking.note || ""
  });

  const mapPromotionFromApi = (promo = {}) => ({
    id: String(promo.id || ""),
    providerId: String(promo.provider_id || promo.providerId || ""),
    code: promo.code || "",
    title: promo.title || "Khuyến mãi",
    description: promo.description || "",
    image: promo.image_url || promo.image || "",
    type: normalizePromotionType(promo.discount_type || promo.type),
    value: normalizeNumber(promo.discount_value, 0),
    minOrderValue: normalizeNumber(promo.min_order_value, 0),
    maxDiscountValue: normalizeNumber(promo.max_discount_value, 0),
    usageLimit: normalizeNumber(promo.usage_limit, 0),
    status: labelProviderStatus(promo.status),
    start: normalizeDate(promo.start_date || new Date()),
    end: normalizeDate(promo.end_date || new Date())
  });

  const mapCommentFromApi = (comment = {}) => ({
    id: String(comment.id || ""),
    commentId: normalizeNumber(comment.comment_id || comment.id, 0),
    ratingId: normalizeNumber(comment.rating_id || comment.id, 0),
    tourId: normalizeNumber(comment.tour_id),
    userId: String(comment.user_id || ""),
    user: comment.user_name || "Khách hàng",
    rating: normalizeNumber(comment.score || comment.rating || 5, 5),
    date: normalizeDate(comment.created_at || new Date()),
    status: comment.status === "hidden" ? "Đã ẩn" : comment.status === "pending" ? "Đang duyệt" : "Công khai",
    text: comment.content || comment.review || "",
    review: comment.review || "",
    content: comment.content || ""
  });

  const mapNotificationFromApi = (item = {}) => ({
    id: normalizeNumber(item.id, 0),
    title: item.title || "Thông báo",
    content: item.content || "",
    type: item.type || "system",
    isRead: Boolean(Number(item.is_read || 0)),
    createdAt: normalizeDate(item.created_at || new Date())
  });

  const DEFAULT_POST_THUMBNAIL = "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=1200&q=80";

  const toBackendPostStatus = (value) => {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized.includes("publish") || normalized.includes("công khai")) return "published";
    if (normalized.includes("archiv") || normalized.includes("ẩn")) return "archived";
    return "draft";
  };

  const db = {
    categories: [
      { id: "cat01", name: "Biển Nghỉ Dưỡng", tours: 38, icon: "bi-umbrella" },
      { id: "cat02", name: "Săn Mây - Núi", tours: 22, icon: "bi-cloud-sun" },
      { id: "cat03", name: "Quốc Tế Cao Cấp", tours: 41, icon: "bi-airplane" },
      { id: "cat04", name: "Gia Đình", tours: 29, icon: "bi-people" },
      { id: "cat05", name: "Tuần Trăng Mật", tours: 16, icon: "bi-heart" }
    ],
    providers: [
      {
        id: "pv01",
        name: "Sunrise Destination",
        email: "contact@sunrisedestination.vn",
        phone: "0901 456 789",
        city: "Đà Nẵng",
        status: "Đang hoạt động",
        joinedAt: "2024-05-14",
        rating: 4.8,
        totalTours: 26
      },
      {
        id: "pv02",
        name: "Blue Ocean Holidays",
        email: "hello@blueocean.vn",
        phone: "0909 002 188",
        city: "Phú Quốc",
        status: "Đang hoạt động",
        joinedAt: "2023-11-22",
        rating: 4.7,
        totalTours: 18
      },
      {
        id: "pv03",
        name: "Asia Gate Travel",
        email: "book@asiagate.vn",
        phone: "0933 567 900",
        city: "Hà Nội",
        status: "Đang duyệt",
        joinedAt: "2026-03-04",
        rating: 4.5,
        totalTours: 11
      },
      {
        id: "pv04",
        name: "Orchid Premium Tours",
        email: "service@orchidpremium.vn",
        phone: "0988 234 555",
        city: "TP. Hồ Chí Minh",
        status: "Tạm dừng",
        joinedAt: "2022-08-19",
        rating: 4.3,
        totalTours: 8
      },
      {
        id: "pv05",
        name: "Northern Vista",
        email: "hello@northernvista.vn",
        phone: "0912 100 338",
        city: "Lào Cai",
        status: "Đang hoạt động",
        joinedAt: "2025-04-27",
        rating: 4.6,
        totalTours: 14
      }
    ],
    promotions: [
      {
        id: "pr01",
        code: "SUMMER26",
        title: "Ưu đãi hè rực rỡ",
        type: "percent",
        value: 10,
        status: "Đang hoạt động",
        start: "2026-04-01",
        end: "2026-07-31"
      },
      {
        id: "pr02",
        code: "EARLYBIRD",
        title: "Đặt sớm giảm ngay",
        type: "percent",
        value: 8,
        status: "Đang hoạt động",
        start: "2026-04-01",
        end: "2026-12-31"
      },
      {
        id: "pr03",
        code: "VIP500",
        title: "Giảm thẳng cho đơn cao cấp",
        type: "flat",
        value: 500000,
        status: "Tạm dừng",
        start: "2026-01-10",
        end: "2026-12-20"
      },
      {
        id: "pr04",
        code: "FLASH60",
        title: "Flash sale cuối tuần",
        type: "percent",
        value: 6,
        status: "Đang hoạt động",
        start: "2026-04-01",
        end: "2026-05-20"
      }
    ],
    tours: [
      {
        id: 1,
        name: "Đà Nẵng - Hội An 3N2Đ",
        location: "Đà Nẵng",
        region: "Việt Nam",
        category: "Biển",
        duration: 3,
        nights: 2,
        price: 4590000,
        oldPrice: 5290000,
        rating: 4.8,
        reviews: 286,
        booked: 1380,
        departureDates: ["2026-04-22", "2026-05-05", "2026-05-20"],
        type: "Nghỉ dưỡng",
        startPoint: "TP. Hồ Chí Minh",
        endPoint: "Đà Nẵng",
        providerId: "pv01",
        badge: "Giảm 13%",
        image:
          "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1200&q=80"
        ],
        shortDesc:
          "Khám phá cầu Rồng, phố cổ Hội An, Bà Nà Hills và chuỗi trải nghiệm ẩm thực miền Trung trọn gói.",
        itinerary: [
          "Ngày 1: Bay đến Đà Nẵng, tham quan Sơn Trà, cầu Rồng và tắm biển Mỹ Khê.",
          "Ngày 2: Bà Nà Hills - Cầu Vàng - buffet trưa, tối dạo phố cổ Hội An.",
          "Ngày 3: Mua sắm đặc sản, trả phòng và ra sân bay."
        ],
        includes: [
          "Vé máy bay khứ hồi và hành lý xách tay",
          "Khách sạn 4 sao tiêu chuẩn đôi",
          "02 bữa sáng + 03 bữa chính",
          "Vé tham quan theo chương trình",
          "Bảo hiểm du lịch tối đa 100 triệu"
        ],
        policy: [
          "Hủy trước 10 ngày: miễn phí",
          "Hủy trước 5 ngày: phí 30%",
          "Hủy dưới 72 giờ: phí 100%"
        ]
      },
      {
        id: 2,
        name: "Phú Quốc nghỉ dưỡng 4N3Đ",
        location: "Phú Quốc",
        region: "Việt Nam",
        category: "Biển",
        duration: 4,
        nights: 3,
        price: 6790000,
        oldPrice: 7590000,
        rating: 4.9,
        reviews: 332,
        booked: 1735,
        departureDates: ["2026-04-24", "2026-05-07", "2026-05-22"],
        type: "Nghỉ dưỡng cao cấp",
        startPoint: "Hà Nội",
        endPoint: "Phú Quốc",
        providerId: "pv02",
        badge: "Best Seller",
        image:
          "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80"
        ],
        shortDesc:
          "Combo nghỉ dưỡng biển đảo với resort 5 sao, cano 4 đảo và hoàng hôn Sunset Town.",
        itinerary: [
          "Ngày 1: Check-in resort, ngắm hoàng hôn Dinh Cậu.",
          "Ngày 2: Cano 4 đảo - lặn ngắm san hô - ăn trưa hải sản.",
          "Ngày 3: Grand World - VinWonders hoặc Safari tự do.",
          "Ngày 4: Chợ Dương Đông, trả phòng và bay về."
        ],
        includes: [
          "Vé máy bay khứ hồi",
          "Resort 5 sao gần biển",
          "Tour cano 4 đảo",
          "Xe đưa đón sân bay",
          "Bảo hiểm và HDV"
        ],
        policy: [
          "Đổi ngày miễn phí trước 7 ngày",
          "Hủy trước 5 ngày: phí 35%",
          "Hủy trong 48h: phí 100%"
        ]
      },
      {
        id: 3,
        name: "Đà Lạt săn mây 3N2Đ",
        location: "Đà Lạt",
        region: "Việt Nam",
        category: "Núi",
        duration: 3,
        nights: 2,
        price: 3890000,
        oldPrice: 4390000,
        rating: 4.7,
        reviews: 208,
        booked: 1044,
        departureDates: ["2026-04-18", "2026-04-30", "2026-05-14"],
        type: "Trải nghiệm",
        startPoint: "TP. Hồ Chí Minh",
        endPoint: "Đà Lạt",
        providerId: "pv05",
        badge: "Giá tốt",
        image:
          "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1518002054494-3a6f94352e9d?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1464822759844-d150ad6d1d12?auto=format&fit=crop&w=1200&q=80"
        ],
        shortDesc:
          "Lịch trình chill tại Đà Lạt: săn mây, check-in đồi chè, cafe rừng và BBQ tối.",
        itinerary: [
          "Ngày 1: Khởi hành, tham quan Quảng trường Lâm Viên, hồ Xuân Hương.",
          "Ngày 2: Săn mây Cầu Đất, vườn hoa, cafe rừng, BBQ tối.",
          "Ngày 3: Chợ Đà Lạt, mua đặc sản và về lại điểm đón."
        ],
        includes: [
          "Xe giường nằm đời mới",
          "Khách sạn 3 sao trung tâm",
          "Ăn sáng buffet + 2 bữa chính",
          "Vé tham quan",
          "HDV suốt tuyến"
        ],
        policy: [
          "Trẻ em dưới 5 tuổi miễn phí",
          "Hủy trước 7 ngày hoàn 90%",
          "Hủy trước 2 ngày tính phí 70%"
        ]
      },
      {
        id: 4,
        name: "Bangkok - Pattaya 5N4Đ",
        location: "Thái Lan",
        region: "Quốc tế",
        category: "City",
        duration: 5,
        nights: 4,
        price: 11990000,
        oldPrice: 12990000,
        rating: 4.8,
        reviews: 451,
        booked: 2122,
        departureDates: ["2026-05-03", "2026-05-17", "2026-06-02"],
        type: "Mua sắm",
        startPoint: "TP. Hồ Chí Minh",
        endPoint: "Bangkok",
        providerId: "pv03",
        badge: "Quốc tế hot",
        image:
          "https://images.unsplash.com/photo-1513415564515-763d91423bdd?auto=format&fit=crop&w=1200&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1513415564515-763d91423bdd?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80"
        ],
        shortDesc:
          "Trải nghiệm đảo Coral, chợ nổi, IconSiam và show văn hóa đặc sắc Bangkok.",
        itinerary: [
          "Ngày 1: Bay sang Bangkok - về Pattaya.",
          "Ngày 2: Đảo Coral, tắm biển, thưởng thức hải sản.",
          "Ngày 3: Chợ nổi 4 miền - Big Bee - quay lại Bangkok.",
          "Ngày 4: Wat Arun, IconSiam, shopping tự do.",
          "Ngày 5: Bay về Việt Nam."
        ],
        includes: [
          "Vé máy bay quốc tế + thuế phí",
          "Khách sạn 4 sao",
          "Visa đoàn (nếu cần)",
          "06 bữa chính theo chương trình",
          "Hướng dẫn viên song ngữ"
        ],
        policy: [
          "Cần hộ chiếu còn hạn 6 tháng",
          "Hủy trước 15 ngày phí 30%",
          "Hủy trước 7 ngày phí 70%"
        ]
      },
      {
        id: 5,
        name: "Hàn Quốc mùa lá đỏ 6N5Đ",
        location: "Hàn Quốc",
        region: "Quốc tế",
        category: "Seasonal",
        duration: 6,
        nights: 5,
        price: 26900000,
        oldPrice: 28900000,
        rating: 4.9,
        reviews: 198,
        booked: 604,
        departureDates: ["2026-10-10", "2026-10-21", "2026-11-03"],
        type: "Cao cấp",
        startPoint: "Hà Nội",
        endPoint: "Seoul",
        providerId: "pv03",
        badge: "Premium",
        image:
          "https://images.unsplash.com/photo-1538485399081-7c8975d5b1f5?auto=format&fit=crop&w=1200&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1538485399081-7c8975d5b1f5?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1526481280695-3c4696a9006a?auto=format&fit=crop&w=1200&q=80"
        ],
        shortDesc:
          "Hành trình mùa lá đỏ Seoul - Nami - Everland với khách sạn trung tâm và ẩm thực Hàn.",
        itinerary: [
          "Ngày 1: Bay đêm đến Incheon, nghỉ ngơi.",
          "Ngày 2: Cung điện Gyeongbok, làng Bukchon.",
          "Ngày 3: Đảo Nami - phố Myeongdong.",
          "Ngày 4: Everland - mua sắm mỹ phẩm.",
          "Ngày 5: Tham quan nội đô và tự do.",
          "Ngày 6: Bay về Việt Nam."
        ],
        includes: [
          "Visa Hàn Quốc",
          "Khách sạn 4 sao trung tâm Seoul",
          "Bữa ăn theo chuẩn 8 món",
          "Vé tham quan đầy đủ",
          "Bảo hiểm quốc tế"
        ],
        policy: [
          "Yêu cầu hồ sơ visa tối thiểu trước 20 ngày",
          "Không hoàn phí visa khi bị từ chối",
          "Hủy sau khi xuất vé: phí 100%"
        ]
      },
      {
        id: 6,
        name: "Nha Trang Luxury Cruise 3N2Đ",
        location: "Nha Trang",
        region: "Việt Nam",
        category: "Biển",
        duration: 3,
        nights: 2,
        price: 5290000,
        oldPrice: 5890000,
        rating: 4.6,
        reviews: 122,
        booked: 711,
        departureDates: ["2026-04-26", "2026-05-09", "2026-05-25"],
        type: "Du thuyền",
        startPoint: "TP. Hồ Chí Minh",
        endPoint: "Nha Trang",
        providerId: "pv02",
        badge: "Mới",
        image:
          "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=1200&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
        ],
        shortDesc:
          "Nghỉ dưỡng Nha Trang với trải nghiệm du thuyền chiều và bữa tối ngắm vịnh.",
        itinerary: [
          "Ngày 1: Bay đến Nha Trang, tắm bùn khoáng.",
          "Ngày 2: City tour + du thuyền ngắm hoàng hôn.",
          "Ngày 3: Tự do mua sắm, trở về."
        ],
        includes: [
          "Vé máy bay",
          "Khách sạn 4 sao view biển",
          "Vé du thuyền buổi chiều",
          "Ăn uống theo chương trình",
          "HDV nhiệt tình"
        ],
        policy: [
          "Dời tour 1 lần miễn phí trước 5 ngày",
          "Hủy trong tuần khởi hành: phí 80%"
        ]
      },
      {
        id: 7,
        name: "Singapore - Malaysia 5N4Đ",
        location: "Singapore",
        region: "Quốc tế",
        category: "City",
        duration: 5,
        nights: 4,
        price: 15990000,
        oldPrice: 16990000,
        rating: 4.7,
        reviews: 176,
        booked: 955,
        departureDates: ["2026-05-11", "2026-05-26", "2026-06-08"],
        type: "Liên tuyến",
        startPoint: "TP. Hồ Chí Minh",
        endPoint: "Singapore",
        providerId: "pv03",
        badge: "Ưu đãi nhóm",
        image:
          "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1545048702-79362596cdc9?auto=format&fit=crop&w=1200&q=80"
        ],
        shortDesc:
          "Hành trình 2 quốc gia với Marina Bay, Genting, Malacca và ẩm thực bản địa.",
        itinerary: [
          "Ngày 1: Bay đến Singapore, tham quan Garden by the Bay.",
          "Ngày 2: Sentosa - Merlion Park.",
          "Ngày 3: Di chuyển sang Malaysia, ghé Malacca.",
          "Ngày 4: Cao nguyên Genting, mua sắm Kuala Lumpur.",
          "Ngày 5: Trở về Việt Nam."
        ],
        includes: [
          "Vé máy bay và xe liên tuyến",
          "Khách sạn 4 sao",
          "Ăn uống ẩm thực địa phương",
          "Vé cáp treo Genting",
          "Bảo hiểm toàn tuyến"
        ],
        policy: [
          "Hộ chiếu còn hạn 6 tháng",
          "Hủy trước 10 ngày tính 40%",
          "Hủy trước 3 ngày tính 100%"
        ]
      },
      {
        id: 8,
        name: "Tokyo - Núi Phú Sĩ 6N5Đ",
        location: "Nhật Bản",
        region: "Quốc tế",
        category: "Seasonal",
        duration: 6,
        nights: 5,
        price: 31900000,
        oldPrice: 33900000,
        rating: 4.9,
        reviews: 148,
        booked: 501,
        departureDates: ["2026-06-12", "2026-07-01", "2026-08-14"],
        type: "Khám phá",
        startPoint: "Hà Nội",
        endPoint: "Tokyo",
        providerId: "pv03",
        badge: "Visa trọn gói",
        image:
          "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1526481280695-3c4696a9006a?auto=format&fit=crop&w=1200&q=80"
        ],
        shortDesc:
          "Lộ trình Nhật Bản trọn vẹn với Tokyo, Odaiba, núi Phú Sĩ và trải nghiệm onsen.",
        itinerary: [
          "Ngày 1: Bay đêm đến Tokyo.",
          "Ngày 2: Chùa Asakusa - Tokyo Skytree.",
          "Ngày 3: Odaiba - mua sắm Ginza.",
          "Ngày 4: Núi Phú Sĩ - hồ Kawaguchi.",
          "Ngày 5: Trải nghiệm onsen, tự do tham quan.",
          "Ngày 6: Bay về Việt Nam."
        ],
        includes: [
          "Visa Nhật",
          "Khách sạn 4 sao",
          "Vé tham quan",
          "HDV tiếng Việt",
          "Bảo hiểm quốc tế"
        ],
        policy: [
          "Thời gian nộp visa tối thiểu 25 ngày",
          "Không hoàn phí dịch vụ visa",
          "Hủy sau khi xuất vé: phí 100%"
        ]
      },
      {
        id: 9,
        name: "Sapa Fansipan 3N2Đ",
        location: "Sapa",
        region: "Việt Nam",
        category: "Núi",
        duration: 3,
        nights: 2,
        price: 4290000,
        oldPrice: 4690000,
        rating: 4.6,
        reviews: 143,
        booked: 803,
        departureDates: ["2026-04-29", "2026-05-13", "2026-05-27"],
        type: "Thiên nhiên",
        startPoint: "Hà Nội",
        endPoint: "Sapa",
        providerId: "pv05",
        badge: "Nhiều check-in",
        image:
          "https://images.unsplash.com/photo-1577648188599-291bb8b831c3?auto=format&fit=crop&w=1200&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1577648188599-291bb8b831c3?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1455156218388-5e61b526818b?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1464822759844-d150ad6d1d12?auto=format&fit=crop&w=1200&q=80"
        ],
        shortDesc:
          "Trải nghiệm bản Cát Cát, cáp treo Fansipan và chợ đêm Sapa.",
        itinerary: [
          "Ngày 1: Khởi hành đi Sapa, check-in bản Cát Cát.",
          "Ngày 2: Chinh phục Fansipan bằng cáp treo.",
          "Ngày 3: Chợ Sapa, trả phòng, về lại Hà Nội."
        ],
        includes: [
          "Xe limousine khứ hồi",
          "Khách sạn 4 sao",
          "Vé cáp treo Fansipan",
          "Ăn sáng + bữa chính",
          "HDV bản địa"
        ],
        policy: [
          "Hủy trước 5 ngày miễn phí",
          "Hủy sau thời hạn hoàn 50%"
        ]
      },
      {
        id: 10,
        name: "Bali Retreat 5N4Đ",
        location: "Indonesia",
        region: "Quốc tế",
        category: "Biển",
        duration: 5,
        nights: 4,
        price: 18990000,
        oldPrice: 20500000,
        rating: 4.8,
        reviews: 164,
        booked: 677,
        departureDates: ["2026-06-06", "2026-07-03", "2026-07-18"],
        type: "Nghỉ dưỡng cao cấp",
        startPoint: "TP. Hồ Chí Minh",
        endPoint: "Bali",
        providerId: "pv04",
        badge: "Honeymoon",
        image:
          "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=1200&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1468071174046-657d9d351a40?auto=format&fit=crop&w=1200&q=80"
        ],
        shortDesc:
          "Tour Bali thư giãn tại Ubud, bãi biển Seminyak và sunset tại Tanah Lot.",
        itinerary: [
          "Ngày 1: Bay đến Bali, nghỉ dưỡng.",
          "Ngày 2: Ubud - ruộng bậc thang Tegalalang.",
          "Ngày 3: Swing Bali - cafe rừng.",
          "Ngày 4: Biển Seminyak - Tanah Lot.",
          "Ngày 5: Tự do và bay về."
        ],
        includes: [
          "Vé máy bay quốc tế",
          "Khách sạn 4 sao",
          "Xe đón tiễn sân bay",
          "Bữa ăn theo chương trình",
          "HDV địa phương"
        ],
        policy: [
          "Hủy trước 15 ngày hoàn 70%",
          "Hủy trước 5 ngày hoàn 20%"
        ]
      }
    ],
    posts: [
      {
        id: 1,
        title: "10 địa điểm săn mây đẹp nhất Việt Nam cho người mê check-in",
        category: "Cẩm nang",
        date: "2026-04-02",
        author: "Minh Châu",
        image:
          "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
        excerpt:
          "Danh sách địa điểm săn mây nổi bật từ Đà Lạt đến Tà Xùa cùng gợi ý lịch trình cuối tuần.",
        content: [
          "Săn mây là trải nghiệm đang được nhiều bạn trẻ yêu thích vì vừa thư giãn vừa có ảnh đẹp.",
          "Để có chuyến đi trọn vẹn, bạn nên kiểm tra thời tiết, chuẩn bị áo ấm và khởi hành từ sớm.",
          "Viet Horizon Travel gợi ý các điểm săn mây có hạ tầng tốt, an toàn và phù hợp cho nhiều nhóm khách."
        ]
      },
      {
        id: 2,
        title: "Checklist 15 món đồ không thể thiếu khi đi tour biển",
        category: "Kinh nghiệm",
        date: "2026-03-28",
        author: "Hoài Nam",
        image:
          "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80",
        excerpt:
          "Chuẩn bị đúng giúp chuyến đi biển thoải mái hơn, tránh mua phát sinh và chủ động mọi tình huống.",
        content: [
          "Khi đi biển, ngoài đồ bơi và kem chống nắng, bạn nên mang thêm túi chống nước, thuốc cá nhân và dép đế bám tốt.",
          "Nếu đi cùng trẻ nhỏ, hãy ưu tiên đồ ăn nhẹ và bình nước riêng.",
          "Một chiếc vali gọn nhẹ sẽ giúp bạn di chuyển thuận tiện và giảm thời gian chờ đợi khi check-in."
        ]
      },
      {
        id: 3,
        title: "Top trải nghiệm ẩm thực đêm tại Bangkok bạn nên thử",
        category: "Ẩm thực",
        date: "2026-03-19",
        author: "Thanh Vy",
        image:
          "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1200&q=80",
        excerpt:
          "Từ pad thai đường phố đến chợ đêm train market, đây là guide cho hội mê ẩm thực Thái.",
        content: [
          "Bangkok là thiên đường ăn đêm với hàng trăm món ăn đặc sắc.",
          "Những khu chợ đêm vừa có món ngon vừa có không khí mua sắm sôi động.",
          "Đừng ngại thử các món địa phương để cảm nhận văn hóa ẩm thực đầy đủ hơn."
        ]
      },
      {
        id: 4,
        title: "Mẹo tiết kiệm 20% chi phí khi đặt tour quốc tế",
        category: "Tài chính du lịch",
        date: "2026-02-24",
        author: "Quang Huy",
        image:
          "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80",
        excerpt: "Một số mẹo thực tế về thời điểm đặt, ưu đãi nhóm và sử dụng mã giảm giá.",
        content: [
          "Bạn nên đặt tour quốc tế trước 45-60 ngày để có giá vé tốt.",
          "Đi theo nhóm từ 4 người thường có ưu đãi riêng.",
          "Hãy so sánh dịch vụ bao gồm trong giá để tránh phát sinh ngoài dự kiến."
        ]
      },
      {
        id: 5,
        title: "Lịch nở hoa đẹp nhất năm tại Nhật Bản và Hàn Quốc",
        category: "Mùa vụ",
        date: "2026-01-31",
        author: "Phương Linh",
        image:
          "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1200&q=80",
        excerpt: "Gợi ý thời gian vàng để săn hoa anh đào và lá đỏ ở Đông Bắc Á.",
        content: [
          "Mỗi năm, mùa hoa anh đào và lá đỏ có thể lệch vài tuần tùy thời tiết.",
          "Tour trọn gói thường tối ưu vì đã chốt lịch theo khung đẹp nhất.",
          "Bạn nên chuẩn bị trang phục layer để thích nghi nhiệt độ thay đổi mạnh."
        ]
      },
      {
        id: 6,
        title: "Hướng dẫn chọn tour phù hợp cho gia đình có trẻ nhỏ",
        category: "Gia đình",
        date: "2025-12-18",
        author: "Mai Trang",
        image:
          "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=1200&q=80",
        excerpt: "Ưu tiên lịch trình nhẹ, khách sạn thân thiện và bữa ăn đa dạng cho trẻ.",
        content: [
          "Gia đình có trẻ nhỏ nên ưu tiên tour có thời gian di chuyển ngắn và nhịp độ vừa phải.",
          "Hãy xem kỹ chính sách trẻ em, tiện ích phòng và thực đơn đi kèm.",
          "Luôn chuẩn bị túi y tế mini và số liên hệ khẩn cấp của HDV."
        ]
      }
    ],
    users: [
      { id: "u01", name: "Nguyễn Văn An", email: "an.nguyen@gmail.com", phone: "0908 112 223", role: "User", city: "TP. Hồ Chí Minh", status: "Đang hoạt động", joinedAt: "2024-11-12" },
      { id: "u02", name: "Trần Thị Minh", email: "minhtran@gmail.com", phone: "0933 663 522", role: "User", city: "Hà Nội", status: "Đang hoạt động", joinedAt: "2025-01-20" },
      { id: "u03", name: "Lê Quốc Bảo", email: "bao.le@gmail.com", phone: "0901 776 928", role: "Provider", city: "Đà Nẵng", status: "Đang hoạt động", joinedAt: "2023-08-13" },
      { id: "u04", name: "Phạm Thu Hương", email: "huongpham@gmail.com", phone: "0912 765 332", role: "Admin", city: "TP. Hồ Chí Minh", status: "Đang hoạt động", joinedAt: "2022-05-03" },
      { id: "u05", name: "Đỗ Hữu Khánh", email: "khanhdo@gmail.com", phone: "0977 201 544", role: "User", city: "Hải Phòng", status: "Khóa", joinedAt: "2025-07-14" },
      { id: "u06", name: "Hoàng Mai Anh", email: "maianh.hoang@gmail.com", phone: "0986 991 771", role: "User", city: "Cần Thơ", status: "Đang hoạt động", joinedAt: "2026-02-02" },
      { id: "u07", name: "Ngô Đức Long", email: "long.ngo@gmail.com", phone: "0904 881 997", role: "Provider", city: "Nha Trang", status: "Tạm dừng", joinedAt: "2024-02-25" },
      { id: "u08", name: "Trương Gia Hân", email: "han.truong@gmail.com", phone: "0902 551 998", role: "User", city: "Đà Lạt", status: "Đang hoạt động", joinedAt: "2026-03-10" }
    ],
    bookings: [
      { code: "BK2026040101", userId: "u01", tourId: 1, bookingDate: "2026-04-01", departureDate: "2026-04-22", travelers: 2, amount: 9180000, status: "Đã xác nhận", paymentStatus: "Đã thanh toán", providerId: "pv01" },
      { code: "BK2026031809", userId: "u01", tourId: 4, bookingDate: "2026-03-18", departureDate: "2026-05-03", travelers: 2, amount: 23980000, status: "Chờ xác nhận", paymentStatus: "Chưa thanh toán", providerId: "pv03" },
      { code: "BK2026021404", userId: "u01", tourId: 3, bookingDate: "2026-02-14", departureDate: "2026-04-30", travelers: 3, amount: 11670000, status: "Hoàn tất", paymentStatus: "Đã thanh toán", providerId: "pv05" },
      { code: "BK2026012012", userId: "u02", tourId: 2, bookingDate: "2026-01-20", departureDate: "2026-04-24", travelers: 2, amount: 13580000, status: "Đã xác nhận", paymentStatus: "Đã thanh toán", providerId: "pv02" },
      { code: "BK2026040302", userId: "u06", tourId: 9, bookingDate: "2026-04-03", departureDate: "2026-04-29", travelers: 2, amount: 8580000, status: "Chờ xác nhận", paymentStatus: "Chưa thanh toán", providerId: "pv05" },
      { code: "BK2026040503", userId: "u08", tourId: 6, bookingDate: "2026-04-05", departureDate: "2026-04-26", travelers: 4, amount: 21160000, status: "Đã xác nhận", paymentStatus: "Đã thanh toán", providerId: "pv02" },
      { code: "BK2026032608", userId: "u02", tourId: 7, bookingDate: "2026-03-26", departureDate: "2026-05-11", travelers: 2, amount: 31980000, status: "Đã hủy", paymentStatus: "Thất bại", providerId: "pv03" },
      { code: "BK2026022813", userId: "u01", tourId: 2, bookingDate: "2026-02-28", departureDate: "2026-05-07", travelers: 2, amount: 13580000, status: "Đã xác nhận", paymentStatus: "Đã thanh toán", providerId: "pv02" },
      { code: "BK2026031106", userId: "u01", tourId: 9, bookingDate: "2026-03-11", departureDate: "2026-05-13", travelers: 2, amount: 8580000, status: "Đã hủy", paymentStatus: "Đã thanh toán", providerId: "pv05" },
      { code: "BK2026033007", userId: "u03", tourId: 10, bookingDate: "2026-03-30", departureDate: "2026-06-06", travelers: 2, amount: 37980000, status: "Đã xác nhận", paymentStatus: "Đã thanh toán", providerId: "pv04" }
    ],
    comments: [
      { id: "cm01", tourId: 1, user: "Thảo Vy", rating: 5, date: "2026-03-19", status: "Công khai", text: "Lịch trình hợp lý, HDV rất nhiệt tình, khách sạn sạch và gần biển." },
      { id: "cm02", tourId: 2, user: "Minh Khoa", rating: 5, date: "2026-03-30", status: "Công khai", text: "Resort đẹp hơn mong đợi, bữa sáng ngon, cano đảo vui." },
      { id: "cm03", tourId: 4, user: "Anh Đức", rating: 4, date: "2026-03-22", status: "Công khai", text: "Lịch trình nhiều điểm tham quan, mua sắm thoải mái." },
      { id: "cm04", tourId: 9, user: "Diễm My", rating: 5, date: "2026-03-12", status: "Đang duyệt", text: "Sapa mùa này đẹp, cáp treo Fansipan rất đáng thử." }
    ],
    services: [
      { id: "sv01", name: "Đón tiễn sân bay VIP", type: "Di chuyển", price: 450000, status: "Đang hoạt động" },
      { id: "sv02", name: "Bảo hiểm mở rộng quốc tế", type: "Bảo hiểm", price: 290000, status: "Đang hoạt động" },
      { id: "sv03", name: "Nâng hạng phòng view biển", type: "Lưu trú", price: 1200000, status: "Tạm dừng" }
    ]
  };

  const buildPaymentsFromBookings = (bookings = []) => bookings.map((booking, idx) => ({
    id: `PAY${String(idx + 1).padStart(4, "0")}`,
    bookingCode: booking.code,
    userId: booking.userId,
    method: booking.paymentMethod || (idx % 2 === 0 ? "Thẻ ngân hàng" : "Ví điện tử"),
    amount: booking.amount,
    status: booking.paymentStatus === "Đã thanh toán" ? "Thành công" : booking.paymentStatus,
    paidAt: booking.bookingDate
  }));

  const buildInvoicesFromBookings = (bookings = []) => bookings.map((booking, idx) => ({
    id: booking.invoiceId ? `INV${String(booking.invoiceId).padStart(5, "0")}` : `INV${String(idx + 1).padStart(5, "0")}`,
    bookingCode: booking.code,
    amount: booking.amount,
    status: booking.paymentStatus,
    issuedAt: booking.bookingDate,
    userId: booking.userId,
    invoiceId: booking.invoiceId || 0
  }));

  let payments = buildPaymentsFromBookings(db.bookings);
  let invoices = buildInvoicesFromBookings(db.bookings);

  const authUser = getCurrentUser();
  const currentUserId = String(authUser?.id || "u01");
  const currentRole = getCurrentRole();
  const isAdminRole = currentRole === "admin";
  let activeProviderId = String(new URLSearchParams(window.location.search).get("provider_id") || "");
  let providerDashboardData = null;
  let adminDashboardData = null;
  let adminStatsData = null;
  let adminRolesData = [];
  let adminProviderRequestsData = [];
  let notificationsData = [];
  let latestProviderRequest = null;

  const getProviderScopeId = () => {
    const fromState = Number(activeProviderId);
    if (Number.isFinite(fromState) && fromState > 0) return fromState;

    const fromQuery = Number(new URLSearchParams(window.location.search).get("provider_id"));
    if (Number.isFinite(fromQuery) && fromQuery > 0) return fromQuery;

    return 0;
  };

  const withProviderScopeParams = (params = {}) => {
    if (!isAdminRole) return params;
    const providerId = getProviderScopeId();
    return providerId > 0 ? { ...params, provider_id: providerId } : { ...params };
  };

  const withProviderScopePayload = (payload = {}) => {
    if (!isAdminRole) return payload;
    const providerId = getProviderScopeId();
    return providerId > 0 ? { ...payload, provider_id: providerId } : { ...payload };
  };

  const withProviderScopeFormData = (formData) => {
    if (!(formData instanceof FormData)) return formData;
    if (isAdminRole && !formData.has("provider_id")) {
      const providerId = getProviderScopeId();
      if (providerId > 0) {
        formData.append("provider_id", String(providerId));
      }
    }
    return formData;
  };

  const profileOwner = db.users.find((u) => String(u.id) === currentUserId);

  const defaultProfile = {
    name: authUser?.full_name || authUser?.name || profileOwner?.name || "Nguyễn Văn An",
    email: authUser?.email || profileOwner?.email || "an.nguyen@gmail.com",
    phone: authUser?.phone || profileOwner?.phone || "0908 112 223",
    avatar: authUser?.avatar || profileOwner?.avatar || "",
    city: profileOwner?.city || "TP. Hồ Chí Minh",
    address: "123 Nguyễn Huệ, Quận 1",
    birthday: "1995-06-18",
    bio: "Yêu du lịch tự túc, thích khám phá văn hóa và ẩm thực bản địa."
  };

  const profileState = { ...defaultProfile, ...readLS(LS_KEYS.profile, {}) };
  const wishlist = new Set(readLS(LS_KEYS.wishlist, []));

  const refreshDerivedCollections = () => {
    payments = buildPaymentsFromBookings(db.bookings);
    invoices = buildInvoicesFromBookings(db.bookings);
  };
  const isLoggedInUser = () => isLoggedIn();

  const getAuthDisplayUser = () => {
    const authUser = getCurrentUser();
    if (!authUser || typeof authUser !== "object") return null;

    const fullName = authUser.full_name || authUser.fullName || authUser.name || "";
    const email = authUser.email || "";
    const avatar = authUser.avatar || "";

    return {
      fullName: String(fullName || email || "Tài khoản"),
      email: String(email),
      avatar: String(avatar),
      role: getCurrentRole()
    };
  };

  const ensureActionModal = () => {
    let modalEl = document.getElementById("vhActionModal");
    if (modalEl) return modalEl;

    modalEl = document.createElement("div");
    modalEl.className = "modal fade";
    modalEl.id = "vhActionModal";
    modalEl.tabIndex = -1;
    modalEl.setAttribute("aria-hidden", "true");
    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="vhActionModalTitle">Xác nhận</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form id="vhActionModalForm">
            <div class="modal-body" id="vhActionModalBody"></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Hủy</button>
              <button type="submit" class="btn btn-primary" id="vhActionModalSubmit">Lưu</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);
    return modalEl;
  };

  const openActionModal = ({
    title = "Cập nhật",
    body = "",
    submitLabel = "Lưu",
    submitClass = "btn-primary",
    dialogClass = "",
    onSubmit
  }) => {
    const modalEl = ensureActionModal();
    const dialog = modalEl.querySelector(".modal-dialog");
    const titleEl = modalEl.querySelector("#vhActionModalTitle");
    const bodyEl = modalEl.querySelector("#vhActionModalBody");
    const submitButton = modalEl.querySelector("#vhActionModalSubmit");
    const oldForm = modalEl.querySelector("#vhActionModalForm");
    const instance = window.bootstrap?.Modal?.getOrCreateInstance(modalEl);

    titleEl.textContent = title;
    bodyEl.innerHTML = body;
    dialog.className = `modal-dialog modal-dialog-centered ${dialogClass}`.trim();
    submitButton.textContent = submitLabel;
    submitButton.className = `btn ${submitClass}`;

    const formEl = oldForm.cloneNode(true);
    oldForm.parentNode.replaceChild(formEl, oldForm);

    formEl.addEventListener("submit", async (event) => {
      event.preventDefault();
      submitButton.disabled = true;

      try {
        await onSubmit?.(new FormData(formEl), { modalEl, instance });
        instance?.hide();
      } catch (_error) {
        // Thông báo lỗi đã được xử lý tại nơi gọi nếu cần.
      } finally {
        submitButton.disabled = false;
      }
    });

    instance?.show();
  };

  const openConfirmModal = ({
    title = "Xác nhận",
    message = "Bạn có chắc muốn tiếp tục?",
    submitLabel = "Xác nhận",
    submitClass = "btn-danger",
    onConfirm
  }) => openActionModal({
    title,
    body: `<p class="mb-0">${message}</p>`,
    submitLabel,
    submitClass,
    onSubmit: async () => {
      await onConfirm?.();
    }
  });

  const escapeHtml = (value = "") =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const getNotificationUnreadCount = () => notificationsData.filter((item) => !item.isRead).length;

  const markNotificationReadLocal = (notificationId) => {
    notificationsData = notificationsData.map((item) =>
      Number(item.id) === Number(notificationId) ? { ...item, isRead: true } : item
    );
    dispatchFrontendEvent("notifications-updated", { notifications: notificationsData });
  };

  const markAllNotificationsReadLocal = () => {
    notificationsData = notificationsData.map((item) => ({ ...item, isRead: true }));
    dispatchFrontendEvent("notifications-updated", { notifications: notificationsData });
  };

  const updateProviderRequestLocal = (request = null) => {
    latestProviderRequest = request;
    if (!request) return;

    const providerRequestEntry = {
      id: Number(request.id || 0),
      company_name: request.company_name || "-",
      full_name: request.full_name || request.company_name || "-",
      city: request.city || request.address || "-",
      address: request.address || "",
      contact_email: request.contact_email || "",
      contact_phone: request.contact_phone || "",
      tax_code: request.tax_code || "",
      description: request.description || "",
      status: request.status || "pending",
      created_at: request.created_at || new Date().toISOString(),
      admin_note: request.admin_note || ""
    };

    const existingIndex = adminProviderRequestsData.findIndex((item) => Number(item.id) === Number(providerRequestEntry.id));
    if (existingIndex >= 0) adminProviderRequestsData[existingIndex] = { ...adminProviderRequestsData[existingIndex], ...providerRequestEntry };
    else adminProviderRequestsData.unshift(providerRequestEntry);
    dispatchFrontendEvent("provider-request-updated", {
      latestRequest: latestProviderRequest,
      providerRequests: adminProviderRequestsData
    });
  };

  const resolveErrorMessage = (error, fallback = "Đã xảy ra lỗi hệ thống.") => {
    if (error?.errors && typeof error.errors === "object") {
      const firstEntry = Object.values(error.errors).find((value) => Array.isArray(value) && value.length);
      if (firstEntry?.[0]) return String(firstEntry[0]);
    }

    return error?.message || fallback;
  };

  const dispatchFrontendEvent = (name, detail = {}) => {
    if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return;
    window.dispatchEvent(new CustomEvent(`vht:${name}`, { detail }));
  };

  const roleDashboardHref = (role) => {
    if (role === "admin") return routes.adminDashboard;
    if (role === "provider") return routes.providerDashboard;
    return "";
  };

  const renderRoleMenu = (role) => {
    if (role === "admin") {
      return `
        <li><a class="dropdown-item" href="${routes.profile}"><i class="bi bi-person me-2"></i>Hồ sơ</a></li>
        <li><a class="dropdown-item" href="${routes.adminDashboard}"><i class="bi bi-speedometer2 me-2"></i>Dashboard Admin</a></li>
        <li><a class="dropdown-item" href="${routes.adminUsers}"><i class="bi bi-people me-2"></i>Quản lý người dùng</a></li>
        <li><a class="dropdown-item" href="${routes.adminTours}"><i class="bi bi-map me-2"></i>Quản lý tour</a></li>
        <li><a class="dropdown-item" href="${routes.adminProviders}"><i class="bi bi-building me-2"></i>Quản lý provider</a></li>
        <li><a class="dropdown-item" href="${routes.adminStats}"><i class="bi bi-graph-up-arrow me-2"></i>Thống kê</a></li>
      `;
    }

    if (role === "provider") {
      return `
        <li><a class="dropdown-item" href="${routes.profile}"><i class="bi bi-person me-2"></i>Hồ sơ</a></li>
        <li><a class="dropdown-item" href="${routes.bookingHistory}"><i class="bi bi-journal-check me-2"></i>Lịch sử đặt tour</a></li>
        <li><a class="dropdown-item" href="${routes.providerDashboard}"><i class="bi bi-shop me-2"></i>Dashboard Provider</a></li>
        <li><a class="dropdown-item" href="${routes.providerTours}"><i class="bi bi-map me-2"></i>Quản lý tour</a></li>
        <li><a class="dropdown-item" href="${routes.providerBookings}"><i class="bi bi-card-checklist me-2"></i>Quản lý booking</a></li>
        <li><a class="dropdown-item" href="${routes.providerPromotions}"><i class="bi bi-ticket-perforated me-2"></i>Quản lý khuyến mãi</a></li>
      `;
    }

    return `
      <li><a class="dropdown-item" href="${routes.profile}"><i class="bi bi-person me-2"></i>Hồ sơ</a></li>
      <li><a class="dropdown-item" href="${routes.bookingHistory}"><i class="bi bi-journal-check me-2"></i>Lịch sử đặt tour</a></li>
      <li><a class="dropdown-item" href="${routes.wishlist}"><i class="bi bi-heart me-2"></i>Yêu thích</a></li>
    `;
  };

  const renderAuthNav = () => {
    if (!isLoggedInUser()) {
      return `
        <a class="btn btn-outline-primary" href="${routes.login}">Đăng nhập</a>
        <a class="btn btn-primary" href="${routes.register}">Đăng ký</a>
      `;
    }

    const user = getAuthDisplayUser();
    const role = user?.role || "user";
    const roleLabel = role === "admin" ? "Quản trị viên" : role === "provider" ? "Nhà cung cấp" : "Khách hàng";
    const initials = (user?.fullName || "TK")
      .split(" ")
      .map((part) => part[0] || "")
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const roleDashboard = roleDashboardHref(role);

    return `
      <div class="dropdown">
        <button class="btn btn-outline-primary dropdown-toggle d-flex align-items-center gap-2" data-bs-toggle="dropdown" aria-expanded="false">
          ${user?.avatar ? `<img src="${user.avatar}" alt="${user.fullName}" class="rounded-circle" style="width: 28px; height: 28px; object-fit: cover;" />` : `<span class="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center" style="width: 28px; height: 28px; font-size: 0.72rem; font-weight: 700;">${initials}</span>`}
          <span class="text-truncate" style="max-width: 120px;">${user?.fullName || "Tài khoản"}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow-sm">
          <li class="dropdown-header">
            <div class="fw-semibold">${user?.fullName || "Tài khoản"}</div>
            <small class="text-muted">${roleLabel}</small>
          </li>
          <li><hr class="dropdown-divider" /></li>
          ${renderRoleMenu(role)}
          ${roleDashboard ? `<li><a class="dropdown-item" href="${routes.home}"><i class="bi bi-house-door me-2"></i>Khu người dùng</a></li>` : ""}
          <li><hr class="dropdown-divider" /></li>
          <li><a class="dropdown-item text-danger" href="#" data-action="logout"><i class="bi bi-box-arrow-right me-2"></i>Đăng xuất</a></li>
        </ul>
      </div>
    `;
  };

  const getProviderById = (id) => db.providers.find((provider) => String(provider.id) === String(id));
  const getTourById = (id) => db.tours.find((tour) => String(tour.id) === String(id));
  const getPromotionByCode = (code) => db.promotions.find((promo) => promo.code === code);
  const addQuery = (url, query) => `${url}?${new URLSearchParams(query).toString()}`;
  const getInvoiceForBooking = (booking) => {
    if (!booking) return null;

    if (booking.invoiceId) {
      const byId = invoices.find((item) => Number(item.invoiceId) === Number(booking.invoiceId));
      if (byId) return byId;
    }

    return invoices.find((item) => String(item.bookingCode) === String(booking.code)) || null;
  };

  const downloadInvoicePdf = async (booking) => {
    const invoiceRecord = getInvoiceForBooking(booking);
    const invoiceId = Number(invoiceRecord?.invoiceId || booking?.invoiceId || 0);
    const bookingCode = String(booking?.code || invoiceRecord?.bookingCode || "");

    if (!invoiceId) {
      showToast("Hóa đơn chưa sẵn sàng để tải.", "warning");
      return;
    }

    if (bookingCode && !page.startsWith("admin-") && !page.startsWith("provider-")) {
      const printUrl = addQuery(routes.invoice, { code: bookingCode, print: 1, export: "pdf" });
      window.open(printUrl, "_blank", "noopener,noreferrer");
      showToast("Đã mở hóa đơn ở chế độ in PDF Unicode.", "info");
      return;
    }

    try {
      const file = await apiGetBlob(`/invoices/${invoiceId}/pdf`);
      const blob = file?.blob;
      if (!(blob instanceof Blob)) {
        throw new Error("Không nhận được dữ liệu file hóa đơn.");
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const code = invoiceRecord?.id || `INV-${booking?.code || invoiceId}`;
      anchor.href = url;
      anchor.download = `${String(code).replace(/[^\w-]+/g, "_")}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      showToast("Đã tải hóa đơn PDF.");
    } catch (error) {
      showToast(error?.message || "Không thể tải hóa đơn lúc này.", "danger");
    }
  };

  const getUserBookings = () => db.bookings.filter((booking) => String(booking.userId) === String(currentUserId));
  const getDefaultUserBooking = () => getUserBookings()[0] || null;
  const findUserBookingByCode = (code) => {
    if (!code) return getDefaultUserBooking();
    return getUserBookings().find((booking) => String(booking.code) === String(code)) || getDefaultUserBooking();
  };


  const tourCard = (tour) => {
    const liked = wishlist.has(tour.id);
    return `
      <article class="tour-card card fade-in-up">
        <div class="tour-image-wrap">
          <img src="${tour.image}" alt="${tour.name}" loading="lazy" />
          <button type="button" class="card-float-action ${liked ? "text-danger" : ""}" data-action="toggle-wishlist" data-tour-id="${tour.id}">
            <i class="bi ${liked ? "bi-heart-fill" : "bi-heart"}"></i>
          </button>
          ${tour.badge ? `<span class="badge-soft position-absolute start-0 top-0 m-3">${tour.badge}</span>` : ""}
        </div>
        <div class="card-body d-flex flex-column">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="tour-meta"><i class="bi bi-geo-alt me-1"></i>${tour.location}</span>
            <span class="tour-meta"><i class="bi bi-clock me-1"></i>${tour.duration}N${tour.nights}Đ</span>
          </div>
          <h5 class="mb-2">${tour.name}</h5>
          <div class="tour-meta mb-3"><i class="bi bi-calendar2-week me-1"></i>Khởi hành: ${dateVN(tour.departureDates[0])}</div>
          <div class="d-flex align-items-center justify-content-between mb-3">
            <div>
              <span class="price-old d-block">${vnd(tour.oldPrice)}</span>
              <span class="price-new">${vnd(tour.price)}</span>
            </div>
            <div class="text-end">
              ${starHTML(tour.rating)}
              <div class="tour-meta">${tour.rating} (${tour.reviews})</div>
            </div>
          </div>
          <a href="${addQuery(routes.tourDetail, { id: tour.id })}" class="btn btn-primary w-100 mt-auto">Xem chi tiết</a>
        </div>
      </article>
    `;
  };

  const miniPostCard = (post) => `
    <article class="post-card h-100 p-3 fade-in-up">
      <img src="${post.image}" alt="${post.title}" class="w-100 rounded-4 mb-3" style="height: 190px; object-fit: cover;" />
      <span class="badge-soft mb-2 d-inline-flex">${post.category}</span>
      <h5 class="mb-2">${post.title}</h5>
      <p class="text-muted mb-3">${post.excerpt}</p>
      <div class="d-flex justify-content-between align-items-center mt-auto">
        <small class="text-muted"><i class="bi bi-calendar-event me-1"></i>${dateVN(post.date)}</small>
        <a href="${addQuery(routes.postDetail, { id: post.id })}" class="fw-bold text-primary">Xem thêm</a>
      </div>
    </article>
  `;
  const publicHeader = (active) => `
    <header class="public-header">
      <div class="container py-2">
        <nav class="navbar navbar-expand-lg p-0">
          <a class="navbar-brand d-flex align-items-center gap-2" href="${routes.home}">
            <span class="brand-mark"><i class="bi bi-compass"></i></span>
            <span class="brand-name">Viet Horizon Travel</span>
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navPublic">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navPublic">
            <ul class="navbar-nav mx-auto gap-lg-3 mt-3 mt-lg-0">
              <li class="nav-item"><a class="nav-link nav-link-main ${active === "home" ? "active" : ""}" href="${routes.home}">Trang chủ</a></li>
              <li class="nav-item"><a class="nav-link nav-link-main ${active === "tours" || active === "tour-detail" ? "active" : ""}" href="${routes.tours}">Tour</a></li>
              <li class="nav-item"><a class="nav-link nav-link-main ${active === "promotions" ? "active" : ""}" href="${routes.promotions}">Khuyến mãi</a></li>
              <li class="nav-item"><a class="nav-link nav-link-main ${active === "posts" || active === "post-detail" ? "active" : ""}" href="${routes.posts}">Bài viết</a></li>
              <li class="nav-item"><a class="nav-link nav-link-main ${active === "contact" ? "active" : ""}" href="${routes.contact}">Liên hệ</a></li>
            </ul>
            <div class="d-flex flex-wrap gap-2 mt-3 mt-lg-0">
              ${renderAuthNav()}
            </div>
          </div>
        </nav>
      </div>
    </header>
  `;

  const publicFooter = () => `
    <footer class="site-footer">
      <div class="container">
        <div class="row g-4">
          <div class="col-lg-4">
            <div class="d-flex align-items-center gap-2 mb-3">
              <span class="brand-mark"><i class="bi bi-compass"></i></span>
              <span class="brand-name text-white">Viet Horizon Travel</span>
            </div>
            <p>Nền tảng đặt tour du lịch cao cấp, minh bạch thanh toán và hỗ trợ 24/7 cho mọi hành trình.</p>
            <div class="d-flex gap-2">
              <span class="badge-soft">Bảo mật PCI-DSS</span>
              <span class="badge-soft">Hoàn tiền nhanh</span>
            </div>
          </div>
          <div class="col-md-4 col-lg-2">
            <h6>Khám phá</h6>
            <p><a href="${routes.tours}">Tour trong nước</a></p>
            <p><a href="${routes.tours}">Tour quốc tế</a></p>
            <p><a href="${routes.promotions}">Khuyến mãi</a></p>
            <p><a href="${routes.posts}">Tin tức du lịch</a></p>
          </div>
          <div class="col-md-4 col-lg-3">
            <h6>Tài khoản</h6>
            <p><a href="${routes.profile}">Hồ sơ cá nhân</a></p>
            <p><a href="${routes.bookingHistory}">Lịch sử đặt tour</a></p>
            <p><a href="${routes.wishlist}">Tour yêu thích</a></p>
          </div>
          <div class="col-md-4 col-lg-3">
            <h6>Liên hệ</h6>
            <p><i class="bi bi-telephone me-2"></i>1900 6886</p>
            <p><i class="bi bi-envelope me-2"></i>support@viethorizon.vn</p>
            <p><i class="bi bi-geo-alt me-2"></i>25 Nguyễn Huệ, Q.1, TP.HCM</p>
          </div>
        </div>
        <hr class="border-light border-opacity-25 mt-4" />
        <div class="d-flex flex-wrap justify-content-between gap-2">
          <small>© <span id="footerYear"></span> Viet Horizon Travel. All rights reserved.</small>
          <small>Điều khoản sử dụng • Chính sách bảo mật • Chính sách hoàn hủy</small>
        </div>
      </div>
    </footer>
  `;

  const publicLayout = (active, content) => `${publicHeader(active)}${content}${publicFooter()}`;

  const providerShell = (active, title, subtitle, content) => {
    const links = [
      { key: "provider-dashboard", icon: "bi-speedometer2", label: "Dashboard", href: routes.providerDashboard },
      { key: "provider-profile", icon: "bi-building", label: "Thông tin NCC", href: routes.providerProfile },
      { key: "provider-tours", icon: "bi-map", label: "Tour của tôi", href: routes.providerTours },
      { key: "provider-tour-form", icon: "bi-plus-square", label: "Thêm tour", href: routes.providerTourForm },
      { key: "provider-bookings", icon: "bi-journal-check", label: "Booking", href: routes.providerBookings },
      { key: "provider-services", icon: "bi-stars", label: "Dịch vụ", href: routes.providerServices },
      { key: "provider-promotions", icon: "bi-ticket-perforated", label: "Khuyến mãi", href: routes.providerPromotions },
      { key: "provider-feedback", icon: "bi-chat-left-text", label: "Phản hồi", href: routes.providerFeedback }
    ];

    return `
      <div class="dashboard-shell">
        <aside class="dash-sidebar">
          <a href="${routes.providerDashboard}" class="d-flex align-items-center gap-2 mb-4">
            <span class="brand-mark"><i class="bi bi-compass"></i></span>
            <span class="brand-name">VHT Provider</span>
          </a>
          <p class="sidebar-section-title text-muted text-uppercase small mb-2">Điều hướng</p>
          <nav>
            ${links.map((item) => `<a href="${item.href}" class="sidebar-link ${active === item.key ? "active" : ""}"><i class="bi ${item.icon}"></i><span class="link-label">${item.label}</span></a>`).join("")}
          </nav>
          <div class="panel-card p-3 mt-4">
            <div class="small text-muted mb-1">Hỗ trợ nhà cung cấp</div>
            <strong>Hotline: 1900 6886</strong>
            <p class="small text-muted mb-0">Đội vận hành hỗ trợ 08:00 - 22:00 mỗi ngày.</p>
          </div>
        </aside>
        <main class="dash-main">
          <div class="dash-topbar d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div class="input-group" style="max-width: 380px;"><span class="input-group-text bg-white"><i class="bi bi-search"></i></span><input class="form-control" type="search" placeholder="Tìm booking, tour, khách hàng..." /></div>
            <div class="d-flex align-items-center gap-2"><button class="btn btn-outline-primary" type="button"><i class="bi bi-bell"></i></button>${renderAuthNav()}</div>
          </div>
          <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
            <div><h3 class="mb-1">${title}</h3><p class="text-muted mb-0">${subtitle}</p></div>
            <div><a href="${routes.providerTourForm}" class="btn btn-primary"><i class="bi bi-plus-lg me-1"></i>Tạo tour mới</a></div>
          </div>
          ${content}
        </main>
      </div>
    `;
  };

  const adminShell = (active, title, subtitle, content) => {
    const links = [
      { key: "admin-dashboard", icon: "bi-grid", label: "Dashboard", href: routes.adminDashboard },
      { key: "admin-users", icon: "bi-people", label: "Người dùng", href: routes.adminUsers },
      { key: "admin-roles", icon: "bi-shield-lock", label: "Phân quyền", href: routes.adminRoles },
      { key: "admin-tours", icon: "bi-map", label: "Tour", href: routes.adminTours },
      { key: "admin-categories", icon: "bi-bookmarks", label: "Danh mục", href: routes.adminCategories },
      { key: "admin-bookings", icon: "bi-receipt", label: "Đơn đặt", href: routes.adminBookings },
      { key: "admin-payments", icon: "bi-credit-card-2-front", label: "Thanh toán", href: routes.adminPayments },
      { key: "admin-invoices", icon: "bi-file-earmark-text", label: "Hóa đơn", href: routes.adminInvoices },
      { key: "admin-posts", icon: "bi-file-richtext", label: "Bài viết", href: routes.adminPosts },
      { key: "admin-promotions", icon: "bi-ticket-perforated", label: "Khuyến mãi", href: routes.adminPromotions },
      { key: "admin-providers", icon: "bi-building", label: "Nhà cung cấp", href: routes.adminProviders },
      { key: "admin-comments", icon: "bi-chat-left-dots", label: "Bình luận", href: routes.adminComments },
      { key: "admin-stats", icon: "bi-bar-chart", label: "Thống kê", href: routes.adminStats }
    ];

    return `
      <div class="dashboard-shell">
        <aside class="dash-sidebar">
          <a href="${routes.adminDashboard}" class="d-flex align-items-center gap-2 mb-4 text-white"><span class="brand-mark"><i class="bi bi-compass"></i></span><span class="brand-name">VHT Admin</span></a>
          <p class="sidebar-section-title text-uppercase small mb-2">Quản trị hệ thống</p>
          <nav>${links.map((item) => `<a href="${item.href}" class="sidebar-link ${active === item.key ? "active" : ""}"><i class="bi ${item.icon}"></i><span class="link-label">${item.label}</span></a>`).join("")}</nav>
          <div class="panel-card p-3 mt-4 bg-transparent border border-light border-opacity-25 text-white"><div class="small text-white-50 mb-1">Phiên làm việc</div><strong>Admin Super</strong><p class="small text-white-50 mb-0">Bảo mật 2 lớp đang bật.</p></div>
        </aside>
        <main class="dash-main">
          <div class="dash-topbar d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div class="input-group" style="max-width: 380px;"><span class="input-group-text bg-white"><i class="bi bi-search"></i></span><input class="form-control" type="search" placeholder="Tìm dữ liệu hệ thống..." /></div>
            <div class="d-flex align-items-center gap-2"><button class="btn btn-light border" type="button"><i class="bi bi-download me-1"></i>Export</button><button class="btn btn-outline-primary" type="button"><i class="bi bi-bell"></i></button>${renderAuthNav()}</div>
          </div>
          <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2"><div><h3 class="mb-1">${title}</h3><p class="text-muted mb-0">${subtitle}</p></div></div>
          ${content}
        </main>
      </div>
    `;
  };

  const renderSmartTable = ({ title, subtitle, addLabel = "", addHref = "#", addAction = "", filters = [], headers = [], rows = [], pageSize = 8 }) => {
    const headerCols = headers.map((col) => `<th>${col}</th>`).join("");
    const filterMarkup = filters
      .map((filter) => `<select class="form-select table-filter" data-field="${filter.field}"><option value="">${filter.label}</option>${filter.options.map((option) => `<option value="${option}">${option}</option>`).join("")}</select>`)
      .join("");

    const rowMarkup = rows
      .map((row) => {
        const attrs = row.attrs ? Object.entries(row.attrs).map(([key, value]) => `data-${key.toLowerCase()}="${value}"`).join(" ") : "";
        return `<tr data-search="${row.search}" ${attrs}><td><input type="checkbox" class="form-check-input row-check" /></td>${row.cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`;
      })
      .join("");

    return `
      <section class="table-card smart-table-wrap" data-page-size="${pageSize}">
        <div class="table-toolkit">
          <div><h5 class="mb-1">${title}</h5><p class="text-muted small mb-0">${subtitle}</p></div>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <input type="search" class="form-control table-search" placeholder="Tìm kiếm nhanh..." />
            ${filterMarkup}
            ${addLabel ? (addAction ? `<button type="button" class="btn btn-primary" data-action="${addAction}">${addLabel}</button>` : `<a href="${addHref}" class="btn btn-primary">${addLabel}</a>`) : ""}
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover smart-table">
            <thead><tr><th style="width: 46px;"><input type="checkbox" class="form-check-input select-all" /></th>${headerCols}</tr></thead>
            <tbody>${rowMarkup}</tbody>
          </table>
        </div>
        <div class="empty-state d-none mt-3">Không tìm thấy dữ liệu phù hợp bộ lọc hiện tại.</div>
        <div class="smart-pagination"></div>
      </section>
    `;
  };
  const renderHome = () => {
    const popularTours = db.tours.slice(0, 6);
    const promoTours = db.tours.filter((tour) => tour.oldPrice > tour.price).slice(0, 4);

    return publicLayout(
      "home",
      `
      <main>
        <section class="pt-4">
          <div class="container">
            <div class="hero-surface fade-in-up" style="--hero-image:url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2000&q=80');">
              <div class="hero-content">
                <span class="badge-soft mb-3 d-inline-flex">Nền tảng đặt tour cao cấp</span>
                <h1 class="hero-title">Mở lối hành trình mới, chạm đến những trải nghiệm đáng nhớ</h1>
                <p class="hero-lead mt-3">Tìm kiếm tour nhanh, thanh toán an toàn và theo dõi booking minh bạch trên một nền tảng duy nhất.</p>
                <div class="d-flex flex-wrap gap-2 mt-4">
                  <a href="${routes.tours}" class="btn btn-warning-soft btn-lg">Khám phá tour ngay</a>
                  <a href="${routes.posts}" class="btn btn-outline-light btn-lg">Xem cẩm nang du lịch</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="search-panel">
          <div class="container">
            <div class="search-card p-3 p-lg-4">
              <div class="row g-3 align-items-end">
                <div class="col-lg-3 col-md-6"><label class="form-label">Điểm đến</label><select id="quickDestination" class="form-select"><option value="">Tất cả điểm đến</option>${[...new Set(db.tours.map((tour) => tour.location))].map((location) => `<option value="${location}">${location}</option>`).join("")}</select></div>
                <div class="col-lg-3 col-md-6"><label class="form-label">Thời gian</label><select id="quickDuration" class="form-select"><option value="">Mọi thời lượng</option><option value="3">3 ngày</option><option value="4">4 ngày</option><option value="5">5 ngày</option><option value="6">6 ngày trở lên</option></select></div>
                <div class="col-lg-3 col-md-6"><label class="form-label">Ngân sách</label><select id="quickBudget" class="form-select"><option value="">Mọi mức giá</option><option value="0-5000000">Dưới 5 triệu</option><option value="5000000-10000000">5 - 10 triệu</option><option value="10000000-20000000">10 - 20 triệu</option><option value="20000000-999999999">Trên 20 triệu</option></select></div>
                <div class="col-lg-3 col-md-6"><button class="btn btn-primary w-100" data-action="quick-search"><i class="bi bi-search me-2"></i>Tìm tour phù hợp</button></div>
              </div>
            </div>
          </div>
        </section>

        <section class="section-block">
          <div class="container">
            <h2 class="section-title">Danh mục nổi bật</h2>
            <p class="section-subtitle mb-4">Chọn phong cách du lịch đúng gu để tối ưu trải nghiệm cho chuyến đi tiếp theo.</p>
            <div class="row g-3">
              ${db.categories.map((category, index) => `<div class="col-md-6 col-lg-4"><div class="reason-card p-4 h-100 fade-in-up delay-${index % 3}"><span class="reason-icon mb-3"><i class="bi ${category.icon}"></i></span><h5 class="mb-1">${category.name}</h5><p class="text-muted mb-3">${category.tours}+ tour đã được kiểm duyệt chất lượng.</p><a href="${routes.tours}" class="fw-bold text-primary">Xem danh mục</a></div></div>`).join("")}
            </div>
          </div>
        </section>

        <section class="section-block pt-0">
          <div class="container">
            <div class="d-flex flex-wrap justify-content-between gap-2 align-items-end mb-4"><div><h2 class="section-title">Tour phổ biến</h2><p class="section-subtitle mb-0">Những hành trình được đặt nhiều và đánh giá cao trong 30 ngày gần nhất.</p></div><a href="${routes.tours}" class="btn btn-outline-primary">Xem tất cả tour</a></div>
            <div class="row g-4">${popularTours.map((tour) => `<div class="col-md-6 col-xl-4">${tourCard(tour)}</div>`).join("")}</div>
          </div>
        </section>

        <section class="section-block pt-0">
          <div class="container">
            <div class="row g-4 align-items-center mb-4"><div class="col-lg-7"><h2 class="section-title">Ưu đãi khuyến mãi theo mùa</h2><p class="section-subtitle mb-0">Áp dụng linh hoạt cho nhóm bạn và gia đình, cập nhật liên tục trên từng tour.</p></div><div class="col-lg-5 text-lg-end"><a href="${routes.promotions}" class="btn btn-warning-soft">Xem toàn bộ khuyến mãi</a></div></div>
            <div class="row g-4">${promoTours.map((tour) => `<div class="col-md-6 col-xl-3">${tourCard(tour)}</div>`).join("")}</div>
          </div>
        </section>

        <section class="section-block pt-0">
          <div class="container"><div class="row g-4">
            <div class="col-lg-3 col-md-6"><div class="reason-card p-4 h-100"><span class="reason-icon mb-3"><i class="bi bi-shield-check"></i></span><h5>Thanh toán an toàn</h5><p class="text-muted mb-0">Hỗ trợ nhiều phương thức thanh toán và xác nhận tức thì.</p></div></div>
            <div class="col-lg-3 col-md-6"><div class="reason-card p-4 h-100"><span class="reason-icon mb-3"><i class="bi bi-stars"></i></span><h5>Tour được kiểm duyệt</h5><p class="text-muted mb-0">Nhà cung cấp uy tín, chính sách rõ ràng và đánh giá minh bạch.</p></div></div>
            <div class="col-lg-3 col-md-6"><div class="reason-card p-4 h-100"><span class="reason-icon mb-3"><i class="bi bi-headset"></i></span><h5>Hỗ trợ 24/7</h5><p class="text-muted mb-0">Đội ngũ CSKH đồng hành từ lúc đặt đến khi kết thúc tour.</p></div></div>
            <div class="col-lg-3 col-md-6"><div class="reason-card p-4 h-100"><span class="reason-icon mb-3"><i class="bi bi-arrow-repeat"></i></span><h5>Chính sách linh hoạt</h5><p class="text-muted mb-0">Dễ dàng đổi lịch hoặc hủy theo điều kiện từng sản phẩm.</p></div></div>
          </div></div>
        </section>

        <section class="section-block pt-0"><div class="container"><div class="row g-4">${db.comments.slice(0, 3).map((comment) => `<div class="col-lg-4"><div class="testimonial-card p-4 h-100"><div class="d-flex justify-content-between align-items-center mb-2"><strong>${comment.user}</strong>${starHTML(comment.rating)}</div><p class="text-muted mb-3">“${comment.text}”</p><small class="text-muted">Tour: ${getTourById(comment.tourId)?.name || "-"}</small></div></div>`).join("")}</div></div></section>

        <section class="section-block pt-0"><div class="container"><div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4"><div><h2 class="section-title">Bài viết truyền cảm hứng</h2><p class="section-subtitle mb-0">Cập nhật kinh nghiệm và xu hướng du lịch mới nhất.</p></div><a href="${routes.posts}" class="btn btn-outline-primary">Xem tất cả bài viết</a></div><div class="row g-4">${db.posts.slice(0, 3).map((post) => `<div class="col-lg-4">${miniPostCard(post)}</div>`).join("")}</div></div></section>

        <section class="section-block pt-0"><div class="container"><div class="newsletter-wrap p-4 p-lg-5"><div class="row align-items-center g-3"><div class="col-lg-7"><h3 class="text-white">Nhận ưu đãi tour mỗi tuần</h3><p class="mb-0 text-white-50">Đăng ký để nhận mã giảm giá độc quyền và cẩm nang lịch trình miễn phí.</p></div><div class="col-lg-5"><form class="d-flex gap-2" id="newsletterForm"><input type="email" class="form-control" placeholder="Nhập email của bạn" required /><button class="btn btn-warning-soft" type="submit">Đăng ký</button></form></div></div></div></div></section>
      </main>
      `
    );
  };

  const renderToursPage = () => {
    const locations = [...new Set(db.tours.map((tour) => tour.location))];
    const types = [...new Set(db.tours.map((tour) => tour.type))];
    const isPromoMode = new URLSearchParams(window.location.search).get("promo") !== null;
    const promoCount = db.tours.filter((tour) => tour.oldPrice > tour.price).length;

    return publicLayout(
      "tours",
      `
      <main class="section-block pt-4">
        <div class="container">
          <section class="page-banner mb-4" style="--banner-image:url('https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=1600&q=80');"><div class="page-banner-content"><nav aria-label="breadcrumb"><ol class="breadcrumb mb-2"><li class="breadcrumb-item"><a href="${routes.home}" class="text-white-50">Trang chủ</a></li><li class="breadcrumb-item active text-white" aria-current="page">Danh sách tour</li></ol></nav><h2 class="mb-2">Khám phá tour phù hợp phong cách của bạn</h2><p class="mb-0 text-white-50">Lọc theo điểm đến, ngân sách, loại tour và thời lượng chỉ trong vài giây.</p></div></section>
          ${isPromoMode ? `<div class="alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4"><div><strong><i class="bi bi-ticket-perforated me-1"></i>Đang xem tour khuyến mãi</strong><div class="small">Hiện có ${promoCount} tour đang giảm giá.</div></div><a href="${routes.tours}" class="btn btn-sm btn-outline-dark">Xem toàn bộ tour</a></div>` : ""}

          <div class="row g-4">
            <div class="col-lg-3"><aside class="filter-sidebar p-3 p-lg-4"><div class="d-flex justify-content-between align-items-center mb-3"><h5 class="mb-0">Bộ lọc</h5><button class="btn btn-sm btn-outline-primary" id="resetTourFilters">Đặt lại</button></div>
              <div class="mb-3"><label class="form-label">Từ khóa</label><input id="filterKeyword" type="search" class="form-control" placeholder="Tên tour, điểm đến..." /></div>
              <div class="mb-3"><label class="form-label">Địa điểm</label><select id="filterLocation" class="form-select"><option value="">Tất cả</option>${locations.map((location) => `<option value="${location}">${location}</option>`).join("")}</select></div>
              <div class="mb-3"><label class="form-label">Khoảng giá</label><select id="filterPrice" class="form-select"><option value="">Tất cả</option><option value="0-5000000">Dưới 5 triệu</option><option value="5000000-10000000">5 - 10 triệu</option><option value="10000000-20000000">10 - 20 triệu</option><option value="20000000-999999999">Trên 20 triệu</option></select></div>
              <div class="mb-3"><label class="form-label">Loại tour</label><select id="filterType" class="form-select"><option value="">Tất cả</option>${types.map((type) => `<option value="${type}">${type}</option>`).join("")}</select></div>
              <div class="mb-3"><label class="form-label">Số ngày</label><select id="filterDuration" class="form-select"><option value="">Tất cả</option><option value="3">3 ngày</option><option value="4">4 ngày</option><option value="5">5 ngày</option><option value="6">6 ngày trở lên</option></select></div>
              <div><label class="form-label">Đánh giá</label><select id="filterRating" class="form-select"><option value="">Mọi mức</option><option value="4.0">Từ 4.0 trở lên</option><option value="4.5">Từ 4.5 trở lên</option><option value="4.8">Từ 4.8 trở lên</option></select></div>
            </aside></div>

            <div class="col-lg-9">
              <div class="panel-card p-3 mb-3"><div class="d-flex flex-wrap justify-content-between align-items-center gap-2"><div><strong id="toursResultCount">0</strong> tour phù hợp</div><div class="d-flex gap-2 align-items-center"><label for="sortTours" class="text-muted small">Sắp xếp:</label><select id="sortTours" class="form-select"><option value="newest">Mới nhất</option><option value="price-asc">Giá tăng dần</option><option value="price-desc">Giá giảm dần</option><option value="popular">Phổ biến</option></select></div></div></div>
              <div class="row g-4" id="toursGrid"></div>
              <div class="empty-state mt-3 d-none" id="toursEmptyState">Không có tour phù hợp, hãy thử bộ lọc khác.</div>
              <div class="smart-pagination justify-content-center mt-4" id="toursPagination"></div>
            </div>
          </div>
        </div>
      </main>
      `
    );
  };

  const renderPromotionsPage = () => {
    const activePromos = db.promotions.filter((promo) => {
      const normalized = String(promo.status || "").toLowerCase();
      return normalized === "active" || normalized.includes("đang hoạt động");
    });
    const promoTours = db.tours.filter((tour) => tour.oldPrice > tour.price);

    return publicLayout(
      "promotions",
      `
      <main class="section-block pt-4">
        <div class="container">
          <section class="page-banner mb-4" style="--banner-image:url('https://images.unsplash.com/photo-1468818438311-4bab781ab9b8?auto=format&fit=crop&w=1600&q=80');">
            <div class="page-banner-content">
              <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-2">
                  <li class="breadcrumb-item"><a href="${routes.home}" class="text-white-50">Trang chủ</a></li>
                  <li class="breadcrumb-item active text-white" aria-current="page">Khuyến mãi</li>
                </ol>
              </nav>
              <h2 class="mb-2">Ưu đãi khuyến mãi đang áp dụng</h2>
              <p class="mb-0 text-white-50">Tổng hợp mã giảm giá và các tour đang có giá tốt nhất tuần này.</p>
            </div>
          </section>

          <div class="alert alert-info d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
            <div><strong>Có ${activePromos.length} mã giảm giá đang hoạt động</strong><div class="small">Bạn có thể sao chép mã ngay để áp dụng ở bước đặt tour.</div></div>
            <a href="${routes.tours}" class="btn btn-sm btn-outline-primary">Xem toàn bộ tour</a>
          </div>

          <section class="mb-4">
            <div class="row g-3">
              ${activePromos
                .map(
                  (promo) => `
                <div class="col-md-6 col-lg-4">
                  <article class="panel-card p-3 p-lg-4 h-100">
                    <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <span class="badge-soft"><i class="bi bi-ticket-perforated me-1"></i>${promo.code}</span>
                      ${statusBadge(promo.status)}
                    </div>
                    <h5 class="mb-2">${promo.title}</h5>
                    <p class="text-muted mb-3">Giá trị: <strong>${promo.type === "percent" ? `${promo.value}%` : vnd(promo.value)}</strong></p>
                    <div class="small text-muted mb-3">Hiệu lực: ${dateVN(promo.start)} - ${dateVN(promo.end)}</div>
                    <div class="d-flex gap-2">
                      <button class="btn btn-primary btn-sm" data-action="copy-promo-code" data-code="${promo.code}">Sao chép mã</button>
                      <a href="${routes.tours}" class="btn btn-outline-primary btn-sm">Xem tour áp dụng</a>
                    </div>
                  </article>
                </div>
              `
                )
                .join("")}
            </div>
          </section>

          <section>
            <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
              <div>
                <h3 class="section-title mb-1">Tour đang giảm giá</h3>
                <p class="section-subtitle mb-0">Danh sách tour có giá ưu đãi cập nhật theo thời gian thực.</p>
              </div>
              <a href="${routes.tours}" class="btn btn-outline-primary">Xem tất cả tour</a>
            </div>
            <div class="row g-4">
              ${promoTours.map((tour) => `<div class="col-md-6 col-xl-4">${tourCard(tour)}</div>`).join("")}
            </div>
            ${promoTours.length === 0 ? '<div class="empty-state mt-3">Hiện chưa có tour giảm giá. Vui lòng quay lại sau.</div>' : ""}
          </section>
        </div>
      </main>
      `
    );
  };

  const renderTourDetailPage = () => {
    const params = new URLSearchParams(window.location.search);
    const tour = getTourById(params.get("id")) || db.tours[0];    const provider = getProviderById(tour.providerId);
    const providerData = {
      name: tour.providerName || provider?.name || "Viet Horizon Partner",
      email: tour.providerEmail || provider?.email || "support@viethorizon.vn",
      phone: tour.providerPhone || provider?.phone || "",
      city: provider?.city || "Việt Nam",
      rating: provider?.rating || 4.7
    };
    const related = db.tours.filter((item) => item.id !== tour.id).slice(0, 3);
    const comments = db.comments.filter((comment) => comment.tourId === tour.id);

    return publicLayout(
      "tour-detail",
      `
      <main class="section-block pt-4"><div class="container"><div class="mb-3"><a href="${routes.tours}" class="text-primary fw-bold"><i class="bi bi-arrow-left me-1"></i>Quay lại danh sách tour</a></div>
      <div class="row g-4"><div class="col-lg-8">
        <div class="panel-card p-3 p-lg-4 mb-4"><img id="detailMainImage" src="${tour.gallery[0]}" class="tour-gallery-main mb-3" alt="${tour.name}" /><div class="row g-2">${tour.gallery.map((img, index) => `<div class="col-4"><img src="${img}" class="gallery-thumb ${index === 0 ? "border border-primary border-2" : ""}" data-gallery-thumb="${img}" alt="${tour.name}" /></div>`).join("")}</div></div>
        <div class="panel-card p-3 p-lg-4 mb-4"><span class="badge-soft mb-2 d-inline-flex">${tour.type}</span><h2>${tour.name}</h2><div class="d-flex flex-wrap gap-3 text-muted mb-3"><span>${starHTML(tour.rating)} ${tour.rating} (${tour.reviews} đánh giá)</span><span><i class="bi bi-people me-1"></i>${tour.booked}+ lượt đặt</span><span><i class="bi bi-geo-alt me-1"></i>${tour.location}</span></div><p>${tour.shortDesc}</p>
          <div class="row g-3"><div class="col-md-6"><div class="invoice-meta p-3"><div class="small text-muted">Điểm khởi hành</div><strong>${tour.startPoint}</strong></div></div><div class="col-md-6"><div class="invoice-meta p-3"><div class="small text-muted">Điểm đến</div><strong>${tour.endPoint}</strong></div></div><div class="col-md-6"><div class="invoice-meta p-3"><div class="small text-muted">Thời lượng</div><strong>${tour.duration} ngày ${tour.nights} đêm</strong></div></div><div class="col-md-6"><div class="invoice-meta p-3"><div class="small text-muted">Giá từ</div><strong class="text-primary">${vnd(tour.price)}</strong></div></div></div>
        </div>

        <div class="panel-card p-3 p-lg-4 mb-4">
          <ul class="nav nav-tabs border-0 mb-3" role="tablist"><li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tabOverview" type="button">Tổng quan</button></li><li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabItinerary" type="button">Lịch trình</button></li><li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabInclude" type="button">Dịch vụ bao gồm</button></li><li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabPolicy" type="button">Chính sách</button></li><li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabReview" type="button">Đánh giá</button></li></ul>
          <div class="tab-content pt-2">
            <div class="tab-pane fade show active" id="tabOverview"><p>${tour.shortDesc}</p><ul>${tour.itinerary.map((item) => `<li>${item}</li>`).join("")}</ul></div>
            <div class="tab-pane fade" id="tabItinerary"><ol class="mb-0">${tour.itinerary.map((item) => `<li class="mb-2">${item}</li>`).join("")}</ol></div>
            <div class="tab-pane fade" id="tabInclude"><ul class="mb-0">${tour.includes.map((item) => `<li class="mb-2">${item}</li>`).join("")}</ul></div>
            <div class="tab-pane fade" id="tabPolicy"><ul class="mb-0">${tour.policy.map((item) => `<li class="mb-2">${item}</li>`).join("")}</ul></div>
            <div class="tab-pane fade" id="tabReview">${comments.length ? comments.map((comment) => {
              const canManageComment = isLoggedInUser() && (String(comment.userId) === String(currentUserId) || getCurrentRole() === "admin");
              return `<article class="border rounded-4 p-3 mb-3">
                <div class="d-flex justify-content-between align-items-start gap-3 mb-1">
                  <div>
                    <strong>${comment.user}</strong>
                    <div>${starHTML(comment.rating)}</div>
                  </div>
                  ${canManageComment ? `<div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-outline-primary" type="button" data-action="user-review-edit" data-comment-id="${comment.commentId}" data-rating-id="${comment.ratingId}" data-score="${comment.rating}" data-content="${escapeHtml(comment.content || comment.text || "")}" data-review="${escapeHtml(comment.review || comment.text || "")}">Sửa</button>
                    <button class="btn btn-sm btn-outline-danger" type="button" data-action="user-review-delete" data-comment-id="${comment.commentId}" data-rating-id="${comment.ratingId}">Xóa</button>
                  </div>` : ""}
                </div>
                <small class="text-muted d-block mb-2">${dateVN(comment.date)}</small>
                <p class="mb-0">${comment.text}</p>
              </article>`;
            }).join("") : '<div class="empty-state">Chưa có đánh giá cho tour này.</div>'}</div>
          </div>
        </div>

        <div class="panel-card p-3 p-lg-4"><h5 class="mb-3">Bình luận người dùng</h5><form id="commentForm" class="mb-3"><div class="row g-2"><div class="col-md-8"><input class="form-control" required placeholder="Chia sẻ cảm nhận của bạn về tour..." /></div><div class="col-md-2"><select class="form-select" id="commentRating"><option value="5">5 sao</option><option value="4">4 sao</option><option value="3">3 sao</option></select></div><div class="col-md-2"><button class="btn btn-primary w-100">Gửi</button></div></div></form><div class="small text-muted">Bình luận sẽ được duyệt trước khi hiển thị công khai.</div></div>
      </div>

      <div class="col-lg-4">
        <aside class="sticky-booking p-3 p-lg-4 mb-4"><div class="d-flex justify-content-between align-items-center mb-3"><div><div class="price-old">${vnd(tour.oldPrice)}</div><div class="price-new">${vnd(tour.price)}</div></div><button type="button" class="btn btn-light border" data-action="toggle-wishlist" data-tour-id="${tour.id}"><i class="bi ${wishlist.has(tour.id) ? "bi-heart-fill text-danger" : "bi-heart"}"></i></button></div>
          <div class="mb-3"><label class="form-label">Ngày khởi hành</label><select id="detailDeparture" class="form-select">${tour.departureDates.map((date) => `<option value="${date}">${dateVN(date)}</option>`).join("")}</select></div>
          <div class="mb-3"><label class="form-label">Số lượng khách</label><input id="detailPeople" type="number" min="1" max="20" value="2" class="form-control" /></div>
          <div class="mb-3"><label class="form-label">Mã giảm giá</label><select id="detailCoupon" class="form-select"><option value="">Không áp dụng</option>${db.promotions.filter((promo) => promo.status === "Đang hoạt động").map((promo) => `<option value="${promo.code}">${promo.code} - ${promo.title}</option>`).join("")}</select></div>
          <div class="invoice-meta p-3 mb-3"><div class="d-flex justify-content-between mb-1"><span>Tạm tính</span><strong id="detailSubTotal">${vnd(tour.price * 2)}</strong></div><div class="d-flex justify-content-between mb-1"><span>Giảm giá</span><strong id="detailDiscount">- ${vnd(0)}</strong></div><hr class="my-2" /><div class="d-flex justify-content-between"><span>Tổng cộng</span><strong class="text-primary" id="detailTotal">${vnd(tour.price * 2)}</strong></div></div>
          <a id="detailBookNow" href="${addQuery(routes.booking, { tourId: tour.id })}" class="btn btn-warning-soft w-100 mb-2">Đặt ngay</a><a href="${routes.contact}" class="btn btn-outline-primary w-100">Tư vấn nhanh</a>
        </aside>

        <div class="panel-card p-3 p-lg-4 mb-4"><h6 class="mb-2">Nhà cung cấp</h6><h5>${providerData.name}</h5><p class="text-muted mb-2">${providerData.city} • ${providerData.email}</p><div class="d-flex justify-content-between"><span>Đánh giá NCC</span><strong>${providerData.rating}/5</strong></div></div>
        <div class="panel-card p-3 p-lg-4"><h6 class="mb-3">Tour liên quan</h6><div class="d-flex flex-column gap-3">${related.map((item) => `<a href="${addQuery(routes.tourDetail, { id: item.id })}" class="d-flex gap-2 align-items-center"><img src="${item.image}" alt="${item.name}" style="width: 74px; height: 64px; object-fit: cover; border-radius: 0.7rem;" /><div><div class="fw-bold">${item.name}</div><small class="text-muted">${vnd(item.price)}</small></div></a>`).join("")}</div></div>
      </div>
      </div></div></main>
      `
    );
  };

  const authLayout = ({ title, subtitle, image, formHtml, helper }) => `
    <main class="auth-shell" style="--auth-image:url('${image}');">
      <section class="auth-visual d-flex flex-column justify-content-between"><div><span class="badge-soft mb-3 d-inline-flex">Viet Horizon Travel</span><h2 class="mb-3 text-white">${title}</h2><p class="text-white-50">${subtitle}</p></div><div class="small text-white-50">Hơn 50.000 khách hàng đã đặt tour thành công trong 12 tháng gần nhất.</div></section>
      <section class="d-flex"><div class="auth-card">${formHtml}<p class="text-muted mt-3 mb-0">${helper}</p></div></section>
    </main>
  `;

  const renderLoginPage = () => authLayout({
    title: "Đăng nhập để quản lý hành trình của bạn",
    subtitle: "Theo dõi booking, hóa đơn, tour yêu thích và nhận ưu đãi cá nhân hóa.",
    image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1600&q=80",
    formHtml: `<h3 class="mb-3">Đăng nhập</h3><form id="loginForm" class="needs-validation" novalidate><div class="mb-3"><label class="form-label">Email</label><input type="email" class="form-control" required placeholder="you@email.com" /><div class="invalid-feedback">Vui lòng nhập email hợp lệ.</div></div><div class="mb-3"><label class="form-label">Mật khẩu</label><div class="input-group"><input type="password" class="form-control" required minlength="6" data-password-input /><button class="btn btn-outline-primary" type="button" data-toggle-password><i class="bi bi-eye"></i></button></div></div><div class="d-flex justify-content-between align-items-center mb-3"><label class="form-check-label"><input type="checkbox" class="form-check-input me-1" />Ghi nhớ đăng nhập</label><a href="${routes.forgotPassword}" class="text-primary fw-bold">Quên mật khẩu?</a></div><button class="btn btn-primary w-100">Đăng nhập</button><div class="text-center my-3 small text-muted">Đăng nhập bằng email để sử dụng đầy đủ chức năng.</div></form>`,
    helper: `Chưa có tài khoản? <a class="fw-bold text-primary" href="${routes.register}">Đăng ký ngay</a>.`
  });

  const renderRegisterPage = () => authLayout({
    title: "Bắt đầu hành trình cùng Viet Horizon",
    subtitle: "Tạo tài khoản miễn phí để đặt tour nhanh hơn và lưu lịch sử giao dịch an toàn.",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80",
    formHtml: `<h3 class="mb-3">Đăng ký tài khoản</h3><form id="registerForm" class="needs-validation" novalidate><div class="row g-3"><div class="col-md-6"><label class="form-label">Họ và tên</label><input class="form-control" required placeholder="Nguyễn Văn A" /></div><div class="col-md-6"><label class="form-label">Số điện thoại</label><input class="form-control" required pattern="[0-9]{9,11}" placeholder="0909123456" /></div><div class="col-12"><label class="form-label">Email</label><input type="email" class="form-control" required placeholder="you@email.com" /></div><div class="col-md-6"><label class="form-label">Mật khẩu</label><div class="input-group"><input type="password" class="form-control" required minlength="6" data-password-input /><button class="btn btn-outline-primary" type="button" data-toggle-password><i class="bi bi-eye"></i></button></div></div><div class="col-md-6"><label class="form-label">Xác nhận mật khẩu</label><input type="password" class="form-control" required minlength="6" /></div></div><label class="form-check-label mt-3 mb-3 d-block"><input class="form-check-input me-1" type="checkbox" required />Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật.</label><button class="btn btn-primary w-100">Tạo tài khoản</button></form>`,
    helper: `Đã có tài khoản? <a class="fw-bold text-primary" href="${routes.login}">Đăng nhập</a>.`
  });

  const renderForgotPasswordPage = () => {
    const query = new URLSearchParams(window.location.search);
    const resetEmail = query.get("email") || "";
    const resetToken = query.get("token") || "";
    const isResetMode = Boolean(resetEmail && resetToken);

    return authLayout({
      title: isResetMode ? "Đặt lại mật khẩu" : "Khôi phục mật khẩu an toàn",
      subtitle: isResetMode
        ? "Nhập mật khẩu mới để hoàn tất quá trình khôi phục tài khoản."
        : "Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu trong vài phút.",
      image: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?auto=format&fit=crop&w=1600&q=80",
      formHtml: isResetMode
        ? `<h3 class="mb-3">Đặt lại mật khẩu</h3><form id="resetPasswordForm" class="needs-validation" novalidate><div class="mb-3"><label class="form-label">Email tài khoản</label><input type="email" class="form-control" value="${resetEmail}" readonly /></div><div class="mb-3"><label class="form-label">Mật khẩu mới</label><div class="input-group"><input type="password" class="form-control" required minlength="6" data-password-input /><button class="btn btn-outline-primary" type="button" data-toggle-password><i class="bi bi-eye"></i></button></div></div><div class="mb-3"><label class="form-label">Xác nhận mật khẩu</label><input type="password" class="form-control" required minlength="6" /></div><button class="btn btn-primary w-100">Xác nhận mật khẩu mới</button></form>`
        : `<h3 class="mb-3">Quên mật khẩu</h3><form id="forgotForm" class="needs-validation" novalidate><div class="mb-3"><label class="form-label">Email tài khoản</label><input type="email" class="form-control" required placeholder="you@email.com" /></div><button class="btn btn-primary w-100">Gửi liên kết đặt lại</button></form><div id="forgotPasswordDevNotice" class="mt-3"></div>`,
      helper: `Nhớ mật khẩu rồi? <a class="fw-bold text-primary" href="${routes.login}">Quay lại đăng nhập</a>.`
    });
  };
  const renderProfilePage = () => {
    const userBookings = getUserBookings();
    const favTours = db.tours.filter((tour) => wishlist.has(tour.id)).slice(0, 3);
    const role = getCurrentRole();
    const profileAvatar =
      profileState.avatar
      || getAuthDisplayUser()?.avatar
      || "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80";
    const requestStatusLabel = latestProviderRequest?.status === "approved"
      ? "Đã duyệt"
      : latestProviderRequest?.status === "rejected"
        ? "Từ chối"
        : latestProviderRequest?.status === "pending"
          ? "Đang duyệt"
          : "Chưa gửi";
    const unreadNotifications = notificationsData.filter((item) => !item.isRead).length;

    return publicLayout(
      "profile",
      `
      <main class="section-block pt-4"><div class="container"><div class="row g-4">
        <div class="col-lg-3"><aside class="account-card p-3"><div class="text-center mb-3"><img src="${profileAvatar}" alt="avatar" class="rounded-circle mx-auto mb-2" style="width: 86px; height: 86px; object-fit: cover;" /><h6 class="mb-1">${profileState.name}</h6><small class="text-muted">Khách hàng hạng Vàng</small></div><nav class="d-flex flex-column gap-1"><a class="account-sidebar-link active" href="#profileInfo"><i class="bi bi-person"></i>Thông tin cá nhân</a><a class="account-sidebar-link" href="${routes.bookingHistory}"><i class="bi bi-journal-check"></i>Đơn đặt tour</a><a class="account-sidebar-link" href="${routes.wishlist}"><i class="bi bi-heart"></i>Tour yêu thích</a><a class="account-sidebar-link" href="${routes.profileEdit}"><i class="bi bi-pencil-square"></i>Cập nhật hồ sơ</a></nav></aside></div>
        <div class="col-lg-9">
          <div class="account-card p-3 p-lg-4 mb-4" id="profileInfo"><div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><h4 class="mb-0">Thông tin cá nhân</h4><a href="${routes.profileEdit}" class="btn btn-outline-primary">Chỉnh sửa</a></div><div class="row g-3"><div class="col-md-6"><label class="form-label">Họ tên</label><input class="form-control" value="${profileState.name}" disabled /></div><div class="col-md-6"><label class="form-label">Ngày sinh</label><input class="form-control" value="${profileState.birthday}" disabled /></div><div class="col-md-6"><label class="form-label">Email</label><input class="form-control" value="${profileState.email}" disabled /></div><div class="col-md-6"><label class="form-label">Điện thoại</label><input class="form-control" value="${profileState.phone}" disabled /></div><div class="col-md-6"><label class="form-label">Thành phố</label><input class="form-control" value="${profileState.city}" disabled /></div><div class="col-md-6"><label class="form-label">Địa chỉ</label><input class="form-control" value="${profileState.address}" disabled /></div><div class="col-12"><label class="form-label">Giới thiệu</label><textarea class="form-control" rows="3" disabled>${profileState.bio}</textarea></div></div></div>

          <div class="account-card p-3 p-lg-4 mb-4"><h5 class="mb-3">Đơn đặt tour gần đây</h5><div class="table-responsive"><table class="table table-hover"><thead><tr><th>Mã đơn</th><th>Tour</th><th>Ngày đặt</th><th>Trạng thái</th><th>Tổng tiền</th><th></th></tr></thead><tbody>${userBookings.slice(0, 4).map((booking) => `<tr><td>${booking.code}</td><td>${getTourById(booking.tourId)?.name || "-"}</td><td>${dateVN(booking.bookingDate)}</td><td>${statusBadge(booking.status)}</td><td>${vnd(booking.amount)}</td><td><a href="${addQuery(routes.bookingDetail, { code: booking.code })}" class="btn btn-sm btn-outline-primary">Chi tiết</a></td></tr>`).join("")}</tbody></table></div></div>

          <div class="account-card p-3 p-lg-4"><h5 class="mb-3">Tour yêu thích</h5><div class="row g-3">${favTours.length ? favTours.map((tour) => `<div class="col-md-4"><article class="post-card h-100 p-2"><img src="${tour.image}" class="rounded-4 mb-2" style="height: 130px; width:100%; object-fit: cover;" alt="${tour.name}" /><strong class="d-block mb-2">${tour.name}</strong><a href="${addQuery(routes.tourDetail, { id: tour.id })}" class="btn btn-sm btn-primary w-100">Xem tour</a></article></div>`).join("") : '<div class="empty-state">Bạn chưa lưu tour yêu thích nào.</div>'}</div></div>
          ${role === "user" ? `
            <div class="account-card p-3 p-lg-4 mt-4" id="profileProviderRequest">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-3">
                <div>
                  <h5 class="mb-1">Đăng ký trở thành nhà cung cấp</h5>
                  <p class="text-muted mb-0">Gửi hồ sơ hợp tác để mở khu vực provider và quản lý tour của riêng bạn.</p>
                </div>
                <span class="status-badge ${statusClass(requestStatusLabel)}">${requestStatusLabel}</span>
              </div>
              ${latestProviderRequest ? `
                <div class="invoice-meta p-3 mb-3">
                  <div class="row g-3">
                    <div class="col-md-6"><div class="small text-muted">Đơn vị đăng ký</div><strong>${latestProviderRequest.company_name || "-"}</strong></div>
                    <div class="col-md-6"><div class="small text-muted">Ngày gửi</div><strong>${dateVN(latestProviderRequest.created_at)}</strong></div>
                    <div class="col-12"><div class="small text-muted">Ghi chú admin</div><div>${latestProviderRequest.admin_note || "Chưa có phản hồi chi tiết."}</div></div>
                  </div>
                </div>
              ` : ""}
              <form id="providerRequestForm" class="row g-3 needs-validation" novalidate>
                <div class="col-md-6">
                  <label class="form-label">Tên đơn vị / thương hiệu</label>
                  <input name="company_name" class="form-control" required minlength="2" maxlength="160" value="${latestProviderRequest?.company_name || ""}" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Mã số thuế</label>
                  <input name="tax_code" class="form-control" maxlength="80" value="${latestProviderRequest?.tax_code || ""}" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Email liên hệ</label>
                  <input name="contact_email" type="email" class="form-control" value="${latestProviderRequest?.contact_email || profileState.email}" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Điện thoại liên hệ</label>
                  <input name="contact_phone" class="form-control" value="${latestProviderRequest?.contact_phone || profileState.phone}" />
                </div>
                <div class="col-12">
                  <label class="form-label">Địa chỉ hoạt động</label>
                  <input name="address" class="form-control" maxlength="255" value="${latestProviderRequest?.address || profileState.address}" />
                </div>
                <div class="col-12">
                  <label class="form-label">Mô tả năng lực / dịch vụ</label>
                  <textarea name="description" class="form-control" rows="4">${latestProviderRequest?.description || ""}</textarea>
                </div>
                <div class="col-12 d-flex gap-2">
                  <button class="btn btn-primary" type="submit">${latestProviderRequest ? "Gửi lại yêu cầu" : "Gửi yêu cầu"}</button>
                </div>
              </form>
            </div>
          ` : ""}
          <div class="account-card p-3 p-lg-4 mt-4" id="profileNotifications">
            <div class="d-flex justify-content-between align-items-center gap-2 mb-3">
              <div>
                <h5 class="mb-1">Thông báo của bạn</h5>
                <p class="text-muted mb-0">Theo dõi phản hồi từ hệ thống và nhà cung cấp.</p>
              </div>
              <div class="d-flex gap-2 align-items-center">
                <span class="badge-soft">${unreadNotifications} chưa đọc</span>
                <button class="btn btn-sm btn-outline-primary" type="button" data-action="notification-read-all">Đánh dấu tất cả đã đọc</button>
              </div>
            </div>
            ${notificationsData.length ? `<div class="d-flex flex-column gap-3">${notificationsData.map((item) => `
              <article class="invoice-meta p-3 ${item.isRead ? "" : "border-primary"}">
                <div class="d-flex justify-content-between gap-3 align-items-start">
                  <div>
                    <div class="d-flex gap-2 align-items-center mb-1">
                      <strong>${item.title}</strong>
                      ${item.isRead ? `<span class="badge bg-light text-dark border">Đã đọc</span>` : `<span class="badge bg-primary">Mới</span>`}
                    </div>
                    <p class="mb-1 text-muted">${item.content}</p>
                    <small class="text-muted">${dateVN(item.createdAt)}</small>
                  </div>
                  ${item.isRead ? "" : `<button class="btn btn-sm btn-outline-primary" type="button" data-action="notification-read" data-notification-id="${item.id}">Đã đọc</button>`}
                </div>
              </article>
            `).join("")}</div>` : '<div class="empty-state">Bạn chưa có thông báo nào.</div>'}
          </div>
        </div>
      </div></div></main>
      `
    );
  };

  const renderProfileEditPage = () => {
    const profileAvatar =
      profileState.avatar
      || getAuthDisplayUser()?.avatar
      || "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80";

    return publicLayout("profile", `
      <main class="section-block pt-4">
        <div class="container" style="max-width: 920px;">
          <div class="account-card p-3 p-lg-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h4 class="mb-0">Cập nhật hồ sơ cá nhân</h4>
              <a href="${routes.profile}" class="btn btn-outline-primary">Quay lại hồ sơ</a>
            </div>
            <form id="profileEditForm" class="needs-validation" novalidate>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Ảnh đại diện</label>
                  <div class="d-flex align-items-center gap-3 flex-wrap">
                    <img
                      id="profileAvatarPreview"
                      src="${profileAvatar}"
                      alt="Ảnh hồ sơ"
                      class="rounded-circle border"
                      style="width: 92px; height: 92px; object-fit: cover;"
                    />
                    <div class="flex-grow-1" style="min-width: 260px;">
                      <input
                        id="profileAvatarInput"
                        name="avatar"
                        type="file"
                        class="form-control"
                        accept="image/png,image/jpeg,image/webp"
                      />
                      <div class="form-text">Chấp nhận JPG/PNG/WEBP, tối đa 5MB.</div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Họ tên</label>
                  <input name="name" class="form-control" required value="${profileState.name}" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Ngày sinh</label>
                  <input name="birthday" type="date" class="form-control" value="${profileState.birthday}" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Email</label>
                  <input name="email" type="email" class="form-control" required value="${profileState.email}" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Số điện thoại</label>
                  <input name="phone" class="form-control" required value="${profileState.phone}" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Thành phố</label>
                  <input name="city" class="form-control" value="${profileState.city}" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Địa chỉ</label>
                  <input name="address" class="form-control" value="${profileState.address}" />
                </div>
                <div class="col-12">
                  <label class="form-label">Giới thiệu</label>
                  <textarea name="bio" class="form-control" rows="4">${profileState.bio}</textarea>
                </div>
              </div>
              <div class="d-flex gap-2 mt-4">
                <button class="btn btn-primary">Lưu thay đổi</button>
                <a href="${routes.profile}" class="btn btn-outline-primary">Hủy</a>
              </div>
            </form>
          </div>
          <div class="account-card p-3 p-lg-4 mt-4">
            <h5 class="mb-3">Đổi mật khẩu</h5>
            <form id="changePasswordForm" class="row g-3 needs-validation" novalidate>
              <div class="col-12">
                <label class="form-label">Mật khẩu hiện tại</label>
                <div class="input-group">
                  <input name="current_password" type="password" class="form-control" required minlength="6" data-password-input />
                  <button class="btn btn-outline-primary" type="button" data-toggle-password><i class="bi bi-eye"></i></button>
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label">Mật khẩu mới</label>
                <div class="input-group">
                  <input name="new_password" type="password" class="form-control" required minlength="6" data-password-input />
                  <button class="btn btn-outline-primary" type="button" data-toggle-password><i class="bi bi-eye"></i></button>
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label">Xác nhận mật khẩu mới</label>
                <div class="input-group">
                  <input name="confirm_password" type="password" class="form-control" required minlength="6" data-password-input />
                  <button class="btn btn-outline-primary" type="button" data-toggle-password><i class="bi bi-eye"></i></button>
                </div>
              </div>
              <div class="col-12 d-flex gap-2">
                <button class="btn btn-primary" type="submit">Cập nhật mật khẩu</button>
                <button class="btn btn-outline-secondary" type="reset">Làm mới</button>
              </div>
            </form>
          </div>
        </div>
      </main>
    `);
  };

  const bookingStepper = (activeIndex) => {
    const labels = ["Chọn tour", "Điền thông tin", "Thanh toán", "Hoàn tất"];
    return `<div class="d-flex flex-wrap gap-3 mb-4">${labels.map((label, index) => {
      const state = index + 1 < activeIndex ? "done" : index + 1 === activeIndex ? "active" : "";
      return `<div class="progress-step ${state}"><span class="step-dot">${index + 1}</span><span>${label}</span></div>`;
    }).join("")}</div>`;
  };

  const renderBookingPage = () => {
    const params = new URLSearchParams(window.location.search);
    const tour = getTourById(params.get("tourId")) || db.tours[0];

    return publicLayout("tours", `
      <main class="section-block pt-4"><div class="container">${bookingStepper(2)}<div class="row g-4"><div class="col-lg-8"><div class="panel-card p-3 p-lg-4 mb-4"><h5 class="mb-3">Thông tin liên hệ</h5><form id="bookingForm" class="needs-validation" novalidate><div class="row g-3"><div class="col-md-6"><label class="form-label">Họ tên người đại diện</label><input name="name" class="form-control" required value="${profileState.name}" /></div><div class="col-md-6"><label class="form-label">Số điện thoại</label><input name="phone" class="form-control" required value="${profileState.phone}" /></div><div class="col-md-6"><label class="form-label">Email</label><input name="email" type="email" class="form-control" required value="${profileState.email}" /></div><div class="col-md-6"><label class="form-label">Ngày khởi hành</label><select id="bookingDeparture" class="form-select">${tour.departureDates.map((date) => `<option value="${date}">${dateVN(date)}</option>`).join("")}</select></div><div class="col-md-4"><label class="form-label">Số lượng khách</label><input id="bookingPeople" type="number" min="1" max="20" value="2" class="form-control" /></div><div class="col-md-8"><label class="form-label">Ghi chú</label><input name="note" class="form-control" placeholder="Yêu cầu đặc biệt về bữa ăn, phòng nghỉ..." /></div><div class="col-12"><label class="form-label">Danh sách khách đi</label><div id="travelerList" class="row g-2"></div></div></div></form></div></div><div class="col-lg-4"><aside class="sticky-booking p-3 p-lg-4"><h6 class="mb-3">Tóm tắt đơn hàng</h6><div class="d-flex gap-2 mb-3"><img src="${tour.image}" alt="${tour.name}" style="width: 96px; height: 80px; border-radius: 0.7rem; object-fit: cover;" /><div><strong>${tour.name}</strong><div class="small text-muted">${tour.duration}N${tour.nights}Đ • ${tour.location}</div></div></div><div class="mb-3"><label class="form-label">Mã khuyến mãi</label><select id="bookingCoupon" class="form-select"><option value="">Không áp dụng</option>${db.promotions.filter((promo) => promo.status === "Đang hoạt động").map((promo) => `<option value="${promo.code}">${promo.code}</option>`).join("")}</select></div><div class="invoice-meta p-3 mb-3"><div class="d-flex justify-content-between mb-1"><span>Giá/người</span><strong>${vnd(tour.price)}</strong></div><div class="d-flex justify-content-between mb-1"><span>Tạm tính</span><strong id="bookingSubTotal">${vnd(tour.price * 2)}</strong></div><div class="d-flex justify-content-between mb-1"><span>Giảm giá</span><strong id="bookingDiscount">- ${vnd(0)}</strong></div><hr class="my-2" /><div class="d-flex justify-content-between"><span>Tổng thanh toán</span><strong id="bookingTotal" class="text-primary">${vnd(tour.price * 2)}</strong></div></div><button class="btn btn-warning-soft w-100" id="bookingContinue">Tiếp tục thanh toán</button></aside></div></div></div></main>
    `);
  };

  const renderPaymentPage = () => {
    const draft = readLS(LS_KEYS.bookingDraft, null);
    const tour = getTourById(draft?.tourId) || db.tours[0];
    const amount = draft?.total || tour.price * 2;

    return publicLayout("tours", `
      <main class="section-block pt-4"><div class="container">${bookingStepper(3)}<div class="row g-4"><div class="col-lg-8"><div class="panel-card p-3 p-lg-4"><h5 class="mb-3">Phương thức thanh toán</h5><div class="d-flex flex-column gap-2 mb-4" id="paymentMethods"><label class="form-check border rounded-3 p-3"><input class="form-check-input me-2" type="radio" name="paymentMethod" value="Thẻ ngân hàng" checked />Thẻ ngân hàng (Visa/Master/JCB)</label><label class="form-check border rounded-3 p-3"><input class="form-check-input me-2" type="radio" name="paymentMethod" value="Ví điện tử" />Ví điện tử (Momo/ZaloPay)</label><label class="form-check border rounded-3 p-3"><input class="form-check-input me-2" type="radio" name="paymentMethod" value="Chuyển khoản" />Chuyển khoản ngân hàng</label></div><div class="panel-card p-3"><h6 class="mb-3">Thông tin thanh toán bảo mật</h6><div class="row g-3"><div class="col-md-8"><label class="form-label">Số thẻ</label><input id="paymentCardNumber" class="form-control" placeholder="4111 1111 1111 1111" /></div><div class="col-md-4"><label class="form-label">CVV</label><input id="paymentCardCvv" class="form-control" placeholder="123" /></div><div class="col-md-6"><label class="form-label">Tên chủ thẻ</label><input id="paymentCardHolder" class="form-control" placeholder="NGUYEN VAN AN" /></div><div class="col-md-6"><label class="form-label">Ngày hết hạn</label><input id="paymentCardExpiry" class="form-control" placeholder="MM/YY" /></div></div></div></div></div><div class="col-lg-4"><aside class="sticky-booking p-3 p-lg-4"><h6 class="mb-3">Đơn hàng của bạn</h6><p class="mb-2"><strong>Tour:</strong> ${tour.name}</p><p class="mb-2"><strong>Ngày đi:</strong> ${draft?.departureDate ? dateVN(draft.departureDate) : dateVN(tour.departureDates[0])}</p><p class="mb-2"><strong>Số khách:</strong> ${draft?.people || 2}</p><p class="mb-3"><strong>Mã giảm:</strong> ${draft?.coupon || "Không áp dụng"}</p><div class="invoice-meta p-3 mb-3"><div class="d-flex justify-content-between"><span>Tổng thanh toán</span><strong class="text-primary">${vnd(amount)}</strong></div></div><button id="confirmPaymentBtn" class="btn btn-warning-soft w-100">Xác nhận thanh toán</button></aside></div></div></div></main>
    `);
  };

  const renderBookingHistoryPage = () => {
    const rows = getUserBookings().map((booking) => ({
      search: `${booking.code} ${getTourById(booking.tourId)?.name || ""} ${booking.status} ${booking.paymentStatus}`,
      attrs: { status: booking.status, payment: booking.paymentStatus },
      cells: [
        booking.code,
        getTourById(booking.tourId)?.name || "-",
        dateVN(booking.bookingDate),
        statusBadge(booking.status),
        statusBadge(booking.paymentStatus),
        vnd(booking.amount),
        `<div class="table-actions d-flex gap-1"><a href="${addQuery(routes.bookingDetail, { code: booking.code })}" class="btn btn-sm btn-outline-primary">Chi tiết</a><a href="${addQuery(routes.invoice, { code: booking.code })}" class="btn btn-sm btn-outline-primary">Hóa đơn</a>${booking.status === "Chờ xác nhận" ? `<button class="btn btn-sm btn-outline-danger" data-action="cancel-booking" data-code="${booking.code}">Hủy</button>` : ""}</div>`
      ]
    }));

    return publicLayout("profile", `
      <main class="section-block pt-4"><div class="container"><section class="page-banner mb-4" style="--banner-image:url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80');"><div class="page-banner-content"><h2 class="mb-2">Lịch sử đặt tour</h2><p class="mb-0 text-white-50">Theo dõi toàn bộ giao dịch, trạng thái booking và thanh toán của bạn.</p></div></section>${renderSmartTable({ title: "Danh sách đơn đặt tour", subtitle: "Bạn có thể xem chi tiết, xuất hóa đơn hoặc hủy đơn khi còn ở trạng thái chờ xác nhận.", filters: [{ field: "status", label: "Trạng thái", options: ["Đã xác nhận", "Chờ xác nhận", "Hoàn tất", "Đã hủy"] }, { field: "payment", label: "Thanh toán", options: ["Đã thanh toán", "Chưa thanh toán", "Thất bại"] }], headers: ["Mã đơn", "Tour", "Ngày đặt", "Trạng thái", "Thanh toán", "Tổng tiền", "Hành động"], rows, pageSize: 6 })}</div></main>
    `);
  };

  const renderBookingDetailPage = () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const booking = findUserBookingByCode(code);

    if (!booking) {
      return publicLayout("profile", `
      <main class="section-block pt-4"><div class="container"><div class="empty-state">Không tìm thấy đơn đặt tour phù hợp.</div></div></main>
      `);
    }

    const tour = getTourById(booking.tourId);

    return publicLayout("profile", `
      <main class="section-block pt-4"><div class="container" style="max-width: 1020px;"><div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><h3 class="mb-0">Chi tiết đơn đặt tour #${booking.code}</h3><div class="d-flex gap-2"><a href="${routes.bookingHistory}" class="btn btn-outline-primary">Quay lại lịch sử</a><a href="${addQuery(routes.invoice, { code: booking.code })}" class="btn btn-primary">Xem hóa đơn</a></div></div><div class="row g-4"><div class="col-lg-8"><div class="panel-card p-3 p-lg-4 mb-4"><h5 class="mb-3">Thông tin tour</h5><div class="d-flex gap-3 align-items-start"><img src="${tour?.image}" alt="${tour?.name}" style="width: 180px; height: 130px; object-fit: cover; border-radius: 0.8rem;" /><div><h5>${tour?.name || "-"}</h5><p class="text-muted mb-2">${tour?.location || "-"} • ${tour?.duration || "-"}N${tour?.nights || "-"}Đ</p><p class="mb-1"><strong>Ngày khởi hành:</strong> ${dateVN(booking.departureDate)}</p><p class="mb-0"><strong>Số lượng khách:</strong> ${booking.travelers}</p></div></div></div><div class="panel-card p-3 p-lg-4"><h5 class="mb-3">Tiến trình xử lý</h5><ul class="list-group list-group-flush"><li class="list-group-item d-flex justify-content-between"><span>Đơn được tạo</span><strong>${dateVN(booking.bookingDate)}</strong></li><li class="list-group-item d-flex justify-content-between"><span>Trạng thái booking</span>${statusBadge(booking.status)}</li><li class="list-group-item d-flex justify-content-between"><span>Trạng thái thanh toán</span>${statusBadge(booking.paymentStatus)}</li><li class="list-group-item d-flex justify-content-between"><span>Mã đơn</span><strong>${booking.code}</strong></li></ul></div></div><div class="col-lg-4"><div class="sticky-booking p-3 p-lg-4"><h6 class="mb-3">Thanh toán</h6><div class="invoice-meta p-3 mb-3"><div class="d-flex justify-content-between mb-1"><span>Tổng tiền</span><strong>${vnd(booking.amount)}</strong></div><div class="d-flex justify-content-between"><span>Trạng thái</span>${statusBadge(booking.paymentStatus)}</div></div><a href="${routes.contact}" class="btn btn-outline-primary w-100 mb-2">Yêu cầu hỗ trợ</a><a href="${addQuery(routes.invoice, { code: booking.code })}" class="btn btn-primary w-100">Tải hóa đơn</a></div></div></div></div></main>
    `);
  };

  const renderInvoicePage = () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const booking = findUserBookingByCode(code);

    if (!booking) {
      return publicLayout("profile", `
      <main class="section-block pt-4"><div class="container"><div class="empty-state">Không tìm thấy hóa đơn phù hợp.</div></div></main>
      `);
    }

    const tour = getTourById(booking.tourId);
    const invoiceRecord = getInvoiceForBooking(booking);
    const invoiceId = Number(invoiceRecord?.invoiceId || booking?.invoiceId || 0);
    const invoiceCode = invoiceRecord?.id || `INV-${booking.code.slice(-6)}`;

    return publicLayout("profile", `
      <main class="section-block pt-4"><div class="container" style="max-width: 1000px;"><div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2"><h3 class="mb-0">Hóa đơn #${invoiceCode}</h3><div class="d-flex gap-2"><button class="btn btn-outline-primary" data-action="print-invoice"><i class="bi bi-printer me-1"></i>In hóa đơn</button><button class="btn btn-primary" data-action="download-invoice" data-booking-code="${booking.code}" data-invoice-id="${invoiceId}"><i class="bi bi-download me-1"></i>Tải PDF</button></div></div>
      <article class="invoice-paper"><div class="d-flex justify-content-between flex-wrap gap-3 mb-4"><div><div class="d-flex align-items-center gap-2 mb-2"><span class="brand-mark"><i class="bi bi-compass"></i></span><span class="brand-name">Viet Horizon Travel</span></div><div class="text-muted small">25 Nguyễn Huệ, Quận 1, TP.HCM</div><div class="text-muted small">MST: 0317 889 456</div></div><div class="invoice-meta p-3"><div><strong>Mã hóa đơn:</strong> ${invoiceCode}</div><div><strong>Ngày phát hành:</strong> ${dateVN(booking.bookingDate)}</div><div><strong>Trạng thái:</strong> ${statusBadge(booking.paymentStatus)}</div></div></div>
      <div class="row g-3 mb-4"><div class="col-md-6"><h6>Thông tin khách hàng</h6><div>${profileState.name}</div><div>${profileState.email}</div><div>${profileState.phone}</div><div>${profileState.address}</div></div><div class="col-md-6"><h6>Thông tin tour</h6><div>${tour?.name || "-"}</div><div>Khởi hành: ${dateVN(booking.departureDate)}</div><div>Số khách: ${booking.travelers}</div><div>Mã booking: ${booking.code}</div></div></div>
      <div class="table-responsive mb-4"><table class="table"><thead><tr><th>Dịch vụ</th><th class="text-center">Số lượng</th><th class="text-end">Đơn giá</th><th class="text-end">Thành tiền</th></tr></thead><tbody><tr><td>${tour?.name || "Gói tour"}</td><td class="text-center">${booking.travelers}</td><td class="text-end">${vnd(Math.round(booking.amount / booking.travelers))}</td><td class="text-end">${vnd(booking.amount)}</td></tr></tbody></table></div>
      <div class="row justify-content-end"><div class="col-md-5"><div class="invoice-meta p-3"><div class="d-flex justify-content-between mb-1"><span>Tạm tính</span><strong>${vnd(booking.amount)}</strong></div><div class="d-flex justify-content-between mb-1"><span>Thuế & phí</span><strong>${vnd(0)}</strong></div><hr class="my-2" /><div class="d-flex justify-content-between"><span>Tổng thanh toán</span><strong class="text-primary">${vnd(booking.amount)}</strong></div></div></div></div>
      </article></div></main>
    `);
  };
  const renderWishlistPage = () => {
    const favTours = db.tours.filter((tour) => wishlist.has(tour.id));
    return publicLayout("profile", `
      <main class="section-block pt-4"><div class="container"><div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4"><div><h3 class="mb-1">Tour yêu thích</h3><p class="text-muted mb-0">Lưu lại tour bạn quan tâm để đặt nhanh bất kỳ lúc nào.</p></div><a href="${routes.tours}" class="btn btn-outline-primary">Khám phá thêm tour</a></div><div id="wishlistContainer">${favTours.length ? `<div class="row g-4">${favTours.map((tour) => `<div class="col-md-6 col-xl-4">${tourCard(tour)}</div>`).join("")}</div>` : '<div class="empty-state">Danh sách yêu thích đang trống. Hãy thêm tour bạn muốn khám phá.</div>'}</div></div></main>
    `);
  };

  const renderPostsPage = () => publicLayout("posts", `
      <main class="section-block pt-4"><div class="container"><section class="page-banner mb-4" style="--banner-image:url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80');"><div class="page-banner-content"><h2 class="mb-2">Bài viết & Tin tức du lịch</h2><p class="mb-0 text-white-50">Xu hướng điểm đến, kinh nghiệm thực tế và mẹo đặt tour tiết kiệm.</p></div></section><div class="row g-4"><div class="col-lg-8"><div class="row g-4">${db.posts.map((post) => `<div class="col-md-6">${miniPostCard(post)}</div>`).join("")}</div></div><div class="col-lg-4"><aside class="panel-card p-3 p-lg-4 mb-4"><h5 class="mb-3">Chủ đề nổi bật</h5><div class="d-flex flex-wrap gap-2"><span class="category-chip">Kinh nghiệm</span><span class="category-chip">Visa</span><span class="category-chip">Ẩm thực</span><span class="category-chip">Điểm check-in</span></div></aside><aside class="panel-card p-3 p-lg-4"><h5 class="mb-3">Tour được quan tâm</h5><div class="d-flex flex-column gap-3">${db.tours.slice(0, 4).map((tour) => `<a href="${addQuery(routes.tourDetail, { id: tour.id })}" class="d-flex gap-2 align-items-center"><img src="${tour.image}" style="width: 76px; height: 62px; border-radius: 0.7rem; object-fit: cover;" alt="${tour.name}" /><div><div class="fw-bold">${tour.name}</div><small class="text-muted">${vnd(tour.price)}</small></div></a>`).join("")}</div></aside></div></div></div></main>
    `);

  const renderPostDetailPage = () => {
    const post = db.posts.find((item) => String(item.id) === String(new URLSearchParams(window.location.search).get("id"))) || db.posts[0];
    return publicLayout("post-detail", `
      <main class="section-block pt-4"><div class="container" style="max-width: 980px;"><nav aria-label="breadcrumb" class="mb-3"><ol class="breadcrumb"><li class="breadcrumb-item"><a href="${routes.home}">Trang chủ</a></li><li class="breadcrumb-item"><a href="${routes.posts}">Bài viết</a></li><li class="breadcrumb-item active" aria-current="page">Chi tiết</li></ol></nav><article class="panel-card p-3 p-lg-4"><span class="badge-soft mb-2 d-inline-flex">${post.category}</span><h2 class="mb-2">${post.title}</h2><div class="text-muted mb-3">Tác giả: ${post.author} • ${dateVN(post.date)}</div><img src="${post.image}" class="rounded-4 mb-4" style="width:100%; max-height: 430px; object-fit: cover;" alt="${post.title}" /><div class="fs-6 lh-lg text-muted">${post.content.map((paragraph) => `<p>${paragraph}</p>`).join("")}</div><hr /><div class="d-flex flex-wrap justify-content-between align-items-center gap-2"><a href="${routes.posts}" class="btn btn-outline-primary">← Quay lại danh sách bài viết</a><a href="${routes.tours}" class="btn btn-primary">Khám phá tour liên quan</a></div></article></div></main>
    `);
  };

  const renderContactPage = () => publicLayout("contact", `
      <main class="section-block pt-4"><div class="container"><div class="row g-4"><div class="col-lg-5"><div class="contact-card p-3 p-lg-4 h-100"><h3 class="mb-3">Liên hệ & Hỗ trợ</h3><p class="text-muted">Đội ngũ Viet Horizon hỗ trợ đặt tour, thanh toán và xử lý phát sinh 24/7.</p><div class="d-flex flex-column gap-3 mt-4"><div><strong>Hotline:</strong> 1900 6886</div><div><strong>Email:</strong> support@viethorizon.vn</div><div><strong>Văn phòng:</strong> 25 Nguyễn Huệ, Quận 1, TP.HCM</div><div><strong>Thời gian:</strong> 08:00 - 22:00 (Thứ 2 - Chủ nhật)</div></div><div class="mt-4"><h6 class="mb-2">Kênh hỗ trợ nhanh</h6><div class="d-flex gap-2"><a class="btn btn-outline-primary" href="https://wa.me/84900123456?text=Toi%20can%20ho%20tro%20dat%20tour%20tu%20Viet%20Horizon" target="_blank" rel="noopener"><i class="bi bi-whatsapp me-1"></i>WhatsApp</a><a class="btn btn-outline-primary" href="https://m.me/viethorizontravel" target="_blank" rel="noopener"><i class="bi bi-messenger me-1"></i>Messenger</a></div></div></div></div><div class="col-lg-7"><div class="contact-card p-3 p-lg-4"><h4 class="mb-3">Gửi yêu cầu hỗ trợ</h4><form id="contactForm" class="needs-validation" novalidate><div class="row g-3"><div class="col-md-6"><label class="form-label">Họ tên</label><input class="form-control" required /></div><div class="col-md-6"><label class="form-label">Số điện thoại</label><input class="form-control" required /></div><div class="col-md-6"><label class="form-label">Email</label><input type="email" class="form-control" required /></div><div class="col-md-6"><label class="form-label">Loại hỗ trợ</label><select class="form-select"><option>Đặt tour</option><option>Thanh toán</option><option>Hủy/đổi lịch</option><option>Khác</option></select></div><div class="col-12"><label class="form-label">Nội dung</label><textarea class="form-control" rows="5" required placeholder="Mô tả chi tiết để đội ngũ xử lý nhanh hơn..."></textarea></div></div><button class="btn btn-primary mt-3">Gửi yêu cầu</button></form></div></div></div></div></main>
    `);

  const metricCards = (items) => `
    <div class="row g-3 mb-4">
      ${items.map((item) => `<div class="col-sm-6 col-xl-3"><div class="metric-card h-100"><div class="d-flex justify-content-between align-items-start"><div><div class="small text-muted mb-1">${item.label}</div><h4 class="mb-0">${item.value}</h4></div><span class="metric-icon ${item.color}"><i class="bi ${item.icon}"></i></span></div><small class="text-muted">${item.note}</small></div></div>`).join("")}
    </div>
  `;

  const renderProviderDashboard = () => {
    const providerTours = db.tours.filter((tour) => String(tour.providerId) === String(activeProviderId));
    const providerBookings = db.bookings
      .filter((booking) => String(booking.providerId) === String(activeProviderId))
      .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));

    const summary = providerDashboardData?.summary || {};
    const totalTours = Number(summary.total_tours ?? providerTours.length);
    const newBookings = Number(summary.new_bookings ?? providerBookings.filter((item) => item.status === "Chờ xác nhận").length);
    const totalRevenue = Number(summary.total_revenue ?? providerBookings.reduce((acc, item) => acc + item.amount, 0));
    const activeTours = Number(summary.active_tours ?? providerTours.filter((tour) => String(tour.status).toLowerCase() === "active").length);

    const today = new Date();
    const pendingPaymentCount = providerBookings.filter((item) => item.paymentStatus === "Chưa thanh toán" || item.paymentStatus === "Chờ xử lý").length;
    const unresolvedFeedbackCount = db.comments.filter((item) => item.status !== "Đã ẩn").length;
    const expiringPromotionCount = db.promotions.filter((promo) => {
      const normalizedStatus = String(promo.status || "").toLowerCase();
      if (!normalizedStatus.includes("đang hoạt động") && normalizedStatus !== "active") return false;
      const endDate = new Date(promo.end || promo.end_date || "");
      if (Number.isNaN(endDate.getTime())) return false;
      const days = Math.ceil((endDate.getTime() - today.getTime()) / 86400000);
      return days >= 0 && days <= 7;
    }).length;

    const topTours = Array.isArray(providerDashboardData?.top_tours) && providerDashboardData.top_tours.length
      ? providerDashboardData.top_tours.slice(0, 5).map((item) => ({
        title: item.title || item.tour_title || "Tour",
        bookingCount: Number(item.booking_count || 0),
        revenue: Number(item.revenue || 0)
      }))
      : providerTours
        .slice()
        .sort((a, b) => b.booked - a.booked)
        .slice(0, 5)
        .map((tour) => ({
          title: tour.name,
          bookingCount: Number(tour.booked || 0),
          revenue: Number(tour.booked || 0) * Number(tour.price || 0)
        }));

    const recentBookings = providerBookings.slice(0, 5);

    return providerShell("provider-dashboard", "Dashboard nhà cung cấp", "Theo dõi tour, booking và hiệu suất kinh doanh theo thời gian thực.", `
      ${metricCards([
        { label: "Tổng tour", value: totalTours, icon: "bi-map", color: "blue", note: "Dữ liệu đồng bộ từ API provider" },
        { label: "Booking mới", value: newBookings, icon: "bi-journal-plus", color: "teal", note: "Cần xác nhận sớm" },
        { label: "Doanh thu", value: vnd(totalRevenue), icon: "bi-cash-stack", color: "orange", note: "Đơn đã thanh toán" },
        { label: "Tour đang mở", value: activeTours, icon: "bi-rocket", color: "red", note: "Tour active theo hệ thống" }
      ])}
      <div class="row g-4"><div class="col-xl-8"><div class="panel-card p-3 p-lg-4 h-100"><div class="d-flex justify-content-between align-items-center mb-3"><h5 class="mb-0">Booking theo tháng</h5><span class="badge-soft">2026</span></div><canvas id="providerBookingChart" height="130"></canvas></div></div><div class="col-xl-4"><div class="panel-card p-3 p-lg-4 h-100"><h5 class="mb-3">Thông báo cần xử lý</h5><ul class="list-group list-group-flush"><li class="list-group-item d-flex justify-content-between px-0">Booking chờ xác nhận <span class="badge-soft">${newBookings}</span></li><li class="list-group-item d-flex justify-content-between px-0">Thanh toán chưa hoàn tất <span class="badge-soft">${pendingPaymentCount}</span></li><li class="list-group-item d-flex justify-content-between px-0">Phản hồi chưa xử lý <span class="badge-soft">${unresolvedFeedbackCount}</span></li><li class="list-group-item d-flex justify-content-between px-0">Mã giảm sắp hết hạn <span class="badge-soft">${expiringPromotionCount}</span></li></ul></div></div></div>
      <div class="row g-4 mt-1"><div class="col-xl-6"><div class="table-card"><h5 class="mb-3">Tour bán chạy</h5><div class="table-responsive"><table class="table"><thead><tr><th>Tour</th><th>Đặt chỗ</th><th>Doanh thu</th></tr></thead><tbody>${topTours.map((tour) => `<tr><td>${tour.title}</td><td>${tour.bookingCount}</td><td>${vnd(tour.revenue)}</td></tr>`).join("") || '<tr><td colspan="3" class="text-center text-muted py-4">Chưa có dữ liệu tour bán chạy.</td></tr>'}</tbody></table></div></div></div><div class="col-xl-6"><div class="table-card"><h5 class="mb-3">Booking gần đây</h5><div class="table-responsive"><table class="table"><thead><tr><th>Mã đơn</th><th>Ngày đặt</th><th>Trạng thái</th><th></th></tr></thead><tbody>${recentBookings.map((booking) => `<tr><td>${booking.code}</td><td>${dateVN(booking.bookingDate)}</td><td>${statusBadge(booking.status)}</td><td><a href="${addQuery(routes.providerBookingDetail, { code: booking.code })}" class="btn btn-sm btn-outline-primary">Xem</a></td></tr>`).join("") || '<tr><td colspan="4" class="text-center text-muted py-4">Chưa có booking gần đây.</td></tr>'}</tbody></table></div></div></div></div>
    `);
  };
  const renderProviderProfile = () => {
    const provider = getProviderById(activeProviderId);
    const brandDescription = provider?.description || "Đơn vị lữ hành chuyên tuyến miền Trung, tập trung trải nghiệm bản địa và dịch vụ 4-5 sao.";
    const supportPolicy = provider?.supportPolicy || "Hỗ trợ đổi lịch 1 lần miễn phí trước ngày khởi hành 7 ngày. CSKH phản hồi trong 30 phút.";

    return providerShell("provider-profile", "Thông tin nhà cung cấp", "Cập nhật hồ sơ thương hiệu, chính sách và thông tin thanh toán.", `
      <div class="panel-card p-3 p-lg-4"><form id="providerProfileForm" class="row g-3 needs-validation" novalidate><div class="col-md-6"><label class="form-label">Tên nhà cung cấp</label><input class="form-control" required value="${provider?.name || "Sunrise Destination"}" /></div><div class="col-md-6"><label class="form-label">Mã nhà cung cấp</label><input class="form-control" value="${provider?.id || activeProviderId || "-"}" disabled /></div><div class="col-md-6"><label class="form-label">Email liên hệ</label><input class="form-control" type="email" required value="${provider?.email || ""}" /></div><div class="col-md-6"><label class="form-label">Số điện thoại</label><input class="form-control" required value="${provider?.phone || ""}" /></div><div class="col-md-6"><label class="form-label">Thành phố</label><input class="form-control" value="${provider?.city || ""}" /></div><div class="col-md-6"><label class="form-label">Trạng thái</label><input class="form-control" value="${provider?.status || "Đang hoạt động"}" disabled /></div><div class="col-12"><label class="form-label">Mô tả thương hiệu</label><textarea class="form-control" rows="4">${brandDescription}</textarea></div><div class="col-12"><label class="form-label">Chính sách hỗ trợ khách</label><textarea class="form-control" rows="3">${supportPolicy}</textarea></div><div class="col-12 d-flex gap-2"><button class="btn btn-primary">Lưu thông tin</button><button type="button" class="btn btn-outline-primary" data-action="provider-preview-profile">Xem preview hồ sơ</button></div></form></div>
      <div class="modal fade" id="providerProfilePreviewModal" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-lg modal-dialog-scrollable"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">Preview hồ sơ nhà cung cấp</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div><div class="modal-body"><div class="row g-3"><div class="col-md-6"><div class="invoice-meta p-3"><div class="small text-muted">Tên đơn vị</div><strong id="providerPreviewName">-</strong></div></div><div class="col-md-6"><div class="invoice-meta p-3"><div class="small text-muted">Mã nhà cung cấp</div><strong id="providerPreviewCode">-</strong></div></div><div class="col-md-6"><div class="invoice-meta p-3"><div class="small text-muted">Email</div><strong id="providerPreviewEmail">-</strong></div></div><div class="col-md-6"><div class="invoice-meta p-3"><div class="small text-muted">Điện thoại</div><strong id="providerPreviewPhone">-</strong></div></div><div class="col-md-6"><div class="invoice-meta p-3"><div class="small text-muted">Thành phố</div><strong id="providerPreviewCity">-</strong></div></div><div class="col-md-6"><div class="invoice-meta p-3"><div class="small text-muted">Trạng thái</div><strong id="providerPreviewStatus">-</strong></div></div><div class="col-12"><h6 class="mb-2">Mô tả thương hiệu</h6><p id="providerPreviewDescription" class="mb-0 text-muted">-</p></div><div class="col-12"><h6 class="mb-2">Chính sách hỗ trợ</h6><p id="providerPreviewPolicy" class="mb-0 text-muted">-</p></div></div></div><div class="modal-footer"><button type="button" class="btn btn-outline-primary" data-bs-dismiss="modal">Đóng</button></div></div></div></div>
    `);
  };

  const renderProviderTours = () => {
    const providerTours = db.tours.filter((tour) => String(tour.providerId) === String(activeProviderId));
    const statusOptions = [...new Set(providerTours.map((tour) => labelProviderStatus(tour.status)).filter(Boolean))];
    const rows = providerTours.map((tour) => {
      const statusLabel = labelProviderStatus(tour.status);
      return {
        search: `${tour.name} ${tour.location} ${tour.type}`,
        attrs: { status: statusLabel, location: tour.location },
        cells: [
          `<div class="d-flex gap-2 align-items-center"><img src="${tour.image}" style="width:58px;height:46px;border-radius:0.6rem;object-fit:cover;" alt="${tour.name}" /><div><strong>${tour.name}</strong><div class="small text-muted">${tour.location}</div></div></div>`,
          `${tour.duration}N${tour.nights}Đ`,
          vnd(tour.price),
          `${tour.booked}`,
          statusBadge(statusLabel),
          `<div class="table-actions d-flex gap-1"><a href="${addQuery(routes.providerTourEdit, { id: tour.id })}" class="btn btn-sm btn-outline-primary">Sửa</a><button class="btn btn-sm btn-outline-danger" data-action="provider-delete-tour" data-tour-id="${tour.id}">Xóa</button></div>`
        ]
      };
    });

    return providerShell("provider-tours", "Danh sách tour của nhà cung cấp", "Quản lý tất cả tour đang mở bán, cập nhật giá và lịch trình.", renderSmartTable({
      title: "Tour đang quản lý",
      subtitle: "Sử dụng bộ lọc để tìm nhanh tour theo điểm đến hoặc trạng thái.",
      addLabel: "Thêm tour",
      addHref: routes.providerTourForm,
      filters: [{ field: "location", label: "Địa điểm", options: [...new Set(providerTours.map((tour) => tour.location))] }, { field: "status", label: "Trạng thái", options: statusOptions.length ? statusOptions : ["Đang hoạt động", "Tạm dừng", "Nháp"] }],
      headers: ["Tour", "Thời lượng", "Giá", "Lượt đặt", "Trạng thái", "Hành động"],
      rows,
      pageSize: 6
    }));
  };
  const providerTourFormContent = ({ isEdit = false, tour = null } = {}) => {
    const selectedTour = isEdit ? tour : null;
    const selectedType = selectedTour?.type || "Nghỉ dưỡng";
    const durationValue = selectedTour ? `${selectedTour.duration || 1} ngày ${selectedTour.nights || 0} đêm` : "";
    const itineraryValue = Array.isArray(selectedTour?.itinerary) ? selectedTour.itinerary.join("\n") : "";
    const includedValue = Array.isArray(selectedTour?.includes) ? selectedTour.includes.join("\n") : "";
    const policyValue = Array.isArray(selectedTour?.policy) ? selectedTour.policy.join("\n") : "";
    const salePrice = Number(selectedTour?.price || 0);
    const listedPrice = Number(selectedTour?.oldPrice || selectedTour?.price || 0);
    const maxGuests = Number(selectedTour?.maxGuests || selectedTour?.availableSlots || 30);
    const prefillImages = (selectedTour?.gallery?.length ? selectedTour.gallery : (selectedTour?.image ? [selectedTour.image] : []))
      .slice(0, 6)
      .map((url) => `<div class="col-4"><img src="${url}" class="rounded-3" alt="preview" style="width:100%;height:100px;object-fit:cover;" /></div>`)
      .join("");

    return `
      <div class="panel-card p-3 p-lg-4"><h5 class="mb-3">${isEdit ? "Cập nhật tour" : "Thêm tour mới"}</h5><form id="providerTourForm" class="row g-3 needs-validation" novalidate><div class="col-12"><h6>1. Thông tin cơ bản</h6></div><div class="col-md-8"><label class="form-label">Tên tour</label><input class="form-control" required value="${selectedTour?.name || ""}" placeholder="Ví dụ: Phú Quốc nghỉ dưỡng 4N3Đ" /></div><div class="col-md-4"><label class="form-label">Loại tour</label><select class="form-select"><option ${selectedType === "Nghỉ dưỡng" ? "selected" : ""}>Nghỉ dưỡng</option><option ${selectedType === "Khám phá" ? "selected" : ""}>Khám phá</option><option ${selectedType === "Gia đình" ? "selected" : ""}>Gia đình</option></select></div><div class="col-md-4"><label class="form-label">Điểm khởi hành</label><input class="form-control" value="${selectedTour?.startPoint || ""}" /></div><div class="col-md-4"><label class="form-label">Điểm đến</label><input class="form-control" value="${selectedTour?.location || ""}" /></div><div class="col-md-4"><label class="form-label">Thời lượng</label><input class="form-control" value="${durationValue}" /></div><div class="col-12 mt-2"><h6>2. Lịch trình</h6></div><div class="col-12"><textarea class="form-control" rows="4" placeholder="Mỗi ngày một dòng...">${itineraryValue}</textarea></div><div class="col-12 mt-2"><h6>3. Giá & khuyến mãi</h6></div><div class="col-md-4"><label class="form-label">Giá bán</label><input class="form-control" value="${salePrice > 0 ? salePrice : ""}" /></div><div class="col-md-4"><label class="form-label">Giá niêm yết</label><input class="form-control" value="${listedPrice > 0 ? listedPrice : ""}" /></div><div class="col-md-4"><label class="form-label">Số chỗ tối đa</label><input class="form-control" value="${maxGuests}" /></div><div class="col-12 mt-2"><h6>4. Hình ảnh</h6></div><div class="col-12"><div class="invoice-meta p-3"><label class="form-label fw-semibold">Tải ảnh tour</label><input type="file" id="providerTourImageInput" class="form-control" accept="image/png,image/jpeg,image/webp" multiple /><div class="form-text">Hỗ trợ JPG/PNG/WEBP, tối đa 8MB mỗi ảnh.</div></div><div class="row g-2 mt-2" id="providerTourImagePreview">${prefillImages}</div></div><div class="col-12 mt-2"><h6>5. Dịch vụ bao gồm & chính sách</h6></div><div class="col-md-6"><textarea class="form-control" rows="4" placeholder="Liệt kê dịch vụ bao gồm">${includedValue}</textarea></div><div class="col-md-6"><textarea class="form-control" rows="4" placeholder="Chính sách đổi/hủy tour">${policyValue}</textarea></div><div class="col-12 d-flex gap-2 mt-3"><button class="btn btn-outline-primary" type="button">Lưu nháp</button><button class="btn btn-primary" type="submit">${isEdit ? "Cập nhật tour" : "Xuất bản tour"}</button></div></form></div>
    `;
  };

  const renderProviderTourForm = () => providerShell("provider-tour-form", "Thêm tour mới", "Tạo mới tour với đầy đủ lịch trình, giá và hình ảnh.", providerTourFormContent({ isEdit: false }));
  const renderProviderTourEdit = () => {
    const editId = Number(new URLSearchParams(window.location.search).get("id") || 0);
    const editingTour = Number.isFinite(editId) && editId > 0 ? getTourById(editId) : null;
    return providerShell("provider-tour-form", "Sửa tour", "Điều chỉnh thông tin tour hiện có trước khi tái xuất bản.", providerTourFormContent({ isEdit: true, tour: editingTour }));
  };

  const renderProviderBookings = () => {
    const rows = db.bookings.filter((booking) => String(booking.providerId) === String(activeProviderId)).map((booking) => ({
      search: `${booking.code} ${getTourById(booking.tourId)?.name || ""} ${booking.customerName || ""} ${booking.customerEmail || ""}`,
      attrs: { status: booking.status, payment: booking.paymentStatus },
      cells: [
        booking.code,
        booking.customerName || db.users.find((item) => String(item.id) === String(booking.userId))?.name || "Khách vãng lai",
        getTourById(booking.tourId)?.name || "-",
        dateVN(booking.bookingDate),
        statusBadge(booking.status),
        statusBadge(booking.paymentStatus),
        `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary" data-bs-toggle="offcanvas" data-bs-target="#providerBookingDrawer" data-booking-code="${booking.code}">Xem</button><button class="btn btn-sm btn-outline-success" data-action="provider-confirm-booking" data-booking-id="${booking.id}" data-booking-code="${booking.code}">Xác nhận</button><button class="btn btn-sm btn-outline-danger" data-action="provider-cancel-booking" data-booking-id="${booking.id}" data-booking-code="${booking.code}">Hủy</button></div>`
      ]
    }));

    return providerShell("provider-bookings", "Quản lý booking nhận được", "Xác nhận nhanh đơn mới, kiểm tra thanh toán và phản hồi khách.", `${renderSmartTable({ title: "Danh sách booking", subtitle: "Hệ thống tự động đồng bộ booking theo tour bạn đang mở bán.", filters: [{ field: "status", label: "Trạng thái", options: ["Đã xác nhận", "Chờ xác nhận", "Đã hủy", "Hoàn tất"] }, { field: "payment", label: "Thanh toán", options: ["Đã thanh toán", "Chưa thanh toán", "Thất bại"] }], headers: ["Mã đơn", "Khách hàng", "Tour", "Ngày đặt", "Trạng thái", "Thanh toán", "Hành động"], rows, pageSize: 7 })}<div class="offcanvas offcanvas-end" tabindex="-1" id="providerBookingDrawer"><div class="offcanvas-header"><h5 class="offcanvas-title">Chi tiết booking</h5><button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button></div><div class="offcanvas-body" id="providerBookingDrawerBody"><p class="text-muted">Chọn booking để xem thông tin chi tiết.</p></div></div>`);
  };

  const renderProviderBookingDetail = () => {
    const booking = db.bookings.find((item) => item.code === new URLSearchParams(window.location.search).get("code")) || db.bookings[0];
    const tour = getTourById(booking.tourId);
    const user = db.users.find((item) => String(item.id) === String(booking.userId));
    const customerName = booking.customerName || user?.name || "-";
    const customerEmail = booking.customerEmail || user?.email || "-";
    const customerPhone = booking.customerPhone || user?.phone || "-";
    return providerShell("provider-bookings", `Chi tiết booking ${booking.code}`, "Theo dõi toàn bộ thông tin khách, tour và trạng thái xử lý.", `
      <div class="row g-4"><div class="col-lg-8"><div class="panel-card p-3 p-lg-4 mb-4"><h5 class="mb-3">Thông tin khách hàng</h5><div class="row g-2"><div class="col-md-6"><div class="invoice-meta p-3"><div class="small text-muted">Họ tên</div><strong>${customerName}</strong></div></div><div class="col-md-6"><div class="invoice-meta p-3"><div class="small text-muted">Email</div><strong>${customerEmail}</strong></div></div><div class="col-md-6"><div class="invoice-meta p-3"><div class="small text-muted">Số điện thoại</div><strong>${customerPhone}</strong></div></div><div class="col-md-6"><div class="invoice-meta p-3"><div class="small text-muted">Ngày đặt</div><strong>${dateVN(booking.bookingDate)}</strong></div></div></div></div><div class="panel-card p-3 p-lg-4"><h5 class="mb-3">Thông tin tour</h5><p><strong>${tour?.name || "-"}</strong> • ${tour?.location || "-"}</p><p>Khởi hành: ${dateVN(booking.departureDate)} • Khách: ${booking.travelers}</p><p>Tổng tiền: <strong>${vnd(booking.amount)}</strong></p></div></div><div class="col-lg-4"><aside class="sticky-booking p-3 p-lg-4"><h6 class="mb-3">Trạng thái xử lý</h6><p class="mb-2">Booking: ${statusBadge(booking.status)}</p><p class="mb-3">Thanh toán: ${statusBadge(booking.paymentStatus)}</p><button class="btn btn-success w-100 mb-2" data-action="provider-confirm-booking" data-booking-id="${booking.id}" data-booking-code="${booking.code}">Xác nhận booking</button><button class="btn btn-outline-danger w-100 mb-2" data-action="provider-cancel-booking" data-booking-id="${booking.id}" data-booking-code="${booking.code}">Hủy booking</button><a href="${routes.providerFeedback}" class="btn btn-outline-primary w-100">Gửi phản hồi khách</a></aside></div></div>
    `);
  };

  const renderProviderServices = () => {
    const rows = db.services.map((service) => ({ search: `${service.name} ${service.type}`, attrs: { status: service.status, type: service.type }, cells: [service.name, service.type, vnd(service.price), statusBadge(service.status), `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary" data-action="provider-edit-service" data-service-id="${service.id}" data-service-name="${service.name}" data-service-type="${service.type}" data-service-price="${service.price}">Sửa</button><button class="btn btn-sm btn-outline-danger" data-action="provider-delete-service" data-service-id="${service.id}">Xóa</button></div>`] }));
    return providerShell("provider-services", "Quản lý dịch vụ đi kèm", "Thêm dịch vụ phụ trợ để tăng giá trị đơn hàng.", `
      <div class="panel-card p-3 p-lg-4 mb-4"><h5 class="mb-3">Thêm dịch vụ mới</h5><form id="providerServiceForm" class="row g-2 needs-validation" novalidate><div class="col-md-4"><input class="form-control" placeholder="Tên dịch vụ" required /></div><div class="col-md-3"><select class="form-select"><option>Di chuyển</option><option>Lưu trú</option><option>Bảo hiểm</option></select></div><div class="col-md-3"><input class="form-control" placeholder="Giá" required /></div><div class="col-md-2"><button class="btn btn-primary w-100" type="submit">Thêm</button></div></form></div>
      ${renderSmartTable({ title: "Danh sách dịch vụ", subtitle: "Dịch vụ hiển thị tại bước đặt tour để khách lựa chọn thêm.", filters: [{ field: "status", label: "Trạng thái", options: ["Đang hoạt động", "Tạm dừng"] }, { field: "type", label: "Loại", options: ["Di chuyển", "Lưu trú", "Bảo hiểm"] }], headers: ["Dịch vụ", "Loại", "Giá", "Trạng thái", "Hành động"], rows, pageSize: 5 })}
    `);
  };

  const renderProviderPromotions = () => {
    const rows = db.promotions.map((promo) => ({
      search: `${promo.code} ${promo.title}`,
      attrs: { status: promo.status },
      cells: [
        promo.code,
        promo.title,
        promo.type === "percent" ? `${promo.value}%` : vnd(promo.value),
        `${dateVN(promo.start)} - ${dateVN(promo.end)}`,
        statusBadge(promo.status),
        `<div class="table-actions d-flex gap-1"><a href="${addQuery(routes.providerPromotionEdit, { id: promo.id })}" class="btn btn-sm btn-outline-primary">Sửa</a><button class="btn btn-sm btn-outline-danger" data-action="provider-delete-promotion" data-promotion-id="${promo.id}" data-promotion-title="${promo.title}">Xóa</button><button class="btn btn-sm btn-outline-secondary" data-action="provider-toggle-promotion" data-promotion-id="${promo.id}" data-promotion-status="${promo.status}">${promo.status === "Đang hoạt động" ? "Ngừng" : "Kích hoạt"}</button></div>`
      ]
    }));

    return providerShell("provider-promotions", "Quản lý khuyến mãi", "Theo dõi hiệu quả mã giảm giá và điều chỉnh chương trình theo mùa.", renderSmartTable({
      title: "Danh sách mã khuyến mãi",
      subtitle: "Bấm Thêm để mở trang tạo khuyến mãi riêng.",
      addLabel: "Thêm khuyến mãi",
      addHref: routes.providerPromotionCreate,
      filters: [{ field: "status", label: "Trạng thái", options: ["Đang hoạt động", "Tạm dừng"] }],
      headers: ["Mã", "Chương trình", "Giá trị", "Hiệu lực", "Trạng thái", "Hành động"],
      rows,
      pageSize: 6
    }));
  };

  const providerPromotionFormContent = ({ isEdit = false, promo = null } = {}) => {
    const current = promo || {};
    const normalizedStatus = String(current.status || "").toLowerCase().includes("đang") ? "active" : "inactive";
    const normalizedType = current.type === "fixed" ? "fixed" : "percent";

    return `
      <div class="panel-card p-3 p-lg-4">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <h5 class="mb-1">${isEdit ? "Cập nhật khuyến mãi" : "Tạo khuyến mãi mới"}</h5>
            <p class="text-muted mb-0">${isEdit ? "Điều chỉnh thông tin mã giảm đang có." : "Thiết lập chương trình giảm giá theo tour của bạn."}</p>
          </div>
          <a href="${routes.providerPromotions}" class="btn btn-outline-primary">Quay lại danh sách</a>
        </div>
        <form id="providerPromotionPageForm" class="row g-3 needs-validation" novalidate>
          <div class="col-md-4">
            <label class="form-label">Mã khuyến mãi</label>
            <input id="providerPromotionCode" class="form-control" value="${current.code || ""}" ${isEdit ? "disabled" : "required"} placeholder="VD: SUMMER26" />
          </div>
          <div class="col-md-8">
            <label class="form-label">Tên chương trình</label>
            <input id="providerPromotionTitle" class="form-control" required value="${current.title || ""}" placeholder="VD: Giảm giá mùa hè" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Ảnh chương trình (URL - tùy chọn)</label>
            <input id="providerPromotionImage" class="form-control" value="${current.image || ""}" placeholder="https://..." />
          </div>
          <div class="col-md-6">
            <label class="form-label">Ảnh chương trình (upload)</label>
            <input id="providerPromotionImageFile" class="form-control" type="file" accept="image/png,image/jpeg,image/webp" />
            <div class="form-text">JPG/PNG/WEBP, tối đa 8MB.</div>
          </div>
          <div class="col-12">
            <img id="providerPromotionImagePreview" src="${current.image || DEFAULT_POST_THUMBNAIL}" alt="Ảnh khuyến mãi" class="rounded-3 border w-100" style="max-height: 220px; object-fit: cover;" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Loại giảm</label>
            <select id="providerPromotionType" class="form-select">
              <option value="percent" ${normalizedType === "percent" ? "selected" : ""}>Phần trăm (%)</option>
              <option value="fixed" ${normalizedType === "fixed" ? "selected" : ""}>Số tiền (VNĐ)</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Giá trị giảm</label>
            <input id="providerPromotionValue" class="form-control" type="number" min="1" required value="${current.value || ""}" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Đơn tối thiểu</label>
            <input id="providerPromotionMinOrder" class="form-control" type="number" min="0" value="${current.minOrderValue || ""}" placeholder="Tuỳ chọn" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Số lượt tối đa</label>
            <input id="providerPromotionUsageLimit" class="form-control" type="number" min="1" value="${current.usageLimit || ""}" placeholder="Tuỳ chọn" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Ngày bắt đầu</label>
            <input id="providerPromotionStartDate" class="form-control" type="date" required value="${current.start ? normalizeDate(current.start) : todayISO()}" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Ngày kết thúc</label>
            <input id="providerPromotionEndDate" class="form-control" type="date" required value="${current.end ? normalizeDate(current.end) : todayISO()}" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Trạng thái</label>
            <select id="providerPromotionStatus" class="form-select">
              <option value="active" ${normalizedStatus === "active" ? "selected" : ""}>Đang hoạt động</option>
              <option value="inactive" ${normalizedStatus === "inactive" ? "selected" : ""}>Tạm dừng</option>
            </select>
          </div>
          <div class="col-12">
            <label class="form-label">Mô tả chương trình</label>
            <textarea id="providerPromotionDescription" class="form-control" rows="4" placeholder="Mô tả điều kiện áp dụng, tour áp dụng...">${current.description || ""}</textarea>
          </div>
          <div class="col-12 d-flex flex-wrap gap-2">
            <button class="btn btn-primary" type="submit">${isEdit ? "Cập nhật" : "Lưu khuyến mãi"}</button>
            <a href="${routes.providerPromotions}" class="btn btn-outline-secondary">Hủy</a>
          </div>
        </form>
      </div>
    `;
  };

  const renderProviderPromotionCreate = () =>
    providerShell("provider-promotions", "Thêm khuyến mãi", "Tạo chương trình giảm giá mới cho tour của nhà cung cấp.", providerPromotionFormContent({ isEdit: false }));

  const renderProviderPromotionEdit = () => {
    const editId = Number(new URLSearchParams(window.location.search).get("id") || 0);
    const promo = Number.isFinite(editId) && editId > 0
      ? db.promotions.find((item) => Number(item.id) === editId)
      : null;

    return providerShell(
      "provider-promotions",
      "Sửa khuyến mãi",
      "Điều chỉnh thông tin chương trình giảm giá hiện có.",
      providerPromotionFormContent({ isEdit: true, promo })
    );
  };

  const renderProviderFeedback = () => {
    const rows = db.comments.map((comment) => ({ search: `${comment.user} ${comment.text}`, attrs: { status: comment.status }, cells: [comment.user, getTourById(comment.tourId)?.name || "-", `${starHTML(comment.rating)} (${comment.rating}/5)`, `<span class="text-muted">${comment.text}</span>`, statusBadge(comment.status), `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary" data-action="provider-reply-feedback" data-comment-id="${comment.id}">Phản hồi</button><button class="btn btn-sm btn-outline-danger" data-action="provider-hide-feedback" data-comment-id="${comment.id}">Ẩn</button></div>`] }));
    return providerShell("provider-feedback", "Phản hồi khách hàng", "Theo dõi và phản hồi đánh giá để cải thiện trải nghiệm tour.", `
      <div class="panel-card p-3 p-lg-4 mb-4"><h5 class="mb-3">Mẫu phản hồi nhanh</h5><textarea id="providerFeedbackTemplate" class="form-control" rows="3" placeholder="Cảm ơn anh/chị đã trải nghiệm, đội ngũ sẽ... "></textarea><button id="providerFeedbackTemplateSave" class="btn btn-primary mt-2" type="button">Lưu mẫu phản hồi</button></div>
      ${renderSmartTable({ title: "Danh sách đánh giá", subtitle: "Ưu tiên phản hồi đánh giá mới trong 24 giờ.", filters: [{ field: "status", label: "Trạng thái", options: ["Công khai", "Đang duyệt"] }], headers: ["Khách hàng", "Tour", "Đánh giá", "Nội dung", "Trạng thái", "Hành động"], rows, pageSize: 6 })}
    `);
  };
  const renderAdminDashboard = () => {
    const summary = adminDashboardData?.summary || {};
    const totalUsers = Number(summary.total_users ?? db.users.length);
    const totalProviders = Number(summary.total_providers ?? db.providers.length);
    const totalTours = Number(summary.total_tours ?? db.tours.length);
    const totalBookings = Number(summary.total_bookings ?? db.bookings.length);
    const totalRevenue = Number(summary.total_revenue ?? db.bookings.reduce((total, booking) => total + booking.amount, 0));

    const recentBookings = Array.isArray(adminDashboardData?.recent_bookings) ? adminDashboardData.recent_bookings : [];
    const pendingProviders = Array.isArray(adminDashboardData?.pending_providers) ? adminDashboardData.pending_providers : [];

    return adminShell("admin-dashboard", "Admin Dashboard", "Tổng quan toàn hệ thống booking, thanh toán và hiệu suất nhà cung cấp.", `
      ${metricCards([
        { label: "Tổng người dùng", value: totalUsers, icon: "bi-people", color: "blue", note: "Đồng bộ theo dữ liệu backend" },
        { label: "Tổng provider", value: totalProviders, icon: "bi-building", color: "teal", note: `${pendingProviders.length} provider chờ duyệt` },
        { label: "Tổng booking", value: totalBookings, icon: "bi-journal-check", color: "orange", note: "Bao gồm mọi trạng thái đơn" },
        { label: "Doanh thu", value: vnd(totalRevenue), icon: "bi-cash-stack", color: "red", note: "Tổng đơn đã thanh toán" }
      ])}
      <div class="row g-4"><div class="col-xl-8"><div class="panel-card p-3 p-lg-4 h-100"><div class="d-flex justify-content-between align-items-center mb-3"><h5 class="mb-0">Doanh thu theo tháng</h5><span class="badge-soft">Năm 2026</span></div><canvas id="adminRevenueChart" height="130"></canvas></div></div><div class="col-xl-4"><div class="panel-card p-3 p-lg-4 h-100"><h5 class="mb-3">Cơ cấu loại tour</h5><canvas id="adminCategoryChart" height="180"></canvas></div></div></div>
      <div class="row g-4 mt-1"><div class="col-xl-6"><div class="table-card h-100"><h5 class="mb-3">Booking gần đây</h5><div class="table-responsive"><table class="table table-hover"><thead><tr><th>Mã đơn</th><th>Tour</th><th>Trạng thái</th><th>Tổng tiền</th></tr></thead><tbody>${recentBookings.map((booking) => `<tr><td>${booking.booking_code || `BK${booking.id}`}</td><td>${booking.tour_title || getTourById(booking.tour_id)?.name || "-"}</td><td>${statusBadge(labelBookingStatus(booking.booking_status))}</td><td>${vnd(booking.total_amount || 0)}</td></tr>`).join("") || '<tr><td colspan="4" class="text-center text-muted py-4">Chưa có booking gần đây.</td></tr>'}</tbody></table></div></div></div><div class="col-xl-6"><div class="table-card h-100"><h5 class="mb-3">Provider chờ duyệt</h5><div class="table-responsive"><table class="table table-hover"><thead><tr><th>Provider</th><th>Thành phố</th><th>Ngày đăng ký</th><th></th></tr></thead><tbody>${pendingProviders.map((provider) => `<tr><td>${provider.company_name || provider.full_name || "-"}</td><td>${provider.city || provider.address || "-"}</td><td>${dateVN(provider.created_at)}</td><td><div class="table-actions d-flex gap-2 justify-content-end"><button class="btn btn-sm btn-outline-primary" data-action="admin-provider-approve" data-provider-request-id="${provider.id}">Duyệt</button><button class="btn btn-sm btn-outline-danger" data-action="admin-provider-reject" data-provider-request-id="${provider.id}">Từ chối</button></div></td></tr>`).join("") || '<tr><td colspan="4" class="text-center text-muted py-4">Không có provider chờ duyệt.</td></tr>'}</tbody></table></div></div></div></div>
    `);
  };

  const adminRows = {
    users: [],
    tours: [],
    categories: [],
    bookings: [],
    payments: [],
    invoices: [],
    posts: [],
    promotions: [],
    providers: [],
    comments: []
  };

  const refreshAdminRows = () => {
    adminRows.users = db.users.map((user) => ({
      search: `${user.name} ${user.email} ${user.role}`,
      attrs: { role: user.role, status: user.status },
      cells: [
        `<div><strong>${user.name}</strong><div class="small text-muted">${user.email}</div></div>`,
        user.phone,
        user.role,
        user.city,
        statusBadge(user.status),
        dateVN(user.joinedAt),
        `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary" data-action="admin-user-edit" data-user-id="${user.id}">Sửa</button><button class="btn btn-sm btn-outline-danger" data-action="admin-user-toggle-lock" data-user-id="${user.id}" data-user-status="${user.status}">${user.status === 'Khóa' ? 'Mở khóa' : 'Khóa'}</button></div>`
      ]
    }));

    adminRows.tours = db.tours.map((tour) => ({
      search: `${tour.name} ${tour.location} ${tour.type}`,
      attrs: { category: tour.category, status: tour.status === 'draft' ? 'Nháp' : 'Đang hoạt động' },
      cells: [
        `<div class="d-flex gap-2 align-items-center"><img src="${tour.image}" style="width:58px;height:46px;border-radius:0.6rem;object-fit:cover;" alt="${tour.name}" /><div><strong>${tour.name}</strong><div class="small text-muted">${tour.location}</div></div></div>`,
        tour.type,
        `${tour.duration}N${tour.nights}Đ`,
        vnd(tour.price),
        statusBadge(tour.status === 'draft' ? 'Nháp' : 'Đang hoạt động'),
        `<div class="table-actions d-flex gap-1"><a href="${addQuery(routes.adminTourEdit, { id: tour.id })}" class="btn btn-sm btn-outline-primary">Sửa</a><button class="btn btn-sm btn-outline-danger" data-action="admin-tour-delete" data-tour-id="${tour.id}" data-tour-name="${tour.name}">Xóa</button></div>`
      ]
    }));

    adminRows.categories = db.categories.map((category) => ({
      search: `${category.name}`,
      attrs: { status: 'Đang hoạt động' },
      cells: [
        category.id,
        category.name,
        `${category.tours} tour`,
        statusBadge('Đang hoạt động'),
        `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary" data-action="admin-category-edit" data-category-id="${category.id}">Sửa</button><button class="btn btn-sm btn-outline-danger" data-action="admin-category-delete" data-category-id="${category.id}">Xóa</button></div>`
      ]
    }));

    adminRows.bookings = db.bookings.map((booking) => ({
      search: `${booking.code} ${booking.status} ${booking.paymentStatus}`,
      attrs: { status: booking.status, payment: booking.paymentStatus },
      cells: [
        booking.code,
        getTourById(booking.tourId)?.name || '-',
        db.users.find((user) => String(user.id) === String(booking.userId))?.name || 'Khách lẻ',
        dateVN(booking.bookingDate),
        statusBadge(booking.status),
        statusBadge(booking.paymentStatus),
        vnd(booking.amount),
        `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-danger" data-action="admin-booking-cancel" data-booking-id="${booking.id}">Can thiệp</button></div>`
      ]
    }));

    adminRows.payments = payments.map((payment) => ({
      search: `${payment.id} ${payment.bookingCode} ${payment.method}`,
      attrs: { status: payment.status },
      cells: [
        payment.id,
        payment.bookingCode,
        payment.method,
        vnd(payment.amount),
        dateVN(payment.paidAt),
        statusBadge(payment.status),
        `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-danger" data-action="admin-payment-mark-failed" data-payment-id="${payment.id}">Rà soát</button></div>`
      ]
    }));

    adminRows.invoices = invoices.map((invoice) => ({
      search: `${invoice.id} ${invoice.bookingCode}`,
      attrs: { status: invoice.status },
      cells: [
        invoice.id,
        invoice.bookingCode,
        db.users.find((user) => String(user.id) === String(invoice.userId))?.name || '-',
        dateVN(invoice.issuedAt),
        vnd(invoice.amount),
        statusBadge(invoice.status),
        `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary" data-action="download-invoice" data-invoice-id="${invoice.invoiceId}" data-booking-code="${invoice.bookingCode}">In</button></div>`
      ]
    }));
    adminRows.posts = db.posts.map((post) => {
      const status = post.status || "Công khai";
      const archived = String(status).toLowerCase().includes("ẩn") || String(status).toLowerCase() === "archived";
      return {
        search: `${post.title} ${post.category} ${post.author}`,
        attrs: { status, category: post.category },
        cells: [
          `<strong>${post.title}</strong>`,
          post.category,
          post.author,
          dateVN(post.date),
          statusBadge(status),
          `<div class="table-actions d-flex gap-1"><a href="${addQuery(routes.adminPostEdit, { id: post.id })}" class="btn btn-sm btn-outline-primary">Sửa</a><button class="btn btn-sm btn-outline-danger" data-action="admin-post-delete" data-post-id="${post.id}" data-post-title="${post.title}">Xóa</button>${archived ? `<button class="btn btn-sm btn-outline-secondary" data-action="admin-post-toggle-status" data-post-id="${post.id}" data-post-status="${status}">Công khai</button>` : ""}</div>`
        ]
      };
    });

    adminRows.promotions = db.promotions.map((promo) => ({
      search: `${promo.code} ${promo.title}`,
      attrs: { status: promo.status },
      cells: [
        promo.code,
        promo.title,
        promo.type === 'percent' ? `${promo.value}%` : vnd(promo.value),
        `${dateVN(promo.start)} - ${dateVN(promo.end)}`,
        statusBadge(promo.status),
        `<div class="table-actions d-flex gap-1"><a href="${addQuery(routes.adminPromotionEdit, { id: promo.id })}" class="btn btn-sm btn-outline-primary">Sửa</a><button class="btn btn-sm btn-outline-danger" data-action="admin-promotion-delete" data-promotion-id="${promo.id}" data-promotion-title="${promo.title}">Xóa</button></div>`
      ]
    }));

    adminRows.providers = db.providers.map((provider) => ({
      search: `${provider.name} ${provider.email} ${provider.city}`,
      attrs: { status: provider.status, city: provider.city },
      cells: [
        `<div><strong>${provider.name}</strong><div class="small text-muted">${provider.email}</div></div>`,
        provider.city,
        provider.totalTours,
        provider.rating,
        statusBadge(provider.status),
        dateVN(provider.joinedAt),
        `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary" data-action="admin-provider-approve" data-provider-id="${provider.id}">Duyệt</button><button class="btn btn-sm btn-outline-danger" data-action="admin-provider-reject" data-provider-id="${provider.id}">Khóa</button></div>`
      ]
    }));

    adminRows.comments = db.comments.map((comment) => ({
      search: `${comment.user} ${comment.text}`,
      attrs: { status: comment.status },
      cells: [
        comment.id,
        comment.user,
        getTourById(comment.tourId)?.name || '-',
        `${starHTML(comment.rating)} (${comment.rating})`,
        `<span class="text-muted">${comment.text}</span>`,
        statusBadge(comment.status),
        `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary" data-action="admin-comment-delete" data-comment-id="${comment.id}">Xóa</button><button class="btn btn-sm btn-outline-danger" data-action="admin-comment-hide" data-comment-id="${comment.id}">Ẩn</button></div>`
      ]
    }));
  };

  refreshAdminRows();

  const renderAdminCrudPage = ({ active, title, subtitle, dataset, headers, filters, addLabel = "", addAction = "", addHref = "#" }) =>
    adminShell(active, title, subtitle, renderSmartTable({ title, subtitle, addLabel, addAction, addHref, filters, headers, rows: dataset, pageSize: 8 }));

  const renderAdminUsers = () => renderAdminCrudPage({ active: "admin-users", title: "Quản lý người dùng", subtitle: "Theo dõi tài khoản khách hàng, nhà cung cấp và trạng thái hoạt động.", dataset: adminRows.users, headers: ["Người dùng", "Điện thoại", "Vai trò", "Thành phố", "Trạng thái", "Ngày tạo", "Hành động"], filters: [{ field: "role", label: "Vai trò", options: ["Admin", "Provider", "User"] }, { field: "status", label: "Trạng thái", options: ["Đang hoạt động", "Tạm dừng", "Khóa"] }], addLabel: "Thêm người dùng", addAction: "admin-create-user" });
  const renderAdminTours = () => renderAdminCrudPage({ active: "admin-tours", title: "Quản lý tour", subtitle: "Kiểm duyệt và vận hành toàn bộ sản phẩm tour trên hệ thống.", dataset: adminRows.tours, headers: ["Tour", "Loại", "Thời lượng", "Giá", "Trạng thái", "Hành động"], filters: [{ field: "category", label: "Danh mục", options: ["Biển", "Núi", "City", "Seasonal"] }, { field: "status", label: "Trạng thái", options: ["Đang hoạt động", "Tạm dừng"] }], addLabel: "Thêm tour", addHref: routes.adminTourCreate });
  const renderAdminCategories = () => renderAdminCrudPage({ active: "admin-categories", title: "Quản lý danh mục", subtitle: "Tạo và quản lý nhóm tour theo mục tiêu kinh doanh.", dataset: adminRows.categories, headers: ["Mã", "Tên danh mục", "Số tour", "Trạng thái", "Hành động"], filters: [{ field: "status", label: "Trạng thái", options: ["Đang hoạt động", "Tạm dừng"] }], addLabel: "Thêm danh mục", addAction: "admin-create-category" });
  const renderAdminBookings = () => renderAdminCrudPage({ active: "admin-bookings", title: "Quản lý đơn đặt tour", subtitle: "Theo dõi vòng đời booking và xử lý ngoại lệ kịp thời.", dataset: adminRows.bookings, headers: ["Mã đơn", "Tour", "Khách", "Ngày đặt", "Booking", "Thanh toán", "Tổng", "Hành động"], filters: [{ field: "status", label: "Trạng thái booking", options: ["Đã xác nhận", "Chờ xác nhận", "Đã hủy", "Hoàn tất"] }, { field: "payment", label: "Trạng thái thanh toán", options: ["Đã thanh toán", "Chưa thanh toán", "Thất bại"] }] });
  const renderAdminPayments = () => renderAdminCrudPage({ active: "admin-payments", title: "Quản lý thanh toán", subtitle: "Giám sát giao dịch theo phương thức và trạng thái xử lý.", dataset: adminRows.payments, headers: ["Mã TT", "Mã booking", "Phương thức", "Số tiền", "Ngày", "Trạng thái", "Hành động"], filters: [{ field: "status", label: "Trạng thái", options: ["Thành công", "Chưa thanh toán", "Thất bại"] }] });
  const renderAdminInvoices = () => renderAdminCrudPage({ active: "admin-invoices", title: "Quản lý hóa đơn", subtitle: "Kiểm soát hóa đơn phát hành và trạng thái thanh toán.", dataset: adminRows.invoices, headers: ["Mã hóa đơn", "Mã booking", "Khách hàng", "Ngày phát hành", "Tổng", "Trạng thái", "Hành động"], filters: [{ field: "status", label: "Trạng thái", options: ["Đã thanh toán", "Chưa thanh toán", "Thất bại"] }] });
  const renderAdminPosts = () => renderAdminCrudPage({ active: "admin-posts", title: "Quản lý bài viết", subtitle: "Biên tập nội dung cẩm nang và tin tức truyền thông.", dataset: adminRows.posts, headers: ["Tiêu đề", "Danh mục", "Tác giả", "Ngày", "Trạng thái", "Hành động"], filters: [{ field: "category", label: "Danh mục", options: [...new Set(db.posts.map((post) => post.category))] }, { field: "status", label: "Trạng thái", options: ["Công khai", "Nháp", "Đã ẩn"] }], addLabel: "Viết bài mới", addHref: routes.adminPostCreate });
  const renderAdminPromotions = () => renderAdminCrudPage({ active: "admin-promotions", title: "Quản lý khuyến mãi", subtitle: "Theo dõi hiệu lực và trạng thái mã giảm toàn hệ thống.", dataset: adminRows.promotions, headers: ["Mã", "Chương trình", "Giá trị", "Hiệu lực", "Trạng thái", "Hành động"], filters: [{ field: "status", label: "Trạng thái", options: ["Đang hoạt động", "Tạm dừng"] }], addLabel: "Tạo mã mới", addHref: routes.adminPromotionCreate });

  const adminTourFormContent = ({ isEdit = false, tour = null } = {}) => {
    const current = tour || {};
    const statusValue = String(current.status || "active").toLowerCase();
    const categoryOptions = db.categories.map((item) => `<option value="${item.id}" ${Number(item.id) === Number(current.categoryId) ? "selected" : ""}>${item.name}</option>`).join("");
    const existingImages = Array.isArray(current.gallery) ? current.gallery.filter(Boolean) : [];
    if (current.image && !existingImages.includes(current.image)) existingImages.unshift(current.image);
    const prefillImages = existingImages
      .slice(0, 6)
      .map((url) => `<div class="col-6 col-md-3"><img class="rounded-3 border w-100" src="${url}" alt="Ảnh tour" style="height:110px;object-fit:cover;" /></div>`)
      .join("");

    return `
      <div class="panel-card p-3 p-lg-4">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <h5 class="mb-1">${isEdit ? "Cập nhật tour" : "Thêm tour mới"}</h5>
            <p class="text-muted mb-0">${isEdit ? "Chỉnh sửa đầy đủ thông tin tour đang có." : "Tạo tour mới với đầy đủ nội dung, giá và lịch trình."}</p>
          </div>
          <a href="${routes.adminTours}" class="btn btn-outline-primary">Quay lại danh sách</a>
        </div>
        <form id="adminTourPageForm" class="row g-3 needs-validation" novalidate>
          <div class="col-md-8">
            <label class="form-label">Tên tour</label>
            <input id="adminTourTitle" class="form-control" required value="${current.name || ""}" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Slug</label>
            <input id="adminTourSlug" class="form-control" readonly value="${current.name ? String(current.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : ""}" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Danh mục</label>
            <select id="adminTourCategoryId" class="form-select">${categoryOptions}</select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Điểm khởi hành</label>
            <input id="adminTourDeparture" class="form-control" required value="${current.startPoint || ""}" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Điểm đến</label>
            <input id="adminTourDestination" class="form-control" required value="${current.location || ""}" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Giá người lớn</label>
            <input id="adminTourPriceAdult" class="form-control" type="number" min="1" required value="${Number(current.oldPrice || current.price || 0) || ""}" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Giá trẻ em</label>
            <input id="adminTourPriceChild" class="form-control" type="number" min="0" value="${Math.round(Number(current.oldPrice || current.price || 0) * 0.7) || ""}" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Giá em bé</label>
            <input id="adminTourPriceInfant" class="form-control" type="number" min="0" value="" placeholder="Thông tin bổ sung" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Giá khuyến mãi</label>
            <input id="adminTourDiscountPrice" class="form-control" type="number" min="0" value="${Number(current.price || 0) || ""}" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Số chỗ</label>
            <input id="adminTourMaxGuests" class="form-control" type="number" min="1" value="${Number(current.maxGuests || 30)}" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Chỗ còn lại</label>
            <input id="adminTourAvailableSlots" class="form-control" type="number" min="0" value="${Number(current.availableSlots || current.maxGuests || 30)}" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Ngày khởi hành</label>
            <input id="adminTourDepartureDate" class="form-control" type="date" value="${current.departureDates?.[0] ? normalizeDate(current.departureDates[0]) : todayISO()}" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Ngày kết thúc</label>
            <input id="adminTourReturnDate" class="form-control" type="date" value="${current.departureDates?.[0] ? normalizeDate(current.departureDates[0]) : todayISO()}" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Số ngày</label>
            <input id="adminTourDurationDays" class="form-control" type="number" min="1" value="${Number(current.duration || 1)}" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Số đêm</label>
            <input id="adminTourDurationNights" class="form-control" type="number" min="0" value="${Number(current.nights || 0)}" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Ảnh đại diện (upload)</label>
            <input id="adminTourThumbnailFile" class="form-control" type="file" accept="image/png,image/jpeg,image/webp" />
            <div class="form-text">Hỗ trợ JPG/PNG/WEBP, tối đa 8MB.</div>
          </div>
          <div class="col-md-6">
            <label class="form-label">Album ảnh (upload nhiều ảnh)</label>
            <input id="adminTourGalleryFiles" class="form-control" type="file" accept="image/png,image/jpeg,image/webp" multiple />
            <div class="form-text">Chọn tối đa 6 ảnh, ảnh đầu tiên sẽ đại diện nếu chưa có thumbnail.</div>
          </div>
          <div class="col-12">
            <div class="row g-2 mt-1" id="adminTourImagePreview">
              ${prefillImages}
            </div>
          </div>
          <div class="col-md-4">
            <label class="form-label">Trạng thái</label>
            <select id="adminTourStatus" class="form-select">
              <option value="active" ${statusValue === "active" ? "selected" : ""}>Đang hoạt động</option>
              <option value="draft" ${statusValue === "draft" ? "selected" : ""}>Nháp</option>
              <option value="inactive" ${statusValue === "inactive" ? "selected" : ""}>Tạm dừng</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Khuyến mãi áp dụng (mã)</label>
            <input id="adminTourPromotionCode" class="form-control" placeholder="VD: SUMMER26" />
          </div>
          <div class="col-md-4 d-flex align-items-end">
            <div class="form-check">
              <input id="adminTourFeatured" class="form-check-input" type="checkbox" ${current.badge ? "checked" : ""} />
              <label class="form-check-label" for="adminTourFeatured">Tour nổi bật</label>
            </div>
          </div>
          <div class="col-12">
            <label class="form-label">Mô tả ngắn</label>
            <textarea id="adminTourShortDescription" class="form-control" rows="2">${current.shortDesc || ""}</textarea>
          </div>
          <div class="col-12">
            <label class="form-label">Mô tả chi tiết</label>
            <textarea id="adminTourDescription" class="form-control" rows="4">${current.shortDesc || ""}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label">Lịch trình</label>
            <textarea id="adminTourItinerary" class="form-control" rows="5">${Array.isArray(current.itinerary) ? current.itinerary.join("\n") : ""}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label">Dịch vụ bao gồm</label>
            <textarea id="adminTourIncludedServices" class="form-control" rows="5">${Array.isArray(current.includes) ? current.includes.join("\n") : ""}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label">Dịch vụ không bao gồm</label>
            <textarea id="adminTourExcludedServices" class="form-control" rows="4"></textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label">Chính sách</label>
            <textarea id="adminTourPolicy" class="form-control" rows="4">${Array.isArray(current.policy) ? current.policy.join("\n") : ""}</textarea>
          </div>
          <div class="col-12 d-flex flex-wrap gap-2">
            <button class="btn btn-primary" type="submit">${isEdit ? "Cập nhật" : "Lưu tour"}</button>
            <a href="${routes.adminTours}" class="btn btn-outline-secondary">Hủy</a>
          </div>
        </form>
      </div>
    `;
  };

  const renderAdminTourCreate = () =>
    adminShell("admin-tours", "Thêm tour", "Nhập thông tin tour trên trang riêng để quản trị dễ hơn.", adminTourFormContent({ isEdit: false }));

  const renderAdminTourEdit = () => {
    const editId = Number(new URLSearchParams(window.location.search).get("id") || 0);
    const tour = Number.isFinite(editId) && editId > 0 ? getTourById(editId) : null;
    return adminShell("admin-tours", "Sửa tour", "Cập nhật tour trên trang chỉnh sửa riêng.", adminTourFormContent({ isEdit: true, tour }));
  };

  const adminPostFormContent = ({ isEdit = false, post = null } = {}) => {
    const current = post || {};
    const statusValue = toBackendPostStatus(current.status || "draft");
    const contentValue = current.contentRaw
      ? String(current.contentRaw)
      : Array.isArray(current.content)
      ? current.content.join("\n")
      : String(current.content || current.excerpt || "");
    const slugValue = current.slug || (current.title ? String(current.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "");
    const tagsValue = Array.isArray(current.tags) ? current.tags.join(", ") : String(current.tags || "");
    const galleryValue = Array.isArray(current.gallery) ? current.gallery.join("\n") : String(current.gallery || "");
    const isFeaturedChecked = current.isFeatured ? "checked" : "";

    return `
      <div class="panel-card p-3 p-lg-4">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <h5 class="mb-1">${isEdit ? "Cập nhật bài viết" : "Thêm bài viết mới"}</h5>
            <p class="text-muted mb-0">${isEdit ? "Chỉnh sửa nội dung bài viết hiện có." : "Soạn bài viết mới trên trang tạo riêng."}</p>
          </div>
          <a href="${routes.adminPosts}" class="btn btn-outline-primary">Quay lại danh sách</a>
        </div>
        <form id="adminPostPageForm" class="row g-3 needs-validation" novalidate>
          <div class="col-md-8">
            <label class="form-label">Tiêu đề bài viết</label>
            <input id="adminPostPageTitle" class="form-control" required value="${current.title || ""}" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Slug</label>
            <input id="adminPostPageSlug" class="form-control" readonly value="${slugValue}" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Danh mục</label>
            <input id="adminPostPageCategory" class="form-control" value="${current.category || "Cẩm nang"}" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Tags</label>
            <input id="adminPostPageTags" class="form-control" value="${tagsValue}" placeholder="visa, kinh nghiệm, mùa hè" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Trạng thái</label>
            <select id="adminPostPageStatus" class="form-select">
              <option value="draft" ${statusValue === "draft" ? "selected" : ""}>Nháp</option>
              <option value="published" ${statusValue === "published" ? "selected" : ""}>Hiển thị</option>
              <option value="archived" ${statusValue === "archived" ? "selected" : ""}>Ẩn</option>
            </select>
          </div>
          <div class="col-md-4 d-flex align-items-end">
            <div class="form-check">
              <input id="adminPostPageFeatured" class="form-check-input" type="checkbox" ${isFeaturedChecked} />
              <label class="form-check-label" for="adminPostPageFeatured">Bài nổi bật</label>
            </div>
          </div>
          <div class="col-md-6">
            <label class="form-label">Ảnh đại diện (URL - tùy chọn)</label>
            <input id="adminPostPageThumbnail" class="form-control" value="${current.image || ""}" placeholder="https://..." />
          </div>
          <div class="col-md-6">
            <label class="form-label">Ảnh đại diện (upload)</label>
            <input id="adminPostPageThumbnailFile" class="form-control" type="file" accept="image/png,image/jpeg,image/webp" />
            <div class="form-text">JPG/PNG/WEBP, tối đa 8MB.</div>
          </div>
          <div class="col-md-6">
            <label class="form-label">Gallery ảnh (URL, mỗi dòng 1 link)</label>
            <textarea id="adminPostPageGallery" class="form-control" rows="2">${galleryValue}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label">Gallery ảnh (upload nhiều ảnh)</label>
            <input id="adminPostPageGalleryFiles" class="form-control" type="file" multiple accept="image/png,image/jpeg,image/webp" />
          </div>
          <div class="col-12">
            <img id="adminPostPageThumbnailPreview" src="${current.image || DEFAULT_POST_THUMBNAIL}" alt="Preview ảnh bài viết" class="rounded-3 border w-100" style="max-height: 260px; object-fit: cover;" />
          </div>
          <div class="col-12">
            <label class="form-label">Mô tả ngắn</label>
            <textarea id="adminPostPageExcerpt" class="form-control" rows="3" required>${current.excerpt || ""}</textarea>
          </div>
          <div class="col-12">
            <label class="form-label">Nội dung chi tiết</label>
            <textarea id="adminPostPageContent" class="form-control" rows="8" required>${contentValue}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label">Meta title</label>
            <input id="adminPostPageMetaTitle" class="form-control" value="${current.metaTitle || current.title || ""}" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Meta description</label>
            <input id="adminPostPageMetaDescription" class="form-control" value="${current.metaDescription || current.excerpt || ""}" />
          </div>
          <div class="col-12 d-flex flex-wrap gap-2">
            <button class="btn btn-primary" type="submit">${isEdit ? "Cập nhật bài viết" : "Lưu bài viết"}</button>
            <a href="${routes.adminPosts}" class="btn btn-outline-secondary">Hủy</a>
          </div>
        </form>
      </div>
    `;
  };

  const renderAdminPostCreate = () =>
    adminShell("admin-posts", "Thêm bài viết", "Trang tạo bài viết riêng cho quản trị viên.", adminPostFormContent({ isEdit: false }));

  const renderAdminPostEdit = () => {
    const editId = Number(new URLSearchParams(window.location.search).get("id") || 0);
    const post = Number.isFinite(editId) && editId > 0 ? db.posts.find((item) => Number(item.id) === editId) : null;
    return adminShell("admin-posts", "Sửa bài viết", "Trang chỉnh sửa nội dung bài viết.", adminPostFormContent({ isEdit: true, post }));
  };

  const adminPromotionFormContent = ({ isEdit = false, promo = null } = {}) => {
    const current = promo || {};
    const statusValue = String(current.status || "").toLowerCase().includes("đang") ? "active" : "inactive";
    const typeValue = current.type === "fixed" ? "fixed" : "percent";

    return `
      <div class="panel-card p-3 p-lg-4">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <h5 class="mb-1">${isEdit ? "Cập nhật khuyến mãi" : "Thêm khuyến mãi mới"}</h5>
            <p class="text-muted mb-0">${isEdit ? "Chỉnh sửa chương trình khuyến mãi trên trang riêng." : "Thiết lập chương trình giảm giá cho toàn hệ thống."}</p>
          </div>
          <a href="${routes.adminPromotions}" class="btn btn-outline-primary">Quay lại danh sách</a>
        </div>
        <form id="adminPromotionPageForm" class="row g-3 needs-validation" novalidate>
          <div class="col-md-4">
            <label class="form-label">Mã giảm giá</label>
            <input id="adminPromotionPageCode" class="form-control" ${isEdit ? "disabled" : "required"} value="${current.code || ""}" />
          </div>
          <div class="col-md-8">
            <label class="form-label">Tên khuyến mãi</label>
            <input id="adminPromotionPageTitle" class="form-control" required value="${current.title || ""}" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Ảnh chương trình (URL - tùy chọn)</label>
            <input id="adminPromotionPageImage" class="form-control" value="${current.image || ""}" placeholder="https://..." />
          </div>
          <div class="col-md-6">
            <label class="form-label">Ảnh chương trình (upload)</label>
            <input id="adminPromotionPageImageFile" class="form-control" type="file" accept="image/png,image/jpeg,image/webp" />
            <div class="form-text">JPG/PNG/WEBP, tối đa 8MB.</div>
          </div>
          <div class="col-12">
            <img id="adminPromotionPageImagePreview" src="${current.image || DEFAULT_POST_THUMBNAIL}" alt="Ảnh khuyến mãi" class="rounded-3 border w-100" style="max-height: 220px; object-fit: cover;" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Loại giảm</label>
            <select id="adminPromotionPageType" class="form-select">
              <option value="percent" ${typeValue === "percent" ? "selected" : ""}>Phần trăm</option>
              <option value="fixed" ${typeValue === "fixed" ? "selected" : ""}>Số tiền</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Giá trị giảm</label>
            <input id="adminPromotionPageValue" class="form-control" type="number" min="1" required value="${current.value || ""}" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Đơn tối thiểu</label>
            <input id="adminPromotionPageMinOrder" class="form-control" type="number" min="0" value="${current.minOrderValue || ""}" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Số lượt tối đa</label>
            <input id="adminPromotionPageUsageLimit" class="form-control" type="number" min="1" value="${current.usageLimit || ""}" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Ngày bắt đầu</label>
            <input id="adminPromotionPageStartDate" class="form-control" type="date" required value="${current.start ? normalizeDate(current.start) : todayISO()}" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Ngày kết thúc</label>
            <input id="adminPromotionPageEndDate" class="form-control" type="date" required value="${current.end ? normalizeDate(current.end) : todayISO()}" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Trạng thái</label>
            <select id="adminPromotionPageStatus" class="form-select">
              <option value="active" ${statusValue === "active" ? "selected" : ""}>Đang hoạt động</option>
              <option value="inactive" ${statusValue === "inactive" ? "selected" : ""}>Tạm dừng</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Tour áp dụng</label>
            <input id="adminPromotionPageTourScope" class="form-control" placeholder="Nhập slug tour hoặc để trống" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Danh mục áp dụng</label>
            <input id="adminPromotionPageCategoryScope" class="form-control" placeholder="Nhập slug danh mục hoặc để trống" />
          </div>
          <div class="col-12">
            <label class="form-label">Mô tả chương trình</label>
            <textarea id="adminPromotionPageDescription" class="form-control" rows="4">${current.description || ""}</textarea>
          </div>
          <div class="col-12 d-flex flex-wrap gap-2">
            <button class="btn btn-primary" type="submit">${isEdit ? "Cập nhật khuyến mãi" : "Lưu khuyến mãi"}</button>
            <a href="${routes.adminPromotions}" class="btn btn-outline-secondary">Hủy</a>
          </div>
        </form>
      </div>
    `;
  };

  const renderAdminPromotionCreate = () =>
    adminShell("admin-promotions", "Thêm khuyến mãi", "Trang tạo khuyến mãi riêng cho quản trị viên.", adminPromotionFormContent({ isEdit: false }));

  const renderAdminPromotionEdit = () => {
    const editId = Number(new URLSearchParams(window.location.search).get("id") || 0);
    const promo = Number.isFinite(editId) && editId > 0 ? db.promotions.find((item) => Number(item.id) === editId) : null;
    return adminShell("admin-promotions", "Sửa khuyến mãi", "Trang chỉnh sửa chương trình giảm giá.", adminPromotionFormContent({ isEdit: true, promo }));
  };
  const renderAdminProviders = () => {
    const requestRows = Array.isArray(adminProviderRequestsData) ? adminProviderRequestsData : [];
    const pendingRows = requestRows.filter((item) => String(item.status || "").toLowerCase() === "pending");
    const requestSection = `
      <section class="table-card mb-4">
        <div class="table-toolkit">
          <div>
            <h5 class="mb-1">Yêu cầu mở quyền provider</h5>
            <p class="text-muted small mb-0">Xử lý các hồ sơ chờ duyệt trực tiếp theo từng request.</p>
          </div>
          <div class="badge-soft">${pendingRows.length} chờ duyệt</div>
        </div>
        ${pendingRows.length ? `
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Đơn vị</th>
                  <th>Liên hệ</th>
                  <th>Địa chỉ</th>
                  <th>Ngày gửi</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                ${pendingRows.map((request) => `
                  <tr>
                    <td>
                      <strong>${request.company_name || request.full_name || "-"}</strong>
                      <div class="small text-muted">${request.tax_code || "Chưa có MST"}</div>
                    </td>
                    <td>
                      <div>${request.contact_email || "-"}</div>
                      <div class="small text-muted">${request.contact_phone || "-"}</div>
                    </td>
                    <td>${request.address || request.city || "-"}</td>
                    <td>${dateVN(request.created_at)}</td>
                    <td>${statusBadge(labelProviderStatus(request.status || "pending"))}</td>
                    <td>
                      <div class="table-actions d-flex gap-2 flex-wrap">
                        <button class="btn btn-sm btn-outline-primary" type="button" data-action="admin-provider-approve" data-provider-request-id="${request.id}">Duyệt</button>
                        <button class="btn btn-sm btn-outline-danger" type="button" data-action="admin-provider-reject" data-provider-request-id="${request.id}">Từ chối</button>
                      </div>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : '<div class="empty-state mt-3">Không có yêu cầu provider nào đang chờ duyệt.</div>'}
      </section>
    `;

    const providersSection = renderSmartTable({
      title: "Quản lý nhà cung cấp",
      subtitle: "Duyệt hồ sơ NCC, theo dõi hiệu suất và trạng thái hợp tác.",
      dataset: adminRows.providers,
      headers: ["Nhà cung cấp", "Thành phố", "Số tour", "Rating", "Trạng thái", "Ngày tham gia", "Hành động"],
      filters: [
        { field: "status", label: "Trạng thái", options: ["Đang hoạt động", "Đang duyệt", "Tạm dừng"] },
        { field: "city", label: "Thành phố", options: [...new Set(db.providers.map((provider) => provider.city))] }
      ],
      rows: adminRows.providers,
      pageSize: 8
    });

    return adminShell("admin-providers", "Quản lý nhà cung cấp", "Duyệt hồ sơ NCC, theo dõi hiệu suất và trạng thái hợp tác.", `${requestSection}${providersSection}`);
  };
  const renderAdminComments = () => renderAdminCrudPage({ active: "admin-comments", title: "Quản lý bình luận & đánh giá", subtitle: "Kiểm duyệt nội dung cộng đồng và duy trì chất lượng đánh giá.", dataset: adminRows.comments, headers: ["Mã", "Người dùng", "Tour", "Đánh giá", "Nội dung", "Trạng thái", "Hành động"], filters: [{ field: "status", label: "Trạng thái", options: ["Công khai", "Đang duyệt"] }] });

  const renderAdminRoles = () => {
    const roles = Array.isArray(adminRolesData) ? adminRolesData : [];
    const roleListHtml = roles.length
      ? roles.map((role, index) => `<div class="list-group-item d-flex justify-content-between align-items-center ${index === 0 ? "active" : ""}"><div><div class="fw-semibold">${String(role.name || "").toUpperCase()}</div><small class="${index === 0 ? "text-white-50" : "text-muted"}">ID: ${role.id}</small></div><div class="btn-group btn-group-sm"><button class="btn btn-outline-primary" data-action="admin-role-edit" data-role-id="${role.id}" data-role-name="${role.name || ""}" data-role-description="${role.description || ""}">Sửa</button><button class="btn btn-outline-danger" data-action="admin-role-delete" data-role-id="${role.id}">Xóa</button></div></div>`).join("")
      : `<div class="list-group-item text-muted">Chưa có vai trò nào trong hệ thống.</div>`;
    const roleTableHtml = roles.length
      ? roles.map((role) => `<tr><td>${role.id}</td><td><strong>${String(role.name || "").toUpperCase()}</strong></td><td>${role.description || "-"}</td></tr>`).join("")
      : `<tr><td colspan="3" class="text-center text-muted py-4">Chưa có dữ liệu vai trò.</td></tr>`;

    return adminShell("admin-roles", "Phân quyền người dùng", "Cấu hình vai trò và quyền truy cập cho từng nhóm tài khoản.", `
      <div class="row g-4">
        <div class="col-xl-5">
          <div class="panel-card p-3 p-lg-4 mb-4">
            <h5 class="mb-3">Danh sách vai trò</h5>
            <div class="list-group mb-3">
              ${roleListHtml}
            </div>
            <form id="adminRoleForm" class="row g-2 needs-validation" novalidate>
              <div class="col-md-5"><input id="adminRoleName" class="form-control" placeholder="Tên role (vd: support)" required /></div>
              <div class="col-md-7"><input id="adminRoleDescription" class="form-control" placeholder="Mô tả vai trò" /></div>
              <div class="col-12 d-flex gap-2">
                <button class="btn btn-primary" type="submit">Tạo vai trò mới</button>
                <button class="btn btn-outline-primary" id="adminRoleReset" type="button">Làm mới</button>
              </div>
            </form>
          </div>
        </div>
        <div class="col-xl-7">
          <div class="panel-card p-3 p-lg-4">
            <h5 class="mb-3">Danh sách quyền hiện có</h5>
            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead><tr><th>ID</th><th>Vai trò</th><th>Mô tả</th></tr></thead>
                <tbody>
                  ${roleTableHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `);
  };

  const renderAdminStats = () => {
    const totalBookings = db.bookings.length;
    const paidBookings = db.bookings.filter((booking) => booking.paymentStatus === "Đã thanh toán" || booking.paymentStatus === "Thành công");
    const cancelledBookings = db.bookings.filter((booking) => booking.status === "Đã hủy");

    const paidRevenue = paidBookings.reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
    const avgOrderValue = paidBookings.length ? Math.round(paidRevenue / paidBookings.length) : 0;
    const cancelRate = totalBookings ? (cancelledBookings.length / totalBookings) * 100 : 0;

    const topTours = Array.isArray(adminStatsData?.top_tours) && adminStatsData.top_tours.length
      ? adminStatsData.top_tours
      : db.tours.map((tour) => ({
        title: tour.name,
        views_count: Number(tour.views || 0),
        bookings_count: Number(tour.booked || 0),
        revenue: Number(tour.booked || 0) * Number(tour.price || 0)
      }));

    const totalViews = topTours.reduce((sum, tour) => sum + Number(tour.views_count || 0), 0);
    const totalTopBookings = topTours.reduce((sum, tour) => sum + Number(tour.bookings_count || 0), 0);
    const conversionRate = totalViews > 0 ? (totalTopBookings / totalViews) * 100 : 0;

    const ratingRows = db.comments.filter((comment) => Number(comment.rating || 0) > 0);
    const avgRating = ratingRows.length
      ? ratingRows.reduce((sum, comment) => sum + Number(comment.rating || 0), 0) / ratingRows.length
      : 0;
    const npsScore = Math.round(avgRating * 20);

    return adminShell("admin-stats", "Thống kê hệ thống chi tiết", "Phân tích tăng trưởng, chuyển đổi và hành vi khách hàng theo thời gian.", `
      ${metricCards([
        { label: "Tỷ lệ chuyển đổi", value: `${conversionRate.toFixed(1)}%`, icon: "bi-graph-up-arrow", color: "blue", note: "Tính từ lượt xem và booking của top tour" },
        { label: "AOV", value: vnd(avgOrderValue), icon: "bi-currency-dollar", color: "teal", note: "Giá trị đơn trung bình đã thanh toán" },
        { label: "Tỷ lệ hủy", value: `${cancelRate.toFixed(1)}%`, icon: "bi-arrow-counterclockwise", color: "orange", note: `${cancelledBookings.length}/${totalBookings} booking` },
        { label: "NPS", value: String(npsScore), icon: "bi-emoji-smile", color: "red", note: avgRating > 0 ? `Điểm TB ${avgRating.toFixed(1)}/5` : "Chưa đủ dữ liệu đánh giá" }
      ])}
      <div class="row g-4"><div class="col-xl-7"><div class="panel-card p-3 p-lg-4"><h5 class="mb-3">Tăng trưởng người dùng theo tháng</h5><canvas id="adminUsersChart" height="150"></canvas></div></div><div class="col-xl-5"><div class="panel-card p-3 p-lg-4"><h5 class="mb-3">Phân bổ booking theo khu vực</h5><canvas id="adminRegionChart" height="150"></canvas></div></div></div>
      <div class="panel-card p-3 p-lg-4 mt-4"><h5 class="mb-3">Top tour hiệu suất cao</h5><div class="table-responsive"><table class="table table-hover"><thead><tr><th>Tour</th><th>Lượt xem</th><th>Booking</th><th>Tỷ lệ chuyển đổi</th><th>Doanh thu</th></tr></thead><tbody>${topTours.slice(0, 10).map((tour) => { const views = Number(tour.views_count || 0); const bookings = Number(tour.bookings_count || 0); const revenue = Number(tour.revenue || 0); const conversion = views > 0 ? ((bookings / views) * 100).toFixed(1) : "0.0"; return `<tr><td>${tour.title || "Tour"}</td><td>${views}</td><td>${bookings}</td><td>${conversion}%</td><td>${vnd(revenue)}</td></tr>`; }).join("") || "<tr><td colspan=\"5\" class=\"text-center text-muted py-4\">Chưa có dữ liệu thống kê tour.</td></tr>"}</tbody></table></div></div>
  `);
  };
  const pageMap = {
    home: renderHome,
    tours: renderToursPage,
    promotions: renderPromotionsPage,
    "tour-detail": renderTourDetailPage,
    login: renderLoginPage,
    register: renderRegisterPage,
    "forgot-password": renderForgotPasswordPage,
    profile: renderProfilePage,
    "profile-edit": renderProfileEditPage,
    booking: renderBookingPage,
    payment: renderPaymentPage,
    "booking-history": renderBookingHistoryPage,
    "booking-detail": renderBookingDetailPage,
    invoice: renderInvoicePage,
    wishlist: renderWishlistPage,
    posts: renderPostsPage,
    "post-detail": renderPostDetailPage,
    contact: renderContactPage,
    "provider-dashboard": renderProviderDashboard,
    "provider-profile": renderProviderProfile,
    "provider-tours": renderProviderTours,
    "provider-tour-form": renderProviderTourForm,
    "provider-tour-edit": renderProviderTourEdit,
    "provider-promotion-create": renderProviderPromotionCreate,
    "provider-promotion-edit": renderProviderPromotionEdit,
    "provider-bookings": renderProviderBookings,
    "provider-booking-detail": renderProviderBookingDetail,
    "provider-services": renderProviderServices,
    "provider-promotions": renderProviderPromotions,
    "provider-feedback": renderProviderFeedback,
    "admin-dashboard": renderAdminDashboard,
    "admin-users": renderAdminUsers,
    "admin-roles": renderAdminRoles,
    "admin-tours": renderAdminTours,
    "admin-tour-create": renderAdminTourCreate,
    "admin-tour-edit": renderAdminTourEdit,
    "admin-categories": renderAdminCategories,
    "admin-bookings": renderAdminBookings,
    "admin-payments": renderAdminPayments,
    "admin-invoices": renderAdminInvoices,
    "admin-posts": renderAdminPosts,
    "admin-post-create": renderAdminPostCreate,
    "admin-post-edit": renderAdminPostEdit,
    "admin-promotions": renderAdminPromotions,
    "admin-promotion-create": renderAdminPromotionCreate,
    "admin-promotion-edit": renderAdminPromotionEdit,
    "admin-providers": renderAdminProviders,
    "admin-comments": renderAdminComments,
    "admin-stats": renderAdminStats
  };

  const renderCurrentPage = () => {
    app.innerHTML = pageMap[page]
      ? pageMap[page]()
      : `<div class="container py-5"><div class="alert alert-warning">Không tìm thấy trang phù hợp.</div></div>`;
    dispatchFrontendEvent("page-mounted", { page });
  };

  const syncCategoriesFromTours = () => {
    const categoryMap = new Map();
    db.tours.forEach((tour) => {
      const key = tour.category || "Khác";
      categoryMap.set(key, (categoryMap.get(key) || 0) + 1);
    });

    if (categoryMap.size === 0) return;
    db.categories = Array.from(categoryMap.entries()).map(([name, total], idx) => ({
      id: idx + 1,
      name,
      tours: total,
      icon: "bi-compass"
    }));
  };

  const upsertTour = (nextTour) => {
    const index = db.tours.findIndex((tour) => String(tour.id) === String(nextTour.id));
    if (index >= 0) db.tours[index] = { ...db.tours[index], ...nextTour };
    else db.tours.unshift(nextTour);
  };

  const hydratePublicData = async () => {
    const tours = await apiGet("/tours", { limit: 100 });
    db.tours = Array.isArray(tours) ? tours.map(mapTourFromApi) : [];

    const promotedTours = await apiGet("/tours/promotions", { limit: 100 });
    if (Array.isArray(promotedTours)) {
      promotedTours.map(mapTourFromApi).forEach((tour) => upsertTour(tour));
    }

    const promotions = await apiGet("/promotions", { limit: 100 });
    if (Array.isArray(promotions)) {
      db.promotions = promotions.map(mapPromotionFromApi);
    }

    const posts = await apiGet("/posts", { limit: 100 });
    db.posts = Array.isArray(posts) ? posts.map(mapPostFromApi) : [];

    try {
      const publicComments = await apiGet("/comments/public", { limit: 100 });
      if (Array.isArray(publicComments)) {
        db.comments = publicComments.map(mapCommentFromApi);
      }
    } catch (_error) {
      // Feed nhận xét công khai không phải dữ liệu bắt buộc để render toàn trang.
    }

    syncCategoriesFromTours();
  };

  const hydrateTourDetailData = async () => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return;

    const detail = await apiGet(`/tours/${id}`);
    if (detail?.tour) {
      const mapped = mapTourFromApi(detail.tour);
      const images = Array.isArray(detail.images) ? detail.images.map((img) => img.image_url).filter(Boolean) : [];
      const services = Array.isArray(detail.services) ? detail.services.map((service) => service.service_name).filter(Boolean) : [];
      upsertTour({ ...mapped, gallery: images.length ? images : mapped.gallery, includes: services.length ? services : mapped.includes });
    }

    const comments = await apiGet(`/tours/${id}/comments`, { limit: 50 });
    const ratings = await apiGet(`/tours/${id}/ratings`, { limit: 50 });

    if (Array.isArray(comments) || Array.isArray(ratings)) {
      const commentMap = new Map();
      (Array.isArray(ratings) ? ratings : []).forEach((rating) => {
        commentMap.set(String(rating.user_id), mapCommentFromApi(rating));
      });
      (Array.isArray(comments) ? comments : []).forEach((comment) => {
        const key = String(comment.user_id || comment.id);
        const base = commentMap.get(key) || { rating: 5 };
        commentMap.set(key, { ...base, ...mapCommentFromApi(comment), rating: base.rating || 5 });
      });
      db.comments = Array.from(commentMap.values()).map((item) => ({ ...item, tourId: Number(id) }));
    }
  };

  const hydratePostDetailData = async () => {
    const id = new URLSearchParams(window.location.search).get("id");
    const matched = db.posts.find((post) => String(post.id) === String(id));
    if (!matched?.slug) return;

    const detail = await apiGet(`/posts/${matched.slug}`);
    if (!detail) return;

    const mapped = mapPostFromApi(detail);
    const index = db.posts.findIndex((post) => String(post.id) === String(mapped.id));
    if (index >= 0) db.posts[index] = { ...db.posts[index], ...mapped };
    else db.posts.unshift(mapped);
  };

  const hydrateAuthenticatedData = async () => {
    if (!isLoggedInUser()) return;

    const profile = await apiGet("/profile");
    if (profile) {
      profileState.name = profile.full_name || profileState.name;
      profileState.email = profile.email || profileState.email;
      profileState.phone = profile.phone || profileState.phone;
      profileState.avatar = profile.avatar || profileState.avatar;
      profileState.address = profile.profile?.address || profileState.address;
      profileState.birthday = profile.profile?.date_of_birth || profileState.birthday;
      profileState.bio = profile.profile?.bio || profileState.bio;
      writeLS(LS_KEYS.profile, profileState);

      const idx = db.users.findIndex((item) => String(item.id) === String(profile.id));
      const mappedUser = mapUserFromApi({ ...profile, role_name: profile.role });
      if (idx >= 0) db.users[idx] = { ...db.users[idx], ...mappedUser };
      else db.users.unshift(mappedUser);
    }

    const wishlistItems = await apiGet("/wishlist");
    wishlist.clear();
    if (Array.isArray(wishlistItems)) {
      wishlistItems.forEach((item) => {
        const tourId = Number(item.tour_id || item.id || item.tourId);
        if (Number.isFinite(tourId) && tourId > 0) wishlist.add(tourId);
      });
    }
    updateWishlistStorage();

    const bookings = await apiGet("/bookings/my", { limit: 100 });
    db.bookings = Array.isArray(bookings) ? bookings.map(mapBookingFromApi) : [];

    const providerRequest = await apiGet("/provider/request");
    latestProviderRequest = providerRequest || null;
    dispatchFrontendEvent("provider-request-updated", {
      latestRequest: latestProviderRequest,
      providerRequests: adminProviderRequestsData
    });

    const notificationRows = await apiGet("/notifications", { limit: 20 });
    notificationsData = Array.isArray(notificationRows) ? notificationRows.map(mapNotificationFromApi) : [];
    dispatchFrontendEvent("notifications-updated", { notifications: notificationsData });

    refreshDerivedCollections();
  };

  const hydrateProviderBookingDetailData = async () => {
    if (page !== "provider-booking-detail") return;

    const code = new URLSearchParams(window.location.search).get("code") || "";
    const bookingInList = db.bookings.find((item) => String(item.code) === String(code));
    const bookingId = Number(bookingInList?.id || 0);
    if (!bookingId) return;

    const detail = await apiGet(`/provider/bookings/${bookingId}`, withProviderScopeParams());
    if (!detail) return;

    const mapped = mapBookingFromApi(detail);
    const index = db.bookings.findIndex((item) => String(item.id) === String(mapped.id));
    if (index >= 0) db.bookings[index] = { ...db.bookings[index], ...mapped };
    else db.bookings.unshift(mapped);
  };

  const hydrateProviderData = async () => {
    if (!page.startsWith("provider-")) return;

    if (isAdminRole && getProviderScopeId() <= 0) {
      try {
        const providers = await apiGet("/admin/providers", { limit: 1 });
        if (Array.isArray(providers) && providers.length > 0) {
          activeProviderId = String(providers[0].id || "");
        }
      } catch (_error) {
        // Không chặn luồng provider nếu admin chưa lấy được danh sách provider.
      }
    }

    const profile = await apiGet("/provider/profile", withProviderScopeParams());
    if (profile) {
      const mappedProvider = mapProviderFromApi(profile);
      activeProviderId = mappedProvider.id;
      const idx = db.providers.findIndex((item) => String(item.id) === String(mappedProvider.id));
      if (idx >= 0) db.providers[idx] = { ...db.providers[idx], ...mappedProvider };
      else db.providers.unshift(mappedProvider);
    }

    const tours = await apiGet("/provider/tours", withProviderScopeParams({ limit: 100 }));
    if (Array.isArray(tours)) tours.map(mapTourFromApi).forEach((tour) => upsertTour(tour));

    const bookings = await apiGet("/provider/bookings", withProviderScopeParams({ limit: 100 }));
    if (Array.isArray(bookings)) {
      const providerBookings = bookings.map(mapBookingFromApi);
      const others = db.bookings.filter((booking) => String(booking.providerId) !== String(activeProviderId));
      db.bookings = [...providerBookings, ...others];
      refreshDerivedCollections();
    }

    const promotions = await apiGet("/provider/promotions", withProviderScopeParams({ limit: 100 }));
    if (Array.isArray(promotions)) db.promotions = promotions.map(mapPromotionFromApi);

    const services = await apiGet("/provider/services", withProviderScopeParams());
    if (Array.isArray(services)) {
      db.services = services.map((service) => ({
        id: String(service.id),
        name: service.service_name,
        type: service.service_type || "Khác",
        price: parseServicePrice(service),
        status: "Đang hoạt động"
      }));
    }

    const feedback = await apiGet("/provider/feedback", withProviderScopeParams({ limit: 100 }));
    if (Array.isArray(feedback)) {
      db.comments = feedback.map((item) => ({
        id: String(item.comment_id || item.id),
        tourId: normalizeNumber(item.tour_id),
        user: item.user_name || "Khách hàng",
        rating: normalizeNumber(item.score, 5),
        date: normalizeDate(item.created_at || new Date()),
        status: item.status === "hidden" ? "Đã ẩn" : item.status === "pending" ? "Đang duyệt" : "Công khai",
        text: item.content || item.review || ""
      }));
    }

    providerDashboardData = await apiGet("/provider/dashboard", withProviderScopeParams());
  };

  const hydrateAdminData = async () => {
    if (!page.startsWith("admin-")) return;

    adminDashboardData = await apiGet("/admin/dashboard");
    adminStatsData = await apiGet("/admin/stats");
    adminProviderRequestsData = Array.isArray(adminDashboardData?.pending_providers)
      ? adminDashboardData.pending_providers
      : [];
    dispatchFrontendEvent("provider-request-updated", {
      latestRequest: latestProviderRequest,
      providerRequests: adminProviderRequestsData
    });

    const loaders = {
      "admin-users": async () => {
        const rows = await apiGet("/admin/users", { limit: 100 });
        if (Array.isArray(rows)) db.users = rows.map(mapUserFromApi);
      },
      "admin-roles": async () => {
        const rows = await apiGet("/admin/roles");
        if (Array.isArray(rows)) adminRolesData = rows;
      },
      "admin-tours": async () => {
        const rows = await apiGet("/admin/tours", { limit: 100 });
        if (Array.isArray(rows)) db.tours = rows.map(mapTourFromApi);
      },
      "admin-categories": async () => {
        const rows = await apiGet("/admin/categories", { limit: 100 });
        if (Array.isArray(rows)) {
          db.categories = rows.map((item) => ({ id: item.id, name: item.name, tours: normalizeNumber(item.total_tours || item.tours_count || 0), icon: "bi-compass", status: labelProviderStatus(item.status || "active") }));
        }
      },
      "admin-bookings": async () => {
        const rows = await apiGet("/admin/bookings", { limit: 100 });
        if (Array.isArray(rows)) {
          db.bookings = rows.map(mapBookingFromApi);
          refreshDerivedCollections();
        }
      },
      "admin-payments": async () => {
        const rows = await apiGet("/admin/payments", { limit: 100 });
        if (Array.isArray(rows)) {
          payments = rows.map((item) => ({
            id: String(item.id),
            bookingCode: item.booking_code || item.bookingCode || "-",
            userId: "",
            method: item.payment_method || "-",
            amount: normalizeNumber(item.amount, 0),
            status: labelPaymentStatus(item.payment_status),
            paidAt: normalizeDate(item.paid_at || item.created_at || new Date())
          }));
        }
      },
      "admin-invoices": async () => {
        const rows = await apiGet("/admin/invoices", { limit: 100 });
        if (Array.isArray(rows)) {
          invoices = rows.map((item) => ({
            id: item.invoice_code || `INV${item.id}`,
            bookingCode: item.booking_code || "-",
            amount: normalizeNumber(item.total_amount, 0),
            status: labelPaymentStatus(item.payment_status),
            issuedAt: normalizeDate(item.issued_at || item.created_at || new Date()),
            userId: "",
            invoiceId: normalizeNumber(item.id)
          }));
        }
      },
      "admin-posts": async () => {
        const rows = await apiGet("/admin/posts", { limit: 100 });
        if (Array.isArray(rows)) db.posts = rows.map(mapPostFromApi);
      },
      "admin-promotions": async () => {
        const rows = await apiGet("/admin/promotions", { limit: 100 });
        if (Array.isArray(rows)) db.promotions = rows.map(mapPromotionFromApi);
      },
      "admin-providers": async () => {
        const rows = await apiGet("/admin/providers", { limit: 100 });
        if (Array.isArray(rows)) db.providers = rows.map(mapProviderFromApi);
        const requestRows = await apiGet("/admin/provider-requests", { limit: 100 });
        if (Array.isArray(requestRows)) adminProviderRequestsData = requestRows;
        dispatchFrontendEvent("provider-request-updated", {
          latestRequest: latestProviderRequest,
          providerRequests: adminProviderRequestsData
        });
      },
      "admin-comments": async () => {
        const rows = await apiGet("/admin/comments", { limit: 100 });
        if (Array.isArray(rows)) db.comments = rows.map(mapCommentFromApi);
      },
      "admin-stats": async () => {
        const bookingRows = await apiGet("/admin/bookings", { limit: 200 });
        if (Array.isArray(bookingRows)) {
          db.bookings = bookingRows.map(mapBookingFromApi);
          refreshDerivedCollections();
        }

        const commentRows = await apiGet("/admin/comments", { limit: 200 });
        if (Array.isArray(commentRows)) {
          db.comments = commentRows.map(mapCommentFromApi);
        }

        const tourRows = await apiGet("/admin/tours", { limit: 200 });
        if (Array.isArray(tourRows)) {
          db.tours = tourRows.map(mapTourFromApi);
        }
      }
    };

    loaders["admin-tour-create"] = async () => {
      const [tourRows, categoryRows, providerRows] = await Promise.all([
        apiGet("/admin/tours", { limit: 100 }),
        apiGet("/admin/categories", { limit: 100 }),
        apiGet("/admin/providers", { limit: 100 })
      ]);

      if (Array.isArray(tourRows)) db.tours = tourRows.map(mapTourFromApi);
      if (Array.isArray(categoryRows)) {
        db.categories = categoryRows.map((item) => ({
          id: item.id,
          name: item.name,
          tours: normalizeNumber(item.total_tours || item.tours_count || 0),
          icon: "bi-compass",
          status: labelProviderStatus(item.status || "active")
        }));
      }
      if (Array.isArray(providerRows)) db.providers = providerRows.map(mapProviderFromApi);
    };

    loaders["admin-tour-edit"] = loaders["admin-tour-create"];
    loaders["admin-post-create"] = loaders["admin-posts"];
    loaders["admin-post-edit"] = loaders["admin-posts"];
    loaders["admin-promotion-create"] = loaders["admin-promotions"];
    loaders["admin-promotion-edit"] = loaders["admin-promotions"];

    if (loaders[page]) await loaders[page]();
  };

  const runHydrationStep = async (label, handler) => {
    try {
      await handler();
      return true;
    } catch (error) {
      console.error(`[hydrate] ${label} failed`, error);
      const message = error?.message || "Không thể đồng bộ một phần dữ liệu từ hệ thống.";
      showToast(message, "warning");
      return false;
    }
  };

  const hydrateFromApi = async () => {
    const apiReady = await pingApi();
    if (!apiReady) {
      if (!allowLocalFallback) {
        db.tours = [];
        db.posts = [];
        db.promotions = [];
        db.bookings = [];
        db.comments = [];
        db.providers = [];
        db.categories = [];
        db.users = [];
        payments = [];
        invoices = [];
        showToast("Không kết nối được API backend. Vui lòng kiểm tra backend và thử lại.", "danger");
        refreshDerivedCollections();
        refreshAdminRows();
        dispatchFrontendEvent("api-status", { connected: false, usingFallback: false, page });
        return;
      }

      showToast("Không kết nối được API backend. Đang dùng fallback local (DEV).", "warning");
      refreshDerivedCollections();
      refreshAdminRows();
      dispatchFrontendEvent("api-status", { connected: false, usingFallback: true, page });
      return;
    }

    dispatchFrontendEvent("api-status", { connected: true, usingFallback: false, page });

    await runHydrationStep("public", hydratePublicData);
    await runHydrationStep("authenticated", hydrateAuthenticatedData);

    if (page === "tour-detail") {
      await runHydrationStep("tour-detail", hydrateTourDetailData);
    }

    if (page === "post-detail") {
      await runHydrationStep("post-detail", hydratePostDetailData);
    }

    await runHydrationStep("provider", hydrateProviderData);
    await runHydrationStep("provider-booking-detail", hydrateProviderBookingDetailData);
    await runHydrationStep("admin", hydrateAdminData);

    if (!activeProviderId && db.providers.length > 0) activeProviderId = String(db.providers[0].id);

    refreshDerivedCollections();
    refreshAdminRows();
  };
  const initFooterYear = () => {
    const footerYear = document.getElementById("footerYear");
    if (footerYear) footerYear.textContent = new Date().getFullYear();
  };

  const initPasswordToggles = () => {
    document.querySelectorAll("[data-toggle-password]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = button.closest(".input-group")?.querySelector("[data-password-input]");
        if (!input) return;
        input.type = input.type === "password" ? "text" : "password";
        button.innerHTML = input.type === "password" ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
      });
    });
  };

  const initFormValidation = () => {
    document.querySelectorAll(".needs-validation").forEach((form) => {
      form.addEventListener("submit", (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add("was-validated");
      });
    });
  };

  const updateWishlistStorage = () => writeLS(LS_KEYS.wishlist, [...wishlist]);

  const toggleWishlist = async (tourId) => {
    const idNum = Number(tourId);
    if (!Number.isFinite(idNum) || idNum <= 0) return;

    if (!isLoggedInUser()) {
      showToast("Vui lòng đăng nhập để lưu tour yêu thích.", "warning");
      window.location.href = `${routes.login}?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }

    try {
      if (wishlist.has(idNum)) {
        await apiDelete(`/wishlist/${idNum}`);
        wishlist.delete(idNum);
        showToast("Đã xóa tour khỏi danh sách yêu thích.", "warning");
      } else {
        await apiPost("/wishlist", { tour_id: idNum });
        wishlist.add(idNum);
        showToast("Đã thêm tour vào danh sách yêu thích.");
      }

      updateWishlistStorage();
      document.querySelectorAll(`[data-action="toggle-wishlist"][data-tour-id="${idNum}"]`).forEach((btn) => {
        const icon = btn.querySelector("i");
        if (!icon) return;
        const liked = wishlist.has(idNum);
        icon.className = liked ? "bi bi-heart-fill text-danger" : "bi bi-heart";
        btn.classList.toggle("text-danger", liked);
      });

      if (page === "wishlist") {
        renderCurrentPage();
        initPageBehaviors();
      }
    } catch (error) {
      showToast(error?.message || "Không thể cập nhật wishlist lúc này.", "danger");
    }
  };
  const makeTravelerInputs = (count) => Array.from({ length: count }, (_, idx) => `<div class="col-md-6"><input class="form-control" placeholder="Khách ${idx + 1} - Họ tên" required /></div><div class="col-md-3"><input class="form-control" placeholder="Năm sinh" /></div><div class="col-md-3"><select class="form-select"><option>Người lớn</option><option>Trẻ em</option></select></div>`).join("");

  const initHomePage = () => {
    initHomeActions({
      apiPost,
      profileState,
      writeLS,
      storageKeys: LS_KEYS,
      routes,
      showToast
    });
  };
  const initToursPage = () => {
    const grid = document.getElementById("toursGrid");
    const pagination = document.getElementById("toursPagination");
    const countEl = document.getElementById("toursResultCount");
    const emptyState = document.getElementById("toursEmptyState");
    if (!grid || !pagination || !countEl || !emptyState) return;

    const state = { currentPage: 1, pageSize: 6 };
    const isPromoMode = new URLSearchParams(window.location.search).get("promo") !== null;
    const controls = {
      keyword: document.getElementById("filterKeyword"),
      location: document.getElementById("filterLocation"),
      price: document.getElementById("filterPrice"),
      type: document.getElementById("filterType"),
      duration: document.getElementById("filterDuration"),
      rating: document.getElementById("filterRating"),
      sort: document.getElementById("sortTours")
    };

    if (isPromoMode) {
      controls.keyword.value = "";
      controls.location.value = "";
      controls.price.value = "";
      controls.type.value = "";
      controls.duration.value = "";
      controls.rating.value = "";
      controls.sort.value = "popular";
    } else {
      const recent = readLS(LS_KEYS.recentFilters, null);
      if (recent) {
        if (recent.destination) controls.location.value = recent.destination;
        if (recent.duration) controls.duration.value = recent.duration;
        if (recent.budget) controls.price.value = recent.budget;
      }
    }

    const filterTours = () => {
      const filtered = applyTourFilters(
        db.tours,
        {
          keyword: controls.keyword.value,
          location: controls.location.value,
          price: controls.price.value,
          type: controls.type.value,
          duration: controls.duration.value,
          rating: controls.rating.value
        },
        { promoOnly: isPromoMode }
      );
      return sortTours(filtered, controls.sort.value || "newest");
    };

    const draw = () => {
      const filtered = filterTours();
      const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
      if (state.currentPage > totalPages) state.currentPage = totalPages;
      const start = (state.currentPage - 1) * state.pageSize;
      const visible = filtered.slice(start, start + state.pageSize);
      grid.innerHTML = visible.map((tour) => `<div class="col-md-6">${tourCard(tour)}</div>`).join("");
      countEl.textContent = filtered.length;
      emptyState.classList.toggle("d-none", filtered.length > 0);
      if (isPromoMode) {
        emptyState.textContent = "Hiện không có tour khuyến mãi phù hợp bộ lọc hiện tại. Hãy bấm Đặt lại để xem lại ưu đãi.";
      } else {
        emptyState.textContent = "Không có tour phù hợp, hãy thử bộ lọc khác.";
      }
      pagination.innerHTML = totalPages > 1 ? [`<button class="page-btn" data-page-btn="prev"><i class="bi bi-chevron-left"></i></button>`, ...Array.from({ length: totalPages }, (_, i) => `<button class="page-btn ${state.currentPage === i + 1 ? "active" : ""}" data-page-btn="${i + 1}">${i + 1}</button>`), `<button class="page-btn" data-page-btn="next"><i class="bi bi-chevron-right"></i></button>`].join("") : "";
      pagination.querySelectorAll("[data-page-btn]").forEach((btn) => btn.addEventListener("click", () => {
        const v = btn.getAttribute("data-page-btn");
        if (v === "prev") state.currentPage = Math.max(1, state.currentPage - 1);
        else if (v === "next") state.currentPage = Math.min(totalPages, state.currentPage + 1);
        else state.currentPage = Number(v);
        draw();
      }));
      if (!isPromoMode) {
        writeLS(LS_KEYS.recentFilters, { destination: controls.location.value, duration: controls.duration.value, budget: controls.price.value });
      }
      initPremiumPolish();
    };

    Object.values(controls).forEach((control) => {
      control?.addEventListener("input", () => { state.currentPage = 1; draw(); });
      control?.addEventListener("change", () => { state.currentPage = 1; draw(); });
    });

    document.getElementById("resetTourFilters")?.addEventListener("click", () => {
      Object.values(controls).forEach((control) => {
        if (!control) return;
        if (control.tagName === "SELECT") control.selectedIndex = 0;
        else control.value = "";
      });
      state.currentPage = 1;
      draw();
    });

    draw();
  };

  const initTourDetailPage = () => {
    const tour = getTourById(new URLSearchParams(window.location.search).get("id")) || db.tours[0];
    const peopleInput = document.getElementById("detailPeople");
    const couponSelect = document.getElementById("detailCoupon");
    const update = () => {
      const people = Math.max(1, Number(peopleInput?.value || 1));
      const code = couponSelect?.value || "";
      const coupon = getPromotionByCode(code);
      const totals = calcBookingTotals({ unitPrice: tour.price, people, coupon });
      document.getElementById("detailSubTotal").textContent = vnd(totals.subTotal);
      document.getElementById("detailDiscount").textContent = `- ${vnd(totals.discount)}`;
      document.getElementById("detailTotal").textContent = vnd(totals.total);
      document.getElementById("detailBookNow").href = addQuery(routes.booking, { tourId: tour.id, people, coupon: code });
    };
    peopleInput?.addEventListener("input", update);
    couponSelect?.addEventListener("change", update);
    document.querySelectorAll("[data-gallery-thumb]").forEach((thumb) => thumb.addEventListener("click", () => {
      const src = thumb.getAttribute("data-gallery-thumb");
      document.getElementById("detailMainImage")?.setAttribute("src", src || "");
      document.querySelectorAll("[data-gallery-thumb]").forEach((x) => x.classList.remove("border", "border-primary", "border-2"));
      thumb.classList.add("border", "border-primary", "border-2");
    }));
    document.getElementById("commentForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.target;
      const content = form.querySelector("input")?.value?.trim() || "";
      const score = Number(document.getElementById("commentRating")?.value || 5);

      if (!content) {
        showToast("Vui lòng nhập nội dung bình luận.", "warning");
        return;
      }

      if (!isLoggedInUser()) {
        showToast("Vui lòng đăng nhập để gửi bình luận.", "warning");
        window.location.href = `${routes.login}?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }

      try {
        await apiPost("/comments", { tour_id: tour.id, content });
        await apiPost("/ratings", { tour_id: tour.id, score, review: content });
        showToast("Cảm ơn bạn! Bình luận đã được gửi.");
        form.reset();
      } catch (error) {
        showToast(error?.message || "Không thể gửi bình luận lúc này.", "danger");
      }
    });
    update();
  };

  const initProfilePage = () => {
    const providerRequestForm = document.getElementById("providerRequestForm");
    providerRequestForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.target;
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      const payload = {
        company_name: form.company_name?.value?.trim() || "",
        tax_code: form.tax_code?.value?.trim() || "",
        contact_email: form.contact_email?.value?.trim() || "",
        contact_phone: form.contact_phone?.value?.trim() || "",
        address: form.address?.value?.trim() || "",
        description: form.description?.value?.trim() || ""
      };

      submitButton?.setAttribute("disabled", "disabled");
      try {
        const response = await apiPost("/provider/request", payload);
        const request = response?.request || response || {};
        updateProviderRequestLocal(request);
        showToast(latestProviderRequest?.id ? "Yêu cầu hợp tác đã được cập nhật." : "Đã gửi yêu cầu trở thành nhà cung cấp.", "success");
        renderCurrentPage();
        initPageBehaviors();
      } catch (error) {
        showToast(resolveErrorMessage(error, "Không thể gửi yêu cầu hợp tác lúc này."), "danger");
      } finally {
        submitButton?.removeAttribute("disabled");
      }
    });

    document.querySelector('[data-action="notification-read-all"]')?.addEventListener("click", async () => {
      if (!notificationsData.length || getNotificationUnreadCount() === 0) {
        showToast("Không có thông báo mới để cập nhật.", "info");
        return;
      }

      try {
        await apiPut("/notifications/read-all", {});
        markAllNotificationsReadLocal();
        showToast("Đã đánh dấu tất cả thông báo là đã đọc.", "success");
        renderCurrentPage();
        initPageBehaviors();
      } catch (error) {
        showToast(resolveErrorMessage(error, "Không thể cập nhật thông báo."), "danger");
      }
    });
  };

  const initAuthPages = () => {
    return initSharedAuthPages({
      routes,
      showToast,
      loginWithApi,
      getCurrentRole,
      registerWithApi,
      forgotPasswordWithApi,
      apiPost,
      ensureStatusSlot,
      renderStatusMessage,
      clearStatusSlot,
      withPendingButton
    });
    document.getElementById("loginForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.target;
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }

      const email = form.querySelector('input[type="email"]')?.value?.trim() || "";
      const password = form.querySelector('[data-password-input]')?.value || "";

      try {
        const auth = await loginWithApi({ email, password });
        showToast("Đăng nhập thành công.");

        const query = new URLSearchParams(window.location.search);
        const next = query.get("next");
        if (next && !next.includes("login.html") && !next.includes("register.html")) {
          window.location.href = decodeURIComponent(next);
          return;
        }

        const role = String(auth?.user?.role || getCurrentRole() || "user").toLowerCase();
        if (role.includes("admin")) {
          window.location.href = routes.adminDashboard;
          return;
        }

        if (role.includes("provider")) {
          window.location.href = routes.providerDashboard;
          return;
        }

        window.location.href = routes.profile;
      } catch (error) {
        showToast(error?.message || "Không thể đăng nhập lúc này.", "danger");
      }
    });

    document.getElementById("registerForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.target;
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }

      const fullName = form.querySelectorAll("input")[0]?.value?.trim() || "";
      const phone = form.querySelectorAll("input")[1]?.value?.trim() || "";
      const email = form.querySelector('input[type="email"]')?.value?.trim() || "";
      const password = form.querySelectorAll('input[data-password-input], input[type="password"]')[0]?.value || "";
      const confirmPassword = form.querySelectorAll('input[type="password"]')[1]?.value || "";

      if (password !== confirmPassword) {
        showToast("Mật khẩu xác nhận không khớp.", "warning");
        return;
      }

      try {
        await registerWithApi({ full_name: fullName, phone, email, password });
        showToast("Đăng ký thành công. Bạn đã được đăng nhập.");
        setTimeout(() => {
          window.location.href = routes.home;
        }, 500);
      } catch (error) {
        showToast(error?.message || "Không thể đăng ký lúc này.", "danger");
      }
    });

    document.getElementById("forgotForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.target;
      const devNotice = document.getElementById("forgotPasswordDevNotice");
      if (devNotice) devNotice.innerHTML = "";
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }

      const email = form.querySelector('input[type="email"]')?.value?.trim() || "";
      try {
        const response = await forgotPasswordWithApi(email);
        if (response?.preview_available && response?.reset_link_preview && devNotice) {
          devNotice.innerHTML = `
            <div class="alert alert-warning mb-0">
              <div class="fw-semibold mb-1">Email reset đang ở chế độ dev/log.</div>
              <div class="small mb-2">${response?.delivery_message || "Mail server chưa gửi thật. Bạn có thể dùng liên kết preview bên dưới để tiếp tục kiểm thử luồng đặt lại mật khẩu."}</div>
              <a class="btn btn-sm btn-outline-primary" href="${response.reset_link_preview}">Mở liên kết đặt lại mật khẩu</a>
            </div>
          `;
          showToast("Yêu cầu đã được ghi nhận. Hệ thống đang cung cấp preview link cho môi trường dev.", "info");
        } else if (response?.sent === false) {
          showToast("Chưa gửi được email lúc này. Vui lòng kiểm tra cấu hình mail server.", "warning");
        } else {
          showToast("Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi.", "info");
          form.reset();
        }
      } catch (error) {
        showToast(error?.message || "Không thể gửi yêu cầu lúc này.", "danger");
      }
    });

    document.getElementById("resetPasswordForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.target;
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }

      const query = new URLSearchParams(window.location.search);
      const email = query.get("email") || "";
      const token = query.get("token") || "";
      const password = form.querySelectorAll('input[type="password"]')[0]?.value || "";
      const confirmPassword = form.querySelectorAll('input[type="password"]')[1]?.value || "";

      if (password !== confirmPassword) {
        showToast("Mật khẩu xác nhận không khớp.", "warning");
        return;
      }

      try {
        await apiPost("/auth/reset-password", { email, token, password });
        showToast("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.");
        setTimeout(() => {
          window.location.href = routes.login;
        }, 700);
      } catch (error) {
        showToast(error?.message || "Không thể đặt lại mật khẩu lúc này.", "danger");
      }
    });
  };

  const initProfileEditPage = () => {
    return initSharedProfileEditPage({
      routes,
      profileState,
      writeLS,
      storageKeys: LS_KEYS,
      apiPut,
      apiPost,
      logoutWithApi,
      showToast,
      ensureStatusSlot,
      renderStatusMessage,
      clearStatusSlot,
      withPendingButton
    });
    const form = document.getElementById("profileEditForm");
    if (!form) return;

    const avatarInput = document.getElementById("profileAvatarInput");
    const avatarPreview = document.getElementById("profileAvatarPreview");
    let avatarObjectUrl = "";

    avatarInput?.addEventListener("change", () => {
      const file = avatarInput.files?.[0];
      if (!file) return;

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        showToast("Ảnh hồ sơ chỉ hỗ trợ JPG/PNG/WEBP.", "warning");
        avatarInput.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast("Kích thước ảnh hồ sơ tối đa 5MB.", "warning");
        avatarInput.value = "";
        return;
      }

      if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
      avatarObjectUrl = URL.createObjectURL(file);
      if (avatarPreview) avatarPreview.src = avatarObjectUrl;
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }

      const data = new FormData(form);
      const payload = {
        full_name: data.get("name"),
        date_of_birth: data.get("birthday"),
        email: data.get("email"),
        phone: data.get("phone"),
        city: data.get("city"),
        address: data.get("address"),
        bio: data.get("bio")
      };

      let updatedProfile = null;
      try {
        updatedProfile = await apiPut('/profile', payload);
      } catch (error) {
        showToast(error?.message || "Không thể cập nhật hồ sơ lúc này.", "danger");
        return;
      }

      const avatarFile = avatarInput?.files?.[0] || null;
      if (avatarFile) {
        try {
          const formData = new FormData();
          formData.append("avatar", avatarFile);
          const avatarUpdated = await apiPost("/profile/avatar", formData);
          if (avatarUpdated && typeof avatarUpdated === "object") {
            updatedProfile = avatarUpdated;
          }
        } catch (error) {
          showToast(error?.message || "Không thể tải ảnh hồ sơ lúc này.", "warning");
        }
      }

      const nextProfile = {
        name: updatedProfile?.full_name || payload.full_name || profileState.name,
        birthday: updatedProfile?.profile?.date_of_birth || payload.date_of_birth || profileState.birthday,
        email: updatedProfile?.email || payload.email || profileState.email,
        phone: updatedProfile?.phone || payload.phone || profileState.phone,
        avatar: updatedProfile?.avatar || profileState.avatar || "",
        city: updatedProfile?.profile?.city || updatedProfile?.city || payload.city || profileState.city,
        address: updatedProfile?.profile?.address || payload.address || profileState.address,
        bio: updatedProfile?.profile?.bio || payload.bio || profileState.bio
      };

      Object.assign(profileState, nextProfile);
      writeLS(LS_KEYS.profile, nextProfile);

      try {
        const authUserRaw = localStorage.getItem("vh_auth_user");
        if (authUserRaw) {
          const authUser = JSON.parse(authUserRaw);
          authUser.full_name = nextProfile.name;
          authUser.email = nextProfile.email;
          authUser.phone = nextProfile.phone;
          authUser.avatar = nextProfile.avatar;
          localStorage.setItem("vh_auth_user", JSON.stringify(authUser));
        }
      } catch (_error) {
        // Bỏ qua nếu localStorage auth bị lỗi parse.
      }

      if (avatarObjectUrl) {
        URL.revokeObjectURL(avatarObjectUrl);
        avatarObjectUrl = "";
      }

      showToast("Cập nhật hồ sơ thành công!");
      setTimeout(() => (window.location.href = routes.profile), 650);
    });

    const changePasswordForm = document.getElementById("changePasswordForm");
    changePasswordForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!changePasswordForm.checkValidity()) {
        changePasswordForm.classList.add("was-validated");
        return;
      }

      const data = new FormData(changePasswordForm);
      const currentPassword = String(data.get("current_password") || "");
      const newPassword = String(data.get("new_password") || "");
      const confirmPassword = String(data.get("confirm_password") || "");

      if (newPassword !== confirmPassword) {
        showToast("Xác nhận mật khẩu mới không khớp.", "warning");
        return;
      }

      try {
        await apiPut("/auth/change-password", {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        });

        showToast("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.", "success");
        setTimeout(async () => {
          try {
            await logoutWithApi();
          } catch (_error) {
            // ignore logout API error
          }
          window.location.href = routes.login;
        }, 600);
      } catch (error) {
        showToast(error?.message || "Không thể đổi mật khẩu lúc này.", "danger");
      }
    });
  };

  const initBookingPage = () => {
    initBookingActions({
      db,
      getTourById,
      calcBookingTotals,
      getPromotionByCode,
      vnd,
      makeTravelerInputs,
      createBooking,
      writeLS,
      storageKeys: LS_KEYS,
      currentUserId,
      routes,
      profileState,
      isLoggedInUser,
      showToast
    });
  };
  const initPaymentPage = () => {
    initPaymentActions({
      readLS,
      storageKeys: LS_KEYS,
      apiPost,
      mapBookingFromApi,
      db,
      refreshDerivedCollections,
      showToast,
      writeLS,
      routes,
      addQuery
    });
  };
  const initBookingHistoryPage = () => {
    initBookingHistoryActions({ showToast });
  };

  const initContactPage = () => {
    initContactActions({ apiPost, showToast });
  };

  const initInvoicePage = () => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("print") !== "1") return;

    setTimeout(() => {
      window.print();
    }, 400);
  };

  const initProviderBookingsPage = () => {
    return initSharedProviderBookingsPage({
      db,
      getTourById,
      vnd,
      dateVN,
      statusBadge
    });
    const drawerBody = document.getElementById("providerBookingDrawerBody");
    if (!drawerBody) return;

    document.querySelectorAll("[data-booking-code]").forEach((button) => {
      button.addEventListener("click", () => {
        const code = button.getAttribute("data-booking-code") || "";
        const booking = db.bookings.find((item) => String(item.code) === String(code));
        const tour = booking ? getTourById(booking.tourId) : null;
        const user = booking ? db.users.find((item) => String(item.id) === String(booking.userId)) : null;
        const customerName = booking?.customerName || user?.name || "-";
        const customerEmail = booking?.customerEmail || user?.email || "-";
        const customerPhone = booking?.customerPhone || user?.phone || "-";
        if (!booking) return;

        drawerBody.innerHTML = `<div class="mb-3"><strong>Mã booking:</strong> ${booking.code}</div><div class="mb-3"><strong>Khách hàng:</strong> ${customerName}</div><div class="mb-3"><strong>Email:</strong> ${customerEmail}</div><div class="mb-3"><strong>SĐT:</strong> ${customerPhone}</div><div class="mb-3"><strong>Tour:</strong> ${tour?.name || "-"}</div><div class="mb-3"><strong>Ngày đi:</strong> ${dateVN(booking.departureDate)}</div><div class="mb-3"><strong>Số khách:</strong> ${booking.travelers}</div><div class="mb-3"><strong>Tổng tiền:</strong> ${vnd(booking.amount)}</div><div class="mb-3"><strong>Booking:</strong> ${statusBadge(booking.status)}</div><div class="mb-3"><strong>Thanh toán:</strong> ${statusBadge(booking.paymentStatus)}</div><button class="btn btn-primary w-100 mb-2" data-action="provider-confirm-booking" data-booking-id="${booking.id}" data-booking-code="${booking.code}">Xác nhận ngay</button><button class="btn btn-outline-danger w-100" data-action="provider-cancel-booking" data-booking-id="${booking.id}" data-booking-code="${booking.code}">Từ chối booking</button>`;
      });
    });
  };

  const parseDurationValue = (rawValue) => {
    const values = String(rawValue || "").match(/\d+/g) || [];
    const days = Math.max(1, Number(values[0] || 1));
    const nights = Math.max(0, Number(values[1] || Math.max(days - 1, 0)));
    return { days, nights };
  };

  const initProviderProfilePage = () => {
    return initSharedProviderProfilePage({
      db,
      apiPut,
      mapProviderFromApi,
      withProviderScopePayload,
      setActiveProviderId: (value) => {
        if (value) activeProviderId = String(value);
      },
      showToast,
      ensureStatusSlot,
      renderStatusMessage,
      clearStatusSlot,
      withPendingButton
    });
    const form = document.getElementById("providerProfileForm");
    if (!form) return;
    const statusSlot = ensureStatusSlot(form, { position: "before", className: "mb-3" });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        renderStatusMessage(statusSlot, {
          type: "warning",
          title: "Hồ sơ chưa hợp lệ",
          message: "Vui lòng kiểm tra lại email, số điện thoại và các trường bắt buộc."
        });
        return;
      }

      const fields = form.querySelectorAll("input, textarea");
      const payload = withProviderScopePayload({
        company_name: fields[0]?.value?.trim() || "",
        contact_email: fields[2]?.value?.trim() || "",
        contact_phone: fields[3]?.value?.trim() || "",
        address: fields[4]?.value?.trim() || "",
        description: fields[6]?.value?.trim() || "",
        support_policy: fields[7]?.value?.trim() || ""
      });

      const submitButton = form.querySelector('button[type="submit"]');
      clearStatusSlot(statusSlot);

      try {
        const updated = await withPendingButton(submitButton, "Đang lưu hồ sơ...", () => apiPut("/provider/profile", payload));
        const mapped = mapProviderFromApi(updated || {});
        const index = db.providers.findIndex((item) => String(item.id) === String(mapped.id));
        if (index >= 0) db.providers[index] = { ...db.providers[index], ...mapped };
        else db.providers.unshift(mapped);

        activeProviderId = String(mapped.id || activeProviderId);
        renderStatusMessage(statusSlot, {
          type: "success",
          title: "Đã lưu hồ sơ nhà cung cấp",
          message: "Thông tin mới đã được cập nhật trên hệ thống."
        });
        showToast("Đã lưu hồ sơ nhà cung cấp.");
      } catch (error) {
        renderStatusMessage(statusSlot, {
          type: "danger",
          title: "Không thể cập nhật hồ sơ",
          message: error?.message || "Vui lòng thử lại sau."
        });
        showToast(error?.message || "Không thể cập nhật hồ sơ provider.", "danger");
      }
    });
  };

  const initProviderTourFormPage = () => {
    return initSharedProviderTourFormPage({
      page,
      routes,
      db,
      normalizeNumber,
      apiGet,
      apiPost,
      apiPut,
      todayISO,
      mapTourFromApi,
      upsertTour,
      withProviderScopePayload,
      withProviderScopeParams,
      withProviderScopeFormData,
      syncCategoriesFromTours,
      refreshAdminRows,
      showToast,
      ensureStatusSlot,
      renderStatusMessage,
      clearStatusSlot,
      withPendingButton
    });
    const form = document.getElementById("providerTourForm");
    if (!form) return;

    const draftButton = form.querySelector('button.btn-outline-primary[type="button"]');
    const fileInput = form.querySelector("#providerTourImageInput");
    const previewWrap = form.querySelector("#providerTourImagePreview");
    let submitMode = "publish";

    const releasePreviewUrls = () => {
      previewWrap?.querySelectorAll("img[data-object-url]").forEach((img) => {
        const objectUrl = img.getAttribute("data-object-url");
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      });
    };

    const renderPreview = () => {
      if (!previewWrap || !fileInput) return;

      const files = Array.from(fileInput.files || []).slice(0, 6);
      if (!files.length) return;

      releasePreviewUrls();
      previewWrap.innerHTML = files.map((_, index) => `<div class="col-4"><img class="rounded-3" alt="preview" data-upload-preview="${index}" style="width:100%;height:100px;object-fit:cover;" /></div>`).join("");

      files.forEach((file, index) => {
        const img = previewWrap.querySelector(`[data-upload-preview="${index}"]`);
        if (!img) return;
        const objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
        img.setAttribute("data-object-url", objectUrl);
      });
    };

    fileInput?.addEventListener("change", renderPreview);

    draftButton?.addEventListener("click", () => {
      submitMode = "draft";
      form.requestSubmit();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }

      const fields = form.querySelectorAll("input:not([type='file']), select, textarea");
      const title = fields[0]?.value?.trim() || "";
      const departure = fields[2]?.value?.trim() || "";
      const destination = fields[3]?.value?.trim() || "";
      const duration = parseDurationValue(fields[4]?.value || "");
      const itinerary = fields[5]?.value?.trim() || "";
      const salePrice = normalizeNumber(fields[6]?.value, 0);
      const listedPrice = Math.max(normalizeNumber(fields[7]?.value, salePrice), salePrice);
      const maxGuests = Math.max(1, normalizeNumber(fields[8]?.value, 30));
      const included = fields[9]?.value?.trim() || "";
      const policy = fields[10]?.value?.trim() || "";

      const categoryLabel = fields[1]?.value?.trim() || "";
      const categoryId = categoryLabel === "Nghỉ dưỡng" ? 1 : categoryLabel === "Khám phá" ? 2 : 3;

      const payload = withProviderScopePayload({
        category_id: categoryId,
        title,
        destination,
        departure_location: departure,
        duration_days: duration.days,
        duration_nights: duration.nights,
        price_adult: listedPrice,
        price_child: Math.round(listedPrice * 0.7),
        discount_price: salePrice || null,
        short_description: itinerary.split(/\r?\n/).find(Boolean) || title,
        itinerary,
        included_services: included,
        policy,
        max_guests: maxGuests,
        available_slots: maxGuests,
        status: submitMode === "draft" ? "draft" : "active"
      });

      const editId = Number(new URLSearchParams(window.location.search).get("id"));
      const isEditMode = page === "provider-tour-edit" && Number.isFinite(editId) && editId > 0;
      const uploadFiles = Array.from(fileInput?.files || []).slice(0, 6);

      try {
        const response = isEditMode
          ? await apiPut(`/provider/tours/${editId}`, payload)
          : await apiPost("/provider/tours", payload);

        let mapped = mapTourFromApi(response || {});

        if (mapped?.id && uploadFiles.length) {
          for (const [index, file] of uploadFiles.entries()) {
            const imageData = new FormData();
            imageData.append("image", file);
            imageData.append("set_thumbnail", index === 0 ? "1" : "0");
            await apiPost(`/provider/tours/${mapped.id}/images`, withProviderScopeFormData(imageData));
          }

          const refreshed = await apiGet(`/provider/tours/${mapped.id}`, withProviderScopeParams());
          mapped = mapTourFromApi(refreshed || {});
        }

        if (mapped?.id) upsertTour(mapped);

        showToast(isEditMode ? "Cập nhật tour thành công." : "Tạo tour mới thành công.");
        setTimeout(() => {
          window.location.href = routes.providerTours;
        }, 450);
      } catch (error) {
        showToast(error?.message || "Không thể lưu tour lúc này.", "danger");
      } finally {
        submitMode = "publish";
      }
    });
  };

  const initProviderServicesPage = () => {
    return initSharedProviderServicesPage({
      db,
      activeProviderId,
      apiPost,
      withProviderScopePayload,
      vnd,
      showToast,
      ensureStatusSlot,
      renderStatusMessage,
      clearStatusSlot,
      withPendingButton,
      renderCurrentPage,
      initPageBehaviors
    });
    const form = document.getElementById("providerServiceForm");
    if (!form) return;
    const statusSlot = ensureStatusSlot(form, { position: "before", className: "mb-3" });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        renderStatusMessage(statusSlot, {
          type: "warning",
          title: "Biểu mẫu dịch vụ chưa hợp lệ",
          message: "Vui lòng nhập đầy đủ tên dịch vụ và thông tin cần thiết."
        });
        return;
      }

      const fields = form.querySelectorAll("input, select");
      const serviceName = fields[0]?.value?.trim() || "";
      const serviceType = fields[1]?.value?.trim() || "Khác";
      const price = normalizeNumber(fields[2]?.value, 0);

      const fallbackTour = db.tours.find((tour) => String(tour.providerId) === String(activeProviderId)) || db.tours[0];
      if (!fallbackTour?.id) {
        renderStatusMessage(statusSlot, {
          type: "warning",
          title: "Chưa có tour khả dụng",
          message: "Bạn cần ít nhất một tour để gắn dịch vụ đi kèm."
        });
        showToast("Không tìm thấy tour để gắn dịch vụ.", "warning");
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      clearStatusSlot(statusSlot);

      try {
        const created = await withPendingButton(submitButton, "Đang thêm dịch vụ...", () =>
          apiPost("/provider/services", withProviderScopePayload({
            tour_id: fallbackTour.id,
            service_name: serviceName,
            service_type: serviceType,
            description: `Giá tham khảo: ${vnd(price)}`
          }))
        );

        db.services.unshift({
          id: String(created?.id || Date.now()),
          name: created?.service_name || serviceName,
          type: created?.service_type || serviceType,
          price,
          status: "Đang hoạt động"
        });

        renderStatusMessage(statusSlot, {
          type: "success",
          title: "Đã thêm dịch vụ",
          message: "Dịch vụ mới đã được gắn vào tour của nhà cung cấp."
        });
        showToast("Đã thêm dịch vụ mới.");
        renderCurrentPage();
        initPageBehaviors();
      } catch (error) {
        renderStatusMessage(statusSlot, {
          type: "danger",
          title: "Không thể thêm dịch vụ",
          message: error?.message || "Vui lòng thử lại sau."
        });
        showToast(error?.message || "Không thể thêm dịch vụ lúc này.", "danger");
      }
    });
  };

  const initProviderPromotionFormPage = () => {
    return initSharedProviderPromotionFormPage({
      page,
      routes,
      db,
      apiGet,
      apiPost,
      apiPut,
      todayISO,
      withProviderScopePayload,
      withProviderScopeFormData,
      mapPromotionFromApi,
      showToast,
      ensureStatusSlot,
      renderStatusMessage,
      clearStatusSlot,
      withPendingButton,
      normalizePromotionType,
      normalizeNumber,
      DEFAULT_POST_THUMBNAIL
    });
    const form = document.getElementById("providerPromotionPageForm");
    if (!form) return;
    const statusSlot = ensureStatusSlot(form, { position: "before", className: "mb-3" });

    const editId = Number(new URLSearchParams(window.location.search).get("id") || 0);
    const isEditMode = page === "provider-promotion-edit" && Number.isFinite(editId) && editId > 0;
    const imageInput = document.getElementById("providerPromotionImage");
    const imageFileInput = document.getElementById("providerPromotionImageFile");
    const imagePreview = document.getElementById("providerPromotionImagePreview");
    let imageObjectUrl = "";

    const toDateTime = (rawDate, endOfDay = false) => {
      const base = `${rawDate || todayISO()} ${endOfDay ? "23:59:59" : "00:00:00"}`;
      return base;
    };

    const setPreview = (src) => {
      if (!imagePreview) return;
      imagePreview.src = src || DEFAULT_POST_THUMBNAIL;
    };

    const revokePreview = () => {
      if (imageObjectUrl) {
        URL.revokeObjectURL(imageObjectUrl);
        imageObjectUrl = "";
      }
    };

    imageInput?.addEventListener("input", () => setPreview(String(imageInput.value || "").trim()));
    imageFileInput?.addEventListener("change", () => {
      const file = imageFileInput.files?.[0];
      if (!file) return;
      revokePreview();
      imageObjectUrl = URL.createObjectURL(file);
      setPreview(imageObjectUrl);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        renderStatusMessage(statusSlot, {
          type: "warning",
          title: "Khuyến mãi chưa hợp lệ",
          message: "Vui lòng kiểm tra lại các trường mã, thời gian và giá trị giảm."
        });
        return;
      }

      const code = String(document.getElementById("providerPromotionCode")?.value || "").trim().toUpperCase();
      const title = String(document.getElementById("providerPromotionTitle")?.value || "").trim();
      const discountType = String(document.getElementById("providerPromotionType")?.value || "percent");
      const discountValue = Math.max(0, normalizeNumber(document.getElementById("providerPromotionValue")?.value, 0));
      const minOrderValue = Math.max(0, normalizeNumber(document.getElementById("providerPromotionMinOrder")?.value, 0));
      const usageLimit = Math.max(0, normalizeNumber(document.getElementById("providerPromotionUsageLimit")?.value, 0));
      const startDate = String(document.getElementById("providerPromotionStartDate")?.value || todayISO());
      const endDate = String(document.getElementById("providerPromotionEndDate")?.value || todayISO());
      const status = String(document.getElementById("providerPromotionStatus")?.value || "active");
      const description = String(document.getElementById("providerPromotionDescription")?.value || "").trim();
      const imageUrlValue = String(document.getElementById("providerPromotionImage")?.value || "").trim();

      if (!title || discountValue <= 0) {
        renderStatusMessage(statusSlot, {
          type: "warning",
          title: "Thiếu thông tin khuyến mãi",
          message: "Tên chương trình và giá trị giảm phải hợp lệ trước khi lưu."
        });
        showToast("Vui lòng nhập tên và giá trị giảm hợp lệ.", "warning");
        return;
      }

      if (!isEditMode && !code) {
        renderStatusMessage(statusSlot, {
          type: "warning",
          title: "Thiếu mã khuyến mãi",
          message: "Mã khuyến mãi là bắt buộc khi tạo mới."
        });
        showToast("Mã khuyến mãi không được để trống.", "warning");
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      clearStatusSlot(statusSlot);

      try {
        await withPendingButton(submitButton, "Đang lưu khuyến mãi...", async () => {
          let uploadedImageUrl = "";
          const imageFile = imageFileInput?.files?.[0] || null;
          if (imageFile) {
            const imageData = new FormData();
            imageData.append("image", imageFile);
            const uploaded = await apiPost("/provider/promotions/upload-image", withProviderScopeFormData(imageData));
            uploadedImageUrl = String(uploaded?.url || "");
          }

          const payload = withProviderScopePayload({
            title,
            description,
            image_url: uploadedImageUrl || imageUrlValue || null,
            discount_type: normalizePromotionType(discountType),
            discount_value: discountValue,
            min_order_value: minOrderValue > 0 ? minOrderValue : null,
            usage_limit: usageLimit > 0 ? usageLimit : null,
            start_date: toDateTime(startDate),
            end_date: toDateTime(endDate, true),
            status
          });

          if (!isEditMode) payload.code = code;

          if (isEditMode) {
            await apiPut(`/provider/promotions/${editId}`, payload);
          } else {
            await apiPost("/provider/promotions", payload);
          }

          const rows = await apiGet("/provider/promotions", withProviderScopeParams({ limit: 100 }));
          if (Array.isArray(rows)) db.promotions = rows.map(mapPromotionFromApi);
        });

        renderStatusMessage(statusSlot, {
          type: "success",
          title: isEditMode ? "Đã cập nhật khuyến mãi" : "Đã tạo khuyến mãi",
          message: "Thông tin ưu đãi đã được lưu và đồng bộ với danh sách hiện tại."
        });
        showToast(isEditMode ? "Đã cập nhật khuyến mãi." : "Đã tạo khuyến mãi mới.");
        revokePreview();
        setTimeout(() => {
          window.location.href = routes.providerPromotions;
        }, 320);
      } catch (error) {
        renderStatusMessage(statusSlot, {
          type: "danger",
          title: "Không thể lưu khuyến mãi",
          message: error?.message || "Vui lòng thử lại sau."
        });
        showToast(error?.message || "Không thể lưu khuyến mãi lúc này.", "danger");
      }
    });
  };

  const initAdminTourFormPage = () => {
    return initSharedAdminTourFormPage({
      page,
      routes,
      db,
      apiGet,
      apiPost,
      apiPut,
      todayISO,
      normalizeNumber,
      mapTourFromApi,
      syncCategoriesFromTours,
      refreshAdminRows,
      showToast,
      ensureStatusSlot,
      renderStatusMessage,
      clearStatusSlot,
      withPendingButton
    });
    const form = document.getElementById("adminTourPageForm");
    if (!form) return;

    const editId = Number(new URLSearchParams(window.location.search).get("id") || 0);
    const isEditMode = page === "admin-tour-edit" && Number.isFinite(editId) && editId > 0;
    const titleInput = document.getElementById("adminTourTitle");
    const slugInput = document.getElementById("adminTourSlug");
    const thumbnailFileInput = document.getElementById("adminTourThumbnailFile");
    const galleryFileInput = document.getElementById("adminTourGalleryFiles");
    const previewWrap = document.getElementById("adminTourImagePreview");

    const slugifyText = (value) =>
      String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const syncSlug = () => {
      if (!slugInput || !titleInput) return;
      slugInput.value = slugifyText(titleInput.value);
    };

    titleInput?.addEventListener("input", syncSlug);
    syncSlug();

    const releasePreviewUrls = () => {
      previewWrap?.querySelectorAll("img[data-object-url]").forEach((img) => {
        const objectUrl = img.getAttribute("data-object-url");
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      });
    };

    const renderImagePreview = () => {
      if (!previewWrap) return;

      const selected = [
        ...(thumbnailFileInput?.files?.[0] ? [thumbnailFileInput.files[0]] : []),
        ...Array.from(galleryFileInput?.files || [])
      ].slice(0, 6);

      if (!selected.length) return;

      releasePreviewUrls();
      previewWrap.innerHTML = selected
        .map((_, index) => `<div class="col-6 col-md-3"><img class="rounded-3 border w-100" alt="preview" data-upload-preview="${index}" style="height:110px;object-fit:cover;" /></div>`)
        .join("");

      selected.forEach((file, index) => {
        const img = previewWrap.querySelector(`[data-upload-preview="${index}"]`);
        if (!img) return;
        const objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
        img.setAttribute("data-object-url", objectUrl);
      });
    };

    thumbnailFileInput?.addEventListener("change", renderImagePreview);
    galleryFileInput?.addEventListener("change", renderImagePreview);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }

      const title = String(document.getElementById("adminTourTitle")?.value || "").trim();
      const categoryId = normalizeNumber(document.getElementById("adminTourCategoryId")?.value, 0);
      const departureLocation = String(document.getElementById("adminTourDeparture")?.value || "").trim();
      const destination = String(document.getElementById("adminTourDestination")?.value || "").trim();
      const priceAdult = Math.max(0, normalizeNumber(document.getElementById("adminTourPriceAdult")?.value, 0));
      const priceChild = Math.max(0, normalizeNumber(document.getElementById("adminTourPriceChild")?.value, Math.round(priceAdult * 0.7)));
      const discountPriceRaw = Math.max(0, normalizeNumber(document.getElementById("adminTourDiscountPrice")?.value, 0));
      const maxGuests = Math.max(1, normalizeNumber(document.getElementById("adminTourMaxGuests")?.value, 30));
      const availableSlots = Math.max(0, normalizeNumber(document.getElementById("adminTourAvailableSlots")?.value, maxGuests));
      const departureDate = String(document.getElementById("adminTourDepartureDate")?.value || todayISO());
      const returnDate = String(document.getElementById("adminTourReturnDate")?.value || departureDate);
      const durationDays = Math.max(1, normalizeNumber(document.getElementById("adminTourDurationDays")?.value, 1));
      const durationNights = Math.max(0, normalizeNumber(document.getElementById("adminTourDurationNights")?.value, 0));
      const status = String(document.getElementById("adminTourStatus")?.value || "draft");
      const isFeatured = Boolean(document.getElementById("adminTourFeatured")?.checked);
      const shortDescription = String(document.getElementById("adminTourShortDescription")?.value || "").trim();
      const description = String(document.getElementById("adminTourDescription")?.value || "").trim();
      const itinerary = String(document.getElementById("adminTourItinerary")?.value || "").trim();
      const includedServices = String(document.getElementById("adminTourIncludedServices")?.value || "").trim();
      const excludedServices = String(document.getElementById("adminTourExcludedServices")?.value || "").trim();
      const policy = String(document.getElementById("adminTourPolicy")?.value || "").trim();

      if (!title || !departureLocation || !destination || priceAdult <= 0) {
        showToast("Vui lòng nhập đầy đủ tên tour, điểm đi/đến và giá người lớn.", "warning");
        return;
      }

      let providerId = Number(db.providers[0]?.id || 0);
      const currentTour = isEditMode ? db.tours.find((tour) => Number(tour.id) === editId) : null;
      if (isEditMode) {
        providerId = Number(currentTour?.providerId || providerId);
      }
      if (providerId <= 0) {
        try {
          const providerRows = await apiGet("/admin/providers", { limit: 1 });
          if (Array.isArray(providerRows) && providerRows.length > 0) {
            providerId = Number(providerRows[0].id || providerId);
          }
        } catch (_error) {
          // Giữ fallback mặc định.
        }
      }

      const uploadThumbnailFile = thumbnailFileInput?.files?.[0] || null;
      const uploadGalleryFiles = Array.from(galleryFileInput?.files || []);
      const existingThumbnail = String(currentTour?.image || "").trim();
      const totalUploadCount = (uploadThumbnailFile ? 1 : 0) + uploadGalleryFiles.length;

      if (totalUploadCount > 6) {
        showToast("Mỗi tour chỉ hỗ trợ tối đa 6 ảnh tải lên.", "warning");
        return;
      }

      const payload = {
        provider_id: providerId > 0 ? providerId : 1,
        category_id: categoryId > 0 ? categoryId : 1,
        title,
        destination,
        departure_location: departureLocation,
        duration_days: durationDays,
        duration_nights: durationNights,
        price_adult: priceAdult,
        price_child: priceChild,
        discount_price: discountPriceRaw > 0 ? discountPriceRaw : null,
        thumbnail: existingThumbnail || null,
        short_description: shortDescription || title,
        description: description || shortDescription || title,
        itinerary,
        included_services: includedServices,
        excluded_services: excludedServices,
        policy,
        max_guests: maxGuests,
        available_slots: availableSlots,
        departure_date: departureDate,
        return_date: returnDate,
        status,
        is_featured: isFeatured ? 1 : 0
      };

      try {
        const savedTour = isEditMode
          ? await apiPut(`/admin/tours/${editId}`, payload)
          : await apiPost("/admin/tours", payload);

        const savedTourId = Number(savedTour?.id || editId || 0);
        const filesToUpload = [
          ...(uploadThumbnailFile ? [{ file: uploadThumbnailFile, setThumbnail: true }] : []),
          ...uploadGalleryFiles.map((file, index) => ({
            file,
            setThumbnail: !uploadThumbnailFile && index === 0
          }))
        ];

        if (savedTourId > 0 && filesToUpload.length > 0) {
          for (const item of filesToUpload) {
            const imageData = new FormData();
            imageData.append("image", item.file);
            imageData.append("set_thumbnail", item.setThumbnail ? "1" : "0");
            if (providerId > 0) {
              imageData.append("provider_id", String(providerId));
            }
            await apiPost(`/provider/tours/${savedTourId}/images`, imageData);
          }
        }

        releasePreviewUrls();

        const [tourRows, categoryRows] = await Promise.all([
          apiGet("/admin/tours", { limit: 100 }),
          apiGet("/admin/categories", { limit: 100 })
        ]);

        if (Array.isArray(tourRows)) db.tours = tourRows.map(mapTourFromApi);
        if (Array.isArray(categoryRows)) {
          db.categories = categoryRows.map((item) => ({
            id: item.id,
            name: item.name,
            tours: normalizeNumber(item.total_tours || item.tours_count || 0),
            icon: "bi-compass",
            status: labelProviderStatus(item.status || "active")
          }));
        }

        syncCategoriesFromTours();
        refreshAdminRows();
        showToast(isEditMode ? "Đã cập nhật tour." : "Đã tạo tour mới.");
        setTimeout(() => {
          window.location.href = routes.adminTours;
        }, 320);
      } catch (error) {
        showToast(error?.message || "Không thể lưu tour lúc này.", "danger");
      }
    });
  };

  const initAdminPostFormPage = () => {
    return initSharedAdminPostFormPage({
      page,
      routes,
      db,
      apiGet,
      apiPost,
      apiPut,
      parseListField,
      mapPostFromApi,
      refreshAdminRows,
      toBackendPostStatus,
      DEFAULT_POST_THUMBNAIL,
      showToast,
      ensureStatusSlot,
      renderStatusMessage,
      clearStatusSlot,
      withPendingButton
    });
    const form = document.getElementById("adminPostPageForm");
    if (!form) return;
    const statusSlot = ensureStatusSlot(form, { position: "before", className: "mb-3" });

    const editId = Number(new URLSearchParams(window.location.search).get("id") || 0);
    const isEditMode = page === "admin-post-edit" && Number.isFinite(editId) && editId > 0;
    const titleInput = document.getElementById("adminPostPageTitle");
    const slugInput = document.getElementById("adminPostPageSlug");
    const thumbnailInput = document.getElementById("adminPostPageThumbnail");
    const thumbnailFileInput = document.getElementById("adminPostPageThumbnailFile");
    const galleryFileInput = document.getElementById("adminPostPageGalleryFiles");
    const thumbnailPreview = document.getElementById("adminPostPageThumbnailPreview");
    let previewObjectUrl = "";

    const slugifyText = (value) =>
      String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const syncSlug = () => {
      if (!slugInput || !titleInput) return;
      slugInput.value = slugifyText(titleInput.value);
    };

    titleInput?.addEventListener("input", syncSlug);
    syncSlug();

    const setThumbnailPreview = (src) => {
      if (!thumbnailPreview) return;
      thumbnailPreview.src = src || DEFAULT_POST_THUMBNAIL;
    };

    const revokePreviewObjectUrl = () => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = "";
      }
    };

    thumbnailInput?.addEventListener("input", () => {
      const manualUrl = String(thumbnailInput.value || "").trim();
      if (manualUrl) setThumbnailPreview(manualUrl);
    });

    thumbnailFileInput?.addEventListener("change", () => {
      const file = thumbnailFileInput.files?.[0];
      if (!file) return;
      revokePreviewObjectUrl();
      previewObjectUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewObjectUrl);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        renderStatusMessage(statusSlot, {
          type: "warning",
          title: "Biểu mẫu bài viết chưa hợp lệ",
          message: "Vui lòng kiểm tra lại các trường bắt buộc trước khi lưu."
        });
        return;
      }

      const title = String(document.getElementById("adminPostPageTitle")?.value || "").trim();
      const excerpt = String(document.getElementById("adminPostPageExcerpt")?.value || "").trim();
      const content = String(document.getElementById("adminPostPageContent")?.value || "").trim();
      const thumbnail = String(document.getElementById("adminPostPageThumbnail")?.value || "").trim();
      const category = String(document.getElementById("adminPostPageCategory")?.value || "").trim();
      const tags = parseListField(document.getElementById("adminPostPageTags")?.value || "", /[\r\n,;]/);
      const gallery = parseListField(document.getElementById("adminPostPageGallery")?.value || "", /[\r\n,;]/);
      const metaTitle = String(document.getElementById("adminPostPageMetaTitle")?.value || "").trim();
      const metaDescription = String(document.getElementById("adminPostPageMetaDescription")?.value || "").trim();
      const isFeatured = document.getElementById("adminPostPageFeatured")?.checked ? 1 : 0;
      const status = toBackendPostStatus(document.getElementById("adminPostPageStatus")?.value || "draft");

      if (!title || !excerpt || !content) {
        renderStatusMessage(statusSlot, {
          type: "warning",
          title: "Thiếu nội dung bài viết",
          message: "Tiêu đề, mô tả ngắn và nội dung chi tiết là bắt buộc."
        });
        showToast("Vui lòng nhập tiêu đề, mô tả ngắn và nội dung chi tiết.", "warning");
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      clearStatusSlot(statusSlot);

      try {
        await withPendingButton(submitButton, "Đang lưu bài viết...", async () => {
          let uploadedThumbnail = "";
          const thumbnailFile = thumbnailFileInput?.files?.[0] || null;
          if (thumbnailFile) {
            const imageData = new FormData();
            imageData.append("image", thumbnailFile);
            const uploaded = await apiPost("/admin/posts/upload-image", imageData);
            uploadedThumbnail = String(uploaded?.url || "");
          }

          const galleryFiles = Array.from(galleryFileInput?.files || []).slice(0, 8);
          const uploadedGallery = [];
          for (const file of galleryFiles) {
            const imageData = new FormData();
            imageData.append("image", file);
            const uploaded = await apiPost("/admin/posts/upload-image", imageData);
            if (uploaded?.url) uploadedGallery.push(String(uploaded.url));
          }

          const mergedGallery = [...gallery, ...uploadedGallery].filter(Boolean);
          const payload = {
            title,
            excerpt,
            content,
            thumbnail: uploadedThumbnail || thumbnail || DEFAULT_POST_THUMBNAIL,
            status,
            category: category || "Cẩm nang",
            tags: tags.length ? tags : null,
            gallery: mergedGallery.length ? mergedGallery : null,
            meta_title: metaTitle || null,
            meta_description: metaDescription || null,
            is_featured: isFeatured
          };

          if (isEditMode) {
            await apiPut(`/admin/posts/${editId}`, payload);
          } else {
            await apiPost("/admin/posts", payload);
          }

          const rows = await apiGet("/admin/posts", { limit: 100 });
          if (Array.isArray(rows)) db.posts = rows.map(mapPostFromApi);
        });

        refreshAdminRows();
        renderStatusMessage(statusSlot, {
          type: "success",
          title: isEditMode ? "Đã cập nhật bài viết" : "Đã tạo bài viết",
          message: "Nội dung mới đã được đồng bộ vào khu quản trị."
        });
        showToast(isEditMode ? "Đã cập nhật bài viết." : "Đã tạo bài viết mới.");
        revokePreviewObjectUrl();
        setTimeout(() => {
          window.location.href = routes.adminPosts;
        }, 320);
      } catch (error) {
        renderStatusMessage(statusSlot, {
          type: "danger",
          title: "Không thể lưu bài viết",
          message: error?.message || "Vui lòng thử lại sau."
        });
        showToast(error?.message || "Không thể lưu bài viết lúc này.", "danger");
      }
    });
  };

  const initAdminPromotionFormPage = () => {
    return initSharedAdminPromotionFormPage({
      page,
      routes,
      db,
      apiGet,
      apiPost,
      apiPut,
      todayISO,
      normalizeNumber,
      normalizePromotionType,
      mapPromotionFromApi,
      DEFAULT_POST_THUMBNAIL,
      showToast,
      ensureStatusSlot,
      renderStatusMessage,
      clearStatusSlot,
      withPendingButton
    });
    const form = document.getElementById("adminPromotionPageForm");
    if (!form) return;
    const statusSlot = ensureStatusSlot(form, { position: "before", className: "mb-3" });

    const editId = Number(new URLSearchParams(window.location.search).get("id") || 0);
    const isEditMode = page === "admin-promotion-edit" && Number.isFinite(editId) && editId > 0;
    const toDateTime = (rawDate, endOfDay = false) => `${rawDate || todayISO()} ${endOfDay ? "23:59:59" : "00:00:00"}`;
    const imageInput = document.getElementById("adminPromotionPageImage");
    const imageFileInput = document.getElementById("adminPromotionPageImageFile");
    const imagePreview = document.getElementById("adminPromotionPageImagePreview");
    let imageObjectUrl = "";

    const setPreview = (src) => {
      if (!imagePreview) return;
      imagePreview.src = src || DEFAULT_POST_THUMBNAIL;
    };

    const revokePreview = () => {
      if (imageObjectUrl) {
        URL.revokeObjectURL(imageObjectUrl);
        imageObjectUrl = "";
      }
    };

    imageInput?.addEventListener("input", () => setPreview(String(imageInput.value || "").trim()));
    imageFileInput?.addEventListener("change", () => {
      const file = imageFileInput.files?.[0];
      if (!file) return;
      revokePreview();
      imageObjectUrl = URL.createObjectURL(file);
      setPreview(imageObjectUrl);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        renderStatusMessage(statusSlot, {
          type: "warning",
          title: "Biểu mẫu khuyến mãi chưa hợp lệ",
          message: "Vui lòng kiểm tra lại thời gian, giá trị giảm và trạng thái."
        });
        return;
      }

      const code = String(document.getElementById("adminPromotionPageCode")?.value || "").trim().toUpperCase();
      const title = String(document.getElementById("adminPromotionPageTitle")?.value || "").trim();
      const discountType = normalizePromotionType(document.getElementById("adminPromotionPageType")?.value || "percent");
      const discountValue = Math.max(0, normalizeNumber(document.getElementById("adminPromotionPageValue")?.value, 0));
      const minOrderValue = Math.max(0, normalizeNumber(document.getElementById("adminPromotionPageMinOrder")?.value, 0));
      const usageLimit = Math.max(0, normalizeNumber(document.getElementById("adminPromotionPageUsageLimit")?.value, 0));
      const startDate = String(document.getElementById("adminPromotionPageStartDate")?.value || todayISO());
      const endDate = String(document.getElementById("adminPromotionPageEndDate")?.value || todayISO());
      const status = String(document.getElementById("adminPromotionPageStatus")?.value || "active");
      const description = String(document.getElementById("adminPromotionPageDescription")?.value || "").trim();
      const imageUrlValue = String(document.getElementById("adminPromotionPageImage")?.value || "").trim();

      if (!title || discountValue <= 0) {
        renderStatusMessage(statusSlot, {
          type: "warning",
          title: "Thiếu thông tin khuyến mãi",
          message: "Tên chương trình và giá trị giảm phải hợp lệ."
        });
        showToast("Vui lòng nhập tên chương trình và giá trị giảm hợp lệ.", "warning");
        return;
      }

      if (!isEditMode && !code) {
        renderStatusMessage(statusSlot, {
          type: "warning",
          title: "Thiếu mã giảm giá",
          message: "Mã giảm giá là bắt buộc khi tạo mới."
        });
        showToast("Mã giảm giá không được để trống.", "warning");
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      clearStatusSlot(statusSlot);

      try {
        await withPendingButton(submitButton, "Đang lưu khuyến mãi...", async () => {
          let uploadedImageUrl = "";
          const imageFile = imageFileInput?.files?.[0] || null;
          if (imageFile) {
            const imageData = new FormData();
            imageData.append("image", imageFile);
            const uploaded = await apiPost("/admin/promotions/upload-image", imageData);
            uploadedImageUrl = String(uploaded?.url || "");
          }

          const payload = {
            title,
            description,
            image_url: uploadedImageUrl || imageUrlValue || null,
            discount_type: discountType,
            discount_value: discountValue,
            min_order_value: minOrderValue > 0 ? minOrderValue : null,
            usage_limit: usageLimit > 0 ? usageLimit : null,
            start_date: toDateTime(startDate),
            end_date: toDateTime(endDate, true),
            status
          };

          if (!isEditMode) payload.code = code;

          if (isEditMode) {
            await apiPut(`/admin/promotions/${editId}`, payload);
          } else {
            await apiPost("/admin/promotions", payload);
          }

          const rows = await apiGet("/admin/promotions", { limit: 100 });
          if (Array.isArray(rows)) db.promotions = rows.map(mapPromotionFromApi);
        });

        refreshAdminRows();
        renderStatusMessage(statusSlot, {
          type: "success",
          title: isEditMode ? "Đã cập nhật khuyến mãi" : "Đã tạo khuyến mãi",
          message: "Chương trình ưu đãi đã được đồng bộ vào danh sách quản trị."
        });
        showToast(isEditMode ? "Đã cập nhật khuyến mãi." : "Đã tạo khuyến mãi mới.");
        revokePreview();
        setTimeout(() => {
          window.location.href = routes.adminPromotions;
        }, 320);
      } catch (error) {
        renderStatusMessage(statusSlot, {
          type: "danger",
          title: "Không thể lưu khuyến mãi",
          message: error?.message || "Vui lòng thử lại sau."
        });
        showToast(error?.message || "Không thể lưu khuyến mãi lúc này.", "danger");
      }
    });
  };


  const initProviderFeedbackPage = () => {
    const textarea = document.getElementById("providerFeedbackTemplate");
    const saveButton = document.getElementById("providerFeedbackTemplateSave");
    if (!textarea || !saveButton) return;

    const savedTemplate = readLS(LS_KEYS.providerFeedbackTemplate, "");
    if (savedTemplate) textarea.value = savedTemplate;

    saveButton.addEventListener("click", () => {
      const value = textarea.value.trim();
      writeLS(LS_KEYS.providerFeedbackTemplate, value);
      showToast("Đã lưu mẫu phản hồi.");
    });
  };
  const initAdminRolesPage = () => {
    const form = document.getElementById("adminRoleForm");
    if (!form) return;

    const resetButton = document.getElementById("adminRoleReset");
    resetButton?.addEventListener("click", () => {
      form.reset();
      form.classList.remove("was-validated");
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }

      const name = document.getElementById("adminRoleName")?.value?.trim() || "";
      const description = document.getElementById("adminRoleDescription")?.value?.trim() || "";

      try {
        const created = await apiPost("/admin/roles", {
          name: name.toLowerCase(),
          description
        });

        adminRolesData.unshift(created);
        showToast("Đã tạo vai trò mới.");
        renderCurrentPage();
        initPageBehaviors();
      } catch (error) {
        showToast(error?.message || "Không thể tạo vai trò mới.", "danger");
      }
    });
  };

  const initCharts = () => {
    if (typeof Chart === "undefined") return;

    const monthLabel = (value) => String(value || "").replace(/^\d{4}-/, "T");

    if (page === "provider-dashboard") {
      const ctx = document.getElementById("providerBookingChart");
      const chartRows = providerDashboardData?.booking_chart || [];

      const fallbackMonthly = db.bookings
        .filter((booking) => String(booking.providerId) === String(activeProviderId))
        .reduce((acc, booking) => {
          const key = String(booking.bookingDate || "").slice(0, 7);
          if (!key) return acc;
          acc.set(key, (acc.get(key) || 0) + 1);
          return acc;
        }, new Map());

      const fallbackRows = [...fallbackMonthly.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month_key, total]) => ({ month_key, total }));

      const sourceRows = chartRows.length ? chartRows : (allowLocalFallback ? fallbackRows : []);
      const labels = sourceRows.length ? sourceRows.map((item) => monthLabel(item.month_key)) : ["T1"];
      const series = sourceRows.length ? sourceRows.map((item) => Number(item.total || 0)) : [0];

      if (ctx) {
        new Chart(ctx, {
          type: "line",
          data: {
            labels,
            datasets: [{
              label: "Booking",
              data: series,
              borderColor: "#1f6be0",
              backgroundColor: "rgba(31, 107, 224, 0.12)",
              tension: 0.4,
              fill: true,
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, grid: { color: "rgba(99,119,152,0.15)" } },
              x: { grid: { display: false } }
            }
          }
        });
      }
    }

    if (page === "admin-dashboard") {
      const revenueCtx = document.getElementById("adminRevenueChart");
      const revenueRows = adminDashboardData?.revenue_chart || [];

      const fallbackRevenueMonthly = db.bookings
        .filter((booking) => booking.paymentStatus === "Đã thanh toán" || booking.paymentStatus === "Thành công")
        .reduce((acc, booking) => {
          const key = String(booking.bookingDate || "").slice(0, 7);
          if (!key) return acc;
          acc.set(key, (acc.get(key) || 0) + Number(booking.amount || 0));
          return acc;
        }, new Map());

      const fallbackRevenueRows = [...fallbackRevenueMonthly.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month_key, revenue]) => ({ month_key, revenue }));

      const sourceRevenueRows = revenueRows.length ? revenueRows : (allowLocalFallback ? fallbackRevenueRows : []);
      const revenueLabels = sourceRevenueRows.length ? sourceRevenueRows.map((item) => monthLabel(item.month_key)) : ["T1"];
      const revenueValues = sourceRevenueRows.length
        ? sourceRevenueRows.map((item) => Math.round(Number(item.revenue || 0) / 1000000))
        : [0];

      if (revenueCtx) {
        new Chart(revenueCtx, {
          type: "bar",
          data: {
            labels: revenueLabels,
            datasets: [{
              label: "Doanh thu (triệu)",
              data: revenueValues,
              backgroundColor: "rgba(42, 130, 255, 0.75)",
              borderRadius: 8
            }]
          },
          options: {
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, grid: { color: "rgba(99,119,152,0.15)" } },
              x: { grid: { display: false } }
            }
          }
        });
      }

      const categoryCtx = document.getElementById("adminCategoryChart");
      const categoryRows = adminDashboardData?.category_chart || [];

      const fallbackCategoryMap = db.tours.reduce((acc, tour) => {
        const key = tour.category || "Khác";
        acc.set(key, (acc.get(key) || 0) + 1);
        return acc;
      }, new Map());

      const fallbackCategoryRows = [...fallbackCategoryMap.entries()].map(([category_name, total]) => ({ category_name, total }));
      const sourceCategoryRows = categoryRows.length ? categoryRows : (allowLocalFallback ? fallbackCategoryRows : []);

      const categoryLabels = sourceCategoryRows.length ? sourceCategoryRows.map((item) => item.category_name) : ["Khác"];
      const categoryValues = sourceCategoryRows.length ? sourceCategoryRows.map((item) => Number(item.total || 0)) : [0];

      if (categoryCtx) {
        new Chart(categoryCtx, {
          type: "doughnut",
          data: {
            labels: categoryLabels,
            datasets: [{ data: categoryValues, backgroundColor: ["#2a82ff", "#1db8a8", "#ff9f43", "#90a8d6"] }]
          },
          options: { plugins: { legend: { position: "bottom" } } }
        });
      }
    }

    if (page === "admin-stats") {
      const usersCtx = document.getElementById("adminUsersChart");
      const growthRows = adminStatsData?.user_growth || [];

      const fallbackGrowthMap = db.users.reduce((acc, user) => {
        const key = String(user.joinedAt || "").slice(0, 7);
        if (!key) return acc;
        acc.set(key, (acc.get(key) || 0) + 1);
        return acc;
      }, new Map());

      const fallbackGrowthRows = [...fallbackGrowthMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month_key, total]) => ({ month_key, total }));

      const sourceGrowthRows = growthRows.length ? growthRows : (allowLocalFallback ? fallbackGrowthRows : []);
      const growthLabels = sourceGrowthRows.length ? sourceGrowthRows.map((item) => monthLabel(item.month_key)) : ["T1"];
      const userGrowthValues = sourceGrowthRows.length ? sourceGrowthRows.map((item) => Number(item.total || 0)) : [0];

      if (usersCtx) {
        new Chart(usersCtx, {
          type: "line",
          data: {
            labels: growthLabels,
            datasets: [{
              label: "User mới",
              data: userGrowthValues,
              borderColor: "#2a82ff",
              tension: 0.35,
              fill: false,
              borderWidth: 2
            }]
          },
          options: {
            plugins: { legend: { position: "bottom" } },
            scales: {
              y: { beginAtZero: true, grid: { color: "rgba(99,119,152,0.15)" } },
              x: { grid: { display: false } }
            }
          }
        });
      }

      const regionCtx = document.getElementById("adminRegionChart");
      const regionRows = adminStatsData?.booking_region || [];

      const fallbackRegionMap = db.bookings.reduce((acc, booking) => {
        const destination = getTourById(booking.tourId)?.location || "Khác";
        acc.set(destination, (acc.get(destination) || 0) + 1);
        return acc;
      }, new Map());

      const fallbackRegionRows = [...fallbackRegionMap.entries()].map(([destination, total]) => ({ destination, total }));
      const sourceRegionRows = regionRows.length ? regionRows : (allowLocalFallback ? fallbackRegionRows : []);

      const regionLabels = sourceRegionRows.length ? sourceRegionRows.map((item) => item.destination || "Khác") : ["Khác"];
      const regionValues = sourceRegionRows.length ? sourceRegionRows.map((item) => Number(item.total || 0)) : [0];

      if (regionCtx) {
        new Chart(regionCtx, {
          type: "pie",
          data: {
            labels: regionLabels,
            datasets: [{ data: regionValues, backgroundColor: ["#2a82ff", "#1db8a8", "#ff9f43", "#7187b5"] }]
          },
          options: { plugins: { legend: { position: "bottom" } } }
        });
      }
    }
  };
  const initSmartTables = () => {
    document.querySelectorAll(".smart-table-wrap").forEach((wrap) => {
      const rows = Array.from(wrap.querySelectorAll("tbody tr"));
      if (!rows.length) return;
      const search = wrap.querySelector(".table-search");
      const filters = Array.from(wrap.querySelectorAll(".table-filter"));
      const pagination = wrap.querySelector(".smart-pagination");
      const empty = wrap.querySelector(".empty-state");
      const selectAll = wrap.querySelector(".select-all");
      const pageSize = Number(wrap.dataset.pageSize || 8);
      let currentPage = 1;

      const getFilteredRows = () => {
        const keyword = (search?.value || "").trim().toLowerCase();
        return rows.filter((row) => {
          const searchText = (row.getAttribute("data-search") || "").toLowerCase();
          const keywordMatch = keyword ? searchText.includes(keyword) : true;
          const filterMatch = filters.every((filter) => {
            const field = filter.getAttribute("data-field")?.toLowerCase();
            const selected = filter.value;
            if (!field || !selected) return true;
            return (row.getAttribute(`data-${field}`) || "") === selected;
          });
          return keywordMatch && filterMatch;
        });
      };

      const draw = () => {
        const filtered = getFilteredRows();
        const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        if (currentPage > totalPages) currentPage = totalPages;
        rows.forEach((row) => row.classList.add("d-none"));
        filtered.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize).forEach((row) => row.classList.remove("d-none"));
        if (empty) empty.classList.toggle("d-none", filtered.length > 0);
        if (pagination) {
          pagination.innerHTML = totalPages <= 1 ? "" : [`<button class="page-btn" data-table-page="prev"><i class="bi bi-chevron-left"></i></button>`, ...Array.from({ length: totalPages }, (_, i) => `<button class="page-btn ${i + 1 === currentPage ? "active" : ""}" data-table-page="${i + 1}">${i + 1}</button>`), `<button class="page-btn" data-table-page="next"><i class="bi bi-chevron-right"></i></button>`].join("");
          pagination.querySelectorAll("[data-table-page]").forEach((button) => button.addEventListener("click", () => {
            const target = button.getAttribute("data-table-page");
            if (target === "prev") currentPage = Math.max(1, currentPage - 1);
            else if (target === "next") currentPage = Math.min(totalPages, currentPage + 1);
            else currentPage = Number(target);
            draw();
          }));
        }
        if (selectAll) selectAll.checked = false;
      };

      search?.addEventListener("input", () => { currentPage = 1; draw(); });
      filters.forEach((filter) => filter.addEventListener("change", () => { currentPage = 1; draw(); }));
      selectAll?.addEventListener("change", () => {
        const checked = selectAll.checked;
        rows.filter((row) => !row.classList.contains("d-none")).forEach((row) => {
          const cb = row.querySelector(".row-check");
          if (cb) cb.checked = checked;
        });
      });
      draw();
    });
  };

  const initPremiumPolish = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let progress = document.querySelector(".scroll-progress");
    if (!progress) {
      progress = document.createElement("div");
      progress.className = "scroll-progress";
      document.body.appendChild(progress);
    }

    if (!window.__vhScrollProgressBound) {
      const updateProgress = () => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = scrollHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollHeight)) : 0;
        document.body.style.setProperty("--scroll-progress", String(ratio));
      };
      window.__vhUpdateScrollProgress = updateProgress;
      window.addEventListener("scroll", updateProgress, { passive: true });
      window.addEventListener("resize", updateProgress);
      window.__vhScrollProgressBound = true;
    }

    if (window.__vhUpdateScrollProgress) {
      window.__vhUpdateScrollProgress();
    }

    const revealTargets = Array.from(
      document.querySelectorAll(".tour-card, .reason-card, .post-card, .testimonial-card, .metric-card, .table-card, .panel-card, .account-card, .contact-card, .invoice-paper")
    );

    revealTargets.forEach((el, index) => {
      el.setAttribute("data-reveal", "");
      el.style.setProperty("--reveal-delay", `${(index % 6) * 45}ms`);
    });

    if (window.__vhRevealObserver) {
      window.__vhRevealObserver.disconnect();
      window.__vhRevealObserver = null;
    }

    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealTargets.forEach((el) => el.classList.add("is-visible"));
    } else {
      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
      );
      revealTargets.forEach((el) => observer.observe(el));
      window.__vhRevealObserver = observer;
    }

    if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
      const hero = document.querySelector(".hero-surface");
      const heroContent = hero?.querySelector(".hero-content");
      if (hero && heroContent && !hero.dataset.parallaxBound) {
        hero.dataset.parallaxBound = "1";
        hero.addEventListener("mousemove", (event) => {
          const rect = hero.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          heroContent.style.transform = `translate3d(${x * 12}px, ${y * 10}px, 0)`;
        });
        hero.addEventListener("mouseleave", () => {
          heroContent.style.transform = "translate3d(0, 0, 0)";
        });
      }
    }
  };

  const initDelegatedActions = () => {
    document.addEventListener("click", async (event) => {
      const target = event.target.closest("[data-action]");
      if (!target) return;

      const action = target.getAttribute("data-action");


      if (action === "provider-preview-profile") {
        const form = document.getElementById("providerProfileForm");
        const modalEl = document.getElementById("providerProfilePreviewModal");
        if (!form || !modalEl) return;

        const fields = form.querySelectorAll("input, textarea");
        const setText = (id, value) => {
          const el = document.getElementById(id);
          if (el) el.textContent = value || "-";
        };

        setText("providerPreviewName", fields[0]?.value?.trim());
        setText("providerPreviewCode", fields[1]?.value?.trim());
        setText("providerPreviewEmail", fields[2]?.value?.trim());
        setText("providerPreviewPhone", fields[3]?.value?.trim());
        setText("providerPreviewCity", fields[4]?.value?.trim());
        setText("providerPreviewStatus", fields[5]?.value?.trim());
        setText("providerPreviewDescription", fields[6]?.value?.trim());
        setText("providerPreviewPolicy", fields[7]?.value?.trim());

        if (window.bootstrap?.Modal) {
          window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
        }
        return;
      }
      if (action === "toggle-wishlist") {
        const tourId = target.getAttribute("data-tour-id");
        if (tourId) await toggleWishlist(tourId);
      }

      if (action === "cancel-booking") {
        const code = target.getAttribute("data-code");
        if (!code) return;

        const booking = db.bookings.find((item) => String(item.code) === String(code));
        try {
          if (!booking?.id) {
            throw new Error("Không tìm thấy booking cần hủy trong dữ liệu hiện tại.");
          }

          await apiPut(`/bookings/${booking.id}/cancel`, {});
          booking.status = "Đã hủy";
          showToast(`Đã gửi yêu cầu hủy đơn ${code}.`, "warning");
        } catch (error) {
          showToast(error?.message || `Không thể hủy đơn ${code} lúc này.`, "danger");
        }

        if (page === "booking-history") {
          renderCurrentPage();
          initPageBehaviors();
        }
      }

      if (action === "notification-read") {
        const notificationId = Number(target.getAttribute("data-notification-id") || 0);
        if (!notificationId) return;

        try {
          await apiPut(`/notifications/${notificationId}/read`, {});
          markNotificationReadLocal(notificationId);
          showToast("Đã đánh dấu thông báo là đã đọc.", "success");
          if (page === "profile") {
            renderCurrentPage();
            initPageBehaviors();
          }
        } catch (error) {
          showToast(resolveErrorMessage(error, "Không thể cập nhật thông báo."), "danger");
        }
      }

      if (action === "user-review-edit") {
        const commentId = Number(target.getAttribute("data-comment-id") || 0);
        const ratingId = Number(target.getAttribute("data-rating-id") || 0);
        const score = Number(target.getAttribute("data-score") || 5);
        const currentContent = target.getAttribute("data-content") || "";
        const currentReview = target.getAttribute("data-review") || currentContent;

        openActionModal({
          title: "Cập nhật đánh giá tour",
          body: `
            <div class="mb-3">
              <label class="form-label">Số sao</label>
              <select name="score" class="form-select">
                ${[5, 4, 3, 2, 1].map((value) => `<option value="${value}" ${value === score ? "selected" : ""}>${value} sao</option>`).join("")}
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Nội dung bình luận</label>
              <textarea name="content" class="form-control" rows="4" required>${escapeHtml(currentContent)}</textarea>
            </div>
            <div>
              <label class="form-label">Nội dung đánh giá</label>
              <textarea name="review" class="form-control" rows="3">${escapeHtml(currentReview)}</textarea>
            </div>
          `,
          submitLabel: "Cập nhật",
          onSubmit: async (formData) => {
            const nextContent = String(formData.get("content") || "").trim();
            const nextReview = String(formData.get("review") || "").trim();
            const nextScore = Number(formData.get("score") || score || 5);

            if (!nextContent) {
              showToast("Vui lòng nhập nội dung bình luận.", "warning");
              throw new Error("Nội dung bình luận trống.");
            }

            if (commentId > 0) {
              await apiPut(`/comments/${commentId}`, { content: nextContent });
            }

            if (ratingId > 0) {
              await apiPut(`/ratings/${ratingId}`, { score: nextScore, review: nextReview || nextContent });
            }

            const targetComment = db.comments.find((item) => Number(item.commentId) === commentId || Number(item.ratingId) === ratingId);
            if (targetComment) {
              targetComment.text = nextContent;
              targetComment.content = nextContent;
              targetComment.review = nextReview || nextContent;
              targetComment.rating = nextScore;
            }

            showToast("Đã cập nhật đánh giá của bạn.", "success");
            renderCurrentPage();
            initPageBehaviors();
          }
        });
      }

      if (action === "user-review-delete") {
        const commentId = Number(target.getAttribute("data-comment-id") || 0);
        const ratingId = Number(target.getAttribute("data-rating-id") || 0);

        openConfirmModal({
          title: "Xóa đánh giá",
          message: "Đánh giá và bình luận của bạn sẽ bị gỡ khỏi tour này. Bạn vẫn muốn tiếp tục?",
          submitLabel: "Xóa đánh giá",
          onConfirm: async () => {
            if (commentId > 0) {
              await apiDelete(`/comments/${commentId}`);
            }

            if (ratingId > 0) {
              await apiDelete(`/ratings/${ratingId}`);
            }

            db.comments = db.comments.filter(
              (item) => Number(item.commentId) !== commentId && Number(item.ratingId) !== ratingId
            );

            showToast("Đã xóa đánh giá của bạn.", "warning");
            if (page === "tour-detail") {
              renderCurrentPage();
              initPageBehaviors();
            }
          }
        });
      }

      if (action === "provider-confirm-booking" || action === "provider-cancel-booking") {
        const bookingCode = target.getAttribute("data-booking-code") || "";
        const bookingIdAttr = Number(target.getAttribute("data-booking-id") || 0);
        const booking = bookingIdAttr > 0
          ? db.bookings.find((item) => String(item.id) === String(bookingIdAttr))
          : db.bookings.find((item) => String(item.code) === String(bookingCode));

        const bookingId = bookingIdAttr > 0 ? bookingIdAttr : Number(booking?.id || 0);
        if (!bookingId) {
          showToast("Không xác định được booking cần xử lý.", "warning");
          return;
        }

        const isConfirm = action === "provider-confirm-booking";
        const endpoint = isConfirm ? "confirm" : "cancel";

        try {
          const updated = await apiPut(`/provider/bookings/${bookingId}/${endpoint}`, withProviderScopePayload({}));
          const mapped = mapBookingFromApi(updated?.booking || updated || {});

          const index = db.bookings.findIndex((item) => String(item.id) === String(bookingId));
          if (index >= 0) {
            db.bookings[index] = {
              ...db.bookings[index],
              ...mapped,
              code: mapped.code || db.bookings[index].code,
              status: isConfirm ? "Đã xác nhận" : "Đã hủy"
            };
          }

          refreshDerivedCollections();
          showToast(isConfirm ? "Đã xác nhận booking." : "Đã hủy booking.", isConfirm ? "success" : "warning");

          if (["provider-bookings", "provider-booking-detail"].includes(page)) {
            renderCurrentPage();
            initPageBehaviors();
          }
        } catch (error) {
          showToast(error?.message || "Không thể xử lý booking lúc này.", "danger");
        }
      }
      if (action === "provider-delete-tour") {
        const tourId = Number(target.getAttribute("data-tour-id") || 0);
        if (!tourId) return;
        const tourName = target.getAttribute("data-tour-name") || "tour này";

        openConfirmModal({
          title: "Xóa tour của nhà cung cấp",
          message: `Tour "${tourName}" sẽ bị gỡ khỏi danh sách của provider. Bạn có chắc chắn muốn xóa?`,
          submitLabel: "Xóa tour",
          onConfirm: async () => {
            await apiDelete(`/provider/tours/${tourId}`, withProviderScopePayload({}));
            db.tours = db.tours.filter((tour) => Number(tour.id) !== tourId);
            syncCategoriesFromTours();
            refreshAdminRows();
            showToast("Đã xóa tour khỏi hệ thống provider.", "warning");
            if (["provider-tours", "admin-tours"].includes(page)) {
              renderCurrentPage();
              initPageBehaviors();
            }
          }
        });
      }

      if (action === "provider-hide-feedback") {
        const commentId = Number(target.getAttribute("data-comment-id") || 0);
        if (!commentId) return;

        try {
          await apiPut(`/provider/feedback/${commentId}/hide`, withProviderScopePayload({}));
          const index = db.comments.findIndex((comment) => Number(comment.id) === commentId);
          if (index >= 0) db.comments[index].status = "Đã ẩn";
          refreshAdminRows();
          showToast("Đã ẩn phản hồi khách hàng.", "warning");
          if (page === "provider-feedback") {
            renderCurrentPage();
            initPageBehaviors();
          }
        } catch (error) {
          showToast(error?.message || "Không thể ẩn phản hồi lúc này.", "danger");
        }
      }

      if (action === "provider-reply-feedback") {
        const commentId = Number(target.getAttribute("data-comment-id") || 0);
        if (!commentId) return;

        openActionModal({
          title: "Phản hồi khách hàng",
          body: `
            <div>
              <label class="form-label">Nội dung phản hồi</label>
              <textarea name="message" class="form-control" rows="4" required>Cảm ơn anh/chị đã chia sẻ trải nghiệm.</textarea>
            </div>
          `,
          submitLabel: "Gửi phản hồi",
          onSubmit: async (formData) => {
            const message = String(formData.get("message") || "").trim();
            if (!message) {
              showToast("Vui lòng nhập nội dung phản hồi.", "warning");
              throw new Error("reply-empty");
            }

            await apiPut(`/provider/feedback/${commentId}/reply`, withProviderScopePayload({ message }));
            showToast("Đã gửi phản hồi cho khách hàng.", "success");
          }
        });
      }

      if (action === "provider-edit-service") {
        const serviceId = Number(target.getAttribute("data-service-id") || 0);
        if (!serviceId) return;

        const service = db.services.find((item) => Number(item.id) === serviceId);
        openActionModal({
          title: "Cập nhật dịch vụ đi kèm",
          body: `
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">Tên dịch vụ</label>
                <input name="service_name" class="form-control" value="${escapeHtml(service?.name || "")}" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Loại dịch vụ</label>
                <input name="service_type" class="form-control" value="${escapeHtml(service?.type || "Khác")}" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Giá dịch vụ (VNĐ)</label>
                <input name="service_price" type="number" min="0" class="form-control" value="${Number(service?.price || 0)}" required />
              </div>
            </div>
          `,
          submitLabel: "Cập nhật",
          onSubmit: async (formData) => {
            const serviceName = String(formData.get("service_name") || "").trim();
            const serviceType = String(formData.get("service_type") || "").trim();
            const nextPrice = Math.max(0, normalizeNumber(formData.get("service_price"), service?.price || 0));

            if (!serviceName || !serviceType) {
              showToast("Vui lòng nhập đầy đủ thông tin dịch vụ.", "warning");
              throw new Error("service-invalid");
            }

            const updated = await apiPut(`/provider/services/${serviceId}`, withProviderScopePayload({
              service_name: serviceName,
              service_type: serviceType,
              description: `Giá tham khảo: ${vnd(nextPrice)}`
            }));

            if (service) {
              service.name = updated?.service_name || serviceName;
              service.type = updated?.service_type || serviceType;
              service.price = nextPrice;
            }

            showToast("Đã cập nhật dịch vụ.", "success");
            if (page === "provider-services") {
              renderCurrentPage();
              initPageBehaviors();
            }
          }
        });
      }

      if (action === "provider-delete-service") {
        const serviceId = Number(target.getAttribute("data-service-id") || 0);
        if (!serviceId) return;
        openConfirmModal({
          title: "Xóa dịch vụ",
          message: "Dịch vụ đi kèm này sẽ bị gỡ khỏi bước đặt tour. Bạn có muốn tiếp tục?",
          submitLabel: "Xóa dịch vụ",
          onConfirm: async () => {
            await apiDelete(`/provider/services/${serviceId}`, withProviderScopePayload({}));
            db.services = db.services.filter((item) => Number(item.id) !== serviceId);
            showToast("Đã xóa dịch vụ.", "warning");
            if (page === "provider-services") {
              renderCurrentPage();
              initPageBehaviors();
            }
          }
        });
      }

      if (action === "provider-edit-promotion") {
        const promotionId = Number(target.getAttribute("data-promotion-id") || 0);
        if (!promotionId) return;
        window.location.href = addQuery(routes.providerPromotionEdit, { id: promotionId });
      }

      if (action === "provider-toggle-promotion") {
        const promotionId = Number(target.getAttribute("data-promotion-id") || 0);
        const currentStatus = String(target.getAttribute("data-promotion-status") || "");
        if (!promotionId) return;

        const nextStatus = currentStatus.includes("Đang hoạt động") ? "inactive" : "active";

        try {
          await apiPut(`/provider/promotions/${promotionId}`, withProviderScopePayload({ status: nextStatus }));
          const promotion = db.promotions.find((item) => Number(item.id) === promotionId);
          if (promotion) promotion.status = labelProviderStatus(nextStatus);

          showToast(nextStatus === "active" ? "Đã kích hoạt khuyến mãi." : "Đã tạm dừng khuyến mãi.", "warning");
          if (page === "provider-promotions") {
            renderCurrentPage();
            initPageBehaviors();
          }
        } catch (error) {
          showToast(error?.message || "Không thể cập nhật trạng thái khuyến mãi.", "danger");
        }
      }

      if (action === "admin-role-edit") {
        const roleId = Number(target.getAttribute("data-role-id") || 0);
        if (!roleId) return;

        const currentName = target.getAttribute("data-role-name") || "";
        const currentDescription = target.getAttribute("data-role-description") || "";
        openActionModal({
          title: "Cập nhật vai trò",
          body: `
            <div class="mb-3">
              <label class="form-label">Tên vai trò</label>
              <input name="name" class="form-control" value="${escapeHtml(currentName)}" required />
            </div>
            <div>
              <label class="form-label">Mô tả</label>
              <textarea name="description" class="form-control" rows="3">${escapeHtml(currentDescription)}</textarea>
            </div>
          `,
          submitLabel: "Lưu thay đổi",
          onSubmit: async (formData) => {
            const nextName = String(formData.get("name") || "").trim().toLowerCase();
            const nextDescription = String(formData.get("description") || "").trim();
            if (!nextName) {
              showToast("Tên vai trò không được để trống.", "warning");
              throw new Error("role-invalid");
            }

            const updated = await apiPut(`/admin/roles/${roleId}`, {
              name: nextName,
              description: nextDescription
            });

            const index = adminRolesData.findIndex((item) => Number(item.id) === roleId);
            if (index >= 0) {
              adminRolesData[index] = { ...adminRolesData[index], ...updated };
            }

            showToast("Đã cập nhật vai trò.", "success");
            if (page === "admin-roles") {
              renderCurrentPage();
              initPageBehaviors();
            }
          }
        });
      }

      if (action === "admin-role-delete") {
        const roleId = Number(target.getAttribute("data-role-id") || 0);
        if (!roleId) return;

        openConfirmModal({
          title: "Xóa vai trò",
          message: "Vai trò này sẽ bị xóa khỏi hệ thống nếu không còn ràng buộc. Bạn có muốn tiếp tục?",
          submitLabel: "Xóa vai trò",
          onConfirm: async () => {
            await apiDelete(`/admin/roles/${roleId}`);
            adminRolesData = adminRolesData.filter((item) => Number(item.id) !== roleId);
            showToast("Đã xóa vai trò.", "warning");
            if (page === "admin-roles") {
              renderCurrentPage();
              initPageBehaviors();
            }
          }
        });
      }

      if (action === "provider-delete-promotion") {
        const promotionId = Number(target.getAttribute("data-promotion-id") || 0);
        if (!promotionId) return;

        const promotionTitle = target.getAttribute("data-promotion-title") || "khuyến mãi này";

        openConfirmModal({
          title: "Xóa khuyến mãi",
          message: `Khuyến mãi "${promotionTitle}" sẽ bị gỡ khỏi hệ thống provider. Bạn vẫn muốn tiếp tục?`,
          submitLabel: "Xóa khuyến mãi",
          onConfirm: async () => {
            await apiDelete(`/provider/promotions/${promotionId}`, withProviderScopePayload({}));
            db.promotions = db.promotions.filter((item) => Number(item.id) !== promotionId);
            showToast("Đã xóa khuyến mãi.", "warning");

            if (page === "provider-promotions") {
              renderCurrentPage();
              initPageBehaviors();
            }
          }
        });
      }

      if (action === "admin-create-user") {
        if (!Array.isArray(adminRolesData) || adminRolesData.length === 0) {
          const roleRows = await apiGet("/admin/roles");
          if (Array.isArray(roleRows)) adminRolesData = roleRows;
        }

        const roleOptions = adminRolesData
          .map((item) => `<option value="${escapeHtml(String(item.name || "user").toLowerCase())}">${item.name}</option>`)
          .join("");

        openActionModal({
          title: "Tạo người dùng mới",
          body: `
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">Họ tên</label>
                <input name="full_name" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Email đăng nhập</label>
                <input name="email" type="email" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Mật khẩu tạm</label>
                <input name="password" class="form-control" value="123456" required minlength="6" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Vai trò</label>
                <select name="role_name" class="form-select">${roleOptions}</select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Trạng thái</label>
                <select name="status" class="form-select">
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Tạm dừng</option>
                  <option value="blocked">Khóa</option>
                </select>
              </div>
            </div>
          `,
          submitLabel: "Tạo người dùng",
          onSubmit: async (formData) => {
            const fullName = String(formData.get("full_name") || "").trim();
            const normalizedEmail = String(formData.get("email") || "").trim().toLowerCase();
            const normalizedRole = String(formData.get("role_name") || "user").trim().toLowerCase();
            const password = String(formData.get("password") || "123456").trim();
            const status = String(formData.get("status") || "active").trim().toLowerCase();

            if (!fullName || !normalizedEmail.includes("@")) {
              showToast("Vui lòng nhập họ tên và email hợp lệ.", "warning");
              throw new Error("user-invalid");
            }

            const matchedRole = adminRolesData.find((item) => String(item.name || "").toLowerCase() === normalizedRole);
            if (!matchedRole) {
              showToast("Vai trò không tồn tại trong hệ thống.", "warning");
              throw new Error("user-role-invalid");
            }

            await apiPost("/admin/users", {
              full_name: fullName,
              email: normalizedEmail,
              password: password || "123456",
              role_id: Number(matchedRole.id),
              status
            });

            const rows = await apiGet("/admin/users", { limit: 100 });
            if (Array.isArray(rows)) db.users = rows.map(mapUserFromApi);
            refreshAdminRows();
            showToast("Đã tạo người dùng mới.", "success");
            if (page === "admin-users") {
              renderCurrentPage();
              initPageBehaviors();
            }
          }
        });
      }

      if (action === "admin-create-tour") {
        window.location.href = routes.adminTourCreate;
      }

      if (action === "admin-create-category") {
        openActionModal({
          title: "Tạo danh mục mới",
          body: `
            <div class="mb-3">
              <label class="form-label">Tên danh mục</label>
              <input name="name" class="form-control" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Mô tả</label>
              <textarea name="description" class="form-control" rows="3"></textarea>
            </div>
            <div>
              <label class="form-label">Trạng thái</label>
              <select name="status" class="form-select">
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm dừng</option>
              </select>
            </div>
          `,
          submitLabel: "Tạo danh mục",
          onSubmit: async (formData) => {
            const name = String(formData.get("name") || "").trim();
            const description = String(formData.get("description") || "").trim();
            const status = String(formData.get("status") || "active").trim().toLowerCase();

            if (!name) {
              showToast("Tên danh mục không được để trống.", "warning");
              throw new Error("category-invalid");
            }

            await apiPost("/admin/categories", { name, description, status });

            const rows = await apiGet("/admin/categories", { limit: 100 });
            if (Array.isArray(rows)) {
              db.categories = rows.map((item) => ({
                id: item.id,
                name: item.name,
                tours: normalizeNumber(item.total_tours || item.tours_count || 0),
                icon: "bi-compass",
                status: labelProviderStatus(item.status || "active")
              }));
            }
            refreshAdminRows();
            showToast("Đã tạo danh mục mới.", "success");
            if (page === "admin-categories") {
              renderCurrentPage();
              initPageBehaviors();
            }
          }
        });
      }

      if (action === "admin-create-post") {
        window.location.href = routes.adminPostCreate;
        return;
      }

      if (action === "admin-create-promotion") {
        window.location.href = routes.adminPromotionCreate;
      }

      if (action === "admin-post-edit") {
        const postId = Number(target.getAttribute("data-post-id") || 0);
        if (!postId) return;
        window.location.href = addQuery(routes.adminPostEdit, { id: postId });
        return;
      }

      if (action === "admin-promotion-edit") {
        const promotionId = Number(target.getAttribute("data-promotion-id") || 0);
        if (!promotionId) return;
        window.location.href = addQuery(routes.adminPromotionEdit, { id: promotionId });
      }

      if (action === "admin-user-edit") {
        const userId = Number(target.getAttribute("data-user-id") || 0);
        if (!userId) return;

        const user = db.users.find((item) => Number(item.id) === userId);
        if (!Array.isArray(adminRolesData) || adminRolesData.length === 0) {
          const roleRows = await apiGet("/admin/roles");
          if (Array.isArray(roleRows)) adminRolesData = roleRows;
        }
        const roleOptions = adminRolesData
          .map((item) => {
            const name = String(item.name || "").toLowerCase();
            const selected = name === String(user?.role || "user").toLowerCase() ? "selected" : "";
            return `<option value="${escapeHtml(name)}" ${selected}>${item.name}</option>`;
          })
          .join("");

        openActionModal({
          title: "Cập nhật người dùng",
          body: `
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Họ tên</label>
                <input name="full_name" class="form-control" value="${escapeHtml(user?.name || "")}" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Số điện thoại</label>
                <input name="phone" class="form-control" value="${escapeHtml(user?.phone || "")}" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Vai trò</label>
                <select name="role_name" class="form-select">${roleOptions}</select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Trạng thái</label>
                <input class="form-control" value="${escapeHtml(user?.status || "")}" disabled />
              </div>
            </div>
          `,
          submitLabel: "Cập nhật",
          onSubmit: async (formData) => {
            const nextName = String(formData.get("full_name") || "").trim();
            const nextPhone = String(formData.get("phone") || "").trim();
            const nextRole = String(formData.get("role_name") || "user").trim().toLowerCase();
            const matchedRole = adminRolesData.find((item) => String(item.name || "").toLowerCase() === nextRole);
            if (!nextName || !matchedRole) {
              showToast("Thông tin cập nhật người dùng không hợp lệ.", "warning");
              throw new Error("user-update-invalid");
            }

            await apiPut(`/admin/users/${userId}`, {
              full_name: nextName,
              phone: nextPhone,
              role_id: Number(matchedRole.id)
            });

            const rows = await apiGet("/admin/users", { limit: 100 });
            if (Array.isArray(rows)) db.users = rows.map(mapUserFromApi);
            refreshAdminRows();
            showToast("Đã cập nhật người dùng.", "success");
            if (page === "admin-users") {
              renderCurrentPage();
              initPageBehaviors();
            }
          }
        });
      }

      if (action === "admin-tour-edit") {
        const tourId = Number(target.getAttribute("data-tour-id") || 0);
        if (!tourId) return;
        window.location.href = addQuery(routes.adminTourEdit, { id: tourId });
      }

      if (action === "admin-tour-delete") {
        const tourId = Number(target.getAttribute("data-tour-id") || 0);
        if (!tourId) return;

        const tourName = target.getAttribute("data-tour-name") || "tour này";

        openConfirmModal({
          title: "Xóa tour",
          message: `Tour "${tourName}" sẽ bị xóa khỏi hệ thống. Bạn có chắc chắn muốn tiếp tục?`,
          submitLabel: "Xóa tour",
          onConfirm: async () => {
            await apiDelete(`/admin/tours/${tourId}`);
            db.tours = db.tours.filter((item) => Number(item.id) !== tourId);
            syncCategoriesFromTours();
            refreshAdminRows();
            showToast("Đã xóa tour.", "warning");

            if (page === "admin-tours") {
              renderCurrentPage();
              initPageBehaviors();
            }
          }
        });
      }

      if (action === "admin-post-delete") {
        const postId = Number(target.getAttribute("data-post-id") || 0);
        if (!postId) return;

        const postTitle = target.getAttribute("data-post-title") || "bài viết này";

        openConfirmModal({
          title: "Xóa bài viết",
          message: `Bài viết "${postTitle}" sẽ bị xóa vĩnh viễn khỏi hệ thống. Bạn vẫn muốn tiếp tục?`,
          submitLabel: "Xóa bài viết",
          onConfirm: async () => {
            await apiDelete(`/admin/posts/${postId}`);
            db.posts = db.posts.filter((item) => Number(item.id) !== postId);
            refreshAdminRows();
            showToast("Đã xóa bài viết.", "warning");

            if (page === "admin-posts") {
              renderCurrentPage();
              initPageBehaviors();
            }
          }
        });
      }

      if (action === "admin-promotion-delete") {
        const promotionId = Number(target.getAttribute("data-promotion-id") || 0);
        if (!promotionId) return;

        const promotionTitle = target.getAttribute("data-promotion-title") || "khuyến mãi này";

        openConfirmModal({
          title: "Xóa khuyến mãi",
          message: `Khuyến mãi "${promotionTitle}" sẽ bị gỡ khỏi hệ thống. Bạn có chắc chắn muốn xóa?`,
          submitLabel: "Xóa khuyến mãi",
          onConfirm: async () => {
            await apiDelete(`/admin/promotions/${promotionId}`);
            db.promotions = db.promotions.filter((item) => Number(item.id) !== promotionId);
            refreshAdminRows();
            showToast("Đã xóa khuyến mãi.", "warning");

            if (page === "admin-promotions") {
              renderCurrentPage();
              initPageBehaviors();
            }
          }
        });
      }

      if (action === "admin-category-edit") {
        const categoryId = Number(target.getAttribute("data-category-id") || 0);
        if (!categoryId) return;

        const category = db.categories.find((item) => Number(item.id) === categoryId);
        openActionModal({
          title: "Cập nhật danh mục",
          body: `
            <div class="mb-3">
              <label class="form-label">Tên danh mục</label>
              <input name="name" class="form-control" value="${escapeHtml(category?.name || "")}" required />
            </div>
            <div>
              <label class="form-label">Trạng thái</label>
              <select name="status" class="form-select">
                <option value="active" ${String(category?.status || "").toLowerCase().includes("đang") ? "selected" : ""}>Đang hoạt động</option>
                <option value="inactive" ${String(category?.status || "").toLowerCase().includes("tạm") ? "selected" : ""}>Tạm dừng</option>
              </select>
            </div>
          `,
          submitLabel: "Cập nhật",
          onSubmit: async (formData) => {
            const nextName = String(formData.get("name") || "").trim();
            const nextStatus = String(formData.get("status") || "active").trim().toLowerCase();
            if (!nextName) {
              showToast("Tên danh mục không được để trống.", "warning");
              throw new Error("category-update-invalid");
            }

            await apiPut(`/admin/categories/${categoryId}`, {
              name: nextName,
              status: nextStatus
            });

            const rows = await apiGet("/admin/categories", { limit: 100 });
            if (Array.isArray(rows)) {
              db.categories = rows.map((item) => ({
                id: item.id,
                name: item.name,
                tours: normalizeNumber(item.total_tours || item.tours_count || 0),
                icon: "bi-compass",
                status: labelProviderStatus(item.status || "active")
              }));
            }
            refreshAdminRows();
            showToast("Đã cập nhật danh mục.", "success");
            if (page === "admin-categories") {
              renderCurrentPage();
              initPageBehaviors();
            }
          }
        });
      }

      if (action === "admin-user-toggle-lock") {
        const userId = Number(target.getAttribute("data-user-id") || 0);
        if (!userId) return;

        const user = db.users.find((item) => Number(item.id) === userId);
        const nextStatus = user?.status === "Khóa" ? "active" : "blocked";

        try {
          await apiPut(`/admin/users/${userId}`, { status: nextStatus });
          if (user) user.status = labelUserStatus(nextStatus);
          refreshAdminRows();
          showToast(nextStatus === "blocked" ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản.", nextStatus === "blocked" ? "warning" : "success");
          if (page === "admin-users") {
            renderCurrentPage();
            initPageBehaviors();
          }
        } catch (error) {
          showToast(error?.message || "Không thể cập nhật trạng thái user.", "danger");
        }
      }

      if (action === "admin-tour-toggle-status") {
        const tourId = Number(target.getAttribute("data-tour-id") || 0);
        const currentStatus = String(target.getAttribute("data-tour-status") || "").toLowerCase();
        if (!tourId) return;

        const nextStatus = currentStatus === "active" ? "inactive" : "active";

        try {
          await apiPut(`/admin/tours/${tourId}`, { status: nextStatus });
          const tour = db.tours.find((item) => Number(item.id) === tourId);
          if (tour) tour.status = nextStatus;
          refreshAdminRows();
          showToast(nextStatus === "active" ? "Đã kích hoạt tour." : "Đã ẩn tour.", nextStatus === "active" ? "success" : "warning");
          if (page === "admin-tours") {
            renderCurrentPage();
            initPageBehaviors();
          }
        } catch (error) {
          showToast(error?.message || "Không thể cập nhật trạng thái tour.", "danger");
        }
      }

      if (action === "admin-category-delete") {
        const categoryId = Number(target.getAttribute("data-category-id") || 0);
        if (!categoryId) return;
        openConfirmModal({
          title: "Xóa danh mục",
          message: "Danh mục này sẽ bị xóa nếu không còn ràng buộc tour. Bạn có muốn tiếp tục?",
          submitLabel: "Xóa danh mục",
          onConfirm: async () => {
            await apiDelete(`/admin/categories/${categoryId}`);
            db.categories = db.categories.filter((item) => Number(item.id) !== categoryId);
            refreshAdminRows();
            showToast("Đã xóa danh mục.", "warning");
            if (page === "admin-categories") {
              renderCurrentPage();
              initPageBehaviors();
            }
          }
        });
      }

      if (action === "admin-booking-cancel") {
        const bookingId = Number(target.getAttribute("data-booking-id") || 0);
        if (!bookingId) return;

        try {
          await apiPut(`/admin/bookings/${bookingId}`, { booking_status: "cancelled" });
          const booking = db.bookings.find((item) => Number(item.id) === bookingId);
          if (booking) booking.status = "Đã hủy";
          refreshDerivedCollections();
          refreshAdminRows();
          showToast("Đã cập nhật booking sang trạng thái hủy.", "warning");
          if (page === "admin-bookings") {
            renderCurrentPage();
            initPageBehaviors();
          }
        } catch (error) {
          showToast(error?.message || "Không thể cập nhật booking.", "danger");
        }
      }

      if (action === "admin-payment-mark-failed") {
        const paymentId = Number(target.getAttribute("data-payment-id") || 0);
        if (!paymentId) return;

        try {
          await apiPut(`/admin/payments/${paymentId}`, { payment_status: "failed" });
          const payment = payments.find((item) => Number(item.id) === paymentId);
          if (payment) payment.status = "Thất bại";
          refreshAdminRows();
          showToast("Đã đánh dấu giao dịch cần rà soát.", "warning");
          if (page === "admin-payments") {
            renderCurrentPage();
            initPageBehaviors();
          }
        } catch (error) {
          showToast(error?.message || "Không thể cập nhật giao dịch.", "danger");
        }
      }

      if (action === "admin-post-toggle-status") {
        const postId = Number(target.getAttribute("data-post-id") || 0);
        if (!postId) return;

        const currentStatus = String(target.getAttribute("data-post-status") || "Công khai").toLowerCase();
        const nextStatus = currentStatus.includes("ẩn") || currentStatus === "archived" ? "published" : "archived";

        try {
          await apiPut(`/admin/posts/${postId}`, { status: nextStatus });

          const post = db.posts.find((item) => Number(item.id) === postId);
          if (post) post.status = labelPostStatus(nextStatus);

          refreshAdminRows();
          showToast(nextStatus === "published" ? "Đã chuyển bài viết sang công khai." : "Đã chuyển bài viết sang lưu trữ.", nextStatus === "published" ? "success" : "warning");

          if (page === "admin-posts") {
            renderCurrentPage();
            initPageBehaviors();
          }
        } catch (error) {
          showToast(error?.message || "Không thể cập nhật bài viết.", "danger");
        }
      }

      if (action === "admin-promotion-toggle-status") {
        const promotionId = Number(target.getAttribute("data-promotion-id") || 0);
        const currentStatus = String(target.getAttribute("data-promotion-status") || "");
        if (!promotionId) return;

        const nextStatus = currentStatus.includes("Đang hoạt động") ? "inactive" : "active";

        try {
          await apiPut(`/admin/promotions/${promotionId}`, { status: nextStatus });
          const promo = db.promotions.find((item) => Number(item.id) === promotionId);
          if (promo) promo.status = labelProviderStatus(nextStatus);
          refreshAdminRows();
          showToast(nextStatus === "active" ? "Đã kích hoạt khuyến mãi." : "Đã tạm dừng khuyến mãi.", "warning");
          if (page === "admin-promotions") {
            renderCurrentPage();
            initPageBehaviors();
          }
        } catch (error) {
          showToast(error?.message || "Không thể cập nhật khuyến mãi.", "danger");
        }
      }

      if (action === "admin-provider-approve" || action === "admin-provider-reject") {
        const providerRequestId = Number(target.getAttribute("data-provider-request-id") || 0);
        const providerId = Number(target.getAttribute("data-provider-id") || 0);
        const isApprove = action === "admin-provider-approve";
        const endpoint = isApprove ? "approve" : "reject";

        const title = isApprove ? "Duyệt yêu cầu provider" : "Từ chối yêu cầu provider";
        const submitLabel = isApprove ? "Duyệt hồ sơ" : "Từ chối hồ sơ";
        const placeholder = isApprove
          ? "Nhập ghi chú duyệt nội bộ hoặc phản hồi gửi nhà cung cấp..."
          : "Nhập lý do từ chối để người dùng dễ điều chỉnh hồ sơ...";

        openActionModal({
          title,
          submitLabel,
          submitClass: isApprove ? "btn-primary" : "btn-danger",
          body: `
            <div>
              <label class="form-label">Ghi chú quản trị</label>
              <textarea name="admin_note" class="form-control" rows="4" placeholder="${escapeHtml(placeholder)}"></textarea>
            </div>
          `,
          onSubmit: async (formData) => {
            const adminNote = String(formData.get("admin_note") || "").trim();

            if (providerRequestId > 0) {
              const updated = await apiPut(`/admin/provider-requests/${providerRequestId}/${endpoint}`, { admin_note: adminNote });
              adminProviderRequestsData = adminProviderRequestsData.map((item) =>
                Number(item.id) === providerRequestId
                  ? { ...item, ...updated, status: updated?.status || (isApprove ? "approved" : "rejected"), admin_note: adminNote || item.admin_note }
                  : item
              );
            } else if (providerId > 0) {
              const updated = await apiPut(`/admin/providers/${providerId}/${endpoint}`, { admin_note: adminNote });
              const provider = db.providers.find((item) => Number(item.id) === providerId);
              if (provider) {
                provider.status = labelProviderStatus(updated?.status || (isApprove ? "active" : "rejected"));
              }
            } else {
              showToast("Không xác định được hồ sơ provider cần xử lý.", "warning");
              throw new Error("provider-request-missing");
            }

            try {
              const providerRows = await apiGet("/admin/providers", { limit: 100 });
              if (Array.isArray(providerRows)) db.providers = providerRows.map(mapProviderFromApi);
              const requestRows = await apiGet("/admin/provider-requests", { limit: 100 });
              if (Array.isArray(requestRows)) adminProviderRequestsData = requestRows;
            } catch (_refreshError) {
              // Giữ dữ liệu local nếu reload danh sách thất bại.
            }

            refreshAdminRows();
            showToast(isApprove ? "Đã duyệt yêu cầu provider." : "Đã từ chối yêu cầu provider.", isApprove ? "success" : "warning");
            if (page === "admin-providers" || page === "admin-dashboard") {
              renderCurrentPage();
              initPageBehaviors();
            }
          }
        });
      }

      if (action === "admin-comment-hide" || action === "admin-comment-delete") {
        const commentId = Number(target.getAttribute("data-comment-id") || 0);
        if (!commentId) return;
        openConfirmModal({
          title: action === "admin-comment-hide" ? "Ẩn bình luận" : "Xóa bình luận",
          message: action === "admin-comment-hide"
            ? "Bình luận này sẽ bị ẩn khỏi giao diện công khai. Bạn muốn tiếp tục?"
            : "Bình luận này sẽ bị xóa khỏi hệ thống. Bạn có chắc chắn muốn tiếp tục?",
          submitLabel: action === "admin-comment-hide" ? "Ẩn bình luận" : "Xóa bình luận",
          onConfirm: async () => {
            if (action === "admin-comment-hide") {
              await apiPut(`/admin/comments/${commentId}/hide`, {});
              const comment = db.comments.find((item) => Number(item.id) === commentId);
              if (comment) comment.status = "Đã ẩn";
            } else {
              await apiDelete(`/admin/comments/${commentId}`);
              db.comments = db.comments.filter((item) => Number(item.id) !== commentId);
            }

            refreshAdminRows();
            showToast(action === "admin-comment-hide" ? "Đã ẩn bình luận." : "Đã xóa bình luận.", "warning");
            if (page === "admin-comments") {
              renderCurrentPage();
              initPageBehaviors();
            }
          }
        });
      }

      if (action === "print-invoice") window.print();

      if (action === "download-invoice") {
        const bookingCode = target.getAttribute("data-booking-code") || "";
        const invoiceId = Number(target.getAttribute("data-invoice-id") || 0);
        const booking = db.bookings.find((item) => String(item.code) === String(bookingCode))
          || getUserBookings().find((item) => String(item.code) === String(bookingCode));

        await downloadInvoicePdf(booking || { code: bookingCode || `BK${invoiceId}`, invoiceId });
      }

      if (action === "copy-promo-code") {
        const code = target.getAttribute("data-code");
        if (!code) return;
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(code).then(() => {
            showToast(`Đã sao chép mã ${code}`);
          }).catch(() => {
            showToast(`Mã ưu đãi: ${code}`, "info");
          });
        } else {
          showToast(`Mã ưu đãi: ${code}`, "info");
        }
      }

      if (action === "logout") {
        event.preventDefault();
        const logoutRole = getCurrentRole();
        try {
          await logoutWithApi();
        } catch (_error) {
          // Bỏ qua lỗi API logout.
        }
        showToast("Bạn đã đăng xuất.", "info");
        const redirectAfterLogout = ["admin", "provider"].includes(logoutRole) ? routes.login : routes.home;
        setTimeout(() => {
          window.location.href = redirectAfterLogout;
        }, 250);
      }
    });
  };
  function initPageBehaviors() {
    initFooterYear();
    initPasswordToggles();
    initFormValidation();
    initSmartTables();
    initCharts();
    initPremiumPolish();
    if (page === "home") initHomePage();
    if (page === "tours") initToursPage();
    if (page === "tour-detail") initTourDetailPage();
    if (["login", "register", "forgot-password"].includes(page)) initAuthPages();
    if (page === "profile") initProfilePage();
    if (page === "profile-edit") initProfileEditPage();
    if (page === "booking") initBookingPage();
    if (page === "payment") initPaymentPage();
    if (page === "booking-history") initBookingHistoryPage();
    if (page === "invoice") initInvoicePage();
    if (page === "contact") initContactPage();
    if (page === "provider-profile") initProviderProfilePage();
    if (["provider-tour-form", "provider-tour-edit"].includes(page)) initProviderTourFormPage();
    if (page === "provider-services") initProviderServicesPage();
    if (["provider-promotion-create", "provider-promotion-edit"].includes(page)) initProviderPromotionFormPage();
    if (page === "provider-feedback") initProviderFeedbackPage();
    if (page === "provider-bookings") initProviderBookingsPage();
    if (page === "admin-roles") initAdminRolesPage();
    if (["admin-tour-create", "admin-tour-edit"].includes(page)) initAdminTourFormPage();
    if (["admin-post-create", "admin-post-edit"].includes(page)) initAdminPostFormPage();
    if (["admin-promotion-create", "admin-promotion-edit"].includes(page)) initAdminPromotionFormPage();
  }

  const mountPage = () => {
    renderCurrentPage();
    initPageBehaviors();
  };

  initDelegatedActions();

  hydrateFromApi()
    .catch((error) => {
      console.error("[hydrate] unexpected error", error);
      const message = error?.message || "Không thể đồng bộ dữ liệu từ API.";
      showToast(message, "warning");
    })
    .finally(() => {
      mountPage();
    });
}























































































