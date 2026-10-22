import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, doc, onSnapshot, setDoc, updateDoc,
  arrayUnion, arrayRemove, runTransaction,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const TRIPS = ["busan", "jeju"];
const CATS = ["food", "activities", "places", "stays"];

let lang = localStorage.getItem("wishlist_lang") || "en";
let data = emptyData();
let docExists = false;
const expandedComments = new Set();
const likedLocally = new Set(JSON.parse(localStorage.getItem("wishlist_liked") || "[]"));
const dislikedLocally = new Set(JSON.parse(localStorage.getItem("wishlist_disliked") || "[]"));

function t(key, ...args) {
  const val = (I18N[lang] || I18N.en)[key];
  return typeof val === "function" ? val(...args) : val;
}

function emptyData() {
  const trips = {};
  TRIPS.forEach((trip) => {
    trips[trip] = {};
    CATS.forEach((cat) => { trips[trip][cat] = []; });
  });
  return { trips };
}

function normalize(raw) {
  const base = emptyData();
  if (!raw || typeof raw !== "object") return base;
  TRIPS.forEach((trip) => {
    if (raw.trips && raw.trips[trip]) {
      CATS.forEach((cat) => {
        if (Array.isArray(raw.trips[trip][cat])) base.trips[trip][cat] = raw.trips[trip][cat];
      });
    }
  });
  return base;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function normalizeForDup(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("justNow");
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function showBanner(msg, isError) {
  const el = document.getElementById("status-banner");
  if (!msg) { el.hidden = true; return; }
  el.textContent = msg;
  el.classList.toggle("error", !!isError);
  el.hidden = false;
}

// ---- Firebase ----

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
const docRef = doc(db, "wishlist", "data");

function startListening() {
  onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        docExists = true;
        data = normalize(snap.data());
      } else {
        docExists = false;
        data = emptyData();
      }
      showBanner("", false);
      renderAll();
    },
    (err) => {
      console.error(err);
      showBanner(t("loadError"), true);
    }
  );
}

async function ensureDoc() {
  if (docExists) return;
  try {
    await setDoc(docRef, emptyData(), { merge: true });
    docExists = true;
  } catch (e) {
    console.error(e);
  }
}

async function addListItem(trip, cat, item) {
  await ensureDoc();
  try {
    await updateDoc(docRef, { [`trips.${trip}.${cat}`]: arrayUnion(item) });
  } catch (e) {
    console.error(e);
    showBanner(t("saveError"), true);
  }
}

async function removeListItem(trip, cat, item) {
  try {
    await updateDoc(docRef, { [`trips.${trip}.${cat}`]: arrayRemove(item) });
  } catch (e) {
    console.error(e);
    showBanner(t("saveError"), true);
  }
}

// Atomically swaps one item (matched by id) for a new version — used for
// comment edits, where a plain arrayRemove+arrayUnion could race with
// another write and either flicker the item away or lose it for good.
async function replaceListItem(trip, cat, itemId, newItem) {
  await ensureDoc();
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(docRef);
      const current = normalize(snap.data());
      const arr = current.trips[trip][cat];
      const idx = arr.findIndex((i) => i.id === itemId);
      if (idx === -1) arr.push(newItem);
      else arr[idx] = newItem;
      tx.update(docRef, { [`trips.${trip}.${cat}`]: arr });
    });
  } catch (e) {
    console.error(e);
    showBanner(t("saveError"), true);
  }
}

function addComment(trip, cat, item, author, text) {
  const comment = { id: crypto.randomUUID(), author, text, ts: Date.now() };
  const newItem = { ...item, comments: [...(item.comments || []), comment] };
  replaceListItem(trip, cat, item.id, newItem);
}

function removeComment(trip, cat, item, commentId) {
  const newItem = { ...item, comments: (item.comments || []).filter((c) => c.id !== commentId) };
  replaceListItem(trip, cat, item.id, newItem);
}

