// ==================== GLOBAL STATE ====================
let allProducts = [];
let filteredProducts = [];
let wishlist = [];
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let currentPage = 1;
const pageSize = 12;
let filterState = {
  category: 'all',
  brand: 'all',
  discount: 0,
  minPrice: 0,
  maxPrice: 10000,
  sort: 'default'
};
const API_BASE = "http://localhost:8083/api/mb/products";
const WISHLIST_API_BASE = "http://localhost:8083/api/wishlist";
const IMAGE_BASE = "http://localhost:8083";

const BANNER_API_BASE = "http://localhost:8083/api/banners";




// =============== DYNAMIC PRICE RANGE & BRANDS ===============
function updateDynamicFilters(products) {
    if (!products || products.length === 0) return;

    // --- DYNAMIC PRICE RANGE ---
    const prices = products
        .map(p => p.price)
        .filter(p => typeof p === 'number' && p > 0);

    if (prices.length > 0) {
        let minPrice = Math.floor(Math.min(...prices));
        let maxPrice = Math.ceil(Math.max(...prices));

        const roundedMin = Math.floor(minPrice / 100) * 100 || 0;
        const roundedMax = Math.ceil(maxPrice / 100) * 100 || 10000;
        const finalMin = roundedMin;
        const finalMax = roundedMax > 10000 ? roundedMax : Math.max(roundedMax, 10000);

        console.log(`Dynamic Price Range: ₹${finalMin} - ₹${finalMax}`);

        // UPDATE BOTH DESKTOP AND MOBILE SLIDERS
        const allMinThumbs = document.querySelectorAll('#minThumb');
        const allMaxThumbs = document.querySelectorAll('#maxThumb');

        allMinThumbs.forEach(thumb => {
            thumb.min = finalMin;
            thumb.max = finalMax;
            thumb.value = finalMin;
        });

        allMaxThumbs.forEach(thumb => {
            thumb.min = finalMin;
            thumb.max = finalMax;
            thumb.value = finalMax;
        });

        // UPDATE BOTH VALUE DISPLAYS (desktop + mobile)
        document.querySelectorAll('#minValue').forEach(el => {
            el.textContent = `₹${finalMin.toLocaleString()}`;
        });
        document.querySelectorAll('#maxValue').forEach(el => {
            el.textContent = `₹${finalMax.toLocaleString()}`;
        });

        // Update filter state
        filterState.minPrice = finalMin;
        filterState.maxPrice = finalMax;

        // Force fill update on all sliders
        if (typeof window.updatePriceFill === 'function') {
            setTimeout(window.updatePriceFill, 100);
        }
    }

    // --- DYNAMIC BRANDS (unchanged) ---
    const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();

    console.log("Dynamic Brands:", uniqueBrands);

    ['#filterForm', '#mobileFilterForm'].forEach(formSelector => {
        const container = document.querySelector(`${formSelector} .border-b.pb-4 > div:nth-child(2)`);
        if (!container) return;

        container.innerHTML = `
            <label class="flex items-center">
                <input type="radio" name="brand" value="all" checked class="w-5 h-5 text-pink-600">
                <span class="ml-3">All Brands</span>
            </label>
        `;

        uniqueBrands.forEach(brand => {
            const label = document.createElement('label');
            label.className = 'flex items-center';
            label.innerHTML = `
                <input type="radio" name="brand" value="${brand}" class="w-5 h-5 text-pink-600">
                <span class="ml-3">${brand}</span>
            `;
            container.appendChild(label);
        });
    });
}

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
const CURRENT_USER_ID = getCurrentUserId(); // Exactly like ref code

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
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
        productType: "MOTHER"
      })
    });
    if (response.ok) {
      console.log("Backend: Added to wishlist");
      return true;
    }
  } catch (err) {
    console.error("Error adding to wishlist backend:", err);
  }
  return false;
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
        productType: "MOTHER"
      })
    });
    if (response.ok) {
      console.log("Backend: Removed from wishlist");
      return true;
    }
  } catch (err) {
    console.error("Error removing from wishlist backend:", err);
  }
  return false;
}

