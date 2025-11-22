// checkout-logic.js - المنطق البرمجي لصفحة إتمام الشراء

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. تعريف العناصر الأساسية
    // -------------------------------------------------------------
    const productsList = document.getElementById('checkoutProductsList');
    const subtotalAmount = document.getElementById('subtotalAmount');
    const totalAmount = document.getElementById('totalAmount');
    const shippingFee = document.getElementById('shippingFee');
    const confirmPurchaseBtn = document.getElementById('confirmPurchaseBtn');
    const shippingForm = document.getElementById('shippingForm'); 
    const paymentOptions = document.querySelectorAll('.payment-option');
    const paymentAlert = document.getElementById('paymentAlert');
    const cartAlert = document.getElementById('cartAlert');
    
    // عناصر حقول البطاقة
    const creditCardDetails = document.getElementById('creditCardDetails');
    const cardNumberInput = document.getElementById('cardNumber');
    const cardExpiryInput = document.getElementById('cardExpiry');
    const cardCVCInput = document.getElementById('cardCVC');
    const cardTypeIcon = document.getElementById('cardTypeIcon'); 
    
    // عنصر الهاتف وعنصر الاسم الكامل (مهم لتمرير البيانات)
    const phoneInput = document.getElementById('phone');
    const fullNameInput = document.getElementById('fullName'); 
    
    const PRODUCT_IMAGE_PATH = '../images/'; // الافتراض أن المجلد هو ../images/ (العودة للمجلد الرئيسي ثم الدخول لـ images)

    // 2. قراءة بيانات السلة والثوابت
    const cartJSON = localStorage.getItem('cart');
    let cart = cartJSON ? JSON.parse(cartJSON).map(item => ({
        ...item,
        qty: item.qty || 1 
    })) : [];
    const SHIPPING_COST = 50.00; 
    let selectedPaymentMethod = 'cod'; 
    
    // -------------------------------------------------------------
    // 3. الدوال المساعدة لتحقق البطاقة
    // -------------------------------------------------------------
    
    function detectCardType(number) {
        const cleaned = number.replace(/\s/g, '');
        if (cleaned.startsWith('4')) return 'visa';
        if (cleaned.match(/^5[1-5]/)) return 'mastercard';
        return 'default';
    }

    function formatCardNumber(input) {
        let value = input.value.replace(/\s/g, ''); 
        let formatted = value.match(/.{1,4}/g); 
        input.value = formatted ? formatted.join(' ') : value;
    }

    function formatExpiryDate(input) {
        let value = input.value.replace(/\D/g, ''); 
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        input.value = value;
    }
    
    function validateExpiryDate(input) {
        const value = input.value.replace(/\s/g, ''); 
        const parts = value.split('/');
        input.setCustomValidity(''); 
        
        if (parts.length === 2 && parts[0].length === 2 && parts[1].length === 2) {
            const inputMonth = parseInt(parts[0], 10);
            const inputYear = parseInt(parts[1], 10); 

            const now = new Date();
            const currentYear = now.getFullYear() % 100; 
            const currentMonth = now.getMonth() + 1; 

            if (inputMonth < 1 || inputMonth > 12) {
                input.setCustomValidity('الشهر يجب أن يكون بين 01 و 12.');
                return; 
            }

            if (inputYear < currentYear || (inputYear === currentYear && inputMonth < currentMonth)) {
                input.setCustomValidity('تاريخ انتهاء البطاقة قديم.');
                return; 
            }
        } 
    }
    
    // -------------------------------------------------------------
    // 4. معالجة الأحداث (Event Handlers)
    // -------------------------------------------------------------

    // تنقية حقل الهاتف
    phoneInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    // تحديث طريقة الدفع
    function updatePaymentSelection() {
        paymentOptions.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio.checked) {
                option.classList.add('selected');
                selectedPaymentMethod = radio.value;
            } else {
                option.classList.remove('selected');
            }
        });
        
        const isCreditCardSelected = selectedPaymentMethod === 'visa';
        creditCardDetails.style.display = isCreditCardSelected ? 'block' : 'none';

        const inputs = [cardNumberInput, cardExpiryInput, cardCVCInput];
        inputs.forEach(input => {
            if (isCreditCardSelected) {
                input.required = true;
                input.disabled = false;
            } else {
                creditCardDetails.classList.remove('was-submitted'); 
                input.required = false;
                input.disabled = true;
                input.value = ''; 
                input.setCustomValidity('');
            }
        });
        
        if (!isCreditCardSelected) {
            cardTypeIcon.className = 'card-icon'; 
            cardTypeIcon.style.display = 'none';
        }
    }

    // مستمعات لاختيار طريقة الدفع
    paymentOptions.forEach(option => {
        option.addEventListener('click', () => {
            const radio = option.querySelector('input[type="radio"]');
            radio.checked = true;
            updatePaymentSelection();
        });
    });
    updatePaymentSelection(); 
    
    // مستمع لتحديث أيقونة البطاقة والتنسيق
    cardNumberInput.addEventListener('input', (e) => {
        formatCardNumber(e.target);
        const type = detectCardType(e.target.value);
        
        cardTypeIcon.className = 'card-icon';
        
        if (type === 'visa') {
            cardTypeIcon.classList.add('fa-brands', 'fa-cc-visa');
            cardTypeIcon.style.color = '#1a1f71'; 
            cardTypeIcon.style.display = 'block';
        } else if (type === 'mastercard') {
            cardTypeIcon.classList.add('fa-brands', 'fa-cc-mastercard');
            cardTypeIcon.style.color = '#eb001b'; 
            cardTypeIcon.style.display = 'block';
        } else {
            cardTypeIcon.className = 'card-icon'; 
            cardTypeIcon.style.display = 'none'; 
        }
    });

    // مستمع لتنسيق تاريخ الانتهاء وتحديث التحقق
    cardExpiryInput.addEventListener('input', (e) => {
        formatExpiryDate(e.target);
        validateExpiryDate(e.target); 
    });


    // -------------------------------------------------------------
    // 5. دالة عرض المنتجات وحساب الإجمالي (Render)
    // -------------------------------------------------------------
    
    function renderCheckout() {
        productsList.innerHTML = '';
        let subtotal = 0;

        if (cart.length === 0) {
            productsList.innerHTML = '<p style="text-align: center; color: var(--muted); margin-top: 20px;">سلة المشتريات فارغة. الرجاء العودة لصفحة المنتجات.</p>';
            confirmPurchaseBtn.disabled = true; 
            confirmPurchaseBtn.style.opacity = 0.7;
            confirmPurchaseBtn.style.cursor = 'not-allowed';
            cartAlert.style.display = 'block';
        } else {
            confirmPurchaseBtn.disabled = false;
            confirmPurchaseBtn.style.opacity = 1;
            confirmPurchaseBtn.style.cursor = 'pointer';
            cartAlert.style.display = 'none';
            
            cart.forEach(item => {
                const itemTotal = item.price * item.qty; 
                subtotal += itemTotal;

                const productDiv = document.createElement('div');
                productDiv.className = 'product-item';
                
                // التأكد من مسار الصورة صحيح
                const imageFileName = item.image ? item.image.substring(item.image.lastIndexOf('/') + 1) : 'placeholder.jpg';
                const imagePath = PRODUCT_IMAGE_PATH + imageFileName;

                productDiv.innerHTML = `
                    <img src="${imagePath}" alt="${item.name}" class="product-image" width="60" height="60">
                    
                    <div class="product-details">
                        <h4>${item.name}</h4>
                        <div class="item-specs">
                            <p>الكمية: <strong>${item.qty}</strong></p>
                            <p>سعر الوحدة: <strong>${item.price.toFixed(2)} ج.م</strong></p>
                        </div>
                    </div>
                    
                    <span class="item-total-price">${itemTotal.toFixed(2)} ج.م</span>
                `;
                productsList.appendChild(productDiv);
            });
        }
        
        const total = subtotal + SHIPPING_COST;

        subtotalAmount.textContent = `${subtotal.toFixed(2)} ج.م`;
        shippingFee.textContent = `${SHIPPING_COST.toFixed(2)} ج.م`;
        totalAmount.textContent = `${total.toFixed(2)} ج.م`;
    }

    renderCheckout();
    
    // -------------------------------------------------------------
    // 6. وظيفة زر تأكيد الشراء (المسؤولة عن التحقق والتوجيه)
    // -------------------------------------------------------------
    
    confirmPurchaseBtn.addEventListener('click', () => {
        paymentAlert.style.display = 'none';
        
        if (cart.length === 0) {
            cartAlert.style.display = 'block';
            return; 
        }
        
        // تفعيل التلوين الأحمر المشروط (Validation styling)
        shippingForm.classList.add('was-submitted');
        if (selectedPaymentMethod === 'visa') {
            creditCardDetails.classList.add('was-submitted');
        } else {
            creditCardDetails.classList.remove('was-submitted');
        }
        
        // 1. التحقق من صحة بيانات التوصيل
        if (!shippingForm.checkValidity()) {
            shippingForm.reportValidity(); 
            return; 
        }
        
        // 2. التحقق الصارم من صحة بيانات البطاقة (إذا كانت محددة)
        if (selectedPaymentMethod === 'visa') {
            const cardInputs = [cardNumberInput, cardExpiryInput, cardCVCInput];
            
            validateExpiryDate(cardExpiryInput);

            for (const input of cardInputs) {
                if (!input.checkValidity()) {
                    input.reportValidity(); 
                    return; 
                }
            }
        }
        
        // ⭐️ 3. كل شيء سليم: تمرير الاسم والانتقال ⭐️
        // نقوم بأخذ الاسم من حقل الإدخال
        const customerName = fullNameInput.value.trim();
        const encodedName = encodeURIComponent(customerName);
        
        // 🔴 المسار الصحيح: بما أن thank-you.html في نفس المجلد (Purchases) 🔴
        window.location.href = `thank-you.html?name=${encodedName}`; 
    });
});