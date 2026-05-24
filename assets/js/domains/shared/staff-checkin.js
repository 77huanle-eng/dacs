/* Staff Check-in Module - QR scan and ticket verification */
import { apiGet } from '../../core/api.js';

function fmtDate(d) { return d ? new Date(d).toLocaleString('vi-VN') : '-'; }

async function verifyTicket(token) {
  const resultEl = document.getElementById('checkin-result');
  if (!resultEl || !token) return;

  resultEl.classList.remove('d-none');
  resultEl.innerHTML = '<div class="text-center py-3"><span class="spinner-border spinner-border-sm"></span> Äang xÃ¡c minh...</div>';

  try {
    const res = await apiGet(`/tickets/verify?token=${encodeURIComponent(token)}`);
    const t = res?.data || res || {};

    const isValid = t.is_valid || t.status === 'active';
    const isCheckedIn = t.is_checked_in || t.status === 'checked_in';

    if (isCheckedIn) {
      resultEl.innerHTML = `
        <div class="alert alert-warning">
          <i class="bi bi-exclamation-triangle-fill"></i> <strong>ÄÃ£ check-in trÆ°á»›c Ä‘Ã³</strong>
          <p class="mb-0 mt-1">VÃ© nÃ y Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng.</p>
        </div>`;
    } else if (isValid) {
      resultEl.innerHTML = `
        <div class="alert alert-success">
          <i class="bi bi-check-circle-fill"></i> <strong>VÃ© há»£p lá»‡!</strong>
          <div class="mt-2">
            <p class="mb-1"><strong>MÃ£ vÃ©:</strong> ${t.ticket_token || t.id}</p>
            <p class="mb-1"><strong>Booking:</strong> #${t.booking_id || '-'}</p>
            <p class="mb-0"><strong>Tráº¡ng thÃ¡i:</strong> ${t.status}</p>
          </div>
        </div>`;
      addToHistory(t);
    } else {
      resultEl.innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-x-circle-fill"></i> <strong>VÃ© khÃ´ng há»£p lá»‡</strong>
          <p class="mb-0 mt-1">Token: ${token}</p>
        </div>`;
    }
  } catch (e) {
    resultEl.innerHTML = `<div class="alert alert-danger"><i class="bi bi-x-circle-fill"></i> ${e.message}</div>`;
  }
}

function addToHistory(ticket) {
  const historyEl = document.getElementById('checkin-history');
  if (!historyEl) return;
  const item = document.createElement('div');
  item.className = 'activity-item';
  item.innerHTML = `
    <div class="activity-dot success"></div>
    <div>
      <strong>Booking #${ticket.booking_id || '-'}</strong>
      <div class="text-muted small">${fmtDate(new Date())}</div>
    </div>
  `;
  historyEl.prepend(item);
}

export function initStaffCheckin() {
  // URL param check (from QR scan redirect)
  const params = new URLSearchParams(window.location.search);
  const tokenParam = params.get('token');
  if (tokenParam) {
    const input = document.getElementById('ticket-token');
    if (input) input.value = tokenParam;
    verifyTicket(tokenParam);
  }

  // Manual verify button
  const verifyBtn = document.getElementById('verify-btn');
  if (verifyBtn) {
    verifyBtn.addEventListener('click', () => {
      const input = document.getElementById('ticket-token');
      if (input?.value.trim()) verifyTicket(input.value.trim());
    });
  }

  // Enter key
  const input = document.getElementById('ticket-token');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') verifyTicket(input.value.trim());
    });
  }
}
