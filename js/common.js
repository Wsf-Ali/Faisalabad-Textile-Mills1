/* ============================================================
   LUNARA — Common Layout (Header / Footer / AI Chat Widget)
   Har page par yehi inject hota hai taa-ke nav/footer/chat
   ek hi jagah se control ho sakein.
   ============================================================ */

const HEADER_HTML = `
<header class="site-header">
  <div class="header-top">
    <p>Free delivery across Pakistan on all orders</p>
  </div>
  <div class="header-main container">
    <button class="menu-toggle" id="menuToggle" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>

    <a href="index.html" class="logo">
      <img src="images/logo.png" alt="Faisalabad Textile Mills" class="logo-img">
      <span class="logo-text">Faisalabad<small>Textile Mills</small></span>
    </a>

<nav class="main-nav" id="mainNav">
      <a href="index.html">Home</a>
      <a href="shop.html">Shop</a>
      <div class="nav-item has-dropdown" id="navCategoriesItem">
  <a href="index.html#shop">Categories</a>
  <button type="button" class="nav-caret" aria-label="Toggle Categories menu">&#9662;</button>
  <div class="nav-dropdown categories-dropdown" id="navCategoriesDropdown"></div>
</div>
      <a href="about.html">About Us</a>
      <a href="contact.html">Contact</a>
    </nav>

    <div class="header-actions">
      <a class="icon-btn" href="admin.html" aria-label="Admin">
        <svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>
      </a>
      <button class="icon-btn cart-btn" id="cartToggle" aria-label="Cart">
        <svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 8H6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="21" r="1.4" fill="currentColor"/><circle cx="18" cy="21" r="1.4" fill="currentColor"/></svg>
        <span class="cart-count" id="cartCount">0</span>
      </button>
    </div>
  </div>

</header>
`;

const FOOTER_HTML = `
<footer class="site-footer">
  <div class="container footer-grid">
    <div>
      <a href="index.html" class="footer-logo-link">
        <img src="images/logo.png" alt="Faisalabad Textile Mills" class="footer-logo-img">
        <h3 class="footer-logo">Faisalabad Textile Mills</h3>
      </a>
      <p>Pakistan's own online fashion store—from all seasonal collections to elegant formal wear, bringing you style for every season.</p>
    </div>
    <div>
      <h4>Quick Links</h4>
      <a href="index.html">Home</a>
      <a href="shop.html">Shop All</a>
      <a href="about.html">About Us</a>
      <a href="contact.html">Contact</a>
    </div>
    <div>
      <h4>Customer Care</h4>
      <a href="contact.html">Track Order</a>
      <a href="contact.html">Returns &amp; Exchange</a>
      <a href="contact.html">Size Guide</a>
    </div>
    <div>
      <h4>Get in Touch</h4>
      <p>📍 Sitara Mall, Cotton Mill, Faisalabad, Punjab, Pakistan</p>
      <p>📞 +92 328 7526397</p>
      <p>✉️ faisalabadtextilemills@gmail.com</p>
      <div class="social-row">
        <a href="#" aria-label="Facebook">FB</a>
        <a href="https://www.instagram.com/wsf_li" target="_blank" rel="noopener" aria-label="Instagram">IG</a>
        <a href="https://wa.me/923287526397" target="_blank" rel="noopener" aria-label="WhatsApp">WA</a>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <p>&copy; 2026 Faisalabad Textile Mills. All rights reserved.</p>
  </div>
</footer>
`;

const CART_DRAWER_HTML = `
<div class="cart-overlay" id="cartOverlay"></div>
<div class="cart-drawer" id="cartDrawer">
  <div class="cart-head">
    <h3>Your Bag</h3>
    <button id="cartClose">&times;</button>
  </div>
  <div class="cart-items" id="cartItems"></div>
  <div class="cart-foot" id="cartFoot">
    <div class="row"><span>Subtotal</span><span id="cartSubtotal">Rs 0</span></div>
    <button class="btn btn-primary btn-block" id="checkoutBtn">Proceed to Checkout</button>
  </div>
</div>
`;

