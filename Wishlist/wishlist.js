// ==================== ENHANCED WISHLIST PAGE SCRIPT - FULL BACKEND INTEGRATION ====================
const API_BASE_URL = 'http://localhost:8083/api/wishlist';
const CART_API_URL = 'http://localhost:8083/api/cart';
const PRODUCT_API_URL = 'http://localhost:8083/api/products';
const MBP_PRODUCT_API = 'http://localhost:8083/api/mb/products';

// ==================== UTILITY FUNCTIONS ====================
function getUserId() {
    try {
        // Get the currentUser object from localStorage or sessionStorage
        const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        
        if (!userStr) {
            console.error('User not logged in - No user data found');
            return null;
        }
        
        // Parse the user object
        const user = JSON.parse(userStr);
        
        if (!user || !user.userId) {
            console.error('User ID not found in user object');
            return null;
        }
        
        const userId = parseInt(user.userId);
        
        if (isNaN(userId)) {
            console.error('Invalid user ID format:', user.userId);
            return null;
        }
        
        return userId;
        
    } catch (error) {
        console.error('Error getting user ID:', error);
        return null;
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>';
    toast.innerHTML = `${icon} ${message}`;
    toast.className = `fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white font-medium shadow-xl z-50 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function getProductImageUrl(productId, productType) {
    return productType === 'MOTHER' || productType === 'BABY'
        ? `${MBP_PRODUCT_API}/${productId}/image`
        : `${PRODUCT_API_URL}/${productId}/image`;
}

function calculateDiscount(originalPrice, currentPrice) {
    if (!originalPrice || originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

// ==================== WISHLIST FUNCTIONS ====================
async function fetchWishlistFromBackend() {
    const userId = getUserId();
    if (!userId) {
        showToast('Please login to view wishlist', 'error');
        return [];
    }
   
    try {
        const response = await fetch(`${API_BASE_URL}/get-wishlist-items?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch wishlist');
        const data = await response.json();
        return data.map(item => {
            const productType = item.productType || 'MEDICINE';
            const itemType = (productType === 'MOTHER' || productType === 'BABY') ? 'MBP' : 'PRODUCT';
           
            // FIX: Handle price/originalPrice as arrays from backend
            const currentPrice = Array.isArray(item.price) ? (item.price[0] || 0) : (item.price || 0);
            const origPrice = Array.isArray(item.originalPrice) 
                ? (item.originalPrice[0] || currentPrice) 
                : (item.originalPrice || currentPrice);

            return {
                id: item.productId,
                name: item.title || 'Unknown Product',
                price: currentPrice,
                // originalPrice: origPrice,
                image: getProductImageUrl(item.productId, productType),
                productType: productType,
                sizes: item.sizes || [],
                type: itemType
            };
        });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        showToast('Failed to load wishlist', 'error');
        return [];
    }
}

async function removeFromWishlist(productId, productType = 'MEDICINE') {
    const userId = getUserId();
    if (!userId) {
        showToast('Please login', 'error');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/remove-wishlist-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                productId: productId,
                productType: productType.toUpperCase()
            })
        });
        if (response.ok) {
            showToast('Removed from wishlist', 'success');
            await renderWishlist();
            await updateWishlistCount();
        } else {
            const errorText = await response.text();
            showToast('Failed to remove item', 'error');
            console.error('Remove failed:', errorText);
        }
    } catch (error) {
        console.error('Network error:', error);
        showToast('Network error', 'error');
    }
}

async function clearWishlist() {
    const userId = getUserId();
    if (!userId) {
        showToast('Please login first', 'error');
        return;
    }
    if (!confirm('Are you sure you want to clear your entire wishlist?')) {
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/clear-wishlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        if (response.ok) {
            showToast('Wishlist cleared successfully', 'success');
            await renderWishlist();
            await updateWishlistCount();
        } else {
            showToast('Failed to clear wishlist', 'error');
        }
    } catch (error) {
        console.error('Network error:', error);
        showToast('Network error', 'error');
    }
}

