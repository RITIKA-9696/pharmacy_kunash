// ========== SINGLE SOURCE CART SYSTEM ==========



if (window.cartSystemInitialized) {
    console.warn('⚠️ Cart system already loaded. Skipping duplicate initialization.');
} else {
    window.cartSystemInitialized = true;
    console.log('✅ Initializing cart system...');

    // ========== Helper: Get Current User ID ==========
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
    
    function openProductMbDetails(productId) {
    // Define category-based redirect logic here
    // You need to know which category the product belongs to
    // Since you don't pass category, we'll assume you can determine it via a data attribute or API
    // For now, a simple fallback: if it's feminine/mother care → mother-product-details, else → productdetails

    // BEST: Add data-category to each card when generating
    // But since you can't easily now, use a simple heuristic or keep a map

    // Temporary fix assuming Medicines & Healthcare uses generic productdetails.html
    // You can improve this later with proper category mapping

    const feminineCategories = ['Mother Care', 'Mother Care & Maternity', 'Menstrual Care']; // extend as needed

    // Try to get category from the card (you'll need to add data-category when creating cards)
    const card = document.querySelector(`[data-product-id="${productId}"]`)?.closest('.myntra-card');
    const category = card?.dataset.category || '';

    if (feminineCategories.some(cat => category.includes(cat))) {
        window.location.href = `/MotherCare/mother-product-details.html?id=${productId}`;
    } else {
        window.location.href = `/productdetails.html?id=${productId}`;
    }
}

    const CURRENT_USER_ID = getCurrentUserId();
    const IS_LOGGED_IN = CURRENT_USER_ID !== null;

    const CART_API_BASE = 'http://localhost:8083/api/cart';

    // Backend add (only if logged in)
    async function addToCartBackend(product, qty = 1) {
        if (!IS_LOGGED_IN) return false;

        try {
            console.log('📤 Sending to backend:', {
                userId: CURRENT_USER_ID,
                productId: product.id,
                productName: product.name
            });

            const payload = {
                userId: CURRENT_USER_ID,
                type: "PRODUCT",
                productId: Number(product.id),
                quantity: qty,
                selectedSize: "",
                productType: "MEDICINE"
            };

            const response = await fetch(`${CART_API_BASE}/add-cart-items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.text();
                console.error("Backend cart add failed:", err);
                return false;
            }

            const result = await response.json();
            console.log('✅ Backend response:', result);
            return true;
        } catch (err) {
            console.error("Backend cart error:", err);
            return false;
        }
    }

    // Local cart functions
    // function getCart() {
    //     try {
    //         return JSON.parse(localStorage.getItem('cart') || '[]');
    //     } catch (e) {
    //         console.warn('Cart corrupted, resetting...');
    //         localStorage.removeItem('cart');
    //         return [];
    //     }
    // }
    
    function getCart() {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  } catch (e) {
    console.warn('Cart corrupted, resetting...');
    localStorage.removeItem('cart');
    return [];
  }
}

    function saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    //  function updateCartCount() {
    //   const totalItems = this.cart.length;
 
    //   document.querySelectorAll('#desktop-cart-count, #mobile-cart-count, #cart-count, #cartItemsCount, .cart-count').forEach(el => {
    //     if (el) {
    //       el.textContent = totalItems;
    //       el.style.display = totalItems > 0 ? 'inline-flex' : 'none';
    //     }
    //   });
 
    //   window.dispatchEvent(new Event('storage'));
    // }

function updateCartCount() {
  const cart = getCart(); // Get cart from localStorage
  const totalItems = cart.length;

  document.querySelectorAll('#desktop-cart-count, #mobile-cart-count, #cart-count, #cartItemsCount, .cart-count').forEach(el => {
    if (el) {
      el.textContent = totalItems;
      el.style.display = totalItems > 0 ? 'inline-flex' : 'none';
    }
  });

  window.dispatchEvent(new Event('storage'));
}
    function showToast(message, type = 'add') {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.className = `fixed top-20 right-5 z-50 px-8 py-4 rounded-xl text-white font-bold shadow-2xl transition-all ${
            type === 'add' ? 'bg-green-600' : type === 'login' ? 'bg-orange-600' : 'bg-red-600'
        } transform translate-x-full`;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.remove('translate-x-full'), 100);
        setTimeout(() => toast.remove(), 4000); // Slightly longer for login message
    }

    function restoreQuantitySelectors() {
        const cart = getCart();
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            const productId = btn.dataset.productId || btn.getAttribute('data-product-id');
            const item = cart.find(i => i.id == productId);
            const container = btn.closest('.relative') || btn.parentElement;
            const selector = container?.querySelector('.quantity-selector');
            const qtyDisplay = selector?.querySelector('.qty-display');

            if (selector && qtyDisplay) {
                if (item && item.quantity > 0) {
                    btn.classList.add('hidden');
                    selector.classList.remove('hidden');
                    qtyDisplay.textContent = item.quantity;
                } else {
                    btn.classList.remove('hidden');
                    selector.classList.add('hidden');
                }
            }
        });
    }

    // Prevent double clicks
    let isProcessingClick = false;
    const MAX_QTY = 20;

    document.addEventListener('click', async function handleGlobalClick(e) {
        if (isProcessingClick) {
            console.log('⏸️ Click already being processed, ignoring...');
            return;
        }

        // ADD TO CART BUTTON
        const addBtn = e.target.closest('.add-to-cart-btn');
        if (addBtn) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            isProcessingClick = true;

            // CHECK IF LOGGED IN
            if (!IS_LOGGED_IN) {
                showToast('Please login to add to cart', 'login');
                // Optional: Redirect to login page after delay
                setTimeout(() => {
                    window.location.href = '/Signup/auth.html';
                }, 1500);
                isProcessingClick = false;
                return;
            }

            const product = {
                id: addBtn.dataset.productId || addBtn.getAttribute('data-product-id'),
                name: addBtn.dataset.productName || addBtn.getAttribute('data-product-name'),
                price: parseFloat(addBtn.dataset.productPrice || addBtn.getAttribute('data-product-price')),
                image: addBtn.dataset.productImage || addBtn.getAttribute('data-product-image')
            };

            console.log(`🛒 Adding to cart: ${product.name} (ID: ${product.id})`);

            const qty = 1;
            const backendSuccess = await addToCartBackend(product, qty);

            // Always update local cart (even if backend fails)
            let cart = getCart();
            let existing = cart.find(item => item.id == product.id);

            if (existing) {
                if (existing.quantity >= MAX_QTY) {
                    showToast(`Max ${MAX_QTY} items allowed!`, 'error');
                    isProcessingClick = false;
                    return;
                }
                existing.quantity += qty;
            } else {
                cart.push({ ...product, quantity: qty });
            }

            saveCart(cart);
            restoreQuantitySelectors();
            updateCartCount();

            showToast('Added to cart!', 'add');

            setTimeout(() => { isProcessingClick = false; }, 300);
            return;
        }

        // INCREASE QUANTITY (+)
        const increaseBtn = e.target.closest('.increase-qty');
        if (increaseBtn) {
            if (!IS_LOGGED_IN) {
                showToast('Please login to update cart', 'login');
                isProcessingClick = false;
                return;
            }

            e.stopPropagation();
            e.stopImmediatePropagation();
            isProcessingClick = true;

            const selector = increaseBtn.closest('.quantity-selector');
            const qtyDisplay = selector.querySelector('.qty-display');
            const addBtn = selector.closest('.relative')?.querySelector('.add-to-cart-btn') ||
                          selector.parentElement.querySelector('.add-to-cart-btn');
            const productId = addBtn?.dataset.productId || addBtn?.getAttribute('data-product-id');

            let cart = getCart();
            const item = cart.find(i => i.id == productId);

            if (!item || item.quantity >= MAX_QTY) {
                showToast(`Max ${MAX_QTY} allowed!`, 'error');
                isProcessingClick = false;
                return;
            }

            item.quantity += 1;
            qtyDisplay.textContent = item.quantity;
            saveCart(cart);
            updateCartCount();

            setTimeout(() => { isProcessingClick = false; }, 300);
            return;
        }

        // DECREASE QUANTITY (-)
        const decreaseBtn = e.target.closest('.decrease-qty');
        if (decreaseBtn) {
            if (!IS_LOGGED_IN) {
                showToast('Please login to update cart', 'login');
                isProcessingClick = false;
                return;
            }

            e.stopPropagation();
            e.stopImmediatePropagation();
            isProcessingClick = true;

            const selector = decreaseBtn.closest('.quantity-selector');
            const qtyDisplay = selector.querySelector('.qty-display');
            const addBtn = selector.closest('.relative')?.querySelector('.add-to-cart-btn') ||
                          selector.parentElement.querySelector('.add-to-cart-btn');
            const productId = addBtn?.dataset.productId || addBtn?.getAttribute('data-product-id');

            let cart = getCart();
            const item = cart.find(i => i.id == productId);

            if (!item) {
                isProcessingClick = false;
                return;
            }

            item.quantity -= 1;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id != productId);
                saveCart(cart);
                selector.classList.add('hidden');
                addBtn.classList.remove('hidden');
                showToast('Removed from cart', 'error');
            } else {
                qtyDisplay.textContent = item.quantity;
                saveCart(cart);
            }

            restoreQuantitySelectors();
            updateCartCount();

            setTimeout(() => { isProcessingClick = false; }, 300);
            return;
        }
    }, true); // Capture phase
    
       // ==================== IMPROVED QUICK VIEW BUTTON HANDLER ====================
    document.addEventListener('click', function(e) {
        const quickViewBtn = e.target.closest('.quick-view-btn');
        if (!quickViewBtn) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const productId = quickViewBtn.dataset.productId;
        if (!productId) return;

        const card = quickViewBtn.closest('.myntra-card');
        const category = card?.dataset.category || '';

        // Normalize category name (lowercase for comparison)
        const catLower = category.toLowerCase().trim();

        let targetPage = '/productdetails.html'; // Default for Medicines, Devices, etc.

        // Accurate check for Mother Care / Feminine products
        if (catLower.includes('mother') || 
            catLower.includes('maternity') || 
            catLower.includes('menstrual') || 
            catLower.includes('feminine') || 
            catLower.includes('sanitary') || 
            catLower.includes('pregnancy') ||
            catLower.includes('breast') || 
            catLower.includes('pad') ||
            catLower.includes('tampon')) {
            targetPage = '/MotherCare/mother-product-details.html';
        }

        window.location.href = `${targetPage}?id=${productId}`;
    }, true);
    // ==============================================================================
    

    // Initialize
    function initializeCart() {
        console.log('🛒 Setting up cart listeners...');
        updateCartCount();
        restoreQuantitySelectors();

        // Re-check on delay (for dynamic content)
        setTimeout(() => {
            restoreQuantitySelectors();
            updateCartCount();
        }, 1000);

        console.log('✅ Cart system ready');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCart);
    } else {
        initializeCart();
    }

    // Sync across tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'cart') {
            updateCartCount();
            restoreQuantitySelectors();
        }
    });

    // Optional: Re-check login status if user logs in/out in another tab
    window.addEventListener('storage', (e) => {
        if (e.key === 'currentUser') {
            location.reload(); // Simplest way to refresh login state
        }
    });
}


// ========== WISHLIST FUNCTIONS (unchanged) ==========
function forceUpdateWishlistCount() {
    const count = getWishlist().length;
    const desktopBadge = document.getElementById('desktop-wishlist-count');
    if (desktopBadge) {
        desktopBadge.textContent = count;
        desktopBadge.style.display = count > 0 ? 'flex' : 'none';
    }
    const mobileBadge = document.getElementById('mobile-wishlist-count');
    if (mobileBadge) {
        mobileBadge.textContent = count;
        mobileBadge.style.display = count > 0 ? 'flex' : 'none';
    }
}
function getWishlist() {
    try { return JSON.parse(localStorage.getItem('wishlist') || '[]'); }
    catch { localStorage.removeItem('wishlist'); return []; }
}
function saveWishlist(wishlist) {
    try {
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        console.log('Wishlist saved:', wishlist);
    } catch (e) {
        console.error('Wishlist save error:', e);
    }
}
function isInWishlist(id) {
    return getWishlist().some(item => item.id === id);
}
forceUpdateWishlistCount();
document.addEventListener('DOMContentLoaded', forceUpdateWishlistCount);
setTimeout(forceUpdateWishlistCount, 300);
setTimeout(forceUpdateWishlistCount, 1000);
window.getWishlist = getWishlist;
window.isInWishlist = isInWishlist;
window.updateCartCount = updateCartCount;
// Comprehensive pharmacy categories and products
const pharmacyCategories = {
    
};
// Create comprehensive search terms including variations and keywords
const searchTerms = [];
// Add main categories
Object.keys(pharmacyCategories).forEach(category => {
    searchTerms.push({
        term: category,
        type: 'main_category',
        icon: pharmacyCategories[category].icon,
        category: category
    });
    // Add subcategories
    pharmacyCategories[category].subcategories.forEach(sub => {
        searchTerms.push({
            term: sub,
            type: 'subcategory',
            icon: '🔸',
            category: category,
            parent: pharmacyCategories[category].icon
        });
    });
});
// Add additional searchable keywords for better matching
const additionalKeywords = [
  ];
function openProductDetails(id) {
    window.location.href = `productdetails.html?id=${id}`;
}
const searchInput = document.getElementById('searchInput');
const suggestions = document.getElementById('searchSuggestions');
function createSuggestionItem(item, isMainCategory = false, icon = '🔍', parentIcon = '') {
    const div = document.createElement('div');
    div.className = 'suggestion-item flex items-center p-3 cursor-pointer rounded-lg transition-colors bg-white-50 duration-150 hover:bg-blue-50';
    let displayIcon = icon;
    let textColor = 'text-gray-800';
    let displayText = item.term || item;
    if (isMainCategory) {
        textColor = 'text-blue-700 font-semibold';
        displayIcon = item.icon || icon;
        displayText = item.term || item;
    } else if (item.type === 'subcategory') {
        textColor = 'text-gray-700';
        displayIcon = item.parent + ' ' + item.icon;
        displayText = item.term;
    } else if (item.type === 'keyword') {
        textColor = 'text-green-600';
        displayIcon = item.icon;
        displayText = item.term;
    }
    div.innerHTML = `
        <span class="mr-3 text-lg">${displayIcon}</span>
        <span class="flex-1 ${textColor}">${displayText}</span>
        <span class="text-sm text-gray-400">→</span>
    `;
    div.addEventListener('click', () => {
        const searchValue = displayText;
        searchInput.value = searchValue;
        suggestions.classList.add('hidden');
        performSearch(searchValue);
    });
    return div;
}
// Show suggestions when clicking/focusing the input
function showSuggestions() {
    suggestions.classList.remove('hidden');
}
// Hide suggestions when clicking outside
function hideSuggestions(e) {
    // If the click is NOT inside the search input OR the suggestions box → hide it
    if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.classList.add('hidden');
    }
}
function performSearch(query) {
    console.log('Searching for:', query);
    // Here you would typically make an API call or redirect to search results
    alert(`Searching for: ${query}`);
}
// Event listeners for search
if (searchInput && suggestions) {
    searchInput.addEventListener('focus', () => showSuggestions(searchInput.value));
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        if (query.length > 0) {
            showSuggestions(query);
        } else {
            showSuggestions();
        }
    });
    // Show suggestions when input is focused
    searchInput.addEventListener('focus', () => {
        suggestions.classList.remove('hidden');
    });
    searchInput.addEventListener('blur', (e) => {
        // Delay hiding suggestions to allow clicks
        setTimeout(() => {
            suggestions.classList.add('hidden');
        }, 150);
    });
    searchInput.addEventListener('focus', showSuggestions);
    searchInput.addEventListener('click', showSuggestions);
    // Hide when clicking anywhere else on the page
    document.addEventListener('click', hideSuggestions);
    // Optional: Also hide on Escape key
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            suggestions.classList.add('hidden');
            searchInput.blur();
        }
    });
    // Optional: Keep open if user clicks inside suggestions (prevents closing when selecting)
    suggestions.addEventListener('click', (e) => {
        e.stopPropagation(); // This stops the click from bubbling up to document
    });
    // Search button functionality
    const searchButton = document.querySelector('button[class*="bg-blue-600"]');
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            performSearch(searchInput.value);
        });
    }
    // Enter key search
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value);
        }
    });
    // Optional: Hide on Escape key
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            suggestions.classList.add('hidden');
            searchInput.blur();
        }
    });
}
// Category button functionality
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const categoryMap = {
            'Medicines': 'Medicines & Healthcare',
            'Mother Care': 'Mother Care & Maternity',
            'Baby Care': 'Baby Care',
            'Wellness': 'Wellness & Personal Care',
            'Medical Devices': 'Medical Devices & Equipment'
        };
        const buttonText = btn.textContent.trim();
        const categoryKey = Object.keys(categoryMap).find(key => buttonText.includes(key));
        const fullCategory = categoryMap[categoryKey] || buttonText;
        searchInput.value = fullCategory;
        performSearch(fullCategory);
    });
});
// Click outside to close suggestions
document.addEventListener('click', (e) => {
    if (suggestions && searchInput && !searchInput.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.classList.add('hidden');
    }
});


// ========================================
// DYNAMIC BANNERS & TOP CAROUSEL — FINAL FIXED
// ========================================
(async function loadDynamicBanners() {
    const API = "http://localhost:8083/api/banners/get-by-page-name/home";
    const IMAGE_BASE = "http://localhost:8083";
    const getImageUrl = (path) => {
        if (!path) return null;
        const match = path.match(/^\/api\/banners\/(\d+)\/(slides\/\d+|filetwo|filethree|filefour)$/);
        if (!match) return null;
        const [_, id, type] = match;
        if (type === "filetwo") return `${IMAGE_BASE}/api/banners/get-Banner-File-Two-Image/${id}/filetwo`;
        if (type === "filethree") return `${IMAGE_BASE}/api/banners/get-Banner-File-Three-Image/${id}/filethree`;
        if (type === "filefour") return `${IMAGE_BASE}/api/banners/get-Banner-File-Four-Image/${id}/filefour`;
        return `${IMAGE_BASE}/api/banners/get-banner-slide-image/${id}/${type}`;
    };
    try {
        const res = await fetch(API + "?t=" + Date.now(), { cache: "no-store" });
        if (!res.ok) throw new Error("API failed");
        const data = await res.json();
       
        // Static fallback banners
        const fallbackBanners = [
            "http://localhost:8083/Images/Lab_Test_50.png",
            "http://localhost:8083/Images/First_Aid_fallback.png",
            "http://localhost:8083/Images/IMG/farmasi banner 3rd.jpg",
            "http://localhost:8083/Images/IMG/farmasi banner 4th.jpg"
        ];
       
        const fallbackMainBackground = "http://localhost:8083/Images/IMG/pharmacyBanner11.jpg";
        const fallbackSecondary = "http://localhost:8083/Images/IMG/farmasi banner 8th.jpg";
       
        // TOP CAROUSEL WITH AUTO SCROLL + BUTTONS
        const carousel = document.getElementById('carousel');
        const prevBtn = document.getElementById('prev');
        const nextBtn = document.getElementById('next');
        const dotsContainer = document.getElementById('dotsContainer');
       
        if (carousel && data.bannerFileSlides && data.bannerFileSlides.length > 0) {
            // Use backend images
            const slides = data.bannerFileSlides.map((slide, index) => {
                const url = getImageUrl(slide);
                return url || fallbackBanners[index % fallbackBanners.length];
            });
           
            // Render slides
            carousel.innerHTML = slides.map((src, idx) => `
                <img src="${src}" class="carousel-image w-full flex-shrink-0 rounded-xl" alt="Featured Product ${idx + 1}" onerror="this.src='${fallbackBanners[idx % fallbackBanners.length]}'">
            `).join('');
           
            // Render dots
            if (dotsContainer) {
                dotsContainer.innerHTML = slides.map(() => `
                    <button class="dot w-3 h-3 bg-white rounded-full opacity-50 hover:opacity-100 transition-opacity"></button>
                `).join('');
            }
           
            // Carousel functionality
            let index = 0;
            const slidesCount = slides.length;
            const dots = document.querySelectorAll(".dot");
           
            function showSlide(i) {
                index = (i + slidesCount) % slidesCount; // loop around
                carousel.style.transform = `translateX(-${index * 100}%)`;
               
                // Update dots
                dots.forEach((dot, idx) => {
                    dot.classList.toggle("opacity-100", idx === index);
                    dot.classList.toggle("opacity-50", idx !== index);
                });
            }
           
            // Button click handlers
            if (prevBtn) {
                prevBtn.onclick = () => showSlide(index - 1);
            }
           
            if (nextBtn) {
                nextBtn.onclick = () => showSlide(index + 1);
            }
           
            // Dots click
            dots.forEach((dot, idx) => {
                dot.addEventListener("click", () => showSlide(idx));
            });
           
            // Auto play every 4s
            setInterval(() => showSlide(index + 1), 4000);
           
            // Initialize
            showSlide(0);
        } else {
            // Fallback: Use static carousel
            console.log("No backend banners found, using static carousel");
            if (carousel) {
                carousel.innerHTML = fallbackBanners.map((src, idx) => `
                    <img src="${src}" class="carousel-image w-full flex-shrink-0 rounded-xl" alt="Featured Product ${idx + 1}">
                `).join('');
               
                if (dotsContainer) {
                    dotsContainer.innerHTML = fallbackBanners.map(() => `
                        <button class="dot w-3 h-3 bg-white rounded-full opacity-50 hover:opacity-100 transition-opacity"></button>
                    `).join('');
                }
               
                // Initialize carousel with fallback
                if (typeof initializeCarousel === 'function') {
                    initializeCarousel();
                }
            }
        }
       
        // MAIN BACKGROUND BANNER (filetwo)
        const mainBackgroundImage = document.getElementById('mainBackgroundImage');
        if (mainBackgroundImage && data.bannerFileTwo) {
            const url = getImageUrl(data.bannerFileTwo);
            if (url) {
                mainBackgroundImage.src = url;
                mainBackgroundImage.onerror = function() {
                    this.src = fallbackMainBackground;
                };
            } else {
                mainBackgroundImage.src = fallbackMainBackground;
            }
        } else if (mainBackgroundImage) {
            mainBackgroundImage.src = fallbackMainBackground;
        }
       
        // SECONDARY BANNER (filethree)
        const secondaryBannerImage = document.getElementById('secondaryBannerImage');
        if (secondaryBannerImage && data.bannerFileThree) {
            const url = getImageUrl(data.bannerFileThree);
            if (url) {
                secondaryBannerImage.src = url;
                secondaryBannerImage.onerror = function() {
                    this.src = fallbackSecondary;
                };
            } else {
                secondaryBannerImage.src = fallbackSecondary;
            }
        } else if (secondaryBannerImage) {
            secondaryBannerImage.src = fallbackSecondary;
        }
       
        // EXTRA BANNER (filefour) - if you have one
        const extraBanner = document.getElementById('extraBanner');
        if (extraBanner && data.bannerFileFour) {
            const url = getImageUrl(data.bannerFileFour);
            if (url) {
                extraBanner.src = url;
                extraBanner.onerror = function() {
                    this.src = fallbackSecondary;
                };
            } else {
                extraBanner.src = fallbackSecondary;
            }
        }
       
    } catch (err) {
        console.log("Dynamic banners failed → Using static fallbacks", err);
        // Ensure static banners are loaded on error
        if (typeof renderMainBanner === 'function') renderMainBanner();
        if (typeof renderCarousel === 'function') renderCarousel();
        if (typeof initializeCarousel === 'function') initializeCarousel();
        if (typeof renderSecondaryBanner === 'function') renderSecondaryBanner();
    }
})();


// Sample data for 6 categories (can be fetched from backend)
let categoriesData = [
    { name: "Mother Care", image: "Images/category/mothercare.png", url: "./MotherCare/mother.html"},
    { name: "Baby Care", image: "Images/category/Babycare.png", url: "./BabyCare/baby.html" },             
    { name: "LifeStyle Disorder", image: "Images/category/lifestyle.png", url: "./Medical and HealthCare/LifeStyle/lifestyle.html"},             
    { name: "Fertility Essentials", image: "Images/category/fertility.png", url: "./Medical and HealthCare/Fertility/firtility.html" },            
    { name: "Surgical", image: "Images/category/FIRST AID & EMERGENCY.png", url:  "./Surgical/Surgical.html?sub=dressings-and-bandages" },             
    { name: "Vitamins and Supplements", image: "Images/category/vitamins.png", url: "./Wellness/wellness.html?sub=vitamins-supplements"},             
    { name: "Respiratory Devices", image: "Images/category/respiratory.png", url: "./DEVICES/RESPIRATORY CARE/respiratory.html"},             
   
    { name: "Mobility Aids", image: "Images/category/mobility aids (1).png", url: "./DEVICES/MOBILITY AIDS/mobility.html" },             
    { name: "Monitoring Devices", image: "Images/category/monitoring devices.png", url: "./DEVICES/MONITORING DEVICES/monitor.html" },             
    { name: "Oral Care", image: "Images/category/Oral care.png", url: "./Wellness/wellness.html?sub=oral-care" },             
    { name: "OTC", image: "Images/category/OTC.png", url: "./Medical and HealthCare/OTC/otc.html" },             
   
    { name: "Prescription Based", image: "Images/category/Prescription based.png", url: "./Medical and HealthCare/Prescription/prescription.html" },             
    { name: "Senior Care", image: "Images/category/Senior Care.png", url: "./Wellness/wellness.html?sub=senior-care" },             
    { name: "Skin & Hair", image: "Images/category/skin & hair care.png", url: "./Wellness/wellness.html?sub=hair-skin-care" },             
    { name: "Menstrual Care", image: "Images/category/Menstrual & intimate care.png", url: "./Wellness/wellness.html?sub=menstrual-care" },          
];
// ==================== FIXED createMyntraCard() - ONLY BACKEND IMAGE, NO PLACEHOLDER ====================
// FIXED createMyntraCard() - REMOVED WISHLIST HEART
// function createMyntraCard(p) {
//     const currentPriceNum = Array.isArray(p.price) ? p.price[0] : parseFloat((p.price || '0').toString().replace('₹', '').trim());
//     const originalPriceNum = Array.isArray(p.originalPrice) ? p.originalPrice[0] : (p.originalPrice ? parseFloat((p.originalPrice || '0').toString().replace('₹', '').trim()) : null);
//     const displayPrice = `₹${currentPriceNum.toFixed(2)}`;
//     const displayOriginalPrice = originalPriceNum ? `₹${originalPriceNum.toFixed(2)}` : null;
//     const badgeDiscount = p.discount ? `${p.discount}% off` : '';
//     const rowDiscount = p.discount ? `${p.discount}%` : '';
//     const cleanPriceForCart = currentPriceNum;
//     const backendImageUrl = p.mainImageUrl ? `http://localhost:8083${p.mainImageUrl}` :'https://goodneews.com/Images/product_details_fallback_img.jpg';
//     return `
//         <div class="myntra-card group relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer w-full" 
//      data-category="${p.category || p.subcategory || p.mainCategory || ''}">
//             <!-- Discount Badge -->
//             ${badgeDiscount ? `
//                 <div class="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded  shadow-sm">
//                     ${badgeDiscount}
//                 </div>
//             ` : ''}
//             <!-- Product Image Container -->
//             <div class="relative h-48 overflow-hidden bg-gray-100">
//                 <img src="${backendImageUrl || 'https://goodneews.com/Images/mb-product-fallback.png'}"
//                      alt="${p.name || p.title}"
//                      loading="lazy"
//                      class="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105">
     
//                 ${p.tag === 'new' ? `
//                     <div class="absolute top-3 right-12 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">
//                         NEW
//                     </div>
//                 ` : ''}
//             </div>
//             <!-- Product Info -->
//             <div class="p-4">
//                 <h3 class="myntra-product-name text-gray-800 font-normal text-sm mb-2 line-clamp-2 h-8 leading-tight overflow-hidden">
//                     ${p.name || p.title}
//                 </h3>
//                 ${p.brand ? `
//                     <div class="text-xs text-gray-500 mb-1 font-medium">
//                         ${p.brand}
//                     </div>
//                 ` : ''}
//                 ${p.type ? `
//                     <div class="text-xs text-gray-400 mb-2">
//                         ${p.type}
//                     </div>
//                 ` : ''}
//                 <div class="myntra-price-row flex items-center gap-2 mb-3">
//                     <span class="myntra-current-price text-lg font-bold text-green-600">
//                         ${displayPrice}
//                     </span>
//                     ${displayOriginalPrice ? `
//                         <span class="myntra-original-price text-gray-500 line-through text-sm">
//                             ${displayOriginalPrice}
//                         </span>
//                     ` : ''}
//                     ${rowDiscount ? `
//                         <span class="myntra-current-price text-sm font-bold text-red-600">
//                             ${rowDiscount}
//                         </span>
//                     ` : ''}
//                 </div>
//                 ${p.rating ? `
//                     <div class="flex items-center gap-1 mb-3">
//                         <div class="flex text-yellow-400 text-xs">
//                             ${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5-Math.floor(p.rating))}
//                         </div>
//                         <span class="text-xs text-gray-500">(${p.reviews || 0})</span>
//                     </div>
//                 ` : ''}
                
                
//                  <!-- <button class="add-to-cart-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2.5 rounded-md transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md flex items-center justify-center"
//                         data-product-id="${p.id}"
//                         data-product-name="${p.name || p.title}"
//                         data-product-price="${cleanPriceForCart}"
//                         data-product-image="${backendImageUrl}">
//                     <i class="fas fa-shopping-bag mr-2 text-xs"></i>ADD TO CART
//                 </button> -->
                
//                 <button class="quick-view-btn w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2.5 rounded-md transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
//         data-product-id="${p.id}">
//     Quick View
// </button>
//             </div>
//         </div>
//     `;
// }





function createMyntraCard(p) {
    // Price handling – safely convert to number
    const currentPriceNum = Array.isArray(p.price) 
        ? Number(p.price[0] || 0)
        : Number((p.price || '0').toString().replace('₹', '').trim());

    const originalPriceNum = Array.isArray(p.originalPrice) 
        ? Number(p.originalPrice[0] || 0)
        : Number((p.originalPrice || '0').toString().replace('₹', '').trim()) || null;

    const displayPrice = `₹${currentPriceNum.toFixed(2)}`;
    const displayOriginalPrice = originalPriceNum ? `₹${originalPriceNum.toFixed(2)}` : null;
    const badgeDiscount = p.discount ? `${p.discount}% off` : '';
    const rowDiscount = p.discount ? `${p.discount}%` : '';

    // Use consistent fallback image everywhere
    const FALLBACK_IMAGE = "http://localhost:8083/Images/product_details_fallback_img.jpg";

    // Image URL – prefer backend URL, fallback to our mb fallback image
    const backendImageUrl = p.mainImageUrl 
        ? `http://localhost:8083${p.mainImageUrl}`
        : FALLBACK_IMAGE;

    return `
        <div class="myntra-card group relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer w-full"
             data-category="${p.category || p.subcategory || p.mainCategory || ''}">
            
            <!-- Discount Badge -->
            ${badgeDiscount ? `
                <div class="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded shadow-sm z-10">
                    ${badgeDiscount}
                </div>
            ` : ''}

            <!-- Product Image Container -->
            <div class="relative h-48 overflow-hidden bg-gray-100">
                <img src="${backendImageUrl}"
                     alt="${p.name || p.title || 'Product'}"
                     loading="lazy"
                     class="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                     onerror="this.src='${FALLBACK_IMAGE}'; this.alt='Image not available';">

                ${p.tag === 'new' ? `
                    <div class="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded z-10">
                        NEW
                    </div>
                ` : ''}
            </div>

            <!-- Product Info -->
            <div class="p-4">
                <h3 class="myntra-product-name text-gray-800 font-normal text-sm mb-2 line-clamp-2 h-10 leading-tight overflow-hidden">
                    ${p.name || p.title || 'Unnamed Product'}
                </h3>

                ${p.brand ? `
                    <div class="text-xs text-gray-500 mb-1 font-medium">
                        ${p.brand}
                    </div>
                ` : ''}

                ${p.type ? `
                    <div class="text-xs text-gray-400 mb-2">
                        ${p.type}
                    </div>
                ` : ''}

                <div class="myntra-price-row flex items-center gap-2 mb-3">
                    <span class="myntra-current-price text-lg font-bold text-green-600">
                        ${displayPrice}
                    </span>
                    ${displayOriginalPrice ? `
                        <span class="myntra-original-price text-gray-500 line-through text-sm">
                            ${displayOriginalPrice}
                        </span>
                    ` : ''}
                    ${rowDiscount ? `
                        <span class="text-sm font-bold text-red-600">
                            ${rowDiscount}
                        </span>
                    ` : ''}
                </div>

                ${p.rating ? `
                    <div class="flex items-center gap-1 mb-3">
                        <div class="flex text-yellow-400 text-xs">
                            ${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))}
                        </div>
                        <span class="text-xs text-gray-500">(${p.reviews || 0})</span>
                    </div>
                ` : ''}

                <!-- Quick View Button (uncomment ADD TO CART if needed later) -->
                <button class="quick-view-btn w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2.5 rounded-md transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
                        data-product-id="${p.id}">
                    Quick View
                </button>

                <!-- Uncomment if you want Add to Cart back
                <button class="add-to-cart-btn w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-medium text-sm py-2.5 rounded-md transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md flex items-center justify-center"
                        data-product-id="${p.id}"
                        data-product-name="${p.name || p.title}"
                        data-product-price="${currentPriceNum}"
                        data-product-image="${backendImageUrl}">
                    <i class="fas fa-shopping-bag mr-2 text-xs"></i>ADD TO CART
                </button>
                -->
            </div>
        </div>
    `;
}



function renderMyntraSection(trackId, data) {
    const track = document.getElementById(trackId);
    if (!track) {
        console.error(`Element #${trackId} not found!`);
        return;
    }
    // Clear existing content
    track.innerHTML = '';
    // Add cards directly without extra wrapper divs
    data.forEach(product => {
        const cardHtml = createMyntraCard(product);
        track.innerHTML += cardHtml;
    });
    // Get arrow buttons - FIXED LOGIC
    let prevBtn, nextBtn;
    if (trackId === 'feminine-track') {
        prevBtn = document.getElementById('fem-prev');
        nextBtn = document.getElementById('fem-next');
    } else if (trackId === 'medicine-track') {
        prevBtn = document.getElementById('med-prev');
        nextBtn = document.getElementById('med-next');
    } else {
        // Fallback: try common patterns
        prevBtn = document.querySelector(`[data-track="${trackId}"] .prev-btn`) ||
                  document.querySelector(`#${trackId}-container .prev-btn`);
        nextBtn = document.querySelector(`[data-track="${trackId}"] .next-btn`) ||
                  document.querySelector(`#${trackId}-container .next-btn`);
    }
    const cardWidth = 230; // Card width
    const gap = 16; // Gap between cards
    const scrollAmount = (cardWidth + gap) * 3; // Scroll 3 cards at a time
    if (nextBtn) {
        console.log(`✓ Next button found for ${trackId}:`, nextBtn.id || nextBtn.className);
        nextBtn.onclick = () => {
            console.log(`Scrolling ${trackId} forward by ${scrollAmount}px`);
            track.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        };
    } else {
        console.warn(`✗ Next button not found for ${trackId}. Available buttons:`, {
            'fem-prev': document.getElementById('fem-prev'),
            'fem-next': document.getElementById('fem-next'),
            'med-prev': document.getElementById('med-prev'),
            'med-next': document.getElementById('med-next')
        });
    }
    if (prevBtn) {
        console.log(`✓ Prev button found for ${trackId}:`, prevBtn.id || prevBtn.className);
        prevBtn.onclick = () => {
            console.log(`Scrolling ${trackId} backward by ${scrollAmount}px`);
            track.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        };
    } else {
        console.warn(`✗ Prev button not found for ${trackId}`);
    }
    // Update arrow visibility based on scroll position
    const updateArrows = () => {
        const isAtStart = track.scrollLeft <= 10;
        const isAtEnd = track.scrollWidth - track.clientWidth - track.scrollLeft <= 10;
        if (prevBtn) {
            prevBtn.style.opacity = isAtStart ? '0.4' : '1';
            prevBtn.style.pointerEvents = isAtStart ? 'none' : 'auto';
            prevBtn.disabled = isAtStart;
        }
        if (nextBtn) {
            nextBtn.style.opacity = isAtEnd ? '0.4' : '1';
            nextBtn.style.pointerEvents = isAtEnd ? 'none' : 'auto';
            nextBtn.disabled = isAtEnd;
        }
    };
    // Add scroll event listener
    track.addEventListener('scroll', updateArrows);
    // Initial update
    setTimeout(updateArrows, 100);
    // Also update on window resize
    window.addEventListener('resize', updateArrows);
}
// Toggle wishlist (FIXED VERSION)
function toggleWishlist(product) {
    let wishlist = getWishlist();
    const exists = wishlist.some(item => item.id == product.id);
    if (exists) {
        // Remove from wishlist
        wishlist = wishlist.filter(item => item.id != product.id);
        showToast('Removed from wishlist', 'error');
    } else {
        // Add to wishlist - ENSURE ALL FIELDS ARE SAVED
        const wishlistItem = {
            id: product.id,
            name: product.name || product.title || 'Product',
            price: product.price ? String(product.price).replace('₹', '').trim() : '0',
            originalPrice: product.originalPrice ? String(product.originalPrice).replace('₹', '').trim() : null,
            image: product.image || product.images?.[0] || 'https://via.placeholder.com/300',
            discount: product.discount || null
        };
        wishlist.push(wishlistItem);
        showToast('Added to wishlist!', 'add');
    }
    saveWishlist(wishlist);
    updateWishlistCount();
    updateAllWishlistIcons();
}
// Update wishlist count in header
function updateWishlistCount() {
    const count = getWishlist().length;
    document.querySelectorAll('#desktop-wishlist-count, #mobile-wishlist-count, .wishlist-count, [class*="wishlist-count"]').forEach(el => {
        if (el) {
            el.textContent = count;
            el.style.display = count > 0 ? 'flex' : 'none';
        }
    });
}
// Update all heart icons (red if in wishlist)
function updateAllWishlistIcons() {
    const wishlist = getWishlist();
    const wishlistIds = wishlist.map(item => item.id);
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        const productId = parseInt(btn.dataset.productId || btn.getAttribute('data-product-id'));
        const svg = btn.querySelector('svg');
        if (svg) {
            if (wishlistIds.includes(productId)) {
                svg.classList.add('fill-red-500', 'text-red-500');
                svg.setAttribute('fill', 'currentColor');
            } else {
                svg.classList.remove('fill-red-500', 'text-red-500');
                svg.removeAttribute('fill');
            }
        }
    });
}
// Wishlist click handler for myntra cards
function toggleWishlistItem(id) {
    const product = [...productsData, ...medicinesData].find(p => p.id === id);
    if (product) {
        toggleWishlist(product);
        const btn = document.querySelector(`.myntra-wishlist[data-id="${id}"]`);
        if (btn) {
            btn.classList.toggle('active', isInWishlist(id));
        }
    }
}
// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateWishlistCount();
    updateAllWishlistIcons();
    // Re-check after dynamic content loads
    setTimeout(() => {
        updateAllWishlistIcons();
        updateWishlistCount();
    }, 800);
});
// Sync wishlist across tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'wishlist') {
        updateWishlistCount();
        updateAllWishlistIcons();
    }
});
// Make functions globally accessible
window.getWishlist = getWishlist;
window.toggleWishlist = toggleWishlist;
window.isInWishlist = isInWishlist;
window.toggleWishlistItem = toggleWishlistItem;
function openProductDetails(id) {
    window.location.href = `productdetails.html?id=${id}`;
}

