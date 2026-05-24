/* Admin Dashboard Page - KPIs, charts, recent activity */
import { apiGet } from '../../core/api.js';

function fmt(n) { return new Intl.NumberFormat('vi-VN').format(n || 0); }
function fmtVnd(n) { return fmt(n) + ' â‚«'; }

export async function initDashboardPage() {
  const el = (id) => document.getElementById(id);
  if (!el('kpi-revenue') && !el('dashboard-kpis')) return;

  try {
    const stats = await apiGet('/admin/dashboard');
    const d = stats?.data || stats || {};

    if (el('kpi-revenue')) el('kpi-revenue').textContent = fmtVnd(d.total_revenue);
    if (el('kpi-bookings')) el('kpi-bookings').textContent = fmt(d.total_bookings);
    if (el('kpi-users')) el('kpi-users').textContent = fmt(d.total_users);
    if (el('kpi-tours')) el('kpi-tours').textContent = fmt(d.total_tours);
    if (el('kpi-providers')) el('kpi-providers').textContent = fmt(d.total_providers);
    if (el('kpi-pending')) el('kpi-pending').textContent = fmt(d.pending_bookings);

    // Recent bookings
    if (d.recent_bookings && el('recent-bookings-tbody')) {
      el('recent-bookings-tbody').innerHTML = d.recent_bookings.slice(0, 8).map(b => `
        <tr>
          <td><strong>${b.booking_code || '#' + b.id}</strong></td>
          <td>${b.customer_name || b.full_name || '-'}</td>
          <td>${fmtVnd(b.total_amount)}</td>
          <td><span class="status-badge status-${b.status === 'confirmed' ? 'success' : b.status === 'pending' ? 'warning' : 'info'}">${b.status}</span></td>
          <td>${new Date(b.created_at).toLocaleDateString('vi-VN')}</td>
        </tr>
      `).join('');
    }

    // Revenue chart placeholder
    if (d.monthly_revenue && el('revenue-chart')) {
      el('revenue-chart').innerHTML = '<p class="text-muted text-center py-4"><i class="bi bi-bar-chart"></i> Revenue chart data ready</p>';
    }
  } catch (e) {
    console.warn('[Dashboard]', e.message);
  }
}
