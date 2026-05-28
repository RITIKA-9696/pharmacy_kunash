// ==================== baby-product-details.js ====================

const API_BASE_URL = 'http://localhost:8083/api/mb/products';
const API_BASE_IMG_URL = 'http://localhost:8083';
const CART_API_BASE = 'http://localhost:8083/api/cart';
const WISHLIST_API_BASE = 'http://localhost:8083/api/wishlist';
const FALLBACK_IMAGE = 'http://localhost:8083/Images/product_details_fallback_img.jpg';

// Global variables
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentUserId = null;
let product = null;
let quantity = 1;
let selectedSize = "";
let basePrice = 0;

function getCurrentUserId() {
  try {
    const userData = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
    if (!userData) return null;

    const user = JSON.parse(userData);
    const id = user.userId || user.id || user.userID || user.id;

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

// ------------------- Utility Functions -------------------
function showToast(message, type = "success") {
  document.querySelectorAll('.custom-toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = `custom-toast fixed bottom-24 left-1/2 transform -translate-x-1/2 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function updateCartCount() {
  const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  document.querySelectorAll('#desktop-cart-count, #mobile-cart-count, #cart-count, #cartItemsCount, .cart-count').forEach(el => {
    if (el) {
      el.textContent = total;
      el.style.display = total > 0 ? 'inline-flex' : 'none';
    }
  });
}

function updateWishlistCount() {
  const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  document.querySelectorAll('#wishlistCount, .wishlist-count').forEach(el => {
    if (el) {
      el.textContent = wishlist.length;
      el.classList.toggle("hidden", wishlist.length === 0);
    }
  });
}

// function updateLocalCart(qty = 1) {
//  // Get price based on selected size index
// const selectedEl = document.querySelector('.size-option.selected');
// const index = selectedEl ? parseInt(selectedEl.getAttribute('data-index')) : 0;
// const currentPrice = product.prices[index] || product.price;

//   const cartItem = {
//     id: product.id,
//     name: product.title,
//     price: currentPrice,
//     image: product.mainImageUrl,
//     quantity: qty,
//     size: selectedSize || "",
//     type: "MBP",
//     mbpId: product.id,
//     productType: "BABY"
//   };

//   const existing = cart.find(item => item.id === cartItem.id && item.size === cartItem.size);
//   if (existing) {
//     existing.quantity += qty;
//   } else {
//     cart.push(cartItem);
//   }

//   localStorage.setItem('cart', JSON.stringify(cart));
//   updateCartCount();
// }




function updateLocalCart(qty = 1) {
  if (!currentUserId) return; // Block local update if not logged in

  // Get price based on selected size index
  const selectedEl = document.querySelector('.size-option.selected');
  const index = selectedEl ? parseInt(selectedEl.getAttribute('data-index')) : 0;
  const currentPrice = product.prices[index] || product.price;

  const cartItem = {
    id: product.id,
    name: product.title,
    price: currentPrice,
    image: product.mainImageUrl,
    quantity: qty,
    size: selectedSize || "",
    type: "MBP",
    mbpId: product.id,
    productType: "BABY"
  };
  const existing = cart.find(item => item.id === cartItem.id && item.size === cartItem.size);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push(cartItem);
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}


// ------------------- Backend Cart & Wishlist -------------------
async function addToCartBackend(qty = 1) {
  if (!currentUserId) return false;

 // Get price based on selected size index
const selectedEl = document.querySelector('.size-option.selected');
const index = selectedEl ? parseInt(selectedEl.getAttribute('data-index')) : 0;
const currentPrice = product.prices[index] || product.price;

  try {
    const payload = {
      userId: currentUserId,
      type: "MBP",
      mbpId: product.id,
      quantity: qty,
      selectedSize: selectedSize || "",
      productType: "BABY"
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

async function addToWishlistBackend() {
  if (!currentUserId) return false;
  try {
    const response = await fetch(`${WISHLIST_API_BASE}/add-wishlist-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, productId: product.id, productType: "BABY" })
    });
    return response.ok;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function removeFromWishlistBackend() {
  if (!currentUserId) return false;
  try {
    const response = await fetch(`${WISHLIST_API_BASE}/remove-wishlist-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, productId: product.id })
    });
    return response.ok;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function isInWishlistBackend() {
  if (!currentUserId) return false;
  try {
    const response = await fetch(`${WISHLIST_API_BASE}/get-wishlist-items?userId=${currentUserId}`);
    if (!response.ok) return false;
    const items = await response.json();
    return items.some(item => item.productId == product.id);
  } catch (err) {
    return false;
  }
}

// function updateLocalWishlistSync(isAdded) {
//   let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
//   if (isAdded) {
//     if (!wishlist.some(p => p.id === product.id)) {
//       wishlist.push({
//         id: product.id,
//         name: product.title,
//         price: product.price || 0,
//         originalPrice: product.originalPrice || null,
//         image: product.mainImageUrl
//       });
//     }
//   } else {
//     wishlist = wishlist.filter(p => p.id !== product.id);
//   }
//   localStorage.setItem("wishlist", JSON.stringify(wishlist));
//   updateWishlistCount();
// }




function updateLocalWishlistSync(isAdded) {
  if (!currentUserId) return; // Block local storage update

  let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  if (isAdded) {
    if (!wishlist.some(p => p.id === product.id)) {
      wishlist.push({
        id: product.id,
        name: product.title,
        price: product.price || 0,
        originalPrice: product.originalPrice || null,
        image: product.mainImageUrl
      });
    }
  } else {
    wishlist = wishlist.filter(p => p.id !== product.id);
  }
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  updateWishlistCount();
}



// ------------------- Add to Cart & Wishlist Handlers -------------------
async function addToCart() {
  if (!product.inStock) {
    showToast("This product is out of stock!", "error");
    return;
  }

  const selectedEl = document.querySelector('.size-option.selected');
  if (product.productSizes && product.productSizes.length > 0 && !selectedEl) {
    showToast("Please select a size first!", "error");
    return;
  }

  selectedSize = selectedEl ? selectedEl.getAttribute('data-size') : "";

  const success = await addToCartBackend(quantity);

  if (success) {
    showToast(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart!`);
      const btn = document.getElementById("addToCart");
  btn.textContent = "Go to Bag";
  btn.onclick = () => window.location.href = "../cart.html";
  } else {
    showToast(`Please Login to Add to Cart`, "error");
  }

  updateLocalCart(quantity);


}

// async function toggleWishlist() {
//   if (!product) return;

//   const btn = document.getElementById('addToWishlist');
//   const icon = btn.querySelector('i');
//   const isAdded = icon.classList.contains('fas');

//   const success = isAdded ? await removeFromWishlistBackend() : await addToWishlistBackend();

//   if (success || !currentUserId) {
//     icon.className = isAdded ? "far fa-heart mr-2" : "fas fa-heart mr-2";
//     btn.innerHTML = isAdded
//       ? '<i class="far fa-heart mr-2"></i>Add to Wishlist'
//       : '<i class="fas fa-heart mr-2"></i>Added to Wishlist';
//     btn.classList.toggle('active', !isAdded);
//     showToast(isAdded ? "Removed from Wishlist" : "Added to Wishlist");
//     updateLocalWishlistSync(!isAdded);
//   } else {
//     showToast("Failed to update wishlist", "error");
//   }
// }


async function toggleWishlist() {
  if (!product) return;

  if (!currentUserId) {
    showToast("Please login to manage wishlist", "error");
    return;
  }

  const btn = document.getElementById('addToWishlist');
  const icon = btn.querySelector('i');
  const isAdded = icon.classList.contains('fas');
  const success = isAdded ? await removeFromWishlistBackend() : await addToWishlistBackend();
  if (success) {
    icon.className = isAdded ? "far fa-heart mr-2" : "fas fa-heart mr-2";
    btn.innerHTML = isAdded
      ? '<i class="far fa-heart mr-2"></i>Add to Wishlist'
      : '<i class="fas fa-heart mr-2"></i>Added to Wishlist';
    btn.classList.toggle('active', !isAdded);
    showToast(isAdded ? "Removed from Wishlist" : "Added to Wishlist");
    updateLocalWishlistSync(!isAdded);
  } else {
    showToast("Failed to update wishlist", "error");
  }
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
                deliveryTime.textContent = 'Delivery within 3-4 days';
            }
            if (deliveryOffer) {
                deliveryOffer.textContent = '';
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

// ------------------- Original Functions (Unchanged) -------------------

async function loadProductById(id) {
  try {
    document.getElementById('productTitle').textContent = 'Loading...';
    document.getElementById('productPrice').textContent = '₹0.00';

    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Product not found');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiProduct = await response.json();

   product = {
  id: apiProduct.id,
  title: apiProduct.title || 'Title',
  // Keep base price as first variant for display fallback
  price: getDisplayPrice(apiProduct.price),
  originalPrice: getDisplayPrice(apiProduct.originalPrice) || 'NA',
  discount: calculateDiscount(apiProduct.price, apiProduct.originalPrice) || apiProduct.discount || 0,
  brand: apiProduct.brand || 'NA',
  category: apiProduct.category || '',
  subCategory: apiProduct.subCategory || '',
  mainImageUrl: apiProduct.mainImageUrl ? `http://localhost:8083${apiProduct.mainImageUrl}` : '',
  subImageUrls: (apiProduct.subImageUrls || []).map(url => `http://localhost:8083${url}`),
  description: Array.isArray(apiProduct.description) ? apiProduct.description : (apiProduct.description ? [apiProduct.description] : []),
  inStock: apiProduct.inStock !== undefined ? apiProduct.inStock : true,
  rating: apiProduct.rating || 4.0,

  // === DYNAMIC SIZES & PRICES ===
  sizes: Array.isArray(apiProduct.productSizes) 
    ? apiProduct.productSizes 
    : (apiProduct.productSizes ? [apiProduct.productSizes] : []),

  prices: Array.isArray(apiProduct.price) ? apiProduct.price : [apiProduct.price || 0],
  originalPrices: Array.isArray(apiProduct.originalPrice) 
    ? apiProduct.originalPrice 
    : (apiProduct.originalPrice ? [apiProduct.originalPrice] : []),

  features: Array.isArray(apiProduct.features) ? apiProduct.features : (apiProduct.features ? [apiProduct.features] : []),
  specifications: apiProduct.specifications || {}
};

    populateProductDetails();

  } catch (error) {
    console.error('Error loading product:', error);
    document.getElementById('mainImage').innerHTML = `
      <div class="text-center text-red-600 py-12">
        <i class="fas fa-exclamation-triangle text-6xl mb-4"></i>
        <h3 class="text-xl font-bold">Failed to load product</h3>
        <p class="mt-2">${error.message}</p>
        <button onclick="window.location.href='baby.html'" class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">
          Back to Products
        </button>
      </div>
    `;
  }
}

function getDisplayPrice(priceArray) {
  if (!priceArray || priceArray.length === 0) return 0;
  return Array.isArray(priceArray) ? priceArray[0] : priceArray;
}

function calculateDiscount(priceArray, originalPriceArray) {
  if (!priceArray || !originalPriceArray) return 0;

  const price = getDisplayPrice(priceArray);
  const originalPrice = getDisplayPrice(originalPriceArray);

  if (originalPrice > price) {
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }
  return 0;
}

function populateProductDetails() {
  quantity = 1;
  selectedSize = "";
  basePrice = product.price;

  document.getElementById('productTitle').textContent = product.title || 'Product Title';
  document.getElementById('productPrice').textContent = `₹${basePrice.toLocaleString('en-IN')}`;
  document.getElementById('productBrand').textContent = product.brand || 'NA';
  document.getElementById('productCategory').textContent = (product.category || '').toUpperCase();

  document.getElementById('breadcrumbCategory').textContent = product.category || 'Product Details';

  loadProductRating();

  const stockStatus = document.getElementById('stockStatus');
  if (product.inStock) {
    stockStatus.className = 'text-sm font-semibold in-stock';
  } else {
    stockStatus.textContent = 'Out of Stock';
    stockStatus.className = 'text-sm font-semibold text-red-600';
    document.getElementById('addToCart').disabled = true;
    document.getElementById('addToCart').classList.add('opacity-50', 'cursor-not-allowed');
  }

  if (product.discount > 0) {
    const original = product.originalPrice || Math.round(product.price / (1 - product.discount / 100));
    document.getElementById('originalPrice').textContent = `₹${original.toLocaleString('en-IN')}`;
    document.getElementById('discountBadge').textContent = `${product.discount}% OFF`;
    document.getElementById('discountBadge').classList.remove('hidden');
    document.getElementById('originalPrice').classList.remove('hidden');
  }

  const mainImage = document.getElementById('mainImage');
  mainImage.innerHTML = `
    <img id="mainProductImage" src="${product.mainImageUrl}" alt="${product.title}"
         class="w-full h-full object-contain rounded-lg hover:scale-105 transition duration-500"
         onerror="this.src='http://localhost:8083/Images/product_details_fallback_img.jpg'">
  `;

  loadThumbnails(product);

    // === DYNAMIC SIZE RENDERING - FULLY REPLACED HARDCODED LOGIC ===
 // === DYNAMIC SIZE SELECTION WITH REAL PRICES ===
const sizeSection = document.getElementById('sizeSelectionSection');
const sizeContainer = document.getElementById('sizeOptionsContainer');

if (!sizeContainer) {
  console.warn("Size container not found");
} else if (product.sizes && product.sizes.length > 0) {
  // Show size section
  sizeSection.style.display = 'block';

  sizeContainer.innerHTML = product.sizes.map((size, index) => `
    <div class="size-option ${index === 0 ? 'selected' : ''}" data-index="${index}" data-size="${size}">
      ${size}
    </div>
  `).join('');

  // Click handler: update price based on selected variant
  document.querySelectorAll('.size-option').forEach(el => {
    el.onclick = () => {
      document.querySelectorAll('.size-option').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');

      const index = parseInt(el.getAttribute('data-index'));
      selectedSize = el.getAttribute('data-size');

      // Update displayed price
      const newPrice = product.prices[index] || product.price;
      const newOriginalPrice = product.originalPrices[index] || product.originalPrice;

      document.getElementById('productPrice').textContent = `₹${newPrice.toLocaleString('en-IN')}`;

      if (newOriginalPrice > newPrice) {
        document.getElementById('originalPrice').textContent = `₹${newOriginalPrice.toLocaleString('en-IN')}`;
        document.getElementById('originalPrice').classList.remove('hidden');

        const variantDiscount = Math.round(((newOriginalPrice - newPrice) / newOriginalPrice) * 100);
        document.getElementById('discountBadge').textContent = `${variantDiscount}% OFF`;
        document.getElementById('discountBadge').classList.remove('hidden');
      } else {
        document.getElementById('originalPrice').classList.add('hidden');
        document.getElementById('discountBadge').classList.add('hidden');
      }
    };
  });

  // Set initial selection (first size)
  selectedSize = product.sizes[0];
  // Trigger price update for first size
  document.querySelector('.size-option')?.click();

} else {
  // No sizes available → hide section
  sizeSection.style.display = 'none';
  selectedSize = "";
}
  // === END DYNAMIC SIZE RENDERING ===

  document.getElementById('decreaseQty').onclick = () => {
    if (quantity > 1) {
      quantity--;
      document.getElementById('quantity').textContent = quantity;
    }
  };
  document.getElementById('increaseQty').onclick = () => {
    quantity++;
    document.getElementById('quantity').textContent = quantity;
  };

  loadProductDetailsTab();
  loadSpecificationsTab();
  loadRelatedProducts();

  updateCartCount();
}

function loadProductRating() {
  const ratingContainer = document.querySelector('.star-rating');

  const rating = product.rating || 0;

  let starsHTML = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < fullStars; i++) {
    starsHTML += '<i class="fas fa-star text-yellow-400"></i>';
  }

  if (hasHalfStar) {
    starsHTML += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
  }

  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    starsHTML += '<i class="far fa-star text-yellow-400"></i>';
  }

  ratingContainer.innerHTML = starsHTML;
}

function loadProductDetailsTab() {
  const descriptionElement = document.getElementById('productDescription');
  if (product.description && product.description.length > 0) {
    if (Array.isArray(product.description)) {
      descriptionElement.innerHTML = product.description.map(desc => `<p class="mb-2">${desc}</p>`).join('');
    } else if (typeof product.description === 'string') {
      descriptionElement.innerHTML = `<p>${product.description}</p>`;
    } else {
      descriptionElement.innerHTML = '<p>No description available.</p>';
    }
  } else {
    descriptionElement.innerHTML = '<p>No description available.</p>';
  }

  const featuresElement = document.getElementById('productFeatures');
  if (product.features && product.features.length > 0) {
    if (Array.isArray(product.features)) {
      featuresElement.innerHTML = product.features.map(feature =>
        `<div class="flex items-start mb-2">
          <i class="fas fa-check text-green-500 mt-1 mr-2"></i>
          <span>${feature}</span>
        </div>`
      ).join('');
    } else if (typeof product.features === 'string') {
      featuresElement.innerHTML = `
        <div class="flex items-start mb-2">
          <i class="fas fa-check text-green-500 mt-1 mr-2"></i>
          <span>${product.features}</span>
        </div>
      `;
    } else {
      featuresElement.innerHTML = `
        <div class="flex items-start mb-2">
          <i class="fas fa-check text-green-500 mt-1 mr-2"></i>
          <span>High-quality materials</span>
        </div>
        <div class="flex items-start mb-2">
          <i class="fas fa-check text-green-500 mt-1 mr-2"></i>
          <span>Safe for children</span>
        </div>
        <div class="flex items-start mb-2">
          <i class="fas fa-check text-green-500 mt-1 mr-2"></i>
          <span>Easy to clean</span>
        </div>
        <div class="flex items-start mb-2">
          <i class="fas fa-check text-green-500 mt-1 mr-2"></i>
          <span>Durable construction</span>
        </div>
      `;
    }
  } else {
    featuresElement.innerHTML = `
      <div class="flex items-start mb-2">
        <i class="fas fa-check text-green-500 mt-1 mr-2"></i>
        <span>High-quality materials</span>
      </div>
      <div class="flex items-start mb-2">
        <i class="fas fa-check text-green-500 mt-1 mr-2"></i>
        <span>Safe for children</span>
      </div>
      <div class="flex items-start mb-2">
        <i class="fas fa-check text-green-500 mt-1 mr-2"></i>
        <span>Easy to clean</span>
      </div>
      <div class="flex items-start mb-2">
        <i class="fas fa-check text-green-500 mt-1 mr-2"></i>
        <span>Durable construction</span>
      </div>
    `;
  }
}

function loadSpecificationsTab() {
  const specificationsTable = document.getElementById('specificationsTable');

  specificationsTable.innerHTML = '';

  if (product.specifications) {
    try {
      let specsObj = {};
      if (typeof product.specifications === 'object') {
        specsObj = product.specifications;
      } else if (typeof product.specifications === 'string') {
        try {
          specsObj = JSON.parse(product.specifications);
        } catch (parseError) {
          console.error('Error parsing specifications JSON:', parseError);
          specsObj = { 'Specifications': product.specifications };
        }
      }

      let tableHTML = '';

      tableHTML += `
        <tr class="border-b">
          <td class="py-2 font-medium text-gray-700">Product Name</td>
          <td class="py-2 text-gray-900">${product.title || '-'}</td>
        </tr>
        <tr class="border-b">
          <td class="py-2 font-medium text-gray-700">Brand</td>
          <td class="py-2 text-gray-900">${product.brand || '-'}</td>
        </tr>
        <tr class="border-b">
          <td class="py-2 font-medium text-gray-700">Category</td>
          <td class="py-2 text-gray-900">${(product.category || '').toUpperCase()}</td>
        </tr>
      `;

      if (Object.keys(specsObj).length > 0) {
        Object.entries(specsObj).forEach(([key, value]) => {
          if (key.toLowerCase() !== 'title' &&
              key.toLowerCase() !== 'brand' &&
              key.toLowerCase() !== 'category') {
            const formattedKey = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();
            tableHTML += `
              <tr class="border-b">
                <td class="py-2 font-medium text-gray-700">${formattedKey}</td>
                <td class="py-2 text-gray-900">${value || '-'}</td>
              </tr>
            `;
          }
        });
      }

      specificationsTable.innerHTML = tableHTML;

    } catch (error) {
      console.error('Error processing specifications:', error);
      showFallbackSpecifications();
    }
  } else {
    showFallbackSpecifications();
  }
}

function showFallbackSpecifications() {
  const specificationsTable = document.getElementById('specificationsTable');

  specificationsTable.innerHTML = `
    <tr class="border-b">
      <td class="py-2 font-medium text-gray-700">Product Name</td>
      <td class="py-2 text-gray-900">${product.title || '-'}</td>
    </tr>
    <tr class="border-b">
      <td class="py-2 font-medium text-gray-700">Brand</td>
      <td class="py-2 text-gray-900">${product.brand || '-'}</td>
    </tr>
    <tr class="border-b">
      <td class="py-2 font-medium text-gray-700">Category</td>
      <td class="py-2 text-gray-900">${(product.category || '').toUpperCase()}</td>
    </tr>
    <tr class="border-b">
      <td class="py-2 font-medium text-gray-700">Product Type</td>
      <td class="py-2 text-gray-900">Baby Care Product</td>
    </tr>
    <tr class="border-b">
      <td class="py-2 font-medium text-gray-700">Age Group</td>
      <td class="py-2 text-gray-900">0-3 years</td>
    </tr>
    <tr class="border-b">
      <td class="py-2 font-medium text-gray-700">Material</td>
      <td class="py-2 text-gray-900">Baby-safe, non-toxic materials</td>
    </tr>
  `;
}

function loadThumbnails(product) {
  const allImages = [product.mainImageUrl, ...(product.subImageUrls || [])].filter(Boolean);

  document.querySelectorAll('.thumbnail').forEach((thumbnail, index) => {
    const img = thumbnail.querySelector('img');
    if (allImages[index]) {
      img.src = allImages[index];
      img.style.display = 'block';
      img.onerror = () => {
        img.src = 'http://localhost:8083/Images/product_details_fallback_img.jpg';
      };

      thumbnail.onclick = (e) => {
        e.stopPropagation();
        document.getElementById('mainProductImage').src = allImages[index];
        document.querySelectorAll('.thumbnail').forEach(t => {
          t.classList.remove('border-blue-500');
          t.classList.add('border-transparent');
        });
        thumbnail.classList.add('border-blue-500');
        thumbnail.classList.remove('border-transparent');
      };
    } else {
      thumbnail.style.display = 'none';
    }
  });

  const firstThumb = document.querySelector('.thumbnail');
  if (firstThumb) {
    firstThumb.classList.add('border-blue-500');
    firstThumb.classList.remove('border-transparent');
  }
}

function initializeSpecsTabs() {
  const tabs = document.querySelectorAll('.specs-tab');
  const contents = document.querySelectorAll('.specs-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      contents.forEach(content => content.classList.add('hidden'));
      const tabId = this.getAttribute('data-tab');
      const activeContent = document.getElementById(tabId);
      if (activeContent) activeContent.classList.remove('hidden');
    });
  });
}