const CHAT_HTML = `
<div class="ai-chat-widget">
  <button class="chat-fab" id="chatFab" aria-label="Chat with us">
    <svg viewBox="0 0 24 24" width="26" height="26"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>
  </button>
  <div class="chat-panel" id="chatPanel">
    <div class="chat-header">
      <span>FTM Assistant</span>
      <button id="chatClose" aria-label="Close">&times;</button>
    </div>
    <div class="chat-social-row">
      <a href="https://wa.me/923287526397" target="_blank" rel="noopener" class="chat-social-btn whatsapp" aria-label="Chat with us on WhatsApp">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.45 1.34 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2zm0 18.2c-1.53 0-3.02-.41-4.32-1.19l-.31-.18-3.11.82.83-3.03-.2-.31a8.18 8.18 0 0 1-1.26-4.35c0-4.53 3.68-8.21 8.22-8.21 2.2 0 4.26.86 5.81 2.41a8.15 8.15 0 0 1 2.41 5.81c0 4.53-3.69 8.23-8.07 8.23zm4.5-6.16c-.25-.12-1.45-.72-1.68-.8-.22-.08-.39-.12-.55.13-.16.24-.63.8-.78.96-.14.16-.29.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.65.31-.22.24-.85.83-.85 2.03s.87 2.36 1 2.52c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.45-.59 1.65-1.17.2-.57.2-1.06.14-1.17-.06-.1-.22-.16-.47-.28z"/></svg>
        <span>WhatsApp</span>
      </a>
      <a href="https://www.instagram.com/faisalabadtextilemill?igsh=MnpzNWpybWI1amR3" target="_blank" rel="noopener" class="chat-social-btn instagram" aria-label="Follow us on Instagram">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>
        <span>Instagram</span>
      </a>
    </div>
    <div class="chat-messages" id="chatMessages">
      <div class="msg bot">Assalam-o-Alaikum! 👋 Main Faisalabad Textile Mills ka assistant hoon. Order, sizing, ya delivery ke baare mein kuch pochna hai?</div>
    </div>
    <div class="chat-quick">
      <button data-q="delivery">Delivery time?</button>
      <button data-q="size">Size guide</button>
      <button data-q="order">Order track</button>
    </div>
    <form class="chat-input" id="chatForm">
      <input type="text" id="chatInput" placeholder="Apna sawal likhein..." autocomplete="off">
      <button type="submit">➤</button>
    </form>
  </div>
</div>
`;

function renderLayout() {
  const headerSlot = document.getElementById("site-header");
  const footerSlot = document.getElementById("site-footer");
  const chatSlot = document.getElementById("ai-chat-root");
  const cartSlot = document.getElementById("cart-drawer-root");
  if (headerSlot) headerSlot.innerHTML = HEADER_HTML;
  if (footerSlot) footerSlot.innerHTML = FOOTER_HTML;
  if (chatSlot) chatSlot.innerHTML = CHAT_HTML;
  if (cartSlot) cartSlot.innerHTML = CART_DRAWER_HTML;

  renderNavCategories();
  wireHeader();
  wireChat();
  wireCart();
  updateCartCount();
}

/* ---------- Dynamic nav dropdown (category -> subcategories) ---------- */
/* ---------- Dynamic nav dropdown (Categories -> subcategories flyout) ---------- */
function renderNavCategories() {
  const wrap = document.getElementById("navCategoriesDropdown");
  if (!wrap) return;
  const categories = DB.getCategories();

  wrap.innerHTML = categories.map(c => {
    const subs = c.subcategories || [];
    if (!subs.length) {
      return `<a href="index.html#shop" data-cat="${c.id}">${c.name}</a>`;
    }
    return `
      <div class="nav-subitem has-flyout">
        <a href="index.html#shop" data-cat="${c.id}">${c.name}</a>
        <button type="button" class="nav-caret nav-caret-sub" aria-label="Toggle ${c.name} submenu">&#9656;</button>
        <div class="nav-flyout">
          ${subs.map(s => `<a href="index.html#shop" data-cat="${c.id}" data-sub="${s.id}">${s.name}</a>`).join("")}
          <a href="index.html#shop" data-cat="${c.id}" class="nav-view-all">View All ${c.name}</a>
        </div>
      </div>
    `;
  }).join("");
}

