

//====================== old backup order Management with html 

// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Good Neews - Order Management</title>
//     <script src="https://cdn.tailwindcss.com"></script>
//     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
//     <!-- SheetJS for Excel Export -->
//     <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
//     <style>
//         .modal {
//             display: none;
//             position: fixed;
//             inset: 0;
//             background: rgba(0,0,0,0.5);
//             z-index: 50;
//             overflow-y: auto;
//             align-items: center;
//             justify-content: center;
//         }
//         .modal.show {
//             display: flex;
//         }
//         .status-badge {
//             @apply inline-block px-2 py-1 text-xs font-semibold rounded-full;
//         }
//         .status-pending { @apply bg-yellow-100 text-yellow-800; }
//         .status-confirmed { @apply bg-blue-100 text-blue-800; }
//         .status-processing { @apply bg-purple-100 text-purple-800; }
//         .status-shipped { @apply bg-indigo-100 text-indigo-800; }
//         .status-delivered { @apply bg-green-100 text-green-800; }
//         .status-cancelled { @apply bg-red-100 text-red-800; }
//         .status-returned { @apply bg-gray-100 text-gray-800; }
       
//         /* Print Styles */
//         @media print {
//             body * { visibility: hidden; }
//             #printableInvoice, #printableInvoice * { visibility: visible; }
//             #printableInvoice {
//                 position: absolute;
//                 left: 0; top: 0;
//                 width: 100%;
//                 padding: 40px;
//                 font-size: 12px;
//             }
//             .no-print { display: none !important; }
//             .print-logo { max-width: 120px; }
//             table { font-size: 11px; }
//         }
       
//         /* Notification bell */
//         #bellAlert {
//             transition: transform 0.3s ease;
//         }
       
//         /* Table styling */
//         .order-table {
//             border-collapse: separate;
//             border-spacing: 0;
//         }
//         .order-table th {
//             background-color: #f8fafc;
//             font-weight: 600;
//             text-transform: uppercase;
//             font-size: 0.75rem;
//             letter-spacing: 0.05em;
//         }
//         .order-table tbody tr:hover {
//             background-color: #f1f5f9;
//         }
       
//         /* Sidebar styles */
//         .nav-icon {
//             @apply w-5 text-center;
//         }
//         .nav-text {
//             @apply whitespace-nowrap overflow-hidden transition-all;
//         }
//         #sidebar {
//             transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
//         }
//         #sidebar.collapsed {
//             width: 64px !important;
//         }
//         #sidebar:not(.collapsed) {
//             width: 256px !important;
//         }
//         .nav-text {
//             transition: all 0.3s ease-in-out;
//             white-space: nowrap;
//             overflow: hidden;
//         }
//         .nav-icon {
//             transition: all 0.3s ease-in-out;
//             min-width: 20px;
//         }
//         li {
//             transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
//         }
//         li:nth-child(1) { transition-delay: 0ms; }
//         li:nth-child(2) { transition-delay: 20ms; }
//         li:nth-child(3) { transition-delay: 40ms; }
//         li:nth-child(4) { transition-delay: 60ms; }
//         li:nth-child(5) { transition-delay: 80ms; }
//         li:nth-child(6) { transition-delay: 100ms; }
//         li:nth-child(7) { transition-delay: 120ms; }
//         li:nth-child(8) { transition-delay: 140ms; }
//         li:nth-child(9) { transition-delay: 160ms; }
//         li:nth-child(10) { transition-delay: 180ms; }
//         li:nth-child(11) { transition-delay: 200ms; }
        
//         .menu-hidden {
//   display: none !important;
//  }
//     </style>
// </head>
// <body class="bg-gray-50 h-screen flex overflow-hidden">
//     <!-- Sidebar -->
//     <aside id="sidebar"
//         class="border w-64 bg-white text-white flex-shrink-0 flex flex-col fixed h-full z-20 md:static transition-all duration-300 ease-in-out">
//         <div class="border-b p-4 bg-black sticky top-0 z-10 flex justify-between items-center">
//             <div class="ml-6 transition-all duration-300 ease-in-out overflow-hidden">
//                 <img src="../Images/logo.png" alt="PharmaCare Logo"
//                     class="w-full h-[44px] sidebar-logo-expanded transition-all duration-300 ease-in-out">
//             </div>
//             <div class="flex items-center space-x-2">
//                 <button id="toggle-sidebar-logo" class="flex items-center transition-all duration-300 ease-in-out">
//                     <i id="sidebar-arrow"
//                         class="fas fa-chevron-left ml-2 text-white transition-transform duration-300 ease-in-out"></i>
//                 </button>
//                 <button id="close-sidebar" class="md:hidden text-black transition-all duration-300 ease-in-out">
//                     <i class="fas fa-times"></i>
//                 </button>
//             </div>
//         </div>
//         <nav class="flex-1 overflow-y-auto py-4 transition-all duration-300 ease-in-out">
//             <ul class="space-y-1">
//                 <li data-menu-type="dashboard" class="hover:bg-blue-700 hover:text-white transition-all duration-200 ease-in-out rounded-md">
//                     <a href="../Dashboard/dashboard.html"
//                         class="flex items-center py-3 px-4 text-gray-700 hover:text-white transition-colors duration-200">
//                         <i class="fas fa-home mr-3 nav-icon transition-all duration-200"></i>
//                         <span class="nav-text transition-all duration-200">Dashboard</span>
//                     </a>
//                 </li>
//                 <li class="hover:bg-blue-700 hover:text-white transition-all duration-200 ease-in-out rounded-md">
//                     <a href="../Inventory/inventory.html"
//                         class="flex items-center py-3 px-4 text-gray-700 hover:text-white transition-colors duration-200">
//                         <i class="fas fa-pills mr-3 nav-icon transition-all duration-200"></i>
//                         <span class="nav-text transition-all duration-200">Inventory Management</span>
//                     </a>
//                 </li>
//                 <li class="hover:bg-blue-700 hover:text-white transition-all duration-200 ease-in-out rounded-md">
//                     <a href="../Prescriptions/prescription.html"
//                         class="flex items-center py-3 px-4 text-gray-700 hover:text-white transition-colors duration-200">
//                         <i class="fas fa-file-prescription mr-3 nav-icon transition-all duration-200"></i>
//                         <span class="nav-text transition-all duration-200">Prescriptions</span>
//                     </a>
//                 </li>
//                 <li data-menu-type="customers" class="hover:bg-blue-700 hover:text-white transition-all duration-200 ease-in-out rounded-md">
//                     <a href="../Customer/customer management.html"
//                         class="flex items-center py-3 px-4 text-gray-700 hover:text-white transition-colors duration-200">
//                         <i class="fas fa-users mr-3 nav-icon transition-all duration-200"></i>
//                         <span class="nav-text transition-all duration-200">Customers Management</span>
//                     </a>
//                 </li>
//                 <li class="bg-blue-700 text-white rounded-md transition-all duration-200 ease-in-out">
//                     <a href="../Order/ordermanagment.html"
//                         class="flex items-center py-3 px-4 text-gray-700 text-white transition-colors duration-200">
//                         <i class="fas fa-shopping-cart mr-3 nav-icon transition-all duration-200"></i>
//                         <span class="nav-text transition-all duration-200">Order Management</span>
//                     </a>
//                 </li>
//                 <li class="hover:bg-blue-700 hover:text-white transition-all duration-200 ease-in-out rounded-md">
//                     <a href="../Product Management/product.html"
//                         class="flex items-center py-3 px-4 text-gray-700 hover:text-white transition-colors duration-200">
//                         <i class="fas fa-box mr-3 nav-icon transition-all duration-200"></i>
//                         <span class="nav-text transition-all duration-200 ">Medicine Product Management</span>
//                     </a>
//                 </li>
//                 <li class="hover:bg-blue-700 hover:text-white transition-all duration-200 ease-in-out rounded-md">
//                     <a href="../Mother and Baby Care/motherbabycare.html"
//                         class="flex items-center py-3 px-4 text-gray-700 hover:text-white transition-colors duration-200">
//                         <i class="fa-solid fa-baby mr-3 nav-icon transition-all duration-200"></i>
//                         <span class="nav-text transition-all duration-200">Mother & Baby Care Product Management</span>
//                     </a>
//                 </li>
//                 <li class="hover:bg-blue-700 hover:text-white transition-all duration-200 ease-in-out rounded-md">
//                     <a href="../Banner/banner.html"
//                         class="flex items-center py-3 px-4 text-gray-700 hover:text-white transition-colors duration-200">
//                         <i class="fas fa-image mr-3 nav-icon transition-all duration-200"></i>
//                         <span class="nav-text transition-all duration-200">Banner Management</span>
//                     </a>
//                 </li>
//                 <li data-menu-type="reports" class="hover:bg-blue-700 hover:text-white transition-all duration-200 ease-in-out rounded-md">
//                     <a href="../Reports/report.html"
//                         class="flex items-center py-3 px-4 text-gray-700 hover:text-white transition-colors duration-200">
//                         <i class="fas fa-file-invoice mr-3 nav-icon transition-all duration-200"></i>
//                         <span class="nav-text transition-all duration-200">Reports</span>
//                     </a>
//                 </li>
//                 <li data-menu-type="admin-management" class="hover:bg-blue-700 hover:text-white transition-all duration-200 ease-in-out rounded-md mb-4">
//                     <a href="../Admin/admin.html"
//                         class="flex items-center py-3 px-4 text-gray-700 hover:text-white transition-colors duration-200">
//                         <i class="fas fa-user-shield mr-3 nav-icon transition-all duration-200"></i>
//                         <span class="nav-text transition-all duration-200">Admin Management</span>
//                     </a>
//                 </li>
//                 <li class="hover:bg-blue-700 hover:text-white transition-all duration-200 ease-in-out rounded-md">
//                     <button id="logoutBtn"
//                         class="flex items-center w-full py-3 px-4 text-gray-700 hover:text-white font-semibold text-left transition-colors duration-200">
//                         <i class="fas fa-sign-out-alt mr-3 nav-icon transition-all duration-200"></i>
//                         <span class="nav-text transition-all duration-200">Logout</span>
//                     </button>
//                 </li>
//             </ul>
//         </nav>
//     </aside>

