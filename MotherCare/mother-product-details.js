// ====================== CONFIG & GLOBALS ======================
let currentProduct = null;
let quantity = 1;
let selectedVariant = null;
let currentUserId = null;

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

async function getValidUserId() {
  try {
    let userData = sessionStorage.getItem('currentUser');
    if (!userData) {
      userData = localStorage.getItem('currentUser');
    }

    if (!userData) {
      console.log('[getValidUserId] No user data found');
      return null;
    }

    const user = JSON.parse(userData);
    const userId = user.userId || user.id || user.userID;

    if (!userId || isNaN(userId)) {
      console.log('[getValidUserId] Invalid userId:', user);
      return null;
    }

    console.log(`[getValidUserId] Valid user: ${userId}`);
    return Number(userId);

  } catch (error) {
    console.error('[getValidUserId] Parse error:', error);
    return null;
  }
}

const API_BASE = "http://localhost:8083/api/mb/products";
const IMAGE_BASE = "http://localhost:8083";
const CART_API_BASE = "http://localhost:8083/api/cart";
const WISHLIST_API_BASE = "http://localhost:8083/api/wishlist";
const selectedId = localStorage.getItem("selectedProductId");

// ====================== HELPER FUNCTIONS ======================
function getStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) html += '<i class="fas fa-star text-yellow-400"></i>';
        else if (i === Math.ceil(rating) && rating % 1 >= 0.5) html += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
        else html += '<i class="far fa-star text-yellow-400"></i>';
    }
    return html;
}

function updatePriceDisplay() {
    if (!selectedVariant) return;
    const currentPriceEl = document.getElementById('current-price');
    const originalPriceEl = document.getElementById('original-price');
    const discountBadgeEl = document.getElementById('discount-badge');
    if (currentPriceEl) currentPriceEl.textContent = `₹${selectedVariant.price.toLocaleString()}`;
    if (originalPriceEl) {
        originalPriceEl.textContent = selectedVariant.originalPrice ? `₹${selectedVariant.originalPrice.toLocaleString()}` : '';
        originalPriceEl.classList.toggle('hidden', !selectedVariant.originalPrice);
    }
    if (discountBadgeEl) {
        if (selectedVariant.originalPrice && selectedVariant.originalPrice > selectedVariant.price) {
            const discount = Math.round(((selectedVariant.originalPrice - selectedVariant.price) / selectedVariant.originalPrice) * 100);
            discountBadgeEl.textContent = `${discount}% OFF`;
            discountBadgeEl.classList.remove('hidden');
        } else {
            discountBadgeEl.classList.add('hidden');
        }
    }
}

function selectSize(btn, variant) {
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedVariant = variant;
    updatePriceDisplay();
    const cartBtn = document.getElementById('addToCartBtn');
    if (cartBtn) {
        cartBtn.disabled = false;
        cartBtn.classList.remove('opacity-50', 'bg-gray-400', 'cursor-not-allowed');
        cartBtn.classList.add('bg-[#CD2C58]', 'hover:bg-[#850E35]');
        cartBtn.innerHTML = `<i class="fas fa-shopping-cart mr-3"></i> Add to Cart`;
    }
}

function navigateToProduct(productId) {
    localStorage.setItem('selectedProductId', productId);
    window.location.reload();
}

function showToast(msg) {
    const toast = document.createElement("div");
    toast.textContent = msg;
    toast.className = "fixed bottom-24 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full z-50 shadow-2xl text-sm font-medium";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    document.querySelectorAll("#cartCount, .cart-count").forEach(el => {
        el.textContent = total;
        el.classList.toggle("hidden", total === 0);
    });
}

function updateWishlistCount() {
    const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    document.querySelectorAll("#wishlistCount, .wishlist-count").forEach(el => {
        el.textContent = wishlist.length;
        el.classList.toggle("hidden", wishlist.length === 0);
    });
}

