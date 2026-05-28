// ==================== productdetails.js ====================
const API_BASE_URL = 'http://localhost:8083/api/products';
const API_BASE_IMG_URL = 'http://localhost:8083';
const CART_API_BASE = 'http://localhost:8083/api/cart';
const WISHLIST_API_BASE = 'http://localhost:8083/api/wishlist';
const FALLBACK_IMAGE = './Images/product_details_fallback_img.jpg';

// Global variables
let cart = JSON.parse(localStorage.getItem('cart') || '[]');


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
console.log("getCurrentUserId function returns :", getCurrentUserId());


let currentProduct = null;
let currentUserId = getCurrentUserId();
let selectedVariantIndex = 0;

// ------------------- Utility Functions -------------------
function removeSkeleton() {
    document.querySelectorAll('.skeleton').forEach(el => {
        el.classList.remove('skeleton');
        el.style.background = '';
        el.style.backgroundImage = '';
        el.style.animation = '';
    });
}

function showToast(message, type = "success") {
    document.querySelectorAll('.toast-notification').forEach(toast => toast.remove());
    const toast = document.createElement('div');
    toast.className = `toast-notification fixed top-20 right-4 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}



function updateCartCount() {
    // Count number of different products (line items), not total quantity
    const uniqueCount = cart.length;
    
    ['desktop-cart-count', 'mobile-cart-count'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = uniqueCount;
            el.style.display = uniqueCount > 0 ? 'flex' : 'none';
        }
    });
}


// function updateCartCount() {
//     const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
//     ['desktop-cart-count', 'mobile-cart-count'].forEach(id => {
//         const el = document.getElementById(id);
//         if (el) {
//             el.textContent = total;
//             el.style.display = total > 0 ? 'flex' : 'none';
//         }
//     });
// }



function updateRightCartPanel() {
    const items = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);
    const countEl = document.getElementById('cart-items-number');
    const textEl = document.getElementById('cart-items-text');
    const fullText = document.getElementById('cart-item-count-display');
    if (countEl) countEl.textContent = items;
    if (textEl) textEl.textContent = items === 1 ? '' : 's';
    if (fullText) {
        fullText.innerHTML = items === 0
            ? 'Your cart is empty'
            : `<span id="cart-items-number">${items}</span> Item<span id="cart-items-text">${items === 1 ? '' : 's'}</span> in Cart`;
    }
}

// function updateLocalCart(product, qty = 1) {
//     const cartItem = {
//         id: product.id,
//         name: product.name,
//         price: Number(product.selectedPrice),
//         image: product.image,
//         quantity: qty,
//         brand: product.brand || '',
//         unit: product.selectedSize || '',
//         type: "PRODUCT",
//         productId: product.id,
//         productType: "MEDICINE"
//     };
//     const existing = cart.find(item => item.id == cartItem.id && item.unit === cartItem.unit);
//     if (existing) {
//         existing.quantity += qty;
//     } else {
//         cart.push(cartItem);
//     }
//     localStorage.setItem('cart', JSON.stringify(cart));
//     updateCartCount();
//     updateRightCartPanel();
// }



// === REPLACE the entire updateLocalCart function with this ===
function updateLocalCart(product, qty = 1) {
    // BLOCK LOCAL STORAGE UPDATE IF NOT LOGGED IN
    if (!currentUserId) {
        showToast("Please login to add items to cart", "error");
        return;
    }

    const cartItem = {
        id: product.id,
        name: product.name,
        price: Number(product.selectedPrice),
        image: product.image,
        quantity: qty,
        brand: product.brand || '',
        unit: product.selectedSize || '',
        type: "PRODUCT",
        productId: product.id,
        productType: "MEDICINE"
    };
    const existing = cart.find(item => item.id == cartItem.id && item.unit === cartItem.unit);
    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push(cartItem);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    updateRightCartPanel();
}





// ------------------- Backend Cart & Wishlist -------------------
async function getValidUserId() {
  try {
    // First check sessionStorage (most common for login sessions)
    let userData = sessionStorage.getItem('currentUser');
    
    // If not found, fall back to localStorage
    if (!userData) {
      userData = localStorage.getItem('currentUser');
    }

    if (!userData) {
      console.log('[getValidUserId] No user data found in sessionStorage or localStorage (key: currentUser)');
      return null;
    }

    const user = JSON.parse(userData);

    // Extract userId safely
    const userId = user.userId || user.id || user.userID;

    if (!userId || isNaN(userId)) {
      console.log('[getValidUserId] Invalid or missing userId in stored user data:', user);
      return null;
    }

    console.log(`[getValidUserId] Valid user found: ${userId} (${user.firstName || 'User'})`);
    return Number(userId); // → returns 14

  } catch (error) {
    console.error('[getValidUserId] Failed to parse user data:', error);
    return null;
  }
}

async function addToCartBackend(product, qty = 1) {
    try {
        const payload = {
            userId: currentUserId,
            type: "PRODUCT",
            productId: product.id,
            quantity: qty,
            selectedSize: product.selectedSize || "",
            productType: "MEDICINE"
        };
        const response = await fetch(`${CART_API_BASE}/add-cart-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const err = await response.text();
            if (err.includes("User not found")) {
                currentUserId = await getValidUserId();
                payload.userId = currentUserId;
                const retry = await fetch(`${CART_API_BASE}/add-cart-items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                return retry.ok;
            }
            throw new Error(err);
        }
        return true;
    } catch (err) {
        console.error("Backend cart error:", err);
        return false;
    }
}

async function syncCartFromBackend() {
    try {
        const response = await fetch(`${CART_API_BASE}/get-cart-items?userId=${currentUserId}`);
        if (response.ok) {
            const items = await response.json();
            cart = items.map(item => ({
                id: item.itemId,
                name: item.title,
                price: Number(item.price),
                image: item.imageUrl,
                quantity: item.quantity,
                brand: '',
                unit: item.selectedSize || '',
                type: item.type,
                productId: item.itemId,
                productType: item.productType
            }));
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            updateRightCartPanel();
        }
    } catch (err) {
        console.error("Failed to sync cart:", err);
    }
}

async function addToWishlistBackend(product) {
    try {
        const response = await fetch(`${WISHLIST_API_BASE}/add-wishlist-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId, productId: product.id, productType: "MEDICINE" })
        });
        return response.ok;
    } catch (err) { console.error(err); return false; }
}