function openProductMbDetails(id) {
    window.location.href = `/MotherCare/mother-product-details.html?id=${id}`;
}
// Sync across tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'cart') updateCartCount();
});
// Make functions global if needed elsewhere
window.openProductDetails = openProductDetails;


window.updateCartCount = updateCartCount;
// Smooth scroll
function scrollSection(containerId, amount) {
    const container = document.getElementById(containerId);
    container.scrollBy({ left: amount, behavior: 'smooth' });
}
// NEW: Dynamic data for Articles (can be fetched from backend)
 let articlesData = [
            {
                id: 1,
                title: "Piles",
                image: "/Images/article/depositphotos_328972250-stock-photo-man-sitting-cactus-white-background.jpg",
                description: "🌼 चुकीच्या आहारामुळे वाढणारी मूळव्याध",
                detailedContent: `
                    <h2 class="text-2xl font-bold mb-4">चुकीच्या आहारामुळे वाढणारी मूळव्याध</h2>
                    <p class="mb-4 text-gray-700">एक दुर्लक्षित  वेदना 
आजच्या धकाधकीच्या जीवनात चुकीच्या आहारपद्धती आणि अयोग्य जीवनशैलीमुळे मूळव्याध हा त्रास झपाट्याने वाढताना दिसतो आहे.
दररोजचे अनियमित खाणे, तिखट-तेलकट पदार्थ, फास्टफूड, कमी पाणी पिण्याची सवय, आणि सर्वात महत्त्वाचे म्हणजे बसून राहण्याची जीवनशैली — ही सगळी कारणे पचनसंस्था विस्कळीत करतात. परिणामी, बद्धकोष्ठता (constipation) निर्माण होते. दीर्घकाळ शौचावरील ताण, शौचास जास्त वेळ बसणे किंवा कठीण शौचामुळे गुदमार्गातील रक्तवाहिन्यांवर ताण येतो. हाच ताण पुढे मूळव्याधीला आमंत्रण देतो.</p>
                    
                    <h3 class="text-xl font-semibold mb-3 text-primary">मूळव्याध म्हणजे गुदमार्गातील सूज आलेल्या रक्तवाहिन्या. या दोन प्रकारच्या असतात —</h3>
                    <ol class="mb-6 list-decimal pl-5 text-gray-700">
  <li class="mb-2">
    आंतर मूळव्याध (Internal piles) : गुदमार्गाच्या आत तयार होणाऱ्या गाठी, ज्यातून बहुतेकदा रक्तस्राव होतो पण वेदना नसतात.
  </li>
  <li class="mb-2">
    बाह्य मूळव्याध (External piles) : गुदमार्गाच्या बाहेरील भागात होणाऱ्या गाठी, ज्या वेदनादायक आणि कधी कधी संसर्गजन्य असतात.
  </li>
</ol>

                    
                    <h3 class="text-xl font-semibold mb-3 text-primary">या आजाराचे चार ग्रेड्स असतात —</h3>
                    <ul class="mb-6 list-disc pl-5 text-gray-700">
                       <li class="mb-2"><strong>पहिला ग्रेड: </strong> फक्त रक्तस्राव, गाठ बाहेर येत नाही.</li>
                        <li class="mb-2"><strong>दुसरा ग्रेड:</strong> शौचावेळी गाठ बाहेर येते पण आपोआप आत जाते.</li>
                        <li class="mb-2"><strong>तिसरा ग्रेड:</strong> गाठ बाहेर आल्यावर हाताने ढकलून आत न्यावी लागते.</li>
                        <li class="mb-2"><strong>चौथा ग्रेड:</strong> गाठ कायम बाहेर राहते आणि सतत वेदना व रक्तस्राव होतो.</li>
                      
                    </ul>
                    
                    <p class="text-gray-700 mb-6">सुरुवातीच्या टप्प्यात लोक ही समस्या लाजेमुळे, व्यस्ततेमुळे किंवा “काही दिवसांत ठीक होईल” या विचाराने दुर्लक्षित करतात. पण या दुर्लक्षाचे परिणाम गंभीर ठरू शकतात. सतत रक्तस्राव झाल्यास रक्ताल्पता (anemia) निर्माण होते, वेदना वाढतात, आणि जीवनाची गुणवत्ता खालावते.</p>
                     <p class="text-gray-700 mb-6">अनेकदा औषधोपचार किंवा मलमाने आराम मिळतो, पण दीर्घकाळ चालू राहिलेल्या मूळव्याधीसाठी शस्त्रक्रिया (surgery) आवश्यक ठरते. आधुनिक काळात लेसर आणि स्टेपलर सारख्या शस्त्रक्रिया पद्धतींमुळे उपचार अगदी सोपे, कमी वेदनादायक आणि जलद बरे होणारे झाले आहेत. रुग्ण काही दिवसांत पुन्हा आपल्या दैनंदिन आयुष्यात परतू शकतो.</p>
                      <p class="text-gray-700 mb-6">मूळव्याध ही फक्त शारीरिक वेदना नसून मानसिक ताणाचं कारणही ठरते. “हे सांगावं का?” “लोक काय म्हणतील?” अशा विचारांनी रुग्ण शांतपणे सहन करतो. पण लक्षात ठेवा — शरीराचा प्रत्येक संकेत काहीतरी सांगतो. त्याकडे दुर्लक्ष न करता वेळेवर तज्ज्ञांचा सल्ला घेतल्यास मोठा त्रास टाळता येऊ शकतो.</p>
                    
                `,
                
            },
            {
                id: 2,
                title: "Breast health",
                image: "/Images/article/Breast-Cancer-Symptoms.jpg",
                description: "Do not ignore breast symptoms. Consult early.",
                detailedContent: `
                    <h2 class="text-2xl font-bold mb-4">Why You Should Not Ignore a Lump or Pain in the Breast</h2>
                    <p class="mb-4 text-gray-700">Many women ignore breast lumps or pain thinking it is due to periods, stress, or minor infection. This delay can be harmful. Any change in the breast should be checked by a doctor.</p>
                    
                   
                    
                    <h3 class="text-xl font-semibold mb-3 text-primary">Common Signs You Should Not Ignore</h3>
                    <ul class="mb-6 list-disc pl-5 text-gray-700">
                        <li class="mb-2"><strong></strong> Lump in the breast or underarm</li>
                        <li class="mb-2"><strong></strong> Continuous or increasing breast pain</li>
                        <li class="mb-2"><strong></strong> Change in size or shape of the breast</li>
                        <li class="mb-2"><strong></strong> Redness, skin thickening, or nipple changes</li>
                        <li class="mb-2"><strong></strong> Nipple discharge, especially blood-stained</li>
                    </ul>

                    <h3 class="text-xl font-semibold mb-3 text-primary">Not All Lumps Are Cancer</h3>
                    <p class="mb-4 text-gray-700">Most breast lumps are non-cancerous. However, only a doctor can confirm this. Early check-up often gives reassurance and avoids unnecessary fear.</p>
                    
                    <h3 class="text-xl font-semibold mb-3 text-primary">Why Early Check-up Is Important</h3>
                    <ul class="mb-6 list-disc pl-5 text-gray-700">
                        <li class="mb-2">Early problems need simple treatment</li>
                        <li class="mb-2">Serious diseases can be caught early</li>
                        <li class="mb-2">Chances of recovery are much better</li>
                        <li class="mb-2">Major surgery can often be avoidedPractice deep breathing exercises during stressful moments</li>
                        
                    </ul>

                    <h3 class="text-xl font-semibold mb-3 text-primary">When to See a Doctor</h3>
                    <ul class="mb-6 list-disc pl-5 text-gray-700">
                        <li class="mb-2"><strong></strong> Lump does not reduce after periods</li>
                        <li class="mb-2"><strong></strong> Pain is persistent or worsening</li>
                        <li class="mb-2"><strong></strong> Any sudden change in breast appearance</li>
                        
                    </ul>
                    
                    <p class="text-gray-700">Remember
Early consultation does not mean surgery. It means safety, clarity, and peace of mind.
👉 Do not ignore breast symptoms. Consult early.</p>
                `,
               
            },
            {
                id: 3,
                title: "High Risk Pregnancy",
                image: "/Images/article/High-Risk-Pregnancy-Dr-Shivanjali-Nayak-Gynacologist-Kolkata-2.jpg",
                description: "Discover High Risk Pregnancy",
                detailedContent: `
                    <h2 class="text-2xl font-bold mb-4">High-Risk Pregnancy: Causes, Care & Outcomes</h2>
                    <p class="mb-4 text-gray-700">A pregnancy is called high-risk when the mother or baby needs extra medical attention to stay healthy. With proper care, most high-risk pregnancies have good outcomes.</p>
                    
                    <h3 class="text-xl font-semibold mb-3 text-primary">Common Causes of High-Risk Pregnancy</h3>
                    <ul class="mb-6 list-disc pl-5 text-gray-700">
                        <li class="mb-2"><strong></strong> High blood pressure or diabetes</li>
                        <li class="mb-2"><strong></strong> Anemia or thyroid problems</li>
                        <li class="mb-2"><strong></strong> Previous cesarean or pregnancy complications</li>
                        <li class="mb-2"><strong></strong> Multiple pregnancy (twins or more)</li>
                        <li class="mb-2"><strong></strong> Age below 18 or above 35 years</li>
                        <li class="mb-2"><strong></strong> Heart disease or other medical illnesses</li>
                        <li class="mb-2"><strong></strong> Care During High-Risk Pregnancy</li>
                        <li class="mb-2"><strong></strong> High-risk pregnancy does not mean something will go wrong. It means closer monitoring.</li>
                    </ul>
                    
                    <h3 class="text-xl font-semibold mb-3 text-primary">Care includes:</h3>
                    <ul class="mb-6 list-disc pl-5 text-gray-700">
                        <li class="mb-2"><strong>Mood Enhancement:</strong> Regular antenatal check-ups</li>
                        <li class="mb-2"><strong>Stress Reduction:</strong> Blood tests and timely scans</li>
                        <li class="mb-2"><strong>Cognitive Function:</strong> Strict control of BP, sugar, and hemoglobin</li>
                        <li class="mb-2"><strong>Self-Confidence:</strong> Proper medicines, diet, and rest</li>
                        <li class="mb-2"><strong></strong> Advice on warning signs</li>
                        <li class="mb-2"><strong></strong> Outcomes</li>
                    </ul>
                    
                    <h3 class="text-xl font-semibold mb-3 text-primary">With early diagnosis and proper care:</h3>
                    <ul class="mb-6 list-disc pl-5 text-gray-700">
                        <li class="mb-2">Most mothers deliver safely</li>
                        <li class="mb-2">Many women have normal deliveries</li>
                        <li class="mb-2">Complications can be prevented or managed early</li>
                        <li class="mb-2">Mother and baby remain healthy</li>
                       
                    </ul>
                    
                    <p class="text-gray-700">Important Message
High-risk pregnancy needs care, not fear. Early consultation and regular follow-up make a big difference.
👉 Consult early. Follow advice. Deliver safely.</p>
                `,
             
            },
            {
                id: 4,
                title: "Menstrual Irregularities",
                image: "/Images/article/1000642378.png",
                description: "When to Seek Medical Help Menstrual cycles may vary from woman to woman.",
                detailedContent: `
                    
                    <p class="mb-4 text-gray-700">When to Seek Medical Help Menstrual cycles may vary from woman to woman. However, frequent or sudden changes in periods should not be ignored.</p>
                    
                    <h3 class="text-xl font-semibold mb-3 text-primary">Common Menstrual Problems</h3>
                    <ul class="mb-6 list-disc pl-5 text-gray-700">
                        <li class="mb-2"><strong></strong>Periods coming too early or too late.</li>
                        <li class="mb-2"><strong></strong> Very heavy or very scanty bleeding</li>
                        <li class="mb-2"><strong></strong>Bleeding between periods</li>
                        <li class="mb-2"><strong></strong>Severe pain during periods</li>
                        <li class="mb-2"><strong></strong>Missed periods not due to pregnancy</li>
                    </ul>
                    
                    <h3 class="text-xl font-semibold mb-3 text-primary">When Should You See a Doctor?</h3>
                    <ul class="mb-6 list-disc pl-5 text-gray-700">
                        <li class="mb-2"><strong>Seek medical help if:</strong></li>
                        <li class="mb-2"><strong></strong>Periods are irregular for more than 3 months</li>
                        <li class="mb-2"><strong></strong>Bleeding is very heavy or lasts more than 7 days</li>
                        <li class="mb-2"><strong></strong>You need to change pads every 1–2 hours</li>
                        <li class="mb-2"><strong></strong>Period pain affects daily activities</li>
                        <li class="mb-2"><strong></strong>Periods stop suddenly</li>
                        <li class="mb-2"><strong></strong>Periods are irregular for more than 3 months</li>
                    </ul>
                    
                    <h3 class="text-xl font-semibold mb-3 text-primary">Why Early Check-up Is Important</h3>
                    
                    
                    <p class="text-gray-700">Menstrual irregularities may be due to hormonal imbalance, PCOS, thyroid problems, stress, or uterine conditions. Early diagnosis allows simple and effective treatment.</p>
                    
                `,
            },
            {
                id: 5,
                title: "Self medication during pregnancy",
                image: "/Images/article/pregnant_woman_taking_medicine-1200x628-facebook.jpg",
                description: "Always consult your doctor before taking any medicine during pregnancy.",
                detailedContent: `
                    <h2 class="text-2xl font-bold mb-4">Why You Should Never Self-Medicate During Pregnancy</h2>
                    <p class="mb-4 text-gray-700">During pregnancy, everything a mother takes can affect the growing baby. Medicines that seem safe can sometimes be harmful in pregnancy.</p>
                    
                    <h3 class="text-xl font-semibold mb-3 text-primary">Why Self-Medication Is Risky</h3>
                    <ul class="mb-6 list-disc pl-5 text-gray-700">
                        <li class="mb-2"><strong></strong>Some medicines can affect baby’s growth</li>
                        <li class="mb-2"><strong></strong>Wrong dose can cause complications</li>
                        <li class="mb-2"><strong></strong>Certain drugs may lead to birth defects or premature delivery</li>
                        <li class="mb-2"><strong></strong>Herbal and over-the-counter medicines are not always safe</li>
                        
                    </ul>
                    
                    <h3 class="text-xl font-semibold mb-3 text-primary">Common Mistakes</h3>
                    <ul class="mb-6 list-disc pl-5 text-gray-700">
                        <li class="mb-2"><strong></strong> Taking painkillers without advice</li>
                        <li class="mb-2"><strong></strong> Using old prescriptions</li>
                        <li class="mb-2"><strong></strong> Taking home remedies or herbal medicines without guidance</li>
                        <li class="mb-2"><strong></strong> Stopping or changing prescribed medicines on your own</li>
                    </ul>
                    
                    <h3 class="text-xl font-semibold mb-3 text-primary">What You Should Do</h3>
                    <ul class="mb-6 list-disc pl-5 text-gray-700">
                        <li class="mb-2">Take medicines only prescribed by your doctor</li>
                        <li class="mb-2">Inform your doctor about all medicines and supplements you take</li>
                        <li class="mb-2">Consult before taking any tablet, syrup, or herbal product</li>
                       
                    </ul>
                    
                    <p class="text-gray-700">Remember
Self-medication may look harmless but can be dangerous for mother and baby.</p>
                `,
                
            }
        ];

