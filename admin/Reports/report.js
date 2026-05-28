// report.js - Fully Dynamic Reports Page (Updated with backend DTO usage + Targeted Fixes)

const API_BASE_URL = 'http://localhost:8083/api/reports';

// Pagination & Filter State
let currentPage = 1;
let entriesPerPage = 10;
let currentTab = 'sales';
let reportData = { sales: null, inventory: null, customers: null, financial: null }; // Now stores full DTO
let searchTerm = ''; // For client-side search

// Tab configurations (field names updated to match REAL API responses)
const tabConfigs = {
  sales: {
    cardLabels: ["Total Revenue", "Total Product", "Total Orders", "Total Profit"],
    tableHeaders: ["Sr.No", "Product", "Category", "Subcategory", "Qty", "Revenue", "Date"],
    tableFields: ["id", "productName", "category", "subcategory", "quantity", "revenue", "saleDate"]
  },
  inventory: {
    cardLabels: ["Total Stock Value", "Low Stock Items", "Total Products", "Expiring Soon"],
    tableHeaders: ["Sr.No", "Product", "Category", "Subcategory", "Current Stock", "Stock Value", "Expiry Date"],
    tableFields: ["id", "productName", "category", "subcategory", "currentStock", "stockValue", "expiryDate"]
  },
  customers: {
    cardLabels: ["Total Customers", "Total Orders Counts", "Average Order Value"],
    tableHeaders: ["Sr.No", "Customer", "Last Order Date"],
    tableFields: ["id", "customerName", "lastOrderDate"]
  },
  financial: {
    cardLabels: ["Total Revenue", "Total Expenses", "Net Profit", "Profit Margin"],
    tableHeaders: [], // No detailed table
    tableFields: []
  }
};

