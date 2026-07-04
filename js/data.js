/* ============================================================
   LUNARA — Data Layer
   Sab product/category/order/cart data localStorage mein store
   hota hai. Backend na hone ki wajah se ye sirf isi browser
   (isi device) tak mehdood hai — production ke liye real
   database (Firebase/MySQL/etc) attach karna hoga.
   ============================================================ */

const DB_KEYS = {
  products: "lunara_products",
  categories: "lunara_categories",
  orders: "lunara_orders",
  cart: "lunara_cart",
  admin: "lunara_admin_session",
  reviews: "lunara_reviews",
  orderSeq: "lunara_order_seq",
  flashSale: "lunara_flash_sale",
  ordersSeenCount: "lunara_orders_seen_count"
};

/* ---------- Seed data (pehli dafa site khulne par) ---------- */
function seedDatabase() {
  if (!localStorage.getItem(DB_KEYS.categories)) {
    const categories = [
      { id: "cat_winter", name: "Winter Collection", subcategories: [] },
      { id: "cat_lawn", name: "Lawn / Summer", subcategories: [] },
      { id: "cat_pret", name: "Pret Wear", subcategories: [] },
      { id: "cat_formal", name: "Formal & Party Wear", subcategories: [] },
      { id: "cat_accessories", name: "Accessories", subcategories: [] }
    ];
    localStorage.setItem(DB_KEYS.categories, JSON.stringify(categories));
  }

  if (!localStorage.getItem(DB_KEYS.products)) {
    const img = (seed) => `https://placehold.co/600x800/f4d9dc/3a2e2e?font=playfair-display&text=${encodeURIComponent(seed)}`;
    const products = [
      {
        id: "p1", title: "Velvet Embroidered Shawl", category: "cat_winter",
        extraCategories: [],
        price: 6500, oldPrice: 8200, badge: "top", stock: 12,
        colors: ["Maroon", "Bottle Green", "Black"],
        images: [img("Velvet Shawl 1"), img("Velvet Shawl 2")],
        description: "Hand-embroidered velvet shawl, perfect for winter evenings. Soft inner lining, warm aur stylish.",
        sales: 34
      },
      {
        id: "p2", title: "Quilted Winter Coat", category: "cat_winter",
        extraCategories: [],
        price: 9800, oldPrice: null, badge: "new", stock: 8,
        colors: ["Beige", "Charcoal"],
        images: [img("Winter Coat 1"), img("Winter Coat 2")],
        description: "Premium quilted coat with side pockets, full sleeves. Daily wear aur formal dono ke liye.",
        sales: 11
      },
      {
        id: "p3", title: "Printed Lawn 3-Piece", category: "cat_lawn",
        extraCategories: [],
        price: 4200, oldPrice: 5400, badge: "top", stock: 20,
        colors: ["Sky Blue", "Peach", "Mint"],
        images: [img("Lawn Suit 1"), img("Lawn Suit 2")],
        description: "Digital printed lawn unstitched 3-piece suit with chiffon dupatta.",
        sales: 58
      },
      {
        id: "p4", title: "Embroidered Pret Kurti", category: "cat_pret",
        extraCategories: [],
        price: 3100, oldPrice: null, badge: "new", stock: 15,
        colors: ["White", "Powder Pink"],
        images: [img("Pret Kurti 1"), img("Pret Kurti 2")],
        description: "Ready to wear embroidered kurti, comfortable lawn fabric, everyday elegance.",
        sales: 19
      },
      {
        id: "p5", title: "Net Party Maxi", category: "cat_formal",
        extraCategories: [],
        price: 12500, oldPrice: 15000, badge: "top", stock: 6,
        colors: ["Wine", "Royal Blue", "Black"],
        images: [img("Party Maxi 1"), img("Party Maxi 2")],
        description: "Heavy embellished net maxi for weddings and parties, fully lined inner.",
        sales: 27
      },
      {
        id: "p6", title: "Pearl Drop Earrings", category: "cat_accessories",
        extraCategories: [],
        price: 1200, oldPrice: null, badge: "new", stock: 30,
        colors: ["Gold", "Silver"],
        images: [img("Earrings 1")],
        description: "Elegant pearl drop earrings, lightweight aur har outfit ke sath suit karti hain.",
        sales: 41
      }
    ];
    products.forEach((p, i) => { p.createdAt = Date.now() - (products.length - i) * 1000; });
    localStorage.setItem(DB_KEYS.products, JSON.stringify(products));
  }

  if (!localStorage.getItem(DB_KEYS.orders)) {
    localStorage.setItem(DB_KEYS.orders, JSON.stringify([]));
  }
  if (!localStorage.getItem(DB_KEYS.cart)) {
    localStorage.setItem(DB_KEYS.cart, JSON.stringify([]));
  }

  if (!localStorage.getItem(DB_KEYS.reviews)) {
    const reviews = [
      {
        id: "rev_1", name: "Ayesha Khan", rating: 5,
        text: "Fabric quality bohat acha tha aur delivery bhi time par hui. Bilkul jaisa website par dikhaya gaya tha!",
        date: "2026-05-14T10:00:00.000Z"
      },
      {
        id: "rev_2", name: "Sana Malik", rating: 4,
        text: "Winter shawl bohat khoobsurat hai, warm bhi hai. Sirf packaging thori behtar ho sakti thi.",
        date: "2026-05-02T10:00:00.000Z"
      },
      {
        id: "rev_3", name: "Hina Raza", rating: 5,
        text: "Customer service bohat helpful thi, size guide ne exact fit choose karne mein madad ki. Highly recommended!",
        date: "2026-04-20T10:00:00.000Z"
      }
    ];
    localStorage.setItem(DB_KEYS.reviews, JSON.stringify(reviews));
  }
}
seedDatabase();