// ==================== CART FUNCTIONS - BACKEND ONLY ====================
async function addToCartBackend(productId, productType, type, quantity = 1, selectedSize = '') {
    const userId = getUserId();
    if (!userId) {
        showToast('Please login to add items to cart', 'error');
        return false;
    }
    try {
        const requestBody = {
            userId: userId,
            type: type,
            quantity: quantity,
            productType: productType.toUpperCase(),
            selectedSize: selectedSize
        };
        if (type === 'PRODUCT') {
            requestBody.productId = productId;
        } else if (type === 'MBP') {
            requestBody.mbpId = productId;
        }
        console.log('Adding to cart:', requestBody);
        const response = await fetch(`${CART_API_URL}/add-cart-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        const result = await response.json();
        if (response.ok) {
            showToast('Added to cart successfully', 'success');
            if (typeof updateCartCount === 'function') {
                await updateCartCount();
            }
            return true;
        } else {
            showToast(result.error || 'Failed to add to cart', 'error');
            console.error('Add to cart failed:', result);
            return false;
        }
    } catch (error) {
        console.error('Network error:', error);
        showToast('Network error', 'error');
        return false;
    }
}

async function moveToCart(productId, productType = 'MEDICINE') {
    const userId = getUserId();
    if (!userId) {
        showToast('Please login', 'error');
        return;
    }
    const wishlist = await fetchWishlistFromBackend();
    const item = wishlist.find(i => i.id === productId && i.productType === productType);
   
    if (!item) {
        showToast('Item not found in wishlist', 'error');
        return;
    }
    const itemType = (item.productType === 'MOTHER' || item.productType === 'BABY') ? 'MBP' : 'PRODUCT';
    if (item.sizes && item.sizes.length > 0) {
        const selectedSize = await showSizeSelector(item.sizes, item.name);
        if (!selectedSize) {
            showToast('Please select a size', 'error');
            return;
        }
       
        const success = await addToCartBackend(
            item.id,
            item.productType,
            itemType,
            1,
            selectedSize
        );
        if (success) {
            await removeFromWishlist(productId, item.productType);
            showToast('Item moved to cart!', 'success');
        }
    } else {
        const success = await addToCartBackend(
            item.id,
            item.productType,
            itemType,
            1,
            ''
        );
        if (success) {
            await removeFromWishlist(productId, item.productType);
            showToast('Item moved to cart!', 'success');
        }
    }
}

// ==================== SIZE SELECTOR MODAL ====================
function showSizeSelector(sizes, productName) {
    return new Promise((resolve) => {
        const modalHTML = `
            <div id="size-selector-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 class="text-xl font-bold mb-4">Select Size for ${productName}</h3>
                    <div class="grid grid-cols-3 gap-3 mb-6">
                        ${sizes.map(size => `
                            <button class="size-option border-2 border-gray-300 hover:border-blue-500 rounded-lg py-3 px-4 font-semibold transition" data-size="${size}">
                                ${size}
                            </button>
                        `).join('')}
                    </div>
                    <div class="flex gap-3">
                        <button id="confirm-size-btn" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                            Confirm
                        </button>
                        <button id="cancel-size-btn" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-bold">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('size-selector-modal');
        const confirmBtn = document.getElementById('confirm-size-btn');
        const cancelBtn = document.getElementById('cancel-size-btn');
        const sizeOptions = modal.querySelectorAll('.size-option');
        let selectedSize = null;

        sizeOptions.forEach(btn => {
            btn.addEventListener('click', () => {
                sizeOptions.forEach(b => b.classList.remove('border-blue-500', 'bg-blue-50'));
                btn.classList.add('border-blue-500', 'bg-blue-50');
                selectedSize = btn.dataset.size;
                confirmBtn.disabled = false;
            });
        });

        confirmBtn.addEventListener('click', () => {
            modal.remove();
            resolve(selectedSize);
        });

        cancelBtn.addEventListener('click', () => {
            modal.remove();
            resolve(null);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(null);
            }
        });
    });
}

// ==================== UPDATE COUNTS ====================
async function updateWishlistCount() {
    const wishlist = await fetchWishlistFromBackend();
    const count = wishlist.length;
   
    document.querySelectorAll('#desktop-wishlist-count, #mobile-wishlist-count, .wishlist-count, [class*="wishlist-count"]').forEach(el => {
        if (el) {
            el.textContent = count;
            el.style.display = count > 0 ? 'flex' : 'none';
        }
    });
}

