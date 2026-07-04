/* ============================================================
   LUNARA — Admin Panel Logic
   NOTE: Ye login sirf DEMO purpose ke liye client-side hai
   (username/password yahin JS file mein hai). Real production
   site ke liye proper backend authentication (hashed password,
   server session/token) lagana zaroori hai — warna koi bhi
   browser console se admin access hasil kar sakta hai.
   ============================================================ */

const ADMIN_CREDENTIALS = { username: "admin", password: "admin123" };
let pendingColors = [];
let pendingImages = [];
let editingListingId = null;


/* ---------- Image resize/compress before storing ----------
   Phone camera se li gayi photos aksar 3-8MB tak hoti hain.
   Base64 mein convert hone par size ~33% aur barh jata hai, aur
   localStorage ki total limit sirf ~5MB hoti hai — matlab sirf
   1-2 uncompressed images hi is limit mein aa pati thin. Ye
   function har image ko max 1200px width/height tak resize
   karta hai aur JPEG quality 0.72 par compress karta hai, jis se
   size kaafi kam ho jata hai aur multiple images bhi save ho
   sakti hain. */
function resizeImageFile(file, maxDim = 1200, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round(height * (maxDim / width));
            width = maxDim;
          } else {
            width = Math.round(width * (maxDim / height));
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = ev.target.result;
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  checkSession();
  wireLogin();
  wireSidebarNav();
  wireListingModal();
  wireCategoryForm();
  wireSubcategoryForm();
  wireOrderDetailModal();
  wireFlashSaleForm();
  wireViewListingModal();
});
/* ---------------- Auth ---------------- */
function checkSession() {
  const navEntries = performance.getEntriesByType("navigation");
  const navType = navEntries.length ? navEntries[0].type : "navigate";
  const loggedIn = sessionStorage.getItem(DB_KEYS.admin) === "true";

  // Sirf normal PAGE REFRESH (F5) par session yaad rahega.
  // Kisi bhi tarah wapis is page par aane (link click, ya back/forward button) par
  // dobara login mangwana hai.
  if (loggedIn && navType === "reload") {
    showDashboard();
  } else {
    sessionStorage.removeItem(DB_KEYS.admin);
    document.getElementById("adminLayout").style.display = "none";
    document.getElementById("loginWrap").style.display = "flex";
  }
}

// Back/Forward button se page bfcache se restore ho (JS dobara chale bagair) to bhi
// forcibly login screen dikhayein.
window.addEventListener("pageshow", (e) => {
  if (e.persisted) {
    sessionStorage.removeItem(DB_KEYS.admin);
    document.getElementById("adminLayout").style.display = "none";
    document.getElementById("loginWrap").style.display = "flex";
  } else {
    checkSession();
  }
});

function wireLogin() {
  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const user = document.getElementById("loginUser").value;
    const pass = document.getElementById("loginPass").value;
    if (user === ADMIN_CREDENTIALS.username && pass === ADMIN_CREDENTIALS.password) {
      sessionStorage.setItem(DB_KEYS.admin, "true");
      showDashboard();
    } else {
      document.getElementById("loginError").classList.add("show");
    }
  });

document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem(DB_KEYS.admin);
    window.location.href = "index.html";
  });
}

function showDashboard() {
  document.getElementById("loginWrap").style.display = "none";
  document.getElementById("adminLayout").style.display = "grid";
  renderDashboard();
  renderListingsTable();
  renderCategoriesTable();
  renderOrdersTable();
  renderReviewsTable();
  renderSalesReport();
  populateCategorySelect();
  populateSubcatParentSelect();
  updateOrdersBadge();
  setInterval(updateOrdersBadge, 4000);
}

/* ---------------- Sidebar Navigation ---------------- */
function wireSidebarNav() {
  document.querySelectorAll(".admin-nav button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".admin-nav button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("active"));
      document.getElementById(`panel-${btn.dataset.panel}`).classList.add("active");
      if (btn.dataset.panel === "orders") markOrdersSeen();
    });
  });
}

/* ---------------- Dashboard ---------------- */
function renderDashboard() {
  const products = DB.getProducts();
  const orders = DB.getOrders();
  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pending = orders.filter(o => o.status === "Pending").length;

  document.getElementById("dashStats").innerHTML = `
    <div class="stat-card"><div class="label">Total Revenue</div><div class="value">${formatPrice(revenue)}</div><div class="delta">${orders.length} orders total</div></div>
    <div class="stat-card"><div class="label">Total Orders</div><div class="value">${orders.length}</div><div class="delta">${pending} pending</div></div>
    <div class="stat-card"><div class="label">Total Listings</div><div class="value">${products.length}</div><div class="delta">${DB.getCategories().length} categories</div></div>
    <div class="stat-card"><div class="label">Low Stock Items</div><div class="value">${products.filter(p => p.stock <= 5).length}</div><div class="delta">5 ya us se kam stock</div></div>
  `;

  const recent = orders.slice(0, 5);
  document.getElementById("dashRecentOrders").innerHTML = `
    <thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
    <tbody>
      ${recent.length ? recent.map(o => `
        <tr>
          <td>${o.id}</td>
          <td>${o.customer.firstName} ${o.customer.lastName}</td>
          <td>${formatPrice(o.total)}</td>
          <td><span class="badge-pill ${o.status === 'Delivered' ? 'new' : o.status === 'Cancelled' ? 'none' : 'top'}">${o.status}</span></td>
        </tr>
      `).join("") : `<tr><td colspan="4" style="text-align:center;color:var(--ink-soft);padding:24px;">Abhi koi order nahi aaya.</td></tr>`}
    </tbody>
  `;
}

