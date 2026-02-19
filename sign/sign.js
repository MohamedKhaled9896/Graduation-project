    // Utility functions
    function generateSalt() {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    }
    async function hashPassword(password, salt) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password + salt);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    function generateToken() {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    }
    function validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    }
    function validatePassword(password) {
      if (password.length < 8) return { valid: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' };
      if (!(/[A-Z]/.test(password) && /[a-z]/.test(password))) return { valid: false, message: 'كلمة المرور يجب أن تحتوي على حروف كبيرة وصغيرة' };
      if (!/[0-9]/.test(password)) return { valid: false, message: 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل' };
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { valid: false, message: 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%...)' };
      return { valid: true };
    }
    function validateName(name) {
      const n = name.trim();
      if (n.length < 2) return { valid: false, message: 'الاسم يجب أن يكون حرفين على الأقل' };
      if (n.length > 50) return { valid: false, message: 'الاسم طويل جداً' };
      return { valid: true };
    }
    function getUsers() {
      try {
        const usersStr = localStorage.getItem('motorstore_users');
        if (!usersStr) return [];
        return JSON.parse(usersStr);
      } catch { return []; }
    }
    function saveUsers(users) {
      localStorage.setItem('motorstore_users', JSON.stringify(users));
    }
    function saveSession(user, token) {
      const session = {
        user: { name: user.name, email: user.email },
        token,
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
      };
      localStorage.setItem('motorstore_session', JSON.stringify(session));
    }
    function getSession() {
      try {
        const session = JSON.parse(localStorage.getItem('motorstore_session'));
        if (!session) return null;
        if (Date.now() > session.expiresAt) {
          localStorage.removeItem('motorstore_session');
          return null;
        }
        return session;
      } catch {
        return null;
      }
    }
    function clearSession() {
      localStorage.removeItem('motorstore_session');
    }
    // Password show/hide using checkbox (replaces eye-icon button)
    document.querySelectorAll('.password-show-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        const group = cb.closest('.password-group');
        if (!group) return;
        const input = group.querySelector('input[type="password"], input[type="text"]');
        if (!input) return;
        input.type = cb.checked ? 'text' : 'password';

        // Update the label text next to the checkbox to indicate action
        const showLabel = cb.closest('.password-show')?.querySelector('.show-label');
        if (showLabel) {
          showLabel.textContent = cb.checked ? 'إخفاء' : 'إظهار';
        }

        // Update accessible name
        cb.setAttribute('aria-label', cb.checked ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور');
      });
    });
    // Switch Tabs
    function switchTab(tab) {
      const signUpTab = document.getElementById('signUpTab');
      const signInTab = document.getElementById('signInTab');
      const signUpForm = document.getElementById('signUpForm');
      const signInForm = document.getElementById('signInForm');
      const signUpMessage = document.getElementById('signUpMessage');
      const signInMessage = document.getElementById('signInMessage');
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
    // Form Submit Handlers
    document.getElementById('signUpForm').addEventListener('submit', async e => {
      e.preventDefault();
      const messageEl = document.getElementById('signUpMessage');
      const name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim().toLowerCase();
      const password = document.getElementById('signupPassword').value;
      let v = validateName(name);
      if (!v.valid) { showMessage(messageEl, v.message, false); return; }
      if (!validateEmail(email)) { showMessage(messageEl, 'البريد الإلكتروني غير صحيح', false); return; }
      v = validatePassword(password);
      if (!v.valid) { showMessage(messageEl, v.message, false); return; }
      const users = getUsers();
      if (users.find(u => u.email === email)) {
        showMessage(messageEl, 'هذا البريد الإلكتروني مستخدم بالفعل', false);
        return;
      }
      try {
        const salt = generateSalt();
        const hashedPassword = await hashPassword(password, salt);
        const userData = {
          id: generateToken(),
          name,
          email,
          passwordHash: hashedPassword,
          salt,
          createdAt: new Date().toISOString(),
          lastLogin: null
        };
        users.push(userData);
        saveUsers(users);
        saveSession({ name, email }, generateToken());
        try { renderHeaderUser(); } catch (e) { /* ignore */ }
        showMessage(messageEl, 'تم إنشاء الحساب بنجاح! جاري التوجيه...', true);
        setTimeout(() => {
window.location.href = '../index.html';
        }, 1500);
      } catch {
        showMessage(messageEl, 'حدث خطأ أثناء إنشاء الحساب', false);
      }
    });
    document.getElementById('signInForm').addEventListener('submit', async e => {
      e.preventDefault();
      const messageEl = document.getElementById('signInMessage');
      const email = document.getElementById('signinEmail').value.trim().toLowerCase();
      const password = document.getElementById('signinPassword').value;
      if (!validateEmail(email)) {
        showMessage(messageEl, 'البريد الإلكتروني غير صحيح', false);
        return;
      }
      if (!password) {
        showMessage(messageEl, 'يرجى إدخال كلمة المرور', false);
        return;
      }
      try {
        const users = getUsers();
        const user = users.find(u => u.email === email);
        if (!user) {
          showMessage(messageEl, 'البريد الإلكتروني أو كلمة المرور غير صحيحة', false);
          return;
        }
        const hashedPassword = await hashPassword(password, user.salt);
        if (hashedPassword !== user.passwordHash) {
          showMessage(messageEl, 'البريد الإلكتروني أو كلمة المرور غير صحيحة', false);
          return;
        }
        user.lastLogin = new Date().toISOString();
        const idx = users.findIndex(u => u.id === user.id);
        users[idx] = user;
        saveUsers(users);
        saveSession({ name: user.name, email: user.email }, generateToken());
        try { renderHeaderUser(); } catch (e) { /* ignore */ }
        showMessage(messageEl, 'تم تسجيل الدخول بنجاح! جاري التوجيه...', true);
        setTimeout(() => {
window.location.href = '../index.html';
        }, 1500);
      } catch {
        showMessage(messageEl, 'حدث خطأ أثناء تسجيل الدخول', false);
      }
    });
    function showMessage(el, text, success) {
      el.textContent = text;
      el.className = 'form-message ' + (success ? 'success' : 'error');
      el.style.display = 'block';
    }
    // On load: check URL parameter for mode to set active tab
    window.addEventListener('DOMContentLoaded', () => {
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      if (mode === 'login') {
        switchTab('signIn');
      } else {
        switchTab('signUp');
      }
      // header renderer provided by shared `script.js`
      try { if (typeof renderHeaderUser === 'function') renderHeaderUser(); } catch (e) { /* ignore */ }
    });

    /* header user rendering moved to shared `script.js` to keep behavior consistent across pages */

    // Ensure a default admin account exists for any visitor
    (async function ensureAdminAccount() {
      const ADMIN_EMAIL = 'admin@mail.com';
      const ADMIN_PWD = 'Admin123@456';
      try {
        const users = getUsers();
        let admin = users.find(u => u.email === ADMIN_EMAIL);
        if (!admin) {
          const salt = generateSalt();
          const hashed = await hashPassword(ADMIN_PWD, salt);
          admin = {
            id: generateToken(),
            name: 'Admin',
            email: ADMIN_EMAIL,
            passwordHash: hashed,
            salt,
            createdAt: new Date().toISOString(),
            lastLogin: null
          };
          users.push(admin);
          saveUsers(users);
        }

        // Do NOT create a session automatically here - keep the admin account available
        // so visitors must explicitly sign in with credentials to open the account.
      } catch (err) {
        console.error('Error ensuring admin account:', err);
      }
    })();
