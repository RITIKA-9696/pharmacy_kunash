// dashboard.js - Fully Dynamic Dashboard with Real API Data + All Fixes

const API_BASE_URL = 'http://localhost:8083';

// Global data storage for filters & notifications
let allPrescriptions = [];
let allLowStock = [];
let allTopSelling = [];
let expiryData = null;

// ── USER PROFILE ─────────────────────────────────────────────────────────────
function displayUserProfile() {
  const admin = Auth.getCurrentAdmin();
  const userInitials = document.getElementById('user-initials');
  const userName = document.getElementById('user-name');
  const userRole = document.getElementById('user-role');

  if (!admin || !admin.firstName) {
    userName.textContent = "Guest";
    userRole.textContent = "Unknown";
    userInitials.textContent = "??";
    return;
  }

  const fullName = `${admin.firstName} ${admin.lastName || ''}`.trim();
  const role = `${admin.role}`;
  
  const nameParts = fullName.trim().split(' ');
  const initials = nameParts.length > 1
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
    : (nameParts[0]?.[0] || '?');

  userInitials.textContent = initials.toUpperCase();
  userName.textContent = fullName;
  userRole.textContent = role;
}

document.addEventListener("DOMContentLoaded", () => {
  displayUserProfile();
  initializeSidebar();
  loadAllDashboardData();

  // Attach reset buttons listeners
  document.getElementById('reset-prescriptions')?.addEventListener('click', resetPrescriptionsFilter);
  document.getElementById('reset-lowstock')?.addEventListener('click', resetLowStockFilter);
  document.getElementById('reset-topselling')?.addEventListener('click', resetTopSellingFilter);
});

// ── SIDEBAR TOGGLE ───────────────────────────────────────────────────────────
const toggleSidebarLogo = document.getElementById('toggle-sidebar-logo');
const sidebar = document.getElementById('sidebar');
const sidebarArrow = document.getElementById('sidebar-arrow');
const toggleSidebarMobile = document.getElementById('toggle-sidebar-mobile');
const closeSidebar = document.getElementById('close-sidebar');

toggleSidebarLogo?.removeEventListener('click', toggleSidebar);
toggleSidebarLogo?.addEventListener('click', toggleSidebar);

function toggleSidebar() {
  if (window.innerWidth < 768) {
    sidebar.classList.toggle('-translate-x-full');
  } else {
    sidebar.classList.toggle('collapsed');

    if (sidebar.classList.contains('collapsed')) {
      sidebarArrow.classList.remove('fa-chevron-left');
      sidebarArrow.classList.add('fa-chevron-right');

      document.querySelectorAll('.nav-text').forEach((text, index) => {
        text.classList.add('opacity-0', 'w-0');
        text.style.transitionDelay = `${index * 20}ms`;
      });

      document.querySelectorAll('.nav-icon').forEach(icon => {
        icon.classList.remove('mr-3');
        icon.classList.add('mx-auto');
      });
    } else {
      sidebarArrow.classList.remove('fa-chevron-right');
      sidebarArrow.classList.add('fa-chevron-left');

      document.querySelectorAll('.nav-text').forEach((text, index) => {
        text.classList.remove('opacity-0', 'w-0');
        text.style.transitionDelay = `${index * 20}ms`;
      });

      document.querySelectorAll('.nav-icon').forEach(icon => {
        icon.classList.remove('mx-auto');
        icon.classList.add('mr-3');
      });
    }
  }
}

function initializeSidebar() {
  if (window.innerWidth >= 768) {
    sidebar.classList.remove('collapsed');
    sidebarArrow.classList.remove('fa-chevron-right');
    sidebarArrow.classList.add('fa-chevron-left');

    document.querySelectorAll('.nav-text').forEach(text => {
      text.classList.remove('opacity-0', 'w-0');
    });
    document.querySelectorAll('.nav-icon').forEach(icon => {
      icon.classList.add('mr-3');
      icon.classList.remove('mx-auto');
    });
  } else {
    sidebar.classList.add('-translate-x-full');
  }
}

