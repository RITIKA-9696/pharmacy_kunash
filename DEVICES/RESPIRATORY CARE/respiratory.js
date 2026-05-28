// respiratory.js - Complete Respiratory Care with PROPER Backend Connectivity + Backend Wishlist Sync
// =============== BACKEND CONFIGURATION ===============
const RESPIRATORY_API_CONFIG = {
    BASE_URL: 'http://localhost:8083/api/products', // ← Correct port from your working pages
    BASE_URL_IMG: 'http://localhost:8083'
};

function getCurrentUserId() {
    try {
        const userData = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
        if (!userData) return null;
        const user = JSON.parse(userData);
        const id = user.userId || user.id || user.userID;
        return id ? Number(id) : null;
    } catch (error) {
        console.error('Error reading currentUser:', error);
        return null;
    }
}

console.log("====getCurrentUserId function returns :", getCurrentUserId());

const WISHLIST_API_BASE = "http://localhost:8083/api/wishlist";
const CURRENT_USER_ID = getCurrentUserId(); // Update if you fetch user dynamically
let wishlist = [];

// =============== WISHLIST BACKEND SYNC ===============
async function addToWishlistBackend(productId) {
    try {
        const response = await fetch(`${WISHLIST_API_BASE}/add-wishlist-items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: CURRENT_USER_ID,
                productId: productId,
                productType: "MEDICINE" // Adjust if backend expects different type for respiratory products
            })
        });
        if (response.ok) {
            console.log("✅ Backend: Added to wishlist");
            return true;
        }
    } catch (err) {
        console.error("❌ Error adding to wishlist backend:", err);
    }
    return false;
}

async function removeFromWishlistBackend(productId) {
    try {
        const response = await fetch(`${WISHLIST_API_BASE}/remove-wishlist-items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: CURRENT_USER_ID,
                productId: productId,
                productType: "MEDICINE" // Adjust if needed
            })
        });
        if (response.ok) {
            console.log("✅ Backend: Removed from wishlist");
            return true;
        }
    } catch (err) {
        console.error("❌ Error removing from wishlist backend:", err);
    }
    return false;
}

// async function loadWishlistFromBackend() {
//     if (!CURRENT_USER_ID) {
//         console.log("No user logged in, skipping wishlist load");
//         return;
//     }
//     try {
//         const response = await fetch(`${WISHLIST_API_BASE}/get-wishlist-items?userId=${CURRENT_USER_ID}`);
//         if (response.ok) {
//             const backendItems = await response.json();
//             console.log("✅ Loaded wishlist from backend:", backendItems.length, "items");
//             wishlist = backendItems.map(item => ({
//                 productId: item.productId || item.id
//             }));
//             updateHeaderWishlistCount();
//             renderInitialProducts(); // Refresh heart icons
//         }
//     } catch (err) {
//         console.error("❌ Failed to load wishlist from backend:", err);
//     }
// }



async function loadWishlistFromBackend() {
    if (!CURRENT_USER_ID) {
        console.log("No user logged in — skipping wishlist load");
        wishlist = []; // Ensure empty
        updateHeaderWishlistCount();
        renderInitialProducts(); // Refresh icons (all empty hearts)
        return;
    }

    try {
        const response = await fetch(`${WISHLIST_API_BASE}/get-wishlist-items?userId=${CURRENT_USER_ID}`);
        if (response.ok) {
            const backendItems = await response.json();
            console.log("✅ Loaded wishlist from backend:", backendItems.length, "items");
            wishlist = backendItems.map(item => ({
                productId: item.productId || item.id
            }));
            updateHeaderWishlistCount();
            renderInitialProducts(); // Refresh heart icons
        } else {
            console.warn("Failed to load wishlist — non-OK response");
            wishlist = [];
            updateHeaderWishlistCount();
        }
    } catch (err) {
        console.error("❌ Failed to load wishlist from backend:", err);
        wishlist = [];
        updateHeaderWishlistCount();
    }
}

