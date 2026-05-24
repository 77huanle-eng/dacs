/* Extended Admin Modules - audit-logs, contacts, departures, payouts, refunds */
import { apiGet, apiPost, apiPut } from '../../core/api.js';

function fmt(n) { return new Intl.NumberFormat('vi-VN').format(n || 0); }

async function loadTable(endpoint, tbodyId, paginationId, rowRenderer, page = 1, params = {}) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  try {
    const qs = new URLSearchParams({ page, limit: 15, ...params }).toString();
    const res = await apiGet(`${endpoint}?${qs}`);
    const d = res?.data || res || {};
    const items = d.data || d.items || (Array.isArray(d) ? d : []);
    tbody.innerHTML = items.length ? items.map(rowRenderer).join('') : '<tr><td colspan="10" class="text-center text-muted py-4">KhÃ´ng cÃ³ dá»¯ liá»‡u</td></tr>';
    renderPagination(paginationId, d.current_page || page, d.last_page || 1, (p) => loadTable(endpoint, tbodyId, paginationId, rowRenderer, p, params));
  } catch (e) { tbody.innerHTML = `<tr><td colspan="10" class="text-danger">${e.message}</td></tr>`; }
}

function renderPagination(containerId, current, total, onPageChange) {
  const el = document.getElementById(containerId);
  if (!el || total <= 1) { if (el) el.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= total; i++) {
    html += `<button class="page-btn ${i === current ? 'active' : ''}" data-p="${i}">${i}</button>`;
  }
  el.innerHTML = html;
  el.querySelectorAll('.page-btn').forEach(btn => btn.addEventListener('click', () => onPageChange(+btn.dataset.p)));
}

function fmtDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '-'; }
function statusBadge(s) {
  const map = { pending: 'warning', completed: 'success', approved: 'success', rejected: 'danger', processed: 'info', open: 'info', resolved: 'success' };
  return `<span class="status-badge status-${map[s] || 'info'}">${s}</span>`;
}

export function initAuditLogs() {
  if (!document.getElementById('audit-tbody')) return;
  loadTable('/admin/audit-logs', 'audit-tbody', 'audit-pagination', r => `
    <tr><td>${r.id}</td><td>${r.full_name || r.user_id || '-'}</td><td>${r.action}</td><td>${r.entity_type || '-'}#${r.entity_id || ''}</td><td>${r.ip_address || '-'}</td><td>${fmtDate(r.created_at)}</td></tr>
  `);
}

export function initContacts() {
  if (!document.getElementById('contacts-tbody')) return;
  loadTable('/admin/contacts', 'contacts-tbody', 'contacts-pagination', r => `
    <tr><td>${r.id}</td><td>${r.full_name || r.name || '-'}</td><td>${r.email || '-'}</td><td class="text-truncate" style="max-width:200px">${r.message || r.content || '-'}</td><td>${fmtDate(r.created_at)}</td><td>-</td></tr>
  `);
}

export function initDepartures() {
  if (!document.getElementById('departures-tbody')) return;
  loadTable('/admin/departures', 'departures-tbody', 'departures-pagination', r => `
    <tr><td>${r.id}</td><td>${r.tour_title || '-'}</td><td>${fmtDate(r.departure_date)}</td><td>${fmtDate(r.return_date)}</td><td>${r.current_guests || 0}/${r.max_guests || 0}</td><td>${statusBadge(r.status)}</td></tr>
  `);
}

export function initPayouts() {
  if (!document.getElementById('payouts-tbody')) return;
  loadTable('/admin/payouts', 'payouts-tbody', 'payouts-pagination', r => `
    <tr><td>${r.id}</td><td>${r.provider_name || r.provider_id}</td><td>${fmt(r.amount)} â‚«</td><td>${statusBadge(r.status)}</td><td>${fmtDate(r.created_at)}</td>
    <td><div class="d-flex gap-1">
      ${r.status === 'pending' ? `<button class="btn btn-sm btn-outline-success" onclick="window.__adminPayout('complete',${r.id})"><i class="bi bi-check-lg"></i></button><button class="btn btn-sm btn-outline-danger" onclick="window.__adminPayout('reject',${r.id})"><i class="bi bi-x-lg"></i></button>` : '-'}
    </div></td></tr>
  `);

  window.__adminPayout = async (action, id) => {
    try {
      await apiPut(`/admin/payouts/${id}/${action}`);
      initPayouts();
    } catch (e) { alert(e.message); }
  };

  const submitBtn = document.getElementById('payout-submit');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      try {
        await apiPost('/admin/payouts', {
          provider_id: +document.getElementById('payout-provider-id').value,
          amount: +document.getElementById('payout-amount').value,
          notes: document.getElementById('payout-notes').value,
        });
        bootstrap.Modal.getInstance(document.getElementById('createPayoutModal'))?.hide();
        initPayouts();
      } catch (e) { alert(e.message); }
    });
  }
}

export function initRefunds() {
  if (!document.getElementById('refunds-tbody')) return;
  loadTable('/admin/refunds', 'refunds-tbody', 'refunds-pagination', r => `
    <tr><td>${r.id}</td><td>${r.booking_code || r.booking_id}</td><td>${r.full_name || '-'}</td><td class="text-truncate" style="max-width:150px">${r.reason || '-'}</td><td>${statusBadge(r.status)}</td><td>${fmtDate(r.created_at)}</td>
    <td><div class="d-flex gap-1">
      ${r.status === 'pending' ? `<button class="btn btn-sm btn-outline-success" onclick="window.__adminRefund('approve',${r.id})">Duyá»‡t</button><button class="btn btn-sm btn-outline-danger" onclick="window.__adminRefund('reject',${r.id})">Tá»« chá»‘i</button>` : r.status === 'approved' ? `<button class="btn btn-sm btn-outline-primary" onclick="window.__adminRefund('process',${r.id})">Xá»­ lÃ½</button>` : '-'}
    </div></td></tr>
  `);

  window.__adminRefund = async (action, id) => {
    try {
      const body = action === 'process' ? { refund_amount: prompt('Nháº­p sá»‘ tiá»n hoÃ n:') } : action === 'reject' ? { reason: prompt('LÃ½ do tá»« chá»‘i:') } : {};
      await apiPut(`/admin/refunds/${id}/${action}`, body);
      initRefunds();
    } catch (e) { alert(e.message); }
  };
}

export function initExtendedModules() {
  initAuditLogs();
  initContacts();
  initDepartures();
  initPayouts();
  initRefunds();
}