toggleSidebarMobile?.addEventListener('click', () => {
  sidebar.classList.remove('-translate-x-full');
});

closeSidebar?.addEventListener('click', () => {
  sidebar.classList.add('-translate-x-full');
});

document.addEventListener('click', (e) => {
  if (window.innerWidth < 768 &&
      !sidebar.classList.contains('-translate-x-full') &&
      !sidebar.contains(e.target) &&
      !toggleSidebarLogo?.contains(e.target) &&
      !toggleSidebarMobile?.contains(e.target)) {
    sidebar.classList.add('-translate-x-full');
  }
});

// ── MAIN DATA LOADING ───────────────────────────────────────────────────────
async function loadAllDashboardData() {
  try {
    const [
      summaryRes,
      revenueRes,
      categoryRes,
      recentPrescriptionsRes,
      lowStockRes,
      topSellingRes,
      expiryRes
    ] = await Promise.all([
      fetch(`${API_BASE_URL}/api/dashboard/summary`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/dashboard/revenue-monthly?year=2026`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/dashboard/category-distribution`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/dashboard/prescriptions/recent?limit=10`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/dashboard/inventory/low-stock?limit=10`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/dashboard/sales/top-selling?limit=10&months=3`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/dashboard/inventory/expiry-summary`).then(r => r.json())
    ]);

    if (summaryRes.success) updateSummaryCards(summaryRes.data);
    if (revenueRes.success) updateRevenueChart(revenueRes.data);
    if (categoryRes.success) updateCategoryChart(categoryRes.data);

    // Store full data for filtering
    if (recentPrescriptionsRes.success) {
      allPrescriptions = recentPrescriptionsRes.data || [];
      populatePrescriptions(allPrescriptions);
    }

    if (lowStockRes.success) {
      allLowStock = lowStockRes.data || [];
      populateLowStockTable(allLowStock);
    }

    if (topSellingRes.success) {
      allTopSelling = topSellingRes.data || [];
      populateTopSellingTable(allTopSelling);
    }

    if (expiryRes.success) {
      expiryData = expiryRes.data;
      updateExpiryChart(expiryRes.data);
      populateTable('expiryTable', expiryRes.data.items || [], ['productName', 'expiryDate', 'period']);
    }

    loadNotifications();

  } catch (err) {
    console.error("Failed to load dashboard data:", err);
    alert("Failed to load dashboard. Please check if backend is running.");
  }
}

// ── SUMMARY CARDS ────────────────────────────────────────────────────────────
function updateSummaryCards(data) {
  document.querySelectorAll('.stats-card')[0].querySelector('h2').textContent = `₹${data.totalProfit?.toLocaleString() || 0}`;
  document.querySelectorAll('.stats-card')[1].querySelector('h2').textContent = data.totalPrescriptions || 0;
  document.querySelectorAll('.stats-card')[2].querySelector('h2').textContent = data.totalInventoryItems || 0;
  document.querySelectorAll('.stats-card')[3].querySelector('h2').textContent = data.lowStockItems || 0;

  const profitCard = document.querySelectorAll('.stats-card')[0];
  const trendText = profitCard.querySelector('p.text-sm');
  trendText.innerHTML = data.profitTrend === 'up'
    ? '<i class="fas fa-arrow-up text-green-600"></i> Increased this month'
    : '<i class="fas fa-arrow-down text-red-600"></i> Decreased this month';
}

// ── CHARTS ───────────────────────────────────────────────────────────────────
let revenueChart, categoryChart, expiryChart;

function updateRevenueChart(data) {
  const ctx = document.getElementById('revenueChart').getContext('2d');
  if (revenueChart) revenueChart.destroy();
  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.months,
      datasets: [{
        label: 'Revenue',
        data: data.revenues,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.2)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { datalabels: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => '₹' + v } } }
    }
  });
}