// ==================== RESET DESKTOP FILTERS ====================
function resetDesktopFilters() {
  console.log('Resetting desktop filters to default...');
  
  // 1. Reset currentFilters to default values
  currentFilters = {
    category: 'all',
    brand: 'all',
    discount: 'all',
    minPrice: 0,
    maxPrice: 50000
  };
  
  // 2. Reset all desktop UI elements
  
  // Reset category radio to "All Categories"
  const allCategoryRadio = document.querySelector('#filterSidebar input[name="category"][value="all"]');
  if (allCategoryRadio) {
    allCategoryRadio.checked = true;
    // Trigger change event to update state
    allCategoryRadio.dispatchEvent(new Event('change'));
  }
  
  // Reset brand radio to "All Brands"
  const allBrandRadio = document.querySelector('#filterSidebar input[name="brand"][value="all"]');
  if (allBrandRadio) {
    allBrandRadio.checked = true;
    allBrandRadio.dispatchEvent(new Event('change'));
  }
  
  // Reset discount radio to "All Products"
  const allDiscountRadio = document.querySelector('#filterSidebar input[name="discount"][value="all"]');
  if (allDiscountRadio) {
    allDiscountRadio.checked = true;
    allDiscountRadio.dispatchEvent(new Event('change'));
  }
  
  // Reset price sliders
  const desktopMin = document.getElementById('minThumb');
  const desktopMax = document.getElementById('maxThumb');
  const desktopMinVal = document.getElementById('minValue');
  const desktopMaxVal = document.getElementById('maxValue');
  
  if (desktopMin && desktopMax) {
    desktopMin.value = 0;
    desktopMax.value = 50000;
    
    // Update displayed values
    if (desktopMinVal) desktopMinVal.textContent = '₹0';
    if (desktopMaxVal) desktopMaxVal.textContent = '₹50000';
    
    // Update slider visual
    if (typeof updateDesktopSlider === 'function') {
      updateDesktopSlider();
    }
    
    // Trigger input events to update filter state
    desktopMin.dispatchEvent(new Event('input'));
    desktopMax.dispatchEvent(new Event('input'));
  }
  
  // Reset sort dropdown to default
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.value = 'default';
    // Trigger change event
    sortSelect.dispatchEvent(new Event('change'));
  }
  
  // 3. Reset mobile filter UI state (sync with desktop)
  const mobileAllCategory = document.querySelector('#filterSheet input[name="mobileCategory"][value="all"]');
  const mobileAllBrand = document.querySelector('#filterSheet input[name="mobileBrand"][value="all"]');
  const mobileAllDiscount = document.querySelector('#filterSheet input[name="mobileDiscount"][value="all"]');
  
  if (mobileAllCategory) mobileAllCategory.checked = true;
  if (mobileAllBrand) mobileAllBrand.checked = true;
  if (mobileAllDiscount) mobileAllDiscount.checked = true;
  
  // 4. Apply filters with reset values
  applyFilters();
  
  // 5. Show confirmation message
  showToast("All filters have been reset");
  
  console.log('Desktop filters reset to default values:', currentFilters);
}

// Helper function to reset radio groups
function resetRadioGroup(groupName, value) {
  const radios = document.querySelectorAll(`#filterSidebar input[name="${groupName}"]`);
  radios.forEach(radio => {
    radio.checked = radio.value === value;
  });
  
  // Also update mobile filter sheet
  const mobileRadios = document.querySelectorAll(`#filterSheet input[name="mobile${groupName.charAt(0).toUpperCase() + groupName.slice(1)}"]`);
  mobileRadios.forEach(radio => {
    radio.checked = radio.value === value;
  });
}

