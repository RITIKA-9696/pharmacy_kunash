
// User profile (unchanged)
// const user = {
//     name: "Shreya Kamble",
//     role: "Admin",
// };
// function displayUserProfile() {
//     const userInitials = document.getElementById("user-initials");
//     const userName = document.getElementById("user-name");
//     const userRole = document.getElementById("user-role");
//     const nameParts = user.name.trim().split(" ");
//     const initials = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}` : nameParts[0][0];
//     userInitials.textContent = initials.toUpperCase();
//     userName.textContent = user.name;
//     userRole.textContent = user.role;
// }
// displayUserProfile();

// ---------------------------------------------------------------------
// API BASE URL
// ---------------------------------------------------------------------
const API_BASE = 'http://localhost:8083/api/users';

// ---------------------------------------------------------------------
// Global variable to hold current users (populated from API)
// ---------------------------------------------------------------------
let users = [];

// ---------------------------------------------------------------------
// Helper: Show success popup
// ---------------------------------------------------------------------
function showSuccessPopup(message) {
    document.getElementById('successMessage').textContent = message;
    document.getElementById('successPopup').style.display = 'flex';
}

// ---------------------------------------------------------------------
// 1. FETCH ALL USERS
// ---------------------------------------------------------------------
async function fetchAllUsers() {
    try {
        const res = await fetch(`${API_BASE}/get-all-users`);
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        users = data;
        return users;
    } catch (err) {
        console.error(err);
        alert('Error loading users');
        return [];
    }
}

