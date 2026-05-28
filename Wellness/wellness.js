// ==================== wellness.js – WELLNESS ESSENTIALS PAGE ====================
const API_BASE_URL = 'http://localhost:8083/api/products';
const API_BASE_IMG_URL = 'http://localhost:8083';
const FALLBACK_IMAGE = 'http://localhost:8083/Images/product_details_fallback_img.jpg';
const DEBUG_MODE = true;
// ==================== NEW: WISHLIST API BASE (ADD THIS) ====================
const WISHLIST_API_BASE = 'http://localhost:8083/api/wishlist'; // Adjust if different
// ==================== ADDED BANNER CONSTANT ====================
const BANNER_API_BASE = "http://localhost:8083/api/banners";
// ==================== GLOBAL VARIABLES ====================
let allProducts = [];
let filteredProducts = [];
let wishlist = []; // Will be loaded from backend
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let currentPage = 1;
const pageSize = 12;
let filterState = {
  category: 'all',
  brand: 'all',
  discount: 0,
  minPrice: 0,
  maxPrice: 5000,
  sort: 'default'
};
// ==================== USER ID (EXACTLY LIKE REF) ====================
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
const IS_LOGGED_IN = CURRENT_USER_ID !== null;

console.log("====getCurrentUserId function returns :", CURRENT_USER_ID);
// ==================== HELPER FUNCTIONS ====================
function debugLog(...args) {
  if (DEBUG_MODE) console.log('[WELLNESS DEBUG]', ...args);
}
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function showToast(msg, type = "success") {
  const existing = document.querySelector('.custom-toast');
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = `custom-toast fixed bottom-20 left-1/2 -translate-x-1/2 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white px-6 py-3 rounded-full z-50 shadow-lg`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}
// Price & Image Helpers
function getLowestPrice(priceArray) {
  if (!Array.isArray(priceArray) || priceArray.length === 0) return null;
  const valid = priceArray.filter(p => typeof p === 'number' && p > 0);
  return valid.length > 0 ? Math.min(...valid) : null;
}
function getPriceInfo(priceArray, oldPriceArray = []) {
  const current = getLowestPrice(priceArray);
  const old = getLowestPrice(oldPriceArray);
  if (current === null) {
    return { priceText: "Price on request", discount: 0, showMRP: false, numericPrice: 0 };
  }
  const priceText = priceArray.length > 1 ? `₹${current}` : `₹${current.toLocaleString()}`;
  const discount = old && old > current ? Math.round(((old - current) / old) * 100) : 0;
  return {
    priceText,
    mrp: old,
    discount,
    showMRP: old && old > current,
    numericPrice: current
  };
}
function getImageUrl(path) {
  if (!path) return FALLBACK_IMAGE;
  if (path.startsWith('http') || path.startsWith('data:image')) return path;
  return `${API_BASE_IMG_URL}${path}`;
}
// ==================== WISHLIST BACKEND FUNCTIONS (MATCHING REF) ====================
async function addToWishlistBackend(productId) {
  if (!CURRENT_USER_ID) {
    showToast("Please log in to add to wishlist", "error");
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
      console.error("Failed to add to backend wishlist", await response.text());
      showToast("Failed to add to wishlist", "error");
      return false;
    }
  } catch (err) {
    console.error("Error calling wishlist API:", err);
    showToast("Network error. Try again.", "error");
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
    renderProducts();
    return;
  }
  try {
    const response = await fetch(`${WISHLIST_API_BASE}/get-wishlist-items?userId=${CURRENT_USER_ID}`);
    if (!response.ok) {
      console.error("Failed to fetch wishlist");
      wishlist = [];
      updateHeaderCounts();
      renderProducts();
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
    updateHeaderCounts();
    renderProducts();
  }
}
// ==================== WISHLIST UI FUNCTIONS ====================
async function toggleWishlist(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;
  const index = wishlist.findIndex(item => item.id === id);
  if (index === -1) {
    // Add
    const success = await addToWishlistBackend(id);
    if (success) {
      wishlist.push({ id });
      showToast("Added to wishlist ♥", "success");
    }
  } else {
    // Remove
    const success = await removeFromWishlistBackend(id);
    if (success) {
      wishlist.splice(index, 1);
      showToast("Removed from wishlist ♥", "info");
    }
  }
  updateHeaderCounts();
  renderProducts(); // Re-render to update heart icons instantly
}
function isInWishlist(id) {
  return wishlist.some(item => item.id === id);
}
// ==================== SKELETON LOADER ====================
function showSkeletonLoader() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  let skeletonCards = '';
  for (let i = 0; i < 12; i++) {
    skeletonCards += `
      <div class="group relative bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 animate-pulse">
        <div class="relative bg-gray-200 aspect-[6/4] overflow-hidden">
          <div class="w-full h-full bg-gray-300"></div>
        </div>
        <div class="p-3 space-y-3">
          <div class="h-4 bg-gray-300 rounded w-24"></div>
          <div class="h-5 bg-gray-300 rounded w-full"></div>
          <div class="h-4 bg-gray-300 rounded w-32"></div>
          <div class="h-6 bg-gray-300 rounded w-28"></div>
          <div class="h-8 bg-gray-300 rounded mt-4"></div>
        </div>
      </div>
    `;
  }
  grid.innerHTML = skeletonCards;
}
// ==================== PRODUCT FETCHING ====================
async function fetchProducts() {
  try {
    debugLog('Fetching wellness products...');
    setText("resultsCount", "Loading products...");
    showSkeletonLoader();
    const url = `${API_BASE_URL}/get-by-category/Wellness`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    processProducts(data);
  } catch (error) {
    console.error('Fetch error:', error);
    showToast('Failed to load products', 'error');
    setText("resultsCount", "Failed to load");
    const grid = document.getElementById("productsGrid");
    if (grid) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-10">
          <i class="fas fa-exclamation-triangle text-5xl text-gray-400 mb-4"></i>
          <p class="text-gray-500 mb-2">Failed to load products</p>
          <button onclick="fetchProducts()" class="px-4 py-2 bg-[#36C2CE] text-white rounded-lg">Retry</button>
        </div>
      `;
    }
  }
}
function processProducts(data) {
  let productsArray = [];
  if (Array.isArray(data)) productsArray = data;
  else if (data.content) productsArray = data.content;
  else if (data.products) productsArray = data.products;
  const transformed = transformBackendProducts(productsArray);
  // Include all non-deleted Wellness products
  allProducts = transformed.filter(p => !p.deleted);
  // Assign category based on exact or partial match of backend subcategory name
  allProducts.forEach(p => {
    const backendSubcat = (p.subcategory || '').trim();
    if (!backendSubcat) {
      p.category = 'all';
      return;
    }
    // Normalize for matching
    const normalized = backendSubcat.toLowerCase();
    let matchedId = 'all';
    if (normalized.includes('vitamin') || normalized.includes('supplement')) matchedId = 'vitamins';
    else if (normalized.includes('hair') || normalized.includes('skin')) matchedId = 'hairskin';
    else if (normalized.includes('fitness') || normalized.includes('weight')) matchedId = 'fitness';
    else if (normalized.includes('immunity')) matchedId = 'immunity';
    else if (normalized.includes('senior')) matchedId = 'senior';
    else if (normalized.includes('oral')) matchedId = 'oral';
    else if (normalized.includes('menstrual')) matchedId = 'menstrual';
    p.category = matchedId;
  });
  debugLog('Final wellness products:', allProducts.length);
  applyFilters();
  updateUIWithProducts();
  // Load wishlist after products are ready
  loadWishlistFromBackend();
}
function transformBackendProducts(backendProducts) {
  if (!Array.isArray(backendProducts)) return [];
  return backendProducts.map(p => {
    const id = p.productId;
    const title = p.productName || 'Wellness Product';
    const subcategory = p.productSubCategory || 'Unknown';
    const brand = p.brandName || 'Generic';
    const description = p.productDescription || '';
    const stockQuantity = p.productQuantity || 0;
    // FIXED: Handle variations like "In Stock", "In-Stock", "available"
    const stockStatus = (p.productStock || '').trim().toLowerCase();
    const inStock = ['in-stock', 'in stock', 'available'].includes(stockStatus) && stockQuantity > 0;
    const deleted = p.deleted === true;
    const priceInfo = getPriceInfo(p.productPrice || [], p.productOldPrice || []);
    const image = getImageUrl(p.productMainImage) || FALLBACK_IMAGE;
    let category = 'all';
    return {
      id,
      title,
      price: priceInfo.numericPrice,
      priceText: priceInfo.priceText,
      originalPrice: priceInfo.mrp || 0,
      discount: priceInfo.discount,
      rating: p.rating || 4.0,
      reviewCount: Math.floor(Math.random() * 900) + 100,
      subcategory,
      category,
      brand,
      image,
      description,
      inStock,
      stockQuantity,
      deleted,
      sku: p.sku || `W${String(id).padStart(4, '0')}`
    };
  });
}
// ==================== FILTERING & SORTING ====================
function applyFilters() {
  filteredProducts = allProducts.filter(p => {
    if (p.deleted) return false;
    const catMatch = filterState.category === 'all' || p.category === filterState.category;
    const brandMatch = filterState.brand === 'all' || p.brand === filterState.brand;
    const discMatch = p.discount >= filterState.discount;
    const priceMatch = p.price >= filterState.minPrice && p.price <= filterState.maxPrice;
    return catMatch && brandMatch && discMatch && priceMatch;
  });
  sortProducts(filterState.sort);
  currentPage = 1;
  renderProducts();
}
function sortProducts(type) {
  switch (type) {
    case 'price-low': filteredProducts.sort((a, b) => a.price - b.price); break;
    case 'price-high': filteredProducts.sort((a, b) => b.price - a.price); break;
    case 'rating': filteredProducts.sort((a, b) => b.rating - a.rating); break;
    case 'newest': filteredProducts.sort((a, b) => b.id - a.id); break;
    default: break;
  }
}
function clearFilters() {
  filterState = { category: 'all', brand: 'all', discount: 0, minPrice: 0, maxPrice: 5000, sort: 'default' };
  syncFilterStates();
  updateCategoryCardsUI();
  fetchProducts();
}
// ==================== UI UPDATES ====================
function updateUIWithProducts() {
  updateBrandsDropdown();
  renderDynamicCategoryCards();   // NEW: Dynamic categories from backend
  updatePriceRange();
  initFilterEventListeners();
  syncFilterStates();
  renderProducts();
}
function updateBrandsDropdown() {
  const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort();
  const createHTML = (name) => {
    let html = `<label class="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer">
      <input type="radio" name="${name}" value="all" ${filterState.brand === 'all' ? 'checked' : ''}>
      <span class="text-sm">All Brands</span>
    </label>`;
    brands.forEach(b => {
      html += `<label class="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer">
        <input type="radio" name="${name}" value="${b}" ${filterState.brand === b ? 'checked' : ''}>
        <span class="text-sm">${b}</span>
      </label>`;
    });
    return html;
  };
  const desktopContainer = document.querySelector('#filterSidebar .mt-2');
  if (desktopContainer) desktopContainer.innerHTML = createHTML('brand');
  const mobileContainer = document.getElementById('mobileBrandsContainer');
  if (mobileContainer) mobileContainer.innerHTML = createHTML('mobileBrand');
}



// NEW: Render dynamic category cards from backend subcategories
// function renderDynamicCategoryCards() {
//   const container = document.getElementById('dynamicCategoryGrid');
//   if (!container) return;

//   // Keep only "All Wellness" card
//   const allCard = container.querySelector('[data-category="all"]');
//   if (!allCard) return;

//   // Extract unique subcategories
//   const uniqueSubcats = [...new Set(allProducts.map(p => p.subcategory).filter(Boolean))];

//   // Clear and re-add "All" card
//   container.innerHTML = '';
//   container.appendChild(allCard.cloneNode(true)); // clone to preserve original

//   // Icon & gradient mapping
//   const iconMap = {
//     'vitamins & supplements': 'fa-capsules',
//     'hair & skin care': 'fa-spa',
//     'fitness & weight management': 'fa-dumbbell',
//     'immunity boosters': 'fa-shield-virus',
//     'senior care': 'fa-user-md',
//     'oral care essentials': 'fa-tooth',
//     'menstrual care': 'fa-calendar-alt'
//   };
//   const gradientColors = [
//     'from-green-500 to-emerald-500',
//     'from-pink-500 to-rose-500',
//     'from-purple-500 to-indigo-500',
//     'from-orange-500 to-amber-500',
//     'from-blue-500 to-cyan-500',
//     'from-teal-500 to-green-500',
//     'from-red-500 to-pink-500'
//   ];

//   uniqueSubcats.forEach((subcat, index) => {
//     const normalized = subcat.toLowerCase();
//     const iconClass = iconMap[normalized] || 'fa-heartbeat';
//     const catId = normalized.replace(/ & /g, '').replace(/ /g, '').replace(/[^a-z]/g, '');

//     const card = document.createElement('div');
//     card.className = 'category-card bg-white p-4 text-center';
//     card.dataset.category = catId;
//     card.innerHTML = `
//       <div class="category-icon bg-gradient-to-r ${gradientColors[index % gradientColors.length]}">
//         <i class="fas ${iconClass}"></i>
//       </div>
//       <h3 class="font-semibold text-gray-800 mt-3">${subcat}</h3>
//       <p class="text-xs text-gray-500 mt-1">Explore Range</p>
//     `;
//     container.appendChild(card);
//   });

//   // Re-initialize click listeners and active state
//   initCategoryCards();
//   updateCategoryCardsUI();
// }





// NEW: Render dynamic category cards from backend subcategories
function renderDynamicCategoryCards() {
  const container = document.getElementById('dynamicCategoryGrid');
  if (!container) return;

  // Keep only "All Wellness" card
  const allCard = container.querySelector('[data-category="all"]');
  if (!allCard) return;

  // Extract unique subcategories (cleaned)
  const uniqueSubcats = [...new Set(
    allProducts
      .map(p => (p.subcategory || '').trim())
      .filter(Boolean)
  )].sort();

  // Clear container but preserve "All" card
  container.innerHTML = '';
  container.appendChild(allCard.cloneNode(true));

  // Better matching: more flexible + more icons
  const categoryConfig = [
    // Core wellness categories - higher priority / exact-ish match
    { keywords: ['vitamin', 'supplement'],           id: 'vitamins',     icon: 'fa-capsules',       gradient: 'from-green-500 to-emerald-500'   },
    { keywords: ['hair', 'skin'],                    id: 'hairskin',     icon: 'fa-spa',             gradient: 'from-pink-500 to-rose-500'       },
    { keywords: ['fitness', 'weight', 'gym'],        id: 'fitness',      icon: 'fa-dumbbell',        gradient: 'from-purple-500 to-indigo-500'   },
    { keywords: ['immunity', 'immune'],              id: 'immunity',     icon: 'fa-shield-virus',    gradient: 'from-orange-500 to-amber-500'    },
    { keywords: ['senior', 'elderly', 'old age'],    id: 'senior',       icon: 'fa-user-md',         gradient: 'from-blue-500 to-cyan-500'       },
    { keywords: ['oral', 'tooth', 'teeth', 'mouth'], id: 'oral',         icon: 'fa-tooth',           gradient: 'from-teal-500 to-green-500'      },
    { keywords: ['menstrual', 'period', 'cycle'],    id: 'menstrual',    icon: 'fa-calendar-alt',    gradient: 'from-red-500 to-pink-500'        },
    { keywords: ['uterine', 'women', 'gyne'],        id: 'uterine',      icon: 'fa-venus',           gradient: 'from-purple-600 to-pink-600'     },
    
    // Fallback for unmatched but still nice-looking
    { keywords: [],                                  id: 'other',        icon: 'fa-heartbeat',       gradient: 'from-gray-500 to-slate-600'      },
  ];

  const fallbackGradients = [
    'from-cyan-500 to-blue-500',
    'from-indigo-500 to-purple-600',
    'from-amber-500 to-orange-600',
    'from-emerald-600 to-teal-600',
    'from-rose-500 to-pink-600',
  ];

  let gradientIndex = 0;

  uniqueSubcats.forEach(subcat => {
    const normalized = subcat.toLowerCase();

    // Find best matching config
    let match = categoryConfig.find(cfg => 
      cfg.keywords.some(kw => normalized.includes(kw))
    );

    // If no match → use fallback style
    if (!match) {
      match = categoryConfig.find(c => c.id === 'other');
    }

    const catId = match.id || normalized.replace(/[^a-z0-9]/gi, '').substring(0, 12);

    const gradient = match.gradient || fallbackGradients[gradientIndex % fallbackGradients.length];
    gradientIndex++;

    const iconClass = match.icon || 'fa-heartbeat';

    const card = document.createElement('div');
    card.className = 'category-card bg-white p-4 text-center cursor-pointer hover:shadow-md transition';
    card.dataset.category = catId;
    card.innerHTML = `
      <div class="category-icon bg-gradient-to-r ${gradient}">
        <i class="fas ${iconClass}"></i>
      </div>
      <h3 class="font-semibold text-gray-800 mt-3">${subcat}</h3>
      <p class="text-xs text-gray-500 mt-1">Explore Range</p>
    `;
    container.appendChild(card);
  });

  // Re-attach listeners and update active state
  initCategoryCards();
  updateCategoryCardsUI();
}




function updatePriceRange() {
  const prices = allProducts.map(p => p.price).filter(p => p > 0);
  if (prices.length === 0) return;
  const min = Math.floor(Math.min(...prices));
  const max = Math.ceil(Math.max(...prices));
  filterState.minPrice = min;
  filterState.maxPrice = Math.max(max, 5000);
  updatePriceSliders(min, filterState.maxPrice);
}
function updatePriceSliders(minPrice, maxPrice) {
  const update = (minEl, maxEl, minVal, maxVal) => {
    if (!minEl || !maxEl) return;
    minEl.min = maxEl.min = minPrice;
    minEl.max = maxEl.max = maxPrice;
    minEl.value = minPrice;
    maxEl.value = maxPrice;
    if (minVal) minVal.textContent = `₹${minPrice}`;
    if (maxVal) maxVal.textContent = `₹${maxPrice}`;
  };
  update(
    document.getElementById('minThumb'),
    document.getElementById('maxThumb'),
    document.getElementById('minValue'),
    document.getElementById('maxValue')
  );
  update(
    document.getElementById('mobileMinThumb'),
    document.getElementById('mobileMaxThumb'),
    document.getElementById('mobileMinValue'),
    document.getElementById('mobileMaxValue')
  );
}
function syncFilterStates() {
  document.querySelectorAll('input[type="radio"]').forEach(r => {
    if (r.name.includes('category')) r.checked = r.value === filterState.category;
    if (r.name.includes('Brand')) r.checked = r.value === filterState.brand;
    if (r.name.includes('Discount')) r.checked = parseInt(r.value) === filterState.discount;
  });
  // Update title based on current category
  const catMap = {
    all: 'All Wellness Products',
    vitamins: 'Vitamins & Supplements',
    hairskin: 'Hair & Skin Care',
    fitness: 'Fitness & Weight Management',
    immunity: 'Immunity Boosters',
    senior: 'Senior Care',
    oral: 'Oral Care Essentials',
    menstrual: 'Menstrual Care'
  };
  const catName = catMap[filterState.category] || 'All Wellness Products';
  setText('categoryTitle', catName);
  setText('pageTitle', catName);
}
// ==================== PRODUCT CARD ====================
function createProductCard(p) {
  const inWishlist = isInWishlist(p.id);
  const isUnavailable = p.deleted || !p.inStock;
  return `
    <div class="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100
                ${isUnavailable ? 'opacity-60 grayscale' : ''}"
         ${!isUnavailable ? `onclick="viewProductDetails(${p.id})"` : ''}
         style="${isUnavailable ? 'pointer-events: none; cursor: not-allowed;' : 'cursor: pointer;'}">
      <div class="relative bg-gray-50 aspect-[6/4] overflow-hidden">
        <img src="${p.image}" alt="${p.title}" onerror="this.src='${FALLBACK_IMAGE}'"
             class="w-full h-full object-contain p-5 transition-transform duration-500 ${!isUnavailable ? 'group-hover:scale-110' : ''}">
        <div class="absolute top-2 left-2 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md z-10
                    ${isUnavailable ? 'bg-red-600' : 'bg-green-600'}">
          ${isUnavailable ? 'Unavailable' : 'In Stock'}
        </div>
        <button onclick="event.stopPropagation(); toggleWishlist(${p.id})"
                class="absolute top-2 right-2 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center
                       ${isUnavailable ? 'opacity-50' : 'opacity-0 group-hover:opacity-100'} transition-opacity z-10">
          <i class="${inWishlist ? 'fas fa-heart text-red-500' : 'far fa-heart text-gray-600'} text-lg"></i>
        </button>
      </div>
      <div class="p-3">
        <div class="flex justify-between items-start">
          <p class="text-xs text-gray-500 uppercase font-medium truncate">${p.brand}</p>
          <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">${p.category === 'all' ? 'Wellness' : p.category}</span>
        </div>
        <h3 class="text-sm font-medium text-gray-800 line-clamp-2 mt-1">${p.title}</h3>
        <p class="text-xs text-gray-500 mt-1">${p.subcategory}</p>
        <div class="mt-2 flex items-center gap-2">
          <span class="text-lg font-bold text-green-600">${p.priceText}</span>
          ${p.originalPrice > p.price ? `
            <span class="text-sm text-gray-500 line-through">₹${p.originalPrice.toLocaleString()}</span>
            <span class="text-sm font-medium text-red-500">${p.discount}% OFF</span>
          ` : ''}
        </div>
        <div class="flex items-center mt-2">
          <div class="flex text-yellow-400">
            ${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))}
          </div>
          <span class="text-xs text-gray-500 ml-2">(${p.reviewCount})</span>
        </div>
        <button onclick="event.stopPropagation(); viewProductDetails(${p.id})"
                class="mt-3 w-full font-medium text-sm py-2.5 rounded-lg transition
                        ${isUnavailable ? 'bg-gray-300 text-gray-600' : 'bg-[#36C2CE] hover:bg-[#2aa8b3] text-white'}">
          ${isUnavailable ? 'Unavailable' : 'View Details'}
        </button>
      </div>
    </div>
  `;
}
// ==================== RENDERING ====================
function renderProducts() {
  const start = (currentPage - 1) * pageSize;
  const paginated = filteredProducts.slice(start, start + pageSize);
  const grid = document.getElementById("productsGrid");
  if (paginated.length > 0) {
    grid.innerHTML = paginated.map(createProductCard).join("");
    document.getElementById('showMoreContainer')?.classList.toggle('hidden', filteredProducts.length <= pageSize * currentPage);
  } else {
    grid.innerHTML = `
      <div class="col-span-full text-center py-10">
        <i class="fas fa-search text-5xl text-gray-400 mb-4"></i>
        <p class="text-gray-500 mb-2">No wellness products found</p>
        <p class="text-gray-400 text-sm">Try changing your filters</p>
        <button onclick="clearFilters()" class="mt-4 px-4 py-2 bg-[#36C2CE] text-white rounded-lg">Clear Filters</button>
      </div>
    `;
    document.getElementById('showMoreContainer')?.classList.add('hidden');
  }
  setText("resultsCount", `Showing ${filteredProducts.length} products`);
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
    btn.onclick = () => { currentPage = i; renderProducts(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    container.appendChild(btn);
  }
}
function showMoreProducts() {
  if (filteredProducts.length > pageSize * currentPage) {
    currentPage++;
    renderProducts();
  }
}
// ==================== REST OF FUNCTIONS (UNCHANGED) ====================
function initCategoryCards() {
  const categoryCards = document.querySelectorAll('.category-card');
  categoryCards.forEach(card => {
    card.addEventListener('click', function() {
      categoryCards.forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      filterState.category = this.dataset.category;
      updateRadioButtons('category', filterState.category);
      updateRadioButtons('mobileCategory', filterState.category);
      applyFilters();
    });
  });
}
function updateCategoryCardsUI() {
  document.querySelectorAll('.category-card').forEach(card => {
    card.classList.toggle('active', card.dataset.category === filterState.category);
  });
}
function updateRadioButtons(name, value) {
  document.querySelectorAll(`input[name="${name}"]`).forEach(r => r.checked = r.value === value);
}
function initFilterEventListeners() {
  document.addEventListener('change', (e) => {
    if (e.target.name === 'category' || e.target.name === 'mobileCategory') {
      filterState.category = e.target.value;
      updateCategoryCardsUI();
      applyFilters();
    }
    if (e.target.name === 'brand' || e.target.name === 'mobileBrand') {
      filterState.brand = e.target.value;
      applyFilters();
    }
    if (e.target.name === 'discount' || e.target.name === 'mobileDiscount') {
      filterState.discount = parseInt(e.target.value);
      applyFilters();
    }
  });
  document.getElementById('applyDesktopFilters')?.addEventListener('click', applyFilters);
  document.getElementById('applyMobileFilters')?.addEventListener('click', () => {
    applyFilters();
    document.getElementById('filterSheet').classList.add('translate-y-full');
    document.getElementById('mobileSheetBackdrop').classList.add('hidden');
  });
  document.getElementById('clearMobileFilters')?.addEventListener('click', () => {
    clearFilters();
    document.getElementById('filterSheet').classList.add('translate-y-full');
    document.getElementById('mobileSheetBackdrop').classList.add('hidden');
  });
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.value = filterState.sort;
    sortSelect.addEventListener("change", (e) => {
      filterState.sort = e.target.value;
      sortProducts(filterState.sort);
      renderProducts();
    });
  }
  document.getElementById("applySortBtn")?.addEventListener('click', () => {
    const sort = document.querySelector('input[name="mobileSort"]:checked')?.value || 'default';
    filterState.sort = sort;
    if (sortSelect) sortSelect.value = sort;
    sortProducts(sort);
    renderProducts();
    document.getElementById('sortSheet').classList.add('translate-y-full');
    document.getElementById('mobileSheetBackdrop').classList.add('hidden');
  });
  document.getElementById("showMoreBtn")?.addEventListener('click', showMoreProducts);
}
function initPriceSliders() {
  const updateSlider = (minEl, maxEl, minValEl, maxValEl) => {
    if (!minEl || !maxEl) return;
    minEl.addEventListener('input', () => {
      const val = parseInt(minEl.value);
      if (val > parseInt(maxEl.value)) minEl.value = maxEl.value;
      filterState.minPrice = parseInt(minEl.value);
      if (minValEl) minValEl.textContent = `₹${filterState.minPrice}`;
      applyFilters();
    });
    maxEl.addEventListener('input', () => {
      const val = parseInt(maxEl.value);
      if (val < parseInt(minEl.value)) maxEl.value = minEl.value;
      filterState.maxPrice = parseInt(maxEl.value);
      if (maxValEl) maxValEl.textContent = `₹${filterState.maxPrice}`;
      applyFilters();
    });
  };
  updateSlider(
    document.getElementById('minThumb'),
    document.getElementById('maxThumb'),
    document.getElementById('minValue'),
    document.getElementById('maxValue')
  );
  updateSlider(
    document.getElementById('mobileMinThumb'),
    document.getElementById('mobileMaxThumb'),
    document.getElementById('mobileMinValue'),
    document.getElementById('mobileMaxValue')
  );
}
function viewProductDetails(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product || !product.inStock) {
    showToast('This product is currently unavailable', 'info');
    return;
  }
  sessionStorage.setItem('selectedProduct', JSON.stringify(product));
  window.location.href = `../../productdetails.html?id=${product.id}`;
}
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
function initMobileSheets() {
  const backdrop = document.getElementById("mobileSheetBackdrop");
  const filterSheet = document.getElementById("filterSheet");
  const sortSheet = document.getElementById("sortSheet");
  document.getElementById("openFilterSheet")?.addEventListener("click", () => {
    filterSheet.classList.remove("translate-y-full");
    backdrop.classList.remove("hidden");
  });
  document.getElementById("openSortSheet")?.addEventListener("click", () => {
    sortSheet.classList.remove("translate-y-full");
    backdrop.classList.remove("hidden");
  });
  document.getElementById("closeFilterSheet")?.addEventListener("click", () => {
    filterSheet.classList.add("translate-y-full");
    backdrop.classList.add("hidden");
  });
  document.getElementById("closeSortSheet")?.addEventListener("click", () => {
    sortSheet.classList.add("translate-y-full");
    backdrop.classList.add("hidden");
  });
  backdrop.addEventListener("click", () => {
    filterSheet.classList.add("translate-y-full");
    sortSheet.classList.add("translate-y-full");
    backdrop.classList.add("hidden");
  });
}
// ==================== BANNER INTEGRATION (FROM REF CODE) ====================
async function loadDynamicBanners() {
  const possiblePageNames = ["wellness", "Wellness", "WELLNESS", "wellness-essentials", "home"];
  let bannerData = null;

  for (const pageName of possiblePageNames) {
    try {
      const API = `${BANNER_API_BASE}/get-by-page-name/${pageName}`;
      console.log(`Trying to fetch banners for page: ${pageName}`);
      const res = await fetch(API + "?t=" + Date.now(), { cache: "no-store" });
      if (res.ok) {
        bannerData = await res.json();
        console.log(`✅ Found banners for page: ${pageName}`);
        break;
      } else {
        console.log(`❌ No banners found for page: ${pageName} (Status: ${res.status})`);
      }
    } catch (err) {
      console.log(`⚠️ Error fetching banners for ${pageName}:`, err.message);
    }
  }

  if (!bannerData || !bannerData.bannerFileSlides || bannerData.bannerFileSlides.length === 0) {
    console.log("No backend banners found, using static banners");
    initStaticBanner();
    return;
  }

  const IMAGE_BASE = "http://localhost:8083";

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const match = path.match(/^\/api\/banners\/(\d+)\/(slides\/\d+|filetwo|filethree|filefour)$/);
    if (!match) return null;
    const [_, id, type] = match;
    if (type === "filetwo") return `${IMAGE_BASE}/api/banners/get-Banner-File-Two-Image/${id}/filetwo`;
    if (type === "filethree") return `${IMAGE_BASE}/api/banners/get-Banner-File-Three-Image/${id}/filethree`;
    if (type === "filefour") return `${IMAGE_BASE}/api/banners/get-Banner-File-Four-Image/${id}/filefour`;
    return `${IMAGE_BASE}/api/banners/get-banner-slide-image/${id}/${type}`;
  };
  try {
    const bannerWrapper = document.getElementById('bannerWrapper');
    const dotsContainer = document.querySelector('.absolute.bottom-5 .flex.gap-3');

    if (bannerWrapper) {
      bannerWrapper.innerHTML = '';
      const fallbackBanners = [
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=500&fit=crop",
        "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=1200&h=500&fit=crop",
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=500&fit=crop"
      ];

      const slides = bannerData.bannerFileSlides.map((slide, index) => {
        const url = getImageUrl(slide);
        return url || fallbackBanners[index % fallbackBanners.length];
      });

      slides.forEach((src, idx) => {
        const slideDiv = document.createElement('div');
        slideDiv.className = `banner-slide ${idx === 0 ? 'active' : ''}`;
        slideDiv.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${src}')`;
        bannerWrapper.appendChild(slideDiv);

        if (dotsContainer && idx === 0) {
          dotsContainer.innerHTML = '';
        }
        if (dotsContainer) {
          const dotBtn = document.createElement('button');
          dotBtn.className = `banner-dot w-3 h-3 rounded-full ${idx === 0 ? 'bg-white/70 active' : 'bg-white/50'}`;
          dotBtn.onclick = () => goToSlide(idx);
          dotsContainer.appendChild(dotBtn);
        }
      });

      const slidesElements = bannerWrapper.querySelectorAll('.banner-slide');
      const dots = dotsContainer ? dotsContainer.querySelectorAll('.banner-dot') : [];
      let currentIndex = 0;

      function goToSlide(index) {
        slidesElements.forEach(slide => slide.classList.remove('active'));
        dots.forEach((dot, i) => {
          if (i === index) {
            dot.classList.add('active', 'bg-white/70');
            dot.classList.remove('bg-white/50');
          } else {
            dot.classList.remove('active', 'bg-white/70');
            dot.classList.add('bg-white/50');
          }
        });
        currentIndex = index;
        slidesElements[currentIndex].classList.add('active');
      }

      setInterval(() => {
        const nextIndex = (currentIndex + 1) % slides.length;
        goToSlide(nextIndex);
      }, 5000);

      console.log('✅ Dynamic banners loaded from backend');
    } else {
      console.log("Banner wrapper not found, using static banners");
      initStaticBanner();
    }
  } catch (err) {
    console.log("Error processing banners → Using static fallbacks", err);
    initStaticBanner();
  }
}
function initStaticBanner() {
  const slides = document.querySelectorAll('.banner-slide');
  const dots = document.querySelectorAll('.banner-dot');
  if (slides.length === 0) return;
  let currentSlide = 0;
  function showSlide(index) {
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    currentSlide = index;
  }
  setInterval(() => {
    showSlide((currentSlide + 1) % slides.length);
  }, 5000);
  dots.forEach((dot, i) => dot.addEventListener('click', () => showSlide(i)));
}
function init() {
  console.log('Initializing Wellness page...');
  initMobileSheets();
  initPriceSliders();
  initCategoryCards();
  fetchProducts();
  updateHeaderCounts();
  initStaticBanner();
  loadDynamicBanners();
}
document.addEventListener("DOMContentLoaded", init);



































