const cartIcon = document.getElementById("cartIcon");
const cartMenu = document.getElementById("cartMenu");
const cartItems = document.getElementById("cartItems");
const cartEmpty = document.getElementById("cartEmpty");
const clearCartBtn = document.getElementById("clearCart");
const productList = document.getElementById("productList");

// المنتجات العشوائية
const products = [
  { id: 1, name: "ساعة رقمية", price: 120, icon: "fa-clock" },
  { id: 2, name: "سماعة بلوتوث", price: 250, icon: "fa-headphones" },
  { id: 3, name: "كيبورد ميكانيكي", price: 400, icon: "fa-keyboard" },
  { id: 4, name: "ماوس لاسلكي", price: 150, icon: "fa-computer-mouse" },
  { id: 5, name: "شاحن سريع", price: 90, icon: "fa-bolt" },
];

// عرض المنتجات
function renderProducts() {
  productList.innerHTML = products.map(
    (p) => `
    <div class="product">
      <i class="fa-solid ${p.icon}" style="font-size:40px;margin-bottom:10px;color:#555"></i>
      <h4>${p.name}</h4>
      <p>${p.price} ريال</p>
      <button onclick="addToCart(${p.id})">أضف للسلة</button>
    </div>`
  ).join("");
}

// التعامل مع السلة
function getCart() {
  return JSON.parse(localStorage.getItem("cart_v1") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("cart_v1", JSON.stringify(cart));
}

function addToCart(id) {
  const cart = getCart();
  const product = products.find(p => p.id === id);
  cart.push(product);
  saveCart(cart);
  updateCartUI();
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  updateCartUI();
}

function clearCart() {
  saveCart([]);
  updateCartUI();
}

function updateCartUI() {
  const cart = getCart();
  if (cart.length === 0) {
    cartItems.innerHTML = "";
    cartEmpty.style.display = "block";
  } else {
    cartEmpty.style.display = "none";
    cartItems.innerHTML = cart.map((item, i) => `
      <li>
        ${item.name} - ${item.price} ريال
        <button onclick="removeFromCart(${i})">حذف</button>
      </li>`).join("");
  }
}

// التحكم في إظهار القائمة
cartIcon.addEventListener("click", () => {
  cartMenu.classList.toggle("active");
});

clearCartBtn.addEventListener("click", clearCart);

// تشغيل الصفحة
renderProducts();
updateCartUI();
