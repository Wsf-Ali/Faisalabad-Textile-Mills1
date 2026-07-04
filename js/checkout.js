/* ============================================================
   Checkout Page — checkout.html
   Note: data.js aur common.js pehle load hote hain.
   ============================================================ */


document.addEventListener("DOMContentLoaded", () => {
  renderOrderSummary();
  wireCheckoutForm();
});

function calcTotals() {
  const cart = DB.getCart();
  const products = DB.getProducts();
  let subtotal = 0;
  const items = cart.map(i => {
    const p = products.find(p => p.id === i.productId);
    if (!p) return null;
    subtotal += p.price * i.qty;
    return { product: p, qty: i.qty, color: i.color };
  }).filter(Boolean);

  const shippingFee = 0;
  const total = subtotal + shippingFee;
  return { items, subtotal, shippingFee, total };
}

function renderOrderSummary() {
  const { items, subtotal, shippingFee, total } = calcTotals();
  const list = document.getElementById("orderSummaryItems");
  const placeBtn = document.getElementById("placeOrderBtn");

  if (items.length === 0) {
    list.innerHTML = `<div class="cart-empty">Your bag is empty. <a href="index.html#shop">Shop now</a>.</div>`;
    document.getElementById("orderSummaryFoot").style.display = "none";
    if (placeBtn) placeBtn.disabled = true;
    return;
  }

  list.innerHTML = items.map(i => `
    <div class="cart-item">
      <img src="${i.product.images[0]}" alt="${i.product.title}">
      <div class="cart-item-info">
        <h4>${i.product.title}</h4>
        <div class="meta">${i.color ? i.color + " · " : ""}Qty: ${i.qty}</div>
        <div class="row"><span>${formatPrice(i.product.price * i.qty)}</span></div>
      </div>
    </div>
  `).join("");

  document.getElementById("orderSummaryFoot").style.display = "block";
  document.getElementById("summarySubtotal").textContent = formatPrice(subtotal);
  const shipEl = document.getElementById("summaryShipping");
  shipEl.textContent = shippingFee === 0 ? "FREE" : formatPrice(shippingFee);
  shipEl.classList.toggle("free-shipping", shippingFee === 0);
  document.getElementById("summaryTotal").textContent = formatPrice(total);
}

function wireCheckoutForm() {
  const form = document.getElementById("checkoutForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const { items, subtotal, shippingFee, total } = calcTotals();
    if (items.length === 0) return;

    const order = {
      id: DB.nextOrderNumber(),
      date: new Date().toISOString(),
      items: items.map(i => ({ productId: i.product.id, title: i.product.title, qty: i.qty, price: i.product.price, color: i.color })),
      subtotal,
      shippingFee,
      total,
      customer: {
        firstName: document.getElementById("custFirstName").value,
        lastName: document.getElementById("custLastName").value,
        phone: document.getElementById("custPhone").value,
        country: document.getElementById("custCountry").value,
        address: document.getElementById("custAddress").value,
        nearby: document.getElementById("custNearby").value,
        city: document.getElementById("custCity").value,
        postalCode: document.getElementById("custPostalCode").value
      },
      payment: "Cash on Delivery",
      status: "Pending"
    };

    const orders = DB.getOrders();
    orders.unshift(order);
    DB.saveOrders(orders);

    const productsList = DB.getProducts();
    order.items.forEach(i => {
      const p = productsList.find(p => p.id === i.productId);
      if (p) { p.stock = Math.max(0, p.stock - i.qty); p.sales = (p.sales || 0) + i.qty; }
    });
    DB.saveProducts(productsList);

    DB.saveCart([]);
    updateCartCount();

    document.getElementById("checkoutFormWrap").style.display = "none";
    document.getElementById("checkoutSuccessWrap").style.display = "block";
    document.getElementById("successOrderId").textContent = `Order ID: ${order.id}`;
  });
}