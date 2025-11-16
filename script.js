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
  
  // Mobile menu elements
  const menuToggle = document.getElementById('menuToggle');
  const mobileSidebar = document.getElementById('mobileSidebar');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const mobileCategoriesList = document.getElementById('mobileCategoriesList');
  const mobileMinPrice = document.getElementById('mobileMinPrice');
  const mobileMaxPrice = document.getElementById('mobileMaxPrice');
  const mobileFilterBtn = document.getElementById('mobileFilterBtn');
  
  // Mobile search elements
  const mobileSearchBtn = document.getElementById('mobileSearchBtn');
  const mobileSearchDropdown = document.getElementById('mobileSearchDropdown');
  const mobileSearchInput = document.getElementById('mobileSearchInput');
  const mobileSearchClose = document.getElementById('mobileSearchClose');

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
      cartList.style.display = 'none';
      return;
    }
    cartEmpty.style.display = 'none';
    cartList.style.display = 'block';
    
    cart.forEach((item, index) => {
      if (!item || !item.name || !item.price || !item.qty) {
        console.warn('Invalid cart item:', item);
        return;
      }
      
      const li = document.createElement('div');
      li.className = 'cart-item';
      li.innerHTML = `
        <div class="cart-item-image">
          <img src="${item.image || 'images/product-icon.png'}" alt="${item.name || 'منتج'}" />
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; color: #222; margin-bottom: 6px; font-size: 14px;">${item.name || 'منتج'}</div>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
            <button class="cart-qty-btn minus" data-index="${index}" type="button"><i class="fa-solid fa-minus"></i></button>
            <span style="color: #333; font-size: 13px; min-width: 60px;">الكمية: ${item.qty || 1}</span>
            <button class="cart-qty-btn plus" data-index="${index}" type="button"><i class="fa-solid fa-plus"></i></button>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
          <span style="font-weight: 700; color: var(--primary); font-size: 15px;">${(item.price || 0) * (item.qty || 1)} ج.م</span>
          <button class="cart-remove-btn" data-index="${index}" type="button" style="margin-top: 4px; padding: 4px 8px;"><i class="fa-solid fa-times"></i></button>
        </div>
      `;
      cartList.appendChild(li);
    });
  }

  // Add to cart
  function addToCart(productId, qty = 1) {
    const product = [...productsGrid.children].find(p => p.dataset.productId == productId);
    if (!product) {
      console.error('Product not found:', productId);
      return;
    }
    const name = product.querySelector('h4')?.textContent?.trim();
    const price = parseInt(product.dataset.price);
    const imgElement = product.querySelector('.img img');
    // Get relative path from src attribute instead of absolute URL
    const image = imgElement?.getAttribute('src') || 'images/product-icon.png';
    
    if (!name || isNaN(price)) {
      console.error('Invalid product data:', { productId, name, price });
      return;
    }
    
    const existing = cart.find(item => item.id == productId);
    if (existing) {
      existing.qty += qty;
      // Update image if it wasn't saved before
      if (!existing.image) {
        existing.image = image;
      }
    } else {
      cart.push({ id: productId, name, price, qty, image });
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
  
  // Function to create category list item
  function createCategoryItem(cat, listElement) {
    const li = document.createElement('li');
    li.textContent = cat;
    li.addEventListener('click', () => {
      filterProducts({ category: cat === 'الكل' ? '' : cat });
      // Close mobile menu after selection
      if (window.innerWidth <= 768) {
        closeMobileMenu();
      }
    });
    listElement.appendChild(li);
  }
  
  // Populate desktop categories
  categories.forEach(cat => {
    createCategoryItem(cat, categoriesList);
  });
  
  // Populate mobile categories
  if (mobileCategoriesList) {
    categories.forEach(cat => {
      createCategoryItem(cat, mobileCategoriesList);
    });
  }

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

  // Search functions
  function performSearch(searchValue) {
    filterProducts({ search: searchValue.toLowerCase() });
    // Sync with desktop search input if exists
    if (searchInput) {
      searchInput.value = searchValue;
    }
  }
  
  // Desktop search
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      performSearch(searchInput.value);
    });
  }
  
  // Mobile search
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', () => {
      performSearch(mobileSearchInput.value);
    });
  }
  
  // Mobile search dropdown functions
  function openMobileSearch() {
    if (mobileSearchDropdown && mobileSearchInput) {
      mobileSearchDropdown.classList.add('active');
      // Focus on input after a short delay to ensure it's visible
      setTimeout(() => {
        mobileSearchInput.focus();
      }, 100);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
  }
  
  function closeMobileSearch() {
    if (mobileSearchDropdown && mobileSearchInput) {
      mobileSearchDropdown.classList.remove('active');
      mobileSearchInput.value = '';
      performSearch('');
      // Restore body scroll
      document.body.style.overflow = '';
    }
  }
  
  // Mobile search button click
  if (mobileSearchBtn) {
    mobileSearchBtn.addEventListener('click', () => {
      openMobileSearch();
    });
  }
  
  // Close mobile search
  if (mobileSearchClose) {
    mobileSearchClose.addEventListener('click', () => {
      closeMobileSearch();
    });
  }
  
  // Close mobile search when clicking outside
  if (mobileSearchDropdown) {
    mobileSearchDropdown.addEventListener('click', (e) => {
      if (e.target === mobileSearchDropdown) {
        closeMobileSearch();
      }
    });
  }
  
  // Close mobile search on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileSearchDropdown && mobileSearchDropdown.classList.contains('active')) {
      closeMobileSearch();
    }
  });

  // Price filter
  filterBtn.addEventListener('click', () => {
    const minPrice = parseInt(minPriceInput.value) || '';
    const maxPrice = parseInt(maxPriceInput.value) || '';
    filterProducts({ minPrice, maxPrice });
  });
  
  // Mobile price filter
  if (mobileFilterBtn) {
    mobileFilterBtn.addEventListener('click', () => {
      const minPrice = parseInt(mobileMinPrice.value) || '';
      const maxPrice = parseInt(mobileMaxPrice.value) || '';
      filterProducts({ minPrice, maxPrice });
      // Sync with desktop inputs
      minPriceInput.value = mobileMinPrice.value;
      maxPriceInput.value = mobileMaxPrice.value;
      // Close mobile menu after filtering
      closeMobileMenu();
    });
  }

  // Mobile menu functions
  function openMobileMenu() {
    if (mobileSidebar && mobileOverlay) {
      mobileSidebar.classList.add('active');
      mobileOverlay.classList.add('active');
      document.body.classList.add('menu-open');
    }
  }
  
  function closeMobileMenu() {
    if (mobileSidebar && mobileOverlay) {
      mobileSidebar.classList.remove('active');
      mobileOverlay.classList.remove('active');
      document.body.classList.remove('menu-open');
    }
  }
  
  // Mobile menu toggle
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      openMobileMenu();
    });
  }
  
  // Close menu buttons
  if (closeMenuBtn) {
    closeMenuBtn.addEventListener('click', () => {
      closeMobileMenu();
    });
  }
  
  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', () => {
      closeMobileMenu();
    });
  }
  
  // Cart dropdown toggle
  cartBtn.addEventListener('click', () => {
    const isExpanded = cartDropdown.style.display === 'block';
    if (!isExpanded) {
      // Refresh cart data from localStorage when opening
      cart = JSON.parse(localStorage.getItem('cart')) || [];
      renderCart();
      updateCartBadge();
      
      // On mobile, prevent body scroll
      if (window.innerWidth <= 768) {
        document.body.classList.add('cart-open');
      }
    } else {
      // Remove cart-open class when closing
      document.body.classList.remove('cart-open');
    }
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
      document.body.classList.remove('cart-open');
    }
  });
  
  // Close mobile menu on window resize (if resizing to desktop)
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      closeMobileMenu();
      document.body.classList.remove('cart-open', 'menu-open');
    }
  });

  // Cart item actions (prevent event bubbling to avoid closing dropdown)
  cartList.addEventListener('click', (e) => {
    e.stopPropagation(); // Added: Prevent click from bubbling to document
    const button = e.target.closest('button');
    if (!button) return;
    const index = parseInt(button.dataset.index);
    if (isNaN(index)) return;
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
    // Check for show-qty button (handle click on button or icon inside)
    const showQtyBtn = e.target.closest('.show-qty');
    if (showQtyBtn) {
      const actions = showQtyBtn.parentElement;
      const productId = showQtyBtn.dataset.id;
      actions.innerHTML = `
        <div class="qty-controls">
          <button class="qty-btn minus" data-id="${productId}">-</button>
          <input class="qty-input" type="number" value="1" min="1" data-id="${productId}">
          <button class="qty-btn plus" data-id="${productId}">+</button>
        </div>
        <button class="add-btn confirm-add" data-id="${productId}" type="button"><i class="fa-solid fa-cart-plus"></i> أضف</button>
        <button class="cancel-btn" data-id="${productId}" type="button">إلغاء</button>
      `;
      return;
    }
    
    // Check for qty-btn (handle click on button or icon inside)
    const qtyBtn = e.target.closest('.qty-btn');
    if (qtyBtn) {
      const qtyControls = qtyBtn.closest('.qty-controls');
      const input = qtyControls.querySelector('.qty-input');
      let qty = parseInt(input.value);
      if (qtyBtn.classList.contains('plus')) qty++;
      else if (qty > 1) qty--;
      input.value = qty;
      return;
    }
    
    // Check for confirm-add button
    const confirmBtn = e.target.closest('.confirm-add');
    if (confirmBtn) {
      const productId = confirmBtn.dataset.id;
      const actions = confirmBtn.parentElement;
      const qtyInput = actions.querySelector('.qty-input');
      const qty = parseInt(qtyInput.value) || 1;
      addToCart(productId, qty);
      // Reset to original button
      actions.innerHTML = `<button class="add-btn show-qty" data-id="${productId}" type="button"><i class="fa-solid fa-cart-plus"></i> أضف</button>`;
      return;
    }
    
    // Check for cancel button
    const cancelBtn = e.target.closest('.cancel-btn');
    if (cancelBtn) {
      const productId = cancelBtn.dataset.id;
      const actions = cancelBtn.parentElement;
      // Reset to original button
      actions.innerHTML = `<button class="add-btn show-qty" data-id="${productId}" type="button"><i class="fa-solid fa-cart-plus"></i> أضف</button>`;
      return;
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