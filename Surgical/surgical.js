
// surgical.js - Fetching data from backend API
let products = [];
let filteredProducts = [];
let productGrid, sortSelect, showMoreBtn;
let currentFilters = {
  category: 'all',
  brand: 'all',
  discount: 'all',
  minPrice: 0,
  maxPrice: 10000
};
let visibleProductsCount = 8;
let allFilteredProducts = [];

// API Configuration
const API_BASE_URL = 'http://localhost:8083/api/products';
const WISHLIST_API_BASE = "http://localhost:8083/api/wishlist";
const SURGICAL_CATEGORY = 'Surgical';

// ==================== RESET DESKTOP FILTERS ====================
function resetDesktopFilters() {
  console.log('Resetting desktop filters to default...');
  
  // 1. Reset currentFilters to default values
  currentFilters = {
    category: 'all',
    brand: 'all',
    discount: 'all',
    minPrice: 0,
    maxPrice: 10000
  };
  
  // 2. Reset all desktop UI elements
  
  // Reset category radio to "All Surgical Products"
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
    desktopMax.value = 10000;
    
    // Update displayed values
    if (desktopMinVal) desktopMinVal.textContent = '₹0';
    if (desktopMaxVal) desktopMaxVal.textContent = '₹10000';
    
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
  // Desktop
  const desktopRadios = document.querySelectorAll(`#filterSidebar input[name="${groupName}"]`);
  desktopRadios.forEach(radio => {
    radio.checked = radio.value === value;
  });
  
  // Mobile
  const mobileGroupName = groupName === 'category' ? 'mobileCategory' : 
                         groupName === 'brand' ? 'mobileBrand' : 
                         'mobileDiscount';
  const mobileRadios = document.querySelectorAll(`#filterSheet input[name="${mobileGroupName}"]`);
  mobileRadios.forEach(radio => {
    radio.checked = radio.value === value;
  });
}

// ==================== USER ID (SAME AS REF) ====================
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

// ==================== WISHLIST STATE (BACKEND ONLY) ====================
let wishlist = [];

// ==================== WISHLIST BACKEND FUNCTIONS ====================
async function addToWishlistBackend(productId) {
  if (!CURRENT_USER_ID) {
    showToast("Please log in to add to wishlist");
    return false;
  }
  try {
    const response = await fetch(`${WISHLIST_API_BASE}/add-wishlist-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: CURRENT_USER_ID,
        productId: productId,
        productType: "MEDICINE"
      })
    });
    if (response.ok) {
      console.log("✅ Backend: Added to wishlist");
      return true;
    }
  } catch (err) {
    console.error("❌ Error adding to wishlist backend:", err);
    return false;
  }
  return false;
}

async function removeFromWishlistBackend(productId) {
  if (!CURRENT_USER_ID) return false;
  try {
    const response = await fetch(`${WISHLIST_API_BASE}/remove-wishlist-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: CURRENT_USER_ID,
        productId: productId
      })
    });
    if (response.ok) {
      console.log("✅ Backend: Removed from wishlist");
      return true;
    }
  } catch (err) {
    console.error("❌ Error removing from wishlist backend:", err);
    return false;
  }
  return false;
}

async function loadWishlistFromBackend() {
  if (!CURRENT_USER_ID) {
    wishlist = [];
    updateHeaderWishlistCount();
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
    }
  } catch (err) {
    console.error("❌ Failed to load wishlist from backend:", err);
  }
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

// ==================== PRICE HELPERS (FIXED FOR ARRAY SUPPORT) ====================
function getLowestPrice(priceArray) {
  if (!Array.isArray(priceArray) || priceArray.length === 0) return 0;
  const valid = priceArray.filter(p => typeof p === 'number' && p > 0);
  return valid.length > 0 ? Math.min(...valid) : 0;
}