/* ---------- Generic helpers ---------- */
/* ---------- Safe localStorage writer ----------
   localStorage.setItem browser ki 5MB (approx) limit cross karte
   hi silently throw karta hai. Pehle ye uncaught error UI ko
   "freeze" kar deta tha (jese Save Listing button ka kaam na karna).
   Ab ye helper error ko catch karta hai aur true/false return karta
   hai, taa-ke caller user ko proper message dikha sake. */
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.error("localStorage save failed:", err);
    return false;
  }
}

const DB = {
  getProducts: () => JSON.parse(localStorage.getItem(DB_KEYS.products) || "[]").sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
  saveProducts: (list) => safeSetItem(DB_KEYS.products, JSON.stringify(list)),

  getCategories: () => JSON.parse(localStorage.getItem(DB_KEYS.categories) || "[]"),
  saveCategories: (list) => safeSetItem(DB_KEYS.categories, JSON.stringify(list)),

  getOrders: () => JSON.parse(localStorage.getItem(DB_KEYS.orders) || "[]"),
  saveOrders: (list) => safeSetItem(DB_KEYS.orders, JSON.stringify(list)),

  getCart: () => JSON.parse(localStorage.getItem(DB_KEYS.cart) || "[]"),
  saveCart: (list) => safeSetItem(DB_KEYS.cart, JSON.stringify(list)),

  getReviews: () => JSON.parse(localStorage.getItem(DB_KEYS.reviews) || "[]"),
  saveReviews: (list) => safeSetItem(DB_KEYS.reviews, JSON.stringify(list)),

  getFlashSale: () => JSON.parse(localStorage.getItem(DB_KEYS.flashSale) || "null") || { active: false, name: "", endDate: null },
  saveFlashSale: (obj) => safeSetItem(DB_KEYS.flashSale, JSON.stringify(obj)),

  getOrdersSeenCount: () => Number(localStorage.getItem(DB_KEYS.ordersSeenCount) || "0"),
  setOrdersSeenCount: (n) => safeSetItem(DB_KEYS.ordersSeenCount, String(n)),

  categoryName: (id) => {
    const c = DB.getCategories().find(c => c.id === id);
    return c ? c.name : "Uncategorized";
  },

  getSubcategories: (catId) => {
    const c = DB.getCategories().find(c => c.id === catId);
    return (c && c.subcategories) ? c.subcategories : [];
  },

  subcategoryName: (catId, subId) => {
    const subs = DB.getSubcategories(catId);
    const s = subs.find(s => s.id === subId);
    return s ? s.name : "";
  },

  productInCategory: (product, catId) => {
    if (product.category === catId) return true;
    return Array.isArray(product.extraCategories) && product.extraCategories.includes(catId);
  },

  productInSubcategory: (product, subId) => {
    if (product.subcategory === subId) return true;
    return Array.isArray(product.extraSubcategories) && product.extraSubcategories.includes(subId);
  },

  newId: (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,

  nextOrderNumber: () => {
    let seq = Number(localStorage.getItem(DB_KEYS.orderSeq) || "0");
    seq += 1;
    safeSetItem(DB_KEYS.orderSeq, String(seq));
    return `FTM-${String(seq).padStart(5, "0")}`;
  }
};

function formatPrice(n) {
  return "Rs " + Number(n).toLocaleString("en-PK");
}

function cartCount() {
  return DB.getCart().reduce((sum, item) => sum + item.qty, 0);
}
