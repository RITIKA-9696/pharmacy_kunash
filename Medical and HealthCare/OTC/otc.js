// ==================== otc.js – CONNECTED TO BACKEND ==================== 
// Base API URL - Update this to your backend URL
const API_BASE_URL = 'http://localhost:8083/api/products';
const WISHLIST_API_BASE = "http://localhost:8083/api/wishlist";

// Global State
let allProducts = [];
let filteredProducts = [];
let wishlist = []; // Now only stores { id: productId } – synced with backend
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let currentPage = 1;
const pageSize = 12;

// Enable debug mode
const DEBUG_MODE = true;

// Persistent Filter State
let filterState = {
  category: 'all',
  brand: 'all',
  discount: 0,
  minPrice: 0,
  maxPrice: 2000,
  sort: 'default'
};

// =============== OTC CATEGORIES ===============
const OTC_CATEGORIES = [
  {
    id: 'all',
    name: 'All OTC Products',
    backendSubcategories: []
  },
  {
    id: 'ayurvedic',
    name: 'Ayurvedic Medicines',
    backendSubcategories: ['Ayurvedic Medicines', 'Ayurvedic', 'Herbal']
  },
  {
    id: 'allergy',
    name: 'Allergy',
    backendSubcategories: ['Allergy', 'Allergy Relief']
  },
  {
    id: 'fever',
    name: 'Fever & Flu',
    backendSubcategories: ['Fever & Flu', 'Fever', 'Flu']
  },
  {
    id: 'pain',
    name: 'Pain Relief',
    backendSubcategories: ['Pain Relief', 'Pain']
  },
  {
    id: 'ointments',
    name: 'Ointments',
    backendSubcategories: ['Ointments', 'Creams']
  },
  {
    id: 'health-supp',
    name: 'Health Supplements',
    backendSubcategories: ['Health Supplements', 'Supplements']
  },
   {
    id: 'Post delivery recovery',
    name: 'Post delivery recovery',
    backendSubcategories: ['Post delivery recovery', 'Post delivery recovery']
  }
  
  
];

// ==================== RESET FILTERS FUNCTION ====================
function resetAllFilters() {
    console.log('Resetting all OTC filters...');
    
    // Reset filter state to default values
    filterState = {
        category: 'all',
        brand: 'all',
        discount: 0,
        minPrice: 0,
        maxPrice: 2000,
        sort: 'default'
    };
    
    // Reset all category radio buttons
    const desktopCategoryAll = document.querySelector('#filterSidebar input[name="category"][value="all"]');
    if (desktopCategoryAll) desktopCategoryAll.checked = true;
    
    const mobileCategoryAll = document.querySelector('#filterSheet input[name="mobileCategory"][value="all"]');
    if (mobileCategoryAll) mobileCategoryAll.checked = true;
    
    // Reset all brand radio buttons
    const desktopBrandAll = document.querySelector('#filterSidebar input[name="brand"][value="all"]');
    if (desktopBrandAll) desktopBrandAll.checked = true;
    
    const mobileBrandAll = document.querySelector('#filterSheet input[name="mobileBrand"][value="all"]');
    if (mobileBrandAll) mobileBrandAll.checked = true;
    
    // Reset all discount radio buttons
    const desktopDiscountZero = document.querySelector('#filterSidebar input[name="discount"][value="0"]');
    if (desktopDiscountZero) desktopDiscountZero.checked = true;
    
    const mobileDiscountZero = document.querySelector('#filterSheet input[name="mobileDiscount"][value="0"]');
    if (mobileDiscountZero) mobileDiscountZero.checked = true;
    
    // Reset sort dropdown
    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
        sortSelect.value = 'default';
    }
    
    // Reset mobile sort radio
    const mobileSortDefault = document.querySelector('input[name="mobileSort"][value="default"]');
    if (mobileSortDefault) mobileSortDefault.checked = true;
    
    // Reset price sliders to default values (0-2000)
    const desktopMin = document.getElementById('minThumb');
    const desktopMax = document.getElementById('maxThumb');
    const mobileMin = document.getElementById('mobileMinThumb');
    const mobileMax = document.getElementById('mobileMaxThumb');
    
    if (desktopMin) desktopMin.value = 0;
    if (desktopMax) desktopMax.value = 2000;
    if (mobileMin) mobileMin.value = 0;
    if (mobileMax) mobileMax.value = 2000;
    
    // Update filter state with reset values
    filterState.minPrice = 0;
    filterState.maxPrice = 2000;
    
    // Update price display values
    const desktopMinVal = document.getElementById('minValue');
    const desktopMaxVal = document.getElementById('maxValue');
    const mobileMinVal = document.getElementById('mobileMinValue');
    const mobileMaxVal = document.getElementById('mobileMaxValue');
    
    if (desktopMinVal) desktopMinVal.textContent = '₹0';
    if (desktopMaxVal) desktopMaxVal.textContent = '₹2,000';
    if (mobileMinVal) mobileMinVal.textContent = '₹0';
    if (mobileMaxVal) mobileMaxVal.textContent = '₹2,000';
    
    // Update slider fill visuals
    const desktopFill = document.querySelector('#filterSidebar .slider-fill');
    const mobileFill = document.querySelector('#filterSheet .slider-fill');
    
    if (desktopFill) {
        desktopFill.style.left = '0%';
        desktopFill.style.width = '100%';
    }
    if (mobileFill) {
        mobileFill.style.left = '0%';
        mobileFill.style.width = '100%';
    }
    
    // Close expanded sections if open
    const desktopBrandSection = document.querySelector('#filterSidebar .border-b.pb-4 .mt-2.space-y-2');
    if (desktopBrandSection && !desktopBrandSection.classList.contains('hidden')) {
        desktopBrandSection.classList.add('hidden');
        const brandHeader = desktopBrandSection.previousElementSibling;
        if (brandHeader) {
            const chevron = brandHeader.querySelector('i');
            if (chevron) chevron.classList.remove('rotate-180');
        }
    }
    
    const desktopDiscountSection = document.querySelector('#filterSidebar .border-b.pb-4 + div .mt-4.space-y-2');
    if (desktopDiscountSection && !desktopDiscountSection.classList.contains('hidden')) {
        desktopDiscountSection.classList.add('hidden');
        const discountHeader = desktopDiscountSection.previousElementSibling;
        if (discountHeader) {
            const chevron = discountHeader.querySelector('i');
            if (chevron) chevron.classList.remove('rotate-180');
        }
    }
    
   updateBrandsDropdown();
    
    // Apply the reset filters
    applyFilters();
    
    // Show toast notification
    showToast('All filters have been reset', 'success');
    
    console.log('OTC filters reset to default values');
}

// Initialize reset button event listener
function initResetButton() {
    const resetBtn = document.getElementById('resetDesktopFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetAllFilters);
        console.log('Reset button event listener added');
    }
}

// Helper: Safe text update
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Update page title based on category
function updatePageTitle() {
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) {
    if (filterState.category === 'all') {
      titleEl.textContent = 'All OTC Products';
    } else {
      const category = OTC_CATEGORIES.find(cat => cat.id === filterState.category);
      titleEl.textContent = category ? category.name : 'OTC Products';
    }
  }
}

// Debug logging function
function debugLog(...args) {
  if (DEBUG_MODE) {
    console.log('[DEBUG]', ...args);
  }
}

// =============== USER ID (EXACTLY LIKE REF) ===============
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

const CURRENT_USER_ID = getCurrentUserId();
console.log("====getCurrentUserId function returns :", CURRENT_USER_ID);

// =============== WISHLIST BACKEND FUNCTIONS (MATCHING REF) ===============
async function addToWishlistBackend(productId) {
    if (!CURRENT_USER_ID) {
        showToast("Please log in to add to wishlist");
        return false;
    }
    try {
        const response = await fetch(`${WISHLIST_API_BASE}/add-wishlist-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: CURRENT_USER_ID,
                productId: productId,
                productType: "MEDICINE"
            })
        });
        if (response.ok) {
            console.log("Added to backend wishlist");
            return true;
        } else {
            console.error("Failed to add to backend wishlist");
            return false;
        }
    } catch (err) {
        console.error("Error calling wishlist API:", err);
        return false;
    }
}

async function removeFromWishlistBackend(productId) {
    if (!CURRENT_USER_ID) return false;
    try {
        const response = await fetch(`${WISHLIST_API_BASE}/remove-wishlist-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: CURRENT_USER_ID,
                productId: productId
            })
        });
        if (response.ok) {
            console.log("Removed from backend wishlist");
            return true;
        } else {
            console.error("Failed to remove from backend wishlist");
            return false;
        }
    } catch (err) {
        console.error("Error removing from wishlist:", err);
        return false;
    }
}

async function loadWishlistFromBackend() {
    if (!CURRENT_USER_ID) {
        wishlist = [];
        updateHeaderCounts();
        return;
    }
    try {
        const response = await fetch(`${WISHLIST_API_BASE}/get-wishlist-items?userId=${CURRENT_USER_ID}`);
        if (!response.ok) {
            console.error("Failed to fetch wishlist");
            wishlist = [];
            return;
        }
        const items = await response.json();
        wishlist = items
            .filter(item => item.productType === "MEDICINE")
            .map(item => ({ id: item.productId }));
        console.log("Loaded wishlist from backend:", wishlist.length, "items");
        updateHeaderCounts();
        renderProducts(); // Refresh heart icons
    } catch (err) {
        console.error("Error syncing wishlist:", err);
        wishlist = [];
    }
}

// ==================== FETCH PRODUCTS FROM BACKEND ====================

