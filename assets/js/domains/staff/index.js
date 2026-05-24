/* Staff Domain Index */
import { DOMAIN_PAGES } from '../../core/constants.js';
import { initStaffCheckinPage } from './checkin.js';

export function initStaffDomain(page) {
  if (!DOMAIN_PAGES.staff || !DOMAIN_PAGES.staff.has(page)) {
    if (page !== 'staff-checkin') return false;
  }
  initStaffCheckinPage();
  return true;
}
