import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, doc, onSnapshot, setDoc, updateDoc,
  arrayUnion, arrayRemove,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const TRIPS = ["busan", "jeju"];
const CATS = ["food", "activities", "places", "stays"];

let lang = localStorage.getItem("wishlist_lang") || "en";
let data = emptyData();
let docExists = false;

function t(key, ...args) {
  const val = (I18N[lang] || I18N.en)[key];
  return typeof val === "function" ? val(...args) : val;
}

function emptyData() {
  const trips = {};
  const rooms = {};
  TRIPS.forEach((trip) => {
    trips[trip] = {};
    CATS.forEach((cat) => { trips[trip][cat] = []; });
    rooms[trip] = [];
  });
  return { trips, rooms };
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
    if (raw.rooms && Array.isArray(raw.rooms[trip])) base.rooms[trip] = raw.rooms[trip];
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

async function addRoomItem(trip, item) {
  await ensureDoc();
  try {
    await updateDoc(docRef, { [`rooms.${trip}`]: arrayUnion(item) });
  } catch (e) {
    console.error(e);
    showBanner(t("saveError"), true);
  }
}

async function removeRoomItem(trip, item) {
  try {
    await updateDoc(docRef, { [`rooms.${trip}`]: arrayRemove(item) });
  } catch (e) {
    console.error(e);
    showBanner(t("saveError"), true);
  }
}

// ---- rendering ----

function renderAll() {
  TRIPS.forEach((trip) => {
    CATS.forEach((cat) => renderList(trip, cat));
    renderRooms(trip);
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
      return `
      <div class="item-row${isDup ? " is-duplicate" : ""}">
        <div class="item-main">
          <div class="item-text">${escapeHtml(item.text)}${isDup ? ` <span class="dup-badge">${escapeHtml(t("duplicateTag", dupCount))}</span>` : ""}</div>
          <div class="item-meta">${escapeHtml(item.author)} · ${timeAgo(item.ts)}</div>
        </div>
        <button class="delete-btn" data-delete="${trip}|${cat}|${item.id}">${escapeHtml(t("deleteBtn"))}</button>
      </div>
    `;
    }).join("");
}

function renderRooms(trip) {
  const card = document.querySelector(`.category-card[data-trip="${trip}"][data-cat-rooms]`);
  if (!card) return;
  const listEl = card.querySelector("[data-rooms-list]");
  const summaryEl = card.querySelector("[data-rooms-summary]");
  const items = (data.rooms && data.rooms[trip]) || [];
  summaryEl.textContent = items.length ? t("roomsSummary", items.length) : "";
  if (items.length === 0) {
    listEl.innerHTML = `<p class="empty-msg">${escapeHtml(t("emptyRooms"))}</p>`;
    return;
  }
  listEl.innerHTML = items
    .slice()
    .sort((a, b) => b.ts - a.ts)
    .map((item) => `
      <div class="item-row">
        <div class="item-main">
          <div class="item-text">${escapeHtml(item.count)} ${escapeHtml(t("roomCountLabel")).toLowerCase()}</div>
          <div class="item-meta">${escapeHtml(item.author)} · ${timeAgo(item.ts)}</div>
          ${item.note ? `<div class="item-note">${escapeHtml(item.note)}</div>` : ""}
        </div>
        <button class="delete-btn" data-delete-room="${trip}|${item.id}">${escapeHtml(t("deleteBtn"))}</button>
      </div>
    `).join("");
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

  document.querySelectorAll(".category-card[data-cat-rooms] [data-rooms-form]").forEach((form) => {
    const card = form.closest(".category-card");
    const trip = card.getAttribute("data-trip");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameInput = form.querySelector(".name-input");
      const countInput = form.querySelector(".count-input");
      const noteInput = form.querySelector(".note-input");
      const author = nameInput.value.trim();
      const count = parseInt(countInput.value, 10);
      if (!author || !count) return;
      const item = { id: crypto.randomUUID(), author, count, note: noteInput.value.trim(), ts: Date.now() };
      addRoomItem(trip, item);
      countInput.value = "";
      noteInput.value = "";
    });
  });
}

function wireDeleteDelegation() {
  document.getElementById("app").addEventListener("click", (e) => {
    const delBtn = e.target.closest("[data-delete]");
    const delRoomBtn = e.target.closest("[data-delete-room]");
    if (delBtn) {
      const [trip, cat, id] = delBtn.getAttribute("data-delete").split("|");
      const item = (data.trips[trip][cat] || []).find((i) => i.id === id);
      if (!item) return;
      if (!confirm(t("deleteConfirm"))) return;
      removeListItem(trip, cat, item);
    } else if (delRoomBtn) {
      const [trip, id] = delRoomBtn.getAttribute("data-delete-room").split("|");
      const item = (data.rooms[trip] || []).find((i) => i.id === id);
      if (!item) return;
      if (!confirm(t("deleteConfirm"))) return;
      removeRoomItem(trip, item);
    }
  });
}

function init() {
  applyStaticI18n();
  wireLangToggle();
  wireTripTabs();
  wireForms();
  wireDeleteDelegation();
  renderAll();
  startListening();
}

document.addEventListener("DOMContentLoaded", init);