const category = "Over-the-Counter (OTC) Medicines";  
const encodedCategory = encodeURIComponent(category);
async function fetchProducts() {
  try {
    debugLog('Starting fetchProducts for OTC...');
    setText("resultsCount", "Loading products...");
    // Clear existing products
    allProducts = [];
    filteredProducts = [];
    // Fetch ALL products
const url = `${API_BASE_URL}/get-by-category/${encodedCategory}?page=0&size=200`;
    debugLog('Fetching from URL:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    debugLog('Response status:', response.status, response.statusText);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    processProducts(data);
  } catch (error) {
    console.error('Error in fetchProducts:', error);
    showToast('Error loading products. Please check console for details.');
    setText("resultsCount", "Failed to load products");
    // Show empty state
    const grid = document.getElementById("productsGrid");
    if (grid) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-10">
          <div class="text-gray-400 mb-4">
            <i class="fas fa-exclamation-triangle text-5xl"></i>
          </div>
          <p class="text-gray-500 mb-2">Failed to load products</p>
          <p class="text-gray-400 text-sm">Error: ${error.message}</p>
          <button onclick="fetchProducts()" class="mt-4 px-4 py-2 bg-[#36C2CE] text-white rounded-lg">
            Retry
          </button>
        </div>
      `;
    }
  }
}

function processProducts(data) {
  debugLog('API Response data:', data);
  // Handle different response formats
  let productsArray = [];
  if (Array.isArray(data)) {
    productsArray = data;
  } else if (data.content && Array.isArray(data.content)) {
    productsArray = data.content;
  } else if (data.products && Array.isArray(data.products)) {
    productsArray = data.products;
  } else if (typeof data === 'object' && data !== null) {
    productsArray = [data];
  }
  debugLog('Total products from API:', productsArray.length);
  if (productsArray.length === 0) {
    debugLog('No products received from API');
    showToast('No products available. Please try again later.');
  }
  // Transform ALL products first
  const allTransformedProducts = transformBackendProducts(productsArray);
  // DEBUG: Check each product
  debugLog('=== CHECKING OTC PRODUCT CATEGORIES ===');
  allTransformedProducts.forEach(product => {
    debugLog(`Product: "${product.title}" - Category: "${product.category}"`);
  });
  debugLog('=== END CHECK ===');
  // Get all unique categories from products
  const allCategories = [...new Set(allTransformedProducts.map(p => p.category))];
  debugLog('All categories in DB:', allCategories);
  // FILTER: Only keep products that match our OTC categories
  allProducts = allTransformedProducts.filter(product => {
    const productCategory = product.category || '';
    // Check if this product's category matches any OTC category
    const isOTCProduct = OTC_CATEGORIES.some(category => {
      if (category.id === 'all') return false; // Skip "all" category
 
      return category.backendSubcategories.some(backendSubcat => {
        // Case-insensitive comparison
        const productCatLower = productCategory.toLowerCase();
        const backendSubLower = backendSubcat.toLowerCase();
   
        // Check for exact match or partial match
        return productCatLower === backendSubLower ||
               productCatLower.includes(backendSubLower) ||
               backendSubLower.includes(productCatLower);
      });
    });
    if (!isOTCProduct) {
      debugLog(`Filtered out (non-OTC): ${product.title} - ${product.category}`);
    }
    return isOTCProduct;
  });
  debugLog('OTC products after filtering:', allProducts.length);
  debugLog('OTC product categories:', [...new Set(allProducts.map(p => p.category))]);
  // Apply filters and update UI
  applyFilters();
  updateUIWithProducts();
}

// Transform backend product format to frontend format
function transformBackendProducts(backendProducts) {
  if (!Array.isArray(backendProducts) || backendProducts.length === 0) {
    return [];
  }

  debugLog('Transforming', backendProducts.length, 'products');

  return backendProducts.map((product, index) => {
    try {
      // Basic identification
      const id = product.productId || product.id || index + 1;
      const title = product.productName || product.name || 'Unnamed Product';

      // ── Selling price (current customer price) ─────────────────────────────
      let sellingPrice = null;

      if (product.productPrice != null) {
        if (Array.isArray(product.productPrice) && product.productPrice.length > 0) {
          sellingPrice = Number(product.productPrice[0]);
        } else if (typeof product.productPrice === 'number') {
          sellingPrice = Number(product.productPrice);
        }
      }

      // Only fallback if truly invalid/missing
      if (sellingPrice === null || isNaN(sellingPrice) || sellingPrice <= 0) {
        sellingPrice = 0; // or you can throw / skip – 0 makes it obvious in UI
        console.warn(`Invalid/missing selling price for product ${id} – using 0`);
      }

      // ── Original / MRP / Old price ─────────────────────────────────────────
      let originalPrice = null;

      // Priority 1: productOldPrice
      if (product.productOldPrice != null) {
        if (Array.isArray(product.productOldPrice) && product.productOldPrice.length > 0) {
          originalPrice = Number(product.productOldPrice[0]);
        } else if (typeof product.productOldPrice === 'number') {
          originalPrice = Number(product.productOldPrice);
        }
      }
      // Priority 2: mrp field (if it exists)
      else if (product.mrp != null) {
        originalPrice = Number(product.mrp);
      }

      // Clean up – only keep if valid and positive
      if (originalPrice !== null) {
        if (isNaN(originalPrice) || originalPrice <= 0) {
          originalPrice = null;
        }
      }

      // ── Discount logic – only if meaningful ────────────────────────────────
      let discount = 0;
      let displayOriginalPrice = null;

      if (originalPrice !== null && originalPrice > sellingPrice && sellingPrice > 0) {
        const percent = ((originalPrice - sellingPrice) / originalPrice) * 100;

        // Configurable minimum threshold – change this value as needed
        const MIN_DISCOUNT_PERCENT_TO_SHOW = 5;

        if (percent >= MIN_DISCOUNT_PERCENT_TO_SHOW) {
          discount = Math.min(Math.round(percent), 90);
          displayOriginalPrice = originalPrice;
        }
      }

      // ── Other common fields ────────────────────────────────────────────────
      const category = product.productSubCategory || product.productCategory || 'Unknown';
      const brand = product.brandName || product.brand || product.manufacturer || 'Generic';
      const description = product.productDescription || product.description || 'No description available';
      const stockQuantity = product.productQuantity || product.stockQuantity || product.quantity || 0;

      const inStock = 
        product.productStock === 'In Stock' ||
        product.productStock === 'In-Stock' ||
        product.productStock === 'Available' ||
        product.productStatus === 'Available' ||
        stockQuantity > 0;

      // Image handling – adapt to your actual image serving logic
      let imageUrl = 'http://localhost:8083/Images/product_details_fallback_img.jpg';
      if (product.productMainImage) {
        if (product.productMainImage.startsWith('/api/')) {
          imageUrl = `http://localhost:8083${product.productMainImage}`;
        } else if (product.productMainImage.startsWith('http')) {
          imageUrl = product.productMainImage;
        } else if (product.productMainImage.startsWith('data:image')) {
          imageUrl = product.productMainImage;
        } else {
          imageUrl = `data:image/jpeg;base64,${product.productMainImage}`;
        }
      } else if (product.productId) {
        imageUrl = `http://localhost:8083/api/products/${product.productId}/image`;
      }

      // Final frontend-friendly object
      return {
        id,
        title,
        price: sellingPrice,
        originalPrice: displayOriginalPrice,   // null → no strikethrough
        discount,                              // 0 → no % badge
        rating: product.rating || product.productRating || 4.0,
        reviewCount: product.reviewCount || product.totalReviews || 0,
        category,
        brand,
        image: imageUrl,
        description,
        inStock,
        stockQuantity,
        // Optional extra fields you might use later
        subcategory: product.productSubCategory || '',
        sku: product.sku || '',
        prescriptionRequired: !!product.prescriptionRequired
      };
    } catch (error) {
      console.error('Error transforming product id:', product?.productId || index, error);
      return null;
    }
  }).filter(product => product !== null);
}

// Navigate to product details page
function viewProductDetails(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product || !product.inStock) return;

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const params = new URLSearchParams({
    id: product.id,
    name: encodeURIComponent(product.title),
    brand: encodeURIComponent(product.brand),
    price: product.price,
    originalPrice: product.originalPrice || product.price,
    discount: discount,
    image: encodeURIComponent(product.image),
    description: encodeURIComponent(product.description || product.title),
    category: encodeURIComponent(product.category || 'otc'),
    sourcePage: 'OTC Medicines',
    stock: product.stockQuantity || 0,
    status: product.inStock ? 'In Stock' : 'Out of Stock',
    rating: product.rating || 4.0,
  });

  window.location.href = `../../productdetails.html?${params.toString()}`;
}

// Update UI with loaded products
function updateUIWithProducts() {
  // Update brands dropdown
  updateBrandsDropdown();
  // Update price range
  updatePriceRange();
  // Render products
  renderProducts();
}

// Update brands dropdown
function updateBrandsDropdown() {
  const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))];
  brands.sort();
  debugLog('Available brands:', brands);
  // Update desktop brands (the brands dropdown in sidebar)
  const desktopBrandsContainer = document.querySelector('#filterSidebar .border-b.pb-4 .mt-2.space-y-2');
  if (desktopBrandsContainer) {
    let html = `
      <label class="flex items-center"><input type="radio" name="brand" value="all" ${filterState.brand === 'all' ? 'checked' : ''} class="w-5 h-5 text-primary"> <span class="ml-3 text-gray-700">All Brands</span></label>
    `;
    brands.forEach(brand => {
      html += `
        <label class="flex items-center"><input type="radio" name="brand" value="${brand}" ${filterState.brand === brand ? 'checked' : ''} class="w-5 h-5 text-primary"> <span class="ml-3 text-gray-700">${brand}</span></label>
      `;
    });
    desktopBrandsContainer.innerHTML = html;
    // Add event listeners
    desktopBrandsContainer.querySelectorAll('input[name="brand"]').forEach(input => {
      input.addEventListener('change', (e) => {
        filterState.brand = e.target.value;
        applyFilters();
      });
    });
  }
  
  // Update mobile brands (inside filter sheet)
  const mobileBrandsContainer = document.querySelector('#filterSheet [name="mobileBrand"]')?.parentElement?.parentElement;
  if (mobileBrandsContainer) {
    let html = `
      <div class="space-y-2">
        <label class="flex items-center">
          <input type="radio" name="mobileBrand" value="all" ${filterState.brand === 'all' ? 'checked' : ''} class="w-5 h-5 text-primary">
          <span class="ml-3 text-gray-700">All Brands</span>
        </label>
    `;

    brands.forEach(brand => {
        html += `
            <label class="flex items-center">
                <input type="radio" name="mobileBrand" value="${brand}" ${filterState.brand === brand ? 'checked' : ''} class="w-5 h-5 text-primary">
                <span class="ml-3 text-gray-700">${brand}</span>
            </label>
        `;
    });

    html += `
      </div>
    `;

    mobileBrandsContainer.innerHTML = html;
  }
}

// Update price range
function updatePriceRange() {
  if (allProducts.length === 0) return;
  const prices = allProducts.map(p => p.price).filter(p => p > 0);
  if (prices.length === 0) return;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  // Update filter state with actual product prices
  filterState.minPrice = minPrice;
  filterState.maxPrice = Math.min(maxPrice, 2000); // Cap at 2000 as per your original
  debugLog('Price range:', minPrice, 'to', filterState.maxPrice);
  // Update sliders if they exist
  updatePriceSliders(minPrice, filterState.maxPrice);
}

// ==================== FILTER & SORT ====================
function applyFilters() {
  debugLog('Applying filters with', allProducts.length, 'products');
  debugLog('Current filter state:', filterState);
  filteredProducts = allProducts.filter(p => {
    // Category filter
    let categoryMatch = false;
    if (filterState.category === 'all') {
      categoryMatch = true;
    } else {
      const selectedCategory = OTC_CATEGORIES.find(cat => cat.id === filterState.category);
      if (!selectedCategory || selectedCategory.id === 'all') {
        categoryMatch = true;
      } else {
        const productCategory = p.category?.toLowerCase() || '';
   
        // Check if product matches any backend subcategory for this OTC category
        categoryMatch = selectedCategory.backendSubcategories.some(backendSubcat => {
          const backendSubLower = backendSubcat.toLowerCase();
     
          // Check for exact match or partial match
          return productCategory === backendSubLower ||
                 productCategory.includes(backendSubLower) ||
                 backendSubLower.includes(productCategory);
        });
   
        if (categoryMatch) {
          debugLog(`Product "${p.title}" matches category "${selectedCategory.name}" via category "${p.category}"`);
        }
      }
    }
    const brandMatch = filterState.brand === 'all' || p.brand === filterState.brand;
    const discMatch = p.discount >= filterState.discount;
    const priceMatch = p.price >= filterState.minPrice && p.price <= filterState.maxPrice;
    const matches = categoryMatch && brandMatch && discMatch && priceMatch;
    return matches;
  });
  debugLog('After filtering:', filteredProducts.length, 'products');
  sortProducts(filterState.sort);
  currentPage = 1;
  renderProducts();
}

// ==================== HEADER COUNTS ====================
function updateHeaderCounts() {
  const updateBadge = (id, count) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = count;
      el.classList.toggle("hidden", count === 0);
    }
  };
  const cartTotal = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  updateBadge("cartCount", cartTotal);
  updateBadge("wishlistCount", wishlist.length);
}

// ==================== WISHLIST TOGGLE (NOW SAME AS REF) ====================
async function toggleWishlist(productId) {
  const index = wishlist.findIndex(item => item.id === productId);
  if (index === -1) {
    // Add to wishlist
    const success = await addToWishlistBackend(productId);
    if (success) {
      wishlist.push({ id: productId });
      showToast("Added to wishlist");
    }
  } else {
    // Remove from wishlist
    const success = await removeFromWishlistBackend(productId);
    if (success) {
      wishlist.splice(index, 1);
      showToast("Removed from wishlist");
    }
  }
  updateHeaderCounts();
  renderProducts(); // Re-render to update heart icons instantly
}

