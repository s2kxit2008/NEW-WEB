// ===================================================
// DANGER PANEL PRO - CLIENT APPLICATION SCRIPT
// Interactive Store, Product Detail View, License Engine
// ===================================================

const API_BASE = "";

// Global Application State
let state = {
  user: {
    id: "demo_user",
    name: "wahida_parvin_r",
    email: "wahida@dangerpanel.shop",
    credits: 0.00,
    role: "USER",
    licenses: [
      {
        key: "RED-VIP-9999",
        product_id: "bloodstrike-panel",
        product_title: "BLOODSTRIKE PANEL",
        duration: "Life Time Access",
        claimed_at: "2026-09-08 00:00:00"
      }
    ]
  },
  products: [],
  categories: ["ALL", "ALL PANEL", "BLOODSTRIKE", "PUBG PANEL", "PUBG", "FREE FIRE", "PC PANEL", "Windows", "Emulators", "Android", "Utility"],
  selectedCategory: "ALL",
  searchQuery: "",
  downloads: {},
  activeView: "store", // "store" | "productDetail" | "downloads" | "profile" | "help"
  currentProductId: null,
  selectedPlanId: null,
  canDownload: true
};

// DOM Elements
const sidebarDrawer = document.getElementById("sidebarDrawer");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");

// Views
const storeView = document.getElementById("storeView");
const productDetailView = document.getElementById("productDetailView");
const downloadsView = document.getElementById("downloadsView");
const profileView = document.getElementById("profileView");
const helpView = document.getElementById("helpView");

// Navigation buttons
const navStoreBtn = document.getElementById("navStoreBtn");
const navProfileBtn = document.getElementById("navProfileBtn");
const navHelpBtn = document.getElementById("navHelpBtn");
const navDownloadsBtn = document.getElementById("navDownloadsBtn");
const navClaimKeyBtn = document.getElementById("navClaimKeyBtn");
const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn");
const backToProductsBtn = document.getElementById("backToProductsBtn");
const backToStoreFromDlBtn = document.getElementById("backToStoreFromDlBtn");
const claimAnotherKeyInDlBtn = document.getElementById("claimAnotherKeyInDlBtn");

// Store Elements
const categoryTabs = document.getElementById("categoryTabs");
const productsGrid = document.getElementById("productsGrid");
const searchInput = document.getElementById("searchInput");
const verifiedCountBadge = document.getElementById("verifiedCountBadge");

// Product Detail Elements
const productBreadcrumbs = document.getElementById("productBreadcrumbs");
const detailHeroImage = document.getElementById("detailHeroImage");
const detailBadgeFeatured = document.getElementById("detailBadgeFeatured");
const detailBadgePopular = document.getElementById("detailBadgePopular");
const detailCatTags = document.getElementById("detailCatTags");
const detailVipBadge = document.getElementById("detailVipBadge");
const detailProductTitle = document.getElementById("detailProductTitle");
const detailProductDesc = document.getElementById("detailProductDesc");
const detailRatingNum = document.getElementById("detailRatingNum");
const detailReviewsCount = document.getElementById("detailReviewsCount");
const detailPurchasesCount = document.getElementById("detailPurchasesCount");
const detailSafetyVal = document.getElementById("detailSafetyVal");
const detailUpdatesVal = document.getElementById("detailUpdatesVal");
const detailSupportVal = document.getElementById("detailSupportVal");
const detailPlanCardsList = document.getElementById("detailPlanCardsList");
const buyPlanMainBtn = document.getElementById("buyPlanMainBtn");
const buyPlanBtnText = document.getElementById("buyPlanBtnText");
const showcaseVideoCard = document.getElementById("showcaseVideoCard");
const videoThumbnailImg = document.getElementById("videoThumbnailImg");
const videoBadgeTitle = document.getElementById("videoBadgeTitle");
const videoPlayBtn = document.getElementById("videoPlayBtn");
const videoPreviewBox = document.getElementById("videoPreviewBox");
const tabMediaImages = document.getElementById("tabMediaImages");
const tabMediaVideo = document.getElementById("tabMediaVideo");
const mediaImagesCount = document.getElementById("mediaImagesCount");
const mediaVideoCount = document.getElementById("mediaVideoCount");
const tabOverviewBtn = document.getElementById("tabOverviewBtn");
const tabFeaturesBtn = document.getElementById("tabFeaturesBtn");
const tabOverviewContent = document.getElementById("tabOverviewContent");
const tabFeaturesContent = document.getElementById("tabFeaturesContent");
const overviewSpecsText = document.getElementById("overviewSpecsText");
const overviewTagsRow = document.getElementById("overviewTagsRow");
const overviewCompatText = document.getElementById("overviewCompatText");
const featuresListContainer = document.getElementById("featuresListContainer");
const detailLastUpdated = document.getElementById("detailLastUpdated");