function wireHeader() {
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");
  menuToggle?.addEventListener("click", () => mainNav.classList.toggle("open"));

  document.querySelectorAll('[data-cat]').forEach(link => {
    link.addEventListener("click", (e) => {
      if (window.applyCategoryFilter) {
        e.preventDefault();
        window.applyCategoryFilter(link.dataset.cat, link.dataset.sub || null);
        document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
        mainNav?.classList.remove("open");
        document.querySelectorAll(".nav-item.open, .nav-subitem.open").forEach(item => item.classList.remove("open"));
      }
    });
  });

  document.querySelectorAll(".nav-caret").forEach(caret => {
  caret.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const item = caret.closest(".nav-item, .nav-subitem");
    const wasOpen = item.classList.contains("open");
    const siblingSelector = item.classList.contains("nav-item") ? ".nav-item.open" : ".nav-subitem.open";
    item.parentElement.querySelectorAll(siblingSelector).forEach(el => el.classList.remove("open"));
    if (!wasOpen) item.classList.add("open");
  });
});

document.querySelectorAll(".nav-item.has-dropdown, .nav-subitem.has-flyout").forEach(item => {
    let closeTimer = null;
    item.addEventListener("mouseenter", () => {
      clearTimeout(closeTimer);
      item.classList.add("show");
    });
    item.addEventListener("mouseleave", () => {
      closeTimer = setTimeout(() => item.classList.remove("show"), 300);
    });
  });

  document.getElementById("cartToggle")?.addEventListener("click", () => {
    openCartDrawer();
  });
}

function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (!el) return;
  const newCount = String(cartCount());
  if (el.textContent !== newCount) {
    el.textContent = newCount;
    el.classList.remove("bump");
    void el.offsetWidth; // restart animation
    el.classList.add("bump");
  }
}

/* ---------- Tiny rule-based AI chat (demo) ----------
   Note: ye ek simple FAQ-style assistant hai jo bina backend
   ke chalta hai. Real AI (jese Claude API) connect karne ke
   liye aapko ek backend endpoint banana hoga jahan API key
   safe rahe (frontend mein key kabhi mat rakhein). */
