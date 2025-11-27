// sign.js - تم التعديل للربط مع PHP/MySQL عبر Fetch API (AJAX)

// 1. وظائف المساعدة العامة (Utility Functions)
function showMessage(el, text, success) {
  el.textContent = text;
  el.className = 'form-message ' + (success ? 'success' : 'error');
  el.style.display = 'block';
}

function switchTab(tab) {
  const signUpTab = document.getElementById('signUpTab');
  const signInTab = document.getElementById('signInTab');
  const signUpForm = document.getElementById('signUpForm');
  const signInForm = document.getElementById('signInForm');
  const signUpMessage = document.getElementById('signUpMessage');
  const signInMessage = document.getElementById('signInMessage');
  
  // إخفاء رسائل الحالة القديمة عند التبديل
  signUpMessage.style.display = 'none';
  signInMessage.style.display = 'none';
  
  if (tab === 'signUp') {
    signUpTab.classList.add('active');
    signInTab.classList.remove('active');
    signUpForm.style.display = 'flex';
    signInForm.style.display = 'none';
  } else {
    signUpTab.classList.remove('active');
    signInTab.classList.add('active');
    signUpForm.style.display = 'none';
    signInForm.style.display = 'flex';
  }
}

// 2. منطق التسجيل (Sign Up) - يرسل البيانات إلى database/register.php
document.getElementById('signUpForm').addEventListener('submit', async e => {
  e.preventDefault();
  const messageEl = document.getElementById('signUpMessage');
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim().toLowerCase();
  const password = document.getElementById('signupPassword').value;

  // التحقق من الواجهة الأمامية
  if (name.trim().length < 2) { showMessage(messageEl, 'الاسم يجب أن يكون حرفين على الأقل', false); return; }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) { showMessage(messageEl, 'البريد الإلكتروني غير صحيح', false); return; }
  if (password.length < 8) { showMessage(messageEl, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل', false); return; }
  
  messageEl.style.display = 'none'; // إخفاء الرسائل القديمة
  
  // تجهيز البيانات للإرسال (FormData يتوافق مع طريقة $_POST في PHP)
  const formData = new FormData();
  formData.append('name', name);
  formData.append('email', email);
  formData.append('password', password);

  try {
    // المسار هو: sign.js موجود في مجلد (مثلاً) /sign، والـ PHP موجود في /database
    // لذلك نستخدم: ../database/register.php
const response = await fetch('/Graduation-Project/database/register.php', {      method: 'POST',
      body: formData, // إرسال البيانات كـ form data
    });

    const result = await response.json(); // قراءة الرد كـ JSON

    if (result.success) {
      showMessage(messageEl, result.message + ' جاري التوجيه لتسجيل الدخول...', true);
      // بعد النجاح ننتقل إلى علامة تبويب تسجيل الدخول
      setTimeout(() => {
        window.location.href = 'sign.html?mode=login';
      }, 2000);
    } else {
      showMessage(messageEl, result.message, false);
    }

  } catch (error) {
    console.error('Registration Fetch Error:', error);
    showMessage(messageEl, 'حدث خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً. (تأكد من تشغيل XAMPP/WAMP)', false);
  }
});

// 3. منطق تسجيل الدخول (Sign In) - يرسل البيانات إلى database/login.php
document.getElementById('signInForm').addEventListener('submit', async e => {
  e.preventDefault();
  const messageEl = document.getElementById('signInMessage');
  const email = document.getElementById('signinEmail').value.trim().toLowerCase();
  const password = document.getElementById('signinPassword').value;

  // التحقق من الواجهة الأمامية
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) { showMessage(messageEl, 'البريد الإلكتروني غير صحيح', false); return; }
  if (!password) { showMessage(messageEl, 'يرجى إدخال كلمة المرور', false); return; }

  messageEl.style.display = 'none'; // إخفاء الرسائل القديمة
  
  // تجهيز البيانات للإرسال
  const formData = new FormData();
  formData.append('email', email);
  formData.append('password', password);

  try {
const response = await fetch('/Graduation-Project/database/login.php', {      method: 'POST',
      body: formData, // إرسال البيانات كـ form data
    });

    const result = await response.json(); // قراءة الرد كـ JSON

    if (result.success) {
      showMessage(messageEl, result.message + ' جاري التوجيه للصفحة الرئيسية...', true);
      // عند تسجيل الدخول بنجاح، يتم التوجيه إلى الصفحة الرئيسية
      setTimeout(() => {
        window.location.href = '../index.html'; // يفترض أن index.html هو الصفحة الرئيسية
      }, 2000);
    } else {
      showMessage(messageEl, result.message, false);
    }
  } catch (error) {
    console.error('Login Fetch Error:', error);
    showMessage(messageEl, 'حدث خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً. (تأكد من تشغيل XAMPP/WAMP)', false);
  }
});

// 4. إظهار/إخفاء كلمة المرور (كود موجود مسبقاً)
document.querySelectorAll('.password-show-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
        const group = cb.closest('.password-group');
        if (!group) return;
        const input = group.querySelector('input[type="password"], input[type="text"]');
        if (!input) return;
        input.type = cb.checked ? 'text' : 'password';

        const showLabel = cb.closest('.password-show')?.querySelector('.show-label');
        if (showLabel) {
            showLabel.textContent = cb.checked ? 'إخفاء' : 'إظهار';
        }
        cb.setAttribute('aria-label', cb.checked ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور');
    });
});

// 5. عند تحميل الصفحة: تحقق من وضع التشغيل (login/signUp)
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  // تحديد علامة التبويب النشطة بناءً على الرابط
  if (mode === 'login') {
    switchTab('signIn');
  } else {
    switchTab('signUp');
  }
});