function updateCategoryChart(data) {
  const ctx = document.getElementById('categoriesChart').getContext('2d');
  if (categoryChart) categoryChart.destroy();

  // === IMPORTANT FIX: Remove duplicates using Map + Set-like behavior ===
  const categoryMap = new Map();
  
  data.categories.forEach((category, index) => {
    const count = data.counts[index] || 0;
    if (categoryMap.has(category)) {
      categoryMap.set(category, categoryMap.get(category) + count);
    } else {
      categoryMap.set(category, count);
    }
  });

  const uniqueCategories = Array.from(categoryMap.keys());
  const uniqueCounts = Array.from(categoryMap.values());

  // === FIXED NON-REPEATING COLORS - well distributed palette ===
  const colorPalette = [
    '#4f46e5',   // Indigo
    '#7c3aed',   // Violet
    '#ec4899',   // Pink
    '#f43f5e',   // Rose
    '#ea580c',   // Orange
    '#d97706',   // Amber
    '#16a34a',   // Green
    '#059669',   // Emerald
    '#0891b2',   // Cyan
    '#2563eb',   // Blue
    '#c026d3',   // Fuchsia
    '#dc2626',   // Red
    '#ca8a04',   // Yellow
  ];

  const backgroundColors = uniqueCategories.map(
    (_, index) => colorPalette[index % colorPalette.length]
  );

  categoryChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: uniqueCategories,
      datasets: [{
        data: uniqueCounts,
        backgroundColor: backgroundColors,
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: { size: 13 },
            padding: 20
          }
        },
        datalabels: {
          color: '#fff',
          font: { weight: 'bold', size: 12 },
          formatter: (value, context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            return total > 0 ? Math.round((value / total) * 100) + '%' : '';
          }
        }
      },
      layout: {
        padding: 10
      }
    },
    plugins: [ChartDataLabels]
  });
}

function updateExpiryChart(data) {
  const ctx = document.getElementById('expiryChart').getContext('2d');
  if (expiryChart) expiryChart.destroy();
  expiryChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Within 30 Days', 'Within 60 Days', 'Within 90 Days'],
      datasets: [{
        label: 'Medications Expiring',
        data: [data.within30Days, data.within60Days, data.within90Days],
        backgroundColor: ['#ef4444', '#f97316', '#06b6d4']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: {
          color: '#fff',
          font: { weight: 'bold', size: 14 },
          formatter: v => v || ''
        }
      },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    },
    plugins: [ChartDataLabels]
  });
}

