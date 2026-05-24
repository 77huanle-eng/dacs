/* Provider Extended Modules - payouts, refunds */
import { apiGet } from '../../core/api.js';

function fmt(n) { return new Intl.NumberFormat('vi-VN').format(n || 0); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '-'; }
function statusBadge(s) {
  const map = { pending: 'warning', completed: 'success', rejected: 'danger', approved: 'success', processed: 'info' };
  return `<span class="status-badge status-${map[s] || 'info'}">${s}</span>`;
}

async function initProviderPayouts() {
  const revenueEl = document.getElementById('pending-revenue');
  const tbody = document.getElementById('my-payouts-tbody');
  if (!revenueEl && !tbody) return;

  try {
    if (revenueEl) {
      const rev = await apiGet('/provider/payouts/pending-revenue');
      const pending = rev?.data?.pending || rev?.pending || 0;
      revenueEl.textContent = fmt(pending) + ' â‚«';
    }
    if (tbody) {
      const res = await apiGet('/provider/payouts?limit=20');
      const items = res?.data?.data || res?.data || [];
      tbody.innerHTML = items.length ? items.map(p => `
        <tr>
          <td>${p.id}</td>
          <td class="fw-bold">${fmt(p.amount)} â‚«</td>
          <td>${statusBadge(p.status)}</td>
          <td>${p.notes || '-'}</td>
          <td>${fmtDate(p.created_at)}</td>
        </tr>
      `).join('') : '<tr><td colspan="5" class="text-center text-muted py-3">ChÆ°a cÃ³ lá»‹ch sá»­</td></tr>';
    }
  } catch (e) { console.warn('[ProviderPayouts]', e); }
}

async function initProviderRefunds() {
  const tbody = document.getElementById('prov-refunds-tbody');
  if (!tbody) return;
  try {
    const res = await apiGet('/provider/refunds');
    const items = res?.data || (Array.isArray(res) ? res : []);
    tbody.innerHTML = items.length ? items.map(r => `
      <tr>
        <td>${r.id}</td>
        <td>${r.booking_code || r.booking_id || '-'}</td>
        <td>${r.customer_name || '-'}</td>
        <td class="text-truncate" style="max-width:180px">${r.reason || '-'}</td>
        <td>${statusBadge(r.status)}</td>
        <td>${fmtDate(r.created_at)}</td>
      </tr>
    `).join('') : '<tr><td colspan="6" class="text-center text-muted py-3">KhÃ´ng cÃ³ yÃªu cáº§u hoÃ n tiá»n</td></tr>';
  } catch (e) { console.warn('[ProviderRefunds]', e); }
}

export function initProviderExtendedModules() {
  initProviderPayouts();
  initProviderRefunds();
}