//     <!-- Main Content Area -->
//     <div class="flex-1 flex flex-col overflow-hidden">
//         <!-- Header -->
//         <header class="bg-white shadow sticky top-0 z-10">
//             <div class="flex justify-between items-center p-4">
//                 <div class="flex items-center">
//                     <button id="toggle-sidebar-mobile" class="text-gray-500 mr-4 md:hidden">
//                         <i class="fas fa-bars"></i>
//                     </button>
//                     <h1 class="text-2xl font-bold text-gray-800">Order Management</h1>
//                 </div>
//                 <div class="flex items-center space-x-4">
//                     <div class="flex items-center">
//                         <div id="user-initials" class="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-semibold">SK</div>
//                         <div class="ml-2 hidden md:block">
//                             <span id="user-name" class="text-gray-800 text-sm"></span>
//                             <span id="user-role" class="text-gray-500 text-xs block"></span>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </header>

//         <!-- Main Content -->
//         <div class="flex-1 overflow-y-auto p-6">
//             <!-- Order Statistics -->
//             <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//                 <div class="bg-white rounded-lg shadow-sm p-4">
//                     <div class="flex items-center justify-between">
//                         <div>
//                             <p class="text-sm font-medium text-gray-600">Total Orders</p>
//                             <p class="text-xl font-bold text-gray-900" id="totalOrders">0</p>
//                         </div>
//                         <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
//                             <i class="fas fa-shopping-cart text-blue-600"></i>
//                         </div>
//                     </div>
//                 </div>
//                 <div class="bg-white rounded-lg shadow-sm p-4">
//                     <div class="flex items-center justify-between">
//                         <div>
//                             <p class="text-sm font-medium text-gray-600">Placed</p>
//                             <p class="text-xl font-bold text-yellow-600" id="pendingOrders">0</p>
//                         </div>
//                         <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
//                             <i class="fas fa-hourglass-half text-yellow-600"></i>
//                         </div>
//                     </div>
//                 </div>
//                 <div class="bg-white rounded-lg shadow-sm p-4">
//                     <div class="flex items-center justify-between">
//                         <div>
//                             <p class="text-sm font-medium text-gray-600">Delivered</p>
//                             <p class="text-xl font-bold text-green-600" id="deliveredOrders">0</p>
//                         </div>
//                         <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
//                             <i class="fas fa-check-circle text-green-600"></i>
//                         </div>
//                     </div>
//                 </div>
//                 <div class="bg-white rounded-lg shadow-sm p-4">
//                     <div class="flex items-center justify-between">
//                         <div>
//                             <p class="text-sm font-medium text-gray-600">Today's Revenue</p>
//                             <p class="text-xl font-bold text-blue-600" id="revenueToday">₹0</p>
//                         </div>
//                         <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
//                             <i class="fas fa-rupee-sign text-blue-600"></i>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <!-- Search and Filter Section -->
//             <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
//                 <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
//                     <div class="flex flex-col sm:flex-row gap-4 flex-1">
//                         <div class="relative flex-1">
//                             <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
//                             <input type="text" id="searchInput" placeholder="Search customer name..."
//                                   class="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
//                         </div>
//                         <select id="statusFilter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
//                             <option value="">All Status</option>
//                             <option value="PLACED">PLACED</option>
//                             <option value="CANCELLED">CANCELLED</option>
//                             <option value="DELIVERED">DELIVERED</option>
//                         </select>
//                         <div class="flex gap-2">
//                             <input type="date" id="dateFrom" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
//                             <input type="date" id="dateTo" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
//                         </div>
//                     </div>
//                     <div class="flex gap-2">
//                         <button id="clearFilters" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
//                             Clear Filters
//                         </button>
//                         <button id="exportOrders" class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
//                             <i class="fas fa-download mr-2"></i>Export to Excel
//                         </button>
//                     </div>
//                 </div>
//             </div>

//             <!-- Orders Table -->
//             <div class="bg-white rounded-lg shadow-sm overflow-hidden">
//                 <div class="p-6 border-b border-gray-200">
//                     <h3 class="text-lg font-semibold text-gray-800">Orders List</h3>
//                 </div>
//                 <div class="overflow-x-auto h-[400px]">
//                     <table class="w-full">
//                         <thead class="bg-gray-50 sticky top-0">
//                             <tr>
//                                 <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
//                                 <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
//                                 <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
//                                 <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Mode</th>
//                                 <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                                 <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
//                                 <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody id="orderTableBody" class="bg-white divide-y divide-gray-200">
//                             <!-- Populated by JS -->
//                         </tbody>
//                     </table>
//                 </div>
//                 <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
//                     <div class="text-sm text-gray-500">
//                         Showing <span id="showingStart">1</span> to <span id="showingEnd">10</span> of <span id="totalOrdersCount">0</span> orders
//                     </div>
//                     <div class="flex items-center space-x-2">
//                         <button id="prevPage" class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
//                             Previous
//                         </button>
//                         <span id="currentPage" class="px-3 py-1 text-sm font-medium">1</span>
//                         <button id="nextPage" class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
//                             Next
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     </div>

//     <!-- Order Details Modal -->
//     <div id="orderModal" class="modal">
//         <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
//             <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
//                 <h3 class="text-lg font-semibold text-gray-800" id="modalOrderNumber">Order Details</h3>
//                 <button id="closeModal" class="text-gray-400 hover:text-gray-600">
//                     <i class="fas fa-times text-xl"></i>
//                 </button>
//             </div>
//             <div class="p-6">
//                 <div id="orderDetails"></div>
//             </div>
//             <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
//                 <button id="printOrder" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
//                     <i class="fas fa-print mr-2"></i>Print
//                 </button>
//                 <button id="updateOrderStatus" class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
//                     Update Status
//                 </button>
//             </div>
//         </div>
//     </div>

//     <!-- Status Update Modal -->
//     <div id="statusModal" class="modal">
//         <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
//             <div class="px-6 py-4 border-b border-gray-200">
//                 <h3 class="text-lg font-semibold text-gray-800">Update Order Status</h3>
//             </div>
//             <div class="p-6">
//                 <div class="mb-4">
//                     <label for="newStatus" class="block text-sm font-medium text-gray-700 mb-2">New Status</label>
//                     <select id="newStatus" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
//                         <option value="PLACED">Placed</option>
//                         <option value="DELIVERED">Delivered</option>
//                         <option value="CANCELLED">Cancelled</option>
//                     </select>
//                 </div>
//             </div>
//             <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
//                 <button id="cancelStatusUpdate" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
//                     Cancel
//                 </button>
//                 <button id="confirmStatusUpdate" class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
//                     Update Status
//                 </button>
//             </div>
//         </div>
//     </div>

//     <!-- Printable Invoice -->
//     <div id="printableInvoice" class="hidden bg-white p-8 max-w-4xl mx-auto font-sans text-sm">
//         <div class="flex justify-between items-start border-b pb-6 mb-6">
//             <div>
//                 <img src="../Images/logo.png" alt="PharmaCare" class="print-logo w-32 mb-4">
//                 <p>Pune, Maharashtra</p>
//                 <p><strong>Contact:</strong> +91 7020799618</p>
//             </div>
//             <div class="text-right">
//                 <h2 class="text-xl font-bold">INVOICE</h2>
//                 <p><strong>Order ID:</strong> #<span id="printOrderId"></span></p>
//                 <p><strong>Order Date & Time:</strong> <span id="printOrderDate"></span></p>
//             </div>
//         </div>
//         <div class="grid grid-cols-2 gap-6 mb-6">
//             <div>
//                 <h3 class="font-bold mb-2">Bill To:</h3>
//                 <p id="printCustomerName"></p>
//                 <p id="printCustomerPhone"></p>
//             </div>
//             <div>
//                 <h3 class="font-bold mb-2">Shipping To:</h3>
//                 <p id="printShippingName"></p>
//                 <p id="printShippingAddress"></p>
//                 <p id="printShippingPhone"></p>
//             </div>
//         </div>
//         <table class="w-full border-collapse mb-6">
//             <thead>
//                 <tr class="bg-gray-100">
//                     <th class="border p-2 text-left">Product</th>
//                     <th class="border p-2 text-center">Qty</th>
//                     <th class="border p-2 text-right">Rate</th>
//                     <th class="border p-2 text-right">Amount</th>
//                 </tr>
//             </thead>
//             <tbody id="printItemsTable"></tbody>
//             <tfoot>
//                 <tr>
//                     <td colspan="3" class="border p-2 text-right font-bold">Subtotal</td>
//                     <td class="border p-2 text-right" id="printSubtotal"></td>
//                 </tr>
//                 <tr>
//                     <td colspan="3" class="border p-2 text-right">Discount</td>
//                     <td class="border p-2 text-right" id="printDiscount"></td>
//                 </tr>
//                 <tr class="font-bold text-lg">
//                     <td colspan="3" class="border p-2 text-right bg-gray-100">Total</td>
//                     <td class="border p-2 text-right bg-gray-100" id="printTotal"></td>
//                 </tr>
//             </tfoot>
//         </table>
//         <div class="text-center text-xs text-gray-600">
//             <p>Thank you for your order!</p>
//             <p>In case of issues, contact: 7020799618</p>
//             <p>Consult your doctor before taking any medication</p>
//         </div>
//     </div>

