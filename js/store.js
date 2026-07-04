/* ============================================================
   LUNARA — Storefront Logic (index.html)
   ============================================================ */

let activeCategory = "all";
let activeSubcategory = null;
let currentProduct = null;
let selectedColor = null;
let selectedQty = 1;
let activeImgIndex = 0;
let selectedReviewRating = 5;

document.addEventListener("DOMContentLoaded", () => {
  renderCategoryPills();
  renderHomeSections();
  wireModal();
  renderReviews();
  wireReviewForm();
  initFlashSaleBanner();
});

/* ---------------- Category Pills ---------------- */
function renderCategoryPills() {
  const categories = DB.getCategories();
  const topPills = document.getElementById("categoryPills");
  const shopPills = document.getElementById("shopFilterPills");

  const pillsHTML = (forShop) => {
    let html = `<button class="cat-pill ${activeCategory === 'all' && forShop ? 'active' : ''}" data-cat="all">All</button>`;
    categories.forEach(c => {
      html += `<button class="cat-pill ${activeCategory === c.id && forShop ? 'active' : ''}" data-cat="${c.id}">${c.name}</button>`;
    });
    return html;
  };

  if (topPills) {
    topPills.innerHTML = pillsHTML(false);
    topPills.querySelectorAll(".cat-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        applyCategoryFilter(btn.dataset.cat);
        document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
      });
    });
  }
  if (shopPills) {
    shopPills.innerHTML = pillsHTML(true);
    shopPills.querySelectorAll(".cat-pill").forEach(btn => {
      btn.addEventListener("click", () => applyCategoryFilter(btn.dataset.cat));
    });
  }

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

window.applyCategoryFilter = function (catId, subId) {
  activeCategory = catId;
  activeSubcategory = subId || null;
  renderCategoryPills();
  renderAllProductsGrid();
};

/* ---------------- Home Sections ---------------- */
function renderHomeSections() {
  const products = DB.getProducts();
  renderGrid("topSaleGrid", products.filter(p => p.badge === "top").slice(0, 4));
  renderGrid("newArrivalGrid", products.filter(p => p.badge === "new").slice(0, 4));
  renderAllProductsGrid();
}

function renderAllProductsGrid() {
  let products = DB.getProducts();
  if (activeCategory !== "all") products = products.filter(p => DB.productInCategory(p, activeCategory));
  if (activeSubcategory) products = products.filter(p => DB.productInSubcategory(p, activeSubcategory));

  const HOME_LIMIT = 16;
  renderGrid("allProductsGrid", products.slice(0, HOME_LIMIT));

  const seeMoreWrap = document.getElementById("allProductsSeeMore");
  if (seeMoreWrap) {
    if (products.length > HOME_LIMIT) {
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.set("cat", activeCategory);
      if (activeSubcategory) params.set("sub", activeSubcategory);
      const url = "shop.html" + (params.toString() ? "?" + params.toString() : "");
      seeMoreWrap.innerHTML = `<a href="${url}" class="btn btn-outline">See More →</a>`;
      seeMoreWrap.style.display = "block";
    } else {
      seeMoreWrap.style.display = "none";
    }
  }
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

function colorToHex(name) {
  const map = {
    "maroon": "#7d2b3a", "bottle green": "#2f4d3a", "black": "#222",
    "beige": "#e3d3b8", "charcoal": "#3a3a3a", "sky blue": "#a9d3e8",
    "peach": "#f6c9ab", "mint": "#bfe3cf", "white": "#f5f5f5",
    "powder pink": "#f3cdd6", "wine": "#5e2233", "royal blue": "#2746a8",
    "gold": "#c9a24b", "silver": "#c4c4c4"
  };
  return map[name.toLowerCase()] || "#d8c4c4";
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

  // Build the slide track once per product open; only reposition on index change
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

/* ---------------- Reviews ---------------- */
function starsHTML(rating) {
  let html = "";
  for (let i = 1; i <= 5; i++) html += `<span class="star ${i <= rating ? 'filled' : ''}">★</span>`;
  return html;
}

function reviewDateLabel(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

function renderReviews() {
  const grid = document.getElementById("reviewGrid");
  const seeMoreWrap = document.getElementById("reviewSeeMoreWrap");
  if (!grid) return;
  const reviews = [...DB.getReviews()].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (reviews.length === 0) {
    grid.innerHTML = `<div class="empty-state">Abhi tak koi review nahi mila. Sab se pehle review dene wale bnein!</div>`;
    if (seeMoreWrap) seeMoreWrap.style.display = "none";
    return;
  }

  const visible = reviews.slice(0, 4);
  grid.innerHTML = visible.map(r => `
    <div class="review-card">
      <div class="review-stars">${starsHTML(r.rating)}</div>
      <p class="review-text">${r.text}</p>
      <div class="review-author">
        <span class="review-avatar">${initials(r.name)}</span>
        <div>
          <strong>${r.name}</strong>
          <span class="review-date">${reviewDateLabel(r.date)}</span>
        </div>
      </div>
    </div>
  `).join("");

  if (seeMoreWrap) seeMoreWrap.style.display = reviews.length > 4 ? "block" : "none";
}

function wireReviewForm() {
  const form = document.getElementById("reviewForm");
  if (!form) return;
  const starInput = document.getElementById("starInput");

  function paintStars() {
    starInput.querySelectorAll("button").forEach(btn => {
      btn.classList.toggle("active", Number(btn.dataset.star) <= selectedReviewRating);
    });
  }
  paintStars();

  starInput.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedReviewRating = Number(btn.dataset.star);
      paintStars();
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("reviewName").value.trim();
    const text = document.getElementById("reviewText").value.trim();
    if (!name || !text) return;

    const reviews = DB.getReviews();
    reviews.unshift({
      id: DB.newId("rev"),
      name,
      rating: selectedReviewRating,
      text,
      date: new Date().toISOString()
    });
    DB.saveReviews(reviews);

    form.reset();
    selectedReviewRating = 5;
    paintStars();
    renderReviews();

    document.getElementById("reviewSuccess").classList.add("show");
    setTimeout(() => document.getElementById("reviewSuccess").classList.remove("show"), 5000);
  });
}


/* ---------------- Flash Sale Banner ---------------- */
let flashSaleInterval = null;

function initFlashSaleBanner() {
  const banner = document.getElementById("flashSaleBanner");
  if (!banner) return;

  const sale = DB.getFlashSale();
  const endTime = sale.endDate ? new Date(sale.endDate).getTime() : null;

  if (!sale.active || !endTime || endTime <= Date.now()) {
    banner.style.display = "none";
    if (flashSaleInterval) clearInterval(flashSaleInterval);
    return;
  }

  document.getElementById("flashSaleName").textContent = sale.name;
  document.getElementById("flashSaleSubtitle").textContent = sale.subtitle || "";
  banner.style.display = "block";

  updateFlashSaleCountdown(endTime, banner);
  if (flashSaleInterval) clearInterval(flashSaleInterval);
  flashSaleInterval = setInterval(() => updateFlashSaleCountdown(endTime, banner), 1000);
}

function updateFlashSaleCountdown(endTime, banner) {
  const diff = endTime - Date.now();

  if (diff <= 0) {
    clearInterval(flashSaleInterval);
    banner.style.display = "none";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  document.getElementById("fsDays").textContent = String(days).padStart(2, "0");
  document.getElementById("fsHours").textContent = String(hours).padStart(2, "0");
  document.getElementById("fsMins").textContent = String(mins).padStart(2, "0");
  document.getElementById("fsSecs").textContent = String(secs).padStart(2, "0");
}