// function updateLocalCart(qty) {
//     let cart = JSON.parse(localStorage.getItem("cart") || "[]");
//     const cartItem = {
//         id: currentProduct.id,
//         name: currentProduct.title,
//         size: selectedVariant?.size || "",
//         price: selectedVariant?.price || currentProduct.price?.[0] || 0,
//         originalPrice: selectedVariant?.originalPrice || null,
//         image: `${IMAGE_BASE}/api/mb/products/${currentProduct.id}/image`,
//         quantity: qty,
//         type: "MBP",
//         mbpId: currentProduct.id,
//         productType: "MOTHER"
//     };
//     const existing = cart.find(item => item.id === cartItem.id && item.size === cartItem.size);
//     if (existing) existing.quantity += qty;
//     else cart.push(cartItem);
//     localStorage.setItem("cart", JSON.stringify(cart));
//     updateCartCount();
// }



function updateLocalCart(qty) {
    if (!currentUserId) return; // Block local update if not logged in

    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const cartItem = {
        id: currentProduct.id,
        name: currentProduct.title,
        size: selectedVariant?.size || "",
        price: selectedVariant?.price || currentProduct.price?.[0] || 0,
        originalPrice: selectedVariant?.originalPrice || null,
        image: `${IMAGE_BASE}/api/mb/products/${currentProduct.id}/image`,
        quantity: qty,
        type: "MBP",
        mbpId: currentProduct.id,
        productType: "MOTHER"
    };
    const existing = cart.find(item => item.id === cartItem.id && item.size === cartItem.size);
    if (existing) existing.quantity += qty;
    else cart.push(cartItem);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}



// function updateLocalWishlistSync(product, isAdded) {
//     let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
//     if (isAdded) {
//         if (!wishlist.some(p => p.id === product.id)) {
//             wishlist.push({
//                 id: product.id,
//                 name: product.title,
//                 price: product.price?.[0] || 0,
//                 originalPrice: product.originalPrice?.[0] || null,
//                 image: `${IMAGE_BASE}/api/mb/products/${product.id}/image`
//             });
//         }
//     } else {
//         wishlist = wishlist.filter(p => p.id !== product.id);
//     }
//     localStorage.setItem("wishlist", JSON.stringify(wishlist));
//     updateWishlistCount();
// }





function updateLocalWishlistSync(product, isAdded) {
    if (!currentUserId) return; // Block local storage update

    let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    if (isAdded) {
        if (!wishlist.some(p => p.id === product.id)) {
            wishlist.push({
                id: product.id,
                name: product.title,
                price: product.price?.[0] || 0,
                originalPrice: product.originalPrice?.[0] || null,
                image: `${IMAGE_BASE}/api/mb/products/${product.id}/image`
            });
        }
    } else {
        wishlist = wishlist.filter(p => p.id !== product.id);
    }
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    updateWishlistCount();
}




