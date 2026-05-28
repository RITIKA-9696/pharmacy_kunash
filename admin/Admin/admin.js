// API Endpoints
const API = {
  BASE: "http://localhost:8083/api/admins",
  ALL: () => `${API.BASE}/get-all-admins`,
  BY_ID: id => `${API.BASE}/get-admin-by-id/${id}`,
  PATCH: id => `${API.BASE}/patch-admin-by-id/${id}`,
  DELETE: id => `${API.BASE}/delete-admin-by-id/${id}`,
  RESET_PASSWORD: id => `${API.BASE}/reset-password/${encodeURIComponent(id)}`
};

// State
let admins = [];
let filteredAdmins = [];
let currentPage = 1;
const pageSize = 10;
const selectedAdmins = new Set();

// DOM Elements
const els = {
  sidebar: document.getElementById('sidebar'),
  mainContent: document.getElementById('main-content'),
  mobileOverlay: document.getElementById('mobileOverlay'),
  tableBody: document.getElementById('adminTableBody'),
  searchInput: document.getElementById('searchInput'),
  selectAll: document.getElementById('selectAll'),
  deleteBtn: document.getElementById('deleteSelectedBtn'),
  pageInfo: document.getElementById('pageInfo'),
  prevPage: document.getElementById('prevPage'),
  nextPage: document.getElementById('nextPage')
};

