/* ============================================================
   Shop All Page — shop.html
   Note: data.js aur common.js pehle load hote hain.
   ============================================================ */

let activeCategory = "all";
let activeSubcategory = null;
let currentProduct = null;
let selectedColor = null;
let selectedQty = 1;
let activeImgIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  activeCategory = params.get("cat") || "all";
  activeSubcategory = params.get("sub") || null;

  renderCategoryPills();
  renderAllProductsGrid();
  wireModal();
});

/* ---------------- Category Pills ---------------- */
function renderCategoryPills() {
  const categories = DB.getCategories();
  const shopPills = document.getElementById("shopFilterPills");

  let html = `<button class="cat-pill ${activeCategory === 'all' ? 'active' : ''}" data-cat="all">All</button>`;
  categories.forEach(c => {
    html += `<button class="cat-pill ${activeCategory === c.id ? 'active' : ''}" data-cat="${c.id}">${c.name}</button>`;
  });

  shopPills.innerHTML = html;
  shopPills.querySelectorAll(".cat-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      activeSubcategory = null;
      renderCategoryPills();
      renderAllProductsGrid();
    });
  });

  renderSubcategoryPills();
}

function renderSubcategoryPills() {
  const wrap = document.getElementById("shopSubFilterPills");
  if (!wrap) return;

  const subs = activeCategory !== "all" ? DB.getSubcategories(activeCategory) : [];
  if (!subs.length) {
    wrap.innerHTML = "";
    wrap.style.display = "none";
    return;
  }

  wrap.style.display = "flex";
  wrap.innerHTML =
    `<button class="cat-pill sub ${!activeSubcategory ? 'active' : ''}" data-sub="">All ${DB.categoryName(activeCategory)}</button>` +
    subs.map(s => `<button class="cat-pill sub ${activeSubcategory === s.id ? 'active' : ''}" data-sub="${s.id}">${s.name}</button>`).join("");

  wrap.querySelectorAll(".cat-pill.sub").forEach(btn => {
    btn.addEventListener("click", () => {
      activeSubcategory = btn.dataset.sub || null;
      renderCategoryPills();
      renderAllProductsGrid();
    });
  });
}

/* ---------------- Grid (no limit) ---------------- */
function renderAllProductsGrid() {
  let products = DB.getProducts();
  if (activeCategory !== "all") products = products.filter(p => DB.productInCategory(p, activeCategory));
  if (activeSubcategory) products = products.filter(p => DB.productInSubcategory(p, activeSubcategory));
  renderGrid("allProductsGrid", products);
}

function renderGrid(elementId, products) {
  const grid = document.getElementById(elementId);
  if (!grid) return;
  if (products.length === 0) {
    grid.innerHTML = `<div class="empty-state">There are no products in this category at the moment. New arrivals are coming soon!</div>`;
    return;
  }
  grid.innerHTML = products.map((p, i) => `
    <div class="product-card" data-id="${p.id}" data-price="${p.price}" data-name="${(p.title || '').replace(/"/g, '&quot;').toLowerCase()}" data-created="${p.createdAt || 0}" data-order="${i}">
      <div class="product-media">
        ${p.badge && p.badge !== "none" ? `<span class="ribbon ${p.badge}">${p.badge === 'top' ? 'Top Sale' : 'New Arrival'}</span>` : ""}
        <img src="${p.images[0]}" alt="${p.title}">
        <div class="quick-add"><button type="button" class="quick-add-btn" data-id="${p.id}">Quick View</button></div>
      </div>
      <div class="product-info">
        <span class="cat-tag">${DB.categoryName(p.category)}${p.subcategory ? ' · ' + DB.subcategoryName(p.category, p.subcategory) : ''}</span>
        <h3>${p.title}</h3>
        <div class="price-row">
          <span class="price">${formatPrice(p.price)}</span>
          ${p.oldPrice ? `<span class="old-price">${formatPrice(p.oldPrice)}</span>` : ""}
        </div>
      </div>
    </div>
  `).join("");

  grid.querySelectorAll(".quick-add-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openProductModal(btn.dataset.id);
    });
  });
  grid.querySelectorAll(".product-card").forEach(card => {
    card.addEventListener("click", () => {
      window.location.href = `product.html?id=${card.dataset.id}`;
    });
  });

  if (window.FTMResponsive) window.FTMResponsive.onGridRendered(grid);
}