async function updateCartCount() {
    const userId = getUserId();
    if (!userId) return;
    try {
        const response = await fetch(`${CART_API_URL}/get-cart-items?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch cart');
       
        const cartItems = await response.json();
        const count = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
       
        document.querySelectorAll('#desktop-cart-count, #mobile-cart-count, .cart-count, [class*="cart-count"]').forEach(el => {
            if (el) {
                el.textContent = count;
                el.style.display = count > 0 ? 'flex' : 'none';
            }
        });
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// ==================== RENDER FUNCTIONS ====================
function createWishlistCard(item) {
    // FIX: Ensure price and originalPrice are numbers before using toFixed
    const currentPrice = Number(item.price) || 0;
    const originalPrice = Number(item.originalPrice) || currentPrice;
    const discount = calculateDiscount(originalPrice, currentPrice);

    return `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden relative group hover:shadow-2xl transition-shadow duration-300">
            <div class="relative">
                <img src="${item.image}"
                     alt="${item.name}"
                     class="w-full h-48 object-contain p-4"
                     onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                ${discount > 0 ? `
                    <div class="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        ${discount}% OFF
                    </div>
                ` : ''}
                <button onclick="removeFromWishlist(${item.id}, '${item.productType}')"
                        class="absolute top-2 right-2 bg-white/90 hover:bg-red-500 text-red-600 hover:text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-200"
                        title="Remove from wishlist">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-sm line-clamp-2 h-10 mb-2">${item.name}</h3>
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-lg font-bold text-green-600">₹${currentPrice.toFixed(2)}</span>
                    ${originalPrice > currentPrice ? `
                        <span class="text-sm text-gray-500 line-through">₹${originalPrice.toFixed(2)}</span>
                    ` : ''}
                </div>
                ${item.sizes && item.sizes.length > 0 ? `
                    <div class="text-xs text-gray-600 mb-2">
                        <i class="fas fa-ruler"></i> Available sizes: ${item.sizes.join(', ')}
                    </div>
                ` : ''}
                <button onclick="moveToCart(${item.id}, '${item.productType}')"
                        class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-sm transition-colors duration-200 flex items-center justify-center gap-2">
                    <i class="fas fa-shopping-cart"></i>
                    Add to Cart
                </button>
            </div>
        </div>
    `;
}

function toggleClearButton(show) {
    const btn = document.getElementById('clear-wishlist-btn');
    if (btn) {
        if (show) {
            btn.classList.remove('hidden');
        } else {
            btn.classList.add('hidden');
        }
    }
}

async function renderWishlist() {
    const loading = document.getElementById('loading-state');
    const empty = document.getElementById('empty-state');
    const container = document.getElementById('wishlist-items');
    if (loading) loading.classList.remove('hidden');
    if (empty) empty.classList.add('hidden');
    if (container) container.classList.add('hidden');
    toggleClearButton(false);

    if (!getUserId()) {
        if (loading) loading.classList.add('hidden');
        if (empty) empty.classList.remove('hidden');
        return;
    }

    const items = await fetchWishlistFromBackend();
    if (loading) loading.classList.add('hidden');

    if (items.length === 0) {
        if (empty) empty.classList.remove('hidden');
        toggleClearButton(false);
        return;
    }

    if (container) {
        container.classList.remove('hidden');
        container.innerHTML = items.map(createWishlistCard).join('');
    }
    toggleClearButton(true);
}

// ==================== GLOBAL FUNCTIONS ====================
window.removeFromWishlist = removeFromWishlist;
window.moveToCart = moveToCart;
window.clearWishlist = clearWishlist;
window.updateWishlistCount = updateWishlistCount;
window.updateCartCount = updateCartCount;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Wishlist page loaded - Backend integration active');
   
    setTimeout(() => {
        renderWishlist();
        updateWishlistCount();
        updateCartCount();
    }, 100);
});

// ==================== AUTO-REFRESH ON VISIBILITY CHANGE ====================
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        renderWishlist();
        updateWishlistCount();
        updateCartCount();
    }
});