//     <!-- Logout Confirmation Modal -->
//     <div id="logoutConfirmModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//         <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
//             <div class="flex justify-between items-center mb-4">
//                 <h3 class="text-lg font-semibold text-gray-800">Confirm Logout</h3>
//                 <button id="closeLogoutModal" class="text-gray-400 hover:text-gray-600 transition">
//                     <i class="fas fa-times"></i>
//                 </button>
//             </div>
//             <p class="text-gray-600 mb-6 text-center">Are you sure you want to logout?</p>
//             <div class="flex justify-center gap-3">
//                 <button id="logoutConfirmYes" class="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition">
//                     Yes
//                 </button>
//                 <button id="logoutConfirmNo" class="bg-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-400 transition">
//                     No
//                 </button>
//             </div>
//         </div>
//     </div>

//     <!-- Success Popup -->
//     <div id="successPopup" class="modal">
//         <div class="popup-container">
//             <i class="fas fa-check-circle"></i>
//             <p id="successMessage"></p>
//             <button id="closeSuccessPopup">OK</button>
//         </div>
//     </div>

//     <script>
//         const API_BASE = 'http://localhost:8083/api/orders';

//         // Global State
//         let ordersData = [];
//         let filteredOrders = [];
//         let currentOrderId = null;
//         let currentPage = 1;
//         const ordersPerPage = 10;
//         let seenOrderIds = new Set(JSON.parse(localStorage.getItem('seenPharmaOrders') || '[]'));

//         // Bell System
//         let bellAudio = null;
//         let isBellPlaying = false;
//         let originalTitle = document.title;
//         let flashInterval = null;

//         (function autoLoadBell() {
//             bellAudio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-bell-notification-933.mp3');
//             bellAudio.preload = 'auto';
//             bellAudio.volume = 0.9;
//             bellAudio.addEventListener('canplaythrough', () => {
//                 console.log('Bell sound fully loaded & ready!');
//             });
//             bellAudio.addEventListener('ended', () => {
//                 isBellPlaying = false;
//             });
//             bellAudio.addEventListener('error', (e) => {
//                 console.error('Failed to load bell sound:', e);
//             });
//             bellAudio.load();
//         })();

//         function debounce(func, delay) {
//             let timeoutId;
//             return function (...args) {
//                 clearTimeout(timeoutId);
//                 timeoutId = setTimeout(() => func.apply(this, args), delay);
//             };
//         }

//         // Parse "MM/DD/YYYY hh:mm AM/PM" → YYYY-MM-DD for filtering
//         function parseOrderDateForFilter(dateStr) {
//             if (!dateStr || dateStr === '-') return '-';
//             const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
//             if (!match) return '-';
//             const [, month, day, year] = match;
//             return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
//         }

//         function normalizeOrder(apiOrder) {
//             const parsedDate = parseOrderDateForFilter(apiOrder.orderDate);
//             return {
//                 orderId: apiOrder.orderId || 0,
//                 customerName: `${apiOrder.customerFirstName || ''} ${apiOrder.customerLastName || ''}`.trim() || 'N/A',
//                 customerPhone: apiOrder.customerPhone || 'N/A',
//                 customerEmail: apiOrder.customerEmail || '-',
//                 shippingName: `${apiOrder.shippingFirstName || ''} ${apiOrder.shippingLastName || ''}`.trim() || 'N/A',
//                 shippingAddress: [apiOrder.shippingAddress, apiOrder.shippingAddress2, apiOrder.shippingCity, apiOrder.shippingState, apiOrder.shippingPincode]
//                     .filter(Boolean).join(', ') || 'Not provided',
//                 shippingPhone: apiOrder.shippingPhone || apiOrder.customerPhone || 'N/A',
//                 totalAmount: Number(apiOrder.totalAmount) || 0,
//                 tax: Number(apiOrder.tax || 0),
//                 couponApplied: Number(apiOrder.couponApplied || 0),
//                 convenienceFee: Number(apiOrder.convenienceFee || 0),
//                 discountAmount: Number(apiOrder.discountAmount || 0),
//                 discountPercent: Number(apiOrder.discountPercent || 0),
//                 subtotal: Number(apiOrder.totalAmount) + Number(apiOrder.couponApplied || 0) - Number(apiOrder.tax || 0),
//                 orderStatus: (apiOrder.orderStatus || 'PLACED').toUpperCase(),
//                 orderDate: parsedDate, // for filtering
//                 rawOrderDate: apiOrder.orderDate || '-', // full date-time string for display
//                 paymentMethod: apiOrder.paymentMethod || 'COD',
//                 orderItems: apiOrder.orderItems || []
//             };
//         }

//         function updateStatistics() {
//             const today = new Date().toISOString().split('T')[0];
//             const todayDeliveredOrders = ordersData.filter(o => 
//                 o.orderStatus === 'DELIVERED' && o.orderDate === today
//             );
//             const todayRevenue = todayDeliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

//             document.getElementById('totalOrders').textContent = ordersData.length;
//             document.getElementById('pendingOrders').textContent = ordersData.filter(o => o.orderStatus === 'PLACED').length;
//             document.getElementById('deliveredOrders').textContent = ordersData.filter(o => o.orderStatus === 'DELIVERED').length;
//             document.getElementById('revenueToday').textContent = `₹${todayRevenue.toFixed(2)}`;
//         }

//         function renderOrders() {
//             const tbody = document.getElementById('orderTableBody');
//             if (!tbody) return;

//             const start = (currentPage - 1) * ordersPerPage;
//             const end = start + ordersPerPage;
//             const pageOrders = filteredOrders.slice(start, end);

//             tbody.innerHTML = '';
//             if (pageOrders.length === 0) {
//                 tbody.innerHTML = '<tr><td colspan="7" class="text-center py-12 text-gray-500 text-lg">No orders found</td></tr>';
//                 updatePaginationInfo();
//                 return;
//             }

//             pageOrders.forEach(order => {
//                 const statusClass = order.orderStatus === 'PLACED' ? 'bg-blue-100 text-blue-800' :
//                                   order.orderStatus === 'DELIVERED' ? 'bg-green-100 text-green-800' :
//                                   order.orderStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' :
//                                   'bg-gray-100 text-gray-800';

//                 const row = document.createElement('tr');
//                 row.className = 'hover:bg-gray-50 cursor-pointer border-b';
//                 row.innerHTML = `
//                     <td class="px-6 py-4 text-sm font-medium text-gray-900">#${order.orderId}</td>
//                     <td class="px-6 py-4">
//                         <div class="text-sm font-medium text-gray-900">${order.customerName}</div>
//                         <div class="text-sm text-gray-500">${order.customerPhone}</div>
//                     </td>
//                     <td class="px-6 py-4 text-sm text-gray-600">${order.rawOrderDate}</td>
//                     <td class="px-6 py-4 text-sm text-gray-600">${order.paymentMethod}</td>
//                     <td class="px-6 py-4">
//                         <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full ${statusClass}">${order.orderStatus}</span>
//                     </td>
//                     <td class="px-6 py-4 text-sm font-semibold text-gray-900">₹${order.totalAmount.toFixed(2)}</td>
//                     <td class="px-6 py-4 text-sm flex space-x-4">
//                         <button class="text-blue-600 hover:text-blue-800 view-order" data-id="${order.orderId}" title="View Order">
//                             <i class="fas fa-eye"></i>
//                         </button>
//                         <button class="text-yellow-600 hover:text-yellow-800 edit-status" data-id="${order.orderId}" title="Edit Status">
//                             <i class="fas fa-pencil-alt"></i>
//                         </button>
//                     </td>
//                 `;
//                 tbody.appendChild(row);
//             });

//             attachTableButtonEvents();
//             updatePaginationInfo();
//         }

//         function applyFilters() {
//             const search = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
//             const status = document.getElementById('statusFilter')?.value || '';
//             const from = document.getElementById('dateFrom')?.value || '';
//             const to = document.getElementById('dateTo')?.value || '';

//             filteredOrders = ordersData.filter(order => {
//                 const matchesSearch = !search || 
//                     String(order.orderId).includes(search) ||
//                     order.customerName.toLowerCase().includes(search) ||
//                     order.customerPhone.includes(search);

//                 const matchesStatus = !status || order.orderStatus === status;

//                 const matchesDateRange = (!from || order.orderDate >= from) && (!to || order.orderDate <= to);

//                 return matchesSearch && matchesStatus && matchesDateRange;
//             });

//             currentPage = 1;
//             renderOrders();
//         }

//         const debouncedApplyFilters = debounce(applyFilters, 300);

//         function updatePaginationInfo() {
//             const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
//             const start = filteredOrders.length > 0 ? (currentPage - 1) * ordersPerPage + 1 : 0;
//             const end = Math.min(currentPage * ordersPerPage, filteredOrders.length);

//             document.getElementById('showingStart').textContent = start;
//             document.getElementById('showingEnd').textContent = end;
//             document.getElementById('totalOrdersCount').textContent = filteredOrders.length;
//             document.getElementById('currentPage').textContent = currentPage;
//             document.getElementById('prevPage').disabled = currentPage === 1;
//             document.getElementById('nextPage').disabled = currentPage >= totalPages || totalPages === 0;
//         }

