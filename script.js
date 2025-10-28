// script.js - Updated Functionality for Motor Store

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const searchInput = document.getElementById('searchInput');
  const categoriesList = document.getElementById('categoriesList');
  const productsGrid = document.getElementById('productsGrid');
  const minPriceInput = document.getElementById('minPrice');
  const maxPriceInput = document.getElementById('maxPrice');
  const filterBtn = document.getElementById('filterBtn');
  const cartBtn = document.getElementById('cartBtn');
  const cartBadge = document.getElementById('cartBadge');
  const cartDropdown = document.getElementById('cartDropdown');
  const cartList = document.getElementById('cartList');
  const cartEmpty = document.getElementById('cartEmpty');
  const contactBtn = document.getElementById('contactBtn');

  // Cart data (persisted in localStorage)
  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  // Update cart badge
  function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    cartBadge.textContent = totalItems;
    cartBadge.style.display = totalItems > 0 ? 'block' : 'none';
  }

  // Render cart dropdown
  function renderCart() {
    cartList.innerHTML = '';
    if (cart.length === 0) {
      cartEmpty.style.display = 'block';
      return;
    }
    cartEmpty.style.display = 'none';
    cart.forEach((item, index) => {
      const li = document.createElement('div');
      li.className = 'cart-item';
      li.innerHTML = `
        <div style="flex: 1;">
          <span>${item.name}</span>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
            <button class="cart-qty-btn minus" data-index="${index}"><i class="fa-solid fa-minus"></i></button>
            <span>الكمية: ${item.qty}</span>
            <button class="cart-qty-btn plus" data-index="${index}"><i class="fa-solid fa-plus"></i></button>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end;">
          <span>${item.price * item.qty} ج.م</span>
          <button class="cart-remove-btn" data-index="${index}" style="margin-top: 4px;"><i class="fa-solid fa-times"></i></button>
        </div>
      `;
      cartList.appendChild(li);
    });
  }

  // Add to cart
  function addToCart(productId, qty = 1) {
    const product = [...productsGrid.children].find(p => p.dataset.productId == productId);
    if (!product) return;
    const name = product.querySelector('h4').textContent;
    const price = parseInt(product.dataset.price);
    const existing = cart.find(item => item.id == productId);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ id: productId, name, price, qty });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    renderCart();
  }

  // Remove item from cart
  function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    renderCart();
  }

  // Update item quantity in cart
  function updateCartQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
      removeFromCart(index);
    } else {
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartBadge();
      renderCart();
    }
  }

  // Populate categories (added "الكل" as the first option)
  const categories = ['الكل', ...new Set([...productsGrid.children].map(p => p.dataset.category))];
  categories.forEach(cat => {
    const li = document.createElement('li');
    li.textContent = cat;
    li.addEventListener('click', () => filterProducts({ category: cat === 'الكل' ? '' : cat }));
    categoriesList.appendChild(li);
  });

  // Filter products
  function filterProducts(filters = {}) {
    const { search = '', category = '', minPrice = '', maxPrice = '' } = filters;
    [...productsGrid.children].forEach(product => {
      const title = product.querySelector('h4').textContent.toLowerCase();
      const brand = product.dataset.brand.toLowerCase();
      const prodCategory = product.dataset.category;
      const price = parseInt(product.dataset.price);
      const matchesSearch = !search || title.includes(search) || brand.includes(search);
      const matchesCategory = !category || prodCategory === category;
      const matchesPrice = (!minPrice || price >= minPrice) && (!maxPrice || price <= maxPrice);
      product.style.display = matchesSearch && matchesCategory && matchesPrice ? 'block' : 'none';
    });
  }

  // Search
  searchInput.addEventListener('input', () => {
    filterProducts({ search: searchInput.value.toLowerCase() });
  });

  // Price filter
  filterBtn.addEventListener('click', () => {
    const minPrice = parseInt(minPriceInput.value) || '';
    const maxPrice = parseInt(maxPriceInput.value) || '';
    filterProducts({ minPrice, maxPrice });
  });

  // Cart dropdown toggle
  cartBtn.addEventListener('click', () => {
    const isExpanded = cartDropdown.style.display === 'block';
    cartDropdown.style.display = isExpanded ? 'none' : 'block';
    cartBtn.setAttribute('aria-expanded', !isExpanded);
    cartDropdown.setAttribute('aria-hidden', isExpanded);
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!cartBtn.contains(e.target) && !cartDropdown.contains(e.target)) {
      cartDropdown.style.display = 'none';
      cartBtn.setAttribute('aria-expanded', 'false');
      cartDropdown.setAttribute('aria-hidden', 'true');
    }
  });

  // Cart item actions (prevent event bubbling to avoid closing dropdown)
  cartList.addEventListener('click', (e) => {
    e.stopPropagation(); // Added: Prevent click from bubbling to document
    const index = e.target.closest('button')?.dataset.index;
    if (!index) return;
    if (e.target.closest('.cart-remove-btn')) {
      removeFromCart(index);
    } else if (e.target.closest('.cart-qty-btn.minus')) {
      updateCartQty(index, -1);
    } else if (e.target.closest('.cart-qty-btn.plus')) {
      updateCartQty(index, 1);
    }
  });

  // Quantity controls (dynamic injection with Add and Cancel buttons)
  productsGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('show-qty')) {
      const btn = e.target;
      const actions = btn.parentElement;
      const productId = btn.dataset.id;
      actions.innerHTML = `
        <div class="qty-controls">
          <button class="qty-btn minus" data-id="${productId}">-</button>
          <input class="qty-input" type="number" value="1" min="1" data-id="${productId}">
          <button class="qty-btn plus" data-id="${productId}">+</button>
        </div>
        <button class="add-btn confirm-add" data-id="${productId}" type="button"><i class="fa-solid fa-cart-plus"></i> أضف</button>
        <button class="cancel-btn" data-id="${productId}" type="button">إلغاء</button>
      `;
    } else if (e.target.classList.contains('qty-btn')) {
      const input = e.target.parentElement.querySelector('.qty-input');
      let qty = parseInt(input.value);
      if (e.target.classList.contains('plus')) qty++;
      else if (qty > 1) qty--;
      input.value = qty;
    } else if (e.target.classList.contains('confirm-add')) {
      const productId = e.target.dataset.id;
      const qty = parseInt(e.target.parentElement.querySelector('.qty-input').value);
      addToCart(productId, qty);
      // Reset to original button
      e.target.parentElement.innerHTML = `<button class="add-btn show-qty" data-id="${productId}" type="button"><i class="fa-solid fa-cart-plus"></i> أضف</button>`;
    } else if (e.target.classList.contains('cancel-btn')) {
      const productId = e.target.dataset.id;
      // Reset to original button
      e.target.parentElement.innerHTML = `<button class="add-btn show-qty" data-id="${productId}" type="button"><i class="fa-solid fa-cart-plus"></i> أضف</button>`;
    }
  });

  // Contact button (placeholder)
  contactBtn.addEventListener('click', () => {
    alert('تواصل معنا عبر البريد الإلكتروني أو الهاتف!');
  });

  // Initialize
  updateCartBadge();
  renderCart();
});