function compressImage(file, maxDim = 1600, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read the file from your device"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't decode that image (unsupported format, e.g. HEIC?)"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Image compression failed (toBlob)"))), "image/jpeg", quality);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function addPhoto(trip, cat, item, file) {
  try {
    const blob = await compressImage(file);
    const formData = new FormData();
    formData.append("image", blob, "photo.jpg");
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(`ImgBB upload HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(`ImgBB upload rejected: ${(json.error && json.error.message) || "unknown"}`);
    const photo = { id: crypto.randomUUID(), url: json.data.url, ts: Date.now() };
    const newItem = { ...item, photos: [...(item.photos || []), photo] };
    await replaceListItem(trip, cat, item.id, newItem);
  } catch (e) {
    console.error(e);
    showBanner(`${t("saveError")} (${e.message})`, true);
  }
}

function removePhoto(trip, cat, item, photoId) {
  const newItem = { ...item, photos: (item.photos || []).filter((p) => p.id !== photoId) };
  replaceListItem(trip, cat, item.id, newItem);
}

function toggleLike(trip, cat, item) {
  const likedNow = likedLocally.has(item.id);
  const wasDisliked = dislikedLocally.has(item.id);
  const newItem = {
    ...item,
    likes: Math.max(0, (item.likes || 0) + (likedNow ? -1 : 1)),
    dislikes: wasDisliked ? Math.max(0, (item.dislikes || 0) - 1) : (item.dislikes || 0),
  };
  if (likedNow) likedLocally.delete(item.id);
  else likedLocally.add(item.id);
  if (wasDisliked) dislikedLocally.delete(item.id);
  localStorage.setItem("wishlist_liked", JSON.stringify([...likedLocally]));
  localStorage.setItem("wishlist_disliked", JSON.stringify([...dislikedLocally]));
  replaceListItem(trip, cat, item.id, newItem);
}

function toggleDislike(trip, cat, item) {
  const dislikedNow = dislikedLocally.has(item.id);
  const wasLiked = likedLocally.has(item.id);
  const newItem = {
    ...item,
    dislikes: Math.max(0, (item.dislikes || 0) + (dislikedNow ? -1 : 1)),
    likes: wasLiked ? Math.max(0, (item.likes || 0) - 1) : (item.likes || 0),
  };
  if (dislikedNow) dislikedLocally.delete(item.id);
  else dislikedLocally.add(item.id);
  if (wasLiked) likedLocally.delete(item.id);
  localStorage.setItem("wishlist_liked", JSON.stringify([...likedLocally]));
  localStorage.setItem("wishlist_disliked", JSON.stringify([...dislikedLocally]));
  replaceListItem(trip, cat, item.id, newItem);
}

// ---- rendering ----

function renderAll() {
  TRIPS.forEach((trip) => {
    CATS.forEach((cat) => renderList(trip, cat));
  });
}

function renderList(trip, cat) {
  const card = document.querySelector(`.category-card[data-trip="${trip}"][data-cat="${cat}"]`);
  if (!card) return;
  const listEl = card.querySelector("[data-list]");
  const items = (data.trips[trip] && data.trips[trip][cat]) || [];
  if (items.length === 0) {
    listEl.innerHTML = `<p class="empty-msg">${escapeHtml(t("emptyList"))}</p>`;
    return;
  }
  const dupCounts = {};
  items.forEach((item) => {
    const key = normalizeForDup(item.text);
    dupCounts[key] = (dupCounts[key] || 0) + 1;
  });
  listEl.innerHTML = items
    .slice()
    .sort((a, b) => b.ts - a.ts)
    .map((item) => {
      const dupCount = dupCounts[normalizeForDup(item.text)];
      const isDup = dupCount > 1;
      const comments = item.comments || [];
      const photos = item.photos || [];
      const key = `${trip}|${cat}|${item.id}`;
      const expanded = expandedComments.has(key);
      const liked = likedLocally.has(item.id);
      const disliked = dislikedLocally.has(item.id);
      return `
      <div class="item-row${isDup ? " is-duplicate" : ""}">
        <div class="item-main">
          <div class="item-text">${escapeHtml(item.text)}${isDup ? ` <span class="dup-badge">${escapeHtml(t("duplicateTag", dupCount))}</span>` : ""}</div>
          <div class="item-meta">${escapeHtml(item.author)} · ${timeAgo(item.ts)}</div>
          ${photos.length ? `<div class="photo-strip">${photos.map((p) => `
            <div class="photo-thumb-wrap">
              <img class="photo-thumb" src="${escapeHtml(p.url)}" data-photo-view="${escapeHtml(p.url)}" alt="" />
              <button class="photo-delete" data-delete-photo="${key}|${p.id}" aria-label="${escapeHtml(t("deleteBtn"))}">×</button>
            </div>
          `).join("")}</div>` : ""}
          <div class="item-actions">
            <button class="like-btn${liked ? " liked" : ""}" data-toggle-like="${key}">${liked ? "❤️" : "🤍"} ${item.likes || 0}</button>
            <button class="dislike-btn${disliked ? " disliked" : ""}" data-toggle-dislike="${key}">${disliked ? "👎" : "🖐️"} ${item.dislikes || 0}</button>
            <button class="comment-toggle" data-toggle-comments="${key}">💬 ${comments.length}</button>
            <label class="photo-add-btn">📷
              <input type="file" accept="image/*" class="photo-input" data-photo-upload="${key}" hidden />
            </label>
          </div>
          <div class="comments-box" ${expanded ? "" : "hidden"}>
            ${comments.length === 0
              ? `<p class="comments-empty">${escapeHtml(t("commentsEmpty"))}</p>`
              : `<div class="comments-list">${comments.slice().sort((a, b) => a.ts - b.ts).map((c) => `
                <div class="comment-row">
                  <span class="comment-text"><strong>${escapeHtml(c.author)}:</strong> ${escapeHtml(c.text)}</span>
                  <button class="comment-delete" data-delete-comment="${key}|${c.id}" aria-label="${escapeHtml(t("deleteBtn"))}">×</button>
                </div>
              `).join("")}</div>`}
            <form class="comment-form" data-comment-form="${key}">
              <input type="text" class="comment-name-input" placeholder="${escapeHtml(t("namePlaceholder"))}" required />
              <input type="text" class="comment-text-input" placeholder="${escapeHtml(t("commentPlaceholder"))}" required />
              <button type="submit">${escapeHtml(t("commentSendBtn"))}</button>
            </form>
          </div>
        </div>
        <button class="delete-btn" data-delete="${trip}|${cat}|${item.id}">${escapeHtml(t("deleteBtn"))}</button>
      </div>
    `;
    }).join("");
}

function applyStaticI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });
}

// ---- events ----

function wireLangToggle() {
  document.getElementById("lang-toggle").addEventListener("click", () => {
    lang = lang === "en" ? "ko" : "en";
    localStorage.setItem("wishlist_lang", lang);
    applyStaticI18n();
    renderAll();
    renderPlanTab();
  });
}

function wireTripTabs() {
  document.querySelectorAll(".trip-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const trip = btn.getAttribute("data-trip");
      document.querySelectorAll(".trip-tab").forEach((b) => b.classList.toggle("active", b === btn));
      document.querySelectorAll(".trip-panel").forEach((p) =>
        p.classList.toggle("active", p.getAttribute("data-trip-panel") === trip)
      );
    });
  });
}

function wireForms() {
  document.querySelectorAll(".category-card[data-cat] [data-form]").forEach((form) => {
    const card = form.closest(".category-card");
    const trip = card.getAttribute("data-trip");
    const cat = card.getAttribute("data-cat");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameInput = form.querySelector(".name-input");
      const textInput = form.querySelector(".text-input");
      const author = nameInput.value.trim();
      const text = textInput.value.trim();
      if (!author || !text) return;
      const item = { id: crypto.randomUUID(), text, author, ts: Date.now() };
      addListItem(trip, cat, item);
      textInput.value = "";
    });
  });
}

function wireDeleteDelegation() {
  document.getElementById("app").addEventListener("click", async (e) => {
    const delBtn = e.target.closest("[data-delete]");
    const toggleBtn = e.target.closest("[data-toggle-comments]");
    const delCommentBtn = e.target.closest("[data-delete-comment]");
    const likeBtn = e.target.closest("[data-toggle-like]");
    const dislikeBtn = e.target.closest("[data-toggle-dislike]");
    const delPhotoBtn = e.target.closest("[data-delete-photo]");
    const photoThumb = e.target.closest("[data-photo-view]");

    if (delBtn) {
      const [trip, cat, id] = delBtn.getAttribute("data-delete").split("|");
      const item = (data.trips[trip][cat] || []).find((i) => i.id === id);
      if (!item) return;
      if (!(await showConfirm(t("deleteConfirm")))) return;
      removeListItem(trip, cat, item);
    } else if (toggleBtn) {
      const key = toggleBtn.getAttribute("data-toggle-comments");
      if (expandedComments.has(key)) expandedComments.delete(key);
      else expandedComments.add(key);
      const [trip, cat] = key.split("|");
      renderList(trip, cat);
    } else if (delCommentBtn) {
      const [trip, cat, itemId, commentId] = delCommentBtn.getAttribute("data-delete-comment").split("|");
      const item = (data.trips[trip][cat] || []).find((i) => i.id === itemId);
      if (!item) return;
      if (!(await showConfirm(t("deleteConfirm")))) return;
      removeComment(trip, cat, item, commentId);
    } else if (likeBtn) {
      const [trip, cat, itemId] = likeBtn.getAttribute("data-toggle-like").split("|");
      const item = (data.trips[trip][cat] || []).find((i) => i.id === itemId);
      if (!item) return;
      toggleLike(trip, cat, item);
    } else if (dislikeBtn) {
      const [trip, cat, itemId] = dislikeBtn.getAttribute("data-toggle-dislike").split("|");
      const item = (data.trips[trip][cat] || []).find((i) => i.id === itemId);
      if (!item) return;
      toggleDislike(trip, cat, item);
    } else if (delPhotoBtn) {
      const [trip, cat, itemId, photoId] = delPhotoBtn.getAttribute("data-delete-photo").split("|");
      const item = (data.trips[trip][cat] || []).find((i) => i.id === itemId);
      if (!item) return;
      if (!(await showConfirm(t("deleteConfirm")))) return;
      removePhoto(trip, cat, item, photoId);
    } else if (photoThumb) {
      openLightbox(photoThumb.getAttribute("data-photo-view"));
    }
  });

  document.getElementById("app").addEventListener("change", (e) => {
    const input = e.target.closest("[data-photo-upload]");
    if (!input || !input.files || !input.files[0]) return;
    const [trip, cat, itemId] = input.getAttribute("data-photo-upload").split("|");
    const item = (data.trips[trip][cat] || []).find((i) => i.id === itemId);
    if (!item) return;
    addPhoto(trip, cat, item, input.files[0]);
    input.value = "";
  });

  document.getElementById("app").addEventListener("submit", (e) => {
    const form = e.target.closest("[data-comment-form]");
    if (!form) return;
    e.preventDefault();
    const [trip, cat, itemId] = form.getAttribute("data-comment-form").split("|");
    const item = (data.trips[trip][cat] || []).find((i) => i.id === itemId);
    if (!item) return;
    const nameInput = form.querySelector(".comment-name-input");
    const textInput = form.querySelector(".comment-text-input");
    const author = nameInput.value.trim();
    const text = textInput.value.trim();
    if (!author || !text) return;
    addComment(trip, cat, item, author, text);
  });
}

// Custom confirm dialog instead of window.confirm() — some in-app browsers
// (e.g. KakaoTalk's) handle native confirm()/alert() unreliably, which made
// delete buttons look like they did nothing.
function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirm-modal");
    document.getElementById("confirm-message").textContent = message;
    const yesBtn = document.getElementById("confirm-yes");
    const noBtn = document.getElementById("confirm-no");
    const cleanup = (result) => {
      modal.hidden = true;
      yesBtn.removeEventListener("click", onYes);
      noBtn.removeEventListener("click", onNo);
      modal.removeEventListener("click", onBackdrop);
      resolve(result);
    };
    const onYes = () => cleanup(true);
    const onNo = () => cleanup(false);
    const onBackdrop = (e) => { if (e.target === modal) cleanup(false); };
    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
    modal.addEventListener("click", onBackdrop);
    modal.hidden = false;
  });
}

function openLightbox(url) {
  document.getElementById("lightbox-img").src = url;
  document.getElementById("photo-lightbox").hidden = false;
}

function wireLightbox() {
  const modal = document.getElementById("photo-lightbox");
  document.getElementById("lightbox-close").addEventListener("click", () => { modal.hidden = true; });
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.hidden = true; });
}

// ---- Plan tab (curated static content from plan-data.js) ----

function stayCardHtml(s) {
  const photo = s.photo
    ? `<img class="plan-card-photo" src="${escapeHtml(s.photo)}" data-photo-view="${escapeHtml(s.photo)}" alt="" />`
    : "";
  return `
    <div class="plan-card">
      ${photo}
      <div class="plan-card-body">
        <div class="plan-card-head">
          <strong>${escapeHtml(s.name)}</strong>
          <span class="plan-tag">${escapeHtml(s.type)}</span>
        </div>
        <div class="plan-card-row">📍 ${escapeHtml(s.area)}</div>
        <div class="plan-card-row">⭐ ${escapeHtml(s.rating)}</div>
        <div class="plan-card-row">👥 ${escapeHtml(s.capacity)}</div>
        <div class="plan-card-row">💰 ${escapeHtml(s.price)}</div>
        <div class="plan-card-row">🚗 ${escapeHtml(s.access)}</div>
        <a class="plan-link" href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.url)}</a>
      </div>
    </div>
  `;
}

function dayCardHtml(d) {
  return `
    <div class="plan-day">
      <div class="plan-day-head">
        <strong>${escapeHtml(d.label)}</strong>
        <span class="plan-day-theme">${escapeHtml(d.theme)}</span>
      </div>
      <div class="plan-timeline">
        ${d.items.map((it) => `
          <div class="plan-stop">
            <div class="plan-stop-time">${escapeHtml(it.time)}</div>
            <div class="plan-stop-main">
              <div class="plan-stop-place">${escapeHtml(it.place)}</div>
              <div class="plan-stop-desc">${escapeHtml(it.desc)}</div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderTripRoute(p) {
  document.getElementById("route-title").textContent = p.routeTitle;
  document.getElementById("trip-route").innerHTML = p.route.map((r, i) => `
    <div class="route-stop">
      <span class="route-icon">${r.icon}</span>
      <span class="route-label">${escapeHtml(r.label)}</span>
    </div>
    ${i < p.route.length - 1 ? '<span class="route-arrow">→</span>' : ""}
  `).join("");
}

function renderTripCalendar(p) {
  document.getElementById("calendar-title").textContent = p.calendarTitle;

  const dayMap = {};
  p.arrivalDays.forEach((d) => { dayMap[d.date] = { ...d, trip: "travel" }; });
  p.busanDays.forEach((d) => { dayMap[d.date] = { ...d, trip: "busan" }; });
  p.days.forEach((d) => { dayMap[d.date] = { ...d, trip: "jeju" }; });
  p.departureDays.forEach((d) => { dayMap[d.date] = { ...d, trip: "travel" }; });

  const year = 2026;
  const month = 11; // December (0-indexed)
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dow = (I18N[lang] || I18N.en).dowShort;

  let grid = dow.map((d) => `<div class="calendar-dow">${escapeHtml(d)}</div>`).join("");
  for (let i = 0; i < firstDow; i++) grid += `<div class="calendar-day empty"></div>`;
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-12-${String(day).padStart(2, "0")}`;
    const entry = dayMap[iso];
    const cls = entry ? ` ${entry.trip}-day` : "";
    grid += `
      <div class="calendar-day${cls}" ${entry ? `title="${escapeHtml(entry.theme)}"` : ""}>
        <span class="day-num">${day}</span>
        ${entry ? `<span class="day-icon">${entry.icon}</span>` : ""}
      </div>
    `;
  }

  const legendTravel = lang === "ko" ? "이동일" : "Travel";
  const legendBusan = lang === "ko" ? "부산" : "Busan";
  const legendJeju = lang === "ko" ? "제주" : "Jeju";
  document.getElementById("trip-calendar").innerHTML = `
    <div class="calendar-grid">${grid}</div>
    <div class="calendar-legend">
      <span class="legend-item"><span class="legend-dot travel-dot"></span>${legendTravel}</span>
      <span class="legend-item"><span class="legend-dot busan-dot"></span>${legendBusan}</span>
      <span class="legend-item"><span class="legend-dot jeju-dot"></span>${legendJeju}</span>
    </div>
  `;
}

function renderPlanTab() {
  const p = PLAN_DATA[lang] || PLAN_DATA.en;

  document.getElementById("plan-edit-note").textContent = p.editNote;

  // Fixed (booked) schedule — its own tab, one card per section
  document.getElementById("fixed-note").textContent = p.fixedNote;
  document.getElementById("fixed-sections").innerHTML = p.fixedSections.map((sec) => `
    <article class="category-card fixed-card">
      <h3 class="plan-subtitle">${escapeHtml(sec.title)}</h3>
      ${sec.items.map((f) => `
        <div class="fixed-row">
          <div class="fixed-date">${escapeHtml(f.date)}</div>
          <div class="fixed-main">
            <strong>${f.icon} ${escapeHtml(f.what)}</strong>
            <div>${escapeHtml(f.detail)}</div>
            ${f.url ? `<a class="plan-link" href="${escapeHtml(f.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(f.linkText)}</a>` : ""}
          </div>
        </div>
      `).join("")}
    </article>
  `).join("");
  renderTripRoute(p);
  renderTripCalendar(p);

  // Arrival
  document.getElementById("arrival-plan-title").textContent = p.arrivalTitle;
  document.getElementById("arrival-days").innerHTML = p.arrivalDays.map(dayCardHtml).join("");

  // Busan
  document.getElementById("busan-plan-title").textContent = p.busanTitle;
  document.getElementById("busan-transport").innerHTML = p.busanTransport.map((t) => `
    <div class="plan-card-row transport-row">
      <strong>${escapeHtml(t.label)}</strong>
      <div>${escapeHtml(t.detail)}</div>
    </div>
  `).join("");
  document.getElementById("busan-stays-intro").textContent = p.busanStaysIntro;
  document.getElementById("busan-stays").innerHTML = p.busanStays.map(stayCardHtml).join("");
  document.getElementById("busan-days").innerHTML = p.busanDays.map(dayCardHtml).join("");

  // Jeju
  document.getElementById("plan-stays-intro").textContent = p.stayIntro;
  document.getElementById("plan-stays").innerHTML = p.stays.map(stayCardHtml).join("");

  document.getElementById("plan-days-intro").textContent = p.daysIntro;
  document.getElementById("plan-caveat").textContent = p.caveat;
  document.getElementById("plan-days").innerHTML = p.days.map(dayCardHtml).join("");

  // Departure
  document.getElementById("departure-plan-title").textContent = p.departureTitle;
  document.getElementById("departure-days").innerHTML = p.departureDays.map(dayCardHtml).join("");
}

function init() {
  applyStaticI18n();
  wireLangToggle();
  wireTripTabs();
  wireForms();
  wireDeleteDelegation();
  wireLightbox();
  renderAll();
  renderPlanTab();
  startListening();
}

// Surface otherwise-silent failures (e.g. a tap doing "nothing") as a
// visible banner instead of only logging to a console nobody opens.
window.addEventListener("error", (e) => {
  showBanner(`Error: ${e.message}`, true);
});
window.addEventListener("unhandledrejection", (e) => {
  const msg = (e.reason && e.reason.message) || String(e.reason);
  showBanner(`Error: ${msg}`, true);
});

document.addEventListener("DOMContentLoaded", init);