function showToast(msg, type = 'info') {
  // Remove existing toast
  const existing = document.querySelector('.custom-toast');
  if (existing) existing.remove();
  const toast = document.createElement("div");
  let bgColor = 'bg-black'; // Default
    if (type === 'success') bgColor = 'bg-green-600';
    if (type === 'error') bgColor = 'bg-red-600';
    if (type === 'warning') bgColor = 'bg-yellow-600';
  toast.className = "custom-toast fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full z-50 shadow-lg";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ==================== PRODUCT CARD ====================
function createProductCard(p) {
  const inWishlist = wishlist.some(x => x.id === p.id);
  const isOutOfStock = !p.inStock;

  return `
    <div class="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-blue-100
                ${isOutOfStock ? 'opacity-70 grayscale cursor-not-allowed out-of-stock-card' : 'cursor-pointer'}"
         onclick="${isOutOfStock ? '' : `viewProductDetails(${p.id})`}">
      
      <div class="relative bg-[#f0fdfa] aspect-[4/3] overflow-hidden">
        <img src="${p.image}" alt="${p.title}"
             class="w-full h-full object-contain p-4 transition-transform duration-500 ${!isOutOfStock ? 'group-hover:scale-105' : ''}"
             onerror="this.src='http://localhost:8083/Images/product_details_fallback_img.jpg'">

        <!-- Stock badge -->
        <div class="stock-badge ${isOutOfStock ? 'out-of-stock' : 'in-stock'}">
          ${isOutOfStock ? 'Out of Stock' : 'In Stock'}
        </div>

        <!-- Discount badge -->
        ${p.discount > 0 ? `
          <div class="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow z-10">
            ${p.discount}% OFF
          </div>
        ` : ''}

        <!-- Wishlist heart -->
        <button type="button" 
                onclick="event.stopPropagation(); toggleWishlist(${p.id});"
                class="wishlist-btn absolute top-3 right-3 w-10 h-10 bg-white/95 rounded-full shadow-md flex items-center justify-center z-20
                       hover:scale-110 transition-transform ${isOutOfStock ? 'opacity-60 pointer-events-none' : ''}">
          <i class="${inWishlist ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart text-gray-600'} text-xl"></i>
        </button>
      </div>

      <div class="p-4 flex flex-col flex-grow">
        <p class="text-xs text-gray-600 uppercase font-medium">${p.brand || 'Generic'}</p>
        <h3 class="text-sm font-semibold text-gray-800 mt-1 line-clamp-2">${p.title}</h3>

        <div class="mt-3 flex items-center gap-2 flex-wrap">
          <span class="text-xl font-bold text-green-700">₹${p.price.toLocaleString('en-IN')}</span>
          ${p.originalPrice && p.originalPrice > p.price ? `
            <span class="text-sm text-gray-500 line-through">₹${p.originalPrice.toLocaleString('en-IN')}</span>
          ` : ''}
          ${p.discount > 0 ? `<span class="text-sm font-medium text-red-600">${p.discount}% off</span>` : ''}
        </div>

        <!-- Buttons container: View Details + WhatsApp -->
        <div class="mt-4 flex gap-3 flex-wrap">
          <button type="button"
                  onclick="event.stopPropagation(); ${isOutOfStock ? '' : `viewProductDetails(${p.id})`}"
                  class="flex-1 py-3 rounded-xl font-semibold text-base transition-all
                         ${isOutOfStock 
                           ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                           : 'bg-[#36C2CE] hover:bg-[#2aa8b3] text-white shadow-md hover:shadow-lg'}">
            ${isOutOfStock ? 'Out of Stock' : 'View Details'}
          </button>

          <button type="button"
                  onclick="event.stopPropagation(); orderOnWhatsApp(${p.id})"
                  class="flex-1 whatsapp-order-btn font-medium text-sm py-3 rounded-xl transition flex items-center justify-center gap-2
                         ${isOutOfStock 
                           ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                           : ''}">
            <i class="fab fa-whatsapp text-lg"></i>
            ${isOutOfStock ? 'N/A' : 'WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// ==================== ORDER ON WHATSAPP FUNCTION ====================
function orderOnWhatsApp(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  
  if (!product.inStock) {
    showToast('This product is currently out of stock.', 'warning');
    return;
  }
  
  // WhatsApp business number
  const phoneNumber = "8080473916";
  
  // Create the message
  const message = `Hello! I would like to order:\n\n` +
                  `*${product.title}*\n` +
                  `Price: ₹${product.price}\n` +
                  (product.originalPrice ? `Original: ₹${product.originalPrice} (${product.discount}% OFF)\n` : '') +
                  `Brand: ${product.brand}\n` +
                  `Category: ${OTC_CATEGORIES.find(cat => cat.id === product.category)?.name || product.category || 'OTC'}\n\n` +
                  `Please let me know about availability and delivery options.`;
  
  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // WhatsApp URL with country code
  const whatsappURL = `https://wa.me/+91${phoneNumber}?text=${encodedMessage}`;
  
  // Open in new tab
  window.open(whatsappURL, '_blank');
  
  console.log(`WhatsApp order initiated for: ${product.title}`);
}

// ==================== RENDERING ====================
function renderProducts() {
  debugLog('Rendering products, filteredProducts length:', filteredProducts.length);
  const start = (currentPage - 1) * pageSize;
  const paginated = filteredProducts.slice(start, start + pageSize);
  const grid = document.getElementById("productsGrid");
  if (grid) {
    if (paginated.length > 0) {
      grid.innerHTML = paginated.map(createProductCard).join("");
    } else {
      grid.innerHTML = `
        <div class="col-span-full text-center py-10">
          <div class="text-gray-400 mb-4">
            <i class="fas fa-search text-5xl"></i>
          </div>
          <p class="text-gray-500 mb-2">No products found</p>
          <p class="text-gray-400 text-sm">Try changing your filters</p>
          <button onclick="clearFilters()" class="mt-4 px-4 py-2 bg-[#36C2CE] text-white rounded-lg">
            Clear Filters
          </button>
        </div>
      `;
    }
  }
  setText("resultsCount", `Showing ${filteredProducts.length} products`);
  updatePageTitle();
  renderPagination();
}

function renderPagination() {
  const container = document.getElementById("pagination");
  if (!container) return;
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  container.innerHTML = "";
  if (totalPages <= 1) return;
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = `px-4 py-2 rounded border mx-1 ${i === currentPage ? 'bg-[#36C2CE] text-white' : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'}`;
    btn.onclick = () => {
      currentPage = i;
      renderProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    container.appendChild(btn);
  }
}

function sortProducts(type) {
  switch (type) {
    case 'price-low':
      filteredProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      filteredProducts.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'newest':
      filteredProducts.sort((a, b) => b.id - a.id);
      break;
    default:
      // Keep original order
      break;
  }
}

// Clear all filters - FIXED FUNCTION
function clearFilters() {
  // Reset filter state
  filterState = {
    category: 'all',
    brand: 'all',
    discount: 0,
    minPrice: 0,
    maxPrice: 2000,
    sort: 'default'
  };
  // Reset desktop UI
  document.querySelectorAll('#filterSidebar input[name="category"][value="all"]').forEach(radio => {
    radio.checked = true;
  });
  document.querySelectorAll('#filterSidebar input[name="brand"][value="all"]').forEach(radio => {
    radio.checked = true;
  });
  document.querySelectorAll('#filterSidebar input[name="discount"][value="0"]').forEach(radio => {
    radio.checked = true;
  });
  // Reset mobile UI
  document.querySelectorAll('#filterSheet input[name="mobileCategory"][value="all"]').forEach(radio => {
    radio.checked = true;
  });
  // Mobile brand radios will be recreated by updateBrandsDropdown()
  // Mobile discount radios
  document.querySelectorAll('#filterSheet input[name="mobileDiscount"][value="0"]').forEach(radio => {
    radio.checked = true;
  });
  // Reset sort
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) sortSelect.value = 'default';
  // Reset price sliders
  const desktopMin = document.getElementById('minThumb');
  const desktopMax = document.getElementById('maxThumb');
  const mobileMin = document.getElementById('mobileMinThumb');
  const mobileMax = document.getElementById('mobileMaxThumb');
  if (desktopMin) desktopMin.value = 0;
  if (desktopMax) desktopMax.value = 2000;
  if (mobileMin) mobileMin.value = 0;
  if (mobileMax) mobileMax.value = 2000;
  // Update filter state
  filterState.minPrice = 0;
  filterState.maxPrice = 2000;
  // Update price displays
  const desktopMinVal = document.getElementById('minValue');
  const desktopMaxVal = document.getElementById('maxValue');
  const mobileMinVal = document.getElementById('mobileMinValue');
  const mobileMaxVal = document.getElementById('mobileMaxValue');
  if (desktopMinVal) desktopMinVal.textContent = '₹0';
  if (desktopMaxVal) desktopMaxVal.textContent = '₹2,000';
  if (mobileMinVal) mobileMinVal.textContent = '₹0';
  if (mobileMaxVal) mobileMaxVal.textContent = '₹2,000';
  // Update brands dropdown to refresh mobile brands
  updateBrandsDropdown();
  // Apply filters
  applyFilters();
  // Also close mobile sheet if open
  const filterSheet = document.getElementById('filterSheet');
  const backdrop = document.getElementById('mobileSheetBackdrop');
  if (filterSheet && backdrop) {
    filterSheet.classList.add('translate-y-full');
    backdrop.classList.add('hidden');
  }
  showToast('All filters have been cleared', 'success');
}

// ==================== PRICE SLIDERS ====================
function initPriceSliders() {
  // Desktop sliders
  const desktopMin = document.getElementById('minThumb');
  const desktopMax = document.getElementById('maxThumb');
  if (desktopMin && desktopMax) {
    desktopMin.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      const maxValue = parseInt(desktopMax.value);
 
      if (value > maxValue) {
        e.target.value = maxValue;
        filterState.minPrice = maxValue;
      } else {
        filterState.minPrice = value;
      }
 
      document.getElementById('minValue').textContent = `₹${filterState.minPrice}`;
      applyFilters();
    });
    desktopMax.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      const minValue = parseInt(desktopMin.value);
 
      if (value < minValue) {
        e.target.value = minValue;
        filterState.maxPrice = minValue;
      } else {
        filterState.maxPrice = value;
      }
 
      document.getElementById('maxValue').textContent = `₹${filterState.maxPrice}`;
      applyFilters();
    });
  }
  // Mobile sliders
  const mobileMin = document.getElementById('mobileMinThumb');
  const mobileMax = document.getElementById('mobileMaxThumb');
  if (mobileMin && mobileMax) {
    mobileMin.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      const maxValue = parseInt(mobileMax.value);
 
      if (value > maxValue) {
        e.target.value = maxValue;
        filterState.minPrice = maxValue;
      } else {
        filterState.minPrice = value;
      }
 
      document.getElementById('mobileMinValue').textContent = `₹${filterState.minPrice}`;
      // Don't apply filters here, wait for Apply button
    });
    mobileMax.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      const minValue = parseInt(mobileMin.value);
 
      if (value < minValue) {
        e.target.value = minValue;
        filterState.maxPrice = minValue;
      } else {
        filterState.maxPrice = value;
      }
 
      document.getElementById('mobileMaxValue').textContent = `₹${filterState.maxPrice}`;
      // Don't apply filters here, wait for Apply button
    });
  }
}

function updatePriceSliders(minPrice, maxPrice) {
  // Ensure min and max are valid numbers
  minPrice = Math.max(0, Math.floor(minPrice));
  maxPrice = Math.max(minPrice + 100, Math.ceil(maxPrice));
  // Update desktop sliders
  const desktopMin = document.getElementById('minThumb');
  const desktopMax = document.getElementById('maxThumb');
  const desktopMinVal = document.getElementById('minValue');
  const desktopMaxVal = document.getElementById('maxValue');
  if (desktopMin && desktopMax) {
    desktopMin.min = minPrice;
    desktopMin.max = maxPrice;
    desktopMin.value = filterState.minPrice;
    desktopMax.min = minPrice;
    desktopMax.max = maxPrice;
    desktopMax.value = filterState.maxPrice;
    if (desktopMinVal) desktopMinVal.textContent = `₹${filterState.minPrice}`;
    if (desktopMaxVal) desktopMaxVal.textContent = `₹${filterState.maxPrice}`;
  }
  // Update mobile sliders
  const mobileMin = document.getElementById('mobileMinThumb');
  const mobileMax = document.getElementById('mobileMaxThumb');
  const mobileMinVal = document.getElementById('mobileMinValue');
  const mobileMaxVal = document.getElementById('mobileMaxValue');
  if (mobileMin && mobileMax) {
    mobileMin.min = minPrice;
    mobileMin.max = maxPrice;
    mobileMin.value = filterState.minPrice;
    mobileMax.min = minPrice;
    mobileMax.max = maxPrice;
    mobileMax.value = filterState.maxPrice;
    if (mobileMinVal) mobileMinVal.textContent = `₹${filterState.minPrice}`;
    if (mobileMaxVal) mobileMaxVal.textContent = `₹${filterState.maxPrice}`;
  }
}

