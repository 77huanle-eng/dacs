export function initProfileEditPage(deps = {}) {
  const {
    routes,
    profileState,
    writeLS,
    storageKeys,
    apiPut,
    apiPost,
    logoutWithApi,
    showToast,
    ensureStatusSlot,
    renderStatusMessage,
    clearStatusSlot,
    withPendingButton
  } = deps;

  const form = document.getElementById("profileEditForm");
  if (!form) return;
  const statusSlot = ensureStatusSlot(form, { position: "before", className: "mb-3" });

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
      renderStatusMessage(statusSlot, {
        type: "warning",
        title: "Hồ sơ chưa hợp lệ",
        message: "Vui lòng kiểm tra lại các trường bắt buộc trước khi lưu."
      });
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

    const submitButton = form.querySelector('button[type="submit"]');
    clearStatusSlot(statusSlot);

    let updatedProfile = null;
    try {
      updatedProfile = await withPendingButton(submitButton, "Đang cập nhật hồ sơ...", () => apiPut("/profile", payload));
    } catch (error) {
      renderStatusMessage(statusSlot, {
        type: "danger",
        title: "Không thể cập nhật hồ sơ",
        message: error?.message || "Vui lòng thử lại sau."
      });
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
    writeLS(storageKeys.profile, nextProfile);

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
      // bỏ qua lỗi parse local auth
    }

    if (avatarObjectUrl) {
      URL.revokeObjectURL(avatarObjectUrl);
      avatarObjectUrl = "";
    }

    renderStatusMessage(statusSlot, {
      type: "success",
      title: "Đã cập nhật hồ sơ",
      message: "Thông tin cá nhân đã được lưu thành công."
    });
    showToast("Cập nhật hồ sơ thành công!");
    setTimeout(() => (window.location.href = routes.profile), 650);
  });

  const changePasswordForm = document.getElementById("changePasswordForm");
  const passwordStatus = changePasswordForm
    ? ensureStatusSlot(changePasswordForm, { position: "before", className: "mb-3" })
    : null;

  changePasswordForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!changePasswordForm.checkValidity()) {
      changePasswordForm.classList.add("was-validated");
      renderStatusMessage(passwordStatus, {
        type: "warning",
        title: "Biểu mẫu đổi mật khẩu chưa hợp lệ",
        message: "Vui lòng kiểm tra lại mật khẩu hiện tại và mật khẩu mới."
      });
      return;
    }

    const data = new FormData(changePasswordForm);
    const currentPassword = String(data.get("current_password") || "");
    const newPassword = String(data.get("new_password") || "");
    const confirmPassword = String(data.get("confirm_password") || "");

    if (newPassword !== confirmPassword) {
      renderStatusMessage(passwordStatus, {
        type: "warning",
        title: "Mật khẩu mới chưa khớp",
        message: "Vui lòng nhập đúng trường xác nhận mật khẩu."
      });
      showToast("Xác nhận mật khẩu mới không khớp.", "warning");
      return;
    }

    const submitButton = changePasswordForm.querySelector('button[type="submit"]');
    clearStatusSlot(passwordStatus);

    try {
      await withPendingButton(submitButton, "Đang đổi mật khẩu...", () =>
        apiPut("/auth/change-password", {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      );

      renderStatusMessage(passwordStatus, {
        type: "success",
        title: "Đổi mật khẩu thành công",
        message: "Bạn sẽ được đăng xuất để đăng nhập lại bằng mật khẩu mới."
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
      renderStatusMessage(passwordStatus, {
        type: "danger",
        title: "Không thể đổi mật khẩu",
        message: error?.message || "Vui lòng thử lại sau."
      });
      showToast(error?.message || "Không thể đổi mật khẩu lúc này.", "danger");
    }
  });
}

export function initProviderBookingsPage(deps = {}) {
  const { db, getTourById, vnd, dateVN, statusBadge } = deps;
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
}

export function initProviderProfilePage(deps = {}) {
  const {
    db,
    apiPut,
    mapProviderFromApi,
    withProviderScopePayload,
    setActiveProviderId,
    showToast,
    ensureStatusSlot,
    renderStatusMessage,
    clearStatusSlot,
    withPendingButton
  } = deps;

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

      setActiveProviderId?.(String(mapped.id || ""));
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
}

export function initProviderTourFormPage(deps = {}) {
  const {
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
    showToast
  } = deps;

  const form = document.getElementById("providerTourForm");
  if (!form) return;
  const statusSlot = deps.ensureStatusSlot?.(form, { position: "before", className: "mb-3" });

  const draftButton = form.querySelector('button.btn-outline-primary[type="button"]');
  const fileInput = form.querySelector("#providerTourImageInput");
  const previewWrap = form.querySelector("#providerTourImagePreview");
  let submitMode = "publish";

  const parseDurationValue = (rawValue) => {
    const values = String(rawValue || "").match(/\d+/g) || [];
    const days = Math.max(1, Number(values[0] || 1));
    const nights = Math.max(0, Number(values[1] || Math.max(days - 1, 0)));
    return { days, nights };
  };

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
      deps.renderStatusMessage?.(statusSlot, {
        type: "warning",
        title: "Biểu mẫu tour chưa hợp lệ",
        message: "Vui lòng kiểm tra lại các trường bắt buộc trước khi lưu."
      });
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
    const submitButton = form.querySelector('button[type="submit"]');
    deps.clearStatusSlot?.(statusSlot);

    try {
      const response = await deps.withPendingButton?.(submitButton, isEditMode ? "Đang cập nhật tour..." : "Đang tạo tour...", () =>
        isEditMode ? apiPut(`/provider/tours/${editId}`, payload) : apiPost("/provider/tours", payload)
      ) ?? (isEditMode ? await apiPut(`/provider/tours/${editId}`, payload) : await apiPost("/provider/tours", payload));

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
      syncCategoriesFromTours?.();
      refreshAdminRows?.();

      deps.renderStatusMessage?.(statusSlot, {
        type: "success",
        title: isEditMode ? "Đã cập nhật tour" : "Đã tạo tour mới",
        message: "Dữ liệu tour đã được lưu và đồng bộ với danh sách."
      });
      showToast(isEditMode ? "Cập nhật tour thành công." : "Tạo tour mới thành công.");
      setTimeout(() => {
        window.location.href = routes.providerTours;
      }, 450);
    } catch (error) {
      deps.renderStatusMessage?.(statusSlot, {
        type: "danger",
        title: "Không thể lưu tour",
        message: error?.message || "Vui lòng thử lại sau."
      });
      showToast(error?.message || "Không thể lưu tour lúc này.", "danger");
    } finally {
      submitMode = "publish";
    }
  });
}