// ======================================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing surgical page...');
  productGrid = document.getElementById('productGrid');
  sortSelect = document.getElementById('sortSelect');
  showMoreBtn = document.getElementById('showMoreBtn');
  if (!productGrid) {
    console.error('productGrid element not found!');
    return;
  }
  // Fetch products from backend
  fetchProducts();
  updateResultsCount();
  initSlider();
  initSorting();
  initMobileSheets();
  initFilters();
  initShowMore();
  
  // Initialize Reset Desktop Filters button
  initResetDesktopFilters();
  loadWishlistFromBackend(); // Load wishlist from backend on start
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

// =============== FETCH PRODUCTS FROM BACKEND ===============


const SURGICAL_NAMES = ['Surgical', 'Surgical Items'];


// async function fetchProducts() {
//   console.log('Fetching products from backend...');
//   showLoading();

//   try {
//     const url = `${API_BASE_URL}/get-by-category/${encodeURIComponent(SURGICAL_CATEGORY)}`;
//     console.log('API URL:', url);

//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json'
//       }
//     });

//     console.log('Response status:', response.status);

//     if (!response.ok) {
//       console.error('HTTP error! status:', response.status);
//       await fetchAllProductsAndFilter();
//       return;
//     }

//     const productData = await response.json();
//     console.log('API Response data received');
//     console.log('Number of products received:', productData ? productData.length : 0);

//     if (!productData || !Array.isArray(productData) || productData.length === 0) {
//       console.warn('No products received from API endpoint, trying alternative...');
//       await fetchAllProductsAndFilter();
//       return;
//     }

//     processProductData(productData);

//   } catch (error) {
//     console.error('Error fetching products:', error);
//     showErrorMessage(error);
//     hideLoading();
//   }
// }



async function fetchProducts() {
  console.log('Fetching products from backend...');
  showLoading();

  try {
    let productData = null;

    // Try each possible category name in order
    for (const category of SURGICAL_NAMES) {
      const url = `${API_BASE_URL}/get-by-category/${encodeURIComponent(category)}`;
      console.log('Trying API URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log(`Response for "${category}":`, response.status);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          productData = data;
          console.log(`Success! Got ${data.length} products for category: ${category}`);
          break; // stop as soon as we get valid data
        }
      }
    }

    if (productData) {
      processProductData(productData);
    } else {
      console.warn('No valid products found from any surgical category name');
      await fetchAllProductsAndFilter();
    }

  } catch (error) {
    console.error('Error fetching products:', error);
    showErrorMessage(error);
    hideLoading();
  } finally {
    hideLoading(); // make sure this always runs
  }
}

// Alternative method: Fetch all products and filter by category
async function fetchAllProductsAndFilter() {
    const category = SURGICAL_CATEGORY ? SURGICAL_CATEGORY.toLowerCase() : '';
  try {
    console.log('Trying to fetch all products and filter...');
    const response = await fetch(`${API_BASE_URL}/get-by-category/${category}?page=0&size=200`);

    if (!response.ok) {
      throw new Error(`Failed to fetch all products: ${response.status}`);
    }

    const pageData = await response.json();
    console.log('All products response:', pageData);

    let allProducts = [];
    if (pageData.content && Array.isArray(pageData.content)) {
      allProducts = pageData.content;
    } else if (Array.isArray(pageData)) {
      allProducts = pageData;
    }

    console.log('Total products fetched:', allProducts.length);

    const surgicalProducts = allProducts.filter(product => {
      const category = product.productCategory || product.category || '';
      console.log(`Product ${product.productName || product.name}: ${category}`);
      return category.toLowerCase().includes('surgical');
    });

    console.log(`Found ${surgicalProducts.length} surgical products after filtering`);

    if (surgicalProducts.length === 0) {
      showNoProductsMessage();
      hideLoading();
      return;
    }

    processProductData(surgicalProducts);

  } catch (error) {
    console.error('Error in alternative fetch:', error);
    showNoProductsMessage();
    hideLoading();
  }
}