// NEW: Dynamic data for Footer (can be fetched from backend)
let footerData = {
    company: {
        name: "MediCare Pharmacy",
        description: "Your trusted source for quality medications and health products."
    },
    quickLinks: [
        { text: "Home", link: "#" },
        { text: "Shop", link: "#" },
        { text: "About Us", link: "#" },
        { text: "Contact", link: "#" }
    ],
    contact: {
        email: "support@medicarepharmacy.com",
        phone: "(123) 456-7890",
        social: [
            { icon: "fab fa-facebook-f", link: "#" },
            { icon: "fab fa-twitter", link: "#" },
            { icon: "fab fa-instagram", link: "#" }
        ]
    },
    copyright: "&copy; 2025 MediCare Pharmacy. All rights reserved."
};
// Function to show product details by redirecting to productDetails.html
function showProductDetails(product) {
    // Encode product data to pass as query parameters
    const queryParams = new URLSearchParams({
        id: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        originalPrice: product.originalPrice,
        discount: product.discount,
        description: product.description
    }).toString();
    // Redirect to productDetails.html with query parameters
    window.location.href = `productdetails.html?${queryParams}`;
}
// Function to add product to cart
function addToCart(product, button) {
    // Show success feedback
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check mr-2"></i>Added';
    button.classList.add('added');
    // Reset button after animation
    setTimeout(() => {
        button.innerHTML = originalText;
        button.classList.remove('added');
    }, 1500);
    // In a real app, you would add to cart logic here
    console.log(`Added to cart: ${product.name}`);
}


