/* CAMILLA Beauty Studio — app: data, i18n engine, animations, booking */
(function () {
  "use strict";

  /* ============ CONFIG ============ */
  const CONFIG = {
    instagram: "shakhlo_nails",                 // Instagram handle
    telegram: "shahloNailSTUDIO",               // Telegram username
    instagramURL: "https://www.instagram.com/shakhlo_nails",
    telegramURL: "https://t.me/shahloNailSTUDIO",
    tz: "Asia/Tashkent"
  };
  window.CAMILLA_CONFIG = CONFIG;

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============ SERVICE DATA ============ */
  /* price: {t:'exact'|'from'|'range'|'per'|'plus', a, b} ; dur: {h} | {m,h} | {h1,h2} */
  const SERVICES = [
    { id: "m1", cat: "m", img: "portfolio-2", price: { t: "exact", a: 70000 }, dur: { h: 2 },
      name: { ru: "Маникюр без покрытия", uz: "Qoplamasiz manikyur", en: "Manicure without coating" } },
    { id: "m2", cat: "m", img: "portfolio-1", price: { t: "from", a: 140000 }, dur: { h: 2 },
      name: { ru: "Маникюр с покрытием", uz: "Qoplamali manikyur", en: "Manicure with coating" } },
    { id: "m3", cat: "m", img: "portfolio-4", price: { t: "plus", a: 20000 }, dur: { h: 2 },
      name: { ru: "Дизайн", uz: "Dizayn", en: "Nail art design" } },
    { id: "m4", cat: "m", img: "gallery-1", price: { t: "from", a: 300000 }, dur: { h: 2 },
      name: { ru: "Наращивание ногтей", uz: "Tirnoq uzaytirish", en: "Nail extensions" } },
    { id: "m5", cat: "m", img: "portfolio-3", price: { t: "per", a: 25000 }, dur: { h: 2 },
      name: { ru: "Ремонт ногтей", uz: "Tirnoq ta'mirlash", en: "Nail repair" } },
    { id: "m6", cat: "m", img: "gallery-2", price: { t: "exact", a: 30000 }, dur: { h: 2 },
      name: { ru: "Снятие покрытия", uz: "Qoplamani yechish", en: "Coating removal" } },
    { id: "p1", cat: "p", img: null, price: { t: "range", a: 200000, b: 400000 }, dur: { h: 2 },
      name: { ru: "Педикюр", uz: "Pedikyur", en: "Pedicure" } },
    { id: "p2", cat: "p", img: null, price: { t: "exact", a: 150000 }, dur: { h: 2 },
      name: { ru: "Обработка только пальчиков", uz: "Faqat barmoqlarni ishlov berish", en: "Toe-only treatment" } },
    { id: "p3", cat: "p", img: null, price: { t: "exact", a: 150000 }, dur: { h: 2 },
      name: { ru: "Обработка пяток", uz: "Tovonlarni ishlov berish", en: "Heel treatment" } },
    { id: "p4", cat: "p", img: null, price: { t: "from", a: 250000 }, dur: { h: 2 },
      name: { ru: "Педикюр с покрытием", uz: "Qoplamali pedikyur", en: "Pedicure with coating" } },
    { id: "d1", cat: "d", img: null, price: { t: "from", a: 100000 }, dur: { m: 60 },
      name: { ru: "Глубокое бикини", uz: "Chuqur bikini", en: "Deep bikini" } },
    { id: "d2", cat: "d", img: null, price: { t: "exact", a: 30000 }, dur: { m: 30 },
      name: { ru: "Подмышки", uz: "Qo'ltiqlar", en: "Underarms" } },
    { id: "d3", cat: "d", img: null, price: { t: "exact", a: 70000 }, dur: { m: 60 },
      name: { ru: "Руки полностью", uz: "Qo'llar to'liq", en: "Full arms" } },
    { id: "d4", cat: "d", img: null, price: { t: "exact", a: 100000 }, dur: { m: 60 },
      name: { ru: "Ноги полностью", uz: "Oyoqlar to'liq", en: "Full legs" } },
    { id: "a1", cat: "a", img: "access-bars", price: { t: "exact", a: 300000 }, consultation: 500000, dur: { h: 2 }, friday: true,
      name: { ru: "Access Bars", uz: "Access Bars", en: "Access Bars" } }
  ];
  const CATS = [
    { id: "m", img: "portfolio-1", tag: "Precision / Care / Design" },
    { id: "p", img: null, tag: "Balance / Comfort / Detail" },
    { id: "d", img: null, tag: "Clean / Delicate / Smooth" },
    { id: "a", img: "access-bars", tag: "32 points / Release / Awareness" }
  ];
  const REEL_IMGS = ["portfolio-1", "portfolio-2", "portfolio-3", "portfolio-4", "story-before-after", "gallery-1", "gallery-4"];
  const GRID_IMGS = [
    ["portfolio-1", "Lavender glossy manicure close-up"],
    ["portfolio-2", "Nude manicure with line art"],
    ["portfolio-3", "Deep red manicure"],
    ["portfolio-4", "Purple floral manicure"],
    ["gallery-1", "Nail art detail"],
    ["gallery-2", "Product set with violet tones"],
    ["gallery-4", "Premium cosmetic hand composition"]
  ];

  /* ============ I18N ============ */
  let lang = localStorage.getItem("camilla_lang") || "ru";
  if (!window.I18N[lang]) lang = "ru";
  const t = (k) => (window.I18N[lang] && window.I18N[lang][k]) || window.I18N.ru[k] || k;
  const loc = () => ({ ru: "ru-RU", uz: "uz-UZ", en: "en-US" }[lang]);

  const nf = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  function fmtPrice(p) {
    if (lang === "ru") {
      if (p.t === "exact") return nf(p.a) + " сум";
      if (p.t === "from") return "от " + nf(p.a) + " сум";
      if (p.t === "plus") return "от +" + nf(p.a) + " сум";
      if (p.t === "range") return "от " + nf(p.a) + " до " + nf(p.b) + " сум";
      return nf(p.a) + " сум / 1 ноготь";
    }
    if (lang === "uz") {
      if (p.t === "exact") return nf(p.a) + " so'm";
      if (p.t === "from") return nf(p.a) + " so'mdan";
      if (p.t === "plus") return "+" + nf(p.a) + " so'mdan";
      if (p.t === "range") return nf(p.a) + " – " + nf(p.b) + " so'm";
      return nf(p.a) + " so'm / 1 tirnoq";
    }
    if (p.t === "exact") return nf(p.a) + " UZS";
    if (p.t === "from") return "from " + nf(p.a) + " UZS";
    if (p.t === "plus") return "from +" + nf(p.a) + " UZS";
    if (p.t === "range") return nf(p.a) + " – " + nf(p.b) + " UZS";
    return nf(p.a) + " UZS / nail";
  }
  function fmtDur(d) {
    if (d.h1) {
      return lang === "ru" ? "1–1,5 часа" : lang === "uz" ? "1–1,5 soat" : "1–1.5 h";
    }
    if (d.m) {
      return lang === "ru" ? `${d.m} минут` : lang === "uz" ? `${d.m} daqiqa` : `${d.m} min`;
    }
    return lang === "ru" ? d.h + " часа" : lang === "uz" ? d.h + " soat" : d.h + " h";
  }

  function applyI18n() {
    document.documentElement.lang = lang;
    document.title = t("meta.title");
    $('meta[name="description"]').setAttribute("content", t("meta.desc"));
    $$("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    $$("[data-i18n-ph]").forEach((el) => el.setAttribute("placeholder", t(el.dataset.i18nPh)));
    $$("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    $$(".lang-btn").forEach((b) => b.classList.toggle("on", b.dataset.lang === lang));
    renderCatalog();
    renderBookingStep();
    renderStatus();
    renderMarquees();
  }
  function setLang(l) {
    lang = l;
    localStorage.setItem("camilla_lang", l);
    applyI18n();
  }

  /* ============ CATALOG ============ */
  let catFilter = "all";
  let searchQ = "";

  function renderCatalog() {
    const wrap = $("#cats");
    if (!wrap) return;
    const list = CATS.filter((c) => catFilter === "all" || c.id === catFilter);
    let html = "";
    list.forEach((c, ci) => {
      const rows = SERVICES.filter((s) => s.cat === c.id)
        .filter((s) => !searchQ || s.name[lang].toLowerCase().includes(searchQ));
      const visible = rows.length > 0;
      html += `
      <article class="cat ${visible ? "" : "hide"}" data-cat="${c.id}" style="--i:${ci}">
        <header class="cat-head" data-reveal="right">
          <span class="cat-num">${String(ci + 1).padStart(2, "0")}</span>
          <div>
            <h3>${t("cat." + c.id)}</h3>
          <p class="cat-tag">${c.tag}</p>${c.id === "a" ? `<p class="cat-desc">${t("cat.a.desc")}</p>` : ""}
          </div>
          ${c.img && c.id !== "p" && c.id !== "d" ? `<div class="cat-visual"><img src="images/${c.img}.jpg" alt="${t("cat." + c.id)}" loading="lazy" class="kb"></div>` : ""}
        </header>
        <div class="table" role="table">
          <div class="tr th" role="row">
            <span>${t("serv.c.no")}</span><span>${t("serv.c.service")}</span><span class="c-cat">${t("serv.c.cat")}</span><span class="c-price">${t("serv.c.price")}</span><span class="c-time">${t("serv.c.time")}</span><span class="c-book">${t("serv.c.book")}</span>
          </div>
          ${rows.map((s, i) => `
          <div class="tr ${s.consultation ? "consultation-row" : ""}" role="row" data-reveal style="--d:${i * 60}ms">
            <span class="c-no">${String(i + 1).padStart(2, "0")}</span>
            <span class="c-name">${s.img && s.cat !== "p" && s.cat !== "d" ? `<img class="thumb" src="images/${s.img}.jpg" alt="" loading="lazy">` : ""}<b>${s.name[lang]}</b>${s.friday ? '<em class="fri">FRIDAY ONLY</em>' : ""}</span>
            <span class="c-cat">${t("cat." + s.cat)}</span>
            <span class="c-price"><b>${fmtPrice(s.price)}</b>${s.consultation ? `<span class="consultation-hint">${t("serv.consultation")}: ${nf(s.consultation)} ${lang === "ru" ? "сум" : lang === "uz" ? "so'm" : "UZS"}</span>` : ""}</span>
            <span class="c-time">${fmtDur(s.dur)}</span>
            <span class="c-book"><button class="btn btn-sm row-book" data-service="${s.id}">${t("serv.book")}</button></span>
          </div>`).join("")}
        </div>
      </article>`;
    });
    const any = list.some((c) => SERVICES.some((s) => s.cat === c.id && (!searchQ || s.name[lang].toLowerCase().includes(searchQ))));
    wrap.innerHTML = html + (any ? "" : `<p class="empty">${t("serv.empty")}</p>`);
    observeReveals(wrap);
  }

  /* ============ REVEAL ON SCROLL ============ */
  let io;
  function observeReveals(scope) {
    if (!io) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    }
    $$("[data-reveal]:not(.in)", scope).forEach((el) => {
      if (RM) { el.classList.add("in"); return; }
      io.observe(el);
    });
  }

  /* ============ HERO SPLIT TEXT ============ */
  function splitHero() {
    const h = $("#heroTitle");
    if (!h || RM) return;
    const text = h.textContent;
    h.setAttribute("aria-label", text);
    h.innerHTML = text.split(" ").map((w, i) =>
      `<span class="w" style="--wi:${i}"><span class="wi">${w}</span></span>`).join(" ");
  }

  /* ============ COUNTERS ============ */
  function counters() {
    $$("[data-count]").forEach((el) => {
      const target = +el.dataset.count;
      if (RM) { el.textContent = target; return; }
      const io2 = new IntersectionObserver((es) => {
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          io2.disconnect();
          const t0 = performance.now(), dur = 1400;
          const tick = (now) => {
            const p = Math.min(1, (now - t0) / dur);
            el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      }, { threshold: 0.6 });
      io2.observe(el);
    });
  }

  /* ============ CUSTOM BRUSH CURSOR ============ */
  function cursor() {
    if (RM || !window.matchMedia("(pointer:fine)").matches) return;
    const brush = $("#brushCursor");
    if (!brush) return;

    let lastSparkle = 0;
    function createSparkle(x, y) {
      if (RM) return;
      const now = performance.now();
      if (now - lastSparkle < 55) return;
      lastSparkle = now;
      const p = document.createElement("span");
      p.className = "brush-particle";
      const size = 4 + Math.random() * 6;
      p.style.width = size + "px";
      p.style.height = size + "px";
      p.style.left = (x - 2) + "px";
      p.style.top = (y - 2) + "px";
      p.style.setProperty("--dx", ((Math.random() - 0.5) * 28) + "px");
      p.style.setProperty("--dy", ((Math.random() - 0.5) * 28 + 14) + "px");
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 650);
    }

    addEventListener("mousemove", (e) => {
      brush.style.opacity = "1";
      brush.style.transform = `translate(${e.clientX - 6}px, ${e.clientY - 6}px)`;
      createSparkle(e.clientX, e.clientY);
    });

    document.addEventListener("mouseleave", () => {
      brush.style.opacity = "0";
    });
    document.addEventListener("mouseenter", () => {
      brush.style.opacity = "1";
    });

    document.addEventListener("mouseover", (e) => {
      const hit = e.target.closest("a,button,.chip,.tr,[data-tilt],input,textarea,.tab,.lang-btn,.ig-item,.row-book");
      brush.classList.toggle("hovering", !!hit);
    });

    document.addEventListener("mousedown", () => {
      brush.classList.add("clicking");
    });
    document.addEventListener("mouseup", () => {
      brush.classList.remove("clicking");
    });
  }

  /* ============ RIPPLE (click feedback) ============ */
  function ripple() {
    document.addEventListener("pointerdown", (e) => {
      const el = e.target.closest(".btn,.chip,.tab,.lang-btn,.ig-item,.row-book");
      if (!el || RM) return;
      const r = document.createElement("span");
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2.2;
      r.className = "ripple";
      r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
      el.appendChild(r);
      setTimeout(() => r.remove(), 700);
    });
  }

  /* ============ MAGNETIC BUTTONS ============ */
  function magnetic() {
    if (RM || !window.matchMedia("(pointer:fine)").matches) return;
    $$(".magnet").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) / r.width;
        const dy = (e.clientY - r.top - r.height / 2) / r.height;
        el.style.transform = `translate(${dx * 14}px,${dy * 10}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ============ TILT CARDS ============ */
  function tilt() {
    if (RM || !window.matchMedia("(pointer:fine)").matches) return;
    $$("[data-tilt]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) translateY(-4px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ============ HEADER / PROGRESS / PARALLAX ============ */
  function scrollFx() {
    const header = $("#header"), bar = $(".progress i"), totop = $("#totop"), barMobile = $(".mobile-bar");
    let lastY = 0, ticking = false;
    const onScroll = () => {
      const y = scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      header.classList.toggle("scrolled", y > 40);
      header.classList.toggle("hidden", y > 500 && y > lastY + 4);
      if (y < 500 || y < lastY - 4) header.classList.remove("hidden");
      totop.classList.toggle("show", y > 900);
      const bk = $("#booking");
      const inBook = bk && y + innerHeight * 0.6 > bk.offsetTop && y < bk.offsetTop + bk.offsetHeight;
      barMobile.classList.toggle("show", y > 700 && !inBook);
      /* hero parallax */
      if (y < innerHeight * 1.2 && !RM) {
        $$("[data-parallax]").forEach((el) => {
          el.style.transform = `translate3d(0, ${y * parseFloat(el.dataset.parallax)}px, 0)`;
        });
      }
      /* scrollspy */
      let cur = "";
      ["specialist", "services", "reels", "booking", "info", "instagram", "contacts"].forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= innerHeight * 0.42) cur = id;
      });
      $$(".nav a, .mobile-menu nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + cur));
      lastY = y;
      ticking = false;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }

  /* ============ PINNED HORIZONTAL REEL ============ */
  function reel() {
    const wrap = $(".reel-wrap"), track = $(".reel-track");
    if (!wrap || !track) return;
    if (RM) { wrap.classList.add("static"); return; }
    let ticking = false;
    const update = () => {
      const rect = wrap.getBoundingClientRect();
      const total = wrap.offsetHeight - innerHeight;
      const p = Math.min(1, Math.max(0, -rect.top / total));
      const dist = track.scrollWidth - innerWidth + 80;
      track.style.transform = `translate3d(${-p * dist}px,0,0)`;
      /* center-focus scale on reel cards */
      if (!RM) {
        Array.from(track.children).forEach((c) => {
          const r = c.getBoundingClientRect();
          const d = Math.abs(r.left + r.width / 2 - innerWidth / 2) / innerWidth;
          c.style.transform = `scale(${(1.05 - Math.min(d, 0.6) * 0.16).toFixed(3)})`;
          c.style.opacity = (1 - Math.min(d, 0.7) * 0.45).toFixed(2);
        });
      }
      const pct = $(".reel-pct");
      if (pct) pct.textContent = String(Math.round(p * 100)).padStart(2, "0") + "%";
      ticking = false;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener("resize", update);
    update();
  }

  /* ============ OPEN / CLOSED STATUS ============ */
  function tashkentNow() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: CONFIG.tz }));
  }
  function statusNow() {
    const d = tashkentNow();
    const h = d.getHours() + d.getMinutes() / 60;
    if (h >= 12 && h < 13) return "break";
    if (h >= 9 && h < 18) return "open";
    return "closed";
  }
  function renderStatus() {
    const s = statusNow();
    const timeStr = tashkentNow().toLocaleTimeString(loc(), { hour: '2-digit', minute: '2-digit' });
    $$("[data-status]").forEach((el) => {
      el.dataset.state = s;
      el.innerHTML = `<i></i>${t("status." + s)} <span>· ${timeStr}</span>`;
    });
  }

  /* ============ BOOKING ============ */
  const B = { step: 1, services: [], date: null, time: null, name: "", contact: "", comment: "", bookingNo: null };
  function bookingNumber() { if (!B.bookingNo) B.bookingNo = "CAM-" + String(Date.now()).slice(-6); return B.bookingNo; }
  let weekOffset = 0;
  let currentUser = null;

  async function api(path, options = {}) {
    const res = await fetch(path, { headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
    const data = res.status === 204 ? {} : await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function loadUser() {
    try { currentUser = (await api("/api/auth/me")).user; } catch (_) { currentUser = null; }
  }

  function serviceById(id) { return SERVICES.find((s) => s.id === id); }
  function selectedServices() { return B.services.map(serviceById).filter(Boolean); }
  function totalMinutes() { const service = serviceById(B.services[0]); return service ? (service.dur.m || service.dur.h * 60) : 120; }
  function totalPrice() { return selectedServices().reduce((n, s) => n + s.price.a, 0); }
  const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  let occupiedBookings = [];

  function dates() {
    const out = [];
    const base = tashkentNow();
    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      out.push(d);
    }
    return out;
  }
  function timeLabel(minutes) { return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`; }
  function isOccupied(date, start, duration) {
    const day = isoDate(date), startsAt = start * 60;
    return occupiedBookings.some((booking) => booking.starts_at.slice(0, 10) === day &&
      Number(booking.starts_at.slice(11, 13)) * 60 + Number(booking.starts_at.slice(14, 16)) < startsAt + duration &&
      Number(booking.ends_at.slice(11, 13)) * 60 + Number(booking.ends_at.slice(14, 16)) > startsAt);
  }
  function slotsFor(date) {
    const duration = totalMinutes();
    if (duration === 120) return [540, 780, 900].filter((start) => !isOccupied(date, start, duration));
    const slots = [];
    for (let start = 540; start + duration <= 1080; start += 30) {
      if (start < 780 && start + duration > 720) continue;
      if (!isOccupied(date, start, duration)) slots.push(start);
    }
    return slots;
  }
  async function loadOccupiedBookings() {
    try { occupiedBookings = (await api("/api/bookings/occupied")).bookings || []; renderBookingStep(); }
    catch (_) { occupiedBookings = []; }
  }
  function renderWeekSchedule() {
    const host = $("#weekSchedule"); if (!host) return;
    const base = tashkentNow();
    const todayIso = isoDate(base);
    const clock = $("#liveClock");
    if (clock) clock.textContent = base.toLocaleTimeString(loc(), { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const caption = $("#todayCaption");
    if (caption) caption.textContent = base.toLocaleDateString(loc(), { weekday: "long", day: "numeric", month: "long" });
    const d = base, open=540, close=1080;
    host.innerHTML = (() => {
      const duration = 120, blocks=[]; const h=timeLabel;
      const nowMinutes = base.getHours()*60 + base.getMinutes();
      for (const m of [open, 780, 900]) { const end=m+duration; if (m <= nowMinutes) continue; const selected=B.date===todayIso&&B.time===h(m), busy=isOccupied(base, m, duration); blocks.push(`<button class="week-slot ${selected?"is-selected":busy?"is-busy":"is-free"}" data-week-date="${todayIso}" data-week-time="${busy ? "" : h(m)}" ${busy ? 'data-week-busy="true"' : ""}><b>${h(m)}–${h(end)}</b><small>${selected?"Выбрано ✓":busy?"Занято":"Доступно"}</small></button>`); if (m === open) blocks.push(`<span class="week-slot is-pause"><b>12:00–13:00</b><small>Перерыв</small></span>`); }
      return `<div class="week-day today"><header><b>${d.toLocaleDateString(loc(), {weekday:"long", day:"numeric", month:"long"})}</b></header><div class="week-slots">${blocks.length ? blocks.join("") : '<em>На сегодня свободных интервалов не осталось</em>'}</div></div>`;
    })();
  }

  /* ============ FORM VALIDATION HELPERS ============ */
  function validateName(val) {
    const v = (val || "").trim();
    if (!v) return { valid: false, msg: t("book.errName") || "Укажите ваше имя", state: "empty" };
    if (v.length < 2) return { valid: false, msg: "Слишком короткое имя (минимум 2 буквы)", state: "err" };
    if (!/^[A-Za-zА-Яа-яЁёЎўҚқҒғҲҳ\s\-']{2,50}$/.test(v)) {
      return { valid: false, msg: "Нельзя знаки и цифры — только буквы имени", state: "err" };
    }
    return { valid: true, msg: "Имя заполнено верно ✓", state: "ok" };
  }

  function validateContact(val) {
    const v = (val || "").trim();
    if (!v) return { valid: false, msg: t("book.errContact") || "Укажите телефон или Telegram", state: "empty" };
    if (v.startsWith("@")) {
      if (/^@[A-Za-z0-9_]{4,32}$/.test(v)) {
        return { valid: true, msg: "Telegram указан верно ✓", state: "ok" };
      }
      return { valid: false, msg: "Telegram ник от 4 символов (напр: @username)", state: "err" };
    }
    const digits = v.replace(/[\s\-\(\)\+]/g, "");
    if (/^[\+]?[\d\s\-\(\)]{9,20}$/.test(v) && digits.length >= 9 && digits.length <= 15) {
      return { valid: true, msg: "Номер телефона подтверждён ✓", state: "ok" };
    }
    return { valid: false, msg: "Реальный номер (+998...) или Telegram (@ник)", state: "err" };
  }

  function setupLiveValidation() {
    const nameInput = $("#bName");
    const contactInput = $("#bContact");
    const commentInput = $("#bComment");
    if (!nameInput || !contactInput) return;

    function checkField(input, validator, statusEl, hintEl, defaultHint) {
      const res = validator(input.value);
      const wrap = input.closest(".input-wrap");
      if (res.state === "empty") {
        if (wrap) wrap.classList.remove("is-valid", "is-invalid");
        if (statusEl) { statusEl.textContent = ""; statusEl.className = "field-status"; }
        if (hintEl) { hintEl.textContent = defaultHint; hintEl.className = "field-hint"; }
      } else if (res.valid) {
        if (wrap) { wrap.classList.add("is-valid"); wrap.classList.remove("is-invalid"); }
        if (statusEl) { statusEl.textContent = "✓"; statusEl.className = "field-status ok"; }
        if (hintEl) { hintEl.textContent = res.msg; hintEl.className = "field-hint ok"; }
      } else {
        if (wrap) { wrap.classList.add("is-invalid"); wrap.classList.remove("is-valid"); }
        if (statusEl) { statusEl.textContent = "✕"; statusEl.className = "field-status err"; }
        if (hintEl) { hintEl.textContent = res.msg; hintEl.className = "field-hint err"; }
      }
    }

    const nameStatus = $("#nameStatus");
    const nameMsg = $("#nameMsg");
    const contactStatus = $("#contactStatus");
    const contactMsg = $("#contactMsg");
    const defNameHint = t("book.nameHint") || "Имя и фамилия (только буквы, от 2 символов)";
    const defContactHint = t("book.contactHint") || "Реальный номер (+998...) или Telegram ник (@username)";

    nameInput.addEventListener("input", () => {
      B.name = nameInput.value;
      checkField(nameInput, validateName, nameStatus, nameMsg, defNameHint);
    });

    contactInput.addEventListener("input", () => {
      B.contact = contactInput.value;
      checkField(contactInput, validateContact, contactStatus, contactMsg, defContactHint);
    });

    if (commentInput) {
      commentInput.addEventListener("input", () => {
        B.comment = commentInput.value;
      });
    }

    if (B.name) checkField(nameInput, validateName, nameStatus, nameMsg, defNameHint);
    if (B.contact) checkField(contactInput, validateContact, contactStatus, contactMsg, defContactHint);
  }

  function renderBookingStep() {
    const panel = $("#bookPanels");
    if (!panel) return;
    $$(".step-dot").forEach((d) => {
      const n = +d.dataset.step;
      d.classList.toggle("on", n === B.step);
      d.classList.toggle("done", n < B.step);
    });
    $("#bookNext").style.display = B.step === 5 ? "none" : "";
    $("#bookBack").style.display = B.step === 1 ? "none" : "";
    $("#bookStepTitle").textContent = t("book.s" + B.step);
    $("#bookStepNo").textContent = String(B.step).padStart(2, "0");

    if (B.step === 1) {
      panel.innerHTML = `<p class="booking-hint">Маникюр, педикюр и Access Bars занимают 2 часа. Для депиляции показывается её точная длительность.</p><div class="selected-total"><b>${B.services.length ? `Выбрано: ${B.services.length} · ${fmtDur(serviceById(B.services[0]).dur)}` : "Пока ничего не выбрано"}</b><span>${nf(totalPrice())} сум</span></div><div class="chips anim">${CATS.map((c) => `
        <div class="chip-group"><h4>${t("cat." + c.id)}</h4><div class="chip-row">
        ${SERVICES.filter((s) => s.cat === c.id).map((s) => `
          <button class="chip ${B.services.includes(s.id) ? "on" : ""}" data-pick-service="${s.id}">
            <b>${s.name[lang]}</b><span>${fmtPrice(s.price)}</span>
          </button>`).join("")}
        </div></div>`).join("")}</div>`;
    }
    if (B.step === 2) {
      const svc = serviceById(B.services[0]);
      panel.innerHTML = `
        <div class="date-grid anim">${dates().map((d) => {
          const iso = isoDate(d), fri = d.getDay() === 5, dis = svc && (svc.friday ? !fri : fri);
          const wd = d.toLocaleDateString(loc(), { weekday: "short" });
          const mo = d.toLocaleDateString(loc(), { month: "short" });
          return `<button ${dis ? "disabled" : ""} class="chip date ${B.date === iso ? "on" : ""} ${dis ? "dis" : ""}" data-pick-date="${iso}">
            <span class="wd">${wd}</span><b>${d.getDate()}</b><span class="mo">${mo}</span>
          </button>`;
        }).join("")}</div>`;
    }
    if (B.step === 3) {
      const d = B.date ? new Date(B.date + "T12:00:00") : null;
      panel.innerHTML = d ? `<div class="time-grid anim">${slotsFor(d).map((s) =>
        `<button class="chip time ${B.time === timeLabel(s) ? "on" : ""}" data-pick-time="${timeLabel(s)}">${timeLabel(s)}–${timeLabel(s + totalMinutes())}</button>`).join("") || '<p class="empty">На эту дату свободного времени нет.</p>'}</div>`
        : `<p class="empty">${t("book.errDate")}</p>`;
    }
    if (B.step === 4) {
      const uIcon = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
      const pIcon = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
      const cIcon = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
      panel.innerHTML = `<div class="form anim">
        <div class="form-field-group">
          <div class="field-header">
            <span class="field-title">${t("book.name")} *</span>
            <span id="nameStatus" class="field-status"></span>
          </div>
          <div class="input-wrap">
            <i class="i-icon">${uIcon}</i>
            <input id="bName" type="text" value="${esc(B.name)}" placeholder="Шахло Сайтова" autocomplete="name" />
          </div>
          <p id="nameMsg" class="field-hint">${t("book.nameHint") || "Имя и фамилия (только буквы, от 2 символов)"}</p>
        </div>

        <div class="form-field-group">
          <div class="field-header">
            <span class="field-title">${t("book.contact")} *</span>
            <span id="contactStatus" class="field-status"></span>
          </div>
          <div class="input-wrap">
            <i class="i-icon">${pIcon}</i>
            <input id="bContact" type="text" value="${esc(B.contact)}" placeholder="+998 94 121 54 44 или @username" autocomplete="tel" />
          </div>
          <p id="contactMsg" class="field-hint">${t("book.contactHint") || "Реальный номер (+998...) или Telegram ник (@username)"}</p>
        </div>

        <div class="form-field-group">
          <div class="field-header">
            <span class="field-title">${t("book.comment")}</span>
          </div>
          <div class="input-wrap top-icon">
            <i class="i-icon">${cIcon}</i>
            <textarea id="bComment" rows="3" placeholder="Пожелания по дизайну или время...">${esc(B.comment)}</textarea>
          </div>
        </div>
      </div>`;
      setupLiveValidation();
    }
    if (B.step === 5) {
      const svc = serviceById(B.services[0]);
      const d = new Date(B.date + "T12:00:00");
      panel.innerHTML = `<div class="summary anim">
        <h4>${t("book.summary")}</h4>
        <ul>
          <li><span>${t("serv.c.service")}</span><b>${selectedServices().map((s) => s.name[lang]).join(", ") || "—"}</b></li>
          <li><span>${t("serv.c.price")}</span><b>${nf(totalPrice())} сум · ${Math.floor(totalMinutes()/60)} ч ${totalMinutes()%60 ? totalMinutes()%60 + " мин" : ""}</b></li>
          <li><span>${t("book.lDate")}</span><b>${d.toLocaleDateString(loc(), { weekday: "long", day: "numeric", month: "long" })}</b></li>
          <li><span>${t("book.lTime")}</span><b>${B.time}</b></li>
          <li><span>${t("book.name")}</span><b>${esc(B.name)}</b></li>
          ${B.contact ? `<li><span>${t("book.contact")}</span><b>${esc(B.contact)}</b></li>` : ""}
          ${B.comment ? `<li><span>${t("book.comment")}</span><b>${esc(B.comment)}</b></li>` : ""}
          <li class="booking-number"><span>Номер записи</span><b>#${bookingNumber()}</b></li>
        </ul>
      </div>
      <div class="booking-confirm">
        <button id="submitBooking" class="btn btn-primary" type="button">Подтвердить запись</button>
      </div>`;
      sparkles($(".summary"));
    }
    observeReveals(panel);
    renderWeekSchedule();
  }

  function esc(s) { return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  function icon(n) {
    if (n === "tg") return '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M9.04 15.31l-.38 5.35c.54 0 .78-.23 1.06-.5l2.55-2.44 5.28 3.87c.97.53 1.66.25 1.92-.9l3.48-16.3c.31-1.44-.51-2-1.46-1.65L1.6 10.62c-1.4.55-1.38 1.33-.24 1.68l5.2 1.62L18.6 6.3c.57-.37 1.08-.17.66.2L9.04 15.31z"/></svg>';
    if (n === "ig") return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>';
    if (n === "copy") return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
    return "";
  }

  function bookingMessage() {
    const svcs = selectedServices();
    const d = new Date(B.date + "T12:00:00");
    const date = d.toLocaleDateString(loc(), { weekday: "long", day: "numeric", month: "long" });
    const L = {
      ru: ["Здравствуйте! Хочу записаться в CAMILLA.", `Услуги: ${svcs.map(s => s.name.ru).join(", ")}`, `Дата: ${date}`, `Время: ${B.time}`, `Имя: ${B.name}`, `Номер записи: #${bookingNumber()}`],
      uz: ["Salom! CAMILLA ga yozilmoqchiman.", `Xizmatlar: ${svcs.map(s => s.name.uz).join(", ")}`, `Sana: ${date}`, `Vaqt: ${B.time}`, `Ism: ${B.name}`, `Booking: #${bookingNumber()}`],
      en: ["Hello! I'd like to book at CAMILLA.", `Services: ${svcs.map(s => s.name.en).join(", ")}`, `Date: ${date}`, `Time: ${B.time}`, `Name: ${B.name}`, `Booking number: #${bookingNumber()}`]
    }[lang];
    if (B.contact) L.push(lang === "ru" ? `Контакт: ${B.contact}` : lang === "uz" ? `Kontakt: ${B.contact}` : `Contact: ${B.contact}`);
    if (B.comment) L.push(lang === "ru" ? `Комментарий: ${B.comment}` : lang === "uz" ? `Izoh: ${B.comment}` : `Comment: ${B.comment}`);
    return L.join("\n");
  }

  async function saveBooking(openTelegram) {
    if (!currentUser) {
      toast("Чтобы подтвердить запись, войдите через иконку аккаунта");
      $("#accountBtn")?.focus();
      return;
    }
    const startMinutes = Number(B.time.slice(0, 2)) * 60 + Number(B.time.slice(3, 5));
    const endTime = timeLabel(startMinutes + totalMinutes());
    await api("/api/bookings", { method: "POST", body: JSON.stringify({ specialist_id: 1, service_id: B.services[0], starts_at: `${B.date}T${B.time}`, ends_at: `${B.date}T${endTime}`, name: B.name, notes: B.comment, contact: B.contact, language: lang }) });
    await loadOccupiedBookings();
    toast("Запись сохранена — владелец получил уведомление");
    if (openTelegram) window.open(CONFIG.telegramURL, "_blank", "noopener");
  }

  function toast(msg) {
    const box = $(".toasts");
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    box.appendChild(el);
    requestAnimationFrame(() => el.classList.add("on"));
    setTimeout(() => { el.classList.remove("on"); setTimeout(() => el.remove(), 400); }, 3200);
  }

  function showAuth() {
    const modal = $("#authModal");
    if (!modal) return;
    const card = $(".auth-card", modal);
    card.classList.add("register");
    $("#authTitle").textContent = "Создать аккаунт";
    $("#authHint").textContent = "Сейчас вы в гостевом режиме. Зарегистрируйтесь по email и паролю, чтобы сохранять записи.";
    $("#authSubmit").textContent = "Зарегистрироваться";
    $("#authSwitch").textContent = "У меня уже есть аккаунт";
    $("#authPassword").autocomplete = "new-password";
    renderGoogleSignIn();
    modal.classList.add("on"); modal.setAttribute("aria-hidden", "false");
  }

  async function handleGoogleCredential(response) {
    $("#authError").textContent = "";
    try {
      const data = await api("/api/auth/google", { method: "POST", body: JSON.stringify({ credential: response.credential, language: lang }) });
      currentUser = data.user;
      $("#authModal").classList.remove("on");
      if (currentUser.role === "ADMIN") window.location.assign("dashboard.html");
      else toast("Вход через Google выполнен — подтвердите запись");
    } catch (err) { $("#authError").textContent = err.message; }
  }

  async function renderGoogleSignIn() {
    const host = $("#googleSignIn"), hint = $("#googleAuthHint");
    if (!host || host.dataset.rendered) return;
    try {
      const { client_id: clientId } = await api("/api/auth/google/config");
      if (!clientId) {
        hint.hidden = false;
        hint.textContent = "Вход через Google появится после настройки Google Client ID.";
        return;
      }
      const draw = () => {
        if (!window.google?.accounts?.id) return setTimeout(draw, 80);
        window.google.accounts.id.initialize({ client_id: clientId, callback: handleGoogleCredential, auto_select: false });
        window.google.accounts.id.renderButton(host, { theme: "outline", size: "large", text: "continue_with", shape: "pill", width: 350, locale: "ru" });
        host.dataset.rendered = "true";
      };
      draw();
    } catch (_) { hint.hidden = false; hint.textContent = "Не удалось загрузить вход через Google."; }
  }

  async function showAdmin() {
    const modal = $("#adminModal"), list = $("#adminBookings"), analytics = $("#adminAnalytics"), notifications = $("#adminNotifications");
    if (!modal || !list) return;
    modal.classList.add("on"); modal.setAttribute("aria-hidden", "false");
    list.innerHTML = "<p class=\"muted\">Загружаем записи…</p>";
    try {
      const [{ bookings }, stats, { notifications: notices }] = await Promise.all([api("/api/admin/bookings"), api("/api/admin/analytics"), api("/api/notifications")]);
      analytics.innerHTML = [[stats.total, "Всего записей"], [stats.pending, "Ожидают"], [stats.confirmed, "Подтверждены"], [stats.customers, "Клиенты"], [`${nf(stats.week_total)} сум`, "За 7 дней"], [`${nf(stats.paid_total)} сум`, "Оплачено"]].map(([value, label]) => `<div class="admin-metric"><b>${value}</b><span>${label}</span></div>`).join("") + (stats.weekly_services.length ? `<div class="trend-card"><b>Тренды за 7 дней</b>${stats.weekly_services.map((s) => `<span>${esc(s.name)} <strong>${s.count}</strong> · ${nf(s.amount)} сум</span>`).join("")}</div>` : "");
      notifications.innerHTML = notices.length ? `<p class="eyebrow small"><span class="line"></span><span>НОВЫЕ УВЕДОМЛЕНИЯ · ${stats.unread_notifications}</span></p>` + notices.slice(0, 5).map((n) => `<div class="admin-notification">${esc(n.message)}<br><small>${esc(n.created_at)}</small></div>`).join("") : "";
      list.innerHTML = bookings.length ? bookings.map((b) => `<article class="admin-booking"><b>${esc(b.service_name)} · ${nf(b.price_uzs)} сум</b><span>${esc(b.starts_at.replace("T", " "))}–${esc(b.ends_at.slice(11, 16))}</span><small>${esc(b.customer_name || "Клиент")} · ${esc(b.contact || b.customer_email || "контакт не указан")} · ${esc(b.status)} · ${b.payment_status === "PAID" ? "ОПЛАЧЕНО" : "НЕ ОПЛАЧЕНО"}</small><div><button class="btn btn-sm btn-primary" data-admin-status="CONFIRMED" data-booking-id="${b.id}">Подтвердить</button><button class="btn btn-sm btn-ghost" data-admin-status="CANCELLED" data-booking-id="${b.id}">Отменить</button><button class="btn btn-sm btn-ghost" data-payment-status="${b.payment_status === "PAID" ? "UNPAID" : "PAID"}" data-booking-id="${b.id}">${b.payment_status === "PAID" ? "Отметить неоплату" : "Оплачено"}</button></div></article>`).join("") : "<p class=\"muted\">Записей пока нет.</p>";
    } catch (err) { list.innerHTML = `<p class="auth-error">${esc(err.message)}</p>`; }
  }

  async function showProfile() {
    const modal = $("#profileModal"), list = $("#profileBookings");
    modal.classList.add("on"); modal.setAttribute("aria-hidden", "false");
    list.innerHTML = "<p class=\"muted\">Загружаем ваши записи…</p>";
    try {
      const { bookings } = await api("/api/bookings");
      list.innerHTML = bookings.length ? bookings.map((b) => `<article class="admin-booking"><b>${esc(b.service_name)}</b><span>${esc(b.starts_at.replace("T", " "))}–${esc(b.ends_at.slice(11, 16))}</span><small>Статус: ${esc(b.status)}</small></article>`).join("") : "<p class=\"muted\">У вас пока нет записей. Выберите услугу и удобное время.</p>";
    } catch (err) { list.innerHTML = `<p class="auth-error">${esc(err.message)}</p>`; }
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    currentUser = null;
    $("#profileModal")?.classList.remove("on");
    toast("Вы вышли из аккаунта — доступен гостевой режим");
  }

  function authEvents() {
    const modal = $("#authModal"), form = $("#authForm"), card = $(".auth-card", modal);
    if (!modal) return;
    $("#accountBtn")?.addEventListener("click", () => {
      if (currentUser?.role === "ADMIN") return window.location.assign("dashboard.html");
      if (currentUser) return showProfile();
      showAuth();
    });
    $("#authClose").addEventListener("click", () => modal.classList.remove("on"));
    $("#authSwitch").addEventListener("click", () => {
      const register = !card.classList.contains("register");
      card.classList.toggle("register", register);
      $("#authTitle").textContent = register ? "Создать аккаунт" : "Войти в аккаунт";
      $("#authHint").textContent = register ? "Регистрация доступна по email и паролю." : "Введите email и пароль своего аккаунта.";
      $("#authSubmit").textContent = register ? "Зарегистрироваться" : "Войти";
      $("#authSwitch").textContent = register ? "У меня уже есть аккаунт" : "Создать аккаунт";
      $("#authPassword").autocomplete = register ? "new-password" : "current-password";
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault(); $("#authError").textContent = "";
      const register = card.classList.contains("register");
      try {
        const data = await api(register ? "/api/auth/register" : "/api/auth/login", { method: "POST", body: JSON.stringify({ email: $("#authEmail").value, password: $("#authPassword").value, language: lang }) });
        currentUser = data.user; modal.classList.remove("on");
        if (currentUser.role === "ADMIN") { window.location.assign("dashboard.html"); } else toast("Аккаунт готов — продолжите запись");
      } catch (err) { $("#authError").textContent = err.message; }
    });
    $("#adminClose")?.addEventListener("click", () => $("#adminModal").classList.remove("on"));
    $("#profileClose")?.addEventListener("click", () => $("#profileModal").classList.remove("on"));
    $("#profileLogout")?.addEventListener("click", () => logout().catch((err) => toast(err.message)));
    $("#adminBookings")?.addEventListener("click", async (e) => {
      const button = e.target.closest("[data-admin-status], [data-payment-status]"); if (!button) return;
      try { await api("/api/admin/bookings/status", { method: "POST", body: JSON.stringify({ id: Number(button.dataset.bookingId), status: button.dataset.adminStatus, payment_status: button.dataset.paymentStatus }) }); toast("Данные записи обновлены"); showAdmin(); loadOccupiedBookings(); }
      catch (err) { toast(err.message); }
    });
  }

  function sparkles(host) {
    if (!host || RM) return;
    for (let i = 0; i < 26; i++) {
      const s = document.createElement("i");
      s.className = "spark";
      s.style.cssText = `left:${20 + Math.random() * 60}%;top:${30 + Math.random() * 40}%;--dx:${(Math.random() - 0.5) * 260}px;--dy:${-60 - Math.random() * 180}px;--dl:${Math.random() * 0.5}s;--sc:${0.5 + Math.random()}`;
      host.appendChild(s);
      setTimeout(() => s.remove(), 2200);
    }
  }

  /* ============ LIGHTBOX ============ */
  function lightbox() {
    const lb = $("#lightbox"), img = $("#lightbox img");
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-lightbox]");
      if (a) {
        e.preventDefault();
        img.src = a.href || a.dataset.src;
        img.alt = a.dataset.alt || "";
        lb.classList.add("on");
        document.body.style.overflow = "hidden";
        return;
      }
      if (e.target.closest("#lightbox")) {
        lb.classList.remove("on");
        document.body.style.overflow = "";
      }
    });
    addEventListener("keydown", (e) => { if (e.key === "Escape") { lb.classList.remove("on"); document.body.style.overflow = ""; } });
  }

  /* ============ MARQUEES ============ */
  function renderMarquees() {
      const items = [t("footer.m"), "美", "CAMILLA", "東京", t("cat.m"), t("cat.p"), t("cat.d"), t("cat.a"), "✦"];
    const line = items.join("  •  ");
    $$(".marquee-track").forEach((tr) => { tr.innerHTML = `<span>${line}</span><span aria-hidden="true">${line}</span>`; });
    const tick = [t("cat.m"), t("cat.p"), t("cat.d"), t("cat.a")].join("  •  ");
    const tk = $(".ticker-track");
    if (tk) tk.innerHTML = `<span>${tick}  •  </span><span aria-hidden="true">${tick}  •  </span>`;
  }

  /* ============ STATIC GRID / REEL RENDER ============ */
  function renderMedia() {
    const grid = $("#igGrid");
    if (grid) grid.innerHTML = GRID_IMGS.map(([f, alt], i) => `
      <a class="ig-item" data-lightbox href="images/${f}.jpg" data-alt="${alt}" data-reveal style="--d:${i * 50}ms" aria-label="${alt}">
        <img src="images/${f}.jpg" alt="${alt}" loading="lazy">
        <span class="ig-over">${icon("ig")}</span>
      </a>`).join("");
    const reel = $("#reelTrack");
    if (reel) reel.innerHTML = REEL_IMGS.map((f, i) => `
      <figure class="reel-card" data-i="${i}">
        <img src="images/${f}.jpg" alt="CAMILLA reel frame ${i + 1}" loading="lazy" class="kb">
        <figcaption><span>${String(i + 1).padStart(2, "0")}</span> CAMILLA REEL</figcaption>
      </figure>`).join("");
  }

  /* ============ EVENTS ============ */
  function events() {
    /* language */
    $$(".lang-btn").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));

    /* tabs */
    $("#catTabs").addEventListener("click", (e) => {
      const b = e.target.closest(".tab");
      if (!b) return;
      catFilter = b.dataset.cat;
      $$(".tab").forEach((x) => x.classList.toggle("on", x === b));
      renderCatalog();
    });
    /* search */
    const si = $("#servSearch");
    si.addEventListener("input", () => { searchQ = si.value.trim().toLowerCase(); renderCatalog(); });

    /* booking interactions (delegated) */
    document.addEventListener("click", (e) => {
      const busySlot = e.target.closest("[data-week-busy]");
      if (busySlot) { toast("Это время уже занято. Выберите другой свободный интервал."); return; }
      const weekSlot = e.target.closest("[data-week-time]");
      if (weekSlot) { B.date = weekSlot.dataset.weekDate; B.time = weekSlot.dataset.weekTime; B.step = 4; renderBookingStep(); return; }
      if (e.target.closest("#weekPrev")) { weekOffset--; renderWeekSchedule(); return; }
      if (e.target.closest("#weekNext")) { weekOffset++; renderWeekSchedule(); return; }
      if (e.target.closest("#weekToday")) { weekOffset=0; renderWeekSchedule(); return; }
      const pickS = e.target.closest("[data-pick-service]");
      if (pickS) { const id = pickS.dataset.pickService; B.services = B.services[0] === id ? [] : [id]; B.date = null; B.time = null; toast(serviceById(id).friday ? "Access Bars принимается только по пятницам" : "По пятницам принимается только Access Bars"); renderBookingStep(); return; }
      const pickD = e.target.closest("[data-pick-date]");
      if (pickD && !pickD.disabled) { B.date = pickD.dataset.pickDate; B.time = null; renderBookingStep(); return; }
      const pickT = e.target.closest("[data-pick-time]");
      if (pickT) { B.time = pickT.dataset.pickTime; renderBookingStep(); return; }

      const rowBook = e.target.closest(".row-book");
      if (rowBook) {
        B.services = [rowBook.dataset.service]; B.step = 2; B.date = null; B.time = null;
        document.getElementById("booking").scrollIntoView({ behavior: RM ? "auto" : "smooth" });
        renderBookingStep();
        toast(serviceById(B.services[0]).name[lang] + " ✓");
        return;
      }

      if (e.target.closest("#bookNext")) {
        if (B.step === 1 && !B.services.length) return shake("#bookPanels", t("book.errService"));
        if (B.step === 2 && !B.date) return shake("#bookPanels", t("book.errDate"));
        if (B.step === 3 && !B.time) return shake("#bookPanels", t("book.errTime"));
        if (B.step === 4) {
          const nameInput = $("#bName");
          const contactInput = $("#bContact");
          const commentInput = $("#bComment");
          B.name = nameInput ? nameInput.value.trim() : B.name;
          B.contact = contactInput ? contactInput.value.trim() : B.contact;
          B.comment = commentInput ? commentInput.value.trim() : B.comment;

          const nRes = validateName(B.name);
          if (!nRes.valid) {
            if (nameInput) {
              nameInput.focus();
              const wrap = nameInput.closest(".input-wrap");
              if (wrap) { wrap.classList.add("is-invalid"); }
            }
            return shake("#bookPanels", nRes.msg);
          }

          const cRes = validateContact(B.contact);
          if (!cRes.valid) {
            if (contactInput) {
              contactInput.focus();
              const wrap = contactInput.closest(".input-wrap");
              if (wrap) { wrap.classList.add("is-invalid"); }
            }
            return shake("#bookPanels", cRes.msg);
          }
        }
        B.step = Math.min(5, B.step + 1);
        renderBookingStep();
        return;
      }
      if (e.target.closest("#bookBack")) { B.step = Math.max(1, B.step - 1); renderBookingStep(); return; }
      if (e.target.closest("#restart")) { Object.assign(B, { step: 1, services: [], date: null, time: null, name: "", contact: "", comment: "" }); renderBookingStep(); return; }
      if (e.target.closest("#copyMsg")) {
        navigator.clipboard.writeText(bookingMessage()).then(() => toast(t("book.copied")));
        return;
      }
      if (e.target.closest("#submitBooking, #sendTg")) {
        const button = e.target.closest("#submitBooking, #sendTg");
        button.disabled = true;
        saveBooking(button.id === "sendTg").catch((err) => toast(err.message)).finally(() => { button.disabled = false; });
        return;
      }
      if (e.target.closest("#sendIg")) { navigator.clipboard.writeText(bookingMessage()).catch(() => {}); toast(t("book.copied")); return; }

      /* burger */
      if (e.target.closest("#burger")) {
        document.body.classList.toggle("menu-open");
        return;
      }
      $$(".mobile-menu a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("menu-open"), { once: true }));

      /* totop */
      if (e.target.closest("#totop")) { scrollTo({ top: 0, behavior: RM ? "auto" : "smooth" }); return; }
    });

    /* smooth anchors */
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const target = $(a.getAttribute("href"));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: RM ? "auto" : "smooth" }); }
    });
  }

  function shake(sel, msg) {
    const el = $(sel);
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
    toast(msg);
  }

  /* ============ INIT ============ */
  function init() {
    renderMedia();
    splitHero();
    applyI18n();
    observeReveals(document);
    counters();
    cursor();
    ripple();
    magnetic();
    tilt();
    scrollFx();
    reel();
    lightbox();
    authEvents();
    events();
    loadUser();
    loadOccupiedBookings();
    setInterval(() => { renderStatus(); renderWeekSchedule(); }, 1000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
