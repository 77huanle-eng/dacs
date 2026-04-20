let initialized = false;

function mountReviewHints() {
  if (document.body?.dataset?.page !== "tour-detail") return;

  const reviewTab = document.getElementById("tabReview");
  if (!reviewTab) return;

  const ownReviewButtons = reviewTab.querySelectorAll('[data-action="user-review-edit"], [data-action="user-review-delete"]');
  ownReviewButtons.forEach((button) => {
    const article = button.closest("article");
    if (article) {
      article.classList.add("border-primary-subtle", "bg-primary-subtle");
    }
  });

  reviewTab.querySelector("[data-vht-review-hint]")?.remove();
  if (!ownReviewButtons.length) return;

  const hint = document.createElement("div");
  hint.className = "alert alert-info d-flex align-items-center gap-2";
  hint.setAttribute("data-vht-review-hint", "1");
  hint.innerHTML = `
    <i class="bi bi-info-circle"></i>
    <div>Bạn có thể chỉnh sửa hoặc xóa đánh giá của chính mình trực tiếp trong danh sách bên dưới.</div>
  `;

  reviewTab.prepend(hint);
}

export function initCommentsRatingsModule() {
  if (initialized) return;
  initialized = true;

  window.addEventListener("vht:page-mounted", () => {
    mountReviewHints();
  });
}
