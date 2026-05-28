// ==================== lifestyle.js – CONNECTED TO BACKEND ====================
// Base API URL - Update this to your backend URL
const API_BASE_URL = 'http://localhost:8083/api/products';
const WISHLIST_API_BASE = "http://localhost:8083/api/wishlist";
const IMAGE_BASE = "http://localhost:8083";

// Global State
let allProducts = [];
let filteredProducts = [];
let wishlist = []; // Now only stores { id: productId }
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
  maxPrice: 5000,
  sort: 'default'
};

// =============== LIFESTYLE DISORDER CATEGORIES ===============
const LIFESTYLE_CATEGORIES = [
  {
    id: 'all',
    name: 'All Lifestyle Products',
    backendSubcategories: []
  },
  {
    id: 'diabetes',
    name: 'Diabetes Care',
    backendSubcategories: ['Diabetes', 'Blood Sugar', 'Diabetic Care', 'Glucose']
  },
  {
    id: 'heart-bp',
    name: 'Heart & Blood Pressure',
    backendSubcategories: ['Heart Care', 'Cardiac', 'Blood Pressure', 'Hypertension', 'Cholesterol']
  },
  {
    id: 'thyroid',
    name: 'Thyroid Support',
    backendSubcategories: ['Thyroid', 'Hypothyroidism', 'Hyperthyroidism', 'Iodine']
  },
  {
    id: 'vitamins',
    name: 'Vitamins & Supplements',
    backendSubcategories: ['Vitamins', 'Supplements', 'Multivitamin', 'Vitamin D', 'Calcium', 'Iron']
  },
  {
    id: 'nutrition',
    name: 'Nutritional Support',
    backendSubcategories: ['Nutrition', 'Protein', 'Fiber', 'Dietary Supplements']
  },
  {
    id: 'wellness',
    name: 'General Wellness',
    backendSubcategories: ['Wellness', 'Immunity', 'Stress Relief', 'General Health']
  }
];


// ==================== RESET FUNCTION ====================
function resetAllFilters() {
  // Reset filter state
  filterState = {
    category: 'all',
    brand: 'all',
    discount: 0,
    minPrice: 0,
    maxPrice: 5000,
    sort: 'default'
  };
  
  // Reset UI elements
  
  // 1. Reset sort dropdown
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) sortSelect.value = 'default';
  
  // 2. Reset radio buttons in desktop sidebar
  resetRadioGroup('category', 'all');
  resetRadioGroup('brand', 'all');
  resetRadioGroup('discount', '0');
  
  // 3. Reset price sliders
  resetPriceSliders();
  
  // 4. Reset mobile filter UI (if sheet is open)
  resetMobileFilterUI();
  
  // 5. Apply the reset filters
  applyFilters();
  
  // Show feedback
  showToast("All filters have been reset");
  
  debugLog('All filters reset to default');
}

function resetRadioGroup(name, value) {
  // Desktop
  document.querySelectorAll(`#filterSidebar input[name="${name}"]`).forEach(radio => {
    radio.checked = radio.value === value;
  });
  
  // Mobile
  document.querySelectorAll(`#filterSheet input[name="mobile${name.charAt(0).toUpperCase() + name.slice(1)}"]`).forEach(radio => {
    radio.checked = radio.value === value;
  });
}

function resetPriceSliders() {
  // Reset to default values (0-5000)
  const minPrice = 0;
  const maxPrice = 5000;
  
  // Desktop sliders
  const desktopMin = document.getElementById('minThumb');
  const desktopMax = document.getElementById('maxThumb');
  const desktopMinVal = document.getElementById('minValue');
  const desktopMaxVal = document.getElementById('maxValue');
  
  if (desktopMin && desktopMax) {
    desktopMin.value = minPrice;
    desktopMax.value = maxPrice;
    
    if (desktopMinVal) desktopMinVal.textContent = `₹${minPrice}`;
    if (desktopMaxVal) desktopMaxVal.textContent = `₹${maxPrice.toLocaleString()}`;
  }
  
  // Mobile sliders
  const mobileMin = document.getElementById('mobileMinThumb');
  const mobileMax = document.getElementById('mobileMaxThumb');
  const mobileMinVal = document.getElementById('mobileMinValue');
  const mobileMaxVal = document.getElementById('mobileMaxValue');
  
  if (mobileMin && mobileMax) {
    mobileMin.value = minPrice;
    mobileMax.value = maxPrice;
    
    if (mobileMinVal) mobileMinVal.textContent = `₹${minPrice}`;
    if (mobileMaxVal) mobileMaxVal.textContent = `₹${maxPrice.toLocaleString()}`;
  }
}