/* ---------------- Listings ---------------- */
function renderListingsTable() {
  const products = DB.getProducts();
  const table = document.getElementById("listingsTable");
  table.innerHTML = `
    <thead><tr><th>Image</th><th>Title</th><th>Category</th><th>Price</th><th>Stock</th><th>Badge</th><th>Actions</th></tr></thead>
    <tbody>
      ${products.map(p => `
        <tr>
          <td><img class="thumb" src="${p.images[0]}" alt="${p.title}"></td>
          <td>${p.title}</td>
          <td>${DB.categoryName(p.category)}</td>
          <td>${formatPrice(p.price)}</td>
          <td>${p.stock}</td>
          <td><span class="badge-pill ${p.badge}">${p.badge === 'top' ? 'Top Sale' : p.badge === 'new' ? 'New' : 'None'}</span></td>
          <td>
            <div class="row-actions">
              <button data-view="${p.id}">View</button>
              <button data-edit="${p.id}">Edit</button>
              <button class="danger" data-delete="${p.id}">Delete</button>
            </div>
          </td>
        </tr>
      `).join("")}
    </tbody>
  `;
  table.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => openViewListingModal(b.dataset.view)));
  table.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => openListingModal(b.dataset.edit)));
  table.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", () => deleteListing(b.dataset.delete)));
}

function deleteListing(id) {
  if (!confirm("Kya aap waqai is listing ko delete karna chahte hain?")) return;
  const products = DB.getProducts().filter(p => p.id !== id);
  DB.saveProducts(products);
  renderListingsTable();
  renderDashboard();
  renderSalesReport();
}

function populateCategorySelect() {
  const select = document.getElementById("listingCategory");
  select.innerHTML = DB.getCategories().map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  select.addEventListener("change", () => {
    populateListingSubcategorySelect(select.value);
  });
  populateListingSubcategorySelect(select.value);
}

function populateListingSubcategorySelect(catId, selectedSubId) {
  const subSelect = document.getElementById("listingSubcategory");
  const subs = DB.getSubcategories(catId);
  if (!subs.length) {
    subSelect.innerHTML = `<option value="">— No subcategory —</option>`;
    return;
  }
  subSelect.innerHTML = `<option value="">— Select subcategory —</option>` +
    subs.map(s => `<option value="${s.id}" ${s.id === selectedSubId ? "selected" : ""}>${s.name}</option>`).join("");
}

function populateSubcatParentSelect() {
  const select = document.getElementById("subcatParentSelect");
  if (!select) return;
  select.innerHTML = DB.getCategories().map(c => `<option value="${c.id}">${c.name}</option>`).join("");
}

function wireSubcategoryForm() {
  const form = document.getElementById("subcategoryForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const catId = document.getElementById("subcatParentSelect").value;
    const nameInput = document.getElementById("newSubcategoryName");
    const name = nameInput.value.trim();
    if (!catId || !name) return;

    const categories = DB.getCategories();
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    if (!cat.subcategories) cat.subcategories = [];

    const exists = cat.subcategories.some(s => s.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      alert("Ye subcategory pehle se maujood hai.");
      return;
    }

    cat.subcategories.push({ id: DB.newId("sub"), name });
    DB.saveCategories(categories);
    nameInput.value = "";
    renderCategoriesTable();
    populateCategorySelect();
  });
}

function deleteSubcategory(catId, subId) {
  const inUse = DB.getProducts().some(p => p.subcategory === subId);
  if (inUse) {
    alert("Ye subcategory kuch listings mein use ho rahi hai. Pehle un listings ki subcategory change karein.");
    return;
  }
  if (!confirm("Subcategory delete karein?")) return;
  const categories = DB.getCategories();
  const cat = categories.find(c => c.id === catId);
  if (cat && cat.subcategories) {
    cat.subcategories = cat.subcategories.filter(s => s.id !== subId);
    DB.saveCategories(categories);
  }
  renderCategoriesTable();
}