// ====================== BACKEND INTEGRATIONS ======================
async function loadProductFromBackend(productId) {
    try {
        const response = await fetch(`${API_BASE}/${productId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error loading product:', error);
        return null;
    }
}

// MISSING FUNCTION ADDED HERE
async function addToCartBackend(qty = 1) {
  if (!currentUserId) return false;
  try {
    const payload = {
      userId: currentUserId,
      type: "MBP",
      mbpId: currentProduct.id,
      quantity: qty,
      selectedSize: selectedVariant?.size || "",
      productType: "MOTHER"
    };

    let response = await fetch(`${CART_API_BASE}/add-cart-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      if (err.includes("User not found")) {
        currentUserId = await getValidUserId();
        if (!currentUserId) return false;
        payload.userId = currentUserId;
        response = await fetch(`${CART_API_BASE}/add-cart-items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        return response.ok;
      }
      throw new Error(err);
    }
    return true;
  } catch (err) {
    console.error("Backend cart error:", err);
    return false;
  }
}

async function loadRelatedProducts() {
    const container = document.getElementById('relatedProductsContainer');
    if (!container) return;
    container.innerHTML = '<div class="text-center py-8 w-full"><i class="fas fa-spinner fa-spin text-3xl text-pink-600"></i><p class="mt-2 text-gray-600">Loading related products...</p></div>';
    try {
        if (!currentProduct || !currentProduct.subCategory) {
            container.innerHTML = '<div class="text-center text-gray-500 py-8 w-full"><p class="text-lg">No subcategory found</p></div>';
            return;
        }
        const subCategory = encodeURIComponent(currentProduct.subCategory.trim());
        const response = await fetch(`${API_BASE}/sub-category/${subCategory}`);
        if (!response.ok) throw new Error("Failed to fetch related products");
        const products = await response.json();
        const related = products.filter(p => p.id !== currentProduct.id).slice(0, 6);
        if (related.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500 py-8 w-full"><p class="text-lg">No related products found</p></div>';
            return;
        }
        container.innerHTML = '';
        related.forEach(product => {
            const price = product.price?.[0] || 0;
            const originalPrice = product.originalPrice?.[0] || null;
            const discount = product.discount || (originalPrice && originalPrice > price
                ? Math.round(((originalPrice - price) / originalPrice) * 100)
                : 0);
            const card = document.createElement('div');
            card.className = 'related-product-card bg-white rounded-xl shadow-md overflow-hidden cursor-pointer';
            card.innerHTML = `
                <div class="related-image-container relative">
                    <img src="${IMAGE_BASE}/api/mb/products/${product.id}/image" alt="${product.title}" class="w-full h-48 object-cover"
                         onerror="this.src='http://localhost:8083/Images/product_details_fallback_img.jpg'">
                    ${discount > 0 ? `<span class="absolute top-3 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">${discount}% OFF</span>` : ''}
                    <button class="absolute top-2 right-2 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 wishlist-btn" data-id="${product.id}">
                        <i class="far fa-heart text-pink-600"></i>
                    </button>
                </div>
                <div class="related-content-container p-4">
                    <h3 class="font-semibold text-gray-800 text-sm mb-1 truncate">${product.title}</h3>
                    <p class="text-gray-500 text-xs mb-2">${product.category || 'Mother Care'}</p>
                    <div class="flex items-center justify-between mt-2">
                        <div>
                            <span class="font-bold text-md text-green-600">₹${price.toLocaleString()}</span>
                            ${originalPrice ? `<span class="text-gray-500 text-sm line-through ml-1">₹${originalPrice.toLocaleString()}</span>` : ''}
                            ${discount > 0 ? `<span class="font-bold text-sm text-red-500 ml-1">(${discount}% OFF)</span>` : ''}
                        </div>
                    </div>
                </div>
                <button class="view-details-btn view-details-button w-full bg-pink-600 text-white py-2 font-medium hover:bg-pink-700" data-id="${product.id}">
                    <i class="fas fa-eye mr-2"></i> View Details
                </button>
            `;
            container.appendChild(card);
            card.onclick = (e) => {
                if (e.target.closest('.wishlist-btn') || e.target.closest('.view-details-button')) return;
                navigateToProduct(product.id);
            };
        });
        document.querySelectorAll('.view-details-button').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                navigateToProduct(btn.getAttribute('data-id'));
            };
        });
        document.querySelectorAll('.wishlist-btn').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const productId = parseInt(btn.getAttribute('data-id'));
                const product = related.find(p => p.id === productId);
                if (product) await toggleProductWishlistBackend(product, btn);
            };
        });
    } catch (error) {
        console.error('Error loading related products:', error);
        container.innerHTML = `<div class="text-center text-red-500 py-8 w-full"><p>Failed to load related products</p></div>`;
    }
}

// =============== WISHLIST BACKEND SYNC ===============
async function addToWishlistBackend(productId) {
    if (!currentUserId) return false;
    try {
        const response = await fetch(`${WISHLIST_API_BASE}/add-wishlist-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUserId,
                productId: productId,
                productType: "MOTHER"
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
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUserId,
                productId: productId,
                productType: "MOTHER"
            })
        });
        return response.ok;
    } catch (err) {
        console.error("Error removing from wishlist backend:", err);
        return false;
    }
}

async function isInWishlistBackend(productId) {
    if (!currentUserId) return false;
    try {
        const response = await fetch(`${WISHLIST_API_BASE}/get-wishlist-items?userId=${currentUserId}`);
        if (!response.ok) return false;
        const items = await response.json();
        return items.some(item => item.productId == productId);
    } catch (err) {
        return false;
    }
}

// async function toggleWishlist() {
//     if (!currentProduct) return;

//     const icon = document.querySelector("#addToWishlistBtn i");
//     const isAdded = icon.classList.contains("fas");