// Process product data from either endpoint
function processProductData(productData) {
  console.log('Processing product data...');

  products = productData.map((product, index) => {
    console.log(`Processing product ${index}:`, {
      name: product.productName,
      category: product.productCategory,
      subCategory: product.productSubCategory,
      price: product.productPrice
    });

    const productId = product.productId || product.id || (index + 1000);

    // FIXED: Handle price arrays correctly
    const currentPrice = getLowestPrice(product.productPrice || []);
    const oldPrice = getLowestPrice(product.productOldPrice || []);

    const productQuantity = product.productQuantity || product.quantity || 0;
    const productStatus = productQuantity > 0 ? "Available" : "Out of Stock";

    const productSubCategory = product.productSubCategory || product.subCategory || '';
    const mappedCategory = mapSubCategoryToFrontendCategory(productSubCategory);

    const brandName = product.brandName || product.brand ||
                     (product.productCategory && product.productCategory.includes('HLL') ? 'HLL Lifecare' :
                      product.productCategory && product.productCategory.includes('3M') ? '3M Healthcare' :
                      product.productCategory && product.productCategory.includes('Johnson') ? 'Johnson & Johnson' :
                      'Generic');

    const imageUrl = getProductImageUrl(product, productId);

    return {
      sku: product.productSku || product.sku || `SURG${String(index + 1).padStart(3, '0')}`,
      productName: product.productName || product.name || `Surgical Product ${index + 1}`,
      productCategory: product.productCategory || SURGICAL_CATEGORY,
      productSubCategory: productSubCategory,
      productPrice: currentPrice,
      productOldPrice: oldPrice,
      productStatus: productStatus,
      productDescription: product.productDescription || product.description || 'Premium surgical product for medical use',
      productQuantity: productQuantity,
      productUnit: product.productUnit || product.unit || "Unit",
      productMRP: product.productMRP || product.mrp || currentPrice,
      productRating: product.productRating || product.rating || 4.0,
      prescriptionRequired: product.prescriptionRequired || false,
      brandName: brandName,
      mfgDate: product.mfgDate || '',
      expDate: product.expDate || '',
      batchNo: product.batchNo || '',
      benefitsList: product.benefitsList || [''],
      directionsList: product.directionsList || ['Use as directed by medical professional'],
      ingredientsList: product.ingredientsList || [],
      productDynamicFields: product.productDynamicFields || {},
      productSizes: product.productSizes || ['Standard'],
      id: productId,
      category: mappedCategory,
      image: imageUrl
    };
  });

  console.log(`Successfully mapped ${products.length} products`);
  if (products.length === 0) {
    showNoProductsMessage();
    hideLoading();
    return;
  }

  sessionStorage.setItem('currentPageProducts', JSON.stringify(products));
  sessionStorage.setItem('currentPageCategory', SURGICAL_CATEGORY);

  allFilteredProducts = [...products];

  applySorting();
  renderInitialProducts();
  updateResultsCount();
  hideLoading();

  console.log('Products loaded successfully!');
  console.log('Sample product:', products[0]);
}

// Get product image URL
function getProductImageUrl(product, productId) {
  if (product.image) return product.image;

  if (product.productMainImage) {
    if (typeof product.productMainImage === 'string' && product.productMainImage.startsWith('data:image')) {
      return product.productMainImage;
    }
    if (product.productId) {
      return `${API_BASE_URL}/${product.productId}/image`;
    }
  }

  const surgicalImages = [
      'http://localhost:8083/Images/product_details_fallback_img.jpg'
  ];

  const randomIndex = Math.floor(Math.random() * surgicalImages.length);
  return surgicalImages[randomIndex];
}

