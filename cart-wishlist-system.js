// ================ UNIVERSAL CART & WISHLIST SYSTEM ================
// Put this file at: js/cart-wishlist-system.js
// Include it in EVERY page (including index, mother.html, baby.html, etc.)

const MAX_QTY = 0;

// ================ CART FUNCTIONS ================
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

// ================ WISHLIST FUNCTIONS ================
function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem('wishlist') || '[]');
  } catch (e) {
    console.warn('Wishlist corrupted, resetting...');
    // localStorage.removeItem('wishlist');
    return [];
  }
}

function saveWishlist(wishlist) {
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

function isInWishlist(productId) {
  return getWishlist().some(item => item.id == productId);
}

// ================ UPDATE COUNTS (HEADER) ================
function updateCartCount() {
  const cart = getCart();
  const total = cart.length;

  document.querySelectorAll('#desktop-cart-count, #mobile-cart-count, .cart-count, [id*="cart-count"], [class*="cart-count"]').forEach(el => {
    if (el) {
      el.textContent = total;
      el.style.display = total > 0 ? 'flex' : 'none';
    }
  });
}

function updateWishlistCount() {
  const count = getWishlist().length;
  document.querySelectorAll('#desktop-wishlist-count, #mobile-wishlist-count, .wishlist-count, [id*="wishlist-count"]').forEach(el => {
    if (el) {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    }
  });
}

function updateAllCounts() {
  updateCartCount();
  updateWishlistCount();
}

// ================ RESTORE QUANTITY BUTTONS ================
function restoreQuantitySelectors() {
  const cart = getCart();
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    const productId = btn.dataset.productId || btn.getAttribute('data-product-id');
    const item = cart.find(i => i.id == productId);
    const container = btn.closest('.relative') || btn.closest('.card') || btn.parentElement;
    const selector = container?.querySelector('.quantity-selector');
    const qtyDisplay = selector?.querySelector('.qty-display');

    if (item && item.quantity > 0 && selector && qtyDisplay) {
      btn.classList.add('hidden');
      selector.classList.remove('hidden');
      qtyDisplay.textContent = item.quantity;
    } else if (selector) {
      btn.classList.remove('hidden');
      selector.classList.add('hidden');
    }
  });
}

// ================ UPDATE HEART ICONS ================
function updateAllWishlistIcons() {
  const wishlistIds = getWishlist().map(item => item.id);
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

// ================ TOAST ================
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = `fixed top-20 right-5 z-50 px-8 py-4 rounded-xl text-white font-bold shadow-2xl transition-all ${
    type === 'success' ? 'bg-green-600' : 'bg-red-600'
  } transform translate-x-full`;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.remove('translate-x-full'), 100);
  setTimeout(() => toast.remove(), 3000);
}

// ================ MAIN EVENT LISTENER (ADD/+/-) ================
document.addEventListener('click', (e) => {
  const target = e.target;

  // Add to Cart
  const addBtn = target.closest('.add-to-cart-btn');
  if (addBtn) {
    e.preventDefault();
    e.stopPropagation();
    const product = {
      id: addBtn.dataset.productId || addBtn.getAttribute('data-product-id'),
      name: addBtn.dataset.productName || addBtn.getAttribute('data-product-name'),
      price: parseFloat(addBtn.dataset.productPrice || addBtn.getAttribute('data-product-price')),
      image: addBtn.dataset.productImage || addBtn.getAttribute('data-product-image')
    };

    let cart = getCart();
    let existing = cart.find(item => item.id == product.id);
    if (existing) {
      if (existing.quantity >= MAX_QTY) return showToast(`Max ${MAX_QTY} allowed!`, 'error');
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    saveCart(cart);
    restoreQuantitySelectors();
    updateCartCount();
    showToast('Added to cart!');
    return;
  }

  // Increase Qty
  const inc = target.closest('.increase-qty');
  if (inc) {
    e.stopPropagation();
    const selector = inc.closest('.quantity-selector');
    const qtyDisplay = selector.querySelector('.qty-display');
    const addBtn = selector.closest('.relative')?.querySelector('.add-to-cart-btn') || selector.parentElement.querySelector('.add-to-cart-btn');
    const productId = addBtn?.dataset.productId;
    let cart = getCart();
    const item = cart.find(i => i.id == productId);
    if (item && item.quantity < MAX_QTY) {
      item.quantity += 1;
      qtyDisplay.textContent = item.quantity;
      saveCart(cart);
      updateCartCount();
    }
    return;
  }

  // Decrease Qty
  const dec = target.closest('.decrease-qty');
  if (dec) {
    e.stopPropagation();
    const selector = dec.closest('.quantity-selector');
    const qtyDisplay = selector.querySelector('.qty-display');
    const addBtn = selector.closest('.relative')?.querySelector('.add-to-cart-btn') || selector.parentElement.querySelector('.add-to-cart-btn');
    const productId = addBtn?.dataset.productId;
    let cart = getCart();
    const item = cart.find(i => i.id == productId);
    if (!item) return;

    item.quantity -= 1;
    if (item.quantity <= 0) {
      cart = cart.filter(i => i.id != productId);
      selector.classList.add('hidden');
      addBtn.classList.remove('hidden');
      showToast('Removed from cart', 'error');
    } else {
      qtyDisplay.textContent = item.quantity;
    }
    saveCart(cart);
    restoreQuantitySelectors();
    updateCartCount();
    return;
  }

  // Wishlist Toggle
  const wishBtn = target.closest('.wishlist-btn');
  if (wishBtn) {
    e.preventDefault();
    e.stopPropagation();
    const product = {
      id: parseInt(wishBtn.dataset.productId || wishBtn.getAttribute('data-product-id')),
      name: wishBtn.dataset.productName || wishBtn.getAttribute('data-product-name'),
      price: wishBtn.dataset.productPrice || wishBtn.getAttribute('data-product-price'),
      image: wishBtn.dataset.productImage || wishBtn.getAttribute('data-product-image'),
      discount: wishBtn.dataset.productDiscount || ''
    };

    let wishlist = getWishlist();
    const exists = wishlist.some(item => item.id == product.id);
    if (exists) {
      wishlist = wishlist.filter(item => item.id != product.id);
      showToast('Removed from wishlist', 'error');
    } else {
      wishlist.push(product);
      showToast('Added to wishlist!');
    }
    saveWishlist(wishlist);
    updateWishlistCount();
    updateAllWishlistIcons();
  }
});

// ================ INITIALIZE ON LOAD ================
document.addEventListener('DOMContentLoaded', () => {
  updateAllCounts();
  restoreQuantitySelectors();
  updateAllWishlistIcons();

  // Re-check after dynamic header/footer load
  setTimeout(() => {
    updateAllCounts();
    restoreQuantitySelectors();
    updateAllWishlistIcons();
  }, 500);
});

// Sync across tabs
window.addEventListener('storage', (e) => {
  if (e.key === 'cart' || e.key === 'wishlist') {
    updateAllCounts();
    restoreQuantitySelectors();
    updateAllWishlistIcons();
  }
});

// Make functions global so header can call them if needed
window.updateAllCounts = updateAllCounts;
window.restoreQuantitySelectors = restoreQuantitySelectors;