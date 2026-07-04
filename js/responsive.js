/* ============================================================
   Faisalabad Textile Mills — Responsive Behaviour
   Load this AFTER common.js (and AFTER data.js) on every page.
   Handles:
   1. Pinch/double-tap zoom lock (site stays fixed, no zoom)
   2. Mobile nav-drawer backdrop (.nav-scrim) for the hamburger menu
   3. Fixed mobile bottom nav bar (Home / Shop / About / Contact)
   4. "All Listings" grid toolbar — 1/2/3 column view switch + Sort
   Exposes window.FTMResponsive.onGridRendered(grid) so store.js /
   shop.js can tell this file whenever a product grid is re-drawn
   (category filter click etc.) so the current view/sort choice
   gets re-applied to the fresh cards.
   ============================================================ */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     1. ZOOM LOCK
     The viewport meta tag (maximum-scale=1, user-scalable=no)
     already blocks most zooming. iOS Safari still allows a
     pinch gesture and a fast double-tap to zoom even with that
     meta tag, so we belt-and-braces it here.
  --------------------------------------------------------- */
  function lockZoom() {
    // Block pinch-zoom (2+ finger gesture)
    document.addEventListener("touchmove", function (e) {
      if (e.touches && e.touches.length > 1) e.preventDefault();
    }, { passive: false });

    // Block iOS Safari's gesture events (pinch) entirely
    document.addEventListener("gesturestart", function (e) { e.preventDefault(); });
    document.addEventListener("gesturechange", function (e) { e.preventDefault(); });
    document.addEventListener("gestureend", function (e) { e.preventDefault(); });

    // Block double-tap-to-zoom without blocking normal double clicks on inputs
    let lastTouchEnd = 0;
    document.addEventListener("touchend", function (e) {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    }, { passive: false });

    // Ctrl/Cmd + wheel (trackpad / mouse zoom) and Ctrl +/- keys
    document.addEventListener("wheel", function (e) {
      if (e.ctrlKey) e.preventDefault();
    }, { passive: false });
    document.addEventListener("keydown", function (e) {
      const key = e.key;
      if ((e.ctrlKey || e.metaKey) && (key === "+" || key === "-" || key === "=" || key === "0")) {
        e.preventDefault();
      }
    });
  }

  /* ---------------------------------------------------------
     2. NAV-DRAWER SCRIM (mobile hamburger backdrop)
     common.js already toggles `.main-nav.open` on menuToggle
     click. We add a dark backdrop behind it that also closes
     the drawer when tapped, and lock page scroll while open.
  --------------------------------------------------------- */
  function setupNavScrim() {
    const menuToggle = document.getElementById("menuToggle");
    const mainNav = document.getElementById("mainNav");
    if (!menuToggle || !mainNav) return;

    let scrim = document.querySelector(".nav-scrim");
    if (!scrim) {
      scrim = document.createElement("div");
      scrim.className = "nav-scrim";
      document.body.appendChild(scrim);
    }

    function sync() {
      const isOpen = mainNav.classList.contains("open");
      scrim.classList.toggle("open", isOpen);
      document.body.classList.toggle("nav-open", isOpen);
    }

    menuToggle.addEventListener("click", () => setTimeout(sync, 0));
    scrim.addEventListener("click", () => {
      mainNav.classList.remove("open");
      sync();
    });
    // Close drawer whenever a nav link inside it is followed
    mainNav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        sync();
      });
    });
  }

  /* ---------------------------------------------------------
     3. MOBILE BOTTOM NAV
     Fixed tab bar shown only on small screens (see
     responsive.css). Skipped on the admin panel, which has
     its own layout.
  --------------------------------------------------------- */
  const BOTTOM_NAV_LINKS = [
    {
      href: "index.html", match: ["", "index.html"], label: "Home",
      icon: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9"/></svg>'
    },
    {
      href: "shop.html", match: ["shop.html"], label: "Shop",
      icon: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>'
    },
    {
      href: "about.html", match: ["about.html"], label: "About",
      icon: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.7" r="0.9" fill="currentColor" stroke="none"/></svg>'
    },
    {
      href: "contact.html", match: ["contact.html"], label: "Contact",
      icon: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H7l-3 3V5Z"/><path d="M8 9h8M8 12h5"/></svg>'
    }
  ];

  function currentPageFile() {
    const path = window.location.pathname.split("/").pop();
    return path || "index.html";
  }

  function buildBottomNav() {
    if (document.body.classList.contains("admin-body")) return; // admin has its own layout
    if (document.querySelector(".mobile-bottom-nav")) return; // already built

    const page = currentPageFile();
    const nav = document.createElement("nav");
    nav.className = "mobile-bottom-nav";
    nav.setAttribute("aria-label", "Primary mobile navigation");

    nav.innerHTML = BOTTOM_NAV_LINKS.map(item => {
      const active = item.match.indexOf(page) !== -1;
      return `<a href="${item.href}" class="mbn-link${active ? " active" : ""}">
        <span class="mbn-icon">${item.icon}</span>
        <span class="mbn-label">${item.label}</span>
      </a>`;
    }).join("");

    document.body.appendChild(nav);
    document.body.classList.add("has-bottom-nav");
  }

  /* ---------------------------------------------------------
     4. GRID VIEW TOGGLE (1/2/3 columns) + SORT
     Works for every `.grid-view-toolbar` on the page, paired
     with the `.product-grid` whose id matches `data-target`.
     Preference (view + sort) is remembered per grid id via
     localStorage, and re-applied automatically whenever the
     grid is re-rendered (see onGridRendered below).
  --------------------------------------------------------- */
  const gridState = {}; // { [targetId]: { view: "2", sort: "default" } }

  function storageKey(targetId) { return "ftm_grid_pref_" + targetId; }

  function loadPref(targetId) {
    if (gridState[targetId]) return gridState[targetId];
    let pref = { view: "2", sort: "default" };
    try {
      const raw = localStorage.getItem(storageKey(targetId));
      if (raw) pref = Object.assign(pref, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    gridState[targetId] = pref;
    return pref;
  }

  function savePref(targetId, pref) {
    gridState[targetId] = pref;
    try { localStorage.setItem(storageKey(targetId), JSON.stringify(pref)); } catch (e) { /* ignore */ }
  }

  function applyView(grid, toolbar, view) {
    grid.classList.remove("view-1", "view-2", "view-3");
    grid.classList.add("view-" + view);
    toolbar.querySelectorAll(".view-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });
  }

  function applySort(grid, sort) {
    const cards = Array.from(grid.querySelectorAll(".product-card"));
    if (!cards.length) return;

    cards.sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return Number(a.dataset.price || 0) - Number(b.dataset.price || 0);
        case "price-desc":
          return Number(b.dataset.price || 0) - Number(a.dataset.price || 0);
        case "newest":
          return Number(b.dataset.created || 0) - Number(a.dataset.created || 0);
        case "name-asc":
          return (a.dataset.name || "").localeCompare(b.dataset.name || "");
        default: // "default" / Featured — original render order
          return Number(a.dataset.order || 0) - Number(b.dataset.order || 0);
      }
    });

    cards.forEach(card => grid.appendChild(card));
  }

  function wireToolbar(toolbar) {
    const targetId = toolbar.dataset.target;
    const grid = document.getElementById(targetId);
    if (!grid) return;
    const pref = loadPref(targetId);

    // Sync select value with saved preference
    const select = toolbar.querySelector(".sort-select");
    if (select) select.value = pref.sort;

    applyView(grid, toolbar, pref.view);
    applySort(grid, pref.sort);

    toolbar.querySelectorAll(".view-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        pref.view = view;
        savePref(targetId, pref);
        applyView(grid, toolbar, view);
      });
    });

    if (select) {
      select.addEventListener("change", () => {
        pref.sort = select.value;
        savePref(targetId, pref);
        applySort(grid, pref.sort);
      });
    }
  }

  function initToolbars() {
    document.querySelectorAll(".grid-view-toolbar").forEach(wireToolbar);
  }

  // Called by store.js / shop.js right after a grid's innerHTML
  // is rebuilt (e.g. category pill filter), so the user's chosen
  // column view + sort survive the re-render.
  function onGridRendered(grid) {
    if (!grid || !grid.id) return;
    const toolbar = document.querySelector('.grid-view-toolbar[data-target="' + grid.id + '"]');
    if (!toolbar) return;
    const pref = loadPref(grid.id);
    applyView(grid, toolbar, pref.view);
    applySort(grid, pref.sort);
  }

  window.FTMResponsive = { onGridRendered };

  /* ---------------------------------------------------------
     Init
  --------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    lockZoom();
    setupNavScrim();
    buildBottomNav();
    initToolbars();
  });
})();