async function loadRelatedProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/get-all`);
    if (!response.ok) {
      console.error('Failed to fetch related products');
      showFallbackRelatedProducts();
      return;
    }

    const apiProducts = await response.json();

    if (apiProducts.length === 0) {
      showFallbackRelatedProducts();
      return;
    }

    const relatedProducts = apiProducts
      .filter(p => p.id !== product.id && p.category === product.category)
      .slice(0, 4)
      .map(p => ({
        id: p.id,
        title: p.title,
        price: getDisplayPrice(p.price),
        image: p.mainImageUrl ? `http://localhost:8083${p.mainImageUrl}` : 'http://localhost:8083/Images/product_details_fallback_img.jpg',
        brand: p.brand,
        category: p.category,
        rating: p.rating || 4.0
      }));

    if (relatedProducts.length === 0) {
      const otherProducts = apiProducts
        .filter(p => p.id !== product.id)
        .slice(0, 4)
        .map(p => ({
          id: p.id,
          title: p.title,
          price: getDisplayPrice(p.price),
          image: p.mainImageUrl ? `http://localhost:8083${p.mainImageUrl}` : 'http://localhost:8083/Images/product_details_fallback_img.jpg',
          brand: p.brand,
          category: p.category,
          rating: p.rating || 4.0
        }));

      displayRelatedProducts(otherProducts);
    } else {
      displayRelatedProducts(relatedProducts);
    }

  } catch (error) {
    console.error('Error loading related products:', error);
    showFallbackRelatedProducts();
  }
}

