/* Public Payment Module - MoMo/VNPay integration */
import { apiGet, apiPost } from '../../core/api.js';

function fmt(n) { return new Intl.NumberFormat('vi-VN').format(n || 0); }

function getBookingIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('booking_id') || params.get('id') || null;
}

async function loadBookingForPayment() {
  const bookingId = getBookingIdFromUrl();
  if (!bookingId) return;

  const summaryEl = document.getElementById('payment-summary');
  if (!summaryEl) return;

  try {
    const res = await apiGet(`/bookings/${bookingId}`);
    const b = res?.data || res || {};
    summaryEl.innerHTML = `
      <div class="panel-card p-3 mb-3">
        <h5 class="mb-3">Thanh toÃ¡n Ä‘Æ¡n #${b.booking_code || b.id}</h5>
        <div class="row g-2 mb-3">
          <div class="col-6"><span class="text-muted">Tour:</span><br><strong>${b.tour_title || '-'}</strong></div>
          <div class="col-6"><span class="text-muted">Sá»‘ khÃ¡ch:</span><br><strong>${b.guests || b.num_guests || 0}</strong></div>
          <div class="col-6"><span class="text-muted">NgÃ y Ä‘i:</span><br><strong>${b.departure_date || '-'}</strong></div>
          <div class="col-6"><span class="text-muted">Tá»•ng tiá»n:</span><br><strong class="text-primary fs-5">${fmt(b.total_amount)} â‚«</strong></div>
        </div>
        ${b.discount_amount > 0 ? `<div class="alert alert-success py-2"><i class="bi bi-tag"></i> Giáº£m giÃ¡: -${fmt(b.discount_amount)} â‚«</div>` : ''}
      </div>
    `;
    window.__currentBooking = b;
  } catch (e) {
    summaryEl.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
  }
}

async function processPayment(method) {
  const bookingId = getBookingIdFromUrl();
  if (!bookingId) { alert('KhÃ´ng tÃ¬m tháº¥y booking.'); return; }

  const btn = document.querySelector(`[data-method="${method}"]`);
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Äang xá»­ lÃ½...'; }

  try {
    const res = await apiPost(`/bookings/${bookingId}/payment`, {
      payment_method: method,
    });
    const data = res?.data || res || {};

    if (data.payment_url || data.redirect_url) {
      window.location.href = data.payment_url || data.redirect_url;
    } else {
      window.location.href = `booking-detail.html?id=${bookingId}&payment=success`;
    }
  } catch (e) {
    alert('Lá»—i thanh toÃ¡n: ' + e.message);
    if (btn) { btn.disabled = false; btn.innerHTML = getMethodLabel(method); }
  }
}

function getMethodLabel(m) {
  const labels = { momo: '<i class="bi bi-phone"></i> MoMo', vnpay: '<i class="bi bi-credit-card"></i> VNPay', bank_transfer: '<i class="bi bi-bank"></i> Chuyá»ƒn khoáº£n' };
  return labels[m] || m;
}

function handlePaymentReturn() {
  const params = new URLSearchParams(window.location.search);
  const resultEl = document.getElementById('payment-result');
  if (!resultEl) return;

  if (params.get('resultCode') === '0' || params.get('vnp_ResponseCode') === '00' || params.get('payment') === 'success') {
    resultEl.innerHTML = `
      <div class="text-center py-5">
        <div class="mb-3"><i class="bi bi-check-circle-fill text-success" style="font-size:4rem;"></i></div>
        <h3 class="text-success">Thanh toÃ¡n thÃ nh cÃ´ng!</h3>
        <p class="text-muted">ÄÆ¡n hÃ ng Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c nháº­n. Báº¡n sáº½ nháº­n email xÃ¡c nháº­n.</p>
        <a href="booking-history.html" class="btn btn-primary mt-2">Xem Ä‘Æ¡n hÃ ng</a>
      </div>
    `;
  } else if (params.has('resultCode') || params.has('vnp_ResponseCode')) {
    resultEl.innerHTML = `
      <div class="text-center py-5">
        <div class="mb-3"><i class="bi bi-x-circle-fill text-danger" style="font-size:4rem;"></i></div>
        <h3 class="text-danger">Thanh toÃ¡n tháº¥t báº¡i</h3>
        <p class="text-muted">Giao dá»‹ch khÃ´ng thÃ nh cÃ´ng. Vui lÃ²ng thá»­ láº¡i.</p>
        <button class="btn btn-primary mt-2" onclick="history.back()">Quay láº¡i</button>
      </div>
    `;
  }
}

export function initPaymentPage() {
  loadBookingForPayment();
  handlePaymentReturn();

  document.querySelectorAll('[data-method]').forEach(btn => {
    btn.addEventListener('click', () => processPayment(btn.dataset.method));
  });

  // Promo code
  const promoBtn = document.getElementById('apply-promo-btn');
  const promoInput = document.getElementById('promo-code-input');
  if (promoBtn && promoInput) {
    promoBtn.addEventListener('click', async () => {
      const code = promoInput.value.trim();
      if (!code) return;
      try {
        const bookingId = getBookingIdFromUrl();
        await apiPost(`/bookings/${bookingId}/apply-promotion`, { promotion_code: code });
        loadBookingForPayment();
      } catch (e) { alert(e.message); }
    });
  }
}