function openListingModal(id) {
  populateCategorySelect();
  editingListingId = id || null;
  pendingColors = [];
  pendingImages = [];

  if (id) {
    const p = DB.getProducts().find(p => p.id === id);
    document.getElementById("listingModalTitle").textContent = "Edit Listing";
    document.getElementById("listingId").value = p.id;
    document.getElementById("listingTitle").value = p.title;
    document.getElementById("listingCategory").value = p.category;
    populateListingSubcategorySelect(p.category, p.subcategory || "");
    populateExtraCategoryCheckboxes(p.extraCategories || [], p.extraSubcategories || []);
    populateListingSizes(p.sizes || []);
    document.getElementById("listingBadge").value = p.badge;
    document.getElementById("listingPrice").value = p.price;
    document.getElementById("listingOldPrice").value = p.oldPrice || "";
    document.getElementById("listingStock").value = p.stock;
    document.getElementById("listingDesc").value = p.description;
    pendingColors = [...p.colors];
    pendingImages = [...p.images];
  } else {
    document.getElementById("listingModalTitle").textContent = "Add New Listing";
    document.getElementById("listingForm").reset();
    document.getElementById("listingId").value = "";
    populateExtraCategoryCheckboxes([], []);
    populateListingSizes([]);
  }
  renderColorTags();
  renderImagePreviews();
  document.getElementById("listingModal").classList.add("open");
}

function populateExtraCategoryCheckboxes(selectedCats = [], selectedSubs = []) {
  const wrap = document.getElementById("listingExtraCategories");
  if (!wrap) return;
  wrap.innerHTML = DB.getCategories().map(c => {
    const subs = DB.getSubcategories(c.id);
    const subHTML = subs.length ? `
      <div class="checkbox-chip-subs">
        ${subs.map(s => `
          <label class="checkbox-chip sub">
            <input type="checkbox" data-role="sub" data-parent="${c.id}" value="${s.id}" ${selectedSubs.includes(s.id) ? "checked" : ""}>
            <span>${s.name}</span>
          </label>
        `).join("")}
      </div>` : "";
    return `
      <div class="checkbox-chip-group">
        <label class="checkbox-chip">
          <input type="checkbox" data-role="cat" value="${c.id}" ${selectedCats.includes(c.id) ? "checked" : ""}>
          <span>${c.name}</span>
        </label>
        ${subHTML}
      </div>
    `;
  }).join("");
}

function getSelectedExtraCategories() {
  const wrap = document.getElementById("listingExtraCategories");
  if (!wrap) return [];
  return Array.from(wrap.querySelectorAll('input[data-role="cat"]:checked')).map(cb => cb.value);
}

function getSelectedExtraSubcategories() {
  const wrap = document.getElementById("listingExtraCategories");
  if (!wrap) return [];
  return Array.from(wrap.querySelectorAll('input[data-role="sub"]:checked')).map(cb => cb.value);
}

function getSelectedSizes() {
  const wrap = document.getElementById("listingSizes");
  if (!wrap) return [];
  return Array.from(wrap.querySelectorAll('input:checked')).map(cb => cb.value);
}

function populateListingSizes(selectedSizes = []) {
  const wrap = document.getElementById("listingSizes");
  if (!wrap) return;
  wrap.querySelectorAll('input').forEach(cb => {
    cb.checked = selectedSizes.includes(cb.value);
  });
}

function getSelectedExtraSubcategories() {
  const wrap = document.getElementById("listingExtraCategories");
  if (!wrap) return [];
  return Array.from(wrap.querySelectorAll('input[data-role="sub"]:checked')).map(cb => cb.value);
}

function renderColorTags() {
  document.getElementById("colorTagRow").innerHTML = pendingColors.map((c, i) => `
    <span class="color-tag">${c} <button type="button" data-i="${i}">&times;</button></span>
  `).join("");
  document.querySelectorAll("#colorTagRow button").forEach(btn => {
    btn.addEventListener("click", () => { pendingColors.splice(Number(btn.dataset.i), 1); renderColorTags(); });
  });
}

function renderImagePreviews() {
  document.getElementById("imagePreviewRow").innerHTML = pendingImages.map((img, i) => `
    <span class="img-chip"><img src="${img}"><button type="button" data-i="${i}">&times;</button></span>
  `).join("");
  document.querySelectorAll("#imagePreviewRow button").forEach(btn => {
    btn.addEventListener("click", () => { pendingImages.splice(Number(btn.dataset.i), 1); renderImagePreviews(); });
  });
}

