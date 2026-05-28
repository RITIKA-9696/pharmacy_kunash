// ==================== fertility.js – CONNECTED TO BACKEND + Backend Wishlist Sync (NOW EXACTLY LIKE REF) ====================
const API_BASE_URL = 'http://localhost:8083/api/products';
const WISHLIST_API_BASE = 'http://localhost:8083/api/wishlist';
const IMAGE_BASE = 'http://localhost:8083';


// Dynamic user ID (exactly like ref code)
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
const CURRENT_USER_ID = getCurrentUserId();
let wishlist = []; // Simple array of { productId } — synced with backend

// Global State
let allProducts = [];
let filteredProducts = [];
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
  maxPrice: 3000,
  sort: 'default'
};

const FERTILITY_CATEGORIES = [
  {
    id: 'all',
    name: 'All Fertility Products',
    backendSubcategories: []
  },
  {
    id: 'male',
    name: 'Male Infertility',
    backendSubcategories: [
      'Male Fertility',
      'Male Infertility',
      'Male Reproductive',
      'Sperm Health',
      'Sperm Count',
      'Sperm Motility',
      'Testosterone',
      'Shilajit',
      'Maca Root',
      'Tribulus',
      'Ashwagandha Male',
      'Zinc Male'
    ]
  },
  {
    id: 'female',
    name: 'Female Infertility',
    backendSubcategories: [
      'Female Fertility',
      'Female Infertility',
      'Female Reproductive',
      'Ovulation',
      'Menstrual Health',
      'PCOS',
      'Folic Acid',
      'Shatavari',
      'CoQ10',
      'Vitamin E',
      'Ashwagandha Female',
      'Prenatal'
    ]
  },
  {
    id: 'ayurvedic',
    name: 'Ayurvedic Supplements',
    backendSubcategories: [
      'Ayurvedic Fertility',
      'Ayurvedic',
      'Herbal Ayurvedic',
      'Ashwagandha',
      'Gokshura',
      'Kapikacchu',
      'Fenugreek',
      'Shatavari',
      'Tribulus',
      'Shilajit',
      'Herbal'
    ]
  },
  {
    id: 'vitamins',
    name: 'Vitamins & Minerals',
    backendSubcategories: [
      'Fertility Vitamins',
      'Multivitamin',
      'Vitamin',
      'Mineral',
      'Zinc',
      'Selenium',
      'Vitamin B',
      'Vitamin D',
      'Vitamin E',
      'Folic Acid',
      'CoQ10',
      'Minerals'
    ]
  },
  {
    id: 'herbal',
    name: 'Herbal Teas & Powders',
    backendSubcategories: [
      'Herbal Tea',
      'Fertility Tea',
      'Tea',
      'Herbal Powder',
      'Powder',
      'Red Clover',
      'Herbal Blend',
      'Green Tea'
    ]
  }
];

// ==================== RESET DESKTOP FILTERS ====================
function resetDesktopFilters() {
  debugLog('Resetting desktop filters...');
  
  // 1. Reset filter state to default values
  filterState = {
    category: 'all',
    brand: 'all',
    discount: 0,
    minPrice: 0,
    maxPrice: 3000,
    sort: 'default'
  };
  
  // 2. Reset all desktop UI elements
  
  // Reset category radio to "All Fertility Products"
  const allCategoryRadio = document.querySelector('#filterSidebar input[name="category"][value="all"]');
  if (allCategoryRadio) {
    allCategoryRadio.checked = true;
    allCategoryRadio.dispatchEvent(new Event('change'));
  }
  
  // Reset brand radio to "All Brands"
  const allBrandRadio = document.querySelector('#filterSidebar input[name="brand"][value="all"]');
  if (allBrandRadio) {
    allBrandRadio.checked = true;
    allBrandRadio.dispatchEvent(new Event('change'));
  }
  
  // Reset discount radio to "All Products"
  const allDiscountRadio = document.querySelector('#filterSidebar input[name="discount"][value="0"]');
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
    desktopMax.value = 3000;
    
    if (desktopMinVal) desktopMinVal.textContent = '₹0';
    if (desktopMaxVal) desktopMaxVal.textContent = '₹3,000';
    
    // Trigger input events to update filter state
    desktopMin.dispatchEvent(new Event('input'));
    desktopMax.dispatchEvent(new Event('input'));
  }
  
  // Reset sort dropdown
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.value = 'default';
    sortSelect.dispatchEvent(new Event('change'));
  }
  
  // 3. Apply filters with reset values
  applyFilters();
  
  // 4. Show confirmation message
  showToast("All filters have been reset");
  
  debugLog('Desktop filters reset to default values');
}

// Function to reset individual radio groups (helper)
function resetRadioGroup(groupName, value) {
  const radios = document.querySelectorAll(`#filterSidebar input[name="${groupName}"]`);
  radios.forEach(radio => {
    radio.checked = radio.value === value;
  });
}