//     const success = isAdded ? await removeFromWishlistBackend(currentProduct.id) : await addToWishlistBackend(currentProduct.id);

//     if (success || !currentUserId) {
//         icon.className = isAdded ? "far fa-heart" : "fas fa-heart text-pink-600";
//         showToast(isAdded ? "Removed from Wishlist" : "Added to Wishlist");
//         updateLocalWishlistSync(currentProduct, !isAdded);
//     } else {
//         showToast("Failed to update wishlist");
//     }
// }



async function toggleWishlist() {
    if (!currentProduct) return;

    if (!currentUserId) {
        showToast("Please login to manage wishlist", "error");
        return;
    }

    const icon = document.querySelector("#addToWishlistBtn i");
    const isAdded = icon.classList.contains("fas");
    const success = isAdded ? await removeFromWishlistBackend(currentProduct.id) : await addToWishlistBackend(currentProduct.id);
    if (success) {
        icon.className = isAdded ? "far fa-heart" : "fas fa-heart text-pink-600";
        showToast(isAdded ? "Removed from Wishlist" : "Added to Wishlist");
        updateLocalWishlistSync(currentProduct, !isAdded);
    } else {
        showToast("Failed to update wishlist");
    }
}



// async function toggleProductWishlistBackend(product, btn) {
//     if (!currentUserId) {
//         showToast("Please log in to add to wishlist");
//         return;
//     }

//     const icon = btn.querySelector('i');
//     const isAdded = icon.classList.contains('fas');

//     const success = isAdded ? await removeFromWishlistBackend(product.id) : await addToWishlistBackend(product.id);

//     if (success) {
//         icon.className = isAdded ? "far fa-heart text-pink-600" : "fas fa-heart text-pink-600";
//         showToast(isAdded ? "Removed from Wishlist" : "Added to Wishlist");
//         updateLocalWishlistSync(product, !isAdded);
//     }
// }



async function toggleProductWishlistBackend(product, btn) {
    if (!currentUserId) {
        showToast("Please log in to add to wishlist", "error");
        return;
    }

    const icon = btn.querySelector('i');
    const isAdded = icon.classList.contains('fas');
    const success = isAdded ? await removeFromWishlistBackend(product.id) : await addToWishlistBackend(product.id);
    if (success) {
        icon.className = isAdded ? "far fa-heart text-pink-600" : "fas fa-heart text-pink-600";
        showToast(isAdded ? "Removed from Wishlist" : "Added to Wishlist");
        updateLocalWishlistSync(product, !isAdded);
    } else {
        showToast("Failed to update wishlist");
    }
}





// async function addToCart() {
//     if (!selectedVariant) {
//         showToast("Please select a size");
//         return;
//     }
//     if (!currentProduct) return showToast("Product not loaded");
//     const qty = parseInt(document.getElementById("quantity").textContent);

//     const success = await addToCartBackend(qty);

//     if (success) {
//         showToast(`Added ${qty} × Size ${selectedVariant.size} to cart`);
//     } else {
//         showToast(`Added to cart (offline)`);
//     }

//     updateLocalCart(qty);

//     const btn = document.getElementById("addToCartBtn");
//     btn.innerHTML = `<i class="fas fa-check mr-3"></i> Go to Bag`;
//     btn.onclick = () => window.location.href = "../cart.html";
// }



async function addToCart() {
    if (!selectedVariant) {
        showToast("Please select a size");
        return;
    }
    if (!currentProduct) return showToast("Product not loaded");

    if (!currentUserId) {
        showToast("Please login to add items to cart", "error");
        return;
    }

    const qty = parseInt(document.getElementById("quantity").textContent);
    const success = await addToCartBackend(qty);
    if (success) {
        showToast(`Added ${qty} × Size ${selectedVariant.size} to cart`);
        updateLocalCart(qty);  // Only update local if backend succeeded
    } else {
        showToast("Failed to add to cart. Please try again.");
    }

    const btn = document.getElementById("addToCartBtn");
    btn.innerHTML = `<i class="fas fa-check mr-3"></i> Go to Bag`;
    btn.onclick = () => window.location.href = "../cart.html";
}