// // ==================== wellness.js – WELLNESS ESSENTIALS PAGE ====================
// const API_BASE_URL = 'http://localhost:8083/api/products';
// const API_BASE_IMG_URL = 'http://localhost:8083';
// const FALLBACK_IMAGE = '../Images/product_details_fallback_img.jpg';
// const DEBUG_MODE = true;

// // ==================== NEW: WISHLIST API BASE (ADD THIS) ====================
// const WISHLIST_API_BASE = 'http://localhost:8083/api/wishlist'; // Adjust if different

// // ==================== ADDED BANNER CONSTANT ====================
// const BANNER_API_BASE = "http://localhost:8083/api/banners";

// // ==================== WELLNESS CATEGORIES ====================
// const WELLNESS_CATEGORIES = [
//   { id: 'all', name: 'All Wellness Products' },
//   {
//     id: 'vitamins',
//     name: 'Vitamins & Supplements'
//   },
//   {
//     id: 'hairskin',
//     name: 'Hair & Skin Care'
//   },
//   {
//     id: 'fitness',
//     name: 'Fitness & Weight Management'
//   },
//   {
//     id: 'immunity',
//     name: 'Immunity Boosters'
//   },
//   {
//     id: 'senior',
//     name: 'Senior Care'
//   },
//   {
//     id: 'oral',
//     name: 'Oral Care Essentials'
//   },
//   {
//     id: 'menstrual',
//     name: 'Menstrual Care'
//   }
// ];
// const categoryNames = {
//   'all': { title: 'All Wellness Products', pageTitle: 'Wellness', description: 'Complete range of health and wellness products' },
//   'vitamins': { title: 'Vitamins & Supplements', pageTitle: 'Vitamins & Supplements', description: 'Essential vitamins and supplements for daily health' },
//   'hairskin': { title: 'Hair & Skin Care', pageTitle: 'Hair & Skin Care Essentials', description: 'Natural products for beautiful hair and glowing skin' },
//   'fitness': { title: 'Fitness & Weight Management', pageTitle: 'Fitness & Weight Products', description: 'Supplements and gear for your fitness journey' },
//   'immunity': { title: 'Immunity Boosters', pageTitle: 'Immunity Boosters', description: 'Strengthen your natural defenses' },
//   'senior': { title: 'Senior Care', pageTitle: 'Senior Care', description: 'Specialized products for elderly wellness' },
//   'oral': { title: 'Oral Care', pageTitle: 'Oral Care Products', description: 'For a healthy and bright smile' },
//   'menstrual': { title: 'Menstrual Care', pageTitle: 'Menstrual Care', description: 'Comfort and care during menstrual cycle' }
// };