export function initProviderServicesPage(deps = {}) {
  const {
    db,
    activeProviderId,
    apiPost,
    withProviderScopePayload,
    vnd,
    showToast,
    ensureStatusSlot,
    renderStatusMessage,
    clearStatusSlot,
    withPendingButton
  } = deps;

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
    const price = Number(fields[2]?.value || 0);

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
      deps.renderCurrentPage?.();
      deps.initPageBehaviors?.();
    } catch (error) {
      renderStatusMessage(statusSlot, {
        type: "danger",
        title: "Không thể thêm dịch vụ",
        message: error?.message || "Vui lòng thử lại sau."
      });
      showToast(error?.message || "Không thể thêm dịch vụ lúc này.", "danger");
    }
  });
}

export function initProviderPromotionFormPage(deps = {}) {
  const {
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
  } = deps;

  const form = document.getElementById("providerPromotionPageForm");
  if (!form) return;
  const statusSlot = ensureStatusSlot(form, { position: "before", className: "mb-3" });

  const editId = Number(new URLSearchParams(window.location.search).get("id") || 0);
  const isEditMode = page === "provider-promotion-edit" && Number.isFinite(editId) && editId > 0;
  const imageInput = document.getElementById("providerPromotionImage");
  const imageFileInput = document.getElementById("providerPromotionImageFile");
  const imagePreview = document.getElementById("providerPromotionImagePreview");
  let imageObjectUrl = "";

  const toDateTime = (rawDate, endOfDay = false) => `${rawDate || todayISO()} ${endOfDay ? "23:59:59" : "00:00:00"}`;
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

        const rows = await apiGet("/provider/promotions", { limit: 100 });
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
}

