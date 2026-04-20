import { clearStatusSlot, ensureStatusSlot, renderStatusMessage, withPendingButton } from "./ui-state.js";

export function initHomeActions({
  apiPost,
  profileState,
  writeLS,
  storageKeys,
  routes,
  showToast
}) {
  const newsletterForm = document.getElementById("newsletterForm");
  const quickSearchButton = document.querySelector('[data-action="quick-search"]');

  if (newsletterForm) {
    const statusSlot = ensureStatusSlot(newsletterForm.parentElement || newsletterForm);

    newsletterForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = newsletterForm.querySelector('input[type="email"]')?.value?.trim() || "";
      const submitButton = newsletterForm.querySelector('button[type="submit"]');

      if (!email) {
        renderStatusMessage(statusSlot, {
          type: "warning",
          title: "Thiếu email đăng ký",
          message: "Vui lòng nhập email để nhận bản tin ưu đãi."
        });
        showToast("Vui lòng nhập email để đăng ký bản tin.", "warning");
        return;
      }

      clearStatusSlot(statusSlot);

      try {
        await withPendingButton(submitButton, "Đang đăng ký...", () =>
          apiPost("/newsletter/subscribe", {
            email,
            full_name: profileState.name || "Khách đăng ký bản tin"
          })
        );

        newsletterForm.reset();
        renderStatusMessage(statusSlot, {
          type: "success",
          title: "Đăng ký thành công",
          message: "Ưu đãi và cẩm nang mới sẽ được gửi về email của bạn."
        });
        showToast("Đăng ký nhận bản tin thành công!");
      } catch (error) {
        renderStatusMessage(statusSlot, {
          type: "danger",
          title: "Không thể đăng ký bản tin",
          message: error?.message || "Vui lòng thử lại sau."
        });
        showToast(error?.message || "Không thể đăng ký bản tin lúc này.", "danger");
      }
    });
  }

  quickSearchButton?.addEventListener("click", () => {
    writeLS(storageKeys.recentFilters, {
      destination: document.getElementById("quickDestination")?.value || "",
      duration: document.getElementById("quickDuration")?.value || "",
      budget: document.getElementById("quickBudget")?.value || ""
    });
    window.location.href = routes.tours;
  });
}

export function initContactActions({ apiPost, showToast }) {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const statusSlot = ensureStatusSlot(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      renderStatusMessage(statusSlot, {
        type: "warning",
        title: "Biểu mẫu chưa hợp lệ",
        message: "Vui lòng kiểm tra lại các trường bắt buộc trước khi gửi."
      });
      return;
    }

    const inputs = form.querySelectorAll("input, select, textarea");
    const submitButton = form.querySelector('button[type="submit"]');

    const payload = {
      full_name: inputs[0]?.value?.trim() || "",
      phone: inputs[1]?.value?.trim() || "",
      email: inputs[2]?.value?.trim() || "",
      subject: inputs[3]?.value?.trim() || "Hỗ trợ",
      message: inputs[4]?.value?.trim() || ""
    };

    clearStatusSlot(statusSlot);

    try {
      await withPendingButton(submitButton, "Đang gửi hỗ trợ...", () => apiPost("/contact", payload));
      form.reset();
      form.classList.remove("was-validated");
      renderStatusMessage(statusSlot, {
        type: "success",
        title: "Đã gửi yêu cầu hỗ trợ",
        message: "Đội ngũ Viet Horizon Travel sẽ phản hồi trong thời gian sớm nhất."
      });
      showToast("Yêu cầu hỗ trợ đã được gửi. Chúng tôi sẽ phản hồi trong 15 phút.", "info");
    } catch (error) {
      renderStatusMessage(statusSlot, {
        type: "danger",
        title: "Gửi yêu cầu thất bại",
        message: error?.message || "Vui lòng thử lại sau ít phút."
      });
      showToast(error?.message || "Không thể gửi yêu cầu lúc này.", "danger");
    }
  });
}