// // ==================== GLOBAL VARIABLES ====================
// let allProducts = [];
// let filteredProducts = [];
// let wishlist = []; // Will be loaded from backend
// let cart = JSON.parse(localStorage.getItem("cart") || "[]");
// let currentPage = 1;
// const pageSize = 12;
// let filterState = {
//   category: 'all',
//   brand: 'all',
//   discount: 0,
//   minPrice: 0,
//   maxPrice: 5000,
//   sort: 'default'
// };

// // ==================== USER ID (EXACTLY LIKE REF) ====================
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
//     const IS_LOGGED_IN = CURRENT_USER_ID !== null;

    
// console.log("====getCurrentUserId function returns :", CURRENT_USER_ID);

// // ==================== HELPER FUNCTIONS ====================
// function debugLog(...args) {
//   if (DEBUG_MODE) console.log('[WELLNESS DEBUG]', ...args);
// }
// function setText(id, text) {
//   const el = document.getElementById(id);
//   if (el) el.textContent = text;
// }
// function showToast(msg, type = "success") {
//   const existing = document.querySelector('.custom-toast');
//   if (existing) existing.remove();
 
//   const toast = document.createElement("div");
//   toast.className = `custom-toast fixed bottom-20 left-1/2 -translate-x-1/2 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white px-6 py-3 rounded-full z-50 shadow-lg`;
//   toast.textContent = msg;
//   document.body.appendChild(toast);
 