// Category Display Names
const categoryDisplayNames = {
  'all': 'All Fertility Products',
  'male': 'Male Fertility Support',
  'female': 'Female Fertility Support',
  'ayurvedic': 'Ayurvedic Fertility Supplements',
  'vitamins': 'Vitamins & Minerals',
  'herbal': 'Herbal Teas & Powders'
};

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
      titleEl.textContent = 'All Fertility Products';
    } else {
      const category = FERTILITY_CATEGORIES.find(cat => cat.id === filterState.category);
      titleEl.textContent = category ? category.name : 'Fertility Products';
    }
  }
}

// Debug logging function
function debugLog(...args) {
  if (DEBUG_MODE) {
    console.log('[DEBUG]', ...args);
  }
}

// ==================== WISHLIST BACKEND SYNC (NOW EXACTLY LIKE REF) ====================
async function addToWishlistBackend(productId) {
  if (!CURRENT_USER_ID) {
    console.log("No user logged in – cannot add to backend wishlist");
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
      console.log("Backend: Added to wishlist");
      return true;
    } else {
      console.warn("Backend add wishlist failed:", response.status);
      return false;
    }
  } catch (err) {
    console.error("Error adding to wishlist backend:", err);
    return false;
  }
}

async function removeFromWishlistBackend(productId) {
  if (!CURRENT_USER_ID) {
    console.log("No user logged in – cannot remove from backend wishlist");
    return false;
  }
  try {
    const response = await fetch(`${WISHLIST_API_BASE}/remove-wishlist-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: CURRENT_USER_ID,
        productId: productId,
        productType: "MEDICINE"
      })
    });
    if (response.ok) {
      console.log("Backend: Removed from wishlist");
      return true;
    } else {
      console.warn("Backend remove wishlist failed:", response.status);
      return false;
    }
  } catch (err) {
    console.error("Error removing from wishlist backend:", err);
    return false;
  }
}

async function loadWishlistFromBackend() {
  if (!CURRENT_USER_ID) {
    console.log("No user logged in, skipping wishlist load from backend");
    wishlist = []; // Clear local wishlist if not logged in
    updateHeaderCounts();
    renderProducts();
    return;
  }
  try {
    const response = await fetch(`${WISHLIST_API_BASE}/get-wishlist-items?userId=${CURRENT_USER_ID}`);
    if (response.ok) {
      const backendItems = await response.json();
      console.log("Loaded wishlist from backend:", backendItems.length, "items");
      wishlist = backendItems.map(item => ({
        productId: item.productId || item.id
      }));
      updateHeaderCounts();
      renderProducts(); // Refresh heart icons
    } else {
      console.warn("Failed to load wishlist:", response.status);
      wishlist = [];
      updateHeaderCounts();
      renderProducts();
    }
  } catch (err) {
    console.error("Failed to load wishlist from backend:", err);
    wishlist = [];
    updateHeaderCounts();
    renderProducts();
  }
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

function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.className = "fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full z-50 shadow-lg";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// Global wishlist toggle (NOW EXACTLY LIKE REF)
async function toggleWishlist(id) {
  const index = wishlist.findIndex(item => item.productId === id);

  if (index === -1) {
    // Trying to add
    if (!CURRENT_USER_ID) {
      showToast("Please log in to add to wishlist");
      return;
    }
    const success = await addToWishlistBackend(id);
    if (success) {
      wishlist.push({ productId: id });
      showToast("Added to wishlist");
    } else {
      showToast("Failed to add to wishlist");
      return;
    }
  } else {
    // Trying to remove
    const success = await removeFromWishlistBackend(id);
    if (success) {
      wishlist.splice(index, 1);
      showToast("Removed from wishlist");
    } else {
      showToast("Failed to remove from wishlist");
      return;
    }
  }

  updateHeaderCounts();
  renderProducts(); // Re-render to update all heart icons
}

// ==================== FETCH PRODUCTS FROM BACKEND ====================
async function fetchProducts() {
  try {
    debugLog('Starting fetchProducts for Fertility...');
    setText("resultsCount", "Loading products...");
  
    // Clear existing products
    allProducts = [];
    filteredProducts = [];
  
    // Fetch ALL products
    const url = `${API_BASE_URL}/get-by-category/Fertility%20Essentials?page=0&size=200`;
  
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
//   debugLog('=== CHECKING FERTILITY PRODUCT SUB CATEGORIES ===');
//   allTransformedProducts.forEach(product => {
//     debugLog(`Product: "${product.title}" - Subcategory: "${product.subcategory}"`);
//   });
//   debugLog('=== END CHECK ===');
//   // Get all unique subcategories from products
//   const allSubcategories = [...new Set(allTransformedProducts.map(p => p.subcategory))];
//   debugLog('All subcategories in DB:', allSubcategories);
//   // FILTER: Only keep products that match our Fertility categories
//   allProducts = allTransformedProducts.filter(product => {
//     const productSubcategory = product.subcategory || '';
  
//     // Check if this product's subcategory matches any Fertility category
//     const isFertilityProduct = FERTILITY_CATEGORIES.some(category => {
//       if (category.id === 'all') return false; // Skip "all" category
    
//       return category.backendSubcategories.some(backendSubcat => {
//         // Case-insensitive comparison
//         const productSubLower = productSubcategory.toLowerCase();
//         const backendSubLower = backendSubcat.toLowerCase();
      
//         // Check for exact match or partial match
//         return productSubLower === backendSubLower ||
//               productSubLower.includes(backendSubLower) ||
//               backendSubLower.includes(productSubLower);
//       });
//     });
  
//     if (!isFertilityProduct) {
//       debugLog(`Filtered out (non-Fertility): ${product.title} - ${product.subcategory}`);
//     }
  
//     return isFertilityProduct;
//   });
//   debugLog('Fertility products after filtering:', allProducts.length);
//   debugLog('Fertility product subcategories:', [...new Set(allProducts.map(p => p.subcategory))]);
//   // Apply filters and update UI
//   applyFilters();
//   updateUIWithProducts();
// }



function processProducts(data) {
  debugLog('Raw API data:', data);

  let productsArray = [];
  if (Array.isArray(data)) {
    productsArray = data;
  } else if (data.content) {
    productsArray = data.content;
  }

  debugLog('Products count from API:', productsArray.length);

  if (productsArray.length === 0) {
    document.getElementById("productsGrid").innerHTML = '<div class="col-span-full text-center py-20 text-gray-500">No products found</div>';
    setText("resultsCount", "0 products");
    return;
  }

  // Transform all products
  allProducts = transformBackendProducts(productsArray);
  debugLog('After transform:', allProducts.length);

  // TEMPORARILY: Show ALL products (bypass strict filtering)
  filteredProducts = [...allProducts];

  // Now render
  applyFilters(); // This calls renderProducts()
  updateUIWithProducts();
}


// Transform backend product format to frontend format
// function transformBackendProducts(backendProducts) {
//   if (!Array.isArray(backendProducts) || backendProducts.length === 0) {
//     return [];
//   }
//   debugLog('Transforming', backendProducts.length, 'products');
//   return backendProducts.map((product, index) => {
//     try {
//       // Extract basic fields
//       const id = product.productId || product.id || index + 1;
//       const title = product.productName || product.name || 'Unnamed Product';
      
//       // FIXED: Handle array prices correctly (same as previous pages)
//       let price = 100;
//       let originalPrice = price * 1.2;
//       let discount = 0;
      
//       if (Array.isArray(product.productPrice) && product.productPrice.length > 0) {
//         price = Math.min(...product.productPrice.filter(p => typeof p === 'number' && p > 0));
//       } else if (typeof product.productPrice === 'number') {
//         price = product.productPrice;
//       }
      
//       if (Array.isArray(product.productOldPrice) && product.productOldPrice.length > 0) {
//         const minOld = Math.min(...product.productOldPrice.filter(p => typeof p === 'number' && p > 0));
//         if (minOld > price) {
//           originalPrice = minOld;
//         }
//       } else if (typeof product.productOldPrice === 'number' && product.productOldPrice > price) {
//         originalPrice = product.productOldPrice;
//       }
      
//       discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
    
//       // Get subcategory - this is in productSubCategory field
//       const subcategory = product.productSubCategory || 'Unknown';
    
//       // Get brand - this is in brandName field
//       const brand = product.brandName || product.brand || product.manufacturer || 'Generic';
    
//       const description = product.productDescription || product.description || 'No description available';
//       const stockQuantity = product.productQuantity || product.stockQuantity || product.quantity || 0;
//       // FIXED: Match "In Stock" (with space)
//       const inStock = product.productStock === 'In Stock' || stockQuantity > 0;
    
//       // Get image URL
//       let imageUrl = 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop';
    
//       if (product.productMainImage) {
//         // Check if it's a path starting with /api/
//         if (product.productMainImage.startsWith('/api/')) {
//           // It's a relative path, make it absolute
//           imageUrl = `http://localhost:8083${product.productMainImage}`;
//         }
//         // Check if it's base64
//         else if (product.productMainImage.startsWith('data:image')) {
//           imageUrl = product.productMainImage;
//         }
//         // Check if it's a URL
//         else if (product.productMainImage.startsWith('http')) {
//           imageUrl = product.productMainImage;
//         }
//         // Otherwise assume it's base64
//         else {
//           imageUrl = `data:image/jpeg;base64,${product.productMainImage}`;
//         }
//       } else if (product.productId) {
//         imageUrl = `${API_BASE_URL}/${product.productId}/image`;
//       }
    
//       // Generate SKU if not available
//       const sku = product.sku || `F${String(id).padStart(4, '0')}`;
    
//       return {
//         id: id,
//         title: title,
//         price: price,
//         originalPrice: originalPrice,
//         discount: discount,
//         rating: product.rating || product.productRating || 4.0,
//         reviewCount: product.reviewCount || product.totalReviews || Math.floor(Math.random() * 1000),
//         subcategory: subcategory,
//         brand: brand,
//         image: imageUrl,
//         description: description,
//         inStock: inStock,
//         stockQuantity: stockQuantity,
//         sku: sku
//       };
//     } catch (error) {
//       console.error('Error transforming product:', product, error);
//       return null;
//     }
//   }).filter(product => product !== null);
// }


// function transformBackendProducts(backendProducts) {
//   if (!Array.isArray(backendProducts) || backendProducts.length === 0) {
//     return [];
//   }

//   return backendProducts.map((product, index) => {
//     try {
//       // Extract basic fields
//       const id = product.productId || product.id || index + 1;
//       const title = product.productName || product.name || 'Unnamed Product';

//       // Handle price arrays safely
//       let price = 299; // fallback
//       let originalPrice = price * 1.3;
//       let discount = 0;

//       if (Array.isArray(product.productPrice) && product.productPrice.length > 0) {
//         const validPrices = product.productPrice.filter(p => typeof p === 'number' && p > 0);
//         if (validPrices.length > 0) price = Math.min(...validPrices);
//       } else if (typeof product.productPrice === 'number' && product.productPrice > 0) {
//         price = product.productPrice;
//       }

//       if (Array.isArray(product.productOldPrice) && product.productOldPrice.length > 0) {
//         const validOldPrices = product.productOldPrice.filter(p => typeof p === 'number' && p > 0);
//         if (validOldPrices.length > 0) {
//           const minOld = Math.min(...validOldPrices);
//           if (minOld > price) originalPrice = minOld;
//         }
//       } else if (typeof product.productOldPrice === 'number' && product.productOldPrice > price) {
//         originalPrice = product.productOldPrice;
//       }

//       discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

//       // Subcategory and brand
//       const subcategory = product.productSubCategory || 'Unknown';
//       const brand = product.brandName || product.brand || product.manufacturer || 'Generic';

//       // Stock status
//       const stockQuantity = product.productQuantity || product.stockQuantity || product.quantity || 0;
//       const inStock = product.productStock === 'In Stock' || stockQuantity > 0;

//       // Image URL handling
//       let imageUrl = 'https://via.placeholder.com/400x400/cccccc/ffffff?text=No+Image';

//       if (product.productMainImage) {
//         if (product.productMainImage.startsWith('http')) {
//           imageUrl = product.productMainImage;
//         } else if (product.productMainImage.startsWith('/api/')) {
//           imageUrl = 'http://localhost:8083' + product.productMainImage;
//         } else if (product.productMainImage.startsWith('data:image')) {
//           imageUrl = product.productMainImage;
//         } else {
//           // Assume base64 if none of the above
//           imageUrl = `data:image/jpeg;base64,${product.productMainImage}`;
//         }
//       }

//       // SKU fallback
//       const sku = product.sku || `F${String(id).padStart(4, '0')}`;

//       return {
//         id: id,
//         title: title,
//         price: price,
//         originalPrice: originalPrice,
//         discount: discount,
//         rating: product.rating || product.productRating || 4.0,
//         reviewCount: product.reviewCount || product.totalReviews || Math.floor(Math.random() * 100),
//         subcategory: subcategory,
//         brand: brand,
//         image: imageUrl,
//         description: product.productDescription || product.description || 'No description available',
//         inStock: inStock,
//         stockQuantity: stockQuantity,
//         sku: sku
//       };
//     } catch (error) {
//       console.error('Error transforming product:', product, error);
//       return null;
//     }
//   }).filter(product => product !== null);
// }




function transformBackendProducts(backendProducts) {
  if (!Array.isArray(backendProducts) || backendProducts.length === 0) {
    return [];
  }

  return backendProducts.map((product, index) => {
    try {
      const id = product.productId || product.id || index + 1;
      const title = product.productName || product.name || 'Unnamed Product';

      // ── Price handling ────────────────────────────────────────
      let price = null;
      let originalPrice = null;
      let discount = 0;

      // Current price
      if (Array.isArray(product.productPrice) && product.productPrice.length > 0) {
        const valid = product.productPrice.filter(p => typeof p === 'number' && p > 0);
        if (valid.length > 0) {
          price = Math.min(...valid);           // or .at(0) if you expect single value
        }
      } else if (typeof product.productPrice === 'number' && product.productPrice > 0) {
        price = product.productPrice;
      }

      // Old / MRP price
      if (Array.isArray(product.productOldPrice) && product.productOldPrice.length > 0) {
        const validOld = product.productOldPrice.filter(p => typeof p === 'number' && p > 0);
        if (validOld.length > 0) {
          originalPrice = Math.min(...validOld);
        }
      } else if (typeof product.productOldPrice === 'number' && product.productOldPrice > 0) {
        originalPrice = product.productOldPrice;
      }

      // Only calculate real discount when we have both values and old > current
      if (price !== null && originalPrice !== null && originalPrice > price) {
        discount = Math.round(((originalPrice - price) / originalPrice) * 100);
      } else {
        discount = 0;
        // Optional: if you want to show old price only when there's actual discount
        // originalPrice = null;
      }

      // If we still don't have a price → skip product or show "--" later in UI
      if (price === null) {
        console.warn(`Product ${title} (id ${id}) has no valid price`);
        // You can return null here to filter it out, or keep with price: 0 / "N/A"
      }

      // Rest of your fields (unchanged)
      const subcategory = product.productSubCategory || 'Unknown';
      const brand = product.brandName || product.brand || product.manufacturer || 'Generic';
      const stockQuantity = product.productQuantity || product.stockQuantity || product.quantity || 0;
      const inStock = product.productStock === 'In Stock' || stockQuantity > 0;

      let imageUrl = 'https://goodneews.com/Images/product_details_fallback_img.jpg';
      if (product.productMainImage) {
        if (product.productMainImage.startsWith('http')) {
          imageUrl = product.productMainImage;
        } else if (product.productMainImage.startsWith('/api/')) {
          imageUrl = 'http://localhost:8083' + product.productMainImage;
        } else if (product.productMainImage.startsWith('data:image')) {
          imageUrl = product.productMainImage;
        } else {
          imageUrl = `data:image/jpeg;base64,${product.productMainImage}`;
        }
      }

      const sku = product.sku || `F${String(id).padStart(4, '0')}`;

      return {
        id,
        title,
        price,                // ← can be null → handle in UI (show "Price on request" etc.)
        originalPrice,        // ← can be null
        discount,
        rating: product.rating || product.productRating || 0,
        reviewCount: product.reviewCount || product.totalReviews || 0,
        subcategory,
        brand,
        image: imageUrl,
        description: product.productDescription || product.description || 'No description available',
        inStock,
        stockQuantity,
        sku
      };
    } catch (error) {
      console.error('Error transforming product:', product, error);
      return null;
    }
  }).filter(Boolean);   // removes null entries
}


// Update UI with loaded products
function updateUIWithProducts() {
  // Update brands dropdown
  updateBrandsDropdown();
  // Update categories dropdown (Fertility categories)
  updateCategoriesDropdown();
  // Update price range
  updatePriceRange();
  // Initialize filter event listeners
  initFilterEventListeners();
  // Sync filter states
  syncFilterStates();
  // Render products
  renderProducts();
}

// Update brands dropdown
function updateBrandsDropdown() {
  const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))];
  brands.sort();
  debugLog('Available brands:', brands);
  // Update desktop brands (inside sidebar - it's hidden by default, need to populate)
  const desktopBrands = document.querySelector('#filterSidebar [name="brand"]')?.closest('.mt-2');
  if (desktopBrands && desktopBrands.querySelectorAll('input').length === 0) {
    let html = `
      <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer">
        <input type="radio" name="brand" value="all" ${filterState.brand === 'all' ? 'checked' : ''} class="w-4 h-4 text-blue-600">
        <span class="text-sm">All Brands</span>
      </label>
    `;
  
    brands.forEach(brand => {
      html += `
        <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer">
          <input type="radio" name="brand" value="${brand}" ${filterState.brand === brand ? 'checked' : ''} class="w-4 h-4 text-blue-600">
          <span class="text-sm">${brand}</span>
        </label>
      `;
    });
  
    desktopBrands.innerHTML = html;
  
    // Add event listeners
    desktopBrands.querySelectorAll('input[name="brand"]').forEach(input => {
      input.addEventListener('change', (e) => {
        filterState.brand = e.target.value;
        applyFilters();
      });
    });
  }
  // Update mobile brands (inside filter sheet)
  const mobileBrands = document.querySelector('#filterSheet [name="mobileBrand"]')?.closest('div');
  if (mobileBrands && mobileBrands.querySelectorAll('input').length === 0) {
    let html = `
      <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer">
        <input type="radio" name="mobileBrand" value="all" ${filterState.brand === 'all' ? 'checked' : ''} class="w-4 h-4 text-blue-600">
        <span class="text-sm">All Brands</span>
      </label>
    `;
  
    brands.forEach(brand => {
      html += `
        <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer">
          <input type="radio" name="mobileBrand" value="${brand}" ${filterState.brand === brand ? 'checked' : ''} class="w-4 h-4 text-blue-600">
          <span class="text-sm">${brand}</span>
        </label>
      `;
    });
  
    mobileBrands.innerHTML = html;
  }
}

