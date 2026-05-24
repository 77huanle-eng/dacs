/* Admin Payments Module */
import { apiGet } from '../../core/api.js';

function fmt(n) { return new Intl.NumberFormat('vi-VN').format(n || 0); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') + ' ' + new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'; }
function statusBadge(s) {
  const map = { paid: 'success', pending: 'warning', failed: 'danger', refunded: 'info', completed: 'success' };
  return `<span class="status-badge status-${map[s] || 'info'}">${s}</span>`;
}

async function loadPayments(page = 1, filters = {}) {
  const tbody = document.getElementById('payments-tbody');
  if (!tbody) return;
  try {
    const qs = new URLSearchParams({ page, limit: 15, ...filters }).toString();
    const res = await apiGet(`/admin/payments?${qs}`);
    const d = res?.data || res || {};
    const items = d.data || (Array.isArray(d) ? d : []);
    tbody.innerHTML = items.length ? items.map(p => `
      <tr>
        <td>${p.id}</td>
        <td>${p.booking_code || p.booking_id || '-'}</td>
        <td>${p.method || '-'}</td>
        <td class="fw-bold">${fmt(p.amount)} â‚«</td>
        <td>${p.transaction_code || '-'}</td>
        <td>${statusBadge(p.status)}</td>
        <td>${fmtDate(p.created_at)}</td>
        <td>
          <a href="admin-payments.html?id=${p.id}" class="btn btn-sm btn-outline-primary"><i class="bi bi-eye"></i></a>
        </td>
      </tr>
    `).join('') : '<tr><td colspan="8" class="text-center text-muted py-4">KhÃ´ng cÃ³ dá»¯ liá»‡u</td></tr>';

    // Pagination
    const pag = document.getElementById('payments-pagination');
    if (pag && d.last_page > 1) {
      let html = '';
      for (let i = 1; i <= d.last_page; i++) {
        html += `<button class="page-btn ${i === (d.current_page || page) ? 'active' : ''}" data-p="${i}">${i}</button>`;
      }
      pag.innerHTML = html;
      pag.querySelectorAll('.page-btn').forEach(btn => btn.addEventListener('click', () => loadPayments(+btn.dataset.p, filters)));
    }
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-danger">${e.message}</td></tr>`;
  }
}

async function loadPaymentDetail() {
  const el = document.getElementById('payment-detail');
  if (!el) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { el.innerHTML = '<p class="text-muted">KhÃ´ng tÃ¬m tháº¥y payment.</p>'; return; }
  try {
    const res = await apiGet(`/admin/payments/${id}`);
    const p = res?.data || res || {};
    el.innerHTML = `
      <div class="panel-card p-3">
        <h5>Payment #${p.id}</h5>
        <div class="row g-3">
          <div class="col-md-6"><strong>Booking:</strong> ${p.booking_code || p.booking_id}</div>
          <div class="col-md-6"><strong>PhÆ°Æ¡ng thá»©c:</strong> ${p.method}</div>
          <div class="col-md-6"><strong>Sá»‘ tiá»n:</strong> ${fmt(p.amount)} â‚«</div>
          <div class="col-md-6"><strong>Tráº¡ng thÃ¡i:</strong> ${statusBadge(p.status)}</div>
          <div class="col-md-6"><strong>MÃ£ GD:</strong> ${p.transaction_code || '-'}</div>
          <div class="col-md-6"><strong>NgÃ y:</strong> ${fmtDate(p.created_at)}</div>
        </div>
      </div>
    `;
  } catch (e) { el.innerHTML = `<p class="text-danger">${e.message}</p>`; }
}

export function initAdminPayments() {
  loadPayments();
  loadPaymentDetail();

  const statusFilter = document.getElementById('payment-status-filter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => loadPayments(1, { status: statusFilter.value }));
  }

  const searchInput = document.getElementById('payment-search');
  if (searchInput) {
    let timer;
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => loadPayments(1, { search: searchInput.value }), 500);
    });
  }
}