//   setTimeout(() => {
//     toast.style.opacity = '0';
//     toast.style.transition = 'opacity 0.3s';
//     setTimeout(() => toast.remove(), 300);
//   }, 2000);
// }
// // Price & Image Helpers
// function getLowestPrice(priceArray) {
//   if (!Array.isArray(priceArray) || priceArray.length === 0) return null;
//   const valid = priceArray.filter(p => typeof p === 'number' && p > 0);
//   return valid.length > 0 ? Math.min(...valid) : null;
// }
// function getPriceInfo(priceArray, oldPriceArray = []) {
//   const current = getLowestPrice(priceArray);
//   const old = getLowestPrice(oldPriceArray);
//   if (current === null) {
//     return { priceText: "Price on request", discount: 0, showMRP: false, numericPrice: 0 };
//   }
//   const priceText = priceArray.length > 1 ? `₹${current}` : `₹${current.toLocaleString()}`;
//   const discount = old && old > current ? Math.round(((old - current) / old) * 100) : 0;
//   return {
//     priceText,
//     mrp: old,
//     discount,
//     showMRP: old && old > current,
//     numericPrice: current
//   };
// }
// function getImageUrl(path) {
//   if (!path) return FALLBACK_IMAGE;
//   if (path.startsWith('http') || path.startsWith('data:image')) return path;
//   return `${API_BASE_IMG_URL}${path}`;
// }

