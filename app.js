(function () {
  "use strict";

  const TRIPS = ["busan", "jeju"];
  const CATS = ["food", "activities", "places", "stays"];

  let lang = localStorage.getItem("wishlist_lang") || "en";
  let data = null;
  let writeChain = Promise.resolve();

  function t(key, ...args) {
    const val = (I18N[lang] || I18N.en)[key];
    return typeof val === "function" ? val(...args) : val;
  }

  function getBlobId() {
    return sessionStorage.getItem("wishlist_blob_override") || (
      typeof BLOB_ID !== "undefined" && BLOB_ID !== "REPLACE_WITH_BLOB_ID" ? BLOB_ID : null
    );
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

  // ---- networking ----

  async function apiLoad() {
    const id = getBlobId();
    if (!id) { data = emptyData(); showBanner(t("notConfigured"), false); return; }
    const res = await fetch(`${BLOB_API_BASE}/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("load failed: " + res.status);
    data = normalize(await res.json());
  }

  async function apiSave() {
    const id = getBlobId();
    if (!id) return;
    const res = await fetch(`${BLOB_API_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("save failed: " + res.status);
  }

  // Serializes mutations: re-fetch latest, apply mutator, save, re-render.
  function mutate(mutator) {
    writeChain = writeChain.then(async () => {
      try {
        await apiLoad();
        mutator(data);
        await apiSave();
        showBanner("", false);
      } catch (e) {
        console.error(e);
        showBanner(t("saveError"), true);
      }
      renderAll();
    });
    return writeChain;
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
    const items = (data && data.trips[trip][cat]) || [];
    if (!getBlobId()) {
      listEl.innerHTML = "";
      return;
    }
    if (items.length === 0) {
      listEl.innerHTML = `<p class="empty-msg">${escapeHtml(t("emptyList"))}</p>`;
      return;
    }
    listEl.innerHTML = items
      .slice()
      .sort((a, b) => b.ts - a.ts)
      .map((item) => `
        <div class="item-row" data-id="${item.id}">
          <div class="item-main">
            <div class="item-text">${escapeHtml(item.text)}</div>
            <div class="item-meta">${escapeHtml(item.author)} · ${timeAgo(item.ts)}</div>
          </div>
          <button class="delete-btn" data-delete="${trip}|${cat}|${item.id}">${escapeHtml(t("deleteBtn"))}</button>
        </div>
      `).join("");
  }

  function renderRooms(trip) {
    const card = document.querySelector(`.category-card[data-trip="${trip}"][data-cat-rooms]`);
    if (!card) return;
    const listEl = card.querySelector("[data-rooms-list]");
    const summaryEl = card.querySelector("[data-rooms-summary]");
    const items = (data && data.rooms[trip]) || [];
    if (!getBlobId()) {
      listEl.innerHTML = "";
      summaryEl.textContent = "";
      return;
    }
    summaryEl.textContent = items.length ? t("roomsSummary", items.length) : "";
    if (items.length === 0) {
      listEl.innerHTML = `<p class="empty-msg">${escapeHtml(t("emptyRooms"))}</p>`;
      return;
    }
    listEl.innerHTML = items
      .slice()
      .sort((a, b) => b.ts - a.ts)
      .map((item) => `
        <div class="item-row" data-id="${item.id}">
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
        if (!getBlobId()) { showBanner(t("notConfigured"), false); return; }
        const nameInput = form.querySelector(".name-input");
        const textInput = form.querySelector(".text-input");
        const author = nameInput.value.trim();
        const text = textInput.value.trim();
        if (!author || !text) return;
        const item = { id: crypto.randomUUID(), text, author, ts: Date.now() };
        mutate((d) => { d.trips[trip][cat].push(item); });
        textInput.value = "";
      });
    });

    document.querySelectorAll(".category-card[data-cat-rooms] [data-rooms-form]").forEach((form) => {
      const card = form.closest(".category-card");
      const trip = card.getAttribute("data-trip");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!getBlobId()) { showBanner(t("notConfigured"), false); return; }
        const nameInput = form.querySelector(".name-input");
        const countInput = form.querySelector(".count-input");
        const noteInput = form.querySelector(".note-input");
        const author = nameInput.value.trim();
        const count = parseInt(countInput.value, 10);
        if (!author || !count) return;
        const item = { id: crypto.randomUUID(), author, count, note: noteInput.value.trim(), ts: Date.now() };
        mutate((d) => { d.rooms[trip].push(item); });
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
        if (!confirm(t("deleteConfirm"))) return;
        mutate((d) => { d.trips[trip][cat] = d.trips[trip][cat].filter((i) => i.id !== id); });
      } else if (delRoomBtn) {
        const [trip, id] = delRoomBtn.getAttribute("data-delete-room").split("|");
        if (!confirm(t("deleteConfirm"))) return;
        mutate((d) => { d.rooms[trip] = d.rooms[trip].filter((i) => i.id !== id); });
      }
    });
  }

  // ---- admin setup ----

  function wireAdmin() {
    const gear = document.getElementById("admin-gear");
    const modal = document.getElementById("admin-modal");
    const createBtn = document.getElementById("admin-create-btn");
    const closeBtn = document.getElementById("admin-close-btn");
    const resultBox = document.getElementById("admin-result");
    const errorBox = document.getElementById("admin-error");
    const idEl = document.getElementById("admin-blob-id");
    const copyBtn = document.getElementById("admin-copy-btn");

    gear.addEventListener("click", () => { modal.hidden = false; });
    closeBtn.addEventListener("click", () => { modal.hidden = true; });
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.hidden = true; });

    createBtn.addEventListener("click", async () => {
      errorBox.hidden = true;
      resultBox.hidden = true;
      createBtn.disabled = true;
      createBtn.textContent = t("adminCreating");
      try {
        const res = await fetch(BLOB_API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emptyData()),
        });
        const location = res.headers.get("Location") || res.headers.get("location");
        let newId = null;
        if (location) {
          newId = location.split("/").filter(Boolean).pop();
        }
        if (!newId) {
          throw new Error("Could not read the new blob ID from the response (Location header missing). Open your browser's DevTools Network tab, find the POST request to jsonblob.com, and copy the ID from its Location response header manually.");
        }
        sessionStorage.setItem("wishlist_blob_override", newId);
        idEl.textContent = newId;
        resultBox.hidden = false;
        await apiLoad();
        renderAll();
        showBanner("", false);
      } catch (e) {
        console.error(e);
        errorBox.textContent = e.message;
        errorBox.hidden = false;
      } finally {
        createBtn.disabled = false;
        createBtn.textContent = t("adminCreateBtn");
      }
    });

    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(idEl.textContent);
        copyBtn.textContent = t("adminCopied");
        setTimeout(() => { copyBtn.textContent = t("adminCopyBtn"); }, 1500);
      } catch (e) { /* clipboard unavailable, user can select manually */ }
    });
  }

  // ---- init ----

  async function init() {
    applyStaticI18n();
    wireLangToggle();
    wireTripTabs();
    wireForms();
    wireDeleteDelegation();
    wireAdmin();

    if (!getBlobId()) {
      data = emptyData();
      showBanner(t("notConfigured"), false);
      renderAll();
      return;
    }

    try {
      await apiLoad();
    } catch (e) {
      console.error(e);
      data = emptyData();
      showBanner(t("loadError"), true);
    }
    renderAll();

    // Light polling so people see each other's additions without reloading.
    setInterval(async () => {
      if (document.activeElement && document.activeElement.tagName === "INPUT") return;
      try {
        await apiLoad();
        showBanner("", false);
        renderAll();
      } catch (e) { /* keep last known good data silently */ }
    }, 20000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