// ====================== PINCODE CHECKER ======================
function setupPincodeChecker() {
  const pincodeInput = document.getElementById('pincodeInput');
  const checkBtn = document.getElementById('checkPincodeBtn');
  if (!pincodeInput || !checkBtn) return;

  const resultDiv = document.getElementById('deliveryResult');
  const successDiv = document.getElementById('deliverySuccess');
  const errorDiv = document.getElementById('deliveryError');
  const locationText = document.getElementById('deliveryLocation');
  const deliveryTime = document.getElementById('deliveryTime');

  const savedPincode = localStorage.getItem('lastValidPincode');
  if (savedPincode) {
    pincodeInput.value = savedPincode;
    checkPincodeRealTime(savedPincode);
  }

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

  const allowedLocations = {
    'alagudewadi': ['415523'],
    'bagewadi': ['415523'],
    'barad': ['415523'],
    'bhadali bk': ['415523'],
    'bhadali kh': ['415523'],
    'bhilkatti': ['415537'],
    'bodkewadi': ['415523'],
    'chaudharwadi': ['415523'],
    'dalvadi': ['415523'],
    'dhaval': ['415523'],
    'dhavalewadi': ['415523', '415528'],
    'dhuldev': ['415523'],
    'dhumalwadi': ['415523'],
    'dombalwadi': ['415523'],
    'dudhebavi': ['415523'],
    'fadatarwadi': ['415523'],
    'farandwadi': ['415523'],
    'ghadge mala': ['415523'],
    'ghadgewadi': ['415537'],
    'girvi': ['415523'],
    'gunware': ['415523'],
    'hingangaon': ['415523'],
    'jadhavwadi': ['415523'],
    'jinti': ['415523'],
    'kalaj': ['415523'],
    'kambleshwar': ['415523'],
    'kashiwadi': ['415528'],
    'khunte': ['415523'],
    'kurvali kh': ['415523'],
    'malvadi': ['415523'],
    'mathachiwadi': ['415523'],
    'mirgaon': ['415523'],
    'mirdhe': ['415523'],
    'mulikwadi': ['415537'],
    'naik bombawadi': ['415523'],
    'nandal': ['415523'],
    'nimbhore': ['415523'],
    'nimbalak': ['415523'],
    'nirugudi': ['415523'],
    'pimpalwadi': ['415522'],
    'pimparad': ['415523'],
    'rajale': ['415523'],
    'sangavi': ['415523'],
    'sarade': ['415523'],
    'saskal': ['415523'],
    'sastewadi': ['415523'],
    'sathe': ['415523'],
    'sherechiwadi': ['415523'],
    'shereshindewadi': ['415523'],
    'shindewadi': ['415523'],
    'somanthali': ['415523'],
    'songaon': ['415523'],
    'sonwadi bk': ['415523'],
    'sonwadi kh': ['415523'],
    'survadi': ['415528'],
    'tadavale': ['415523'],
    'takalwade': ['415523'],
    'taradgaon': ['415528'],
    'tathavada': ['415523'],
    'tavadi': ['415523'],
    'thakurki': ['415523'],
    'tirakwadi': ['415523'],
    'upalave': ['415523'],
    'vadale': ['415523'],
    'vadgaon': ['415523'],
    'vadjal': ['415523'],
    'vajegaon': ['415523'],
    'vidani': ['415523'],
    'vinchurni': ['415523'],
    'vitthalwadi': ['415528'],
    'wakhari': ['415523'],
    'wathar (nimbalkar)': ['415523']
  };

  const sataraMainPincode = '415001';

  async function checkPincodeRealTime(pincode) {
    resultDiv.classList.remove('hidden');
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();

      if (!data || data[0]?.Status !== "Success" || !data[0].PostOffice?.length) {
        showDeliveryError("Invalid pincode");
        return;
      }

      const postOffice = data[0].PostOffice[0];
      const villageName = postOffice.Name.toLowerCase().trim();
      const allowedPincodes = allowedLocations[villageName];

      if (!allowedPincodes || !allowedPincodes.includes(pincode)) {
        showDeliveryError("Sorry, we currently deliver only to select areas around Phaltan, Satara.");
        return;
      }

      successDiv.classList.remove('hidden');
      errorDiv.classList.add('hidden');
      locationText.textContent = `${postOffice.Name}, Phaltan, Satara`;
      deliveryTime.textContent = pincode === sataraMainPincode ? 'Delivery within 1 day' : 'Delivery within 3-4 days';

      localStorage.setItem('lastValidPincode', pincode);
      showToast('Delivery available! Free Delivery', 'success');

    } catch (err) {
      console.error("Pincode check failed:", err);
      showDeliveryError("Network error. Please try again.");
    }
  }

  function showDeliveryError(message) {
    successDiv.classList.add('hidden');
    errorDiv.classList.remove('hidden');
    errorDiv.querySelector('p.text-sm.text-gray-700').textContent = message;
    localStorage.removeItem('lastValidPincode');
  }
}