// Map backend sub-category to frontend category
function mapSubCategoryToFrontendCategory(subCategory) {
  if (!subCategory) return 'all';

  const subCategoryLower = subCategory.toLowerCase();

  if (subCategoryLower.includes('dressing') || subCategoryLower.includes('bandage')) return 'dressings';
  if (subCategoryLower.includes('consumable') || subCategoryLower.includes('glove') || subCategoryLower.includes('mask')) return 'consumables';
  if (subCategoryLower.includes('iv') || subCategoryLower.includes('infusion') || subCategoryLower.includes('fluid')) return 'iv';
  if (subCategoryLower.includes('catheter') || subCategoryLower.includes('tube')) return 'catheters';
  if (subCategoryLower.includes('wound') || subCategoryLower.includes('ointment')) return 'wound';
  if (subCategoryLower.includes('orthopedic') || subCategoryLower.includes('support') || subCategoryLower.includes('brace')) return 'orthopedic';
  if (subCategoryLower.includes('fluid') || subCategoryLower.includes('saline') || subCategoryLower.includes('dextrose')) return 'fluids';
  if (subCategoryLower.includes('kit') || subCategoryLower.includes('set') || subCategoryLower.includes('pack')) return 'kits';
  if (subCategoryLower.includes('gauze') || subCategoryLower.includes('pad') || subCategoryLower.includes('swab')) return 'dressings';

  return 'all';
}

// =============== LOADING & ERROR STATES ===============
function showLoading() {
  productGrid.innerHTML = `
    <div class="col-span-full text-center py-20">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4A70A9]"></div>
      <p class="mt-4 text-gray-600">Loading surgical items from database...</p>
      <p class="text-xs text-gray-400 mt-2">Category: "${SURGICAL_CATEGORY}"</p>
    </div>
  `;
  showMoreBtn.classList.add('hidden');

  const countEl = document.getElementById('resultsCount');
  if (countEl) {
    countEl.textContent = 'Loading products...';
  }
}

function hideLoading() {}

function showNoProductsMessage() {
  productGrid.innerHTML = `
    <div class="col-span-full text-center py-20 text-gray-500">
      <i class="fas fa-box-open text-4xl mb-4"></i>
      <p class="text-xl mb-2">No surgical items found</p>
      <p class="text-sm">Category: "${SURGICAL_CATEGORY}"</p>
      <p class="text-sm mt-2">Please add products with this category to your database</p>
      <div class="mt-4">
        <button onclick="fetchProducts()" class="bg-[#4A70A9] text-white px-6 py-2 rounded-lg hover:bg-[#16476A] transition">
          Try Again
        </button>
      </div>
    </div>
  `;
  showMoreBtn.classList.add('hidden');

  const countEl = document.getElementById('resultsCount');
  if (countEl) {
    countEl.textContent = '0 products found';
  }
}

function showErrorMessage(error) {
  const errorDetails = error ? error.message : 'Unknown error';

  productGrid.innerHTML = `
    <div class="col-span-full text-center py-20 text-gray-500">
      <i class="fas fa-exclamation-triangle text-4xl mb-4 text-yellow-500"></i>
      <p class="text-xl mb-2">Connection Error</p>
      <p class="text-sm mb-4">${errorDetails.substring(0, 100)}</p>
      <div class="mt-4 space-y-3">
        <button onclick="fetchProducts()" class="bg-[#4A70A9] text-white px-6 py-2 rounded-lg hover:bg-[#16476A] transition">
          Retry Connection
        </button>
        <button onclick="testBackendConnection()" class="border border-[#4A70A9] text-[#4A70A9] px-6 py-2 rounded-lg hover:bg-[#4A70A9] hover:text-white transition">
          Test Backend
        </button>
      </div>
    </div>
  `;
  showMoreBtn.classList.add('hidden');

  const countEl = document.getElementById('resultsCount');
  if (countEl) {
    countEl.textContent = 'Connection error';
  }
}

window.testBackendConnection = async function() {
  console.log('Testing backend connection...');
  try {
    const response = await fetch(`${API_BASE_URL}/get-all-products?page=0&size=1`);
    console.log('Test response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Test response data:', data);
      alert(`✅ Backend is responding!\nStatus: ${response.status}`);
    } else {
      alert(`❌ Backend error: ${response.status}`);
    }
  } catch (error) {
    console.error('Test connection error:', error);
    alert(`❌ Cannot connect to backend:\n${error.message}`);
  }
};