// ==================== INITIALIZATION ====================
async function init() {
  console.log('Initializing OTC page...');
  // Initialize mobile sheets
  initMobileSheets();
  // Initialize price sliders
  initPriceSliders();
  // Initialize sort select
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.value = filterState.sort;
    sortSelect.addEventListener("change", (e) => {
      filterState.sort = e.target.value;
      sortProducts(filterState.sort);
      renderProducts();
    });
  }
  // Initialize category filters (your HTML already has them, just add listeners)
  initCategoryFilters();
  // Initialize discount filters
  initDiscountFilters();
  // Initialize "Apply Desktop Filters" button
  initDesktopFilterButton();
  // Initialize reset button
    initResetButton();
  // Fetch initial products
  await fetchProducts();
  await loadWishlistFromBackend(); // Load wishlist from backend after products
  // Update header counts
  updateHeaderCounts();
  // Initialize banner slider
  initBanner();

  // Prevent wishlist button from triggering card click
  document.getElementById("productsGrid")?.addEventListener("click", (e) => {
    if (e.target.closest(".wishlist-btn")) {
      e.stopPropagation();
    }
  });
}

// Initialize category filters
function initCategoryFilters() {
  // Desktop category filters
  document.querySelectorAll('#filterSidebar input[name="category"]').forEach(input => {
    input.addEventListener('change', (e) => {
      filterState.category = e.target.value;
      applyFilters();
    });
  });
  // Mobile category filters
  document.querySelectorAll('#filterSheet input[name="mobileCategory"]').forEach(input => {
    input.addEventListener('change', (e) => {
      // Update filter state but don't apply yet
      filterState.category = e.target.value;
    });
  });
}

// Initialize discount filters
function initDiscountFilters() {
  // Desktop discount filters
  const desktopDiscountContainer = document.querySelector('#filterSidebar input[name="discount"]')?.closest('.mt-4');
  if (desktopDiscountContainer && desktopDiscountContainer.querySelectorAll('input').length === 0) {
    const discountOptions = [
      { value: 0, label: 'All Products' },
      { value: 10, label: '10% or more' },
      { value: 20, label: '20% or more' },
      { value: 30, label: '30% or more' }
    ];
    let html = '';
    discountOptions.forEach(option => {
      html += `
        <label class="flex items-center"><input type="radio" name="discount" value="${option.value}" ${filterState.discount === option.value ? 'checked' : ''} class="w-5 h-5 text-primary"> <span class="ml-3 text-gray-700">${option.label}</span></label>
      `;
    });
    desktopDiscountContainer.innerHTML = html;
    desktopDiscountContainer.querySelectorAll('input[name="discount"]').forEach(input => {
      input.addEventListener('change', (e) => {
        filterState.discount = parseInt(e.target.value);
        applyFilters();
      });
    });
  }
  // Mobile discount filters (already in HTML)
  document.querySelectorAll('#filterSheet input[name="mobileDiscount"]').forEach(input => {
    input.addEventListener('change', (e) => {
      filterState.discount = parseInt(e.target.value);
    });
  });
}

// Initialize desktop filter button
function initDesktopFilterButton() {
  const applyDesktopBtn = document.getElementById('applyDesktopFilters');
  if (applyDesktopBtn) {
    applyDesktopBtn.addEventListener('click', () => {
      // Get current filter values
      const category = document.querySelector('#filterSidebar input[name="category"]:checked')?.value || 'all';
      const brand = document.querySelector('#filterSidebar input[name="brand"]:checked')?.value || 'all';
      const discount = parseInt(document.querySelector('#filterSidebar input[name="discount"]:checked')?.value || '0');
 
      filterState.category = category;
      filterState.brand = brand;
      filterState.discount = discount;
 
      applyFilters();
    });
  }
}

// Initialize banner slider
function initBanner() {
  const slides = document.querySelectorAll('.banner-slide');
  const dots = document.querySelectorAll('.banner-dot');
  if (slides.length === 0) return;
  let currentSlide = 0;
  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    currentSlide = index;
  }
  // Auto-rotate slides every 5 seconds
  setInterval(() => {
    let nextSlide = currentSlide + 1;
    if (nextSlide >= slides.length) {
      nextSlide = 0;
    }
    showSlide(nextSlide);
  }, 5000);
  // Add click handlers to dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
    });
  });
}

// ==================== MOBILE SHEETS ====================
function initMobileSheets() {
  const backdrop = document.getElementById("mobileSheetBackdrop");
  const filterSheet = document.getElementById("filterSheet");
  const sortSheet = document.getElementById("sortSheet");
  if (!backdrop || !filterSheet || !sortSheet) {
    console.warn('Mobile sheet elements not found');
    return;
  }
  // Open Filter Sheet
  document.getElementById("openFilterSheet")?.addEventListener("click", () => {
    filterSheet.classList.remove("translate-y-full");
    backdrop.classList.remove("hidden");
  });
  // Open Sort Sheet
  document.getElementById("openSortSheet")?.addEventListener("click", () => {
    sortSheet.classList.remove("translate-y-full");
    backdrop.classList.remove("hidden");
  });
  // Close Filter Sheet
  document.getElementById("closeFilterSheet")?.addEventListener("click", () => {
    filterSheet.classList.add("translate-y-full");
    backdrop.classList.add("hidden");
  });
  // Close Sort Sheet
  document.getElementById("closeSortSheet")?.addEventListener("click", () => {
    sortSheet.classList.add("translate-y-full");
    backdrop.classList.add("hidden");
  });
  // Close on backdrop click
  backdrop.addEventListener("click", () => {
    filterSheet.classList.add("translate-y-full");
    sortSheet.classList.add("translate-y-full");
    backdrop.classList.add("hidden");
  });
  // Apply Mobile Filters
  document.getElementById("applyMobileFilters")?.addEventListener("click", () => {
    const category = document.querySelector('input[name="mobileCategory"]:checked')?.value || 'all';
    const brand = document.querySelector('input[name="mobileBrand"]:checked')?.value || 'all';
    const discount = parseInt(document.querySelector('input[name="mobileDiscount"]:checked')?.value || '0');
    filterState.category = category;
    filterState.brand = brand;
    filterState.discount = discount;
    applyFilters();
    filterSheet.classList.add("translate-y-full");
    backdrop.classList.add("hidden");
  });
  // Apply Mobile Sort
  document.getElementById("applySortBtn")?.addEventListener("click", () => {
    const sort = document.querySelector('input[name="mobileSort"]:checked')?.value || 'default';
    filterState.sort = sort;
    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) sortSelect.value = sort;
    sortProducts(sort);
    renderProducts();
    sortSheet.classList.add("translate-y-full");
    backdrop.classList.add("hidden");
  });
  // Clear Mobile Filters
  document.getElementById("clearMobileFilters")?.addEventListener("click", () => {
    clearFilters();
    // filterSheet.classList.add("translate-y-full");
    // backdrop.classList.add("hidden");
  });
}

// ==================== ON LOAD ====================
document.addEventListener("DOMContentLoaded", init);




























// // ==================== otc.js – CONNECTED TO BACKEND ====================
// // Base API URL - Update this to your backend URL
// const API_BASE_URL = 'http://localhost:8083/api/products';
// const WISHLIST_API_BASE = "http://localhost:8083/api/wishlist";

// // Global State
// let allProducts = [];
// let filteredProducts = [];
// let wishlist = []; // Now only stores { id: productId } – synced with backend
// let cart = JSON.parse(localStorage.getItem("cart") || "[]");
// let currentPage = 1;
// const pageSize = 12;

// // Enable debug mode
// const DEBUG_MODE = true;

// // Persistent Filter State
// let filterState = {
//   category: 'all',
//   brand: 'all',
//   discount: 0,
//   minPrice: 0,
//   maxPrice: 2000,
//   sort: 'default'
// };

// // =============== OTC CATEGORIES ===============
// const OTC_CATEGORIES = [
//   {
//     id: 'all',
//     name: 'All OTC Products',
//     backendSubcategories: []
//   },
//   {
//     id: 'ayurvedic',
//     name: 'Ayurvedic Medicines',
//     backendSubcategories: ['Ayurvedic Medicines', 'Ayurvedic', 'Herbal']
//   },
//   {
//     id: 'allergy',
//     name: 'Allergy',
//     backendSubcategories: ['Allergy', 'Allergy Relief']
//   },
//   {
//     id: 'fever',
//     name: 'Fever & Flu',
//     backendSubcategories: ['Fever & Flu', 'Fever', 'Flu']
//   },
//   {
//     id: 'pain',
//     name: 'Pain Relief',
//     backendSubcategories: ['Pain Relief', 'Pain']
//   },
//   {
//     id: 'ointments',
//     name: 'Ointments',
//     backendSubcategories: ['Ointments', 'Creams']
//   },
//   {
//     id: 'health-supp',
//     name: 'Health Supplements',
//     backendSubcategories: ['Health Supplements', 'Supplements']
//   },
//   {
//     id: 'Post delivery recovery',
//     name: 'Post delivery recovery',
//     backendSubcategories: ['Post delivery recovery', 'Post delivery recovery']
//   }
  
  
// ];

// // ==================== RESET FILTERS FUNCTION ====================
// function resetAllFilters() {
//     console.log('Resetting all OTC filters...');
    
//     // Reset filter state to default values
//     filterState = {
//         category: 'all',
//         brand: 'all',
//         discount: 0,
//         minPrice: 0,
//         maxPrice: 2000,
//         sort: 'default'
//     };
    
//     // Reset all category radio buttons
//     const desktopCategoryAll = document.querySelector('#filterSidebar input[name="category"][value="all"]');
//     if (desktopCategoryAll) desktopCategoryAll.checked = true;
    
//     const mobileCategoryAll = document.querySelector('#filterSheet input[name="mobileCategory"][value="all"]');
//     if (mobileCategoryAll) mobileCategoryAll.checked = true;
    
//     // Reset all brand radio buttons
//     const desktopBrandAll = document.querySelector('#filterSidebar input[name="brand"][value="all"]');
//     if (desktopBrandAll) desktopBrandAll.checked = true;
    
//     const mobileBrandAll = document.querySelector('#filterSheet input[name="mobileBrand"][value="all"]');
//     if (mobileBrandAll) mobileBrandAll.checked = true;
    
//     // Reset all discount radio buttons
//     const desktopDiscountZero = document.querySelector('#filterSidebar input[name="discount"][value="0"]');
//     if (desktopDiscountZero) desktopDiscountZero.checked = true;
    
//     const mobileDiscountZero = document.querySelector('#filterSheet input[name="mobileDiscount"][value="0"]');
//     if (mobileDiscountZero) mobileDiscountZero.checked = true;
    
//     // Reset sort dropdown
//     const sortSelect = document.getElementById("sortSelect");
//     if (sortSelect) {
//         sortSelect.value = 'default';
//     }
    
//     // Reset mobile sort radio
//     const mobileSortDefault = document.querySelector('input[name="mobileSort"][value="default"]');
//     if (mobileSortDefault) mobileSortDefault.checked = true;
    
//     // Reset price sliders to default values (0-2000)
//     const desktopMin = document.getElementById('minThumb');
//     const desktopMax = document.getElementById('maxThumb');
//     const mobileMin = document.getElementById('mobileMinThumb');
//     const mobileMax = document.getElementById('mobileMaxThumb');
    
//     if (desktopMin) desktopMin.value = 0;
//     if (desktopMax) desktopMax.value = 2000;
//     if (mobileMin) mobileMin.value = 0;
//     if (mobileMax) mobileMax.value = 2000;
    
//     // Update filter state with reset values
//     filterState.minPrice = 0;
//     filterState.maxPrice = 2000;
    
//     // Update price display values
//     const desktopMinVal = document.getElementById('minValue');
//     const desktopMaxVal = document.getElementById('maxValue');
//     const mobileMinVal = document.getElementById('mobileMinValue');
//     const mobileMaxVal = document.getElementById('mobileMaxValue');
    