function wireListingModal() {
  document.getElementById("addListingBtn").addEventListener("click", () => openListingModal(null));
  document.getElementById("cancelListingBtn").addEventListener("click", () => {
    document.getElementById("listingModal").classList.remove("open");
  });

  document.getElementById("addColorBtn").addEventListener("click", () => {
    const input = document.getElementById("listingColorInput");
    const val = input.value.trim();
    if (val && !pendingColors.includes(val)) {
      pendingColors.push(val);
      renderColorTags();
    }
    input.value = "";
  });

  // Multiple image upload -> resized/compressed base64 (client-side only storage)
  document.getElementById("listingImages").addEventListener("change", async (e) => {
    const files = Array.from(e.target.files);
    const previewRow = document.getElementById("imagePreviewRow");
    const saveBtn = document.querySelector("#listingForm button[type='submit']");
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "Processing images..."; }

    for (const file of files) {
      try {
        const compressed = await resizeImageFile(file);
        pendingImages.push(compressed);
        renderImagePreviews();
      } catch (err) {
        console.error(err);
        alert(`"${file.name}" ko process nahi kiya ja saka. Ye image skip kar di gayi hai.`);
      }
    }

    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Save Listing"; }
    e.target.value = "";
  });

  document.getElementById("listingForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (pendingImages.length === 0) {
      alert("Kam az kam 1 product image upload karein.");
      return;
    }
    const products = DB.getProducts();
    const data = {
      title: document.getElementById("listingTitle").value,
      category: document.getElementById("listingCategory").value,
      subcategory: document.getElementById("listingSubcategory").value || null,
      extraCategories: getSelectedExtraCategories(),
      extraCategories: getSelectedExtraCategories(),
      extraSubcategories: getSelectedExtraSubcategories(),
      badge: document.getElementById("listingBadge").value,
      price: Number(document.getElementById("listingPrice").value),
      oldPrice: document.getElementById("listingOldPrice").value ? Number(document.getElementById("listingOldPrice").value) : null,
      stock: Number(document.getElementById("listingStock").value),
      colors: [...pendingColors],
      sizes: getSelectedSizes(),
      images: [...pendingImages],
      description: document.getElementById("listingDesc").value
    };

    if (editingListingId) {
      const idx = products.findIndex(p => p.id === editingListingId);
      products[idx] = { ...products[idx], ...data };
    } else {
      products.unshift({ id: DB.newId("p"), sales: 0, createdAt: Date.now(), ...data });
    }

    const saved = DB.saveProducts(products);
    if (!saved) {
      alert("Save nahi ho saka: browser ki storage limit (5MB) khatam ho gayi hai.\n\nIs listing mein kam images use karein (ya chhoti size ki), ya kisi purani listing ki images/listings delete karke jagah banayein.");
      return;
    }

    document.getElementById("listingModal").classList.remove("open");
    renderListingsTable();
    renderDashboard();
    renderSalesReport();
  });
}

/* ---------------- Categories ---------------- */
function renderCategoriesTable() {
  const categories = DB.getCategories();
  const products = DB.getProducts();
  const table = document.getElementById("categoriesTable");
  table.innerHTML = `
    <thead><tr><th>Category Name</th><th>Listings Count</th><th>Subcategories</th><th>Actions</th></tr></thead>
    <tbody>
      ${categories.map(c => `
        <tr>
          <td>${c.name}</td>
          <td>${products.filter(p => p.category === c.id).length}</td>
          <td>
            ${(c.subcategories && c.subcategories.length)
      ? c.subcategories.map(s => `<span class="color-tag">${s.name} <button type="button" data-del-sub="${c.id}|${s.id}">&times;</button></span>`).join(" ")
      : `<span style="color:var(--ink-soft);font-size:13px;">— None —</span>`}
          </td>
          <td><div class="row-actions"><button class="danger" data-del-cat="${c.id}">Delete</button></div></td>
        </tr>
      `).join("")}
    </tbody>
  `;
  table.querySelectorAll("[data-del-cat]").forEach(b => {
    b.addEventListener("click", () => deleteCategory(b.dataset.delCat));
  });
  table.querySelectorAll("[data-del-sub]").forEach(b => {
    b.addEventListener("click", () => {
      const [catId, subId] = b.dataset.delSub.split("|");
      deleteSubcategory(catId, subId);
    });
  });
}

function deleteCategory(id) {
  const inUse = DB.getProducts().some(p => p.category === id || (p.extraCategories && p.extraCategories.includes(id)));
  if (inUse) {
    alert("Ye category kuch listings mein use ho rahi hai. Pehle un listings ko delete ya category change karein.");
    return;
  }
  if (!confirm("Category delete karein?")) return;
  DB.saveCategories(DB.getCategories().filter(c => c.id !== id));
  renderCategoriesTable();
  populateCategorySelect();
  renderDashboard();
}

function wireCategoryForm() {
  document.getElementById("categoryForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("newCategoryName");
    const name = input.value.trim();
    if (!name) return;
    const categories = DB.getCategories();
    categories.push({ id: DB.newId("cat"), name, subcategories: [] });
    DB.saveCategories(categories);
    input.value = "";
    renderCategoriesTable();
    populateCategorySelect();
    populateSubcatParentSelect();
    renderDashboard();
  });
}

