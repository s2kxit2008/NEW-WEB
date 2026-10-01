// ===================================================
// ONLY RED SHOP — ADMIN PANEL JS
// ===================================================

const API = "";

// Auth guard
if (sessionStorage.getItem("admin_logged_in") !== "yes") {
  window.location.href = "/admin.html";
}

// ===== TOAST =====
function toast(msg, type = "info") {
  const c = document.getElementById("toastContainer");
  const t = document.createElement("div");
  t.className = "toast";
  const icon = type === "success" ? "✅" : type === "error" ? "❌" : "🔥";
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0"; t.style.transform = "translateX(-20px)";
    t.style.transition = "all 0.3s ease";
    setTimeout(() => t.remove(), 300);
  }, 4000);
}

// ===== TABS =====
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// ===== LOGOUT =====
document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("admin_logged_in");
  window.location.href = "/admin.html";
});

// ===================================================
// STATS
// ===================================================
async function loadStats() {
  try {
    const r = await fetch(`${API}/api/admin/stats`);
    const d = await r.json();
    if (d.success) {
      document.getElementById("statProducts").textContent = d.stats.total_products;
      document.getElementById("statKeys").textContent     = d.stats.total_keys;
      document.getElementById("statUsers").textContent    = d.stats.total_users;
      document.getElementById("statClaimed").textContent  = d.stats.claimed_keys;
    }
  } catch(e) { console.error(e); }
}

// ===================================================
// PRODUCTS LIST
// ===================================================
let allProducts = [];

async function loadProducts() {
  try {
    const r = await fetch(`${API}/api/products`);
    const d = await r.json();
    if (d.success) {
      allProducts = d.products;
      renderProducts();
      populateSelects();
    }
  } catch(e) { console.error(e); }
}

function renderProducts() {
  const list = document.getElementById("productListAdmin");
  if (!allProducts.length) {
    list.innerHTML = '<div class="empty-state"><div class="es-icon">📭</div><p>No products yet.</p></div>';
    return;
  }
  list.innerHTML = "";
  allProducts.forEach(p => {
    const div = document.createElement("div");
    div.className = "product-row";
    const badgeCls = p.badge_color === "gold" ? "product-badge gold" : "product-badge";
    div.innerHTML = `
      <img src="${p.image || 'https://via.placeholder.com/72x50?text=?'}"
           alt="${p.title}"
           onerror="this.src='https://via.placeholder.com/72x50?text=No+Img'">
      <div class="product-row-info">
        <h4>${p.title}</h4>
        <p>${p.packages ? p.packages.length : 0} packages &nbsp;·&nbsp; ID: ${p.id}</p>
      </div>
      ${p.badge ? `<span class="${badgeCls}">${p.badge}</span>` : ""}
      <div class="product-row-actions">
        <button class="btn-xs btn-del del-prod-btn" data-id="${p.id}">🗑 Delete</button>
      </div>`;
    list.appendChild(div);
  });

  document.querySelectorAll(".del-prod-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm(`Delete "${btn.dataset.id}"?`)) return;
      try {
        await fetch(`${API}/api/admin/products/delete`, {
          method: "POST", headers: {"Content-Type":"application/json"},
          body: JSON.stringify({product_id: btn.dataset.id})
        });
        toast("Product deleted", "info");
        await loadProducts(); await loadStats();
      } catch(e) { toast("Error", "error"); }
    });
  });
}

function populateSelects() {
  const pkgSel = document.getElementById("pkgProductSelect");
  const keySel = document.getElementById("keyProductSelect");
  pkgSel.innerHTML = ""; keySel.innerHTML = "";
  allProducts.forEach(p => {
    const o1 = new Option(`${p.title} (${p.packages ? p.packages.length : 0} pkgs)`, p.id);
    const o2 = new Option(p.title, p.id);
    pkgSel.add(o1); keySel.add(o2);
  });
}

// ===================================================
// IMAGE UPLOAD
// ===================================================
let uploadedUrl = null;
let uploadBusy = false;