//     if (desktopMinVal) desktopMinVal.textContent = '₹0';
//     if (desktopMaxVal) desktopMaxVal.textContent = '₹2,000';
//     if (mobileMinVal) mobileMinVal.textContent = '₹0';
//     if (mobileMaxVal) mobileMaxVal.textContent = '₹2,000';
    
//     // Update slider fill visuals
//     const desktopFill = document.querySelector('#filterSidebar .slider-fill');
//     const mobileFill = document.querySelector('#filterSheet .slider-fill');
    
//     if (desktopFill) {
//         desktopFill.style.left = '0%';
//         desktopFill.style.width = '100%';
//     }
//     if (mobileFill) {
//         mobileFill.style.left = '0%';
//         mobileFill.style.width = '100%';
//     }
    
//     // Close expanded sections if open
//     const desktopBrandSection = document.querySelector('#filterSidebar .border-b.pb-4 .mt-2.space-y-2');
//     if (desktopBrandSection && !desktopBrandSection.classList.contains('hidden')) {
//         desktopBrandSection.classList.add('hidden');
//         const brandHeader = desktopBrandSection.previousElementSibling;
//         if (brandHeader) {
//             const chevron = brandHeader.querySelector('i');
//             if (chevron) chevron.classList.remove('rotate-180');
//         }
//     }
    
//     const desktopDiscountSection = document.querySelector('#filterSidebar .border-b.pb-4 + div .mt-4.space-y-2');
//     if (desktopDiscountSection && !desktopDiscountSection.classList.contains('hidden')) {
//         desktopDiscountSection.classList.add('hidden');
//         const discountHeader = desktopDiscountSection.previousElementSibling;
//         if (discountHeader) {
//             const chevron = discountHeader.querySelector('i');
//             if (chevron) chevron.classList.remove('rotate-180');
//         }
//     }
    
//     // Refresh the UI dropdowns
//     // setTimeout(() => {
//     //     updateBrandsDropdown();
//     //     initDiscountFilters();
//     // }, 100);
//     // Refresh the UI dropdowns - FIXED: Call the proper function to rebuild brands
// updateBrandsDropdown();
    
//     // Apply the reset filters
//     applyFilters();
    
//     // Show toast notification
//     showToast('All filters have been reset', 'success');
    
//     console.log('OTC filters reset to default values');
// }

// // Initialize reset button event listener
// function initResetButton() {
//     const resetBtn = document.getElementById('resetDesktopFilters');
//     if (resetBtn) {
//         resetBtn.addEventListener('click', resetAllFilters);
//         console.log('Reset button event listener added');
//     }
// }

// // Helper: Safe text update
// function setText(id, text) {
//   const el = document.getElementById(id);
//   if (el) el.textContent = text;
// }

// // Update page title based on category
// function updatePageTitle() {
//   const titleEl = document.getElementById('pageTitle');
//   if (titleEl) {
//     if (filterState.category === 'all') {
//       titleEl.textContent = 'All OTC Products';
//     } else {
//       const category = OTC_CATEGORIES.find(cat => cat.id === filterState.category);
//       titleEl.textContent = category ? category.name : 'OTC Products';
//     }
//   }
// }

// // Debug logging function
// function debugLog(...args) {
//   if (DEBUG_MODE) {
//     console.log('[DEBUG]', ...args);
//   }
// }

// // =============== USER ID (EXACTLY LIKE REF) ===============
// function getCurrentUserId() {
//   try {
//     const userData = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
//     if (!userData) return null;
//     const user = JSON.parse(userData);
//     const id = user.userId || user.id || user.userID;
//     return id ? Number(id) : null;
//   } catch (error) {
//     console.error('Error reading currentUser:', error);
//     return null;
//   }
// }

// const CURRENT_USER_ID = getCurrentUserId();
// console.log("====getCurrentUserId function returns :", CURRENT_USER_ID);

// // =============== WISHLIST BACKEND FUNCTIONS (MATCHING REF) ===============
// async function addToWishlistBackend(productId) {
//     if (!CURRENT_USER_ID) {
//         showToast("Please log in to add to wishlist");
//         return false;
//     }
//     try {
//         const response = await fetch(`${WISHLIST_API_BASE}/add-wishlist-items`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 userId: CURRENT_USER_ID,
//                 productId: productId,
//                 productType: "MEDICINE"
//             })
//         });
//         if (response.ok) {
//             console.log("Added to backend wishlist");
//             return true;
//         } else {
//             console.error("Failed to add to backend wishlist");
//             return false;
//         }
//     } catch (err) {
//         console.error("Error calling wishlist API:", err);
//         return false;
//     }
// }

// async function removeFromWishlistBackend(productId) {
//     if (!CURRENT_USER_ID) return false;
//     try {
//         const response = await fetch(`${WISHLIST_API_BASE}/remove-wishlist-items`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 userId: CURRENT_USER_ID,
//                 productId: productId
//             })
//         });
//         if (response.ok) {
//             console.log("Removed from backend wishlist");
//             return true;
//         } else {
//             console.error("Failed to remove from backend wishlist");
//             return false;
//         }
//     } catch (err) {
//         console.error("Error removing from wishlist:", err);
//         return false;
//     }
// }

// async function loadWishlistFromBackend() {
//     if (!CURRENT_USER_ID) {
//         wishlist = [];
//         updateHeaderCounts();
//         return;
//     }
//     try {
//         const response = await fetch(`${WISHLIST_API_BASE}/get-wishlist-items?userId=${CURRENT_USER_ID}`);
//         if (!response.ok) {
//             console.error("Failed to fetch wishlist");
//             wishlist = [];
//             return;
//         }
//         const items = await response.json();
//         wishlist = items
//             .filter(item => item.productType === "MEDICINE")
//             .map(item => ({ id: item.productId }));
//         console.log("Loaded wishlist from backend:", wishlist.length, "items");
//         updateHeaderCounts();
//         renderProducts(); // Refresh heart icons
//     } catch (err) {
//         console.error("Error syncing wishlist:", err);
//         wishlist = [];
//     }
// }

// // ==================== FETCH PRODUCTS FROM BACKEND ====================

// const category = "Over-the-Counter (OTC) Medicines";  
// const encodedCategory = encodeURIComponent(category);
// async function fetchProducts() {
//   try {
//     debugLog('Starting fetchProducts for OTC...');
//     setText("resultsCount", "Loading products...");
//     // Clear existing products
//     allProducts = [];
//     filteredProducts = [];
//     // Fetch ALL products
// const url = `${API_BASE_URL}/get-by-category/${encodedCategory}?page=0&size=200`;
//     debugLog('Fetching from URL:', url);
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         'Accept': 'application/json',
//         'Content-Type': 'application/json'
//       }
//     });
//     debugLog('Response status:', response.status, response.statusText);
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const data = await response.json();
//     processProducts(data);
//   } catch (error) {
//     console.error('Error in fetchProducts:', error);
//     showToast('Error loading products. Please check console for details.');
//     setText("resultsCount", "Failed to load products");
//     // Show empty state
//     const grid = document.getElementById("productsGrid");
//     if (grid) {
//       grid.innerHTML = `
//         <div class="col-span-full text-center py-10">
//           <div class="text-gray-400 mb-4">
//             <i class="fas fa-exclamation-triangle text-5xl"></i>
//           </div>
//           <p class="text-gray-500 mb-2">Failed to load products</p>
//           <p class="text-gray-400 text-sm">Error: ${error.message}</p>
//           <button onclick="fetchProducts()" class="mt-4 px-4 py-2 bg-[#36C2CE] text-white rounded-lg">
//             Retry
//           </button>
//         </div>
//       `;
//     }
//   }
// }

// function processProducts(data) {
//   debugLog('API Response data:', data);
//   // Handle different response formats
//   let productsArray = [];
//   if (Array.isArray(data)) {
//     productsArray = data;
//   } else if (data.content && Array.isArray(data.content)) {
//     productsArray = data.content;
//   } else if (data.products && Array.isArray(data.products)) {
//     productsArray = data.products;
//   } else if (typeof data === 'object' && data !== null) {
//     productsArray = [data];
//   }
//   debugLog('Total products from API:', productsArray.length);
//   if (productsArray.length === 0) {
//     debugLog('No products received from API');
//     showToast('No products available. Please try again later.');
//   }
//   // Transform ALL products first
//   const allTransformedProducts = transformBackendProducts(productsArray);
//   // DEBUG: Check each product
//   debugLog('=== CHECKING OTC PRODUCT CATEGORIES ===');
//   allTransformedProducts.forEach(product => {
//     debugLog(`Product: "${product.title}" - Category: "${product.category}"`);
//   });
//   debugLog('=== END CHECK ===');
//   // Get all unique categories from products
//   const allCategories = [...new Set(allTransformedProducts.map(p => p.category))];
//   debugLog('All categories in DB:', allCategories);
//   // FILTER: Only keep products that match our OTC categories
//   allProducts = allTransformedProducts.filter(product => {
//     const productCategory = product.category || '';
//     // Check if this product's category matches any OTC category
//     const isOTCProduct = OTC_CATEGORIES.some(category => {
//       if (category.id === 'all') return false; // Skip "all" category
 
//       return category.backendSubcategories.some(backendSubcat => {
//         // Case-insensitive comparison
//         const productCatLower = productCategory.toLowerCase();
//         const backendSubLower = backendSubcat.toLowerCase();
   
//         // Check for exact match or partial match
//         return productCatLower === backendSubLower ||
//               productCatLower.includes(backendSubLower) ||
//               backendSubLower.includes(productCatLower);
//       });
//     });
//     if (!isOTCProduct) {
//       debugLog(`Filtered out (non-OTC): ${product.title} - ${product.category}`);
//     }
//     return isOTCProduct;
//   });
//   debugLog('OTC products after filtering:', allProducts.length);
//   debugLog('OTC product categories:', [...new Set(allProducts.map(p => p.category))]);
//   // Apply filters and update UI
//   applyFilters();
//   updateUIWithProducts();
// }

// // // Transform backend product format to frontend format
// // function transformBackendProducts(backendProducts) {
// //   if (!Array.isArray(backendProducts) || backendProducts.length === 0) {
// //     return [];
// //   }
// //   debugLog('Transforming', backendProducts.length, 'products');
// //   return backendProducts.map((product, index) => {
// //     try {
// //       // Extract basic fields
// //       const id = product.productId || product.id || index + 1;
// //       const title = product.productName || product.name || 'Unnamed Product';

// //       // === FIXED: Robust price handling (supports number, array, null, missing) ===
// //       let price = 100; // Safe fallback
// //       if (product.productPrice != null) {
// //         if (Array.isArray(product.productPrice) && product.productPrice.length > 0) {
// //           price = Number(product.productPrice[0]) || price;
// //         } else {
// //           price = Number(product.productPrice) || price;
// //         }
// //       }

// //       let originalPrice = price * 1.2; // Default 20% higher MRP
// //       if (product.productOldPrice != null) {
// //         if (Array.isArray(product.productOldPrice) && product.productOldPrice.length > 0) {
// //           originalPrice = Number(product.productOldPrice[0]) || originalPrice;
// //         } else {
// //           originalPrice = Number(product.productOldPrice) || originalPrice;
// //         }
// //       } else if (product.mrp != null) {
// //         originalPrice = Number(product.mrp) || originalPrice;
// //       }

// //       // Final safety: ensure valid numbers and reasonable values
// //       price = (isNaN(price) || price <= 0) ? 100 : Math.round(price);
// //       originalPrice = (isNaN(originalPrice) || originalPrice <= price) 
// //         ? Math.round(price * 1.2) 
// //         : Math.round(originalPrice);

// //       const discount = originalPrice > price 
// //         ? Math.round(((originalPrice - price) / originalPrice) * 100) 
// //         : 0;

// //       // === Rest of your code remains 100% unchanged ===
// //       const category = product.productSubCategory || 'Unknown';
// //       const brand = product.brandName || product.brand || product.manufacturer || 'Generic';
// //       const description = product.productDescription || product.description || 'No description available';
// //       const stockQuantity = product.productQuantity || product.stockQuantity || product.quantity || 0;
// //       const inStock = product.productStock === 'In-Stock' || stockQuantity > 0;

// //       let imageUrl = 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop';