/* ---------------- Orders ---------------- */
function renderOrdersTable() {
  const orders = DB.getOrders();
  const table = document.getElementById("ordersTable");
  table.innerHTML = `
    <thead><tr><th>Order ID</th><th>Customer</th><th>Phone</th><th>City</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>
      ${orders.length ? orders.map(o => `
        <tr>
          <td>${o.id}</td>
          <td>${o.customer.firstName} ${o.customer.lastName}</td>
          <td>${o.customer.phone}</td>
          <td>${o.customer.city}</td>
          <td>${o.items.reduce((s, i) => s + i.qty, 0)} item(s)</td>
          <td>${formatPrice(o.total)}</td>
          <td>${o.payment}</td>
          <td>
            <select class="status-select" data-order="${o.id}">
              ${["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map(s => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
            </select>
          </td>
          <td><div class="row-actions"><button data-view-order="${o.id}">View</button></div></td>
        </tr>
      `).join("") : `<tr><td colspan="9" style="text-align:center;color:var(--ink-soft);padding:24px;">Abhi koi order nahi aaya hai.</td></tr>`}
    </tbody>
  `;
  table.querySelectorAll(".status-select").forEach(sel => {
    sel.addEventListener("change", () => {
      const orders = DB.getOrders();
      const order = orders.find(o => o.id === sel.dataset.order);
      order.status = sel.value;
      DB.saveOrders(orders);
      renderDashboard();
    });
  });
  table.querySelectorAll("[data-view-order]").forEach(btn => {
    btn.addEventListener("click", () => openOrderDetail(btn.dataset.viewOrder));
  });
}

/* ---------------- Reviews ---------------- */
function renderReviewsTable() {
  const reviews = [...DB.getReviews()].sort((a, b) => new Date(b.date) - new Date(a.date));
  const statsWrap = document.getElementById("reviewStats");
  const table = document.getElementById("reviewsTable");
  if (!table) return;

  const total = reviews.length;
  const avg = total ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : "0.0";
  const fiveStar = reviews.filter(r => r.rating === 5).length;
  const latest = total ? new Date(reviews[0].date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—";

  if (statsWrap) {
    statsWrap.innerHTML = `
      <div class="stat-card"><div class="label">Total Reviews</div><div class="value">${total}</div></div>
      <div class="stat-card"><div class="label">Average Rating</div><div class="value">${avg} ★</div></div>
      <div class="stat-card"><div class="label">5-Star Reviews</div><div class="value">${fiveStar}</div></div>
      <div class="stat-card"><div class="label">Latest Review</div><div class="value" style="font-size:16px;">${latest}</div></div>
    `;
  }

  table.innerHTML = `
    <thead><tr><th>Customer Name</th><th>Rating</th><th>Review</th><th>Date</th><th>Actions</th></tr></thead>
    <tbody>
      ${reviews.length ? reviews.map(r => `
        <tr>
          <td>${r.name}</td>
          <td>${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</td>
          <td style="max-width:340px;">${r.text}</td>
          <td>${new Date(r.date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</td>
          <td><div class="row-actions"><button class="danger" data-del-review="${r.id}">Delete</button></div></td>
        </tr>
      `).join("") : `<tr><td colspan="5" style="text-align:center;color:var(--ink-soft);padding:24px;">Abhi tak koi review nahi mila.</td></tr>`}
    </tbody>
  `;

  table.querySelectorAll("[data-del-review]").forEach(b => {
    b.addEventListener("click", () => deleteReview(b.dataset.delReview));
  });
}

function deleteReview(id) {
  if (!confirm("Kya aap waqai is review ko delete karna chahte hain?")) return;
  DB.saveReviews(DB.getReviews().filter(r => r.id !== id));
  renderReviewsTable();
}

/* ---------------- Sales Report ---------------- */
function renderSalesReport() {
  const orders = DB.getOrders();
  const products = DB.getProducts();
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const itemsSold = orders.reduce((s, o) => s + o.items.reduce((s2, i) => s2 + i.qty, 0), 0);
  const avgOrder = orders.length ? Math.round(revenue / orders.length) : 0;

  document.getElementById("salesStats").innerHTML = `
    <div class="stat-card"><div class="label">Total Revenue</div><div class="value">${formatPrice(revenue)}</div></div>
    <div class="stat-card"><div class="label">Items Sold</div><div class="value">${itemsSold}</div></div>
    <div class="stat-card"><div class="label">Total Orders</div><div class="value">${orders.length}</div></div>
    <div class="stat-card"><div class="label">Avg. Order Value</div><div class="value">${formatPrice(avgOrder)}</div></div>
  `;

  const topProducts = [...products].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 5);
  const maxSales = Math.max(1, ...topProducts.map(p => p.sales || 0));
  document.getElementById("topProductsBars").innerHTML = topProducts.map(p => `
    <div class="bar-row">
      <span class="name">${p.title}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${((p.sales || 0) / maxSales) * 100}%"></div></div>
      <span class="count">${p.sales || 0} sold</span>
    </div>
  `).join("") || `<p style="color:var(--ink-soft);font-size:13.5px;">Abhi koi sales data nahi hai.</p>`;

  const categories = DB.getCategories();
  const catSales = categories.map(c => ({
    name: c.name,
    sales: products.filter(p => p.category === c.id).reduce((s, p) => s + (p.sales || 0), 0)
  })).sort((a, b) => b.sales - a.sales);
  const maxCatSales = Math.max(1, ...catSales.map(c => c.sales));
  document.getElementById("categoryBars").innerHTML = catSales.map(c => `
    <div class="bar-row">
      <span class="name">${c.name}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(c.sales / maxCatSales) * 100}%"></div></div>
      <span class="count">${c.sales} sold</span>
    </div>
  `).join("") || `<p style="color:var(--ink-soft);font-size:13.5px;">Abhi koi sales data nahi hai.</p>`;
}


/* ---------------- Order Detail / PDF / Print ---------------- */
let currentOrderDetail = null;

function openOrderDetail(id) {
  const order = DB.getOrders().find(o => o.id === id);
  if (!order) return;
  currentOrderDetail = order;

  document.getElementById("orderPrintArea").innerHTML = buildReceiptHTML(order);
  document.getElementById("orderDetailModal").classList.add("open");
}

function buildReceiptHTML(order) {
  return `
    <div class="receipt-box">
      <div class="receipt-head">
        <h2>Faisalabad Textile Mills</h2>
        <p class="slogan">"Customer trust is our responsibility"</p>
        <p>Email: faisalabadtextilemills@gmail.com</p>
        <p>Contact: 0328-7526397</p>
      </div>
      <div class="receipt-dashed"></div>
      <div class="receipt-row"><span>Order No.</span><span>${order.id}</span></div>
      <div class="receipt-row"><span>Date</span><span>${new Date(order.date).toLocaleString("en-PK")}</span></div>
      <div class="receipt-row"><span>Payment</span><span>${order.payment}</span></div>
      <div class="receipt-row"><span>Status</span><span>${order.status}</span></div>
      <div class="receipt-dashed"></div>
      <div class="receipt-row"><span>Customer</span><span>${order.customer.firstName} ${order.customer.lastName}</span></div>
      <div class="receipt-row"><span>Phone</span><span>${order.customer.phone}</span></div>
      <div class="receipt-row"><span>Address</span><span style="text-align:right;">${order.customer.address}${order.customer.nearby ? ", " + order.customer.nearby : ""}</span></div>
      <div class="receipt-row"><span>City</span><span>${order.customer.city} ${order.customer.postalCode ? "- " + order.customer.postalCode : ""}</span></div>
      <div class="receipt-dashed"></div>
      <table class="receipt-table">
        <thead><tr><th>DESC</th><th>QTY</th><th>PRICE</th><th>AMOUNT</th></tr></thead>
        <tbody>
          ${order.items.map(i => `
            <tr>
              <td>${i.title}${i.color ? " (" + i.color + ")" : ""}</td>
              <td>${i.qty}</td>
              <td>${formatPrice(i.price)}</td>
              <td>${formatPrice(i.price * i.qty)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <div class="receipt-dashed"></div>
      <div class="receipt-row"><span>Sub Total</span><span>${formatPrice(order.subtotal)}</span></div>
      <div class="receipt-row"><span>Delivery</span><span>FREE</span></div>
      <div class="receipt-row receipt-total"><span>Total</span><span>${formatPrice(order.total)}</span></div>
      <div class="receipt-dashed"></div>
      <p class="receipt-footer">Thank you for shopping with us!</p>
    </div>
  `;


  document.getElementById("orderDetailModal").classList.add("open");
}

function wireOrderDetailModal() {
  document.getElementById("closeOrderDetailBtn").addEventListener("click", () => {
    document.getElementById("orderDetailModal").classList.remove("open");
  });
  document.getElementById("printOrderBtn").addEventListener("click", () => {
    if (currentOrderDetail) printOrderDetail(currentOrderDetail);
  });
  document.getElementById("downloadOrderPdfBtn").addEventListener("click", () => {
    if (currentOrderDetail) downloadOrderPDF(currentOrderDetail);
  });
}

function buildOrderReceiptLines(order) {
  const lines = [];
  lines.push("Faisalabad Textile Mills");
  lines.push('"Customer trust is our responsibility"');
  lines.push("Email: faisalabadtextilemills@gmail.com");
  lines.push("Contact: 0328-7526397");
  lines.push("");
  lines.push(`Order ID: ${order.id}`);
  lines.push(`Date: ${new Date(order.date).toLocaleString("en-PK")}`);
  lines.push("");
  lines.push(`Customer: ${order.customer.firstName} ${order.customer.lastName}`);
  lines.push(`Phone: ${order.customer.phone}`);
  lines.push(`Address: ${order.customer.address}`);
  if (order.customer.nearby) lines.push(`Nearby: ${order.customer.nearby}`);
  lines.push(`City: ${order.customer.city}   Postal Code: ${order.customer.postalCode || "-"}`);
  lines.push(`Country: ${order.customer.country}`);
  lines.push(`Payment Method: ${order.payment}`);
  lines.push(`Status: ${order.status}`);
  lines.push("");
  lines.push("Items:");
  order.items.forEach(i => {
    lines.push(`- ${i.title} ${i.color ? "(" + i.color + ")" : ""} x${i.qty} — ${formatPrice(i.price * i.qty)}`);
  });
  lines.push("");
  lines.push(`Total: ${formatPrice(order.total)}`);
  return lines;
}

function downloadOrderPDF(order) {
  if (!window.jspdf) {
    alert("PDF library load nahi ho saki. Internet connection check karein.");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: [80, 200 + order.items.length * 8] });
  const pageWidth = 80;
  const marginX = 6;
  const rightX = pageWidth - marginX;
  const centerX = pageWidth / 2;
  let y = 10;

  function dashedLine() {
    doc.setLineDashPattern([0.8, 0.8], 0);
    doc.line(marginX, y, rightX, y);
    doc.setLineDashPattern([], 0);
    y += 5;
  }
  function row(label, value, bold = false) {
    doc.setFont(undefined, bold ? "bold" : "normal");
    doc.text(label, marginX, y);
    doc.text(String(value), rightX, y, { align: "right" });
    y += 5;
  }

  // Header
  doc.setFont(undefined, "bold");
  doc.setFontSize(13);
  doc.text("Faisalabad Textile Mills", centerX, y, { align: "center" }); y += 5;
  doc.setFont(undefined, "italic");
  doc.setFontSize(8.5);
  doc.text('"Customer trust is our responsibility"', centerX, y, { align: "center" }); y += 4.5;
  doc.setFont(undefined, "normal");
  doc.text("Email: faisalabadtextilemills@gmail.com", centerX, y, { align: "center" }); y += 4;
  doc.text("Contact: 0328-7526397", centerX, y, { align: "center" }); y += 4;
  doc.setFontSize(9);
  dashedLine();

  row("Order No.", order.id);
  row("Date", new Date(order.date).toLocaleDateString("en-PK"));
  row("Payment", order.payment);
  row("Status", order.status);
  dashedLine();

  row("Customer", `${order.customer.firstName} ${order.customer.lastName}`);
  row("Phone", order.customer.phone);
  doc.setFont(undefined, "normal");
  const addrLines = doc.splitTextToSize(order.customer.address + (order.customer.nearby ? ", " + order.customer.nearby : ""), pageWidth - marginX * 2);
  doc.text(addrLines, marginX, y);
  y += addrLines.length * 4.2;
  row("City", `${order.customer.city} ${order.customer.postalCode ? "- " + order.customer.postalCode : ""}`);
  dashedLine();

  doc.setFont(undefined, "bold");
  doc.text("DESC", marginX, y);
  doc.text("QTY", pageWidth - 34, y, { align: "right" });
  doc.text("AMOUNT", rightX, y, { align: "right" });
  y += 4;
  doc.setLineDashPattern([0.8, 0.8], 0);
  doc.line(marginX, y, rightX, y);
  doc.setLineDashPattern([], 0);
  y += 4;

  doc.setFont(undefined, "normal");
  order.items.forEach(i => {
    const titleLines = doc.splitTextToSize(i.title + (i.color ? " (" + i.color + ")" : ""), 40);
    doc.text(titleLines, marginX, y);
    doc.text(String(i.qty), pageWidth - 34, y, { align: "right" });
    doc.text(formatPrice(i.price * i.qty), rightX, y, { align: "right" });
    y += titleLines.length * 4.2 + 1.5;
  });
  dashedLine();

  row("Sub Total", formatPrice(order.subtotal));
  row("Delivery", "FREE");
  dashedLine();
  row("Total", formatPrice(order.total), true);
  dashedLine();

  doc.setFont(undefined, "italic");
  doc.setFontSize(8);
  doc.text("Thank you for shopping with us!", centerX, y, { align: "center" });

  doc.save(`${order.id}.pdf`);
}

function printOrderDetail(order) {
  const html = `
    <html><head><title>${order.id}</title>
    <style>
      body{font-family:"Courier New", monospace; padding:30px; color:#222;}
      .receipt-box{max-width:380px;margin:0 auto;}
      .receipt-head{text-align:center;margin-bottom:10px;}
      .receipt-head h2{font-family:Georgia, serif;font-size:20px;margin:0 0 4px;}
      .receipt-head .slogan{font-style:italic;font-size:12px;color:#777;margin:2px 0 6px;}
      .receipt-head p{font-size:12px;margin:2px 0;}
      .receipt-dashed{border-top:1px dashed #999;margin:10px 0;}
      .receipt-row{display:flex;justify-content:space-between;gap:10px;font-size:13px;margin:4px 0;}
      .receipt-total{font-weight:700;font-size:15px;}
      .receipt-table{width:100%;border-collapse:collapse;font-size:12.5px;}
      .receipt-table th{text-align:left;border-bottom:1px dashed #999;padding:4px 2px;}
      .receipt-table td{padding:4px 2px;border-bottom:1px dotted #ddd;}
      .receipt-table th:nth-child(2),.receipt-table th:nth-child(3),.receipt-table th:nth-child(4),
      .receipt-table td:nth-child(2),.receipt-table td:nth-child(3),.receipt-table td:nth-child(4){text-align:right;}
      .receipt-footer{text-align:center;font-size:12px;color:#777;margin-top:10px;}
    </style></head><body>
    ${buildReceiptHTML(order)}
    </body></html>
  `;
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

/* ---------------- Flash Sale Banner ---------------- */
function wireFlashSaleForm() {
  const form = document.getElementById("flashSaleForm");
  if (!form) return;

  const sale = DB.getFlashSale();
  document.getElementById("saleName").value = sale.name || "";
  document.getElementById("saleSubtitle").value = sale.subtitle || "";
  document.getElementById("saleActive").checked = !!sale.active;
  if (sale.endDate) {
    const d = new Date(sale.endDate);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById("saleEndDate").value = local;
  }
  renderFlashSaleStatus(sale);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("saleName").value.trim();
    const subtitle = document.getElementById("saleSubtitle").value.trim();
    const endDateVal = document.getElementById("saleEndDate").value;
    const active = document.getElementById("saleActive").checked;

    if (!endDateVal) { alert("Sale end date/time zaroor set karein."); return; }

    const newSale = {
      name,
      subtitle,
      endDate: new Date(endDateVal).toISOString(),
      active
    };
    DB.saveFlashSale(newSale);
    renderFlashSaleStatus(newSale);
    alert("Flash Sale banner save ho gaya!");
  });

  document.getElementById("endSaleNowBtn").addEventListener("click", () => {
    const current = DB.getFlashSale();
    current.active = false;
    DB.saveFlashSale(current);
    document.getElementById("saleActive").checked = false;
    renderFlashSaleStatus(current);
    alert("Sale band kar di gayi hai.");
  });
}

function renderFlashSaleStatus(sale) {
  const el = document.getElementById("flashSaleStatus");
  if (!el) return;
  if (!sale.name) { el.textContent = "Abhi tak koi sale set nahi ki gayi."; return; }
  const status = sale.active ? "🟢 Active — homepage par dikh raha hai" : "⚪ Inactive — homepage par nahi dikh raha";
  el.textContent = `Current: "${sale.name}" — ${status}`;
}

/* ---------------- Orders Badge (unseen new orders) ---------------- */
function updateOrdersBadge() {
  const badge = document.getElementById("ordersBadge");
  if (!badge) return;
  const total = DB.getOrders().length;
  const seen = DB.getOrdersSeenCount();
  const unseen = Math.max(0, total - seen);
  if (unseen > 0) {
    badge.textContent = unseen > 99 ? "99+" : unseen;
    badge.style.display = "inline-flex";
  } else {
    badge.style.display = "none";
  }
}

function markOrdersSeen() {
  DB.setOrdersSeenCount(DB.getOrders().length);
  updateOrdersBadge();
}


/* ---------------- Listing Quick View ---------------- */
function openViewListingModal(id) {
  const p = DB.getProducts().find(x => x.id === id);
  if (!p) return;
  const area = document.getElementById("viewListingArea");
  area.innerHTML = `
    <div style="display:flex;gap:18px;flex-wrap:wrap;">
      <img src="${p.images[0]}" alt="${p.title}" style="width:180px;height:240px;object-fit:cover;border-radius:10px;flex-shrink:0;">
      <div style="flex:1;min-width:220px;">
        <span class="cat-tag">${DB.categoryName(p.category)}${p.subcategory ? ' · ' + DB.subcategoryName(p.category, p.subcategory) : ''}</span>
        <h2 style="margin:8px 0;font-size:22px;">${p.title}</h2>
        <div style="font-size:20px;font-weight:700;">
          ${formatPrice(p.price)}
          ${p.oldPrice ? `<span style="text-decoration:line-through;color:var(--ink-soft);font-size:14px;margin-left:8px;font-weight:400;">${formatPrice(p.oldPrice)}</span>` : ""}
        </div>
        <p style="margin:12px 0;color:var(--ink-soft);font-size:13.5px;line-height:1.6;">${p.description}</p>
        <p style="font-size:13px;margin:4px 0;"><strong>Colors:</strong> ${p.colors.join(", ") || "—"}</p>
        <p style="font-size:13px;margin:4px 0;"><strong>Stock:</strong> ${p.stock}</p>
      </div>
    </div>
    ${p.images.length > 1 ? `
      <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;">
        ${p.images.map(img => `<img src="${img}" alt="${p.title}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1.5px solid var(--line);">`).join("")}
      </div>` : ""}
  `;
  document.getElementById("viewListingModal").classList.add("open");
}

function wireViewListingModal() {
  const modal = document.getElementById("viewListingModal");
  if (!modal) return;
  document.getElementById("closeViewListingBtn").addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => {
    if (e.target.id === "viewListingModal") modal.classList.remove("open");
  });
}