// // ==================== WISHLIST BACKEND FUNCTIONS (MATCHING REF) ====================
// async function addToWishlistBackend(productId) {
//   if (!CURRENT_USER_ID) {
//     showToast("Please log in to add to wishlist", "error");
//     return false;
//   }
//   try {
//     const response = await fetch(`${WISHLIST_API_BASE}/add-wishlist-items`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         userId: CURRENT_USER_ID,
//         productId: productId,
//         productType: "MEDICINE"
//       })
//     });
//     if (response.ok) {
//       console.log("Added to backend wishlist");
//       return true;
//     } else {
//       console.error("Failed to add to backend wishlist", await response.text());
//       showToast("Failed to add to wishlist", "error");
//       return false;
//     }
//   } catch (err) {
//     console.error("Error calling wishlist API:", err);
//     showToast("Network error. Try again.", "error");
//     return false;
//   }
// }

// async function removeFromWishlistBackend(productId) {
//   if (!CURRENT_USER_ID) return false;
//   try {
//     const response = await fetch(`${WISHLIST_API_BASE}/remove-wishlist-items`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         userId: CURRENT_USER_ID,
//         productId: productId
//       })
//     });
//     if (response.ok) {
//       console.log("Removed from backend wishlist");
//       return true;
//     } else {
//       console.error("Failed to remove from backend wishlist");
//       return false;
//     }
//   } catch (err) {
//     console.error("Error removing from wishlist:", err);
//     return false;
//   }
// }

// async function loadWishlistFromBackend() {
//   if (!CURRENT_USER_ID) {
//     wishlist = [];
//     updateHeaderCounts();
//     renderProducts();
//     return;
//   }
//   try {
//     const response = await fetch(`${WISHLIST_API_BASE}/get-wishlist-items?userId=${CURRENT_USER_ID}`);
//     if (!response.ok) {
//       console.error("Failed to fetch wishlist");
//       wishlist = [];
//       updateHeaderCounts();
//       renderProducts();
//       return;
//     }
//     const items = await response.json();
//     wishlist = items
//       .filter(item => item.productType === "MEDICINE")
//       .map(item => ({ id: item.productId }));
//     console.log("Loaded wishlist from backend:", wishlist.length, "items");
//     updateHeaderCounts();
//     renderProducts(); // Refresh heart icons
//   } catch (err) {
//     console.error("Error syncing wishlist:", err);
//     wishlist = [];
//     updateHeaderCounts();
//     renderProducts();
//   }
// }

// // ==================== WISHLIST UI FUNCTIONS ====================
// async function toggleWishlist(id) {
//   const product = allProducts.find(p => p.id === id);
//   if (!product) return;

//   const index = wishlist.findIndex(item => item.id === id);
//   if (index === -1) {
//     // Add
//     const success = await addToWishlistBackend(id);
//     if (success) {
//       wishlist.push({ id });
//       showToast("Added to wishlist ♥", "success");
//     }
//   } else {
//     // Remove
//     const success = await removeFromWishlistBackend(id);
//     if (success) {
//       wishlist.splice(index, 1);
//       showToast("Removed from wishlist ♥", "info");
//     }
//   }
//   updateHeaderCounts();
//   renderProducts(); // Re-render to update heart icons instantly
// }