function updateHeaderWishlistCount() {
    const el = document.getElementById('wishlistCount');
    if (el) {
        el.textContent = wishlist.length;
        el.classList.toggle('hidden', wishlist.length === 0);
    }
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.className = "fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full z-50 shadow-lg";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// =============== UTILITY FUNCTIONS ===============
async function fetchRespiratoryProducts() {
    try {
        // Using the reliable and working endpoint (same as Mobility & Monitoring)
        const url = `${RESPIRATORY_API_CONFIG.BASE_URL}/get-by-category/${encodeURIComponent('Respiratory Care')}`;
        console.log('Fetching respiratory products from:', url);
       
        const response = await fetch(url);
       
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
       
        const products = await response.json();
        console.log('Received respiratory products:', products.length);
        return products;
       
    } catch (error) {
        console.error('Error fetching respiratory products:', error);
        return [];
    }
}

async function fetchProductDetails(productId) {
    try {
        const response = await fetch(`${RESPIRATORY_API_CONFIG.BASE_URL}/${productId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching product details:', error);
        return null;
    }
}

// =============== RESPIRATORY CARE PRODUCTS ===============
let products = [];
let productGrid, sortSelect, showMoreBtn;
let currentFilters = {
    category: 'all',
    brand: 'all',
    discount: 'all',
    minPrice: 0,
    maxPrice: 50000
};
let visibleProductsCount = 8;
let allFilteredProducts = [];

// ======================================================
document.addEventListener('DOMContentLoaded', async () => {
    productGrid = document.getElementById('productGrid');
    sortSelect = document.getElementById('sortSelect');
    showMoreBtn = document.getElementById('showMoreBtn');

    // Show loading state
    if (productGrid) {
        productGrid.innerHTML = '<div class="col-span-full text-center py-20 text-gray-500 text-xl">Loading products...</div>';
    }

    // 1. Fetch products FIRST
    products = await fetchRespiratoryProducts();

    // 2. Now load wishlist (only if logged in)
    if (CURRENT_USER_ID) {
        await loadWishlistFromBackend();
    } else {
        wishlist = [];
        updateHeaderWishlistCount();
    }

    // 3. Initialize filtered products
    allFilteredProducts = [...products];
    applySorting();
    renderInitialProducts();
    updateResultsCount();

    // 4. Initialize everything else
    initSlider();
    initSorting();
    initMobileSheets();
    initFilters();
    initShowMore();
    initResetDesktopFilters();

    // 5. Save to sessionStorage
    sessionStorage.setItem('currentPageProducts', JSON.stringify(products));

    // 6. Delegated wishlist click handler
    productGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.wishlist-btn');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const productId = Number(btn.dataset.id);
        toggleWishlist(productId, btn);
    });
});

// Initialize Reset Desktop Filters button
function initResetDesktopFilters() {
  const resetBtn = document.getElementById('resetDesktopFilters');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetDesktopFilters);
    console.log('Reset desktop filters button initialized');
  } else {
    console.warn('Reset desktop filters button not found');
  }
}

// =============== CARD CREATION ===============
function createCard(p) {
    const div = document.createElement('div');
   
    const isOutOfStock = p.productQuantity <= 0 || p.productStock === "Out of Stock" || p.productStock === "Out-of-Stock";
    const stockStatus = isOutOfStock ? 'Out of Stock' : 'In Stock';
    const stockClass = isOutOfStock ? 'out-of-stock' : 'in-stock';
    const cardClass = isOutOfStock ? 'out-of-stock-card' : '';
   
    let discount = 0;
    let priceLine = '';
   
    if (p.productOldPrice && p.productOldPrice.length > 0 && p.productPrice && p.productPrice.length > 0) {
        const currentPrice = p.productPrice[0];
        const oldPrice = p.productOldPrice[0];
        discount = Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
        priceLine = `₹${currentPrice} <s class="text-gray-400 text-sm">₹${oldPrice}</s> <span class="text-green-600 text-sm font-bold">${discount}% off</span>`;
    } else if (p.productPrice && p.productPrice.length > 0) {
        priceLine = `₹${p.productPrice[0]}`;
    } else {
        priceLine = 'Price not available';
    }
   
    const isWishlisted = CURRENT_USER_ID ? wishlist.some(item => item.productId === p.productId) : false;

    // CORRECT full image URL
    const fullImageUrl = p.productMainImage
        ? `${RESPIRATORY_API_CONFIG.BASE_URL_IMG}${p.productMainImage}`
        : 'http://localhost:8083/Images/product_details_fallback_img.jpg'; // respiratory-themed fallback
    div.className = `bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer relative ${cardClass}`;
   
    div.innerHTML = `
        <div class="relative">
            <img src="${fullImageUrl}" alt="${p.productName}" class="w-full h-48 object-cover"
                 onerror="this.src='http://localhost:8083/Images/product_details_fallback_img.jpg'">
           
            <div class="stock-badge ${stockClass}">${stockStatus}</div>
           
            ${discount > 0 ? `<div class="absolute top-8 right-12 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">${discount}% OFF</div>` : ''}
           
            ${p.prescriptionRequired ? `<div class="absolute top-24 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">Rx Required</div>` : ''}
           
            <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" data-id="${p.productId}">
                <i class="fa-${isWishlisted ? 'solid' : 'regular'} fa-heart"></i>
            </button>
        </div>
        <div class="p-4">
            <h3 class="font-semibold text-lg">${p.productName}</h3>
            <p class="text-sm text-gray-500 mt-1">${p.brandName || 'Unknown Brand'}</p>
           
                ${p.rating ? `<div class="flex items-center mt-1">
                <span class="text-yellow-400 text-sm">★</span>
                <span class="text-sm text-gray-600 ml-1">${p.rating}</span>
            </div>` : ''}
           
            <div class="mt-3 font-bold text-xl text-blue-600">${priceLine}</div>
           
           
           
            <button onclick="${isOutOfStock ? 'void(0)' : `navigateToProductDetails(${p.productId})`}"
                    class="mt-4 w-full ${isOutOfStock ? 'out-of-stock-btn bg-gray-400' : 'bg-[#3b82f6] hover:bg-[#2563eb]'} text-white py-2 rounded-lg font-bold transition"
                    ${isOutOfStock ? 'disabled' : ''}>
                ${isOutOfStock ? 'Out of Stock' : 'View Details'}
            </button>
        </div>
    `;
    return div;
}

// =============== RENDER INITIAL PRODUCTS ===============
function renderInitialProducts() {
    if (!productGrid) return;
   
    productGrid.innerHTML = '';
   
    if (allFilteredProducts.length === 0) {
        productGrid.innerHTML = '<div class="col-span-full text-center py-20 text-gray-500 text-xl">No products found</div>';
        if (showMoreBtn) showMoreBtn.classList.add('hidden');
        return;
    }
   
    const productsToShow = allFilteredProducts.slice(0, visibleProductsCount);
   
    productsToShow.forEach(p => productGrid.appendChild(createCard(p)));
   
    if (showMoreBtn) {
        if (allFilteredProducts.length > visibleProductsCount) {
            showMoreBtn.classList.remove('hidden');
        } else {
            showMoreBtn.classList.add('hidden');
        }
    }
}

// =============== SHOW MORE FUNCTIONALITY ===============
function initShowMore() {
    if (!showMoreBtn) return;
   
    showMoreBtn.addEventListener('click', () => {
        visibleProductsCount += 8;
        renderInitialProducts();
       
        if (visibleProductsCount >= allFilteredProducts.length && showMoreBtn) {
            showMoreBtn.classList.add('hidden');
        }
       
        updateResultsCount();
    });
}

// =============== WISHLIST TOGGLE (NOW SAME AS REF CODE) ===============
async function toggleWishlist(productId, buttonElement) {
    // Block wishlist actions if not logged in
    if (!CURRENT_USER_ID) {
        showToast("Please login to add to wishlist");
        return;
    }

    const index = wishlist.findIndex(item => item.productId === productId);
    if (index === -1) {
        // Add to wishlist
        const success = await addToWishlistBackend(productId);
        if (success) {
            wishlist.push({ productId });
            showToast("Added to wishlist");
            // Update button immediately
            if (buttonElement) {
                buttonElement.classList.add('active');
                buttonElement.innerHTML = '<i class="fa-solid fa-heart"></i>';
            }
        }
    } else {
        // Remove from wishlist
        const success = await removeFromWishlistBackend(productId);
        if (success) {
            wishlist.splice(index, 1);
            showToast("Removed from wishlist");
            // Update button immediately
            if (buttonElement) {
                buttonElement.classList.remove('active');
                buttonElement.innerHTML = '<i class="fa-regular fa-heart"></i>';
            }
        }
    }

    updateHeaderWishlistCount();
    // Optional: renderInitialProducts(); // Removed to avoid full re-render; button already updated
}

function updateResultsCount() {
    const countEl = document.getElementById('resultsCount');
    if (countEl) {
        const showingCount = Math.min(visibleProductsCount, allFilteredProducts.length);
        countEl.textContent = `Showing ${showingCount} of ${allFilteredProducts.length} products`;
    }
    updateTitle();
}

function updateTitle() {
    const titleEl = document.querySelector('h2.text-2xl');
    if (!titleEl) return;
    const categoryNames = {
        'all': 'Respiratory Care Devices',
        'nebulizer': 'Nebulizers & Accessories',
        'vaporizer': 'Vaporizers & Steam Inhalers',
        'oxygen': 'Oxygen Cylinders & Concentrators',
        'cpap': 'CPAP/BIPAP Machines'
    };
    let title = categoryNames[currentFilters.category] || 'Respiratory Care Devices';
    if (currentFilters.brand !== 'all') {
        title += ` - ${currentFilters.brand}`;
    }
    titleEl.textContent = title;
}

// Apply Filters Function – Enhanced for better subcategory matching
function applyFilters() {
    allFilteredProducts = products.filter(product => {
        // Category filter
        if (currentFilters.category !== 'all') {
            const subCat = product.productSubCategory?.toLowerCase() || '';
            const cat = product.productCategory?.toLowerCase() || '';
            const matches = {
                'nebulizer': subCat.includes('nebulizer') || subCat.includes('neb'),
                'vaporizer': subCat.includes('vaporizer') || subCat.includes('steam') || subCat.includes('inhaler'),
                'oxygen': subCat.includes('oxygen') || subCat.includes('concentrator') || subCat.includes('cylinder'),
                'cpap': subCat.includes('cpap') || subCat.includes('bipap') || subCat.includes('machine')
            };
            if (!matches[currentFilters.category]) {
                return false;
            }
        }
        // Brand filter
        if (currentFilters.brand !== 'all' && product.brandName !== currentFilters.brand) {
            return false;
        }
        // Price filter
        const productPrice = product.productPrice?.[0] || 0;
        if (productPrice < currentFilters.minPrice || productPrice > currentFilters.maxPrice) {
            return false;
        }
        // Discount filter
        if (currentFilters.discount !== 'all') {
            const requiredDiscount = parseInt(currentFilters.discount);
            let productDiscount = 0;
            if (product.productOldPrice?.[0] && product.productPrice?.[0]) {
                productDiscount = Math.round(((product.productOldPrice[0] - product.productPrice[0]) / product.productOldPrice[0]) * 100);
            }
            if (productDiscount < requiredDiscount) {
                return false;
            }
        }
        return true;
    });
    visibleProductsCount = 8;
    applySorting();
    renderInitialProducts();
    updateResultsCount();
}

// Apply Sorting Function
function applySorting() {
    if (!sortSelect) return;
   
    const val = sortSelect.value;
    if (val === 'price-low') {
        allFilteredProducts.sort((a,b) => (a.productPrice?.[0] || 0) - (b.productPrice?.[0] || 0));
    } else if (val === 'price-high') {
        allFilteredProducts.sort((a,b) => (b.productPrice?.[0] || 0) - (a.productPrice?.[0] || 0));
    } else if (val === 'rating') {
        allFilteredProducts.sort((a,b) => (b.rating || 0) - (a.rating || 0));
    } else if (val === 'newest') {
        allFilteredProducts.sort((a,b) => b.productId - a.productId);
    }
}

// Initialize Desktop Filters
function initFilters() {
    const desktopForm = document.getElementById('filterForm');
    if (desktopForm) {
        desktopForm.addEventListener('submit', (e) => {
            e.preventDefault();
            currentFilters.category = document.querySelector('input[name="category"]:checked')?.value || 'all';
            currentFilters.brand = document.querySelector('input[name="brand"]:checked')?.value || 'all';
            currentFilters.discount = document.querySelector('input[name="discount"]:checked')?.value || 'all';
            applyFilters();
        });
        desktopForm.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
                currentFilters.category = document.querySelector('input[name="category"]:checked')?.value || 'all';
                currentFilters.brand = document.querySelector('input[name="brand"]:checked')?.value || 'all';
                currentFilters.discount = document.querySelector('input[name="discount"]:checked')?.value || 'all';
                applyFilters();
            });
        });
    }
    const applyMobileBtn = document.getElementById('applyMobileFilters');
    if (applyMobileBtn) {
        applyMobileBtn.addEventListener('click', () => {
            currentFilters.category = document.querySelector('input[name="mobileCategory"]:checked')?.value || 'all';
            currentFilters.brand = document.querySelector('input[name="mobileBrand"]:checked')?.value || 'all';
            currentFilters.discount = document.querySelector('input[name="mobileDiscount"]:checked')?.value || 'all';
            applyFilters();
            closeFilterSheet();
        });
    }
    const clearMobileBtn = document.getElementById('clearMobileFilters');
    if (clearMobileBtn) {
        clearMobileBtn.addEventListener('click', () => {
            document.querySelectorAll('input[name="mobileCategory"], input[name="mobileBrand"], input[name="mobileDiscount"]').forEach(radio => {
                if (radio.value === 'all') radio.checked = true;
            });
           
            document.querySelectorAll('input[name="category"], input[name="brand"], input[name="discount"]').forEach(radio => {
                if (radio.value === 'all') radio.checked = true;
            });
            currentFilters = {
                category: 'all',
                brand: 'all',
                discount: 'all',
                minPrice: 0,
                maxPrice: 50000
            };
            if (document.getElementById('minThumb')) document.getElementById('minThumb').value = 0;
            if (document.getElementById('maxThumb')) document.getElementById('maxThumb').value = 50000;
            if (document.getElementById('mobileMinThumb')) document.getElementById('mobileMinThumb').value = 0;
            if (document.getElementById('mobileMaxThumb')) document.getElementById('mobileMaxThumb').value = 50000;
           
            if (typeof updateDesktopSlider === 'function') updateDesktopSlider();
            if (typeof updateMobileSlider === 'function') updateMobileSlider();
            applyFilters();
        });
    }
}

// Navigate to Product Details Page
window.navigateToProductDetails = async function(productId) {
    try {
        let product = await fetchProductDetails(productId);
       
        if (!product) {
            product = products.find(p => p.productId === productId);
            if (!product) {
                console.error('Product not found with id:', productId);
                return;
            }
        }
        const currentPageName = document.title || 'Respiratory Care Devices';
       
        sessionStorage.setItem('selectedProduct', JSON.stringify(product));
        sessionStorage.setItem('currentPageProducts', JSON.stringify(products));
        sessionStorage.setItem('currentPageName', currentPageName);
        const params = new URLSearchParams({
            id: product.productId,
            name: product.productName,
            brand: product.brandName,
            price: product.productPrice?.[0] || '',
            originalPrice: product.productOldPrice?.[0] || '',
            discount: product.discount || '',
            image: product.productMainImage || '',
            description: product.productDescription || '',
            prescription: product.prescriptionRequired || false,
            category: product.productCategory || '',
            subCategory: product.productSubCategory || '',
            sourcePage: currentPageName,
            quantity: product.productQuantity || 0,
            mfgDate: product.mfgDate || '',
            expDate: product.expDate || '',
            batchNo: product.batchNo || '',
            sku: product.sku || ''
        });
        window.location.href = `/productdetails.html?${params.toString()}`;
       
    } catch (error) {
        console.error('Error navigating to product details:', error);
    }
}

function initSorting() {
    if (!sortSelect) return;
   
    sortSelect.addEventListener('change', () => {
        applySorting();
        visibleProductsCount = 8;
        renderInitialProducts();
        updateResultsCount();
    });
    const applySortBtn = document.getElementById('applySortBtn');
    if (applySortBtn) {
        applySortBtn.addEventListener('click', () => {
            const selectedSort = document.querySelector('input[name="mobileSort"]:checked')?.value || 'default';
            if (sortSelect) {
                sortSelect.value = selectedSort;
                sortSelect.dispatchEvent(new Event('change'));
            }
            closeSortSheet();
        });
    }
}

// Desktop Price Slider
function initSlider() {
    const minThumb = document.getElementById('minThumb');
    const maxThumb = document.getElementById('maxThumb');
    const mobileMinThumb = document.getElementById('mobileMinThumb');
    const mobileMaxThumb = document.getElementById('mobileMaxThumb');
    const updateDesktopSlider = () => {
        const minVal = parseInt(minThumb.value);
        const maxVal = parseInt(maxThumb.value);
       
        if (minVal > maxVal - 1000) {
            minThumb.value = maxVal - 1000;
        }
       
        const fill = document.getElementById('desktopFill');
        if (fill) {
            fill.style.left = (minVal / 50000) * 100 + '%';
            fill.style.width = ((maxVal - minVal) / 50000) * 100 + '%';
        }
       
        const minValue = document.getElementById('minValue');
        const maxValue = document.getElementById('maxValue');
        if (minValue) minValue.textContent = '₹' + minVal;
        if (maxValue) maxValue.textContent = '₹' + maxVal;
       
        currentFilters.minPrice = minVal;
        currentFilters.maxPrice = maxVal;
    };
    const updateMobileSlider = () => {
        const minVal = parseInt(mobileMinThumb.value);
        const maxVal = parseInt(mobileMaxThumb.value);
       
        if (minVal > maxVal - 1000) {
            mobileMinThumb.value = maxVal - 1000;
        }
       
        const fill = document.getElementById('mobileFill');
        if (fill) {
            fill.style.left = (minVal / 50000) * 100 + '%';
            fill.style.width = ((maxVal - minVal) / 50000) * 100 + '%';
        }
       
        const minValue = document.getElementById('mobileMinValue');
        const maxValue = document.getElementById('mobileMaxValue');
        if (minValue) minValue.textContent = '₹' + minVal;
        if (maxValue) maxValue.textContent = '₹' + maxVal;
       
        currentFilters.minPrice = minVal;
        currentFilters.maxPrice = maxVal;
    };
    if (minThumb && maxThumb) {
        minThumb.oninput = () => {
            updateDesktopSlider();
            applyFilters();
        };
        maxThumb.oninput = () => {
            updateDesktopSlider();
            applyFilters();
        };
        updateDesktopSlider();
    }
    if (mobileMinThumb && mobileMaxThumb) {
        mobileMinThumb.oninput = updateMobileSlider;
        mobileMaxThumb.oninput = updateMobileSlider;
        updateMobileSlider();
    }
    window.updateDesktopSlider = updateDesktopSlider;
    window.updateMobileSlider = updateMobileSlider;
}

// Mobile Sheets
function initMobileSheets() {
    const backdrop = document.getElementById('mobileSheetBackdrop');
    const filterSheet = document.getElementById('filterSheet');
    const sortSheet = document.getElementById('sortSheet');
   
    const openFilterSheetBtn = document.getElementById('openFilterSheet');
    if (openFilterSheetBtn) {
        openFilterSheetBtn.addEventListener('click', () => {
            if (backdrop) backdrop.classList.remove('hidden');
            if (filterSheet) filterSheet.classList.remove('translate-y-full');
        });
    }
    const closeFilterSheet = () => {
        if (backdrop) backdrop.classList.add('hidden');
        if (filterSheet) filterSheet.classList.add('translate-y-full');
    };
    const closeFilterSheetBtn = document.getElementById('closeFilterSheet');
    if (closeFilterSheetBtn) {
        closeFilterSheetBtn.addEventListener('click', closeFilterSheet);
    }
    window.closeFilterSheet = closeFilterSheet;
    const openSortSheetBtn = document.getElementById('openSortSheet');
    if (openSortSheetBtn) {
        openSortSheetBtn.addEventListener('click', () => {
            if (backdrop) backdrop.classList.remove('hidden');
            if (sortSheet) sortSheet.classList.remove('translate-y-full');
        });
    }
    const closeSortSheet = () => {
        if (backdrop) backdrop.classList.add('hidden');
        if (sortSheet) sortSheet.classList.add('translate-y-full');
    };
    const closeSortSheetBtn = document.getElementById('closeSortSheet');
    if (closeSortSheetBtn) {
        closeSortSheetBtn.addEventListener('click', closeSortSheet);
    }
    window.closeSortSheet = closeSortSheet;
    if (backdrop) {
        backdrop.addEventListener('click', () => {
            closeFilterSheet();
            closeSortSheet();
        });
    }
}

window.sortProducts = function(type) {
    if (!sortSelect) return;
   
    sortSelect.value = type;
    sortSelect.dispatchEvent(new Event('change'));
    const backdrop = document.getElementById('mobileSheetBackdrop');
    if (backdrop) backdrop.click();
};