// ====================== UI UPDATE ======================
function updateProductPage() {
    if (!currentProduct) return;
    document.getElementById('product-title').textContent = currentProduct.title || 'Product';
    document.getElementById('breadcrumb-name').textContent = currentProduct.title || 'Product';
    const mainImg = document.getElementById('mainImage');
    mainImg.src = `${IMAGE_BASE}${currentProduct.mainImageUrl}`;
    mainImg.onerror = () => mainImg.src = 'http://localhost:8083/Images/product_details_fallback_img.jpg';
    const desc = Array.isArray(currentProduct.description)
        ? currentProduct.description.join(". ")
        : (currentProduct.description || "Premium quality product for mother care.");
    document.getElementById('product-description').textContent = desc;
    document.getElementById('stars-small').innerHTML = getStars(currentProduct.rating || 4.5);

    // DYNAMIC SIZES & PRICES
    const sizeContainer = document.getElementById('sizeButtons');
    sizeContainer.innerHTML = '';

    let variants = [];
    if (currentProduct.productSizes && currentProduct.productSizes.length > 0) {
        variants = currentProduct.productSizes.map((size, i) => ({
            size,
            price: currentProduct.price?.[i] || currentProduct.price?.[0] || 999,
            originalPrice: currentProduct.originalPrice?.[i] || currentProduct.originalPrice?.[0] || null,
            inStock: currentProduct.inStock !== false
        }));
    } else {
        variants = [{
            size: "Standard",
            price: currentProduct.price?.[0] || 999,
            originalPrice: currentProduct.originalPrice?.[0] || null,
            inStock: currentProduct.inStock !== false
        }];
    }

    variants.forEach(variant => {
        const btn = document.createElement('button');
        btn.className = `size-btn px-6 py-3 border rounded-lg font-medium transition ${!variant.inStock ? 'opacity-50 cursor-not-allowed' : 'hover:border-pink-600'}`;
        btn.textContent = variant.size;
        btn.disabled = !variant.inStock;
        if (variant.inStock) btn.onclick = () => selectSize(btn, variant);
        sizeContainer.appendChild(btn);
    });

    const firstAvailable = sizeContainer.querySelector('.size-btn:not([disabled])');
    if (firstAvailable) firstAvailable.click();

    // Thumbnails
    const thumbContainer = document.getElementById('thumbnailContainer');
    thumbContainer.innerHTML = '';
    const images = [`${IMAGE_BASE}${currentProduct.mainImageUrl}`];
    for (let i = 0; i < 5; i++) {
        images.push(`${IMAGE_BASE}/api/mb/products/${currentProduct.id}/subimage/${i}`);
    }
    
    images.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src;
    img.className = 'thumbnail' + (i === 0 ? ' thumbnail-active' : '');
    
    img.onerror = () => {
        if (i === 0) {
            // Main thumbnail failed - show fallback
            mainImg.src = 'http://localhost:8083/Images/product_details_fallback_img.jpg';
            img.style.display = 'none'; // Hide broken thumbnail
        } else {
            // Hide other broken thumbnails
            img.style.display = 'none';
        }
    };
    
    img.onclick = () => {
        mainImg.src = src;
        thumbContainer.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('thumbnail-active'));
        img.classList.add('thumbnail-active');
    };
    
    thumbContainer.appendChild(img);
});

    // Specifications
    let specs = {};
    if (currentProduct.specifications) {
        try { specs = typeof currentProduct.specifications === 'string' ? JSON.parse(currentProduct.specifications) : currentProduct.specifications; }
        catch (e) { specs = {}; }
    }
    if (Object.keys(specs).length === 0) {
        specs = {
            "Brand": currentProduct.brand || "Premium Brand",
            "Category": currentProduct.category || "MotherCare",
            "Subcategory": currentProduct.subCategory || "N/A",
            "Stock": currentProduct.inStock ? "In Stock" : "Out of Stock"
        };
    }
    document.getElementById('specifications-list').innerHTML = Object.entries(specs)
        .map(([k, v], i, arr) => `<div class="flex justify-between py-3 ${i !== arr.length - 1 ? 'border-b' : ''}"><span class="font-medium">${k}</span><span>${v}</span></div>`)
        .join('');

    // Features
    if (currentProduct.features && currentProduct.features.length > 0) {
        const descParent = document.querySelector('#product-description').parentElement;
        if (!descParent.querySelector('.features-list')) {
            const featuresDiv = document.createElement('div');
            featuresDiv.className = 'mt-6';
            featuresDiv.innerHTML = `<h3 class="font-bold text-lg mb-3">Key Features:</h3><ul class="features-list space-y-2">${currentProduct.features.map(f => `<li class="flex items-start"><i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i><span>${f}</span></li>`).join('')}</ul>`;
            descParent.appendChild(featuresDiv);
        }
    }

    loadRelatedProducts();
}