async function loadWishlistFromBackend() {
  if (!CURRENT_USER_ID) {
    console.log("No user logged in, skipping wishlist load from backend");
    wishlist = [];
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
        id: item.productId || item.id
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

// ==================== LOAD PRODUCTS FROM BACKEND ====================
// async function loadProductsBySubcategories() {
//   console.log("Starting loadProductsBySubcategories...");
//   const subcategories = [
//     "Test Kits",
//     "Skin Care",
//     "Vitamins & Supplements",
//     "Personal Care & Hygiene",
//     "Trimester Kits",
//     "Garbhsanskar Essentials & Ayurvedic Medicines",
//     "Accessories & Maternity Wear",
//     "Delivery Kits",
//     "Post delivery recovery",
//     "Breastfeeding Essentials",
//     "Postpartum Hygiene",
//     "Postpartum Nutrition",
//     "Pain & Healing Support",
//     "Uterine Health",
//     "Menstruation Essentials and Hygiene",
//     "PCOS and Preconception",
//     "MenoPausal Medicines"
//   ];
//   try {
//     const requests = subcategories.map(sub => {
//       const url = `${API_BASE}/sub-category/${encodeURIComponent(sub)}`;
//       return fetch(url)
//         .then(res => res.ok ? res.json() : [])
//         .catch(() => []);
//     });
//     const results = await Promise.all(requests);
//     const productsFromApi = results.flat();
//     allProducts = productsFromApi.map(p => ({
//       id: p.id,
//       title: p.title || "Untitled Product",
//       price: p.price?.[0] || 999,
//       originalPrice: p.originalPrice?.[0] || null,
//       discount: p.discount || (p.originalPrice?.[0] && p.price?.[0]
//         ? Math.round(((p.originalPrice[0] - p.price[0]) / p.originalPrice[0]) * 100)
//         : 0),
//       rating: p.rating || 4.5,
//       brand: p.brand || "Premium Brand",
//       category: p.category || "Mother Care",
//       subcategory: p.subCategory || "",
//       inStock: p.inStock !== false,
//       mainImageUrl: `${IMAGE_BASE}/api/mb/products/${p.id}/image`,
//       description: Array.isArray(p.description) ? p.description.join(". ") : (p.description || "No description available"),
//       productType: "MOTHER"
//     }));
    
//     updateDynamicFilters(allProducts);  //ADDED
    
//     filteredProducts = [...allProducts];
//     setText("resultsCount", `Showing ${filteredProducts.length} products`);
//     renderProducts();
//     await loadWishlistFromBackend();
//   } catch (err) {
//     console.error("FATAL ERROR in loadProductsBySubcategories:", err);
//     setText("resultsCount", "Failed to load products");
//   }
// }



// ==================== LOAD PRODUCTS FROM BACKEND ====================
async function loadProductsByCategory() {
  console.log("Loading all Mother Care products via single category endpoint...");
  
  const url = `${API_BASE}/category/MotherCare`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const productsFromApi = await response.json();
    
    allProducts = productsFromApi.map(p => ({
      id: p.id,
      title: p.title || "Untitled Product",
      price: p.price?.[0] || 999,
      originalPrice: p.originalPrice?.[0] || null,
      discount: p.discount || (p.originalPrice?.[0] && p.price?.[0]
        ? Math.round(((p.originalPrice[0] - p.price[0]) / p.originalPrice[0]) * 100)
        : 0),
      rating: p.rating || 4.5,
      brand: p.brand || "Premium Brand",
      category: p.category || "Mother Care",
      subcategory: p.subCategory || "",
      inStock: p.inStock !== false,
      mainImageUrl: `${IMAGE_BASE}/api/mb/products/${p.id}/image`,
      description: Array.isArray(p.description) ? p.description.join(". ") : (p.description || "No description available"),
      productType: "MOTHER"
    }));
   
    updateDynamicFilters(allProducts);
   
    filteredProducts = [...allProducts];
    setText("resultsCount", `Showing ${filteredProducts.length} products`);
    renderProducts();
    await loadWishlistFromBackend();
    
    console.log(`Successfully loaded ${allProducts.length} products from Mother Care category`);
  } catch (err) {
    console.error("FATAL ERROR in loadProductsByCategory:", err);
    setText("resultsCount", "Failed to load products");
    // Optional: fallback to old method if needed (commented out)
    // loadProductsBySubcategories();
  }
}












// ==================== RESET FILTERS FUNCTION ====================
// function resetAllFilters() {
//   // Reset filter state to default values
//   filterState = {
//     category: 'all',
//     brand: 'all',
//     discount: 0,
//     minPrice: 0,
//     maxPrice: 10000,
//     sort: 'default'
//   };
  
//   // Remove saved filters from localStorage
//   localStorage.removeItem('motherCareFilters');
  
//   // Reset all radio buttons in the filter form
//   document.querySelectorAll('input[name="category"]').forEach(radio => {
//     radio.checked = radio.value === 'all';
//   });
  
//   document.querySelectorAll('input[name="brand"]').forEach(radio => {
//     radio.checked = radio.value === 'all';
//   });
  
//   document.querySelectorAll('input[name="discount"]').forEach(radio => {
//     radio.checked = radio.value === '0';
//   });
  
//   // Reset sort dropdown
//   const sortSelect = document.getElementById("sortSelect");
//   if (sortSelect) {
//     sortSelect.value = 'default';
//   }
  
//   // Reset price sliders
//     const minThumb = document.getElementById("minThumb");
//   const maxThumb = document.getElementById("maxThumb");
//   if (minThumb && maxThumb) {
//     const dynamicMin = parseInt(minThumb.min) || 0;
//     const dynamicMax = parseInt(maxThumb.max) || 10000;

//     minThumb.value = dynamicMin;
//     maxThumb.value = dynamicMax;

//     document.getElementById('minValue').textContent = `₹${dynamicMin.toLocaleString()}`;
//     document.getElementById('maxValue').textContent = `₹${dynamicMax.toLocaleString()}`;

//     if (window.updatePriceFill) window.updatePriceFill();

//     filterState.minPrice = dynamicMin;
//     filterState.maxPrice = dynamicMax;
//   }
  
//   // Close all expanded category submenus
//   const allSubmenus = document.querySelectorAll('#filterForm [class*="ml-8 mt-2 space-y-2"]');
//   allSubmenus.forEach(submenu => {
//     submenu.classList.add('hidden');
//   });
  
//   // Reset all chevron icons to down position
//   const allChevrons = document.querySelectorAll('#filterForm .fa-chevron-down');
//   allChevrons.forEach(chevron => {
//     chevron.classList.remove('rotate-180');
//   });
  
//   // Apply the reset filters
//   applyFilters();
  
//   // Show toast notification
//   showToast("All filters have been reset");
  
//   console.log("Filters reset to default values");
// }



function resetAllFilters() {
  console.log("Resetting all filters to default (using dynamic price range)");
  
      // Clear both local and session storage for filters
    localStorage.removeItem('motherCareFilters');
    sessionStorage.removeItem('motherCareFilters');

  // Get dynamic min/max from sliders (backend-set values)
  const minThumb = document.getElementById("minThumb");
  const maxThumb = document.getElementById("maxThumb");
  const dynamicMin = minThumb ? parseInt(minThumb.min) || 0 : 0;
  const dynamicMax = maxThumb ? parseInt(maxThumb.max) || 10000 : 10000;

  // Reset filterState with dynamic values
  filterState = {
    category: 'all',
    brand: 'all',
    discount: 0,
    minPrice: dynamicMin,
    maxPrice: dynamicMax,
    sort: 'default'
  };

  // Fully remove from localStorage
  localStorage.removeItem('motherCareFilters');

  // Reset radios
  document.querySelectorAll('input[name="category"]').forEach(radio => {
    radio.checked = radio.value === 'all';
  });
  document.querySelectorAll('input[name="brand"]').forEach(radio => {
    radio.checked = radio.value === 'all';
  });
  document.querySelectorAll('input[name="discount"]').forEach(radio => {
    radio.checked = radio.value === '0';
  });

  // Reset sort dropdown
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) sortSelect.value = 'default';

  // Reset price sliders to dynamic full range
  if (minThumb && maxThumb) {
    minThumb.value = dynamicMin;
    maxThumb.value = dynamicMax;
    document.getElementById('minValue').textContent = `₹${dynamicMin.toLocaleString()}`;
    document.getElementById('maxValue').textContent = `₹${dynamicMax.toLocaleString()}`;
    // Force fill update
    if (window.updatePriceFill) window.updatePriceFill();
  }

  // Close submenus and reset chevrons
  document.querySelectorAll('#filterForm .ml-8.mt-2.space-y-2, #filterSheet .ml-8.mt-2.space-y-2').forEach(submenu => {
    submenu.classList.add('hidden');
  });
  document.querySelectorAll('#filterForm .fa-chevron-down, #filterSheet .fa-chevron-down').forEach(chevron => {
    chevron.classList.remove('rotate-180');
  });

  // Apply reset
  applyFilters();

  showToast("All filters have been reset");
}



