const API_BASE_URL = 'http://localhost:8083/api/prescriptions';

let prescriptions = [];
let filteredPrescriptions = [];
let currentPage = 1;
const pageSize = 10;

const els = {
  prescriptionsBody: document.getElementById('prescriptionsBody'),
  historyBody: document.getElementById('historyBody'),
  loading: document.getElementById('loadingOverlay'),
  toastContainer: document.getElementById('toastContainer'),
  dateFrom: document.getElementById('date-from'),
  dateTo: document.getElementById('date-to'),
  filterStatus: document.getElementById('filter-status'),
  historyFrom: document.getElementById('history-date-from'),
  historyTo: document.getElementById('history-date-to'),
  totalOrders: document.getElementById('total-orders'),
  todaysOrders: document.getElementById('todays-orders'),
  approvedOrders: document.getElementById('approved-orders'),
  rejectedOrders: document.getElementById('rejected-orders'),
  prescriptionsPagination: document.getElementById('prescriptionsPagination'),
  historyPagination: document.getElementById('historyPagination')
};

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>${message}`;
  els.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function showLoading() { els.loading.classList.add('active'); }
function hideLoading() { els.loading.classList.remove('active'); }

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function getStatusClass(status, isApproved) {
  if (status === 'PENDING' && isApproved) return 'status-approved';
  const map = {
    PENDING: 'status-pending',
    APPROVED: 'status-approved',
    PROCESSING: 'status-processing',
    SHIPPED: 'status-shipped',
    DELIVERED: 'status-delivered',
    REJECTED: 'status-rejected',
    CANCELLED: 'status-cancelled'
  };
  return map[status] || 'status-pending';
}

function getDisplayStatus(status, isApproved) {
  return (status === 'PENDING' && isApproved) ? 'APPROVED' : status;
}

async function getAllPrescriptions() {
  const res = await fetch(`${API_BASE_URL}/get-all-orders?page=0&size=1000&sortBy=createdAt&sortDirection=DESC`);
  if (!res.ok) throw new Error('Failed to fetch prescriptions');
  return await res.json();
}

async function createPrescription(formData) {
  const res = await fetch(`${API_BASE_URL}/create-order`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Failed to create prescription');
  return await res.json();
}

async function approvePrescription(id) {
  await fetch(`${API_BASE_URL}/${id}/approve?isApproved=true`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } });
  await fetch(`${API_BASE_URL}/patch-status/${id}?status=APPROVED`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } });
}

async function rejectPrescription(id) {
  await fetch(`${API_BASE_URL}/reject-order-by-status/${id}/reject-order`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } });
}

async function deletePrescription(id) {
  await fetch(`${API_BASE_URL}/delete-order-by-prescriptionId/${id}`, { method: 'DELETE' });
}

async function getPrescriptionImage(id, userId = 1) {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}/image?userId=${userId}`);
    if (!res.ok || res.status === 404) return null;
    const blob = await res.blob();
    return blob.size > 0 && blob.type.startsWith('image/') ? URL.createObjectURL(blob) : null;
  } catch { return null; }
}

async function loadAndRender() {
  try {
    showLoading();
    const data = await getAllPrescriptions();
    prescriptions = data.content || [];
    filteredPrescriptions = [...prescriptions];

    updateStats();
    renderTable('prescriptionsBody', 'prescriptionsPagination', filteredPrescriptions);
    renderTable('historyBody', 'historyPagination', filteredPrescriptions);
    hideLoading();
  } catch (err) {
    hideLoading();
    showToast('Failed to load prescriptions', 'error');
  }
}

function updateStats() {
  const today = new Date().toISOString().split('T')[0];
  const todaysCount = prescriptions.filter(p => new Date(p.createdAt).toISOString().split('T')[0] === today).length;
  const approvedCount = prescriptions.filter(p => p.isApproved || p.orderStatus === 'APPROVED').length;
  const rejectedCount = prescriptions.filter(p => p.orderStatus === 'REJECTED').length;

  els.totalOrders.textContent = prescriptions.length;
  els.todaysOrders.textContent = todaysCount;
  els.approvedOrders.textContent = approvedCount;
  els.rejectedOrders.textContent = rejectedCount;
}