function showFallbackRelatedProducts() {
  const fallbackProducts = [
   
  ];

  displayRelatedProducts(fallbackProducts);
}

function displayRelatedProducts(products) {
  const container = document.getElementById('relatedProducts');
  if (!container) return;
  let grid = container.querySelector('.grid');
  if (!grid) {
    grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6';
    container.appendChild(grid);
  }

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-gray-500">No related products found.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(p => {
    const rating = p.rating || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHTML = '';

    for (let i = 0; i < fullStars; i++) {
      starsHTML += '<i class="fas fa-star text-yellow-400 text-xs"></i>';
    }
    if (hasHalfStar) {
      starsHTML += '<i class="fas fa-star-half-alt text-yellow-400 text-xs"></i>';
    }
    for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
      starsHTML += '<i class="far fa-star text-yellow-400 text-xs"></i>';
    }

    return `
      <div class="related-product bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg cursor-pointer transition-transform duration-300 hover:-translate-y-1"
           onclick="openRelatedProduct(${p.id})">
        <div class="relative bg-gray-50 aspect-[4/3] overflow-hidden">
          <img src="${p.image}" alt="${p.title}"
               class="w-full h-full object-contain p-4"
               onerror="this.src='http://localhost:8083/Images/product_details_fallback_img.jpg'">
          ${p.price > 1000 ? `
            <div class="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
              PREMIUM
            </div>
          ` : ''}
        </div>
        <div class="p-4">
          <p class="text-xs text-gray-500 uppercase font-medium truncate">${p.brand || 'Brand'}</p>
          <h3 class="font-medium text-gray-800 line-clamp-2 h-12 mt-1">${p.title}</h3>
          <div class="flex items-center mt-2">
            <div class="star-rating flex items-center">
              ${starsHTML}
            </div>
          </div>
          <div class="flex justify-between items-center mt-3">
            <span class="text-lg font-bold text-blue-600">₹${p.price.toLocaleString('en-IN')}</span>
            <button onclick="event.stopPropagation(); openRelatedProduct(${p.id})"
                    class="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 transition">
              View
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openRelatedProduct(id) {
  sessionStorage.setItem('scrollPosition', window.scrollY);
  window.location.href = `baby-product-details.html?id=${id}`;
}

window.addEventListener('load', () => {
  const scrollPosition = sessionStorage.getItem('scrollPosition');
  if (scrollPosition) {
    window.scrollTo(0, parseInt(scrollPosition));
    sessionStorage.removeItem('scrollPosition');
  }
});

// ------------------- DOM Loaded -------------------
document.addEventListener('DOMContentLoaded', async () => {
  currentUserId = await getValidUserId();
  
  
  if (!currentUserId) {
    localStorage.removeItem('cart');
    localStorage.removeItem('wishlist');
    updateCartCount();
    updateWishlistCount();
  }

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (productId) {
    await loadProductById(productId);
  } else {
    const stored = sessionStorage.getItem('currentProduct');
    if (stored) {
      try {
        product = JSON.parse(stored);
        populateProductDetails();
      } catch (e) {
        alert("Product data corrupted. Redirecting to products page.");
        window.location.href = 'baby.html';
      }
    } else {
      alert("Product not found!");
      window.location.href = 'baby.html';
    }
  }

  initializeSpecsTabs();
  setupPincodeChecker();

  if (product) {
    const isWishlisted = await isInWishlistBackend();
    const wishlistBtn = document.getElementById('addToWishlist');
    if (wishlistBtn) {
      const icon = wishlistBtn.querySelector('i');
      icon.className = isWishlisted ? "fas fa-heart mr-2" : "far fa-heart mr-2";
      wishlistBtn.innerHTML = isWishlisted
        ? '<i class="fas fa-heart mr-2"></i>Added to Wishlist'
        : '<i class="far fa-heart mr-2"></i>Add to Wishlist';
      if (isWishlisted) wishlistBtn.classList.add('active');
      updateLocalWishlistSync(isWishlisted);
    }
  }

  document.getElementById('addToCart')?.addEventListener('click', addToCart);
  document.getElementById('addToWishlist')?.addEventListener('click', toggleWishlist);

  updateCartCount();
  updateWishlistCount();

  if (!document.querySelector('#toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes slideInUp {
        from { transform: translateX(-50%) translateY(20px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
      @keyframes slideOutDown {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(20px); opacity: 0; }
      }
      .custom-toast { animation: slideInUp 0.3s ease-out; }
      .custom-toast.hiding { animation: slideOutDown 0.3s ease-in; }
    `;
    document.head.appendChild(style);
  }
});