function resetMobileFilterUI() {
  // Reset mobile sort options
  document.querySelectorAll('#filterSheet input[name="mobileSort"]').forEach(radio => {
    radio.checked = radio.value === 'default';
  });
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
      titleEl.textContent = 'All Lifestyle Products';
    } else {
      const category = LIFESTYLE_CATEGORIES.find(cat => cat.id === filterState.category);
      titleEl.textContent = category ? category.name : 'Lifestyle Products';
    }
  }
}

// Debug logging function
function debugLog(...args) {
  if (DEBUG_MODE) {
    console.log('[DEBUG]', ...args);
  }
}

// =============== USER ID ===============
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
async function fetchProducts() {
  try {
    debugLog('Starting fetchProducts for Lifestyle...');
    setText("resultsCount", "Loading products...");
  
    // Clear existing products
    allProducts = [];
    filteredProducts = [];
  
    // Fetch ALL products
    const url = `${API_BASE_URL}/get-by-category/Lifestyle Disorder?page=0&size=200`;
  
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
  debugLog('=== CHECKING LIFESTYLE PRODUCT SUB CATEGORIES ===');
  allTransformedProducts.forEach(product => {
    debugLog(`Product: "${product.title}" - Subcategory: "${product.subcategory}"`);
  });
  debugLog('=== END CHECK ===');
  // Get all unique subcategories from products
  const allSubcategories = [...new Set(allTransformedProducts.map(p => p.subcategory))];
  debugLog('All subcategories in DB:', allSubcategories);
  // FILTER: Only keep products that match our Lifestyle Disorder categories
  allProducts = allTransformedProducts.filter(product => {
    const productSubcategory = product.subcategory || '';
  
    // Check if this product's subcategory matches any Lifestyle category
    const isLifestyleProduct = LIFESTYLE_CATEGORIES.some(category => {
      if (category.id === 'all') return false; // Skip "all" category
    
      return category.backendSubcategories.some(backendSubcat => {
        // Case-insensitive comparison
        const productSubLower = productSubcategory.toLowerCase();
        const backendSubLower = backendSubcat.toLowerCase();
      
        // Check for exact match or partial match
        return productSubLower === backendSubLower ||
               productSubLower.includes(backendSubLower) ||
               backendSubLower.includes(productSubLower);
      });
    });
  
    if (!isLifestyleProduct) {
      debugLog(`Filtered out (non-Lifestyle): ${product.title} - ${product.subcategory}`);
    }
  
    return isLifestyleProduct;
  });
  debugLog('Lifestyle products after filtering:', allProducts.length);
  debugLog('Lifestyle product subcategories:', [...new Set(allProducts.map(p => p.subcategory))]);
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
      // Extract basic fields
      const id = product.productId || product.id || index + 1;
      const title = product.productName || product.name || 'Unnamed Product';
      
      // FIXED: Handle array prices properly
      let price = 100;
      let originalPrice = price * 1.2;
      let discount = 0;
      if (Array.isArray(product.productPrice) && product.productPrice.length > 0) {
        price = Math.min(...product.productPrice.filter(p => typeof p === 'number' && p > 0));
      } else if (typeof product.productPrice === 'number') {
        price = product.productPrice;
      }
      if (Array.isArray(product.productOldPrice) && product.productOldPrice.length > 0) {
        const minOld = Math.min(...product.productOldPrice.filter(p => typeof p === 'number' && p > 0));
        if (minOld > price) {
          originalPrice = minOld;
        }
      } else if (typeof product.productOldPrice === 'number' && product.productOldPrice > price) {
        originalPrice = product.productOldPrice;
      }
      discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
    
      // Get subcategory - this is in productSubCategory field
      const subcategory = product.productSubCategory || 'Unknown';
    
      // Get brand - this is in brandName field
      const brand = product.brandName || product.brand || product.manufacturer || 'Generic';
    
      const description = product.productDescription || product.description || 'No description available';
      const stockQuantity = product.productQuantity || product.stockQuantity || product.quantity || 0;
      // FIXED: Match "In Stock" (space) not "In-Stock"
      const inStock = product.productStock === 'In Stock' || stockQuantity > 0;
    
      // Get image URL
      let imageUrl = 'http://localhost:8083/Images/product_details_fallback_img.jpg';
    
      if (product.productMainImage) {
        // Check if it's a path starting with /api/
        if (product.productMainImage.startsWith('/api/')) {
          // It's a relative path, make it absolute
          imageUrl = `http://localhost:8083${product.productMainImage}`;
        }
        // Check if it's base64
        else if (product.productMainImage.startsWith('data:image')) {
          imageUrl = product.productMainImage;
        }
        // Check if it's a URL
        else if (product.productMainImage.startsWith('http')) {
          imageUrl = product.productMainImage;
        }
        // Otherwise assume it's base64
        else {
          imageUrl = `data:image/jpeg;base64,${product.productMainImage}`;
        }
      } else if (product.productId) {
        imageUrl = `${API_BASE_URL}/${product.productId}/image`;
      }
    
      return {
        id: id,
        title: title,
        price: price,
        originalPrice: originalPrice,
        discount: discount,
        rating: product.rating || product.productRating || 4.0,
        reviewCount: product.reviewCount || product.totalReviews || Math.floor(Math.random() * 1000),
        subcategory: subcategory,
        brand: brand,
        image: imageUrl,
        description: description,
        inStock: inStock,
        stockQuantity: stockQuantity
      };
    } catch (error) {
      console.error('Error transforming product:', product, error);
      return null;
    }
  }).filter(product => product !== null);
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
  const mobileBrandsContainer = document.querySelector('#filterSheet [name="mobileBrand"]')?.parentElement;
  