export function initBookingActions({
  db,
  getTourById,
  calcBookingTotals,
  getPromotionByCode,
  vnd,
  makeTravelerInputs,
  createBooking,
  writeLS,
  storageKeys,
  currentUserId,
  routes,
  profileState,
  isLoggedInUser,
  showToast
}) {
  const tour = getTourById(new URLSearchParams(window.location.search).get("tourId")) || db.tours[0];
  const peopleInput = document.getElementById("bookingPeople");
  const couponSelect = document.getElementById("bookingCoupon");
  const travelerList = document.getElementById("travelerList");
  const form = document.getElementById("bookingForm");
  const continueButton = document.getElementById("bookingContinue");

  if (!tour || !form || !continueButton || !travelerList) return;

  const statusSlot = ensureStatusSlot(form.parentElement || form);

  const render = () => {
    const people = Math.max(1, Number(peopleInput?.value || 1));
    travelerList.innerHTML = makeTravelerInputs(people);
    const coupon = couponSelect?.value || "";
    const totals = calcBookingTotals({
      unitPrice: tour.price,
      people,
      coupon: getPromotionByCode(coupon)
    });

    document.getElementById("bookingSubTotal").textContent = vnd(totals.subTotal);
    document.getElementById("bookingDiscount").textContent = `- ${vnd(totals.discount)}`;
    document.getElementById("bookingTotal").textContent = vnd(totals.total);

    return { people: totals.people, coupon, total: totals.total };
  };

  peopleInput?.addEventListener("input", render);
  couponSelect?.addEventListener("change", render);
  render();

  continueButton.addEventListener("click", async () => {
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      renderStatusMessage(statusSlot, {
        type: "warning",
        title: "Thiếu thông tin đặt tour",
        message: "Vui lòng hoàn thành đầy đủ thông tin liên hệ và danh sách khách đi."
      });
      showToast("Vui lòng hoàn thành đầy đủ thông tin đặt tour.", "warning");
      return;
    }

    if (!isLoggedInUser()) {
      renderStatusMessage(statusSlot, {
        type: "warning",
        title: "Cần đăng nhập",
        message: "Bạn cần đăng nhập trước khi tạo booking thật trên hệ thống."
      });
      showToast("Vui lòng đăng nhập để tiếp tục đặt tour.", "warning");
      window.location.href = `${routes.login}?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }

    const data = new FormData(form);
    const result = render();
    const departureDate = document.getElementById("bookingDeparture")?.value;

    const nameInputs = Array.from(document.querySelectorAll('#travelerList input[placeholder*="Họ tên"]'));
    const yearInputs = Array.from(document.querySelectorAll('#travelerList input[placeholder="Năm sinh"]'));
    const typeSelects = Array.from(document.querySelectorAll("#travelerList select"));

    const travelers = nameInputs.map((input, idx) => {
      const typeLabel = typeSelects[idx]?.value || "Người lớn";
      const isChild = typeLabel.toLowerCase().includes("trẻ");
      const year = yearInputs[idx]?.value?.trim();
      return {
        full_name: input.value?.trim() || `Khách ${idx + 1}`,
        traveler_type: isChild ? "child" : "adult",
        date_of_birth: year ? `${year}-01-01` : null
      };
    });

    const adultCount = travelers.filter((traveler) => traveler.traveler_type === "adult").length;
    const childCount = travelers.filter((traveler) => traveler.traveler_type === "child").length;

    clearStatusSlot(statusSlot);

    try {
      const created = await withPendingButton(continueButton, "Đang tạo booking...", () =>
        createBooking({
          tour_id: tour.id,
          contact_name: data.get("name"),
          contact_phone: data.get("phone"),
          contact_email: data.get("email"),
          total_guests: result.people,
          adult_count: adultCount || result.people,
          child_count: childCount,
          departure_date: departureDate,
          promotion_code: result.coupon || undefined,
          note: data.get("note") || "",
          travelers
        })
      );

      const booking = created?.booking || created;
      const invoice = created?.invoice || null;

      writeLS(storageKeys.bookingDraft, {
        userId: currentUserId,
        bookingId: booking?.id,
        bookingCode: booking?.booking_code,
        invoiceId: invoice?.id || 0,
        tourId: tour.id,
        departureDate,
        people: result.people,
        coupon: result.coupon,
        total: booking?.total_amount || result.total,
        customer: { name: data.get("name"), phone: data.get("phone"), email: data.get("email") },
        note: data.get("note") || ""
      });

      renderStatusMessage(statusSlot, {
        type: "success",
        title: "Tạo booking thành công",
        message: "Hệ thống đang chuyển bạn sang bước thanh toán."
      });

      window.location.href = routes.payment;
    } catch (error) {
      renderStatusMessage(statusSlot, {
        type: "danger",
        title: "Không thể tạo booking",
        message: error?.message || "Vui lòng kiểm tra lại thông tin hoặc thử lại sau."
      });
      showToast(error?.message || "Không thể tạo booking lúc này.", "danger");
    }
  });
}

export function initPaymentActions({
  readLS,
  storageKeys,
  apiPost,
  mapBookingFromApi,
  db,
  refreshDerivedCollections,
  showToast,
  writeLS,
  routes,
  addQuery
}) {
  const confirmButton = document.getElementById("confirmPaymentBtn");
  if (!confirmButton) return;

  const summaryCard = confirmButton.closest(".sticky-booking");
  const statusSlot = ensureStatusSlot(summaryCard || confirmButton.parentElement, { position: "before", className: "mb-3" });

  confirmButton.addEventListener("click", async () => {
    const draft = readLS(storageKeys.bookingDraft, null);
    if (!draft || !draft.bookingId) {
      renderStatusMessage(statusSlot, {
        type: "danger",
        title: "Thiếu dữ liệu đơn hàng",
        message: "Không tìm thấy booking để thanh toán. Vui lòng quay lại bước đặt tour."
      });
      showToast("Không tìm thấy thông tin đơn hàng. Vui lòng đặt tour lại.", "danger");
      return;
    }

    const method = document.querySelector('input[name="paymentMethod"]:checked')?.value || "Thẻ ngân hàng";
    const paymentMethod = method.includes("Ví") ? "e_wallet" : method.includes("Chuyển") ? "bank_transfer" : "bank_card";

    const cardNumberRaw = document.getElementById("paymentCardNumber")?.value || "";
    const cardNumber = cardNumberRaw.replace(/\D/g, "");
    const cardCvv = (document.getElementById("paymentCardCvv")?.value || "").trim();
    const cardHolder = (document.getElementById("paymentCardHolder")?.value || "").trim();
    const cardExpiry = (document.getElementById("paymentCardExpiry")?.value || "").trim();

    if (paymentMethod === "bank_card" && (!cardNumber || !cardHolder || !cardExpiry || !/^\d{3,4}$/.test(cardCvv))) {
      renderStatusMessage(statusSlot, {
        type: "warning",
        title: "Thông tin thẻ chưa hợp lệ",
        message: "Vui lòng nhập đầy đủ số thẻ, tên chủ thẻ, ngày hết hạn và CVV hợp lệ."
      });
      showToast("Vui lòng nhập đầy đủ thông tin thẻ hợp lệ.", "warning");
      return;
    }

    clearStatusSlot(statusSlot);

    try {
      const paid = await withPendingButton(confirmButton, "Đang xử lý thanh toán...", () =>
        apiPost(`/bookings/${draft.bookingId}/payment`, {
          payment_method: paymentMethod
        })
      );

      const booking = mapBookingFromApi(paid?.booking || {});
      const invoice = paid?.invoice || null;

      const existingIndex = db.bookings.findIndex((item) => String(item.id) === String(booking.id));
      if (existingIndex >= 0) db.bookings[existingIndex] = booking;
      else db.bookings.unshift(booking);

      if (invoice?.id) draft.invoiceId = invoice.id;

      refreshDerivedCollections();

      if (booking.paymentStatus === "Thất bại") {
        renderStatusMessage(statusSlot, {
          type: "danger",
          title: "Thanh toán thất bại",
          message: "Giao dịch chưa hoàn tất. Bạn có thể thử lại với phương thức khác."
        });
        showToast("Thanh toán thất bại. Vui lòng thử lại.", "danger");
        return;
      }

      writeLS(storageKeys.bookingDraft, null);

      if (booking.paymentStatus === "Chờ xử lý" || booking.paymentStatus === "Chưa thanh toán") {
        renderStatusMessage(statusSlot, {
          type: "info",
          title: "Đã ghi nhận yêu cầu thanh toán",
          message: "Đơn hàng đang chờ đối soát chuyển khoản trước khi xác nhận."
        });
        showToast("Đã ghi nhận yêu cầu thanh toán chuyển khoản. Đơn sẽ được xác nhận sau khi đối soát.", "info");
        setTimeout(() => (window.location.href = addQuery(routes.bookingHistory, { pending: 1 })), 800);
        return;
      }

      renderStatusMessage(statusSlot, {
        type: "success",
        title: "Thanh toán thành công",
        message: "Đơn đặt tour đã được ghi nhận và đang chờ xác nhận cuối cùng."
      });
      showToast("Thanh toán thành công! Đơn của bạn đang chờ xác nhận.");
      setTimeout(() => (window.location.href = addQuery(routes.bookingHistory, { success: 1 })), 800);
    } catch (error) {
      renderStatusMessage(statusSlot, {
        type: "danger",
        title: "Thanh toán không thành công",
        message: error?.message || "Vui lòng thử lại hoặc chọn phương thức thanh toán khác."
      });
      showToast(error?.message || "Thanh toán thất bại, vui lòng thử lại.", "danger");
    }
  });
}

export function initBookingHistoryActions({ showToast }) {
  const query = new URLSearchParams(window.location.search);
  if (query.get("success")) showToast("Đặt tour thành công. Bạn có thể theo dõi trạng thái tại đây.", "success");
  if (query.get("pending")) showToast("Đơn đã chuyển sang chờ xác nhận thanh toán.", "info");
}

