
(() => {
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
    providerBookings: path("pages/provider-bookings.html"),
    providerBookingDetail: path("pages/provider-booking-detail.html"),
    providerServices: path("pages/provider-services.html"),
    providerPromotions: path("pages/provider-promotions.html"),
    providerFeedback: path("pages/provider-feedback.html"),
    adminDashboard: path("pages/admin-dashboard.html"),
    adminUsers: path("pages/admin-users.html"),
    adminRoles: path("pages/admin-roles.html"),
    adminTours: path("pages/admin-tours.html"),
    adminCategories: path("pages/admin-categories.html"),
    adminBookings: path("pages/admin-bookings.html"),
    adminPayments: path("pages/admin-payments.html"),
    adminInvoices: path("pages/admin-invoices.html"),
    adminPosts: path("pages/admin-posts.html"),
    adminPromotions: path("pages/admin-promotions.html"),
    adminProviders: path("pages/admin-providers.html"),
    adminComments: path("pages/admin-comments.html"),
    adminStats: path("pages/admin-stats.html")
  };

  const LS_KEYS = {
    wishlist: "vh_wishlist",
    profile: "vh_profile",
    bookingDraft: "vh_booking_draft",
    recentFilters: "vh_recent_filters",
    orders: "vh_orders",
    cancelled: "vh_cancelled_codes"
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

  const payments = db.bookings.map((booking, idx) => ({
    id: `PAY${String(idx + 1).padStart(4, "0")}`,
    bookingCode: booking.code,
    userId: booking.userId,
    method: idx % 2 === 0 ? "Thẻ ngân hàng" : "Ví điện tử",
    amount: booking.amount,
    status: booking.paymentStatus === "Đã thanh toán" ? "Thành công" : booking.paymentStatus,
    paidAt: booking.bookingDate
  }));

  const invoices = db.bookings.map((booking, idx) => ({
    id: `INV${String(idx + 1).padStart(5, "0")}`,
    bookingCode: booking.code,
    amount: booking.amount,
    status: booking.paymentStatus,
    issuedAt: booking.bookingDate,
    userId: booking.userId
  }));

  const currentUserId = "u01";
  const currentUser = db.users.find((u) => u.id === currentUserId);

  const defaultProfile = {
    name: currentUser?.name || "Nguyễn Văn An",
    email: currentUser?.email || "an.nguyen@gmail.com",
    phone: currentUser?.phone || "0908 112 223",
    city: currentUser?.city || "TP. Hồ Chí Minh",
    address: "123 Nguyễn Huệ, Quận 1",
    birthday: "1995-06-18",
    bio: "Yêu du lịch tự túc, thích khám phá văn hóa và ẩm thực bản địa."
  };

  const profileState = { ...defaultProfile, ...readLS(LS_KEYS.profile, {}) };
  const wishlist = new Set(readLS(LS_KEYS.wishlist, [1, 2, 5]));
  const cancelledCodes = new Set(readLS(LS_KEYS.cancelled, []));

  const getProviderById = (id) => db.providers.find((provider) => provider.id === id);
  const getTourById = (id) => db.tours.find((tour) => String(tour.id) === String(id));
  const getPromotionByCode = (code) => db.promotions.find((promo) => promo.code === code);
  const addQuery = (url, query) => `${url}?${new URLSearchParams(query).toString()}`;

  const getAllOrders = () => {
    const saved = readLS(LS_KEYS.orders, []);
    return Array.isArray(saved) ? saved : [];
  };

  const getUserBookings = () => {
    const baseBookings = db.bookings.filter((booking) => booking.userId === currentUserId);
    const extraOrders = getAllOrders().filter((booking) => booking.userId === currentUserId);
    return [...extraOrders, ...baseBookings].map((booking) => {
      if (cancelledCodes.has(booking.code)) {
        return { ...booking, status: "Đã hủy", paymentStatus: booking.paymentStatus === "Đã thanh toán" ? "Đã thanh toán" : "Thất bại" };
      }
      return booking;
    });
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
              <li class="nav-item"><a class="nav-link nav-link-main" href="${addQuery(routes.tours, { promo: 1 })}">Khuyến mãi</a></li>
              <li class="nav-item"><a class="nav-link nav-link-main ${active === "posts" || active === "post-detail" ? "active" : ""}" href="${routes.posts}">Bài viết</a></li>
              <li class="nav-item"><a class="nav-link nav-link-main ${active === "contact" ? "active" : ""}" href="${routes.contact}">Liên hệ</a></li>
            </ul>
            <div class="d-flex flex-wrap gap-2 mt-3 mt-lg-0">
              <a class="btn btn-outline-primary" href="${routes.login}">Đăng nhập</a>
              <a class="btn btn-primary" href="${routes.register}">Đăng ký</a>
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
            <div class="d-flex align-items-center gap-2"><button class="btn btn-outline-primary"><i class="bi bi-bell"></i></button><a href="${routes.providerProfile}" class="btn btn-light border">Sunrise Destination</a></div>
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
            <div class="d-flex align-items-center gap-2"><button class="btn btn-light border"><i class="bi bi-download me-1"></i>Export</button><button class="btn btn-outline-primary"><i class="bi bi-bell"></i></button><button class="btn btn-light border">Admin <i class="bi bi-chevron-down ms-1"></i></button></div>
          </div>
          <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2"><div><h3 class="mb-1">${title}</h3><p class="text-muted mb-0">${subtitle}</p></div><div><button class="btn btn-primary"><i class="bi bi-plus-lg me-1"></i>Thêm mới</button></div></div>
          ${content}
        </main>
      </div>
    `;
  };

  const renderSmartTable = ({ title, subtitle, addLabel = "", addHref = "#", filters = [], headers = [], rows = [], pageSize = 8 }) => {
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
            ${addLabel ? `<a href="${addHref}" class="btn btn-primary">${addLabel}</a>` : ""}
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
            <div class="row g-4 align-items-center mb-4"><div class="col-lg-7"><h2 class="section-title">Ưu đãi khuyến mãi theo mùa</h2><p class="section-subtitle mb-0">Áp dụng linh hoạt cho nhóm bạn và gia đình, cập nhật liên tục trên từng tour.</p></div><div class="col-lg-5 text-lg-end"><a href="${addQuery(routes.tours, { promo: 1 })}" class="btn btn-warning-soft">Xem toàn bộ khuyến mãi</a></div></div>
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

    return publicLayout(
      "tours",
      `
      <main class="section-block pt-4">
        <div class="container">
          <section class="page-banner mb-4" style="--banner-image:url('https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=1600&q=80');"><div class="page-banner-content"><nav aria-label="breadcrumb"><ol class="breadcrumb mb-2"><li class="breadcrumb-item"><a href="${routes.home}" class="text-white-50">Trang chủ</a></li><li class="breadcrumb-item active text-white" aria-current="page">Danh sách tour</li></ol></nav><h2 class="mb-2">Khám phá tour phù hợp phong cách của bạn</h2><p class="mb-0 text-white-50">Lọc theo điểm đến, ngân sách, loại tour và thời lượng chỉ trong vài giây.</p></div></section>

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

  const renderTourDetailPage = () => {
    const params = new URLSearchParams(window.location.search);
    const tour = getTourById(params.get("id")) || db.tours[0];
    const provider = getProviderById(tour.providerId);
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
            <div class="tab-pane fade" id="tabReview">${comments.length ? comments.map((comment) => `<article class="border rounded-4 p-3 mb-3"><div class="d-flex justify-content-between align-items-center mb-1"><strong>${comment.user}</strong>${starHTML(comment.rating)}</div><small class="text-muted d-block mb-2">${dateVN(comment.date)}</small><p class="mb-0">${comment.text}</p></article>`).join("") : '<div class="empty-state">Chưa có đánh giá cho tour này.</div>'}</div>
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

        <div class="panel-card p-3 p-lg-4 mb-4"><h6 class="mb-2">Nhà cung cấp</h6><h5>${provider?.name || "Viet Horizon Partner"}</h5><p class="text-muted mb-2">${provider?.city || "Việt Nam"} • ${provider?.email || "support@viethorizon.vn"}</p><div class="d-flex justify-content-between"><span>Đánh giá NCC</span><strong>${provider?.rating || 4.7}/5</strong></div></div>
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
    formHtml: `<h3 class="mb-3">Đăng nhập</h3><form id="loginForm" class="needs-validation" novalidate><div class="mb-3"><label class="form-label">Email</label><input type="email" class="form-control" required placeholder="you@email.com" /><div class="invalid-feedback">Vui lòng nhập email hợp lệ.</div></div><div class="mb-3"><label class="form-label">Mật khẩu</label><div class="input-group"><input type="password" class="form-control" required minlength="6" data-password-input /><button class="btn btn-outline-primary" type="button" data-toggle-password><i class="bi bi-eye"></i></button></div></div><div class="d-flex justify-content-between align-items-center mb-3"><label class="form-check-label"><input type="checkbox" class="form-check-input me-1" />Ghi nhớ đăng nhập</label><a href="${routes.forgotPassword}" class="text-primary fw-bold">Quên mật khẩu?</a></div><button class="btn btn-primary w-100">Đăng nhập</button><div class="text-center my-3 text-muted">hoặc tiếp tục với</div><div class="d-flex gap-2"><button class="btn btn-outline-primary w-50" type="button"><i class="bi bi-google me-1"></i>Google</button><button class="btn btn-outline-primary w-50" type="button"><i class="bi bi-facebook me-1"></i>Facebook</button></div></form>`,
    helper: `Chưa có tài khoản? <a class="fw-bold text-primary" href="${routes.register}">Đăng ký ngay</a>.`
  });

  const renderRegisterPage = () => authLayout({
    title: "Bắt đầu hành trình cùng Viet Horizon",
    subtitle: "Tạo tài khoản miễn phí để đặt tour nhanh hơn và lưu lịch sử giao dịch an toàn.",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80",
    formHtml: `<h3 class="mb-3">Đăng ký tài khoản</h3><form id="registerForm" class="needs-validation" novalidate><div class="row g-3"><div class="col-md-6"><label class="form-label">Họ và tên</label><input class="form-control" required placeholder="Nguyễn Văn A" /></div><div class="col-md-6"><label class="form-label">Số điện thoại</label><input class="form-control" required pattern="[0-9]{9,11}" placeholder="0909123456" /></div><div class="col-12"><label class="form-label">Email</label><input type="email" class="form-control" required placeholder="you@email.com" /></div><div class="col-md-6"><label class="form-label">Mật khẩu</label><div class="input-group"><input type="password" class="form-control" required minlength="6" data-password-input /><button class="btn btn-outline-primary" type="button" data-toggle-password><i class="bi bi-eye"></i></button></div></div><div class="col-md-6"><label class="form-label">Xác nhận mật khẩu</label><input type="password" class="form-control" required minlength="6" /></div></div><label class="form-check-label mt-3 mb-3 d-block"><input class="form-check-input me-1" type="checkbox" required />Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật.</label><button class="btn btn-primary w-100">Tạo tài khoản</button></form>`,
    helper: `Đã có tài khoản? <a class="fw-bold text-primary" href="${routes.login}">Đăng nhập</a>.`
  });

  const renderForgotPasswordPage = () => authLayout({
    title: "Khôi phục mật khẩu an toàn",
    subtitle: "Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu trong vài phút.",
    image: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?auto=format&fit=crop&w=1600&q=80",
    formHtml: `<h3 class="mb-3">Quên mật khẩu</h3><form id="forgotForm" class="needs-validation" novalidate><div class="mb-3"><label class="form-label">Email tài khoản</label><input type="email" class="form-control" required placeholder="you@email.com" /></div><button class="btn btn-primary w-100">Gửi liên kết đặt lại</button></form>`,
    helper: `Nhớ mật khẩu rồi? <a class="fw-bold text-primary" href="${routes.login}">Quay lại đăng nhập</a>.`
  });
  const renderProfilePage = () => {
    const userBookings = getUserBookings();
    const favTours = db.tours.filter((tour) => wishlist.has(tour.id)).slice(0, 3);

    return publicLayout(
      "profile",
      `
      <main class="section-block pt-4"><div class="container"><div class="row g-4">
        <div class="col-lg-3"><aside class="account-card p-3"><div class="text-center mb-3"><img src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80" alt="avatar" class="rounded-circle mx-auto mb-2" style="width: 86px; height: 86px; object-fit: cover;" /><h6 class="mb-1">${profileState.name}</h6><small class="text-muted">Khách hàng hạng Vàng</small></div><nav class="d-flex flex-column gap-1"><a class="account-sidebar-link active" href="#profileInfo"><i class="bi bi-person"></i>Thông tin cá nhân</a><a class="account-sidebar-link" href="${routes.bookingHistory}"><i class="bi bi-journal-check"></i>Đơn đặt tour</a><a class="account-sidebar-link" href="${routes.wishlist}"><i class="bi bi-heart"></i>Tour yêu thích</a><a class="account-sidebar-link" href="${routes.profileEdit}"><i class="bi bi-pencil-square"></i>Cập nhật hồ sơ</a></nav></aside></div>
        <div class="col-lg-9">
          <div class="account-card p-3 p-lg-4 mb-4" id="profileInfo"><div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><h4 class="mb-0">Thông tin cá nhân</h4><a href="${routes.profileEdit}" class="btn btn-outline-primary">Chỉnh sửa</a></div><div class="row g-3"><div class="col-md-6"><label class="form-label">Họ tên</label><input class="form-control" value="${profileState.name}" disabled /></div><div class="col-md-6"><label class="form-label">Ngày sinh</label><input class="form-control" value="${profileState.birthday}" disabled /></div><div class="col-md-6"><label class="form-label">Email</label><input class="form-control" value="${profileState.email}" disabled /></div><div class="col-md-6"><label class="form-label">Điện thoại</label><input class="form-control" value="${profileState.phone}" disabled /></div><div class="col-md-6"><label class="form-label">Thành phố</label><input class="form-control" value="${profileState.city}" disabled /></div><div class="col-md-6"><label class="form-label">Địa chỉ</label><input class="form-control" value="${profileState.address}" disabled /></div><div class="col-12"><label class="form-label">Giới thiệu</label><textarea class="form-control" rows="3" disabled>${profileState.bio}</textarea></div></div></div>

          <div class="account-card p-3 p-lg-4 mb-4"><h5 class="mb-3">Đơn đặt tour gần đây</h5><div class="table-responsive"><table class="table table-hover"><thead><tr><th>Mã đơn</th><th>Tour</th><th>Ngày đặt</th><th>Trạng thái</th><th>Tổng tiền</th><th></th></tr></thead><tbody>${userBookings.slice(0, 4).map((booking) => `<tr><td>${booking.code}</td><td>${getTourById(booking.tourId)?.name || "-"}</td><td>${dateVN(booking.bookingDate)}</td><td>${statusBadge(booking.status)}</td><td>${vnd(booking.amount)}</td><td><a href="${addQuery(routes.bookingDetail, { code: booking.code })}" class="btn btn-sm btn-outline-primary">Chi tiết</a></td></tr>`).join("")}</tbody></table></div></div>

          <div class="account-card p-3 p-lg-4"><h5 class="mb-3">Tour yêu thích</h5><div class="row g-3">${favTours.length ? favTours.map((tour) => `<div class="col-md-4"><article class="post-card h-100 p-2"><img src="${tour.image}" class="rounded-4 mb-2" style="height: 130px; width:100%; object-fit: cover;" alt="${tour.name}" /><strong class="d-block mb-2">${tour.name}</strong><a href="${addQuery(routes.tourDetail, { id: tour.id })}" class="btn btn-sm btn-primary w-100">Xem tour</a></article></div>`).join("") : '<div class="empty-state">Bạn chưa lưu tour yêu thích nào.</div>'}</div></div>
        </div>
      </div></div></main>
      `
    );
  };

  const renderProfileEditPage = () => publicLayout("profile", `
      <main class="section-block pt-4"><div class="container" style="max-width: 920px;"><div class="account-card p-3 p-lg-4"><div class="d-flex justify-content-between align-items-center mb-3"><h4 class="mb-0">Cập nhật hồ sơ cá nhân</h4><a href="${routes.profile}" class="btn btn-outline-primary">Quay lại hồ sơ</a></div><form id="profileEditForm" class="needs-validation" novalidate><div class="row g-3"><div class="col-md-6"><label class="form-label">Họ tên</label><input name="name" class="form-control" required value="${profileState.name}" /></div><div class="col-md-6"><label class="form-label">Ngày sinh</label><input name="birthday" type="date" class="form-control" value="${profileState.birthday}" /></div><div class="col-md-6"><label class="form-label">Email</label><input name="email" type="email" class="form-control" required value="${profileState.email}" /></div><div class="col-md-6"><label class="form-label">Số điện thoại</label><input name="phone" class="form-control" required value="${profileState.phone}" /></div><div class="col-md-6"><label class="form-label">Thành phố</label><input name="city" class="form-control" value="${profileState.city}" /></div><div class="col-md-6"><label class="form-label">Địa chỉ</label><input name="address" class="form-control" value="${profileState.address}" /></div><div class="col-12"><label class="form-label">Giới thiệu</label><textarea name="bio" class="form-control" rows="4">${profileState.bio}</textarea></div></div><div class="d-flex gap-2 mt-4"><button class="btn btn-primary">Lưu thay đổi</button><a href="${routes.profile}" class="btn btn-outline-primary">Hủy</a></div></form></div></div></main>
    `);

  const bookingStepper = (activeIndex) => {
    const labels = ["Chọn tour", "Điền thông tin", "Thanh toán", "Hoàn tất"];
    return `<div class="d-flex flex-wrap gap-3 mb-4">${labels.map((label, index) => {
      const state = index + 1 < activeIndex ? "done" : index + 1 === activeIndex ? "active" : "";
      return `<div class="progress-step ${state}"><span class="step-dot">${index + 1}</span><span>${label}</span></div>`;
    }).join("")}</div>`;
  };

  const calculateDiscount = (subTotal, couponCode) => {
    if (!couponCode) return 0;
    const coupon = getPromotionByCode(couponCode);
    if (!coupon || coupon.status !== "Đang hoạt động") return 0;
    if (coupon.type === "percent") return Math.round((subTotal * coupon.value) / 100);
    return coupon.value;
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
      <main class="section-block pt-4"><div class="container">${bookingStepper(3)}<div class="row g-4"><div class="col-lg-8"><div class="panel-card p-3 p-lg-4"><h5 class="mb-3">Phương thức thanh toán</h5><div class="d-flex flex-column gap-2 mb-4" id="paymentMethods"><label class="form-check border rounded-3 p-3"><input class="form-check-input me-2" type="radio" name="paymentMethod" value="Thẻ ngân hàng" checked />Thẻ ngân hàng (Visa/Master/JCB)</label><label class="form-check border rounded-3 p-3"><input class="form-check-input me-2" type="radio" name="paymentMethod" value="Ví điện tử" />Ví điện tử (Momo/ZaloPay)</label><label class="form-check border rounded-3 p-3"><input class="form-check-input me-2" type="radio" name="paymentMethod" value="Chuyển khoản" />Chuyển khoản ngân hàng</label></div><div class="panel-card p-3"><h6 class="mb-3">Thông tin thanh toán mô phỏng</h6><div class="row g-3"><div class="col-md-8"><label class="form-label">Số thẻ</label><input class="form-control" placeholder="**** **** **** 8899" /></div><div class="col-md-4"><label class="form-label">CVV</label><input class="form-control" placeholder="***" /></div><div class="col-md-6"><label class="form-label">Tên chủ thẻ</label><input class="form-control" placeholder="NGUYEN VAN AN" /></div><div class="col-md-6"><label class="form-label">Ngày hết hạn</label><input class="form-control" placeholder="MM/YY" /></div></div></div></div></div><div class="col-lg-4"><aside class="sticky-booking p-3 p-lg-4"><h6 class="mb-3">Đơn hàng của bạn</h6><p class="mb-2"><strong>Tour:</strong> ${tour.name}</p><p class="mb-2"><strong>Ngày đi:</strong> ${draft?.departureDate ? dateVN(draft.departureDate) : dateVN(tour.departureDates[0])}</p><p class="mb-2"><strong>Số khách:</strong> ${draft?.people || 2}</p><p class="mb-3"><strong>Mã giảm:</strong> ${draft?.coupon || "Không áp dụng"}</p><div class="invoice-meta p-3 mb-3"><div class="d-flex justify-content-between"><span>Tổng thanh toán</span><strong class="text-primary">${vnd(amount)}</strong></div></div><button id="confirmPaymentBtn" class="btn btn-warning-soft w-100">Xác nhận thanh toán</button></aside></div></div></div></main>
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
    const booking = [...getUserBookings(), ...db.bookings].find((item) => item.code === code) || getUserBookings()[0];
    const tour = getTourById(booking.tourId);

    return publicLayout("profile", `
      <main class="section-block pt-4"><div class="container" style="max-width: 1020px;"><div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><h3 class="mb-0">Chi tiết đơn đặt tour #${booking.code}</h3><div class="d-flex gap-2"><a href="${routes.bookingHistory}" class="btn btn-outline-primary">Quay lại lịch sử</a><a href="${addQuery(routes.invoice, { code: booking.code })}" class="btn btn-primary">Xem hóa đơn</a></div></div><div class="row g-4"><div class="col-lg-8"><div class="panel-card p-3 p-lg-4 mb-4"><h5 class="mb-3">Thông tin tour</h5><div class="d-flex gap-3 align-items-start"><img src="${tour?.image}" alt="${tour?.name}" style="width: 180px; height: 130px; object-fit: cover; border-radius: 0.8rem;" /><div><h5>${tour?.name || "-"}</h5><p class="text-muted mb-2">${tour?.location || "-"} • ${tour?.duration || "-"}N${tour?.nights || "-"}Đ</p><p class="mb-1"><strong>Ngày khởi hành:</strong> ${dateVN(booking.departureDate)}</p><p class="mb-0"><strong>Số lượng khách:</strong> ${booking.travelers}</p></div></div></div><div class="panel-card p-3 p-lg-4"><h5 class="mb-3">Tiến trình xử lý</h5><ul class="list-group list-group-flush"><li class="list-group-item d-flex justify-content-between"><span>Đơn được tạo</span><strong>${dateVN(booking.bookingDate)}</strong></li><li class="list-group-item d-flex justify-content-between"><span>Trạng thái booking</span>${statusBadge(booking.status)}</li><li class="list-group-item d-flex justify-content-between"><span>Trạng thái thanh toán</span>${statusBadge(booking.paymentStatus)}</li><li class="list-group-item d-flex justify-content-between"><span>Mã đơn</span><strong>${booking.code}</strong></li></ul></div></div><div class="col-lg-4"><div class="sticky-booking p-3 p-lg-4"><h6 class="mb-3">Thanh toán</h6><div class="invoice-meta p-3 mb-3"><div class="d-flex justify-content-between mb-1"><span>Tổng tiền</span><strong>${vnd(booking.amount)}</strong></div><div class="d-flex justify-content-between"><span>Trạng thái</span>${statusBadge(booking.paymentStatus)}</div></div><a href="${routes.contact}" class="btn btn-outline-primary w-100 mb-2">Yêu cầu hỗ trợ</a><a href="${addQuery(routes.invoice, { code: booking.code })}" class="btn btn-primary w-100">Tải hóa đơn</a></div></div></div></div></main>
    `);
  };

  const renderInvoicePage = () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const booking = [...getUserBookings(), ...db.bookings].find((item) => item.code === code) || getUserBookings()[0];
    const tour = getTourById(booking.tourId);
    const invoiceCode = `INV-${booking.code.slice(-6)}`;

    return publicLayout("profile", `
      <main class="section-block pt-4"><div class="container" style="max-width: 1000px;"><div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2"><h3 class="mb-0">Hóa đơn #${invoiceCode}</h3><div class="d-flex gap-2"><button class="btn btn-outline-primary" data-action="print-invoice"><i class="bi bi-printer me-1"></i>In hóa đơn</button><button class="btn btn-primary" data-action="download-invoice"><i class="bi bi-download me-1"></i>Tải PDF</button></div></div>
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
      <main class="section-block pt-4"><div class="container"><div class="row g-4"><div class="col-lg-5"><div class="contact-card p-3 p-lg-4 h-100"><h3 class="mb-3">Liên hệ & Hỗ trợ</h3><p class="text-muted">Đội ngũ Viet Horizon hỗ trợ đặt tour, thanh toán và xử lý phát sinh 24/7.</p><div class="d-flex flex-column gap-3 mt-4"><div><strong>Hotline:</strong> 1900 6886</div><div><strong>Email:</strong> support@viethorizon.vn</div><div><strong>Văn phòng:</strong> 25 Nguyễn Huệ, Quận 1, TP.HCM</div><div><strong>Thời gian:</strong> 08:00 - 22:00 (Thứ 2 - Chủ nhật)</div></div><div class="mt-4"><h6 class="mb-2">Kênh hỗ trợ nhanh</h6><div class="d-flex gap-2"><button class="btn btn-outline-primary"><i class="bi bi-whatsapp me-1"></i>WhatsApp</button><button class="btn btn-outline-primary"><i class="bi bi-messenger me-1"></i>Messenger</button></div></div></div></div><div class="col-lg-7"><div class="contact-card p-3 p-lg-4"><h4 class="mb-3">Gửi yêu cầu hỗ trợ</h4><form id="contactForm" class="needs-validation" novalidate><div class="row g-3"><div class="col-md-6"><label class="form-label">Họ tên</label><input class="form-control" required /></div><div class="col-md-6"><label class="form-label">Số điện thoại</label><input class="form-control" required /></div><div class="col-md-6"><label class="form-label">Email</label><input type="email" class="form-control" required /></div><div class="col-md-6"><label class="form-label">Loại hỗ trợ</label><select class="form-select"><option>Đặt tour</option><option>Thanh toán</option><option>Hủy/đổi lịch</option><option>Khác</option></select></div><div class="col-12"><label class="form-label">Nội dung</label><textarea class="form-control" rows="5" required placeholder="Mô tả chi tiết để đội ngũ xử lý nhanh hơn..."></textarea></div></div><button class="btn btn-primary mt-3">Gửi yêu cầu</button></form></div></div></div></div></main>
    `);

  const metricCards = (items) => `
    <div class="row g-3 mb-4">
      ${items.map((item) => `<div class="col-sm-6 col-xl-3"><div class="metric-card h-100"><div class="d-flex justify-content-between align-items-start"><div><div class="small text-muted mb-1">${item.label}</div><h4 class="mb-0">${item.value}</h4></div><span class="metric-icon ${item.color}"><i class="bi ${item.icon}"></i></span></div><small class="text-muted">${item.note}</small></div></div>`).join("")}
    </div>
  `;

  const renderProviderDashboard = () => {
    const providerTours = db.tours.filter((tour) => tour.providerId === "pv01");
    const providerBookings = db.bookings.filter((booking) => booking.providerId === "pv01");
    return providerShell("provider-dashboard", "Dashboard nhà cung cấp", "Theo dõi tour, booking và hiệu suất kinh doanh theo thời gian thực.", `
      ${metricCards([
        { label: "Tổng tour", value: providerTours.length, icon: "bi-map", color: "blue", note: "+3 tour mới tháng này" },
        { label: "Booking mới", value: providerBookings.filter((b) => b.status === "Chờ xác nhận").length, icon: "bi-journal-plus", color: "teal", note: "Cần xác nhận sớm" },
        { label: "Doanh thu", value: vnd(providerBookings.reduce((acc, item) => acc + item.amount, 0)), icon: "bi-cash-stack", color: "orange", note: "Tăng 12% so với tháng trước" },
        { label: "Tour đang mở", value: providerTours.filter((tour) => tour.departureDates.length > 0).length, icon: "bi-rocket", color: "red", note: "Tỷ lệ lấp đầy 78%" }
      ])}
      <div class="row g-4"><div class="col-xl-8"><div class="panel-card p-3 p-lg-4 h-100"><div class="d-flex justify-content-between align-items-center mb-3"><h5 class="mb-0">Booking theo tháng</h5><span class="badge-soft">2026</span></div><canvas id="providerBookingChart" height="130"></canvas></div></div><div class="col-xl-4"><div class="panel-card p-3 p-lg-4 h-100"><h5 class="mb-3">Thông báo cần xử lý</h5><ul class="list-group list-group-flush"><li class="list-group-item d-flex justify-content-between px-0">Booking chờ xác nhận <span class="badge-soft">3</span></li><li class="list-group-item d-flex justify-content-between px-0">Yêu cầu hoàn tiền <span class="badge-soft">1</span></li><li class="list-group-item d-flex justify-content-between px-0">Phản hồi chưa trả lời <span class="badge-soft">4</span></li><li class="list-group-item d-flex justify-content-between px-0">Mã giảm sắp hết hạn <span class="badge-soft">2</span></li></ul></div></div></div>
      <div class="row g-4 mt-1"><div class="col-xl-6"><div class="table-card"><h5 class="mb-3">Tour bán chạy</h5><div class="table-responsive"><table class="table"><thead><tr><th>Tour</th><th>Đặt chỗ</th><th>Đánh giá</th></tr></thead><tbody>${providerTours.sort((a, b) => b.booked - a.booked).slice(0, 4).map((tour) => `<tr><td>${tour.name}</td><td>${tour.booked}</td><td>${tour.rating}</td></tr>`).join("")}</tbody></table></div></div></div><div class="col-xl-6"><div class="table-card"><h5 class="mb-3">Booking gần đây</h5><div class="table-responsive"><table class="table"><thead><tr><th>Mã đơn</th><th>Ngày đặt</th><th>Trạng thái</th><th></th></tr></thead><tbody>${providerBookings.slice(0, 5).map((booking) => `<tr><td>${booking.code}</td><td>${dateVN(booking.bookingDate)}</td><td>${statusBadge(booking.status)}</td><td><a href="${addQuery(routes.providerBookingDetail, { code: booking.code })}" class="btn btn-sm btn-outline-primary">Xem</a></td></tr>`).join("")}</tbody></table></div></div></div></div>
    `);
  };
  const renderProviderProfile = () => {
    const provider = getProviderById("pv01");
    return providerShell("provider-profile", "Thông tin nhà cung cấp", "Cập nhật hồ sơ thương hiệu, chính sách và thông tin thanh toán.", `
      <div class="panel-card p-3 p-lg-4"><form id="providerProfileForm" class="row g-3 needs-validation" novalidate><div class="col-md-6"><label class="form-label">Tên nhà cung cấp</label><input class="form-control" required value="${provider?.name || "Sunrise Destination"}" /></div><div class="col-md-6"><label class="form-label">Mã nhà cung cấp</label><input class="form-control" value="${provider?.id || "pv01"}" disabled /></div><div class="col-md-6"><label class="form-label">Email liên hệ</label><input class="form-control" type="email" required value="${provider?.email || ""}" /></div><div class="col-md-6"><label class="form-label">Số điện thoại</label><input class="form-control" required value="${provider?.phone || ""}" /></div><div class="col-md-6"><label class="form-label">Thành phố</label><input class="form-control" value="${provider?.city || ""}" /></div><div class="col-md-6"><label class="form-label">Trạng thái</label><input class="form-control" value="${provider?.status || "Đang hoạt động"}" disabled /></div><div class="col-12"><label class="form-label">Mô tả thương hiệu</label><textarea class="form-control" rows="4">Đơn vị lữ hành chuyên tuyến miền Trung, tập trung trải nghiệm bản địa và dịch vụ 4-5 sao.</textarea></div><div class="col-12"><label class="form-label">Chính sách hỗ trợ khách</label><textarea class="form-control" rows="3">Hỗ trợ đổi lịch 1 lần miễn phí trước ngày khởi hành 7 ngày. CSKH phản hồi trong 30 phút.</textarea></div><div class="col-12 d-flex gap-2"><button class="btn btn-primary">Lưu thông tin</button><button type="button" class="btn btn-outline-primary">Xem preview hồ sơ</button></div></form></div>
    `);
  };

  const renderProviderTours = () => {
    const providerTours = db.tours.filter((tour) => tour.providerId === "pv01" || tour.providerId === "pv02");
    const rows = providerTours.map((tour) => ({
      search: `${tour.name} ${tour.location} ${tour.type}`,
      attrs: { status: "Đang hoạt động", location: tour.location },
      cells: [
        `<div class="d-flex gap-2 align-items-center"><img src="${tour.image}" style="width:58px;height:46px;border-radius:0.6rem;object-fit:cover;" alt="${tour.name}" /><div><strong>${tour.name}</strong><div class="small text-muted">${tour.location}</div></div></div>`,
        `${tour.duration}N${tour.nights}Đ`,
        vnd(tour.price),
        `${tour.booked}`,
        statusBadge("Đang hoạt động"),
        `<div class="table-actions d-flex gap-1"><a href="${addQuery(routes.providerTourEdit, { id: tour.id })}" class="btn btn-sm btn-outline-primary">Sửa</a><button class="btn btn-sm btn-outline-danger">Xóa</button></div>`
      ]
    }));

    return providerShell("provider-tours", "Danh sách tour của nhà cung cấp", "Quản lý tất cả tour đang mở bán, cập nhật giá và lịch trình.", renderSmartTable({
      title: "Tour đang quản lý",
      subtitle: "Sử dụng bộ lọc để tìm nhanh tour theo điểm đến hoặc trạng thái.",
      addLabel: "Thêm tour",
      addHref: routes.providerTourForm,
      filters: [{ field: "location", label: "Địa điểm", options: [...new Set(providerTours.map((tour) => tour.location))] }, { field: "status", label: "Trạng thái", options: ["Đang hoạt động", "Tạm dừng"] }],
      headers: ["Tour", "Thời lượng", "Giá", "Lượt đặt", "Trạng thái", "Hành động"],
      rows,
      pageSize: 6
    }));
  };

  const providerTourFormContent = (isEdit = false) => `
      <div class="panel-card p-3 p-lg-4"><h5 class="mb-3">${isEdit ? "Cập nhật tour" : "Thêm tour mới"}</h5><form id="providerTourForm" class="row g-3 needs-validation" novalidate><div class="col-12"><h6>1. Thông tin cơ bản</h6></div><div class="col-md-8"><label class="form-label">Tên tour</label><input class="form-control" required value="${isEdit ? "Đà Nẵng - Hội An 3N2Đ" : ""}" placeholder="Ví dụ: Phú Quốc nghỉ dưỡng 4N3Đ" /></div><div class="col-md-4"><label class="form-label">Loại tour</label><select class="form-select"><option>Nghỉ dưỡng</option><option>Khám phá</option><option>Gia đình</option></select></div><div class="col-md-4"><label class="form-label">Điểm khởi hành</label><input class="form-control" value="${isEdit ? "TP. Hồ Chí Minh" : ""}" /></div><div class="col-md-4"><label class="form-label">Điểm đến</label><input class="form-control" value="${isEdit ? "Đà Nẵng" : ""}" /></div><div class="col-md-4"><label class="form-label">Thời lượng</label><input class="form-control" value="${isEdit ? "3 ngày 2 đêm" : ""}" /></div><div class="col-12 mt-2"><h6>2. Lịch trình</h6></div><div class="col-12"><textarea class="form-control" rows="4" placeholder="Mỗi ngày một dòng..."></textarea></div><div class="col-12 mt-2"><h6>3. Giá & khuyến mãi</h6></div><div class="col-md-4"><label class="form-label">Giá bán</label><input class="form-control" value="${isEdit ? "4590000" : ""}" /></div><div class="col-md-4"><label class="form-label">Giá niêm yết</label><input class="form-control" value="${isEdit ? "5290000" : ""}" /></div><div class="col-md-4"><label class="form-label">Số chỗ tối đa</label><input class="form-control" value="30" /></div><div class="col-12 mt-2"><h6>4. Hình ảnh</h6></div><div class="col-12"><div class="invoice-meta p-3">Kéo thả ảnh vào đây hoặc bấm để tải lên (preview ảnh mock).</div><div class="row g-2 mt-2"><div class="col-4"><img src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80" class="rounded-3" alt="preview" /></div><div class="col-4"><img src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80" class="rounded-3" alt="preview" /></div><div class="col-4"><img src="https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=600&q=80" class="rounded-3" alt="preview" /></div></div></div><div class="col-12 mt-2"><h6>5. Dịch vụ bao gồm & chính sách</h6></div><div class="col-md-6"><textarea class="form-control" rows="4" placeholder="Liệt kê dịch vụ bao gồm"></textarea></div><div class="col-md-6"><textarea class="form-control" rows="4" placeholder="Chính sách đổi/hủy tour"></textarea></div><div class="col-12 d-flex gap-2 mt-3"><button class="btn btn-outline-primary" type="button">Lưu nháp</button><button class="btn btn-primary" type="submit">${isEdit ? "Cập nhật tour" : "Xuất bản tour"}</button></div></form></div>
  `;

  const renderProviderTourForm = () => providerShell("provider-tour-form", "Thêm tour mới", "Tạo mới tour với đầy đủ lịch trình, giá và hình ảnh.", providerTourFormContent(false));
  const renderProviderTourEdit = () => providerShell("provider-tour-form", "Sửa tour", "Điều chỉnh thông tin tour hiện có trước khi tái xuất bản.", providerTourFormContent(true));

  const renderProviderBookings = () => {
    const rows = db.bookings.filter((booking) => booking.providerId === "pv01" || booking.providerId === "pv02").map((booking) => ({
      search: `${booking.code} ${getTourById(booking.tourId)?.name || ""} ${db.users.find((item) => item.id === booking.userId)?.name || ""}`,
      attrs: { status: booking.status, payment: booking.paymentStatus },
      cells: [
        booking.code,
        db.users.find((item) => item.id === booking.userId)?.name || "Khách vãng lai",
        getTourById(booking.tourId)?.name || "-",
        dateVN(booking.bookingDate),
        statusBadge(booking.status),
        statusBadge(booking.paymentStatus),
        `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary" data-bs-toggle="offcanvas" data-bs-target="#providerBookingDrawer" data-booking-code="${booking.code}">Xem</button><button class="btn btn-sm btn-outline-success">Xác nhận</button><button class="btn btn-sm btn-outline-danger">Hủy</button></div>`
      ]
    }));

    return providerShell("provider-bookings", "Quản lý booking nhận được", "Xác nhận nhanh đơn mới, kiểm tra thanh toán và phản hồi khách.", `${renderSmartTable({ title: "Danh sách booking", subtitle: "Hệ thống tự động đồng bộ booking theo tour bạn đang mở bán.", filters: [{ field: "status", label: "Trạng thái", options: ["Đã xác nhận", "Chờ xác nhận", "Đã hủy", "Hoàn tất"] }, { field: "payment", label: "Thanh toán", options: ["Đã thanh toán", "Chưa thanh toán", "Thất bại"] }], headers: ["Mã đơn", "Khách hàng", "Tour", "Ngày đặt", "Trạng thái", "Thanh toán", "Hành động"], rows, pageSize: 7 })}<div class="offcanvas offcanvas-end" tabindex="-1" id="providerBookingDrawer"><div class="offcanvas-header"><h5 class="offcanvas-title">Chi tiết booking</h5><button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button></div><div class="offcanvas-body" id="providerBookingDrawerBody"><p class="text-muted">Chọn booking để xem thông tin chi tiết.</p></div></div>`);
  };

  const renderProviderBookingDetail = () => {
    const booking = db.bookings.find((item) => item.code === new URLSearchParams(window.location.search).get("code")) || db.bookings[0];
    const tour = getTourById(booking.tourId);
    const user = db.users.find((item) => item.id === booking.userId);
    return providerShell("provider-bookings", `Chi tiết booking ${booking.code}`, "Theo dõi toàn bộ thông tin khách, tour và trạng thái xử lý.", `
      <div class="row g-4"><div class="col-lg-8"><div class="panel-card p-3 p-lg-4 mb-4"><h5 class="mb-3">Thông tin khách hàng</h5><div class="row g-2"><div class="col-md-6"><div class="invoice-meta p-3"><div class="small text-muted">Họ tên</div><strong>${user?.name || "-"}</strong></div></div><div class="col-md-6"><div class="invoice-meta p-3"><div class="small text-muted">Email</div><strong>${user?.email || "-"}</strong></div></div><div class="col-md-6"><div class="invoice-meta p-3"><div class="small text-muted">Số điện thoại</div><strong>${user?.phone || "-"}</strong></div></div><div class="col-md-6"><div class="invoice-meta p-3"><div class="small text-muted">Ngày đặt</div><strong>${dateVN(booking.bookingDate)}</strong></div></div></div></div><div class="panel-card p-3 p-lg-4"><h5 class="mb-3">Thông tin tour</h5><p><strong>${tour?.name || "-"}</strong> • ${tour?.location || "-"}</p><p>Khởi hành: ${dateVN(booking.departureDate)} • Khách: ${booking.travelers}</p><p>Tổng tiền: <strong>${vnd(booking.amount)}</strong></p></div></div><div class="col-lg-4"><aside class="sticky-booking p-3 p-lg-4"><h6 class="mb-3">Trạng thái xử lý</h6><p class="mb-2">Booking: ${statusBadge(booking.status)}</p><p class="mb-3">Thanh toán: ${statusBadge(booking.paymentStatus)}</p><button class="btn btn-success w-100 mb-2">Xác nhận booking</button><button class="btn btn-outline-danger w-100 mb-2">Hủy booking</button><button class="btn btn-outline-primary w-100">Gửi phản hồi khách</button></aside></div></div>
    `);
  };

  const renderProviderServices = () => {
    const rows = db.services.map((service) => ({ search: `${service.name} ${service.type}`, attrs: { status: service.status, type: service.type }, cells: [service.name, service.type, vnd(service.price), statusBadge(service.status), `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary">Sửa</button><button class="btn btn-sm btn-outline-danger">Xóa</button></div>`] }));
    return providerShell("provider-services", "Quản lý dịch vụ đi kèm", "Thêm dịch vụ phụ trợ để tăng giá trị đơn hàng.", `
      <div class="panel-card p-3 p-lg-4 mb-4"><h5 class="mb-3">Thêm dịch vụ mới</h5><form class="row g-2"><div class="col-md-4"><input class="form-control" placeholder="Tên dịch vụ" /></div><div class="col-md-3"><select class="form-select"><option>Di chuyển</option><option>Lưu trú</option><option>Bảo hiểm</option></select></div><div class="col-md-3"><input class="form-control" placeholder="Giá" /></div><div class="col-md-2"><button class="btn btn-primary w-100" type="button">Thêm</button></div></form></div>
      ${renderSmartTable({ title: "Danh sách dịch vụ", subtitle: "Dịch vụ hiển thị tại bước đặt tour để khách lựa chọn thêm.", filters: [{ field: "status", label: "Trạng thái", options: ["Đang hoạt động", "Tạm dừng"] }, { field: "type", label: "Loại", options: ["Di chuyển", "Lưu trú", "Bảo hiểm"] }], headers: ["Dịch vụ", "Loại", "Giá", "Trạng thái", "Hành động"], rows, pageSize: 5 })}
    `);
  };

  const renderProviderPromotions = () => {
    const rows = db.promotions.map((promo) => ({ search: `${promo.code} ${promo.title}`, attrs: { status: promo.status }, cells: [promo.code, promo.title, promo.type === "percent" ? `${promo.value}%` : vnd(promo.value), `${dateVN(promo.start)} - ${dateVN(promo.end)}`, statusBadge(promo.status), `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary">Sửa</button><button class="btn btn-sm btn-outline-danger">Ngừng</button></div>`] }));
    return providerShell("provider-promotions", "Quản lý khuyến mãi", "Tạo mã giảm giá và theo dõi hiệu quả chuyển đổi booking.", `
      <div class="panel-card p-3 p-lg-4 mb-4"><h5 class="mb-3">Tạo mã giảm giá</h5><form class="row g-2"><div class="col-md-3"><input class="form-control" placeholder="Mã giảm giá" /></div><div class="col-md-3"><input class="form-control" placeholder="Tên chương trình" /></div><div class="col-md-2"><select class="form-select"><option>%</option><option>VNĐ</option></select></div><div class="col-md-2"><input class="form-control" placeholder="Giá trị" /></div><div class="col-md-2"><button class="btn btn-primary w-100" type="button">Tạo mã</button></div></form></div>
      ${renderSmartTable({ title: "Danh sách mã khuyến mãi", subtitle: "Theo dõi trạng thái active/inactive và thời gian hiệu lực.", filters: [{ field: "status", label: "Trạng thái", options: ["Đang hoạt động", "Tạm dừng"] }], headers: ["Mã", "Chương trình", "Giá trị", "Hiệu lực", "Trạng thái", "Hành động"], rows, pageSize: 5 })}
    `);
  };

  const renderProviderFeedback = () => {
    const rows = db.comments.map((comment) => ({ search: `${comment.user} ${comment.text}`, attrs: { status: comment.status }, cells: [comment.user, getTourById(comment.tourId)?.name || "-", `${starHTML(comment.rating)} (${comment.rating}/5)`, `<span class="text-muted">${comment.text}</span>`, statusBadge(comment.status), `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary">Phản hồi</button><button class="btn btn-sm btn-outline-danger">Ẩn</button></div>`] }));
    return providerShell("provider-feedback", "Phản hồi khách hàng", "Theo dõi và phản hồi đánh giá để cải thiện trải nghiệm tour.", `
      <div class="panel-card p-3 p-lg-4 mb-4"><h5 class="mb-3">Mẫu phản hồi nhanh</h5><textarea class="form-control" rows="3" placeholder="Cảm ơn anh/chị đã trải nghiệm, đội ngũ sẽ... "></textarea><button class="btn btn-primary mt-2">Lưu mẫu phản hồi</button></div>
      ${renderSmartTable({ title: "Danh sách đánh giá", subtitle: "Ưu tiên phản hồi đánh giá mới trong 24 giờ.", filters: [{ field: "status", label: "Trạng thái", options: ["Công khai", "Đang duyệt"] }], headers: ["Khách hàng", "Tour", "Đánh giá", "Nội dung", "Trạng thái", "Hành động"], rows, pageSize: 6 })}
    `);
  };
  const renderAdminDashboard = () => {
    const revenue = db.bookings.reduce((total, booking) => total + booking.amount, 0);
    return adminShell("admin-dashboard", "Admin Dashboard", "Tổng quan toàn hệ thống booking, thanh toán và hiệu suất nhà cung cấp.", `
      ${metricCards([
        { label: "Tổng người dùng", value: db.users.length, icon: "bi-people", color: "blue", note: "+6.2% tháng này" },
        { label: "Tổng provider", value: db.providers.length, icon: "bi-building", color: "teal", note: "2 provider chờ duyệt" },
        { label: "Tổng booking", value: db.bookings.length, icon: "bi-journal-check", color: "orange", note: "34 booking mới tuần này" },
        { label: "Doanh thu", value: vnd(revenue), icon: "bi-cash-stack", color: "red", note: "Tỷ lệ thanh toán thành công 93%" }
      ])}
      <div class="row g-4"><div class="col-xl-8"><div class="panel-card p-3 p-lg-4 h-100"><div class="d-flex justify-content-between align-items-center mb-3"><h5 class="mb-0">Doanh thu theo tháng</h5><span class="badge-soft">Năm 2026</span></div><canvas id="adminRevenueChart" height="130"></canvas></div></div><div class="col-xl-4"><div class="panel-card p-3 p-lg-4 h-100"><h5 class="mb-3">Cơ cấu loại tour</h5><canvas id="adminCategoryChart" height="180"></canvas></div></div></div>
      <div class="row g-4 mt-1"><div class="col-xl-6"><div class="table-card h-100"><h5 class="mb-3">Booking gần đây</h5><div class="table-responsive"><table class="table table-hover"><thead><tr><th>Mã đơn</th><th>Tour</th><th>Trạng thái</th><th>Tổng tiền</th></tr></thead><tbody>${db.bookings.slice(0, 6).map((booking) => `<tr><td>${booking.code}</td><td>${getTourById(booking.tourId)?.name || "-"}</td><td>${statusBadge(booking.status)}</td><td>${vnd(booking.amount)}</td></tr>`).join("")}</tbody></table></div></div></div><div class="col-xl-6"><div class="table-card h-100"><h5 class="mb-3">Provider chờ duyệt</h5><div class="table-responsive"><table class="table table-hover"><thead><tr><th>Provider</th><th>Thành phố</th><th>Ngày đăng ký</th><th></th></tr></thead><tbody>${db.providers.filter((provider) => provider.status === "Đang duyệt").map((provider) => `<tr><td>${provider.name}</td><td>${provider.city}</td><td>${dateVN(provider.joinedAt)}</td><td><button class="btn btn-sm btn-outline-primary">Duyệt</button></td></tr>`).join("")}</tbody></table></div></div></div></div>
    `);
  };

  const adminRows = {
    users: db.users.map((user) => ({ search: `${user.name} ${user.email} ${user.role}`, attrs: { role: user.role, status: user.status }, cells: [`<div><strong>${user.name}</strong><div class="small text-muted">${user.email}</div></div>`, user.phone, user.role, user.city, statusBadge(user.status), dateVN(user.joinedAt), `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary">Sửa</button><button class="btn btn-sm btn-outline-danger">Khóa</button></div>`] })),
    tours: db.tours.map((tour) => ({ search: `${tour.name} ${tour.location} ${tour.type}`, attrs: { category: tour.category, status: "Đang hoạt động" }, cells: [`<div class="d-flex gap-2 align-items-center"><img src="${tour.image}" style="width:58px;height:46px;border-radius:0.6rem;object-fit:cover;" alt="${tour.name}" /><div><strong>${tour.name}</strong><div class="small text-muted">${tour.location}</div></div></div>`, tour.type, `${tour.duration}N${tour.nights}Đ`, vnd(tour.price), statusBadge("Đang hoạt động"), `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary">Sửa</button><button class="btn btn-sm btn-outline-danger">Ẩn</button></div>`] })),
    categories: db.categories.map((category) => ({ search: `${category.name}`, attrs: { status: "Đang hoạt động" }, cells: [category.id, category.name, `${category.tours} tour`, statusBadge("Đang hoạt động"), `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary">Sửa</button><button class="btn btn-sm btn-outline-danger">Xóa</button></div>`] })),
    bookings: db.bookings.map((booking) => ({ search: `${booking.code} ${booking.status} ${booking.paymentStatus}`, attrs: { status: booking.status, payment: booking.paymentStatus }, cells: [booking.code, getTourById(booking.tourId)?.name || "-", db.users.find((user) => user.id === booking.userId)?.name || "Khách lẻ", dateVN(booking.bookingDate), statusBadge(booking.status), statusBadge(booking.paymentStatus), vnd(booking.amount), `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary">Chi tiết</button><button class="btn btn-sm btn-outline-danger">Can thiệp</button></div>`] })),
    payments: payments.map((payment) => ({ search: `${payment.id} ${payment.bookingCode} ${payment.method}`, attrs: { status: payment.status }, cells: [payment.id, payment.bookingCode, payment.method, vnd(payment.amount), dateVN(payment.paidAt), statusBadge(payment.status), `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary">Xem</button><button class="btn btn-sm btn-outline-danger">Rà soát</button></div>`] })),
    invoices: invoices.map((invoice) => ({ search: `${invoice.id} ${invoice.bookingCode}`, attrs: { status: invoice.status }, cells: [invoice.id, invoice.bookingCode, db.users.find((user) => user.id === invoice.userId)?.name || "-", dateVN(invoice.issuedAt), vnd(invoice.amount), statusBadge(invoice.status), `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary">In</button><button class="btn btn-sm btn-outline-danger">Hủy</button></div>`] })),
    posts: db.posts.map((post) => ({ search: `${post.title} ${post.category} ${post.author}`, attrs: { status: "Công khai", category: post.category }, cells: [`<strong>${post.title}</strong>`, post.category, post.author, dateVN(post.date), statusBadge("Công khai"), `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary">Sửa</button><button class="btn btn-sm btn-outline-danger">Ẩn</button></div>`] })),
    promotions: db.promotions.map((promo) => ({ search: `${promo.code} ${promo.title}`, attrs: { status: promo.status }, cells: [promo.code, promo.title, promo.type === "percent" ? `${promo.value}%` : vnd(promo.value), `${dateVN(promo.start)} - ${dateVN(promo.end)}`, statusBadge(promo.status), `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary">Sửa</button><button class="btn btn-sm btn-outline-danger">Dừng</button></div>`] })),
    providers: db.providers.map((provider) => ({ search: `${provider.name} ${provider.email} ${provider.city}`, attrs: { status: provider.status, city: provider.city }, cells: [`<div><strong>${provider.name}</strong><div class="small text-muted">${provider.email}</div></div>`, provider.city, provider.totalTours, provider.rating, statusBadge(provider.status), dateVN(provider.joinedAt), `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary">Duyệt</button><button class="btn btn-sm btn-outline-danger">Khóa</button></div>`] })),
    comments: db.comments.map((comment) => ({ search: `${comment.user} ${comment.text}`, attrs: { status: comment.status }, cells: [comment.id, comment.user, getTourById(comment.tourId)?.name || "-", `${starHTML(comment.rating)} (${comment.rating})`, `<span class="text-muted">${comment.text}</span>`, statusBadge(comment.status), `<div class="table-actions d-flex gap-1"><button class="btn btn-sm btn-outline-primary">Duyệt</button><button class="btn btn-sm btn-outline-danger">Ẩn</button></div>`] }))
  };

  const renderAdminCrudPage = ({ active, title, subtitle, dataset, headers, filters, addLabel = "Thêm mới" }) => adminShell(active, title, subtitle, renderSmartTable({ title, subtitle, addLabel, addHref: "#", filters, headers, rows: dataset, pageSize: 8 }));

  const renderAdminUsers = () => renderAdminCrudPage({ active: "admin-users", title: "Quản lý người dùng", subtitle: "Theo dõi tài khoản khách hàng, nhà cung cấp và trạng thái hoạt động.", dataset: adminRows.users, headers: ["Người dùng", "Điện thoại", "Vai trò", "Thành phố", "Trạng thái", "Ngày tạo", "Hành động"], filters: [{ field: "role", label: "Vai trò", options: ["Admin", "Provider", "User"] }, { field: "status", label: "Trạng thái", options: ["Đang hoạt động", "Tạm dừng", "Khóa"] }], addLabel: "Thêm người dùng" });
  const renderAdminTours = () => renderAdminCrudPage({ active: "admin-tours", title: "Quản lý tour", subtitle: "Kiểm duyệt và vận hành toàn bộ sản phẩm tour trên hệ thống.", dataset: adminRows.tours, headers: ["Tour", "Loại", "Thời lượng", "Giá", "Trạng thái", "Hành động"], filters: [{ field: "category", label: "Danh mục", options: ["Biển", "Núi", "City", "Seasonal"] }, { field: "status", label: "Trạng thái", options: ["Đang hoạt động", "Tạm dừng"] }], addLabel: "Thêm tour" });
  const renderAdminCategories = () => renderAdminCrudPage({ active: "admin-categories", title: "Quản lý danh mục", subtitle: "Tạo và quản lý nhóm tour theo mục tiêu kinh doanh.", dataset: adminRows.categories, headers: ["Mã", "Tên danh mục", "Số tour", "Trạng thái", "Hành động"], filters: [{ field: "status", label: "Trạng thái", options: ["Đang hoạt động", "Tạm dừng"] }], addLabel: "Thêm danh mục" });
  const renderAdminBookings = () => renderAdminCrudPage({ active: "admin-bookings", title: "Quản lý đơn đặt tour", subtitle: "Theo dõi vòng đời booking và xử lý ngoại lệ kịp thời.", dataset: adminRows.bookings, headers: ["Mã đơn", "Tour", "Khách", "Ngày đặt", "Booking", "Thanh toán", "Tổng", "Hành động"], filters: [{ field: "status", label: "Trạng thái booking", options: ["Đã xác nhận", "Chờ xác nhận", "Đã hủy", "Hoàn tất"] }, { field: "payment", label: "Trạng thái thanh toán", options: ["Đã thanh toán", "Chưa thanh toán", "Thất bại"] }], addLabel: "Tạo booking" });
  const renderAdminPayments = () => renderAdminCrudPage({ active: "admin-payments", title: "Quản lý thanh toán", subtitle: "Giám sát giao dịch theo phương thức và trạng thái xử lý.", dataset: adminRows.payments, headers: ["Mã TT", "Mã booking", "Phương thức", "Số tiền", "Ngày", "Trạng thái", "Hành động"], filters: [{ field: "status", label: "Trạng thái", options: ["Thành công", "Chưa thanh toán", "Thất bại"] }], addLabel: "Tạo giao dịch" });
  const renderAdminInvoices = () => renderAdminCrudPage({ active: "admin-invoices", title: "Quản lý hóa đơn", subtitle: "Kiểm soát hóa đơn phát hành và trạng thái thanh toán.", dataset: adminRows.invoices, headers: ["Mã hóa đơn", "Mã booking", "Khách hàng", "Ngày phát hành", "Tổng", "Trạng thái", "Hành động"], filters: [{ field: "status", label: "Trạng thái", options: ["Đã thanh toán", "Chưa thanh toán", "Thất bại"] }], addLabel: "Phát hành hóa đơn" });
  const renderAdminPosts = () => renderAdminCrudPage({ active: "admin-posts", title: "Quản lý bài viết", subtitle: "Biên tập nội dung cẩm nang và tin tức truyền thông.", dataset: adminRows.posts, headers: ["Tiêu đề", "Danh mục", "Tác giả", "Ngày", "Trạng thái", "Hành động"], filters: [{ field: "category", label: "Danh mục", options: [...new Set(db.posts.map((post) => post.category))] }], addLabel: "Viết bài mới" });
  const renderAdminPromotions = () => renderAdminCrudPage({ active: "admin-promotions", title: "Quản lý khuyến mãi", subtitle: "Theo dõi hiệu lực và trạng thái mã giảm toàn hệ thống.", dataset: adminRows.promotions, headers: ["Mã", "Chương trình", "Giá trị", "Hiệu lực", "Trạng thái", "Hành động"], filters: [{ field: "status", label: "Trạng thái", options: ["Đang hoạt động", "Tạm dừng"] }], addLabel: "Tạo mã mới" });
  const renderAdminProviders = () => renderAdminCrudPage({ active: "admin-providers", title: "Quản lý nhà cung cấp", subtitle: "Duyệt hồ sơ NCC, theo dõi hiệu suất và trạng thái hợp tác.", dataset: adminRows.providers, headers: ["Nhà cung cấp", "Thành phố", "Số tour", "Rating", "Trạng thái", "Ngày tham gia", "Hành động"], filters: [{ field: "status", label: "Trạng thái", options: ["Đang hoạt động", "Đang duyệt", "Tạm dừng"] }, { field: "city", label: "Thành phố", options: [...new Set(db.providers.map((provider) => provider.city))] }], addLabel: "Thêm nhà cung cấp" });
  const renderAdminComments = () => renderAdminCrudPage({ active: "admin-comments", title: "Quản lý bình luận & đánh giá", subtitle: "Kiểm duyệt nội dung cộng đồng và duy trì chất lượng đánh giá.", dataset: adminRows.comments, headers: ["Mã", "Người dùng", "Tour", "Đánh giá", "Nội dung", "Trạng thái", "Hành động"], filters: [{ field: "status", label: "Trạng thái", options: ["Công khai", "Đang duyệt"] }], addLabel: "Xuất báo cáo" });

  const renderAdminRoles = () => adminShell("admin-roles", "Phân quyền người dùng", "Cấu hình vai trò và quyền truy cập cho từng nhóm tài khoản.", `
      <div class="row g-4"><div class="col-xl-5"><div class="panel-card p-3 p-lg-4"><h5 class="mb-3">Danh sách vai trò</h5><div class="list-group"><button class="list-group-item list-group-item-action active">Admin</button><button class="list-group-item list-group-item-action">Provider</button><button class="list-group-item list-group-item-action">User</button><button class="list-group-item list-group-item-action">Moderator</button></div><button class="btn btn-primary mt-3">Tạo vai trò mới</button></div></div><div class="col-xl-7"><div class="panel-card p-3 p-lg-4"><h5 class="mb-3">Ma trận quyền - Admin</h5><div class="table-responsive"><table class="table"><thead><tr><th>Module</th><th>Xem</th><th>Tạo</th><th>Sửa</th><th>Xóa</th><th>Duyệt</th></tr></thead><tbody><tr><td>Người dùng</td><td><input type="checkbox" checked /></td><td><input type="checkbox" checked /></td><td><input type="checkbox" checked /></td><td><input type="checkbox" checked /></td><td><input type="checkbox" checked /></td></tr><tr><td>Tour</td><td><input type="checkbox" checked /></td><td><input type="checkbox" checked /></td><td><input type="checkbox" checked /></td><td><input type="checkbox" checked /></td><td><input type="checkbox" checked /></td></tr><tr><td>Booking</td><td><input type="checkbox" checked /></td><td><input type="checkbox" /></td><td><input type="checkbox" checked /></td><td><input type="checkbox" /></td><td><input type="checkbox" checked /></td></tr><tr><td>Bài viết</td><td><input type="checkbox" checked /></td><td><input type="checkbox" checked /></td><td><input type="checkbox" checked /></td><td><input type="checkbox" checked /></td><td><input type="checkbox" checked /></td></tr><tr><td>Thống kê</td><td><input type="checkbox" checked /></td><td><input type="checkbox" /></td><td><input type="checkbox" /></td><td><input type="checkbox" /></td><td><input type="checkbox" /></td></tr></tbody></table></div><button class="btn btn-primary">Lưu cấu hình phân quyền</button></div></div></div>
  `);

  const renderAdminStats = () => adminShell("admin-stats", "Thống kê hệ thống chi tiết", "Phân tích tăng trưởng, chuyển đổi và hành vi khách hàng theo thời gian.", `
      ${metricCards([{ label: "Tỷ lệ chuyển đổi", value: "6.4%", icon: "bi-graph-up-arrow", color: "blue", note: "+0.9% so với tháng trước" }, { label: "AOV", value: vnd(12800000), icon: "bi-currency-dollar", color: "teal", note: "Giá trị đơn trung bình" }, { label: "Refund rate", value: "1.8%", icon: "bi-arrow-counterclockwise", color: "orange", note: "Trong ngưỡng an toàn" }, { label: "NPS", value: "72", icon: "bi-emoji-smile", color: "red", note: "Mức hài lòng cao" }])}
      <div class="row g-4"><div class="col-xl-7"><div class="panel-card p-3 p-lg-4"><h5 class="mb-3">Tăng trưởng người dùng theo tháng</h5><canvas id="adminUsersChart" height="150"></canvas></div></div><div class="col-xl-5"><div class="panel-card p-3 p-lg-4"><h5 class="mb-3">Phân bổ booking theo khu vực</h5><canvas id="adminRegionChart" height="150"></canvas></div></div></div>
      <div class="panel-card p-3 p-lg-4 mt-4"><h5 class="mb-3">Top tour hiệu suất cao</h5><div class="table-responsive"><table class="table table-hover"><thead><tr><th>Tour</th><th>Lượt xem</th><th>Booking</th><th>Tỷ lệ chuyển đổi</th><th>Doanh thu</th></tr></thead><tbody>${db.tours.slice(0, 6).map((tour, index) => { const views = 4000 + index * 850; const conversion = ((tour.booked / views) * 100).toFixed(1); return `<tr><td>${tour.name}</td><td>${views}</td><td>${tour.booked}</td><td>${conversion}%</td><td>${vnd(tour.booked * tour.price)}</td></tr>`; }).join("")}</tbody></table></div></div>
  `);
  const pageMap = {
    home: renderHome,
    tours: renderToursPage,
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
    "provider-bookings": renderProviderBookings,
    "provider-booking-detail": renderProviderBookingDetail,
    "provider-services": renderProviderServices,
    "provider-promotions": renderProviderPromotions,
    "provider-feedback": renderProviderFeedback,
    "admin-dashboard": renderAdminDashboard,
    "admin-users": renderAdminUsers,
    "admin-roles": renderAdminRoles,
    "admin-tours": renderAdminTours,
    "admin-categories": renderAdminCategories,
    "admin-bookings": renderAdminBookings,
    "admin-payments": renderAdminPayments,
    "admin-invoices": renderAdminInvoices,
    "admin-posts": renderAdminPosts,
    "admin-promotions": renderAdminPromotions,
    "admin-providers": renderAdminProviders,
    "admin-comments": renderAdminComments,
    "admin-stats": renderAdminStats
  };

  app.innerHTML = pageMap[page]
    ? pageMap[page]()
    : `<div class="container py-5"><div class="alert alert-warning">Không tìm thấy trang phù hợp.</div></div>`;

  const showToast = (message, type = "success") => {
    const wrap = document.getElementById("global-toast");
    if (!wrap) return;
    const id = `toast-${Date.now()}`;
    const bg = type === "danger" ? "text-bg-danger" : type === "warning" ? "text-bg-warning" : type === "info" ? "text-bg-info" : "text-bg-success";
    wrap.insertAdjacentHTML("beforeend", `<div id="${id}" class="toast align-items-center ${bg} border-0" role="alert"><div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>`);
    const el = document.getElementById(id);
    const toast = new bootstrap.Toast(el, { delay: 2400 });
    toast.show();
    el.addEventListener("hidden.bs.toast", () => el.remove());
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

  const toggleWishlist = (tourId) => {
    const idNum = Number(tourId);
    if (wishlist.has(idNum)) {
      wishlist.delete(idNum);
      showToast("Đã xóa tour khỏi danh sách yêu thích.", "warning");
    } else {
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
      app.innerHTML = renderWishlistPage();
      initPageBehaviors();
    }
  };

  const makeTravelerInputs = (count) => Array.from({ length: count }, (_, idx) => `<div class="col-md-6"><input class="form-control" placeholder="Khách ${idx + 1} - Họ tên" required /></div><div class="col-md-3"><input class="form-control" placeholder="Năm sinh" /></div><div class="col-md-3"><select class="form-select"><option>Người lớn</option><option>Trẻ em</option></select></div>`).join("");

  const initHomePage = () => {
    document.getElementById("newsletterForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      event.target.reset();
      showToast("Đăng ký nhận bản tin thành công!");
    });
    document.querySelector('[data-action="quick-search"]')?.addEventListener("click", () => {
      writeLS(LS_KEYS.recentFilters, {
        destination: document.getElementById("quickDestination")?.value || "",
        duration: document.getElementById("quickDuration")?.value || "",
        budget: document.getElementById("quickBudget")?.value || ""
      });
      window.location.href = routes.tours;
    });
  };

  const initToursPage = () => {
    const grid = document.getElementById("toursGrid");
    const pagination = document.getElementById("toursPagination");
    const countEl = document.getElementById("toursResultCount");
    const emptyState = document.getElementById("toursEmptyState");
    if (!grid || !pagination || !countEl || !emptyState) return;

    const state = { currentPage: 1, pageSize: 6 };
    const controls = {
      keyword: document.getElementById("filterKeyword"),
      location: document.getElementById("filterLocation"),
      price: document.getElementById("filterPrice"),
      type: document.getElementById("filterType"),
      duration: document.getElementById("filterDuration"),
      rating: document.getElementById("filterRating"),
      sort: document.getElementById("sortTours")
    };

    const recent = readLS(LS_KEYS.recentFilters, null);
    if (recent) {
      if (recent.destination) controls.location.value = recent.destination;
      if (recent.duration) controls.duration.value = recent.duration;
      if (recent.budget) controls.price.value = recent.budget;
    }

    const parseBudget = (value) => {
      if (!value) return [0, Number.MAX_SAFE_INTEGER];
      const [min, max] = value.split("-").map(Number);
      return [min || 0, max || Number.MAX_SAFE_INTEGER];
    };

    const filterTours = () => {
      const keyword = controls.keyword.value.trim().toLowerCase();
      const [minPrice, maxPrice] = parseBudget(controls.price.value);
      const rating = Number(controls.rating.value || 0);
      let filtered = db.tours.filter((tour) => {
        const k = keyword ? `${tour.name} ${tour.location} ${tour.type}`.toLowerCase().includes(keyword) : true;
        const l = controls.location.value ? tour.location === controls.location.value : true;
        const t = controls.type.value ? tour.type === controls.type.value : true;
        const d = controls.duration.value ? (Number(controls.duration.value) >= 6 ? tour.duration >= 6 : tour.duration === Number(controls.duration.value)) : true;
        const r = rating ? tour.rating >= rating : true;
        const p = tour.price >= minPrice && tour.price <= maxPrice;
        return k && l && t && d && r && p;
      });

      if (new URLSearchParams(window.location.search).get("promo")) filtered = filtered.filter((tour) => tour.oldPrice > tour.price);

      const sort = controls.sort.value;
      filtered.sort((a, b) => {
        if (sort === "price-asc") return a.price - b.price;
        if (sort === "price-desc") return b.price - a.price;
        if (sort === "popular") return b.booked - a.booked;
        return b.id - a.id;
      });
      return filtered;
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
      pagination.innerHTML = totalPages > 1 ? [`<button class="page-btn" data-page-btn="prev"><i class="bi bi-chevron-left"></i></button>`, ...Array.from({ length: totalPages }, (_, i) => `<button class="page-btn ${state.currentPage === i + 1 ? "active" : ""}" data-page-btn="${i + 1}">${i + 1}</button>`), `<button class="page-btn" data-page-btn="next"><i class="bi bi-chevron-right"></i></button>`].join("") : "";
      pagination.querySelectorAll("[data-page-btn]").forEach((btn) => btn.addEventListener("click", () => {
        const v = btn.getAttribute("data-page-btn");
        if (v === "prev") state.currentPage = Math.max(1, state.currentPage - 1);
        else if (v === "next") state.currentPage = Math.min(totalPages, state.currentPage + 1);
        else state.currentPage = Number(v);
        draw();
      }));
      writeLS(LS_KEYS.recentFilters, { destination: controls.location.value, duration: controls.duration.value, budget: controls.price.value });
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
      const sub = people * tour.price;
      const discount = calculateDiscount(sub, code);
      const total = Math.max(0, sub - discount);
      document.getElementById("detailSubTotal").textContent = vnd(sub);
      document.getElementById("detailDiscount").textContent = `- ${vnd(discount)}`;
      document.getElementById("detailTotal").textContent = vnd(total);
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
    document.getElementById("commentForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      showToast("Cảm ơn bạn! Bình luận đã được gửi để duyệt.");
      event.target.reset();
    });
    update();
  };

  const initAuthPages = () => {
    document.getElementById("loginForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.target;
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }
      showToast("Đăng nhập thành công. Chào mừng bạn quay lại!");
      setTimeout(() => (window.location.href = routes.home), 700);
    });
    document.getElementById("registerForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.target;
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }
      showToast("Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.");
      setTimeout(() => (window.location.href = routes.login), 800);
    });
    document.getElementById("forgotForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.target;
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }
      showToast("Liên kết đặt lại mật khẩu đã được gửi vào email của bạn.", "info");
      form.reset();
    });
  };

  const initProfileEditPage = () => {
    document.getElementById("profileEditForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.target;
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }
      const data = new FormData(form);
      writeLS(LS_KEYS.profile, {
        name: data.get("name"),
        birthday: data.get("birthday"),
        email: data.get("email"),
        phone: data.get("phone"),
        city: data.get("city"),
        address: data.get("address"),
        bio: data.get("bio")
      });
      showToast("Cập nhật hồ sơ thành công!");
      setTimeout(() => (window.location.href = routes.profile), 650);
    });
  };

  const initBookingPage = () => {
    const tour = getTourById(new URLSearchParams(window.location.search).get("tourId")) || db.tours[0];
    const peopleInput = document.getElementById("bookingPeople");
    const couponSelect = document.getElementById("bookingCoupon");
    const render = () => {
      const people = Math.max(1, Number(peopleInput?.value || 1));
      document.getElementById("travelerList").innerHTML = makeTravelerInputs(people);
      const coupon = couponSelect?.value || "";
      const sub = people * tour.price;
      const discount = calculateDiscount(sub, coupon);
      const total = Math.max(0, sub - discount);
      document.getElementById("bookingSubTotal").textContent = vnd(sub);
      document.getElementById("bookingDiscount").textContent = `- ${vnd(discount)}`;
      document.getElementById("bookingTotal").textContent = vnd(total);
      return { people, coupon, total };
    };
    peopleInput?.addEventListener("input", render);
    couponSelect?.addEventListener("change", render);
    render();

    document.getElementById("bookingContinue")?.addEventListener("click", () => {
      const form = document.getElementById("bookingForm");
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        showToast("Vui lòng hoàn thành đầy đủ thông tin đặt tour.", "warning");
        return;
      }
      const data = new FormData(form);
      const result = render();
      writeLS(LS_KEYS.bookingDraft, {
        userId: currentUserId,
        tourId: tour.id,
        departureDate: document.getElementById("bookingDeparture").value,
        people: result.people,
        coupon: result.coupon,
        total: result.total,
        customer: { name: data.get("name"), phone: data.get("phone"), email: data.get("email") },
        note: data.get("note") || ""
      });
      window.location.href = routes.payment;
    });
  };

  const initPaymentPage = () => {
    document.getElementById("confirmPaymentBtn")?.addEventListener("click", () => {
      const draft = readLS(LS_KEYS.bookingDraft, null);
      if (!draft) {
        showToast("Không tìm thấy thông tin đơn hàng. Vui lòng đặt tour lại.", "danger");
        return;
      }
      const now = new Date();
      const code = `BK${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
      const method = document.querySelector('input[name="paymentMethod"]:checked')?.value || "Thẻ ngân hàng";
      const booking = {
        code,
        userId: currentUserId,
        tourId: draft.tourId,
        bookingDate: todayISO(),
        departureDate: draft.departureDate,
        travelers: draft.people,
        amount: draft.total,
        status: "Chờ xác nhận",
        paymentStatus: "Đã thanh toán",
        providerId: getTourById(draft.tourId)?.providerId || "pv01",
        paymentMethod: method
      };
      const orders = getAllOrders();
      orders.unshift(booking);
      writeLS(LS_KEYS.orders, orders);
      writeLS(LS_KEYS.bookingDraft, null);
      showToast("Thanh toán thành công! Đơn của bạn đang chờ xác nhận.");
      setTimeout(() => (window.location.href = addQuery(routes.bookingHistory, { success: 1 })), 900);
    });
  };

  const initBookingHistoryPage = () => {
    if (new URLSearchParams(window.location.search).get("success")) showToast("Đặt tour thành công. Bạn có thể theo dõi trạng thái tại đây.", "success");
  };

  const initContactPage = () => {
    document.getElementById("contactForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.target;
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }
      showToast("Yêu cầu hỗ trợ đã được gửi. Chúng tôi sẽ phản hồi trong 15 phút.", "info");
      form.reset();
      form.classList.remove("was-validated");
    });
  };

  const initProviderBookingsPage = () => {
    const drawerBody = document.getElementById("providerBookingDrawerBody");
    if (!drawerBody) return;
    document.querySelectorAll("[data-booking-code]").forEach((button) => {
      button.addEventListener("click", () => {
        const booking = db.bookings.find((item) => item.code === button.getAttribute("data-booking-code"));
        const tour = booking ? getTourById(booking.tourId) : null;
        const user = booking ? db.users.find((item) => item.id === booking.userId) : null;
        if (!booking) return;
        drawerBody.innerHTML = `<div class="mb-3"><strong>Mã booking:</strong> ${booking.code}</div><div class="mb-3"><strong>Khách hàng:</strong> ${user?.name || "-"}</div><div class="mb-3"><strong>Tour:</strong> ${tour?.name || "-"}</div><div class="mb-3"><strong>Ngày đi:</strong> ${dateVN(booking.departureDate)}</div><div class="mb-3"><strong>Số khách:</strong> ${booking.travelers}</div><div class="mb-3"><strong>Tổng tiền:</strong> ${vnd(booking.amount)}</div><div class="mb-3"><strong>Booking:</strong> ${statusBadge(booking.status)}</div><div class="mb-3"><strong>Thanh toán:</strong> ${statusBadge(booking.paymentStatus)}</div><button class="btn btn-primary w-100 mb-2">Xác nhận ngay</button><button class="btn btn-outline-danger w-100">Từ chối booking</button>`;
      });
    });
  };

  const initCharts = () => {
    if (typeof Chart === "undefined") return;
    if (page === "provider-dashboard") {
      const ctx = document.getElementById("providerBookingChart");
      if (ctx) new Chart(ctx, { type: "line", data: { labels: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"], datasets: [{ label: "Booking", data: [18, 22, 16, 24, 28, 31, 34, 29, 36, 38, 40, 42], borderColor: "#1f6be0", backgroundColor: "rgba(31, 107, 224, 0.12)", tension: 0.4, fill: true, borderWidth: 2 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: "rgba(99,119,152,0.15)" } }, x: { grid: { display: false } } } } });
    }
    if (page === "admin-dashboard") {
      const revenueCtx = document.getElementById("adminRevenueChart");
      if (revenueCtx) new Chart(revenueCtx, { type: "bar", data: { labels: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"], datasets: [{ label: "Doanh thu (triệu)", data: [420, 510, 480, 620, 710, 760, 820, 790, 880, 940, 990, 1080], backgroundColor: "rgba(42, 130, 255, 0.75)", borderRadius: 8 }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: "rgba(99,119,152,0.15)" } }, x: { grid: { display: false } } } } });
      const categoryCtx = document.getElementById("adminCategoryChart");
      if (categoryCtx) new Chart(categoryCtx, { type: "doughnut", data: { labels: ["Biển", "Núi", "City", "Mùa vụ"], datasets: [{ data: [35, 21, 28, 16], backgroundColor: ["#2a82ff", "#1db8a8", "#ff9f43", "#90a8d6"] }] }, options: { plugins: { legend: { position: "bottom" } } } });
    }
    if (page === "admin-stats") {
      const usersCtx = document.getElementById("adminUsersChart");
      if (usersCtx) new Chart(usersCtx, { type: "line", data: { labels: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"], datasets: [{ label: "User mới", data: [120, 145, 138, 164, 188, 210, 225, 218, 240, 255, 270, 298], borderColor: "#2a82ff", tension: 0.35, fill: false, borderWidth: 2 }, { label: "Provider mới", data: [12, 10, 15, 14, 18, 22, 19, 23, 21, 26, 28, 30], borderColor: "#1db8a8", tension: 0.35, fill: false, borderWidth: 2 }] }, options: { plugins: { legend: { position: "bottom" } }, scales: { y: { beginAtZero: true, grid: { color: "rgba(99,119,152,0.15)" } }, x: { grid: { display: false } } } } });
      const regionCtx = document.getElementById("adminRegionChart");
      if (regionCtx) new Chart(regionCtx, { type: "pie", data: { labels: ["Miền Bắc", "Miền Trung", "Miền Nam", "Quốc tế"], datasets: [{ data: [24, 21, 31, 24], backgroundColor: ["#2a82ff", "#1db8a8", "#ff9f43", "#7187b5"] }] }, options: { plugins: { legend: { position: "bottom" } } } });
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
    document.addEventListener("click", (event) => {
      const target = event.target.closest("[data-action]");
      if (!target) return;
      const action = target.getAttribute("data-action");
      if (action === "toggle-wishlist") {
        const tourId = target.getAttribute("data-tour-id");
        if (tourId) toggleWishlist(tourId);
      }
      if (action === "cancel-booking") {
        const code = target.getAttribute("data-code");
        if (!code) return;
        cancelledCodes.add(code);
        writeLS(LS_KEYS.cancelled, [...cancelledCodes]);
        showToast(`Đã gửi yêu cầu hủy đơn ${code}.`, "warning");
        if (page === "booking-history") {
          app.innerHTML = renderBookingHistoryPage();
          initPageBehaviors();
        }
      }
      if (action === "print-invoice") window.print();
      if (action === "download-invoice") showToast("Tính năng tải PDF đang ở chế độ mô phỏng.", "info");
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
    if (page === "profile-edit") initProfileEditPage();
    if (page === "booking") initBookingPage();
    if (page === "payment") initPaymentPage();
    if (page === "booking-history") initBookingHistoryPage();
    if (page === "contact") initContactPage();
    if (page === "provider-bookings") initProviderBookingsPage();
  }

  initDelegatedActions();
  initPageBehaviors();
})();