//         function attachTableButtonEvents() {
//             document.querySelectorAll('.view-order').forEach(btn => {
//                 btn.onclick = (e) => {
//                     e.stopPropagation();
//                     viewOrderDetails(btn.dataset.id);
//                 };
//             });

//             document.querySelectorAll('.edit-status').forEach(btn => {
//                 btn.onclick = (e) => {
//                     e.stopPropagation();
//                     currentOrderId = btn.dataset.id;
//                     const order = filteredOrders.find(o => o.orderId == currentOrderId);
//                     document.getElementById('statusModal').classList.add('show');
//                     document.getElementById('newStatus').value = order?.orderStatus || 'PLACED';
//                 };
//             });
//         }

//         async function viewOrderDetails(orderId) {
//             try {
//                 const res = await fetch(`${API_BASE}/get-by-order-id/${orderId}`);
//                 if (!res.ok) throw new Error('Order not found');
//                 const apiOrder = await res.json();
//                 const order = normalizeOrder(apiOrder);
//                 currentOrderId = orderId;

//                 document.getElementById('modalOrderNumber').textContent = `Order #${orderId} Details`;

//                 const itemsHtml = order.orderItems.length > 0 ? order.orderItems.map(item => `
//                     <tr class="border-b">
//                         <td class="px-4 py-3">
//                             <div class="font-medium text-gray-900">${item.itemName || 'Medicine'}</div>
//                         </td>
//                         <td class="px-4 py-3 text-center">${item.quantity || 1}</td>
//                         <td class="px-4 py-3 text-right">₹${(item.itemPrice || 0).toFixed(2)}</td>
//                         <td class="px-4 py-3 text-right font-medium">₹${(item.subtotal || 0).toFixed(2)}</td>
//                     </tr>
//                 `).join('') : '<tr><td colspan="4" class="text-center py-10 text-gray-500">No items found</td></tr>';

//                 document.getElementById('orderDetails').innerHTML = `
//                     <div class="grid md:grid-cols-2 gap-8 mb-8">
//                         <div class="bg-gray-50 p-5 rounded-lg">
//                             <h4 class="font-bold text-lg mb-3 text-gray-800">Customer Information</h4>
//                             <p><strong>Name:</strong> ${order.customerName}</p>
//                             <p><strong>Phone:</strong> ${order.customerPhone}</p>
//                             <p><strong>Order Date & Time:</strong> ${order.rawOrderDate}</p>
//                         </div>
//                         <div class="bg-gray-50 p-5 rounded-lg">
//                             <h4 class="font-bold text-lg mb-3 text-gray-800">Shipping Information</h4>
//                             <p><strong>Name:</strong> ${order.shippingName}</p>
//                             <p><strong>Address:</strong> ${order.shippingAddress}</p>
//                             <p><strong>Phone:</strong> ${order.shippingPhone}</p>
//                             <p><strong>Payment Mode:</strong> <span class="text-md bg-blue-100 text-blue-800 px-2 rounded-md">${order.paymentMethod}</span></p>
//                         </div>
//                     </div>
//                     <div class="mt-8">
//                         <h4 class="font-bold text-lg mb-4 text-gray-800">Order Items</h4>
//                         <div class="overflow-x-auto">
//                             <table class="w-full border border-gray-300">
//                                 <thead class="bg-gray-100">
//                                     <tr>
//                                         <th class="px-4 py-3 text-left text-sm font-semibold">Product</th>
//                                         <th class="px-4 py-3 text-center text-sm font-semibold">Qty</th>
//                                         <th class="px-4 py-3 text-right text-sm font-semibold">Price</th>
//                                         <th class="px-4 py-3 text-right text-sm font-semibold">Amount</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>${itemsHtml}</tbody>
//                                 <tfoot class="bg-gray-100 font-semibold">
//                                     <tr><td colspan="3" class="text-right px-4 py-3">Subtotal:</td><td class="text-right px-4 py-3">₹${order.subtotal.toFixed(2)}</td></tr>
//                                     ${order.convenienceFee > 0 ? `<tr><td colspan="3" class="text-right px-4 py-3 text-orange-600">Convenience Fee:</td><td class="text-right px-4 py-3 text-orange-600">+₹${order.convenienceFee.toFixed(2)}</td></tr>` : ''}
//                                     <tr><td colspan="3" class="text-right px-4 py-3">Discount:</td><td class="text-right px-4 py-3">-₹${order.discountAmount.toFixed(2)}</td></tr>
//                                     <tr class="text-lg font-bold"><td colspan="3" class="text-right px-4 py-3">Total Amount:</td><td class="text-right px-4 py-3 text-blue-600">₹${order.totalAmount.toFixed(2)}</td></tr>
//                                 </tfoot>
//                             </table>
//                         </div>
//                     </div>
//                 `;

//                 document.getElementById('orderModal').classList.add('show');
//             } catch (err) {
//                 showNotification('Failed to load order details', 'error');
//                 console.error(err);
//             }
//         }

//         document.getElementById('printOrder')?.addEventListener('click', async () => {
//             if (!currentOrderId) return;
//             try {
//                 const res = await fetch(`${API_BASE}/get-by-order-id/${currentOrderId}`);
//                 if (!res.ok) throw new Error();
//                 const apiOrder = await res.json();
//                 const order = normalizeOrder(apiOrder);

//                 document.getElementById('printOrderId').textContent = order.orderId;
//                 document.getElementById('printOrderDate').textContent = order.rawOrderDate;
//                 document.getElementById('printCustomerName').textContent = order.customerName;
//                 document.getElementById('printCustomerPhone').textContent = order.customerPhone;
//                 document.getElementById('printShippingName').textContent = order.shippingName;
//                 document.getElementById('printShippingAddress').textContent = order.shippingAddress;
//                 document.getElementById('printShippingPhone').textContent = order.shippingPhone;

//                 const itemsTable = document.getElementById('printItemsTable');
//                 itemsTable.innerHTML = order.orderItems.length > 0 ? order.orderItems.map(item => `
//                     <tr>
//                         <td class="border p-2">${item.itemName || 'Medicine'}</td>
//                         <td class="border p-2 text-center">${item.quantity || 1}</td>
//                         <td class="border p-2 text-right">₹${(Number(item.itemPrice) || 0).toFixed(2)}</td>
//                         <td class="border p-2 text-right">₹${(Number(item.subtotal) || 0).toFixed(2)}</td>
//                     </tr>
//                 `).join('') : '<tr><td colspan="4" class="text-center py-4 border">No items</td></tr>';

//                 document.getElementById('printSubtotal').textContent = `₹${order.subtotal.toFixed(2)}`;
//                 document.getElementById('printDiscount').textContent = `-₹${order.discountAmount.toFixed(2)}`;
//                 document.getElementById('printTotal').textContent = `₹${order.totalAmount.toFixed(2)}`;
                
//                 if (order.convenienceFee > 0) {
//                     document.querySelector('#printableInvoice tfoot').insertAdjacentHTML('beforeend', 
//                         `<tr><td colspan="3" class="border p-2 text-right text-orange-600 font-medium">Convenience Fee:</td>
//                         <td class="border p-2 text-right text-orange-600 font-medium">₹${order.convenienceFee.toFixed(2)}</td></tr>`
//                     );
//                 }

//                 document.getElementById('printableInvoice').classList.remove('hidden');
//                 setTimeout(() => window.print(), 200);
//                 setTimeout(() => document.getElementById('printableInvoice').classList.add('hidden'), 1000);
//             } catch (err) {
//                 showNotification('Print failed', 'error');
//             }
//         });

//         async function updateStatus() {
//             const newStatus = document.getElementById('newStatus').value.trim();
//             if (!currentOrderId || !newStatus) return;
//             try {
//                 const res = await fetch(`${API_BASE}/patch-by-order-id/${currentOrderId}`, {
//                     method: 'PATCH',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({
//                         orderStatus: newStatus,
//                         deliveryDate: newStatus === 'DELIVERED' ? new Date().toISOString().split('T')[0] : undefined
//                     })
//                 });

//                 if (res.ok) {
//                     showNotification('Status updated!', 'success');
//                     document.getElementById('statusModal').classList.remove('show');
//                     fetchAllOrders(true);
//                 } else throw new Error();
//             } catch (err) {
//                 showNotification('Update failed', 'error');
//             }
//         }

//         function exportOrdersToExcel() {
//             const rows = filteredOrders.map(o => ({
//                 'Order ID': o.orderId,
//                 'Customer Name': o.customerName,
//                 'Customer Phone': o.customerPhone,
//                 'Order Date': o.rawOrderDate,
//                 'Payment Mode': o.paymentMethod,
//                 'Status': o.orderStatus,
//                 'Total Amount': o.totalAmount,
//             }));
//             const ws = XLSX.utils.json_to_sheet(rows);
//             const wb = XLSX.utils.book_new();
//             XLSX.utils.book_append_sheet(wb, ws, "PharmaCare Orders");
//             XLSX.writeFile(wb, `PharmaCare_Orders_${new Date().toISOString().slice(0,10)}.xlsx`);
//         }

//         function showNotification(msg, type = 'success') {
//             const el = document.createElement('div');
//             el.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-2xl text-white font-medium animate-pulse ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
//             el.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>${msg}`;
//             document.body.appendChild(el);
//             setTimeout(() => el.remove(), 4000);
//         }

//         async function fetchAllOrders(silent = false) {
//             try {
//                 const res = await fetch(`${API_BASE}/get-all-orders?page=0&size=100&sort=orderDate,desc`);
//                 if (!res.ok) throw new Error('Failed to fetch orders');
//                 const data = await res.json();

