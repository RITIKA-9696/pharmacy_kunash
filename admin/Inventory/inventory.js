// Main Inventory JavaScript

// Global variables
let inventory = [];
let dataTable;
let currentProductId = null;
let currentProductType = null;
let currentBatchId = null;
let batchesData = null;

// Base URLs
const BASE_URL = 'http://localhost:8083';
const PRODUCTS_API = `${BASE_URL}/api/products`;
const INVENTORY_API = `${BASE_URL}/api/inventory`;
const MB_PRODUCTS_API = `${BASE_URL}/api/mb/products`;

// Initialize when page loads
$(document).ready(function() {
    initializePage();
    setupEventListeners();
    loadInitialData();
});

function initializePage() {
    // Initialize DataTables
    initializeDataTable();
    
    // Setup sidebar
    setupSidebar();
    
    // Setup modals
    setupModals();
    
    // Setup tabs
    setupTabs();
    
    // Check auth
    if (typeof Auth !== 'undefined') {
        Auth.requireAuth();
    }
}

function setupSidebar() {
    // Desktop sidebar toggle
    $('#toggle-sidebar-logo').on('click', function() {
        toggleSidebar();
    });

    // Close sidebar on mobile
    $('#close-sidebar').on('click', function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('translate-x-0');
    });

    // Mobile sidebar toggle
    $('#toggle-sidebar-mobile').on('click', function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('translate-x-0');
    });

    // Logout functionality
    $('#logoutBtn').on('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
            
            Toastify({
                text: "Successfully logged out",
                duration: 3000,
                style: { background: 'linear-gradient(to right, #00b09b, #96c93d)' }
            }).showToast();
            
            setTimeout(() => {
                window.location.href = '../Login/login.html';
            }, 1500);
        }
    });
}

// Sidebar toggle function
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

function setupModals() {
    // Close modals when clicking X
    $('.close').on('click', function() {
        const modalId = $(this).closest('.modal').attr('id');
        closeModal(modalId);
    });

    // Close modals when clicking outside
    $(window).on('click', function(event) {
        if ($(event.target).hasClass('modal')) {
            closeModal($(event.target).attr('id'));
        }
    });
}

function setupTabs() {
    // Main tabs - ONLY 3 TABS NOW
    $('.tab-item').on('click', function() {
        const tabId = $(this).data('tab');
        
        $('.tab-item').removeClass('active');
        $(this).addClass('active');
        
        $('.tab-content').removeClass('active');
        $(`#${tabId}`).addClass('active');
        
        loadTabData(tabId);
    });

    // Mothercare category filter - Updated to make API calls
    $('.category-filter-btn').on('click', async function() {
        $('.category-filter-btn').removeClass('active');
        $(this).addClass('active');
        const subcategory = $(this).data('subcategory');
        await filterMothercareProducts(subcategory);
    });

    // Medicine category filter
    $('.medicine-category-filter-btn').on('click', async function() {
        $('.medicine-category-filter-btn').removeClass('active');
        $(this).addClass('active');
        const subcategory = $(this).data('subcategory');
        await filterMedicineProducts(subcategory);
    });
}

function setupEventListeners() {
    // Bulk upload
    $('#bulk-upload').on('click', function() {
        $('#bulkUploadModal').show();
    });
    
    // Export CSV
    $('#export-csv').on('click', exportToExcel);
    
    // Bulk upload form
    $('#bulkUploadForm').on('submit', handleBulkUpload);
    
    // Category filter
    $('#filter-category').on('change', filterByCategory);
    
    $('#filter-stock').on('change', filterByStock);
    
    // Download template
    $('#download-template').on('click', downloadTemplate);
    
    // Delete confirmation
    $('#confirmDelete').on('click', deleteBatch);
    
    // Search functionality
    $('#search-input').on('input', debounce(searchProducts, 300));
}

function loadInitialData() {
    showLoader();
    Promise.all([
        fetchAllProducts()
    ]).finally(hideLoader);
}

function loadTabData(tabId) {
    switch(tabId) {
        case 'all-products':
            updateDataTable(inventory);
            break;
        case 'medicines':
            loadMedicines();
            break;
        case 'mothercare':
            loadMothercareProducts();
            break;
    }
}