// Load Categories & Subcategories Dynamically
async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`);
    const json = await res.json();
    if (json.success) {
      const categorySelect = document.getElementById("categoryFilter");
      categorySelect.innerHTML = '<option value="">All Categories</option>';

      json.data.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.name;
        option.textContent = cat.name;
        categorySelect.appendChild(option);

        option.dataset.subcategories = JSON.stringify(cat.subcategories);
      });
    }
  } catch (err) {
    console.error("Failed to load categories:", err);
  }
}

// Populate Subcategory Dropdown on Category Change
document.getElementById("categoryFilter").addEventListener("change", () => {
  const categorySelect = document.getElementById("categoryFilter");
  const subcategorySelect = document.getElementById("subcategoryFilter");
  subcategorySelect.innerHTML = '<option value="">All Subcategories</option>';

  const selectedOption = categorySelect.options[categorySelect.selectedIndex];
  if (selectedOption.dataset.subcategories) {
    const subs = JSON.parse(selectedOption.dataset.subcategories);
    subs.forEach(sub => {
      const option = document.createElement("option");
      option.value = sub;
      option.textContent = sub;
      subcategorySelect.appendChild(option);
    });
  }

  currentPage = 1;
  fetchReportData(currentTab);
});

// Tab Switcher
const tabs = document.querySelectorAll(".tab-btn");
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(btn => {
      btn.classList.remove("bg-blue-600", "text-white");
      btn.classList.add("bg-gray-200", "text-gray-700");
    });
    tab.classList.remove("bg-gray-200", "text-gray-700");
    tab.classList.add("bg-blue-600", "text-white");

    currentTab = tab.dataset.tab;
    currentPage = 1;
    searchTerm = '';
    document.getElementById("searchInput").value = '';
    fetchReportData(currentTab);
  });
});

// Entries Per Page Change
document.getElementById("entriesPerPage").addEventListener("change", () => {
  entriesPerPage = parseInt(document.getElementById("entriesPerPage").value);
  currentPage = 1;
  fetchReportData(currentTab);
});

// Search Input (client-side)
let searchTimeout;
document.getElementById("searchInput").addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchTerm = e.target.value.toLowerCase().trim();
    renderReport(currentTab);
  }, 300);
});

// Pagination Buttons
document.getElementById("prevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    fetchReportData(currentTab);
  }
});

document.getElementById("nextPage").addEventListener("click", () => {
  const dto = reportData[currentTab];
  if (!dto || !dto.items) return;
  const totalPages = Math.ceil(dto.totalItems / entriesPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    fetchReportData(currentTab);
  }
});

// Generate Button
document.getElementById("generateBtn").addEventListener("click", () => {
  currentPage = 1;
  searchTerm = '';
  document.getElementById("searchInput").value = '';
  fetchReportData(currentTab);
});

// Fetch Data from Backend
async function fetchReportData(tab) {
  const fromDate = document.getElementById("fromDate").value;
  const toDate = document.getElementById("toDate").value;
  const category = document.getElementById("categoryFilter").value;
  const subcategory = document.getElementById("subcategoryFilter").value;

  document.getElementById("reportTableBody").innerHTML = '<tr><td colspan="7" class="text-center py-8">Loading...</td></tr>';
  document.getElementById("summaryCards").innerHTML = '<div class="text-center py-8">Loading summary...</div>';

  try {
    const params = new URLSearchParams({
      from: fromDate,
      to: toDate,
      category: category || '',
      subcategory: subcategory || '',
      page: currentPage,
      limit: entriesPerPage
    });

    const res = await fetch(`${API_BASE_URL}/${tab}?${params.toString()}`);
    const json = await res.json();

    if (json.success) {
      reportData[tab] = json.data;
      console.log(`[${tab}] Full DTO:`, json.data);
      renderReport(tab);
    } else {
      throw new Error(json.message || "Failed to load report");
    }
  } catch (err) {
    console.error("Error fetching report:", err);
    document.getElementById("reportTableBody").innerHTML = '<tr><td colspan="7" class="text-center py-8 text-red-600">Failed to load data. Please try again.</td></tr>';
  }
}

// Render Table & Cards
function renderReport(tab) {
  const dto = reportData[tab];
  if (!dto) return;

  const config = tabConfigs[tab];
  let items = dto.items || [];

  if (searchTerm) {
    items = items.filter(item => 
      JSON.stringify(item).toLowerCase().includes(searchTerm)
    );
  }

  if (config.tableHeaders.length > 0) {
    document.getElementById("tableHeader").innerHTML = `
      <tr class="bg-gray-200 text-gray-600 uppercase text-xs">
        ${config.tableHeaders.map(h => `<th class="px-4 py-3">${h}</th>`).join('')}
      </tr>
    `;
  } else {
    document.getElementById("tableHeader").innerHTML = '';
  }

  const tbody = document.getElementById("reportTableBody");
  tbody.innerHTML = "";

  if (tab === "financial") {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-600">Financial report shows summary only. No detailed transaction list available.</td></tr>';
  } else if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-600">No data found.</td></tr>';
  } else {
    items.forEach((item, index) => {
      const row = document.createElement("tr");
      row.className = "border-t";
      config.tableFields.forEach(field => {
        const td = document.createElement("td");
        td.className = "px-4 py-2";

        let value = item[field];

        if (field === "id") {
          value = (currentPage - 1) * entriesPerPage + index + 1;
        } else if (field === "revenue" || field === "stockValue") {
          value = `₹${(value || 0).toLocaleString()}`;
        } else if (field === "saleDate" || field === "lastOrderDate" || field === "expiryDate") {
          value = value ? new Date(value).toLocaleDateString() : "N/A";
        } else {
          value = value ?? "N/A";
        }

        td.textContent = value;
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
  }

  const totalItems = searchTerm ? items.length : (dto.totalItems || items.length);
  const totalPages = Math.ceil(totalItems / entriesPerPage);
  document.getElementById("pageInfo").textContent = `Showing ${(currentPage - 1) * entriesPerPage + 1} to ${Math.min(currentPage * entriesPerPage, totalItems)} of ${totalItems} entries`;
  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage === totalPages || totalItems === 0;

  updateSummaryCards(tab, dto);
}

// Update Summary Cards
function updateSummaryCards(tab, dto) {
  const config = tabConfigs[tab];
  let cardValues = [];

  if (tab === "sales") {
    // Calculate unique product count for "Total Product" card
    const uniqueProducts = new Set(dto.items?.map(item => item.productName).filter(name => name && name !== "Unknown") || []).size;
    cardValues = [
      `₹${(dto.totalRevenue || 0).toLocaleString()}`,
      uniqueProducts || 0,  // ← now shows count of unique products
      dto.totalOrders || 0,
      `₹${(dto.totalProfit || 0).toLocaleString()}`
    ];
  } else if (tab === "inventory") {
    cardValues = [
      `₹${(dto.totalStockValue || 0).toLocaleString()}`,
      dto.lowStockCount || 0,
      dto.totalProducts || 0,
      dto.expiringSoonCount || 0
    ];
  } else if (tab === "customers") {
    const totalOrdersCount = dto.items?.reduce((sum, item) => sum + (item.totalOrders || 0), 0) || 0;
    cardValues = [
      dto.totalUniqueCustomers || 0,
      totalOrdersCount,
      dto.avgOrderValue ? `₹${Number(dto.avgOrderValue).toLocaleString()}` : "₹0"
    ];
  } else if (tab === "financial") {
    cardValues = [
      `₹${(dto.totalRevenue || 0).toLocaleString()}`,
      `₹${(dto.totalExpenses || 0).toLocaleString()}`,
      `₹${(dto.netProfit || 0).toLocaleString()}`,
      `${(dto.profitMargin || 0).toFixed(2)}%`
    ];
  }

  const cardsContainer = document.getElementById("summaryCards");
  cardsContainer.innerHTML = config.cardLabels.map((label, index) => `
    <div class="bg-white rounded-xl border-l-4 border-blue-500 shadow-md p-5">
      <div class="flex justify-between items-center">
        <div>
          <p class="text-gray-500 text-sm font-medium">${label}</p>
          <h2 class="text-2xl font-bold text-gray-800 mt-1">${cardValues[index] || "N/A"}</h2>
        </div>
        <div class="bg-blue-100 p-3 rounded-full">
          <i class="fas ${
            tab === 'sales' ? 'fa-indian-rupee-sign' :
            tab === 'inventory' ? 'fa-warehouse' :
            tab === 'customers' ? 'fa-users' :
            'fa-chart-line'
          } text-blue-500 text-xl"></i>
        </div>
      </div>
    </div>
  `).join("");
}

// Export Functions (unchanged)
document.getElementById("exportExcel").addEventListener("click", () => {
  const dto = reportData[currentTab];
  if (!dto || !dto.items) return;
  const ws = XLSX.utils.json_to_sheet(dto.items);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `pharmacy_kunash_${currentTab}_Report.xlsx`);
});

// document.getElementById("exportCsv").addEventListener("click", () => {
//   const dto = reportData[currentTab];
//   if (!dto || !dto.items) return;
//   const ws = XLSX.utils.json_to_sheet(dto.items);
//   const csv = XLSX.utils.sheet_to_csv(ws);
//   const blob = new Blob([csv], { type: "text/csv" });
//   const url = window.URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = `pharmacy_kunash_${currentTab}_Report.csv`;
//   a.click();
//   window.URL.revokeObjectURL(url);
// });

document.getElementById("exportPdf").addEventListener("click", () => {
  const dto = reportData[currentTab];
  if (!dto || !dto.items) return;
  const config = tabConfigs[currentTab];

  const tempContainer = document.createElement("div");
  tempContainer.innerHTML = `
    <div class="print-header">pharmacy - ${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)} Report</div>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          ${config.tableHeaders.map(h => `<th style="border: 1px solid #ddd; padding: 8px;">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${dto.items.map((item, index) => `
          <tr>
            ${config.tableFields.map(field => {
              if (field === "id") return `<td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>`;
              if (field === "revenue" || field === "stockValue")
                return `<td style="border: 1px solid #ddd; padding: 8px;">₹${(item[field] || 0).toLocaleString()}</td>`;
              return `<td style="border: 1px solid #ddd; padding: 8px;">${item[field] || "N/A"}</td>`;
            }).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="print-footer">Generated on ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</div>
  `;

  html2pdf()
    .from(tempContainer)
    .set({
      margin: 0.5,
      filename: `pharmacy_kunash_${currentTab}_Report.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "landscape", unit: "in", format: "letter" }
    })
    .save();
});

