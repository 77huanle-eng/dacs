export function initAuthPages(deps = {}) {
  const {
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
  } = deps;

  const bindFormStatus = (form, position = "before") => {
    if (!form || !ensureStatusSlot) return null;
    return ensureStatusSlot(form, { position, className: "mb-3" });
  };

  const loginForm = document.getElementById("loginForm");
  const loginStatus = bindFormStatus(loginForm);
  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!loginForm.checkValidity()) {
      loginForm.classList.add("was-validated");
      if (loginStatus) {
        renderStatusMessage(loginStatus, {
          type: "warning",
          title: "Biểu mẫu đăng nhập chưa hợp lệ",
          message: "Vui lòng kiểm tra lại email và mật khẩu."
        });
      }
      return;
    }

    const email = loginForm.querySelector('input[type="email"]')?.value?.trim() || "";
    const password = loginForm.querySelector("[data-password-input]")?.value || "";
    const submitButton = loginForm.querySelector('button[type="submit"]');
    clearStatusSlot?.(loginStatus);

    try {
      const auth = await withPendingButton(submitButton, "Đang đăng nhập...", () => loginWithApi({ email, password }));
      renderStatusMessage?.(loginStatus, {
        type: "success",
        title: "Đăng nhập thành công",
        message: "Đang chuyển đến khu vực phù hợp với tài khoản của bạn."
      });
      showToast?.("Đăng nhập thành công.");

      const query = new URLSearchParams(window.location.search);
      const next = query.get("next");
      if (next && !next.includes("login.html") && !next.includes("register.html")) {
        window.location.href = decodeURIComponent(next);
        return;
      }

      const role = String(auth?.user?.role || getCurrentRole?.() || "user").toLowerCase();
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
      const message = error?.message || "Không thể đăng nhập lúc này.";
      renderStatusMessage?.(loginStatus, {
        type: "danger",
        title: "Đăng nhập thất bại",
        message
      });
      showToast?.(message, "danger");
    }
  });

  const registerForm = document.getElementById("registerForm");
  const registerStatus = bindFormStatus(registerForm);
  registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!registerForm.checkValidity()) {
      registerForm.classList.add("was-validated");
      renderStatusMessage?.(registerStatus, {
        type: "warning",
        title: "Biểu mẫu đăng ký chưa hợp lệ",
        message: "Vui lòng điền đầy đủ thông tin bắt buộc."
      });
      return;
    }

    const fullName = registerForm.querySelectorAll("input")[0]?.value?.trim() || "";
    const phone = registerForm.querySelectorAll("input")[1]?.value?.trim() || "";
    const email = registerForm.querySelector('input[type="email"]')?.value?.trim() || "";
    const password = registerForm.querySelectorAll('input[data-password-input], input[type="password"]')[0]?.value || "";
    const confirmPassword = registerForm.querySelectorAll('input[type="password"]')[1]?.value || "";

    if (password !== confirmPassword) {
      renderStatusMessage?.(registerStatus, {
        type: "warning",
        title: "Mật khẩu chưa khớp",
        message: "Mật khẩu xác nhận không trùng với mật khẩu mới."
      });
      showToast?.("Mật khẩu xác nhận không khớp.", "warning");
      return;
    }

    const submitButton = registerForm.querySelector('button[type="submit"]');
    clearStatusSlot?.(registerStatus);

    try {
      await withPendingButton(submitButton, "Đang tạo tài khoản...", () =>
        registerWithApi({ full_name: fullName, phone, email, password })
      );

      renderStatusMessage?.(registerStatus, {
        type: "success",
        title: "Đăng ký thành công",
        message: "Tài khoản đã được tạo và hệ thống đang chuyển hướng."
      });
      showToast?.("Đăng ký thành công. Bạn đã được đăng nhập.");
      setTimeout(() => {
        window.location.href = routes.home;
      }, 500);
    } catch (error) {
      const message = error?.message || "Không thể đăng ký lúc này.";
      renderStatusMessage?.(registerStatus, {
        type: "danger",
        title: "Đăng ký thất bại",
        message
      });
      showToast?.(message, "danger");
    }
  });

  const forgotForm = document.getElementById("forgotForm");
  const forgotStatus = bindFormStatus(forgotForm);
  forgotForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const devNotice = document.getElementById("forgotPasswordDevNotice");
    if (devNotice) devNotice.innerHTML = "";

    if (!forgotForm.checkValidity()) {
      forgotForm.classList.add("was-validated");
      renderStatusMessage?.(forgotStatus, {
        type: "warning",
        title: "Email chưa hợp lệ",
        message: "Vui lòng nhập email đúng định dạng để tiếp tục."
      });
      return;
    }

    const email = forgotForm.querySelector('input[type="email"]')?.value?.trim() || "";
    const submitButton = forgotForm.querySelector('button[type="submit"]');
    clearStatusSlot?.(forgotStatus);

    try {
      const response = await withPendingButton(submitButton, "Đang gửi yêu cầu...", () => forgotPasswordWithApi(email));
      if (response?.preview_available && response?.reset_link_preview && devNotice) {
        devNotice.innerHTML = `
          <div class="alert alert-warning mb-0">
            <div class="fw-semibold mb-1">Email reset đang ở chế độ dev/log.</div>
            <div class="small mb-2">${response?.delivery_message || "Mail server chưa gửi thật. Bạn có thể dùng liên kết preview bên dưới để tiếp tục kiểm thử luồng đặt lại mật khẩu."}</div>
            <a class="btn btn-sm btn-outline-primary" href="${response.reset_link_preview}">Mở liên kết đặt lại mật khẩu</a>
          </div>
        `;
        renderStatusMessage?.(forgotStatus, {
          type: "info",
          title: "Đã tạo liên kết preview",
          message: response?.delivery_message || "Môi trường hiện tại đang dùng chế độ preview mail."
        });
        showToast?.("Yêu cầu đã được ghi nhận. Hệ thống đang cung cấp preview link cho môi trường dev.", "info");
      } else if (response?.sent === false) {
        renderStatusMessage?.(forgotStatus, {
          type: "warning",
          title: "Chưa gửi được email",
          message: "Vui lòng kiểm tra cấu hình mail server hoặc thử lại sau."
        });
        showToast?.("Chưa gửi được email lúc này. Vui lòng kiểm tra cấu hình mail server.", "warning");
      } else {
        renderStatusMessage?.(forgotStatus, {
          type: "success",
          title: "Yêu cầu đã được tiếp nhận",
          message: "Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu sẽ được gửi."
        });
        showToast?.("Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi.", "info");
        forgotForm.reset();
      }
    } catch (error) {
      const message = error?.message || "Không thể gửi yêu cầu lúc này.";
      renderStatusMessage?.(forgotStatus, {
        type: "danger",
        title: "Không thể gửi yêu cầu",
        message
      });
      showToast?.(message, "danger");
    }
  });

  const resetPasswordForm = document.getElementById("resetPasswordForm");
  const resetStatus = bindFormStatus(resetPasswordForm);
  resetPasswordForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!resetPasswordForm.checkValidity()) {
      resetPasswordForm.classList.add("was-validated");
      renderStatusMessage?.(resetStatus, {
        type: "warning",
        title: "Biểu mẫu đặt lại mật khẩu chưa hợp lệ",
        message: "Vui lòng kiểm tra lại các trường mật khẩu."
      });
      return;
    }

    const query = new URLSearchParams(window.location.search);
    const email = query.get("email") || "";
    const token = query.get("token") || "";
    const password = resetPasswordForm.querySelectorAll('input[type="password"]')[0]?.value || "";
    const confirmPassword = resetPasswordForm.querySelectorAll('input[type="password"]')[1]?.value || "";

    if (password !== confirmPassword) {
      renderStatusMessage?.(resetStatus, {
        type: "warning",
        title: "Mật khẩu xác nhận chưa khớp",
        message: "Vui lòng nhập lại xác nhận mật khẩu."
      });
      showToast?.("Mật khẩu xác nhận không khớp.", "warning");
      return;
    }

    const submitButton = resetPasswordForm.querySelector('button[type="submit"]');
    clearStatusSlot?.(resetStatus);

    try {
      await withPendingButton(submitButton, "Đang cập nhật mật khẩu...", () =>
        apiPost("/auth/reset-password", { email, token, password })
      );

      renderStatusMessage?.(resetStatus, {
        type: "success",
        title: "Đặt lại mật khẩu thành công",
        message: "Bạn sẽ được chuyển về trang đăng nhập."
      });
      showToast?.("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.");
      setTimeout(() => {
        window.location.href = routes.login;
      }, 700);
    } catch (error) {
      const message = error?.message || "Không thể đặt lại mật khẩu lúc này.";
      renderStatusMessage?.(resetStatus, {
        type: "danger",
        title: "Đặt lại mật khẩu thất bại",
        message
      });
      showToast?.(message, "danger");
    }
  });
}