// DOM elements
const categoryContainer = document.getElementById('categoryContainer');
const scrollIndicator = document.getElementById('scrollIndicator');
// Function to render categories dynamically
// function renderCategories(categories) {
//     if (!categoryContainer) return;
//     categoryContainer.innerHTML = ''; // Clear existing content
//     categories.forEach((category, index) => {
//         const card = document.createElement('div');
//         card.className = 'flex-shrink-0 w-40 h-40 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-110 hover:shadow-xl bg-white shadow-md overflow-hidden group animate-fade-in';
//         card.style.animationDelay = `${index * 0.1}s`;
//         card.innerHTML = `
//             <div class="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-blue-50">
//                 <img src="${category.image}" alt="${category.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
//             </div>
//             <div class="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//                 <p class="text-white font-semibold text-center text-sm px-2">${category.name}</p>
//             </div>
//         `;
//         // Add click event to redirect to category page
//         card.addEventListener('click', (event) => {
//             redirectToCategory(category, event);
//         });
//         // Add active class to clicked category
//         card.classList.add('category-item');
//         categoryContainer.appendChild(card);
//         console.log(`Selected category: ${category.name}`);
//     });
//     // Add indicator dots
//     addScrollIndicators();
// }


// Simplified renderCategories with proper indicator alignment
function renderCategories(categories) {
    if (!categoryContainer) return;
    
    // Keep original classes
    categoryContainer.className = 'category-scroll flex overflow-x-auto py-6 px-2 gap-8 scroll-smooth';
    
    categoryContainer.innerHTML = '';
    
    categories.forEach((category, index) => {
        const card = document.createElement('div');
        card.className = 'flex-shrink-0 w-40 h-40 relative rounded-full cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-xl bg-white shadow-md overflow-hidden group animate-fade-in';
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.innerHTML = `
            <div class="w-full h-full rounded-full overflow-hidden">
                <img src="${category.image}" alt="${category.name}" 
                     class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
            </div>
            <div class="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
                <p class="text-white font-semibold text-center text-sm px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full">
                    ${category.name}
                </p>
            </div>
        `;
        
        card.addEventListener('click', (event) => {
            event.currentTarget.classList.add('ring-4', 'ring-blue-400', 'ring-opacity-70');
            setTimeout(() => {
                if (category.url) window.location.href = category.url;
            }, 200);
        });
        
        categoryContainer.appendChild(card);
    });
    
    // Simple indicator dots (1 per 3 cards)
    if (scrollIndicator) {
        scrollIndicator.innerHTML = '';
        const totalIndicators = Math.ceil(categories.length / 3);
        
        for (let i = 0; i < totalIndicators; i++) {
            const dot = document.createElement('div');
            dot.className = `h-2 w-2 rounded-full mx-1 cursor-pointer transition-all duration-300 ${
                i === 0 ? 'bg-blue-500 w-6' : 'bg-gray-300'
            }`;
            dot.addEventListener('click', () => {
                const scrollPosition = i * 3 * (160 + 32); // 3 cards at a time
                categoryContainer.scrollTo({
                    left: scrollPosition,
                    behavior: 'smooth'
                });
            });
            scrollIndicator.appendChild(dot);
        }
    }
}