// Initial Load
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  fetchReportData("sales");
  initializeSidebar();
});

// Sidebar Toggle (unchanged - keeping as is)
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const sidebarArrow = document.getElementById('sidebar-arrow');
  const logoDiv = document.querySelector('div > div');
  const navTexts = document.querySelectorAll('.nav-text');
  const navIcons = document.querySelectorAll('.nav-icon');

  if (window.innerWidth < 768) {
    sidebar.classList.toggle('-translate-x-full');
    sidebar.classList.toggle('translate-x-0');
  } else {
    sidebar.classList.toggle('collapsed');

    if (sidebar.classList.contains('collapsed')) {
      sidebar.style.width = '64px';
      sidebarArrow.classList.remove('fa-chevron-left');
      sidebarArrow.classList.add('fa-chevron-right');

      logoDiv.style.opacity = '0';
      logoDiv.style.width = '0';

      navTexts.forEach((text, index) => {
        text.style.opacity = '0';
        text.style.width = '0';
        text.style.overflow = 'hidden';
        text.style.transitionDelay = `${index * 20}ms`;
      });

      navIcons.forEach(icon => {
        icon.style.marginLeft = '0';
        icon.style.marginRight = '0';
      });
    } else {
      sidebar.style.width = '256px';
      sidebarArrow.classList.remove('fa-chevron-right');
      sidebarArrow.classList.add('fa-chevron-left');

      logoDiv.style.opacity = '1';
      logoDiv.style.width = 'auto';

      navTexts.forEach((text, index) => {
        text.style.opacity = '1';
        text.style.width = 'auto';
        text.style.overflow = 'visible';
        text.style.transitionDelay = `${index * 20}ms`;
      });

      navIcons.forEach(icon => {
        icon.style.marginLeft = '0';
        icon.style.marginRight = '0.75rem';
      });
    }
  }
}

document.getElementById('toggle-sidebar-logo').addEventListener('click', toggleSidebar);
document.getElementById('close-sidebar').addEventListener('click', () => {
  document.getElementById('sidebar').classList.add('-translate-x-full');
  document.getElementById('sidebar').classList.remove('translate-x-0');
});

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

  if (window.innerWidth >= 768) {
    sidebar.classList.remove('collapsed');
    sidebarArrow.classList.remove('fa-chevron-right');
    sidebarArrow.classList.add('fa-chevron-left');
  } else {
    sidebar.classList.add('-translate-x-full');
  }
}