async function removeFromWishlistBackend(product) {
    try {
        const response = await fetch(`${WISHLIST_API_BASE}/remove-wishlist-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId, productId: product.id })
        });
        return response.ok;
    } catch (err) { console.error(err); return false; }
}

async function isInWishlistBackend(productId) {
    try {
        const response = await fetch(`${WISHLIST_API_BASE}/get-wishlist-items?userId=${currentUserId}`);
        if (!response.ok) return false;
        const items = await response.json();
        return items.some(item => item.productId == productId);
    } catch (err) { return false; }
}

// function updateLocalWishlistSync(product, isAdded) {
//     let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
//     if (isAdded) {
//         if (!wishlist.some(p => p.id === product.id)) {
//             wishlist.push({ id: product.id, name: product.name, price: product.selectedPrice, image: product.image, brand: product.brand, unit: product.selectedSize });
//         }
//     } else {
//         wishlist = wishlist.filter(p => p.id !== product.id);
//     }
//     localStorage.setItem('wishlist', JSON.stringify(wishlist));
//     window.dispatchEvent(new CustomEvent('wishlistUpdated'));
// }


function updateLocalWishlistSync(product, isAdded) {
    if (!currentUserId) return; // Do nothing if not logged in

    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (isAdded) {
        if (!wishlist.some(p => p.id === product.id)) {
            wishlist.push({ 
                id: product.id, 
                name: product.name, 
                price: product.selectedPrice, 
                image: product.image, 
                brand: product.brand, 
                unit: product.selectedSize 
            });
        }
    } else {
        wishlist = wishlist.filter(p => p.id !== product.id);
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    window.dispatchEvent(new CustomEvent('wishlistUpdated'));
}



// async function toggleWishlist(product) {
//     const btn = document.getElementById('wishlist-btn');
//     if (!btn) return;
//     const icon = btn.querySelector('i');
//     const isAdded = icon.classList.contains('fas');
//     const success = isAdded ? await removeFromWishlistBackend(product) : await addToWishlistBackend(product);
//     if (success) {
//         icon.className = isAdded ? 'far fa-heart text-2xl text-gray-600' : 'fas fa-heart text-2xl text-red-500';
//         btn.title = isAdded ? 'Add to wishlist' : 'Remove from wishlist';
//         showToast(isAdded ? 'Removed from wishlist!' : 'Added to wishlist!');
//         updateLocalWishlistSync(product, !isAdded);
//     }
// }


// === REPLACE the entire toggleWishlist function with this ===
async function toggleWishlist(product) {
    if (!currentUserId) {
        showToast("Please login to manage wishlist", "error");
        return;
    }

    const btn = document.getElementById('wishlist-btn');
    if (!btn) return;
    const icon = btn.querySelector('i');
    const isAdded = icon.classList.contains('fas');
    const success = isAdded ? await removeFromWishlistBackend(product) : await addToWishlistBackend(product);
    if (success) {
        icon.className = isAdded ? 'far fa-heart text-2xl text-gray-600' : 'fas fa-heart text-2xl text-red-500';
        btn.title = isAdded ? 'Add to wishlist' : 'Remove from wishlist';
        showToast(isAdded ? 'Removed from wishlist!' : 'Added to wishlist!', "success");
        updateLocalWishlistSync(product, !isAdded);
    } else {
        showToast("Failed to update wishlist. Please try again.", "error");
    }
}



function updateWishlistButton() {
    const btn = document.getElementById('wishlist-btn');
    if (!btn || !currentProduct) return;
    const icon = btn.querySelector('i');
    icon.className = 'far fa-heart text-2xl text-gray-600';
    btn.title = 'Add to wishlist';
    isInWishlistBackend(currentProduct.id).then(isAdded => {
        if (isAdded) {
            icon.className = 'fas fa-heart text-2xl text-red-500';
            btn.title = 'Remove from wishlist';
        }
        btn.onclick = () => toggleWishlist(currentProduct);
    });
}

// async function addToCart(product, qty = 1) {
//     const success = await addToCartBackend(product, qty);
//     showToast(success ? `${qty} item${qty > 1 ? 's' : ''} added to cart!` : `Login to add to cart`);
//     updateLocalCart(product, qty);
// }


// === REPLACE the entire addToCart function with this ===
async function addToCart(product, qty = 1) {
    if (!currentUserId) {
        showToast("Please login to add to cart", "error");
        return;
    }

    const success = await addToCartBackend(product, qty);
    if (success) {
        showToast(`${qty} item${qty > 1 ? 's' : ''} added to cart!`, "success");
        updateLocalCart(product, qty);  // Only update local if backend succeeded
    } else {
        showToast("Failed to add to cart. Please try again.", "error");
    }
}

// ------------------- Image Helper -------------------
function getImageUrl(path) {
    if (!path) return FALLBACK_IMAGE;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return API_BASE_IMG_URL + path;
}

// ------------------- Variant & Price Logic -------------------
function updatePriceDisplay() {
    if (!currentProduct || !currentProduct.variants || currentProduct.variants.length === 0) {
        document.getElementById('selling-price').textContent = currentProduct?.priceText || '—';
        document.querySelector('.line-through')?.classList.add('hidden');
        document.getElementById('discount-badge')?.classList.add('hidden');
        return;
    }

    const variant = currentProduct.variants[selectedVariantIndex];
    document.getElementById('selling-price').textContent = `₹${variant.price.toFixed(0)}`;

    const mrpEl = document.getElementById('mrp-price');
    const discountBadge = document.getElementById('discount-badge');
    const lineThrough = document.querySelector('.line-through');

    if (variant.mrp && variant.mrp > variant.price) {
        mrpEl.textContent = `₹${variant.mrp.toFixed(0)}`;
        discountBadge.textContent = `${variant.discount}% OFF`;
        discountBadge.classList.remove('hidden');
        lineThrough?.classList.remove('hidden');
    } else {
        discountBadge.classList.add('hidden');
        lineThrough?.classList.add('hidden');
    }

    document.getElementById('product-unit').textContent = variant.size;
}

// Global function for variant selection with active state update
window.selectVariant = function(index) {
    selectedVariantIndex = index;
    updatePriceDisplay();

    // Update active button style
    document.querySelectorAll('#variant-selector button').forEach((btn, i) => {
        if (i === index) {
            btn.classList.remove('border-gray-300', 'hover:border-gray-400');
            btn.classList.add('border-pharmeasy-green', 'bg-pharmeasy-light-green');
        } else {
            btn.classList.remove('border-pharmeasy-green', 'bg-pharmeasy-light-green');
            btn.classList.add('border-gray-300', 'hover:border-gray-400');
        }
    });
};


// ------------------- API Calls -------------------
async function fetchProductById(productId) {
    const urls = [
        `${API_BASE_URL}/${productId}`,
        `${API_BASE_URL}/get-by-id/${productId}`,
        `${API_BASE_URL}/get-product/${productId}`,
        `${API_BASE_URL}/product/${productId}`
    ];
    for (const url of urls) {
        try {
            const res = await fetch(url);
            if (res.ok) return await res.json();
        } catch (e) {}
    }
    return null;
}

async function fetchRelatedProducts(category, currentId) {
    try {
        const res = await fetch(`${API_BASE_URL}/get-by-category/${encodeURIComponent(category)}`);
        if (!res.ok) return [];
        const products = await res.json();
        return products.filter(p => p.productId != currentId && p.productQuantity > 0 && !p.deleted).slice(0, 4);
    } catch (err) { return []; }
}


// Render variant selector
function renderVariantSelector() {
    const sizes = currentProduct.productSizes || [];
    if (sizes.length <= 1) return;

    let html = `
        <div id="variant-selector" class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Size:</label>
            <div class="flex flex-wrap gap-3">
    `;

    sizes.forEach((size, i) => {
        const price = currentProduct.productPrice[i] || 0;
        const activeClass = i === 0 ? 'border-pharmeasy-green bg-pharmeasy-light-green' : 'border-gray-300 hover:border-gray-400';
        html += `
            <button 
                class="px-4 py-2 border rounded-lg text-sm font-medium transition ${activeClass}"
                onclick="selectVariant(${i})">
                ${size} <span class="text-pharmeasy-green font-bold">₹${price.toFixed(0)}</span>
            </button>
        `;
    });

    html += `</div></div>`;

    const quantitySection = document.querySelector('#quantity-input').closest('.mb-6');
    quantitySection.insertAdjacentHTML('beforebegin', html);
}

// ------------------- Pincode Delivery Checker (Restricted to Phaltan Only) -------------------
function setupPincodeChecker() {
    const pincodeInput = document.getElementById('pincodeInput');
    const checkBtn = document.getElementById('checkPincodeBtn');
    if (!pincodeInput || !checkBtn) return;

    const resultDiv = document.getElementById('deliveryResult');
    const successDiv = document.getElementById('deliverySuccess');
    const errorDiv = document.getElementById('deliveryError');
    const locationText = document.getElementById('deliveryLocation');
    const deliveryTime = document.getElementById('deliveryTime');
    const deliveryOffer = document.getElementById('deliveryOffer');

    // Only these pincodes are deliverable
    const allowedPincodes = ['415521', '415522', '415523', '415528'];

    // Load saved pincode if still valid
    const savedPincode = localStorage.getItem('lastValidPincode');
    if (savedPincode && allowedPincodes.includes(savedPincode)) {
        pincodeInput.value = savedPincode;
        checkPincodeRealTime(savedPincode);
    }

    // Allow only digits, max 6
    pincodeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    });

    const checkPincode = async () => {
        const pincode = pincodeInput.value.trim();
        if (pincode.length !== 6) {
            showToast('Enter a valid 6-digit pincode', 'error');
            return;
        }

        checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
        checkBtn.disabled = true;

        await checkPincodeRealTime(pincode);

        checkBtn.innerHTML = '<i class="fas fa-search-location"></i> Check';
        checkBtn.disabled = false;
    };

    checkBtn.addEventListener('click', checkPincode);
    pincodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkPincode();
    });

    async function checkPincodeRealTime(pincode) {
        resultDiv.classList.remove('hidden');

        // First: Check if pincode is in allowed list
        if (!allowedPincodes.includes(pincode)) {
            showDeliveryError("Delivery not available for this area");
            return;
        }

        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await response.json();

            if (!data || data[0]?.Status !== "Success" || !data[0].PostOffice || data[0].PostOffice.length === 0) {
                showDeliveryError("Invalid pincode");
                return;
            }

            const postOffice = data[0].PostOffice[0]; // Take first post office name
            const areaName = postOffice.Name;
            const district = postOffice.District;
            const state = postOffice.State;

            // Success!
            successDiv.classList.remove('hidden');
            errorDiv.classList.add('hidden');

            locationText.textContent = `${areaName}, Phaltan, ${district}, ${state}`;

            if (deliveryTime) {
                deliveryTime.textContent = '';
            }
           
           

            // Save valid pincode and area
            localStorage.setItem('lastValidPincode', pincode);
            localStorage.setItem('lastDeliveryArea', `${areaName}, Phaltan, ${district}`);

            showToast('Delivery available!', 'success');

        } catch (err) {
            console.error("Pincode check failed:", err);
            showDeliveryError("Network error. Please try again.");
        }
    }

    function showDeliveryError(message) {
        successDiv.classList.add('hidden');
        errorDiv.classList.remove('hidden');
        errorDiv.querySelector('p:last-child').textContent = message;

        // Clear saved data if delivery not available
        localStorage.removeItem('lastValidPincode');
        localStorage.removeItem('lastDeliveryArea');
    }
}



// ------------------- Rendering Functions -------------------
async function renderThumbnails(mainPath, subPaths = []) {
    const container = document.getElementById('thumbnail-container');
    if (!container) return;
    container.innerHTML = '';

    const allImages = [getImageUrl(mainPath), ...subPaths.map(getImageUrl)];

    allImages.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Thumbnail';
        img.className = 'w-20 h-20 object-contain border-2 rounded-lg cursor-pointer hover:border-pharmeasy-green transition';
        img.onerror = () => img.src = FALLBACK_IMAGE;
        img.onclick = () => {
            document.getElementById('main-product-image').src = src;
            container.querySelectorAll('img').forEach(t => t.classList.remove('border-pharmeasy-green'));
            img.classList.add('border-pharmeasy-green');
        };
        container.appendChild(img);
    });

    if (container.children.length > 0) container.children[0].classList.add('border-pharmeasy-green');
}

function formatDate(dateStr) {
    if (!dateStr) return 'Not specified';
    try { return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return dateStr; }
}

function renderProductDetailsTab() {
    const tbody = document.getElementById('specifications-table-body');
    if (!tbody || !currentProduct) return;
    tbody.innerHTML = '';
    const dyn = currentProduct.productDynamicFields || {};
    const rows = [
        { label: 'Product Description', value: currentProduct.productDescription || 'No description available' },
        { label: 'Brand', value: currentProduct.brandName || 'Generic' },
        { label: 'Category', value: currentProduct.productSubCategory || currentProduct.productCategory || 'Health Supplements' },
        { label: 'Manufacturing Date', value: formatDate(currentProduct.mfgDate) },
        { label: 'Expiry Date', value: formatDate(currentProduct.expDate) },
        { label: 'Batch Number', value: currentProduct.batchNo || 'Not specified' },
        { label: 'Available Quantity', value: currentProduct.productQuantity || 0 },
        { label: 'Form', value: dyn.form || 'Not specified' },
        { label: 'Strength', value: dyn.strength || 'Not specified' },
        { label: 'Country of Origin', value: dyn.countryOfOrigin || 'India' }
    ];
    rows.forEach((r, i) => {
        if (r.value && r.value.toString().trim()) {
            tbody.innerHTML += `
                <tr class="${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                    <td class="spec-label py-3 px-6 border-b border-gray-200"><span class="font-semibold text-gray-700">${r.label}</span></td>
                    <td class="spec-value py-3 px-6 border-b border-gray-200 text-gray-600">${r.value}</td>
                </tr>
            `;
        }
    });
}

function renderBenefitsTab() {
    const el = document.getElementById('benefits-content');
    if (!el || !currentProduct) return;
    const list = currentProduct.benefitsList || [];
    el.innerHTML = list.length === 0
        ? `<div class="py-8"><h3 class="text-xl font-bold text-gray-800 mb-6">Product Benefits</h3><p class="text-gray-600">No benefits information available.</p></div>`
        : `<div class="py-8"><h3 class="text-xl font-bold text-gray-800 mb-6">Key Benefits</h3><div class="bg-white rounded-lg border p-6"><ul class="space-y-4">${list.map(b => `<li class="flex items-start"><span class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1"><i class="fas fa-check text-green-600 text-sm"></i></span><span class="text-gray-700">${b}</span></li>`).join('')}</ul></div></div>`;
}

function renderIngredientsTab() {
    const el = document.getElementById('ingredients-content');
    if (!el || !currentProduct) return;
    const list = currentProduct.ingredientsList || [];
    el.innerHTML = list.length === 0
        ? `<div class="py-8"><h3 class="text-xl font-bold text-gray-800 mb-6">Product Ingredients</h3><p class="text-gray-600">No ingredients information available.</p></div>`
        : `<div class="py-8"><h3 class="text-xl font-bold text-gray-800 mb-6">Product Composition</h3><div class="bg-white rounded-lg border p-6"><ul class="space-y-3">${list.map((ing, i) => `<li class="flex items-start"><span class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1 text-blue-600 text-xs font-bold">${i+1}</span><span class="text-gray-700">${ing}</span></li>`).join('')}</ul></div></div>`;
}

function renderDirectionsTab() {
    // const el = document.getElementById('directions-content');
    if (!el || !currentProduct) return;
    const list = currentProduct.directionsList || [];
    const dyn = currentProduct.productDynamicFields || {};
    let html = `<div class="py-8"><h3 class="text-xl font-bold text-gray-800 mb-6">Directions for Use</h3>`;
    if (list.length > 0) {
        html += `<div class="mb-8"><div class="bg-white rounded-lg border p-6"><ul class="space-y-4">${list.map((d, i) => `<li class="flex items-start"><span class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3 mt-1 text-orange-600 font-bold">${i+1}</span><span class="text-gray-700">${d}</span></li>`).join('')}</ul></div></div>`;
    }
    const extra = [];
    if (dyn.dosage) extra.push({ l: 'Recommended Dosage', v: dyn.dosage });
    extra.push({ l: 'Prescription Required', v: currentProduct.prescriptionRequired ? '<span class="text-red-600 font-semibold">Yes</span>' : '<span class="text-green-600 font-semibold">No</span>' });
    if (dyn.storage) extra.push({ l: 'Storage Instructions', v: dyn.storage });
    if (dyn.suitableFor) extra.push({ l: 'Suitable For', v: dyn.suitableFor });
    if (extra.length > 0) {
        html += `<div><h4 class="text-lg font-bold text-gray-800 mb-4">Additional Information</h4><div class="bg-gray-50 rounded-lg border p-6"><table class="w-full"><tbody>${extra.map(e => `<tr class="border-b last:border-b-0"><td class="py-3 font-medium text-gray-700 w-1/3">${e.l}</td><td class="py-3 text-gray-600">${e.v}</td></tr>`).join('')}</tbody></table></div></div>`;
    }
    html += `</div>`;
    el.innerHTML = html;
}

function renderAllTabs() {
    renderProductDetailsTab();
    renderBenefitsTab();
    renderIngredientsTab();
    // renderDirectionsTab();
}

function renderRelatedProducts(products) {
    const container = document.getElementById('related-products-container');
    if (!container) return;
    container.innerHTML = products.length === 0 ? '<p class="col-span-full text-center text-gray-500 py-8">No related products found</p>' : '';
    products.forEach(p => {
        const priceText = p.productPrice?.length ? `₹${Math.min(...p.productPrice.filter(x=>x>0))}` : 'Price on request';
        container.innerHTML += `
            <div class="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition cursor-pointer">
                <img src="${getImageUrl(p.productMainImage)}" onerror="this.src='${FALLBACK_IMAGE}'" class="w-full h-40 object-cover rounded-lg mb-3" alt="${p.productName}">
                <h4 class="font-medium text-sm line-clamp-2 mb-1">${p.productName}</h4>
                <p class="text-xs text-gray-500">${p.brandName || 'Generic'}</p>
                <div class="mt-2"><span class="text-lg font-bold text-green-600">${priceText}</span></div>
                <button onclick="window.location.href='productdetails.html?id=${p.productId}'" class="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm">View Details</button>
            </div>
        `;
    });
}

// ------------------- Main Load Function -------------------
async function loadProduct() {
    currentUserId = await getValidUserId();
    
    
        // Clear local cart display if user is not logged in
    if (!currentUserId) {
        cart = [];
        localStorage.removeItem('cart');
        localStorage.removeItem('wishlist');
        updateCartCount();
        updateRightCartPanel();
    }
    
    await syncCartFromBackend();

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    if (!productId) return showNotFound();

    const product = await fetchProductById(productId);
    if (!product) return showNotFound();
    if (product.deleted) {
        document.getElementById('product-name').textContent = product.productName + ' (Unavailable)';
        document.body.style.filter = 'grayscale(100%) opacity(0.6)';
        document.body.style.pointerEvents = 'none';
        return showNotFound();
    }

    const sizes = product.productSizes || [];
    const prices = product.productPrice || [];
    const oldPrices = product.productOldPrice || [];

    const variants = sizes.map((size, i) => ({
        size,
        price: prices[i] || 0,
        mrp: oldPrices[i] || 0,
        discount: oldPrices[i] && oldPrices[i] > prices[i] ? Math.round(((oldPrices[i] - prices[i]) / oldPrices[i]) * 100) : 0
    }));

    currentProduct = {
        ...product,
        id: product.productId,
        name: product.productName,
        image: getImageUrl(product.productMainImage),
        brand: product.brandName,
        variants,
        selectedPrice: variants.length > 0 ? variants[0].price : 0,
        selectedSize: variants.length > 0 ? variants[0].size : ''
    };

    document.getElementById('product-name').textContent = currentProduct.name;

    const mainImg = document.getElementById('main-product-image');
    mainImg.src = currentProduct.image;
    mainImg.onerror = () => mainImg.src = FALLBACK_IMAGE;

    await renderThumbnails(product.productMainImage, product.productSubImages || []);

    renderVariantSelector();
    updatePriceDisplay();

    // const isAvailable = currentProduct.productQuantity > 0 && product.productStock === 'In-Stock';
    const isAvailable = (currentProduct.productQuantity || 0) > 0;
    
    const qtyInput = document.getElementById('quantity-input');
    const addBtn = document.getElementById('add-to-cart-btn');
    const buyBtn = document.getElementById('buy-now-btn');

    if (isAvailable) {
        qtyInput.max = Math.min(currentProduct.productQuantity);
        qtyInput.value = 1;
        qtyInput.disabled = false;
        addBtn.disabled = false;
        addBtn.innerHTML = '<i class="fas fa-shopping-cart mr-2"></i> Add to Cart';
        addBtn.className = 'flex-1 px-2 bg-[#295F98] hover:bg-[#5C7285] text-white font-bold py-3 rounded-lg text-md shadow-lg transition flex items-center justify-center';
        buyBtn.disabled = false;
        buyBtn.innerHTML = '<i class="fas fa-bolt mr-2"></i> Buy Now';
        buyBtn.className = 'px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg text-md shadow-lg transition';
    } else {
        qtyInput.disabled = true;
        qtyInput.value = 0;
        addBtn.disabled = true;
        addBtn.innerHTML = '<i class="fas fa-times-circle mr-2"></i> Out of Stock';
        addBtn.className = 'flex-1 px-2 bg-gray-400 cursor-not-allowed text-white font-bold py-3 rounded-lg';
        buyBtn.disabled = true;
        buyBtn.innerHTML = '<i class="fas fa-times-circle mr-2"></i> Out of Stock';
        buyBtn.className = 'px-6 bg-gray-400 cursor-not-allowed text-white font-bold py-3 rounded-lg';
    }

    renderAllTabs();
    updateWishlistButton();

    const related = await fetchRelatedProducts(currentProduct.productCategory, currentProduct.id);
    renderRelatedProducts(related);

    initCartButtons();
    setupPincodeChecker(); // New feature
    removeSkeleton();
}

function showNotFound() {
    document.getElementById('product-name').textContent = 'Product Not Found or Unavailable';
    document.getElementById('main-product-image').src = FALLBACK_IMAGE;
    document.getElementById('selling-price').textContent = '—';
    document.getElementById('discount-badge').classList.add('hidden');
    document.querySelector('.line-through')?.classList.add('hidden');
    removeSkeleton();
}

function initTabs() {
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab + '-content').classList.add('active');
        });
    });
}

function initQuantitySelector() {
    const dec = document.getElementById('decrease-qty');
    const inc = document.getElementById('increase-qty');
    const input = document.getElementById('quantity-input');
    if (!dec || !inc || !input) return;
    dec.onclick = () => { if (parseInt(input.value) > 1) input.value = parseInt(input.value) - 1; };
    inc.onclick = () => { if (parseInt(input.value) < parseInt(input.max)) input.value = parseInt(input.value) + 1; };
    input.onchange = () => {
        let v = parseInt(input.value);
        if (isNaN(v) || v < 1) v = 1;
        if (v > parseInt(input.max)) v = parseInt(input.max);
        input.value = v;
    };
}

function initCartButtons() {
    const addBtn = document.getElementById('add-to-cart-btn');
    const buyBtn = document.getElementById('buy-now-btn');
    if (addBtn && currentProduct && currentProduct.productQuantity > 0) {
        addBtn.onclick = async () => {
            const qty = parseInt(document.getElementById('quantity-input').value) || 1;
            currentProduct.selectedPrice = currentProduct.variants?.[selectedVariantIndex]?.price || currentProduct.price;
            currentProduct.selectedSize = currentProduct.variants?.[selectedVariantIndex]?.size || '';
            await addToCart(currentProduct, qty);
        };
    }
    if (buyBtn && currentProduct && currentProduct.productQuantity > 0) {
        buyBtn.onclick = async () => {
            const qty = parseInt(document.getElementById('quantity-input').value) || 1;
            currentProduct.selectedPrice = currentProduct.variants?.[selectedVariantIndex]?.price || currentProduct.price;
            currentProduct.selectedSize = currentProduct.variants?.[selectedVariantIndex]?.size || '';
            await addToCart(currentProduct, qty);
            setTimeout(() => window.location.href = 'cart.html', 300);
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initQuantitySelector();
    updateCartCount();
    updateRightCartPanel();
    loadProduct();

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInFromRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOutToRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
        .animate-in { animation: slideInFromRight 0.3s ease-out; }
        .animate-out { animation: slideOutToRight 0.3s ease-in; }
        .toast-notification { min-width: 300px; }
    `;
    document.head.appendChild(style);
});










// // ==================== productdetails.js ====================
// const API_BASE_URL = 'http://localhost:8083/api/products';
// const API_BASE_IMG_URL = 'http://localhost:8083';
// const CART_API_BASE = 'http://localhost:8083/api/cart';
// const WISHLIST_API_BASE = 'http://localhost:8083/api/wishlist';
// const FALLBACK_IMAGE = './Images/product_details_fallback_img.jpg';

// // Global variables
// let cart = JSON.parse(localStorage.getItem('cart') || '[]');


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
// console.log("getCurrentUserId function returns :", getCurrentUserId());


// let currentProduct = null;
// let currentUserId = getCurrentUserId();
// let selectedVariantIndex = 0;

// // ------------------- Utility Functions -------------------
// function removeSkeleton() {
//     document.querySelectorAll('.skeleton').forEach(el => {
//         el.classList.remove('skeleton');
//         el.style.background = '';
//         el.style.backgroundImage = '';
//         el.style.animation = '';
//     });
// }

// function showToast(message, type = "success") {
//     document.querySelectorAll('.toast-notification').forEach(toast => toast.remove());
//     const toast = document.createElement('div');
//     toast.className = `toast-notification fixed top-20 right-4 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
//     toast.textContent = message;
//     document.body.appendChild(toast);
//     setTimeout(() => {
//         toast.style.opacity = '0';
//         toast.style.transition = 'opacity 0.3s';
//         setTimeout(() => toast.remove(), 300);
//     }, 2000);
// }

// function updateCartCount() {
//     const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
//     ['desktop-cart-count', 'mobile-cart-count'].forEach(id => {
//         const el = document.getElementById(id);
//         if (el) {
//             el.textContent = total;
//             el.style.display = total > 0 ? 'flex' : 'none';
//         }
//     });
// }

// function updateRightCartPanel() {
//     const items = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);
//     const countEl = document.getElementById('cart-items-number');
//     const textEl = document.getElementById('cart-items-text');
//     const fullText = document.getElementById('cart-item-count-display');
//     if (countEl) countEl.textContent = items;
//     if (textEl) textEl.textContent = items === 1 ? '' : 's';
//     if (fullText) {
//         fullText.innerHTML = items === 0
//             ? 'Your cart is empty'
//             : `<span id="cart-items-number">${items}</span> Item<span id="cart-items-text">${items === 1 ? '' : 's'}</span> in Cart`;
//     }
// }

// function updateLocalCart(product, qty = 1) {
//     const cartItem = {
//         id: product.id,
//         name: product.name,
//         price: Number(product.selectedPrice),
//         image: product.image,
//         quantity: qty,
//         brand: product.brand || '',
//         unit: product.selectedSize || '',
//         type: "PRODUCT",
//         productId: product.id,
//         productType: "MEDICINE"
//     };
//     const existing = cart.find(item => item.id == cartItem.id && item.unit === cartItem.unit);
//     if (existing) {
//         existing.quantity += qty;
//     } else {
//         cart.push(cartItem);
//     }
//     // localStorage.setItem('cart', JSON.stringify(cart));
//     updateCartCount();
//     updateRightCartPanel();
// }

// // ------------------- Backend Cart & Wishlist -------------------
// async function getValidUserId() {
//   try {
//     // First check sessionStorage (most common for login sessions)
//     let userData = sessionStorage.getItem('currentUser');
    
//     // If not found, fall back to localStorage
//     if (!userData) {
//       userData = localStorage.getItem('currentUser');
//     }

//     if (!userData) {
//       console.log('[getValidUserId] No user data found in sessionStorage or localStorage (key: currentUser)');
//       return null;
//     }

//     const user = JSON.parse(userData);

//     // Extract userId safely
//     const userId = user.userId || user.id || user.userID;

//     if (!userId || isNaN(userId)) {
//       console.log('[getValidUserId] Invalid or missing userId in stored user data:', user);
//       return null;
//     }

//     console.log(`[getValidUserId] Valid user found: ${userId} (${user.firstName || 'User'})`);
//     return Number(userId); // → returns 14

//   } catch (error) {
//     console.error('[getValidUserId] Failed to parse user data:', error);
//     return null;
//   }
// }

// async function addToCartBackend(product, qty = 1) {
//     try {
//         const payload = {
//             userId: currentUserId,
//             type: "PRODUCT",
//             productId: product.id,
//             quantity: qty,
//             selectedSize: product.selectedSize || "",
//             productType: "MEDICINE"
//         };
//         const response = await fetch(`${CART_API_BASE}/add-cart-items`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//         });
//         if (!response.ok) {
//             const err = await response.text();
//             if (err.includes("User not found")) {
//                 currentUserId = await getValidUserId();
//                 payload.userId = currentUserId;
//                 const retry = await fetch(`${CART_API_BASE}/add-cart-items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
//                 return retry.ok;
//             }
//             throw new Error(err);
//         }
//         return true;
//     } catch (err) {
//         console.error("Backend cart error:", err);
//         return false;
//     }
// }

// async function syncCartFromBackend() {
//     try {
//         const response = await fetch(`${CART_API_BASE}/get-cart-items?userId=${currentUserId}`);
//         if (response.ok) {
//             const items = await response.json();
//             cart = items.map(item => ({
//                 id: item.itemId,
//                 name: item.title,
//                 price: Number(item.price),
//                 image: item.imageUrl,
//                 quantity: item.quantity,
//                 brand: '',
//                 unit: item.selectedSize || '',
//                 type: item.type,
//                 productId: item.itemId,
//                 productType: item.productType
//             }));
//             localStorage.setItem('cart', JSON.stringify(cart));
//             updateCartCount();
//             updateRightCartPanel();
//         }
//     } catch (err) {
//         console.error("Failed to sync cart:", err);
//     }
// }

// async function addToWishlistBackend(product) {
//     try {
//         const response = await fetch(`${WISHLIST_API_BASE}/add-wishlist-items`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ userId: currentUserId, productId: product.id, productType: "MEDICINE" })
//         });
//         return response.ok;
//     } catch (err) { console.error(err); return false; }
// }

// async function removeFromWishlistBackend(product) {
//     try {
//         const response = await fetch(`${WISHLIST_API_BASE}/remove-wishlist-items`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ userId: currentUserId, productId: product.id })
//         });
//         return response.ok;
//     } catch (err) { console.error(err); return false; }
// }

// async function isInWishlistBackend(productId) {
//     try {
//         const response = await fetch(`${WISHLIST_API_BASE}/get-wishlist-items?userId=${currentUserId}`);
//         if (!response.ok) return false;
//         const items = await response.json();
//         return items.some(item => item.productId == productId);
//     } catch (err) { return false; }
// }

// function updateLocalWishlistSync(product, isAdded) {
//     let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
//     if (isAdded) {
//         if (!wishlist.some(p => p.id === product.id)) {
//             wishlist.push({ id: product.id, name: product.name, price: product.selectedPrice, image: product.image, brand: product.brand, unit: product.selectedSize });
//         }
//     } else {
//         wishlist = wishlist.filter(p => p.id !== product.id);
//     }
//     localStorage.setItem('wishlist', JSON.stringify(wishlist));
//     window.dispatchEvent(new CustomEvent('wishlistUpdated'));
// }

// async function toggleWishlist(product) {
//     const btn = document.getElementById('wishlist-btn');
//     if (!btn) return;
//     const icon = btn.querySelector('i');
//     const isAdded = icon.classList.contains('fas');
//     const success = isAdded ? await removeFromWishlistBackend(product) : await addToWishlistBackend(product);
//     if (success) {
//         icon.className = isAdded ? 'far fa-heart text-2xl text-gray-600' : 'fas fa-heart text-2xl text-red-500';
//         btn.title = isAdded ? 'Add to wishlist' : 'Remove from wishlist';
//         showToast(isAdded ? 'Removed from wishlist!' : 'Added to wishlist!');
//         updateLocalWishlistSync(product, !isAdded);
//     }
// }

// function updateWishlistButton() {
//     const btn = document.getElementById('wishlist-btn');
//     if (!btn || !currentProduct) return;
//     const icon = btn.querySelector('i');
//     icon.className = 'far fa-heart text-2xl text-gray-600';
//     btn.title = 'Add to wishlist';
//     isInWishlistBackend(currentProduct.id).then(isAdded => {
//         if (isAdded) {
//             icon.className = 'fas fa-heart text-2xl text-red-500';
//             btn.title = 'Remove from wishlist';
//         }
//         btn.onclick = () => toggleWishlist(currentProduct);
//     });
// }

// async function addToCart(product, qty = 1) {
//     const success = await addToCartBackend(product, qty);
//     showToast(success ? `${qty} item${qty > 1 ? 's' : ''} added to cart!` : `${qty} item${qty > 1 ? 's' : ''} added`);
//     updateLocalCart(product, qty);
// }

// // ------------------- Image Helper -------------------
// function getImageUrl(path) {
//     if (!path) return FALLBACK_IMAGE;
//     if (path.startsWith('http') || path.startsWith('data:')) return path;
//     return API_BASE_IMG_URL + path;
// }

// // ------------------- Variant & Price Logic -------------------
// function updatePriceDisplay() {
//     if (!currentProduct || !currentProduct.variants || currentProduct.variants.length === 0) {
//         document.getElementById('selling-price').textContent = currentProduct?.priceText || '—';
//         document.querySelector('.line-through')?.classList.add('hidden');
//         document.getElementById('discount-badge')?.classList.add('hidden');
//         return;
//     }

//     const variant = currentProduct.variants[selectedVariantIndex];
//     document.getElementById('selling-price').textContent = `₹${variant.price.toFixed(0)}`;

//     const mrpEl = document.getElementById('mrp-price');
//     const discountBadge = document.getElementById('discount-badge');
//     const lineThrough = document.querySelector('.line-through');

//     if (variant.mrp && variant.mrp > variant.price) {
//         mrpEl.textContent = `₹${variant.mrp.toFixed(0)}`;
//         discountBadge.textContent = `${variant.discount}% OFF`;
//         discountBadge.classList.remove('hidden');
//         lineThrough?.classList.remove('hidden');
//     } else {
//         discountBadge.classList.add('hidden');
//         lineThrough?.classList.add('hidden');
//     }

//     document.getElementById('product-unit').textContent = variant.size;
// }

// // Global function for variant selection with active state update
// window.selectVariant = function(index) {
//     selectedVariantIndex = index;
//     updatePriceDisplay();

//     // Update active button style
//     document.querySelectorAll('#variant-selector button').forEach((btn, i) => {
//         if (i === index) {
//             btn.classList.remove('border-gray-300', 'hover:border-gray-400');
//             btn.classList.add('border-pharmeasy-green', 'bg-pharmeasy-light-green');
//         } else {
//             btn.classList.remove('border-pharmeasy-green', 'bg-pharmeasy-light-green');
//             btn.classList.add('border-gray-300', 'hover:border-gray-400');
//         }
//     });
// };


// // ------------------- API Calls -------------------
// async function fetchProductById(productId) {
//     const urls = [
//         `${API_BASE_URL}/${productId}`,
//         `${API_BASE_URL}/get-by-id/${productId}`,
//         `${API_BASE_URL}/get-product/${productId}`,
//         `${API_BASE_URL}/product/${productId}`
//     ];
//     for (const url of urls) {
//         try {
//             const res = await fetch(url);
//             if (res.ok) return await res.json();
//         } catch (e) {}
//     }
//     return null;
// }

// async function fetchRelatedProducts(category, currentId) {
//     try {
//         const res = await fetch(`${API_BASE_URL}/get-by-category/${encodeURIComponent(category)}`);
//         if (!res.ok) return [];
//         const products = await res.json();
//         return products.filter(p => p.productId != currentId && p.productQuantity > 0 && !p.deleted).slice(0, 4);
//     } catch (err) { return []; }
// }


// // Render variant selector
// function renderVariantSelector() {
//     const sizes = currentProduct.productSizes || [];
//     if (sizes.length <= 1) return;

//     let html = `
//         <div id="variant-selector" class="mb-6">
//             <label class="block text-sm font-medium text-gray-700 mb-2">Select Size:</label>
//             <div class="flex flex-wrap gap-3">
//     `;

//     sizes.forEach((size, i) => {
//         const price = currentProduct.productPrice[i] || 0;
//         const activeClass = i === 0 ? 'border-pharmeasy-green bg-pharmeasy-light-green' : 'border-gray-300 hover:border-gray-400';
//         html += `
//             <button 
//                 class="px-4 py-2 border rounded-lg text-sm font-medium transition ${activeClass}"
//                 onclick="selectVariant(${i})">
//                 ${size} <span class="text-pharmeasy-green font-bold">₹${price.toFixed(0)}</span>
//             </button>
//         `;
//     });

//     html += `</div></div>`;

//     const quantitySection = document.querySelector('#quantity-input').closest('.mb-6');
//     quantitySection.insertAdjacentHTML('beforebegin', html);
// }

// // ------------------- Pincode Delivery Checker -------------------
// // ------------------- Pincode Delivery Checker (Restricted to Phaltan Only) -------------------
// function setupPincodeChecker() {
//     const pincodeInput = document.getElementById('pincodeInput');
//     const checkBtn = document.getElementById('checkPincodeBtn');
//     if (!pincodeInput || !checkBtn) return;

//     const resultDiv = document.getElementById('deliveryResult');
//     const successDiv = document.getElementById('deliverySuccess');
//     const errorDiv = document.getElementById('deliveryError');
//     const locationText = document.getElementById('deliveryLocation');
//     const deliveryTime = document.getElementById('deliveryTime');
//     const deliveryOffer = document.getElementById('deliveryOffer');

//     // Only these pincodes are deliverable
//     const allowedPincodes = ['415521', '415522', '415523', '415528'];

//     // Load saved pincode if still valid
//     const savedPincode = localStorage.getItem('lastValidPincode');
//     if (savedPincode && allowedPincodes.includes(savedPincode)) {
//         pincodeInput.value = savedPincode;
//         checkPincodeRealTime(savedPincode);
//     }

//     // Allow only digits, max 6
//     pincodeInput.addEventListener('input', (e) => {
//         e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
//     });

//     const checkPincode = async () => {
//         const pincode = pincodeInput.value.trim();
//         if (pincode.length !== 6) {
//             showToast('Enter a valid 6-digit pincode', 'error');
//             return;
//         }

//         checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
//         checkBtn.disabled = true;

//         await checkPincodeRealTime(pincode);

//         checkBtn.innerHTML = '<i class="fas fa-search-location"></i> Check';
//         checkBtn.disabled = false;
//     };

//     checkBtn.addEventListener('click', checkPincode);
//     pincodeInput.addEventListener('keypress', (e) => {
//         if (e.key === 'Enter') checkPincode();
//     });

//     async function checkPincodeRealTime(pincode) {
//         resultDiv.classList.remove('hidden');

//         // First: Check if pincode is in allowed list
//         if (!allowedPincodes.includes(pincode)) {
//             showDeliveryError("Delivery not available for this area");
//             return;
//         }

//         try {
//             const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
//             const data = await response.json();

//             if (!data || data[0]?.Status !== "Success" || !data[0].PostOffice || data[0].PostOffice.length === 0) {
//                 showDeliveryError("Invalid pincode");
//                 return;
//             }

//             const postOffice = data[0].PostOffice[0]; // Take first post office name
//             const areaName = postOffice.Name;
//             const district = postOffice.District;
//             const state = postOffice.State;

//             // Success!
//             successDiv.classList.remove('hidden');
//             errorDiv.classList.add('hidden');

//             locationText.textContent = `${areaName}, Phaltan, ${district}, ${state}`;

//             if (deliveryTime) {
//                 deliveryTime.textContent = 'Delivery within 3-4 days';
//             }
//             if (deliveryOffer) {
//                 deliveryOffer.textContent = '';
//             }

//             // Save valid pincode and area
//             localStorage.setItem('lastValidPincode', pincode);
//             localStorage.setItem('lastDeliveryArea', `${areaName}, Phaltan, ${district}`);

//             showToast('Delivery available!', 'success');

//         } catch (err) {
//             console.error("Pincode check failed:", err);
//             showDeliveryError("Network error. Please try again.");
//         }
//     }

//     function showDeliveryError(message) {
//         successDiv.classList.add('hidden');
//         errorDiv.classList.remove('hidden');
//         errorDiv.querySelector('p:last-child').textContent = message;

//         // Clear saved data if delivery not available
//         localStorage.removeItem('lastValidPincode');
//         localStorage.removeItem('lastDeliveryArea');
//     }
// }
// // ------------------- Rendering Functions -------------------
// async function renderThumbnails(mainPath, subPaths = []) {
//     const container = document.getElementById('thumbnail-container');
//     if (!container) return;
//     container.innerHTML = '';

//     const allImages = [getImageUrl(mainPath), ...subPaths.map(getImageUrl)];

//     allImages.forEach((src, i) => {
//         const img = document.createElement('img');
//         img.src = src;
//         img.alt = 'Thumbnail';
//         img.className = 'w-20 h-20 object-contain border-2 rounded-lg cursor-pointer hover:border-pharmeasy-green transition';
//         img.onerror = () => img.src = FALLBACK_IMAGE;
//         img.onclick = () => {
//             document.getElementById('main-product-image').src = src;
//             container.querySelectorAll('img').forEach(t => t.classList.remove('border-pharmeasy-green'));
//             img.classList.add('border-pharmeasy-green');
//         };
//         container.appendChild(img);
//     });

//     if (container.children.length > 0) container.children[0].classList.add('border-pharmeasy-green');
// }

// function formatDate(dateStr) {
//     if (!dateStr) return 'Not specified';
//     try { return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
//     catch { return dateStr; }
// }

// function renderProductDetailsTab() {
//     const tbody = document.getElementById('specifications-table-body');
//     if (!tbody || !currentProduct) return;
//     tbody.innerHTML = '';
//     const dyn = currentProduct.productDynamicFields || {};
//     const rows = [
//         { label: 'Product Description', value: currentProduct.productDescription || 'No description available' },
//         { label: 'Brand', value: currentProduct.brandName || 'Generic' },
//         { label: 'Category', value: currentProduct.productSubCategory || currentProduct.productCategory || 'Health Supplements' },
//         { label: 'Manufacturing Date', value: formatDate(currentProduct.mfgDate) },
//         { label: 'Expiry Date', value: formatDate(currentProduct.expDate) },
//         { label: 'Batch Number', value: currentProduct.batchNo || 'Not specified' },
//         { label: 'Available Quantity', value: currentProduct.productQuantity || 0 },
//         { label: 'Form', value: dyn.form || 'Not specified' },
//         { label: 'Strength', value: dyn.strength || 'Not specified' },
//         { label: 'Country of Origin', value: dyn.countryOfOrigin || 'India' }
//     ];
//     rows.forEach((r, i) => {
//         if (r.value && r.value.toString().trim()) {
//             tbody.innerHTML += `
//                 <tr class="${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
//                     <td class="spec-label py-3 px-6 border-b border-gray-200"><span class="font-semibold text-gray-700">${r.label}</span></td>
//                     <td class="spec-value py-3 px-6 border-b border-gray-200 text-gray-600">${r.value}</td>
//                 </tr>
//             `;
//         }
//     });
// }

// function renderBenefitsTab() {
//     const el = document.getElementById('benefits-content');
//     if (!el || !currentProduct) return;
//     const list = currentProduct.benefitsList || [];
//     el.innerHTML = list.length === 0
//         ? `<div class="py-8"><h3 class="text-xl font-bold text-gray-800 mb-6">Product Benefits</h3><p class="text-gray-600">No benefits information available.</p></div>`
//         : `<div class="py-8"><h3 class="text-xl font-bold text-gray-800 mb-6">Key Benefits</h3><div class="bg-white rounded-lg border p-6"><ul class="space-y-4">${list.map(b => `<li class="flex items-start"><span class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1"><i class="fas fa-check text-green-600 text-sm"></i></span><span class="text-gray-700">${b}</span></li>`).join('')}</ul></div></div>`;
// }

// function renderIngredientsTab() {
//     const el = document.getElementById('ingredients-content');
//     if (!el || !currentProduct) return;
//     const list = currentProduct.ingredientsList || [];
//     el.innerHTML = list.length === 0
//         ? `<div class="py-8"><h3 class="text-xl font-bold text-gray-800 mb-6">Product Ingredients</h3><p class="text-gray-600">No ingredients information available.</p></div>`
//         : `<div class="py-8"><h3 class="text-xl font-bold text-gray-800 mb-6">Product Composition</h3><div class="bg-white rounded-lg border p-6"><ul class="space-y-3">${list.map((ing, i) => `<li class="flex items-start"><span class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1 text-blue-600 text-xs font-bold">${i+1}</span><span class="text-gray-700">${ing}</span></li>`).join('')}</ul></div></div>`;
// }

// function renderDirectionsTab() {
//     // const el = document.getElementById('directions-content');
//     if (!el || !currentProduct) return;
//     const list = currentProduct.directionsList || [];
//     const dyn = currentProduct.productDynamicFields || {};
//     let html = `<div class="py-8"><h3 class="text-xl font-bold text-gray-800 mb-6">Directions for Use</h3>`;
//     if (list.length > 0) {
//         html += `<div class="mb-8"><div class="bg-white rounded-lg border p-6"><ul class="space-y-4">${list.map((d, i) => `<li class="flex items-start"><span class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3 mt-1 text-orange-600 font-bold">${i+1}</span><span class="text-gray-700">${d}</span></li>`).join('')}</ul></div></div>`;
//     }
//     const extra = [];
//     if (dyn.dosage) extra.push({ l: 'Recommended Dosage', v: dyn.dosage });
//     extra.push({ l: 'Prescription Required', v: currentProduct.prescriptionRequired ? '<span class="text-red-600 font-semibold">Yes</span>' : '<span class="text-green-600 font-semibold">No</span>' });
//     if (dyn.storage) extra.push({ l: 'Storage Instructions', v: dyn.storage });
//     if (dyn.suitableFor) extra.push({ l: 'Suitable For', v: dyn.suitableFor });
//     if (extra.length > 0) {
//         html += `<div><h4 class="text-lg font-bold text-gray-800 mb-4">Additional Information</h4><div class="bg-gray-50 rounded-lg border p-6"><table class="w-full"><tbody>${extra.map(e => `<tr class="border-b last:border-b-0"><td class="py-3 font-medium text-gray-700 w-1/3">${e.l}</td><td class="py-3 text-gray-600">${e.v}</td></tr>`).join('')}</tbody></table></div></div>`;
//     }
//     html += `</div>`;
//     el.innerHTML = html;
// }

// function renderAllTabs() {
//     renderProductDetailsTab();
//     renderBenefitsTab();
//     renderIngredientsTab();
//     // renderDirectionsTab();
// }

// function renderRelatedProducts(products) {
//     const container = document.getElementById('related-products-container');
//     if (!container) return;
//     container.innerHTML = products.length === 0 ? '<p class="col-span-full text-center text-gray-500 py-8">No related products found</p>' : '';
//     products.forEach(p => {
//         const priceText = p.productPrice?.length ? `₹${Math.min(...p.productPrice.filter(x=>x>0))}` : 'Price on request';
//         container.innerHTML += `
//             <div class="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition cursor-pointer">
//                 <img src="${getImageUrl(p.productMainImage)}" onerror="this.src='${FALLBACK_IMAGE}'" class="w-full h-40 object-cover rounded-lg mb-3" alt="${p.productName}">
//                 <h4 class="font-medium text-sm line-clamp-2 mb-1">${p.productName}</h4>
//                 <p class="text-xs text-gray-500">${p.brandName || 'Generic'}</p>
//                 <div class="mt-2"><span class="text-lg font-bold text-green-600">${priceText}</span></div>
//                 <button onclick="window.location.href='productdetails.html?id=${p.productId}'" class="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm">View Details</button>
//             </div>
//         `;
//     });
// }

// // ------------------- Main Load Function -------------------
// async function loadProduct() {
//     currentUserId = await getValidUserId();
//     await syncCartFromBackend();

//     const params = new URLSearchParams(window.location.search);
//     const productId = params.get('id');
//     if (!productId) return showNotFound();

//     const product = await fetchProductById(productId);
//     if (!product) return showNotFound();
//     if (product.deleted) {
//         document.getElementById('product-name').textContent = product.productName + ' (Unavailable)';
//         document.body.style.filter = 'grayscale(100%) opacity(0.6)';
//         document.body.style.pointerEvents = 'none';
//         return showNotFound();
//     }

//     const sizes = product.productSizes || [];
//     const prices = product.productPrice || [];
//     const oldPrices = product.productOldPrice || [];

//     const variants = sizes.map((size, i) => ({
//         size,
//         price: prices[i] || 0,
//         mrp: oldPrices[i] || 0,
//         discount: oldPrices[i] && oldPrices[i] > prices[i] ? Math.round(((oldPrices[i] - prices[i]) / oldPrices[i]) * 100) : 0
//     }));

//     currentProduct = {
//         ...product,
//         id: product.productId,
//         name: product.productName,
//         image: getImageUrl(product.productMainImage),
//         brand: product.brandName,
//         variants,
//         selectedPrice: variants.length > 0 ? variants[0].price : 0,
//         selectedSize: variants.length > 0 ? variants[0].size : ''
//     };

//     document.getElementById('product-name').textContent = currentProduct.name;

//     const mainImg = document.getElementById('main-product-image');
//     mainImg.src = currentProduct.image;
//     mainImg.onerror = () => mainImg.src = FALLBACK_IMAGE;

//     await renderThumbnails(product.productMainImage, product.productSubImages || []);

//     renderVariantSelector();
//     updatePriceDisplay();

//     const isAvailable = currentProduct.productQuantity > 0 && product.productStock === 'In-Stock';
//     const qtyInput = document.getElementById('quantity-input');
//     const addBtn = document.getElementById('add-to-cart-btn');
//     const buyBtn = document.getElementById('buy-now-btn');

//     if (isAvailable) {
//         qtyInput.max = Math.min(currentProduct.productQuantity);
//         qtyInput.value = 1;
//         qtyInput.disabled = false;
//         addBtn.disabled = false;
//         addBtn.innerHTML = '<i class="fas fa-shopping-cart mr-2"></i> Add to Cart';
//         addBtn.className = 'flex-1 px-2 bg-[#295F98] hover:bg-[#5C7285] text-white font-bold py-3 rounded-lg text-md shadow-lg transition flex items-center justify-center';
//         buyBtn.disabled = false;
//         buyBtn.innerHTML = '<i class="fas fa-bolt mr-2"></i> Buy Now';
//         buyBtn.className = 'px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg text-md shadow-lg transition';
//     } else {
//         qtyInput.disabled = true;
//         qtyInput.value = 0;
//         addBtn.disabled = true;
//         addBtn.innerHTML = '<i class="fas fa-times-circle mr-2"></i> Out of Stock';
//         addBtn.className = 'flex-1 px-2 bg-gray-400 cursor-not-allowed text-white font-bold py-3 rounded-lg';
//         buyBtn.disabled = true;
//         buyBtn.innerHTML = '<i class="fas fa-times-circle mr-2"></i> Out of Stock';
//         buyBtn.className = 'px-6 bg-gray-400 cursor-not-allowed text-white font-bold py-3 rounded-lg';
//     }

//     renderAllTabs();
//     updateWishlistButton();

//     const related = await fetchRelatedProducts(currentProduct.productCategory, currentProduct.id);
//     renderRelatedProducts(related);

//     initCartButtons();
//     setupPincodeChecker(); // New feature
//     removeSkeleton();
// }

// function showNotFound() {
//     document.getElementById('product-name').textContent = 'Product Not Found or Unavailable';
//     document.getElementById('main-product-image').src = FALLBACK_IMAGE;
//     document.getElementById('selling-price').textContent = '—';
//     document.getElementById('discount-badge').classList.add('hidden');
//     document.querySelector('.line-through')?.classList.add('hidden');
//     removeSkeleton();
// }

// function initTabs() {
//     document.querySelectorAll('.tab-button').forEach(btn => {
//         btn.addEventListener('click', () => {
//             document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
//             document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
//             btn.classList.add('active');
//             document.getElementById(btn.dataset.tab + '-content').classList.add('active');
//         });
//     });
// }

// function initQuantitySelector() {
//     const dec = document.getElementById('decrease-qty');
//     const inc = document.getElementById('increase-qty');
//     const input = document.getElementById('quantity-input');
//     if (!dec || !inc || !input) return;
//     dec.onclick = () => { if (parseInt(input.value) > 1) input.value = parseInt(input.value) - 1; };
//     inc.onclick = () => { if (parseInt(input.value) < parseInt(input.max)) input.value = parseInt(input.value) + 1; };
//     input.onchange = () => {
//         let v = parseInt(input.value);
//         if (isNaN(v) || v < 1) v = 1;
//         if (v > parseInt(input.max)) v = parseInt(input.max);
//         input.value = v;
//     };
// }

// function initCartButtons() {
//     const addBtn = document.getElementById('add-to-cart-btn');
//     const buyBtn = document.getElementById('buy-now-btn');
//     if (addBtn && currentProduct && currentProduct.productQuantity > 0) {
//         addBtn.onclick = async () => {
//             const qty = parseInt(document.getElementById('quantity-input').value) || 1;
//             currentProduct.selectedPrice = currentProduct.variants?.[selectedVariantIndex]?.price || currentProduct.price;
//             currentProduct.selectedSize = currentProduct.variants?.[selectedVariantIndex]?.size || '';
//             await addToCart(currentProduct, qty);
//         };
//     }
//     if (buyBtn && currentProduct && currentProduct.productQuantity > 0) {
//         buyBtn.onclick = async () => {
//             const qty = parseInt(document.getElementById('quantity-input').value) || 1;
//             currentProduct.selectedPrice = currentProduct.variants?.[selectedVariantIndex]?.price || currentProduct.price;
//             currentProduct.selectedSize = currentProduct.variants?.[selectedVariantIndex]?.size || '';
//             await addToCart(currentProduct, qty);
//             setTimeout(() => window.location.href = 'cart.html', 300);
//         };
//     }
// }

// document.addEventListener('DOMContentLoaded', () => {
//     initTabs();
//     initQuantitySelector();
//     updateCartCount();
//     updateRightCartPanel();
//     loadProduct();

//     const style = document.createElement('style');
//     style.textContent = `
//         @keyframes slideInFromRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
//         @keyframes slideOutToRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
//         .animate-in { animation: slideInFromRight 0.3s ease-out; }
//         .animate-out { animation: slideOutToRight 0.3s ease-in; }
//         .toast-notification { min-width: 300px; }
//     `;
//     document.head.appendChild(style);
// });







