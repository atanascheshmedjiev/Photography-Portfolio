/* NASKO photography: header, mobile menu, portfolio filters, lightbox, contact form.
   No dependencies. Works when the files are opened straight from disk. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- year ---------- */
  doc.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- header: solid after the hero, hides on scroll down, returns on scroll up ---------- */
  var head = doc.querySelector(".site-head");
  if (head) {
    var lastY = window.scrollY, overHero = !!doc.querySelector(".hero, .moment-top");
    var onScroll = function () {
      var y = window.scrollY, threshold = overHero ? window.innerHeight * 0.75 : 40;
      head.classList.toggle("is-solid", y > threshold || !overHero);
      var hide = y > lastY && y > 200 && !root.classList.contains("menu-open");
      head.classList.toggle("is-hidden", hide);
      doc.body.classList.toggle("head-visible", !hide && y > 200);
      lastY = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- mobile menu ---------- */
  var menuBtn = doc.querySelector(".menu-btn"), nav = doc.getElementById("site-nav");
  if (menuBtn && nav) {
    var setMenu = function (open) {
      root.classList.toggle("menu-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (open) { var first = nav.querySelector("a"); if (first) first.focus(); }
    };
    menuBtn.addEventListener("click", function () { setMenu(!root.classList.contains("menu-open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    doc.addEventListener("keydown", function (e) {
      if (!root.classList.contains("menu-open")) return;
      if (e.key === "Escape") { setMenu(false); menuBtn.focus(); }
      if (e.key === "Tab") { // keep focus inside the open menu
        var items = [menuBtn].concat([].slice.call(nav.querySelectorAll("a")));
        var i = items.indexOf(doc.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });
    window.matchMedia("(min-width: 761px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  }

  /* ---------- quiet reveal of photographs ---------- */
  var reveals = doc.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add("is-in"); }); }

  /* ---------- lightbox ---------- */
  var lb = null, items = [], index = 0, opener = null, scrollY = 0;
  function buildLightbox() {
    lb = doc.createElement("div");
    lb.className = "lb"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Photograph viewer");
    lb.innerHTML =
      '<div class="lb-top"><span class="lb-count" aria-live="polite"></span>' +
      '<button class="lb-btn lb-close" type="button" aria-label="Close viewer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button></div>' +
      '<div class="lb-stage"><img alt="">' +
      '<button class="lb-btn lb-prev" type="button" aria-label="Previous photograph"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l-8 8 8 8"/></svg></button>' +
      '<button class="lb-btn lb-next" type="button" aria-label="Next photograph"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8"/></svg></button></div>' +
      '<div class="lb-cap"><span><span class="t"></span></span><span class="m"></span></div>';
    doc.body.appendChild(lb);
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", function () { go(-1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { go(1); });
    lb.querySelector(".lb-stage").addEventListener("click", function (e) { if (e.target === this) close(); });
    var x0 = null, y0 = null;
    var stage = lb.querySelector(".lb-stage");
    stage.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
      x0 = null;
    });
    doc.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab") {
        var f = [].slice.call(lb.querySelectorAll("button, a")).filter(function (el) { return el.offsetParent !== null; });
        var i = f.indexOf(doc.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
  }
  function show(i) {
    index = (i + items.length) % items.length;
    var it = items[index], img = lb.querySelector(".lb-stage img");
    img.classList.add("is-loading");
    var next = new Image();
    next.onload = function () { img.src = next.src; img.alt = it.alt; img.classList.remove("is-loading"); };
    next.src = it.full;
    lb.querySelector(".lb-count").textContent = (index + 1) + " / " + items.length;
    var t = lb.querySelector(".lb-cap .t");
    t.innerHTML = "";
    if (it.title) {
      if (it.href) { var a = doc.createElement("a"); a.href = it.href; a.textContent = it.title; t.appendChild(a); }
      else t.textContent = it.title;
    }
    lb.querySelector(".lb-cap .m").textContent = it.meta || "";
    var multi = items.length > 1;
    lb.querySelector(".lb-prev").hidden = !multi; lb.querySelector(".lb-next").hidden = !multi;
    [index + 1, index - 1].forEach(function (k) { var n = items[(k + items.length) % items.length]; if (n) (new Image()).src = n.full; });
  }
  function go(d) { show(index + d); }
  function open(list, i, from) {
    if (!lb) buildLightbox();
    items = list; opener = from; scrollY = window.scrollY;
    root.classList.add("lb-lock");
    lb.classList.add("is-open");
    show(i);
    lb.querySelector(".lb-close").focus();
  }
  function close() {
    lb.classList.remove("is-open");
    root.classList.remove("lb-lock");
    window.scrollTo(0, scrollY);
    if (opener) opener.focus({ preventScroll: true });
  }
  function itemFrom(btn) {
    return { full: btn.getAttribute("data-full"), alt: btn.getAttribute("data-alt") || "", title: btn.getAttribute("data-title") || "",
             href: btn.getAttribute("data-href") || "", meta: btn.getAttribute("data-meta") || "" };
  }
  doc.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-lightbox]");
    if (!btn) return;
    e.preventDefault();
    var group = btn.getAttribute("data-lightbox");
    var all = [].slice.call(doc.querySelectorAll('[data-lightbox="' + group + '"]')).filter(function (b) { return !b.closest("[hidden]"); });
    // the opening photograph and its copy in the sequence are the same frame; keep one
    var seen = {}, list = [], pos = 0;
    all.forEach(function (b) {
      var src = b.getAttribute("data-full");
      if (seen[src] !== undefined) { if (b === btn) pos = seen[src]; return; }
      seen[src] = list.length; if (b === btn) pos = list.length; list.push(itemFrom(b));
    });
    open(list, pos, btn);
  });

  /* ---------- portfolio filters ---------- */
  var filterBar = doc.querySelector("[data-filters]");
  if (filterBar) {
    var grid = doc.querySelector(".masonry"), frames = [].slice.call(grid.querySelectorAll(".frame"));
    var empty = doc.querySelector(".empty"), buttons = [].slice.call(filterBar.querySelectorAll(".filter"));
    var apply = function (cat, push) {
      var found = false;
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-cat") === cat)); });
      frames.forEach(function (f) {
        var match = cat === "all" || f.getAttribute("data-cat") === cat;
        f.hidden = !match; if (match) found = true;
      });
      if (empty) empty.hidden = found;
      if (!reduce) { grid.classList.remove("is-filtering"); void grid.offsetWidth; grid.classList.add("is-filtering"); }
      if (push) {
        try { history.replaceState(null, "", cat === "all" ? location.pathname : location.pathname + "?c=" + encodeURIComponent(cat)); } catch (err) { /* file:// in some browsers */ }
      }
    };
    buttons.forEach(function (b) { b.addEventListener("click", function () {
      apply(b.getAttribute("data-cat"), true);
      var top = filterBar.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: reduce ? "auto" : "smooth" });
    }); });
    var q = new URLSearchParams(location.search).get("c");
    if (q && buttons.some(function (b) { return b.getAttribute("data-cat") === q; })) apply(q, false);
  }

  /* ---------- contact form: validates, then opens the visitor's email app with the message filled in ---------- */
  var form = doc.querySelector("[data-contact]");
  if (form) {
    var to = form.getAttribute("data-to"), status = doc.getElementById("form-status");
    var preset = new URLSearchParams(location.search).get("type");
    if (preset) { var sel = form.querySelector("#f-type"); [].forEach.call(sel.options, function (o) { if (o.value === preset) sel.value = preset; }); }
    var check = function (el) {
      var msg = "";
      if (el.validity.valueMissing) msg = el.getAttribute("data-required") || "This field is needed.";
      else if (el.validity.typeMismatch) msg = "Enter an email address like name@example.com.";
      el.setAttribute("aria-invalid", msg ? "true" : "false");
      var err = doc.getElementById(el.id + "-err"); if (err) err.textContent = msg;
      return !msg;
    };
    [].forEach.call(form.elements, function (el) { if (el.id && el.willValidate) el.addEventListener("blur", function () { if (el.value) check(el); }); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      [].forEach.call(form.elements, function (el) { if (el.id && el.willValidate && !check(el)) { ok = false; firstBad = firstBad || el; } });
      if (!ok) { firstBad.focus(); return; }
      var v = function (id) { return form.querySelector("#" + id).value.trim(); };
      var subject = v("f-type") + " inquiry from " + v("f-name");
      var body = v("f-msg") + "\n\n" + v("f-name") + "\n" + v("f-email") + (v("f-date") ? "\nDate: " + v("f-date") : "");
      window.location.href = "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      status.hidden = false;
      status.focus();
    });
  }
})();