// //       if (product.productMainImage) {
// //         if (product.productMainImage.startsWith('/api/')) {
// //           imageUrl = `http://localhost:8083${product.productMainImage}`;
// //         } else if (product.productMainImage.startsWith('data:image')) {
// //           imageUrl = product.productMainImage;
// //         } else if (product.productMainImage.startsWith('http')) {
// //           imageUrl = product.productMainImage;
// //         } else {
// //           imageUrl = `data:image/jpeg;base64,${product.productMainImage}`;
// //         }
// //       } else if (product.productId) {
// //         imageUrl = `${API_BASE_URL}/${product.productId}/image`;
// //       }

// //       return {
// //         id: id,
// //         title: title,
// //         price: price,
// //         originalPrice: originalPrice,
// //         discount: discount,
// //         rating: product.rating || product.productRating || 4.0,
// //         reviewCount: product.reviewCount || product.totalReviews || Math.floor(Math.random() * 1000),
// //         category: category,
// //         brand: brand,
// //         image: imageUrl,
// //         description: description,
// //         inStock: inStock,
// //         stockQuantity: stockQuantity
// //       };
// //     } catch (error) {
// //       console.error('Error transforming product:', product, error);
// //       return null;
// //     }
// //   }).filter(product => product !== null);
// // }



// // Transform backend product format to frontend format
// function transformBackendProducts(backendProducts) {
//   if (!Array.isArray(backendProducts) || backendProducts.length === 0) {
//     return [];
//   }

//   debugLog('Transforming', backendProducts.length, 'products');

//   return backendProducts.map((product, index) => {
//     try {
//       // Basic identification
//       const id = product.productId || product.id || index + 1;
//       const title = product.productName || product.name || 'Unnamed Product';

//       // ── Selling price (current customer price) ─────────────────────────────
//       let sellingPrice = null;

//       if (product.productPrice != null) {
//         if (Array.isArray(product.productPrice) && product.productPrice.length > 0) {
//           sellingPrice = Number(product.productPrice[0]);
//         } else if (typeof product.productPrice === 'number') {
//           sellingPrice = Number(product.productPrice);
//         }
//       }

//       // Only fallback if truly invalid/missing
//       if (sellingPrice === null || isNaN(sellingPrice) || sellingPrice <= 0) {
//         sellingPrice = 0; // or you can throw / skip – 0 makes it obvious in UI
//         console.warn(`Invalid/missing selling price for product ${id} – using 0`);
//       }

//       // ── Original / MRP / Old price ─────────────────────────────────────────
//       let originalPrice = null;

//       // Priority 1: productOldPrice
//       if (product.productOldPrice != null) {
//         if (Array.isArray(product.productOldPrice) && product.productOldPrice.length > 0) {
//           originalPrice = Number(product.productOldPrice[0]);
//         } else if (typeof product.productOldPrice === 'number') {
//           originalPrice = Number(product.productOldPrice);
//         }
//       }
//       // Priority 2: mrp field (if it exists)
//       else if (product.mrp != null) {
//         originalPrice = Number(product.mrp);
//       }

//       // Clean up – only keep if valid and positive
//       if (originalPrice !== null) {
//         if (isNaN(originalPrice) || originalPrice <= 0) {
//           originalPrice = null;
//         }
//       }

//       // ── Discount logic – only if meaningful ────────────────────────────────
//       let discount = 0;
//       let displayOriginalPrice = null;

//       if (originalPrice !== null && originalPrice > sellingPrice && sellingPrice > 0) {
//         const percent = ((originalPrice - sellingPrice) / originalPrice) * 100;

//         // Configurable minimum threshold – change this value as needed
//         const MIN_DISCOUNT_PERCENT_TO_SHOW = 5;

//         if (percent >= MIN_DISCOUNT_PERCENT_TO_SHOW) {
//           discount = Math.min(Math.round(percent), 90);
//           displayOriginalPrice = originalPrice;
//         }
//       }

//       // ── Other common fields ────────────────────────────────────────────────
//       const category = product.productSubCategory || product.productCategory || 'Unknown';
//       const brand = product.brandName || product.brand || product.manufacturer || 'Generic';
//       const description = product.productDescription || product.description || 'No description available';
//       const stockQuantity = product.productQuantity || product.stockQuantity || product.quantity || 0;

//       const inStock = 
//         product.productStock === 'In Stock' ||
//         product.productStock === 'In-Stock' ||
//         product.productStock === 'Available' ||
//         product.productStatus === 'Available' ||
//         stockQuantity > 0;

//       // Image handling – adapt to your actual image serving logic
//       let imageUrl = 'https://via.placeholder.com/400?text=No+Image';
//       if (product.productMainImage) {
//         if (product.productMainImage.startsWith('/api/')) {
//           imageUrl = `http://localhost:8083${product.productMainImage}`;
//         } else if (product.productMainImage.startsWith('http')) {
//           imageUrl = product.productMainImage;
//         } else if (product.productMainImage.startsWith('data:image')) {
//           imageUrl = product.productMainImage;
//         } else {
//           imageUrl = `data:image/jpeg;base64,${product.productMainImage}`;
//         }
//       } else if (product.productId) {
//         imageUrl = `http://localhost:8083/api/products/${product.productId}/image`;
//       }

//       // Final frontend-friendly object
//       return {
//         id,
//         title,
//         price: sellingPrice,
//         originalPrice: displayOriginalPrice,   // null → no strikethrough
//         discount,                              // 0 → no % badge
//         rating: product.rating || product.productRating || 4.0,
//         reviewCount: product.reviewCount || product.totalReviews || 0,
//         category,
//         brand,
//         image: imageUrl,
//         description,
//         inStock,
//         stockQuantity,
//         // Optional extra fields you might use later
//         subcategory: product.productSubCategory || '',
//         sku: product.sku || '',
//         prescriptionRequired: !!product.prescriptionRequired
//       };
//     } catch (error) {
//       console.error('Error transforming product id:', product?.productId || index, error);
//       return null;
//     }
//   }).filter(product => product !== null);
// }



// // Update UI with loaded products
// function updateUIWithProducts() {
//   // Update brands dropdown
//   updateBrandsDropdown();
//   // Update price range
//   updatePriceRange();
//   // Render products
//   renderProducts();
// }

// // Update brands dropdown
// function updateBrandsDropdown() {
//   const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))];
//   brands.sort();
//   debugLog('Available brands:', brands);
//   // Update desktop brands (the brands dropdown in sidebar)
//   const desktopBrandsContainer = document.querySelector('#filterSidebar .border-b.pb-4 .mt-2.space-y-2');
//   if (desktopBrandsContainer) {
//     let html = `
//       <label class="flex items-center"><input type="radio" name="brand" value="all" ${filterState.brand === 'all' ? 'checked' : ''} class="w-5 h-5 text-primary"> <span class="ml-3 text-gray-700">All Brands</span></label>
//     `;
//     brands.forEach(brand => {
//       html += `
//         <label class="flex items-center"><input type="radio" name="brand" value="${brand}" ${filterState.brand === brand ? 'checked' : ''} class="w-5 h-5 text-primary"> <span class="ml-3 text-gray-700">${brand}</span></label>
//       `;
//     });
//     desktopBrandsContainer.innerHTML = html;
//     // Add event listeners
//     desktopBrandsContainer.querySelectorAll('input[name="brand"]').forEach(input => {
//       input.addEventListener('change', (e) => {
//         filterState.brand = e.target.value;
//         applyFilters();
//       });
//     });
//   }
  
//   // Update mobile brands (inside filter sheet)
// // Update mobile brands (inside filter sheet)
//   const mobileBrandsContainer = document.querySelector('#filterSheet [name="mobileBrand"]')?.parentElement;
  
  
//   if (mobileBrandsContainer) {
//     let html = `
//         <div class="space-y-2">
//             <label class="flex items-center">
//                 <input type="radio" name="mobileBrand" value="all" ${filterState.brand === 'all' ? 'checked' : ''} class="w-5 h-5 text-primary">
//                 <span class="ml-3 text-gray-700">All Brands</span>
//             </label>
//     `;

//     brands.forEach(brand => {
//         html += `
//             <label class="flex items-center">
//                 <input type="radio" name="mobileBrand" value="${brand}" ${filterState.brand === brand ? 'checked' : ''} class="w-5 h-5 text-primary">
//                 <span class="ml-3 text-gray-700">${brand}</span>
//             </label>
//         `;
//     });

//     html += `
//         </div>
//     `;

//     // Insert inside the container (assuming it already has the <h4> heading)
//     mobileBrandsContainer.innerHTML = html;
//   }
//     //   if (mobileBrandsContainer) {
//     //     let html = `
//     //       <label class="flex items-center"><input type="radio" name="mobileBrand" value="all" ${filterState.brand === 'all' ? 'checked' : ''} class="w-5 h-5 text-primary"> <span class="ml-3 text-gray-700">All Brands</span></label>
//     //     `;
//     //     brands.forEach(brand => {
//     //       html += `
//     //         <label class="flex items-center"><input type="radio" name="mobileBrand" value="${brand}" ${filterState.brand === brand ? 'checked' : ''} class="w-5 h-5 text-primary"> <span class="ml-3 text-gray-700">${brand}</span></label>
//     //       `;
//     //     });
//     //     mobileBrandsContainer.innerHTML = html;
//     //   }
// }


// // Update price range
// function updatePriceRange() {
//   if (allProducts.length === 0) return;
//   const prices = allProducts.map(p => p.price).filter(p => p > 0);
//   if (prices.length === 0) return;
//   const minPrice = Math.min(...prices);
//   const maxPrice = Math.max(...prices);
//   // Update filter state with actual product prices
//   filterState.minPrice = minPrice;
//   filterState.maxPrice = Math.min(maxPrice, 2000); // Cap at 2000 as per your original
//   debugLog('Price range:', minPrice, 'to', filterState.maxPrice);
//   // Update sliders if they exist
//   updatePriceSliders(minPrice, filterState.maxPrice);
// }

// // ==================== FILTER & SORT ====================
// function applyFilters() {
//   debugLog('Applying filters with', allProducts.length, 'products');
//   debugLog('Current filter state:', filterState);
//   filteredProducts = allProducts.filter(p => {
//     // Category filter
//     let categoryMatch = false;
//     if (filterState.category === 'all') {
//       categoryMatch = true;
//     } else {
//       const selectedCategory = OTC_CATEGORIES.find(cat => cat.id === filterState.category);
//       if (!selectedCategory || selectedCategory.id === 'all') {
//         categoryMatch = true;
//       } else {
//         const productCategory = p.category?.toLowerCase() || '';
   
//         // Check if product matches any backend subcategory for this OTC category
//         categoryMatch = selectedCategory.backendSubcategories.some(backendSubcat => {
//           const backendSubLower = backendSubcat.toLowerCase();
     
//           // Check for exact match or partial match
//           return productCategory === backendSubLower ||
//                  productCategory.includes(backendSubLower) ||
//                  backendSubLower.includes(productCategory);
//         });
   
//         if (categoryMatch) {
//           debugLog(`Product "${p.title}" matches category "${selectedCategory.name}" via category "${p.category}"`);
//         }
//       }
//     }
//     const brandMatch = filterState.brand === 'all' || p.brand === filterState.brand;
//     const discMatch = p.discount >= filterState.discount;
//     const priceMatch = p.price >= filterState.minPrice && p.price <= filterState.maxPrice;
//     const matches = categoryMatch && brandMatch && discMatch && priceMatch;
//     return matches;
//   });
//   debugLog('After filtering:', filteredProducts.length, 'products');
//   sortProducts(filterState.sort);
//   currentPage = 1;
//   renderProducts();
// }

// // ==================== HEADER COUNTS ====================
// function updateHeaderCounts() {
//   const updateBadge = (id, count) => {
//     const el = document.getElementById(id);
//     if (el) {
//       el.textContent = count;
//       el.classList.toggle("hidden", count === 0);
//     }
//   };
//   const cartTotal = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
//   updateBadge("cartCount", cartTotal);
//   updateBadge("wishlistCount", wishlist.length);
// }