// ---------------------------------------------------------------------
// 2. CREATE USER
// ---------------------------------------------------------------------
async function createUser(payload) {
    try {
        const res = await fetch(`${API_BASE}/create-User`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Create failed');
        return await res.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
}

// ---------------------------------------------------------------------
// 3. GET USER BY ID
// ---------------------------------------------------------------------
async function getUserById(userId) {
    try {
        const res = await fetch(`${API_BASE}/get-by-user-id/${userId}`);
        if (!res.ok) throw new Error('User not found');
        return await res.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
}

// ---------------------------------------------------------------------
// 4. UPDATE USER (PATCH)
// ---------------------------------------------------------------------
async function updateUser(userId, payload) {
    try {
        const res = await fetch(`${API_BASE}/patch-user-by-id/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Update failed');
        return await res.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
}

// ---------------------------------------------------------------------
// 5. DELETE USER
// ---------------------------------------------------------------------
async function deleteUser(userId) {
    try {
        const res = await fetch(`${API_BASE}/delete-by-user-id/${userId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Delete failed');
        const text = await res.text();
        return text;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

// ---------------------------------------------------------------------
// INITIALIZE DATATABLE
// ---------------------------------------------------------------------
$(document).ready(async function () {
    const table = $('#customerTable').DataTable({
        responsive: true,
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        order: [[1, "asc"]],
        dom: '<"top-controls mb-4"lf>rt<"bottom-controls mt-4"ip>',
        scrollX: true,
        paging: true,
        searching: false,
        info: true,
        drawCallback: function () {
            this.api().columns.adjust();
        },
        columns: [
            { 
                data: null, 
                render: function(data, type, row) {
                    return `<input type="checkbox" class="row-checkbox w-4 h-4 cursor-pointer" data-id="${row.userId}">`;
                },
                className: 'text-center',
                orderable: false,
                width: '64px'
            },
            { data: 'userId', className: 'text-left' },
            { data: 'firstName', className: 'text-left' },
            { data: 'lastName', className: 'text-left' },
            { data: 'email', className: 'text-left' },
            { data: 'phone', className: 'text-left' },
            { data: 'addressCity', className: 'text-left' },
            { data: 'addressState', className: 'text-left' },
            { data: 'addressType', className: 'text-left' },
            {
                data: null,
                render: data => `
                    <div class="action-column">
                        <button class="action-btn bg-blue-600 text-white action-btn-view" data-id="${data.userId}" data-action="view" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn bg-yellow-500 text-white action-btn-edit" data-id="${data.userId}" data-action="edit" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn bg-red-500 text-white action-btn-delete" data-id="${data.userId}" data-action="delete" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `,
                className: 'text-center',
                orderable: false,
                width: '192px'
            }
        ]
    });

    // Load data from API
    await populateTable(table);
    updateStats();

    // -----------------------------------------------------------------
    // Bulk Delete Functionality
    // -----------------------------------------------------------------
    // Select all checkbox
    $('#selectAll').on('click', function() {
        $('.row-checkbox').prop('checked', this.checked);
        toggleDeleteSelectedButton();
    });

    // Individual row checkbox
    $(document).on('click', '.row-checkbox', function() {
        const totalCheckboxes = $('.row-checkbox').length;
        const checkedCheckboxes = $('.row-checkbox:checked').length;
        
        $('#selectAll').prop('checked', totalCheckboxes === checkedCheckboxes);
        $('#selectAll').prop('indeterminate', checkedCheckboxes > 0 && checkedCheckboxes < totalCheckboxes);
        
        toggleDeleteSelectedButton();
    });

    // Delete Selected button
    $('#deleteSelectedBtn').on('click', async function() {
        const selectedIds = [];
        $('.row-checkbox:checked').each(function() {
            selectedIds.push($(this).data('id'));
        });

        if (selectedIds.length === 0) {
            alert('Please select at least one customer to delete.');
            return;
        }

        if (confirm(`Are you sure you want to delete ${selectedIds.length} customer(s)?`)) {
            try {
                for (const userId of selectedIds) {
                    await deleteUser(userId);
                }
                showSuccessPopup(`${selectedIds.length} customer(s) deleted successfully`);
                await populateTable(table);
                updateStats();
                $('#selectAll').prop('checked', false);
                toggleDeleteSelectedButton();
            } catch (e) {
                alert('Delete failed');
            }
        }
    });

    // -----------------------------------------------------------------
    // Action button listeners
    // -----------------------------------------------------------------
    $(document).on('click', '.action-btn-view', async function () {
        const userId = $(this).data('id');
        await viewCustomer(userId);
    });

    $(document).on('click', '.action-btn-edit', async function () {
        const userId = $(this).data('id');
        await editCustomer(userId);
    });

    $(document).on('click', '.action-btn-delete', async function () {
        const userId = $(this).data('id');
        if (confirm('Are you sure you want to delete this user?')) {
            try {
                const msg = await deleteUser(userId);
                showSuccessPopup(msg);
                await populateTable(table);
                updateStats();
            } catch (e) {
                alert('Delete failed');
            }
        }
    });
});

// ---------------------------------------------------------------------
// Toggle Delete Selected Button
// ---------------------------------------------------------------------
function toggleDeleteSelectedButton() {
    const checkedCount = $('.row-checkbox:checked').length;
    const deleteBtn = $('#deleteSelectedBtn');
    
    if (checkedCount > 0) {
        deleteBtn.show();
    } else {
        deleteBtn.hide();
    }
}

// ---------------------------------------------------------------------
// POPULATE TABLE
// ---------------------------------------------------------------------
async function populateTable(table) {
    users = await fetchAllUsers();
    table.clear().rows.add(users).draw();
    
    // Update checkbox states
    $('#selectAll').prop('checked', false);
    toggleDeleteSelectedButton();
}

// ---------------------------------------------------------------------
// UPDATE STATS
// ---------------------------------------------------------------------
function updateStats() {
    const total = users.length;
    const active = users.length; // API has no status field; assume all active
    const deactivated = 0;
    const newCustomers = 0; // No regDate in payload
    document.getElementById('totalCustomers').textContent = total;
    document.getElementById('activeCustomers').textContent = active;
    document.getElementById('newCustomers').textContent = newCustomers;
    document.getElementById('deactivatedCustomers').textContent = deactivated;
}

// ---------------------------------------------------------------------
// FILTER TABLE
// ---------------------------------------------------------------------
function filterTable() {
    const city = document.getElementById('cityFilter').value.toLowerCase();
    const state = document.getElementById('stateFilter').value.toLowerCase();
    const addressType = document.getElementById('addressTypeFilter').value.toLowerCase();
    const table = $('#customerTable').DataTable();
    const filtered = users.filter(u => {
        return (!city || u.addressCity.toLowerCase() === city) &&
               (!state || u.addressState.toLowerCase() === state) &&
               (!addressType || u.addressType.toLowerCase() === addressType);
    });
    table.clear().rows.add(filtered).draw();
}

document.getElementById('cityFilter').addEventListener('change', filterTable);
document.getElementById('stateFilter').addEventListener('change', filterTable);
document.getElementById('addressTypeFilter').addEventListener('change', filterTable);

// ---------------------------------------------------------------------
// VIEW USER
// ---------------------------------------------------------------------
async function viewCustomer(userId) {
    try {
        const user = await getUserById(userId);
        document.getElementById('profile-id').textContent = user.userId;
        document.getElementById('profile-firstname').textContent = user.firstName;
        document.getElementById('profile-lastname').textContent = user.lastName;
        document.getElementById('profile-email').textContent = user.email;
        document.getElementById('profile-phone').textContent = user.phone;
        document.getElementById('profile-addrtype').textContent = user.addressType;
        document.getElementById('profile-landmark').textContent = user.addressLandmark || '-';
        document.getElementById('profile-area').textContent = user.addressArea || '-';
        document.getElementById('profile-city').textContent = user.addressCity;
        document.getElementById('profile-state').textContent = user.addressState;
        document.getElementById('profile-pincode').textContent = user.addressPincode || '-';
        document.getElementById('profile-country').textContent = user.addressCountry || '-';
        document.getElementById('customerProfile').style.display = 'flex';
    } catch (e) {
        alert('User not found');
    }
}

// Close Profile
document.getElementById('closeProfile').addEventListener('click', () => {
    document.getElementById('customerProfile').style.display = 'none';
});

// ---------------------------------------------------------------------
// EDIT USER
// ---------------------------------------------------------------------
async function editCustomer(userId) {
    try {
        const user = await getUserById(userId);
        document.getElementById('edit-id').value = user.userId;
        document.getElementById('edit-firstname').value = user.firstName || '';
        document.getElementById('edit-lastname').value = user.lastName || '';
        document.getElementById('edit-email').value = user.email || '';
        document.getElementById('edit-phone').value = user.phone || '';
        document.getElementById('edit-password').value = '';
        document.getElementById('edit-addrtype').value = user.addressType || 'HOME';
        document.getElementById('edit-landmark').value = user.addressLandmark || '';
        document.getElementById('edit-area').value = user.addressArea || '';
        document.getElementById('edit-city').value = user.addressCity || '';
        document.getElementById('edit-state').value = user.addressState || '';
        document.getElementById('edit-pincode').value = user.addressPincode || '';
        document.getElementById('edit-country').value = user.addressCountry || 'USA';
        document.getElementById('editCustomerModal').style.display = 'flex';
    } catch (e) {
        alert('User not found');
    }
}

// Open edit from profile
document.getElementById('editProfileBtn').addEventListener('click', () => {
    const id = document.getElementById('profile-id').textContent;
    document.getElementById('customerProfile').style.display = 'none';
    editCustomer(id);
});

// ---------------------------------------------------------------------
// SAVE EDITED USER
// ---------------------------------------------------------------------
document.getElementById('editCustomerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = document.getElementById('edit-id').value;
    const payload = {
        firstName: document.getElementById('edit-firstname').value,
        lastName: document.getElementById('edit-lastname').value,
        email: document.getElementById('edit-email').value,
        phone: document.getElementById('edit-phone').value,
        addressLandmark: document.getElementById('edit-landmark').value,
        addressArea: document.getElementById('edit-area').value,
        addressCity: document.getElementById('edit-city').value,
        addressPincode: document.getElementById('edit-pincode').value,
        addressState: document.getElementById('edit-state').value,
        addressCountry: document.getElementById('edit-country').value,
        addressType: document.getElementById('edit-addrtype').value
    };
    const pwd = document.getElementById('edit-password').value.trim();
    if (pwd) payload.password = pwd;
    try {
        await updateUser(userId, payload);
        document.getElementById('editCustomerModal').style.display = 'none';
        const table = $('#customerTable').DataTable();
        await populateTable(table);
        updateStats();
        showSuccessPopup('User updated successfully');
    } catch (err) {
        alert('Update failed');
    }
});

// Cancel / Close Edit Modal
document.getElementById('cancelEdit').addEventListener('click', () => {
    document.getElementById('editCustomerModal').style.display = 'none';
});

document.getElementById('closeEditModal').addEventListener('click', () => {
    document.getElementById('editCustomerModal').style.display = 'none';
});

// ---------------------------------------------------------------------
// CREATE USER
// ---------------------------------------------------------------------
document.getElementById('createCustomerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        firstName: document.getElementById('create-firstname').value,
        lastName: document.getElementById('create-lastname').value,
        email: document.getElementById('create-email').value,
        phone: document.getElementById('create-phone').value,
        password: document.getElementById('create-password').value,
        addressLandmark: document.getElementById('create-landmark').value,
        addressArea: document.getElementById('create-area').value,
        addressCity: document.getElementById('create-city').value,
        addressPincode: document.getElementById('create-pincode').value,
        addressState: document.getElementById('create-state').value,
        addressCountry: document.getElementById('create-country').value,
        addressType: document.getElementById('create-addrtype').value
    };
    try {
        await createUser(payload);
        document.getElementById('createCustomerModal').style.display = 'none';
        const table = $('#customerTable').DataTable();
        await populateTable(table);
        updateStats();
        showSuccessPopup('User created successfully');
    } catch (err) {
        alert('Create failed');
    }
});

// Close create modal
document.getElementById('cancelCreate').addEventListener('click', () => {
    document.getElementById('createCustomerModal').style.display = 'none';
});

document.getElementById('closeCreateModal').addEventListener('click', () => {
    document.getElementById('createCustomerModal').style.display = 'none';
});

// ---------------------------------------------------------------------
// EXPORT TO EXCEL
// ---------------------------------------------------------------------
document.getElementById('exportBtn').addEventListener('click', () => {
    let csv = 'Customer ID,First Name,Last Name,Email,Phone,Landmark,Area,City,Pincode,State,Country,Address Type\n';
    users.forEach((u) => {
        csv += `${u.userId || ''},${u.firstName || ''},${u.lastName || ''},${u.email || ''},${u.phone || ''},${u.addressLandmark || ''},${u.addressArea || ''},${u.addressCity || ''},${u.addressPincode || ''},${u.addressState || ''},${u.addressCountry || ''},${u.addressType || ''}\n`;
    });
    const blob = new Blob([csv], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.xlsx';
    a.click();
});

// ---------------------------------------------------------------------
// SIDEBAR TOGGLE
// ---------------------------------------------------------------------


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


// document.getElementById('toggle-sidebar-mobile').addEventListener('click', () => {
//     const sidebar = document.getElementById('sidebar');
//     sidebar.classList.toggle('-translate-x-full');
// });

// document.getElementById('close-sidebar').addEventListener('click', () => {
//     const sidebar = document.getElementById('sidebar');
//     sidebar.classList.add('-translate-x-full');
// });

// document.getElementById('toggle-sidebar-logo').addEventListener('click', () => {
//     const sidebar = document.getElementById('sidebar');
//     sidebar.classList.toggle('w-64');
//     sidebar.classList.toggle('w-20');
//     document.querySelectorAll('.nav-text').forEach(el => el.classList.toggle('hidden'));
//     document.getElementById('sidebar-arrow').classList.toggle('fa-chevron-right');
//     document.getElementById('sidebar-arrow').classList.toggle('fa-chevron-left');
//     document.querySelectorAll('.nav-icon').forEach(el => {
//         el.classList.toggle('mr-3');
//         el.classList.toggle('mx-auto');
//     });
    
//     // Redraw table to fix alignment after sidebar toggle
//     setTimeout(() => {
//         if ($.fn.DataTable.isDataTable('#customerTable')) {
//             $('#customerTable').DataTable().columns.adjust();
//         }
//     }, 300);
// });

// ---------------------------------------------------------------------
// LOGOUT FUNCTIONALITY – FIXED REDIRECT
// ---------------------------------------------------------------------
$('#logoutBtn').on('click', function () {
  $('#logoutConfirmModal').show();
});

$(document).on('click', '#confirmLogout', function () {
  // 1. Hide the modal immediately
  $('#logoutConfirmModal').hide();

  // 2. Show the success toast
  Toastify({
    text: "Successfully logged out.",
    duration: 3000,
    gravity: "top",
    position: "right",
    style: { background: 'linear-gradient(to right, #00b09b, #96c93d)' }
  }).showToast();

  // 3. **Redirect after the toast has time to appear**
  setTimeout(() => {
    window.location.href = '../Login/login.html';
  }, 300);          // 300 ms is enough – toast appears instantly
});

$(document).on('click', '#cancelLogout, #closeLogoutModal, #logoutConfirmModal', function (e) {
  if (
    e.target.id === 'cancelLogout' ||
    e.target.id === 'closeLogoutModal' ||
    e.target.id === 'logoutConfirmModal'
  ) {
    $('#logoutConfirmModal').hide();
  }
});