// =============== CARD CREATION ===============
// function createCard(p) {
//   const div = document.createElement('div');

//   const isOutOfStock = p.productQuantity <= 0;
//   const stockStatus = p.productStatus === 'Available' ? 'In Stock' : 'Out of Stock';
//   const stockClass = isOutOfStock ? 'out-of-stock' : 'in-stock';
//   const cardClass = isOutOfStock ? 'out-of-stock-card' : '';

//   // FIXED: Proper discount calculation using lowest prices
//   const discount = p.productOldPrice > p.productPrice
//     ? Math.round(((p.productOldPrice - p.productPrice) / p.productOldPrice) * 100)
//     : 0;

//   const priceLine = p.productOldPrice > p.productPrice
//     ? `₹${p.productPrice.toFixed(2)} <s class="text-gray-400 text-sm">₹${p.productOldPrice.toFixed(2)}</s> <span class="text-green-600 text-sm font-bold">${discount}% off</span>`
//     : `₹${p.productPrice.toFixed(2)}`;

//   const isWishlisted = wishlist.some(item => item.productId === p.id);

//   div.className = `bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer relative flex flex-col h-full ${cardClass}`;

//   div.innerHTML = `
//     <div class="relative">
//       <img src="${p.image}" alt="${p.productName}" class="w-full h-48 object-cover" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop&auto=format'">

//       <div class="stock-badge ${stockClass}">${stockStatus}</div>

//       <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" data-id="${p.id}">
//         <i class="fa-${isWishlisted ? 'solid' : 'regular'} fa-heart"></i>
//       </button>
//     </div>
//     <div class="p-4 flex flex-col flex-grow">
//       <h3 class="font-semibold text-sm mb-1 line-clamp-2">${p.productName}</h3>
//       <p class="text-xs text-gray-500 mb-2">${p.brandName}</p>

//       <div class="mt-2 font-bold text-lg text-green-600">${priceLine}</div>
//       <div class="flex items-center mt-2">
//         <div class="flex text-yellow-400">
//           ${generateStarRating(p.productRating)}
//         </div>
//         <span class="ml-2 text-sm text-gray-600">(${p.productRating || '4.0'})</span>
//       </div>
      
//       <!-- Button container with margin-top auto to push to bottom -->
//       <div class="mt-auto pt-4">
//         <button onclick="${isOutOfStock ? 'void(0)' : `navigateToProductDetails(${p.id})`}"
//                 class="w-full ${isOutOfStock ? 'out-of-stock-btn bg-gray-400' : 'bg-[#4A70A9] hover:bg-[#16476A]'} text-white py-2 rounded-lg font-bold transition"
//                 ${isOutOfStock ? 'disabled' : ''}>
//           ${isOutOfStock ? 'Out of Stock' : 'View Details'}
//         </button>
//       </div>
//     </div>
//   `;

//   div.addEventListener('click', (e) => {
//     if (!e.target.closest('button') && !isOutOfStock) {
//       navigateToProductDetails(p.id);
//     }
//   });

//   return div;
// }