function wireChat() {
  const fab = document.getElementById("chatFab");
  const panel = document.getElementById("chatPanel");
  const closeBtn = document.getElementById("chatClose");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const messages = document.getElementById("chatMessages");

  fab?.addEventListener("click", () => panel.classList.toggle("open"));
  closeBtn?.addEventListener("click", () => panel.classList.remove("open"));

  document.querySelectorAll(".chat-quick button").forEach(btn => {
    btn.addEventListener("click", () => respondTo(btn.dataset.q));
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addMsg(text, "user");
    input.value = "";
    setTimeout(() => respondTo(text), 400);
  });

  function addMsg(text, who, isHTML) {
    const div = document.createElement("div");
    div.className = `msg ${who}`;
    if (isHTML) div.innerHTML = text;
    else div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  const WHATSAPP_LINK = `<a href="https://wa.me/923287526397" target="_blank" rel="noopener" class="chat-wa-link">📞 0328-7526397</a>`;

  function respondTo(text) {
    if (text === "delivery" || /delivery|shipping/i.test(text)) {
      addMsg("Delivery time?", "user");
      addMsg("Delivery takes 3–5 working days across Pakistan. Delivery is completely free on all orders!", "bot");
      return;
    }
    if (text === "size" || /size/i.test(text)) {
      addMsg("Size guide", "user");
      addMsg(`A size chart is available on every product page. Standard sizes are: S (34), M (36), L (38), and XL (40). If you're unsure about the right size, feel free to contact our team on WhatsApp: ${WHATSAPP_LINK}`, "bot", true);
      return;
    }
    if (text === "order" || /track|order status/i.test(text)) {
      addMsg("Order track", "user");
      addMsg(`To track your order, share your Order ID through our Contact page or message our team directly on WhatsApp: ${WHATSAPP_LINK}`, "bot", true);
      return;
    }
    if (/price|rate|cost/i.test(text)) {
      addMsg("The price of every product is displayed on both the product card and the product details page. Items on sale are clearly marked with a discount badge.", "bot");
      return;
    }
    if (/payment|cod|cash/i.test(text)) {
      addMsg("We accept both Cash on Delivery and online card payments. Simply choose your preferred payment method during checkout.", "bot");
      return;
    }
    addMsg(`Thank you! Our team will get in touch with you shortly. You can also contact our team directly on WhatsApp: ${WHATSAPP_LINK}`, "bot", true);
  }
}

/* ---------- Cart (global — available on every page) ---------- */
function addToCart(productId, qty, color) {
  const cart = DB.getCart();
  const existing = cart.find(i => i.productId === productId && i.color === color);
  if (existing) existing.qty += qty;
  else cart.push({ productId, qty, color });
  DB.saveCart(cart);
  updateCartCount();
}

function removeFromCart(productId, color) {
  let cart = DB.getCart();
  cart = cart.filter(i => !(i.productId === productId && i.color === color));
  DB.saveCart(cart);
  updateCartCount();
  renderCartItems();
}

function renderCartItems() {
  const cart = DB.getCart();
  const products = DB.getProducts();
  const wrap = document.getElementById("cartItems");
  const foot = document.getElementById("cartFoot");
  if (!wrap || !foot) return;

  if (cart.length === 0) {
    wrap.innerHTML = `<div class="cart-empty">Your bag is empty. Add something beautiful to get started! 🛍️</div>`;
    foot.style.display = "none";
    return;
  }
  foot.style.display = "block";

  let subtotal = 0;
  wrap.innerHTML = cart.map(item => {
    const p = products.find(p => p.id === item.productId);
    if (!p) return "";
    subtotal += p.price * item.qty;
    return `
      <div class="cart-item">
        <img src="${p.images[0]}" alt="${p.title}">
        <div class="cart-item-info">
          <h4>${p.title}</h4>
          <div class="meta">${item.color ? item.color + " · " : ""}Qty: ${item.qty}</div>
          <div class="row">
            <span>${formatPrice(p.price * item.qty)}</span>
            <button type="button" class="remove" data-id="${p.id}" data-color="${item.color || ''}">Remove</button>
          </div>
        </div>
      </div>`;
  }).join("");

  document.getElementById("cartSubtotal").textContent = formatPrice(subtotal);

  wrap.querySelectorAll(".remove").forEach(btn => {
    btn.addEventListener("click", () => removeFromCart(btn.dataset.id, btn.dataset.color));
  });
}

function openCartDrawer() {
  renderCartItems();
  document.getElementById("cartOverlay").classList.add("open");
  document.getElementById("cartDrawer").classList.add("open");
}

function closeCartDrawer() {
  document.getElementById("cartOverlay").classList.remove("open");
  document.getElementById("cartDrawer").classList.remove("open");
}

function wireCart() {
  document.getElementById("cartClose")?.addEventListener("click", closeCartDrawer);
  document.getElementById("cartOverlay")?.addEventListener("click", closeCartDrawer);
  document.getElementById("checkoutBtn")?.addEventListener("click", () => {
    if (DB.getCart().length === 0) return;
    closeCartDrawer();
    openCheckout();
  });
}

function openCheckout() {
  if (DB.getCart().length === 0) return;
  window.location.href = "checkout.html";
}

document.addEventListener("DOMContentLoaded", renderLayout);