const uploadZone    = document.getElementById("uploadZone");
const fileInput     = document.getElementById("fileInput");
const uploadResult  = document.getElementById("uploadResult");
const uploadResImg  = document.getElementById("uploadResultImg");
const uploadResName = document.getElementById("uploadResultName");
const uploadResSz   = document.getElementById("uploadResultSize");
const uploadProg    = document.getElementById("uploadProgress");
const uploadBar     = document.getElementById("uploadProgressBar");

uploadZone.addEventListener("click", () => fileInput.click());
uploadZone.addEventListener("dragover",  e => { e.preventDefault(); uploadZone.classList.add("drag-over"); });
uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("drag-over"));
uploadZone.addEventListener("drop", e => {
  e.preventDefault(); uploadZone.classList.remove("drag-over");
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener("click", e => e.stopPropagation());
fileInput.addEventListener("change", () => { if (fileInput.files.length) handleFile(fileInput.files[0]); });

document.getElementById("clearUploadBtn").addEventListener("click", () => {
  uploadedUrl = null;
  uploadBusy = false;
  uploadResult.classList.remove("visible");
  uploadResImg.src = "";
  fileInput.value = "";
});

function handleFile(file) {
  const looksImage = (file.type && file.type.startsWith("image/")) ||
    /\.(jpe?g|png|webp|gif)$/i.test(file.name || "");
  if (!looksImage) { toast("Image files only!", "error"); return; }
  if (file.size > 5 * 1024 * 1024)    { toast("Max 5MB allowed.", "error"); return; }

  const reader = new FileReader();
  reader.onload = e => { uploadResImg.src = e.target.result; };
  reader.readAsDataURL(file);

  uploadResName.textContent = file.name;
  uploadResSz.textContent   = `${(file.size / 1024).toFixed(1)} KB — uploading...`;
  uploadResult.classList.add("visible");
  uploadProg.classList.add("visible");
  uploadBar.style.width = "0%";

  uploadFile(file);
}

async function uploadFile(file) {
  uploadBusy = true;
  let progress = 0;
  const tick = setInterval(() => {
    progress = Math.min(progress + 8, 85);
    uploadBar.style.width = progress + "%";
  }, 120);

  const formData = new FormData();
  formData.append("image", file, file.name || "photo.jpg");

  try {
    const res  = await fetch(`${API}/api/admin/upload-image`, { method: "POST", body: formData });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch {
      throw new Error(text.slice(0, 120) || "Invalid server response");
    }
    clearInterval(tick);

    if (data.success) {
      uploadBar.style.width = "100%";
      setTimeout(() => uploadProg.classList.remove("visible"), 600);

      uploadedUrl = data.url;
      uploadResSz.textContent = `✅ Uploaded — ${(file.size / 1024).toFixed(1)} KB`;
      uploadResult.classList.add("visible");
      toast("Image uploaded!", "success");
    } else {
      uploadProg.classList.remove("visible");
      toast("Upload failed: " + (data.message || "Unknown error"), "error");
    }
  } catch(e) {
    clearInterval(tick);
    uploadProg.classList.remove("visible");
    toast("Upload error: " + (e.message || "Check server"), "error");
  } finally {
    uploadBusy = false;
  }
}

function addProdPkgRow() {
  const wrap = document.getElementById("prodPkgRows");
  const row = document.createElement("div");
  row.className = "pkg-row";
  row.innerHTML = `
    <div class="form-group">
      <label class="form-label">Duration</label>
      <input type="text" class="form-input pkg-duration" placeholder="e.g. 7 DAY, LIFETIME" required>
    </div>
    <div class="form-group">
      <label class="form-label">USD ($)</label>
      <input type="number" step="0.1" min="0" class="form-input pkg-usd" placeholder="0" required>
    </div>
    <div class="form-group">
      <label class="form-label">BDT (tk)</label>
      <input type="number" step="1" min="0" class="form-input pkg-bdt" placeholder="0" required>
    </div>
    <button type="button" class="btn-xs btn-del remove-pkg-row">✕</button>
  `;
  row.querySelector(".remove-pkg-row").addEventListener("click", () => {
    if (wrap.children.length > 1) row.remove();
  });
  wrap.appendChild(row);
}

document.getElementById("addProdPkgRowBtn").addEventListener("click", addProdPkgRow);
addProdPkgRow();

function collectProdPackages(slug) {
  const rows = [...document.querySelectorAll("#prodPkgRows .pkg-row")];
  const packages = [];
  rows.forEach((row, i) => {
    const duration = row.querySelector(".pkg-duration").value.trim();
    if (!duration) return;
    packages.push({
      id: `${slug}-${i}-${duration.toLowerCase().replace(/\s+/g, "")}`.slice(0, 24),
      duration: duration.toUpperCase(),
      price_usd: parseFloat(row.querySelector(".pkg-usd").value) || 0,
      price_bdt: parseFloat(row.querySelector(".pkg-bdt").value) || 0
    });
  });
  return packages;
}

// ===================================================
// ADD PRODUCT FORM
// ===================================================
document.getElementById("addProductForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (uploadBusy) { toast("Wait for photo upload to finish.", "error"); return; }

  const title     = document.getElementById("prodTitle").value.trim();
  const badge     = document.getElementById("prodBadge").value.trim();
  const badgeClr  = document.getElementById("prodBadgeColor").value;
  const desc      = document.getElementById("prodDesc").value.trim();
  const urlInput  = document.getElementById("prodImageUrl").value.trim();
  const image     = uploadedUrl || urlInput;

  if (!image) {
    toast("Add a product photo (upload or URL). No default image is used.", "error");
    return;
  }

  const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 12) || "prod";
  const packages = collectProdPackages(slug);
  if (!packages.length) {
    toast("Add at least one package duration and price.", "error");
    return;
  }

  const categoriesInput = document.getElementById("prodCategories").value.trim();
  const categories = categoriesInput ? categoriesInput.split(",").map(c => c.trim()).filter(Boolean) : ["ALL PANEL"];

  const prod = {
    title, badge, badge_color: badgeClr, image, description: desc,
    has_video: false, featured: badgeClr === "gold",
    categories,
    packages
  };

  try {
    const r = await fetch(`${API}/api/admin/products`, {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({product: prod})
    });
    const d = await r.json();
    if (d.success) {
      toast(`"${title}" added!`, "success");
      e.target.reset();
      uploadedUrl = null;
      uploadResult.classList.remove("visible");
      fileInput.value = "";
      document.getElementById("prodPkgRows").innerHTML = "";
      addProdPkgRow();
      await loadProducts(); await loadStats();
      document.querySelector('[data-tab="tabProducts"]').click();
    } else {
      toast(d.message || "Failed", "error");
    }
  } catch(err) { toast("Server error", "error"); }
});