function createCard(p) {
  const div = document.createElement('div');

  const isOutOfStock = p.productQuantity <= 0;
  const stockStatus  = p.productStatus === 'Available' ? 'In Stock' : 'Out of Stock';
  const stockClass   = isOutOfStock ? 'out-of-stock' : 'in-stock';
  const cardClass    = isOutOfStock ? 'out-of-stock-card' : '';

  // ── Use already prepared values ──
  let priceLine = `₹${(p.productPrice ?? 0).toFixed(2)}`;
  let discountBadge = '';

  if (p.productOldPrice > p.productPrice) {
    const discount = Math.round(((p.productOldPrice - p.productPrice) / p.productOldPrice) * 100);
    priceLine = `
      ₹${p.productPrice.toFixed(2)}
      <s class="text-gray-400 text-sm">₹${p.productOldPrice.toFixed(2)}</s>
      <span class="text-green-600 text-sm font-bold">${discount}% off</span>
    `;
    discountBadge = `
      <div class="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
        ${discount}% OFF
      </div>
    `;
  }

  const isWishlisted = wishlist.some(item => item.productId === p.id);

  div.className = `bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer relative flex flex-col h-full ${cardClass}`;

  div.innerHTML = `
    <div class="relative">
      <img src="${p.image}" alt="${p.productName}" class="w-full h-48 object-cover" 
           onerror="this.onerror=null; this.src='http://localhost:8083/Images/product_details_fallback_img.jpg'">
      <div class="stock-badge ${stockClass}">${stockStatus}</div>
      ${discountBadge}
      <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" data-id="${p.id}">
        <i class="fa-${isWishlisted ? 'solid' : 'regular'} fa-heart"></i>
      </button>
    </div>
    <div class="p-4 flex flex-col flex-grow">
      <h3 class="font-semibold text-sm mb-1 line-clamp-2">${p.productName}</h3>
      <p class="text-xs text-gray-500 mb-2">${p.brandName}</p>
      <div class="mt-2 font-bold text-lg text-green-600">${priceLine}</div>
      <div class="flex items-center mt-2">
        <div class="flex text-yellow-400">
          ${generateStarRating(p.productRating)}
        </div>
        <span class="ml-2 text-sm text-gray-600">(${p.productRating || '4.0'})</span>
      </div>
      <div class="mt-auto pt-4">
        <button onclick="${isOutOfStock ? 'void(0)' : `navigateToProductDetails(${p.id})`}"
                class="w-full ${isOutOfStock ? 'out-of-stock-btn bg-gray-400' : 'bg-[#4A70A9] hover:bg-[#16476A]'} text-white py-2 rounded-lg font-bold transition"
                ${isOutOfStock ? 'disabled' : ''}>
          ${isOutOfStock ? 'Out of Stock' : 'View Details'}
        </button>
      </div>
    </div>
  `;

  div.addEventListener('click', (e) => {
    if (!e.target.closest('button') && !isOutOfStock) {
      navigateToProductDetails(p.id);
    }
  });

  return div;
}

// Generate star rating HTML
function generateStarRating(rating) {
  const fullStars = Math.floor(rating || 4);
  const hasHalfStar = (rating || 4) % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  let stars = '';

  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star"></i>';
  }

  if (hasHalfStar) {
    stars += '<i class="fas fa-star-half-alt"></i>';
  }

  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star"></i>';
  }

  return stars;
}

// =============== RENDER INITIAL PRODUCTS (8 products) ===============
function renderInitialProducts() {
  productGrid.innerHTML = '';

  if (allFilteredProducts.length === 0) {
    productGrid.innerHTML = '<div class="col-span-full text-center py-20 text-gray-500 text-xl">No products match your filters</div>';
    showMoreBtn.classList.add('hidden');
    return;
  }

  const productsToShow = allFilteredProducts.slice(0, visibleProductsCount);

  console.log(`Rendering ${productsToShow.length} products`);

  productsToShow.forEach(p => {
    const card = createCard(p);
    productGrid.appendChild(card);
  });

  if (allFilteredProducts.length > visibleProductsCount) {
    showMoreBtn.classList.remove('hidden');
  } else {
    showMoreBtn.classList.add('hidden');
  }
}

// =============== SHOW MORE FUNCTIONALITY ===============
function initShowMore() {
  showMoreBtn.addEventListener('click', () => {
    visibleProductsCount += 8;

    productGrid.innerHTML = '';
    const productsToShow = allFilteredProducts.slice(0, visibleProductsCount);

    productsToShow.forEach(p => productGrid.appendChild(createCard(p)));

    if (visibleProductsCount >= allFilteredProducts.length) {
      showMoreBtn.classList.add('hidden');
    }

    updateResultsCount();
  });
}