// // ==================== WISHLIST TOGGLE (NOW SAME AS REF) ====================
// async function toggleWishlist(productId) {
//   const index = wishlist.findIndex(item => item.id === productId);
//   if (index === -1) {
//     // Add to wishlist
//     const success = await addToWishlistBackend(productId);
//     if (success) {
//       wishlist.push({ id: productId });
//       showToast("Added to wishlist");
//     }
//   } else {
//     // Remove from wishlist
//     const success = await removeFromWishlistBackend(productId);
//     if (success) {
//       wishlist.splice(index, 1);
//       showToast("Removed from wishlist");
//     }
//   }
//   updateHeaderCounts();
//   renderProducts(); // Re-render to update heart icons instantly
// }

// function showToast(msg, type = 'info') {
//   // Remove existing toast
//   const existing = document.querySelector('.custom-toast');
//   if (existing) existing.remove();
//   const toast = document.createElement("div");
//   let bgColor = 'bg-black'; // Default
//     if (type === 'success') bgColor = 'bg-green-600';
//     if (type === 'error') bgColor = 'bg-red-600';
//     if (type === 'warning') bgColor = 'bg-yellow-600';
//   toast.className = "custom-toast fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full z-50 shadow-lg";
//   toast.textContent = msg;
//   document.body.appendChild(toast);
//   setTimeout(() => {
//     toast.style.opacity = '0';
//     toast.style.transition = 'opacity 0.3s';
//     setTimeout(() => toast.remove(), 300);
//   }, 2000);
// }

// // ==================== ORDER ON WHATSAPP FUNCTION ====================
// function orderOnWhatsApp(productId) {
//   const product = allProducts.find(p => p.id === productId);
//   if (!product) return;
  
//   if (!product.inStock) {
//     alert('This product is currently out of stock. Please check back later.');
//     return;
//   }
  
//   // WhatsApp business number - FIXED: Using the correct number
//   const phoneNumber = "7020799618";
  
//   // Create the message
//   const message = `Hello! I would like to order:\n\n` +
//                   `*${product.title}*\n` +
//                   `Price: ₹${product.price}\n` +
//                   (product.originalPrice ? `Original: ₹${product.originalPrice} (${product.discount}% OFF)\n` : '') +
//                   `Brand: ${product.brand}\n` +
//                   `Category: ${OTC_CATEGORIES.find(cat => cat.id === product.category)?.name || product.category}\n\n` +
//                   `Please let me know about availability and delivery options.`;
  
//   // Encode the message for URL
//   const encodedMessage = encodeURIComponent(message);
  
//   // Create WhatsApp URL with country code - FIXED: Added +91
//   const whatsappURL = `https://wa.me/+91${phoneNumber}?text=${encodedMessage}`;
  
//   // Open in new tab
//   window.open(whatsappURL, '_blank');
  
//   // Optional: Track this action
//   console.log(`WhatsApp order initiated for: ${product.title}`);
//   console.log(`WhatsApp URL: ${whatsappURL}`);
// }

// // ==================== PRODUCT CARD ====================
// function createProductCard(p) {
//   const inWishlist = wishlist.some(x => x.id === p.id);
//   const isOutOfStock = !p.inStock;
//   return `
//     <div class="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-100
//                 ${isOutOfStock ? 'opacity-60 grayscale cursor-not-allowed' : ''}"
//          style="${isOutOfStock ? 'pointer-events: none;' : 'cursor: pointer;'}">
//       <div class="relative bg-blue-50 aspect-[6/4] overflow-hidden">
//         <img src="${p.image}" alt="${p.title}"
//              class="w-full h-full object-contain p-5 transition-transform duration-500 ${!isOutOfStock ? 'group-hover:scale-110' : ''}"
//              onerror="this.src='https://goodneews.com/Images/product_details_fallback_img.jpg'">
//         <div class="absolute top-2 left-2 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md z-10
//                     ${isOutOfStock ? 'bg-red-600' : 'bg-green-600'}">
//           ${isOutOfStock ? 'Out of Stock' : 'In Stock'}
//         </div>
//         <!-- <button onclick="event.stopPropagation(); toggleWishlist(${p.id})" -->
//          <!--        class="absolute top-2 right-2 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center -->
//          <!--              ${isOutOfStock ? 'opacity-50' : 'opacity-0 group-hover:opacity-100'} transition-opacity z-10"> -->
//          <!--  <i class="${inWishlist ? 'fas fa-heart text-red-500' : 'far fa-heart text-gray-600'} text-lg"></i>  -->
//         <!-- </button> -->
        
//       </div>
//       <div class="p-3">
//         <p class="text-xs text-gray-500 uppercase font-medium truncate">${p.brand || 'Brand'}</p>
//         <h3 class="text-sm font-medium text-gray-800 line-clamp-2 mt-1">${p.title}</h3>
//         <div class="mt-2 flex items-center gap-2">
//           <span class="text-lg font-bold text-green-600">₹${p.price.toLocaleString()}</span>
//           ${p.originalPrice > p.price ? `
//             <span class="text-sm text-gray-500 line-through">₹${p.originalPrice.toLocaleString()}</span>
//           ` : ''}
//           ${p.discount > 0 ? `<span class="text-sm font-medium text-red-500">${p.discount}% OFF</span>` : ''}
//         </div>
//         <button onclick="event.stopPropagation(); orderOnWhatsApp(${p.id})"
//                 class="whatsapp-order-btn mt-3 w-full font-medium text-sm py-2.5 rounded-lg transition flex items-center justify-center gap-2
//                         ${isOutOfStock
//                           ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
//                           : ''}">
//           <i class="fab fa-whatsapp"></i>
//           ${isOutOfStock ? 'Out of Stock' : 'Order on WhatsApp'}
//         </button>
//       </div>
//     </div>
//   `;
// }

// // ==================== RENDERING ====================
// function renderProducts() {
//   debugLog('Rendering products, filteredProducts length:', filteredProducts.length);
//   const start = (currentPage - 1) * pageSize;
//   const paginated = filteredProducts.slice(start, start + pageSize);
//   const grid = document.getElementById("productsGrid");
//   if (grid) {
//     if (paginated.length > 0) {
//       grid.innerHTML = paginated.map(createProductCard).join("");
//     } else {
//       grid.innerHTML = `
//         <div class="col-span-full text-center py-10">
//           <div class="text-gray-400 mb-4">
//             <i class="fas fa-search text-5xl"></i>
//           </div>
//           <p class="text-gray-500 mb-2">No products found</p>
//           <p class="text-gray-400 text-sm">Try changing your filters</p>
//           <button onclick="clearFilters()" class="mt-4 px-4 py-2 bg-[#36C2CE] text-white rounded-lg">
//             Clear Filters
//           </button>
//         </div>
//       `;
//     }
//   }
//   setText("resultsCount", `Showing ${filteredProducts.length} products`);
//   updatePageTitle();
//   renderPagination();
// }

// function renderPagination() {
//   const container = document.getElementById("pagination");
//   if (!container) return;
//   const totalPages = Math.ceil(filteredProducts.length / pageSize);
//   container.innerHTML = "";
//   if (totalPages <= 1) return;
//   for (let i = 1; i <= totalPages; i++) {
//     const btn = document.createElement("button");
//     btn.textContent = i;
//     btn.className = `px-4 py-2 rounded border mx-1 ${i === currentPage ? 'bg-[#36C2CE] text-white' : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'}`;
//     btn.onclick = () => {
//       currentPage = i;
//       renderProducts();
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     };
//     container.appendChild(btn);
//   }
// }

// function sortProducts(type) {
//   switch (type) {
//     case 'price-low':
//       filteredProducts.sort((a, b) => a.price - b.price);
//       break;
//     case 'price-high':
//       filteredProducts.sort((a, b) => b.price - a.price);
//       break;
//     case 'rating':
//       filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
//       break;
//     case 'newest':
//       filteredProducts.sort((a, b) => b.id - a.id);
//       break;
//     default:
//       // Keep original order
//       break;
//   }
// }

// // Clear all filters
// // function clearFilters() {
// //   filterState = {
// //     category: 'all',
// //     brand: 'all',
// //     discount: 0,
// //     minPrice: 0,
// //     maxPrice: 2000,
// //     sort: 'default'
// //   };
  
// //   resetAllFilters();
    
// //     // Also close mobile sheet if open
// //     const filterSheet = document.getElementById('filterSheet');
// //     const backdrop = document.getElementById('mobileSheetBackdrop');
// //     if (filterSheet && backdrop) {
// //         filterSheet.classList.add('translate-y-full');
// //         backdrop.classList.add('hidden');
// //     }
// //   // Reset UI
// //   const sortSelect = document.getElementById("sortSelect");
// //   if (sortSelect) sortSelect.value = 'default';
// //   // Reset radio buttons
// //   document.querySelectorAll('input[name="category"][value="all"]').forEach(radio => {
// //     radio.checked = true;
// //   });
// //   document.querySelectorAll('input[name="brand"][value="all"]').forEach(radio => {
// //     radio.checked = true;
// //   });
// //   document.querySelectorAll('input[name="discount"][value="0"]').forEach(radio => {
// //     radio.checked = true;
// //   });
// //   document.querySelectorAll('input[name="mobileCategory"][value="all"]').forEach(radio => {
// //     radio.checked = true;
// //   });
// //   document.querySelectorAll('input[name="mobileBrand"][value="all"]').forEach(radio => {
// //     radio.checked = true;
// //   });
// //   document.querySelectorAll('input[name="mobileDiscount"][value="0"]').forEach(radio => {
// //     radio.checked = true;
// //   });
// //   // Reset price sliders
// //   document.getElementById('minThumb').value = 0;
// //   document.getElementById('maxThumb').value = 2000;
// //   document.getElementById('mobileMinThumb').value = 0;
// //   document.getElementById('mobileMaxThumb').value = 2000;
// //   applyFilters();
// // }


// // Clear all filters - FIXED FUNCTION
// function clearFilters() {
//   // Reset filter state
//   filterState = {
//     category: 'all',
//     brand: 'all',
//     discount: 0,
//     minPrice: 0,
//     maxPrice: 2000,
//     sort: 'default'
//   };
//   // Reset desktop UI
//   document.querySelectorAll('#filterSidebar input[name="category"][value="all"]').forEach(radio => {
//     radio.checked = true;
//   });
//   document.querySelectorAll('#filterSidebar input[name="brand"][value="all"]').forEach(radio => {
//     radio.checked = true;
//   });
//   document.querySelectorAll('#filterSidebar input[name="discount"][value="0"]').forEach(radio => {
//     radio.checked = true;
//   });
//   // Reset mobile UI
//   document.querySelectorAll('#filterSheet input[name="mobileCategory"][value="all"]').forEach(radio => {
//     radio.checked = true;
//   });
//   // Mobile brand radios will be recreated by updateBrandsDropdown()
//   // Mobile discount radios
//   document.querySelectorAll('#filterSheet input[name="mobileDiscount"][value="0"]').forEach(radio => {
//     radio.checked = true;
//   });
//   // Reset sort
//   const sortSelect = document.getElementById("sortSelect");
//   if (sortSelect) sortSelect.value = 'default';
//   // Reset price sliders
//   const desktopMin = document.getElementById('minThumb');
//   const desktopMax = document.getElementById('maxThumb');
//   const mobileMin = document.getElementById('mobileMinThumb');
//   const mobileMax = document.getElementById('mobileMaxThumb');
//   if (desktopMin) desktopMin.value = 0;
//   if (desktopMax) desktopMax.value = 2000;
//   if (mobileMin) mobileMin.value = 0;
//   if (mobileMax) mobileMax.value = 2000;
//   // Update filter state
//   filterState.minPrice = 0;
//   filterState.maxPrice = 2000;
//   // Update price displays
//   const desktopMinVal = document.getElementById('minValue');
//   const desktopMaxVal = document.getElementById('maxValue');
//   const mobileMinVal = document.getElementById('mobileMinValue');
//   const mobileMaxVal = document.getElementById('mobileMaxValue');
//   if (desktopMinVal) desktopMinVal.textContent = '₹0';
//   if (desktopMaxVal) desktopMaxVal.textContent = '₹2,000';
//   if (mobileMinVal) mobileMinVal.textContent = '₹0';
//   if (mobileMaxVal) mobileMaxVal.textContent = '₹2,000';
//   // Update brands dropdown to refresh mobile brands
//   updateBrandsDropdown();
//   // Apply filters
//   applyFilters();
//   // Also close mobile sheet if open
//   const filterSheet = document.getElementById('filterSheet');
//   const backdrop = document.getElementById('mobileSheetBackdrop');
//   if (filterSheet && backdrop) {
//     filterSheet.classList.add('translate-y-full');
//     backdrop.classList.add('hidden');
//   }
//   showToast('All filters have been cleared', 'success');
// }