// ===================================================
// ADD PACKAGE FORM
// ===================================================
document.getElementById("addPackageForm").addEventListener("submit", async e => {
  e.preventDefault();
  const body = {
    product_id: document.getElementById("pkgProductSelect").value,
    duration:   document.getElementById("pkgDuration").value,
    price_usd:  document.getElementById("pkgPriceUsd").value,
    price_bdt:  document.getElementById("pkgPriceBdt").value,
  };
  try {
    const r = await fetch(`${API}/api/admin/packages/add`, {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify(body)
    });
    const d = await r.json();
    if (d.success) {
      toast(`Package "${body.duration}" added!`, "success");
      document.getElementById("pkgDuration").value = "";
      await loadProducts();
    } else { toast(d.message, "error"); }
  } catch(e) { toast("Error", "error"); }
});

// ===================================================
// GENERATE KEY FORM
// ===================================================
document.getElementById("genKeyForm").addEventListener("submit", async e => {
  e.preventDefault();
  const body = {
    product_id: document.getElementById("keyProductSelect").value,
    duration:   document.getElementById("keyDuration").value,
    max_uses:   document.getElementById("keyMaxUses").value,
    custom_key: document.getElementById("keyCustomCode").value,
  };
  try {
    const r = await fetch(`${API}/api/admin/keys/generate`, {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify(body)
    });
    const d = await r.json();
    if (d.success) {
      toast(`Key: ${d.key.key}`, "success");
      document.getElementById("keyCustomCode").value = "";
      await loadKeys(); await loadStats();
    }
  } catch(e) { toast("Error", "error"); }
});