// User & Wallet Elements
const userHandle = document.getElementById("userHandle");
const userAvatarCircle = document.getElementById("userAvatarCircle");
const userCreditAmount = document.getElementById("userCreditAmount");
const creditAvatar = document.getElementById("creditAvatar");
const creditWalletPill = document.getElementById("creditWalletPill");
const sidebarUserCard = document.getElementById("sidebarUserCard");
const downloadNavBadge = document.getElementById("downloadNavBadge");

// Modals
const purchaseModal = document.getElementById("purchaseModal");
const claimKeyModal = document.getElementById("claimKeyModal");
const loginModal = document.getElementById("loginModal");
const videoShowcaseModal = document.getElementById("videoShowcaseModal");
const videoIframe = document.getElementById("videoIframe");
const videoModalHeaderTitle = document.getElementById("videoModalHeaderTitle");
const toastContainer = document.getElementById("toastContainer");

// ===================================================
// INITIALIZATION
// ===================================================

document.addEventListener("DOMContentLoaded", async () => {
  // Load user from storage if available
  const savedUser = localStorage.getItem("dangerpanel_user");
  if (savedUser) {
    try {
      state.user = { ...state.user, ...JSON.parse(savedUser) };
    } catch (e) {
      console.error(e);
    }
  }
  updateUserUI();

  // Fetch store data
  await loadCategories();
  await loadProducts();
  await loadDownloads();

  // Setup UI handlers
  setupNavigation();
  setupCategoryFilter();
  setupModals();
  setupProductDetailTabs();
  setupSharing();

  // Handle URL hash routing
  handleHashRouting();
  window.addEventListener("hashchange", handleHashRouting);
});

// ===================================================
// TOAST NOTIFICATIONS
// ===================================================

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = "toast";
  const icon = type === "success" ? "✅" : type === "error" ? "❌" : "🔥";
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ===================================================
// DATA FETCHING
// ===================================================