// function isInWishlist(id) {
//   return wishlist.some(item => item.id === id);
// }

// // ==================== SKELETON LOADER ====================
// function showSkeletonLoader() {
//   const grid = document.getElementById("productsGrid");
//   if (!grid) return;
//   let skeletonCards = '';
//   for (let i = 0; i < 12; i++) {
//     skeletonCards += `
//       <div class="group relative bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 animate-pulse">
//         <div class="relative bg-gray-200 aspect-[6/4] overflow-hidden">
//           <div class="w-full h-full bg-gray-300"></div>
//         </div>
//         <div class="p-3 space-y-3">
//           <div class="h-4 bg-gray-300 rounded w-24"></div>
//           <div class="h-5 bg-gray-300 rounded w-full"></div>
//           <div class="h-4 bg-gray-300 rounded w-32"></div>
//           <div class="h-6 bg-gray-300 rounded w-28"></div>
//           <div class="h-8 bg-gray-300 rounded mt-4"></div>
//         </div>
//       </div>
//     `;
//   }
//   grid.innerHTML = skeletonCards;
// }

// // ==================== PRODUCT FETCHING ====================
// async function fetchProducts() {
//   try {
//     debugLog('Fetching wellness products...');
//     setText("resultsCount", "Loading products...");
//     showSkeletonLoader();
//     const url = `${API_BASE_URL}/get-by-category/Wellness`;
//     const response = await fetch(url);
//     if (!response.ok) throw new Error(`HTTP ${response.status}`);
//     const data = await response.json();
//     processProducts(data);
//   } catch (error) {
//     console.error('Fetch error:', error);
//     showToast('Failed to load products', 'error');
//     setText("resultsCount", "Failed to load");
//     const grid = document.getElementById("productsGrid");
//     if (grid) {
//       grid.innerHTML = `
//         <div class="col-span-full text-center py-10">
//           <i class="fas fa-exclamation-triangle text-5xl text-gray-400 mb-4"></i>
//           <p class="text-gray-500 mb-2">Failed to load products</p>
//           <button onclick="fetchProducts()" class="px-4 py-2 bg-[#36C2CE] text-white rounded-lg">Retry</button>
//         </div>
//       `;
//     }
//   }
// }
// function processProducts(data) {
//   let productsArray = [];
//   if (Array.isArray(data)) productsArray = data;
//   else if (data.content) productsArray = data.content;
//   else if (data.products) productsArray = data.products;
//   const transformed = transformBackendProducts(productsArray);

//   // Include all non-deleted Wellness products
//   allProducts = transformed.filter(p => !p.deleted);

//   // Assign category based on exact or partial match of backend subcategory name
//   allProducts.forEach(p => {
//     const backendSubcat = (p.subcategory || '').trim();
//     if (!backendSubcat) {
//       p.category = 'all';
//       return;
//     }
//     const matchedCat = WELLNESS_CATEGORIES.find(cat => 
//       cat.id !== 'all' && 
//       cat.name.toLowerCase() === backendSubcat.toLowerCase()
//     );
//     p.category = matchedCat ? matchedCat.id : 'all';
//   });

//   debugLog('Final wellness products:', allProducts.length);
//   applyFilters();
//   updateUIWithProducts();

//   // Load wishlist after products are ready
//   loadWishlistFromBackend();
// }
// function transformBackendProducts(backendProducts) {
//   if (!Array.isArray(backendProducts)) return [];
//   return backendProducts.map(p => {
//     const id = p.productId;
//     const title = p.productName || 'Wellness Product';
//     const subcategory = p.productSubCategory || 'Unknown';
//     const brand = p.brandName || 'Generic';
//     const description = p.productDescription || '';
//     const stockQuantity = p.productQuantity || 0;
//     const inStock = p.productStock === 'In-Stock' && stockQuantity > 0;
//     const deleted = p.deleted === true;
//     const priceInfo = getPriceInfo(p.productPrice || [], p.productOldPrice || []);
//     const image = getImageUrl(p.productMainImage) || FALLBACK_IMAGE;
//     let category = 'all';
//     return {
//       id,
//       title,
//       price: priceInfo.numericPrice,
//       priceText: priceInfo.priceText,
//       originalPrice: priceInfo.mrp || 0,
//       discount: priceInfo.discount,
//       rating: p.rating || 4.0,
//       reviewCount: Math.floor(Math.random() * 900) + 100,
//       subcategory,
//       category,
//       brand,
//       image,
//       description,
//       inStock,
//       stockQuantity,
//       deleted,
//       sku: p.sku || `W${String(id).padStart(4, '0')}`
//     };
//   });
// }

// // ==================== FILTERING & SORTING ====================
// function applyFilters() {
//   filteredProducts = allProducts.filter(p => {
//     if (p.deleted) return false;
//     const catMatch = filterState.category === 'all' || p.category === filterState.category;
//     const brandMatch = filterState.brand === 'all' || p.brand === filterState.brand;
//     const discMatch = p.discount >= filterState.discount;
//     const priceMatch = p.price >= filterState.minPrice && p.price <= filterState.maxPrice;
//     return catMatch && brandMatch && discMatch && priceMatch;
//   });
//   sortProducts(filterState.sort);
//   currentPage = 1;
//   renderProducts();
// }
// function sortProducts(type) {
//   switch (type) {
//     case 'price-low': filteredProducts.sort((a, b) => a.price - b.price); break;
//     case 'price-high': filteredProducts.sort((a, b) => b.price - a.price); break;
//     case 'rating': filteredProducts.sort((a, b) => b.rating - a.rating); break;
//     case 'newest': filteredProducts.sort((a, b) => b.id - a.id); break;
//     default: break;
//   }
// }
// function clearFilters() {
//   filterState = { category: 'all', brand: 'all', discount: 0, minPrice: 0, maxPrice: 5000, sort: 'default' };
//   syncFilterStates();
//   updateCategoryCardsUI();
//   fetchProducts();
// }

// // ==================== UI UPDATES ====================
// function updateUIWithProducts() {
//   updateBrandsDropdown();
//   updateCategoriesDropdown();
//   updatePriceRange();
//   initFilterEventListeners();
//   syncFilterStates();
//   renderProducts();
// }
// function updateBrandsDropdown() {
//   const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort();
//   const createHTML = (name) => {
//     let html = `<label class="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer">
//       <input type="radio" name="${name}" value="all" ${filterState.brand === 'all' ? 'checked' : ''}>
//       <span class="text-sm">All Brands</span>
//     </label>`;
//     brands.forEach(b => {
//       html += `<label class="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer">
//         <input type="radio" name="${name}" value="${b}" ${filterState.brand === b ? 'checked' : ''}>
//         <span class="text-sm">${b}</span>
//       </label>`;
//     });
//     return html;
//   };
//   const desktopContainer = document.querySelector('#filterSidebar .mt-2');
//   if (desktopContainer) desktopContainer.innerHTML = createHTML('brand');
//   const mobileContainer = document.getElementById('mobileBrandsContainer');
//   if (mobileContainer) mobileContainer.innerHTML = createHTML('mobileBrand');
// }
// function updateCategoriesDropdown() {}
// function updatePriceRange() {
//   const prices = allProducts.map(p => p.price).filter(p => p > 0);
//   if (prices.length === 0) return;
//   const min = Math.floor(Math.min(...prices));
//   const max = Math.ceil(Math.max(...prices));
//   filterState.minPrice = min;
//   filterState.maxPrice = Math.max(max, 5000);
//   updatePriceSliders(min, filterState.maxPrice);
// }
// function updatePriceSliders(minPrice, maxPrice) {
//   const update = (minEl, maxEl, minVal, maxVal) => {
//     if (!minEl || !maxEl) return;
//     minEl.min = maxEl.min = minPrice;
//     minEl.max = maxEl.max = maxPrice;
//     minEl.value = minPrice;
//     maxEl.value = maxPrice;
//     if (minVal) minVal.textContent = `₹${minPrice}`;
//     if (maxVal) maxVal.textContent = `₹${maxPrice}`;
//   };
//   update(
//     document.getElementById('minThumb'),
//     document.getElementById('maxThumb'),
//     document.getElementById('minValue'),
//     document.getElementById('maxValue')
//   );
//   update(
//     document.getElementById('mobileMinThumb'),
//     document.getElementById('mobileMaxThumb'),
//     document.getElementById('mobileMinValue'),
//     document.getElementById('mobileMaxValue')
//   );
// }
// function syncFilterStates() {
//   document.querySelectorAll('input[type="radio"]').forEach(r => {
//     if (r.name.includes('category')) r.checked = r.value === filterState.category;
//     if (r.name.includes('Brand')) r.checked = r.value === filterState.brand;
//     if (r.name.includes('Discount')) r.checked = parseInt(r.value) === filterState.discount;
//   });
//   const cat = WELLNESS_CATEGORIES.find(c => c.id === filterState.category) || { name: 'All Wellness Products' };
//   setText('categoryTitle', cat.name);
//   setText('pageTitle', cat.pageTitle || 'Wellness Essentials');
// }