// ==================== UI & RENDERING ====================
function updateHeaderCounts() {
  console.log("Updating header counts...");
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

async function toggleWishlist(id) {
  console.log("Toggle wishlist for product ID:", id);
  const index = wishlist.findIndex(item => item.id === id);

  if (index === -1) {
    // Trying to add
    if (!CURRENT_USER_ID) {
      showToast("Please log in to add to wishlist");
      return;
    }
    const success = await addToWishlistBackend(id);
    if (success) {
      wishlist.push({ id });
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
  renderProducts(); // Re-render to update all heart icons instantly
}

function showToast(msg) {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.className = "fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full z-50 shadow-lg";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

function createProductCard(p) {
  const inWishlist = wishlist.some(x => x.id === p.id);
  const isOutOfStock = !p.inStock;
  return `
    <div class="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg cursor-pointer transition-all duration-300 border border-gray-100
                ${isOutOfStock ? 'opacity-60 grayscale cursor-not-allowed' : ''}"
         ${!isOutOfStock ? `onclick="event.stopPropagation(); viewProductDetails(${p.id})"` : ''}
         style="${isOutOfStock ? 'pointer-events: none;' : ''}">
      <div class="relative bg-gray-50 aspect-[6/4] overflow-hidden">
        <img src="${p.mainImageUrl}" alt="${p.title}"
             class="w-full h-full object-contain p-5 transition-transform duration-500 ${!isOutOfStock ? 'group-hover:scale-110' : ''}"
             onerror="this.onerror=null; this.src='http://localhost:8083/Images/product_details_fallback_img.jpg'">
        <div class="absolute top-2 left-2 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md z-10
                    ${isOutOfStock ? 'bg-red-600' : 'bg-green-600'}">
          ${isOutOfStock ? 'Out of Stock' : 'In Stock'}
        </div>
        <button onclick="event.stopPropagation(); toggleWishlist(${p.id})"
                class="absolute top-2 right-2 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center
                       ${isOutOfStock ? 'opacity-50' : 'opacity-0 group-hover:opacity-100'} transition-opacity z-10"
                ${isOutOfStock ? 'disabled' : ''}>
          <i class="${inWishlist ? 'fas fa-heart text-pink-600' : 'far fa-heart text-gray-600'} text-lg"></i>
        </button>
      </div>
      <div class="p-3">
        <p class="text-xs text-gray-500 uppercase font-medium truncate">${p.brand || 'Brand'}</p>
        <h3 class="text-sm font-medium text-gray-800 line-clamp-2 mt-1">${p.title}</h3>
        <div class="mt-2 flex items-center gap-2">
          <span class="text-lg font-bold text-gray-900">₹${p.price.toLocaleString()}</span>
          ${p.originalPrice > p.price ? `
            <span class="text-sm text-gray-500 line-through">₹${p.originalPrice.toLocaleString()}</span>
            <span class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">${p.discount}% OFF</span>
          ` : ''}
        </div>
        <button onclick="event.stopPropagation(); viewProductDetails(${p.id})"
                class="mt-3 w-full font-medium text-sm py-2.5 rounded-lg transition
                        ${isOutOfStock ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-[#CD2C58] hover:bg-[#AB886D] text-white'}">
          ${isOutOfStock ? 'Out of Stock' : 'View Details'}
        </button>
      </div>
    </div>
  `;
}

function renderProducts() {
  const start = (currentPage - 1) * pageSize;
  const paginated = filteredProducts.slice(start, start + pageSize);
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  grid.innerHTML = paginated.length
    ? paginated.map(createProductCard).join("")
    : `<p class="col-span-full text-center text-gray-500 py-10">No products found</p>`;
  setText("resultsCount", `Showing ${filteredProducts.length} products`);
  renderPagination();
}

function renderPagination() {
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const container = document.getElementById("pagination");
  if (!container) return;
  container.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = `px-4 py-2 rounded border mx-1 ${i === currentPage ? 'bg-[#9A3F3F] text-white' : 'bg-white text-pink-600 border-pink-300'}`;
    btn.onclick = () => { currentPage = i; renderProducts(); };
    container.appendChild(btn);
  }
}

function applyFilters() {
  filteredProducts = allProducts.filter(p => {
    const catMatch = filterState.category === 'all' || p.subcategory === filterState.category;
    const brandMatch = filterState.brand === 'all' || p.brand === filterState.brand;
    const discMatch = p.discount >= filterState.discount;
    const priceMatch = p.price >= filterState.minPrice && p.price <= filterState.maxPrice;
    return catMatch && brandMatch && discMatch && priceMatch;
  });
  sortProducts(filterState.sort);
  currentPage = 1;
  renderProducts();
  saveFiltersToStorage();
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

function loadFiltersFromStorage() {
  try {
    const saved = localStorage.getItem('motherCareFilters');
    if (saved) {
      filterState = { ...filterState, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Failed to load filters", e);
  }
}

function saveFiltersToStorage() {
  localStorage.setItem('motherCareFilters', JSON.stringify(filterState));
}




function initPriceSliders() {
    const containers = document.querySelectorAll(".price-slider-container");
    containers.forEach(container => {
        const minThumb = container.querySelector('input[type="range"]:first-of-type');
        const maxThumb = container.querySelector('input[type="range"]:last-of-type');
        const fill = container.querySelector(".slider-fill");
        const minValEl = container.querySelector(".price-values span:first-child") || document.getElementById("minValue");
        const maxValEl = container.querySelector(".price-values span:last-child") || document.getElementById("maxValue");

        const updateFill = () => {
            const min = parseInt(minThumb.value);
            const max = parseInt(maxThumb.value);

            // Get actual dynamic range from attributes
            const rangeMin = parseInt(minThumb.min) || 0;
            const rangeMax = parseInt(maxThumb.max) || 10000;

            const totalRange = rangeMax - rangeMin;
            if (totalRange <= 0) {
                fill.style.left = '0%';
                fill.style.width = '100%';
                return;
            }

            const left = ((min - rangeMin) / totalRange) * 100;
            const width = ((max - min) / totalRange) * 100;

            fill.style.left = `${left}%`;
            fill.style.width = `${width}%`;

            minValEl.textContent = `₹${min.toLocaleString()}`;
            maxValEl.textContent = `₹${max.toLocaleString()}`;

            filterState.minPrice = min;
            filterState.maxPrice = max;
        };

        // Enforce minimum gap
        minThumb.addEventListener("input", () => {
            let val = parseInt(minThumb.value);
            if (val > parseInt(maxThumb.value) - 500) {
                val = parseInt(maxThumb.value) - 500;
                minThumb.value = val;
            }
            updateFill();
            applyFilters();
        });

        maxThumb.addEventListener("input", () => {
            let val = parseInt(maxThumb.value);
            if (val < parseInt(minThumb.value) + 500) {
                val = parseInt(minThumb.value) + 500;
                maxThumb.value = val;
            }
            updateFill();
            applyFilters();
        });

        // Initial update after dynamic range is set
        updateFill();

        // Expose globally so reset can use it
        window.updatePriceFill = updateFill;
    });
}




function initFiltersAndUI() {
  loadFiltersFromStorage();

  // === RESET BUTTON (Desktop) ===
  const resetBtn = document.getElementById("resetDesktopFilters");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetAllFilters);
  }

  // === RADIO BUTTONS - CATEGORY, BRAND, DISCOUNT (Both Desktop & Mobile) ===
  document.querySelectorAll('input[name="category"], input[name="brand"], input[name="discount"]').forEach(input => {
    // Restore checked state from saved filterState
    if (
      (input.name === "category" && input.value === filterState.category) ||
      (input.name === "brand" && input.value === filterState.brand) ||
      (input.name === "discount" && parseInt(input.value) === filterState.discount)
    ) {
      input.checked = true;
    }

    // On change → update filterState and apply filters
    input.addEventListener('change', () => {
      if (input.name === "category") filterState.category = input.value;
      if (input.name === "brand") filterState.brand = input.value;
      if (input.name === "discount") filterState.discount = parseInt(input.value);

      applyFilters();
    });
  });

  // === SORTING - DESKTOP DROPDOWN ===
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.value = filterState.sort;

    sortSelect.addEventListener("change", (e) => {
      filterState.sort = e.target.value;
      sortProducts(filterState.sort);
      renderProducts();
      saveFiltersToStorage();
    });
  }

  // === MOBILE APPLY SORT BUTTON ===
  document.getElementById("applySortBtn")?.addEventListener("click", () => {
    const selected = document.querySelector('#sortSheet input[name="mobileSort"]:checked');
    if (selected && sortSelect) {
      sortSelect.value = selected.value;
      filterState.sort = selected.value;
      sortProducts(filterState.sort);
      renderProducts();
      saveFiltersToStorage();
    }

    // Close sort sheet
    document.getElementById("sortSheet").classList.add("translate-y-full");
    document.getElementById("mobileSheetBackdrop").classList.add("hidden");
  });

  // === MOBILE APPLY FILTERS BUTTON ===
  document.getElementById("applyMobileFilters")?.addEventListener("click", () => {
    const cat = document.querySelector('#filterSheet input[name="category"]:checked')?.value || 'all';
    const brd = document.querySelector('#filterSheet input[name="brand"]:checked')?.value || 'all';
    const disc = parseInt(document.querySelector('#filterSheet input[name="discount"]:checked')?.value || 0);

    filterState.category = cat;
    filterState.brand = brd;
    filterState.discount = disc;

    applyFilters();

    // Close filter sheet
    document.getElementById("filterSheet").classList.add("translate-y-full");
    document.getElementById("mobileSheetBackdrop").classList.add("hidden");
  });

  // === MOBILE CLEAR FILTERS BUTTON ===
     document.getElementById("clearMobileFilters")?.addEventListener("click", () => {
    console.log("Clearing mobile filters (using dynamic price range)");
        // Clear both local and session storage for filters
    localStorage.removeItem('motherCareFilters');
    sessionStorage.removeItem('motherCareFilters');

    // Get dynamic min/max
    const minThumb = document.getElementById("minThumb");
    const maxThumb = document.getElementById("maxThumb");
    const dynamicMin = minThumb ? parseInt(minThumb.min) || 0 : 0;
    const dynamicMax = maxThumb ? parseInt(maxThumb.max) || 10000 : 10000;

    // Reset filterState
    filterState = {
      category: 'all',
      brand: 'all',
      discount: 0,
      minPrice: dynamicMin,
      maxPrice: dynamicMax,
      sort: 'default'
    };

    // Fully remove from localStorage
    localStorage.removeItem('motherCareFilters');

    // Reset radios
    document.querySelectorAll('input[type="radio"]').forEach(r => {
      r.checked = (r.value === 'all' || r.value === '0');
    });

    // Reset sort
    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) sortSelect.value = 'default';

    // Reset sliders
    if (minThumb && maxThumb) {
      minThumb.value = dynamicMin;
      maxThumb.value = dynamicMax;
      document.getElementById('minValue').textContent = `₹${dynamicMin.toLocaleString()}`;
      document.getElementById('maxValue').textContent = `₹${dynamicMax.toLocaleString()}`;
      if (window.updatePriceFill) window.updatePriceFill();
    }

    // Close submenus and reset chevrons (mobile)
    document.querySelectorAll('#filterSheet .ml-8.mt-2.space-y-2').forEach(submenu => {
      submenu.classList.add('hidden');
    });
    document.querySelectorAll('#filterSheet .fa-chevron-down').forEach(chevron => {
      chevron.classList.remove('rotate-180');
    });

    applyFilters();

    // Close sheet
    document.getElementById("filterSheet").classList.add("translate-y-full");
    document.getElementById("mobileSheetBackdrop").classList.add("hidden");

    showToast("Filters cleared");
  });
  
  
  // === DESKTOP APPLY FILTERS BUTTON (if exists) ===
  document.getElementById("applyDesktopFilters")?.addEventListener("click", () => {
    const cat = document.querySelector('#filterForm input[name="category"]:checked')?.value || 'all';
    const brd = document.querySelector('#filterForm input[name="brand"]:checked')?.value || 'all';
    const disc = parseInt(document.querySelector('#filterForm input[name="discount"]:checked')?.value || 0);

    filterState.category = cat;
    filterState.brand = brd;
    filterState.discount = disc;

    applyFilters();
  });

  // Initial render with loaded/saved filters
  applyFilters();
}




function viewProductDetails(id) {
  localStorage.setItem("selectedProductId", id);
  window.location.href = "mother-product-details.html";
}



// ==================== BANNER INTEGRATION (FROM REF CODE) ====================
async function loadDynamicBanners() {
  // Try multiple possible page names
  const possiblePageNames = ["mother", "Mother", "MOTHER", "mothercare", "mother-care", "home"];
  let bannerData = null;
  
  for (const pageName of possiblePageNames) {
    try {
      const API = `${BANNER_API_BASE}/get-by-page-name/${pageName}`;
      console.log(`Trying to fetch banners for page: ${pageName}`);
      
      const res = await fetch(API + "?t=" + Date.now(), { 
        cache: "no-store",
        timeout: 3000 // Add timeout to prevent hanging
      });
      
      if (res.ok) {
        bannerData = await res.json();
        console.log(`✅ Found banners for page: ${pageName}`);
        break;
      } else {
        console.log(`❌ No banners found for page: ${pageName} (Status: ${res.status})`);
      }
    } catch (err) {
      console.log(`⚠️ Error fetching banners for ${pageName}:`, err.message);
      // Continue to next page name
    }
  }
  
  // If no banner data found, use fallback immediately
  if (!bannerData || !bannerData.bannerFileSlides || bannerData.bannerFileSlides.length === 0) {
    console.log("No backend banners found, using static banners");
    initBanner();
    return;
  }
  
  // Process banner data if found
  const IMAGE_BASE = "http://localhost:8083";
  
  // Helper function to get image URL from backend path
  const getImageUrl = (path) => {
    if (!path) return null;
    // Check if path already contains the full URL
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
      // Clear existing content
      bannerWrapper.innerHTML = '';
      
      // Static fallback banners (corrected paths)
      const fallbackBanners = [
        "Images/IMG/banner1.png",
        "Images/IMG/banner2.png", 
        "Images/IMG/banner3.png"
      ];
      
      // Use backend images if available
      const slides = bannerData.bannerFileSlides.map((slide, index) => {
        const url = getImageUrl(slide);
        return url || fallbackBanners[index % fallbackBanners.length];
      });
      
      // Create slides
      slides.forEach((src, idx) => {
        const slideDiv = document.createElement('div');
        slideDiv.className = `banner-slide ${idx === 0 ? 'active' : ''}`;
        slideDiv.style.backgroundImage = `url('${src}')`;
        bannerWrapper.appendChild(slideDiv);
        
        // Create dot buttons if container exists
        if (dotsContainer && idx === 0) {
          dotsContainer.innerHTML = ''; // Clear existing dots
        }
        if (dotsContainer) {
          const dotBtn = document.createElement('button');
          dotBtn.className = `banner-dot w-3 h-3 rounded-full ${idx === 0 ? 'bg-white/70 active' : 'bg-white/50'}`;
          dotBtn.onclick = () => goToSlide(idx);
          dotsContainer.appendChild(dotBtn);
        }
      });
      
      // Initialize banner functionality
      const slidesElements = bannerWrapper.querySelectorAll('.banner-slide');
      const dots = dotsContainer ? dotsContainer.querySelectorAll('.banner-dot') : [];
      let currentIndex = 0;
      
      function goToSlide(index) {
        // Hide all slides
        slidesElements.forEach(slide => {
          slide.classList.remove('active');
        });
        // Update dots
        dots.forEach((dot, idx) => {
          if (idx === index) {
            dot.classList.add('active', 'bg-white/70');
            dot.classList.remove('bg-white/50');
          } else {
            dot.classList.remove('active', 'bg-white/70');
            dot.classList.add('bg-white/50');
          }
        });
        // Show selected slide
        currentIndex = index;
        slidesElements[currentIndex].classList.add('active');
      }
      
      // Auto play every 5 seconds
      setInterval(() => {
        const nextIndex = (currentIndex + 1) % slides.length;
        goToSlide(nextIndex);
      }, 5000);
      
      console.log('✅ Dynamic banners loaded from backend');
      
    } else {
      console.log("Banner wrapper not found, using static banners");
      initBanner();
    }
    
  } catch (err) {
    console.log("Error processing banners → Using static fallbacks", err);
    initBanner();
  }
}

// Your existing initBanner function (updated to work with dynamic loading)
function initBanner() {
  const bannerWrapper = document.getElementById('bannerWrapper');
  if (!bannerWrapper) return;
  
  // Clear existing content
  bannerWrapper.innerHTML = '';
  
  // Create static slides with correct paths
  const staticBanners = [
    "Images/IMG/banner1.png",
    "Images/IMG/banner2.png",
    "Images/IMG/banner3.png"
  ];
  
  staticBanners.forEach((src, idx) => {
    const slideDiv = document.createElement('div');
    slideDiv.className = `banner-slide ${idx === 0 ? 'active' : ''}`;
    slideDiv.style.backgroundImage = `url('${src}')`;
    bannerWrapper.appendChild(slideDiv);
  });
  
  // Get dots container
  const dotsContainer = document.querySelector('.absolute.bottom-5 .flex.gap-3');
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    staticBanners.forEach((_, idx) => {
      const dotBtn = document.createElement('button');
      dotBtn.className = `banner-dot w-3 h-3 rounded-full ${idx === 0 ? 'bg-white/70 active' : 'bg-white/50'}`;
      dotBtn.onclick = () => goToSlide(idx);
      dotsContainer.appendChild(dotBtn);
    });
  }
  
  // Initialize auto-scroll
  const slides = bannerWrapper.querySelectorAll('.banner-slide');
  const dots = dotsContainer ? dotsContainer.querySelectorAll('.banner-dot') : [];
  let currentIndex = 0;
  
  function goToSlide(index) {
    // Hide all slides
    slides.forEach(slide => slide.classList.remove('active'));
    // Update dots
    dots.forEach((dot, idx) => {
      if (idx === index) {
        dot.classList.add('active', 'bg-white/70');
        dot.classList.remove('bg-white/50');
      } else {
        dot.classList.remove('active', 'bg-white/70');
        dot.classList.add('bg-white/50');
      }
    });
    // Show selected slide
    currentIndex = index;
    slides[currentIndex].classList.add('active');
  }
  
  // Setup click handlers for dots
  if (dotsContainer) {
    dots.forEach((dot, idx) => {
      dot.onclick = () => goToSlide(idx);
    });
  }
  
  // Auto play every 5 seconds
  setInterval(() => {
    const nextIndex = (currentIndex + 1) % staticBanners.length;
    goToSlide(nextIndex);
  }, 5000);
}


function initMobileSheets() {
  const backdrop = document.getElementById("mobileSheetBackdrop");
  document.getElementById("openFilterSheet")?.addEventListener("click", () => {
    document.getElementById("filterSheet").classList.remove("translate-y-full");
    backdrop.classList.remove("hidden");
  });
  document.getElementById("openSortSheet")?.addEventListener("click", () => {
    document.getElementById("sortSheet").classList.remove("translate-y-full");
    backdrop.classList.remove("hidden");
  });
  document.querySelectorAll("#closeFilterSheet, #closeSortSheet, #mobileSheetBackdrop").forEach(el => {
    el?.addEventListener("click", () => {
      document.getElementById("filterSheet").classList.add("translate-y-full");
      document.getElementById("sortSheet").classList.add("translate-y-full");
      backdrop.classList.add("hidden");
    });
  });
}

// ==================== DOM CONTENT LOADED ====================
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded!");
  loadDynamicBanners();
  initBanner();
  initMobileSheets();
  initPriceSliders();
  initFiltersAndUI();
  updateHeaderCounts();
//   loadProductsBySubcategories();
  loadProductsByCategory();
  
});