//                 const normalized = (data.content || []).map(normalizeOrder);
//                 // Sort descending so newest orders appear on top
//                 normalized.sort((a, b) => new Date(b.rawOrderDate) - new Date(a.rawOrderDate));

//                 ordersData = normalized;
//                 filteredOrders = [...ordersData];
//                 renderOrders();
//                 updateStatistics();
//             } catch (err) {
//                 if (!silent) showNotification('Failed to load orders', 'error');
//                 console.error('Fetch Error:', err);
//             }
//         }

//         function initializeEventHandlers() {
//             const searchInput = document.getElementById('searchInput');
//             const statusFilter = document.getElementById('statusFilter');
//             const dateFrom = document.getElementById('dateFrom');
//             const dateTo = document.getElementById('dateTo');
//             const clearFilters = document.getElementById('clearFilters');
//             const exportBtn = document.getElementById('exportOrders');

//             searchInput?.addEventListener('input', debouncedApplyFilters);
//             statusFilter?.addEventListener('change', applyFilters);
//             dateFrom?.addEventListener('change', applyFilters);
//             dateTo?.addEventListener('change', applyFilters);

//             clearFilters?.addEventListener('click', () => {
//                 searchInput.value = '';
//                 statusFilter.value = '';
//                 dateFrom.value = '';
//                 dateTo.value = '';
//                 applyFilters();
//             });

//             exportBtn?.addEventListener('click', exportOrdersToExcel);

//             document.getElementById('closeModal')?.addEventListener('click', () => document.getElementById('orderModal').classList.remove('show'));
//             document.getElementById('updateOrderStatus')?.addEventListener('click', () => {
//                 document.getElementById('orderModal').classList.remove('show');
//                 document.getElementById('statusModal').classList.add('show');
//             });
//             document.getElementById('cancelStatusUpdate')?.addEventListener('click', () => document.getElementById('statusModal').classList.remove('show'));
//             document.getElementById('confirmStatusUpdate')?.addEventListener('click', updateStatus);

//             document.getElementById('prevPage')?.addEventListener('click', () => {
//                 if (currentPage > 1) {
//                     currentPage--;
//                     renderOrders();
//                 }
//             });
//             document.getElementById('nextPage')?.addEventListener('click', () => {
//                 const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
//                 if (currentPage < totalPages) {
//                     currentPage++;
//                     renderOrders();
//                 }
//             });

//             // Logout Modal
//             const logoutBtn = document.getElementById('logoutBtn');
//             const modal = document.getElementById('logoutConfirmModal');
//             const yesBtn = document.getElementById('logoutConfirmYes');
//             const noBtn = document.getElementById('logoutConfirmNo');
//             const closeBtn = document.getElementById('closeLogoutModal');

//             logoutBtn.addEventListener('click', (e) => {
//                 e.preventDefault();
//                 modal.classList.remove('hidden');
//             });
//             noBtn.addEventListener('click', () => modal.classList.add('hidden'));
//             closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
//             modal.addEventListener('click', (e) => {
//                 if (e.target === modal) modal.classList.add('hidden');
//             });
//             yesBtn.addEventListener('click', () => {
//                 window.location.href = '../Login/login.html';
//             });
//         }

//         function toggleSidebar() {
//             const sidebar = document.getElementById('sidebar');
//             const sidebarArrow = document.getElementById('sidebar-arrow');
//             const logoDiv = document.querySelector('div > div.ml-6');
//             const navTexts = document.querySelectorAll('.nav-text');
//             const navIcons = document.querySelectorAll('.nav-icon');

//             if (window.innerWidth < 768) {
//                 sidebar.classList.toggle('-translate-x-full');
//                 sidebar.classList.toggle('translate-x-0');
//             } else {
//                 sidebar.classList.toggle('collapsed');

//                 if (sidebar.classList.contains('collapsed')) {
//                     sidebar.style.width = '64px';
//                     sidebarArrow.classList.remove('fa-chevron-left');
//                     sidebarArrow.classList.add('fa-chevron-right');
//                     logoDiv.style.opacity = '0';
//                     logoDiv.style.width = '0';
//                     navTexts.forEach((text) => {
//                         text.style.opacity = '0';
//                         text.style.width = '0';
//                         text.style.overflow = 'hidden';
//                     });
//                     navIcons.forEach(icon => {
//                         icon.style.marginLeft = '0';
//                         icon.style.marginRight = '0';
//                     });
//                 } else {
//                     sidebar.style.width = '256px';
//                     sidebarArrow.classList.remove('fa-chevron-right');
//                     sidebarArrow.classList.add('fa-chevron-left');
//                     logoDiv.style.opacity = '1';
//                     logoDiv.style.width = 'auto';
//                     navTexts.forEach((text) => {
//                         text.style.opacity = '1';
//                         text.style.width = 'auto';
//                         text.style.overflow = 'visible';
//                     });
//                     navIcons.forEach(icon => {
//                         icon.style.marginRight = '0.75rem';
//                     });
//                 }
//             }
//         }

//         function initializeSidebar() {
//             const sidebar = document.getElementById('sidebar');
//             const sidebarArrow = document.getElementById('sidebar-arrow');
//             if (window.innerWidth >= 768) {
//                 sidebar.classList.remove('collapsed');
//                 sidebarArrow.classList.remove('fa-chevron-right');
//                 sidebarArrow.classList.add('fa-chevron-left');
//             } else {
//                 sidebar.classList.remove('translate-x-0');
//             }
//         }

//         document.addEventListener('DOMContentLoaded', () => {
//             initializeSidebar();
//             fetchAllOrders();
//             initializeEventHandlers();

//             document.getElementById('toggle-sidebar-logo').addEventListener('click', toggleSidebar);
//             document.getElementById('close-sidebar').addEventListener('click', () => {
//                 const sidebar = document.getElementById('sidebar');
//                 sidebar.classList.add('-translate-x-full');
//                 sidebar.classList.remove('translate-x-0');
//             });

//             document.getElementById('toggle-sidebar-mobile').addEventListener('click', () => {
//                 const sidebar = document.getElementById('sidebar');
//                 sidebar.classList.remove('-translate-x-full');
//                 sidebar.classList.add('translate-x-0');
//             });
//         });
//     </script>
//     <script src="/auth.js?v=1.0.1"></script>
    
    
//     <script>
//         function hideMenuItemsByRole() {
//             const admin = Auth.getCurrentAdmin();
//             if (!admin?.role) return;

//             const role = admin.role.trim().toUpperCase();
//             const menuItems = document.querySelectorAll('aside li[data-menu-type]');

//             menuItems.forEach(item => {
//                 const type = item.getAttribute('data-menu-type');
//                 if (role === 'ROLE_ADMIN') {
//                     if (['dashboard','customers','reports','admin-management'].includes(type)) {
//                         item.classList.add('menu-hidden');
//                     }
//                 }
//             });
//         }

//         function displayUserProfile() {
//         const admin = Auth.getCurrentAdmin(); // This returns the admin object like { id: 4, firstName: "Sumer", lastName: "Khan", ... }

//         const userInitials = document.getElementById('user-initials');
//         const userName = document.getElementById('user-name');
//         const userRole = document.getElementById('user-role');

//         if (!admin || !admin.firstName) {
//             // Fallback if no admin is logged in (shouldn't happen due to Auth.requireAuth())
//             userName.textContent = "Guest";
//             userRole.textContent = "Unknown";
//             userInitials.textContent = "??";
//             return;
//         }

//         // Full name
//         const fullName = `${admin.firstName} ${admin.lastName || ''}`.trim();
//         const role = `${admin.role}`

//         // Generate initials (e.g., "SK" for Sumer Khan)
//         const nameParts = fullName.trim().split(' ');
//         const initials = nameParts.length > 1
//             ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
//             : (nameParts[0]?.[0] || '?');

//         // Update DOM
//         userInitials.textContent = initials.toUpperCase();
//         userName.textContent = fullName;
//         userRole.textContent = role; // You can make this dynamic later if needed
//         }


//         // This will redirect to login if session is missing or expired
//         Auth.requireAuth();
//         // Optional: start background timer to warn on expiration
//         Auth.startSessionTimer();
    
//         // Example: display admin name
//         document.addEventListener("DOMContentLoaded", () => {
//             const admin = Auth.getCurrentAdmin();
//             if (admin) {
//                 console.log("Logged in as:", admin.firstName + " " + admin.lastName);
//                 // e.g., document.getElementById('adminName').textContent = admin.firstName;
//             }

//             displayUserProfile();
//             hideMenuItemsByRole();
//         });
//     </script>
// </body>
// </html>



































// // User profile
// // const user = {
// //     name: "Shreya Kamble",
// //     role: "Admin",
// // };
// // function displayUserProfile() {
// //     const userInitials = document.getElementById("user-initials");
// //     const userName = document.getElementById("user-name");
// //     const userRole = document.getElementById("user-role");
// //     const nameParts = user.name.trim().split(" ");
// //     const initials = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}` : nameParts[0][0];
// //     userInitials.textContent = initials.toUpperCase();
// //     userName.textContent = user.name;
// //     userRole.textContent = user.role;
// // }
// // displayUserProfile();

// // ---------------------------------------------------------------------
// // API BASE URL
// // ---------------------------------------------------------------------
// const API_BASE = 'http://localhost:8083/api/orders';

// // ---------------------------------------------------------------------
// // Global variables
// // ---------------------------------------------------------------------
// let table;
// let currentOrderId = null;
// let orders = [];
// let allOrdersData = [];