function renderTable(bodyId, paginationId, data) {
  const tbody = document.getElementById(bodyId);
  const pagination = document.getElementById(paginationId);
  const isMain = bodyId === 'prescriptionsBody';
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageData = data.slice(start, end);
  const totalPages = Math.ceil(data.length / pageSize) || 1;

  tbody.innerHTML = '';
  pageData.forEach((p, i) => {
    const row = document.createElement('tr');
    const idx = start + i + 1;
    const statusClass = getStatusClass(p.orderStatus, p.isApproved);
    const displayStatus = getDisplayStatus(p.orderStatus, p.isApproved);
    const isPending = p.orderStatus === 'PENDING' && !p.isApproved;

    row.innerHTML = `
      <td class="text-center">${idx}</td>
      <td>${p.prescriptionId}</td>
      <td>${p.firstName} ${p.lastName}</td>
      <td>${p.doctorName || 'N/A'}</td>
      <td>${formatDate(p.createdAt)}</td>
      <td><span class="status-badge ${statusClass}">${displayStatus}</span></td>
      ${isMain ? `<td class="text-center space-x-1">
        <button class="action-btn bg-blue-100 text-blue-700 view-btn" data-id="${p.prescriptionId}"><i class="fas fa-eye"></i></button>
        ${isPending ? `
          <button class="action-btn bg-green-100 text-green-700 approve-btn" data-id="${p.prescriptionId}"><i class="fas fa-check"></i></button>
          <button class="action-btn bg-red-100 text-red-700 reject-btn" data-id="${p.prescriptionId}"><i class="fas fa-times"></i></button>
        ` : ''}
        <button class="action-btn bg-gray-100 text-gray-700 delete-btn" data-id="${p.prescriptionId}"><i class="fas fa-trash"></i></button>
      </td>` : '<td></td>'}
    `;
    tbody.appendChild(row);
  });

  // Pagination
  pagination.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = i === currentPage ? 'active' : '';
    btn.onclick = () => { currentPage = i; renderTable(bodyId, paginationId, data); };
    pagination.appendChild(btn);
  }
}

function applyFilters() {
  let filtered = [...prescriptions];

  const status = els.filterStatus.value;
  if (status) {
    filtered = filtered.filter(p => getDisplayStatus(p.orderStatus, p.isApproved) === status);
  }

  const from = els.dateFrom.value;
  const to = els.dateTo.value;
  if (from || to) {
    filtered = filtered.filter(p => {
      const date = new Date(p.createdAt).toISOString().split('T')[0];
      return (!from || date >= from) && (!to || date <= to);
    });
  }

  filteredPrescriptions = filtered;
  currentPage = 1;
  renderTable('prescriptionsBody', 'prescriptionsPagination', filteredPrescriptions);
  renderTable('historyBody', 'historyPagination', filteredPrescriptions);
}

// Event Listeners
// document.getElementById('add-prescription').onclick = () => {
//   document.getElementById('prescriptionModal').classList.add('active');
// };