async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/api/categories`);
    const data = await res.json();
    if (data.success && data.categories) {
      state.categories = data.categories;
    }
  } catch (err) {
    console.warn("Using fallback categories:", err);
  }
  renderCategoryTabs();
}

async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    const data = await res.json();
    if (data.success && data.products && data.products.length > 0) {
      state.products = data.products;
    }
  } catch (err) {
    console.warn("Failed to load products from API:", err);
  }
  
  if (verifiedCountBadge) {
    verifiedCountBadge.textContent = `${state.products.length} Verified`;
  }

  renderProducts();
}

async function loadDownloads() {
  try {
    const res = await fetch(`${API_BASE}/api/downloads`);
    const data = await res.json();
    if (data.success && data.downloads) {
      state.downloads = data.downloads;
      updateDownloadsUI();
    }
  } catch (err) {
    console.warn("Failed to load downloads:", err);
  }
}

function updateDownloadsUI() {
  if (!state.downloads) return;

  if (state.downloads.emulator) {
    const size = document.getElementById("emulatorSize");
    const ver = document.getElementById("emulatorVersion");
    const btn = document.getElementById("downloadEmulatorBtn");
    if (size) size.textContent = state.downloads.emulator.file_size || "420 MB";
    if (ver) ver.textContent = state.downloads.emulator.version || "v5.2.1";
    if (btn) {
      btn.href = state.downloads.emulator.url || "#";
      btn.onclick = (e) => {
        e.preventDefault();
        showToast("Starting Emulator client download...", "success");
      };
    }
  }

  if (state.downloads.apk) {
    const size = document.getElementById("apkSize");
    const ver = document.getElementById("apkVersion");
    const btn = document.getElementById("downloadApkBtn");
    if (size) size.textContent = state.downloads.apk.file_size || "85 MB";
    if (ver) ver.textContent = state.downloads.apk.version || "v1.108.x";
    if (btn) {
      btn.href = state.downloads.apk.url || "#";
      btn.onclick = (e) => {
        e.preventDefault();
        showToast("Starting Safe APK download...", "success");
      };
    }
  }

  if (state.downloads.exe) {
    const size = document.getElementById("exeSize");
    const ver = document.getElementById("exeVersion");
    const btn = document.getElementById("downloadExeBtn");
    if (size) size.textContent = state.downloads.exe.file_size || "18 MB";
    if (ver) ver.textContent = state.downloads.exe.version || "v4.9.0";
    if (btn) {
      btn.href = state.downloads.exe.url || "#";
      btn.onclick = (e) => {
        e.preventDefault();
        showToast("Starting External Panel Loader download...", "success");
      };
    }
  }
}

// ===================================================
// USER & WALLET UI
// ===================================================

function updateUserUI() {
  if (!state.user) return;

  const initial = (state.user.name || "W").charAt(0).toUpperCase();
  if (userHandle) userHandle.textContent = state.user.name || "User";
  if (userAvatarCircle) userAvatarCircle.textContent = initial;
  if (creditAvatar) creditAvatar.textContent = initial;
  if (userCreditAmount) userCreditAmount.textContent = `${Number(state.user.credits || 0).toFixed(2)} Credit`;

  const profileBigAvatar = document.getElementById("profileBigAvatar");
  const profileNameDisplay = document.getElementById("profileNameDisplay");
  const profileEmailDisplay = document.getElementById("profileEmailDisplay");
  const profileWalletBalance = document.getElementById("profileWalletBalance");
  if (profileBigAvatar) profileBigAvatar.textContent = initial;
  if (profileNameDisplay) profileNameDisplay.textContent = state.user.name;
  if (profileEmailDisplay) profileEmailDisplay.textContent = state.user.email;
  if (profileWalletBalance) profileWalletBalance.textContent = `${Number(state.user.credits || 0).toFixed(2)} Credits`;

  // Render licenses in profile & downloads
  renderUserLicenses();
}

function renderUserLicenses() {
  const list = document.getElementById("profileLicensesList");
  const activeTitle = document.getElementById("activeLicenseTitle");
  const activeDetail = document.getElementById("activeLicenseDetail");

  const licenses = (state.user && state.user.licenses) || [];
  if (licenses.length > 0) {
    const latest = licenses[licenses.length - 1];
    if (activeTitle) activeTitle.textContent = `${latest.product_title || 'PANEL'} (${latest.duration || 'LIFETIME'})`;
    if (activeDetail) activeDetail.innerHTML = `Key: <strong class="key-code">${latest.key}</strong> &bull; Activated`;
    if (downloadNavBadge) {
      downloadNavBadge.textContent = "UNLOCKED";
      downloadNavBadge.className = "nav-badge unlocked";
    }
  } else {
    if (activeTitle) activeTitle.textContent = "No Active License";
    if (activeDetail) activeDetail.innerHTML = "Claim a key to unlock downloads.";
    if (downloadNavBadge) {
      downloadNavBadge.textContent = "LOCKED";
      downloadNavBadge.className = "nav-badge locked";
    }
  }

  if (!list) return;
  if (licenses.length === 0) {
    list.innerHTML = `<div style="color: var(--text-dim); padding: 12px; font-size: 13px;">No license keys found. Redeem one using the Claim License option.</div>`;
    return;
  }

  list.innerHTML = licenses.map(lic => `
    <div class="license-row-item">
      <div>
        <strong style="color: #fff; font-size: 14px;">${lic.product_title || 'VIP PANEL'}</strong>
        <div style="color: var(--text-dim); font-size: 12px; margin-top: 2px;">Duration: <span style="color: var(--accent-orange); font-weight: 700;">${lic.duration}</span></div>
      </div>
      <div style="text-align: right;">
        <span class="key-code" style="font-size: 14px;">${lic.key}</span>
        <div style="font-size: 10.5px; color: var(--accent-green); margin-top: 2px;">● ACTIVE</div>
      </div>
    </div>
  `).join("");
}

// ===================================================
// NAVIGATION & ROUTING
// ===================================================

function setupNavigation() {
  // Mobile Drawer toggles
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", () => {
      sidebarDrawer.classList.toggle("active");
      sidebarOverlay.classList.toggle("active");
    });
  }
  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);

  // Nav Links
  navStoreBtn.addEventListener("click", () => navigateTo("store"));
  navProfileBtn.addEventListener("click", () => navigateTo("profile"));
  navHelpBtn.addEventListener("click", () => navigateTo("help"));
  navDownloadsBtn.addEventListener("click", () => navigateTo("downloads"));

  if (backToProductsBtn) backToProductsBtn.addEventListener("click", () => navigateTo("store"));
  if (backToStoreFromDlBtn) backToStoreFromDlBtn.addEventListener("click", () => navigateTo("store"));

  // Claim Key Nav
  navClaimKeyBtn.addEventListener("click", () => {
    closeSidebar();
    openModal(claimKeyModal);
  });
  if (claimAnotherKeyInDlBtn) {
    claimAnotherKeyInDlBtn.addEventListener("click", () => openModal(claimKeyModal));
  }

  // Profile triggers
  if (sidebarUserCard) sidebarUserCard.addEventListener("click", () => navigateTo("profile"));
  if (creditWalletPill) creditWalletPill.addEventListener("click", () => navigateTo("profile"));

  // Add credits button
  const addCreditsBtn = document.getElementById("addCreditsBtn");
  if (addCreditsBtn) {
    addCreditsBtn.addEventListener("click", () => {
      state.user.credits = (state.user.credits || 0) + 100.00;
      localStorage.setItem("dangerpanel_user", JSON.stringify(state.user));
      updateUserUI();
      showToast("🎉 +100.00 Credits added to your wallet!", "success");
    });
  }

  // Logout
  sidebarLogoutBtn.addEventListener("click", () => {
    openModal(loginModal);
  });
}

function closeSidebar() {
  if (sidebarDrawer) sidebarDrawer.classList.remove("active");
  if (sidebarOverlay) sidebarOverlay.classList.remove("active");
}

function navigateTo(viewName, productId = null) {
  closeSidebar();
  if (viewName === "productDetail" && productId) {
    window.location.hash = `product/${productId}`;
  } else {
    window.location.hash = viewName;
  }
}

function handleHashRouting() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash || hash === "store") {
    switchView("store");
  } else if (hash.startsWith("product/")) {
    const prodId = hash.split("/")[1];
    switchView("productDetail", prodId);
  } else if (hash === "downloads") {
    switchView("downloads");
  } else if (hash === "profile") {
    switchView("profile");
  } else if (hash === "help") {
    switchView("help");
  } else {
    switchView("store");
  }
}

function switchView(viewName, productId = null) {
  state.activeView = viewName;

  // Hide all views
  storeView.style.display = "none";
  productDetailView.style.display = "none";
  downloadsView.style.display = "none";
  profileView.style.display = "none";
  helpView.style.display = "none";

  // Reset active nav items
  document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));

  if (viewName === "store") {
    storeView.style.display = "block";
    navStoreBtn.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (viewName === "productDetail") {
    productDetailView.style.display = "block";
    navStoreBtn.classList.add("active");
    renderProductDetail(productId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (viewName === "downloads") {
    downloadsView.style.display = "block";
    navDownloadsBtn.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (viewName === "profile") {
    profileView.style.display = "block";
    navProfileBtn.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (viewName === "help") {
    helpView.style.display = "block";
    navHelpBtn.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// ===================================================
// STORE VIEW & CATEGORY FILTER
// ===================================================

function setupCategoryFilter() {
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      renderProducts();
    });
  }
}

function renderCategoryTabs() {
  if (!categoryTabs) return;

  const cats = state.categories || ["ALL", "ALL PANEL", "BLOODSTRIKE", "PUBG PANEL", "PUBG", "FREE FIRE", "PC PANEL"];
  categoryTabs.innerHTML = cats.map(cat => {
    const isActive = state.selectedCategory.toLowerCase() === cat.toLowerCase() ? "active" : "";
    return `<button class="cat-tab-btn ${isActive}" data-cat="${cat}">${cat}</button>`;
  }).join("");

  categoryTabs.querySelectorAll(".cat-tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      state.selectedCategory = e.currentTarget.dataset.cat;
      renderCategoryTabs();
      renderProducts();
    });
  });
}

function renderProducts() {
  if (!productsGrid) return;
  productsGrid.innerHTML = "";

  const filtered = state.products.filter(p => {
    // Category match
    let matchesCat = true;
    if (state.selectedCategory && state.selectedCategory !== "ALL") {
      const targetCat = state.selectedCategory.toLowerCase();
      const pCats = (p.categories || []).map(c => c.toLowerCase());
      matchesCat = pCats.includes(targetCat) || 
                   p.title.toLowerCase().includes(targetCat) || 
                   (p.badge && p.badge.toLowerCase().includes(targetCat));
    }
    // Search query match
    let matchesSearch = true;
    if (state.searchQuery) {
      const q = state.searchQuery;
      matchesSearch = p.title.toLowerCase().includes(q) || 
                      p.description.toLowerCase().includes(q) ||
                      (p.categories && p.categories.some(c => c.toLowerCase().includes(q)));
    }
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    productsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <div style="font-size: 42px; margin-bottom: 12px;">🔍</div>
        <h3 style="color: #fff; font-family: var(--font-heading); margin-bottom: 6px;">No Products Found</h3>
        <p style="font-size: 13.5px;">Try selecting another category tab or clearing the search query.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(prod => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.id = `card-${prod.id}`;

    // Active package / primary package
    const pkgs = prod.packages || [];
    const firstPkg = pkgs[0] || { duration: "Life Time Access", price_credits: 60.00 };
    const priceText = `${Number(firstPkg.price_credits || firstPkg.price_usd || 60).toFixed(2)} Credits`;
    const oldPriceHtml = firstPkg.original_price_credits ? 
      `<span class="access-price-old">${Number(firstPkg.original_price_credits).toFixed(2)} Credits</span>` : "";

    const featBadgeHtml = prod.featured ? `<span class="badge-featured">⭐ Featured</span>` : "";
    const discBadgeHtml = prod.discount_badge ? `<span class="badge-discount">% ${prod.discount_badge}</span>` : "";

    // Categories pills
    const catsHtml = (prod.categories || ["ALL PANEL"]).map(c => `<span class="cat-pill">${c}</span>`).join("");

    card.innerHTML = `
      <div class="card-media">
        ${featBadgeHtml}
        ${discBadgeHtml}
        <img src="${prod.image || '/uploads/bloodstrike_banner.jpg'}" alt="${prod.title}" loading="lazy" onerror="this.src='/uploads/bloodstrike_banner.jpg'">
        <div class="card-hover-overlay">
          <button class="btn-view-details-hover">👁 View Details</button>
        </div>
      </div>

      <div class="card-body">
        <h2 class="card-title">${prod.title}</h2>
        <p class="card-snippet">${prod.description}</p>

        <div class="card-rating-row">
          <span class="card-rating-stars">★★★★★</span>
          <span class="card-rating-count">(${prod.reviews_count || 0})</span>
        </div>

        <div class="card-category-pills">
          ${catsHtml}
        </div>

        <div class="card-meta-row">
          <span>👥 ${prod.sold_count || 0} sold</span>
          <span>🕒 ${firstPkg.duration || 'Life Time Access'}</span>
        </div>

        <div class="card-access-box">
          <div class="access-top">
            <span class="access-name">🎯 ${firstPkg.duration || 'Life Time Access'}</span>
            <div class="access-tags">
              <span class="access-tag">🕒 ${pkgs.length} Plans</span>
              <span class="access-tag">🎧 Support</span>
            </div>
          </div>
          <div class="access-price-row">
            <span class="access-price">${priceText}</span>
            ${oldPriceHtml}
          </div>
        </div>

        <button class="card-action-btn view-product-btn" data-id="${prod.id}">
          <span>👁</span>
          <span>View Product</span>
        </button>
      </div>
    `;

    // Click on card or view details button navigates to Product Details page!
    card.addEventListener("click", (e) => {
      e.stopPropagation();
      navigateTo("productDetail", prod.id);
    });

    productsGrid.appendChild(card);
  });
}

// ===================================================
// PRODUCT DETAIL VIEW (Screenshots 1, 2, 4, 5)
// ===================================================

function renderProductDetail(productId) {
  let product = state.products.find(p => p.id === productId);
  if (!product && state.products.length > 0) {
    product = state.products[0];
  }
  if (!product) return;

  state.currentProductId = product.id;

  // 1. Breadcrumbs
  const catsJoined = (product.categories || ["ALL PANEL"]).join(" • ");
  productBreadcrumbs.innerHTML = `/ ${catsJoined} / <span class="crumb-active">${product.title}</span>`;

  // 2. Hero Media
  detailHeroImage.src = product.image || "/uploads/bloodstrike_banner.jpg";
  detailBadgeFeatured.style.display = product.featured ? "inline-flex" : "none";
  detailBadgePopular.style.display = product.secondary_badge ? "inline-flex" : "none";

  // 3. Category Tags & VIP badge
  detailCatTags.innerHTML = (product.categories || ["ALL PANEL"]).map(c => `
    <span class="detail-tag-pill">${c}</span>
  `).join("");

  // 4. Product Title with Orange Accent Word
  const titleWords = product.title.split(" ");
  if (titleWords.length > 1) {
    const lastWord = titleWords.pop();
    detailProductTitle.innerHTML = `${titleWords.join(" ")} <span class="text-orange">${lastWord}</span>`;
  } else {
    detailProductTitle.innerHTML = `<span class="text-orange">${product.title}</span>`;
  }

  // 5. Description
  detailProductDesc.textContent = product.description;

  // 6. Ratings & Purchases
  detailRatingNum.textContent = product.rating || "5";
  detailReviewsCount.textContent = `(${product.reviews_count || 0} reviews)`;
  detailPurchasesCount.textContent = `${product.sold_count || 0} purchases`;

  // 7. Stat feature cards
  detailSafetyVal.textContent = product.safety || "Undetected";
  detailUpdatesVal.textContent = product.updates || "Daily";
  detailSupportVal.textContent = product.support || "24/7";

  // 8. Video Showcase Card (Screenshot 4)
  videoThumbnailImg.src = product.video_thumbnail || product.image || "/uploads/bloodstrike_banner.jpg";
  videoBadgeTitle.textContent = product.video_title || `${product.title} Demo Video`;

  // 9. Interactive Plan Cards List
  const pkgs = product.packages || [
    { id: "p1", duration: "Life Time Access", badge: "LIFE TIME PASS", subtitle: "Life Time Pass", price_credits: 60.00 },
    { id: "p2", duration: "30 Days Access", badge: "MONTHLY PASS", subtitle: "Monthly Pass", price_credits: 15.00 },
    { id: "p3", duration: "7 Day Access", badge: "WEEK PASS", subtitle: "Week Pass", price_credits: 5.00 }
  ];

  state.selectedPlanId = pkgs[0].id;
  renderPlanCards(pkgs);

  // 10. Specifications in Overview Tab (Screenshot 5)
  const specs = product.specs || {};
  overviewSpecsText.textContent = `Processor: ${specs.processor || 'Intel i3-10100, Ryzen 3 3200G 4 core'} RAM: ${specs.ram || '8GB minimum, 16GB better'} SSD: ${specs.ssd || '120/240GB'}`;
  overviewCompatText.textContent = specs.compatibility || "Windows 10/11";

  // 11. Tags pills in Overview
  const tags = specs.tags || ["Undetected", "Premium", "Daily updates", "24/7 support"];
  overviewTagsRow.innerHTML = tags.map(t => `<span class="spec-tag-pill">${t}</span>`).join("");

  // 12. Features Tab Checklist
  const features = product.features_list || [
    "Aimbot 360° Smart Prediction & Headshot Lock",
    "RCS Recoil Control System (Custom Slider 0-100%)",
    "Stream-Proof ESP & Wallhack (Invisible on OBS & Discord)",
    "Hidden Mode (Safe for Streamers & YouTubers)",
    "Zero FPS Drop & Lightweight Memory Optimization",
    "Instant Auto Driver Injector with Memory Protection",
    "Auto Bypass EAC & NetEase Anti-Cheat Engines",
    "Full Safe Main ID Support"
  ];
  featuresListContainer.innerHTML = features.map(f => `
    <div class="feature-item-row">
      <span class="bullet">✔</span>
      <span>${f}</span>
    </div>
  `).join("");

  // 13. Metadata
  detailLastUpdated.textContent = product.last_updated || "6/21/2026";
}

function renderPlanCards(packages) {
  detailPlanCardsList.innerHTML = packages.map(pkg => {
    const isSelected = pkg.id === state.selectedPlanId ? "selected" : "";
    const priceCredits = Number(pkg.price_credits || pkg.price_usd || 60).toFixed(2);
    return `
      <div class="plan-card-item ${isSelected}" data-id="${pkg.id}">
        <div class="plan-card-left">
          <div class="plan-card-title">${pkg.duration}</div>
          <div class="plan-card-meta">
            <span class="plan-pass-badge">${pkg.badge || 'VIP PASS'}</span>
            <span class="plan-pass-subtitle">${pkg.subtitle || pkg.duration}</span>
          </div>
        </div>
        <div class="plan-card-price">${priceCredits} Credits</div>
      </div>
    `;
  }).join("");

  // Attach plan click listeners
  detailPlanCardsList.querySelectorAll(".plan-card-item").forEach(card => {
    card.addEventListener("click", (e) => {
      state.selectedPlanId = e.currentTarget.dataset.id;
      renderPlanCards(packages);
      updateBuyPlanButtonText(packages);
    });
  });

  updateBuyPlanButtonText(packages);
}

function updateBuyPlanButtonText(packages) {
  const selected = packages.find(p => p.id === state.selectedPlanId) || packages[0];
  const priceCredits = Number(selected.price_credits || selected.price_usd || 60).toFixed(2);
  buyPlanBtnText.textContent = `Buy ${selected.duration} (${priceCredits} Credits)`;

  // Attach Checkout click
  buyPlanMainBtn.onclick = () => {
    openCheckoutModal(state.currentProductId, selected);
  };
}

// ===================================================
// PRODUCT DETAIL TABS & VIDEO DEMO MODAL
// ===================================================

function setupProductDetailTabs() {
  // Media tabs
  tabMediaImages.addEventListener("click", () => {
    tabMediaImages.classList.add("active");
    tabMediaVideo.classList.remove("active");
  });

  tabMediaVideo.addEventListener("click", () => {
    tabMediaVideo.classList.add("active");
    tabMediaImages.classList.remove("active");
    openDemoVideoModal();
  });

  // Video preview box & play button
  if (videoPlayBtn) videoPlayBtn.addEventListener("click", openDemoVideoModal);
  if (videoPreviewBox) videoPreviewBox.addEventListener("click", openDemoVideoModal);

  // Overview vs Features tab switcher
  tabOverviewBtn.addEventListener("click", () => {
    tabOverviewBtn.classList.add("active");
    tabFeaturesBtn.classList.remove("active");
    tabOverviewContent.style.display = "block";
    tabFeaturesContent.style.display = "none";
  });

  tabFeaturesBtn.addEventListener("click", () => {
    tabFeaturesBtn.classList.add("active");
    tabOverviewBtn.classList.remove("active");
    tabOverviewContent.style.display = "none";
    tabFeaturesContent.style.display = "grid";
  });
}

function openDemoVideoModal() {
  const product = state.products.find(p => p.id === state.currentProductId) || state.products[0];
  if (!product) return;

  videoModalHeaderTitle.textContent = product.video_title || `${product.title} Demo Video`;
  videoIframe.src = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1";
  openModal(videoShowcaseModal);
}

// Close Video when modal closes
function closeVideoModal() {
  videoIframe.src = "";
  closeModal(videoShowcaseModal);
}

// ===================================================
// CHECKOUT & PURCHASE LOGIC
// ===================================================

let currentCheckout = {
  productId: null,
  package: null
};

function openCheckoutModal(productId, pkg) {
  const product = state.products.find(p => p.id === productId) || state.products[0];
  currentCheckout.productId = productId;
  currentCheckout.package = pkg;

  document.getElementById("checkoutProductTitle").textContent = product.title;
  document.getElementById("checkoutPackageDuration").textContent = pkg.duration;
  const price = Number(pkg.price_credits || pkg.price_usd || 60).toFixed(2);
  document.getElementById("checkoutPriceText").textContent = `${price} Credits`;

  openModal(purchaseModal);
}

// Setup Modals & Buttons
function setupModals() {
  // Close buttons
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
      const modalId = btn.dataset.close;
      if (modalId === "videoShowcaseModal") {
        closeVideoModal();
      } else {
        closeModal(document.getElementById(modalId));
      }
    });
  });

  // Close when clicking outside box
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        if (overlay.id === "videoShowcaseModal") {
          closeVideoModal();
        } else {
          closeModal(overlay);
        }
      }
    });
  });

  // Confirm Purchase Button
  const confirmBtn = document.getElementById("confirmPurchaseBtn");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", async () => {
      const payRadio = document.querySelector('input[name="payMethod"]:checked');
      const payMethod = payRadio ? payRadio.value : "bKash";

      confirmBtn.disabled = true;
      confirmBtn.textContent = "Verifying & Generating License Key...";

      try {
        const res = await fetch(`${API_BASE}/api/purchase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: state.user.id,
            product_id: currentCheckout.productId,
            package_id: currentCheckout.package.id,
            payment_method: payMethod
          })
        });

        const data = await res.json();
        if (data.success) {
          const generatedKey = data.key || `DANGER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          const newLicense = {
            key: generatedKey,
            product_id: currentCheckout.productId,
            product_title: document.getElementById("checkoutProductTitle").textContent,
            duration: currentCheckout.package.duration,
            claimed_at: new Date().toISOString()
          };

          if (!state.user.licenses) state.user.licenses = [];
          state.user.licenses.push(newLicense);
          state.canDownload = true;
          localStorage.setItem("dangerpanel_user", JSON.stringify(state.user));
          updateUserUI();

          closeModal(purchaseModal);
          showToast(`🎉 Order Verified! License Key: ${generatedKey}`, "success");

          // Navigate directly to Downloads view
          setTimeout(() => {
            navigateTo("downloads");
          }, 600);
        } else {
          showToast(data.message || "Checkout could not be completed", "error");
        }
      } catch (err) {
        // Fallback demo purchase
        const fallbackKey = `DANGER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const newLicense = {
          key: fallbackKey,
          product_id: currentCheckout.productId,
          product_title: document.getElementById("checkoutProductTitle").textContent,
          duration: currentCheckout.package.duration,
          claimed_at: new Date().toISOString()
        };
        if (!state.user.licenses) state.user.licenses = [];
        state.user.licenses.push(newLicense);
        state.canDownload = true;
        localStorage.setItem("dangerpanel_user", JSON.stringify(state.user));
        updateUserUI();

        closeModal(purchaseModal);
        showToast(`🎉 License Key Activated: ${fallbackKey}`, "success");
        setTimeout(() => navigateTo("downloads"), 600);
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Confirm Order & Activate License";
      }
    });
  }

  // Claim Key Form
  const submitClaimKeyBtn = document.getElementById("submitClaimKeyBtn");
  if (submitClaimKeyBtn) {
    submitClaimKeyBtn.addEventListener("click", async () => {
      const keyInput = document.getElementById("claimKeyInput");
      const key = keyInput.value.trim().toUpperCase();
      if (!key) {
        showToast("Please enter a valid license key code!", "error");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/keys/claim`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: key,
            user_id: state.user.id
          })
        });
        const data = await res.json();
        if (data.success) {
          const newLic = data.license || {
            key: key,
            product_id: "bloodstrike-panel",
            product_title: "BLOODSTRIKE PANEL",
            duration: "Life Time Access",
            claimed_at: new Date().toISOString()
          };
          if (!state.user.licenses) state.user.licenses = [];
          state.user.licenses.push(newLic);
          state.canDownload = true;
          localStorage.setItem("dangerpanel_user", JSON.stringify(state.user));
          updateUserUI();

          closeModal(claimKeyModal);
          showToast(`🎉 License Key ${key} Redeemed! Downloads unlocked.`, "success");
          setTimeout(() => navigateTo("downloads"), 600);
        } else {
          showToast(data.message || "Invalid or expired key", "error");
        }
      } catch (e) {
        // Allow client demo activation
        const newLic = {
          key: key,
          product_id: "bloodstrike-panel",
          product_title: "BLOODSTRIKE PANEL",
          duration: "Life Time Access",
          claimed_at: new Date().toISOString()
        };
        if (!state.user.licenses) state.user.licenses = [];
        state.user.licenses.push(newLic);
        state.canDownload = true;
        localStorage.setItem("dangerpanel_user", JSON.stringify(state.user));
        updateUserUI();

        closeModal(claimKeyModal);
        showToast(`🎉 License Key ${key} Redeemed! Downloads unlocked.`, "success");
        setTimeout(() => navigateTo("downloads"), 600);
      }
    });
  }

  // Login Form
  const emailLoginForm = document.getElementById("emailLoginForm");
  if (emailLoginForm) {
    emailLoginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("loginNameInput").value.trim() || "User";
      const email = document.getElementById("loginEmailInput").value.trim() || "user@dangerpanel.shop";

      state.user.name = name;
      state.user.email = email;
      localStorage.setItem("dangerpanel_user", JSON.stringify(state.user));
      updateUserUI();

      closeModal(loginModal);
      showToast(`Welcome back, ${name}!`, "success");
    });
  }
}

function openModal(modal) {
  if (modal) modal.classList.add("active");
}

function closeModal(modal) {
  if (modal) modal.classList.remove("active");
}

// ===================================================
// SOCIAL SHARING
// ===================================================

function setupSharing() {
  const shareWhatsapp = document.getElementById("shareWhatsapp");
  const shareTelegram = document.getElementById("shareTelegram");
  const shareTwitter = document.getElementById("shareTwitter");
  const shareFacebook = document.getElementById("shareFacebook");
  const shareEmail = document.getElementById("shareEmail");

  const getShareUrl = () => window.location.href;
  const getShareText = () => `Check out ${detailProductTitle.textContent} on DANGER PANEL PRO!`;

  if (shareWhatsapp) {
    shareWhatsapp.onclick = () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(getShareText() + ' ' + getShareUrl())}`, "_blank");
  }
  if (shareTelegram) {
    shareTelegram.onclick = () => window.open(`https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(getShareText())}`, "_blank");
  }
  if (shareTwitter) {
    shareTwitter.onclick = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}&url=${encodeURIComponent(getShareUrl())}`, "_blank");
  }
  if (shareFacebook) {
    shareFacebook.onclick = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`, "_blank");
  }
  if (shareEmail) {
    shareEmail.onclick = () => window.location.href = `mailto:?subject=${encodeURIComponent(getShareText())}&body=${encodeURIComponent(getShareUrl())}`;
  }
}