// =============== WISHLIST TOGGLE (EXACTLY LIKE REF) ===============
async function toggleWishlist(productId, buttonElement) {
  const index = wishlist.findIndex(item => item.productId === productId);
  if (index === -1) {
    const success = await addToWishlistBackend(productId);
    if (success) {
      wishlist.push({ productId });
      showToast("Added to wishlist");
      buttonElement.classList.add('active');
      buttonElement.innerHTML = '<i class="fa-solid fa-heart"></i>';
    }
  } else {
    const success = await removeFromWishlistBackend(productId);
    if (success) {
      wishlist.splice(index, 1);
      showToast("Removed from wishlist");
      buttonElement.classList.remove('active');
      buttonElement.innerHTML = '<i class="fa-regular fa-heart"></i>';
    }
  }
  updateHeaderWishlistCount();
  renderInitialProducts();
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
  const titleEl = document.querySelector('h2.text-3xl');
  if (!titleEl) return;
  const categoryNames = {
    'all': 'Surgical Items',
    'dressings': 'Surgical Dressings & Bandages',
    'consumables': 'Surgical Consumables',
    'iv': 'IV & Infusion Items',
    'catheters': 'Catheters & Tubes',
    'wound': 'Wound Care Products',
    'orthopedic': 'Orthopedic Support',
    'fluids': 'IV Fluids',
    'kits': 'Surgical Kits'
  };
  let title = categoryNames[currentFilters.category] || 'Surgical Items';
  if (currentFilters.brand !== 'all') {
    title += ` - ${currentFilters.brand}`;
  }
  titleEl.textContent = title;
}

// Apply Filters Function
function applyFilters() {
  allFilteredProducts = products.filter(product => {
    if (currentFilters.category !== 'all' && product.category !== currentFilters.category) {
      return false;
    }
    if (currentFilters.brand !== 'all' && product.brandName !== currentFilters.brand) {
      return false;
    }
    if (product.productPrice < currentFilters.minPrice || product.productPrice > currentFilters.maxPrice) {
      return false;
    }
    if (currentFilters.discount !== 'all') {
      const requiredDiscount = parseInt(currentFilters.discount);
      const discount = Math.round(((product.productOldPrice - product.productPrice) / product.productOldPrice) * 100);
      if (discount < requiredDiscount) {
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
  const val = sortSelect.value;
  if (val === 'price-low') allFilteredProducts.sort((a,b) => a.productPrice - b.productPrice);
  if (val === 'price-high') allFilteredProducts.sort((a,b) => b.productPrice - a.productPrice);
  if (val === 'rating') allFilteredProducts.sort((a,b) => (b.productRating || 0) - (a.productRating || 0));
  if (val === 'newest') allFilteredProducts.sort((a,b) => b.id - a.id);
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
        maxPrice: 10000
      };
      document.getElementById('minThumb').value = 0;
      document.getElementById('maxThumb').value = 10000;
      document.getElementById('mobileMinThumb').value = 0;
      document.getElementById('mobileMaxThumb').value = 10000;
      updateDesktopSlider();
      updateMobileSlider();
      applyFilters();
    });
  }
}