document.getElementById('prescriptionForm').onsubmit = async (e) => {
  e.preventDefault();
  showLoading();

  const orderData = {
    firstName: document.getElementById('firstName').value.trim(),
    lastName: document.getElementById('lastName').value.trim(),
    mobileNumber: document.getElementById('mobileNumber').value.trim(),
    email: document.getElementById('email').value.trim(),
    doctorName: document.getElementById('doctorName').value.trim(),
    paymentMethod: document.getElementById('paymentMethod').value,
    orderStatus: 'PENDING',
    isApproved: false,
    userId: 1
  };

  const formData = new FormData();
  formData.append('orderData', new Blob([JSON.stringify(orderData)], { type: 'application/json' }));

  const file = document.getElementById('prescriptionImage').files[0];
  if (file) {
    formData.append('prescriptionImg', file);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/create-order`, {
      method: 'POST',
      body: formData,
      // DO NOT set headers: { 'Content-Type': 'multipart/form-data' } ← This breaks it!
      // Let the browser set the correct multipart boundary automatically
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Failed to create prescription');
    }

    const result = await res.json();
    showToast('Prescription created successfully!', 'success');
    document.getElementById('prescriptionModal').classList.remove('active');
    document.getElementById('prescriptionForm').reset();
    await loadAndRender();
  } catch (err) {
    console.error('Create error:', err);
    showToast(err.message || 'Failed to create prescription', 'error');
    hideLoading();
  }
};


document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.action-btn');
  if (!btn) return;

  const id = btn.dataset.id;

  if (btn.classList.contains('view-btn')) {
    try {
      showLoading();
      const res = await fetch(`${API_BASE_URL}/get-by-prescriptionId/${id}`);
      const p = await res.json();
      const userId = p.userId || 1;
      let html = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><strong>Prescription ID:</strong> ${p.prescriptionId}</div>
          <div><strong>Date:</strong> ${formatDate(p.createdAt)}</div>
          <div><strong>Patient:</strong> ${p.firstName} ${p.lastName}</div>
          <div><strong>Doctor:</strong> ${p.doctorName || 'N/A'}</div>
          <div><strong>Contact:</strong> ${p.mobileNumber}</div>
          <div><strong>Email:</strong> ${p.email}</div>
          <div><strong>Status:</strong> <span class="status-badge ${getStatusClass(p.orderStatus, p.isApproved)}">${getDisplayStatus(p.orderStatus, p.isApproved)}</span></div>
          <div><strong>Payment:</strong> ${p.paymentMethod || 'N/A'}</div>
        </div>`;

      const imageUrl = await getPrescriptionImage(id, userId);
      if (imageUrl) {
        html += `<div class="mt-6"><strong>Image:</strong><br><img src="${imageUrl}" class="max-w-full rounded-lg mt-2 cursor-pointer" onclick="document.getElementById('imageContainer').innerHTML='<img src=\\'${imageUrl}\\' class=\\'max-w-full max-h-screen\\'>'; document.getElementById('imageModal').classList.add('active');"></div>`;
      } else {
        html += `<div class="mt-6 text-gray-500 italic">No image available</div>`;
      }

      document.getElementById('prescriptionDetails').innerHTML = html;
      document.getElementById('viewModal').classList.add('active');
      hideLoading();
    } catch { showToast('Failed to load details', 'error'); hideLoading(); }

  } else if (btn.classList.contains('approve-btn')) {
    if (!confirm('Approve this prescription?')) return;
    try {
      showLoading();
      await approvePrescription(id);
      showToast('Approved successfully', 'success');
      await loadAndRender();
    } catch { showToast('Approve failed', 'error'); hideLoading(); }

  } else if (btn.classList.contains('reject-btn')) {
    if (!confirm('Reject this prescription?')) return;
    try {
      showLoading();
      await rejectPrescription(id);
      showToast('Rejected successfully', 'success');
      await loadAndRender();
    } catch { showToast('Reject failed', 'error'); hideLoading(); }

  } else if (btn.classList.contains('delete-btn')) {
    if (!confirm('Delete this prescription?')) return;
    try {
      showLoading();
      await deletePrescription(id);
      showToast('Deleted successfully', 'success');
      await loadAndRender();
    } catch { showToast('Delete failed', 'error'); hideLoading(); }
  }
});

document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('close')) {
      modal.classList.remove('active');
    }
  });
});

flatpickr("#date-from, #date-to, #history-date-from, #history-date-to", { dateFormat: "Y-m-d" });

els.filterStatus.onchange = applyFilters;
els.dateFrom.onchange = els.dateTo.onchange = applyFilters;

document.getElementById('filter-this-week').onclick = () => setHistoryDateRange('week', 0);
document.getElementById('filter-last-week').onclick = () => setHistoryDateRange('week', -7);
document.getElementById('filter-this-month').onclick = () => setHistoryDateRange('month', 0);

function setHistoryDateRange(type, offsetDays) {
  const today = new Date();
  let from, to;

  if (type === 'week') {
    from = new Date(today);
    from.setDate(today.getDate() - today.getDay() + offsetDays);
    to = new Date(from);
    to.setDate(from.getDate() + 6);
  } else if (type === 'month') {
    from = new Date(today.getFullYear(), today.getMonth(), 1);
    to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  }

  els.historyFrom.value = from.toISOString().split('T')[0];
  els.historyTo.value = to.toISOString().split('T')[0];
  applyFilters();
}