//   if (mobileBrandsContainer) {
//     let html = `
//       <label class="flex items-center"><input type="radio" name="mobileBrand" value="all" ${filterState.brand === 'all' ? 'checked' : ''} class="w-5 h-5 text-primary"> <span class="ml-3 text-gray-700">All Brands</span></label>
//     `;
  
//     brands.forEach(brand => {
//       html += `
//         <label class="flex items-center"><input type="radio" name="mobileBrand" value="${brand}" ${filterState.brand === brand ? 'checked' : ''} class="w-5 h-5 text-primary"> <span class="ml-3 text-gray-700">${brand}</span></label>
//       `;
//     });
  
//     mobileBrandsContainer.innerHTML = html;
//   }


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
                </label>`;
    });

    html += `</div>`;

    // Insert inside the container (assuming it already has the <h4> heading)
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
  filterState.maxPrice = Math.min(maxPrice, 5000); // Cap at 5000 as per your HTML
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
      const selectedCategory = LIFESTYLE_CATEGORIES.find(cat => cat.id === filterState.category);
      if (!selectedCategory || selectedCategory.id === 'all') {
        categoryMatch = true;
      } else {
        const productSubcategory = p.subcategory?.toLowerCase() || '';
      
        // Check if product matches any backend subcategory for this Lifestyle category
        categoryMatch = selectedCategory.backendSubcategories.some(backendSubcat => {
          const backendSubLower = backendSubcat.toLowerCase();
        
          // Check for exact match or partial match
          return productSubcategory === backendSubLower ||
                 productSubcategory.includes(backendSubLower) ||
                 backendSubLower.includes(productSubcategory);
        });
      
        if (categoryMatch) {
          debugLog(`✓ Product "${p.title}" matches category "${selectedCategory.name}" via subcategory "${p.subcategory}"`);
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
      showToast("Added to wishlist ♥");
    }
  } else {
    // Remove from wishlist
    const success = await removeFromWishlistBackend(productId);
    if (success) {
      wishlist.splice(index, 1);
      showToast("Removed from wishlist ♥");
    }
  }
  updateHeaderCounts();
  renderProducts(); // Re-render to update heart icons instantly
}

function showToast(msg) {
  // Remove existing toast
  const existing = document.querySelector('.custom-toast');
  if (existing) existing.remove();
  const toast = document.createElement("div");
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
    <div class="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-100
                ${isOutOfStock ? 'opacity-60 grayscale cursor-not-allowed' : ''}"
         ${!isOutOfStock ? `onclick="viewProductDetails(${p.id})"` : ''}
         style="${isOutOfStock ? 'pointer-events: none;' : 'cursor: pointer;'}">
      <div class="relative bg-blue-50 aspect-[6/4] overflow-hidden">
        <img src="${p.image}" alt="${p.title}"
             class="w-full h-full object-contain p-5 transition-transform duration-500 ${!isOutOfStock ? 'group-hover:scale-110' : ''}"
             onerror="this.src='http://localhost:8083/Images/product_details_fallback_img.jpg'">
        <div class="absolute top-2 left-2 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md z-10
                    ${isOutOfStock ? 'bg-red-600' : 'bg-green-600'}">
          ${isOutOfStock ? 'Out of Stock' : 'In Stock'}
        </div>
        <button onclick="event.stopPropagation(); toggleWishlist(${p.id})"
                class="absolute top-2 right-2 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center
                       ${isOutOfStock ? 'opacity-50' : 'opacity-0 group-hover:opacity-100'} transition-opacity z-10">
          <i class="${inWishlist ? 'fas fa-heart text-red-500' : 'far fa-heart text-gray-600'} text-lg"></i>
        </button>
      </div>
      <div class="p-3">
        <p class="text-xs text-gray-500 uppercase font-medium truncate">${p.brand || 'Brand'}</p>
        <h3 class="text-sm font-medium text-gray-800 line-clamp-2 mt-1">${p.title}</h3>
        <p class="text-xs text-gray-500 mt-1">${p.subcategory || 'Lifestyle Product'}</p>
        <div class="mt-2 flex items-center gap-2">
          <span class="text-lg font-bold text-green-600">₹${p.price.toLocaleString()}</span>
          ${p.originalPrice > p.price ? `
            <span class="text-sm text-gray-500 line-through">₹${p.originalPrice.toLocaleString()}</span>
          ` : ''}
          ${p.discount > 0 ? `<span class="text-sm font-medium text-red-500">${p.discount}% OFF</span>` : ''}
        </div>
        <button onclick="event.stopPropagation(); viewProductDetails(${p.id})"
                class="mt-3 w-full font-medium text-sm py-2.5 rounded-lg transition
                        ${isOutOfStock
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-[#36C2CE] hover:bg-[#0a7272] text-white'}">
          ${isOutOfStock ? 'Out of Stock' : 'View Details'}
        </button>
      </div>
    </div>
  `;
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