// // ==================== PRODUCT CARD ====================
// function createProductCard(p) {
//   const inWishlist = isInWishlist(p.id);
//   const isUnavailable = p.deleted || !p.inStock;
//   return `
//     <div class="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100
//                 ${isUnavailable ? 'opacity-60 grayscale' : ''}"
//          ${!isUnavailable ? `onclick="viewProductDetails(${p.id})"` : ''}
//          style="${isUnavailable ? 'pointer-events: none; cursor: not-allowed;' : 'cursor: pointer;'}">
//       <div class="relative bg-gray-50 aspect-[6/4] overflow-hidden">
//         <img src="${p.image}" alt="${p.title}" onerror="this.src='${FALLBACK_IMAGE}'"
//              class="w-full h-full object-contain p-5 transition-transform duration-500 ${!isUnavailable ? 'group-hover:scale-110' : ''}">
//         <div class="absolute top-2 left-2 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md z-10
//                     ${isUnavailable ? 'bg-red-600' : 'bg-green-600'}">
//           ${isUnavailable ? 'Unavailable' : 'In Stock'}
//         </div>
//         <button onclick="event.stopPropagation(); toggleWishlist(${p.id})"
//                 class="absolute top-2 right-2 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center
//                       ${isUnavailable ? 'opacity-50' : 'opacity-0 group-hover:opacity-100'} transition-opacity z-10">
//           <i class="${inWishlist ? 'fas fa-heart text-red-500' : 'far fa-heart text-gray-600'} text-lg"></i>
//         </button>
//       </div>
//       <div class="p-3">
//         <div class="flex justify-between items-start">
//           <p class="text-xs text-gray-500 uppercase font-medium truncate">${p.brand}</p>
//           <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">${p.category === 'all' ? 'Wellness' : p.category}</span>
//         </div>
//         <h3 class="text-sm font-medium text-gray-800 line-clamp-2 mt-1">${p.title}</h3>
//         <p class="text-xs text-gray-500 mt-1">${p.subcategory}</p>
//         <div class="mt-2 flex items-center gap-2">
//           <span class="text-lg font-bold text-green-600">${p.priceText}</span>
//           ${p.originalPrice > p.price ? `
//             <span class="text-sm text-gray-500 line-through">₹${p.originalPrice.toLocaleString()}</span>
//             <span class="text-sm font-medium text-red-500">${p.discount}% OFF</span>
//           ` : ''}
//         </div>
//         <div class="flex items-center mt-2">
//           <div class="flex text-yellow-400">
//             ${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))}
//           </div>
//           <span class="text-xs text-gray-500 ml-2">(${p.reviewCount})</span>
//         </div>
//         <button onclick="event.stopPropagation(); viewProductDetails(${p.id})"
//                 class="mt-3 w-full font-medium text-sm py-2.5 rounded-lg transition
//                         ${isUnavailable ? 'bg-gray-300 text-gray-600' : 'bg-[#36C2CE] hover:bg-[#2aa8b3] text-white'}">
//           ${isUnavailable ? 'Unavailable' : 'View Details'}
//         </button>
//       </div>
//     </div>
//   `;
// }

// // ==================== RENDERING ====================
// function renderProducts() {
//   const start = (currentPage - 1) * pageSize;
//   const paginated = filteredProducts.slice(start, start + pageSize);
//   const grid = document.getElementById("productsGrid");
//   if (paginated.length > 0) {
//     grid.innerHTML = paginated.map(createProductCard).join("");
//     document.getElementById('showMoreContainer')?.classList.toggle('hidden', filteredProducts.length <= pageSize * currentPage);
//   } else {
//     grid.innerHTML = `
//       <div class="col-span-full text-center py-10">
//         <i class="fas fa-search text-5xl text-gray-400 mb-4"></i>
//         <p class="text-gray-500 mb-2">No wellness products found</p>
//         <p class="text-gray-400 text-sm">Try changing your filters</p>
//         <button onclick="clearFilters()" class="mt-4 px-4 py-2 bg-[#36C2CE] text-white rounded-lg">Clear Filters</button>
//       </div>
//     `;
//     document.getElementById('showMoreContainer')?.classList.add('hidden');
//   }
//   setText("resultsCount", `Showing ${filteredProducts.length} products`);
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
//     btn.onclick = () => { currentPage = i; renderProducts(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
//     container.appendChild(btn);
//   }
// }
// function showMoreProducts() {
//   if (filteredProducts.length > pageSize * currentPage) {
//     currentPage++;
//     renderProducts();
//   }
// }

// // ==================== REST OF FUNCTIONS (UNCHANGED) ====================
// function initCategoryCards() {
//   const categoryCards = document.querySelectorAll('.category-card');
//   categoryCards.forEach(card => {
//     card.addEventListener('click', function() {
//       categoryCards.forEach(c => c.classList.remove('active'));
//       this.classList.add('active');
//       filterState.category = this.dataset.category;
//       updateRadioButtons('category', filterState.category);
//       updateRadioButtons('mobileCategory', filterState.category);
//       applyFilters();
//     });
//   });
// }
// function updateCategoryCardsUI() {
//   document.querySelectorAll('.category-card').forEach(card => {
//     card.classList.toggle('active', card.dataset.category === filterState.category);
//   });
// }
// function updateRadioButtons(name, value) {
//   document.querySelectorAll(`input[name="${name}"]`).forEach(r => r.checked = r.value === value);
// }
// function initFilterEventListeners() {
//   document.addEventListener('change', (e) => {
//     if (e.target.name === 'category' || e.target.name === 'mobileCategory') {
//       filterState.category = e.target.value;
//       updateCategoryCardsUI();
//       applyFilters();
//     }
//     if (e.target.name === 'brand' || e.target.name === 'mobileBrand') {
//       filterState.brand = e.target.value;
//       applyFilters();
//     }
//     if (e.target.name === 'discount' || e.target.name === 'mobileDiscount') {
//       filterState.discount = parseInt(e.target.value);
//       applyFilters();
//     }
//   });
//   document.getElementById('applyDesktopFilters')?.addEventListener('click', applyFilters);
//   document.getElementById('applyMobileFilters')?.addEventListener('click', () => {
//     applyFilters();
//     document.getElementById('filterSheet').classList.add('translate-y-full');
//     document.getElementById('mobileSheetBackdrop').classList.add('hidden');
//   });
//   document.getElementById('clearMobileFilters')?.addEventListener('click', () => {
//     clearFilters();
//     document.getElementById('filterSheet').classList.add('translate-y-full');
//     document.getElementById('mobileSheetBackdrop').classList.add('hidden');
//   });
//   const sortSelect = document.getElementById("sortSelect");
//   if (sortSelect) {
//     sortSelect.value = filterState.sort;
//     sortSelect.addEventListener("change", (e) => {
//       filterState.sort = e.target.value;
//       sortProducts(filterState.sort);
//       renderProducts();
//     });
//   }
//   document.getElementById("applySortBtn")?.addEventListener('click', () => {
//     const sort = document.querySelector('input[name="mobileSort"]:checked')?.value || 'default';
//     filterState.sort = sort;
//     if (sortSelect) sortSelect.value = sort;
//     sortProducts(sort);
//     renderProducts();
//     document.getElementById('sortSheet').classList.add('translate-y-full');
//     document.getElementById('mobileSheetBackdrop').classList.add('hidden');
//   });
//   document.getElementById('showMoreBtn')?.addEventListener('click', showMoreProducts);
// }
// function initPriceSliders() {
//   const updateSlider = (minEl, maxEl, minValEl, maxValEl) => {
//     if (!minEl || !maxEl) return;
//     minEl.addEventListener('input', () => {
//       const val = parseInt(minEl.value);
//       if (val > parseInt(maxEl.value)) minEl.value = maxEl.value;
//       filterState.minPrice = parseInt(minEl.value);
//       if (minValEl) minValEl.textContent = `₹${filterState.minPrice}`;
//       applyFilters();
//     });
//     maxEl.addEventListener('input', () => {
//       const val = parseInt(maxEl.value);
//       if (val < parseInt(minEl.value)) maxEl.value = minEl.value;
//       filterState.maxPrice = parseInt(maxEl.value);
//       if (maxValEl) maxValEl.textContent = `₹${filterState.maxPrice}`;
//       applyFilters();
//     });
//   };
//   updateSlider(
//     document.getElementById('minThumb'),
//     document.getElementById('maxThumb'),
//     document.getElementById('minValue'),
//     document.getElementById('maxValue')
//   );
//   updateSlider(
//     document.getElementById('mobileMinThumb'),
//     document.getElementById('mobileMaxThumb'),
//     document.getElementById('mobileMinValue'),
//     document.getElementById('mobileMaxValue')
//   );
// }
// function viewProductDetails(id) {
//   const product = allProducts.find(p => p.id === id);
//   if (!product || !product.inStock) {
//     showToast('This product is currently unavailable', 'info');
//     return;
//   }
//   sessionStorage.setItem('selectedProduct', JSON.stringify(product));
//   window.location.href = `../../productdetails.html?id=${product.id}`;
// }
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
// function initMobileSheets() {
//   const backdrop = document.getElementById("mobileSheetBackdrop");
//   const filterSheet = document.getElementById("filterSheet");
//   const sortSheet = document.getElementById("sortSheet");
//   document.getElementById("openFilterSheet")?.addEventListener("click", () => {
//     filterSheet.classList.remove("translate-y-full");
//     backdrop.classList.remove("hidden");
//   });
//   document.getElementById("openSortSheet")?.addEventListener("click", () => {
//     sortSheet.classList.remove("translate-y-full");
//     backdrop.classList.remove("hidden");
//   });
//   document.getElementById("closeFilterSheet")?.addEventListener("click", () => {
//     filterSheet.classList.add("translate-y-full");
//     backdrop.classList.add("hidden");
//   });
//   document.getElementById("closeSortSheet")?.addEventListener("click", () => {
//     sortSheet.classList.add("translate-y-full");
//     backdrop.classList.add("hidden");
//   });
//   backdrop.addEventListener("click", () => {
//     filterSheet.classList.add("translate-y-full");
//     sortSheet.classList.add("translate-y-full");
//     backdrop.classList.add("hidden");
//   });
// }