document.getElementById('export-reports').onclick = () => {
  if (prescriptions.length === 0) return showToast('No data to export', 'info');

  let csv = "Prescription ID,Patient Name,Doctor Name,Date,Status,Approved\n";
  prescriptions.forEach(p => {
    csv += `${p.prescriptionId},"${p.firstName} ${p.lastName}","${p.doctorName || ''}","${formatDate(p.createdAt)}","${getDisplayStatus(p.orderStatus, p.isApproved)}","${p.isApproved ? 'Yes' : 'No'}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prescriptions_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Report exported!', 'success');
};


 // Logout Modal Logic
            const logoutBtn = document.getElementById('logoutBtn');
            const modal = document.getElementById('logoutConfirmModal');
            const yesBtn = document.getElementById('logoutConfirmYes');
            const noBtn = document.getElementById('logoutConfirmNo');
            const closeBtn = document.getElementById('closeLogoutModal');

            // Open modal
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                modal.classList.remove('hidden');
            });

            // Close modal
            function closeModal() {
                modal.classList.add('hidden');
            }

            noBtn.addEventListener('click', closeModal);
            closeBtn.addEventListener('click', closeModal);

            // Close on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });

            // Confirm logout
            yesBtn.addEventListener('click', () => {
                window.location.href = '../Login/login.html';
            });

            // Success popup close
            document.getElementById('closeSuccessPopup')?.addEventListener('click', () => {
                document.getElementById('successPopup').style.display = 'none';
            });
        


function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarArrow = document.getElementById('sidebar-arrow');
    const logoDiv = document.querySelector('div > div'); // Logo container
    const navTexts = document.querySelectorAll('.nav-text');
    const navIcons = document.querySelectorAll('.nav-icon');
    
    if (window.innerWidth < 768) {
        // Mobile: Just toggle visibility with smooth transition
        sidebar.classList.toggle('-translate-x-full');
        sidebar.classList.toggle('translate-x-0');
    } else {
        // Desktop: Toggle between collapsed and expanded
        sidebar.classList.toggle('collapsed');
        
        if (sidebar.classList.contains('collapsed')) {
            // Collapsed state
            sidebar.style.width = '64px'; // Smaller width when collapsed
            sidebarArrow.classList.remove('fa-chevron-left');
            sidebarArrow.classList.add('fa-chevron-right');
            
            // Hide logo smoothly
            logoDiv.style.opacity = '0';
            logoDiv.style.width = '0';
            
            // Hide nav texts with delay
            navTexts.forEach((text, index) => {
                text.style.opacity = '0';
                text.style.width = '0';
                text.style.overflow = 'hidden';
                text.style.transitionDelay = `${index * 20}ms`;
            });
            
            // Center icons
            navIcons.forEach(icon => {
                icon.style.marginLeft = '0';
                icon.style.marginRight = '0';
            });
            
        } else {
            // Expanded state
            sidebar.style.width = '256px'; // Original width
            sidebarArrow.classList.remove('fa-chevron-right');
            sidebarArrow.classList.add('fa-chevron-left');
            
            // Show logo smoothly
            logoDiv.style.opacity = '1';
            logoDiv.style.width = 'auto';
            
            // Show nav texts with staggered animation
            navTexts.forEach((text, index) => {
                text.style.opacity = '1';
                text.style.width = 'auto';
                text.style.overflow = 'visible';
                text.style.transitionDelay = `${index * 20}ms`;
            });
            
            // Restore icon margins
            navIcons.forEach(icon => {
                icon.style.marginLeft = '0';
                icon.style.marginRight = '0.75rem'; // mr-3
            });
        }
    }
}


// Add event listeners
document.getElementById('toggle-sidebar-logo').addEventListener('click', toggleSidebar);
document.getElementById('close-sidebar').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.add('-translate-x-full');
    sidebar.classList.remove('translate-x-0');
});

// Optional: Close sidebar when clicking outside on mobile
document.addEventListener('click', (event) => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar-logo');
    
    if (window.innerWidth < 768 && 
        !sidebar.contains(event.target) && 
        !toggleBtn.contains(event.target) &&
        sidebar.classList.contains('translate-x-0')) {
        sidebar.classList.add('-translate-x-full');
        sidebar.classList.remove('translate-x-0');
    }
});
    function initializeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarArrow = document.getElementById('sidebar-arrow');
        
        // Set initial state based on screen width
        if (window.innerWidth >= 768) {
            // Desktop: Start expanded
            sidebar.classList.remove('collapsed');
            sidebarArrow.classList.remove('fa-chevron-right');
            sidebarArrow.classList.add('fa-chevron-left');
        } else {
            // Mobile: Start hidden
            sidebar.classList.remove('translate-x-0');
        }
    }
document.addEventListener('DOMContentLoaded', loadAndRender);