// Clear all filters
// function clearFilters() {
//   filterState = {
//     category: 'all',
//     brand: 'all',
//     discount: 0,
//     minPrice: 0,
//     maxPrice: 5000,
//     sort: 'default'
//   };
//   // Reset UI
//   const sortSelect = document.getElementById("sortSelect");
//   if (sortSelect) sortSelect.value = 'default';
//   // Reset radio buttons
//   document.querySelectorAll('input[name="category"][value="all"]').forEach(radio => {
//     radio.checked = true;
//   });
//   document.querySelectorAll('input[name="brand"][value="all"]').forEach(radio => {
//     radio.checked = true;
//   });
//   document.querySelectorAll('input[name="discount"][value="0"]').forEach(radio => {
//     radio.checked = true;
//   });
//   document.querySelectorAll('input[name="mobileCategory"][value="all"]').forEach(radio => {
//     radio.checked = true;
//   });
//   document.querySelectorAll('input[name="mobileBrand"][value="all"]').forEach(radio => {
//     radio.checked = true;
//   });
//   document.querySelectorAll('input[name="mobileDiscount"][value="0"]').forEach(radio => {
//     radio.checked = true;
//   });
//   // Reset price sliders
//   document.getElementById('minThumb').value = 0;
//   document.getElementById('maxThumb').value = 5000;
//   document.getElementById('mobileMinThumb').value = 0;
//   document.getElementById('mobileMaxThumb').value = 5000;
//   applyFilters();
//   resetAllFilters();
// }



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

// ==================== VIEW PRODUCT DETAILS ====================
function viewProductDetails(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product) {
    showToast('Product not found');
    return;
  }
  if (!product.inStock) {
    showToast('This product is currently out of stock');
    return;
  }
  // Store in sessionStorage for product details page
  sessionStorage.setItem('selectedProduct', JSON.stringify(product));
  // Navigate to product details page
  window.location.href = `/productdetails.html?id=${product.id}&name=${encodeURIComponent(product.title)}&price=${product.price}`;
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
    filterSheet.classList.add("translate-y-full");
    backdrop.classList.add("hidden");
  });
}

// ==================== INITIALIZATION ====================
async function init() {
  console.log('Initializing Lifestyle Disorder page...');
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
  // Initialize reset buttons
  initResetButtons();
  // Fetch initial products
  await fetchProducts();
  await loadWishlistFromBackend(); // Sync wishlist after products load
  // Update header counts
  updateHeaderCounts();
  // Initialize banner slider
  initBannerSlider();
}

// Initialize reset buttons
function initResetButtons() {
  // Desktop reset button
  const resetDesktopBtn = document.getElementById('resetDesktopFilters');
  if (resetDesktopBtn) {
    resetDesktopBtn.addEventListener('click', resetAllFilters);
  }
  
  
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
function initBannerSlider() {
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

// ==================== ON LOAD ====================
document.addEventListener("DOMContentLoaded", init);