// ====================== INITIALIZATION ======================
document.addEventListener("DOMContentLoaded", async () => {
    currentUserId = await getValidUserId();
    
    if (!currentUserId) {
        localStorage.removeItem("cart");
        localStorage.removeItem("wishlist");
        updateCartCount();
        updateWishlistCount();
    }

    const productId = new URLSearchParams(window.location.search).get('id') || localStorage.getItem("selectedProductId");

    if (!productId) {
        showToast('No product selected. Redirecting...');
        setTimeout(() => window.location.href = 'mother.html', 2000);
        return;
    }

    currentProduct = await loadProductFromBackend(productId);
    if (!currentProduct) {
        showToast('Product not found');
        setTimeout(() => window.location.href = 'mother.html', 2000);
        return;
    }

    updateProductPage();
    setupPincodeChecker();

    // Update main wishlist button state
    if (currentUserId) {
        const isWishlisted = await isInWishlistBackend(currentProduct.id);
        const wishlistIcon = document.querySelector("#addToWishlistBtn i");
        wishlistIcon.className = isWishlisted ? "fas fa-heart text-pink-600" : "far fa-heart";
        if (isWishlisted) updateLocalWishlistSync(currentProduct, true);
    } else {
        const wishlistIcon = document.querySelector("#addToWishlistBtn i");
        wishlistIcon.className = "far fa-heart";
        document.getElementById("addToWishlistBtn").onclick = () => showToast("Please log in to add to wishlist");
    }

    document.getElementById("increaseQty").onclick = () => {
        quantity++;
        document.getElementById("quantity").textContent = quantity;
    };
    document.getElementById("decreaseQty").onclick = () => {
        if (quantity > 1) {
            quantity--;
            document.getElementById("quantity").textContent = quantity;
        }
    };
    document.getElementById("addToCartBtn").onclick = addToCart;
    document.getElementById("addToWishlistBtn").onclick = toggleWishlist;

    // Tabs
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('[id$="Content"]').forEach(c => c.classList.add('hidden'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab + 'Content').classList.remove('hidden');
        };
    });

    // Accordions
    document.querySelectorAll('.accordion-header').forEach(h => {
        h.onclick = () => {
            const content = h.nextElementSibling;
            const icon = h.querySelector('i');
            content.classList.toggle('active');
            icon.classList.toggle('rotate-180');
        };
    });

    updateCartCount();
    updateWishlistCount();

    // Toast styles
    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
          @keyframes slideInUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes slideOutDown { from { transform: translateY(0); opacity: 1; } to { transform: translateY(100%); opacity: 0; } }
          .custom-toast { animation: slideInUp 0.3s ease-out; }
          .custom-toast.hiding { animation: slideOutDown 0.3s ease-in; }
        `;
        document.head.appendChild(style);
    }
});