// Update categories dropdown (Fertility categories)
function updateCategoriesDropdown() {
  debugLog('Updating categories dropdown with:', FERTILITY_CATEGORIES);
  // Update desktop categories (already has static HTML, just add event listeners)
  const desktopCategories = document.querySelector('#filterSidebar input[name="category"]')?.closest('.mt-5');
  if (desktopCategories) {
    // Add event listeners to existing radio buttons
    desktopCategories.querySelectorAll('input[name="category"]').forEach(input => {
      input.addEventListener('change', (e) => {
        filterState.category = e.target.value;
        debugLog('Category changed to:', filterState.category);
        applyFilters();
      });
    });
  }
  // Update mobile categories (in filter sheet)
  const mobileCategories = document.querySelector('#filterSheet [name="mobileCategory"]')?.closest('div');
  if (mobileCategories && mobileCategories.querySelectorAll('input').length === 0) {
    let html = '';
  
    FERTILITY_CATEGORIES.forEach(category => {
      html += `
        <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer">
          <input type="radio" name="mobileCategory" value="${category.id}" ${filterState.category === category.id ? 'checked' : ''} class="w-4 h-4 text-blue-600">
          <span class="text-sm">${category.name}</span>
        </label>
      `;
    });
  
    mobileCategories.innerHTML = html;
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
  filterState.maxPrice = Math.max(maxPrice, 3000); // Keep min 3000 as default max
  debugLog('Price range:', minPrice, 'to', filterState.maxPrice);
  // Update sliders if they exist
  updatePriceSliders(minPrice, filterState.maxPrice);
}

function applyFilters() {
  debugLog('Applying filters with', allProducts.length, 'products');
  debugLog('Current filter state:', filterState);
  // First, sync the UI with current filter state
  syncFilterStates();
  filteredProducts = allProducts.filter(p => {
    // Category filter - MOST IMPORTANT FIX
    let categoryMatch = false;
  
    // if (filterState.category === 'all') {
    //   categoryMatch = true;
    // } 
    
    if (filterState.category !== 'all') {
  const selected = FERTILITY_CATEGORIES.find(c => c.id === filterState.category);
  if (selected && selected.backendSubcategories.length > 0) {
    const sub = (p.subcategory || '').toLowerCase();
    categoryMatch = selected.backendSubcategories.some(term =>
      sub.includes(term.toLowerCase())
    );
  }
}
    
    else {
      const selectedCategory = FERTILITY_CATEGORIES.find(cat => cat.id === filterState.category);
      if (!selectedCategory || selectedCategory.id === 'all') {
        categoryMatch = true;
      } else {
        const productSubcategory = (p.subcategory || '').toLowerCase().trim();
      
        // Check if product matches any backend subcategory for this Fertility category
        categoryMatch = selectedCategory.backendSubcategories.some(backendSubcat => {
          const backendSubLower = backendSubcat.toLowerCase().trim();
        
          // DEBUG: Log what's being compared
          if (DEBUG_MODE) {
            debugLog(`Comparing: "${productSubcategory}" with "${backendSubLower}"`);
          }
        
          // STRICT MATCHING - Fixed the issue
          // Only match if the product subcategory EXACTLY matches one of our fertility subcategories
          // OR if it contains the EXACT fertility subcategory as a complete word
          const exactMatch = productSubcategory === backendSubLower;
        
          // For partial matches, check if it's a COMPLETE word match, not just substring
          // Example: "Male Infertility" should match "Infertility" (as a word)
          // But "Female Infertility" should NOT match "Male Infertility"
          const wordMatch = productSubcategory.split(/\s+/).some(word =>
            word === backendSubLower || backendSubLower.split(/\s+/).some(w => w === word)
          );
        
          // Also check if backend subcategory is a complete word in product subcategory
          const containsAsWord = productSubcategory.includes(backendSubLower) &&
                                (productSubcategory === backendSubLower ||
                                 productSubcategory.startsWith(backendSubLower + ' ') ||
                                 productSubcategory.endsWith(' ' + backendSubLower) ||
                                 productSubcategory.includes(' ' + backendSubLower + ' '));
        
          const matches = exactMatch || wordMatch || containsAsWord;
        
          if (matches && DEBUG_MODE) {
            debugLog(`✓ MATCH: Product "${p.title}" (${productSubcategory}) matches "${backendSubLower}" for category "${selectedCategory.name}"`);
          }
        
          return matches;
        });
      
        // If no match found with backend subcategories, try direct category mapping
        if (!categoryMatch) {
          // Additional check: if product subcategory contains the category name
          const categoryNameLower = selectedCategory.name.toLowerCase();
          if (productSubcategory.includes(categoryNameLower)) {
            categoryMatch = true;
            if (DEBUG_MODE) {
              debugLog(`✓ Category name match: Product "${p.title}" contains "${categoryNameLower}"`);
            }
          }
        }
      }
    }
  
    // Other filters
    const brandMatch = filterState.brand === 'all' || p.brand === filterState.brand;
    const discMatch = p.discount >= filterState.discount;
    const priceMatch = p.price >= filterState.minPrice && p.price <= filterState.maxPrice;
  
    const matches = categoryMatch && brandMatch && discMatch && priceMatch;
  
    if (!matches && DEBUG_MODE) {
      debugLog(`✗ Product "${p.title}" filtered out:`, {
        categoryMatch,
        brandMatch,
        discMatch,
        priceMatch,
        category: filterState.category,
        brand: filterState.brand,
        productBrand: p.brand,
        productDiscount: p.discount,
        requiredDiscount: filterState.discount
      });
    }
  
    return matches;
  });
  debugLog('After filtering:', filteredProducts.length, 'products');
  // Apply sorting
  sortProducts(filterState.sort);
  // Reset to first page
  currentPage = 1;
  // Render products
  renderProducts();
}

// ==================== PRODUCT CARD ====================
function createProductCard(p) {
//   const inWishlist = wishlist.some(item => item.productId === p.id);

const fallback_prodcut_img = 'http://localhost:8083/Images/product_details_fallback_img.jpg';

const inWishlist = CURRENT_USER_ID && wishlist.some(item => item.productId === p.id);
  const isOutOfStock = !p.inStock;
  return `
    <div class="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-100
                ${isOutOfStock ? 'opacity-60 grayscale cursor-not-allowed' : ''}"
         ${!isOutOfStock ? `onclick="viewProductDetails(${p.id})"` : ''}
         style="${isOutOfStock ? 'pointer-events: none;' : 'cursor: pointer;'}">
      <div class="relative bg-blue-50 aspect-[6/4] overflow-hidden">
        <img src="${p.image || fallback_prodcut_img}" alt="${p.title}"
             class="w-full h-full object-contain p-5 transition-transform duration-500 ${!isOutOfStock ? 'group-hover:scale-110' : ''}"
             onerror="this.src='https://localhost:8083/Images/product_details_fallback_img.jpg'">
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
        <p class="text-xs text-gray-500 mt-1">${p.subcategory || 'Fertility Product'}</p>
        <div class="mt-2 flex items-center gap-2">
          <span class="text-lg font-bold text-green-600">₹${p.price.toLocaleString()}</span>
          ${p.originalPrice > p.price ? `
            <span class="text-sm text-gray-500 line-through">₹${p.originalPrice.toLocaleString()}</span>
          ` : ''}
          ${p.discount > 0 ? `<span class="text-sm font-medium text-red-500">${p.discount}% OFF</span>` : ''}
        </div>
        <div class="flex items-center mt-2">
          <div class="flex text-yellow-400">
            ${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5-Math.floor(p.rating))}
          </div>
          <span class="text-xs text-gray-500 ml-2">(${p.reviewCount})</span>
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
    
      // Show/Hide "Show More" button
      const showMoreBtn = document.getElementById('showMoreBtn');
      if (showMoreBtn) {
        if (filteredProducts.length > pageSize * currentPage) {
          showMoreBtn.classList.remove('hidden');
        } else {
          showMoreBtn.classList.add('hidden');
        }
      }
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
    
      // Hide "Show More" button when no products
      const showMoreBtn = document.getElementById('showMoreBtn');
      if (showMoreBtn) showMoreBtn.classList.add('hidden');
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

// Show more products function
function showMoreProducts() {
  if (filteredProducts.length > pageSize * currentPage) {
    currentPage++;
    renderProducts();
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

function clearFilters() {
  filterState = {
    category: 'all',
    brand: 'all',
    discount: 0,
    minPrice: 0,
    maxPrice: 3000,
    sort: 'default'
  };
  // Reset UI
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) sortSelect.value = 'default';
  // Sync filter states
  syncFilterStates();
  // Fetch products with cleared filters
  fetchProducts();
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
    desktopMin.value = minPrice;
  
    desktopMax.min = minPrice;
    desktopMax.max = maxPrice;
    desktopMax.value = maxPrice;
  
    if (desktopMinVal) desktopMinVal.textContent = `₹${minPrice}`;
    if (desktopMaxVal) desktopMaxVal.textContent = `₹${maxPrice}`;
  
    // Update filter state
    filterState.minPrice = minPrice;
    filterState.maxPrice = maxPrice;
  }
  // Update mobile sliders
  const mobileMin = document.getElementById('mobileMinThumb');
  const mobileMax = document.getElementById('mobileMaxThumb');
  const mobileMinVal = document.getElementById('mobileMinValue');
  const mobileMaxVal = document.getElementById('mobileMaxValue');
  if (mobileMin && mobileMax) {
    mobileMin.min = minPrice;
    mobileMin.max = maxPrice;
    mobileMin.value = minPrice;
  
    mobileMax.min = minPrice;
    mobileMax.max = maxPrice;
    mobileMax.value = maxPrice;
  
    if (mobileMinVal) mobileMinVal.textContent = `₹${minPrice}`;
    if (mobileMaxVal) mobileMaxVal.textContent = `₹${maxPrice}`;
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
    showToast('This product is currently out of stock', "info");
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
  console.log('Initializing Fertility Essentials page...');
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
  // Initialize discount filters
  initDiscountFilters();
  // Initialize "Show More" button
  const showMoreBtn = document.getElementById('showMoreBtn');
  if (showMoreBtn) {
    showMoreBtn.addEventListener('click', showMoreProducts);
  }
  
  // Initialize Reset Filters button (Desktop only)
  initResetDesktopFilters();
  // Load wishlist first
  await loadWishlistFromBackend();
  // Fetch initial products
  await fetchProducts();
  // Update header counts
  updateHeaderCounts();
  // Initialize banner slider
  initBannerSlider();
}

// Initialize Reset Desktop Filters button
function initResetDesktopFilters() {
  const resetBtn = document.getElementById('resetDesktopFilters');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetDesktopFilters);
    debugLog('Reset desktop filters button initialized');
  } else {
    console.warn('Reset desktop filters button not found');
  }
}

// Initialize discount filters
function initDiscountFilters() {
  const discountOptions = [
    { value: 0, label: 'All Products' },
    { value: 10, label: '10% or more' },
    { value: 20, label: '20% or more' },
    { value: 30, label: '30% or more' }
  ];
  // Desktop discount filters (inside sidebar - it's hidden by default, need to populate)
  const desktopDiscounts = document.querySelector('#filterSidebar [name="discount"]')?.closest('.mt-4');
  if (desktopDiscounts && desktopDiscounts.querySelectorAll('input').length === 0) {
    let html = '';
    discountOptions.forEach(option => {
      html += `
        <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer">
          <input type="radio" name="discount" value="${option.value}" ${filterState.discount === option.value ? 'checked' : ''} class="w-4 h-4 text-blue-600">
          <span class="text-sm">${option.label}</span>
        </label>
      `;
    });
    desktopDiscounts.innerHTML = html;
  
    desktopDiscounts.querySelectorAll('input[name="discount"]').forEach(input => {
      input.addEventListener('change', (e) => {
        filterState.discount = parseInt(e.target.value);
        applyFilters();
      });
    });
  }
  // Mobile discount filters (already in HTML)
  // Just add event listeners
  document.querySelectorAll('input[name="mobileDiscount"]').forEach(input => {
    input.addEventListener('change', (e) => {
      filterState.discount = parseInt(e.target.value);
    });
  });
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

// ==================== ADD THESE RIGHT HERE ====================
// Add this function to initialize all filter event listeners
function initFilterEventListeners() {
  debugLog('Initializing filter event listeners...');
  // 1. Desktop Category Filters
  const desktopCategoryInputs = document.querySelectorAll('#filterSidebar input[name="category"]');
  desktopCategoryInputs.forEach(input => {
    // Remove existing listeners first to avoid duplicates
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
  
    newInput.addEventListener('change', (e) => {
      filterState.category = e.target.value;
      debugLog('Desktop category changed to:', filterState.category);
      applyFilters();
    });
  });
  // 2. Desktop Brand Filters
  const desktopBrandInputs = document.querySelectorAll('#filterSidebar input[name="brand"]');
  desktopBrandInputs.forEach(input => {
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
  
    newInput.addEventListener('change', (e) => {
      filterState.brand = e.target.value;
      debugLog('Desktop brand changed to:', filterState.brand);
      applyFilters();
    });
  });
  // 3. Desktop Discount Filters
  const desktopDiscountInputs = document.querySelectorAll('#filterSidebar input[name="discount"]');
  desktopDiscountInputs.forEach(input => {
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
  
    newInput.addEventListener('change', (e) => {
      filterState.discount = parseInt(e.target.value);
      debugLog('Desktop discount changed to:', filterState.discount);
      applyFilters();
    });
  });
  // 4. Mobile Category Filters (in filter sheet)
  const mobileCategoryInputs = document.querySelectorAll('#filterSheet input[name="mobileCategory"]');
  mobileCategoryInputs.forEach(input => {
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
  
    newInput.addEventListener('change', (e) => {
      filterState.category = e.target.value;
      debugLog('Mobile category changed to:', filterState.category);
    
      // Update corresponding desktop radio
      const desktopRadio = document.querySelector(`#filterSidebar input[name="category"][value="${e.target.value}"]`);
      if (desktopRadio) {
        desktopRadio.checked = true;
      }
    });
  });
  // 5. Mobile Brand Filters (in filter sheet)
  const mobileBrandInputs = document.querySelectorAll('#filterSheet input[name="mobileBrand"]');
  mobileBrandInputs.forEach(input => {
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
  
    newInput.addEventListener('change', (e) => {
      filterState.brand = e.target.value;
      debugLog('Mobile brand changed to:', filterState.brand);
    
      // Update corresponding desktop radio
      const desktopRadio = document.querySelector(`#filterSidebar input[name="brand"][value="${e.target.value}"]`);
      if (desktopRadio) {
        desktopRadio.checked = true;
      }
    });
  });
  // 6. Mobile Discount Filters (in filter sheet)
  const mobileDiscountInputs = document.querySelectorAll('#filterSheet input[name="mobileDiscount"]');
  mobileDiscountInputs.forEach(input => {
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
  
    newInput.addEventListener('change', (e) => {
      filterState.discount = parseInt(e.target.value);
      debugLog('Mobile discount changed to:', filterState.discount);
    
      // Update corresponding desktop radio
      const desktopRadio = document.querySelector(`#filterSidebar input[name="discount"][value="${e.target.value}"]`);
      if (desktopRadio) {
        desktopRadio.checked = true;
      }
    });
  });
  debugLog('Filter event listeners initialized');
}