// ================ Custom Toast Notification System ================
function showToast(message, type = 'success') {
  // Remove any existing toast
  const existing = document.getElementById('custom-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'custom-toast';
  toast.className = 'fixed top-4 right-4 z-[9999] max-w-sm';
  toast.innerHTML = `
    <div class="bg-white rounded-lg shadow-2xl border-l-4 ${type === 'success' ? 'border-green-500' : 'border-red-500'} p-4 flex items-center gap-3 animate-slide-in">
      <i class="fas ${type === 'success' ? 'fa-check-circle text-green-600' : 'fa-exclamation-circle text-red-600'} text-2xl"></i>
      <div>
        <p class="font-semibold text-gray-800">${type === 'success' ? 'Success' : 'Error'}</p>
        <p class="text-gray-600 text-sm">${message}</p>
      </div>
      <button onclick="this.closest('#custom-toast').remove()" class="text-gray-400 hover:text-gray-600">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;

  document.body.appendChild(toast);

  // Auto remove after 4 seconds
  setTimeout(() => {
    if (toast && toast.parentElement) {
      toast.classList.add('animate-slide-out');
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

// Add simple animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  .animate-slide-in { animation: slideIn 0.4s ease-out; }
  .animate-slide-out { animation: slideOut 0.3s ease-in forwards; }
`;
document.head.appendChild(style);

// ================ Data Loading & Rendering ================
async function loadAdmins() {
  try {
    const res = await fetch(API.ALL());
    if (!res.ok) throw new Error('Failed to fetch admins');
    admins = await res.json();
    filteredAdmins = [...admins];
    currentPage = 1;
    renderTable();
  } catch (err) {
    console.error(err);
    showToast('Failed to load admins from server', 'error');
    admins = filteredAdmins = [];
    renderTable();
  }
}

function renderTable() {
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageData = filteredAdmins.slice(start, end);

  els.tableBody.innerHTML = '';
  pageData.forEach(admin => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="text-center"><input type="checkbox" class="admin-checkbox" data-id="${admin.id}"></td>
      <td>${admin.id}</td>
      <td>${admin.firstName}</td>
      <td>${admin.lastName}</td>
      <td>${admin.email}</td>
      <td>${admin.phoneNumber}</td>
      <td class="text-center space-x-2">
        <button class="text-blue-600 hover:text-blue-800 view-admin" data-id="${admin.id}" title="View"><i class="fas fa-eye"></i></button>
        <button class="text-yellow-600 hover:text-yellow-800 edit-admin" data-id="${admin.id}" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="text-green-600 hover:text-green-800 reset-admin" data-id="${admin.id}" data-name="${admin.firstName} ${admin.lastName}" title="Reset Password"><i class="fas fa-key"></i></button>
      </td>
    `;
    els.tableBody.appendChild(row);
  });

  updatePagination();
  updateDeleteBtn();
  attachRowEvents();
}

function updatePagination() {
  const totalPages = Math.ceil(filteredAdmins.length / pageSize) || 1;
  els.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  els.prevPage.disabled = currentPage === 1;
  els.nextPage.disabled = currentPage >= totalPages;
}

function attachRowEvents() {
  document.querySelectorAll('.admin-checkbox').forEach(cb => {
    cb.onchange = () => {
      const id = Number(cb.dataset.id);
      cb.checked ? selectedAdmins.add(id) : selectedAdmins.delete(id);
      els.selectAll.checked = selectedAdmins.size === filteredAdmins.length && filteredAdmins.length > 0;
      updateDeleteBtn();
    };
  });

  document.querySelectorAll('.view-admin').forEach(btn => btn.onclick = () => showViewAdmin(btn.dataset.id));
  document.querySelectorAll('.edit-admin').forEach(btn => btn.onclick = () => showEditAdmin(btn.dataset.id));
  document.querySelectorAll('.reset-admin').forEach(btn => btn.onclick = () => showResetPassword(btn.dataset.id, btn.dataset.name));
}

// Search
els.searchInput.oninput = () => {
  const term = els.searchInput.value.toLowerCase();
  filteredAdmins = admins.filter(admin =>
    JSON.stringify(Object.values(admin)).toLowerCase().includes(term)
  );
  currentPage = 1;
  renderTable();
};

// Sorting
document.querySelectorAll('th[data-sort]').forEach(th => {
  th.onclick = () => {
    const key = th.dataset.sort;
    const asc = !th.classList.contains('sorted-asc');
    document.querySelectorAll('th[data-sort]').forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
    th.classList.toggle('sorted-asc', asc);
    th.classList.toggle('sorted-desc', !asc);

    filteredAdmins.sort((a, b) => {
      const A = (a[key] ?? '').toString();
      const B = (b[key] ?? '').toString();
      return asc ? A.localeCompare(B) : B.localeCompare(A);
    });
    renderTable();
  };
});

// Pagination
els.prevPage.onclick = () => { if (currentPage > 1) { currentPage--; renderTable(); } };
els.nextPage.onclick = () => { if (currentPage * pageSize < filteredAdmins.length) { currentPage++; renderTable(); } };

// Bulk Delete
els.selectAll.onchange = () => {
  document.querySelectorAll('.admin-checkbox').forEach(cb => {
    cb.checked = els.selectAll.checked;
    const id = Number(cb.dataset.id);
    els.selectAll.checked ? selectedAdmins.add(id) : selectedAdmins.delete(id);
  });
  updateDeleteBtn();
};

els.deleteBtn.onclick = async () => {
  if (selectedAdmins.size === 0) return;
  if (!confirm(`Delete ${selectedAdmins.size} admin(s)? This cannot be undone.`)) return;

  try {
    await Promise.all(Array.from(selectedAdmins).map(id => fetch(API.DELETE(id), { method: 'DELETE' })));
    showToast('Admins deleted successfully');
    selectedAdmins.clear();
    await loadAdmins();
  } catch (err) {
    showToast('Failed to delete one or more admins', 'error');
  }
};

function updateDeleteBtn() {
  els.deleteBtn.classList.toggle('hidden', selectedAdmins.size === 0);
}

// Overlay Controls
function openOverlay(id) {
  document.getElementById(id).classList.add('active');
}
function closeOverlay(id) {
  document.getElementById(id).classList.remove('active');
}
document.querySelectorAll('.overlay').forEach(ov => {
  ov.addEventListener('click', e => {
    if (e.target === ov) closeOverlay(ov.id);
  });
});

// Sidebar Toggle
function toggleSidebar() {
  if (window.innerWidth < 768) {
    els.sidebar.classList.toggle('mobile-open');
    els.mobileOverlay.classList.toggle('active');
  } else {
    els.sidebar.classList.toggle('collapsed');
    els.mainContent.classList.toggle('main-content-collapsed');
    document.getElementById('sidebar-arrow').classList.toggle('fa-chevron-left');
    document.getElementById('sidebar-arrow').classList.toggle('fa-chevron-right');
  }
}
document.getElementById('toggle-sidebar-logo').onclick = toggleSidebar;
document.getElementById('toggle-sidebar-mobile').onclick = toggleSidebar;
document.getElementById('close-sidebar').onclick = () => {
  els.sidebar.classList.remove('mobile-open');
  els.mobileOverlay.classList.remove('active');
};
els.mobileOverlay.onclick = () => {
  els.sidebar.classList.remove('mobile-open');
  els.mobileOverlay.classList.remove('active');
};

// View Admin
async function showViewAdmin(id) {
  try {
    const res = await fetch(API.BY_ID(id));
    if (!res.ok) throw new Error();
    const admin = await res.json();

    document.getElementById('view-id').textContent = admin.id;
    document.getElementById('view-name').textContent = `${admin.firstName} ${admin.lastName}`;
    document.getElementById('view-initials').textContent = `${admin.firstName[0]}${admin.lastName[0]}`.toUpperCase();
    document.getElementById('view-email').textContent = admin.email;
    document.getElementById('view-email-text').textContent = admin.email;
    document.getElementById('view-phone').textContent = admin.phoneNumber;
    document.getElementById('view-password').value = '********';
    document.getElementById('view-created').textContent = '—';
    openOverlay('viewAdminOverlay');
  } catch (err) {
    showToast('Failed to load admin details', 'error');
  }
}

// Edit Admin
function showEditAdmin(id) {
  const admin = admins.find(a => a.id === Number(id));
  if (!admin) return showToast('Admin not found', 'error');

  document.getElementById('edit-id').value = admin.id;
  document.getElementById('edit-password').value = '********';
  document.getElementById('edit-firstname').value = admin.firstName;
  document.getElementById('edit-lastname').value = admin.lastName;
  document.getElementById('edit-email').value = admin.email;
  document.getElementById('edit-phone').value = admin.phoneNumber;
  openOverlay('editAdminOverlay');
}

document.getElementById('editAdminForm').onsubmit = async (e) => {
  e.preventDefault();
  const id = Number(document.getElementById('edit-id').value);

  const payload = {
    firstName: document.getElementById('edit-firstname').value.trim(),
    lastName: document.getElementById('edit-lastname').value.trim(),
    email: document.getElementById('edit-email').value.trim(),
    phoneNumber: document.getElementById('edit-phone').value.trim()
  };

  try {
    const res = await fetch(API.PATCH(id), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Update failed');
    }

    showToast('Admin updated successfully');
    closeOverlay('editAdminOverlay');
    await loadAdmins(); // Full refresh with latest data
  } catch (err) {
    console.error(err);
    showToast('Failed to update admin', 'error');
  }
};

// Reset Password
function showResetPassword(id, name) {
  document.getElementById('reset-admin-id').value = id;
  document.getElementById('reset-admin-name').textContent = name;
  document.getElementById('resetPasswordForm').reset();
  openOverlay('resetPasswordOverlay');
}

document.getElementById('resetPasswordForm').onsubmit = async (e) => {
  e.preventDefault();
  const id = document.getElementById('reset-admin-id').value;
  const oldPass = document.getElementById('old-password').value;
  const newPass = document.getElementById('new-password').value;
  const confirmPass = document.getElementById('confirm-password').value;

  if (newPass !== confirmPass) return showToast('Passwords do not match', 'error');
  if (newPass.length < 8) return showToast('Password must be at least 8 characters', 'error');

  try {
    const res = await fetch(API.RESET_PASSWORD(id), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass })
    });

    if (res.ok) {
      showToast('Password reset successfully');
      closeOverlay('resetPasswordOverlay');
    } else {
      const msg = await res.text();
      showToast(msg.includes('Incorrect old password') ? 'Incorrect old password' : 'Password reset failed', 'error');
    }
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
  }
};

// Logout
document.getElementById('logoutBtn').onclick = () => openOverlay('logoutConfirmModal');
document.getElementById('logoutConfirmYes').onclick = () => {
  showToast('Logging out...', 'success');
  setTimeout(() => location.href = '../Login/login.html', 1500);
};
document.getElementById('logoutConfirmNo').onclick = () => closeOverlay('logoutConfirmModal');

// Password Toggle
function togglePasswordVisibility(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', loadAdmins);