// ===================================================
// KEYS TABLE
// ===================================================
async function loadKeys() {
  try {
    const r = await fetch(`${API}/api/admin/keys`);
    const d = await r.json();
    if (!d.success) return;
    const tbody = document.getElementById("keysTableBody");
    tbody.innerHTML = "";

    if (!d.keys.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:24px">No keys yet.</td></tr>';
      return;
    }

    d.keys.forEach(k => {
      const uses    = k.used_by ? k.used_by.length : 0;
      const maxLbl  = k.max_uses === -1 ? "Unlimited" : k.max_uses;
      const useLbl  = k.max_uses === -1 ? `${uses} used` : `${uses} / ${maxLbl}`;
      const isFull  = k.max_uses !== -1 && uses >= k.max_uses;
      const useCls  = isFull ? "use-badge full" : "use-badge ok";
      const created = (k.created_at || "").slice(0, 10);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="key-code">${k.key}</span></td>
        <td style="color:var(--text-muted)">${k.product_id || "—"}</td>
        <td>${k.duration || "LIFETIME"}</td>
        <td><span class="${useCls}">${useLbl}</span></td>
        <td style="color:var(--text-dim)">${created}</td>
        <td style="display:flex;gap:6px">
          <button class="btn-xs btn-copy copy-btn" data-k="${k.key}">📋 Copy</button>
          <button class="btn-xs btn-del  del-btn"  data-k="${k.key}">🗑 Del</button>
        </td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".copy-btn").forEach(b => b.addEventListener("click", () => {
      navigator.clipboard.writeText(b.dataset.k);
      toast(`Copied: ${b.dataset.k}`, "info");
    }));
    tbody.querySelectorAll(".del-btn").forEach(b => b.addEventListener("click", async () => {
      await fetch(`${API}/api/admin/keys/delete`, {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({key: b.dataset.k})
      });
      toast("Key deleted", "info");
      await loadKeys(); await loadStats();
    }));
  } catch(e) { console.error(e); }
}

// ===================================================
// DOWNLOADS FORM
// ===================================================
async function loadDownloads() {
  try {
    const r = await fetch(`${API}/api/downloads`);
    const d = await r.json();
    if (d.success && d.downloads) {
      const dl = d.downloads;
      if (dl.emulator) {
        document.getElementById("dlEmulatorUrl").value = dl.emulator.url || "";
        document.getElementById("dlEmulatorVer").value = dl.emulator.version || "";
      }
      if (dl.apk) {
        document.getElementById("dlApkUrl").value = dl.apk.url || "";
        document.getElementById("dlApkVer").value = dl.apk.version || "";
      }
      if (dl.exe) {
        document.getElementById("dlExeUrl").value = dl.exe.url || "";
        document.getElementById("dlExeVer").value = dl.exe.version || "";
      }
    }
  } catch(e) { console.error(e); }
}

document.getElementById("downloadsForm").addEventListener("submit", async e => {
  e.preventDefault();
  const downloads = {
    emulator: { name:"Optimized Emulator", type:"Emulator", file_size:"420 MB", icon:"emulator",
                url:     document.getElementById("dlEmulatorUrl").value,
                version: document.getElementById("dlEmulatorVer").value || "v5.2.1" },
    apk:      { name:"Safe Modded APK",    type:"APK",      file_size:"85 MB",  icon:"apk",
                url:     document.getElementById("dlApkUrl").value,
                version: document.getElementById("dlApkVer").value || "v1.108.x" },
    exe:      { name:"External Panel Loader", type:"EXE",   file_size:"18 MB",  icon:"exe",
                url:     document.getElementById("dlExeUrl").value,
                version: document.getElementById("dlExeVer").value || "v4.9.0" }
  };
  try {
    const r = await fetch(`${API}/api/admin/downloads`, {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({downloads})
    });
    const d = await r.json();
    if (d.success) toast("Download links saved!", "success");
  } catch(e) { toast("Error saving", "error"); }
});

// ===================================================
// INIT
// ===================================================
(async () => {
  await Promise.all([loadStats(), loadProducts(), loadKeys(), loadDownloads()]);
})();