// ── TABLE RENDERING ──────────────────────────────────────────────────────────
function populateTable(tableId, data, columns) {
  const tbody = document.getElementById(tableId);
  tbody.innerHTML = '';
  data.forEach(item => {
    const row = document.createElement('tr');
    columns.forEach(col => {
      const td = document.createElement('td');
      td.classList.add('py-2', 'border-b', 'border-gray-200');

      if (col === 'status') {
        const status = item.status || item.orderStatus || '';
        const colors = {
          'APPROVED': 'bg-green-200 text-green-800',
          'PENDING': 'bg-yellow-200 text-yellow-800',
          'REJECTED': 'bg-red-200 text-red-800'
        };
        td.innerHTML = `<span class="px-2 py-1 rounded ${colors[status.toUpperCase()] || 'bg-gray-200 text-gray-800'}">${status}</span>`;
      } else if (col === 'period') {
        const colors = {
          'Within 30 Days': 'bg-red-200 text-red-800',
          'Within 60 Days': 'bg-orange-200 text-orange-800',
          'Within 90 Days': 'bg-cyan-200 text-cyan-800'
        };
        td.innerHTML = `<span class="px-2 py-1 rounded ${colors[item[col]] || 'bg-gray-200 text-gray-800'}">${item[col] || ''}</span>`;
      } else if (col === 'revenue') {
        td.textContent = `₹${(item[col] || 0).toLocaleString()}`;
      } else if (col === 'date' || col === 'expiryDate') {
        td.textContent = item[col] ? new Date(item[col]).toLocaleDateString() : '';
      } else {
        td.textContent = item[col] || '';
      }
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
}

function populatePrescriptions(data) {
  populateTable('prescriptionsTable', data, ['patientName', 'prescriptionId', 'date', 'status']);
}

function populateLowStockTable(data) {
  const tbody = document.getElementById('lowStockTable');
  tbody.innerHTML = '';
  data.forEach(item => {
    const row = document.createElement('tr');
    ['productName', 'sku', 'currentStock', 'alertLevel'].forEach(col => {
      const td = document.createElement('td');
      td.classList.add('py-2', 'border-b', 'border-gray-200');
      if (col === 'currentStock') td.textContent = item.currentStock || 0;
      else if (col === 'alertLevel') {
        const color = item.alertLevel === 'Out' ? 'bg-red-500' : item.alertLevel === 'Critical' ? 'bg-orange-500' : 'bg-yellow-400';
        td.innerHTML = `<button class="text-white py-1 px-2 rounded ${color}">${item.alertLevel || 'Normal'}</button>`;
      } else td.textContent = item[col] || '';
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
}

function populateTopSellingTable(data) {
  populateTable('topSellingTable', data, ['productName', 'unitsSold', 'revenue']);
}

// ── FILTERING & RESET ────────────────────────────────────────────────────────

// Recent Prescriptions Filters
document.getElementById('prescriptions-status-filter')?.addEventListener('change', applyPrescriptionFilters);
document.getElementById('prescriptions-time-filter')?.addEventListener('change', applyPrescriptionFilters);

function applyPrescriptionFilters() {
  const status = document.getElementById('prescriptions-status-filter')?.value?.trim() || '';
  const time = document.getElementById('prescriptions-time-filter')?.value || 'all';

  let filtered = [...allPrescriptions];

  if (status) {
    filtered = filtered.filter(p => (p.status || '').toLowerCase() === status.toLowerCase());
  }

  if (time !== 'all') {
    const now = new Date();
    filtered = filtered.filter(p => {
      const d = new Date(p.date);
      const daysDiff = (now - d) / (1000 * 60 * 60 * 24);
      if (time === 'day') return daysDiff <= 1;
      if (time === 'week') return daysDiff <= 7;
      if (time === 'month') return daysDiff <= 30;
      return true;
    });
  }

  populatePrescriptions(filtered);
}

function resetPrescriptionsFilter() {
  document.getElementById('prescriptions-status-filter').value = '';
  document.getElementById('prescriptions-time-filter').value = 'all';
  applyPrescriptionFilters();
}

// Low Stock Filters + Search
document.getElementById('lowstock-search')?.addEventListener('input', applyLowStockFilter);
document.getElementById('lowstock-filter')?.addEventListener('change', applyLowStockFilter);

function applyLowStockFilter() {
  const search = document.getElementById('lowstock-search')?.value?.toLowerCase()?.trim() || '';
  const filterType = document.getElementById('lowstock-filter')?.value || '';

  let filtered = allLowStock.filter(item => {
    const matchesSearch = 
      (item.productName || '').toLowerCase().includes(search) ||
      (item.sku || '').toLowerCase().includes(search) ||
      String(item.currentStock || '').includes(search);

    let matchesFilter = true;
    if (filterType) {
      if (filterType === 'low') matchesFilter = (item.alertLevel || '') === 'Low' || (item.alertLevel || '') === 'Critical';
      if (filterType === 'finished') matchesFilter = (item.alertLevel || '') === 'Out';
    }

    return matchesSearch && matchesFilter;
  });

  populateLowStockTable(filtered);
}

function resetLowStockFilter() {
  document.getElementById('lowstock-search').value = '';
  document.getElementById('lowstock-filter').value = '';
  applyLowStockFilter();
}

// Top Selling Search + Reset
document.getElementById('topselling-search')?.addEventListener('input', applyTopSellingFilter);

function applyTopSellingFilter() {
  const search = document.getElementById('topselling-search')?.value?.toLowerCase()?.trim() || '';
  const filtered = allTopSelling.filter(item =>
    (item.productName || '').toLowerCase().includes(search) ||
    String(item.unitsSold || '').includes(search) ||
    String(item.revenue || '').includes(search)
  );
  populateTopSellingTable(filtered);
}

function resetTopSellingFilter() {
  document.getElementById('topselling-search').value = '';
  applyTopSellingFilter();
}

// ── EXPORT TOP SELLING (fixed URL) ───────────────────────────────────────────
document.getElementById('export-topselling')?.addEventListener('click', async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/sales/top-selling?limit=1000&months=12`);
    const json = await res.json();
    if (json.success && json.data?.length > 0) {
      const csv = 'Product Name,Units Sold,Revenue\n' + 
        json.data.map(r => 
          `"${(r.productName || '').replace(/"/g,'""')}",${r.unitsSold || 0},₹${(r.revenue || 0).toLocaleString()}`
        ).join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'top_selling_medications.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error('Export failed:', err);
    alert('Failed to export data. Check console for details.');
  }
});

// ── SORTING ──────────────────────────────────────────────────────────────────
function sortTable(table, col, isNumeric = false, isDate = false) {
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.rows);
  const header = table.querySelector(`th[data-sort="${col}"]`);
  if (!header) return;
  const dir = header.dataset.dir = (header.dataset.dir === 'asc') ? 'desc' : 'asc';

  rows.sort((a, b) => {
    const idx = [...table.querySelectorAll('th')].findIndex(th => th.dataset.sort === col);
    let A = a.cells[idx]?.textContent.trim() || '';
    let B = b.cells[idx]?.textContent.trim() || '';

    if (isNumeric) { A = parseFloat(A.replace(/[₹,]/g, '')) || 0; B = parseFloat(B.replace(/[₹,]/g, '')) || 0; }
    if (isDate) { A = new Date(A).getTime() || 0; B = new Date(B).getTime() || 0; }

    return dir === 'asc' ? (A > B ? 1 : -1) : (A < B ? 1 : -1);
  });

  rows.forEach(r => tbody.appendChild(r));
}

document.querySelectorAll('#prescriptions-table th[data-sort]').forEach(th => 
  th.addEventListener('click', () => sortTable(document.getElementById('prescriptions-table'), th.dataset.sort)));

document.querySelectorAll('#lowstock-table th[data-sort]').forEach(th => 
  th.addEventListener('click', () => sortTable(document.getElementById('lowstock-table'), th.dataset.sort, true)));

document.querySelectorAll('#topselling-table th[data-sort]').forEach(th => 
  th.addEventListener('click', () => sortTable(document.getElementById('topselling-table'), th.dataset.sort, true)));

document.querySelectorAll('#expiry-table th[data-sort]').forEach(th => 
  th.addEventListener('click', () => sortTable(document.getElementById('expiry-table'), th.dataset.sort, false, true)));

// ── LOGOUT MODAL ─────────────────────────────────────────────────────────────
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const confirmLogout = document.getElementById('confirmLogout');
const cancelLogout = document.getElementById('cancelLogout');
const closeLogoutModal = document.getElementById('closeLogoutModal');

logoutBtn?.addEventListener('click', e => {
  e.preventDefault();
  logoutModal.classList.remove('hidden');
});

function closeModal() {
  logoutModal.classList.add('hidden');
}

cancelLogout?.addEventListener('click', closeModal);
closeLogoutModal?.addEventListener('click', closeModal);
logoutModal?.addEventListener('click', e => { if (e.target === logoutModal) closeModal(); });
confirmLogout?.addEventListener('click', () => { window.location.href = '../Login/login.html'; });

// ── NOTIFICATION BELL SYSTEM ─────────────────────────────────────────────────
const bell = document.getElementById('notification-bell');
const dropdown = document.getElementById('notification-dropdown');
const badge = document.getElementById('notification-badge');
const notificationList = document.getElementById('notification-list');
const clearBtn = document.getElementById('clear-notifications');
const notificationCountSpan = document.getElementById('notification-count');

let notifications = [];

bell?.addEventListener('click', (e) => {
  e.stopPropagation();
  const isHidden = dropdown.classList.contains('hidden');

  if (isHidden) {
    dropdown.classList.remove('hidden');
    setTimeout(() => {
      dropdown.classList.remove('scale-95', 'opacity-0');
      dropdown.classList.add('scale-100', 'opacity-100');
    }, 10);
    loadNotifications();
  } else {
    dropdown.classList.add('scale-95', 'opacity-0');
    setTimeout(() => dropdown.classList.add('hidden'), 200);
  }
});

document.addEventListener('click', (e) => {
  if (!bell?.contains(e.target) && !dropdown?.contains(e.target)) {
    dropdown?.classList.add('scale-95', 'opacity-0');
    setTimeout(() => dropdown?.classList.add('hidden'), 200);
  }
});

function loadNotifications() {
  const alerts = [];

  if (allLowStock?.length > 0) {
    alerts.push({
      id: 'lowstock-' + Date.now(),
      type: 'warning',
      icon: 'exclamation-triangle text-yellow-500',
      title: 'Low Stock Alert',
      message: `${allLowStock.length} product${allLowStock.length === 1 ? '' : 's'} running low on stock`,
      time: new Date().toLocaleString()
    });
  }

  const pendingPres = allPrescriptions?.filter(p => 
    (p.status || '').toLowerCase() === 'pending'
  ) || [];

  if (pendingPres.length > 0) {
    alerts.push({
      id: 'pending-pres-' + Date.now(),
      type: 'info',
      icon: 'file-prescription text-blue-500',
      title: 'Pending Prescriptions',
      message: `${pendingPres.length} recent prescription${pendingPres.length === 1 ? '' : 's'} awaiting approval`,
      time: new Date().toLocaleString()
    });
  }

  const expiringSoon = expiryData?.within30Days || 0;
  if (expiringSoon > 0) {
    alerts.push({
      id: 'expiry-' + Date.now(),
      type: 'danger',
      icon: 'clock text-red-500',
      title: 'Expiring Soon',
      message: `${expiringSoon} medication${expiringSoon === 1 ? '' : 's'} will expire within 30 days`,
      time: new Date().toLocaleString()
    });
  }

  notifications = alerts;

  renderNotifications();

  if (alerts.length > 0) {
    badge.textContent = alerts.length;
    badge.classList.remove('hidden');
    if (notificationCountSpan) notificationCountSpan.textContent = `${alerts.length} new`;
  } else {
    badge.classList.add('hidden');
    if (notificationCountSpan) notificationCountSpan.textContent = '';
  }
}

function renderNotifications() {
  if (!notificationList) return;
  notificationList.innerHTML = '';

  if (notifications.length === 0) {
    notificationList.innerHTML = `
      <div class="p-8 text-center text-gray-500">
        <i class="fas fa-bell-slash text-4xl mb-3 opacity-40"></i>
        <p>No new alerts at the moment</p>
      </div>
    `;
    return;
  }

  notifications.forEach(alert => {
    const item = document.createElement('div');
    item.className = `p-4 hover:bg-gray-50 transition-colors flex items-start gap-4 border-l-4 ${
      alert.type === 'danger' ? 'border-red-500' :
      alert.type === 'warning' ? 'border-yellow-500' :
      'border-blue-500'
    }`;
    item.innerHTML = `
      <div class="flex-shrink-0 mt-1">
        <i class="fas fa-${alert.icon} text-2xl"></i>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-medium text-gray-900">${alert.title}</p>
        <p class="text-sm text-gray-600 mt-1">${alert.message}</p>
        <p class="text-xs text-gray-500 mt-2">${alert.time}</p>
      </div>
    `;
    notificationList.appendChild(item);
  });
}

clearBtn?.addEventListener('click', () => {
  notifications = [];
  renderNotifications();
  badge.classList.add('hidden');
  if (notificationCountSpan) notificationCountSpan.textContent = '';
});