// // ---------------------------------------------------------------------
// // Helper: Show success popup
// // ---------------------------------------------------------------------
// function showSuccessPopup(message) {
//     document.getElementById('successMessage').textContent = message;
//     document.getElementById('successPopup').style.display = 'flex';
// }

// // ---------------------------------------------------------------------
// // 1. FETCH ALL ORDERS (with pagination)
// // ---------------------------------------------------------------------
// async function fetchAllOrders(page = 0, size = 10, sort = 'orderDate,desc') {
//     try {
//         const res = await fetch(`${API_BASE}/get-all-orders?page=${page}&size=${size}&sort=${sort}`);
//         if (!res.ok) throw new Error('Failed to fetch orders');
//         const data = await res.json();
//         return data;
//     } catch (err) {
//         console.error(err);
//         alert('Error loading orders');
//         return { content: [], totalElements: 0, totalPages: 0 };
//     }
// }

// // ---------------------------------------------------------------------
// // 2. GET ORDER BY ID
// // ---------------------------------------------------------------------
// async function getOrderById(orderId) {
//     try {
//         const res = await fetch(`${API_BASE}/get-by-order-id/${orderId}`);
//         if (!res.ok) throw new Error('Order not found');
//         return await res.json();
//     } catch (err) {
//         console.error(err);
//         throw err;
//     }
// }

// // ---------------------------------------------------------------------
// // 3. CREATE ORDER
// // ---------------------------------------------------------------------
// async function createOrder(payload) {
//     try {
//         const res = await fetch(`${API_BASE}/create-order`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//         });
//         if (!res.ok) throw new Error('Create failed');
//         return await res.json();
//     } catch (err) {
//         console.error(err);
//         throw err;
//     }
// }

// // ---------------------------------------------------------------------
// // 4. UPDATE ORDER (PATCH - partial update)
// // ---------------------------------------------------------------------
// async function patchOrder(orderId, payload) {
//     try {
//         const res = await fetch(`${API_BASE}/patch-by-order-id/${orderId}`, {
//             method: 'PATCH',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//         });
//         if (!res.ok) throw new Error('Update failed');
//         return await res.json();
//     } catch (err) {
//         console.error(err);
//         throw err;
//     }
// }

// // ---------------------------------------------------------------------
// // 5. UPDATE ORDER (FULL UPDATE)
// // ---------------------------------------------------------------------
// async function updateOrder(orderId, payload) {
//     try {
//         const res = await fetch(`${API_BASE}/update-by-order-id/${orderId}`, {
//             method: 'PATCH',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//         });
        
//         if (!res.ok) {
//             const errorText = await res.text();
//             throw new Error(`HTTP ${res.status}: ${errorText}`);
//         }
        
//         return await res.json();
//     } catch (err) {
//         console.error('Update error:', err);
//         throw err;
//     }
// }

// // ---------------------------------------------------------------------
// // 6. CANCEL ORDER
// // ---------------------------------------------------------------------
// async function cancelOrder(orderId) {
//     try {
//         const res = await fetch(`${API_BASE}/cancel-order/${orderId}`, {
//             method: 'PATCH'
//         });
//         if (!res.ok) throw new Error('Cancel failed');
//         return await res.json();
//     } catch (err) {
//         console.error(err);
//         throw err;
//     }
// }

// // ---------------------------------------------------------------------
// // 7. DELETE ORDER
// // ---------------------------------------------------------------------
// async function deleteOrder(orderId) {
//     try {
//         const res = await fetch(`${API_BASE}/delete-by-order-id/${orderId}`, {
//             method: 'DELETE'
//         });
//         if (!res.ok) throw new Error('Delete failed');
//         return await res.text();
//     } catch (err) {
//         console.error(err);
//         throw err;
//     }
// }

// // ---------------------------------------------------------------------
// // INITIALIZE DATATABLE
// // ---------------------------------------------------------------------
// $(document).ready(async function () {
//     // Load data from API
//     const data = await fetchAllOrders(0, 100); // Load first 100 orders for demo
//     allOrdersData = data.content || [];
//     orders = [...allOrdersData];
    
//     updateStats();
//     populateTable();

//     // -----------------------------------------------------------------
//     // Bulk Delete Functionality
//     // -----------------------------------------------------------------
//     // Select all checkbox
//     $('#selectAll').on('click', function() {
//         $('.row-checkbox').prop('checked', this.checked);
//         toggleDeleteSelectedButton();
//     });

//     // Individual row checkbox
//     $(document).on('click', '.row-checkbox', function() {
//         const totalCheckboxes = $('.row-checkbox').length;
//         const checkedCheckboxes = $('.row-checkbox:checked').length;
        
//         $('#selectAll').prop('checked', totalCheckboxes === checkedCheckboxes);
//         $('#selectAll').prop('indeterminate', checkedCheckboxes > 0 && checkedCheckboxes < totalCheckboxes);
        
//         toggleDeleteSelectedButton();
//     });

//     // Delete Selected button
//     $('#deleteSelectedBtn').on('click', async function() {
//         const selectedIds = [];
//         $('.row-checkbox:checked').each(function() {
//             selectedIds.push($(this).data('id'));
//         });

//         if (selectedIds.length === 0) {
//             alert('Please select at least one order to delete.');
//             return;
//         }

//         if (confirm(`Are you sure you want to delete ${selectedIds.length} order(s)?`)) {
//             try {
//                 for (const orderId of selectedIds) {
//                     await deleteOrder(orderId);
//                 }
//                 showSuccessPopup(`${selectedIds.length} order(s) deleted successfully`);
//                 await refreshOrders();
//                 $('#selectAll').prop('checked', false);
//                 toggleDeleteSelectedButton();
//             } catch (e) {
//                 alert('Delete failed');
//             }
//         }
//     });

//     // -----------------------------------------------------------------
//     // Action button listeners
//     // -----------------------------------------------------------------
//     $(document).on('click', '.view-btn', async function () {
//         const orderId = $(this).data('id');
//         await viewOrder(orderId);
//     });

//     $(document).on('click', '.edit-btn', async function () {
//         const orderId = $(this).data('id');
//         await editOrder(orderId);
//     });

//     $(document).on('click', '.delete-btn', async function () {
//         const orderId = $(this).data('id');
//         if (confirm('Are you sure you want to delete this order?')) {
//             try {
//                 const msg = await deleteOrder(orderId);
//                 showSuccessPopup(msg);
//                 await refreshOrders();
//             } catch (e) {
//                 alert('Delete failed');
//             }
//         }
//     });
// });

// // ---------------------------------------------------------------------
// // Toggle Delete Selected Button
// // ---------------------------------------------------------------------
// function toggleDeleteSelectedButton() {
//     const checkedCount = $('.row-checkbox:checked').length;
//     const deleteBtn = $('#deleteSelectedBtn');
    
//     if (checkedCount > 0) {
//         deleteBtn.show();
//     } else {
//         deleteBtn.hide();
//     }
// }

// // ---------------------------------------------------------------------
// // POPULATE TABLE
// // ---------------------------------------------------------------------
// function populateTable(filteredOrders = orders) {
//     $('#orderTableBody').empty();
//     filteredOrders.forEach((order, index) => {
//         const statusClass = `status-${order.orderStatus ? order.orderStatus.toLowerCase() : 'pending'}`;
//         const productsText = order.orderItems && order.orderItems.length > 0 
//             ? order.orderItems.map(item => `${item.itemName} (${item.quantity})`).join(', ')
//             : 'No items';
        
//         $('#orderTableBody').append(`
//             <tr>
//                 <td class="px-4 py-4 whitespace-nowrap text-center">
//                     <input type="checkbox" class="row-checkbox w-4 h-4 cursor-pointer" data-id="${order.orderId}">
//                 </td>
//                 <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order.orderId}</td>
//                 <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">${order.customerFirstName || ''} ${order.customerLastName || ''}</td>
//                 <td class="px-4 py-4 text-sm text-gray-900">${productsText}</td>
//                 <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">${order.orderDate || '-'}</td>
//                 <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">${order.deliveryDate || '-'}</td>
//                 <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">${order.paymentMethod || '-'}</td>
//                 <td class="px-4 py-4 whitespace-nowrap">
//                     <span class="status-badge ${statusClass}">${order.orderStatus || 'PENDING'}</span>
//                 </td>
//                 <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹${order.totalAmount || 0}</td>
//                 <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-weight-500">
//                     <div class="action-column">
//                         <button class="view-btn action-btn" data-id="${order.orderId}" title="View">
//                             <i class="fas fa-eye"></i>
//                         </button>
//                         <button class="edit-btn action-btn bg-yellow-500 text-white" data-id="${order.orderId}" title="Edit">
//                             <i class="fas fa-edit"></i>
//                         </button>
//                         <button class="delete-btn action-btn bg-red-500 text-white" data-id="${order.orderId}" title="Delete">
//                             <i class="fas fa-trash"></i>
//                         </button>
//                     </div>
//                 </td>
//             </tr>
//         `);
//     });
    
//     if (table) table.destroy();
//     table = $('#orderTable').DataTable({
//         paging: true,
//         searching: false,
//         ordering: true,
//         info: true,
//         responsive: true,
//         lengthMenu: [[5, 10, 50, 100], [5, 10, 50, 100]],
//         pageLength: 10,
//         columnDefs: [
//             { orderable: false, targets: [0, -1] }
//         ],
//         language: {
//             search: "Search orders:"
//         },
//         drawCallback: function () {
//             this.api().columns.adjust();
//         }
//     });
    
//     // Update checkbox states after table redraw
//     $('#selectAll').prop('checked', false);
//     toggleDeleteSelectedButton();
// }