// // ==================== BANNER INTEGRATION (FROM REF CODE) ====================
// async function loadDynamicBanners() {
//   // Try multiple possible page names
//   const possiblePageNames = ["wellness", "Wellness", "WELLNESS", "wellness-essentials", "home"];
//   let bannerData = null;
  
//   for (const pageName of possiblePageNames) {
//     try {
//       const API = `${BANNER_API_BASE}/get-by-page-name/${pageName}`;
//       console.log(`Trying to fetch banners for page: ${pageName}`);
      
//       const res = await fetch(API + "?t=" + Date.now(), { 
//         cache: "no-store"
//       });
      
//       if (res.ok) {
//         bannerData = await res.json();
//         console.log(`✅ Found banners for page: ${pageName}`);
//         break;
//       } else {
//         console.log(`❌ No banners found for page: ${pageName} (Status: ${res.status})`);
//       }
//     } catch (err) {
//       console.log(`⚠️ Error fetching banners for ${pageName}:`, err.message);
//       // Continue to next page name
//     }
//   }
  
//   // If no banner data found, use fallback immediately
//   if (!bannerData || !bannerData.bannerFileSlides || bannerData.bannerFileSlides.length === 0) {
//     console.log("No backend banners found, using static banners");
//     initStaticBanner();
//     return;
//   }
  
//   // Process banner data if found
//   const IMAGE_BASE = "http://localhost:8083";
  
//   // Helper function to get image URL from backend path
//   const getImageUrl = (path) => {
//     if (!path) return null;
//     // Check if path already contains the full URL
//     if (path.startsWith('http')) return path;
    
//     const match = path.match(/^\/api\/banners\/(\d+)\/(slides\/\d+|filetwo|filethree|filefour)$/);
//     if (!match) return null;
//     const [_, id, type] = match;
//     if (type === "filetwo") return `${IMAGE_BASE}/api/banners/get-Banner-File-Two-Image/${id}/filetwo`;
//     if (type === "filethree") return `${IMAGE_BASE}/api/banners/get-Banner-File-Three-Image/${id}/filethree`;
//     if (type === "filefour") return `${IMAGE_BASE}/api/banners/get-Banner-File-Four-Image/${id}/filefour`;
//     return `${IMAGE_BASE}/api/banners/get-banner-slide-image/${id}/${type}`;
//   };

//   try {
//     const bannerWrapper = document.getElementById('bannerWrapper');
//     const dotsContainer = document.querySelector('.absolute.bottom-5 .flex.gap-3');
    
//     if (bannerWrapper) {
//       // Clear existing content
//       bannerWrapper.innerHTML = '';
      
//       // Static fallback banners
//       const fallbackBanners = [
//         "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=500&fit=crop",
//         "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=1200&h=500&fit=crop", 
//         "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=500&fit=crop"
//       ];
      
//       // Use backend images if available
//       const slides = bannerData.bannerFileSlides.map((slide, index) => {
//         const url = getImageUrl(slide);
//         return url || fallbackBanners[index % fallbackBanners.length];
//       });
      
//       // Create slides
//       slides.forEach((src, idx) => {
//         const slideDiv = document.createElement('div');
//         slideDiv.className = `banner-slide ${idx === 0 ? 'active' : ''}`;
//         slideDiv.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${src}')`;
//         bannerWrapper.appendChild(slideDiv);
        
//         // Create dot buttons if container exists
//         if (dotsContainer && idx === 0) {
//           dotsContainer.innerHTML = ''; // Clear existing dots
//         }
//         if (dotsContainer) {
//           const dotBtn = document.createElement('button');
//           dotBtn.className = `banner-dot w-3 h-3 rounded-full ${idx === 0 ? 'bg-white/70 active' : 'bg-white/50'}`;
//           dotBtn.onclick = () => goToSlide(idx);
//           dotsContainer.appendChild(dotBtn);
//         }
//       });
      
//       // Initialize banner functionality
//       const slidesElements = bannerWrapper.querySelectorAll('.banner-slide');
//       const dots = dotsContainer ? dotsContainer.querySelectorAll('.banner-dot') : [];
//       let currentIndex = 0;
      
//       function goToSlide(index) {
//         // Hide all slides
//         slidesElements.forEach(slide => {
//           slide.classList.remove('active');
//         });
//         // Update dots
//         dots.forEach((dot, idx) => {
//           if (idx === index) {
//             dot.classList.add('active', 'bg-white/70');
//             dot.classList.remove('bg-white/50');
//           } else {
//             dot.classList.remove('active', 'bg-white/70');
//             dot.classList.add('bg-white/50');
//           }
//         });
//         // Show selected slide
//         currentIndex = index;
//         slidesElements[currentIndex].classList.add('active');
//       }
      
//       // Auto play every 5 seconds
//       setInterval(() => {
//         const nextIndex = (currentIndex + 1) % slides.length;
//         goToSlide(nextIndex);
//       }, 5000);
      
//       console.log('✅ Dynamic banners loaded from backend');
      
//     } else {
//       console.log("Banner wrapper not found, using static banners");
//       initStaticBanner();
//     }
    
//   } catch (err) {
//     console.log("Error processing banners → Using static fallbacks", err);
//     initStaticBanner();
//   }
// }

// // Static banner function (your existing initBannerSlider function)
// function initStaticBanner() {
//   const slides = document.querySelectorAll('.banner-slide');
//   const dots = document.querySelectorAll('.banner-dot');
//   if (slides.length === 0) return;
//   let currentSlide = 0;
//   function showSlide(index) {
//     slides.forEach((s, i) => s.classList.toggle('active', i === index));
//     dots.forEach((d, i) => d.classList.toggle('active', i === index));
//     currentSlide = index;
//   }
//   setInterval(() => {
//     showSlide((currentSlide + 1) % slides.length);
//   }, 5000);
//   dots.forEach((dot, i) => dot.addEventListener('click', () => showSlide(i)));
// }

// function init() {
//   console.log('Initializing Wellness page...');
//   initMobileSheets();
//   initPriceSliders();
//   initCategoryCards();
//   fetchProducts();
//   updateHeaderCounts();
//   // initBannerSlider();
//   initStaticBanner();
//   loadDynamicBanners();
// }
// document.addEventListener("DOMContentLoaded", init);

