export function initAdminTourFormPage(deps = {}) {
  const {
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
  } = deps;

  const form = document.getElementById("adminTourPageForm");
  if (!form) return;
  const statusSlot = ensureStatusSlot(form, { position: "before", className: "mb-3" });

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
      renderStatusMessage(statusSlot, {
        type: "warning",
        title: "Biểu mẫu tour chưa hợp lệ",
        message: "Vui lòng kiểm tra lại các trường bắt buộc trước khi lưu."
      });
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
      renderStatusMessage(statusSlot, {
        type: "warning",
        title: "Thiếu dữ liệu tour",
        message: "Tên tour, điểm đi, điểm đến và giá người lớn là bắt buộc."
      });
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
        // giữ fallback mặc định
      }
    }

    const uploadThumbnailFile = thumbnailFileInput?.files?.[0] || null;
    const uploadGalleryFiles = Array.from(galleryFileInput?.files || []);
    const existingThumbnail = String(currentTour?.image || "").trim();
    const totalUploadCount = (uploadThumbnailFile ? 1 : 0) + uploadGalleryFiles.length;

    if (totalUploadCount > 6) {
      renderStatusMessage(statusSlot, {
        type: "warning",
        title: "Quá số lượng ảnh",
        message: "Mỗi tour chỉ hỗ trợ tối đa 6 ảnh tải lên."
      });
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

    const submitButton = form.querySelector('button[type="submit"]');
    clearStatusSlot(statusSlot);

    try {
      const savedTour = await withPendingButton(submitButton, isEditMode ? "Đang cập nhật tour..." : "Đang tạo tour...", () =>
        isEditMode ? apiPut(`/admin/tours/${editId}`, payload) : apiPost("/admin/tours", payload)
      );

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
          if (providerId > 0) imageData.append("provider_id", String(providerId));
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
          status: item.status === "inactive" ? "Tạm dừng" : "Đang hoạt động"
        }));
      }

      syncCategoriesFromTours();
      refreshAdminRows();
      renderStatusMessage(statusSlot, {
        type: "success",
        title: isEditMode ? "Đã cập nhật tour" : "Đã tạo tour",
        message: "Dữ liệu tour đã được đồng bộ về danh sách quản trị."
      });
      showToast(isEditMode ? "Đã cập nhật tour." : "Đã tạo tour mới.");
      setTimeout(() => {
        window.location.href = routes.adminTours;
      }, 320);
    } catch (error) {
      renderStatusMessage(statusSlot, {
        type: "danger",
        title: "Không thể lưu tour",
        message: error?.message || "Vui lòng thử lại sau."
      });
      showToast(error?.message || "Không thể lưu tour lúc này.", "danger");
    }
  });
}

export function initAdminPostFormPage(deps = {}) {
  const {
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
  } = deps;

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
}

export function initAdminPromotionFormPage(deps = {}) {
  const {
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
  } = deps;

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
          code: code || undefined,
          image_url: uploadedImageUrl || imageUrlValue || null,
          description,
          discount_type: discountType,
          discount_value: discountValue,
          min_order_value: minOrderValue > 0 ? minOrderValue : null,
          usage_limit: usageLimit > 0 ? usageLimit : null,
          start_date: toDateTime(startDate),
          end_date: toDateTime(endDate, true),
          status
        };

        if (isEditMode) {
          delete payload.code;
          await apiPut(`/admin/promotions/${editId}`, payload);
        } else {
          await apiPost("/admin/promotions", payload);
        }

        const rows = await apiGet("/admin/promotions", { limit: 100 });
        if (Array.isArray(rows)) db.promotions = rows.map(mapPromotionFromApi);
      });

      renderStatusMessage(statusSlot, {
        type: "success",
        title: isEditMode ? "Đã cập nhật khuyến mãi" : "Đã tạo khuyến mãi",
        message: "Thông tin khuyến mãi đã được lưu thành công."
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
}
