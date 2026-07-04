/* ============================================================
   All Reviews Page — reviews.html
   Note: data.js aur common.js pehle load hote hain.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("allReviewsGrid");
  if (!grid) return;
  const reviews = [...DB.getReviews()].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (reviews.length === 0) {
    grid.innerHTML = `<div class="empty-state">Abhi tak koi review nahi mila. Sab se pehle review dene wale bnein!</div>`;
    return;
  }

  grid.innerHTML = reviews.map(r => `
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
});

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