/* ---------------- Product Modal ---------------- */
function openProductModal(id) {
  const product = DB.getProducts().find(p => p.id === id);
  if (!product) return;
  currentProduct = product;
  selectedColor = product.colors[0] || null;
  selectedQty = 1;
  activeImgIndex = 0;

  document.getElementById("modalCat").textContent = product.subcategory
    ? `${DB.categoryName(product.category)} · ${DB.subcategoryName(product.category, product.subcategory)}`
    : DB.categoryName(product.category);
  document.getElementById("modalTitle").textContent = product.title;
  document.getElementById("modalPrice").textContent = formatPrice(product.price);
  document.getElementById("modalOldPrice").textContent = product.oldPrice ? formatPrice(product.oldPrice) : "";
  document.getElementById("modalDesc").textContent = product.description;
  document.getElementById("modalStock").textContent = product.stock > 0 ? `In stock (${product.stock} available)` : "Currently out of stock";
  document.getElementById("qtyVal").textContent = "1";

  renderModalImages();
  renderModalColors();

  document.getElementById("productModal").classList.add("open");
}

function renderModalImages() {
  const track = document.getElementById("galleryTrack");
  const thumbs = document.getElementById("modalThumbs");
  const dots = document.getElementById("galleryDots");
  const images = currentProduct.images;
  const multi = images.length > 1;

  if (track.dataset.productId !== currentProduct.id) {
    track.dataset.productId = currentProduct.id;
    track.innerHTML = images.map((img, i) =>
      `<div class="gallery-slide"><img src="${img}" alt="${currentProduct.title} view ${i + 1}"></div>`
    ).join("");
  }
  track.style.transform = `translateX(-${activeImgIndex * 100}%)`;

  document.getElementById("galleryPrev").style.display = multi ? "flex" : "none";
  document.getElementById("galleryNext").style.display = multi ? "flex" : "none";

  dots.style.display = multi ? "flex" : "none";
  dots.innerHTML = multi ? images.map((_, i) =>
    `<button type="button" class="${i === activeImgIndex ? 'active' : ''}" data-i="${i}" aria-label="Go to image ${i + 1}"></button>`
  ).join("") : "";
  dots.querySelectorAll("button").forEach(d => {
    d.addEventListener("click", () => { activeImgIndex = Number(d.dataset.i); renderModalImages(); });
  });

  thumbs.innerHTML = images.map((img, i) =>
    `<img src="${img}" class="${i === activeImgIndex ? 'active' : ''}" data-i="${i}" alt="View ${i + 1}">`
  ).join("");
  thumbs.querySelectorAll("img").forEach(t => {
    t.addEventListener("click", () => { activeImgIndex = Number(t.dataset.i); renderModalImages(); });
  });
}

function galleryStep(dir) {
  if (!currentProduct) return;
  const total = currentProduct.images.length;
  activeImgIndex = (activeImgIndex + dir + total) % total;
  renderModalImages();
}

function wireGallerySwipe() {
  const main = document.querySelector(".modal-gallery-main");
  let startX = null;
  main.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  main.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 40) galleryStep(diff < 0 ? 1 : -1);
    startX = null;
  }, { passive: true });
}

function renderModalColors() {
  const wrap = document.getElementById("modalColors");
  if (!currentProduct.colors.length) {
    document.getElementById("modalColorGroup").style.display = "none";
    return;
  }
  document.getElementById("modalColorGroup").style.display = "block";
  wrap.innerHTML = currentProduct.colors.map(c =>
    `<button type="button" class="color-chip ${c === selectedColor ? 'active' : ''}" data-c="${c}">${c}</button>`
  ).join("");
  wrap.querySelectorAll(".color-chip").forEach(chip => {
    chip.addEventListener("click", () => { selectedColor = chip.dataset.c; renderModalColors(); });
  });
}

function wireModal() {
  if (!document.getElementById("productModal")) return;
  document.getElementById("modalClose").addEventListener("click", () => {
    document.getElementById("productModal").classList.remove("open");
  });
  document.getElementById("productModal").addEventListener("click", (e) => {
    if (e.target.id === "productModal") e.currentTarget.classList.remove("open");
  });
  document.getElementById("galleryPrev").addEventListener("click", () => galleryStep(-1));
  document.getElementById("galleryNext").addEventListener("click", () => galleryStep(1));
  wireGallerySwipe();
  document.getElementById("qtyMinus").addEventListener("click", () => {
    if (selectedQty > 1) { selectedQty--; document.getElementById("qtyVal").textContent = selectedQty; }
  });
  document.getElementById("qtyPlus").addEventListener("click", () => {
    if (selectedQty < (currentProduct?.stock || 99)) { selectedQty++; document.getElementById("qtyVal").textContent = selectedQty; }
  });
  document.getElementById("addToCartBtn").addEventListener("click", () => {
    addToCart(currentProduct.id, selectedQty, selectedColor);
    document.getElementById("productModal").classList.remove("open");
    openCartDrawer();
  });
  document.getElementById("buyNowBtn").addEventListener("click", () => {
    addToCart(currentProduct.id, selectedQty, selectedColor);
    document.getElementById("productModal").classList.remove("open");
    openCheckout();
  });
}