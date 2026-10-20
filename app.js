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
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/jpeg", quality);
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
    const json = await res.json();
    if (!json.success) throw new Error("imgbb upload failed");
    const photo = { id: crypto.randomUUID(), url: json.data.url, ts: Date.now() };
    const newItem = { ...item, photos: [...(item.photos || []), photo] };
    await replaceListItem(trip, cat, item.id, newItem);
  } catch (e) {
    console.error(e);
    showBanner(t("saveError"), true);
  }
}

function removePhoto(trip, cat, item, photoId) {
  const newItem = { ...item, photos: (item.photos || []).filter((p) => p.id !== photoId) };
  replaceListItem(trip, cat, item.id, newItem);
}

function toggleLike(trip, cat, item) {
  const likedNow = likedLocally.has(item.id);
  const newItem = { ...item, likes: Math.max(0, (item.likes || 0) + (likedNow ? -1 : 1)) };
  if (likedNow) likedLocally.delete(item.id);
  else likedLocally.add(item.id);
  localStorage.setItem("wishlist_liked", JSON.stringify([...likedLocally]));
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

// ---- Jeju plan tab (curated static content from plan-data.js) ----

function renderPlanTab() {
  const p = PLAN_DATA[lang] || PLAN_DATA.en;

  document.getElementById("plan-stays-intro").textContent = p.stayIntro;
  document.getElementById("plan-stays").innerHTML = p.stays.map((s) => `
    <div class="plan-card">
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
  `).join("");

  document.getElementById("plan-days-intro").textContent = p.daysIntro;
  document.getElementById("plan-caveat").textContent = p.caveat;
  document.getElementById("plan-days").innerHTML = p.days.map((d) => `
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
  `).join("");
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