// // ==================== PRICE SLIDERS ====================
// function initPriceSliders() {
//   // Desktop sliders
//   const desktopMin = document.getElementById('minThumb');
//   const desktopMax = document.getElementById('maxThumb');
//   if (desktopMin && desktopMax) {
//     desktopMin.addEventListener('input', (e) => {
//       const value = parseInt(e.target.value);
//       const maxValue = parseInt(desktopMax.value);
 
//       if (value > maxValue) {
//         e.target.value = maxValue;
//         filterState.minPrice = maxValue;
//       } else {
//         filterState.minPrice = value;
//       }
 
//       document.getElementById('minValue').textContent = `₹${filterState.minPrice}`;
//       applyFilters();
//     });
//     desktopMax.addEventListener('input', (e) => {
//       const value = parseInt(e.target.value);
//       const minValue = parseInt(desktopMin.value);
 
//       if (value < minValue) {
//         e.target.value = minValue;
//         filterState.maxPrice = minValue;
//       } else {
//         filterState.maxPrice = value;
//       }
 
//       document.getElementById('maxValue').textContent = `₹${filterState.maxPrice}`;
//       applyFilters();
//     });
//   }
//   // Mobile sliders
//   const mobileMin = document.getElementById('mobileMinThumb');
//   const mobileMax = document.getElementById('mobileMaxThumb');
//   if (mobileMin && mobileMax) {
//     mobileMin.addEventListener('input', (e) => {
//       const value = parseInt(e.target.value);
//       const maxValue = parseInt(mobileMax.value);
 
//       if (value > maxValue) {
//         e.target.value = maxValue;
//         filterState.minPrice = maxValue;
//       } else {
//         filterState.minPrice = value;
//       }
 
//       document.getElementById('mobileMinValue').textContent = `₹${filterState.minPrice}`;
//       // Don't apply filters here, wait for Apply button
//     });
//     mobileMax.addEventListener('input', (e) => {
//       const value = parseInt(e.target.value);
//       const minValue = parseInt(mobileMin.value);
 
//       if (value < minValue) {
//         e.target.value = minValue;
//         filterState.maxPrice = minValue;
//       } else {
//         filterState.maxPrice = value;
//       }
 
//       document.getElementById('mobileMaxValue').textContent = `₹${filterState.maxPrice}`;
//       // Don't apply filters here, wait for Apply button
//     });
//   }
// }

// function updatePriceSliders(minPrice, maxPrice) {
//   // Ensure min and max are valid numbers
//   minPrice = Math.max(0, Math.floor(minPrice));
//   maxPrice = Math.max(minPrice + 100, Math.ceil(maxPrice));
//   // Update desktop sliders
//   const desktopMin = document.getElementById('minThumb');
//   const desktopMax = document.getElementById('maxThumb');
//   const desktopMinVal = document.getElementById('minValue');
//   const desktopMaxVal = document.getElementById('maxValue');
//   if (desktopMin && desktopMax) {
//     desktopMin.min = minPrice;
//     desktopMin.max = maxPrice;
//     desktopMin.value = filterState.minPrice;
//     desktopMax.min = minPrice;
//     desktopMax.max = maxPrice;
//     desktopMax.value = filterState.maxPrice;
//     if (desktopMinVal) desktopMinVal.textContent = `₹${filterState.minPrice}`;
//     if (desktopMaxVal) desktopMaxVal.textContent = `₹${filterState.maxPrice}`;
//   }
//   // Update mobile sliders
//   const mobileMin = document.getElementById('mobileMinThumb');
//   const mobileMax = document.getElementById('mobileMaxThumb');
//   const mobileMinVal = document.getElementById('mobileMinValue');
//   const mobileMaxVal = document.getElementById('mobileMaxValue');
//   if (mobileMin && mobileMax) {
//     mobileMin.min = minPrice;
//     mobileMin.max = maxPrice;
//     mobileMin.value = filterState.minPrice;
//     mobileMax.min = minPrice;
//     mobileMax.max = maxPrice;
//     mobileMax.value = filterState.maxPrice;
//     if (mobileMinVal) mobileMinVal.textContent = `₹${filterState.minPrice}`;
//     if (mobileMaxVal) mobileMaxVal.textContent = `₹${filterState.maxPrice}`;
//   }
// }

// // ==================== INITIALIZATION ====================
// async function init() {
//   console.log('Initializing OTC page...');
//   // Initialize mobile sheets
//   initMobileSheets();
//   // Initialize price sliders
//   initPriceSliders();
//   // Initialize sort select
//   const sortSelect = document.getElementById("sortSelect");
//   if (sortSelect) {
//     sortSelect.value = filterState.sort;
//     sortSelect.addEventListener("change", (e) => {
//       filterState.sort = e.target.value;
//       sortProducts(filterState.sort);
//       renderProducts();
//     });
//   }
//   // Initialize category filters (your HTML already has them, just add listeners)
//   initCategoryFilters();
//   // Initialize discount filters
//   initDiscountFilters();
//   // Initialize "Apply Desktop Filters" button
//   initDesktopFilterButton();
//   // Initialize reset button
//     initResetButton();
//   // Fetch initial products
//   await fetchProducts();
//   await loadWishlistFromBackend(); // Load wishlist from backend after products
//   // Update header counts
//   updateHeaderCounts();
//   // Initialize banner slider
//   initBanner();
// }

// // Initialize category filters
// function initCategoryFilters() {
//   // Desktop category filters
//   document.querySelectorAll('#filterSidebar input[name="category"]').forEach(input => {
//     input.addEventListener('change', (e) => {
//       filterState.category = e.target.value;
//       applyFilters();
//     });
//   });
//   // Mobile category filters
//   document.querySelectorAll('#filterSheet input[name="mobileCategory"]').forEach(input => {
//     input.addEventListener('change', (e) => {
//       // Update filter state but don't apply yet
//       filterState.category = e.target.value;
//     });
//   });
// }

// // Initialize discount filters
// function initDiscountFilters() {
//   // Desktop discount filters
//   const desktopDiscountContainer = document.querySelector('#filterSidebar input[name="discount"]')?.closest('.mt-4');
//   if (desktopDiscountContainer && desktopDiscountContainer.querySelectorAll('input').length === 0) {
//     const discountOptions = [
//       { value: 0, label: 'All Products' },
//       { value: 10, label: '10% or more' },
//       { value: 20, label: '20% or more' },
//       { value: 30, label: '30% or more' }
//     ];
//     let html = '';
//     discountOptions.forEach(option => {
//       html += `
//         <label class="flex items-center"><input type="radio" name="discount" value="${option.value}" ${filterState.discount === option.value ? 'checked' : ''} class="w-5 h-5 text-primary"> <span class="ml-3 text-gray-700">${option.label}</span></label>
//       `;
//     });
//     desktopDiscountContainer.innerHTML = html;
//     desktopDiscountContainer.querySelectorAll('input[name="discount"]').forEach(input => {
//       input.addEventListener('change', (e) => {
//         filterState.discount = parseInt(e.target.value);
//         applyFilters();
//       });
//     });
//   }
//   // Mobile discount filters (already in HTML)
//   document.querySelectorAll('#filterSheet input[name="mobileDiscount"]').forEach(input => {
//     input.addEventListener('change', (e) => {
//       filterState.discount = parseInt(e.target.value);
//     });
//   });
// }

// // Initialize desktop filter button
// function initDesktopFilterButton() {
//   const applyDesktopBtn = document.getElementById('applyDesktopFilters');
//   if (applyDesktopBtn) {
//     applyDesktopBtn.addEventListener('click', () => {
//       // Get current filter values
//       const category = document.querySelector('#filterSidebar input[name="category"]:checked')?.value || 'all';
//       const brand = document.querySelector('#filterSidebar input[name="brand"]:checked')?.value || 'all';
//       const discount = parseInt(document.querySelector('#filterSidebar input[name="discount"]:checked')?.value || '0');
 
//       filterState.category = category;
//       filterState.brand = brand;
//       filterState.discount = discount;
 
//       applyFilters();
//     });
//   }
// }

// // Initialize banner slider
// function initBanner() {
//   const slides = document.querySelectorAll('.banner-slide');
//   const dots = document.querySelectorAll('.banner-dot');
//   if (slides.length === 0) return;
//   let currentSlide = 0;
//   function showSlide(index) {
//     slides.forEach((slide, i) => {
//       slide.classList.toggle('active', i === index);
//     });
//     dots.forEach((dot, i) => {
//       dot.classList.toggle('active', i === index);
//     });
//     currentSlide = index;
//   }
//   // Auto-rotate slides every 5 seconds
//   setInterval(() => {
//     let nextSlide = currentSlide + 1;
//     if (nextSlide >= slides.length) {
//       nextSlide = 0;
//     }
//     showSlide(nextSlide);
//   }, 5000);
//   // Add click handlers to dots
//   dots.forEach((dot, index) => {
//     dot.addEventListener('click', () => {
//       showSlide(index);
//     });
//   });
// }

// // ==================== MOBILE SHEETS ====================
// function initMobileSheets() {
//   const backdrop = document.getElementById("mobileSheetBackdrop");
//   const filterSheet = document.getElementById("filterSheet");
//   const sortSheet = document.getElementById("sortSheet");
//   if (!backdrop || !filterSheet || !sortSheet) {
//     console.warn('Mobile sheet elements not found');
//     return;
//   }
//   // Open Filter Sheet
//   document.getElementById("openFilterSheet")?.addEventListener("click", () => {
//     filterSheet.classList.remove("translate-y-full");
//     backdrop.classList.remove("hidden");
//   });
//   // Open Sort Sheet
//   document.getElementById("openSortSheet")?.addEventListener("click", () => {
//     sortSheet.classList.remove("translate-y-full");
//     backdrop.classList.remove("hidden");
//   });
//   // Close Filter Sheet
//   document.getElementById("closeFilterSheet")?.addEventListener("click", () => {
//     filterSheet.classList.add("translate-y-full");
//     backdrop.classList.add("hidden");
//   });
//   // Close Sort Sheet
//   document.getElementById("closeSortSheet")?.addEventListener("click", () => {
//     sortSheet.classList.add("translate-y-full");
//     backdrop.classList.add("hidden");
//   });
//   // Close on backdrop click
//   backdrop.addEventListener("click", () => {
//     filterSheet.classList.add("translate-y-full");
//     sortSheet.classList.add("translate-y-full");
//     backdrop.classList.add("hidden");
//   });
//   // Apply Mobile Filters
//   document.getElementById("applyMobileFilters")?.addEventListener("click", () => {
//     const category = document.querySelector('input[name="mobileCategory"]:checked')?.value || 'all';
//     const brand = document.querySelector('input[name="mobileBrand"]:checked')?.value || 'all';
//     const discount = parseInt(document.querySelector('input[name="mobileDiscount"]:checked')?.value || '0');
//     filterState.category = category;
//     filterState.brand = brand;
//     filterState.discount = discount;
//     applyFilters();
//     filterSheet.classList.add("translate-y-full");
//     backdrop.classList.add("hidden");
//   });
//   // Apply Mobile Sort
//   document.getElementById("applySortBtn")?.addEventListener("click", () => {
//     const sort = document.querySelector('input[name="mobileSort"]:checked')?.value || 'default';
//     filterState.sort = sort;
//     const sortSelect = document.getElementById("sortSelect");
//     if (sortSelect) sortSelect.value = sort;
//     sortProducts(sort);
//     renderProducts();
//     sortSheet.classList.add("translate-y-full");
//     backdrop.classList.add("hidden");
//   });
//   // Clear Mobile Filters
//   document.getElementById("clearMobileFilters")?.addEventListener("click", () => {
//     clearFilters();
//     // filterSheet.classList.add("translate-y-full");
//     // backdrop.classList.add("hidden");
//   });
// }

// // ==================== ON LOAD ====================
// document.addEventListener("DOMContentLoaded", init);