// Scroll buttons
document.getElementById('scrollLeft')?.addEventListener('click', () => {
    categoryContainer.scrollBy({ left: -500, behavior: 'smooth' });
});

document.getElementById('scrollRight')?.addEventListener('click', () => {
    categoryContainer.scrollBy({ left: 500, behavior: 'smooth' });
});

// Hide scrollbar CSS
const style = document.createElement('style');
style.textContent = `
    .category-scroll {
        scrollbar-width: none;
        -ms-overflow-style: none;
    }
    .category-scroll::-webkit-scrollbar {
        display: none;
    }
    
    /* Fix layout issues */
    #categoryContainer {
        min-height: 200px;
    }
    
    #scrollIndicator {
        display: flex;
        justify-content: center;
        margin-top: 2rem;
        padding: 0.5rem 0;
    }
    
    /* Ensure arrows are visible */
    #scrollLeft, #scrollRight {
        z-index: 10;
    }
`;
document.head.appendChild(style);

// Function to handle category redirection
function redirectToCategory(category, event) {
    const card = event.currentTarget;
    // Optional: Add loading state or animation
    card.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-50');
    // Optional: Add a small delay for better UX
    setTimeout(() => {
        if(category.url) {
            window.location.href = category.url;
        } else {
            console.warn(`No URL defined for category: ${category.name}`);
        }
    }, 300);
}
// For Single Page Applications (SPA approach)
function navigateToCategory(category) {
    // Update browser history
    history.pushState({}, '', category.url);
    // Update page content dynamically
    loadCategoryContent(category);
}
// Function to load category content (for SPAs)
function loadCategoryContent(category) {
    // This would typically make an API call or load content dynamically
    console.log(`Loading content for: ${category.name}`);
    // Example: Update page title and content
    document.title = `${category.name} - Health Store`;
    // You would update the main content area here
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="container mx-auto px-4 py-8">
                <h1 class="text-3xl font-bold mb-6">${category.name}</h1>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Category products would be loaded here -->
                    <div class="bg-white p-4 rounded-lg shadow">
                        <p>Products for ${category.name} would appear here</p>
                    </div>
                </div>
            </div>
        `;
    }
}
// Add scroll indicators
function addScrollIndicators() {
    if (!scrollIndicator) return;
    scrollIndicator.innerHTML = '';
    const dotsCount = Math.ceil(categoriesData.length / 4);
    for (let i = 0; i < dotsCount; i++) {
        const dot = document.createElement('div');
        dot.className = `w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${i === 0 ? 'bg-blue-500' : 'bg-gray-300'}`;
        dot.addEventListener('click', () => {
            scrollToSection(i);
        });
        scrollIndicator.appendChild(dot);
    }
}
// Scroll to specific section
function scrollToSection(sectionIndex) {
    if (!categoryContainer) return;
    const scrollWidth = categoryContainer.scrollWidth;
    const sectionWidth = scrollWidth / Math.ceil(categoriesData.length / 4);
    categoryContainer.scrollTo({
        left: sectionWidth * sectionIndex,
        behavior: 'smooth'
    });
    updateActiveIndicator();
}
// Auto-scroll functionality
let autoScrollInterval;
function startAutoScroll() {
    if (!categoryContainer) return;
    autoScrollInterval = setInterval(() => {
        const scrollLeft = categoryContainer.scrollLeft;
        const scrollWidth = categoryContainer.scrollWidth - categoryContainer.clientWidth;
        if (scrollLeft >= scrollWidth - 10) {
            categoryContainer.scrollTo({
                left: 0,
                behavior: 'smooth'
            });
        } else {
            categoryContainer.scrollBy({
                left: 300,
                behavior: 'smooth'
            });
        }
    }, 4000);
}
function stopAutoScroll() {
    clearInterval(autoScrollInterval);
}
// Update active indicator based on scroll position
function updateActiveIndicator() {
    if (!categoryContainer || !scrollIndicator) return;
    const scrollLeft = categoryContainer.scrollLeft;
    const scrollWidth = categoryContainer.scrollWidth;
    const sectionWidth = scrollWidth / Math.ceil(categoriesData.length / 4);
    const activeSection = Math.floor(scrollLeft / sectionWidth);
    document.querySelectorAll('#scrollIndicator > div').forEach((dot, index) => {
        if (index === activeSection) {
            dot.classList.remove('bg-gray-300');
            dot.classList.add('bg-blue-500');
        } else {
            dot.classList.remove('bg-blue-500');
            dot.classList.add('bg-gray-300');
        }
    });
}
// Event listeners for category container
if (categoryContainer) {
    categoryContainer.addEventListener('mouseenter', stopAutoScroll);
    categoryContainer.addEventListener('mouseleave', startAutoScroll);
    categoryContainer.addEventListener('scroll', updateActiveIndicator);
}
// Initialize
renderCategories(categoriesData);
startAutoScroll();
// ===========================================
// FINAL WORKING CODE – NO MORE ERRORS!
// ===========================================
// GLOBAL: Render any product grid (used by both sections)
function renderProductGrid(containerId, productsArray) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container #${containerId} not found!`);
        return;
    }
    container.innerHTML = ''; // Clear
    productsArray.forEach(product => {
        const card = document.createElement('div');
        card.className = 'bg-red rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300';
        card.innerHTML = `
            <div class="relative group">
                <div class="absolute top-2 left-2 bg-red-500 text-white text-xs px-1 py-1 rounded ">
                    ${product.discount}
                </div>
                <img src="${product.image || 'http://localhost:8083/Images/product_details_fallback_img.jpg'}" alt="${product.name}"
                     class="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <!-- Quick view button removed for simplicity -->
                </div>
            </div>
            <div class="p-5">
                <h3 class="font-semibold text-md text-center mb-2 line-clamp-2">${product.name}</h3>
                <div class="flex items-center justify-center gap-3 mb-2">
                    <span class="text-xl font-bold text-green-600">${product.price}</span>
                    <span class="text-gray-500 line-through">${product.originalPrice}</span>
                </div>
                <div class="flex gap-3">
                    <button onclick="openProductDetails(${product.id})"
                            class="flex-1 bg-blue-600 text-white py-1 rounded-lg hover:bg-blue-700 transition font-medium">
                        View Details
                    </button>
                    <button class="add-to-cart-btn bg-teal-600 text-white px-6 py-1 rounded-lg hover:bg-teal-700 transition font-bold"
                            data-product-id="${product.id}"
                            data-product-name="${product.name}"
                            data-product-price="${product.price.replace('₹', '')}"
                            data-product-image="${product.image}">
                        Add
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}
// Setup scroll buttons - FIXED VERSION
function setupScrollButtons() {
    const scrollContainer = document.getElementById('productGrid');
    const scrollLeft = document.getElementById('scrollLeft');
    const scrollRight = document.getElementById('scrollRight');
    if (scrollLeft && scrollRight && scrollContainer) {
        scrollLeft.addEventListener('click', () => {
            scrollContainer.scrollBy({ left: -300, behavior: 'smooth' });
        });
        scrollRight.addEventListener('click', () => {
            scrollContainer.scrollBy({ left: 300, behavior: 'smooth' });
        });
        // Show/hide scroll buttons based on scroll position
        const updateScrollButtons = () => {
            const isAtStart = scrollContainer.scrollLeft <= 10;
            const isAtEnd = scrollContainer.scrollLeft >=
                scrollContainer.scrollWidth - scrollContainer.clientWidth - 10;
  
            scrollLeft.style.opacity = isAtStart ? '0.5' : '1';
            scrollLeft.style.pointerEvents = isAtStart ? 'none' : 'auto';
  
            scrollRight.style.opacity = isAtEnd ? '0.5' : '1';
            scrollRight.style.pointerEvents = isAtEnd ? 'none' : 'auto';
        };
        scrollContainer.addEventListener('scroll', updateScrollButtons);
        updateScrollButtons();
    }
}
function renderMedicines(medicines) {
    const grid = document.getElementById('medicineGrid');
    if (!grid) return;
    grid.innerHTML = ''; // Clear existing content
    medicines.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card bg-white rounded-lg p-4 text-center shadow-md hover:shadow-lg transition-all duration-300 min-w-[250px] flex flex-col';
        card.innerHTML = `
            <div class="relative mb-3">
                <div class="absolute top-2 right-2">
                    <button class="wishlist-icon bg-white p-2 rounded-full shadow-md text-gray-400 hover:text-red-500">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <img src="${product.image}" alt="${product.name}" class="w-full h-40 object-contain rounded-md mb-2">
            </div>
            <div class="flex-1 flex flex-col">
                <h3 class="text-sm font-semibold text-gray-800 mb-2">${product.name}</h3>
                <div class="mt-auto">
                    <div class="flex items-center justify-center mb-2">
                        <span class="text-lg font-bold text-gray-900">${product.price}</span>
                        <span class="text-sm text-gray-500 line-through ml-2">${product.originalPrice}</span>
                        <span class="text-sm font-semibold text-green-600 ml-2">${product.discount}</span>
                    </div>
                    <button class="view-details-btn w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
                        <i class="fas fa-info-circle mr-2"></i>View Details
                    </button>
                </div>
            </div>
        `;
        card.addEventListener('click', (e) => {
            // Prevent opening details if clicking on wishlist button
            if (e.target.closest('.wishlist-icon')) {
                return;
            }
            showProductDetails(product);
        });
        grid.appendChild(card);
    });
    // Scroll functionality for medicines
    const scrollContainer = document.getElementById('medicineGrid');
    const scrollLeft = document.getElementById('medScrollLeft');
    const scrollRight = document.getElementById('medScrollRight');
    if (scrollLeft && scrollRight && scrollContainer) {
        scrollLeft.addEventListener('click', () => {
            scrollContainer.scrollLeft -= 300;
        });
        scrollRight.addEventListener('click', () => {
            scrollContainer.scrollLeft += 300;
        });
    }
}
// NEW: Function to render Doctor Section dynamically
const doctorData = [
    {
        name: "Dr. Rahul Gandhi",
        title: "MBBS, MD - Obstetrics & Gynaecology",
        description: "With over 15 years of experience in Obstetrics & Gynaecology, Dr. Rahul Gandhi specializes in high-risk pregnancies, infertility treatments, and minimally invasive gynecological surgeries. He is known for his compassionate approach and commitment to patient-centered care.",
        image: "https://i.pinimg.com/1200x/5b/43/51/5b4351ad9cbfb15fe0e586f4df121e6.jpg",
        backgroundImage: "https://i.pinimg.com/1200x/61/6c/88/616c8812ef9bfb6f9d2ba5d759543396.jpg",
        achievements: "National Excellence Award, Best Doctor Award",
        association: "Indian Medical Association (IMA)"
    }
];
function renderDoctorSection(doctors) {
    const section = document.getElementById('doctorSection');
    if (!section || doctors.length === 0) return;
    const doctor = doctors[0]; // Render first doctor; extend for multiple if needed
    section.innerHTML = `
        <div class="absolute inset-0">
            <img src="${doctor.backgroundImage}"
                 alt="Background"
                 class="w-full h-[620px] object-cover">
            <div class="absolute inset-0 bg-white/10"></div> <!-- Light overlay -->
        </div>
        <!-- Merged Card -->
        <div class="relative w-full py-8 px-8 lg:px-12">
            <div class="max-w-8xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden grid md:grid-cols-2">
                <!-- Doctor Image (Left side) -->
                <div class="h-[550px]">
                    <img src="${doctor.image}"
                         alt="${doctor.name}"
                         class="w-full h-full object-cover">
                </div>
                <!-- About Content (Right side) -->
                <div class="p-8 flex flex-col justify-between">
                    <div>
                        <h1 class="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                            Meet ${doctor.name}
                        </h1>
             
                        <h2 class="text-2xl font-semibold text-gray-800 mb-3">
                            ${doctor.title}
                        </h2>
             
                        <p class="text-[17px] text-gray-800 mb-4 leading-relaxed">
                            ${doctor.description.split('.')[0]} <!-- First sentence for experience -->
                        </p>
             
                        <p class="text-[17px] text-gray-800 mb-4 leading-relaxed">
                            Recipient of <span class="font-semibold">${doctor.achievements.split(',')[1]}</span> for excellence in infertility management, Dr. Gandhi combines advanced medical expertise with compassion, ensuring safe and personalized care for every patient.
                        </p>
             
                        <p class="text-[17px] text-gray-700 mb-4 leading-relaxed">
                            An active member of the <span class="font-semibold">${doctor.association}</span>, he regularly updates his knowledge through seminars, workshops, and conferences. Dr. Gandhi's patient-centered approach helps individuals navigate complex pregnancies with confidence and peace of mind.
                        </p>
                    </div>
                    <div class="mt-6 w-20 h-1 bg-pink-500"></div>
                </div>
            </div>
        </div>
    `;
}
// Function to render Articles Section dynamically with responsive design
         function renderArticlesSection(articles) {
            const section = document.getElementById('articlesSection');
            if (!section) return;
            
            // Split articles into first 3 and remaining 2
            const firstRowArticles = articles.slice(0, 3);
            const secondRowArticles = articles.slice(3);
            
            section.innerHTML = `
                <h2 class="text-2xl sm:text-2xl md:text-2xl font-bold text-center mb-8 sm:mb-10 md:mb-12 text-gray-800">Health & Wellness Articles</h2>
                
                <!-- First Row - 3 columns -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-4 sm:px-0 mb-8 md:mb-12">
                    ${firstRowArticles.map(article => `
                        <div class="article-card bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full border border-gray-100">
                            <div class="relative pt-6 px-6">
                                <img src="${article.image}" alt="${article.title}" 
                                     class="w-full h-40 sm:h-56 md:h-64 object-contain">
                            </div>
                            <div class="p-6 flex-grow flex flex-col">
                                <h3 class="text-lg md:text-2xl font-bold mb-3 text-gray-800 line-clamp-2">${article.title}</h3>
                                <p class="text-gray-600 mb-6 text-base md:text-lg flex-grow line-clamp-3">${article.description}</p>
                                <div class="mt-auto pt-4">
                                    <button 
                                        onclick="openArticleOverlay(${article.id})" 
                                        class="read-more-btn bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center w-full transition duration-300 transform hover:scale-[1.02]"
                                    >
                                        Read More
                                        <i class="fas fa-arrow-right ml-3 text-sm"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Second Row - 2 columns only for desktop -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8 px-4 sm:px-0 mb-8 md:mb-12">
                    ${secondRowArticles.map(article => `
                        <div class="article-card bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full border border-gray-100">
                           <div class="relative pt-6 px-6">
                                <div class="md:w-6/5 p-6 flex items-center justify-center bg-gray-50">
                                    <img src="${article.image}" alt="${article.title}"
                                         class="w-full h-48 sm:h-56 md:h-64 object-contain text-center">
                                </div>
                                <div class="p-6 flex-grow flex flex-col">
                                    <h3 class="text-lg md:text-2xl font-bold mb-3 text-gray-800 line-clamp-2">${article.title}</h3>
                                    <p class="text-gray-600 mb-6 text-base md:text-lg flex-grow line-clamp-3">${article.description}</p>
                                    <div class="mt-auto pt-4">
                                        <button 
                                            onclick="openArticleOverlay(${article.id})" 
                                            class="read-more-btn bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center w-full transition duration-300 transform hover:scale-[1.02]"
                                        >
                                            Read More
                                            <i class="fas fa-arrow-right ml-3 text-sm"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                
            `;
        }


        // Function to open article overlay with detailed content
        function openArticleOverlay(articleId) {
            const article = articlesData.find(a => a.id === articleId);
            if (!article) return;
            
            const overlay = document.getElementById('articleOverlay');
            const overlayContent = document.getElementById('overlayContent');
            
            overlayContent.innerHTML = `
                <div class="relative">
                    <div class="h-40 sm:h-48 md:h-64 lg:h-72 overflow-hidden">
                        <img src="${article.image}" alt="${article.title}" 
                             class="w-full h-full object-contain mt-8">
                        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-20"></div>
                    </div>
                    <div class="p-4 sm:p-6 md:p-8">
                        <div class="flex flex-wrap items-center mb-4 sm:mb-6 text-xs sm:text-sm text-gray-500">
                        </div>
                        
                        <h1 class="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">${article.title}</h1>
                        
                        <div class="prose max-w-none text-gray-700">
                            ${article.detailedContent}
                        </div>
                        
                        
                    </div>
                </div>
            `;
            
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        // Function to close the overlay
        function closeOverlay() {
            const overlay = document.getElementById('articleOverlay');
            overlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }

         // Initialize the page
        document.addEventListener('DOMContentLoaded', function() {
            // Render articles
            renderArticlesSection(articlesData);
            
            // Add event listeners for overlay close button
            document.getElementById('closeOverlay').addEventListener('click', closeOverlay);
            
            // Close overlay when clicking outside content
            document.getElementById('articleOverlay').addEventListener('click', function(e) {
                if (e.target === this) {
                    closeOverlay();
                }
            });
            
            // Close overlay with Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    closeOverlay();
                }
            });
            
            // Handle window resize for responsive adjustments
            window.addEventListener('resize', function() {
                // Re-render articles on resize to ensure proper layout
                renderArticlesSection(articlesData);
            });
        });
        
        // Expose functions to global scope for onclick handlers
        window.openArticleOverlay = openArticleOverlay;
        window.closeOverlay = closeOverlay;


// NEW: Function to render Footer dynamically
function renderFooter(footer) {
    const section = document.getElementById('footerSection');
    if (!section) return;
    const { company, quickLinks, contact, copyright } = footer;
    section.innerHTML = `
        <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <h3 class="text-lg font-semibold mb-4">${company.name}</h3>
                    <p class="text-gray-300">${company.description}</p>
                </div>
                <div>
                    <h3 class="text-lg font-semibold mb-4">Quick Links</h3>
                    <ul class="space-y-2">
                        ${quickLinks.map(link => `<li><a href="${link.link}" class="text-gray-300 hover:text-primary">${link.text}</a></li>`).join('')}
                    </ul>
                </div>
                <div>
                    <h3 class="text-lg font-semibold mb-4">Contact Us</h3>
                    <p class="text-gray-300">Email: ${contact.email}</p>
                    <p class="text-gray-300">Phone: ${contact.phone}</p>
                    <div class="flex space-x-4 mt-4">
                        ${contact.social.map(social => `<a href="${social.link}" class="text-gray-300 hover:text-primary"><i class="${social.icon}"></i></a>`).join('')}
                    </div>
                </div>
            </div>
            <div class="mt-8 text-center text-gray-400">
                <p>${copyright}</p>
            </div>
        </div>
    `;
}
// Open Upload Prescription modal
document.querySelectorAll('a[href="#upload-prescription"]').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('uploadModal').classList.remove('hidden');
    });
});
// Close Upload modal when clicking backdrop
const uploadModal = document.getElementById('uploadModal');
if (uploadModal) {
    uploadModal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.add('hidden');
        }
    });
}
// NEW: Function to render main background banner dynamically
function renderMainBanner() {
    const bgImage = document.getElementById('mainBackgroundImage');
    if (bgImage) {
        // This will be overridden by dynamic banners if available
        bgImage.src = "Images/IMG/pharmacyBanner11.jpg";
    }
}
// NEW: Function to render secondary banner dynamically
function renderSecondaryBanner() {
    const secondaryImage = document.getElementById('secondaryBannerImage');
    if (secondaryImage) {
        // This will be overridden by dynamic banners if available
        secondaryImage.src = "Images/IMG/farmasi banner 8th.jpg";
    }
}
// NEW: Function to render carousel dynamically
function renderCarousel() {
    const carousel = document.getElementById("carousel");
    const dotsContainer = document.getElementById("dotsContainer");
    if (!carousel || !dotsContainer) return;
    // Static banners
    const carouselBanners = [
        "Images/IMG/pharmacyBanner2.jpg",
        "Images/IMG/farmasi banner 5th.jpg",
        "Images/IMG/farmasi banner 3rd.jpg",
        "Images/IMG/farmasi banner 4th.jpg"
    ];
    // Render slides
    carousel.innerHTML = carouselBanners.map((src, idx) => `
        <img src="${src}" class="carousel-image w-full flex-shrink-0 rounded-xl" alt="Featured Product ${idx + 1}">
    `).join('');
    // Render dots
    dotsContainer.innerHTML = carouselBanners.map(() => `
        <button class="dot w-3 h-3 bg-white rounded-full opacity-50 hover:opacity-100 transition-opacity"></button>
    `).join('');
}
// Carousel functionality (moved to a separate function to call after rendering)
function initializeCarousel() {
    const carousel = document.getElementById("carousel");
    if (!carousel) return;
    const slides = carousel.children.length;
    const dots = document.querySelectorAll(".dot");
    let index = 0;
    function showSlide(i) {
        index = (i + slides) % slides; // loop around
        carousel.style.transform = `translateX(-${index * 100}%)`;
        // Update dots
        dots.forEach((dot, idx) => {
            dot.classList.toggle("opacity-100", idx === index);
            dot.classList.toggle("opacity-50", idx !== index);
        });
    }
    // Buttons
    const prevBtn = document.getElementById("prev");
    const nextBtn = document.getElementById("next");
    if (prevBtn) {
        prevBtn.onclick = () => showSlide(index - 1);
    }
    if (nextBtn) {
        nextBtn.onclick = () => showSlide(index + 1);
    }
    // Dots click
    dots.forEach((dot, idx) => {
        dot.addEventListener("click", () => showSlide(idx));
    });
    // Auto play every 4s
    setInterval(() => showSlide(index + 1), 4000);
    // Init
    showSlide(0);
}
// NEW FUNCTION: Fetch real feminine products from backend - ONLY BACKEND IMAGE
async function fetchFeminineProducts() {
    try {
        const response = await fetch('http://localhost:8083/api/mb/products/sub-category/Personal%20Care%20%26%20Hygiene');
        if (!response.ok) {
            console.warn('Backend not reachable or no data - returning empty array');
            return [];
        }
        const data = await response.json();
        return data.map(p => ({
            id: p.id,
            name: p.title,
            category : p.category,
            price: Array.isArray(p.price) ? p.price[0] : p.price,
            originalPrice: Array.isArray(p.originalPrice) ? p.originalPrice[0] : p.originalPrice,
            discount: p.discount,
            mainImageUrl: p.mainImageUrl // keep for proper image handling
        }));
    } catch (err) {
        console.warn('Error connecting to backend - returning empty array:', err.message);
        return [];
    }
}
// NEW FUNCTION: Fetch real medicines products from backend by subcategories only
async function fetchMedicines() {
    try {
        console.log('Fetching ALL active products...');
        const response = await fetch('http://localhost:8083/api/products/get-all-active-products?page=0&size=100');
        if (!response.ok) throw new Error(await response.text());
     
        const data = await response.json();
        console.log(`Loaded ${data.length} products total`);
     
        return data.map(p => ({
            id: p.productId,
            name: p.productName,
            price: Array.isArray(p.productPrice) ? p.productPrice[0] : p.productPrice,
            originalPrice: Array.isArray(p.productOldPrice) ? p.productOldPrice[0] : p.productOldPrice,
            discount: p.discount,
            mainImageUrl: p.productMainImage
        }));
    } catch (err) {
        console.error("Error fetching all products:", err);
        return [];
    }
}
// =============== CRITICAL FIX: RENDER PRODUCT SECTIONS ===============
async function renderProductSections() {
    console.log('Rendering Feminine Hygiene...');
    const feminineProducts = await fetchFeminineProducts();
    renderMyntraSection('feminine-track', feminineProducts);
   
    console.log('Rendering Medicines & Healthcare...');
    const medicinesProducts = await fetchMedicines();
    renderMyntraSection('medicine-track', medicinesProducts);
   
    // Re-apply cart count after products are rendered
    setTimeout(() => {
        if (typeof updateCartCount === 'function') updateCartCount();
        if (typeof restoreQuantitySelectors === 'function') restoreQuantitySelectors();
    }, 800);
}
// ========== FIXED PRESCRIPTION UPLOAD LOGIC ==========
function initializePrescriptionUpload() {
    if (window.prescriptionUploadInitialized) {
        console.warn('⚠️ Prescription upload already initialized. Skipping.');
        return;
    }
    window.prescriptionUploadInitialized = true;
    console.log('🚀 Initializing prescription upload module...');

    // Get elements
    const doctorNameInput   = document.getElementById('doctorName');
    const fileInput         = document.getElementById('prescriptionFileInput');
    const fileNameDisplay   = document.getElementById('selectedFileName');
    const fileNameText      = document.getElementById('fileNameText');
    const submitBtn         = document.getElementById('submitPrescriptionBtn');
    const uploadModal       = document.getElementById('uploadModal');
    const uploadFileArea    = document.getElementById('uploadFileArea');
    const closeUploadModalBtn = document.getElementById('closeUploadModal');

    // NEW: Message container (you need to add this div in HTML inside modal)
    // Example HTML to add inside #uploadModal (preferably near the form):
    // <div id="loginWarning" class="text-center text-red-600 font-medium p-4 hidden">
    //     Please login to upload prescription
    // </div>

    const loginWarning = document.getElementById('loginWarning');

    // Check if critical elements exist
    if (!doctorNameInput || !fileInput || !submitBtn || !uploadModal) {
        console.warn('Prescription upload elements not found');
        return;
    }
    console.log('✅ Found all prescription upload elements');

    // Backend API configuration
    const API_BASE_URL = 'http://localhost:8083';
    const CREATE_ORDER_ENDPOINT = `${API_BASE_URL}/api/prescriptions/create-order`;

    // ────────────────────────────────────────────────
    //           CHECK LOGIN STATUS & LOCK FORM
    // ────────────────────────────────────────────────
    const isLoggedIn = checkIfUserLoggedIn();

    if (!isLoggedIn) {
        // ─── DISABLE EVERYTHING ───────────────────────
        doctorNameInput.disabled = true;
        fileInput.disabled = true;
        submitBtn.disabled = true;

        // Optional: make inputs look disabled
        doctorNameInput.classList.add('opacity-50', 'cursor-not-allowed');
        uploadFileArea.classList.add('opacity-50', 'cursor-not-allowed');

        // Show warning message
        if (loginWarning) {
            loginWarning.classList.remove('hidden');
        } else {
            console.warn('⚠️ #loginWarning element not found in modal');
        }

        submitBtn.innerHTML = 'Login Required';
        console.log('🔒 Form disabled → user is NOT logged in');
    } else {
        // ─── ENABLE FORM ──────────────────────────────
        doctorNameInput.disabled = false;
        fileInput.disabled = false;
        submitBtn.disabled = true; // still disabled until fields filled

        doctorNameInput.classList.remove('opacity-50', 'cursor-not-allowed');
        uploadFileArea.classList.remove('opacity-50', 'cursor-not-allowed');

        if (loginWarning) {
            loginWarning.classList.add('hidden');
        }

        submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Submit Prescription';
        console.log('🔓 Form enabled → user is logged in');
    }

    // ────────────────────────────────────────────────
    //                   FORM STATE
    // ────────────────────────────────────────────────
    let formState = {
        doctorName: '',
        hasFile: false,
        file: null
    };

    // 1. Enable/disable submit button based on form content (only if logged in)
    function updateSubmitButton() {
        if (!isLoggedIn) {
            submitBtn.disabled = true;
            return;
        }

        const hasName = formState.doctorName.trim().length > 0;
        const hasFile = formState.hasFile;

        submitBtn.disabled = !(hasName && hasFile);
        console.log('📝 Submit validation:', {
            name: hasName ? '✓' : '✗',
            file: hasFile ? '✓' : '✗',
            button: submitBtn.disabled ? 'DISABLED' : 'ENABLED'
        });
    }

    // 2. Doctor name input listener
    doctorNameInput.addEventListener('input', function(e) {
        formState.doctorName = e.target.value;
        updateSubmitButton();
    });

    // 3. File selection handler
    function handleFileSelect() {
        if (fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            formState.hasFile = true;
            formState.file = file;

            if (fileNameText && fileNameDisplay) {
                fileNameText.textContent = file.name;
                fileNameDisplay.classList.remove('hidden');
            }
        } else {
            formState.hasFile = false;
            formState.file = null;
            if (fileNameDisplay) {
                fileNameDisplay.classList.add('hidden');
            }
        }
        updateSubmitButton();
    }

    fileInput.addEventListener('change', handleFileSelect);

    // ────────────────────────────────────────────────
    //               REMAINING LOGIC (unchanged)
    // ────────────────────────────────────────────────

    function validateForm() {
        const errors = [];
        if (!formState.doctorName.trim()) {
            errors.push('Doctor name is required');
        }
        if (!formState.hasFile || !formState.file) {
            errors.push('Prescription image is required');
        } else {
            const file = formState.file;
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            const maxSize = 10 * 1024 * 1024;

            if (!validTypes.includes(file.type)) {
                errors.push('Please upload only JPG, PNG, or PDF files');
            }
            if (file.size > maxSize) {
                errors.push('File size must be less than 10MB');
            }
        }
        return errors;
    }

    function showLoading() {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
    }

    function resetButtonState() {
        submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Submit Prescription';
        updateSubmitButton();
        submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
    }

    function showSuccessToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.className = 'fixed top-20 right-5 z-50 px-8 py-4 rounded-xl text-white font-bold shadow-2xl transition-all bg-green-600 transform translate-x-full';
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.remove('translate-x-full'), 100);
        setTimeout(() => toast.remove(), 5000);
    }

    function showErrorToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.className = 'fixed top-20 right-5 z-50 px-8 py-4 rounded-xl text-white font-bold shadow-2xl transition-all bg-red-600 transform translate-x-full';
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.remove('translate-x-full'), 100);
        setTimeout(() => toast.remove(), 5000);
    }

    function showSuccessModal() {
        const successModal = document.getElementById('successModal');
        const successModalContent = document.getElementById('successModalContent');
        if (successModal && successModalContent) {
            successModal.classList.remove('hidden');
            setTimeout(() => {
                successModalContent.classList.remove('scale-95', 'opacity-0');
                successModalContent.classList.add('scale-100', 'opacity-100');
            }, 10);
        }
    }

    function resetForm() {
        doctorNameInput.value = '';
        fileInput.value = '';
        formState = { doctorName: '', hasFile: false, file: null };
        if (fileNameDisplay) fileNameDisplay.classList.add('hidden');
        resetButtonState();
    }

    async function handleSubmit(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (!isLoggedIn) {
            showLoginRequiredMessage();
            return;
        }

        const errors = validateForm();
        if (errors.length > 0) {
            showErrorToast(errors[0]);
            return;
        }

        showLoading();

        try {
            const file = formState.file;
            const doctorName = formState.doctorName.trim();

            let userData = null;
            let userId = 1;
            let firstName = 'Patient';
            let lastName = 'Name';
            let email = 'patient@example.com';
            let mobileNumber = '0000000000';
            let address = 'Not provided';

            try {
                const userDataString = sessionStorage.getItem('currentUser');
                if (userDataString) {
                    userData = JSON.parse(userDataString);
                    if (userData && userData.userId) {
                        userId = userData.userId;
                        firstName = userData.firstName || firstName;
                        lastName  = userData.lastName  || lastName;
                        email     = userData.email     || email;
                        mobileNumber = userData.phone || userData.mobileNumber || mobileNumber;
                        if (userData.addressArea && userData.addressCity && userData.addressPincode) {
                            address = `${userData.addressArea}, ${userData.addressCity}, ${userData.addressPincode}, ${userData.addressState || ''}`;
                        }
                    }
                }
            } catch (e) {}

            const formData = new FormData();
            const orderData = {
                doctorName,
                email,
                mobileNumber,
                firstName,
                lastName,
                userId,
                address,
                notes: 'Uploaded via web portal',
                orderStatus: 'PENDING',
                prescriptionType: 'UPLOADED',
                timestamp: new Date().toISOString()
            };

            formData.append('orderData', new Blob([JSON.stringify(orderData)], { type: 'application/json' }));
            formData.append('prescriptionImg', file);

            const response = await fetch(CREATE_ORDER_ENDPOINT, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            if (result.prescriptionId) {
                showSuccessModal();
            } else {
                showSuccessToast('Prescription submitted successfully!');
            }

            setTimeout(() => {
                resetForm();
                uploadModal.classList.add('hidden');
            }, 2000);

        } catch (error) {
            console.error('Prescription upload failed:', error);
            let msg = 'Failed to submit prescription. ';
            if (error.message.includes('Failed to fetch')) {
                msg += 'Cannot connect to server.';
            }
            showErrorToast(msg);
            resetButtonState();
        }
    }

    // Event listeners
    submitBtn.addEventListener('click', handleSubmit);

    if (uploadFileArea) {
        uploadFileArea.addEventListener('click', () => {
            if (!fileInput.disabled) fileInput.click();
        });
    }

    if (closeUploadModalBtn) {
        closeUploadModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            resetForm();
            uploadModal.classList.add('hidden');
        });
    }

    // Initial validation
    updateSubmitButton();

    console.log('✅ Prescription upload module initialized');
}
// Initialize success modal
function initializeSuccessModal() {
    const successCloseBtn = document.getElementById('successCloseBtn');
    if (successCloseBtn) {
        successCloseBtn.addEventListener('click', function() {
            const successModal = document.getElementById('successModal');
            const successModalContent = document.getElementById('successModalContent');
            if (successModal && successModalContent) {
                successModalContent.classList.remove('scale-100', 'opacity-100');
                successModalContent.classList.add('scale-95', 'opacity-0');
                setTimeout(() => {
                    successModal.classList.add('hidden');
                }, 300);
            }
        });
    }
}
// Fix for upload buttons to open modal - MODIFIED VERSION
function fixUploadModalOpeners() {
    document.querySelectorAll('a[href="#upload-prescription"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
  
            // Check if user is logged in
            const isLoggedIn = checkIfUserLoggedIn();
  
            if (!isLoggedIn) {
                // Redirect to login page or show login modal
                console.log('⚠️ User not logged in. Redirecting to login...');
                showLoginRequiredMessage();
                return;
            }
  
            // User is logged in, open upload modal
            const uploadModal = document.getElementById('uploadModal');
            if (uploadModal) {
                uploadModal.classList.remove('hidden');
                console.log('📋 Upload modal opened via button click');
            }
        });
    });
}
// NEW: Function to check if user is logged in - FIXED FOR currentUser
function checkIfUserLoggedIn() {
    // Check for the specific structure from your session storage
    try {
        // FIX: Changed from 'userData' to 'currentUser'
        const userDataString = sessionStorage.getItem('currentUser');
        if (userDataString) {
            const userData = JSON.parse(userDataString);
            // Check if userData has the expected structure from your example
            if (userData && userData.userId) {
                console.log('✅ User logged in with ID:', userData.userId);
                return true;
            }
        }
        console.log('❌ User not logged in - no valid user data found in currentUser');
        return false;
    } catch (error) {
        console.log('❌ Error checking login status:', error);
        return false;
    }
}



function showLoginRequiredMessage() {
    // You can customize this to show a modal, redirect to login page, or show toast
    const toast = document.createElement('div');
    toast.textContent = 'Please login to upload prescription';
    toast.className = 'fixed top-20 right-5 px-8 py-4 rounded-xl text-white font-bold shadow-2xl transition-all bg-yellow-600 transform translate-x-full';
    
    // Set inline styles for better control, especially z-index
    toast.style.zIndex = '2000';
    
    // Optional additional styles
    toast.style.minWidth = '300px';
    toast.style.textAlign = 'center';
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.remove('translate-x-full'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => toast.remove(), 300);
    }, 2700);
   
    // Optional: Redirect to login page after a delay
    setTimeout(() => {
        // Change this to your login page URL
        // window.location.href = '/login.html';
        console.log('Redirecting to login page...');
    }, 2000);
}

// NEW: Function to show login required message
// function showLoginRequiredMessage() {
//     // You can customize this to show a modal, redirect to login page, or show toast
//     const toast = document.createElement('div');
//     toast.textContent = 'Please login to upload prescription';
//     toast.className = 'fixed top-20 right-5 z-50 px-8 py-4 rounded-xl text-white font-bold shadow-2xl transition-all bg-yellow-600 transform translate-x-full';
//     document.body.appendChild(toast);
//     setTimeout(() => toast.classList.remove('translate-x-full'), 100);
//     setTimeout(() => toast.remove(), 3000);
   
//     // Optional: Redirect to login page after a delay
//     setTimeout(() => {
//         // Change this to your login page URL
//         // window.location.href = '/login.html';
//         console.log('Redirecting to login page...');
//     }, 2000);
// }



// FIXED: Add missing functions that were called in initialization
function updateAllWishlistIcons() {
    const wishlist = getWishlist();
    const wishlistIds = wishlist.map(item => item.id);
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        const productId = parseInt(btn.dataset.productId || btn.getAttribute('data-product-id'));
        const svg = btn.querySelector('svg');
        if (svg && wishlistIds.includes(productId)) {
            svg.classList.add('fill-red-500', 'text-red-500');
            svg.setAttribute('fill', 'currentColor');
        } else if (svg) {
            svg.classList.remove('fill-red-500', 'text-red-500');
            svg.removeAttribute('fill');
        }
    });
}
// GLOBAL SEARCH FUNCTIONALITY - Images from backend only, no local placeholders
// let globalSearchProducts = [];
// const API_BASE = "http://localhost:8083";
// async function loadGlobalSearchData(forceRefresh = false) {
//     if (!forceRefresh && globalSearchProducts.length > 0) return;
//     try {
//         globalSearchProducts = []; // Clear old data
//         // 1. Fetch Regular Products (paginated)
//         let page = 0;
//         let hasMore = true;
//         while (hasMore) {
//             const res = await fetch(`${API_BASE}/api/products/get-all-active-products?page=${page}&size=50`);
//             if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
//             const json = await res.json();
//             if (!Array.isArray(json) || json.length === 0) break;
           
//             json.forEach(p => {
//                 globalSearchProducts.push({
//                     id: p.productId,
//                     name: p.productName || 'Unknown Product',
//                     subCategory: (p.productSubCategory || 'Product').trim(),
//                     price: Array.isArray(p.productPrice) ?
//                         Number(p.productPrice[0] || 0) :
//                         Number(p.productPrice || p.newPrice || p.price || 0) || 0,
//                     image: p.productMainImage || '', // ← empty string = no image → CSS handles it
//                     detailUrl: `/productdetails.html?id=${p.productId}`,
//                     type: 'regular'
//                 });
//             });
//             hasMore = json.length === 50;
//             page++;
//         }
//         // 2. Fetch MB Products
//         const mbpRes = await fetch(`${API_BASE}/api/mb/products/get-all-mb-active-products?page=${page}&size=50`);
//         if (!mbpRes.ok) throw new Error(`Failed to fetch MB products: ${mbpRes.status}`);
//         const mbpJson = await mbpRes.json();
//         if (Array.isArray(mbpJson)) {
//             mbpJson.forEach(p => {
//                 globalSearchProducts.push({
//                     id: p.id || p.productId || 'mbp-' + Math.random().toString(36).substr(2, 9),
//                     name: p.title || p.productName || 'Unknown MB Product',
//                     subCategory: (p.subCategory || p.productSubCategory || 'MB Product').trim(),
//                     price: Array.isArray(p.productPrice) ?
//                         Number(p.productPrice[0] || 0) :
//                         Number(p.productPrice || p.newPrice || p.price || 0) || 0,
//                     image: `http://localhost:8083${p.mainImageUrl}` || '', // ← empty string = no image → CSS handles it
//                     detailUrl: `/MotherCare/mother-product-details.html?id=${p.id || p.productId}`,
//                     type: 'mbp'
//                 });
//             });
//         }
//         console.log(`Loaded ${globalSearchProducts.length} products`);
       
//         // Optional: Debug products with missing images
//         const missingImages = globalSearchProducts.filter(p => !p.image);
//         if (missingImages.length > 0) {
//             console.log(`${missingImages.length} products have no image URL from backend`);
//         }
//     } catch (err) {
//         console.error("Failed to load global search data:", err);
//     }
// }



// GLOBAL SEARCH FUNCTIONALITY - Optimized & Clean
let globalSearchProducts = [];
const API_BASE = "http://localhost:8083";
const FALLBACK_IMAGE = "http://localhost:8083/Images/product_details_fallback_img.jpg";

async function loadGlobalSearchData(forceRefresh = false) {
    // Return early if already loaded and not forcing refresh
    if (!forceRefresh && globalSearchProducts.length > 0) {
        return;
    }

    try {
        globalSearchProducts = []; // Reset data

        // Load all product sources sequentially
        await fetchAllPages('/api/products/get-all-active-products', mapRegularProduct);
        await fetchAllPages('/api/mb/products/get-all-mb-active-products', mapMBProduct);

        console.log(`Global search successfully loaded: ${globalSearchProducts.length} products`);
    } catch (error) {
        console.error('Failed to load global search data:', error);
        // Optional: show user notification/toast here
    }
}

// ====================
// Reusable Pagination Fetcher
// ====================
async function fetchAllPages(endpointPath, mapper) {
    let page = 0;
    let hasMore = true;

    while (hasMore) {
        try {
            const response = await fetch(`${API_BASE}${endpointPath}?page=${page}&size=50`);

            if (!response.ok) {
                console.warn(`HTTP ${response.status} on ${endpointPath} (page ${page})`);
                break;
            }

            const data = await response.json();
            const items = data.content || data || [];

            if (items.length === 0) {
                break;
            }

            // Map and push all items
            items.forEach(item => globalSearchProducts.push(mapper(item)));

            // Continue if full page was returned
            hasMore = items.length === 50;
            page++;
        } catch (err) {
            console.warn(`Network error fetching ${endpointPath} (page ${page}):`, err);
            break; // Stop this source, continue with others
        }
    }
}

// ====================
// Product Mappers
// ====================

function mapRegularProduct(p) {
    return {
        id: p.productId,
        name: p.productName || 'Unknown Product',
        subCategory: (p.productSubCategory || 'Product').trim(),
        price: Array.isArray(p.productPrice)
            ? Number(p.productPrice[0] || 0)
            : Number(p.productPrice || p.newPrice || p.price || 0),
        image: p.productMainImage || FALLBACK_IMAGE,
        detailUrl: `/productdetails.html?id=${p.productId}`,
        type: 'regular'
    };
}

function mapMBProduct(p) {
    // Normalize category for reliable matching
    const categoryNorm = (p.category || '').trim().toLowerCase();

    // Determine correct detail page based on category
    let detailPath = '/MotherCare/mother-product-details.html'; // default
    if (categoryNorm.includes('baby')) {
        detailPath = '/BabyCare/baby-product-details.html';
    } else if (categoryNorm.includes('mother')) {
        detailPath = '/MotherCare/mother-product-details.html';
    }

    // Use first price for display
    const displayPrice = Array.isArray(p.price) && p.price.length > 0
        ? Number(p.price[0])
        : 0;


    return {
        id: p.id,
        name: p.title || 'Unknown MB Product',
        subCategory: (p.subCategory || 'MB Product').trim(),
        price: displayPrice,
        image: p.mainImageUrl || FALLBACK_IMAGE,
        detailUrl: `${detailPath}?id=${p.id}`,
        type: 'mbp',
        category: p.category // Useful for future filtering or debugging
    };
}

// Optional: Export or call on DOM page load
// loadGlobalSearchData(); // Uncomment to load on script init



// Optional: Load only products from a specific subcategory (e.g., for Mothercare/Babycare tabs)
async function loadProductsBySubCategory(subCategory) {
    try {
        const res = await fetch(`${API_BASE}/api/products/get-by-sub-category/${encodeURIComponent(subCategory)}`);
        if (!res.ok) throw new Error("Failed to fetch by subcategory");
        const json = await res.json();
        return json.map(p => ({
            id: p.productId,
            name: p.productName || 'Unknown Product',
            subCategory: (p.productSubCategory || 'Product').trim(),
          price: Array.isArray(p.productPrice) ?
      Number(p.productPrice[0] || 0) :
      Number(p.productPrice || p.newPrice || p.price || 0) || 0,
            image: p.productMainImage ? `${IMG_BASE}${p.productMainImage}` : null,
            detailUrl: `/productdetails.html?id=${p.productId}`
        }));
    } catch (err) {
        console.error("Failed to load subcategory products", err);
        return [];
    }
}
// HIGHLIGHT MATCHED TEXT (NICE UX)
function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.trim()})`, 'gi');
    return text.replace(regex, '<span class="text-yellow-600 font-bold">$1</span>');
}
 
 
 
 
 
//==================  START --> SEARCH UI LOGIC - Improved case-insensitive + trim  ===//


//==================  START --> SEARCH UI LOGIC - Improved with Debounce + Unique Results ===//
function initSearch() {
    const input = document.getElementById('searchInput');
    const suggestions = document.getElementById('searchSuggestions');
    if (!input || !suggestions) return;

    let isMouseOverSuggestions = false;
    let debounceTimer;

    // Keep suggestions open when hovering
    suggestions.addEventListener('mouseenter', () => isMouseOverSuggestions = true);
    suggestions.addEventListener('mouseleave', () => isMouseOverSuggestions = false);

    // Close suggestions when clicking outside
    document.addEventListener('click', e => {
        if (!suggestions.contains(e.target) && e.target !== input && !isMouseOverSuggestions) {
            suggestions.style.display = 'none';
        }
    });

    // Main input handler with DEBOUNCE + MIN 3 chars
    input.addEventListener('input', e => {
        const query = e.target.value.trim();

        // Clear previous timer
        clearTimeout(debounceTimer);

        if (query.length < 3) {
            suggestions.style.display = 'none';
            return;
        }

        // Debounce: wait 300ms after user stops typing
        debounceTimer = setTimeout(() => {
            showSuggestions(query);
        }, 300);
    });

    async function showSuggestions(query = '') {
        suggestions.style.display = 'block';
        suggestions.innerHTML = '<div class="p-4 text-center text-gray-500">Finding For You...</div>';

        // Always load fresh data on search (ensures new products appear)
        await loadGlobalSearchData(true); // force refresh

        const q = query.toLowerCase().trim();

        // Use a Set to track unique product IDs (prevents duplicates)
        const seenIds = new Set();
        const uniqueResults = [];

        for (const p of globalSearchProducts) {
            if (seenIds.has(p.id)) continue; // skip duplicate

            const nameMatch = (p.name || '').toLowerCase().includes(q);
            const subCat = (p.subCategory || '').toLowerCase().trim();
            const subCatMatch = subCat.includes(q);

            // Extra fuzzy matching for common categories
            const extraMatch =
                (q.includes("skin") && subCat.includes("skin")) ||
                (q.includes("baby") && subCat.includes("baby")) ||
                (q.includes("mother") && subCat.includes("maternity"));

            if (nameMatch || subCatMatch || extraMatch) {
                uniqueResults.push(p);
                seenIds.add(p.id);

                if (uniqueResults.length >= 8) break; // limit to 8
            }
        }

        // Render results
        if (uniqueResults.length === 0) {
            suggestions.innerHTML = '<div class="p-4 text-center text-gray-500">No products found</div>';
            return;
        }

        suggestions.innerHTML = uniqueResults.map(p => `
            <div class="suggestion-item group flex items-center p-4 border-b hover:bg-gray-50 transition-colors cursor-pointer"
                 data-url="${p.detailUrl}">
                <img src="${p.image.startsWith('http') ? p.image : API_BASE + p.image}"
                    class="w-12 h-12 object-cover rounded-lg mr-3"
                    alt="${p.name}"
                    onerror="this.src='${FALLBACK_IMAGE}'; this.alt='Image not available';">
                <div class="flex-1">
                    <div class="font-medium text-gray-800 group-hover:text-primary">${highlightText(p.name, q)}</div>
                    <div class="text-sm text-gray-500">${p.subCategory}</div>
                </div>
                <i class="fas fa-arrow-right text-primary opacity-0 group-hover:opacity-100 transition-opacity"></i>
            </div>
        `).join('');

        // Attach click handlers
        suggestions.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const url = this.getAttribute('data-url');
                console.log('Redirecting to:', url);
                setTimeout(() => window.location.href = url, 100);
            });
        });
    }

    // Optional: Show popular categories when input is empty/focused
    input.addEventListener('focus', () => {
        if (input.value.trim().length < 3) {
            suggestions.style.display = 'block';
            suggestions.innerHTML = `
                <div class="p-3 text-xs font-bold text-gray-600 uppercase border-b">Popular Categories</div>
                <a href="/MotherCare/mother.html" class="block px-4 py-3 hover:bg-gray-50">Mother Care</a>
                <a href="/BabyCare/baby.html" class="block px-4 py-3 hover:bg-gray-50">Baby Care</a>
            `;
        }
    });
}
/// Initialize search
document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    loadGlobalSearchData(); // Initial load
});
function refreshSearchData() {
    loadGlobalSearchData(true); // Force refresh
}


//=================END search functon ========================//


// FIXED: Add proper event listener for the close modal button
document.addEventListener('DOMContentLoaded', function() {
    // Fix for the close modal button error
    const closeModalBtn = document.querySelector('#uploadModal button.absolute.top-3.right-3');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            const uploadModal = document.getElementById('uploadModal');
            if (uploadModal) {
                uploadModal.classList.add('hidden');
            }
        });
    }
    // Also fix success modal close button
    const successCloseBtn = document.getElementById('successCloseBtn');
    if (successCloseBtn) {
        successCloseBtn.addEventListener('click', function() {
            const successModal = document.getElementById('successModal');
            const successModalContent = document.getElementById('successModalContent');
            if (successModal && successModalContent) {
                successModalContent.classList.remove('scale-100', 'opacity-100');
                successModalContent.classList.add('scale-95', 'opacity-0');
                setTimeout(() => {
                    successModal.classList.add('hidden');
                }, 300);
            }
        });
    }
});
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 ========== INITIALIZING APPLICATION ==========');
   
    // Fix modal openers FIRST
    fixUploadModalOpeners();
   
    // Initialize success modal
    initializeSuccessModal();
   
    // Initialize prescription upload
    initializePrescriptionUpload();
   
    // Initialize cart count (if function exists)
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
   
    // Restore quantity selectors (if function exists)
    if (typeof restoreQuantitySelectors === 'function') {
        restoreQuantitySelectors();
    }
   
    console.log('🎉 ========== APPLICATION INITIALIZED SUCCESSFULLY! ==========');
});
// FINAL INITIALIZATION - Everything runs after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 ========== INITIALIZING GOODNEEWZ APPLICATION ==========');
    console.log('📅 Date:', new Date().toLocaleString());
    console.log('🌐 Backend configured for port');
    // 1. Setup scroll buttons FIRST (before any other operations)
    const scrollLeftBtn = document.getElementById('scrollLeft');
    const scrollRightBtn = document.getElementById('scrollRight');
    const categoryContainer = document.getElementById('categoryContainer');
   
    console.log('🔧 Step 1: Setting up scroll buttons...');
    if (scrollLeftBtn && scrollRightBtn && categoryContainer) {
        scrollLeftBtn.addEventListener('click', () => {
            categoryContainer.scrollBy({
                left: -300,
                behavior: 'smooth'
            });
            console.log('⬅️ Scrolling left');
        });
        scrollRightBtn.addEventListener('click', () => {
            categoryContainer.scrollBy({
                left: 300,
                behavior: 'smooth'
            });
            console.log('➡️ Scrolling right');
        });
        console.log('✅ Scroll buttons initialized');
    } else {
        console.warn('⚠️ Scroll buttons or category container not found');
    }
    // 2. Load content
    console.log('🔧 Step 2: Loading categories...');
    if (typeof renderCategories === 'function' && categoriesData) {
        renderCategories(categoriesData);
        console.log(`✅ Loaded ${categoriesData.length} categories`);
    }
    // 3. CRITICAL: Render product sections
    console.log('🔧 Step 3: Rendering product sections...');
    renderProductSections();
    console.log('✅ Product sections rendered');
    // 4. Other initializations
    console.log('🔧 Step 4: Initializing other components...');
   
    // The dynamic banners are loaded automatically via the async function at line 365
    // Static fallback functions are called if dynamic loading fails
   
    if (typeof renderDoctorSection === 'function') {
        renderDoctorSection(doctorData);
        console.log('✅ Doctor section rendered');
    }
   
    if (typeof renderArticlesSection === 'function') {
        renderArticlesSection(articlesData);
        console.log('✅ Articles section rendered');
    }
   
    if (typeof renderFooter === 'function') {
        renderFooter(footerData);
        console.log('✅ Footer rendered');
    }
    // 5. Initialize prescription upload module
    console.log('🔧 Step 5: Initializing prescription upload module...');
    initializePrescriptionUpload();
    // 6. Cart system updates
    console.log('🔧 Step 6: Updating cart system...');
    if (typeof updateCartCount === 'function') {
        updateCartCount();
        console.log('✅ Cart count updated');
    }
   
    if (typeof restoreQuantitySelectors === 'function') {
        restoreQuantitySelectors();
        setTimeout(restoreQuantitySelectors, 600);
        console.log('✅ Quantity selectors restored');
    }
    console.log('🎉 ========== GOODNEEWS APPLICATION INITIALIZED SUCCESSFULLY! ==========');
    
    console.log('📊 Prescription upload module: READY');
    console.log('🛒 Cart system: READY');
    console.log('❤️ Wishlist system: READY');
    console.log('🎨 Dynamic banners: READY (with fallback)');
    console.log('=============================================');
});

























