/* ==========================================================================
   AKSHAY STORE (AKSHAY TRADERS) — Interactive E-Commerce & Motion Engine
   ========================================================================== */

(function () {
  "use strict";

  const state = {
    category: "all",
    brand: "all",
    search: "",
    sort: "featured",
    heroIndex: 0,
    heroTimer: null,
    quizConcern: "glow",
    bag: loadStorage("akshay_bag", []),
    wishlist: loadStorage("akshay_wishlist", [])
  };

  function loadStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore storage errors on restricted file:// environments
    }
  }

  /* --------------------------------------------------------------------------
     TOAST NOTIFICATIONS
     -------------------------------------------------------------------------- */
  let toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  /* --------------------------------------------------------------------------
     HERO CAROUSEL (Auto-sliding + Ken Burns + Pause on Hover)
     -------------------------------------------------------------------------- */
  function initHeroSlider() {
    const slides = document.querySelectorAll(".hero-slide");
    const dots = document.querySelectorAll(".hero-dot");
    const slider = document.getElementById("heroSlider");
    if (!slides.length) return;

    function goTo(index) {
      state.heroIndex = (index + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle("active", i === state.heroIndex));
      dots.forEach((d, i) => d.classList.toggle("active", i === state.heroIndex));
    }

    function startAuto() {
      stopAuto();
      state.heroTimer = setInterval(() => goTo(state.heroIndex + 1), 5400);
    }

    function stopAuto() {
      if (state.heroTimer) clearInterval(state.heroTimer);
    }

    document.getElementById("heroPrev")?.addEventListener("click", () => {
      goTo(state.heroIndex - 1);
      startAuto();
    });
    document.getElementById("heroNext")?.addEventListener("click", () => {
      goTo(state.heroIndex + 1);
      startAuto();
    });

    dots.forEach((dot, idx) => {
      dot.addEventListener("click", () => {
        goTo(idx);
        startAuto();
      });
    });

    slider?.addEventListener("mouseenter", stopAuto);
    slider?.addEventListener("mouseleave", startAuto);

    startAuto();
  }

  /* --------------------------------------------------------------------------
     RENDER CATEGORY BUBBLES
     -------------------------------------------------------------------------- */
  function renderCategoryBubbles() {
    const container = document.getElementById("categoryBubbles");
    if (!container) return;
    container.innerHTML = CATEGORY_BUBBLES.map(c => `
      <button class="cat-bubble" data-cat-jump="${escapeAttr(c.id)}" aria-label="Shop ${escapeAttr(c.label)}">
        <span class="cat-bubble__ring">
          <img src="${c.img}" alt="${escapeAttr(c.label)}" loading="lazy" />
        </span>
        <span class="cat-bubble__label">${escapeHtml(c.label)}</span>
      </button>
    `).join("");

    container.querySelectorAll("[data-cat-jump]").forEach(btn => {
      btn.addEventListener("click", () => {
        const cat = btn.getAttribute("data-cat-jump");
        state.category = cat;
        state.brand = "all";
        syncFilterUI();
        renderProducts();
        document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  /* --------------------------------------------------------------------------
     RENDER DUAL-ROW MOVING IMAGE REELS (ALL 17 STUDIO IMAGES IN MOTION!)
     -------------------------------------------------------------------------- */
  function renderMovingReels() {
    const row1 = document.getElementById("reelRow1");
    const row2 = document.getElementById("reelRow2");
    if (!row1 || !row2) return;

    const firstHalf = STUDIO_GALLERY.slice(0, 9);
    const secondHalf = STUDIO_GALLERY.slice(8, 17);

    const buildCards = items => items.map(item => `
      <div class="reel-card" data-lightbox-id="${item.id}" role="button" tabindex="0" aria-label="View ${escapeAttr(item.title)}">
        <img src="${item.img}" alt="${escapeAttr(item.title)}" loading="lazy" />
        <div class="reel-card__caption">
          <div class="reel-card__brand">${escapeHtml(item.brand)}</div>
          <div class="reel-card__title">${escapeHtml(item.title)}</div>
        </div>
      </div>
    `).join("");

    // Duplicate items seamlessly for continuous infinite CSS marquee loop
    row1.innerHTML = buildCards(firstHalf) + buildCards(firstHalf);
    row2.innerHTML = buildCards(secondHalf) + buildCards(secondHalf);
  }

  /* --------------------------------------------------------------------------
     RENDER AI-GENERATED INDIAN BEAUTY MODEL LOOKBOOK
     -------------------------------------------------------------------------- */
  function renderLookbook() {
    const container = document.getElementById("lookbookGrid");
    if (!container) return;

    container.innerHTML = LOOKBOOK_RITUALS.map(look => `
      <article class="look-card reveal">
        <div class="look-card__media">
          <img src="${look.modelImg}" alt="${escapeAttr(look.title)}" loading="lazy" />
          <span class="look-card__tag">${escapeHtml(look.tag)}</span>
          <div class="look-card__demo-pill">
            <img src="${look.featuredProductImg}" alt="${escapeAttr(look.featuredProductName)}" loading="lazy" />
            <div class="look-card__demo-info">
              <div class="look-card__demo-sub">${escapeHtml(look.featuredProductSub)}</div>
              <div class="look-card__demo-name">${escapeHtml(look.featuredProductName)}</div>
            </div>
            <button class="look-card__demo-btn" data-add-id="${look.featuredProductId}">+ Bag</button>
          </div>
        </div>
        <div class="look-card__body">
          <h3 class="look-card__title">${escapeHtml(look.title)}</h3>
          <p class="look-card__text">${escapeHtml(look.text)}</p>
          <div class="look-card__brands">
            ${look.brands.map(b => `<button class="look-chip" data-brand-jump="${escapeAttr(b)}">${escapeHtml(b)} →</button>`).join("")}
          </div>
        </div>
      </article>
    `).join("");

    container.querySelectorAll("[data-brand-jump]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.brand = btn.getAttribute("data-brand-jump");
        state.category = "all";
        syncFilterUI();
        renderProducts();
        document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  /* --------------------------------------------------------------------------
     RENDER 10 ICONIC BRAND MINI-CARDS
     -------------------------------------------------------------------------- */
  function renderBrandPills() {
    const container = document.getElementById("brandPillsGrid");
    if (!container) return;

    container.innerHTML = BRAND_HOUSES.map(b => `
      <button class="brand-card-mini ${state.brand === b.name ? "active" : ""}" data-brand-select="${escapeAttr(b.name)}">
        <img src="${b.img}" alt="${escapeAttr(b.name)}" loading="lazy" />
        <div>
          <div class="brand-card-mini__name">${escapeHtml(b.shortName)}</div>
          <div class="brand-card-mini__sub">${escapeHtml(b.tagline.split("•").slice(0, 2).join("•"))}</div>
        </div>
      </button>
    `).join("");

    container.querySelectorAll("[data-brand-select]").forEach(btn => {
      btn.addEventListener("click", () => {
        const selected = btn.getAttribute("data-brand-select");
        state.brand = state.brand === selected ? "all" : selected;
        state.category = "all";
        syncFilterUI();
        renderProducts();
        document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  /* --------------------------------------------------------------------------
     CATALOG FILTER CONTROLS & PRODUCT CARDS
     -------------------------------------------------------------------------- */
  function initCatalogControls() {
    const catWrap = document.getElementById("catalogCatTabs");
    const brandWrap = document.getElementById("catalogBrandChips");
    const sortSelect = document.getElementById("catalogSort");

    const categories = [
      "all",
      "Hair Care & Oils",
      "Skin & Face Care",
      "Hair Colour",
      "Salon & Hair Removal",
      "Mehndi & Henna",
      "Fragrance & Grooming",
      "Bath & Hygiene"
    ];

    if (catWrap) {
      catWrap.innerHTML = categories.map(cat => `
        <button class="cat-tab ${state.category === cat ? "active" : ""}" data-cat="${escapeAttr(cat)}">
          ${cat === "all" ? "All Categories" : escapeHtml(cat)}
        </button>
      `).join("");

      catWrap.querySelectorAll(".cat-tab").forEach(btn => {
        btn.addEventListener("click", () => {
          state.category = btn.getAttribute("data-cat");
          syncFilterUI();
          renderProducts();
        });
      });
    }

    if (brandWrap) {
      const brandNames = ["all", ...BRAND_HOUSES.map(b => b.name)];
      brandWrap.innerHTML = brandNames.map(b => `
        <button class="brand-chip ${state.brand === b ? "active" : ""}" data-brand="${escapeAttr(b)}">
          ${b === "all" ? "All 10 Brands" : escapeHtml(b.replace("Procter & Gamble (P&G)", "P&G").replace("Consumer Care", "").replace("Herbals", "").trim())}
        </button>
      `).join("");

      brandWrap.querySelectorAll(".brand-chip").forEach(btn => {
        btn.addEventListener("click", () => {
          state.brand = btn.getAttribute("data-brand");
          syncFilterUI();
          renderProducts();
        });
      });
    }

    sortSelect?.addEventListener("change", e => {
      state.sort = e.target.value;
      renderProducts();
    });

    // Global Search input
    const searchInput = document.getElementById("globalSearch");
    const clearBtn = document.getElementById("clearSearchBtn");

    searchInput?.addEventListener("input", e => {
      state.search = e.target.value.trim();
      clearBtn?.classList.toggle("visible", state.search.length > 0);
      renderProducts();
    });

    searchInput?.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
      }
    });

    clearBtn?.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      state.search = "";
      clearBtn.classList.remove("visible");
      renderProducts();
    });
  }

  function syncFilterUI() {
    document.querySelectorAll(".cat-tab").forEach(el => {
      el.classList.toggle("active", el.getAttribute("data-cat") === state.category);
    });
    document.querySelectorAll(".brand-chip").forEach(el => {
      el.classList.toggle("active", el.getAttribute("data-brand") === state.brand);
    });
    document.querySelectorAll(".brand-card-mini").forEach(el => {
      el.classList.toggle("active", el.getAttribute("data-brand-select") === state.brand);
    });
  }

  function getFilteredProducts() {
    const q = state.search.toLowerCase();
    let list = PRODUCTS.filter(p => {
      const catOk = state.category === "all" || p.category === state.category;
      const brandOk = state.brand === "all" || p.brand === state.brand;
      const searchOk = !q ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.subBrand.toLowerCase().includes(q) ||
        p.variants.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q));
      return catOk && brandOk && searchOk;
    });

    if (state.sort === "brand-az") {
      list = [...list].sort((a, b) => a.brand.localeCompare(b.brand));
    } else if (state.sort === "name-az") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (state.sort === "rating") {
      list = [...list].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    }

    return list;
  }

  function renderProducts() {
    const grid = document.getElementById("productGrid");
    const countEl = document.getElementById("catalogCount");
    if (!grid) return;

    const list = getFilteredProducts();
    if (countEl) {
      countEl.textContent = `Showing ${list.length} of ${PRODUCTS.length} product ranges`;
    }

    if (!list.length) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 52px 20px; background: var(--cream); border-radius: 18px; border: 1px dashed var(--border);">
          <h3 style="font-family: var(--font-serif); font-size: 28px; margin-bottom: 8px;">No exact match found</h3>
          <p style="color: var(--muted); margin-bottom: 18px;">Try clearing your search or ask Akshay Store directly on WhatsApp — we stock full retail & wholesale assortments!</p>
          <button class="btn btn-primary" id="resetCatalogBtn">Show All 10 Brands</button>
        </div>
      `;
      document.getElementById("resetCatalogBtn")?.addEventListener("click", () => {
        state.category = "all";
        state.brand = "all";
        state.search = "";
        const s = document.getElementById("globalSearch");
        if (s) s.value = "";
        document.getElementById("clearSearchBtn")?.classList.remove("visible");
        syncFilterUI();
        renderProducts();
      });
      return;
    }

    grid.innerHTML = list.map(p => {
      const inBag = state.bag.find(item => item.id === p.id);
      const isWish = state.wishlist.includes(p.id);
      return `
        <article class="product-card">
          <div class="product-card__media" data-quickview-id="${p.id}">
            <img src="${p.img}" alt="${escapeAttr(p.name)}" loading="lazy" />
            <div class="product-card__badges">
              <span class="p-badge p-badge--${p.badgeType}">${escapeHtml(p.badge)}</span>
            </div>
            <button class="product-card__wish ${isWish ? "active" : ""}" data-wish-id="${p.id}" aria-label="Save to Wishlist">
              ${isWish ? "♥" : "♡"}
            </button>
            <span class="product-card__quick">Quick View</span>
          </div>
          <div class="product-card__body">
            <div class="product-card__brand">
              <span>${escapeHtml(p.subBrand)} · ${escapeHtml(p.brand.replace("Procter & Gamble (P&G)", "P&G"))}</span>
              <span class="product-card__rating"><span>★</span> ${p.rating}</span>
            </div>
            <h3 class="product-card__title" data-quickview-id="${p.id}">${escapeHtml(p.name)}</h3>
            <p class="product-card__variants">${escapeHtml(p.variants)}</p>
            <div class="product-card__tags">
              ${p.tags.map(t => `<span class="product-card__tag">${escapeHtml(t)}</span>`).join("")}
            </div>
            <div class="product-card__footer">
              <span class="product-card__pack-note">${escapeHtml(p.packInfo)}</span>
              <button class="add-bag-btn ${inBag ? "in-bag" : ""}" data-add-id="${p.id}">
                ${inBag ? `In Bag (${inBag.qty})` : "Add to Bag"}
              </button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  /* --------------------------------------------------------------------------
     AI KIND-STYLE ROUTINE FINDER QUIZ
     -------------------------------------------------------------------------- */
  function initRoutineQuiz() {
    const opts = document.querySelectorAll("[data-quiz-concern]");
    opts.forEach(btn => {
      btn.addEventListener("click", () => {
        state.quizConcern = btn.getAttribute("data-quiz-concern");
        opts.forEach(o => o.classList.toggle("active", o === btn));
        renderQuizRecommendation();
      });
    });
    renderQuizRecommendation();
  }

  function renderQuizRecommendation() {
    const profile = QUIZ_PROFILES[state.quizConcern] || QUIZ_PROFILES.glow;
    const imgEl = document.getElementById("quizModelImg");
    const badgeEl = document.getElementById("quizBadgeText");
    const resultsEl = document.getElementById("quizResults");
    const addAllBtn = document.getElementById("quizAddAllBtn");

    if (imgEl) imgEl.src = profile.modelImg;
    if (badgeEl) badgeEl.innerHTML = `<strong>${escapeHtml(profile.title)}</strong><br>${escapeHtml(profile.note)}`;

    const recs = profile.productIds.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
    if (resultsEl) {
      resultsEl.innerHTML = recs.map(p => `
        <div class="quiz-rec-card">
          <img src="${p.img}" alt="${escapeAttr(p.name)}" loading="lazy" />
          <div class="quiz-rec-card__body">
            <div class="quiz-rec-card__name">${escapeHtml(p.subBrand)} — ${escapeHtml(p.name.split(" ").slice(0, 5).join(" "))}</div>
            <button class="quiz-rec-card__btn" data-add-id="${p.id}">+ Add to Bag</button>
          </div>
        </div>
      `).join("");
    }

    if (addAllBtn) {
      addAllBtn.onclick = () => {
        recs.forEach(p => addToBag(p.id, true));
        showToast(`Added all ${recs.length} routine essentials to your bag!`);
        openBagDrawer();
      };
    }
  }

  /* --------------------------------------------------------------------------
     COMPLETE 10-BRAND HOUSES DIRECTORY
     -------------------------------------------------------------------------- */
  function renderBrandDirectory() {
    const container = document.getElementById("directoryGrid");
    if (!container) return;

    container.innerHTML = BRAND_HOUSES.map(house => {
      const waMsg = encodeURIComponent(`Hello Akshay Store! I would like to know retail/wholesale prices & stock availability for ${house.name} products (${house.tagline}).`);
      return `
        <div class="house-card reveal">
          <div class="house-card__top">
            <img class="house-card__thumb" src="${house.img}" alt="${escapeAttr(house.name)}" loading="lazy" />
            <div>
              <div class="house-card__num">Partner Brand ${house.number}</div>
              <h3 class="house-card__name">${escapeHtml(house.name)}</h3>
            </div>
          </div>
          <ul class="house-card__list">
            ${house.lines.map(l => `<li><strong>${escapeHtml(l.group)}:</strong> ${escapeHtml(l.detail)}</li>`).join("")}
          </ul>
          <div class="house-card__actions">
            <button class="btn btn-outline" style="padding: 8px 16px; font-size: 13px;" data-dir-filter="${escapeAttr(house.name)}">
              Explore ${escapeHtml(house.shortName)} Cards
            </button>
            <a class="btn btn-mint" style="padding: 8px 16px; font-size: 13px;" href="https://wa.me/${STORE_INFO.whatsappNumber}?text=${waMsg}" target="_blank" rel="noopener">
              WhatsApp Stock Inquiry
            </a>
          </div>
        </div>
      `;
    }).join("");

    container.querySelectorAll("[data-dir-filter]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.brand = btn.getAttribute("data-dir-filter");
        state.category = "all";
        syncFilterUI();
        renderProducts();
        document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  /* --------------------------------------------------------------------------
     ALL 17 STUDIO GALLERY BENTO SHOWCASE
     -------------------------------------------------------------------------- */
  function renderStudioGallery() {
    const container = document.getElementById("studioGalleryGrid");
    if (!container) return;

    container.innerHTML = STUDIO_GALLERY.map((item, idx) => `
      <div class="gallery-item ${item.wide ? "gallery-item--wide" : ""} reveal" data-lightbox-id="${item.id}" role="button" tabindex="0">
        <img src="${item.img}" alt="${escapeAttr(item.title)}" loading="lazy" />
        <div class="gallery-item__overlay">
          <div>
            <div class="gallery-item__brand">${escapeHtml(item.brand)} • #${String(idx + 1).padStart(2, "0")}</div>
            <div class="gallery-item__title">${escapeHtml(item.title)}</div>
          </div>
          <span style="font-size: 11px; padding: 4px 9px; border-radius: 99px; background: rgba(255,255,255,0.2); backdrop-filter: blur(4px);">Zoom ↗</span>
        </div>
      </div>
    `).join("");
  }

  /* --------------------------------------------------------------------------
     SHOPPING BAG & WISHLIST LOGIC + WHATSAPP INSTANT ORDER
     -------------------------------------------------------------------------- */
  function addToBag(productId, silent = false) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existing = state.bag.find(i => i.id === productId);
    if (existing) {
      existing.qty += 1;
    } else {
      state.bag.push({ id: productId, qty: 1 });
    }
    saveStorage("akshay_bag", state.bag);
    updateCounters(true);
    renderProducts();
    renderBagDrawer();
    if (!silent) showToast(`Added "${product.subBrand}" to your order bag!`);
  }

  function changeQty(productId, delta) {
    const idx = state.bag.findIndex(i => i.id === productId);
    if (idx === -1) return;
    state.bag[idx].qty += delta;
    if (state.bag[idx].qty <= 0) {
      state.bag.splice(idx, 1);
    }
    saveStorage("akshay_bag", state.bag);
    updateCounters(false);
    renderProducts();
    renderBagDrawer();
  }

  function toggleWishlist(productId) {
    const idx = state.wishlist.indexOf(productId);
    if (idx > -1) {
      state.wishlist.splice(idx, 1);
      showToast("Removed from saved favourites");
    } else {
      state.wishlist.push(productId);
      showToast("Saved to your favourites ♥");
    }
    saveStorage("akshay_wishlist", state.wishlist);
    updateCounters(false);
    renderProducts();
  }

  function updateCounters(bumpBag) {
    const totalItems = state.bag.reduce((sum, i) => sum + i.qty, 0);
    const bagBadge = document.getElementById("bagCount");
    const wishBadge = document.getElementById("wishCount");

    if (bagBadge) {
      bagBadge.textContent = totalItems;
      if (bumpBag) {
        bagBadge.classList.add("bump");
        setTimeout(() => bagBadge.classList.remove("bump"), 250);
      }
    }
    if (wishBadge) {
      wishBadge.textContent = state.wishlist.length;
    }
  }

  function renderBagDrawer() {
    const wrap = document.getElementById("bagItemsList");
    const summaryEl = document.getElementById("bagItemSummary");
    if (!wrap) return;

    const totalUnits = state.bag.reduce((s, i) => s + i.qty, 0);
    if (summaryEl) {
      summaryEl.textContent = `${state.bag.length} product ranges • ${totalUnits} total pack(s)`;
    }

    if (!state.bag.length) {
      wrap.innerHTML = `
        <div style="text-align:center; padding: 48px 18px; color: var(--muted);">
          <div style="font-size: 42px; margin-bottom: 10px;">🛍️</div>
          <h4 style="font-family: var(--font-serif); font-size: 24px; color: var(--ink); margin-bottom: 6px;">Your order bag is empty</h4>
          <p style="font-size: 13.5px; margin-bottom: 18px;">Add skincare, haircare, mehndi, fragrance or salon packs and place your order directly on WhatsApp with Akshay Store!</p>
          <button class="btn btn-primary" id="emptyBagExploreBtn">Explore Products</button>
        </div>
      `;
      document.getElementById("emptyBagExploreBtn")?.addEventListener("click", () => {
        closeBagDrawer();
        document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
      });
      return;
    }

    wrap.innerHTML = state.bag.map(entry => {
      const p = PRODUCTS.find(x => x.id === entry.id);
      if (!p) return "";
      return `
        <div class="bag-item">
          <img src="${p.img}" alt="${escapeAttr(p.name)}" />
          <div class="bag-item__info">
            <div class="bag-item__brand">${escapeHtml(p.brand)}</div>
            <div class="bag-item__name">${escapeHtml(p.name)}</div>
            <div class="bag-item__variant">${escapeHtml(p.packInfo)}</div>
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <div class="qty-control">
                <button data-qty-minus="${p.id}" aria-label="Decrease quantity">−</button>
                <span style="font-size:13px; font-weight:700;">${entry.qty}</span>
                <button data-qty-plus="${p.id}" aria-label="Increase quantity">+</button>
              </div>
              <button data-qty-remove="${p.id}" style="font-size:12px; color:var(--coral); font-weight:600;">Remove</button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    wrap.querySelectorAll("[data-qty-minus]").forEach(b => b.addEventListener("click", () => changeQty(b.getAttribute("data-qty-minus"), -1)));
    wrap.querySelectorAll("[data-qty-plus]").forEach(b => b.addEventListener("click", () => changeQty(b.getAttribute("data-qty-plus"), 1)));
    wrap.querySelectorAll("[data-qty-remove]").forEach(b => b.addEventListener("click", () => changeQty(b.getAttribute("data-qty-remove"), -999)));
  }

  function buildOrderMessage() {
    const custName = document.getElementById("bagCustomerName")?.value.trim() || "Customer";
    const orderMode = document.getElementById("bagOrderMode")?.value || "Store Pickup (Khaniyadhana)";
    const lines = [
      `Hello *Akshay Store (Khaniyadhana)*!`,
      `I would like to order / check rates for the following items:`,
      ``,
      ...state.bag.map((entry, idx) => {
        const p = PRODUCTS.find(x => x.id === entry.id);
        return `${idx + 1}. *${p?.subBrand}* — ${p?.name} (${p?.brand}) × Qty: ${entry.qty}`;
      }),
      ``,
      `*Name:* ${custName}`,
      `*Order Type:* ${orderMode}`,
      `Please confirm availability and best price. Thank you!`
    ];
    return lines.join("\n");
  }

  function openBagDrawer() {
    renderBagDrawer();
    document.getElementById("drawerBackdrop")?.classList.add("open");
    document.getElementById("bagDrawer")?.classList.add("open");
  }

  function closeBagDrawer() {
    document.getElementById("drawerBackdrop")?.classList.remove("open");
    document.getElementById("bagDrawer")?.classList.remove("open");
  }

  /* --------------------------------------------------------------------------
     QUICK VIEW PRODUCT MODAL & STUDIO LIGHTBOX
     -------------------------------------------------------------------------- */
  function openQuickView(productId) {
    const p = PRODUCTS.find(x => x.id === productId);
    const modal = document.getElementById("quickViewModal");
    const content = document.getElementById("quickViewContent");
    if (!p || !modal || !content) return;

    const waSingle = encodeURIComponent(`Hello Akshay Store! Please share pack sizes & price for: ${p.name} (${p.brand}) — Variants: ${p.variants}`);
    content.innerHTML = `
      <div class="modal-card__img">
        <img src="${p.img}" alt="${escapeAttr(p.name)}" />
      </div>
      <div class="modal-card__body">
        <span class="p-badge p-badge--${p.badgeType}" style="align-self:flex-start;">${escapeHtml(p.badge)} • ★ ${p.rating}</span>
        <div style="font-size:12.5px; font-weight:700; color:var(--coral); text-transform:uppercase; letter-spacing:0.08em;">
          ${escapeHtml(p.brand)} — ${escapeHtml(p.category)}
        </div>
        <h3 style="font-family:var(--font-serif); font-size:30px; line-height:1.1;">${escapeHtml(p.name)}</h3>
        <p style="font-size:14px; color:var(--ink-2); line-height:1.55;">
          <strong>Available Variants & Stock:</strong><br>${escapeHtml(p.variants)}
        </p>
        <div style="background:var(--mint-soft); border:1px solid #B8EFE9; padding:10px 14px; border-radius:11px; font-size:13px; color:#116E64;">
          <strong>Pack Options:</strong> ${escapeHtml(p.packInfo)} • 100% Genuine Stock at Akshay Store, Khaniyadhana
        </div>
        <div class="product-card__tags" style="margin:4px 0;">
          ${p.tags.map(t => `<span class="product-card__tag">${escapeHtml(t)}</span>`).join("")}
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:auto; padding-top:10px;">
          <button class="btn btn-primary" style="flex:1;" id="qvAddBtn">+ Add to Order Bag</button>
          <a class="btn btn-mint" href="https://wa.me/${STORE_INFO.whatsappNumber}?text=${waSingle}" target="_blank" rel="noopener">WhatsApp Price</a>
        </div>
      </div>
    `;

    document.getElementById("qvAddBtn")?.addEventListener("click", () => {
      addToBag(p.id);
      modal.classList.remove("open");
    });

    modal.classList.add("open");
  }

  function openLightbox(galleryId) {
    const item = STUDIO_GALLERY.find(g => g.id === galleryId);
    const modal = document.getElementById("lightboxModal");
    if (!item || !modal) return;

    document.getElementById("lightboxImg").src = item.img;
    document.getElementById("lightboxImg").alt = item.title;
    document.getElementById("lightboxTitle").textContent = item.title;
    document.getElementById("lightboxBrand").textContent = `${item.brand} • ${item.category}`;

    const filterBtn = document.getElementById("lightboxFilterBtn");
    if (filterBtn) {
      filterBtn.onclick = () => {
        modal.classList.remove("open");
        state.brand = item.linkedBrand || "all";
        state.category = "all";
        syncFilterUI();
        renderProducts();
        document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
      };
    }

    modal.classList.add("open");
  }

  /* --------------------------------------------------------------------------
     WHOLESALE / SALON BULK INQUIRY FORM
     -------------------------------------------------------------------------- */
  function initWholesaleForm() {
    const form = document.getElementById("wholesaleForm");
    if (!form) return;
    form.addEventListener("submit", e => {
      e.preventDefault();
      const name = document.getElementById("wfName").value.trim();
      const phone = document.getElementById("wfPhone").value.trim();
      const type = document.getElementById("wfType").value;
      const brand = document.getElementById("wfBrand").value;
      const note = document.getElementById("wfNote").value.trim();

      const msg = encodeURIComponent(
        `Hello *Akshay Store (Akshay Traders)*!\n` +
        `*New ${type} Inquiry*\n` +
        `Name: ${name}\n` +
        `Phone: ${phone}\n` +
        `Focus Brand: ${brand}\n` +
        `Requirement: ${note || "Please share wholesale/retail rate list & stock availability."}`
      );
      window.open(`https://wa.me/${STORE_INFO.whatsappNumber}?text=${msg}`, "_blank", "noopener");
      showToast("Opening WhatsApp with your inquiry to 9575556668!");
      form.reset();
    });
  }

  /* --------------------------------------------------------------------------
     GLOBAL EVENT DELEGATION & SCROLL ANIMATIONS
     -------------------------------------------------------------------------- */
  function initGlobalEvents() {
    // Delegated clicks for Add to Bag, Wishlist, Quick View, Lightbox
    document.addEventListener("click", e => {
      const addBtn = e.target.closest("[data-add-id]");
      if (addBtn) {
        e.stopPropagation();
        addToBag(addBtn.getAttribute("data-add-id"));
        return;
      }

      const wishBtn = e.target.closest("[data-wish-id]");
      if (wishBtn) {
        e.stopPropagation();
        toggleWishlist(wishBtn.getAttribute("data-wish-id"));
        return;
      }

      const qvEl = e.target.closest("[data-quickview-id]");
      if (qvEl) {
        openQuickView(qvEl.getAttribute("data-quickview-id"));
        return;
      }

      const lbEl = e.target.closest("[data-lightbox-id]");
      if (lbEl) {
        openLightbox(lbEl.getAttribute("data-lightbox-id"));
        return;
      }
    });

    // Header Bag & Wishlist triggers
    document.getElementById("openBagBtn")?.addEventListener("click", openBagDrawer);
    document.getElementById("closeBagBtn")?.addEventListener("click", closeBagDrawer);
    document.getElementById("drawerBackdrop")?.addEventListener("click", closeBagDrawer);

    document.getElementById("openWishBtn")?.addEventListener("click", () => {
      if (!state.wishlist.length) {
        showToast("Tap ♡ on any product to save your favourites!");
        return;
      }
      const names = state.wishlist.map(id => PRODUCTS.find(p => p.id === id)?.subBrand).filter(Boolean);
      showToast(`Saved (${names.length}): ${names.slice(0, 3).join(", ")}${names.length > 3 ? "..." : ""}`);
    });

    // Bag WhatsApp Checkout & Copy Order
    document.getElementById("whatsappOrderBtn")?.addEventListener("click", () => {
      if (!state.bag.length) {
        showToast("Please add at least one product to your bag first!");
        return;
      }
      const url = `https://wa.me/${STORE_INFO.whatsappNumber}?text=${encodeURIComponent(buildOrderMessage())}`;
      window.open(url, "_blank", "noopener");
    });

    document.getElementById("copyOrderBtn")?.addEventListener("click", () => {
      if (!state.bag.length) {
        showToast("Your bag is empty!");
        return;
      }
      const txt = buildOrderMessage();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(txt).then(() => showToast("Order list copied! Paste anytime on WhatsApp 9575556668."));
      } else {
        showToast("Order ready — tap WhatsApp Order button!");
      }
    });

    // Modal closers
    document.getElementById("closeQuickView")?.addEventListener("click", () => {
      document.getElementById("quickViewModal")?.classList.remove("open");
    });
    document.getElementById("quickViewModal")?.addEventListener("click", e => {
      if (e.target.id === "quickViewModal") e.target.classList.remove("open");
    });

    document.getElementById("closeLightbox")?.addEventListener("click", () => {
      document.getElementById("lightboxModal")?.classList.remove("open");
    });
    document.getElementById("lightboxModal")?.addEventListener("click", e => {
      if (e.target.id === "lightboxModal") e.target.classList.remove("open");
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        closeBagDrawer();
        document.getElementById("quickViewModal")?.classList.remove("open");
        document.getElementById("lightboxModal")?.classList.remove("open");
      }
    });

    // Sticky header elevation
    const header = document.getElementById("siteHeader");
    window.addEventListener("scroll", () => {
      header?.classList.toggle("scrolled", window.scrollY > 18);
    }, { passive: true });
  }

  function initScrollReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(el => el.classList.add("in-view"));
      return;
    }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });
    els.forEach(el => obs.observe(el));
  }

  /* --------------------------------------------------------------------------
     HELPERS
     -------------------------------------------------------------------------- */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  /* --------------------------------------------------------------------------
     BOOT
     -------------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initHeroSlider();
    renderCategoryBubbles();
    renderMovingReels();
    renderLookbook();
    renderBrandPills();
    initCatalogControls();
    renderProducts();
    initRoutineQuiz();
    renderBrandDirectory();
    renderStudioGallery();
    initWholesaleForm();
    initGlobalEvents();
    updateCounters(false);
    initScrollReveal();
  });
})();