// Data Table Initialization
function initializeDataTable() {
    dataTable = $('#inventoryTable').DataTable({
        scrollX: true,
        scrollCollapse: true,
        fixedHeader: true,
        autoWidth: false,
        searching: true,
        paging: true,
        pageLength: 25,
        lengthMenu: [10, 25, 50, 100],
        processing: true,
        serverSide: false,
        responsive: true,
        columns: [
            { 
                data: null, 
                render: (data, type, row, meta) => meta.row + 1,
                className: "text-center",
                width: "60px"
            },
            { 
                data: 'productName',
                render: (data, type, row) => {
                    const isMBProduct = row.productType === 'mb';
                    const productName = isMBProduct ? row.title : data;
                    const sku = isMBProduct ? row.sku : row.sku;
                    
                    // Handle image URL
                    let imageUrl = 'http://localhost:8083/Images/product_details_fallback_img.jpg';
                    if (isMBProduct && row.id) {
                        imageUrl = `${BASE_URL}/api/mb/products/${row.id}/image`;
                    } else if (!isMBProduct && row.productMainImage) {
                        imageUrl = row.productMainImage.startsWith('http') ? 
                            row.productMainImage : 
                            `${BASE_URL}${row.productMainImage}`;
                    }
                    
                    return `
                        <div class="flex items-center">
                            <img src="${imageUrl}" 
                                 class="w-10 h-10 rounded mr-3 object-cover" 
                                 alt="${productName}"
                                 onerror="this.src='http://localhost:8083/Images/product_details_fallback_img.jpg'">
                            <div>
                                <div class="font-medium">${productName || 'N/A'}</div>
                                <div class="text-sm text-gray-500">${sku || 'No SKU'}</div>
                            </div>
                        </div>
                    `;
                }
            },
            { 
                data: 'productCategory',
                render: (data, type, row) => {
                    const isMBProduct = row.productType === 'mb';
                    const category = isMBProduct ? 
                        (row.category || 'Mother & Baby Care') : 
                        (data || 'N/A');
                    const badgeClass = getCategoryBadgeClass(category);
                    return `
                        <span class="category-badge ${badgeClass}">
                            ${category}
                        </span>
                    `;
                }
            },
            { 
                data: 'productQuantity',
                render: (data, type, row) => {
                    const isMBProduct = row.productType === 'mb';
                    const stock = isMBProduct ? 
                        row.stockQuantity || 0 : 
                        data || 0;
                    const stockClass = getStockClass(stock);
                    return `
                        <div class="flex items-center">
                            <span class="stock-indicator ${stockClass}"></span>
                            <span class="font-medium">${stock}</span>
                        </div>
                    `;
                },
                className: "text-center"
            },
            { 
                data: 'productPrice',
                render: (data, type, row) => {
                    let price = 0;
                    if (row.productType === 'mb') {
                        price = row.price && row.price.length > 0 ? parseFloat(row.price[0]) : 0;
                    } else {
                        if (Array.isArray(data)) {
                            price = parseFloat(data[0]) || 0;
                        } else if (typeof data === 'string') {
                            price = parseFloat(data) || 0;
                        } else if (typeof data === 'number') {
                            price = data;
                        } else {
                            price = 0;
                        }
                    }
                    return `₹${price.toFixed(2)}`;
                },
                className: "text-right"
            },
            { 
                data: 'expDate',
                render: (data) => data || 'N/A'
            },
            { 
                data: 'productStatus',
                render: (data, type, row) => {
                    let status = '';
                    let statusClass = '';
                    
                    if (row.productType === 'mb') {
                        status = row.inStock ? 'Available' : 'Out of Stock';
                        statusClass = row.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
                    } else {
                        status = data || 'N/A';
                        statusClass = data === 'Available' ? 'bg-green-100 text-green-800' : 
                                      data === 'Discontinued' ? 'bg-red-100 text-red-800' : 
                                      data === 'In-Stock' ? 'bg-green-100 text-green-800' :
                                      data === 'Out-of-Stock' ? 'bg-red-100 text-red-800' :
                                      data === 'Low-Stock' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800';
                    }
                    
                    return `
                        <span class="px-2 py-1 rounded text-xs ${statusClass}">
                            ${status}
                        </span>
                    `;
                },
                className: "text-center"
            },
            {
                data: null,
                render: function(data, type, row, meta) {
                    // Safely get product ID
                    const productId = row.productType === 'mb' ? (row.id || row.productId) : (row.productId || row.id);
                    const productType = row.productType === 'mb' ? 'mb' : 'regular';
                    
                    if (!productId) {
                        console.error('No product ID found for row:', row);
                        return '<span class="text-red-500">Error: No ID</span>';
                    }
                    
                    return `
                        <div class="flex justify-center space-x-1">
                            <button onclick="viewProduct(${productId}, '${productType}')" 
                                    class="action-btn bg-blue-100 text-blue-600 hover:bg-blue-200 p-2 rounded" 
                                    title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                           
                            <button onclick="${productType === 'mb' ? `showBatchManagementModalMB(${productId})` : `showBatchManagementModal(${productId})`}" 
                                    class="action-btn bg-purple-100 text-purple-600 hover:bg-purple-200 p-2 rounded" 
                                    title="Manage Batches">
                                <i class="fas fa-layer-group"></i>
                            </button>
                            <button onclick="deleteProduct(${productId}, '${productType}')" 
                                    class="action-btn bg-red-100 text-red-600 hover:bg-red-200 p-2 rounded" 
                                    title="Delete Product">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                },
                orderable: false,
                className: "text-center"
            }
        ],
        createdRow: function(row, data, dataIndex) {
            let quantity = 0;
            let expDate = null;
            
            if (data.productType === 'mb') {
                quantity = data.stockQuantity || 0;
                expDate = data.expDate ? new Date(data.expDate) : null;
            } else {
                quantity = data.productQuantity || 0;
                expDate = data.expDate ? new Date(data.expDate) : null;
            }
            
            const today = new Date();
            
            if (quantity === 0) {
                $(row).addClass('row-stock-out');
            } else if (quantity <= 10) {
                $(row).addClass('row-stock-low');
            }
            
            if (expDate && (expDate - today) / (1000 * 60 * 60 * 24) <= 30) {
                $(row).addClass('row-expiring');
            }
        },
        language: {
            lengthMenu: "Show _MENU_ entries",
            info: "Showing _START_ to _END_ of _TOTAL_ entries",
            infoEmpty: "Showing 0 to 0 of 0 entries",
            infoFiltered: "(filtered from _MAX_ total entries)",
            emptyTable: "No products available in the inventory.",
            paginate: {
                previous: "<i class='fas fa-chevron-left'></i>",
                next: "<i class='fas fa-chevron-right'></i>"
            }
        },
        dom: '<"flex justify-between items-center mb-4"lf>rt<"flex justify-between items-center mt-4"ip>'
    });
}

// Data Fetching Functions
async function fetchAllProducts() {
    try {
        console.log('Fetching all products...');
        
        // Fetch both regular products and MB products
        const [regularProductsResponse, mbProductsResponse] = await Promise.all([
            fetch(`${PRODUCTS_API}/get-all-active-products?page=0&size=1000`),
            fetch(`${MB_PRODUCTS_API}/get-all-mb-active-products?page=0&size=1000`)
        ]);
        
        let regularProducts = [];
        let mbProducts = [];
        
        if (regularProductsResponse.ok) {
            const regularProductsData = await regularProductsResponse.json();
            
            // Extract products from response
            if (regularProductsData.content && Array.isArray(regularProductsData.content)) {
                regularProducts = regularProductsData.content;
            } else if (Array.isArray(regularProductsData)) {
                regularProducts = regularProductsData;
            } else if (regularProductsData.data && Array.isArray(regularProductsData.data)) {
                regularProducts = regularProductsData.data;
            } else {
                console.warn('Unexpected regular products response structure:', regularProductsData);
            }
        } else {
            console.warn('Failed to fetch regular products:', regularProductsResponse.status);
        }
        
        if (mbProductsResponse.ok) {
            const mbProductsData = await mbProductsResponse.json();
            
            // Handle different response structures
            if (Array.isArray(mbProductsData)) {
                mbProducts = mbProductsData;
            } else if (mbProductsData.content && Array.isArray(mbProductsData.content)) {
                mbProducts = mbProductsData.content;
            } else if (mbProductsData.data && Array.isArray(mbProductsData.data)) {
                mbProducts = mbProductsData.data;
            } else {
                console.warn('Unexpected MB products response structure:', mbProductsData);
                mbProducts = [];
            }
        } else {
            console.warn('Failed to fetch MB products:', mbProductsResponse.status);
        }
        
        // Transform MB products to match inventory format
        const transformedMBProducts = mbProducts.map(mbProduct => {
            let priceArray = [];
            let price = 0;
            
            if (mbProduct.price && Array.isArray(mbProduct.price)) {
                priceArray = mbProduct.price;
                price = mbProduct.price.length > 0 ? parseFloat(mbProduct.price[0]) : 0;
            } else if (mbProduct.price && typeof mbProduct.price === 'string') {
                priceArray = [mbProduct.price];
                price = parseFloat(mbProduct.price) || 0;
            } else if (mbProduct.price && typeof mbProduct.price === 'number') {
                priceArray = [mbProduct.price.toString()];
                price = mbProduct.price;
            }
            
            return {
                productId: mbProduct.id,
                id: mbProduct.id,
                productType: 'mb',
                sku: mbProduct.sku || '',
                productName: mbProduct.title || mbProduct.name || 'Unnamed Product',
                title: mbProduct.title || mbProduct.name || 'Unnamed Product',
                productCategory: mbProduct.category || 'Mother & Baby Care',
                category: mbProduct.category,
                subCategory: mbProduct.subCategory || '',
                productPrice: priceArray,
                price: priceArray,
                productOldPrice: mbProduct.originalPrice || priceArray,
                originalPrice: mbProduct.originalPrice || priceArray,
                productStock: mbProduct.inStock ? 'In-Stock' : 'Out-of-Stock',
                inStock: mbProduct.inStock || false,
                productStatus: mbProduct.inStock ? 'Available' : 'Out of Stock',
                productDescription: (mbProduct.description && Array.isArray(mbProduct.description) && mbProduct.description.length > 0) ? 
                    mbProduct.description[0] : (mbProduct.description || ''),
                description: mbProduct.description || [],
                productQuantity: mbProduct.stockQuantity || 0,
                stockQuantity: mbProduct.stockQuantity || 0,
                prescriptionRequired: false,
                brandName: mbProduct.brand || '',
                brand: mbProduct.brand || '',
                mfgDate: null,
                expDate: null,
                batchNo: null,
                benefitsList: mbProduct.features || [],
                directionsList: [],
                ingredientsList: [],
                productSizes: mbProduct.sizes || [],
                productMainImage: null,
                productSubImages: [],
                productDynamicFields: {},
                discount: mbProduct.discount || 0,
                rating: mbProduct.rating || 0,
                reviewCount: mbProduct.reviewCount || 0
            };
        });
        
        // Transform regular products if needed
        const transformedRegularProducts = regularProducts.map(product => {
            // Ensure all required fields exist
            return {
                ...product,
                productType: 'regular',
                productName: product.productName || 'Unnamed Product',
                productCategory: product.productCategory || 'Pharmacy',
                productQuantity: product.productQuantity || 0,
                productPrice: Array.isArray(product.productPrice) ? product.productPrice : 
                             (typeof product.productPrice === 'string' || typeof product.productPrice === 'number') ? 
                             [product.productPrice] : [0],
                productStatus: product.productStatus || 'Available',
                brandName: product.brandName || '',
                expDate: product.expDate || null
            };
        });
        
        // Combine both product lists
        inventory = [...transformedRegularProducts, ...transformedMBProducts];
        
        console.log('Total inventory count:', inventory.length);
        
        updateDataTable(inventory);
        updateDashboardStats(inventory);
        
        return inventory;
    } catch (error) {
        console.error('Error fetching products:', error);
        showErrorToast('Failed to load products');
        return [];
    }
}

function updateDataTable(data) {
    if (dataTable) {
        dataTable.clear();
        dataTable.rows.add(data);
        dataTable.draw();
        
        $('#showing-count').text(data.length);
        $('#total-count').text(data.length);
    }
}

function updateDashboardStats(products) {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    let total = products.length;
    let inStock = 0;
    let lowStock = 0;
    let expiringSoon = 0;
    let outOfStock = 0;
    let totalValue = 0;
    
    let medicineCount = 0;
    let mothercareCount = 0;
    let babyCount = 0;
    let wellnessCount = 0;
    
    products.forEach(product => {
        let quantity = 0;
        let price = 0;
        
        if (product.productType === 'mb') {
            quantity = product.stockQuantity || 0;
            price = product.price && product.price.length > 0 ? parseFloat(product.price[0]) : 0;
        } else {
            quantity = product.productQuantity || 0;
            if (Array.isArray(product.productPrice)) {
                price = product.productPrice.length > 0 ? parseFloat(product.productPrice[0]) : 0;
            } else if (typeof product.productPrice === 'string') {
                price = parseFloat(product.productPrice) || 0;
            } else if (typeof product.productPrice === 'number') {
                price = product.productPrice;
            }
        }
        
        if (quantity > 10) {
            inStock++;
        } else if (quantity > 0) {
            lowStock++;
        } else {
            outOfStock++;
        }
        
        if (product.expDate) {
            const expDate = new Date(product.expDate);
            if (expDate <= thirtyDaysFromNow && expDate >= today) {
                expiringSoon++;
            }
        }
        
        totalValue += quantity * price;
        
        // Categorize products
        const category = product.productType === 'mb' ? 
            (product.category || product.productCategory) : 
            product.productCategory;

        if (product.productType === 'mb') {
            mothercareCount++;
        } else if (category === 'MotherCare & Maternity') {
            mothercareCount++;
        } else if (category === 'BabyCare') {
            babyCount++;
         
        } else {
            medicineCount++;
        }
    });
    
    $('#total-items').text(total);
    $('#in-stock').text(inStock);
    $('#low-stock-count').text(lowStock);
    $('#expiring-soon').text(expiringSoon);
    $('#out-of-stock').text(outOfStock);
    $('#total-stock-value').text('₹' + totalValue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}));
    
    $('#medicine-count').text(`${medicineCount} medicines`);
    $('#mothercare-count').text(`${mothercareCount + babyCount + wellnessCount} products`);
}

async function loadMedicines(category = 'all') {
    try {
        let medicines = [];
        
        if (category === 'all') {
            // Get all medicines from inventory
            medicines = inventory.filter(product => {
                if (product.productType === 'mb') {
                    return false;
                }
                
                const category = product.productCategory;
                
                const medicineCategories = [
                    'Medicines & Healthcare',
                    'Wellness',
                    'Devices',
                    'Surgical',
                    'Speciality Care',
                ];
                
                return medicineCategories.includes(category);
            });
        } else {
            // Fetch medicines by category from API
            const encodedCategory = encodeURIComponent(category);
            const response = await fetch(`${PRODUCTS_API}/get-all-products?category=${encodedCategory}&page=0&size=1000`);
            
            if (response.ok) {
                const data = await response.json();
                
                // Handle different response structures
                if (data.content && Array.isArray(data.content)) {
                    medicines = data.content;
                } else if (Array.isArray(data)) {
                    medicines = data;
                } else if (data.data && Array.isArray(data.data)) {
                    medicines = data.data;
                }
            }
        }
        
        renderMedicinesTable(medicines, category);
        
        // Update category counts
        updateMedicineCategoryCounts();
        
    } catch (error) {
        console.error('Error loading medicines:', error);
        showErrorToast('Failed to load medicines');
        renderMedicinesTable([], category);
    }
}

async function filterMedicineProducts(category) {
    await loadMedicines(category);
}

function updateMedicineCategoryCounts() {
    // Count medicines by category
    const categories = {
        'Medicines & Healthcare': 0,
        'Wellness & Personal Care': 0,
        'Medical Devices & Equipment': 0,
        'Surgical Items': 0,
        'Speciality Care': 0
    };
    
    inventory.forEach(product => {
        if (product.productType === 'regular') {
            const category = product.productCategory;
            if (categories.hasOwnProperty(category)) {
                categories[category]++;
            }
        }
    });
    
    // Update the button counts
    Object.keys(categories).forEach(category => {
        const button = $(`.medicine-category-filter-btn[data-subcategory="${category}"]`);
        if (button.length) {
            const count = categories[category];
            const currentText = button.text();
            // Remove existing count if present
            const textWithoutCount = currentText.replace(/\(\d+\)/, '').trim();
            button.text(`${textWithoutCount} (${count})`);
        }
    });
}

function renderMedicinesTable(medicines, category = 'all') {
    const tbody = $('#medicines-table-body');
    tbody.empty();
    
    if (medicines.length === 0) {
        const message = category === 'all' ? 
            'No medicines found' : 
            `No medicines found in "${category}" category`;
        tbody.html(`<tr><td colspan="8" class="text-center py-8 text-gray-500">${message}</td></tr>`);
        return;
    }
    
    medicines.forEach((product) => {
        const stock = product.productQuantity || 0;
        const stockClass = getStockClass(stock);
        const category = product.productCategory || 'N/A';
        const categoryClass = getCategoryBadgeClass(category);
        
        let imageUrl = 'http://localhost:8083/Images/product_details_fallback_img.jpg';
        if (product.productMainImage) {
            imageUrl = product.productMainImage.startsWith('http') ? 
                product.productMainImage : 
                `${BASE_URL}${product.productMainImage}`;
        }
        
        // Handle price display
        let priceDisplay = '₹0';
        if (product.productPrice) {
            if (Array.isArray(product.productPrice) && product.productPrice.length > 0) {
                priceDisplay = `₹${parseFloat(product.productPrice[0]).toFixed(2)}`;
            } else if (typeof product.productPrice === 'string' || typeof product.productPrice === 'number') {
                priceDisplay = `₹${parseFloat(product.productPrice).toFixed(2)}`;
            }
        }
        
        // Calculate expiry status
        const today = new Date();
        const expDate = product.expDate ? new Date(product.expDate) : null;
        let expiryStatus = '';
        let expiryClass = '';
        
        if (expDate) {
            const daysUntilExpiry = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry < 0) {
                expiryStatus = 'Expired';
                expiryClass = 'bg-red-100 text-red-800';
            } else if (daysUntilExpiry <= 30) {
                expiryStatus = `${daysUntilExpiry} days`;
                expiryClass = 'bg-yellow-100 text-yellow-800';
            } else {
                expiryStatus = 'Valid';
                expiryClass = 'bg-green-100 text-green-800';
            }
        } else {
            expiryStatus = 'N/A';
            expiryClass = 'bg-gray-100 text-gray-800';
        }
        
        const row = `
            <tr class="border-t hover:bg-gray-50">
                <td class="py-3 px-4">
                    <div class="flex items-center">
                        <img src="${imageUrl}" 
                             class="w-10 h-10 rounded mr-3 object-cover" 
                             alt="${product.productName}"
                             onerror="this.src='http://localhost:8083/Images/product_details_fallback_img.jpg'">
                        <div>
                            <div class="font-medium">${product.productName || 'N/A'}</div>
                            <div class="text-sm text-gray-500">${product.brandName || 'N/A'}</div>
                            <div class="text-xs text-gray-400">${product.sku || 'No SKU'}</div>
                        </div>
                    </div>
                </td>
                <td class="py-3 px-4">
                    <span class="category-badge ${categoryClass}">
                        ${category}
                    </span>
                </td>
                <td class="py-3 px-4">
                    <div class="flex items-center">
                        <span class="stock-indicator ${stockClass} mr-2"></span>
                        <span>${stock || 0}</span>
                    </div>
                </td>
                <td class="py-3 px-4 font-medium">
                    ${priceDisplay}
                </td>
                <td class="py-3 px-4 ${expDate && expDate <= today ? 'text-red-600' : ''}">
                    ${product.expDate || 'N/A'}
                </td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 rounded text-xs ${expiryClass}">
                        ${expiryStatus}
                    </span>
                </td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 rounded text-xs ${product.productStatus === 'Available' || product.productStatus === 'In-Stock' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${product.productStatus || 'N/A'}
                    </span>
                </td>
                <td class="py-3 px-4">
                    <div class="flex space-x-1">
                        <button onclick="viewProduct(${product.productId}, 'regular')" 
                                class="action-btn bg-blue-100 text-blue-600 hover:bg-blue-200 p-2 rounded" 
                                title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        
                        <button onclick="showBatchManagementModal(${product.productId})" 
                                class="action-btn bg-purple-100 text-purple-600 hover:bg-purple-200 p-2 rounded" 
                                title="Manage Batches">
                            <i class="fas fa-layer-group"></i>
                        </button>
                        <button onclick="deleteProduct(${product.productId}, 'regular')" 
                                class="action-btn bg-red-100 text-red-600 hover:bg-red-200 p-2 rounded" 
                                title="Delete Product">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        
        tbody.append(row);
    });
}

// Updated loadMothercareProducts to accept category parameter
async function loadMothercareProducts(category = 'all') {
    try {
        let mothercareProducts;
        
        if (category === 'all') {
            // Fetch all MB products
            const mbProductsResponse = await fetch(`${MB_PRODUCTS_API}/get-all-mb-active-products?page=0&size=1000`);
            
            if (mbProductsResponse.ok) {
                const mbProductsData = await mbProductsResponse.json();
                
                // Handle different response structures
                if (Array.isArray(mbProductsData)) {
                    mothercareProducts = mbProductsData;
                } else if (mbProductsData.content && Array.isArray(mbProductsData.content)) {
                    mothercareProducts = mbProductsData.content;
                } else if (mbProductsData.data && Array.isArray(mbProductsData.data)) {
                    mothercareProducts = mbProductsData.data;
                } else {
                    mothercareProducts = [];
                }
            } else {
                mothercareProducts = [];
            }
        } else {
            // Fetch products by category
            const encodedCategory = encodeURIComponent(category);
            const response = await fetch(`${MB_PRODUCTS_API}/category/${encodedCategory}?page=0&size=1000`);
            
            if (response.ok) {
                const data = await response.json();
                
                // Handle different response structures
                if (Array.isArray(data)) {
                    mothercareProducts = data;
                } else if (data.content && Array.isArray(data.content)) {
                    mothercareProducts = data.content;
                } else if (data.data && Array.isArray(data.data)) {
                    mothercareProducts = data.data;
                } else {
                    mothercareProducts = [];
                }
            } else {
                console.warn(`Failed to fetch products for category ${category}:`, response.status);
                mothercareProducts = [];
            }
        }
        
        // Also include regular products in relevant categories if needed
        const regularProducts = inventory.filter(product => {
            if (product.productType === 'mb') return false;
            
            const productCategory = product.productCategory;
            return productCategory === 'MotherCare' ||
                   productCategory === 'BabyCare' ;
        });
        
        // Filter regular products by category if needed
        const filteredRegularProducts = category === 'all' ? regularProducts : 
            regularProducts.filter(product => {
                if (category === 'MotherCare') {
                    return product.productCategory === 'MotherCare';
                } else if (category === 'BabyCare') {
                    return product.productCategory === 'BabyCare';
                }
                return false;
            });
        
        // Transform MB products to match your format
        const transformedMBProducts = mothercareProducts.map(mbProduct => {
            let priceArray = [];
            let price = 0;
            
            if (mbProduct.price && Array.isArray(mbProduct.price)) {
                priceArray = mbProduct.price;
                price = mbProduct.price.length > 0 ? parseFloat(mbProduct.price[0]) : 0;
            } else if (mbProduct.price && typeof mbProduct.price === 'string') {
                priceArray = [mbProduct.price];
                price = parseFloat(mbProduct.price) || 0;
            } else if (mbProduct.price && typeof mbProduct.price === 'number') {
                priceArray = [mbProduct.price.toString()];
                price = mbProduct.price;
            }
            
            return {
                productId: mbProduct.id,
                id: mbProduct.id,
                productType: 'mb',
                sku: mbProduct.sku || '',
                productName: mbProduct.title || mbProduct.name || 'Unnamed Product',
                title: mbProduct.title || mbProduct.name || 'Unnamed Product',
                productCategory: mbProduct.category || 'Mother & Baby Care',
                category: mbProduct.category,
                subCategory: mbProduct.subCategory || '',
                productPrice: priceArray,
                price: priceArray,
                productOldPrice: mbProduct.originalPrice || priceArray,
                originalPrice: mbProduct.originalPrice || priceArray,
                productStock: mbProduct.inStock ? 'In-Stock' : 'Out-of-Stock',
                inStock: mbProduct.inStock || false,
                productStatus: mbProduct.inStock ? 'Available' : 'Out of Stock',
                productDescription: (mbProduct.description && Array.isArray(mbProduct.description) && mbProduct.description.length > 0) ? 
                    mbProduct.description[0] : (mbProduct.description || ''),
                description: mbProduct.description || [],
                productQuantity: mbProduct.stockQuantity || 0,
                stockQuantity: mbProduct.stockQuantity || 0,
                prescriptionRequired: false,
                brandName: mbProduct.brand || '',
                brand: mbProduct.brand || '',
                mfgDate: null,
                expDate: null,
                batchNo: null,
                benefitsList: mbProduct.features || [],
                directionsList: [],
                ingredientsList: [],
                productSizes: mbProduct.sizes || [],
                productMainImage: null,
                productSubImages: [],
                productDynamicFields: {},
                discount: mbProduct.discount || 0,
                rating: mbProduct.rating || 0,
                reviewCount: mbProduct.reviewCount || 0
            };
        });
        
        // Combine both product lists
        const allProducts = [...transformedMBProducts, ...filteredRegularProducts];
        
        renderMothercareTable(allProducts, category);
        
        // Update category counts
        updateMothercareCategoryCounts();
        
    } catch (error) {
        console.error('Error loading mothercare products:', error);
        showErrorToast('Failed to load mothercare products');
        renderMothercareTable([], category);
    }
}

async function filterMothercareProducts(subcategory) {
    await loadMothercareProducts(subcategory);
}

function updateMothercareCategoryCounts() {
    // Count products by category
    const categories = {
        'MotherCare': 0,
        'BabyCare': 0,
    };
    
    inventory.forEach(product => {
        if (product.productType === 'mb') {
            const category = product.category || product.productCategory;
            if (categories.hasOwnProperty(category)) {
                categories[category]++;
            }
        } else {
            const category = product.productCategory;
            if (categories.hasOwnProperty(category)) {
                categories[category]++;
            }
        }
    });
    
    // Update the button counts
    Object.keys(categories).forEach(category => {
        const button = $(`.category-filter-btn[data-subcategory="${category}"]`);
        if (button.length) {
            const count = categories[category];
            const currentText = button.text();
            // Remove existing count if present
            const textWithoutCount = currentText.replace(/\(\d+\)/, '').trim();
            button.text(`${textWithoutCount} (${count})`);
        }
    });
}

function renderMothercareTable(products, category = 'all') {
    const tbody = $('#mothercare-table-body');
    tbody.empty();
    
    if (products.length === 0) {
        const message = category === 'all' ? 
            'No mothercare products found' : 
            `No products found in "${category}" category`;
        tbody.html(`<tr><td colspan="8" class="text-center py-8 text-gray-500">${message}</td></tr>`);
        return;
    }
    
    products.forEach((product) => {
        const isMBProduct = product.productType === 'mb';
        const stock = isMBProduct ? product.stockQuantity : product.productQuantity;
        const stockClass = getStockClass(stock);
        const productCategory = isMBProduct ? 
            (product.category || product.productCategory) : 
            product.productCategory;
        const categoryClass = getCategoryBadgeClass(productCategory);
        const productName = isMBProduct ? product.title : product.productName;
        const brandName = isMBProduct ? product.brand : product.brandName;
        const productIdToUse = isMBProduct ? product.id : product.productId;
        const productType = isMBProduct ? 'mb' : 'regular';
        
        let imageUrl = 'http://localhost:8083/Images/product_details_fallback_img.jpg';
        if (isMBProduct && product.id) {
            imageUrl = `${BASE_URL}/api/mb/products/${product.id}/image`;
        } else if (!isMBProduct && product.productMainImage) {
            imageUrl = product.productMainImage.startsWith('http') ? 
                product.productMainImage : 
                `${BASE_URL}${product.productMainImage}`;
        }
        
        // Calculate discount if available
        let discountBadge = '';
        if (isMBProduct && product.discount > 0) {
            discountBadge = `
                <span class="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    ${product.discount}% OFF
                </span>
            `;
        }
        
        // Calculate rating stars
        let ratingStars = '';
        if (isMBProduct && product.rating > 0) {
            const fullStars = Math.floor(product.rating);
            const hasHalfStar = product.rating % 1 >= 0.5;
            ratingStars = `
                <div class="flex items-center mt-1">
                    ${Array(fullStars).fill('<i class="fas fa-star text-yellow-400 text-xs"></i>').join('')}
                    ${hasHalfStar ? '<i class="fas fa-star-half-alt text-yellow-400 text-xs"></i>' : ''}
                    ${Array(5 - fullStars - (hasHalfStar ? 1 : 0)).fill('<i class="far fa-star text-yellow-400 text-xs"></i>').join('')}
                    <span class="ml-1 text-xs text-gray-500">(${product.rating})</span>
                </div>
            `;
        }
        
        const row = `
            <tr class="border-t hover:bg-gray-50" data-category="${productCategory}">
                <td class="py-3 px-4">
                    <div class="flex items-center">
                        <img src="${imageUrl}" 
                             class="w-10 h-10 rounded mr-3 object-cover" 
                             alt="${productName}"
                             onerror="this.src='http://localhost:8083/Images/product_details_fallback_img.jpg'">
                        <div>
                            <div class="font-medium">${productName || 'N/A'}</div>
                            <div class="text-sm text-gray-500">${brandName || 'N/A'}</div>
                            ${ratingStars}
                        </div>
                        ${discountBadge}
                    </div>
                </td>
                <td class="py-3 px-4">
                    <span class="category-badge ${categoryClass}">
                        ${productCategory || 'N/A'}
                    </span>
                </td>
                <td class="py-3 px-4">
                    <div class="flex items-center">
                        <span class="stock-indicator ${stockClass} mr-2"></span>
                        <span>${stock || 0}</span>
                    </div>
                </td>
                <td class="py-3 px-4 font-medium">
                    ₹${isMBProduct ? 
                        (product.price && product.price.length > 0 ? parseFloat(product.price[0]).toFixed(2) : '0.00') : 
                        (Array.isArray(product.productPrice) ? parseFloat(product.productPrice[0] || 0).toFixed(2) : parseFloat(product.productPrice || 0).toFixed(2))}
                    ${isMBProduct && product.originalPrice && product.originalPrice.length > 0 && parseFloat(product.originalPrice[0]) > parseFloat(product.price[0]) ? 
                        `<div class="text-sm text-gray-500 line-through">₹${parseFloat(product.originalPrice[0]).toFixed(2)}</div>` : ''}
                </td>
                <td class="py-3 px-4">
                    ${product.expDate || 'N/A'}
                </td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 rounded text-xs ${(isMBProduct ? product.inStock : product.productStatus === 'Available') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${isMBProduct ? (product.inStock ? 'Available' : 'Out of Stock') : (product.productStatus || 'N/A')}
                    </span>
                </td>
                <td class="py-3 px-4">
                    ${isMBProduct ? (product.reviewCount || 0) : 'N/A'}
                </td>
                <td class="py-3 px-4">
                    <div class="flex space-x-1">
                        <button onclick="viewProduct(${productIdToUse}, '${productType}')" 
                                class="action-btn bg-blue-100 text-blue-600 hover:bg-blue-200 p-2 rounded" 
                                title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    
                        ${isMBProduct ? 
                            `<button onclick="showBatchManagementModalMB(${productIdToUse})" 
                                    class="action-btn bg-purple-100 text-purple-600 hover:bg-purple-200 p-2 rounded" 
                                    title="Manage Batches">
                                <i class="fas fa-layer-group"></i>
                            </button>` :
                            `<button onclick="showBatchManagementModal(${productIdToUse})" 
                                    class="action-btn bg-purple-100 text-purple-600 hover:bg-purple-200 p-2 rounded" 
                                    title="Manage Batches">
                                <i class="fas fa-layer-group"></i>
                            </button>`
                        }
                        <button onclick="deleteProduct(${productIdToUse}, '${productType}')" 
                                class="action-btn bg-red-100 text-red-600 hover:bg-red-200 p-2 rounded" 
                                title="Delete Product">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        
        tbody.append(row);
    });
}

// Action Button Functions
// async function viewProduct(productId, type) {
//     try {
//         if (!productId) {
//             showErrorToast('Product ID is required');
//             return;
//         }
        
//         console.log('View product clicked:', { productId, type });
        
//         // Show loader
//         showLoader();
        
//         // Fetch product details for the overlay modal
//         let productData;
//         if (type === 'mb') {
//             const response = await fetch(`${MB_PRODUCTS_API}/${productId}`);
//             if (!response.ok) throw new Error('Failed to fetch MB product');
//             productData = await response.json();
//         } else {
//             const response = await fetch(`${PRODUCTS_API}/${productId}`);
//             if (!response.ok) throw new Error('Failed to fetch product');
//             productData = await response.json();
//         }
        
//         // Generate HTML for the view modal
//         const html = generateViewModalHTML(productData, type);
        
//         // Show the overlay modal
//         $('#batchModalContent').html(html);
//         $('#batchModalTitle').text(`View Product - ${type === 'mb' ? productData.title : productData.productName}`);
//         $('#batchModal').show();
        
//     } catch (error) {
//         console.error('Error viewing product:', error);
//         showErrorToast('Failed to load product details');
//     } finally {
//         hideLoader();
//     }
// }

// // Helper function to generate view modal HTML with "Edit" button that redirects
// function generateViewModalHTML(productData, type) {
//     const isMBProduct = type === 'mb';
    
//     const productName = isMBProduct ? productData.title : productData.productName;
//     const brandName = isMBProduct ? productData.brand : productData.brandName;
//     const sku = isMBProduct ? productData.sku : productData.sku;
//     const category = isMBProduct ? productData.category : productData.productCategory;
//     const description = isMBProduct ? 
//         (Array.isArray(productData.description) ? productData.description[0] : productData.description) : 
//         productData.productDescription;
//     const price = isMBProduct ? 
//         (productData.price && productData.price.length > 0 ? `₹${productData.price[0]}` : '₹0') : 
//         (Array.isArray(productData.productPrice) ? `₹${productData.productPrice[0]}` : `₹${productData.productPrice || 0}`);
//     const stock = isMBProduct ? productData.stockQuantity : productData.productQuantity;
//     const status = isMBProduct ? (productData.inStock ? 'Available' : 'Out of Stock') : productData.productStatus;
//     const productId = isMBProduct ? productData.id : productData.productId;
    
//     return `
//         <div class="product-view-modal">
//             <div class="mb-6 p-4 ${isMBProduct ? 'bg-pink-50' : 'bg-blue-50'} rounded-lg">
//                 <div class="flex justify-between items-start">
//                     <div>
//                         <h3 class="font-semibold text-lg text-gray-800">${productName}</h3>
//                         <div class="flex flex-wrap gap-4 mt-2">
//                             <span class="text-sm text-gray-600">Brand: ${brandName || 'N/A'}</span>
//                             <span class="text-sm text-gray-600">SKU: ${sku || 'N/A'}</span>
//                             <span class="text-sm text-gray-600">Category: ${category || 'N/A'}</span>
//                         </div>
//                     </div>
//                     <span class="px-3 py-1 text-xs font-semibold rounded-full ${isMBProduct ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'}">
//                         ${isMBProduct ? 'Mother & Baby Care' : 'Medicine'}
//                     </span>
//                 </div>
//             </div>
            
//             <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//                 <div class="bg-white p-4 rounded-lg border">
//                     <h4 class="font-medium text-gray-700 mb-3">Product Information</h4>
//                     <div class="space-y-3">
//                         <div class="flex justify-between">
//                             <span class="text-gray-600">Price:</span>
//                             <span class="font-semibold">${price}</span>
//                         </div>
//                         <div class="flex justify-between">
//                             <span class="text-gray-600">Stock Quantity:</span>
//                             <span class="font-semibold ${stock <= 10 ? 'text-yellow-600' : 'text-green-600'}">${stock || 0}</span>
//                         </div>
//                         <div class="flex justify-between">
//                             <span class="text-gray-600">Status:</span>
//                             <span class="px-2 py-1 rounded text-xs ${status === 'Available' || status === 'In-Stock' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
//                                 ${status || 'N/A'}
//                             </span>
//                         </div>
//                     </div>
//                 </div>
                
//                 <div class="bg-white p-4 rounded-lg border">
//                     <h4 class="font-medium text-gray-700 mb-3">Additional Details</h4>
//                     <div class="space-y-2">
//                         <div>
//                             <span class="text-gray-600 text-sm">MFG Date:</span>
//                             <p class="font-medium">${productData.mfgDate || 'N/A'}</p>
//                         </div>
//                         <div>
//                             <span class="text-gray-600 text-sm">Expiry Date:</span>
//                             <p class="font-medium ${productData.expDate && new Date(productData.expDate) <= new Date() ? 'text-red-600' : ''}">
//                                 ${productData.expDate || 'N/A'}
//                             </p>
//                         </div>
//                         <div>
//                             <span class="text-gray-600 text-sm">Prescription Required:</span>
//                             <p class="font-medium">${productData.prescriptionRequired ? 'Yes' : 'No'}</p>
//                         </div>
//                     </div>
//                 </div>
//             </div>
            
//             <div class="mb-6">
//                 <h4 class="font-medium text-gray-700 mb-2">Description</h4>
//                 <div class="bg-gray-50 p-4 rounded-lg border">
//                     <p class="text-gray-600">${description || 'No description available'}</p>
//                 </div>
//             </div>
            
//             <div class="flex justify-end gap-3 pt-6 border-t">
               
//                 <button onclick="closeModal('batchModal')" 
//                         class="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium">
//                     Close
//                 </button>
//             </div>
//         </div>
//     `;
// }



// Make sure you have these helpers somewhere in your file (preferably at the top)
function formatDateToDDMMYYYY(value) {
    if (!value && value !== 0) return 'N/A';

    // Case 1: Excel serial number (number or numeric string)
    if (!isNaN(value) && value > 0 && value < 100000) {
        const serial = Number(value);
        const utc_days  = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);

        if (!isNaN(date_info.getTime())) {
            const year  = date_info.getUTCFullYear();
            const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
            const day   = String(date_info.getUTCDate()).padStart(2, '0');
            return `${day}-${month}-${year}`;
        }
    }

    // Case 2: Already a date string
    if (typeof value === 'string') {
        const cleaned = value.trim();

        // YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
            const [y, m, d] = cleaned.split('-');
            if (isValidDate(y, m, d)) return `${d}-${m}-${y}`;
        }

        // DD-MM-YYYY or DD/MM/YYYY
        if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(cleaned)) {
            const parts = cleaned.split(/[-/]/);
            const [d, m, y] = parts.map(p => p.trim());
            if (isValidDate(y, m, d)) return `${d.padStart(2,'0')}-${m.padStart(2,'0')}-${y}`;
        }

        // Fallback: try native parsing
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const d = String(parsed.getDate()).padStart(2, '0');
            return `${d}-${m}-${y}`;
        }
    }

    return 'N/A';
}

function isValidDate(year, month, day) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function hasExpired(dateValue) {
    const formatted = formatDateToDDMMYYYY(dateValue);
    if (formatted === 'N/A') return false;

    // Convert DD-MM-YYYY back to comparable Date
    const [d, m, y] = formatted.split('-');
    const expDate = new Date(`${y}-${m}-${d}`);
    return !isNaN(expDate.getTime()) && expDate <= new Date();
}

async function viewProduct(productId, type) {
    try {
        if (!productId) {
            showErrorToast('Product ID is required');
            return;
        }

        console.log('View product clicked:', { productId, type });

        showLoader();

        let productData;
        let batches = [];

        // Fetch basic product info
        if (type === 'mb') {
            const response = await fetch(`${MB_PRODUCTS_API}/${productId}`);
            if (!response.ok) throw new Error('Failed to fetch MB product');
            productData = await response.json();
        } else {
            const response = await fetch(`${PRODUCTS_API}/${productId}`);
            if (!response.ok) throw new Error('Failed to fetch product');
            productData = await response.json();

            // Fetch batches + variants
            const inventoryResponse = await fetch(`${INVENTORY_API}/product/${productId}`);
            if (inventoryResponse.ok) {
                const inventoryData = await inventoryResponse.json();
                batches = inventoryData.batches || [];
            }
        }

        // Collect structured variant date info
        let variantDates = [];

        if (batches.length > 0) {
            batches.forEach(batch => {
                (batch.variants || []).forEach(variant => {
                    const mfg = formatDateToDDMMYYYY(variant.mfgDate);
                    const exp = formatDateToDDMMYYYY(variant.expiryDate);
                    const size = variant.size || 'Default';

                    if (mfg === 'N/A' && exp === 'N/A') return;

                    variantDates.push({
                        size: size,
                        mfg: mfg !== 'N/A' ? mfg : '-',
                        exp: exp !== 'N/A' ? exp : '-',
                        expired: exp !== 'N/A' && new Date(exp.split('-').reverse().join('-')) <= new Date()
                    });
                });
            });
        } else {
            // Legacy fallback for products without batches
            const mfg = formatDateToDDMMYYYY(productData.mfgDate);
            const exp = formatDateToDDMMYYYY(productData.expDate);
            if (mfg !== 'N/A' || exp !== 'N/A') {
                variantDates.push({
                    size: 'Default',
                    mfg: mfg !== 'N/A' ? mfg : '-',
                    exp: exp !== 'N/A' ? exp : '-',
                    expired: exp !== 'N/A' && new Date(exp.split('-').reverse().join('-')) <= new Date()
                });
            }
        }

        // Sort by size (alphabetical)
        variantDates.sort((a, b) => a.size.localeCompare(b.size));

        // Generate HTML
        const html = generateViewModalHTML(productData, type, variantDates);

        $('#batchModalContent').html(html);
        $('#batchModalTitle').text(`View Product - ${type === 'mb' ? (productData.title || 'Product') : (productData.productName || 'Product')}`);
        $('#batchModal').show();

    } catch (error) {
        console.error('Error viewing product:', error);
        showErrorToast('Failed to load product details');
    } finally {
        hideLoader();
    }
}

function generateViewModalHTML(productData, type, variantDates = []) {
    const isMBProduct = type === 'mb';

    const productName   = isMBProduct ? productData.title : productData.productName;
    const brandName     = isMBProduct ? productData.brand : productData.brandName;
    const sku           = isMBProduct ? productData.sku : productData.sku;
    const category      = isMBProduct ? productData.category : productData.productCategory;
    const description   = isMBProduct ?
        (Array.isArray(productData.description) ? productData.description[0] : productData.description) :
        productData.productDescription;
    const price         = isMBProduct ?
        (productData.price && productData.price.length > 0 ? `₹${productData.price[0]}` : '₹0') :
        (Array.isArray(productData.productPrice) ? `₹${productData.productPrice[0]}` : `₹${productData.productPrice || 0}`);
    const stock         = isMBProduct ? productData.stockQuantity : productData.productQuantity;
    const status        = isMBProduct ? (productData.inStock ? 'Available' : 'Out of Stock') : productData.productStatus;
    const prescription  = productData.prescriptionRequired ?? false;

    return `
        <div class="product-view-modal p-2">
            <div class="mb-6 p-4 ${isMBProduct ? 'bg-pink-50' : 'bg-blue-50'} rounded-lg">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-semibold text-lg text-gray-800">${productName || 'Unnamed Product'}</h3>
                        <div class="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                            <span>Brand: ${brandName || 'N/A'}</span>
                            <span>SKU: ${sku || 'N/A'}</span>
                            <span>Category: ${category || 'N/A'}</span>
                        </div>
                    </div>
                    <span class="px-3 py-1 text-xs font-semibold rounded-full ${isMBProduct ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'}">
                        ${isMBProduct ? 'Mother & Baby Care' : 'Medicine'}
                    </span>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="bg-white p-4 rounded-lg border">
                    <h4 class="font-medium text-gray-700 mb-3">Product Information</h4>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Price:</span>
                            <span class="font-semibold">${price}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Stock Quantity:</span>
                            <span class="font-semibold ${stock <= 10 ? 'text-yellow-600' : 'text-green-600'}">${stock || 0}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Status:</span>
                            <span class="px-2 py-1 rounded text-xs ${status === 'Available' || status === 'In-Stock' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${status || 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-4 rounded-lg border">
                    <h4 class="font-medium text-gray-700 mb-3">Manufacturing & Expiry Details</h4>
                    
                    ${variantDates.length > 0 ? `
                        <div class="overflow-x-auto">
                            <table class="min-w-full text-sm divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="py-2 px-3 text-left font-medium text-gray-700">Size / Variant</th>
                                        <th class="py-2 px-3 text-left font-medium text-gray-700">MFG Date</th>
                                        <th class="py-2 px-3 text-left font-medium text-gray-700">Expiry Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${variantDates.map(v => `
                                        <tr class="${v.expired ? 'bg-red-50' : ''}">
                                            <td class="py-2 px-3">${v.size}</td>
                                            <td class="py-2 px-3">${v.mfg}</td>
                                            <td class="py-2 px-3 ${v.expired ? 'text-red-600 font-medium' : ''}">
                                                ${v.exp} ${v.expired ? '<span class="text-xs">(Expired)</span>' : ''}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <p class="text-gray-500 text-center py-4">No manufacturing or expiry information available</p>
                    `}

                    <div class="mt-4 text-sm">
                        <span class="text-gray-600">Prescription Required:</span>
                        <span class="font-medium ml-2">${prescription ? 'Yes' : 'No'}</span>
                    </div>
                </div>
            </div>

            <div class="mb-6">
                <h4 class="font-medium text-gray-700 mb-2">Description</h4>
                <div class="bg-gray-50 p-4 rounded-lg border">
                    <p class="text-gray-600 whitespace-pre-line">${description || 'No description available'}</p>
                </div>
            </div>

            <div class="flex justify-end gap-3 pt-6 border-t">
                <button onclick="closeModal('batchModal')"
                        class="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium">
                    Close
                </button>
            </div>
        </div>
    `;
}


// EDIT BUTTON - Show overlay with edit form, not redirect
async function editProduct(productId, type) {
    try {
        if (!productId) {
            showErrorToast('Product ID is required');
            return;
        }
        
        console.log('Edit product clicked:', { productId, type });
        
        // Show loader
        showLoader();
        
        // Fetch product details
        let productData;
        if (type === 'mb') {
            const response = await fetch(`${MB_PRODUCTS_API}/${productId}`);
            if (!response.ok) throw new Error('Failed to fetch MB product');
            productData = await response.json();
        } else {
            const response = await fetch(`${PRODUCTS_API}/${productId}`);
            if (!response.ok) throw new Error('Failed to fetch product');
            productData = await response.json();
        }
        
        // Generate edit form HTML
        const html = generateEditFormHTML(productData, type);
        
        // Show the edit modal
        $('#batchModalContent').html(html);
        $('#batchModalTitle').text(`Edit Product - ${type === 'mb' ? productData.title : productData.productName}`);
        $('#batchModal').show();
        
    } catch (error) {
        console.error('Error in editProduct:', error);
        showErrorToast('Failed to load product for editing');
    } finally {
        hideLoader();
    }
}

// Helper function to generate edit form HTML
function generateEditFormHTML(productData, type) {
    const isMBProduct = type === 'mb';
    
    const productName = isMBProduct ? productData.title : productData.productName;
    const brandName = isMBProduct ? productData.brand : productData.brandName;
    const sku = isMBProduct ? productData.sku : productData.sku;
    const category = isMBProduct ? productData.category : productData.productCategory;
    const description = isMBProduct ? 
        (Array.isArray(productData.description) ? productData.description[0] : productData.description) : 
        productData.productDescription;
    const price = isMBProduct ? 
        (productData.price && productData.price.length > 0 ? productData.price[0] : 0) : 
        (Array.isArray(productData.productPrice) ? productData.productPrice[0] : productData.productPrice);
    const stock = isMBProduct ? productData.stockQuantity : productData.productQuantity;
    
    return `
        <div class="product-edit-form">
            <form id="editProductForm" class="space-y-4">
                <input type="hidden" name="productId" value="${productData.id || productData.productId}">
                <input type="hidden" name="type" value="${type}">
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                        <input type="text" name="productName" value="${productName}" required 
                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                        <input type="text" name="brandName" value="${brandName || ''}" 
                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                        <input type="text" name="sku" value="${sku || ''}" 
                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <input type="text" name="category" value="${category || ''}" 
                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                        <input type="number" name="price" value="${price || 0}" required min="0" step="0.01" 
                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                        <input type="number" name="stock" value="${stock || 0}" required min="0" 
                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" rows="3" 
                              class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">${description || ''}</textarea>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">MFG Date</label>
                        <input type="date" name="mfgDate" value="${productData.mfgDate || ''}" 
                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                        <input type="date" name="expDate" value="${productData.expDate || ''}" 
                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                </div>
                
                <div class="flex justify-end gap-3 pt-6 border-t">
                    <button type="button" onclick="saveProductChanges()" 
                            class="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium">
                        <i class="fas fa-save mr-2"></i>Save Changes
                    </button>
                    <button type="button" onclick="closeModal('batchModal')" 
                            class="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;
}


// Function to save product changes - USING PATCH ENDPOINT
async function saveProductChanges() {
    try {
        showLoader();
        
        const form = document.getElementById('editProductForm');
        const formData = new FormData(form);
        const productId = formData.get('productId');
        const type = formData.get('type');
        const isMBProduct = type === 'mb';
        
        // Get form values
        const productName = formData.get('productName');
        const brandName = formData.get('brandName');
        const sku = formData.get('sku');
        const category = formData.get('category');
        const price = formData.get('price');
        const stock = formData.get('stock');
        const description = formData.get('description');
        const mfgDate = formData.get('mfgDate');
        const expDate = formData.get('expDate');
        
        // Create product data object
        let productData;
        
        if (isMBProduct) {
            productData = {
                title: productName,
                brand: brandName,
                sku: sku,
                category: category,
                price: [parseFloat(price) || 0],
                stockQuantity: parseInt(stock) || 0,
                description: [description],
                inStock: parseInt(stock) > 0
            };
        } else {
            productData = {
                productName: productName,
                brandName: brandName,
                sku: sku,
                productCategory: category,
                productPrice: [parseFloat(price) || 0],
                productQuantity: parseInt(stock) || 0,
                productDescription: description,
                mfgDate: mfgDate,
                expDate: expDate,
                productStatus: parseInt(stock) > 0 ? 'Available' : 'Out-of-Stock'
            };
        }
        
        console.log('Patching product:', productData);
        
        // Create FormData for multipart request
        const patchFormData = new FormData();
        patchFormData.append('productData', JSON.stringify(productData));
        
        // Use PATCH endpoint which doesn't require images
        const url = isMBProduct ? 
            `${MB_PRODUCTS_API}/update-mb-product/${productId}` :  // Already PATCH for MB
            `${PRODUCTS_API}/patch-product/${productId}`;         // Use PATCH for regular products
            
        console.log('Sending PATCH request to:', url);
        
        const response = await fetch(url, {
            method: 'PATCH',
            body: patchFormData
            // Don't set Content-Type header for FormData
        });
        
        if (!response.ok) {
            let errorText = await response.text();
            console.error('Patch failed:', errorText);
            
            // Try to parse error message
            let errorMessage = `HTTP ${response.status}`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.message) {
                    errorMessage = errorJson.message;
                } else if (errorJson.error) {
                    errorMessage = errorJson.error;
                }
            } catch (e) {
                // Not JSON, use as is
                if (errorText && errorText.trim()) {
                    errorMessage = errorText;
                }
            }
            
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('Patch successful:', result);
        
        showSuccessToast('Product updated successfully!');
        
        // Refresh the data
        await fetchAllProducts();
        
        // Close the modal
        closeModal('batchModal');
        
    } catch (error) {
        console.error('Error patching product:', error);
        
        // Show user-friendly error messages
        if (error.message.includes('400')) {
            showErrorToast('Invalid data. Please check all fields.');
        } else if (error.message.includes('404')) {
            showErrorToast('Product not found or endpoint unavailable.');
        } else if (error.message.includes('415')) {
            showErrorToast('Server rejected the request format.');
        } else {
            showErrorToast(`Update failed: ${error.message}`);
        }
    } finally {
        hideLoader();
    }
}

async function deleteProduct(productId, type) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoader();
        
        let url, successMessage;
        
        if (type === 'mb') {
            url = `${MB_PRODUCTS_API}/delete-product/${productId}`;
            successMessage = 'Mother & Baby Care product deleted successfully!';
        } else {
            url = `${PRODUCTS_API}/delete-product/${productId}`;
            successMessage = 'Product deleted successfully!';
        }
        
        const response = await fetch(url, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        showSuccessToast(successMessage);
        
        // Refresh the inventory data
        await fetchAllProducts();
        
        // Reload current tab data
        const activeTab = $('.tab-item.active').data('tab');
        if (activeTab === 'medicines') {
            await loadMedicines();
        } else if (activeTab === 'mothercare') {
            await loadMothercareProducts();
        }
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showErrorToast(`Failed to delete product: ${error.message}`);
    } finally {
        hideLoader();
    }
}

// ===== BATCH MANAGEMENT MODAL FUNCTIONS =====

// FIXED to handle both single and multiple variants properly


// Helper: Convert Excel serial date number to DD-MM-YYYY string
// function excelSerialToDate(serial) {
//     if (!serial || isNaN(serial) || serial <= 0) {
//         return 'N/A';
//     }

//     // Excel serial date: days since 1900-01-01 (with 1900 leap year bug)
//     const utc_days = Math.floor(serial - 25569); // 25569 = days from 1900-01-01 to 1970-01-01
//     const utc_value = utc_days * 86400;          // seconds
//     const date_info = new Date(utc_value * 1000);

//     const year  = date_info.getUTCFullYear();
//     const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
//     const day   = String(date_info.getUTCDate()).padStart(2, '0');

//     return `${day}-${month}-${year}`;
// }


async function showBatchManagementModal(productId) {
    try {
        showLoader();
        currentProductId = productId;
        currentProductType = 'regular';

        // Fetch product + batches using the new unified endpoint
        const response = await fetch(`${INVENTORY_API}/product/${productId}`);
        if (!response.ok) throw new Error(`Failed to fetch product batches - ${response.status}`);
        
        const data = await response.json();
        
        // Extract key fields
        const product = {
            productId: data.productId,
            productName: data.productName,
            sku: data.sku,
            brandName: data.brandName,
            totalStock: data.totalStock || 0
        };

        const batches = data.batches || [];

        // Calculate total stock from frontend as fallback/sanity check
        const calculatedTotal = batches.reduce((sum, batch) => {
            return sum + (batch.variants || []).reduce((vsum, v) => vsum + (v.quantity || 0), 0);
        }, 0);

        // Use backend totalStock if available, else calculated
        const displayTotalStock = product.totalStock > 0 ? product.totalStock : calculatedTotal;

        // Generate batch + variants table
        const batchTableHTML = batches.length > 0 ? `
            <div>
                <h4 class="font-medium mb-3 text-gray-700">Existing Batches (${batches.length})</h4>
                <div class="overflow-x-auto border rounded-lg">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50 sticky top-0">
                            <tr>
                                <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Batch No</th>
                                <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Size</th>
                                <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Quantity</th>
                                <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">MFG Date</th>
                                <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Expiry Date</th>
                                <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Status</th>
                                <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${batches.flatMap(batch => {
                                const variants = batch.variants || [];
                                if (variants.length === 0) {
                                    // rare case: batch without variants
                                    return `
                                        <tr class="hover:bg-gray-50">
                                            <td class="py-3 px-4 font-medium">${batch.batchNo || 'N/A'}</td>
                                            <td class="py-3 px-4">—</td>
                                            <td class="py-3 px-4 font-semibold">${batch.totalQuantity || 0}</td>
                                            <td class="py-3 px-4">—</td>
                                            <td class="py-3 px-4">—</td>
                                            <td class="py-3 px-4">
                                                <span class="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                                                    ${batch.stockStatus || 'N/A'}
                                                </span>
                                            </td>
                                            <td class="py-3 px-4">
                                                <div class="flex space-x-2">
                                                    <button onclick="editBatch(${batch.inventoryId})" 
                                                            class="text-blue-600 hover:text-blue-800" title="Edit">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button onclick="showDeleteBatchConfirm(${batch.inventoryId})" 
                                                            class="text-red-600 hover:text-red-800" title="Delete">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }
                                return variants.map(variant => `
    <tr class="hover:bg-gray-50">
        <td class="py-3 px-4 font-medium">${batch.batchNo || 'N/A'}</td>
        <td class="py-3 px-4">${variant.size || '—'}</td>
        <td class="py-3 px-4">
            <span class="font-semibold ${variant.quantity <= 10 ? 'text-yellow-600' : 'text-gray-800'}">
                ${variant.quantity || 0}
            </span>
        </td>
       <td class="py-3 px-4">
    ${formatDateToDDMMYYYY(variant.mfgDate) || 'N/A'}
</td>

<td class="py-3 px-4 ${hasExpired(variant.expiryDate) ? 'text-red-600 font-medium' : ''}">
    ${formatDateToDDMMYYYY(variant.expiryDate) || 'N/A'}
</td>
        <td class="py-3 px-4">
            <span class="px-2 py-1 rounded text-xs ${batch.stockStatus === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 
                batch.stockStatus === 'LOW_STOCK' ? 'bg-yellow-100 text-yellow-800' : 
                batch.stockStatus === 'DAMAGED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
                ${batch.stockStatus || 'N/A'}
            </span>
        </td>
        <td class="py-3 px-4">
            <div class="flex space-x-2">
                <button onclick="editBatch(${batch.inventoryId})" 
                        class="text-blue-600 hover:text-blue-800" title="Edit Batch">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="showDeleteBatchConfirm(${batch.inventoryId})" 
                        class="text-red-600 hover:text-red-800" title="Delete Batch">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    </tr>
`);

                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        ` : '<p class="text-gray-500 text-center py-8">No batches found for this product.</p>';

        const html = `
            <div class="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 class="font-semibold text-lg text-gray-800">${product.productName || 'Product'}</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3">
                    <div>
                        <p class="text-sm text-gray-600">Total Stock</p>
                        <p class="text-2xl font-bold text-gray-800">${displayTotalStock}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">SKU</p>
                        <p class="text-sm font-medium text-gray-800">${product.sku || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Brand</p>
                        <p class="text-sm font-medium text-gray-800">${product.brandName || 'N/A'}</p>
                    </div>
                </div>
            </div>
            
            <div class="mb-6">
                <h4 class="font-medium mb-3 text-gray-700">Add New Batch</h4>
                <form id="add-specific-batch-form" class="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <input type="hidden" name="productId" value="${productId}">
                    
                    <!-- Batch Number -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Batch Number *</label>
                        <input type="text" name="batchNo" required 
                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500" 
                               placeholder="BATCH-2025-001">
                    </div>
                    
                    <!-- Variant Type Toggle -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Variant Type</label>
                        <div class="flex gap-6">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="variantType" value="single" checked class="variant-type-radio">
                                <span class="text-sm text-gray-700">Single Variant</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="variantType" value="multiple" class="variant-type-radio">
                                <span class="text-sm text-gray-700">Multiple Variants</span>
                            </label>
                        </div>
                    </div>

                    <!-- Single Variant Fields -->
                    <div id="single-variant-section" class="variant-section space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                                <input type="number" name="quantity" min="1" required
                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Size (Optional)</label>
                                <input type="text" name="size" 
                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                                       placeholder="e.g. 10 tab, 1x10">
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">MFG Date</label>
                                <input type="month" name="mfgDate" 
                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                                <input type="month" name="expiryDate" required
                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>
                    </div>

                    <!-- Multiple Variants Section -->
                    <div id="multiple-variants-section" class="variant-section hidden space-y-4">
                        <div id="variants-container" class="space-y-5"></div>
                        <button type="button" id="add-variant-btn" 
                                class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 rounded-lg transition-colors font-medium">
                            + Add Variant (Size)
                        </button>
                    </div>

                    <!-- Common fields -->
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                        <select name="stockStatus" class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500">
                            <option value="AVAILABLE">Available</option>
                            <option value="LOW_STOCK">Low Stock</option>
                            <option value="DAMAGED">Damaged</option>
                            <option value="EXPIRED">Expired</option>
                        </select>
                    </div>

                    <button type="submit" 
                            class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium mt-6">
                        Add Batch
                    </button>
                </form>
            </div>
            
            ${batchTableHTML}
        `;

        $('#batchModalContent').html(html);
        $('#batchModalTitle').text(`Manage Batches - ${product.productName || 'Product'}`);
        $('#batchModal').show();

        // Re-attach behaviors
        setupVariantTypeToggle();
        
        // Add initial variant row if multiple is selected (or force one)
        setTimeout(() => {
            if ($('#variants-container').children().length === 0) {
                addVariantRow(); // ← make sure this function exists and works
            }
        }, 50);

        // Form submit handler
        $('#add-specific-batch-form').off('submit').on('submit', async function(e) {
            e.preventDefault();
            await addNewBatchForProduct($(this).serializeArray());
        });

    } catch (error) {
        console.error('Error loading batch modal:', error);
        showErrorToast('Failed to load batch information');
    } finally {
        hideLoader();
    }
}



//======================== old version =====================//
// async function showBatchManagementModal(productId) {
//     try {
//         showLoader();
//         currentProductId = productId;
//         currentProductType = 'regular';
        
//         // Fetch product details using the correct API endpoint
//         const productResponse = await fetch(`${PRODUCTS_API}/${productId}`);
//         if (!productResponse.ok) throw new Error(`Failed to fetch product`);
//         const product = await productResponse.json();
        
//         // Fetch batches for this product using the new API
//         const batchesResponse = await fetch(`${INVENTORY_API}/get-all-batches?productId=${productId}&size=100`);
//         let batches = [];
        
//         if (batchesResponse.ok) {
//             const batchesData = await batchesResponse.json();
//             batches = batchesData.data || [];
//         }
        
//         // Calculate total stock
//         const totalStock = batches.reduce((sum, batch) => sum + (batch.quantity || 0), 0);
        
//         // Generate batch table HTML
//         const batchTableHTML = batches.length > 0 ? `
//             <div>
//                 <h4 class="font-medium mb-3 text-gray-700">Existing Batches (${batches.length})</h4>
//                 <div class="overflow-x-auto border rounded-lg">
//                     <table class="min-w-full">
//                         <thead class="bg-gray-50">
//                             <tr>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Batch No</th>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Size</th>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Quantity</th>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">MFG Date</th>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Expiry Date</th>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Status</th>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             ${batches.map(batch => `
//                                 <tr class="border-t hover:bg-gray-50">
//                                     <td class="py-3 px-4 font-medium">${batch.batchNo || 'N/A'}</td>
//                                     <td class="py-3 px-4">${batch.size || 'N/A'}</td>
//                                     <td class="py-3 px-4">
//                                         <span class="font-semibold ${batch.quantity <= 10 ? 'text-yellow-600' : 'text-gray-800'}">
//                                             ${batch.quantity || 0}
//                                         </span>
//                                     </td>
//                                     <td class="py-3 px-4">${batch.mfgDate ? batch.mfgDate.split('T')[0] : 'N/A'}</td>
//                                     <td class="py-3 px-4 ${batch.expDate && new Date(batch.expDate) <= new Date() ? 'text-red-600' : ''}">
//                                         ${batch.expDate ? batch.expDate.split('T')[0] : 'N/A'}
//                                     </td>
//                                     <td class="py-3 px-4">
//                                         <span class="px-2 py-1 rounded text-xs ${batch.stockStatus === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 
//                                             batch.stockStatus === 'LOW_STOCK' ? 'bg-yellow-100 text-yellow-800' : 
//                                             batch.stockStatus === 'DAMAGED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
//                                             ${batch.stockStatus || 'N/A'}
//                                         </span>
//                                     </td>
//                                     <td class="py-3 px-4">
//                                         <div class="flex space-x-2">
//                                             <button onclick="editBatch(${batch.inventoryId})" 
//                                                     class="text-blue-600 hover:text-blue-800" title="Edit">
//                                                 <i class="fas fa-edit"></i>
//                                             </button>
//                                             <button onclick="showDeleteBatchConfirm(${batch.inventoryId})" 
//                                                     class="text-red-600 hover:text-red-800" title="Delete">
//                                                 <i class="fas fa-trash"></i>
//                                             </button>
//                                         </div>
//                                     </td>
//                                 </tr>
//                             `).join('')}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         ` : '<p class="text-gray-500 text-center py-8">No batches found for this product.</p>';
        
//         const html = `
//             <div class="mb-6 p-4 bg-blue-50 rounded-lg">
//                 <h3 class="font-semibold text-lg text-gray-800">${product.productName || product.title || 'Product'}</h3>
//                 <div class="grid grid-cols-2 gap-4 mt-2">
//                     <div>
//                         <p class="text-sm text-gray-600">Total Stock</p>
//                         <p class="text-2xl font-bold text-gray-800">${totalStock}</p>
//                     </div>
//                     <div>
//                         <p class="text-sm text-gray-600">SKU</p>
//                         <p class="text-sm font-medium text-gray-800">${product.sku || 'N/A'}</p>
//                     </div>
//                 </div>
//             </div>
            
//             <div class="mb-6">
//                 <h4 class="font-medium mb-3 text-gray-700">Add New Batch</h4>
//                 <form id="add-specific-batch-form" class="space-y-4 p-4 border rounded-lg bg-gray-50">
//                     <input type="hidden" name="productId" value="${productId}">
                    
//                     <!-- Batch Number -->
//                     <div>
//                         <label class="block text-sm font-medium text-gray-700 mb-1">Batch Number *</label>
//                         <input type="text" name="batchNo" required 
//                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                               placeholder="BATCH-2025-001">
//                     </div>
                    
//                     <!-- Variant Type Toggle -->
//                     <div>
//                         <label class="block text-sm font-medium text-gray-700 mb-2">Variant Type</label>
//                         <div class="flex gap-4">
//                             <label class="flex items-center gap-2 cursor-pointer">
//                                 <input type="radio" name="variantType" value="single" checked class="variant-type-radio">
//                                 <span class="text-sm text-gray-700">Single Variant</span>
//                             </label>
//                             <label class="flex items-center gap-2 cursor-pointer">
//                                 <input type="radio" name="variantType" value="multiple" class="variant-type-radio">
//                                 <span class="text-sm text-gray-700">Multiple Variants</span>
//                             </label>
//                         </div>
//                     </div>
                    
//                     <!-- Single Variant Section -->
//                     <div id="single-variant-section" class="variant-section">
//                         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                                 <label class="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
//                                 <input type="number" name="quantity" min="1" 
//                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                                       placeholder="100">
//                             </div>
//                             <div>
//                                 <label class="block text-sm font-medium text-gray-700 mb-1">Size (Optional)</label>
//                                 <input type="text" name="size" 
//                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                                       placeholder="e.g., M, L, XL">
//                             </div>
//                         </div>
//                         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                                 <label class="block text-sm font-medium text-gray-700 mb-1">MFG Date</label>
//                                 <input type="text" name="mfgDate" 
//                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                                       placeholder="YYYY-MM">
//                             </div>
//                             <div>
//                                 <label class="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
//                                 <input type="text" name="expiryDate" required
//                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                                       placeholder="YYYY-MM">
//                             </div>
//                         </div>
//                     </div>
                    
//                     <!-- Multiple Variants Section -->
//                     <div id="multiple-variants-section" class="variant-section hidden">
//                         <div class="mb-4">
//                             <label class="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
//                             <select name="stockStatus" 
//                                     class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
//                                 <option value="AVAILABLE">Available</option>
//                                 <option value="LOW_STOCK">Low Stock</option>
//                                 <option value="DAMAGED">Damaged</option>
//                                 <option value="EXPIRED">Expired</option>
//                             </select>
//                         </div>
                        
//                         <div id="variants-container" class="space-y-4">
//                             <!-- Variant entries will be added here -->
//                         </div>
                        
//                         <button type="button" id="add-variant-btn" class="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium">
//                             + Add Size Variant
//                         </button>
//                     </div>
                    
//                     <!-- Single Variant: Stock Status (only shown for single variant) -->
//                     <div id="single-stock-status-section" class="variant-section mt-4">
//                         <label class="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
//                         <select name="stockStatus" 
//                                 class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
//                             <option value="AVAILABLE">Available</option>
//                             <option value="LOW_STOCK">Low Stock</option>
//                             <option value="DAMAGED">Damaged</option>
//                             <option value="EXPIRED">Expired</option>
//                         </select>
//                     </div>
                    
//                     <button type="submit" 
//                             class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium mt-4">
//                         Add Batch
//                     </button>
//                 </form>
//             </div>
            
//             ${batchTableHTML}
//         `;
        
//         $('#batchModalContent').html(html);
//         $('#batchModalTitle').text('Manage Batches - ' + (product.productName || product.title || 'Product'));
//         $('#batchModal').show();
        
//         // Setup variant type toggle
//         setupVariantTypeToggle();
        
//         // Add first variant row for multiple variants
//         setTimeout(() => {
//             if ($('#variants-container').children().length === 0) {
//                 addVariantRow();
//             }
//         }, 100);
        
//         // Attach form submit event
//         $('#add-specific-batch-form').off('submit').on('submit', async function(e) {
//             e.preventDefault();
//             await addNewBatchForProduct($(this).serializeArray());
//         });
        
//     } catch (error) {
//         console.error('Error loading batch modal:', error);
//         showErrorToast('Failed to load batch information');
//     } finally {
//         hideLoader();
//     }
// }




async function showBatchManagementModalMB(productId) {
    try {
        showLoader();
        currentProductId = productId;
        currentProductType = 'mb';
        
        // Fetch MB product details
        const productResponse = await fetch(`${MB_PRODUCTS_API}/${productId}`);
        if (!productResponse.ok) throw new Error(`Failed to fetch MB product`);
        const product = await productResponse.json();
        
        // Fetch batches for this MB product using the new API
        const batchesResponse = await fetch(`${INVENTORY_API}/get-all-batches?mbpId=${productId}&size=100`);
        let batches = [];
        
        if (batchesResponse.ok) {
            const batchesData = await batchesResponse.json();
            batches = batchesData.data || [];
        }
        
        // Calculate total stock
        const totalStock = batches.reduce((sum, batch) => sum + (batch.quantity || 0), 0);
        
        // Generate batch table HTML
        const batchTableHTML = batches.length > 0 ? `
            <div>
                <h4 class="font-medium mb-3 text-gray-700">Existing Batches (${batches.length})</h4>
                <div class="overflow-x-auto border rounded-lg">
                    <table class="min-w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Batch No</th>
                                <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Size</th>
                                <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Quantity</th>
                                <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">MFG Date</th>
                                <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Expiry Date</th>
                                <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Status</th>
                                <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${batches.map(batch => `
                                <tr class="border-t hover:bg-gray-50">
                                    <td class="py-3 px-4 font-medium">${batch.batchNo || 'N/A'}</td>
                                    <td class="py-3 px-4">${batch.size || 'N/A'}</td>
                                    <td class="py-3 px-4">
                                        <span class="font-semibold ${batch.quantity <= 10 ? 'text-yellow-600' : 'text-gray-800'}">
                                            ${batch.quantity || 0}
                                        </span>
                                    </td>
                                    <td class="py-3 px-4">${batch.mfgDate ? batch.mfgDate.split('T')[0] : 'N/A'}</td>
                                    <td class="py-3 px-4 ${batch.expDate && new Date(batch.expDate) <= new Date() ? 'text-red-600' : ''}">
                                        ${batch.expDate ? batch.expDate.split('T')[0] : 'N/A'}
                                    </td>
                                    <td class="py-3 px-4">
                                        <span class="px-2 py-1 rounded text-xs ${batch.stockStatus === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 
                                            batch.stockStatus === 'LOW_STOCK' ? 'bg-yellow-100 text-yellow-800' : 
                                            batch.stockStatus === 'DAMAGED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
                                            ${batch.stockStatus || 'N/A'}
                                        </span>
                                    </td>
                                    <td class="py-3 px-4">
                                        <div class="flex space-x-2">
                                            <button onclick="editBatch(${batch.inventoryId})" 
                                                    class="text-blue-600 hover:text-blue-800" title="Edit">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button onclick="showDeleteBatchConfirm(${batch.inventoryId})" 
                                                    class="text-red-600 hover:text-red-800" title="Delete">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        ` : '<p class="text-gray-500 text-center py-8">No batches found for this product.</p>';
        
        const html = `
            <div class="mb-6 p-4 bg-pink-50 rounded-lg">
                <h3 class="font-semibold text-lg text-gray-800">${product.title || product.productName || 'Product'}</h3>
                <div class="grid grid-cols-2 gap-4 mt-2">
                    <div>
                        <p class="text-sm text-gray-600">Total Stock</p>
                        <p class="text-2xl font-bold text-gray-800">${totalStock}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">SKU</p>
                        <p class="text-sm font-medium text-gray-800">${product.sku || 'N/A'}</p>
                    </div>
                </div>
                <span class="mt-2 inline-block px-3 py-1 text-xs font-semibold rounded-full bg-pink-100 text-pink-800">
                    Mother & Baby Care
                </span>
            </div>
            
            <div class="mb-6">
                <h4 class="font-medium mb-3 text-gray-700">Add New Batch</h4>
                <form id="add-specific-batch-form-mb" class="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <input type="hidden" name="mbpId" value="${productId}">
                    
                    <!-- Batch Number -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Batch Number *</label>
                        <input type="text" name="batchNo" required 
                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                               placeholder="BATCH-2025-001">
                    </div>
                    
                    <!-- Variant Type Toggle -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Variant Type</label>
                        <div class="flex gap-4">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="variantType" value="single" checked class="variant-type-radio">
                                <span class="text-sm text-gray-700">Single Variant</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="variantType" value="multiple" class="variant-type-radio">
                                <span class="text-sm text-gray-700">Multiple Variants</span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- Single Variant Section -->
                    <div id="single-variant-section" class="variant-section">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                                <input type="number" name="quantity" min="1" 
                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                       placeholder="100">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Size (Optional)</label>
                                <input type="text" name="size" 
                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                       placeholder="e.g., M, L, XL">
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">MFG Date</label>
                                <input type="text" name="mfgDate" 
                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                       placeholder="YYYY-MM">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                                <input type="text" name="expiryDate" required
                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                       placeholder="YYYY-MM">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Multiple Variants Section -->
                    <div id="multiple-variants-section" class="variant-section hidden">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                            <select name="stockStatus" 
                                    class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="AVAILABLE">Available</option>
                                <option value="LOW_STOCK">Low Stock</option>
                                <option value="DAMAGED">Damaged</option>
                                <option value="EXPIRED">Expired</option>
                            </select>
                        </div>
                        
                        <div id="variants-container" class="space-y-4">
                            <!-- Variant entries will be added here -->
                        </div>
                        
                        <button type="button" id="add-variant-btn" class="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium">
                            + Add Size Variant
                        </button>
                    </div>
                    
                    <!-- Single Variant: Stock Status (only shown for single variant) -->
                    <div id="single-stock-status-section" class="variant-section mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                        <select name="stockStatus" 
                                class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="AVAILABLE">Available</option>
                            <option value="LOW_STOCK">Low Stock</option>
                            <option value="DAMAGED">Damaged</option>
                            <option value="EXPIRED">Expired</option>
                        </select>
                    </div>
                    
                    <button type="submit" 
                            class="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition-colors font-medium mt-4">
                        Add Batch
                    </button>
                </form>
            </div>
            
            ${batchTableHTML}
        `;
        
        $('#batchModalContent').html(html);
        $('#batchModalTitle').text('Manage Batches - ' + (product.title || product.productName || 'Product'));
        $('#batchModal').show();
        
        // Setup variant type toggle
        setupVariantTypeToggle();
        
        // Add first variant row for multiple variants
        setTimeout(() => {
            if ($('#variants-container').children().length === 0) {
                addVariantRow();
            }
        }, 100);
        
        // Attach form submit event
        $('#add-specific-batch-form-mb').off('submit').on('submit', async function(e) {
            e.preventDefault();
            await addNewBatchForMBProduct($(this).serializeArray());
        });
        
    } catch (error) {
        console.error('Error loading MB batch modal:', error);
        showErrorToast('Failed to load MB batch information');
    } finally {
        hideLoader();
    }
}

// ADD NEW BATCH FUNCTIONS - UPDATED for unified API
async function addNewBatchForProduct(formDataArray) {
    try {
        showLoader();
        
        // Get variant type
        const variantType = formDataArray.find(item => item.name === 'variantType')?.value || 'single';
        const productId = formDataArray.find(item => item.name === 'productId')?.value;
        
        if (!productId) {
            showErrorToast('Product ID is required');
            hideLoader();
            return;
        }
        
        let payload = {
            batchNo: formDataArray.find(item => item.name === 'batchNo')?.value,
            productId: parseInt(productId),
            stockStatus: formDataArray.find(item => item.name === 'stockStatus')?.value || 'AVAILABLE'
        };
        
        if (variantType === 'single') {
            // Single variant format
            const quantity = formDataArray.find(item => item.name === 'quantity')?.value;
            const size = formDataArray.find(item => item.name === 'size')?.value || null;
            const mfgDate = formDataArray.find(item => item.name === 'mfgDate')?.value;
            const expiryDate = formDataArray.find(item => item.name === 'expiryDate')?.value;
            
            if (!payload.batchNo || !quantity || !expiryDate) {
                showErrorToast('Please fill in required fields: Batch No, Quantity, and Expiry Date');
                hideLoader();
                return;
            }
            
            payload.quantity = parseInt(quantity);
            payload.size = size;
            payload.mfgDate = mfgDate || null;
            payload.expiryDate = expiryDate;
            
        } else {
            // Multiple variants format
            const variantsContainer = document.getElementById('variants-container');
            const variantRows = variantsContainer.querySelectorAll('.variant-row');
            
            if (variantRows.length === 0) {
                showErrorToast('Please add at least one size variant');
                hideLoader();
                return;
            }
            
            const variants = [];
            variantRows.forEach(row => {
                const size = row.querySelector('input[data-field="size"]').value;
                const quantity = row.querySelector('input[data-field="quantity"]').value;
                const mfgDate = row.querySelector('input[data-field="mfgDate"]').value;
                const expiryDate = row.querySelector('input[data-field="expiryDate"]').value;
                
                if (!size || !quantity || !expiryDate) {
                    showErrorToast('All variant fields are required: Size, Quantity, and Expiry Date');
                    hideLoader();
                    return;
                }
                
                variants.push({
                    size,
                    quantity: parseInt(quantity),
                    mfgDate: mfgDate || null,
                    expiryDate
                });
            });
            
            payload.variants = variants;
        }
        
        console.log('Adding batch with data:', payload);
        
        const response = await fetch(`${INVENTORY_API}/add-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.text();
        console.log('Batch add response:', result);
        
        showSuccessToast('Batch added successfully!');
        
        // Refresh data
        await fetchAllProducts();
        
        // Reload batch modal
        if (currentProductId && currentProductType === 'regular') {
            await showBatchManagementModal(currentProductId);
        }
        
    } catch (error) {
        console.error('Error adding batch:', error);
        showErrorToast(`Failed to add batch: ${error.message}`);
    } finally {
        hideLoader();
    }
}

async function addNewBatchForMBProduct(formDataArray) {
    try {
        showLoader();
        
        // Get variant type
        const variantType = formDataArray.find(item => item.name === 'variantType')?.value || 'single';
        const mbpId = formDataArray.find(item => item.name === 'mbpId')?.value;
        
        if (!mbpId) {
            showErrorToast('Product ID is required');
            hideLoader();
            return;
        }
        
        let payload = {
            batchNo: formDataArray.find(item => item.name === 'batchNo')?.value,
            mbpId: parseInt(mbpId),
            stockStatus: formDataArray.find(item => item.name === 'stockStatus')?.value || 'AVAILABLE'
        };
        
        if (variantType === 'single') {
            // Single variant format
            const quantity = formDataArray.find(item => item.name === 'quantity')?.value;
            const size = formDataArray.find(item => item.name === 'size')?.value || null;
            const mfgDate = formDataArray.find(item => item.name === 'mfgDate')?.value;
            const expiryDate = formDataArray.find(item => item.name === 'expiryDate')?.value;
            
            if (!payload.batchNo || !quantity || !expiryDate) {
                showErrorToast('Please fill in required fields: Batch No, Quantity, and Expiry Date');
                hideLoader();
                return;
            }
            
            payload.quantity = parseInt(quantity);
            payload.size = size;
            payload.mfgDate = mfgDate || null;
            payload.expiryDate = expiryDate;
            
        } else {
            // Multiple variants format
            const variantsContainer = document.getElementById('variants-container');
            const variantRows = variantsContainer.querySelectorAll('.variant-row');
            
            if (variantRows.length === 0) {
                showErrorToast('Please add at least one size variant');
                hideLoader();
                return;
            }
            
            const variants = [];
            variantRows.forEach(row => {
                const size = row.querySelector('input[data-field="size"]').value;
                const quantity = row.querySelector('input[data-field="quantity"]').value;
                const mfgDate = row.querySelector('input[data-field="mfgDate"]').value;
                const expiryDate = row.querySelector('input[data-field="expiryDate"]').value;
                
                if (!size || !quantity || !expiryDate) {
                    showErrorToast('All variant fields are required: Size, Quantity, and Expiry Date');
                    hideLoader();
                    return;
                }
                
                variants.push({
                    size,
                    quantity: parseInt(quantity),
                    mfgDate: mfgDate || null,
                    expiryDate
                });
            });
            
            payload.variants = variants;
        }
        
        console.log('Adding MB batch with data:', payload);
        
        const response = await fetch(`${INVENTORY_API}/add-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.text();
        console.log('MB Batch add response:', result);
        
        showSuccessToast('Batch added successfully!');
        
        // Refresh data
        await fetchAllProducts();
        
        // Reload batch modal
        if (currentProductId && currentProductType === 'mb') {
            await showBatchManagementModalMB(currentProductId);
        }
        
    } catch (error) {
        console.error('Error adding batch for MB product:', error);
        showErrorToast(`Failed to add batch: ${error.message}`);
    } finally {
        hideLoader();
    }
}

// EDIT BATCH FUNCTION - UPDATED for fetching batch details
async function editBatch(batchId) {
    try {
        showLoader();
        
        // Fetch batch details using the correct API endpoint
        const response = await fetch(`${INVENTORY_API}/get-all-batches?size=1000`);
        if (!response.ok) throw new Error(`Failed to fetch batches`);
        
        const data = await response.json();
        const batch = data.data.find(b => b.inventoryId === batchId);
        
        if (!batch) {
            showErrorToast('Batch not found');
            hideLoader();
            return;
        }
        
        currentBatchId = batchId;
        
        // Determine product type
        const isMBProduct = batch.mbpId !== null && batch.mbpId !== undefined;
        
        const html = `
            <div class="mb-6">
                <h4 class="font-medium mb-3 text-gray-700">Edit Batch</h4>
                <form id="edit-batch-form" class="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Batch Number *</label>
                            <input type="text" name="batchNo" value="${batch.batchNo || ''}" required 
                                   class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                            <input type="number" name="quantity" value="${batch.quantity || 0}" required min="1" 
                                   class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Size</label>
                            <input type="text" name="size" value="${batch.size || ''}" 
                                   class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                            <select name="stockStatus" 
                                    class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="AVAILABLE" ${batch.stockStatus === 'AVAILABLE' ? 'selected' : ''}>Available</option>
                                <option value="LOW_STOCK" ${batch.stockStatus === 'LOW_STOCK' ? 'selected' : ''}>Low Stock</option>
                                <option value="DAMAGED" ${batch.stockStatus === 'DAMAGED' ? 'selected' : ''}>Damaged</option>
                                <option value="EXPIRED" ${batch.stockStatus === 'EXPIRED' ? 'selected' : ''}>Expired</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">MFG Date</label>
                            <input type="text" name="mfgDate" value="${batch.mfgDate ? batch.mfgDate.split('T')[0] : ''}" 
                                   class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                   placeholder="YYYY-MM">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                            <input type="text" name="expDate" value="${batch.expDate ? batch.expDate.split('T')[0] : ''}" required 
                                   class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                   placeholder="YYYY-MM">
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <button type="submit" 
                                class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                            Update Batch
                        </button>
                        <button type="button" onclick="cancelEdit()" 
                                class="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        $('#batchModalContent').html(html);
        $('#batchModalTitle').text('Edit Batch - ' + (batch.batchNo || 'Batch'));
        
        // Store context for cancel
        if (isMBProduct && batch.mbpId) {
            currentProductId = batch.mbpId;
            currentProductType = 'mb';
        } else if (batch.productId) {
            currentProductId = batch.productId;
            currentProductType = 'regular';
        }
        
        // Attach form submit event
        $('#edit-batch-form').off('submit').on('submit', async function(e) {
            e.preventDefault();
            await updateBatch($(this).serializeArray());
        });
        
    } catch (error) {
        console.error('Error loading batch for edit:', error);
        showErrorToast('Failed to load batch details');
    } finally {
        hideLoader();
    }
}

// UPDATE BATCH FUNCTION - UPDATED for PATCH API
async function updateBatch(formDataArray) {
    try {
        showLoader();
        
        const batchData = {};
        formDataArray.forEach(item => {
            if (item.value !== undefined && item.value !== null && item.value !== '') {
                if (item.name === 'quantity') {
                    batchData[item.name] = parseInt(item.value);
                } else {
                    batchData[item.name] = item.value;
                }
            }
        });
        
        console.log('Updating batch with data:', batchData);
        
        // Send PATCH request to update batch
        const response = await fetch(`${INVENTORY_API}/update-batch-by-inventoryId/${currentBatchId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(batchData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.text();
        console.log('Batch update response:', result);
        
        showSuccessToast('Batch updated successfully!');
        
        // Refresh data based on context
        await fetchAllProducts();
        
        if (currentProductId) {
            if (currentProductType === 'mb') {
                await showBatchManagementModalMB(currentProductId);
            } else {
                await showBatchManagementModal(currentProductId);
            }
        } else {
            closeModal('batchModal');
        }
        
    } catch (error) {
        console.error('Error updating batch:', error);
        showErrorToast(`Failed to update batch: ${error.message}`);
    } finally {
        hideLoader();
    }
}

function cancelEdit() {
    if (currentProductId) {
        if (currentProductType === 'mb') {
            showBatchManagementModalMB(currentProductId);
        } else {
            showBatchManagementModal(currentProductId);
        }
    } else {
        closeModal('batchModal');
    }
}

// DELETE BATCH FUNCTIONS
function showDeleteBatchConfirm(batchId) {
    currentBatchId = batchId;
    $('#deleteModal').show();
}

async function deleteBatch() {
    if (!currentBatchId) return;
    
    try {
        showLoader();
        
        const response = await fetch(`${INVENTORY_API}/delete-batch/${currentBatchId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.text();
        console.log('Batch delete response:', result);
        
        showSuccessToast('Batch deleted successfully!');
        
        // Refresh data
        await fetchAllProducts();
        
        if (currentProductId) {
            if (currentProductType === 'mb') {
                await showBatchManagementModalMB(currentProductId);
            } else {
                await showBatchManagementModal(currentProductId);
            }
        }
        
        closeModal('deleteModal');
        
    } catch (error) {
        console.error('Error deleting batch:', error);
        showErrorToast(`Failed to delete batch: ${error.message}`);
    } finally {
        hideLoader();
        currentBatchId = null;
    }
}





// async function handleBulkUpload(e) {
//     e.preventDefault();

//     const excelInput = document.getElementById('bulkExcelInput');
//     const imagesInput = document.getElementById('bulkImagesInput');
//     const submitButton = e.target.querySelector('button[type="submit"]');

//     const excelFile = excelInput.files[0];

//     if (!excelFile) {
//         showErrorToast('Please select an Excel file');
//         return;
//     }

//     if (submitButton.disabled) return;
//     submitButton.disabled = true;

//     try {
//         showLoader();

//         const formData = new FormData();
//         formData.append('excelFile', excelFile);

//         const imageFiles = imagesInput.files;
//         for (let i = 0; i < imageFiles.length; i++) {
//             formData.append('productImages', imageFiles[i]);
//         }

//         await new Promise(resolve => setTimeout(resolve, 300));

//         const response = await fetch(`${PRODUCTS_API}/bulk-upload`, {
//             method: 'POST',
//             body: formData,
//         });

//         let result;
//         try {
//             result = await response.json();
//         } catch (jsonErr) {
//             throw new Error('Server returned invalid response (not JSON)');
//         }

//         // ────────────────────────────────────────────────
//         // Build clear display message — COUNTS ALWAYS FIRST
//         // ────────────────────────────────────────────────
//         const uploaded = result.uploadedCount || 0;
//         const skipped = result.skippedCount || 0;

//         let displayMessage = `Uploaded: ${uploaded}\nSkipped: ${skipped}`;

//         // Add backend message if provided
//         if (result.message) {
//             displayMessage += `\n\n${result.message}`;
//         }

//         // Add skipped reasons as bullet points
//         if (result.skippedReasons?.length > 0) {
//             displayMessage += '\n\nDetails:\n' + result.skippedReasons
//                 .map(reason => `• ${reason.trim()}`)
//                 .join('\n');
//         }

//         // Decide title and toast type
//         let title = 'Bulk Upload Completed';
//         let useErrorStyle = false;

//         if (uploaded === 0) {
//             title = skipped > 0 ? 'Upload Failed - Nothing Processed' : 'No Products Found';
//             useErrorStyle = true;
//         } else if (skipped > 0) {
//             title = 'Upload Completed with Some Issues';
//         }

//         // Show feedback
//         if (useErrorStyle) {
//             showErrorToast(title);
//         } else {
//             showSuccessToast(title);
//         }

//         // Show alert with full info (counts always visible)
//         alert(`${title}\n\n${displayMessage}`);

//         // Refresh only if something was uploaded
//         if (uploaded > 0) {
//             await fetchAllProducts();
//         }

//         closeModal('bulkUploadModal');

//     } catch (error) {
//         console.error('Bulk upload error:', error);

//         let userMessage = 'Bulk upload failed. Please try again.';

//         if (error.message.includes('ERR_UPLOAD_FILE_CHANGED') || 
//             error.message.includes('changed') || 
//             error.message.includes('stale')) {
//             userMessage = 'Upload failed: The selected file(s) changed or became unavailable. Please re-select the Excel file and images.';
//         } else if (error.message.includes('NetworkError') || error.message === 'Failed to fetch') {
//             userMessage = 'Network issue or server not reachable. Please check your connection and try again.';
//         } else if (error.message.includes('invalid response') || error.message.includes('not JSON')) {
//             userMessage = 'Server returned unexpected response. Please try again later or contact support.';
//         }

//         showErrorToast(userMessage);

//     } finally {
//         submitButton.disabled = false;
//         excelInput.value = '';
//         imagesInput.value = '';
//         hideLoader();
//     }
// }




async function handleBulkUpload(e) {
    e.preventDefault();

    const excelInput = document.getElementById('bulkExcelInput');
    const imagesInput = document.getElementById('bulkImagesInput');
    const submitButton = e.target.querySelector('button[type="submit"]');

    const excelFile = excelInput.files[0];

    if (!excelFile) {
        showErrorToast('Please select an Excel file');
        return;
    }

    if (submitButton.disabled) return;
    submitButton.disabled = true;

    try {
        showLoader();

        const formData = new FormData();
        formData.append('excelFile', excelFile);

        const imageFiles = imagesInput.files;
        for (let i = 0; i < imageFiles.length; i++) {
            formData.append('productImages', imageFiles[i]);
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        const response = await fetch(`${PRODUCTS_API}/bulk-upload`, {
            method: 'POST',
            body: formData,
        });

        let result;
        try {
            result = await response.json();
        } catch (jsonErr) {
            throw new Error('Server returned invalid response (not JSON)');
        }

        // ────────────────────────────────────────────────
        // Build summary
        // ────────────────────────────────────────────────
        const uploaded = result.uploadedCount || 0;
        const skipped  = result.skippedCount  || 0;

        let summary = `Uploaded: ${uploaded} | Skipped: ${skipped}`;
        if (result.message) {
            summary += ` — ${result.message}`;
        }

        let title = 'Bulk Upload Completed';
        let bgColor = '#28a745'; // success green

        if (uploaded === 0) {
            title = skipped > 0 ? 'Upload Failed - Nothing Processed' : 'No Products Found';
            bgColor = '#dc3545'; // error red
        } else if (skipped > 0) {
            title = 'Upload Completed with Some Issues';
            bgColor = '#ffc107'; // warning yellow
        }

        // ────────────────────────────────────────────────
        // Summary toast – always shown, short, auto-closes
        // ────────────────────────────────────────────────
        Toastify({
            text: `${title}\n${summary}`,
            duration: 5500,
            close: true,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
            style: {
                background: bgColor,
                color: "white",
                fontWeight: "500",
                whiteSpace: "pre-line",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            },
        }).showToast();

        // ────────────────────────────────────────────────
        // Detailed scrollable toast – only if skipped > 0
        // ────────────────────────────────────────────────
        if (skipped > 0 && result.skippedReasons?.length > 0) {
            // Escape < > to prevent any HTML injection issues
            const reasonsHtml = result.skippedReasons
                .map(reason => `• ${reason.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}`)
                .join('<br>');

            const detailsHtml = `
                <div style="font-weight: bold; margin-bottom: 10px; font-size: 15px;">
                    Skipped Reasons (${skipped}):
                </div>
                <div style="max-height: 300px; overflow-y: auto; font-size: 14px; line-height: 1.5; padding-right: 6px;">
                    ${reasonsHtml || '<em>No details provided</em>'}
                </div>
            `;

            Toastify({
                text: detailsHtml,
                duration: 0,                    // stays until user closes it
                close: true,
                gravity: "top",
                position: "right",
                escapeMarkup: false,            // VERY IMPORTANT – allows HTML
                style: {
                    background: "#fff3cd",      // light yellow background
                    color: "#856404",
                    border: "1px solid #ffeeba",
                    borderRadius: "8px",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
                    width: "680px",             // wider to show long reasons nicely
                    padding: "16px",
                    maxHeight: "520px",         // toast won't grow forever
                    overflow: "hidden",
                },
            }).showToast();
        }

        // Refresh products if at least something was uploaded
        if (uploaded > 0) {
            await fetchAllProducts();
        }

        closeModal('bulkUploadModal');

    } catch (error) {
        console.error('Bulk upload error:', error);

        let userMessage = 'Bulk upload failed. Please try again.';

        if (error.message.includes('ERR_UPLOAD_FILE_CHANGED') || 
            error.message.includes('changed') || 
            error.message.includes('stale')) {
            userMessage = 'Upload failed: The selected file(s) changed or became unavailable. Please re-select the Excel file and images.';
        } else if (error.message.includes('NetworkError') || error.message === 'Failed to fetch') {
            userMessage = 'Network issue or server not reachable. Please check your connection and try again.';
        } else if (error.message.includes('invalid response') || error.message.includes('not JSON')) {
            userMessage = 'Server returned unexpected response. Please try again later or contact support.';
        }

        showErrorToast(userMessage);

    } finally {
        submitButton.disabled = false;
        excelInput.value = '';
        imagesInput.value = '';
        hideLoader();
    }
}




// Search Functionality
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function searchProducts() {
    const searchTerm = $('#search-input').val().toLowerCase();
    
    if (!searchTerm) {
        updateDataTable(inventory);
        return;
    }
    
    const filtered = inventory.filter(product => {
        const productName = product.productType === 'mb' ? 
            product.title : product.productName;
        const brandName = product.productType === 'mb' ? 
            product.brand : product.brandName;
        const sku = product.sku || '';
        const category = product.productType === 'mb' ? 
            product.category : product.productCategory;
        
        return (
            productName.toLowerCase().includes(searchTerm) ||
            brandName.toLowerCase().includes(searchTerm) ||
            sku.toLowerCase().includes(searchTerm) ||
            category.toLowerCase().includes(searchTerm)
        );
    });
    
    updateDataTable(filtered);
}

// Filter Functions
function filterByCategory() {
    const category = $('#filter-category').val();
    if (!category) {
        updateDataTable(inventory);
        return;
    }
    
    const filtered = inventory.filter(product => {
        const productCategory = product.productType === 'mb' ? 
            (product.category || product.productCategory) : 
            product.productCategory;
        return productCategory === category;
    });
    
    updateDataTable(filtered);
}

function filterByStock() {
    const stockFilter = $('#filter-stock').val();
    if (!stockFilter) {
        updateDataTable(inventory);
        return;
    }
    
    const filtered = inventory.filter(product => {
        const quantity = product.productType === 'mb' ? 
            (product.stockQuantity || 0) : 
            (product.productQuantity || 0);
        
        switch(stockFilter) {
            case 'in-stock':
                return quantity > 10;
            case 'low-stock':
                return quantity > 0 && quantity <= 10;
            case 'out-of-stock':
                return quantity === 0;
            default:
                return true;
        }
    });
    
    updateDataTable(filtered);
}

// Helper Functions
function getCategoryBadgeClass(category) {
    if (!category) return 'category-medicine';
    
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('medicine') || categoryLower.includes('healthcare') || categoryLower === 'pharmacy') {
        return 'category-medicine';
    } else if (categoryLower.includes('mother') || categoryLower.includes('maternity')) {
        return 'category-mothercare';
    } else if (categoryLower.includes('baby') || categoryLower.includes('infant')) {
        return 'category-babycare';
    } else if (categoryLower.includes('wellness') || categoryLower.includes('personal care')) {
        return 'category-wellness';
    } else if (categoryLower.includes('device') || categoryLower.includes('equipment')) {
        return 'category-devices';
    } else if (categoryLower.includes('surgical') || categoryLower.includes('speciality')) {
        return 'category-speciality';
    } else {
        return 'category-medicine';
    }
}

function getStockClass(quantity) {
    if (quantity === 0) return 'stock-out';
    if (quantity <= 10) return 'stock-low';
    return 'stock-available';
}

// Export Functions
function exportToExcel() {
    try {
        const wsData = [
            ['ID', 'Product Type', 'Product Name', 'SKU', 'Category', 'Sub Category', 'Brand', 'Quantity', 'Price', 'Old Price', 'Expiry Date', 'Status', 'Prescription Required']
        ];
        
        inventory.forEach(product => {
            const productType = product.productType === 'mb' ? 'Mother & Baby Care' : 'Medicine';
            const productName = product.productType === 'mb' ? product.title : product.productName;
            const sku = product.sku || '';
            const category = product.productType === 'mb' ? 
                (product.category || product.productCategory) : 
                product.productCategory;
            const subCategory = product.productType === 'mb' ? 
                product.subCategory : 
                product.productSubCategory;
            const brand = product.productType === 'mb' ? product.brand : product.brandName;
            const quantity = product.productType === 'mb' ? product.stockQuantity : product.productQuantity;
            const price = product.productType === 'mb' ? 
                (product.price && product.price.length > 0 ? product.price[0] : 0) : 
                (Array.isArray(product.productPrice) ? product.productPrice[0] || 0 : product.productPrice || 0);
            const oldPrice = product.productType === 'mb' ? 
                (product.originalPrice && product.originalPrice.length > 0 ? product.originalPrice[0] : 0) : 
                (Array.isArray(product.productOldPrice) ? product.productOldPrice[0] || 0 : product.productOldPrice || 0);
            const status = product.productType === 'mb' ? 
                (product.inStock ? 'Available' : 'Out of Stock') : 
                product.productStatus;
            
            wsData.push([
                product.productId || product.id,
                productType,
                productName,
                sku,
                category || '',
                subCategory || '',
                brand || '',
                quantity || 0,
                price,
                oldPrice,
                product.expDate || '',
                status || '',
                product.prescriptionRequired ? 'Yes' : 'No'
            ]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
        XLSX.writeFile(wb, `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        showSuccessToast('Export completed successfully!');
        
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showErrorToast('Failed to export data');
    }
}

function downloadTemplate() {
    const wsData = [
        ['productName', 'productCategory', 'productSubCategory', 'productPrice', 'productOldPrice', 'productStock', 'productStatus', 'productDescription', 'productQuantity', 'prescriptionRequired', 'brandName', 'mfgDate', 'expDate', 'batchNo', 'benefitsList', 'directionsList', 'ingredientsList', 'productSizes', 'mainImage', 'subImages', 'dynamicFields'],
        ['Paracetamol 500mg', 'Medicines & Healthcare', 'Pain Relievers', '15.99', '18.99', 'In-Stock', 'Available', 'For fever and pain relief', '100', 'false', 'Generic', '2025-01-01', '2027-01-01', 'BATCH-2025-001', 'Fever relief,Pain relief', 'Take 1 tablet every 6 hours', 'Paracetamol 500mg', '10 tablets,20 tablets', 'paracetamol.jpg', 'image1.jpg,image2.jpg', 'storageCondition:Room Temperature,strength:500mg']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'inventory_template.xlsx');
}

// Utility Functions
function closeModal(modalId) {
    $(`#${modalId}`).hide();
    
    if (modalId === 'batchModal') {
        currentProductId = null;
        currentProductType = null;
        currentBatchId = null;
    }
}

function showLoader() {
    $('#loader').removeClass('hidden');
}

function hideLoader() {
    $('#loader').addClass('hidden');
}

function showSuccessToast(message) {
    Toastify({
        text: message,
        duration: 3000,
        style: { background: 'linear-gradient(to right, #00b09b, #96c93d)' }
    }).showToast();
}

function showErrorToast(message) {
    Toastify({
        text: message,
        duration: 3000,
        style: { background: 'linear-gradient(to right, #ff5e62, #f09819)' }
    }).showToast();
}

// ===== VARIANT HANDLING FUNCTIONS =====

function setupVariantTypeToggle() {
    // Toggle between single and multiple variant sections
    $(document).off('change', '.variant-type-radio').on('change', '.variant-type-radio', function() {
        const variantType = $(this).val();
        
        if (variantType === 'single') {
            // Show single variant section, hide multiple
            $('#single-variant-section').removeClass('hidden').show();
            $('#single-stock-status-section').removeClass('hidden').show();
            $('#multiple-variants-section').addClass('hidden').hide();
        } else {
            // Show multiple variants section, hide single
            $('#single-variant-section').addClass('hidden').hide();
            $('#single-stock-status-section').addClass('hidden').hide();
            $('#multiple-variants-section').removeClass('hidden').show();
            
            // Add first variant if container is empty
            if ($('#variants-container').children().length === 0) {
                addVariantRow();
            }
        }
    });
    
    // Handle add variant button
    $(document).off('click', '#add-variant-btn').on('click', '#add-variant-btn', function(e) {
        e.preventDefault();
        addVariantRow();
    });
}

function addVariantRow() {
    const variantIndex = $('#variants-container').children('.variant-row').length;
    const variantRow = `
        <div class="variant-row p-4 border rounded-lg bg-white space-y-4">
            <div class="flex justify-between items-start">
                <h5 class="font-medium text-gray-700">Size Variant ${variantIndex + 1}</h5>
                <button type="button" onclick="removeVariantRow(this)" class="text-red-600 hover:text-red-800 font-medium">
                    <i class="fas fa-trash-alt"></i> Remove
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Size *</label>
                    <input type="text" data-field="size" required 
                           class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                           placeholder="e.g., S, M, L, XL">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input type="number" data-field="quantity" required min="1" 
                           class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                           placeholder="100">
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">MFG Date</label>
                    <input type="text" data-field="mfgDate" 
                           class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                           placeholder="YYYY-MM">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                    <input type="text" data-field="expiryDate" required
                           class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                           placeholder="YYYY-MM">
                </div>
            </div>
        </div>
    `;
    
    $('#variants-container').append(variantRow);
}

function removeVariantRow(button) {
    $(button).closest('.variant-row').remove();
}

// Make functions available globally
window.showBatchManagementModal = showBatchManagementModal;
window.showBatchManagementModalMB = showBatchManagementModalMB;
window.editBatch = editBatch;
window.showDeleteBatchConfirm = showDeleteBatchConfirm;
window.closeModal = closeModal;
window.viewProduct = viewProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.removeVariantRow = removeVariantRow;
window.setupVariantTypeToggle = setupVariantTypeToggle;
window.addVariantRow = addVariantRow;
window.saveProductChanges = saveProductChanges;






//========================================================================================================================//


























// // Main Inventory JavaScript

// // Global variables
// let inventory = [];
// let dataTable;
// let currentProductId = null;
// let currentProductType = null;
// let currentBatchId = null;
// let batchesData = null;

// // Base URLs
// const BASE_URL = 'http://localhost:8083';
// const PRODUCTS_API = `${BASE_URL}/api/products`;
// const INVENTORY_API = `${BASE_URL}/api/inventory`;
// const MB_PRODUCTS_API = `${BASE_URL}/api/mb/products`;

// // Initialize when page loads
// $(document).ready(function() {
//     initializePage();
//     setupEventListeners();
//     loadInitialData();
// });

// function initializePage() {
//     // Initialize DataTables
//     initializeDataTable();
    
//     // Setup sidebar
//     setupSidebar();
    
//     // Setup modals
//     setupModals();
    
//     // Setup tabs
//     setupTabs();
    
//     // Check auth
//     if (typeof Auth !== 'undefined') {
//         Auth.requireAuth();
//     }
// }

// function setupSidebar() {
//     // Desktop sidebar toggle
//     $('#toggle-sidebar-logo').on('click', function() {
//         toggleSidebar();
//     });

//     // Close sidebar on mobile
//     $('#close-sidebar').on('click', function() {
//         const sidebar = document.getElementById('sidebar');
//         sidebar.classList.remove('translate-x-0');
//     });

//     // Mobile sidebar toggle
//     $('#toggle-sidebar-mobile').on('click', function() {
//         const sidebar = document.getElementById('sidebar');
//         sidebar.classList.toggle('translate-x-0');
//     });

//     // Logout functionality
//     $('#logoutBtn').on('click', function() {
//         if (confirm('Are you sure you want to logout?')) {
//             localStorage.removeItem('adminToken');
//             localStorage.removeItem('adminData');
            
//             Toastify({
//                 text: "Successfully logged out",
//                 duration: 3000,
//                 style: { background: 'linear-gradient(to right, #00b09b, #96c93d)' }
//             }).showToast();
            
//             setTimeout(() => {
//                 window.location.href = '../Login/login.html';
//             }, 1500);
//         }
//     });
// }

// // Sidebar toggle function
// function toggleSidebar() {
//     const sidebar = document.getElementById('sidebar');
//     const sidebarArrow = document.getElementById('sidebar-arrow');
//     const logoDiv = document.querySelector('div > div');
//     const navTexts = document.querySelectorAll('.nav-text');
//     const navIcons = document.querySelectorAll('.nav-icon');
    
//     if (window.innerWidth < 768) {
//         sidebar.classList.toggle('-translate-x-full');
//         sidebar.classList.toggle('translate-x-0');
//     } else {
//         sidebar.classList.toggle('collapsed');
        
//         if (sidebar.classList.contains('collapsed')) {
//             sidebar.style.width = '64px';
//             sidebarArrow.classList.remove('fa-chevron-left');
//             sidebarArrow.classList.add('fa-chevron-right');
            
//             logoDiv.style.opacity = '0';
//             logoDiv.style.width = '0';
            
//             navTexts.forEach((text, index) => {
//                 text.style.opacity = '0';
//                 text.style.width = '0';
//                 text.style.overflow = 'hidden';
//                 text.style.transitionDelay = `${index * 20}ms`;
//             });
            
//             navIcons.forEach(icon => {
//                 icon.style.marginLeft = '0';
//                 icon.style.marginRight = '0';
//             });
            
//         } else {
//             sidebar.style.width = '256px';
//             sidebarArrow.classList.remove('fa-chevron-right');
//             sidebarArrow.classList.add('fa-chevron-left');
            
//             logoDiv.style.opacity = '1';
//             logoDiv.style.width = 'auto';
            
//             navTexts.forEach((text, index) => {
//                 text.style.opacity = '1';
//                 text.style.width = 'auto';
//                 text.style.overflow = 'visible';
//                 text.style.transitionDelay = `${index * 20}ms`;
//             });
            
//             navIcons.forEach(icon => {
//                 icon.style.marginLeft = '0';
//                 icon.style.marginRight = '0.75rem';
//             });
//         }
//     }
// }

// function setupModals() {
//     // Close modals when clicking X
//     $('.close').on('click', function() {
//         const modalId = $(this).closest('.modal').attr('id');
//         closeModal(modalId);
//     });

//     // Close modals when clicking outside
//     $(window).on('click', function(event) {
//         if ($(event.target).hasClass('modal')) {
//             closeModal($(event.target).attr('id'));
//         }
//     });
// }

// function setupTabs() {
//     // Main tabs - ONLY 3 TABS NOW
//     $('.tab-item').on('click', function() {
//         const tabId = $(this).data('tab');
        
//         $('.tab-item').removeClass('active');
//         $(this).addClass('active');
        
//         $('.tab-content').removeClass('active');
//         $(`#${tabId}`).addClass('active');
        
//         loadTabData(tabId);
//     });

//     // Mothercare category filter - Updated to make API calls
//     $('.category-filter-btn').on('click', async function() {
//         $('.category-filter-btn').removeClass('active');
//         $(this).addClass('active');
//         const subcategory = $(this).data('subcategory');
//         await filterMothercareProducts(subcategory);
//     });

//     // Medicine category filter
//     $('.medicine-category-filter-btn').on('click', async function() {
//         $('.medicine-category-filter-btn').removeClass('active');
//         $(this).addClass('active');
//         const subcategory = $(this).data('subcategory');
//         await filterMedicineProducts(subcategory);
//     });
// }

// function setupEventListeners() {
//     // Bulk upload
//     $('#bulk-upload').on('click', function() {
//         $('#bulkUploadModal').show();
//     });
    
//     // Export CSV
//     $('#export-csv').on('click', exportToExcel);
    
//     // Bulk upload form
//     $('#bulkUploadForm').on('submit', handleBulkUpload);
    
//     // Category filter
//     $('#filter-category').on('change', filterByCategory);
    
//     $('#filter-stock').on('change', filterByStock);
    
//     // Download template
//     $('#download-template').on('click', downloadTemplate);
    
//     // Delete confirmation
//     $('#confirmDelete').on('click', deleteBatch);
    
//     // Search functionality
//     $('#search-input').on('input', debounce(searchProducts, 300));
// }

// function loadInitialData() {
//     showLoader();
//     Promise.all([
//         fetchAllProducts()
//     ]).finally(hideLoader);
// }

// function loadTabData(tabId) {
//     switch(tabId) {
//         case 'all-products':
//             updateDataTable(inventory);
//             break;
//         case 'medicines':
//             loadMedicines();
//             break;
//         case 'mothercare':
//             loadMothercareProducts('all');
//             break;
//     }
// }

// // Data Table Initialization
// function initializeDataTable() {
//     dataTable = $('#inventoryTable').DataTable({
//         scrollX: true,
//         scrollCollapse: true,
//         fixedHeader: true,
//         autoWidth: false,
//         searching: true,
//         paging: true,
//         pageLength: 25,
//         lengthMenu: [10, 25, 50, 100],
//         processing: true,
//         serverSide: false,
//         responsive: true,
//         columns: [
//             { 
//                 data: null, 
//                 render: (data, type, row, meta) => meta.row + 1,
//                 className: "text-center",
//                 width: "60px"
//             },
//             { 
//                 data: 'productName',
//                 render: (data, type, row) => {
//                     const isMBProduct = row.productType === 'mb';
//                     const productName = isMBProduct ? row.title : data;
//                     const sku = isMBProduct ? row.sku : row.sku;
                    
//                     // Handle image URL
//                     let imageUrl = 'https://via.placeholder.com/40?text=No+Image';
//                     if (isMBProduct && row.id) {
//                         imageUrl = `${BASE_URL}/api/mb/products/${row.id}/image`;
//                     } else if (!isMBProduct && row.productMainImage) {
//                         imageUrl = row.productMainImage.startsWith('http') ? 
//                             row.productMainImage : 
//                             `${BASE_URL}${row.productMainImage}`;
//                     }
                    
//                     return `
//                         <div class="flex items-center">
//                             <img src="${imageUrl}" 
//                                  class="w-10 h-10 rounded mr-3 object-cover" 
//                                  alt="${productName}"
//                                  onerror="this.src='https://via.placeholder.com/40?text=No+Image'">
//                             <div>
//                                 <div class="font-medium">${productName || 'N/A'}</div>
//                                 <div class="text-sm text-gray-500">${sku || 'No SKU'}</div>
//                             </div>
//                         </div>
//                     `;
//                 }
//             },
//             { 
//                 data: 'productCategory',
//                 render: (data, type, row) => {
//                     const isMBProduct = row.productType === 'mb';
//                     const category = isMBProduct ? 
//                         (row.category || 'Mother & Baby Care') : 
//                         (data || 'N/A');
//                     const badgeClass = getCategoryBadgeClass(category);
//                     return `
//                         <span class="category-badge ${badgeClass}">
//                             ${category}
//                         </span>
//                     `;
//                 }
//             },
//             { 
//                 data: 'productQuantity',
//                 render: (data, type, row) => {
//                     const isMBProduct = row.productType === 'mb';
//                     const stock = isMBProduct ? 
//                         row.stockQuantity || 0 : 
//                         data || 0;
//                     const stockClass = getStockClass(stock);
//                     return `
//                         <div class="flex items-center">
//                             <span class="stock-indicator ${stockClass}"></span>
//                             <span class="font-medium">${stock}</span>
//                         </div>
//                     `;
//                 },
//                 className: "text-center"
//             },
//             { 
//                 data: 'productPrice',
//                 render: (data, type, row) => {
//                     let price = 0;
//                     if (row.productType === 'mb') {
//                         price = row.price && row.price.length > 0 ? parseFloat(row.price[0]) : 0;
//                     } else {
//                         if (Array.isArray(data)) {
//                             price = parseFloat(data[0]) || 0;
//                         } else if (typeof data === 'string') {
//                             price = parseFloat(data) || 0;
//                         } else if (typeof data === 'number') {
//                             price = data;
//                         } else {
//                             price = 0;
//                         }
//                     }
//                     return `₹${price.toFixed(2)}`;
//                 },
//                 className: "text-right"
//             },
//             { 
//                 data: 'expDate',
//                 render: (data) => data || 'N/A'
//             },
//             { 
//                 data: 'productStatus',
//                 render: (data, type, row) => {
//                     let status = '';
//                     let statusClass = '';
                    
//                     if (row.productType === 'mb') {
//                         status = row.inStock ? 'Available' : 'Out of Stock';
//                         statusClass = row.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
//                     } else {
//                         status = data || 'N/A';
//                         statusClass = data === 'Available' ? 'bg-green-100 text-green-800' : 
//                                       data === 'Discontinued' ? 'bg-red-100 text-red-800' : 
//                                       data === 'In-Stock' ? 'bg-green-100 text-green-800' :
//                                       data === 'Out-of-Stock' ? 'bg-red-100 text-red-800' :
//                                       data === 'Low-Stock' ? 'bg-yellow-100 text-yellow-800' :
//                                       'bg-gray-100 text-gray-800';
//                     }
                    
//                     return `
//                         <span class="px-2 py-1 rounded text-xs ${statusClass}">
//                             ${status}
//                         </span>
//                     `;
//                 },
//                 className: "text-center"
//             },
//             {
//                 data: null,
//                 render: function(data, type, row, meta) {
//                     // Safely get product ID
//                     const productId = row.productType === 'mb' ? (row.id || row.productId) : (row.productId || row.id);
//                     const productType = row.productType === 'mb' ? 'mb' : 'regular';
                    
//                     if (!productId) {
//                         console.error('No product ID found for row:', row);
//                         return '<span class="text-red-500">Error: No ID</span>';
//                     }
                    
//                     return `
//                         <div class="flex justify-center space-x-1">
//                             <button onclick="viewProduct(${productId}, '${productType}')" 
//                                     class="action-btn bg-blue-100 text-blue-600 hover:bg-blue-200 p-2 rounded" 
//                                     title="View Details">
//                                 <i class="fas fa-eye"></i>
//                             </button>
                           
//                             <button onclick="${productType === 'mb' ? `showBatchManagementModalMB(${productId})` : `showBatchManagementModal(${productId})`}" 
//                                     class="action-btn bg-purple-100 text-purple-600 hover:bg-purple-200 p-2 rounded" 
//                                     title="Manage Batches">
//                                 <i class="fas fa-layer-group"></i>
//                             </button>
//                             <button onclick="deleteProduct(${productId}, '${productType}')" 
//                                     class="action-btn bg-red-100 text-red-600 hover:bg-red-200 p-2 rounded" 
//                                     title="Delete Product">
//                                 <i class="fas fa-trash"></i>
//                             </button>
//                         </div>
//                     `;
//                 },
//                 orderable: false,
//                 className: "text-center"
//             }
//         ],
//         createdRow: function(row, data, dataIndex) {
//             let quantity = 0;
//             let expDate = null;
            
//             if (data.productType === 'mb') {
//                 quantity = data.stockQuantity || 0;
//                 expDate = data.expDate ? new Date(data.expDate) : null;
//             } else {
//                 quantity = data.productQuantity || 0;
//                 expDate = data.expDate ? new Date(data.expDate) : null;
//             }
            
//             const today = new Date();
            
//             if (quantity === 0) {
//                 $(row).addClass('row-stock-out');
//             } else if (quantity <= 10) {
//                 $(row).addClass('row-stock-low');
//             }
            
//             if (expDate && (expDate - today) / (1000 * 60 * 60 * 24) <= 30) {
//                 $(row).addClass('row-expiring');
//             }
//         },
//         language: {
//             lengthMenu: "Show _MENU_ entries",
//             info: "Showing _START_ to _END_ of _TOTAL_ entries",
//             infoEmpty: "Showing 0 to 0 of 0 entries",
//             infoFiltered: "(filtered from _MAX_ total entries)",
//             emptyTable: "No products available in the inventory.",
//             paginate: {
//                 previous: "<i class='fas fa-chevron-left'></i>",
//                 next: "<i class='fas fa-chevron-right'></i>"
//             }
//         },
//         dom: '<"flex justify-between items-center mb-4"lf>rt<"flex justify-between items-center mt-4"ip>'
//     });
// }

// // Data Fetching Functions
// async function fetchAllProducts() {
//     try {
//         console.log('Fetching all products...');
        
//         // Fetch both regular products and MB products
//         const [regularProductsResponse, mbProductsResponse] = await Promise.all([
//             fetch(`${PRODUCTS_API}/get-all-products?page=0&size=1000`),
//             fetch(`${MB_PRODUCTS_API}/get-all-mb-active-products?page=0&size=1000`)
//         ]);
        
//         let regularProducts = [];
//         let mbProducts = [];
        
//         if (regularProductsResponse.ok) {
//             const regularProductsData = await regularProductsResponse.json();
            
//             // Extract products from response
//             if (regularProductsData.content && Array.isArray(regularProductsData.content)) {
//                 regularProducts = regularProductsData.content;
//             } else if (Array.isArray(regularProductsData)) {
//                 regularProducts = regularProductsData;
//             } else if (regularProductsData.data && Array.isArray(regularProductsData.data)) {
//                 regularProducts = regularProductsData.data;
//             } else {
//                 console.warn('Unexpected regular products response structure:', regularProductsData);
//             }
//         } else {
//             console.warn('Failed to fetch regular products:', regularProductsResponse.status);
//         }
        
//         if (mbProductsResponse.ok) {
//             const mbProductsData = await mbProductsResponse.json();
            
//             // Handle different response structures
//             if (Array.isArray(mbProductsData)) {
//                 mbProducts = mbProductsData;
//             } else if (mbProductsData.content && Array.isArray(mbProductsData.content)) {
//                 mbProducts = mbProductsData.content;
//             } else if (mbProductsData.data && Array.isArray(mbProductsData.data)) {
//                 mbProducts = mbProductsData.data;
//             } else {
//                 console.warn('Unexpected MB products response structure:', mbProductsData);
//                 mbProducts = [];
//             }
//         } else {
//             console.warn('Failed to fetch MB products:', mbProductsResponse.status);
//         }
        
//         // Transform MB products to match inventory format
//         const transformedMBProducts = mbProducts.map(mbProduct => {
//             let priceArray = [];
//             let price = 0;
            
//             if (mbProduct.price && Array.isArray(mbProduct.price)) {
//                 priceArray = mbProduct.price;
//                 price = mbProduct.price.length > 0 ? parseFloat(mbProduct.price[0]) : 0;
//             } else if (mbProduct.price && typeof mbProduct.price === 'string') {
//                 priceArray = [mbProduct.price];
//                 price = parseFloat(mbProduct.price) || 0;
//             } else if (mbProduct.price && typeof mbProduct.price === 'number') {
//                 priceArray = [mbProduct.price.toString()];
//                 price = mbProduct.price;
//             }
            
//             return {
//                 productId: mbProduct.id,
//                 id: mbProduct.id,
//                 productType: 'mb',
//                 sku: mbProduct.sku || '',
//                 productName: mbProduct.title || mbProduct.name || 'Unnamed Product',
//                 title: mbProduct.title || mbProduct.name || 'Unnamed Product',
//                 productCategory: mbProduct.category || 'Mother & Baby Care',
//                 category: mbProduct.category,
//                 subCategory: mbProduct.subCategory || '',
//                 productPrice: priceArray,
//                 price: priceArray,
//                 productOldPrice: mbProduct.originalPrice || priceArray,
//                 originalPrice: mbProduct.originalPrice || priceArray,
//                 productStock: mbProduct.inStock ? 'In-Stock' : 'Out-of-Stock',
//                 inStock: mbProduct.inStock || false,
//                 productStatus: mbProduct.inStock ? 'Available' : 'Out of Stock',
//                 productDescription: (mbProduct.description && Array.isArray(mbProduct.description) && mbProduct.description.length > 0) ? 
//                     mbProduct.description[0] : (mbProduct.description || ''),
//                 description: mbProduct.description || [],
//                 productQuantity: mbProduct.stockQuantity || 0,
//                 stockQuantity: mbProduct.stockQuantity || 0,
//                 prescriptionRequired: false,
//                 brandName: mbProduct.brand || '',
//                 brand: mbProduct.brand || '',
//                 mfgDate: null,
//                 expDate: null,
//                 batchNo: null,
//                 benefitsList: mbProduct.features || [],
//                 directionsList: [],
//                 ingredientsList: [],
//                 productSizes: mbProduct.sizes || [],
//                 productMainImage: null,
//                 productSubImages: [],
//                 productDynamicFields: {},
//                 discount: mbProduct.discount || 0,
//                 rating: mbProduct.rating || 0,
//                 reviewCount: mbProduct.reviewCount || 0
//             };
//         });
        
//         // Transform regular products if needed
//         const transformedRegularProducts = regularProducts.map(product => {
//             // Ensure all required fields exist
//             return {
//                 ...product,
//                 productType: 'regular',
//                 productName: product.productName || 'Unnamed Product',
//                 productCategory: product.productCategory || 'Pharmacy',
//                 productQuantity: product.productQuantity || 0,
//                 productPrice: Array.isArray(product.productPrice) ? product.productPrice : 
//                              (typeof product.productPrice === 'string' || typeof product.productPrice === 'number') ? 
//                              [product.productPrice] : [0],
//                 productStatus: product.productStatus || 'Available',
//                 brandName: product.brandName || '',
//                 expDate: product.expDate || null
//             };
//         });
        
//         // Combine both product lists
//         inventory = [...transformedRegularProducts, ...transformedMBProducts];
        
//         console.log('Total inventory count:', inventory.length);
        
//         updateDataTable(inventory);
//         updateDashboardStats(inventory);
        
//         return inventory;
//     } catch (error) {
//         console.error('Error fetching products:', error);
//         showErrorToast('Failed to load products');
//         return [];
//     }
// }

// function updateDataTable(data) {
//     if (dataTable) {
//         dataTable.clear();
//         dataTable.rows.add(data);
//         dataTable.draw();
        
//         $('#showing-count').text(data.length);
//         $('#total-count').text(data.length);
//     }
// }

// function updateDashboardStats(products) {
//     const today = new Date();
//     const thirtyDaysFromNow = new Date();
//     thirtyDaysFromNow.setDate(today.getDate() + 30);
    
//     let total = products.length;
//     let inStock = 0;
//     let lowStock = 0;
//     let expiringSoon = 0;
//     let outOfStock = 0;
//     let totalValue = 0;
    
//     let medicineCount = 0;
//     let mothercareCount = 0;
//     let babyCount = 0;
//     let wellnessCount = 0;
    
//     products.forEach(product => {
//         let quantity = 0;
//         let price = 0;
        
//         if (product.productType === 'mb') {
//             quantity = product.stockQuantity || 0;
//             price = product.price && product.price.length > 0 ? parseFloat(product.price[0]) : 0;
//         } else {
//             quantity = product.productQuantity || 0;
//             if (Array.isArray(product.productPrice)) {
//                 price = product.productPrice.length > 0 ? parseFloat(product.productPrice[0]) : 0;
//             } else if (typeof product.productPrice === 'string') {
//                 price = parseFloat(product.productPrice) || 0;
//             } else if (typeof product.productPrice === 'number') {
//                 price = product.productPrice;
//             }
//         }
        
//         if (quantity > 10) {
//             inStock++;
//         } else if (quantity > 0) {
//             lowStock++;
//         } else {
//             outOfStock++;
//         }
        
//         if (product.expDate) {
//             const expDate = new Date(product.expDate);
//             if (expDate <= thirtyDaysFromNow && expDate >= today) {
//                 expiringSoon++;
//             }
//         }
        
//         totalValue += quantity * price;
        
//         // Categorize products
//         const category = product.productType === 'mb' ? 
//             (product.category || product.productCategory) : 
//             product.productCategory;

//         if (product.productType === 'mb') {
//             mothercareCount++;
//         } else if (category === 'Mother Care & Maternity') {
//             mothercareCount++;
//         } else if (category === 'Baby Care') {
//             babyCount++;
//         } else if (category === 'Wellness & Personal Care') {
//             wellnessCount++;
//         } else {
//             medicineCount++;
//         }
//     });
    
//     $('#total-items').text(total);
//     $('#in-stock').text(inStock);
//     $('#low-stock-count').text(lowStock);
//     $('#expiring-soon').text(expiringSoon);
//     $('#out-of-stock').text(outOfStock);
//     $('#total-stock-value').text('₹' + totalValue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}));
    
//     $('#medicine-count').text(`${medicineCount} medicines`);
//     $('#mothercare-count').text(`${mothercareCount + babyCount + wellnessCount} products`);
// }

// async function loadMedicines(category = 'all') {
//     try {
//         let medicines = [];
        
//         if (category === 'all') {
//             // Get all medicines from inventory
//             medicines = inventory.filter(product => {
//                 if (product.productType === 'mb') {
//                     return false;
//                 }
                
//                 const category = product.productCategory;
                
//                 const medicineCategories = [
//                     'Medicines & Healthcare',
//                     'Wellness',
//                     'Devices',
//                     'Surgical',
//                     'Speciality Care',
//                 ];
                
//                 return medicineCategories.includes(category);
//             });
//         } else {
//             // Fetch medicines by category from API
//             const encodedCategory = encodeURIComponent(category);
//             const response = await fetch(`${PRODUCTS_API}/get-all-products?category=${encodedCategory}&page=0&size=1000`);
            
//             if (response.ok) {
//                 const data = await response.json();
                
//                 // Handle different response structures
//                 if (data.content && Array.isArray(data.content)) {
//                     medicines = data.content;
//                 } else if (Array.isArray(data)) {
//                     medicines = data;
//                 } else if (data.data && Array.isArray(data.data)) {
//                     medicines = data.data;
//                 }
//             }
//         }
        
//         renderMedicinesTable(medicines, category);
        
//         // Update category counts
//         updateMedicineCategoryCounts();
        
//     } catch (error) {
//         console.error('Error loading medicines:', error);
//         showErrorToast('Failed to load medicines');
//         renderMedicinesTable([], category);
//     }
// }

// async function filterMedicineProducts(category) {
//     await loadMedicines(category);
// }

// function updateMedicineCategoryCounts() {
//     // Count medicines by category
//     const categories = {
//         'Medicines & Healthcare': 0,
//         'Wellness & Personal Care': 0,
//         'Medical Devices & Equipment': 0,
//         'Surgical Items': 0,
//         'Speciality Care': 0
//     };
    
//     inventory.forEach(product => {
//         if (product.productType === 'regular') {
//             const category = product.productCategory;
//             if (categories.hasOwnProperty(category)) {
//                 categories[category]++;
//             }
//         }
//     });
    
//     // Update the button counts
//     Object.keys(categories).forEach(category => {
//         const button = $(`.medicine-category-filter-btn[data-subcategory="${category}"]`);
//         if (button.length) {
//             const count = categories[category];
//             const currentText = button.text();
//             // Remove existing count if present
//             const textWithoutCount = currentText.replace(/\(\d+\)/, '').trim();
//             button.text(`${textWithoutCount} (${count})`);
//         }
//     });
// }

// function renderMedicinesTable(medicines, category = 'all') {
//     const tbody = $('#medicines-table-body');
//     tbody.empty();
    
//     if (medicines.length === 0) {
//         const message = category === 'all' ? 
//             'No medicines found' : 
//             `No medicines found in "${category}" category`;
//         tbody.html(`<tr><td colspan="8" class="text-center py-8 text-gray-500">${message}</td></tr>`);
//         return;
//     }
    
//     medicines.forEach((product) => {
//         const stock = product.productQuantity || 0;
//         const stockClass = getStockClass(stock);
//         const category = product.productCategory || 'N/A';
//         const categoryClass = getCategoryBadgeClass(category);
        
//         let imageUrl = 'https://via.placeholder.com/40?text=No+Image';
//         if (product.productMainImage) {
//             imageUrl = product.productMainImage.startsWith('http') ? 
//                 product.productMainImage : 
//                 `${BASE_URL}${product.productMainImage}`;
//         }
        
//         // Handle price display
//         let priceDisplay = '₹0';
//         if (product.productPrice) {
//             if (Array.isArray(product.productPrice) && product.productPrice.length > 0) {
//                 priceDisplay = `₹${parseFloat(product.productPrice[0]).toFixed(2)}`;
//             } else if (typeof product.productPrice === 'string' || typeof product.productPrice === 'number') {
//                 priceDisplay = `₹${parseFloat(product.productPrice).toFixed(2)}`;
//             }
//         }
        
//         // Calculate expiry status
//         const today = new Date();
//         const expDate = product.expDate ? new Date(product.expDate) : null;
//         let expiryStatus = '';
//         let expiryClass = '';
        
//         if (expDate) {
//             const daysUntilExpiry = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
//             if (daysUntilExpiry < 0) {
//                 expiryStatus = 'Expired';
//                 expiryClass = 'bg-red-100 text-red-800';
//             } else if (daysUntilExpiry <= 30) {
//                 expiryStatus = `${daysUntilExpiry} days`;
//                 expiryClass = 'bg-yellow-100 text-yellow-800';
//             } else {
//                 expiryStatus = 'Valid';
//                 expiryClass = 'bg-green-100 text-green-800';
//             }
//         } else {
//             expiryStatus = 'N/A';
//             expiryClass = 'bg-gray-100 text-gray-800';
//         }
        
//         const row = `
//             <tr class="border-t hover:bg-gray-50">
//                 <td class="py-3 px-4">
//                     <div class="flex items-center">
//                         <img src="${imageUrl}" 
//                              class="w-10 h-10 rounded mr-3 object-cover" 
//                              alt="${product.productName}"
//                              onerror="this.src='https://via.placeholder.com/40?text=No+Image'">
//                         <div>
//                             <div class="font-medium">${product.productName || 'N/A'}</div>
//                             <div class="text-sm text-gray-500">${product.brandName || 'N/A'}</div>
//                             <div class="text-xs text-gray-400">${product.sku || 'No SKU'}</div>
//                         </div>
//                     </div>
//                 </td>
//                 <td class="py-3 px-4">
//                     <span class="category-badge ${categoryClass}">
//                         ${category}
//                     </span>
//                 </td>
//                 <td class="py-3 px-4">
//                     <div class="flex items-center">
//                         <span class="stock-indicator ${stockClass} mr-2"></span>
//                         <span>${stock || 0}</span>
//                     </div>
//                 </td>
//                 <td class="py-3 px-4 font-medium">
//                     ${priceDisplay}
//                 </td>
//                 <td class="py-3 px-4 ${expDate && expDate <= today ? 'text-red-600' : ''}">
//                     ${product.expDate || 'N/A'}
//                 </td>
//                 <td class="py-3 px-4">
//                     <span class="px-2 py-1 rounded text-xs ${expiryClass}">
//                         ${expiryStatus}
//                     </span>
//                 </td>
//                 <td class="py-3 px-4">
//                     <span class="px-2 py-1 rounded text-xs ${product.productStatus === 'Available' || product.productStatus === 'In-Stock' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
//                         ${product.productStatus || 'N/A'}
//                     </span>
//                 </td>
//                 <td class="py-3 px-4">
//                     <div class="flex space-x-1">
//                         <button onclick="viewProduct(${product.productId}, 'regular')" 
//                                 class="action-btn bg-blue-100 text-blue-600 hover:bg-blue-200 p-2 rounded" 
//                                 title="View Details">
//                             <i class="fas fa-eye"></i>
//                         </button>
                        
//                         <button onclick="showBatchManagementModal(${product.productId})" 
//                                 class="action-btn bg-purple-100 text-purple-600 hover:bg-purple-200 p-2 rounded" 
//                                 title="Manage Batches">
//                             <i class="fas fa-layer-group"></i>
//                         </button>
//                         <button onclick="deleteProduct(${product.productId}, 'regular')" 
//                                 class="action-btn bg-red-100 text-red-600 hover:bg-red-200 p-2 rounded" 
//                                 title="Delete Product">
//                             <i class="fas fa-trash"></i>
//                         </button>
//                     </div>
//                 </td>
//             </tr>
//         `;
        
//         tbody.append(row);
//     });
// }

// // Updated loadMothercareProducts to accept category parameter
// async function loadMothercareProducts(category = 'all') {
//     try {
//         let mothercareProducts;
        
//         if (category === 'all') {
//             // Fetch all MB products
//             const mbProductsResponse = await fetch(`${MB_PRODUCTS_API}/get-all-mb-products?page=0&size=1000`);
            
//             if (mbProductsResponse.ok) {
//                 const mbProductsData = await mbProductsResponse.json();
                
//                 // Handle different response structures
//                 if (Array.isArray(mbProductsData)) {
//                     mothercareProducts = mbProductsData;
//                 } else if (mbProductsData.content && Array.isArray(mbProductsData.content)) {
//                     mothercareProducts = mbProductsData.content;
//                 } else if (mbProductsData.data && Array.isArray(mbProductsData.data)) {
//                     mothercareProducts = mbProductsData.data;
//                 } else {
//                     mothercareProducts = [];
//                 }
//             } else {
//                 mothercareProducts = [];
//             }
//         } else {
//             // Fetch products by category
//             const encodedCategory = encodeURIComponent(category);
//             const response = await fetch(`${MB_PRODUCTS_API}/category/${encodedCategory}?page=0&size=1000`);
            
//             if (response.ok) {
//                 const data = await response.json();
                
//                 // Handle different response structures
//                 if (Array.isArray(data)) {
//                     mothercareProducts = data;
//                 } else if (data.content && Array.isArray(data.content)) {
//                     mothercareProducts = data.content;
//                 } else if (data.data && Array.isArray(data.data)) {
//                     mothercareProducts = data.data;
//                 } else {
//                     mothercareProducts = [];
//                 }
//             } else {
//                 console.warn(`Failed to fetch products for category ${category}:`, response.status);
//                 mothercareProducts = [];
//             }
//         }
        
//         // Also include regular products in relevant categories if needed
//         const regularProducts = inventory.filter(product => {
//             if (product.productType === 'mb') return false;
            
//             const productCategory = product.productCategory;
//             return productCategory === 'Mother Care & Maternity' ||
//                   productCategory === 'Baby Care' ||
//                   productCategory === 'Wellness & Personal Care';
//         });
        
//         // Filter regular products by category if needed
//         const filteredRegularProducts = category === 'all' ? regularProducts : 
//             regularProducts.filter(product => {
//                 if (category === 'Mother Care & Maternity') {
//                     return product.productCategory === 'Mother Care & Maternity';
//                 } else if (category === 'Baby Care') {
//                     return product.productCategory === 'Baby Care';
//                 }
//                 return false;
//             });
        
//         // Transform MB products to match your format
//         const transformedMBProducts = mothercareProducts.map(mbProduct => {
//             let priceArray = [];
//             let price = 0;
            
//             if (mbProduct.price && Array.isArray(mbProduct.price)) {
//                 priceArray = mbProduct.price;
//                 price = mbProduct.price.length > 0 ? parseFloat(mbProduct.price[0]) : 0;
//             } else if (mbProduct.price && typeof mbProduct.price === 'string') {
//                 priceArray = [mbProduct.price];
//                 price = parseFloat(mbProduct.price) || 0;
//             } else if (mbProduct.price && typeof mbProduct.price === 'number') {
//                 priceArray = [mbProduct.price.toString()];
//                 price = mbProduct.price;
//             }
            
//             return {
//                 productId: mbProduct.id,
//                 id: mbProduct.id,
//                 productType: 'mb',
//                 sku: mbProduct.sku || '',
//                 productName: mbProduct.title || mbProduct.name || 'Unnamed Product',
//                 title: mbProduct.title || mbProduct.name || 'Unnamed Product',
//                 productCategory: mbProduct.category || 'Mother & Baby Care',
//                 category: mbProduct.category,
//                 subCategory: mbProduct.subCategory || '',
//                 productPrice: priceArray,
//                 price: priceArray,
//                 productOldPrice: mbProduct.originalPrice || priceArray,
//                 originalPrice: mbProduct.originalPrice || priceArray,
//                 productStock: mbProduct.inStock ? 'In-Stock' : 'Out-of-Stock',
//                 inStock: mbProduct.inStock || false,
//                 productStatus: mbProduct.inStock ? 'Available' : 'Out of Stock',
//                 productDescription: (mbProduct.description && Array.isArray(mbProduct.description) && mbProduct.description.length > 0) ? 
//                     mbProduct.description[0] : (mbProduct.description || ''),
//                 description: mbProduct.description || [],
//                 productQuantity: mbProduct.stockQuantity || 0,
//                 stockQuantity: mbProduct.stockQuantity || 0,
//                 prescriptionRequired: false,
//                 brandName: mbProduct.brand || '',
//                 brand: mbProduct.brand || '',
//                 mfgDate: null,
//                 expDate: null,
//                 batchNo: null,
//                 benefitsList: mbProduct.features || [],
//                 directionsList: [],
//                 ingredientsList: [],
//                 productSizes: mbProduct.sizes || [],
//                 productMainImage: null,
//                 productSubImages: [],
//                 productDynamicFields: {},
//                 discount: mbProduct.discount || 0,
//                 rating: mbProduct.rating || 0,
//                 reviewCount: mbProduct.reviewCount || 0
//             };
//         });
        
//         // Combine both product lists
//         const allProducts = [...transformedMBProducts, ...filteredRegularProducts];
        
//         renderMothercareTable(allProducts, category);
        
//         // Update category counts
//         updateMothercareCategoryCounts();
        
//     } catch (error) {
//         console.error('Error loading mothercare products:', error);
//         showErrorToast('Failed to load mothercare products');
//         renderMothercareTable([], category);
//     }
// }

// async function filterMothercareProducts(subcategory) {
//     await loadMothercareProducts(subcategory);
// }

// function updateMothercareCategoryCounts() {
//     // Count products by category
//     const categories = {
//         'Mother Care & Maternity': 0,
//         'Baby Care': 0,
//         'Wellness & Personal Care': 0
//     };
    
//     inventory.forEach(product => {
//         if (product.productType === 'mb') {
//             const category = product.category || product.productCategory;
//             if (categories.hasOwnProperty(category)) {
//                 categories[category]++;
//             }
//         } else {
//             const category = product.productCategory;
//             if (categories.hasOwnProperty(category)) {
//                 categories[category]++;
//             }
//         }
//     });
    
//     // Update the button counts
//     Object.keys(categories).forEach(category => {
//         const button = $(`.category-filter-btn[data-subcategory="${category}"]`);
//         if (button.length) {
//             const count = categories[category];
//             const currentText = button.text();
//             // Remove existing count if present
//             const textWithoutCount = currentText.replace(/\(\d+\)/, '').trim();
//             button.text(`${textWithoutCount} (${count})`);
//         }
//     });
// }

// function renderMothercareTable(products, category = 'all') {
//     const tbody = $('#mothercare-table-body');
//     tbody.empty();
    
//     if (products.length === 0) {
//         const message = category === 'all' ? 
//             'No mothercare products found' : 
//             `No products found in "${category}" category`;
//         tbody.html(`<tr><td colspan="8" class="text-center py-8 text-gray-500">${message}</td></tr>`);
//         return;
//     }
    
//     products.forEach((product) => {
//         const isMBProduct = product.productType === 'mb';
//         const stock = isMBProduct ? product.stockQuantity : product.productQuantity;
//         const stockClass = getStockClass(stock);
//         const productCategory = isMBProduct ? 
//             (product.category || product.productCategory) : 
//             product.productCategory;
//         const categoryClass = getCategoryBadgeClass(productCategory);
//         const productName = isMBProduct ? product.title : product.productName;
//         const brandName = isMBProduct ? product.brand : product.brandName;
//         const productIdToUse = isMBProduct ? product.id : product.productId;
//         const productType = isMBProduct ? 'mb' : 'regular';
        
//         let imageUrl = 'https://via.placeholder.com/40?text=No+Image';
//         if (isMBProduct && product.id) {
//             imageUrl = `${BASE_URL}/api/mb/products/${product.id}/image`;
//         } else if (!isMBProduct && product.productMainImage) {
//             imageUrl = product.productMainImage.startsWith('http') ? 
//                 product.productMainImage : 
//                 `${BASE_URL}${product.productMainImage}`;
//         }
        
//         // Calculate discount if available
//         let discountBadge = '';
//         if (isMBProduct && product.discount > 0) {
//             discountBadge = `
//                 <span class="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
//                     ${product.discount}% OFF
//                 </span>
//             `;
//         }
        
//         // Calculate rating stars
//         let ratingStars = '';
//         if (isMBProduct && product.rating > 0) {
//             const fullStars = Math.floor(product.rating);
//             const hasHalfStar = product.rating % 1 >= 0.5;
//             ratingStars = `
//                 <div class="flex items-center mt-1">
//                     ${Array(fullStars).fill('<i class="fas fa-star text-yellow-400 text-xs"></i>').join('')}
//                     ${hasHalfStar ? '<i class="fas fa-star-half-alt text-yellow-400 text-xs"></i>' : ''}
//                     ${Array(5 - fullStars - (hasHalfStar ? 1 : 0)).fill('<i class="far fa-star text-yellow-400 text-xs"></i>').join('')}
//                     <span class="ml-1 text-xs text-gray-500">(${product.rating})</span>
//                 </div>
//             `;
//         }
        
//         const row = `
//             <tr class="border-t hover:bg-gray-50" data-category="${productCategory}">
//                 <td class="py-3 px-4">
//                     <div class="flex items-center">
//                         <img src="${imageUrl}" 
//                              class="w-10 h-10 rounded mr-3 object-cover" 
//                              alt="${productName}"
//                              onerror="this.src='https://via.placeholder.com/40?text=No+Image'">
//                         <div>
//                             <div class="font-medium">${productName || 'N/A'}</div>
//                             <div class="text-sm text-gray-500">${brandName || 'N/A'}</div>
//                             ${ratingStars}
//                         </div>
//                         ${discountBadge}
//                     </div>
//                 </td>
//                 <td class="py-3 px-4">
//                     <span class="category-badge ${categoryClass}">
//                         ${productCategory || 'N/A'}
//                     </span>
//                 </td>
//                 <td class="py-3 px-4">
//                     <div class="flex items-center">
//                         <span class="stock-indicator ${stockClass} mr-2"></span>
//                         <span>${stock || 0}</span>
//                     </div>
//                 </td>
//                 <td class="py-3 px-4 font-medium">
//                     ₹${isMBProduct ? 
//                         (product.price && product.price.length > 0 ? parseFloat(product.price[0]).toFixed(2) : '0.00') : 
//                         (Array.isArray(product.productPrice) ? parseFloat(product.productPrice[0] || 0).toFixed(2) : parseFloat(product.productPrice || 0).toFixed(2))}
//                     ${isMBProduct && product.originalPrice && product.originalPrice.length > 0 && parseFloat(product.originalPrice[0]) > parseFloat(product.price[0]) ? 
//                         `<div class="text-sm text-gray-500 line-through">₹${parseFloat(product.originalPrice[0]).toFixed(2)}</div>` : ''}
//                 </td>
//                 <td class="py-3 px-4">
//                     ${product.expDate || 'N/A'}
//                 </td>
//                 <td class="py-3 px-4">
//                     <span class="px-2 py-1 rounded text-xs ${(isMBProduct ? product.inStock : product.productStatus === 'Available') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
//                         ${isMBProduct ? (product.inStock ? 'Available' : 'Out of Stock') : (product.productStatus || 'N/A')}
//                     </span>
//                 </td>
//                 <td class="py-3 px-4">
//                     ${isMBProduct ? (product.reviewCount || 0) : 'N/A'}
//                 </td>
//                 <td class="py-3 px-4">
//                     <div class="flex space-x-1">
//                         <button onclick="viewProduct(${productIdToUse}, '${productType}')" 
//                                 class="action-btn bg-blue-100 text-blue-600 hover:bg-blue-200 p-2 rounded" 
//                                 title="View Details">
//                             <i class="fas fa-eye"></i>
//                         </button>
                    
//                         ${isMBProduct ? 
//                             `<button onclick="showBatchManagementModalMB(${productIdToUse})" 
//                                     class="action-btn bg-purple-100 text-purple-600 hover:bg-purple-200 p-2 rounded" 
//                                     title="Manage Batches">
//                                 <i class="fas fa-layer-group"></i>
//                             </button>` :
//                             `<button onclick="showBatchManagementModal(${productIdToUse})" 
//                                     class="action-btn bg-purple-100 text-purple-600 hover:bg-purple-200 p-2 rounded" 
//                                     title="Manage Batches">
//                                 <i class="fas fa-layer-group"></i>
//                             </button>`
//                         }
//                         <button onclick="deleteProduct(${productIdToUse}, '${productType}')" 
//                                 class="action-btn bg-red-100 text-red-600 hover:bg-red-200 p-2 rounded" 
//                                 title="Delete Product">
//                             <i class="fas fa-trash"></i>
//                         </button>
//                     </div>
//                 </td>
//             </tr>
//         `;
        
//         tbody.append(row);
//     });
// }

// // Action Button Functions
// async function viewProduct(productId, type) {
//     try {
//         if (!productId) {
//             showErrorToast('Product ID is required');
//             return;
//         }
        
//         console.log('View product clicked:', { productId, type });
        
//         // Show loader
//         showLoader();
        
//         // Fetch product details for the overlay modal
//         let productData;
//         if (type === 'mb') {
//             const response = await fetch(`${MB_PRODUCTS_API}/${productId}`);
//             if (!response.ok) throw new Error('Failed to fetch MB product');
//             productData = await response.json();
//         } else {
//             const response = await fetch(`${PRODUCTS_API}/${productId}`);
//             if (!response.ok) throw new Error('Failed to fetch product');
//             productData = await response.json();
//         }
        
//         // Generate HTML for the view modal
//         const html = generateViewModalHTML(productData, type);
        
//         // Show the overlay modal
//         $('#batchModalContent').html(html);
//         $('#batchModalTitle').text(`View Product - ${type === 'mb' ? productData.title : productData.productName}`);
//         $('#batchModal').show();
        
//     } catch (error) {
//         console.error('Error viewing product:', error);
//         showErrorToast('Failed to load product details');
//     } finally {
//         hideLoader();
//     }
// }

// // Helper function to generate view modal HTML with "Edit" button that redirects
// function generateViewModalHTML(productData, type) {
//     const isMBProduct = type === 'mb';
    
//     const productName = isMBProduct ? productData.title : productData.productName;
//     const brandName = isMBProduct ? productData.brand : productData.brandName;
//     const sku = isMBProduct ? productData.sku : productData.sku;
//     const category = isMBProduct ? productData.category : productData.productCategory;
//     const description = isMBProduct ? 
//         (Array.isArray(productData.description) ? productData.description[0] : productData.description) : 
//         productData.productDescription;
//     const price = isMBProduct ? 
//         (productData.price && productData.price.length > 0 ? `₹${productData.price[0]}` : '₹0') : 
//         (Array.isArray(productData.productPrice) ? `₹${productData.productPrice[0]}` : `₹${productData.productPrice || 0}`);
//     const stock = isMBProduct ? productData.stockQuantity : productData.productQuantity;
//     const status = isMBProduct ? (productData.inStock ? 'Available' : 'Out of Stock') : productData.productStatus;
//     const productId = isMBProduct ? productData.id : productData.productId;
    
//     return `
//         <div class="product-view-modal">
//             <div class="mb-6 p-4 ${isMBProduct ? 'bg-pink-50' : 'bg-blue-50'} rounded-lg">
//                 <div class="flex justify-between items-start">
//                     <div>
//                         <h3 class="font-semibold text-lg text-gray-800">${productName}</h3>
//                         <div class="flex flex-wrap gap-4 mt-2">
//                             <span class="text-sm text-gray-600">Brand: ${brandName || 'N/A'}</span>
//                             <span class="text-sm text-gray-600">SKU: ${sku || 'N/A'}</span>
//                             <span class="text-sm text-gray-600">Category: ${category || 'N/A'}</span>
//                         </div>
//                     </div>
//                     <span class="px-3 py-1 text-xs font-semibold rounded-full ${isMBProduct ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'}">
//                         ${isMBProduct ? 'Mother & Baby Care' : 'Medicine'}
//                     </span>
//                 </div>
//             </div>
            
//             <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//                 <div class="bg-white p-4 rounded-lg border">
//                     <h4 class="font-medium text-gray-700 mb-3">Product Information</h4>
//                     <div class="space-y-3">
//                         <div class="flex justify-between">
//                             <span class="text-gray-600">Price:</span>
//                             <span class="font-semibold">${price}</span>
//                         </div>
//                         <div class="flex justify-between">
//                             <span class="text-gray-600">Stock Quantity:</span>
//                             <span class="font-semibold ${stock <= 10 ? 'text-yellow-600' : 'text-green-600'}">${stock || 0}</span>
//                         </div>
//                         <div class="flex justify-between">
//                             <span class="text-gray-600">Status:</span>
//                             <span class="px-2 py-1 rounded text-xs ${status === 'Available' || status === 'In-Stock' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
//                                 ${status || 'N/A'}
//                             </span>
//                         </div>
//                     </div>
//                 </div>
                
//                 <div class="bg-white p-4 rounded-lg border">
//                     <h4 class="font-medium text-gray-700 mb-3">Additional Details</h4>
//                     <div class="space-y-2">
//                         <div>
//                             <span class="text-gray-600 text-sm">MFG Date:</span>
//                             <p class="font-medium">${productData.mfgDate || 'N/A'}</p>
//                         </div>
//                         <div>
//                             <span class="text-gray-600 text-sm">Expiry Date:</span>
//                             <p class="font-medium ${productData.expDate && new Date(productData.expDate) <= new Date() ? 'text-red-600' : ''}">
//                                 ${productData.expDate || 'N/A'}
//                             </p>
//                         </div>
//                         <div>
//                             <span class="text-gray-600 text-sm">Prescription Required:</span>
//                             <p class="font-medium">${productData.prescriptionRequired ? 'Yes' : 'No'}</p>
//                         </div>
//                     </div>
//                 </div>
//             </div>
            
//             <div class="mb-6">
//                 <h4 class="font-medium text-gray-700 mb-2">Description</h4>
//                 <div class="bg-gray-50 p-4 rounded-lg border">
//                     <p class="text-gray-600">${description || 'No description available'}</p>
//                 </div>
//             </div>
            
//             <div class="flex justify-end gap-3 pt-6 border-t">
               
//                 <button onclick="closeModal('batchModal')" 
//                         class="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium">
//                     Close
//                 </button>
//             </div>
//         </div>
//     `;
// }

// // EDIT BUTTON - Show overlay with edit form, not redirect
// async function editProduct(productId, type) {
//     try {
//         if (!productId) {
//             showErrorToast('Product ID is required');
//             return;
//         }
        
//         console.log('Edit product clicked:', { productId, type });
        
//         // Show loader
//         showLoader();
        
//         // Fetch product details
//         let productData;
//         if (type === 'mb') {
//             const response = await fetch(`${MB_PRODUCTS_API}/${productId}`);
//             if (!response.ok) throw new Error('Failed to fetch MB product');
//             productData = await response.json();
//         } else {
//             const response = await fetch(`${PRODUCTS_API}/${productId}`);
//             if (!response.ok) throw new Error('Failed to fetch product');
//             productData = await response.json();
//         }
        
//         // Generate edit form HTML
//         const html = generateEditFormHTML(productData, type);
        
//         // Show the edit modal
//         $('#batchModalContent').html(html);
//         $('#batchModalTitle').text(`Edit Product - ${type === 'mb' ? productData.title : productData.productName}`);
//         $('#batchModal').show();
        
//     } catch (error) {
//         console.error('Error in editProduct:', error);
//         showErrorToast('Failed to load product for editing');
//     } finally {
//         hideLoader();
//     }
// }

// // Helper function to generate edit form HTML
// function generateEditFormHTML(productData, type) {
//     const isMBProduct = type === 'mb';
    
//     const productName = isMBProduct ? productData.title : productData.productName;
//     const brandName = isMBProduct ? productData.brand : productData.brandName;
//     const sku = isMBProduct ? productData.sku : productData.sku;
//     const category = isMBProduct ? productData.category : productData.productCategory;
//     const description = isMBProduct ? 
//         (Array.isArray(productData.description) ? productData.description[0] : productData.description) : 
//         productData.productDescription;
//     const price = isMBProduct ? 
//         (productData.price && productData.price.length > 0 ? productData.price[0] : 0) : 
//         (Array.isArray(productData.productPrice) ? productData.productPrice[0] : productData.productPrice);
//     const stock = isMBProduct ? productData.stockQuantity : productData.productQuantity;
    
//     return `
//         <div class="product-edit-form">
//             <form id="editProductForm" class="space-y-4">
//                 <input type="hidden" name="productId" value="${productData.id || productData.productId}">
//                 <input type="hidden" name="type" value="${type}">
                
//                 <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <label class="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
//                         <input type="text" name="productName" value="${productName}" required 
//                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
//                     </div>
//                     <div>
//                         <label class="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
//                         <input type="text" name="brandName" value="${brandName || ''}" 
//                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
//                     </div>
//                 </div>
                
//                 <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <label class="block text-sm font-medium text-gray-700 mb-1">SKU</label>
//                         <input type="text" name="sku" value="${sku || ''}" 
//                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
//                     </div>
//                     <div>
//                         <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
//                         <input type="text" name="category" value="${category || ''}" 
//                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
//                     </div>
//                 </div>
                
//                 <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <label class="block text-sm font-medium text-gray-700 mb-1">Price *</label>
//                         <input type="number" name="price" value="${price || 0}" required min="0" step="0.01" 
//                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
//                     </div>
//                     <div>
//                         <label class="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
//                         <input type="number" name="stock" value="${stock || 0}" required min="0" 
//                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
//                     </div>
//                 </div>
                
//                 <div>
//                     <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
//                     <textarea name="description" rows="3" 
//                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">${description || ''}</textarea>
//                 </div>
                
//                 <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <label class="block text-sm font-medium text-gray-700 mb-1">MFG Date</label>
//                         <input type="date" name="mfgDate" value="${productData.mfgDate || ''}" 
//                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
//                     </div>
//                     <div>
//                         <label class="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
//                         <input type="date" name="expDate" value="${productData.expDate || ''}" 
//                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
//                     </div>
//                 </div>
                
//                 <div class="flex justify-end gap-3 pt-6 border-t">
//                     <button type="button" onclick="saveProductChanges()" 
//                             class="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium">
//                         <i class="fas fa-save mr-2"></i>Save Changes
//                     </button>
//                     <button type="button" onclick="closeModal('batchModal')" 
//                             class="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium">
//                         Cancel
//                     </button>
//                 </div>
//             </form>
//         </div>
//     `;
// }


// // Function to save product changes - USING PATCH ENDPOINT
// async function saveProductChanges() {
//     try {
//         showLoader();
        
//         const form = document.getElementById('editProductForm');
//         const formData = new FormData(form);
//         const productId = formData.get('productId');
//         const type = formData.get('type');
//         const isMBProduct = type === 'mb';
        
//         // Get form values
//         const productName = formData.get('productName');
//         const brandName = formData.get('brandName');
//         const sku = formData.get('sku');
//         const category = formData.get('category');
//         const price = formData.get('price');
//         const stock = formData.get('stock');
//         const description = formData.get('description');
//         const mfgDate = formData.get('mfgDate');
//         const expDate = formData.get('expDate');
        
//         // Create product data object
//         let productData;
        
//         if (isMBProduct) {
//             productData = {
//                 title: productName,
//                 brand: brandName,
//                 sku: sku,
//                 category: category,
//                 price: [parseFloat(price) || 0],
//                 stockQuantity: parseInt(stock) || 0,
//                 description: [description],
//                 inStock: parseInt(stock) > 0
//             };
//         } else {
//             productData = {
//                 productName: productName,
//                 brandName: brandName,
//                 sku: sku,
//                 productCategory: category,
//                 productPrice: [parseFloat(price) || 0],
//                 productQuantity: parseInt(stock) || 0,
//                 productDescription: description,
//                 mfgDate: mfgDate,
//                 expDate: expDate,
//                 productStatus: parseInt(stock) > 0 ? 'Available' : 'Out-of-Stock'
//             };
//         }
        
//         console.log('Patching product:', productData);
        
//         // Create FormData for multipart request
//         const patchFormData = new FormData();
//         patchFormData.append('productData', JSON.stringify(productData));
        
//         // Use PATCH endpoint which doesn't require images
//         const url = isMBProduct ? 
//             `${MB_PRODUCTS_API}/update-mb-product/${productId}` :  // Already PATCH for MB
//             `${PRODUCTS_API}/patch-product/${productId}`;         // Use PATCH for regular products
            
//         console.log('Sending PATCH request to:', url);
        
//         const response = await fetch(url, {
//             method: 'PATCH',
//             body: patchFormData
//             // Don't set Content-Type header for FormData
//         });
        
//         if (!response.ok) {
//             let errorText = await response.text();
//             console.error('Patch failed:', errorText);
            
//             // Try to parse error message
//             let errorMessage = `HTTP ${response.status}`;
//             try {
//                 const errorJson = JSON.parse(errorText);
//                 if (errorJson.message) {
//                     errorMessage = errorJson.message;
//                 } else if (errorJson.error) {
//                     errorMessage = errorJson.error;
//                 }
//             } catch (e) {
//                 // Not JSON, use as is
//                 if (errorText && errorText.trim()) {
//                     errorMessage = errorText;
//                 }
//             }
            
//             throw new Error(errorMessage);
//         }
        
//         const result = await response.json();
//         console.log('Patch successful:', result);
        
//         showSuccessToast('Product updated successfully!');
        
//         // Refresh the data
//         await fetchAllProducts();
        
//         // Close the modal
//         closeModal('batchModal');
        
//     } catch (error) {
//         console.error('Error patching product:', error);
        
//         // Show user-friendly error messages
//         if (error.message.includes('400')) {
//             showErrorToast('Invalid data. Please check all fields.');
//         } else if (error.message.includes('404')) {
//             showErrorToast('Product not found or endpoint unavailable.');
//         } else if (error.message.includes('415')) {
//             showErrorToast('Server rejected the request format.');
//         } else {
//             showErrorToast(`Update failed: ${error.message}`);
//         }
//     } finally {
//         hideLoader();
//     }
// }

// async function deleteProduct(productId, type) {
//     if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
//         return;
//     }
    
//     try {
//         showLoader();
        
//         let url, successMessage;
        
//         if (type === 'mb') {
//             url = `${MB_PRODUCTS_API}/delete-product/${productId}`;
//             successMessage = 'Mother & Baby Care product deleted successfully!';
//         } else {
//             url = `${PRODUCTS_API}/delete-product/${productId}`;
//             successMessage = 'Product deleted successfully!';
//         }
        
//         const response = await fetch(url, {
//             method: 'DELETE'
//         });
        
//         if (!response.ok) {
//             const errorText = await response.text();
//             throw new Error(`HTTP ${response.status}: ${errorText}`);
//         }
        
//         showSuccessToast(successMessage);
        
//         // Refresh the inventory data
//         await fetchAllProducts();
        
//         // Reload current tab data
//         const activeTab = $('.tab-item.active').data('tab');
//         if (activeTab === 'medicines') {
//             await loadMedicines();
//         } else if (activeTab === 'mothercare') {
//             await loadMothercareProducts();
//         }
        
//     } catch (error) {
//         console.error('Error deleting product:', error);
//         showErrorToast(`Failed to delete product: ${error.message}`);
//     } finally {
//         hideLoader();
//     }
// }

// // ===== BATCH MANAGEMENT MODAL FUNCTIONS =====
// // FIXED to handle both single and multiple variants properly

// async function showBatchManagementModal(productId) {
//     try {
//         showLoader();
//         currentProductId = productId;
//         currentProductType = 'regular';
        
//         // Fetch product details using the correct API endpoint
//         const productResponse = await fetch(`${PRODUCTS_API}/${productId}`);
//         if (!productResponse.ok) throw new Error(`Failed to fetch product`);
//         const product = await productResponse.json();
        
//         // Fetch batches for this product using the new API
//         const batchesResponse = await fetch(`${INVENTORY_API}/get-all-batches?productId=${productId}&size=100`);
//         let batches = [];
        
//         if (batchesResponse.ok) {
//             const batchesData = await batchesResponse.json();
//             batches = batchesData.data || [];
//         }
        
//         // Calculate total stock
//         const totalStock = batches.reduce((sum, batch) => sum + (batch.quantity || 0), 0);
        
//         // Generate batch table HTML
//         const batchTableHTML = batches.length > 0 ? `
//             <div>
//                 <h4 class="font-medium mb-3 text-gray-700">Existing Batches (${batches.length})</h4>
//                 <div class="overflow-x-auto border rounded-lg">
//                     <table class="min-w-full">
//                         <thead class="bg-gray-50">
//                             <tr>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Batch No</th>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Size</th>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Quantity</th>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">MFG Date</th>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Expiry Date</th>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Status</th>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             ${batches.map(batch => `
//                                 <tr class="border-t hover:bg-gray-50">
//                                     <td class="py-3 px-4 font-medium">${batch.batchNo || 'N/A'}</td>
//                                     <td class="py-3 px-4">${batch.size || 'N/A'}</td>
//                                     <td class="py-3 px-4">
//                                         <span class="font-semibold ${batch.quantity <= 10 ? 'text-yellow-600' : 'text-gray-800'}">
//                                             ${batch.quantity || 0}
//                                         </span>
//                                     </td>
//                                     <td class="py-3 px-4">${batch.mfgDate ? batch.mfgDate.split('T')[0] : 'N/A'}</td>
//                                     <td class="py-3 px-4 ${batch.expDate && new Date(batch.expDate) <= new Date() ? 'text-red-600' : ''}">
//                                         ${batch.expDate ? batch.expDate.split('T')[0] : 'N/A'}
//                                     </td>
//                                     <td class="py-3 px-4">
//                                         <span class="px-2 py-1 rounded text-xs ${batch.stockStatus === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 
//                                             batch.stockStatus === 'LOW_STOCK' ? 'bg-yellow-100 text-yellow-800' : 
//                                             batch.stockStatus === 'DAMAGED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
//                                             ${batch.stockStatus || 'N/A'}
//                                         </span>
//                                     </td>
//                                     <td class="py-3 px-4">
//                                         <div class="flex space-x-2">
//                                             <button onclick="editBatch(${batch.inventoryId})" 
//                                                     class="text-blue-600 hover:text-blue-800" title="Edit">
//                                                 <i class="fas fa-edit"></i>
//                                             </button>
//                                             <button onclick="showDeleteBatchConfirm(${batch.inventoryId})" 
//                                                     class="text-red-600 hover:text-red-800" title="Delete">
//                                                 <i class="fas fa-trash"></i>
//                                             </button>
//                                         </div>
//                                     </td>
//                                 </tr>
//                             `).join('')}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         ` : '<p class="text-gray-500 text-center py-8">No batches found for this product.</p>';
        
//         const html = `
//             <div class="mb-6 p-4 bg-blue-50 rounded-lg">
//                 <h3 class="font-semibold text-lg text-gray-800">${product.productName || product.title || 'Product'}</h3>
//                 <div class="grid grid-cols-2 gap-4 mt-2">
//                     <div>
//                         <p class="text-sm text-gray-600">Total Stock</p>
//                         <p class="text-2xl font-bold text-gray-800">${totalStock}</p>
//                     </div>
//                     <div>
//                         <p class="text-sm text-gray-600">SKU</p>
//                         <p class="text-sm font-medium text-gray-800">${product.sku || 'N/A'}</p>
//                     </div>
//                 </div>
//             </div>
            
//             <div class="mb-6">
//                 <h4 class="font-medium mb-3 text-gray-700">Add New Batch</h4>
//                 <form id="add-specific-batch-form" class="space-y-4 p-4 border rounded-lg bg-gray-50">
//                     <input type="hidden" name="productId" value="${productId}">
                    
//                     <!-- Batch Number -->
//                     <div>
//                         <label class="block text-sm font-medium text-gray-700 mb-1">Batch Number *</label>
//                         <input type="text" name="batchNo" required 
//                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                               placeholder="BATCH-2025-001">
//                     </div>
                    
//                     <!-- Variant Type Toggle -->
//                     <div>
//                         <label class="block text-sm font-medium text-gray-700 mb-2">Variant Type</label>
//                         <div class="flex gap-4">
//                             <label class="flex items-center gap-2 cursor-pointer">
//                                 <input type="radio" name="variantType" value="single" checked class="variant-type-radio">
//                                 <span class="text-sm text-gray-700">Single Variant</span>
//                             </label>
//                             <label class="flex items-center gap-2 cursor-pointer">
//                                 <input type="radio" name="variantType" value="multiple" class="variant-type-radio">
//                                 <span class="text-sm text-gray-700">Multiple Variants</span>
//                             </label>
//                         </div>
//                     </div>
                    
//                     <!-- Single Variant Section -->
//                     <div id="single-variant-section" class="variant-section">
//                         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                                 <label class="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
//                                 <input type="number" name="quantity" min="1" 
//                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                                       placeholder="100">
//                             </div>
//                             <div>
//                                 <label class="block text-sm font-medium text-gray-700 mb-1">Size (Optional)</label>
//                                 <input type="text" name="size" 
//                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                                       placeholder="e.g., M, L, XL">
//                             </div>
//                         </div>
//                         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                                 <label class="block text-sm font-medium text-gray-700 mb-1">MFG Date</label>
//                                 <input type="text" name="mfgDate" 
//                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                                       placeholder="YYYY-MM">
//                             </div>
//                             <div>
//                                 <label class="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
//                                 <input type="text" name="expiryDate" required
//                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                                       placeholder="YYYY-MM">
//                             </div>
//                         </div>
//                     </div>
                    
//                     <!-- Multiple Variants Section -->
//                     <div id="multiple-variants-section" class="variant-section hidden">
//                         <div class="mb-4">
//                             <label class="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
//                             <select name="stockStatus" 
//                                     class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
//                                 <option value="AVAILABLE">Available</option>
//                                 <option value="LOW_STOCK">Low Stock</option>
//                                 <option value="DAMAGED">Damaged</option>
//                                 <option value="EXPIRED">Expired</option>
//                             </select>
//                         </div>
                        
//                         <div id="variants-container" class="space-y-4">
//                             <!-- Variant entries will be added here -->
//                         </div>
                        
//                         <button type="button" id="add-variant-btn" class="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium">
//                             + Add Size Variant
//                         </button>
//                     </div>
                    
//                     <!-- Single Variant: Stock Status (only shown for single variant) -->
//                     <div id="single-stock-status-section" class="variant-section mt-4">
//                         <label class="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
//                         <select name="stockStatus" 
//                                 class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
//                             <option value="AVAILABLE">Available</option>
//                             <option value="LOW_STOCK">Low Stock</option>
//                             <option value="DAMAGED">Damaged</option>
//                             <option value="EXPIRED">Expired</option>
//                         </select>
//                     </div>
                    
//                     <button type="submit" 
//                             class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium mt-4">
//                         Add Batch
//                     </button>
//                 </form>
//             </div>
            
//             ${batchTableHTML}
//         `;
        
//         $('#batchModalContent').html(html);
//         $('#batchModalTitle').text('Manage Batches - ' + (product.productName || product.title || 'Product'));
//         $('#batchModal').show();
        
//         // Setup variant type toggle
//         setupVariantTypeToggle();
        
//         // Add first variant row for multiple variants
//         setTimeout(() => {
//             if ($('#variants-container').children().length === 0) {
//                 addVariantRow();
//             }
//         }, 100);
        
//         // Attach form submit event
//         $('#add-specific-batch-form').off('submit').on('submit', async function(e) {
//             e.preventDefault();
//             await addNewBatchForProduct($(this).serializeArray());
//         });
        
//     } catch (error) {
//         console.error('Error loading batch modal:', error);
//         showErrorToast('Failed to load batch information');
//     } finally {
//         hideLoader();
//     }
// }

// async function showBatchManagementModalMB(productId) {
//     try {
//         showLoader();
//         currentProductId = productId;
//         currentProductType = 'mb';
        
//         // Fetch MB product details
//         const productResponse = await fetch(`${MB_PRODUCTS_API}/${productId}`);
//         if (!productResponse.ok) throw new Error(`Failed to fetch MB product`);
//         const product = await productResponse.json();
        
//         // Fetch batches for this MB product using the new API
//         const batchesResponse = await fetch(`${INVENTORY_API}/get-all-batches?mbpId=${productId}&size=100`);
//         let batches = [];
        
//         if (batchesResponse.ok) {
//             const batchesData = await batchesResponse.json();
//             batches = batchesData.data || [];
//         }
        
//         // Calculate total stock
//         const totalStock = batches.reduce((sum, batch) => sum + (batch.quantity || 0), 0);
        
//         // Generate batch table HTML
//         const batchTableHTML = batches.length > 0 ? `
//             <div>
//                 <h4 class="font-medium mb-3 text-gray-700">Existing Batches (${batches.length})</h4>
//                 <div class="overflow-x-auto border rounded-lg">
//                     <table class="min-w-full">
//                         <thead class="bg-gray-50">
//                             <tr>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Batch No</th>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Size</th>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Quantity</th>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">MFG Date</th>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Expiry Date</th>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Status</th>
//                                 <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             ${batches.map(batch => `
//                                 <tr class="border-t hover:bg-gray-50">
//                                     <td class="py-3 px-4 font-medium">${batch.batchNo || 'N/A'}</td>
//                                     <td class="py-3 px-4">${batch.size || 'N/A'}</td>
//                                     <td class="py-3 px-4">
//                                         <span class="font-semibold ${batch.quantity <= 10 ? 'text-yellow-600' : 'text-gray-800'}">
//                                             ${batch.quantity || 0}
//                                         </span>
//                                     </td>
//                                     <td class="py-3 px-4">${batch.mfgDate ? batch.mfgDate.split('T')[0] : 'N/A'}</td>
//                                     <td class="py-3 px-4 ${batch.expDate && new Date(batch.expDate) <= new Date() ? 'text-red-600' : ''}">
//                                         ${batch.expDate ? batch.expDate.split('T')[0] : 'N/A'}
//                                     </td>
//                                     <td class="py-3 px-4">
//                                         <span class="px-2 py-1 rounded text-xs ${batch.stockStatus === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 
//                                             batch.stockStatus === 'LOW_STOCK' ? 'bg-yellow-100 text-yellow-800' : 
//                                             batch.stockStatus === 'DAMAGED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
//                                             ${batch.stockStatus || 'N/A'}
//                                         </span>
//                                     </td>
//                                     <td class="py-3 px-4">
//                                         <div class="flex space-x-2">
//                                             <button onclick="editBatch(${batch.inventoryId})" 
//                                                     class="text-blue-600 hover:text-blue-800" title="Edit">
//                                                 <i class="fas fa-edit"></i>
//                                             </button>
//                                             <button onclick="showDeleteBatchConfirm(${batch.inventoryId})" 
//                                                     class="text-red-600 hover:text-red-800" title="Delete">
//                                                 <i class="fas fa-trash"></i>
//                                             </button>
//                                         </div>
//                                     </td>
//                                 </tr>
//                             `).join('')}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         ` : '<p class="text-gray-500 text-center py-8">No batches found for this product.</p>';
        
//         const html = `
//             <div class="mb-6 p-4 bg-pink-50 rounded-lg">
//                 <h3 class="font-semibold text-lg text-gray-800">${product.title || product.productName || 'Product'}</h3>
//                 <div class="grid grid-cols-2 gap-4 mt-2">
//                     <div>
//                         <p class="text-sm text-gray-600">Total Stock</p>
//                         <p class="text-2xl font-bold text-gray-800">${totalStock}</p>
//                     </div>
//                     <div>
//                         <p class="text-sm text-gray-600">SKU</p>
//                         <p class="text-sm font-medium text-gray-800">${product.sku || 'N/A'}</p>
//                     </div>
//                 </div>
//                 <span class="mt-2 inline-block px-3 py-1 text-xs font-semibold rounded-full bg-pink-100 text-pink-800">
//                     Mother & Baby Care
//                 </span>
//             </div>
            
//             <div class="mb-6">
//                 <h4 class="font-medium mb-3 text-gray-700">Add New Batch</h4>
//                 <form id="add-specific-batch-form-mb" class="space-y-4 p-4 border rounded-lg bg-gray-50">
//                     <input type="hidden" name="mbpId" value="${productId}">
                    
//                     <!-- Batch Number -->
//                     <div>
//                         <label class="block text-sm font-medium text-gray-700 mb-1">Batch Number *</label>
//                         <input type="text" name="batchNo" required 
//                               class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                               placeholder="BATCH-2025-001">
//                     </div>
                    
//                     <!-- Variant Type Toggle -->
//                     <div>
//                         <label class="block text-sm font-medium text-gray-700 mb-2">Variant Type</label>
//                         <div class="flex gap-4">
//                             <label class="flex items-center gap-2 cursor-pointer">
//                                 <input type="radio" name="variantType" value="single" checked class="variant-type-radio">
//                                 <span class="text-sm text-gray-700">Single Variant</span>
//                             </label>
//                             <label class="flex items-center gap-2 cursor-pointer">
//                                 <input type="radio" name="variantType" value="multiple" class="variant-type-radio">
//                                 <span class="text-sm text-gray-700">Multiple Variants</span>
//                             </label>
//                         </div>
//                     </div>
                    
//                     <!-- Single Variant Section -->
//                     <div id="single-variant-section" class="variant-section">
//                         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                                 <label class="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
//                                 <input type="number" name="quantity" min="1" 
//                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                                       placeholder="100">
//                             </div>
//                             <div>
//                                 <label class="block text-sm font-medium text-gray-700 mb-1">Size (Optional)</label>
//                                 <input type="text" name="size" 
//                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                                       placeholder="e.g., M, L, XL">
//                             </div>
//                         </div>
//                         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                                 <label class="block text-sm font-medium text-gray-700 mb-1">MFG Date</label>
//                                 <input type="text" name="mfgDate" 
//                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                                       placeholder="YYYY-MM">
//                             </div>
//                             <div>
//                                 <label class="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
//                                 <input type="text" name="expiryDate" required
//                                       class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                                       placeholder="YYYY-MM">
//                             </div>
//                         </div>
//                     </div>
                    
//                     <!-- Multiple Variants Section -->
//                     <div id="multiple-variants-section" class="variant-section hidden">
//                         <div class="mb-4">
//                             <label class="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
//                             <select name="stockStatus" 
//                                     class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
//                                 <option value="AVAILABLE">Available</option>
//                                 <option value="LOW_STOCK">Low Stock</option>
//                                 <option value="DAMAGED">Damaged</option>
//                                 <option value="EXPIRED">Expired</option>
//                             </select>
//                         </div>
                        
//                         <div id="variants-container" class="space-y-4">
//                             <!-- Variant entries will be added here -->
//                         </div>
                        
//                         <button type="button" id="add-variant-btn" class="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium">
//                             + Add Size Variant
//                         </button>
//                     </div>
                    
//                     <!-- Single Variant: Stock Status (only shown for single variant) -->
//                     <div id="single-stock-status-section" class="variant-section mt-4">
//                         <label class="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
//                         <select name="stockStatus" 
//                                 class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
//                             <option value="AVAILABLE">Available</option>
//                             <option value="LOW_STOCK">Low Stock</option>
//                             <option value="DAMAGED">Damaged</option>
//                             <option value="EXPIRED">Expired</option>
//                         </select>
//                     </div>
                    
//                     <button type="submit" 
//                             class="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition-colors font-medium mt-4">
//                         Add Batch
//                     </button>
//                 </form>
//             </div>
            
//             ${batchTableHTML}
//         `;
        
//         $('#batchModalContent').html(html);
//         $('#batchModalTitle').text('Manage Batches - ' + (product.title || product.productName || 'Product'));
//         $('#batchModal').show();
        
//         // Setup variant type toggle
//         setupVariantTypeToggle();
        
//         // Add first variant row for multiple variants
//         setTimeout(() => {
//             if ($('#variants-container').children().length === 0) {
//                 addVariantRow();
//             }
//         }, 100);
        
//         // Attach form submit event
//         $('#add-specific-batch-form-mb').off('submit').on('submit', async function(e) {
//             e.preventDefault();
//             await addNewBatchForMBProduct($(this).serializeArray());
//         });
        
//     } catch (error) {
//         console.error('Error loading MB batch modal:', error);
//         showErrorToast('Failed to load MB batch information');
//     } finally {
//         hideLoader();
//     }
// }

// // ADD NEW BATCH FUNCTIONS - UPDATED for unified API
// async function addNewBatchForProduct(formDataArray) {
//     try {
//         showLoader();
        
//         // Get variant type
//         const variantType = formDataArray.find(item => item.name === 'variantType')?.value || 'single';
//         const productId = formDataArray.find(item => item.name === 'productId')?.value;
        
//         if (!productId) {
//             showErrorToast('Product ID is required');
//             hideLoader();
//             return;
//         }
        
//         let payload = {
//             batchNo: formDataArray.find(item => item.name === 'batchNo')?.value,
//             productId: parseInt(productId),
//             stockStatus: formDataArray.find(item => item.name === 'stockStatus')?.value || 'AVAILABLE'
//         };
        
//         if (variantType === 'single') {
//             // Single variant format
//             const quantity = formDataArray.find(item => item.name === 'quantity')?.value;
//             const size = formDataArray.find(item => item.name === 'size')?.value || null;
//             const mfgDate = formDataArray.find(item => item.name === 'mfgDate')?.value;
//             const expiryDate = formDataArray.find(item => item.name === 'expiryDate')?.value;
            
//             if (!payload.batchNo || !quantity || !expiryDate) {
//                 showErrorToast('Please fill in required fields: Batch No, Quantity, and Expiry Date');
//                 hideLoader();
//                 return;
//             }
            
//             payload.quantity = parseInt(quantity);
//             payload.size = size;
//             payload.mfgDate = mfgDate || null;
//             payload.expiryDate = expiryDate;
            
//         } else {
//             // Multiple variants format
//             const variantsContainer = document.getElementById('variants-container');
//             const variantRows = variantsContainer.querySelectorAll('.variant-row');
            
//             if (variantRows.length === 0) {
//                 showErrorToast('Please add at least one size variant');
//                 hideLoader();
//                 return;
//             }
            
//             const variants = [];
//             variantRows.forEach(row => {
//                 const size = row.querySelector('input[data-field="size"]').value;
//                 const quantity = row.querySelector('input[data-field="quantity"]').value;
//                 const mfgDate = row.querySelector('input[data-field="mfgDate"]').value;
//                 const expiryDate = row.querySelector('input[data-field="expiryDate"]').value;
                
//                 if (!size || !quantity || !expiryDate) {
//                     showErrorToast('All variant fields are required: Size, Quantity, and Expiry Date');
//                     hideLoader();
//                     return;
//                 }
                
//                 variants.push({
//                     size,
//                     quantity: parseInt(quantity),
//                     mfgDate: mfgDate || null,
//                     expiryDate
//                 });
//             });
            
//             payload.variants = variants;
//         }
        
//         console.log('Adding batch with data:', payload);
        
//         const response = await fetch(`${INVENTORY_API}/add-batch`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(payload)
//         });
        
//         if (!response.ok) {
//             const errorText = await response.text();
//             throw new Error(`HTTP ${response.status}: ${errorText}`);
//         }
        
//         const result = await response.text();
//         console.log('Batch add response:', result);
        
//         showSuccessToast('Batch added successfully!');
        
//         // Refresh data
//         await fetchAllProducts();
        
//         // Reload batch modal
//         if (currentProductId && currentProductType === 'regular') {
//             await showBatchManagementModal(currentProductId);
//         }
        
//     } catch (error) {
//         console.error('Error adding batch:', error);
//         showErrorToast(`Failed to add batch: ${error.message}`);
//     } finally {
//         hideLoader();
//     }
// }

// async function addNewBatchForMBProduct(formDataArray) {
//     try {
//         showLoader();
        
//         // Get variant type
//         const variantType = formDataArray.find(item => item.name === 'variantType')?.value || 'single';
//         const mbpId = formDataArray.find(item => item.name === 'mbpId')?.value;
        
//         if (!mbpId) {
//             showErrorToast('Product ID is required');
//             hideLoader();
//             return;
//         }
        
//         let payload = {
//             batchNo: formDataArray.find(item => item.name === 'batchNo')?.value,
//             mbpId: parseInt(mbpId),
//             stockStatus: formDataArray.find(item => item.name === 'stockStatus')?.value || 'AVAILABLE'
//         };
        
//         if (variantType === 'single') {
//             // Single variant format
//             const quantity = formDataArray.find(item => item.name === 'quantity')?.value;
//             const size = formDataArray.find(item => item.name === 'size')?.value || null;
//             const mfgDate = formDataArray.find(item => item.name === 'mfgDate')?.value;
//             const expiryDate = formDataArray.find(item => item.name === 'expiryDate')?.value;
            
//             if (!payload.batchNo || !quantity || !expiryDate) {
//                 showErrorToast('Please fill in required fields: Batch No, Quantity, and Expiry Date');
//                 hideLoader();
//                 return;
//             }
            
//             payload.quantity = parseInt(quantity);
//             payload.size = size;
//             payload.mfgDate = mfgDate || null;
//             payload.expiryDate = expiryDate;
            
//         } else {
//             // Multiple variants format
//             const variantsContainer = document.getElementById('variants-container');
//             const variantRows = variantsContainer.querySelectorAll('.variant-row');
            
//             if (variantRows.length === 0) {
//                 showErrorToast('Please add at least one size variant');
//                 hideLoader();
//                 return;
//             }
            
//             const variants = [];
//             variantRows.forEach(row => {
//                 const size = row.querySelector('input[data-field="size"]').value;
//                 const quantity = row.querySelector('input[data-field="quantity"]').value;
//                 const mfgDate = row.querySelector('input[data-field="mfgDate"]').value;
//                 const expiryDate = row.querySelector('input[data-field="expiryDate"]').value;
                
//                 if (!size || !quantity || !expiryDate) {
//                     showErrorToast('All variant fields are required: Size, Quantity, and Expiry Date');
//                     hideLoader();
//                     return;
//                 }
                
//                 variants.push({
//                     size,
//                     quantity: parseInt(quantity),
//                     mfgDate: mfgDate || null,
//                     expiryDate
//                 });
//             });
            
//             payload.variants = variants;
//         }
        
//         console.log('Adding MB batch with data:', payload);
        
//         const response = await fetch(`${INVENTORY_API}/add-batch`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(payload)
//         });
        
//         if (!response.ok) {
//             const errorText = await response.text();
//             throw new Error(`HTTP ${response.status}: ${errorText}`);
//         }
        
//         const result = await response.text();
//         console.log('MB Batch add response:', result);
        
//         showSuccessToast('Batch added successfully!');
        
//         // Refresh data
//         await fetchAllProducts();
        
//         // Reload batch modal
//         if (currentProductId && currentProductType === 'mb') {
//             await showBatchManagementModalMB(currentProductId);
//         }
        
//     } catch (error) {
//         console.error('Error adding batch for MB product:', error);
//         showErrorToast(`Failed to add batch: ${error.message}`);
//     } finally {
//         hideLoader();
//     }
// }

// // EDIT BATCH FUNCTION - UPDATED for fetching batch details
// async function editBatch(batchId) {
//     try {
//         showLoader();
        
//         // Fetch batch details using the correct API endpoint
//         const response = await fetch(`${INVENTORY_API}/get-all-batches?size=1000`);
//         if (!response.ok) throw new Error(`Failed to fetch batches`);
        
//         const data = await response.json();
//         const batch = data.data.find(b => b.inventoryId === batchId);
        
//         if (!batch) {
//             showErrorToast('Batch not found');
//             hideLoader();
//             return;
//         }
        
//         currentBatchId = batchId;
        
//         // Determine product type
//         const isMBProduct = batch.mbpId !== null && batch.mbpId !== undefined;
        
//         const html = `
//             <div class="mb-6">
//                 <h4 class="font-medium mb-3 text-gray-700">Edit Batch</h4>
//                 <form id="edit-batch-form" class="space-y-4 p-4 border rounded-lg bg-gray-50">
//                     <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div>
//                             <label class="block text-sm font-medium text-gray-700 mb-1">Batch Number *</label>
//                             <input type="text" name="batchNo" value="${batch.batchNo || ''}" required 
//                                   class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
//                         </div>
//                         <div>
//                             <label class="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
//                             <input type="number" name="quantity" value="${batch.quantity || 0}" required min="1" 
//                                   class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
//                         </div>
//                     </div>
//                     <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div>
//                             <label class="block text-sm font-medium text-gray-700 mb-1">Size</label>
//                             <input type="text" name="size" value="${batch.size || ''}" 
//                                   class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
//                         </div>
//                         <div>
//                             <label class="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
//                             <select name="stockStatus" 
//                                     class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
//                                 <option value="AVAILABLE" ${batch.stockStatus === 'AVAILABLE' ? 'selected' : ''}>Available</option>
//                                 <option value="LOW_STOCK" ${batch.stockStatus === 'LOW_STOCK' ? 'selected' : ''}>Low Stock</option>
//                                 <option value="DAMAGED" ${batch.stockStatus === 'DAMAGED' ? 'selected' : ''}>Damaged</option>
//                                 <option value="EXPIRED" ${batch.stockStatus === 'EXPIRED' ? 'selected' : ''}>Expired</option>
//                             </select>
//                         </div>
//                     </div>
//                     <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div>
//                             <label class="block text-sm font-medium text-gray-700 mb-1">MFG Date</label>
//                             <input type="text" name="mfgDate" value="${batch.mfgDate ? batch.mfgDate.split('T')[0] : ''}" 
//                                   class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                                   placeholder="YYYY-MM">
//                         </div>
//                         <div>
//                             <label class="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
//                             <input type="text" name="expDate" value="${batch.expDate ? batch.expDate.split('T')[0] : ''}" required 
//                                   class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                                   placeholder="YYYY-MM">
//                         </div>
//                     </div>
//                     <div class="flex gap-3">
//                         <button type="submit" 
//                                 class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
//                             Update Batch
//                         </button>
//                         <button type="button" onclick="cancelEdit()" 
//                                 class="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium">
//                             Cancel
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         `;
        
//         $('#batchModalContent').html(html);
//         $('#batchModalTitle').text('Edit Batch - ' + (batch.batchNo || 'Batch'));
        
//         // Store context for cancel
//         if (isMBProduct && batch.mbpId) {
//             currentProductId = batch.mbpId;
//             currentProductType = 'mb';
//         } else if (batch.productId) {
//             currentProductId = batch.productId;
//             currentProductType = 'regular';
//         }
        
//         // Attach form submit event
//         $('#edit-batch-form').off('submit').on('submit', async function(e) {
//             e.preventDefault();
//             await updateBatch($(this).serializeArray());
//         });
        
//     } catch (error) {
//         console.error('Error loading batch for edit:', error);
//         showErrorToast('Failed to load batch details');
//     } finally {
//         hideLoader();
//     }
// }

// // UPDATE BATCH FUNCTION - UPDATED for PATCH API
// async function updateBatch(formDataArray) {
//     try {
//         showLoader();
        
//         const batchData = {};
//         formDataArray.forEach(item => {
//             if (item.value !== undefined && item.value !== null && item.value !== '') {
//                 if (item.name === 'quantity') {
//                     batchData[item.name] = parseInt(item.value);
//                 } else {
//                     batchData[item.name] = item.value;
//                 }
//             }
//         });
        
//         console.log('Updating batch with data:', batchData);
        
//         // Send PATCH request to update batch
//         const response = await fetch(`${INVENTORY_API}/update-batch-by-inventoryId/${currentBatchId}`, {
//             method: 'PATCH',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(batchData)
//         });
        
//         if (!response.ok) {
//             const errorText = await response.text();
//             throw new Error(`HTTP ${response.status}: ${errorText}`);
//         }
        
//         const result = await response.text();
//         console.log('Batch update response:', result);
        
//         showSuccessToast('Batch updated successfully!');
        
//         // Refresh data based on context
//         await fetchAllProducts();
        
//         if (currentProductId) {
//             if (currentProductType === 'mb') {
//                 await showBatchManagementModalMB(currentProductId);
//             } else {
//                 await showBatchManagementModal(currentProductId);
//             }
//         } else {
//             closeModal('batchModal');
//         }
        
//     } catch (error) {
//         console.error('Error updating batch:', error);
//         showErrorToast(`Failed to update batch: ${error.message}`);
//     } finally {
//         hideLoader();
//     }
// }

// function cancelEdit() {
//     if (currentProductId) {
//         if (currentProductType === 'mb') {
//             showBatchManagementModalMB(currentProductId);
//         } else {
//             showBatchManagementModal(currentProductId);
//         }
//     } else {
//         closeModal('batchModal');
//     }
// }

// // DELETE BATCH FUNCTIONS
// function showDeleteBatchConfirm(batchId) {
//     currentBatchId = batchId;
//     $('#deleteModal').show();
// }

// async function deleteBatch() {
//     if (!currentBatchId) return;
    
//     try {
//         showLoader();
        
//         const response = await fetch(`${INVENTORY_API}/delete-batch/${currentBatchId}`, {
//             method: 'DELETE'
//         });
        
//         if (!response.ok) {
//             const errorText = await response.text();
//             throw new Error(`HTTP ${response.status}: ${errorText}`);
//         }
        
//         const result = await response.text();
//         console.log('Batch delete response:', result);
        
//         showSuccessToast('Batch deleted successfully!');
        
//         // Refresh data
//         await fetchAllProducts();
        
//         if (currentProductId) {
//             if (currentProductType === 'mb') {
//                 await showBatchManagementModalMB(currentProductId);
//             } else {
//                 await showBatchManagementModal(currentProductId);
//             }
//         }
        
//         closeModal('deleteModal');
        
//     } catch (error) {
//         console.error('Error deleting batch:', error);
//         showErrorToast(`Failed to delete batch: ${error.message}`);
//     } finally {
//         hideLoader();
//         currentBatchId = null;
//     }
// }

// // OTHER FUNCTIONS
// // async function handleBulkUpload(e) {
// //     e.preventDefault();
    
// //     const excelFile = $('#bulkExcelInput')[0].files[0];
// //     if (!excelFile) {
// //         showErrorToast('Please select an Excel file');
// //         return;
// //     }
    
// //     try {
// //         showLoader();
        
// //         const formData = new FormData();
// //         formData.append('excelFile', excelFile);
        
// //         const imagesFile = $('#bulkImagesInput')[0].files[0];
// //         if (imagesFile) {
// //             formData.append('productImages', imagesFile);
// //         }
        
// //         const response = await fetch(`${PRODUCTS_API}/bulk-upload`, {
// //             method: 'POST',
// //             body: formData
// //         });
        
// //         if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
// //         const result = await response.json();
        
// //         let message = `Uploaded: ${result.uploadedCount || 0}, Skipped: ${result.skippedCount || 0}`;
// //         if (result.skippedReasons && result.skippedReasons.length > 0) {
// //             message += '\n\nSkipped Reasons:\n' + result.skippedReasons.join('\n');
// //         }
        
// //         alert(message);
// //         showSuccessToast('Bulk upload completed!');
        
// //         await fetchAllProducts();
        
// //         closeModal('bulkUploadModal');
        
// //     } catch (error) {
// //         console.error('Error during bulk upload:', error);
// //         showErrorToast('Bulk upload failed');
// //     } finally {
// //         hideLoader();
// //     }
// // }


// async function handleBulkUpload(e) {
//     e.preventDefault();

//     const excelInput = document.getElementById('bulkExcelInput');
//     const imagesInput = document.getElementById('bulkImagesInput');
//     const submitButton = e.target.querySelector('button[type="submit"]');

//     const excelFile = excelInput.files[0];

//     if (!excelFile) {
//         showErrorToast('Please select an Excel file');
//         return;
//     }

//     // Prevent double-click / spam submit
//     if (submitButton.disabled) return;
//     submitButton.disabled = true;

//     try {
//         showLoader();

//         const formData = new FormData();
//         formData.append('excelFile', excelFile);

//         // Append all images (fresh reference)
//         const imageFiles = imagesInput.files;
//         for (let i = 0; i < imageFiles.length; i++) {
//             formData.append('productImages', imageFiles[i]);
//         }

//         // Optional: small delay to ensure file handles are stable (helps in some cases)
//         await new Promise(resolve => setTimeout(resolve, 300));

//         const response = await fetch(`${PRODUCTS_API}/bulk-upload`, {
//             method: 'POST',
//             body: formData,
//             // Important: Do NOT set Content-Type manually — browser sets multipart/form-data with boundary
//         });

//         if (!response.ok) {
//             const errorText = await response.text().catch(() => '');
//             throw new Error(`Server responded with ${response.status}: ${errorText || 'No details'}`);
//         }

//         const result = await response.json();

//         let message = `Uploaded: ${result.uploadedCount || 0}, Skipped: ${result.skippedCount || 0}`;

//         if (result.skippedReasons?.length) {
//             message += '\n\nDetails:\n' + result.skippedReasons.join('\n');
//         }

//         showSuccessToast('Bulk upload completed!');
//         alert(message); // or replace with nicer modal/toast

//         await fetchAllProducts();
//         closeModal('bulkUploadModal');

//     } catch (error) {
//         console.error('Bulk upload error:', error);

//         let userMessage = 'Bulk upload failed. Please try again.';

//         if (error.message.includes('ERR_UPLOAD_FILE_CHANGED') || 
//             error.message.includes('changed') || 
//             error.message.includes('stale')) {
//             userMessage = 'Upload failed: The selected file(s) changed or became unavailable. Please re-select the Excel file and images.';
//         } else if (error.message.includes('NetworkError') || error.message === 'Failed to fetch') {
//             userMessage = 'Network issue or file reference expired. Re-select files and try again.';
//         }

//         showErrorToast(userMessage);

//     } finally {
//         // Always re-enable button and CLEAR inputs (critical for ERR_UPLOAD_FILE_CHANGED fix)
//         submitButton.disabled = false;
//         excelInput.value = '';     // ← forces re-selection next time
//         imagesInput.value = '';    // ← same for images
//         hideLoader();
//     }
// }


// // Search Functionality
// function debounce(func, wait) {
//     let timeout;
//     return function executedFunction(...args) {
//         const later = () => {
//             clearTimeout(timeout);
//             func(...args);
//         };
//         clearTimeout(timeout);
//         timeout = setTimeout(later, wait);
//     };
// }

// function searchProducts() {
//     const searchTerm = $('#search-input').val().toLowerCase();
    
//     if (!searchTerm) {
//         updateDataTable(inventory);
//         return;
//     }
    
//     const filtered = inventory.filter(product => {
//         const productName = product.productType === 'mb' ? 
//             product.title : product.productName;
//         const brandName = product.productType === 'mb' ? 
//             product.brand : product.brandName;
//         const sku = product.sku || '';
//         const category = product.productType === 'mb' ? 
//             product.category : product.productCategory;
        
//         return (
//             productName.toLowerCase().includes(searchTerm) ||
//             brandName.toLowerCase().includes(searchTerm) ||
//             sku.toLowerCase().includes(searchTerm) ||
//             category.toLowerCase().includes(searchTerm)
//         );
//     });
    
//     updateDataTable(filtered);
// }

// // Filter Functions
// function filterByCategory() {
//     const category = $('#filter-category').val();
//     if (!category) {
//         updateDataTable(inventory);
//         return;
//     }
    
//     const filtered = inventory.filter(product => {
//         const productCategory = product.productType === 'mb' ? 
//             (product.category || product.productCategory) : 
//             product.productCategory;
//         return productCategory === category;
//     });
    
//     updateDataTable(filtered);
// }

// function filterByStock() {
//     const stockFilter = $('#filter-stock').val();
//     if (!stockFilter) {
//         updateDataTable(inventory);
//         return;
//     }
    
//     const filtered = inventory.filter(product => {
//         const quantity = product.productType === 'mb' ? 
//             (product.stockQuantity || 0) : 
//             (product.productQuantity || 0);
        
//         switch(stockFilter) {
//             case 'in-stock':
//                 return quantity > 10;
//             case 'low-stock':
//                 return quantity > 0 && quantity <= 10;
//             case 'out-of-stock':
//                 return quantity === 0;
//             default:
//                 return true;
//         }
//     });
    
//     updateDataTable(filtered);
// }

// // Helper Functions
// function getCategoryBadgeClass(category) {
//     if (!category) return 'category-medicine';
    
//     const categoryLower = category.toLowerCase();
    
//     if (categoryLower.includes('medicine') || categoryLower.includes('healthcare') || categoryLower === 'pharmacy') {
//         return 'category-medicine';
//     } else if (categoryLower.includes('mother') || categoryLower.includes('maternity')) {
//         return 'category-mothercare';
//     } else if (categoryLower.includes('baby') || categoryLower.includes('infant')) {
//         return 'category-babycare';
//     } else if (categoryLower.includes('wellness') || categoryLower.includes('personal care')) {
//         return 'category-wellness';
//     } else if (categoryLower.includes('device') || categoryLower.includes('equipment')) {
//         return 'category-devices';
//     } else if (categoryLower.includes('surgical') || categoryLower.includes('speciality')) {
//         return 'category-speciality';
//     } else {
//         return 'category-medicine';
//     }
// }

// function getStockClass(quantity) {
//     if (quantity === 0) return 'stock-out';
//     if (quantity <= 10) return 'stock-low';
//     return 'stock-available';
// }

// // Export Functions
// function exportToExcel() {
//     try {
//         const wsData = [
//             ['ID', 'Product Type', 'Product Name', 'SKU', 'Category', 'Sub Category', 'Brand', 'Quantity', 'Price', 'Old Price', 'Expiry Date', 'Status', 'Prescription Required']
//         ];
        
//         inventory.forEach(product => {
//             const productType = product.productType === 'mb' ? 'Mother & Baby Care' : 'Medicine';
//             const productName = product.productType === 'mb' ? product.title : product.productName;
//             const sku = product.sku || '';
//             const category = product.productType === 'mb' ? 
//                 (product.category || product.productCategory) : 
//                 product.productCategory;
//             const subCategory = product.productType === 'mb' ? 
//                 product.subCategory : 
//                 product.productSubCategory;
//             const brand = product.productType === 'mb' ? product.brand : product.brandName;
//             const quantity = product.productType === 'mb' ? product.stockQuantity : product.productQuantity;
//             const price = product.productType === 'mb' ? 
//                 (product.price && product.price.length > 0 ? product.price[0] : 0) : 
//                 (Array.isArray(product.productPrice) ? product.productPrice[0] || 0 : product.productPrice || 0);
//             const oldPrice = product.productType === 'mb' ? 
//                 (product.originalPrice && product.originalPrice.length > 0 ? product.originalPrice[0] : 0) : 
//                 (Array.isArray(product.productOldPrice) ? product.productOldPrice[0] || 0 : product.productOldPrice || 0);
//             const status = product.productType === 'mb' ? 
//                 (product.inStock ? 'Available' : 'Out of Stock') : 
//                 product.productStatus;
            
//             wsData.push([
//                 product.productId || product.id,
//                 productType,
//                 productName,
//                 sku,
//                 category || '',
//                 subCategory || '',
//                 brand || '',
//                 quantity || 0,
//                 price,
//                 oldPrice,
//                 product.expDate || '',
//                 status || '',
//                 product.prescriptionRequired ? 'Yes' : 'No'
//             ]);
//         });
        
//         const ws = XLSX.utils.aoa_to_sheet(wsData);
//         const wb = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
//         XLSX.writeFile(wb, `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        
//         showSuccessToast('Export completed successfully!');
        
//     } catch (error) {
//         console.error('Error exporting to Excel:', error);
//         showErrorToast('Failed to export data');
//     }
// }

// function downloadTemplate() {
//     const wsData = [
//         ['productName', 'productCategory', 'productSubCategory', 'productPrice', 'productOldPrice', 'productStock', 'productStatus', 'productDescription', 'productQuantity', 'prescriptionRequired', 'brandName', 'mfgDate', 'expDate', 'batchNo', 'benefitsList', 'directionsList', 'ingredientsList', 'productSizes', 'mainImage', 'subImages', 'dynamicFields'],
//         ['Paracetamol 500mg', 'Medicines & Healthcare', 'Pain Relievers', '15.99', '18.99', 'In-Stock', 'Available', 'For fever and pain relief', '100', 'false', 'Generic', '2025-01-01', '2027-01-01', 'BATCH-2025-001', 'Fever relief,Pain relief', 'Take 1 tablet every 6 hours', 'Paracetamol 500mg', '10 tablets,20 tablets', 'paracetamol.jpg', 'image1.jpg,image2.jpg', 'storageCondition:Room Temperature,strength:500mg']
//     ];
    
//     const ws = XLSX.utils.aoa_to_sheet(wsData);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Template');
//     XLSX.writeFile(wb, 'inventory_template.xlsx');
// }

// // Utility Functions
// function closeModal(modalId) {
//     $(`#${modalId}`).hide();
    
//     if (modalId === 'batchModal') {
//         currentProductId = null;
//         currentProductType = null;
//         currentBatchId = null;
//     }
// }

// function showLoader() {
//     $('#loader').removeClass('hidden');
// }

// function hideLoader() {
//     $('#loader').addClass('hidden');
// }

// function showSuccessToast(message) {
//     Toastify({
//         text: message,
//         duration: 3000,
//         style: { background: 'linear-gradient(to right, #00b09b, #96c93d)' }
//     }).showToast();
// }

// function showErrorToast(message) {
//     Toastify({
//         text: message,
//         duration: 3000,
//         style: { background: 'linear-gradient(to right, #ff5e62, #f09819)' }
//     }).showToast();
// }

// // ===== VARIANT HANDLING FUNCTIONS =====

// function setupVariantTypeToggle() {
//     // Toggle between single and multiple variant sections
//     $(document).off('change', '.variant-type-radio').on('change', '.variant-type-radio', function() {
//         const variantType = $(this).val();
        
//         if (variantType === 'single') {
//             // Show single variant section, hide multiple
//             $('#single-variant-section').removeClass('hidden').show();
//             $('#single-stock-status-section').removeClass('hidden').show();
//             $('#multiple-variants-section').addClass('hidden').hide();
//         } else {
//             // Show multiple variants section, hide single
//             $('#single-variant-section').addClass('hidden').hide();
//             $('#single-stock-status-section').addClass('hidden').hide();
//             $('#multiple-variants-section').removeClass('hidden').show();
            
//             // Add first variant if container is empty
//             if ($('#variants-container').children().length === 0) {
//                 addVariantRow();
//             }
//         }
//     });
    
//     // Handle add variant button
//     $(document).off('click', '#add-variant-btn').on('click', '#add-variant-btn', function(e) {
//         e.preventDefault();
//         addVariantRow();
//     });
// }

// function addVariantRow() {
//     const variantIndex = $('#variants-container').children('.variant-row').length;
//     const variantRow = `
//         <div class="variant-row p-4 border rounded-lg bg-white space-y-4">
//             <div class="flex justify-between items-start">
//                 <h5 class="font-medium text-gray-700">Size Variant ${variantIndex + 1}</h5>
//                 <button type="button" onclick="removeVariantRow(this)" class="text-red-600 hover:text-red-800 font-medium">
//                     <i class="fas fa-trash-alt"></i> Remove
//                 </button>
//             </div>
            
//             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                     <label class="block text-sm font-medium text-gray-700 mb-1">Size *</label>
//                     <input type="text" data-field="size" required 
//                           class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                           placeholder="e.g., S, M, L, XL">
//                 </div>
//                 <div>
//                     <label class="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
//                     <input type="number" data-field="quantity" required min="1" 
//                           class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                           placeholder="100">
//                 </div>
//             </div>
            
//             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                     <label class="block text-sm font-medium text-gray-700 mb-1">MFG Date</label>
//                     <input type="text" data-field="mfgDate" 
//                           class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                           placeholder="YYYY-MM">
//                 </div>
//                 <div>
//                     <label class="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
//                     <input type="text" data-field="expiryDate" required
//                           class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
//                           placeholder="YYYY-MM">
//                 </div>
//             </div>
//         </div>
//     `;
    
//     $('#variants-container').append(variantRow);
// }

// function removeVariantRow(button) {
//     $(button).closest('.variant-row').remove();
// }

// // Make functions available globally
// window.showBatchManagementModal = showBatchManagementModal;
// window.showBatchManagementModalMB = showBatchManagementModalMB;
// window.editBatch = editBatch;
// window.showDeleteBatchConfirm = showDeleteBatchConfirm;
// window.closeModal = closeModal;
// window.viewProduct = viewProduct;
// window.editProduct = editProduct;
// window.deleteProduct = deleteProduct;
// window.removeVariantRow = removeVariantRow;
// window.setupVariantTypeToggle = setupVariantTypeToggle;
// window.addVariantRow = addVariantRow;
// window.saveProductChanges = saveProductChanges;





















