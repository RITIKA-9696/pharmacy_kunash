// baby.js - PRODUCTION READY VERSION WITH MOBILE FIXES + SUBCATEGORY FROM BACKEND + DYNAMIC BRANDS
(function() {
  'use strict';
 
  if (window.babyFinal) return;
  window.babyFinal = true;

  let products = [];
  let filteredProducts = [];

 let latestCategory = 'all';
 let latestBrand = 'all';
 let latestDiscount = null;

  let currentPage = 1;
  const itemsPerPage = 12;
  const API_BASE_URL = 'http://localhost:8083/api/mb/products';
  const WISHLIST_API_BASE = "http://localhost:8083/api/wishlist";
  const IMAGE_BASE = "http://localhost:8083";
  const BANNER_API_BASE = "http://localhost:8083/api/banners";

  let currentUserId = null;

  const $ = id => document.getElementById(id);
  
  // ==================== RESET FILTERS FUNCTION ====================
  const resetAllFilters = () => {
    console.log("Resetting all filters...");
    
    const resetRadioGroups = () => {
      const desktopCategoryAll = document.querySelector('input[name="category"][value="all"]');
      if (desktopCategoryAll) desktopCategoryAll.checked = true;
      
      const desktopBrandAll = document.querySelector('input[name="brand"][value="all"]');
      if (desktopBrandAll) desktopBrandAll.checked = true;
      
      const desktopDiscountAll = document.querySelector('input[name="discount"][value="all"]');
      if (desktopDiscountAll) desktopDiscountAll.checked = true;
      
      const mobileCategoryAll = document.querySelector('input[name="mobileCategory"][value="all"]');
      if (mobileCategoryAll) mobileCategoryAll.checked = true;
      
      const mobileBrandAll = document.querySelector('input[name="mobileBrand"][value="all"]');
      if (mobileBrandAll) mobileBrandAll.checked = true;
      
      const mobileDiscountAll = document.querySelector('input[name="mobileDiscount"][value="all"]');
      if (mobileDiscountAll) mobileDiscountAll.checked = true;
      
      const mobileSortDefault = document.querySelector('input[name="mobileSort"][value="default"]');
      if (mobileSortDefault) mobileSortDefault.checked = true;
    };

    const resetPriceSliders = () => {
      const minThumb = $("minThumb");
      const maxThumb = $("maxThumb");
      const mobileMinThumb = $("mobileMinThumb");
      const mobileMaxThumb = $("mobileMaxThumb");
      
      if (minThumb) minThumb.value = 0;
      if (maxThumb) maxThumb.value = 10000;
      if (mobileMinThumb) mobileMinThumb.value = 0;
      if (mobileMaxThumb) mobileMaxThumb.value = 10000;
    };

    const resetSortDropdown = () => {
      const sortSelect = $("sortSelect");
      if (sortSelect) sortSelect.value = 'default';
    };

    resetRadioGroups();
    resetPriceSliders();
    resetSortDropdown();
    
    syncAndUpdateSliders();
    applyFilters();
    showToast("All filters have been reset to default");
    
    console.log("All filters have been reset");
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

  async function getValidUserId() {
    try {
      let userData = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
      if (!userData) return null;
      const user = JSON.parse(userData);
      const userId = user.userId || user.id || user.userID;
      if (!userId || isNaN(userId)) return null;
      return Number(userId);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      return null;
    }
  }

  const getDisplayPrice = (priceArray) => {
    if (!priceArray || priceArray.length === 0) return 0;
    return priceArray[0];
  };

  const calculateDiscount = (priceArray, originalPriceArray) => {
    if (!priceArray || !originalPriceArray || priceArray.length === 0 || originalPriceArray.length === 0) return 0;
    const price = priceArray[0];
    const originalPrice = originalPriceArray[0];
    if (originalPrice > price) {
      return Math.round(((originalPrice - price) / originalPrice) * 100);
    }
    return 0;
  };

  async function addToWishlistBackend(productId) {
    if (!currentUserId) return false;
    try {
      const response = await fetch(`${WISHLIST_API_BASE}/add-wishlist-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          productId: productId,
          productType: "BABY"
        })
      });
      return response.ok;
    } catch (err) {
      console.error("Error adding to wishlist backend:", err);
      return false;
    }
  }

  async function removeFromWishlistBackend(productId) {
    if (!currentUserId) return false;
    try {
      const response = await fetch(`${WISHLIST_API_BASE}/remove-wishlist-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          productId: productId,
          productType: "BABY"
        })
      });
      return response.ok;
    } catch (err) {
      console.error("Error removing from wishlist backend:", err);
      return false;
    }
  }

  async function loadWishlistFromBackend() {
    if (!currentUserId) {
      localStorage.setItem('wishlist', '[]');
      updateHeaderCounts();
      render();
      return;
    }

    try {
      const response = await fetch(`${WISHLIST_API_BASE}/get-wishlist-items?userId=${currentUserId}`);
      if (response.ok) {
        const backendItems = await response.json();
        const wishlist = backendItems.map(item => ({
          id: item.productId,
          name: item.title || "Product",
          price: getDisplayPrice(item.price),
          originalPrice: getDisplayPrice(item.originalPrice),
          image: item.mainImageUrl ? `${IMAGE_BASE}${item.mainImageUrl}` : '',
          productType: item.productType || "BABY"
        }));
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
      } else {
        localStorage.setItem('wishlist', '[]');
      }
    } catch (err) {
      console.error("Failed to load wishlist:", err);
      localStorage.setItem('wishlist', '[]');
    }

    updateHeaderCounts();
    render();
  }

  function updateHeaderCounts() {
    if (!currentUserId) {
      document.querySelectorAll('#wishlistCount, .wishlist-count').forEach(el => {
        if (el) {
          el.textContent = '0';
          el.classList.add("hidden");
        }
      });
      document.querySelectorAll('#cartCount, .cart-count').forEach(el => {
        if (el) {
          el.textContent = '0';
          el.classList.add("hidden");
        }
      });
      return;
    }

    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartTotal = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    document.querySelectorAll('#wishlistCount, .wishlist-count').forEach(el => {
      if (el) {
        el.textContent = wishlist.length;
        el.classList.toggle("hidden", wishlist.length === 0);
      }
    });

    document.querySelectorAll('#cartCount, .cart-count').forEach(el => {
      if (el) {
        el.textContent = cartTotal;
        el.classList.toggle("hidden", cartTotal === 0);
      }
    });
  }

  window.addToWishlist = async (id) => {
    if (!currentUserId) {
      showToast("Please login to add to wishlist");
      return;
    }

    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const exists = wishlist.some(item => item.id === id);

    if (exists) {
      const success = await removeFromWishlistBackend(id);
      if (success) {
        wishlist = wishlist.filter(item => item.id !== id);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        showToast("Removed from wishlist");
      } else {
        showToast("Failed to remove from wishlist");
      }
    } else {
      const success = await addToWishlistBackend(id);
      if (success) {
        const product = products.find(p => p.id === id);
        if (product) {
          wishlist.push({
            id: product.id,
            name: product.title,
            price: product.price,
            originalPrice: product.originalPrice,
            image: product.mainImageUrl,
            productType: "BABY"
          });
          localStorage.setItem('wishlist', JSON.stringify(wishlist));
          showToast("Added to wishlist");
        }
      } else {
        showToast("Failed to add to wishlist");
      }
    }

    updateHeaderCounts();
    render();
  };

  window.openProductDetails = (id) => {
    window.location.href = `baby-product-details.html?id=${id}`;
  };

  const createSkeletonCards = (count) => {
    let skeletonHTML = '';
    for (let i = 0; i < count; i++) {
      skeletonHTML += `
        <div class="skeleton-card bg-white rounded-lg shadow-lg overflow-hidden">
          <div class="skeleton skeleton-img"></div>
          <div class="p-4">
            <div class="skeleton skeleton-title mb-2"></div>
            <div class="skeleton skeleton-text mb-1"></div>
            <div class="skeleton skeleton-text w-3/4 mb-3"></div>
            <div class="skeleton skeleton-price mt-2"></div>
            <div class="skeleton skeleton-text mt-4 w-full h-10 rounded-xl"></div>
          </div>
        </div>
      `;
    }
    return skeletonHTML;
  };

  const loadProducts = async () => {
    try {
      $("productsGrid").innerHTML = createSkeletonCards(12);
      $("resultsCount").textContent = 'Loading products...';

      const response = await fetch(`${API_BASE_URL}/category/BabyCare`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const apiProducts = await response.json();

      products = apiProducts.map(p => {
        const displayPrice = getDisplayPrice(p.price);
        const displayOriginalPrice = getDisplayPrice(p.originalPrice);
        const discount = calculateDiscount(p.price, p.originalPrice) || p.discount || 0;

        // Use subCategory directly from backend (exact match to HTML radio values)
        let filterCategory = 'all';
        if (p.subCategory && p.subCategory.trim() !== '') {
          filterCategory = p.subCategory.trim();  // "Bath & Body", "Diapers & Hygiene", etc.
        }

        return {
          id: p.id,
          title: p.title || 'No Title',
          price: displayPrice,
          originalPrice: displayOriginalPrice || displayPrice * 1.2,
          discount: discount,
          brand: p.brand || 'Unknown Brand',
          category: p.category,
          subCategory: p.subCategory || '',  // Keep original for reference
          filterCategory,
          mainImageUrl: p.mainImageUrl ? `${IMAGE_BASE}${p.mainImageUrl}` : 'http://localhost:8083/Images/product_details_fallback_img.jpg',
          description: Array.isArray(p.description) ? p.description : (p.description ? [p.description] : []),
          inStock: p.inStock !== undefined ? p.inStock : true,
          stockQuantity: p.stockQuantity || 10,
          rating: p.rating || 4.0,
          reviewCount: p.reviewCount || Math.floor(Math.random() * 100),
          sku: p.sku || `SKU-${p.id}`,
          sizes: Array.isArray(p.productSizes) ? p.productSizes : (p.productSizes ? [p.productSizes] : []),
          features: Array.isArray(p.features) ? p.features : (p.features ? [p.features] : []),
          specifications: p.specifications || {}
        };
      });

      // Dynamic brands from backend
      const uniqueBrands = [...new Set(products.map(p => p.brand).filter(b => b && b !== 'Unknown Brand'))];
      populateDynamicBrands(uniqueBrands);

      filteredProducts = [...products];
      render();

      currentUserId = await getValidUserId();
      await loadWishlistFromBackend();

    } catch (error) {
      console.error('Error loading products:', error);
      $("productsGrid").innerHTML = `
        <div class="col-span-full text-center py-12">
          <div class="text-red-600 text-6xl mb-4"><i class="fas fa-exclamation-triangle"></i></div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Failed to load products</h3>
          <p class="text-gray-600">${error.message}</p>
          <p class="text-sm text-gray-500 mt-2">Ensure backend is running at server</p>
          <button onclick="location.reload()" class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
        </div>
      `;
    }
  };

  // ==================== DYNAMIC BRAND POPULATION ====================
  function populateDynamicBrands(brands) {
  console.log('Populating brands:', brands); // Debug: see brands list

  // Desktop: target the container (remove .hidden from selector)
  const desktopContainer = document.querySelector('#filterSidebar .border-b.pb-4 .mt-4.space-y-3');
  // Mobile: target the container
  const mobileContainer = document.querySelector('#filterSheet .space-y-6 .space-y-3');

  // Desktop brands
  if (desktopContainer) {
    let html = `
      <label class="flex items-center">
        <input type="radio" name="brand" value="all" checked class="w-5 h-5 text-pink-600">
        <span class="ml-3">All Brands</span>
      </label>
    `;
    brands.forEach(brand => {
      html += `
        <label class="flex items-center">
          <input type="radio" name="brand" value="${brand}" class="w-5 h-5 text-pink-600">
          <span class="ml-3">${brand}</span>
        </label>
      `;
    });
    desktopContainer.innerHTML = html;

    // Make sure desktop brands section is visible (remove hidden if present)
    const desktopSection = desktopContainer.closest('.border-b.pb-4');
    if (desktopSection) {
      const hiddenDiv = desktopSection.querySelector('.mt-4.space-y-3.hidden');
      if (hiddenDiv) hiddenDiv.classList.remove('hidden');
    }
  }

  // Mobile brands
  if (mobileContainer) {
    let html = `
      <label class="flex items-center">
        <input type="radio" name="mobileBrand" value="all" checked class="w-5 h-5 text-pink-600">
        <span class="ml-3">All Brands</span>
      </label>
    `;
    brands.forEach(brand => {
      html += `
        <label class="flex items-center">
          <input type="radio" name="mobileBrand" value="${brand}" class="w-5 h-5 text-pink-600">
          <span class="ml-3">${brand}</span>
        </label>
      `;
    });
    mobileContainer.innerHTML = html;
  }

  // Attach listeners to ALL brand radios (desktop + mobile) AFTER creation
  document.querySelectorAll('input[name="brand"], input[name="mobileBrand"]').forEach(radio => {
    // Remove old listeners first (prevent duplicates)
    radio.removeEventListener('change', handleBrandChange);
    radio.addEventListener('change', handleBrandChange);
  });

  // Separate handler function for clarity + debugging
  function handleBrandChange(e) {
    console.log('Brand radio clicked:', e.target.value); // ← You will see this in console when clicked
    syncMobileFiltersToDesktop();
    applyFilters();
  }
}
  // ==================== BANNER SECTION ====================
  async function loadDynamicBanners() {
    const possiblePageNames = ["baby", "Baby", "BABY", "babycare", "baby-care"];
    let bannerData = null;
  
    for (const pageName of possiblePageNames) {
      try {
        const API = `${BANNER_API_BASE}/get-by-page-name/${pageName}`;
        const res = await fetch(API + "?t=" + Date.now(), {
          cache: "no-store",
          timeout: 3000
        });
      
        if (res.ok) {
          bannerData = await res.json();
          console.log(`✅ Found banners for page: ${pageName}`);
          break;
        }
      } catch (err) {
        console.log(`⚠️ Error fetching banners for ${pageName}:`, err.message);
      }
    }
  
    if (!bannerData || !bannerData.bannerFileSlides || bannerData.bannerFileSlides.length === 0) {
      console.log("No backend banners found, using static banners");
      initBanner();
      return;
    }
  
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
          "Images/BabyCare/banner1.png",
          "Images/BabyCare/banner2.png",
          "Images/BabyCare/banner3.png"
        ];
      
        const slides = bannerData.bannerFileSlides.map((slide, index) => {
          const url = getImageUrl(slide);
          return url || fallbackBanners[index % fallbackBanners.length];
        });
      
        slides.forEach((src, idx) => {
          const slideDiv = document.createElement('div');
          slideDiv.className = `banner-slide ${idx === 0 ? 'active' : ''}`;
          slideDiv.style.backgroundImage = `url('${src}')`;
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
          dots.forEach((dot, idx) => {
            if (idx === index) {
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
      
      } else {
        initBanner();
      }
    
    } catch (err) {
      console.log("Error processing banners → Using static fallbacks", err);
      initBanner();
    }
  }

  function initBanner() {
    const bannerWrapper = document.getElementById('bannerWrapper');
    if (!bannerWrapper) return;
  
    bannerWrapper.innerHTML = '';
  
    const staticBanners = [
      "Images/BabyCare/banner1.png",
      "Images/BabyCare/banner2.png",
      "Images/BabyCare/banner3.png"
    ];
  
    staticBanners.forEach((src, idx) => {
      const slideDiv = document.createElement('div');
      slideDiv.className = `banner-slide ${idx === 0 ? 'active' : ''}`;
      slideDiv.style.backgroundImage = `url('${src}')`;
      bannerWrapper.appendChild(slideDiv);
    });
  
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
  
    const slides = bannerWrapper.querySelectorAll('.banner-slide');
    const dots = dotsContainer ? dotsContainer.querySelectorAll('.banner-dot') : [];
    let currentIndex = 0;
  
    function goToSlide(index) {
      slides.forEach(slide => slide.classList.remove('active'));
      dots.forEach((dot, idx) => {
        if (idx === index) {
          dot.classList.add('active', 'bg-white/70');
          dot.classList.remove('bg-white/50');
        } else {
          dot.classList.remove('active', 'bg-white/70');
          dot.classList.add('bg-white/50');
        }
      });
      currentIndex = index;
      slides[currentIndex].classList.add('active');
    }
  
    if (dotsContainer) {
      dots.forEach((dot, idx) => {
        dot.onclick = () => goToSlide(idx);
      });
    }
  
    setInterval(() => {
      const nextIndex = (currentIndex + 1) % staticBanners.length;
      goToSlide(nextIndex);
    }, 5000);
  }

  const render = () => {
    const start = (currentPage - 1) * itemsPerPage;
    const items = filteredProducts.slice(start, start + itemsPerPage);
    const grid = $("productsGrid");

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-12">
          <div class="text-gray-400 text-6xl mb-4"><i class="fas fa-box-open"></i></div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">No products found</h3>
          <p class="text-gray-600">Try adjusting your filters</p>
        </div>
      `;
      $("resultsCount").textContent = `Showing 0 products`;
      $("pagination").innerHTML = '';
      return;
    }

    const wishlistIds = new Set();
    if (currentUserId) {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      wishlist.forEach(item => wishlistIds.add(item.id));
    }

    grid.innerHTML = items.map(p => {
      const rating = p.rating || 0;
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;
      let starsHTML = '';
      for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fas fa-star text-yellow-400"></i>';
      if (hasHalfStar) starsHTML += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
      for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) starsHTML += '<i class="far fa-star text-yellow-400"></i>';

      const isWishlisted = currentUserId && wishlistIds.has(p.id);

      return `
        <div class="product-card bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 cursor-pointer ${!p.inStock ? 'opacity-60 grayscale' : ''}"
             onclick="window.openProductDetails(${p.id})">
          <div class="relative bg-gray-50 aspect-[9/6] overflow-hidden">
            <img src="${p.mainImageUrl}" alt="${p.title}"
                 class="w-full h-full object-contain p-5 transition-transform duration-500 hover:scale-110"
                 onerror="this.src='http://localhost:8083/Images/product_details_fallback_img.jpg'">
            ${p.inStock
              ? `<div class="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">In Stock</div>`
              : `<div class="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">Out of Stock</div>`
            }
            ${p.discount > 0
              ? `<div class="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">${p.discount}% OFF</div>`
              : ''
            }
          </div>

          <button class="absolute top-3 right-3 bg-white/90 backdrop-blur hover:bg-white p-3 rounded-full shadow-lg transition-all duration-300 z-10"
                  onclick="event.stopPropagation(); window.addToWishlist(${p.id});">
            <i class="${isWishlisted ? 'fas text-red-600' : 'far text-gray-600'} fa-heart text-xl"></i>
          </button>

          <div class="p-4">
            <p class="text-xs text-gray-500 uppercase font-medium truncate">${p.brand || 'Brand'}</p>
            <h3 class="text-base font-medium text-gray-800 line-clamp-2 mt-1">${p.title}</h3>
            
            <div class="mt-3 flex items-center gap-2">
              <span class="text-xl font-bold text-green-600">₹${p.price.toLocaleString()}</span>
              ${p.originalPrice > p.price
                ? `<span class="text-sm text-gray-500 line-through">₹${p.originalPrice.toLocaleString()}</span>`
                : ''
              }
            </div>

            <div class="mt-2 flex items-center">
              <div class="text-yellow-400 text-base">${starsHTML}</div>
              <span class="text-xs text-gray-500 ml-2">(${p.reviewCount || 0})</span>
            </div>

            <button class="mt-5 w-full bg-[#239BA7] hover:bg-[#00809D] text-white font-bold py-3 rounded-xl transition"
                    onclick="event.stopPropagation(); window.openProductDetails(${p.id})">
              View Details
            </button>
          </div>
        </div>
      `;
    }).join('');

    $("resultsCount").textContent = `Showing ${start + 1}–${Math.min(start + itemsPerPage, filteredProducts.length)} of ${filteredProducts.length} products`;
    renderPagination();
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const pag = $("pagination");
    if (totalPages <= 1) { pag.innerHTML = ''; return; }
    let html = '';
    if (currentPage > 1) html += `<button class="px-4 py-2 bg-white rounded-lg font-bold text-pink-600" onclick="window.changePage(${currentPage-1})">← Prev</button>`;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        html += `<button class="px-4 py-2 ${i === currentPage ? 'bg-pink-600 text-white' : 'bg-white text-pink-600'} rounded-lg font-bold" onclick="window.changePage(${i})">${i}</button>`;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        html += `<span class="px-2">...</span>`;
      }
    }
    if (currentPage < totalPages) html += `<button class="px-4 py-2 bg-white rounded-lg font-bold text-pink-600" onclick="window.changePage(${currentPage+1})">Next →</button>`;
    pag.innerHTML = html;
  };

  window.changePage = (page) => {
    currentPage = page;
    render();
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

//   const getActiveFilters = () => {
//   // Prefer desktop if visible, else mobile (but read whichever is checked)
//   let categoryEl = document.querySelector('input[name="category"]:checked');
//   if (!categoryEl) categoryEl = document.querySelector('input[name="mobileCategory"]:checked');
  
//   let brandEl = document.querySelector('input[name="brand"]:checked');
//   if (!brandEl) brandEl = document.querySelector('input[name="mobileBrand"]:checked');
  
//   let discountEl = document.querySelector('input[name="discount"]:checked');
//   if (!discountEl) discountEl = document.querySelector('input[name="mobileDiscount"]:checked');

//   const category = categoryEl?.value || 'all';
//   const brand = brandEl?.value || 'all';
//   const discount = discountEl?.value === 'all' ? null : parseInt(discountEl?.value || '0');

//   let minPrice = 0;
//   let maxPrice = 10000;

//   const desktopMin = $("minThumb");
//   const desktopMax = $("maxThumb");
//   const mobileMin = $("mobileMinThumb");
//   const mobileMax = $("mobileMaxThumb");

//   if (desktopMin && desktopMax && !isNaN(desktopMin.value)) {
//     minPrice = Number(desktopMin.value);
//     maxPrice = Number(desktopMax.value);
//   } else if (mobileMin && mobileMax && !isNaN(mobileMin.value)) {
//     minPrice = Number(mobileMin.value);
//     maxPrice = Number(mobileMax.value);
//   }

//   return { category, brand, discount, minPrice, maxPrice };
// };



const getActiveFilters = () => {
  // Check if mobile filter sheet is visible (open)
  const isMobileSheetOpen = filterSheet && !filterSheet.classList.contains('translate-y-full');

  let categoryEl, brandEl, discountEl;

  if (isMobileSheetOpen) {
    // Mobile sheet open → prioritize mobile radios
    categoryEl = document.querySelector('input[name="mobileCategory"]:checked');
    brandEl    = document.querySelector('input[name="mobileBrand"]:checked');
    discountEl = document.querySelector('input[name="mobileDiscount"]:checked');
  } else {
    // Desktop or sheet closed → use desktop radios
    categoryEl = document.querySelector('input[name="category"]:checked');
    brandEl    = document.querySelector('input[name="brand"]:checked');
    discountEl = document.querySelector('input[name="discount"]:checked');
  }

  // Fallback to the other group if nothing found in primary
  if (!categoryEl) categoryEl = document.querySelector('input[name="category"]:checked, input[name="mobileCategory"]:checked');
  if (!brandEl)    brandEl    = document.querySelector('input[name="brand"]:checked, input[name="mobileBrand"]:checked');
  if (!discountEl) discountEl = document.querySelector('input[name="discount"]:checked, input[name="mobileDiscount"]:checked');

  const category = categoryEl?.value || 'all';
  const brand    = brandEl?.value    || 'all';
  const discount = discountEl?.value === 'all' ? null : parseInt(discountEl?.value || '0');

  let minPrice = 0;
  let maxPrice = 10000;

  // Prefer mobile sliders if sheet open
  let minThumb = isMobileSheetOpen ? $("mobileMinThumb") : $("minThumb");
  let maxThumb = isMobileSheetOpen ? $("mobileMaxThumb") : $("maxThumb");

  if (!minThumb || isNaN(minThumb.value)) minThumb = $("minThumb") || $("mobileMinThumb");
  if (!maxThumb || isNaN(maxThumb.value)) maxThumb = $("maxThumb") || $("mobileMaxThumb");

  if (minThumb && maxThumb) {
    minPrice = Number(minThumb.value);
    maxPrice = Number(maxThumb.value);
  }

  console.log('getActiveFilters result:', { category, brand, discount, minPrice, maxPrice }); // Debug

  return { category, brand, discount, minPrice, maxPrice };
};



 const applyFilters = () => {
  const filters = getActiveFilters();

  console.log("FILTER DEBUG:", {
    selectedBrand: filters.brand,
    expectedFilter: filters.brand !== 'all' ? `Filtering to ${filters.brand}` : 'No brand filter'
  });
  console.log("Active filters right now:", filters); // ← Add this

  let list = [...products];
  
  if (filters.category !== 'all') {
    list = list.filter(p => p.filterCategory === filters.category);
  }
  
  if (filters.brand !== 'all') {
    console.log("Filtering by brand:", filters.brand); // ← Debug brand filter
    list = list.filter(p => p.brand === filters.brand);
  }
  
  if (filters.discount !== null) {
    list = list.filter(p => (p.discount || 0) >= filters.discount);
  }
  
  list = list.filter(p => p.price >= filters.minPrice && p.price <= filters.maxPrice);
  
  filteredProducts = list;
  currentPage = 1;
  applySorting();
};
  const applySorting = () => {
    const sortSelect = $("sortSelect");
    const mobileSort = document.querySelector('input[name="mobileSort"]:checked');
    
    let sortValue = 'default';
    if (sortSelect && sortSelect.value) sortValue = sortSelect.value;
    else if (mobileSort && mobileSort.value) sortValue = mobileSort.value;
    
    console.log("Applying sort:", sortValue);
    
    if (sortValue === 'price-low') {
      filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortValue === 'price-high') {
      filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortValue === 'rating') {
      filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortValue === 'newest') {
      filteredProducts.sort((a, b) => b.id - a.id);
    }
    
    render();
  };

  const syncAndUpdateSliders = () => {
    let min = 0;
    let max = 10000;
    
    if ($("minThumb")) min = Number($("minThumb").value);
    else if ($("mobileMinThumb")) min = Number($("mobileMinThumb").value);
    
    if ($("maxThumb")) max = Number($("maxThumb").value);
    else if ($("mobileMaxThumb")) max = Number($("mobileMaxThumb").value);
    
    if (min > max) [min, max] = [max, min];
    
    const thumbs = ["minThumb", "mobileMinThumb", "maxThumb", "mobileMaxThumb"];
    thumbs.forEach(id => {
      const el = $(id);
      if (el) el.value = (id.includes("min")) ? min : max;
    });
    
    document.querySelectorAll('.slider-fill').forEach(fill => {
      fill.style.left = (min / 10000 * 100) + '%';
      fill.style.width = ((max - min) / 10000 * 100) + '%';
    });
    
    document.querySelectorAll('#minValue, #mobileMinValue').forEach(el => {
      if (el) el.textContent = '₹' + min;
    });
    
    document.querySelectorAll('#maxValue, #mobileMaxValue').forEach(el => {
      if (el) el.textContent = '₹' + max;
    });
  };

  const syncMobileFiltersToDesktop = () => {
  // Sync category (desktop ← mobile or mobile ← desktop)
  const activeCat = document.querySelector('input[name="category"]:checked') || 
                    document.querySelector('input[name="mobileCategory"]:checked');
  if (activeCat) {
    const desktopCat = document.querySelector(`input[name="category"][value="${activeCat.value}"]`);
    const mobileCat = document.querySelector(`input[name="mobileCategory"][value="${activeCat.value}"]`);
    if (desktopCat) desktopCat.checked = true;
    if (mobileCat) mobileCat.checked = true;
  }

  // Sync brand (bidirectional)
  const activeBrand = document.querySelector('input[name="brand"]:checked') || 
                      document.querySelector('input[name="mobileBrand"]:checked');
  if (activeBrand) {
    const desktopBrand = document.querySelector(`input[name="brand"][value="${activeBrand.value}"]`);
    const mobileBrand = document.querySelector(`input[name="mobileBrand"][value="${activeBrand.value}"]`);
    if (desktopBrand) desktopBrand.checked = true;
    if (mobileBrand) mobileBrand.checked = true;
  }

  // Sync discount (bidirectional)
  const activeDisc = document.querySelector('input[name="discount"]:checked') || 
                     document.querySelector('input[name="mobileDiscount"]:checked');
  if (activeDisc) {
    const desktopDisc = document.querySelector(`input[name="discount"][value="${activeDisc.value}"]`);
    const mobileDisc = document.querySelector(`input[name="mobileDiscount"][value="${activeDisc.value}"]`);
    if (desktopDisc) desktopDisc.checked = true;
    if (mobileDisc) mobileDisc.checked = true;
  }

  // Sync sort
  const activeSort = document.querySelector('input[name="mobileSort"]:checked');
  if (activeSort && $("sortSelect")) {
    $("sortSelect").value = activeSort.value;
  }
};
  const clearAllFilters = () => {
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
      if (radio.value === 'all') radio.checked = true;
    });
    
    [$("minThumb"), $("mobileMinThumb")].forEach(el => {
      if (el) el.value = 0;
    });
    
    [$("maxThumb"), $("mobileMaxThumb")].forEach(el => {
      if (el) el.value = 10000;
    });
    
    if ($("sortSelect")) $("sortSelect").value = 'default';
    
    syncAndUpdateSliders();
    applyFilters();
    showToast("All filters cleared");
  };

  // const initMobileSheets = () => {
  //   const filterSheet = $("filterSheet");
  //   const sortSheet = $("sortSheet");
  //   const backdrop = $("mobileSheetBackdrop");
    
  //   const closeSheets = () => {
  //     filterSheet?.classList.add('translate-y-full');
  //     sortSheet?.classList.add('translate-y-full');
  //     backdrop?.classList.add('hidden');
  //   };
    
  //   $("openFilterSheet")?.addEventListener('click', () => {
  //     filterSheet?.classList.remove('translate-y-full');
  //     backdrop?.classList.remove('hidden');
  //   });
    
  //   $("openSortSheet")?.addEventListener('click', () => {
  //     sortSheet?.classList.remove('translate-y-full');
  //     backdrop?.classList.remove('hidden');
  //   });
    
  //   $("closeFilterSheet")?.addEventListener('click', closeSheets);
  //   $("closeSortSheet")?.addEventListener('click', closeSheets);
  //   backdrop?.addEventListener('click', closeSheets);
    
  //   $("applyMobileFilters")?.addEventListener('click', () => {
  //     syncMobileFiltersToDesktop();
  //     applyFilters();
  //     closeSheets();
  //   });
    
  //   $("applySortBtn")?.addEventListener('click', () => {
  //     const mobileSort = document.querySelector('input[name="mobileSort"]:checked');
  //     if (mobileSort && $("sortSelect")) $("sortSelect").value = mobileSort.value;
  //     applySorting();
  //     closeSheets();
  //   });
    
  //   $("clearMobileFilters")?.addEventListener('click', () => {
  //     clearAllFilters();
  //     closeSheets();
  //   });
    
  //   document.querySelectorAll('#filterSheet input[type="radio"]').forEach(radio => {
  //     radio.addEventListener('change', () => {
  //       syncAndUpdateSliders();
  //     });
  //   });
  // };



  const initMobileSheets = () => {
  const filterSheet = $("filterSheet");
  const sortSheet = $("sortSheet");
  const backdrop = $("mobileSheetBackdrop");

  const closeSheets = () => {
    filterSheet?.classList.add('translate-y-full');
    sortSheet?.classList.add('translate-y-full');
    backdrop?.classList.add('hidden');
  };

  // Open filter sheet
  $("openFilterSheet")?.addEventListener('click', () => {
    filterSheet?.classList.remove('translate-y-full');
    backdrop?.classList.remove('hidden');
    // Re-attach listeners when sheet opens (fixes mobile click issues)
    attachFilterListeners();
  });

  // Open sort sheet
  $("openSortSheet")?.addEventListener('click', () => {
    sortSheet?.classList.remove('translate-y-full');
    backdrop?.classList.remove('hidden');
  });

  // Close buttons + backdrop
  $("closeFilterSheet")?.addEventListener('click', closeSheets);
  $("closeSortSheet")?.addEventListener('click', closeSheets);
  backdrop?.addEventListener('click', closeSheets);

  // Apply mobile filters button
  $("applyMobileFilters")?.addEventListener('click', () => {
    syncMobileFiltersToDesktop();
    applyFilters();
    closeSheets();
  });

  // Apply sort button
  $("applySortBtn")?.addEventListener('click', () => {
    const mobileSort = document.querySelector('input[name="mobileSort"]:checked');
    if (mobileSort && $("sortSelect")) {
      $("sortSelect").value = mobileSort.value;
    }
    applySorting();
    closeSheets();
  });

  // Clear filters button
  $("clearMobileFilters")?.addEventListener('click', () => {
    clearAllFilters();
    closeSheets();
  });

  // NEW: Event delegation for all filter radios (works for dynamic content + mobile)
  function attachFilterListeners() {
    // Category, brand, discount radios (desktop + mobile)
    const filterContainer = filterSheet || document.body; // fallback to body if sheet not found
    filterContainer.addEventListener('change', (e) => {
      const target = e.target;
      if (target.matches('input[type="radio"][name="mobileCategory"], input[type="radio"][name="category"], ' +
                         'input[type="radio"][name="mobileBrand"], input[type="radio"][name="brand"], ' +
                         'input[type="radio"][name="mobileDiscount"], input[type="radio"][name="discount"]')) {
        console.log('Mobile/Desktop filter radio changed:', target.name, target.value); // Debug
        syncMobileFiltersToDesktop();
        applyFilters(); // Apply immediately on change (better UX)
      }
    });

    // Optional: price sliders in mobile (if you want live update)
    filterContainer.addEventListener('input', (e) => {
      if (e.target.matches('#mobileMinThumb, #mobileMaxThumb')) {
        syncAndUpdateSliders();
        clearTimeout(window._mobileSliderTO);
        window._mobileSliderTO = setTimeout(applyFilters, 300); // debounce
      }
    });
  }

  // Attach listeners once on init (for desktop + initial state)
  attachFilterListeners();

  // For sort radios (no dynamic, so once is fine)
  document.querySelectorAll('#sortSheet input[name="mobileSort"]').forEach(radio => {
    radio.addEventListener('change', () => {
      console.log('Sort changed in mobile:', radio.value);
    });
  });
};



  function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
      background: #10b981; color: white; padding: 1rem 2rem; border-radius: 50px;
      font-weight: bold; z-index: 10000; animation: toast 3s ease forwards;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  if (!document.querySelector('#toastStyle')) {
    const style = document.createElement('style');
    style.id = 'toastStyle';
    style.textContent = `
      @keyframes toast {
        0%, 100% { opacity: 0; transform: translateX(-50%) translateY(20px); }
        10%, 90% { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  const init = () => {
    console.log("Initializing Baby Products page...");
    
    loadProducts();
    syncAndUpdateSliders();
    initMobileSheets();
    updateHeaderCounts();
    loadDynamicBanners();
    
    const resetBtn = $("resetFiltersBtn");
    if (resetBtn) {
      resetBtn.addEventListener('click', resetAllFilters);
      console.log("Reset button event listener added");
    }
    
    document.addEventListener('change', (e) => {
      if (e.target.matches('input[name="category"], input[name="brand"], input[name="discount"]')) {
        applyFilters();
      }
      
      if (e.target.matches('input[name="mobileCategory"], input[name="mobileBrand"], input[name="mobileDiscount"]')) {
        syncMobileFiltersToDesktop();
        applyFilters();
      }
    });
    
    $("sortSelect")?.addEventListener('change', applySorting);
    
    document.addEventListener('input', e => {
      if (e.target.matches('input[type="range"]')) {
        syncAndUpdateSliders();
        clearTimeout(window._sliderTO);
        window._sliderTO = setTimeout(applyFilters, 200);
      }
    });
    
    $("filterForm")?.addEventListener('submit', e => {
      e.preventDefault();
      applyFilters();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();



































// // baby.js - PRODUCTION READY VERSION WITH MOBILE FIXES
// (function() {
//   'use strict';
 
//   if (window.babyFinal) return;
//   window.babyFinal = true;

//   let products = [];
//   let filteredProducts = [];
//   let currentPage = 1;
//   const itemsPerPage = 12;
//   const API_BASE_URL = 'http://localhost:8083/api/mb/products';
//   const WISHLIST_API_BASE = "http://localhost:8083/api/wishlist";
//   const IMAGE_BASE = "http://localhost:8083";
//   const BANNER_API_BASE = "http://localhost:8083/api/banners";

//   let currentUserId = null;

//   const $ = id => document.getElementById(id);
  
//   // ==================== RESET FILTERS FUNCTION ====================
//   const resetAllFilters = () => {
//     console.log("Resetting all filters...");
    
//     // Reset all radio buttons to default values
//     const resetRadioGroups = () => {
//       // Desktop category
//       const desktopCategoryAll = document.querySelector('input[name="category"][value="all"]');
//       if (desktopCategoryAll) desktopCategoryAll.checked = true;
      
//       // Desktop brand
//       const desktopBrandAll = document.querySelector('input[name="brand"][value="all"]');
//       if (desktopBrandAll) desktopBrandAll.checked = true;
      
//       // Desktop discount
//       const desktopDiscountAll = document.querySelector('input[name="discount"][value="all"]');
//       if (desktopDiscountAll) desktopDiscountAll.checked = true;
      
//       // Mobile category
//       const mobileCategoryAll = document.querySelector('input[name="mobileCategory"][value="all"]');
//       if (mobileCategoryAll) mobileCategoryAll.checked = true;
      
//       // Mobile brand
//       const mobileBrandAll = document.querySelector('input[name="mobileBrand"][value="all"]');
//       if (mobileBrandAll) mobileBrandAll.checked = true;
      
//       // Mobile discount
//       const mobileDiscountAll = document.querySelector('input[name="mobileDiscount"][value="all"]');
//       if (mobileDiscountAll) mobileDiscountAll.checked = true;
      
//       // Mobile sort
//       const mobileSortDefault = document.querySelector('input[name="mobileSort"][value="default"]');
//       if (mobileSortDefault) mobileSortDefault.checked = true;
//     };

//     // Reset price sliders
//     const resetPriceSliders = () => {
//       const minThumb = $("minThumb");
//       const maxThumb = $("maxThumb");
//       const mobileMinThumb = $("mobileMinThumb");
//       const mobileMaxThumb = $("mobileMaxThumb");
      
//       if (minThumb) minThumb.value = 0;
//       if (maxThumb) maxThumb.value = 10000;
//       if (mobileMinThumb) mobileMinThumb.value = 0;
//       if (mobileMaxThumb) mobileMaxThumb.value = 10000;
//     };

//     // Reset sort dropdown
//     const resetSortDropdown = () => {
//       const sortSelect = $("sortSelect");
//       if (sortSelect) {
//         sortSelect.value = 'default';
//       }
//     };

//     // Execute all reset functions
//     resetRadioGroups();
//     resetPriceSliders();
//     resetSortDropdown();
    
//     // Sync and update UI
//     syncAndUpdateSliders();
    
//     // Apply the reset filters
//     applyFilters();
    
//     // Show toast notification
//     showToast("All filters have been reset to default");
    
//     console.log("All filters have been reset");
//   };

//   // Proper user ID extraction
//   function getCurrentUserId() {
//     try {
//       const userData = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
//       if (!userData) return null;

//       const user = JSON.parse(userData);
//       const id = user.userId || user.id || user.userID;

//       return id ? Number(id) : null;
//     } catch (error) {
//       console.error('Error reading currentUser:', error);
//       return null;
//     }
//   }

//   async function getValidUserId() {
//     try {
//       let userData = sessionStorage.getItem('currentUser');
//       if (!userData) {
//         userData = localStorage.getItem('currentUser');
//       }

//       if (!userData) return null;

//       const user = JSON.parse(userData);
//       const userId = user.userId || user.id || user.userID;

//       if (!userId || isNaN(userId)) return null;

//       return Number(userId);
//     } catch (error) {
//       console.error('Failed to parse user data:', error);
//       return null;
//     }
//   }

//   // Helper function to safely get price for display
//   const getDisplayPrice = (priceArray) => {
//     if (!priceArray || priceArray.length === 0) return 0;
//     return priceArray[0];
//   };

//   // Helper to calculate discount
//   const calculateDiscount = (priceArray, originalPriceArray) => {
//     if (!priceArray || !originalPriceArray || priceArray.length === 0 || originalPriceArray.length === 0) return 0;
//     const price = priceArray[0];
//     const originalPrice = originalPriceArray[0];
//     if (originalPrice > price) {
//       return Math.round(((originalPrice - price) / originalPrice) * 100);
//     }
//     return 0;
//   };

//   // ==================== WISHLIST BACKEND SYNC ====================
//   async function addToWishlistBackend(productId) {
//     if (!currentUserId) return false;
//     try {
//       const response = await fetch(`${WISHLIST_API_BASE}/add-wishlist-items`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           userId: currentUserId,
//           productId: productId,
//           productType: "BABY"
//         })
//       });
//       return response.ok;
//     } catch (err) {
//       console.error("Error adding to wishlist backend:", err);
//       return false;
//     }
//   }

//   async function removeFromWishlistBackend(productId) {
//     if (!currentUserId) return false;
//     try {
//       const response = await fetch(`${WISHLIST_API_BASE}/remove-wishlist-items`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           userId: currentUserId,
//           productId: productId,
//           productType: "BABY"
//         })
//       });
//       return response.ok;
//     } catch (err) {
//       console.error("Error removing from wishlist backend:", err);
//       return false;
//     }
//   }

//   async function loadWishlistFromBackend() {
//     if (!currentUserId) {
//       localStorage.setItem('wishlist', '[]');
//       updateHeaderCounts();
//       render();
//       return;
//     }

//     try {
//       const response = await fetch(`${WISHLIST_API_BASE}/get-wishlist-items?userId=${currentUserId}`);
//       if (response.ok) {
//         const backendItems = await response.json();
//         const wishlist = backendItems.map(item => ({
//           id: item.productId,
//           name: item.title || "Product",
//           price: getDisplayPrice(item.price),
//           originalPrice: getDisplayPrice(item.originalPrice),
//           image: item.mainImageUrl ? `${IMAGE_BASE}${item.mainImageUrl}` : '',
//           productType: item.productType || "BABY"
//         }));
//         localStorage.setItem('wishlist', JSON.stringify(wishlist));
//       } else {
//         localStorage.setItem('wishlist', '[]');
//       }
//     } catch (err) {
//       console.error("Failed to load wishlist:", err);
//       localStorage.setItem('wishlist', '[]');
//     }

//     updateHeaderCounts();
//     render();
//   }

//   function updateHeaderCounts() {
//     // Only show counts if user is logged in
//     if (!currentUserId) {
//       document.querySelectorAll('#wishlistCount, .wishlist-count').forEach(el => {
//         if (el) {
//           el.textContent = '0';
//           el.classList.add("hidden");
//         }
//       });
//       document.querySelectorAll('#cartCount, .cart-count').forEach(el => {
//         if (el) {
//           el.textContent = '0';
//           el.classList.add("hidden");
//         }
//       });
//       return;
//     }

//     const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
//     const cart = JSON.parse(localStorage.getItem('cart') || '[]');
//     const cartTotal = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

//     document.querySelectorAll('#wishlistCount, .wishlist-count').forEach(el => {
//       if (el) {
//         el.textContent = wishlist.length;
//         el.classList.toggle("hidden", wishlist.length === 0);
//       }
//     });

//     document.querySelectorAll('#cartCount, .cart-count').forEach(el => {
//       if (el) {
//         el.textContent = cartTotal;
//         el.classList.toggle("hidden", cartTotal === 0);
//       }
//     });
//   }

//   window.addToWishlist = async (id) => {
//     if (!currentUserId) {
//       showToast("Please login to add to wishlist");
//       return;
//     }

//     let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
//     const exists = wishlist.some(item => item.id === id);

//     if (exists) {
//       const success = await removeFromWishlistBackend(id);
//       if (success) {
//         wishlist = wishlist.filter(item => item.id !== id);
//         localStorage.setItem('wishlist', JSON.stringify(wishlist));
//         showToast("Removed from wishlist");
//       } else {
//         showToast("Failed to remove from wishlist");
//       }
//     } else {
//       const success = await addToWishlistBackend(id);
//       if (success) {
//         const product = products.find(p => p.id === id);
//         if (product) {
//           wishlist.push({
//             id: product.id,
//             name: product.title,
//             price: product.price,
//             originalPrice: product.originalPrice,
//             image: product.mainImageUrl,
//             productType: "BABY"
//           });
//           localStorage.setItem('wishlist', JSON.stringify(wishlist));
//           showToast("Added to wishlist");
//         }
//       } else {
//         showToast("Failed to add to wishlist");
//       }
//     }

//     updateHeaderCounts();
//     render();
//   };

//   // ==================== PRODUCT CARD NAVIGATION ====================
//   window.openProductDetails = (id) => {
//     window.location.href = `baby-product-details.html?id=${id}`;
//   };

//   // ==================== ORIGINAL CODE ====================
//   const createSkeletonCards = (count) => {
//     let skeletonHTML = '';
//     for (let i = 0; i < count; i++) {
//       skeletonHTML += `
//         <div class="skeleton-card bg-white rounded-lg shadow-lg overflow-hidden">
//           <div class="skeleton skeleton-img"></div>
//           <div class="p-4">
//             <div class="skeleton skeleton-title mb-2"></div>
//             <div class="skeleton skeleton-text mb-1"></div>
//             <div class="skeleton skeleton-text w-3/4 mb-3"></div>
//             <div class="skeleton skeleton-price mt-2"></div>
//             <div class="skeleton skeleton-text mt-4 w-full h-10 rounded-xl"></div>
//           </div>
//         </div>
//       `;
//     }
//     return skeletonHTML;
//   };

//   const loadProducts = async () => {
//     try {
//       $("productsGrid").innerHTML = createSkeletonCards(12);
//       $("resultsCount").textContent = 'Loading products...';

//       const response = await fetch(`${API_BASE_URL}/category/BabyCare`);
//       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

//       const apiProducts = await response.json();

//       products = apiProducts.map(p => {
//         const displayPrice = getDisplayPrice(p.price);
//         const displayOriginalPrice = getDisplayPrice(p.originalPrice);
//         const discount = calculateDiscount(p.price, p.originalPrice) || p.discount || 0;

//         let category = 'all';
//         if (p.category) {
//           const cat = p.category.toLowerCase();
//           if (cat.includes('bath') || cat.includes('body')) category = 'bath-body';
//           else if (cat.includes('diaper') || cat.includes('hygiene')) category = 'diapers-hygiene';
//           else if (cat.includes('feed') || cat.includes('nutrition')) category = 'nutrition-feeding';
//           else if (cat.includes('gift') || cat.includes('hamper')) category = 'gift-hampers';
//         }

//         return {
//           id: p.id,
//           title: p.title || 'No Title',
//           price: displayPrice,
//           originalPrice: displayOriginalPrice || displayPrice * 1.2,
//           discount: discount,
//           brand: p.brand || 'Unknown Brand',
//           category: category,
//           mainImageUrl: p.mainImageUrl ? `http://localhost:8083${p.mainImageUrl}` : 'https://goodneews.com/Images/product_details_fallback_img.jpg',
//           description: Array.isArray(p.description) ? p.description : (p.description ? [p.description] : []),
//           inStock: p.inStock !== undefined ? p.inStock : true,
//           stockQuantity: p.stockQuantity || 10,
//           rating: p.rating || 4.0,
//           reviewCount: p.reviewCount || Math.floor(Math.random() * 100),
//           sku: p.sku || `SKU-${p.id}`,
//           subCategory: p.subCategory || '',
//           sizes: Array.isArray(p.productSizes) ? p.productSizes : (p.productSizes ? [p.productSizes] : []),
//           features: Array.isArray(p.features) ? p.features : (p.features ? [p.features] : []),
//           specifications: p.specifications || {}
//         };
//       });

//       filteredProducts = [...products];
//       render();

//       currentUserId = await getValidUserId();
//       await loadWishlistFromBackend();

//     } catch (error) {
//       console.error('Error loading products:', error);
//       $("productsGrid").innerHTML = `
//         <div class="col-span-full text-center py-12">
//           <div class="text-red-600 text-6xl mb-4"><i class="fas fa-exclamation-triangle"></i></div>
//           <h3 class="text-xl font-bold text-gray-800 mb-2">Failed to load products</h3>
//           <p class="text-gray-600">${error.message}</p>
//           <p class="text-sm text-gray-500 mt-2">Ensure backend is running at server</p>
//           <button onclick="location.reload()" class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
//         </div>
//       `;
//     }
//   };
  
//   // ==================== BANNER SECTION ====================
//   async function loadDynamicBanners() {
//     const possiblePageNames = ["baby", "Baby", "BABY", "babycare", "baby-care"];
//     let bannerData = null;
  
//     for (const pageName of possiblePageNames) {
//       try {
//         const API = `${BANNER_API_BASE}/get-by-page-name/${pageName}`;
//         const res = await fetch(API + "?t=" + Date.now(), {
//           cache: "no-store",
//           timeout: 3000
//         });
      
//         if (res.ok) {
//           bannerData = await res.json();
//           console.log(`✅ Found banners for page: ${pageName}`);
//           break;
//         }
//       } catch (err) {
//         console.log(`⚠️ Error fetching banners for ${pageName}:`, err.message);
//       }
//     }
  
//     if (!bannerData || !bannerData.bannerFileSlides || bannerData.bannerFileSlides.length === 0) {
//       console.log("No backend banners found, using static banners");
//       initBanner();
//       return;
//     }
  
//     const getImageUrl = (path) => {
//       if (!path) return null;
//       if (path.startsWith('http')) return path;
    
//       const match = path.match(/^\/api\/banners\/(\d+)\/(slides\/\d+|filetwo|filethree|filefour)$/);
//       if (!match) return null;
//       const [_, id, type] = match;
//       if (type === "filetwo") return `${IMAGE_BASE}/api/banners/get-Banner-File-Two-Image/${id}/filetwo`;
//       if (type === "filethree") return `${IMAGE_BASE}/api/banners/get-Banner-File-Three-Image/${id}/filethree`;
//       if (type === "filefour") return `${IMAGE_BASE}/api/banners/get-Banner-File-Four-Image/${id}/filefour`;
//       return `${IMAGE_BASE}/api/banners/get-banner-slide-image/${id}/${type}`;
//     };
  
//     try {
//       const bannerWrapper = document.getElementById('bannerWrapper');
//       const dotsContainer = document.querySelector('.absolute.bottom-5 .flex.gap-3');
    
//       if (bannerWrapper) {
//         bannerWrapper.innerHTML = '';
      
//         const fallbackBanners = [
//           "Images/BabyCare/banner1.png",
//           "Images/BabyCare/banner2.png",
//           "Images/BabyCare/banner3.png"
//         ];
      
//         const slides = bannerData.bannerFileSlides.map((slide, index) => {
//           const url = getImageUrl(slide);
//           return url || fallbackBanners[index % fallbackBanners.length];
//         });
      
//         slides.forEach((src, idx) => {
//           const slideDiv = document.createElement('div');
//           slideDiv.className = `banner-slide ${idx === 0 ? 'active' : ''}`;
//           slideDiv.style.backgroundImage = `url('${src}')`;
//           bannerWrapper.appendChild(slideDiv);
        
//           if (dotsContainer && idx === 0) {
//             dotsContainer.innerHTML = '';
//           }
//           if (dotsContainer) {
//             const dotBtn = document.createElement('button');
//             dotBtn.className = `banner-dot w-3 h-3 rounded-full ${idx === 0 ? 'bg-white/70 active' : 'bg-white/50'}`;
//             dotBtn.onclick = () => goToSlide(idx);
//             dotsContainer.appendChild(dotBtn);
//           }
//         });
      
//         const slidesElements = bannerWrapper.querySelectorAll('.banner-slide');
//         const dots = dotsContainer ? dotsContainer.querySelectorAll('.banner-dot') : [];
//         let currentIndex = 0;
      
//         function goToSlide(index) {
//           slidesElements.forEach(slide => slide.classList.remove('active'));
//           dots.forEach((dot, idx) => {
//             if (idx === index) {
//               dot.classList.add('active', 'bg-white/70');
//               dot.classList.remove('bg-white/50');
//             } else {
//               dot.classList.remove('active', 'bg-white/70');
//               dot.classList.add('bg-white/50');
//             }
//           });
//           currentIndex = index;
//           slidesElements[currentIndex].classList.add('active');
//         }
      
//         setInterval(() => {
//           const nextIndex = (currentIndex + 1) % slides.length;
//           goToSlide(nextIndex);
//         }, 5000);
      
//       } else {
//         initBanner();
//       }
    
//     } catch (err) {
//       console.log("Error processing banners → Using static fallbacks", err);
//       initBanner();
//     }
//   }

//   function initBanner() {
//     const bannerWrapper = document.getElementById('bannerWrapper');
//     if (!bannerWrapper) return;
  
//     bannerWrapper.innerHTML = '';
  
//     const staticBanners = [
//       "Images/BabyCare/banner1.png",
//       "Images/BabyCare/banner2.png",
//       "Images/BabyCare/banner3.png"
//     ];
  
//     staticBanners.forEach((src, idx) => {
//       const slideDiv = document.createElement('div');
//       slideDiv.className = `banner-slide ${idx === 0 ? 'active' : ''}`;
//       slideDiv.style.backgroundImage = `url('${src}')`;
//       bannerWrapper.appendChild(slideDiv);
//     });
  
//     const dotsContainer = document.querySelector('.absolute.bottom-5 .flex.gap-3');
//     if (dotsContainer) {
//       dotsContainer.innerHTML = '';
//       staticBanners.forEach((_, idx) => {
//         const dotBtn = document.createElement('button');
//         dotBtn.className = `banner-dot w-3 h-3 rounded-full ${idx === 0 ? 'bg-white/70 active' : 'bg-white/50'}`;
//         dotBtn.onclick = () => goToSlide(idx);
//         dotsContainer.appendChild(dotBtn);
//       });
//     }
  
//     const slides = bannerWrapper.querySelectorAll('.banner-slide');
//     const dots = dotsContainer ? dotsContainer.querySelectorAll('.banner-dot') : [];
//     let currentIndex = 0;
  
//     function goToSlide(index) {
//       slides.forEach(slide => slide.classList.remove('active'));
//       dots.forEach((dot, idx) => {
//         if (idx === index) {
//           dot.classList.add('active', 'bg-white/70');
//           dot.classList.remove('bg-white/50');
//         } else {
//           dot.classList.remove('active', 'bg-white/70');
//           dot.classList.add('bg-white/50');
//         }
//       });
//       currentIndex = index;
//       slides[currentIndex].classList.add('active');
//     }
  
//     if (dotsContainer) {
//       dots.forEach((dot, idx) => {
//         dot.onclick = () => goToSlide(idx);
//       });
//     }
  
//     setInterval(() => {
//       const nextIndex = (currentIndex + 1) % staticBanners.length;
//       goToSlide(nextIndex);
//     }, 5000);
//   }

//   const render = () => {
//     const start = (currentPage - 1) * itemsPerPage;
//     const items = filteredProducts.slice(start, start + itemsPerPage);
//     const grid = $("productsGrid");

//     if (items.length === 0) {
//       grid.innerHTML = `
//         <div class="col-span-full text-center py-12">
//           <div class="text-gray-400 text-6xl mb-4"><i class="fas fa-box-open"></i></div>
//           <h3 class="text-xl font-bold text-gray-800 mb-2">No products found</h3>
//           <p class="text-gray-600">Try adjusting your filters</p>
//         </div>
//       `;
//       $("resultsCount").textContent = `Showing 0 products`;
//       $("pagination").innerHTML = '';
//       return;
//     }

//     const wishlistIds = new Set();
//     if (currentUserId) {
//       const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
//       wishlist.forEach(item => wishlistIds.add(item.id));
//     }

//     grid.innerHTML = items.map(p => {
//       const rating = p.rating || 0;
//       const fullStars = Math.floor(rating);
//       const hasHalfStar = rating % 1 >= 0.5;
//       let starsHTML = '';
//       for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fas fa-star text-yellow-400"></i>';
//       if (hasHalfStar) starsHTML += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
//       for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) starsHTML += '<i class="far fa-star text-yellow-400"></i>';

//       const isWishlisted = currentUserId && wishlistIds.has(p.id);

//       return `
//         <div class="product-card bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 cursor-pointer ${!p.inStock ? 'opacity-60 grayscale' : ''}"
//              onclick="window.openProductDetails(${p.id})">
//           <div class="relative bg-gray-50 aspect-[9/6] overflow-hidden">
//             <img src="${p.mainImageUrl}" alt="${p.title}"
//                  class="w-full h-full object-contain p-5 transition-transform duration-500 hover:scale-110"
//                  onerror="this.src='https://goodneews.com/Images/product_details_fallback_img.jpg'">
//             ${p.inStock
//               ? `<div class="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">In Stock</div>`
//               : `<div class="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">Out of Stock</div>`
//             }
//             ${p.discount > 0
//               ? `<div class="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">${p.discount}% OFF</div>`
//               : ''
//             }
//           </div>

//           <button class="absolute top-3 right-3 bg-white/90 backdrop-blur hover:bg-white p-3 rounded-full shadow-lg transition-all duration-300 z-10"
//                   onclick="event.stopPropagation(); window.addToWishlist(${p.id});">
//             <i class="${isWishlisted ? 'fas text-red-600' : 'far text-gray-600'} fa-heart text-xl"></i>
//           </button>

//           <div class="p-4">
//             <p class="text-xs text-gray-500 uppercase font-medium truncate">${p.brand || 'Brand'}</p>
//             <h3 class="text-base font-medium text-gray-800 line-clamp-2 mt-1">${p.title}</h3>
            
//             <div class="mt-3 flex items-center gap-2">
//               <span class="text-xl font-bold text-green-600">₹${p.price.toLocaleString()}</span>
//               ${p.originalPrice > p.price
//                 ? `<span class="text-sm text-gray-500 line-through">₹${p.originalPrice.toLocaleString()}</span>`
//                 : ''
//               }
//             </div>

//             <div class="mt-2 flex items-center">
//               <div class="text-yellow-400 text-base">${starsHTML}</div>
//               <span class="text-xs text-gray-500 ml-2">(${p.reviewCount || 0})</span>
//             </div>

//             <button class="mt-5 w-full bg-[#239BA7] hover:bg-[#00809D] text-white font-bold py-3 rounded-xl transition"
//                     onclick="event.stopPropagation(); window.openProductDetails(${p.id})">
//               View Details
//             </button>
//           </div>
//         </div>
//       `;
//     }).join('');

//     $("resultsCount").textContent = `Showing ${start + 1}–${Math.min(start + itemsPerPage, filteredProducts.length)} of ${filteredProducts.length} products`;
//     renderPagination();
//   };

//   const renderPagination = () => {
//     const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
//     const pag = $("pagination");
//     if (totalPages <= 1) { pag.innerHTML = ''; return; }
//     let html = '';
//     if (currentPage > 1) html += `<button class="px-4 py-2 bg-white rounded-lg font-bold text-pink-600" onclick="window.changePage(${currentPage-1})">← Prev</button>`;
//     for (let i = 1; i <= totalPages; i++) {
//       if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
//         html += `<button class="px-4 py-2 ${i === currentPage ? 'bg-pink-600 text-white' : 'bg-white text-pink-600'} rounded-lg font-bold" onclick="window.changePage(${i})">${i}</button>`;
//       } else if (i === currentPage - 2 || i === currentPage + 2) {
//         html += `<span class="px-2">...</span>`;
//       }
//     }
//     if (currentPage < totalPages) html += `<button class="px-4 py-2 bg-white rounded-lg font-bold text-pink-600" onclick="window.changePage(${currentPage+1})">Next →</button>`;
//     pag.innerHTML = html;
//   };

//   window.changePage = (page) => {
//     currentPage = page;
//     render();
//     window.scrollTo({top: 0, behavior: 'smooth'});
//   };

//   // ==================== FIXED: MOBILE FILTER LOGIC ====================
//   const getActiveFilters = () => {
//     // Check both desktop and mobile inputs
//     const categoryEl = document.querySelector('input[name="category"]:checked') || 
//                       document.querySelector('input[name="mobileCategory"]:checked');
//     const brandEl = document.querySelector('input[name="brand"]:checked') || 
//                     document.querySelector('input[name="mobileBrand"]:checked');
//     const discountEl = document.querySelector('input[name="discount"]:checked') || 
//                       document.querySelector('input[name="mobileDiscount"]:checked');
    
//     const category = categoryEl?.value || 'all';
//     const brand = brandEl?.value || 'all';
//     const discount = discountEl?.value === 'all' ? null : parseInt(discountEl?.value || '0');
    
//     let minPrice = 0;
//     let maxPrice = 10000;
    
//     // Get price from either desktop or mobile sliders
//     const desktopMin = $("minThumb");
//     const desktopMax = $("maxThumb");
//     const mobileMin = $("mobileMinThumb");
//     const mobileMax = $("mobileMaxThumb");
    
//     if (desktopMin && desktopMax) {
//       minPrice = Number(desktopMin.value);
//       maxPrice = Number(desktopMax.value);
//     } else if (mobileMin && mobileMax) {
//       minPrice = Number(mobileMin.value);
//       maxPrice = Number(mobileMax.value);
//     }
    
//     return { category, brand, discount, minPrice, maxPrice };
//   };

//   const applyFilters = () => {
//     const { category, brand, discount, minPrice, maxPrice } = getActiveFilters();
//     console.log("Applying filters:", { category, brand, discount, minPrice, maxPrice });
    
//     let list = [...products];
    
//     if (category !== 'all') {
//       list = list.filter(p => p.category === category);
//     }
    
//     if (brand !== 'all') {
//       list = list.filter(p => p.brand === brand);
//     }
    
//     if (discount !== null) {
//       list = list.filter(p => (p.discount || 0) >= discount);
//     }
    
//     list = list.filter(p => p.price >= minPrice && p.price <= maxPrice);
    
//     filteredProducts = list;
//     currentPage = 1;
//     applySorting();
//   };

//   const applySorting = () => {
//     const sortSelect = $("sortSelect");
//     const mobileSort = document.querySelector('input[name="mobileSort"]:checked');
    
//     let sortValue = 'default';
//     if (sortSelect && sortSelect.value) {
//       sortValue = sortSelect.value;
//     } else if (mobileSort && mobileSort.value) {
//       sortValue = mobileSort.value;
//     }
    
//     console.log("Applying sort:", sortValue);
    
//     if (sortValue === 'price-low') {
//       filteredProducts.sort((a, b) => a.price - b.price);
//     } else if (sortValue === 'price-high') {
//       filteredProducts.sort((a, b) => b.price - a.price);
//     } else if (sortValue === 'rating') {
//       filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
//     } else if (sortValue === 'newest') {
//       filteredProducts.sort((a, b) => b.id - a.id);
//     }
    
//     render();
//   };

//   const syncAndUpdateSliders = () => {
//     let min = 0;
//     let max = 10000;
    
//     // Get current values from desktop sliders first, then mobile
//     if ($("minThumb")) min = Number($("minThumb").value);
//     else if ($("mobileMinThumb")) min = Number($("mobileMinThumb").value);
    
//     if ($("maxThumb")) max = Number($("maxThumb").value);
//     else if ($("mobileMaxThumb")) max = Number($("mobileMaxThumb").value);
    
//     if (min > max) [min, max] = [max, min];
    
//     // Update all sliders
//     const thumbs = ["minThumb", "mobileMinThumb", "maxThumb", "mobileMaxThumb"];
//     thumbs.forEach(id => {
//       const el = $(id);
//       if (el) {
//         el.value = (id.includes("min")) ? min : max;
//       }
//     });
    
//     // Update fill bars
//     document.querySelectorAll('.slider-fill').forEach(fill => {
//       fill.style.left = (min / 10000 * 100) + '%';
//       fill.style.width = ((max - min) / 10000 * 100) + '%';
//     });
    
//     // Update price labels
//     document.querySelectorAll('#minValue, #mobileMinValue').forEach(el => {
//       if (el) el.textContent = '₹' + min;
//     });
    
//     document.querySelectorAll('#maxValue, #mobileMaxValue').forEach(el => {
//       if (el) el.textContent = '₹' + max;
//     });
//   };

//   const syncMobileFiltersToDesktop = () => {
//     // Sync category
//     const mobileCat = document.querySelector('input[name="mobileCategory"]:checked');
//     if (mobileCat) {
//       const desktopCat = document.querySelector(`input[name="category"][value="${mobileCat.value}"]`);
//       if (desktopCat) {
//         desktopCat.checked = true;
//       }
//     }
    
//     // Sync brand
//     const mobileBrand = document.querySelector('input[name="mobileBrand"]:checked');
//     if (mobileBrand) {
//       const desktopBrand = document.querySelector(`input[name="brand"][value="${mobileBrand.value}"]`);
//       if (desktopBrand) {
//         desktopBrand.checked = true;
//       }
//     }
    
//     // Sync discount
//     const mobileDisc = document.querySelector('input[name="mobileDiscount"]:checked');
//     if (mobileDisc) {
//       const desktopDisc = document.querySelector(`input[name="discount"][value="${mobileDisc.value}"]`);
//       if (desktopDisc) {
//         desktopDisc.checked = true;
//       }
//     }
    
//     // Sync sort
//     const mobileSort = document.querySelector('input[name="mobileSort"]:checked');
//     if (mobileSort && $("sortSelect")) {
//       $("sortSelect").value = mobileSort.value;
//     }
//   };

//   const clearAllFilters = () => {
//     // Reset all radio buttons to "all"
//     document.querySelectorAll('input[type="radio"]').forEach(radio => {
//       if (radio.value === 'all') {
//         radio.checked = true;
//       }
//     });
    
//     // Reset price sliders
//     [$("minThumb"), $("mobileMinThumb")].forEach(el => {
//       if (el) el.value = 0;
//     });
    
//     [$("maxThumb"), $("mobileMaxThumb")].forEach(el => {
//       if (el) el.value = 10000;
//     });
    
//     // Reset sort dropdown
//     if ($("sortSelect")) {
//       $("sortSelect").value = 'default';
//     }
    
//     syncAndUpdateSliders();
//     applyFilters();
//     showToast("All filters cleared");
//   };

//   const initMobileSheets = () => {
//     const filterSheet = $("filterSheet");
//     const sortSheet = $("sortSheet");
//     const backdrop = $("mobileSheetBackdrop");
    
//     const closeSheets = () => {
//       filterSheet?.classList.add('translate-y-full');
//       sortSheet?.classList.add('translate-y-full');
//       backdrop?.classList.add('hidden');
//     };
    
//     // Open filter sheet
//     $("openFilterSheet")?.addEventListener('click', () => {
//       filterSheet?.classList.remove('translate-y-full');
//       backdrop?.classList.remove('hidden');
//     });
    
//     // Open sort sheet
//     $("openSortSheet")?.addEventListener('click', () => {
//       sortSheet?.classList.remove('translate-y-full');
//       backdrop?.classList.remove('hidden');
//     });
    
//     // Close buttons
//     $("closeFilterSheet")?.addEventListener('click', closeSheets);
//     $("closeSortSheet")?.addEventListener('click', closeSheets);
//     backdrop?.addEventListener('click', closeSheets);
    
//     // Apply mobile filters
//     $("applyMobileFilters")?.addEventListener('click', () => {
//       syncMobileFiltersToDesktop();
//       applyFilters();
//       closeSheets();
//     });
    
//     // Apply mobile sort
//     $("applySortBtn")?.addEventListener('click', () => {
//       const mobileSort = document.querySelector('input[name="mobileSort"]:checked');
//       if (mobileSort && $("sortSelect")) {
//         $("sortSelect").value = mobileSort.value;
//       }
//       applySorting();
//       closeSheets();
//     });
    
//     // Clear mobile filters
//     $("clearMobileFilters")?.addEventListener('click', () => {
//       clearAllFilters();
//       closeSheets();
//     });
    
//     // Handle mobile filter changes in real-time (optional)
//     document.querySelectorAll('#filterSheet input[type="radio"]').forEach(radio => {
//       radio.addEventListener('change', () => {
//         // Update price display immediately
//         syncAndUpdateSliders();
//       });
//     });
//   };

//   function showToast(message) {
//     const toast = document.createElement('div');
//     toast.textContent = message;
//     toast.style.cssText = `
//       position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
//       background: #10b981; color: white; padding: 1rem 2rem; border-radius: 50px;
//       font-weight: bold; z-index: 10000; animation: toast 3s ease forwards;
//     `;
//     document.body.appendChild(toast);
//     setTimeout(() => toast.remove(), 3000);
//   }

//   if (!document.querySelector('#toastStyle')) {
//     const style = document.createElement('style');
//     style.id = 'toastStyle';
//     style.textContent = `
//       @keyframes toast {
//         0%, 100% { opacity: 0; transform: translateX(-50%) translateY(20px); }
//         10%, 90% { opacity: 1; transform: translateX(-50%) translateY(0); }
//       }
//     `;
//     document.head.appendChild(style);
//   }

//   const init = () => {
//     console.log("Initializing Baby Products page...");
    
//     loadProducts();
//     syncAndUpdateSliders();
//     initMobileSheets();
//     updateHeaderCounts();
//     loadDynamicBanners();
    
//     // Add event listener for reset button
//     const resetBtn = $("resetFiltersBtn");
//     if (resetBtn) {
//       resetBtn.addEventListener('click', resetAllFilters);
//       console.log("Reset button event listener added");
//     }
    
//     // Handle desktop filter changes
//     document.addEventListener('change', (e) => {
//       if (e.target.matches('input[name="category"], input[name="brand"], input[name="discount"]')) {
//         applyFilters();
//       }
      
//       if (e.target.matches('input[name="mobileCategory"], input[name="mobileBrand"], input[name="mobileDiscount"]')) {
//         // Sync mobile to desktop when changed
//         syncMobileFiltersToDesktop();
//         applyFilters();
//       }
//     });
    
//     // Handle sort changes
//     $("sortSelect")?.addEventListener('change', applySorting);
    
//     // Handle range slider changes
//     document.addEventListener('input', e => {
//       if (e.target.matches('input[type="range"]')) {
//         syncAndUpdateSliders();
//         clearTimeout(window._sliderTO);
//         window._sliderTO = setTimeout(applyFilters, 200);
//       }
//     });
    
//     // Handle desktop form submission
//     $("filterForm")?.addEventListener('submit', e => {
//       e.preventDefault();
//       applyFilters();
//     });
//   };

//   // Initialize
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', init);
//   } else {
//     init();
//   }
// })();