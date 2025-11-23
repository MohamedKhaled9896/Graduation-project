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
  
  // ⭐️ عناصر تفاصيل المنتج (Product Detail Modal) ⭐️
  const detailsModal = document.getElementById('productDetailsModal');
  const detailsCloseBtn = document.getElementById('detailsCloseBtn');
  const modalImage = document.getElementById('modalImage');
  const modalName = document.getElementById('modalName');
  const modalPrice = document.getElementById('modalPrice');
  const modalDescription = document.getElementById('modalDescription');
  const modalStock = document.getElementById('modalStock');
  const modalAddToCartBtn = document.getElementById('modalAddToCartBtn');
  
  // User account elements
  const userBtn = document.getElementById('userBtn');
  const userDropdown = document.getElementById('userDropdown');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const profileBtn = document.getElementById('profileBtn');
  const ordersBtn = document.getElementById('ordersBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  
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

  // Device detection helper — set body classes so CSS can target device types
  function detectDevice() {
    try {
      const uaMobile = /Mobi|Android|iPhone|iPad|Windows Phone|Opera Mini/i.test(navigator.userAgent);
      const mm = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
      const isMobile = uaMobile || !!mm;
      document.body.classList.toggle('device-mobile', isMobile);
      document.body.classList.toggle('device-desktop', !isMobile);
      return isMobile;
    } catch (e) {
      // fallback to width
      const isMobile = window.innerWidth <= 768;
      document.body.classList.toggle('device-mobile', isMobile);
      document.body.classList.toggle('device-desktop', !isMobile);
      return isMobile;
    }
  }

  // initialize device class and update on resize/orientation change
  detectDevice();
  window.addEventListener('resize', () => detectDevice());
  window.addEventListener('orientationchange', () => setTimeout(detectDevice, 200));

  // Helpers for per-user cart storage
  function cartKeyForEmail(email) {
    return 'cart_' + (email || '').toLowerCase();
  }
  function saveCartForEmail(email) {
    if (!email) return;
    try { localStorage.setItem(cartKeyForEmail(email), JSON.stringify(cart || [])); } catch (e) { console.warn('Failed to save cart for', email, e); }
  }
  function loadCartForEmail(email) {
    if (!email) return false;
    try {
      const s = localStorage.getItem(cartKeyForEmail(email));
      if (s) {
        localStorage.setItem('cart', s);
        cart = JSON.parse(s) || [];
        return true;
      }
    } catch (e) { console.warn('Failed to load cart for', email, e); }
    return false;
  }

  // ⭐️ دالة تسجيل الخروج الموحدة ⭐️
  function handleLogout() {
      if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
          // 1. حفظ السلة الحالية لحساب المستخدم قبل تسجيل الخروج
          try {
              const sessionData = localStorage.getItem('motorstore_session');
              if (sessionData) {
                  const sess = JSON.parse(sessionData);
                  if (sess && sess.user && sess.user.email) {
                      saveCartForEmail(sess.user.email);
                  }
              }
          } catch (e) { console.warn('Failed to persist cart on logout', e); }
          
          // 2. مسح بيانات السلة والجلسة
          try { localStorage.removeItem('cart'); } catch (e) {}
          cart = [];
          try { localStorage.removeItem('motorstore_session'); } catch (e) {}
          
          // 3. تحديث وإعادة تحميل الصفحة
          window.location.reload();
      }
  }

  // Check if user is logged in and update UI
  function checkUserLogin() {
    // Get session from secure storage
    let session = null;
    try {
      const sessionData = localStorage.getItem('motorstore_session');
      if (sessionData) {
        session = JSON.parse(sessionData);
        // Check if session expired
        if (session.expiresAt && Date.now() > session.expiresAt) {
          localStorage.removeItem('motorstore_session');
          session = null;
        }
      }
    } catch (e) {
      session = null;
    }
    
    const user = session ? session.user : null;
    
    if (user && loginBtn && registerBtn && profileBtn && ordersBtn && logoutBtn) {
      // User is logged in - show profile options
      loginBtn.style.display = 'none';
      registerBtn.style.display = 'none';
      profileBtn.style.display = 'flex';
      ordersBtn.style.display = 'flex';
      logoutBtn.style.display = 'flex';
      // load per-user cart if available
      try { loadCartForEmail(user.email); } catch (e) { /* ignore */ }
      updateCartBadge();
      try { renderCart(); } catch (e) { /* ignore */ }
    } else if (loginBtn && registerBtn && profileBtn && ordersBtn && logoutBtn) {
      // User is not logged in - show login/register options
      loginBtn.style.display = 'flex';
      registerBtn.style.display = 'flex';
      profileBtn.style.display = 'none';
      ordersBtn.style.display = 'none';
      logoutBtn.style.display = 'none';
      // keep cart as guest cart (no change) or clear depending on policy
    }
  }

  // Check login status on page load
  checkUserLogin();

  // ⭐️⭐️ التصحيح النهائي في دالة renderHeaderUser() ⭐️⭐️
  function renderHeaderUser() {
      // allow pages to opt-out by setting `window.__disableHeaderUser = true` before this script runs
      if (window && window.__disableHeaderUser) return;
      
      // قراءة الجلسة
      let session = null;
      try {
          const sessionData = localStorage.getItem('motorstore_session');
          if (sessionData) {
              session = JSON.parse(sessionData);
              if (session.expiresAt && Date.now() > session.expiresAt) {
                  localStorage.removeItem('motorstore_session');
                  session = null;
              }
          }
      } catch (e) {
          session = null;
      }

      const header = document.querySelector('header.header-section');
      if (!header) return;
      const container = header.querySelector('.container');
      if (!container) return;

      // right area usually the second child
      const rightArea = container.children[1] || container.querySelector(':scope > div:last-child');
      if (!rightArea) return;

      // ⭐️⭐️ إزالة أي عناصر مستخدم موجودة مسبقاً ⭐️⭐️
      const prevHeaderUser = rightArea.querySelector('.header-user');
      if (prevHeaderUser) prevHeaderUser.remove();

      const prevMobileUser = document.querySelector('.mobile-header-user');
      if (prevMobileUser) prevMobileUser.remove();

      // ⭐️⭐️ البحث عن جميع عناصر user-wrapper وإخفاؤها ⭐️⭐️
      const userWrappers = rightArea.querySelectorAll('.user-wrapper, #userWrapper');
      
      if (session && session.user) {
          // ⭐️⭐️ إخفاء جميع عناصر user-wrapper الأصلية ⭐️⭐️
          userWrappers.forEach(wrapper => {
              wrapper.style.display = 'none';
          });

          // Determine mobile/desktop via body classes set by detectDevice()
          const isMobile = document.body.classList.contains('device-mobile');
          
          if (!isMobile) {
              // ⭐️⭐️ DESKTOP: Create Clickable Greeting and Dropdown Menu ⭐️⭐️
              
              // 1. Create the wrapper
              const wrapper = document.createElement('div');
              wrapper.className = 'header-user';
              wrapper.style.display = 'flex';
              wrapper.style.alignItems = 'center';
              wrapper.style.gap = '10px';
              wrapper.style.cursor = 'pointer';

              // 2. The clickable greeting/toggle element
              const greet = document.createElement('div');
              greet.className = 'header-greeting-toggle';
              greet.innerHTML = `<i class="fa-solid fa-user" style="margin-left: 6px;"></i> مرحبا ${session.user.name || ''}`;
              
              // 3. The Menu Dropdown Structure
              const menu = document.createElement('div');
              menu.className = 'header-user-menu';
              menu.id = 'headerUserMenu';

              // 3a. متابعة طلباتك (Continue orders)
              const ordersLink = document.createElement('a');
              ordersLink.href = '#'; 
              ordersLink.textContent = 'متابعة طلباتك';
              ordersLink.onclick = (e) => {
                  e.preventDefault();
                  alert('صفحة الطلبات - سيتم إضافتها قريباً');
                  menu.classList.remove('active');
              };
              menu.appendChild(ordersLink);

              // 3b. تسجيل الخروج (Logout) - Red Button
              const logoutBtnMenu = document.createElement('button');
              logoutBtnMenu.className = 'logout-action';
              logoutBtnMenu.type = 'button';
              logoutBtnMenu.textContent = 'تسجيل الخروج';
              logoutBtnMenu.addEventListener('click', handleLogout);
              menu.appendChild(logoutBtnMenu);

              wrapper.appendChild(greet);
              wrapper.appendChild(menu);

              // 4. Toggle functionality
              wrapper.addEventListener('click', (e) => {
                  e.stopPropagation(); 
                  menu.classList.toggle('active');
              });

              // Close menu when clicking anywhere else on the page
              document.addEventListener('click', (e) => {
                  if (!wrapper.contains(e.target)) {
                      menu.classList.remove('active');
                  }
              });
              
              // Insertion logic - إدراج العنصر الجديد في المكان الصحيح
              const cartWrapper = rightArea.querySelector('.cart-wrapper, #cartWrapper');
              if (cartWrapper) {
                  rightArea.insertBefore(wrapper, cartWrapper);
              } else {
                  rightArea.appendChild(wrapper);
              }
          }

          // ⭐️⭐️ MOBILE: Create user block in sidebar ⭐️⭐️
          const mobileSidebar = document.getElementById('mobileSidebar');
          if (mobileSidebar) {
              // Remove any existing mobile user block first
              const existingMobileUser = mobileSidebar.querySelector('.mobile-header-user');
              if (existingMobileUser) existingMobileUser.remove();

              const mobileBlock = document.createElement('div');
              mobileBlock.className = 'mobile-header-user';

              const mobileGreet = document.createElement('div');
              mobileGreet.className = 'greet';
              mobileGreet.textContent = 'مرحبا ' + (session.user.name || '');

              // ⭐️⭐️ إضافة رابط متابعة الطلبات في الموبايل ⭐️⭐️
              const mobileOrders = document.createElement('button');
              mobileOrders.className = 'mobile-orders-btn';
              mobileOrders.type = 'button';
              mobileOrders.textContent = 'متابعة طلباتك';
              mobileOrders.style.cssText = `
                  display: block;
                  width: 100%;
                  padding: 12px;
                  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                  color: #fff;
                  border: none;
                  border-radius: 8px;
                  cursor: pointer;
                  font-weight: 700;
                  font-size: 16px;
                  margin-bottom: 12px;
                  transition: all var(--transition-fast);
              `;
              mobileOrders.onclick = () => {
                  alert('صفحة الطلبات - سيتم إضافتها قريباً');
                  closeMobileMenu();
              };

              const mobileLogout = document.createElement('button');
              mobileLogout.className = 'mobile-logout-btn';
              mobileLogout.type = 'button';
              mobileLogout.textContent = 'تسجيل الخروج';

              mobileBlock.appendChild(mobileGreet);
              mobileBlock.appendChild(mobileOrders); // ⭐️ إضافة زر الطلبات
              mobileBlock.appendChild(mobileLogout);

              // Insert mobile block at the top of the sidebar content
              try {
                  const sidebarHeader = mobileSidebar.querySelector('.mobile-sidebar-header');
                  if (sidebarHeader && sidebarHeader.parentElement) {
                      sidebarHeader.parentElement.insertBefore(mobileBlock, sidebarHeader.nextSibling);
                  } else {
                      mobileSidebar.insertBefore(mobileBlock, mobileSidebar.firstChild);
                  }
              } catch (e) {
                  mobileSidebar.appendChild(mobileBlock);
              }

              // ربط دالة تسجيل الخروج
              mobileLogout.addEventListener('click', handleLogout);
          }

      } else {
          // User is not logged in - show original user wrappers
          userWrappers.forEach(wrapper => {
              wrapper.style.display = '';
          });
      }
  }

  // Ensure header reflects current session on load unless a page opts out
  try { if (!window.__disableHeaderUser) renderHeaderUser(); } catch (e) { /* ignore on pages without header */ }

  // Auto-direction for input fields: Arabic -> RTL, otherwise -> LTR
  (function setupAutoInputDirection() {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

    function applyDirection(el) {
      if (!el) return;
      // keep email inputs LTR by default
      const type = (el.getAttribute('type') || '').toLowerCase();
      if (type === 'email' || el.classList.contains('force-ltr')) {
        el.dir = 'ltr';
        el.style.textAlign = 'left';
        return;
      }

      const val = el.value || el.placeholder || '';
      // if contains Arabic characters -> RTL, else LTR
      if (arabicRegex.test(val)) {
        el.dir = 'rtl';
        el.style.textAlign = 'right';
      } else {
        el.dir = 'ltr';
        el.style.textAlign = 'left';
      }
    }

    // Attach listeners to relevant inputs and textareas
    function attachTo(el) {
      if (!el) return;
      // initial direction
      applyDirection(el);
      // react to typing/paste/focus
      el.addEventListener('input', () => applyDirection(el));
      el.addEventListener('paste', () => setTimeout(() => applyDirection(el), 0));
      el.addEventListener('focus', () => applyDirection(el));
    }

    // select inputs we care about (exclude email which is forced LTR)
    const selector = 'input[type="text"], input[type="password"], input[type="search"], textarea, input:not([type])';
    document.querySelectorAll(selector).forEach(attachTo);
    // ensure emails are LTR
    document.querySelectorAll('input[type="email"]').forEach(el => {
      el.dir = 'ltr';
      el.style.textAlign = 'left';
    });
  })();

  // Update cart badge
  function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    cartBadge.textContent = totalItems;
    cartBadge.style.display = totalItems > 0 ? 'block' : 'none';
  }

  // ⭐️ دالة عرض تفاصيل المنتج في النافذة المنبثقة ⭐️
  function showProductDetails(productData) {
      if (!detailsModal) {
          console.error("Product Details Modal elements are missing from the DOM.");
          return;
      }
      // ملء بيانات النافذة
      modalImage.src = productData.image || 'images/product-icon.png';
      modalName.textContent = productData.name;
      modalPrice.textContent = `${parseFloat(productData.price).toFixed(2)} ج.م`;
      modalDescription.textContent = productData.description || 'لا يوجد وصف متاح حاليًا لهذا المنتج.';
      modalStock.textContent = productData.stock || 0;
      
      // ربط زر الإضافة في النافذة المنبثقة بنفس دالة إضافة المنتج
      modalAddToCartBtn.onclick = () => {
          // يتم إضافة قطعة واحدة افتراضياً من نافذة التفاصيل
          addToCart(productData.id, 1);
          detailsModal.style.display = 'none'; // إغلاق النافذة بعد الإضافة
      };

      // تحديث حالة زر الإضافة بناءً على المخزون
      const stock = parseInt(productData.stock) || 0;
      if (stock === 0) {
          modalAddToCartBtn.disabled = true;
          modalAddToCartBtn.textContent = 'نفدت الكمية';
          modalAddToCartBtn.style.backgroundColor = 'var(--muted)';
      } else {
          modalAddToCartBtn.disabled = false;
          modalAddToCartBtn.textContent = 'أضف إلى السلة';
          modalAddToCartBtn.style.backgroundColor = ''; // استخدام تنسيق CSS الافتراضي
      }

      detailsModal.style.display = 'block';
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
          <span style="font-weight: 700; color: var(--primary); font-size: 15px;">${((item.price || 0) * (item.qty || 1)).toFixed(2)} ج.م</span>
          <button class="cart-remove-btn" data-index="${index}" type="button" style="margin-top: 4px; padding: 4px 8px;"><i class="fa-solid fa-times"></i></button>
        </div>
      `;
      cartList.appendChild(li);
    });

    // Total row
    try {
      const total = cart.reduce((sum, it) => sum + ((it.price || 0) * (it.qty || 1)), 0);
      const totalRow = document.createElement('div');
      totalRow.className = 'cart-total-row';
      totalRow.style.display = 'flex';
      totalRow.style.justifyContent = 'space-between';
      totalRow.style.alignItems = 'center';
      totalRow.style.padding = '12px';
      totalRow.style.borderTop = '1px solid rgba(0,0,0,0.04)';
      totalRow.style.marginTop = '8px';
      totalRow.innerHTML = `
        <div style="font-weight:700;color:#222">الإجمالي</div>
        <div style="font-weight:700;color:var(--primary)">${total.toFixed(2)} ج.م</div>
      `;
      cartList.appendChild(totalRow);

      // Buttons container (Clear Cart and Checkout)
      const buttonsWrap = document.createElement('div');
      buttonsWrap.style.display = 'flex';
      buttonsWrap.style.justifyContent = 'space-between';
      buttonsWrap.style.gap = '10px';
      buttonsWrap.style.padding = '12px';
      
      // 1. Clear Cart button
      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'clear-cart-btn';
      clearBtn.textContent = 'إفراغ السلة';
      clearBtn.style.background = '#dc3545'; // Danger Red
      clearBtn.style.color = '#fff';
      clearBtn.style.border = 'none';
      clearBtn.style.padding = '10px 12px';
      clearBtn.style.borderRadius = '8px';
      clearBtn.style.cursor = 'pointer';
      clearBtn.style.flex = '1';
      
      clearBtn.addEventListener('click', clearCart);
      
      // 2. Checkout button
      const checkoutBtn = document.createElement('button');
      checkoutBtn.type = 'button';
      checkoutBtn.className = 'checkout-btn';
      checkoutBtn.textContent = 'استكمال الشراء';
      checkoutBtn.style.background = 'var(--header-gradient)';
      checkoutBtn.style.color = '#fff';
      checkoutBtn.style.border = 'none';
      checkoutBtn.style.padding = '10px 12px';
      checkoutBtn.style.borderRadius = '8px';
      checkoutBtn.style.cursor = 'pointer';
      checkoutBtn.style.flex = '1';
      
      // إضافة وظيفة الانتقال هنا
      checkoutBtn.addEventListener('click', () => {
          // 1. حفظ السلة لضمان أن آخر تحديث قد تم قبل الانتقال
          localStorage.setItem('cart', JSON.stringify(cart)); 
          
          // 2. الأمر: فتح صفحة الشراء (بافتراض أنها في مسار Purchases/checkout.html)
          window.open('Purchases/checkout.html', '_blank'); 
          
          // 3. إغلاق قائمة السلة بعد النقر
          cartDropdown.style.display = 'none';
          cartBtn.setAttribute('aria-expanded', 'false');
          cartDropdown.setAttribute('aria-hidden', 'true');
          document.body.classList.remove('cart-open');
      });
      
      buttonsWrap.appendChild(clearBtn);
      buttonsWrap.appendChild(checkoutBtn);
      cartList.appendChild(buttonsWrap);

    } catch (e) {
      console.warn('Failed to render cart total or checkout', e);
    }
  }

  // Add to cart
  function addToCart(productId, qty = 1) {
    const product = [...productsGrid.children].find(p => p.dataset.productId == productId);
    if (!product) {
      console.error('Product not found:', productId);
      return;
    }
    
    // Check if product is sold out
    const isSoldOut = product.dataset.sold === 'true' || product.classList.contains('sold-out');
    if (isSoldOut) {
      alert('عذراً، هذا المنتج غير متوفر حالياً!');
      return;
    }
    
    // Check stock availability
    const stock = parseInt(product.dataset.stock) || 0;
    if (stock === 0) {
      alert('عذراً، هذا المنتج غير متوفر حالياً!');
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
    
    // Check if requested quantity exceeds stock
    const existing = cart.find(item => item.id == productId);
    const currentCartQty = existing ? existing.qty : 0;
    if (currentCartQty + qty > stock) {
      alert(`عذراً، الكمية المتاحة هي ${stock} قطعة فقط!`);
      return;
    }
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
  
  // ⭐️ دالة إفراغ السلة بالكامل ⭐️
  function clearCart() {
    if (confirm('هل أنت متأكد أنك تريد إفراغ السلة بالكامل؟')) {
        // Check if user is logged in to save the empty cart
        let session = JSON.parse(localStorage.getItem('motorstore_session'));
        let userEmail = session && session.user ? session.user.email : null;
        
        cart = []; // Clear the cart array
        localStorage.setItem('cart', JSON.stringify(cart)); // Save to default local storage
        if (userEmail) {
            saveCartForEmail(userEmail); // Save empty cart to user's storage
        }
        
        updateCartBadge();
        renderCart();
        // Close dropdown after clearing
        try {
          cartDropdown.style.display = 'none';
          cartBtn.setAttribute('aria-expanded', 'false');
          cartDropdown.setAttribute('aria-hidden', 'true');
          document.body.classList.remove('cart-open');
        } catch (e) { /* ignore if elements not found */ }
    }
  }

  // Update item quantity in cart
  function updateCartQty(index, delta) {
    // جلب الكمية المتاحة من عنصر المنتج في الصفحة
    const productId = cart[index].id;
    const productElement = productsGrid.querySelector(`.product[data-product-id="${productId}"]`);
    const stock = parseInt(productElement?.dataset.stock) || Infinity;

    // التحقق من أن الزيادة لا تتجاوز المخزون
    if (delta > 0 && cart[index].qty + delta > stock) {
        alert(`عذراً، الكمية المتاحة هي ${stock} قطعة فقط!`);
        return;
    }

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
      if (document.body.classList.contains('device-mobile')) {
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
    // ensure listener attached (re-attach safely)
    try { menuToggle.removeEventListener('click', openMobileMenu); } catch (e) {}
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

  // ⭐️ مستمعات إغلاق النافذة المنبثقة لتفاصيل المنتج ⭐️
  if (detailsCloseBtn) {
    detailsCloseBtn.addEventListener('click', () => {
      if (detailsModal) detailsModal.style.display = 'none';
    });
  }

  if (detailsModal) {
    // إغلاق النافذة المنبثقة عند النقر على الخلفية الرمادية
    window.addEventListener('click', (event) => {
        if (event.target === detailsModal) {
            detailsModal.style.display = 'none';
        }
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
      if (document.body.classList.contains('device-mobile')) {
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
    // Close Cart dropdown
    if (!cartBtn.contains(e.target) && !cartDropdown.contains(e.target)) {
      cartDropdown.style.display = 'none';
      cartBtn.setAttribute('aria-expanded', 'false');
      cartDropdown.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('cart-open');
    }
    
    // Close user dropdown (original icon) on outside click
    if (userBtn && userDropdown && !userBtn.contains(e.target) && !userDropdown.contains(e.target)) {
      userDropdown.style.display = 'none';
      userBtn.setAttribute('aria-expanded', 'false');
      userDropdown.setAttribute('aria-hidden', 'true');
    }
  });

  // User dropdown toggle
  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Check if user is logged in
      let session = JSON.parse(localStorage.getItem('motorstore_session'));
      let user = session ? session.user : null;

      if (!user) {
          window.location.href = 'sign/sign.html?mode=login';
          return;
      }

      
      // User is logged in - show dropdown menu
      const isExpanded = userDropdown.style.display === 'block';
      userDropdown.style.display = isExpanded ? 'none' : 'block';
      userBtn.setAttribute('aria-expanded', !isExpanded);
      userDropdown.setAttribute('aria-hidden', isExpanded);
      
      // Close cart dropdown if open
      if (cartDropdown.style.display === 'block') {
        cartDropdown.style.display = 'none';
        cartBtn.setAttribute('aria-expanded', 'false');
        cartDropdown.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('cart-open');
      }
    });
  }

  // User menu item click handlers
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      // Navigate to sign page with login mode
      window.location.href = 'sign/sign.html?mode=login';
    });
  }

  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      // Navigate to sign page with register mode
      window.location.href = 'sign/sign.html?mode=register';
    });
  }

  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      // TODO: Navigate to profile page
      alert('صفحة الملف الشخصي - سيتم إضافتها قريباً');
      userDropdown.style.display = 'none';
      userBtn.setAttribute('aria-expanded', 'false');
      userDropdown.setAttribute('aria-hidden', 'true');
    });
  }

  if (ordersBtn) {
    ordersBtn.addEventListener('click', () => {
      // TODO: Navigate to orders page
      alert('صفحة الطلبات - سيتم إضافتها قريباً');
      userDropdown.style.display = 'none';
      userBtn.setAttribute('aria-expanded', 'false');
      userDropdown.setAttribute('aria-hidden', 'true');
    });
  }

  if (logoutBtn) {
    // ⭐️ تم استبدال هذا المستمع بدالة handleLogout وربطه بالزر الجديد ⭐️
    logoutBtn.addEventListener('click', () => {
      if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        // Save current cart to user's cart storage, then clear global cart
        try {
          const sessionData = localStorage.getItem('motorstore_session');
          if (sessionData) {
            const sess = JSON.parse(sessionData);
            if (sess && sess.user && sess.user.email) {
              saveCartForEmail(sess.user.email);
            }
          }
        } catch (e) { console.warn('Failed to persist cart on logout', e); }
        try { localStorage.removeItem('cart'); } catch (e) {}
        cart = [];
        // Clear user session
        localStorage.removeItem('motorstore_session');
        // Update UI to show login/register options
        checkUserLogin();
        updateCartBadge();
        renderCart();
        alert('تم تسجيل الخروج بنجاح');
      }
      userDropdown.style.display = 'none';
      userBtn.setAttribute('aria-expanded', 'false');
      userDropdown.setAttribute('aria-hidden', 'true');
    });
  }
  
  // Close mobile menu on window resize (if switching to desktop)
  window.addEventListener('resize', () => {
    if (!document.body.classList.contains('device-mobile')) {
      closeMobileMenu();
      document.body.classList.remove('cart-open', 'menu-open');
    }
    // keep device class updated (in case matchMedia changed)
    detectDevice();
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
    
    // ⭐️ معالجة النقر على زر عرض التفاصيل (Details Button) ⭐️
    const detailsBtn = e.target.closest('.details-btn');
    if (detailsBtn) {
        const card = detailsBtn.closest('.product');
        if (!card) return;
        
        const id = card.dataset.productId; 
        const name = card.querySelector('h4').textContent;
        const price = card.dataset.price;
        const image = card.querySelector('.img img').src;
        // يجب أن يكون الوصف محفوظاً في data-description في HTML
        const description = card.dataset.description || 'لا يوجد وصف متاح.'; 
        const stock = card.dataset.stock; 
        
        showProductDetails({ id, name, price, image, description, stock });
        return; // توقف هنا لتجنب تداخل منطق الكمية
    }

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

  // Contact button (removed from markup) - guard in case it's present
  if (contactBtn) {
    contactBtn.addEventListener('click', () => {
      alert('تواصل معنا عبر البريد الإلكتروني أو الهاتف!');
    });
  }

  // Initialize stock and sold status for all products
  function initializeProductStock() {
    const products = document.querySelectorAll('.product');
    products.forEach(product => {
      // قراءة sold out من HTML (data-sold-out="true")
      // إذا لم يكن موجود في HTML، يكون false
      const isSoldOut = product.dataset.soldOut === 'true';
      
      // قراءة المخزون من HTML (data-stock="عدد")
      // إذا لم يكن موجود في HTML، يولد رقم عشوائي من 1-50
      // إذا كان المنتج sold out، يكون المخزون 0 تلقائياً
      let stock = 0;
      if (product.dataset.stock) {
        stock = parseInt(product.dataset.stock);
      } else if (!isSoldOut) {
        stock = Math.floor(Math.random() * 50) + 1; // من 1 إلى 50
      }
      
      // Find or create stock info element
      let stockInfo = product.querySelector('.stock-info');
      if (!stockInfo) {
        stockInfo = document.createElement('div');
        stockInfo.className = 'stock-info';
        stockInfo.innerHTML = '<i class="fa-solid fa-box"></i> متوفر: <span class="stock-count">0</span> قطعة';
        const brand = product.querySelector('.brand');
        if (brand) {
          brand.insertAdjacentElement('afterend', stockInfo);
        }
      }
      
      // Find or create sold out badge
      let soldBadge = product.querySelector('.sold-out-badge');
      const imgContainer = product.querySelector('.img');
      if (!soldBadge && imgContainer) {
        soldBadge = document.createElement('div');
        soldBadge.className = 'sold-out-badge';
        soldBadge.textContent = 'نفدت الكمية';
        imgContainer.appendChild(soldBadge);
      }
      
      // Update stock count
      const stockCount = stockInfo.querySelector('.stock-count');
      if (stockCount) {
        stockCount.textContent = stock;
      }
      
      // Update sold out status
      if (soldBadge) {
        // يعرض sold out إذا كان data-sold-out="true" في HTML أو إذا المخزون صفر
        if (isSoldOut || stock === 0) {
          soldBadge.style.display = 'flex';
          product.classList.add('sold-out');
          const addBtn = product.querySelector('.add-btn');
          if (addBtn) {
            addBtn.disabled = true;
            addBtn.style.opacity = '0.5';
            addBtn.style.cursor = 'not-allowed';
          }
        } else {
          soldBadge.style.display = 'none';
          product.classList.remove('sold-out');
        }
      }
      
      // Store stock in data attribute (إذا لم يكن موجود في HTML)
      if (!product.dataset.stock) {
        product.setAttribute('data-stock', stock);
      }
      product.setAttribute('data-sold', isSoldOut || stock === 0);
    });
  }
  
  // ⭐️⭐️ الحل لمشكلة العودة للخلف (Back Button) ⭐️⭐️
  // نستخدم حدث 'pageshow' للتأكد من إعادة تحميل حالة السلة والمنتجات بشكل إجباري
  window.addEventListener('pageshow', (event) => {
    // التحقق مما إذا كانت الصفحة يتم استعادتها من ذاكرة التخزين المؤقت للمتصفح (BFCache)
    if (event.persisted) {
      // إعادة تحميل بيانات السلة، وإعادة عرض المنتجات وتحديث المخزون
      // هذا يضمن أن السلة ستظهر بالبيانات الصحيحة عند العودة من صفحة أخرى (مثل صفحة تسجيل الدخول)
      cart = JSON.parse(localStorage.getItem('cart')) || []; // إعادة قراءة السلة من التخزين
      updateCartBadge();
      renderCart();
      initializeProductStock();
      renderHeaderUser(); // ⭐️ إعادة تحميل واجهة المستخدم
    }
  });
  // ⭐️⭐️ نهاية الحل لمشكلة العودة للخلف ⭐️⭐️

  // Initialize on initial page load (DOMContentLoaded)
  updateCartBadge();
  renderCart();
  initializeProductStock();
  renderHeaderUser(); // ⭐️ التأكد من تحميل واجهة المستخدم

});