// Add this function to synchronize filter states
function syncFilterStates() {
  debugLog('Syncing filter states...');
  // Sync desktop radios with filterState
  const categoryRadio = document.querySelector(`#filterSidebar input[name="category"][value="${filterState.category}"]`);
  if (categoryRadio) categoryRadio.checked = true;
  const brandRadio = document.querySelector(`#filterSidebar input[name="brand"][value="${filterState.brand}"]`);
  if (brandRadio) brandRadio.checked = true;
  const discountRadio = document.querySelector(`#filterSidebar input[name="discount"][value="${filterState.discount}"]`);
  if (discountRadio) discountRadio.checked = true;
  // Sync mobile radios with filterState
  const mobileCategoryRadio = document.querySelector(`#filterSheet input[name="mobileCategory"][value="${filterState.category}"]`);
  if (mobileCategoryRadio) mobileCategoryRadio.checked = true;
  const mobileBrandRadio = document.querySelector(`#filterSheet input[name="mobileBrand"][value="${filterState.brand}"]`);
  if (mobileBrandRadio) mobileBrandRadio.checked = true;
  const mobileDiscountRadio = document.querySelector(`#filterSheet input[name="mobileDiscount"][value="${filterState.discount}"]`);
  if (mobileDiscountRadio) mobileDiscountRadio.checked = true;
  debugLog('Filter states synced');
}

// ==================== ON LOAD ====================
document.addEventListener("DOMContentLoaded", init);