// // ---------------------------------------------------------------------
// // UPDATE STATS
// // ---------------------------------------------------------------------
// function updateStats(filteredOrders = orders) {
//     $('#totalOrders').text(filteredOrders.length);
//     $('#pendingOrders').text(filteredOrders.filter(o => o.orderStatus === 'PENDING').length);
//     $('#deliveredOrders').text(filteredOrders.filter(o => o.orderStatus === 'DELIVERED').length);
    
//     const today = new Date().toISOString().split('T')[0];
//     const todayRevenue = filteredOrders
//         .filter(o => o.orderDate && o.orderDate.startsWith(today))
//         .reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);
//     $('#revenueToday').text('₹' + todayRevenue.toFixed(2));
// }

// // ---------------------------------------------------------------------
// // FILTER FUNCTIONALITY
// // ---------------------------------------------------------------------
// function applyFilters() {
//     let filtered = [...allOrdersData];
//     const status = $('#statusFilter').val();
//     const payment = $('#paymentFilter').val();
//     const date = $('#dateFilter').val();

//     if (status) {
//         filtered = filtered.filter(o => o.orderStatus === status);
//     }
//     if (payment) {
//         filtered = filtered.filter(o => o.paymentMethod === payment);
//     }
//     if (date) {
//         // Enhanced date filter - handle different date formats
//         filtered = filtered.filter(o => {
//             if (!o.orderDate) return false;
//             // Extract date part from various formats (YYYY-MM-DD, YYYY-MM-DDTHH:MM:SS, etc.)
//             const orderDate = o.orderDate.split('T')[0];
//             return orderDate === date;
//         });
//     }

//     orders = filtered;
//     populateTable(orders);
//     updateStats(orders);
// }

// // Apply filters on change
// document.getElementById('statusFilter').addEventListener('change', applyFilters);
// document.getElementById('paymentFilter').addEventListener('change', applyFilters);
// document.getElementById('dateFilter').addEventListener('change', applyFilters);

// // ---------------------------------------------------------------------
// // VIEW ORDER (Now opens editable form)
// // ---------------------------------------------------------------------
// async function viewOrder(orderId) {
//     // Redirect to edit functionality as per user requirement
//     await editOrder(orderId);
// }

// // ---------------------------------------------------------------------
// // EDIT ORDER
// // ---------------------------------------------------------------------
// async function editOrder(orderId) {
//     try {
//         const order = await getOrderById(orderId);
//         currentOrderId = order.orderId;
        
//         // Fix: Use correct element IDs and properties
//         document.getElementById('edit-order-id').value = order.orderId || '';
//         document.getElementById('edit-user-id').value = order.userId || '';
//         document.getElementById('edit-payment-method').value = order.paymentMethod || 'COD';
//         document.getElementById('edit-total-amount').value = order.totalAmount || 0;
//         document.getElementById('edit-tax').value = order.tax || 0;
//         document.getElementById('edit-order-status').value = order.orderStatus || 'PENDING';
//         document.getElementById('edit-shipping-address').value = order.shippingAddress || '';
//         document.getElementById('edit-shipping-address2').value = order.shippingAddress2 || '';
//         document.getElementById('edit-shipping-city').value = order.shippingCity || '';
//         document.getElementById('edit-shipping-state').value = order.shippingState || '';
//         document.getElementById('edit-shipping-pincode').value = order.shippingPincode || '';
//         document.getElementById('edit-shipping-country').value = order.shippingCountry || 'USA';
//         document.getElementById('edit-delivery-date').value = order.deliveryDate || '';

//         document.getElementById('editOrderModal').style.display = 'flex';
//     } catch (e) {
//         console.error('Error fetching order:', e);
//         alert('Order not found');
//     }
// }

// // ---------------------------------------------------------------------
// // CREATE ORDER
// // ---------------------------------------------------------------------
// // Note: Create Order button was removed from header as per requirements
// // But keeping the modal functionality in case it's needed later

// // ---------------------------------------------------------------------
// // SAVE EDITED ORDER
// // ---------------------------------------------------------------------
// document.getElementById('editOrderForm').addEventListener('submit', async (e) => {
//     e.preventDefault();
//     const orderId = document.getElementById('edit-order-id').value;
    
//     if (!orderId) {
//         alert('Order ID is required');
//         return;
//     }
    
//     const payload = {
//         userId: document.getElementById('edit-user-id').value,
//         paymentMethod: document.getElementById('edit-payment-method').value,
//         totalAmount: parseFloat(document.getElementById('edit-total-amount').value),
//         tax: parseFloat(document.getElementById('edit-tax').value),
//         orderStatus: document.getElementById('edit-order-status').value,
//         shippingAddress: document.getElementById('edit-shipping-address').value,
//         shippingAddress2: document.getElementById('edit-shipping-address2').value,
//         shippingCity: document.getElementById('edit-shipping-city').value,
//         shippingState: document.getElementById('edit-shipping-state').value,
//         shippingPincode: document.getElementById('edit-shipping-pincode').value,
//         shippingCountry: document.getElementById('edit-shipping-country').value,
//         deliveryDate: document.getElementById('edit-delivery-date').value
//     };

//     try {
//         await updateOrder(orderId, payload);
//         document.getElementById('editOrderModal').style.display = 'none';
//         await refreshOrders();
//         showSuccessPopup('Order updated successfully');
//     } catch (err) {
//         console.error('Update error:', err);
//         alert('Update failed: ' + err.message);
//     }
// });

// // ---------------------------------------------------------------------
// // CREATE ORDER SUBMIT
// // ---------------------------------------------------------------------
// document.getElementById('createOrderForm').addEventListener('submit', async (e) => {
//     e.preventDefault();
    
//     const payload = {
//         userId: document.getElementById('create-user-id').value,
//         customerFirstName: document.getElementById('create-customer-firstname').value,
//         customerLastName: document.getElementById('create-customer-lastname').value,
//         customerPhone: document.getElementById('create-customer-phone').value,
//         customerEmail: document.getElementById('create-customer-email').value,
//         shippingFirstName: document.getElementById('create-shipping-firstname').value,
//         shippingLastName: document.getElementById('create-shipping-lastname').value,
//         shippingAddress: document.getElementById('create-shipping-address').value,
//         shippingAddress2: document.getElementById('create-shipping-address2').value,
//         shippingCity: document.getElementById('create-shipping-city').value,
//         shippingState: document.getElementById('create-shipping-state').value,
//         shippingPincode: document.getElementById('create-shipping-pincode').value,
//         shippingCountry: document.getElementById('create-shipping-country').value,
//         shippingPhone: document.getElementById('create-shipping-phone').value,
//         shippingEmail: document.getElementById('create-shipping-email').value,
//         paymentMethod: document.getElementById('create-payment-method').value,
//         totalAmount: parseFloat(document.getElementById('create-total-amount').value),
//         tax: parseFloat(document.getElementById('create-tax').value),
//         couponApplied: parseFloat(document.getElementById('create-coupon').value) || 0,
//         convenienceFee: parseFloat(document.getElementById('create-convenience-fee').value) || 0,
//         discountPercent: parseFloat(document.getElementById('create-discount-percent').value) || 0,
//         discountAmount: parseFloat(document.getElementById('create-discount-amount').value) || 0,
//         orderStatus: document.getElementById('create-order-status').value,
//         orderDate: document.getElementById('create-order-date').value,
//         deliveryDate: document.getElementById('create-delivery-date').value,
//         orderItems: [] // Empty for now - would need product selection UI
//     };

//     try {
//         await createOrder(payload);
//         document.getElementById('createOrderModal').style.display = 'none';
//         await refreshOrders();
//         showSuccessPopup('Order created successfully');
//     } catch (err) {
//         console.error('Create error:', err);
//         alert('Create failed: ' + err.message);
//     }
// });

// // ---------------------------------------------------------------------
// // UPDATE ORDER STATUS
// // ---------------------------------------------------------------------
// document.getElementById('saveStatus').addEventListener('click', async () => {
//     const newStatus = document.getElementById('updateStatus').value;
    
//     if (!currentOrderId) {
//         alert('No order selected');
//         return;
//     }
    
//     try {
//         await patchOrder(currentOrderId, { 
//             orderStatus: newStatus,
//             deliveryDate: newStatus === 'DELIVERED' ? new Date().toISOString().split('T')[0] : undefined
//         });
        
//         await refreshOrders();
//         showSuccessPopup('Order status updated successfully');
//         document.getElementById('orderDetailsModal').style.display = 'none';
//     } catch (err) {
//         console.error('Status update error:', err);
//         alert('Status update failed: ' + err.message);
//     }
// });

// // ---------------------------------------------------------------------
// // CANCEL ORDER
// // ---------------------------------------------------------------------
// document.getElementById('cancelOrder').addEventListener('click', async () => {
//     if (!currentOrderId) {
//         alert('No order selected');
//         return;
//     }
    
//     if (confirm('Are you sure you want to cancel this order?')) {
//         try {
//             await cancelOrder(currentOrderId);
//             await refreshOrders();
//             showSuccessPopup('Order cancelled successfully');
//             document.getElementById('orderDetailsModal').style.display = 'none';
//         } catch (err) {
//             console.error('Cancel error:', err);
//             alert('Cancel failed: ' + err.message);
//         }
//     }
// });

// // ---------------------------------------------------------------------
// // PRINT INVOICE
// // ---------------------------------------------------------------------
// document.getElementById('printInvoice').addEventListener('click', async () => {
//     if (!currentOrderId) {
//         alert('No order selected');
//         return;
//     }
    