// Navigate to Product Details Page
window.navigateToProductDetails = async function(id) {
  try {
    const product = products.find(p => p.id === id);
    if (!product) {
      console.error('Product not found with id:', id);
      showToast('Product not found', 'error');
      return;
    }
    let fullProduct = product;

    try {
      const response = await fetch(`${API_BASE_URL}/get-product/${id}`);
      if (response.ok) {
        const apiProduct = await response.json();
        fullProduct = { ...product, ...apiProduct };
      }
    } catch (error) {
      console.warn('Using cached product data:', error.message);
    }
    const currentPageName = 'Surgical Items';

    sessionStorage.setItem('selectedProduct', JSON.stringify(fullProduct));
    sessionStorage.setItem('currentPageProducts', JSON.stringify(products));
    sessionStorage.setItem('currentPageName', currentPageName);
    sessionStorage.setItem('currentPageCategory', SURGICAL_CATEGORY);
    const discount = fullProduct.productOldPrice > fullProduct.productPrice
      ? Math.round(((fullProduct.productOldPrice - fullProduct.productPrice) / fullProduct.productOldPrice) * 100)
      : 0;
    const params = new URLSearchParams({
      id: fullProduct.id,
      sku: fullProduct.sku,
      name: encodeURIComponent(fullProduct.productName),
      brand: encodeURIComponent(fullProduct.brandName),
      price: fullProduct.productPrice,
      originalPrice: fullProduct.productOldPrice || fullProduct.productPrice,
      discount: discount,
      image: encodeURIComponent(fullProduct.image),
      description: encodeURIComponent(fullProduct.productDescription || fullProduct.productName),
      prescription: fullProduct.prescriptionRequired || false,
      category: fullProduct.category || 'surgical',
      sourcePage: currentPageName,
      quantity: fullProduct.productQuantity || 0,
      mrp: fullProduct.productMRP || fullProduct.productPrice,
      rating: fullProduct.productRating || 4.0,
      unit: fullProduct.productUnit || '',
      benefits: encodeURIComponent(JSON.stringify(fullProduct.benefitsList || [])),
      ingredients: encodeURIComponent(JSON.stringify(fullProduct.ingredientsList || [])),
      directions: encodeURIComponent(JSON.stringify(fullProduct.directionsList || [])),
      dynamicFields: encodeURIComponent(JSON.stringify(fullProduct.productDynamicFields || {})),
      mfgDate: fullProduct.mfgDate || '',
      expDate: fullProduct.expDate || '',
      batchNo: fullProduct.batchNo || '',
      sizes: encodeURIComponent(JSON.stringify(fullProduct.productSizes || [])),
      stock: fullProduct.productQuantity || 0,
      status: fullProduct.productStatus || 'Available'
    });
    window.location.href = `../../productdetails.html?${params.toString()}`;

  } catch (error) {
    console.error('Error navigating to product details:', error);
    showToast('Error loading product details', 'error');
  }
};

function initSorting() {
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
      sortSelect.value = selectedSort;
      sortSelect.dispatchEvent(new Event('change'));
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

    if (minVal > maxVal - 100) {
      minThumb.value = maxVal - 100;
    }

    const fill = document.getElementById('desktopFill');
    if (fill) {
      fill.style.left = (minVal / 10000) * 100 + '%';
      fill.style.width = ((maxVal - minVal) / 10000) * 100 + '%';
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

    if (minVal > maxVal - 100) {
      mobileMinThumb.value = maxVal - 100;
    }

    const fill = document.getElementById('mobileFill');
    if (fill) {
      fill.style.left = (minVal / 10000) * 100 + '%';
      fill.style.width = ((maxVal - minVal) / 10000) * 100 + '%';
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

  document.getElementById('openFilterSheet')?.addEventListener('click', () => {
    backdrop.classList.remove('hidden');
    filterSheet.classList.remove('translate-y-full');
  });
  const closeFilterSheet = () => {
    backdrop.classList.add('hidden');
    filterSheet.classList.add('translate-y-full');
  };
  document.getElementById('closeFilterSheet')?.addEventListener('click', closeFilterSheet);
  window.closeFilterSheet = closeFilterSheet;
  document.getElementById('openSortSheet')?.addEventListener('click', () => {
    backdrop.classList.remove('hidden');
    sortSheet.classList.remove('translate-y-full');
  });
  const closeSortSheet = () => {
    backdrop.classList.add('hidden');
    sortSheet.classList.add('translate-y-full');
  };
  document.getElementById('closeSortSheet')?.addEventListener('click', closeSortSheet);
  window.closeSortSheet = closeSortSheet;
  backdrop.addEventListener('click', () => {
    closeFilterSheet();
    closeSortSheet();
  });
}

window.sortProducts = function(type) {
  sortSelect.value = type;
  sortSelect.dispatchEvent(new Event('change'));
  document.getElementById('mobileSheetBackdrop')?.click();
};
