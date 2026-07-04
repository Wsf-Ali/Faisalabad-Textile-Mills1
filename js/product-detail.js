/* ============================================================
   Product Detail Page (PDP) — product.html
   Note: data.js, common.js, aur store.js pehle load hote hain,
   isliye DB, formatPrice, addToCart, openCartDrawer, openCheckout,
   renderGrid — ye sab functions yahan already available hain.
   ============================================================ */

let pdpProduct = null;
let pdpColor = null;
let pdpQty = 1;
let pdpImgIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  pdpProduct = DB.getProducts().find(p => p.id === id);

  if (!pdpProduct) {
    document.querySelector(".pdp-grid").innerHTML =
      `<div class="empty-state">Ye product nahi mila. <a href="index.html">Wapas shop par jayein</a>.</div>`;
    return;
  }

  pdpColor = pdpProduct.colors[0] || null;
  renderPdp();
  renderPdpGallery();
  renderPdpColors();
  wirePdpControls();
  renderRelatedProducts();
});

function renderPdp() {
  document.title = `${pdpProduct.title} — Faisalabad Textile Mills`;
  document.getElementById("pdpCat").textContent = pdpProduct.subcategory
    ? `${DB.categoryName(pdpProduct.category)} · ${DB.subcategoryName(pdpProduct.category, pdpProduct.subcategory)}`
    : DB.categoryName(pdpProduct.category);
  document.getElementById("pdpTitle").textContent = pdpProduct.title;
  document.getElementById("pdpPrice").textContent = formatPrice(pdpProduct.price);
  document.getElementById("pdpOldPrice").textContent = pdpProduct.oldPrice ? formatPrice(pdpProduct.oldPrice) : "";
  document.getElementById("pdpDesc").textContent = pdpProduct.description;
  document.getElementById("pdpStock").textContent = pdpProduct.stock > 0
    ? `In stock (${pdpProduct.stock} available)` : "Currently out of stock";
  document.getElementById("pdpQtyVal").textContent = "1";
}

function renderPdpGallery() {
  const track = document.getElementById("pdpGalleryTrack");
  const thumbs = document.getElementById("pdpThumbs");
  const dots = document.getElementById("pdpGalleryDots");
  const images = pdpProduct.images;
  const multi = images.length > 1;

  track.innerHTML = images.map((img, i) =>
    `<div class="gallery-slide"><img src="${img}" alt="${pdpProduct.title} view ${i + 1}"></div>`
  ).join("");
  track.style.transform = `translateX(-${pdpImgIndex * 100}%)`;

  document.getElementById("pdpGalleryPrev").style.display = multi ? "flex" : "none";
  document.getElementById("pdpGalleryNext").style.display = multi ? "flex" : "none";

  dots.style.display = multi ? "flex" : "none";
  dots.innerHTML = multi ? images.map((_, i) =>
    `<button type="button" class="${i === pdpImgIndex ? 'active' : ''}" data-i="${i}" aria-label="Go to image ${i + 1}"></button>`
  ).join("") : "";
  dots.querySelectorAll("button").forEach(d => {
    d.addEventListener("click", () => { pdpImgIndex = Number(d.dataset.i); renderPdpGallery(); });
  });

  thumbs.innerHTML = images.map((img, i) =>
    `<img src="${img}" class="${i === pdpImgIndex ? 'active' : ''}" data-i="${i}" alt="View ${i + 1}">`
  ).join("");
  thumbs.querySelectorAll("img").forEach(t => {
    t.addEventListener("click", () => { pdpImgIndex = Number(t.dataset.i); renderPdpGallery(); });
  });
}

function pdpGalleryStep(dir) {
  const total = pdpProduct.images.length;
  pdpImgIndex = (pdpImgIndex + dir + total) % total;
  renderPdpGallery();
}

function renderPdpColors() {
  const wrap = document.getElementById("pdpColors");
  if (!pdpProduct.colors.length) {
    document.getElementById("pdpColorGroup").style.display = "none";
    return;
  }
  document.getElementById("pdpColorGroup").style.display = "block";
  wrap.innerHTML = pdpProduct.colors.map(c =>
    `<button type="button" class="color-chip ${c === pdpColor ? 'active' : ''}" data-c="${c}">${c}</button>`
  ).join("");
  wrap.querySelectorAll(".color-chip").forEach(chip => {
    chip.addEventListener("click", () => { pdpColor = chip.dataset.c; renderPdpColors(); });
  });
}

function wirePdpControls() {
  document.getElementById("pdpGalleryPrev").addEventListener("click", () => pdpGalleryStep(-1));
  document.getElementById("pdpGalleryNext").addEventListener("click", () => pdpGalleryStep(1));

  document.getElementById("pdpQtyMinus").addEventListener("click", () => {
    if (pdpQty > 1) { pdpQty--; document.getElementById("pdpQtyVal").textContent = pdpQty; }
  });
  document.getElementById("pdpQtyPlus").addEventListener("click", () => {
    if (pdpQty < (pdpProduct.stock || 99)) { pdpQty++; document.getElementById("pdpQtyVal").textContent = pdpQty; }
  });

  document.getElementById("pdpAddToCartBtn").addEventListener("click", () => {
    addToCart(pdpProduct.id, pdpQty, pdpColor);
    openCartDrawer();
  });
  document.getElementById("pdpBuyNowBtn").addEventListener("click", () => {
    addToCart(pdpProduct.id, pdpQty, pdpColor);
    openCheckout();
  });

  // swipe support (mobile)
  const main = document.querySelector(".pdp-gallery .modal-gallery-main");
  let startX = null;
  main.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  main.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 40) pdpGalleryStep(diff < 0 ? 1 : -1);
    startX = null;
  }, { passive: true });
}

function renderRelatedProducts() {
  const all = DB.getProducts().filter(p => p.id !== pdpProduct.id);
  let related = all.filter(p => DB.productInCategory(p, pdpProduct.category));
  if (related.length < 4) {
    const extra = all.filter(p => !related.includes(p)).slice(0, 4 - related.length);
    related = related.concat(extra);
  }
  renderGrid("relatedGrid", related.slice(0, 8));
}