//     try {
//         const order = await getOrderById(currentOrderId);
        
//         $('#inv-customer-name').text(`${order.customerFirstName || ''} ${order.customerLastName || ''}`);
//         $('#inv-customer-phone').text(order.customerPhone || '-');
//         $('#inv-customer-email').text(order.customerEmail || '-');
//         $('#inv-customer-address').text(`${order.shippingAddress || ''} ${order.shippingAddress2 || ''}`.trim() || '-');
//         $('#inv-payment-status').text(order.orderStatus === 'DELIVERED' ? 'Paid' : 'NA');
//         $('#inv-payment-mode').text(order.paymentMethod || '-');

//         let invProductsHtml = '';
//         let subtotal = 0;
//         if (order.orderItems && order.orderItems.length > 0) {
//             order.orderItems.forEach(item => {
//                 invProductsHtml += `
//                     <tr>
//                         <td style="border: 1px solid #d1d5db; padding: 8px;">${item.itemName || '-'}</td>
//                         <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${item.quantity || 0}</td>
//                         <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">₹${item.itemPrice || 0}</td>
//                         <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">₹${item.subtotal || 0}</td>
//                     </tr>
//                 `;
//                 subtotal += parseFloat(item.subtotal || 0);
//             });
//         } else {
//             invProductsHtml = '<tr><td colspan="4" style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">No items</td></tr>';
//         }
//         $('#inv-products').html(invProductsHtml);

//         $('#inv-subtotal').text('₹' + subtotal.toFixed(2));
//         // $('#inv-tax').text('₹' + (order.tax || 0));
//         // $('#inv-coupon').text('₹' + (order.couponApplied || 0));
//         $('#inv-convenience').text('₹' + (order.convenienceFee || 0));
//         $('#inv-discount').text('₹' + (order.discountAmount || 0));
//         $('#inv-grand-total').text('₹' + (order.totalAmount || 0));

//         $('#invoiceModal').style.display = 'flex';
//     } catch (err) {
//         console.error('Invoice error:', err);
//         alert('Failed to load invoice data: ' + err.message);
//     }
// });

// // ---------------------------------------------------------------------
// // EXPORT TO CSV
// // ---------------------------------------------------------------------
// document.getElementById('exportBtn').addEventListener('click', () => {
//     let csv = 'Order ID,Customer Name,Products,Order Date,Delivery Date,Payment Mode,Status,Total Amount\n';
//     orders.forEach((order) => {
//         const productsText = order.orderItems && order.orderItems.length > 0 
//             ? order.orderItems.map(item => `${item.itemName} (${item.quantity})`).join(', ')
//             : 'No items';
//         csv += `"${order.orderId}","${order.customerFirstName || ''} ${order.customerLastName || ''}","${productsText}","${order.orderDate || ''}","${order.deliveryDate || ''}","${order.paymentMethod || ''}","${order.orderStatus || ''}","₹${order.totalAmount || 0}"\n`;
//     });
//     const blob = new Blob([csv], { type: 'text/csv' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'orders_' + new Date().toISOString().split('T')[0] + '.csv';
//     a.click();
//     window.URL.revokeObjectURL(url);
// });

// // ---------------------------------------------------------------------
// // REFRESH ORDERS
// // ---------------------------------------------------------------------
// async function refreshOrders() {
//     const data = await fetchAllOrders(0, 100);
//     allOrdersData = data.content || [];
//     applyFilters(); // This will repopulate with current filters
// }

// // ---------------------------------------------------------------------
// // SIDEBAR TOGGLE
// // ---------------------------------------------------------------------


// function toggleSidebar() {
//     const sidebar = document.getElementById('sidebar');
//     const sidebarArrow = document.getElementById('sidebar-arrow');
//     const logoDiv = document.querySelector('div > div'); // Logo container
//     const navTexts = document.querySelectorAll('.nav-text');
//     const navIcons = document.querySelectorAll('.nav-icon');
    
//     if (window.innerWidth < 768) {
//         // Mobile: Just toggle visibility with smooth transition
//         sidebar.classList.toggle('-translate-x-full');
//         sidebar.classList.toggle('translate-x-0');
//     } else {
//         // Desktop: Toggle between collapsed and expanded
//         sidebar.classList.toggle('collapsed');
        
//         if (sidebar.classList.contains('collapsed')) {
//             // Collapsed state
//             sidebar.style.width = '64px'; // Smaller width when collapsed
//             sidebarArrow.classList.remove('fa-chevron-left');
//             sidebarArrow.classList.add('fa-chevron-right');
            
//             // Hide logo smoothly
//             logoDiv.style.opacity = '0';
//             logoDiv.style.width = '0';
            
//             // Hide nav texts with delay
//             navTexts.forEach((text, index) => {
//                 text.style.opacity = '0';
//                 text.style.width = '0';
//                 text.style.overflow = 'hidden';
//                 text.style.transitionDelay = `${index * 20}ms`;
//             });
            
//             // Center icons
//             navIcons.forEach(icon => {
//                 icon.style.marginLeft = '0';
//                 icon.style.marginRight = '0';
//             });
            
//         } else {
//             // Expanded state
//             sidebar.style.width = '256px'; // Original width
//             sidebarArrow.classList.remove('fa-chevron-right');
//             sidebarArrow.classList.add('fa-chevron-left');
            
//             // Show logo smoothly
//             logoDiv.style.opacity = '1';
//             logoDiv.style.width = 'auto';
            
//             // Show nav texts with staggered animation
//             navTexts.forEach((text, index) => {
//                 text.style.opacity = '1';
//                 text.style.width = 'auto';
//                 text.style.overflow = 'visible';
//                 text.style.transitionDelay = `${index * 20}ms`;
//             });
            
//             // Restore icon margins
//             navIcons.forEach(icon => {
//                 icon.style.marginLeft = '0';
//                 icon.style.marginRight = '0.75rem'; // mr-3
//             });
//         }
//     }
// }


// // Add event listeners
// document.getElementById('toggle-sidebar-logo').addEventListener('click', toggleSidebar);
// document.getElementById('close-sidebar').addEventListener('click', () => {
//     const sidebar = document.getElementById('sidebar');
//     sidebar.classList.add('-translate-x-full');
//     sidebar.classList.remove('translate-x-0');
// });

// // Optional: Close sidebar when clicking outside on mobile
// document.addEventListener('click', (event) => {
//     const sidebar = document.getElementById('sidebar');
//     const toggleBtn = document.getElementById('toggle-sidebar-logo');
    
//     if (window.innerWidth < 768 && 
//         !sidebar.contains(event.target) && 
//         !toggleBtn.contains(event.target) &&
//         sidebar.classList.contains('translate-x-0')) {
//         sidebar.classList.add('-translate-x-full');
//         sidebar.classList.remove('translate-x-0');
//     }
// });
//     function initializeSidebar() {
//         const sidebar = document.getElementById('sidebar');
//         const sidebarArrow = document.getElementById('sidebar-arrow');
        
//         // Set initial state based on screen width
//         if (window.innerWidth >= 768) {
//             // Desktop: Start expanded
//             sidebar.classList.remove('collapsed');
//             sidebarArrow.classList.remove('fa-chevron-right');
//             sidebarArrow.classList.add('fa-chevron-left');
//         } else {
//             // Mobile: Start hidden
//             sidebar.classList.remove('translate-x-0');
//         }
//     }



// // document.getElementById('toggle-sidebar-mobile').addEventListener('click', () => {
// //     const sidebar = document.getElementById('sidebar');
// //     sidebar.classList.toggle('-translate-x-full');
// // });

// // document.getElementById('close-sidebar').addEventListener('click', () => {
// //     const sidebar = document.getElementById('sidebar');
// //     sidebar.classList.add('-translate-x-full');
// // });

// // document.getElementById('toggle-sidebar-logo').addEventListener('click', () => {
// //     const sidebar = document.getElementById('sidebar');
// //     sidebar.classList.toggle('w-64');
// //     sidebar.classList.toggle('w-20');
// //     document.querySelectorAll('.nav-text').forEach(el => el.classList.toggle('hidden'));
// //     document.getElementById('sidebar-arrow').classList.toggle('fa-chevron-right');
// //     document.getElementById('sidebar-arrow').classList.toggle('fa-chevron-left');
// //     document.querySelectorAll('.nav-icon').forEach(el => {
// //         el.classList.toggle('mr-3');
// //         el.classList.toggle('mx-auto');
// //     });
    
// //     // Redraw table to fix alignment after sidebar toggle
// //     setTimeout(() => {
// //         if ($.fn.DataTable.isDataTable('#orderTable')) {
// //             $('#orderTable').DataTable().columns.adjust();
// //         }
// //     }, 300);
// // });

// // Logout Modal Logic
// const logoutBtn = document.getElementById('logoutBtn');
// const modal = document.getElementById('logoutConfirmModal');
// const yesBtn = document.getElementById('logoutConfirmYes');
// const noBtn = document.getElementById('logoutConfirmNo');
// const closeBtn = document.getElementById('closeLogoutModal');

// // Open modal
// logoutBtn.addEventListener('click', (e) => {
//   e.preventDefault();
//   modal.classList.remove('hidden');
// });

// // Close modal
// function closeModal() {
//   modal.classList.add('hidden');
// }

// noBtn.addEventListener('click', closeModal);
// closeBtn.addEventListener('click', closeModal);

// // Close on outside click
// modal.addEventListener('click', (e) => {
//   if (e.target === modal) closeModal();
// });

// // Confirm logout
// yesBtn.addEventListener('click', () => {
//   window.location.href = '../Login/login.html';
// });