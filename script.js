/* ==========================================================================
   SUN.DYLE — site behaviour
   Plain ES5-friendly JS, no dependencies, no build step.
   Renders releases / videos / shows / gallery from data/ and handles the
   nav, scroll reveals and the photo lightbox.
   ========================================================================== */
(function () {
  "use strict";

  var SITE = window.SITE || { band: {}, links: {}, releases: [], videos: [], press: [] };
  var SHOWS = window.SHOWS || { upcoming: [], past: [] };
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  /* ---------------------------------------------------------- social rows --- */
  var ICONS = {
    bandcamp:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M0 18.4 6.6 5.6H24l-6.6 12.8z"/></svg>',
    spotify:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.5 17.3a.75.75 0 0 1-1 .25c-2.8-1.7-6.3-2.1-10.4-1.15a.75.75 0 1 1-.33-1.46c4.5-1.03 8.4-.58 11.5 1.32.35.21.46.67.25 1.03zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.2-1.97-8.1-2.54-11.9-1.39a.94.94 0 1 1-.54-1.8c4.33-1.31 9.72-.67 13.4 1.59.44.27.58.85.31 1.29zm.13-3.4C15.3 8.34 9.1 8.13 5.5 9.22a1.12 1.12 0 1 1-.65-2.15C9 5.81 15.85 6.06 20.2 8.63a1.12 1.12 0 0 1-1.1 1.95z"/></svg>',
    appleMusic:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.4 0H6.6A6.6 6.6 0 0 0 0 6.6v10.8A6.6 6.6 0 0 0 6.6 24h10.8a6.6 6.6 0 0 0 6.6-6.6V6.6A6.6 6.6 0 0 0 17.4 0zm-1.9 17.9a1.3 1.3 0 0 1-1.7.83l-5.1-1.68a1.3 1.3 0 0 1-.9-1.24v-6.6a2 2 0 1 1 1.6 1.96v4.2l4.3 1.42a1.3 1.3 0 0 1 .8 1.11z"/></svg>',
    youtube:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.4.6.2 1 .5 1.4 1 .5.4.8.8 1 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-1 1.4-.4.5-.8.8-1.4 1-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-1-.5-.4-.8-.8-1-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 1-1.4.4-.5.8-.8 1.4-1 .4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.3a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm0 10.7a4.2 4.2 0 1 1 0-8.4 4.2 4.2 0 0 1 0 8.4zm6.7-11a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/></svg>',
    facebook:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.24 2.7.24v3h-1.5c-1.5 0-2 .93-2 1.9v2.2h3.3l-.53 3.5h-2.8v8.4A12 12 0 0 0 24 12z"/></svg>',
    tiktok:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.1v12.4a2.6 2.6 0 1 1-1.86-2.5v-3.2a5.8 5.8 0 1 0 5 5.75V8.9a7.3 7.3 0 0 0 4.27 1.37V7.15a4.29 4.29 0 0 1-3.25-1.33z"/></svg>',
    email:     '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 5.5A2.5 2.5 0 0 1 4.5 3h15A2.5 2.5 0 0 1 22 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18.5zm2.7-.4 7.3 5.6 7.3-5.6zM20 7.6l-8 6.1-8-6.1v10.9h16z"/></svg>'
  };

  function streamRow(el) {
    if (!el) return;
    var order = ["bandcamp", "spotify", "appleMusic", "youtube"];
    var names = { bandcamp: "Bandcamp", spotify: "Spotify", appleMusic: "Apple Music", youtube: "YouTube" };
    el.innerHTML = order.map(function (k) {
      if (!SITE.links[k]) return "";
      return '<li><a href="' + esc(SITE.links[k]) + '" target="_blank" rel="noopener">' +
             ICONS[k] + esc(names[k]) + "</a></li>";
    }).join("");
  }

  function socialRow(el) {
    if (!el) return;
    var order = ["instagram", "facebook", "tiktok", "youtube", "spotify", "bandcamp"];
    el.innerHTML = order.map(function (k) {
      if (!SITE.links[k]) return "";
      var label = k.charAt(0).toUpperCase() + k.slice(1);
      return '<li><a href="' + esc(SITE.links[k]) + '" target="_blank" rel="noopener" aria-label="' +
             esc(label) + '" title="' + esc(label) + '">' + ICONS[k] + "</a></li>";
    }).join("");
  }

  /* -------------------------------------------------------------- releases --- */
  function renderReleases() {
    var el = $("#releases");
    if (!el) return;
    var list = (SITE.releases || []).slice();
    el.innerHTML = list.map(function (r) {
      return '<a class="card' + (r.featured ? " card--feature" : "") + '" href="' + esc(r.url) +
        '" target="_blank" rel="noopener">' +
        (r.featured ? '<span class="badge-new">New</span>' : "") +
        '<img class="card__art" src="' + esc(r.art) + '" alt="' + esc(r.title) + " album cover\" loading=\"lazy\" width=\"800\" height=\"800\">" +
        '<span class="card__body">' +
          '<span class="card__meta">' + esc(r.type) + " &middot; " + esc(r.year) + "</span>" +
          '<span class="card__title">' + esc(r.title) + "</span>" +
          (r.tracks ? '<span class="card__tracks">' + esc(r.tracks) + " tracks</span>" : "") +
          '<span class="card__cta">Listen on Bandcamp &rarr;</span>' +
        "</span></a>";
    }).join("");

    // featured-release art on the hero, if the hero has a slot for it
    var f = list.filter(function (r) { return r.featured; })[0];
    if (f) {
      var hi = $("#hero-art");
      if (hi && f.art) { hi.src = f.art; hi.alt = f.title + " album cover"; }
    }
  }

  /* ---------------------------------------------------------------- videos --- */
  function renderVideos() {
    var el = $("#videos");
    if (!el) return;
    el.innerHTML = (SITE.videos || []).map(function (v) {
      return '<button class="video" type="button" data-yt="' + esc(v.id) + '" ' +
        'aria-label="Play video: ' + esc(v.title) + '">' +
        '<img src="https://i.ytimg.com/vi/' + esc(v.id) + '/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">' +
        '<span class="video__shade"></span>' +
        '<span class="video__play"></span>' +
        '<span class="video__label"><span>' + esc(v.kind || "Video") + "</span><strong>" + esc(v.title) + "</strong></span>" +
        "</button>";
    }).join("");

    el.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest(".video") : null;
      if (!btn || btn.dataset.loaded) return;
      var id = btn.getAttribute("data-yt");
      btn.dataset.loaded = "1";
      btn.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id +
        '?autoplay=1&rel=0" title="SUN.DYLE video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
    });
  }

  /* ----------------------------------------------------------------- shows --- */
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function fmtDate(iso) {
    var p = String(iso).split("-");
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    if (isNaN(d)) return { main: iso, sub: "" };
    return {
      main: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      sub: d.toLocaleDateString(undefined, { weekday: "long" }) + " &middot; " +
           d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    };
  }
  function showRow(s, isPast) {
    var d = fmtDate(s.date);
    var inner =
      '<span class="show__date">' + esc(d.main) + "<small>" + esc(String(s.date).slice(0, 4)) + "</small></span>" +
      '<span class="show__main">' +
        '<span class="show__venue">' + esc(s.venue) + "</span>" +
        '<span class="show__where">' + esc(s.city || "") + (s.time ? " &middot; " + esc(s.time) : "") + "</span>" +
        (s.note ? '<span class="show__note">' + esc(s.note) + "</span>" : "") +
      "</span>";
    var cta = (!isPast && s.tickets)
      ? '<span class="show__cta btn btn--primary btn--sm">Tickets</span>'
      : "";
    var tag = (!isPast && s.tickets) ? "a" : "div";
    var href = (!isPast && s.tickets) ? ' href="' + esc(s.tickets) + '" target="_blank" rel="noopener"' : "";
    return "<li><" + tag + ' class="show"' + href + ">" + inner + cta + "</" + tag + "></li>";
  }

  function renderShows() {
    var up = $("#shows-upcoming");
    var pastWrap = $("#shows-past");
    var pastList = $("#shows-past-list");
    if (!up) return;
    var today = todayISO();

    var upcoming = (SHOWS.upcoming || []).filter(function (s) { return s && s.date >= today; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var past = (SHOWS.past || []).slice()
      .concat((SHOWS.upcoming || []).filter(function (s) { return s && s.date < today; }))
      .sort(function (a, b) { return a.date > b.date ? -1 : 1; });

    if (upcoming.length) {
      up.innerHTML = upcoming.map(function (s) { return showRow(s, false); }).join("");
    } else {
      up.innerHTML =
        '<li><div class="empty">' +
        "<h3>No dates on the books right now</h3>" +
        "<p>We announce shows on Instagram first. Follow along and we&rsquo;ll see you out there.</p>" +
        '<a class="btn btn--ghost btn--sm" href="' + esc(SITE.links.instagram || "#") + '" target="_blank" rel="noopener">Follow @sun.dyle</a>' +
        "</div></li>";
    }

    if (pastWrap && pastList) {
      if (past.length) {
        pastList.innerHTML = past.map(function (s) { return showRow(s, true); }).join("");
      } else if (pastWrap) {
        pastWrap.hidden = true;
      }
    }
  }

  /* --------------------------------------------------------------- gallery ---
     Drop files into assets/photos/gallery/ named photo-01.jpg, photo-02.jpg …
     Anything numbered in order shows up automatically; we stop after four
     missing numbers in a row. */
  var GALLERY_MAX = 60, GALLERY_MISS_LIMIT = 4;
  function renderGallery() {
    var grid = $("#gallery-grid");
    var empty = $("#gallery-empty");
    if (!grid) return;
    var found = [], misses = 0, i = 1;

    function step() {
      if (i > GALLERY_MAX || misses >= GALLERY_MISS_LIMIT) return finish();
      var n = String(i).padStart(2, "0");
      var path = "assets/photos/gallery/photo-" + n + ".jpg";
      var img = new Image();
      img.onload = function () {
        misses = 0;
        found.push(path);
        addTile(path, found.length);
        i++;
        step();
      };
      img.onerror = function () { misses++; i++; step(); };
      img.src = path;
    }

    function addTile(path, idx) {
      var fig = document.createElement("figure");
      fig.innerHTML = '<button type="button" data-index="' + (idx - 1) + '" aria-label="Enlarge photo ' + idx + '">' +
        '<img src="' + path + '" alt="SUN.DYLE photo ' + idx + '" loading="lazy" width="900" height="900"></button>';
      grid.appendChild(fig);
    }

    function finish() {
      if (!found.length) {
        if (empty) empty.hidden = false;
        grid.hidden = true;
        return;
      }
      if (empty) empty.hidden = true;
      var box = $("#lightbox");
      var imgEl = $("#lightbox-img");
      var countEl = $("#lightbox-count");
      var current = 0;

      function show(idx) {
        current = (idx + found.length) % found.length;
        imgEl.src = found[current];
        imgEl.alt = "SUN.DYLE photo " + (current + 1) + " of " + found.length;
        if (countEl) countEl.textContent = (current + 1) + " / " + found.length;
      }
      function open(idx) {
        show(idx);
        box.classList.add("is-open");
        box.removeAttribute("aria-hidden");
        document.body.style.overflow = "hidden";
        var c = $("#lightbox-close"); if (c) c.focus();
      }
      function close() {
        box.classList.remove("is-open");
        box.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        var btn = grid.querySelector('button[data-index="' + current + '"]');
        if (btn) btn.focus();
      }

      grid.addEventListener("click", function (e) {
        var b = e.target.closest ? e.target.closest("button[data-index]") : null;
        if (b) open(Number(b.getAttribute("data-index")));
      });
      var prev = $("#lightbox-prev"), next = $("#lightbox-next"), clo = $("#lightbox-close");
      if (prev) prev.addEventListener("click", function () { show(current - 1); });
      if (next) next.addEventListener("click", function () { show(current + 1); });
      if (clo) clo.addEventListener("click", close);
      box.addEventListener("click", function (e) { if (e.target === box || e.target.classList.contains("lightbox__inner")) close(); });
      document.addEventListener("keydown", function (e) {
        if (!box.classList.contains("is-open")) return;
        if (e.key === "Escape") close();
        else if (e.key === "ArrowRight") show(current + 1);
        else if (e.key === "ArrowLeft") show(current - 1);
      });
      // swipe on touch devices
      var x0 = null;
      box.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      box.addEventListener("touchend", function (e) {
        if (x0 == null) return;
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 45) show(current + (dx < 0 ? 1 : -1));
        x0 = null;
      }, { passive: true });
    }

    step();
  }

  /* ------------------------------------------------------------- embeds --- */
  function renderEmbeds() {
    var f = $("#bandcamp-player");
    if (f) {
      f.src = "https://bandcamp.com/EmbeddedPlayer/album=" + (SITE.bandcampAlbumId || "") +
        "/size=large/bgcol=ffffff/linkcol=e0621f/artwork=small/transparent=true/";
      f.title = "SUN.DYLE \u2014 Typhoon on Bandcamp";
    }
  }

  /* ---------------------------------------------------------------- misc --- */
  function fillLinks() {
    $$("[data-link]").forEach(function (el) {
      var k = el.getAttribute("data-link");
      if (SITE.links[k]) {
        if (el.tagName === "A") el.href = SITE.links[k];
      }
    });
    $$("[data-bandcamp-album]").forEach(function (el) { el.href = SITE.links.album || SITE.links.bandcamp; });
    $$("[data-email]").forEach(function (el) {
      el.href = "mailto:" + (SITE.band.bookingEmail || "");
      if (el.hasAttribute("data-email-text")) el.textContent = SITE.band.bookingEmail || "";
    });
    $$("[data-year]").forEach(function (el) { el.textContent = SITE.band.copyrightYear || new Date().getFullYear(); });
    var mail = $("#info-email");
    if (mail) mail.textContent = SITE.band.bookingEmail || "";
    var press = $("#press");
    if (press) {
      press.innerHTML = (SITE.press || []).map(function (p) {
        return '<li><a href="' + esc(p.url) + '" target="_blank" rel="noopener">' +
          '<span class="headline">' + esc(p.headline) + "</span>" +
          '<span class="outlet">' + esc(p.outlet) + "</span></a></li>";
      }).join("");
    }
    streamRow($("#streams"));
    socialRow($("#socials"));
    socialRow($("#socials-footer"));
  }

  function navBehaviour() {
    var nav = $("#nav"), toggle = $("#nav-toggle"), links = $("#nav-links"), top = $("#to-top");
    function onScroll() {
      var y = window.scrollY || document.documentElement.scrollTop;
      if (nav) nav.classList.toggle("is-stuck", y > 8);
      if (top) top.classList.toggle("is-visible", y > 700);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var open = links.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      links.addEventListener("click", function (e) {
        if (e.target.tagName === "A") { links.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); }
      });
    }
    if (top) top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  function scrollSpy() {
    var sections = $$("main section[id]");
    var navLinks = $$('#nav-links a[href^="#"]');
    if (!sections.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id;
        navLinks.forEach(function (a) { a.classList.toggle("is-current", a.getAttribute("href") === "#" + id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { io.observe(s); });

    var reveals = $$(".reveal");
    if (reveals.length) {
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("is-in"); ro.unobserve(en.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
      reveals.forEach(function (r) { ro.observe(r); });
    }
  }

  /* ---------------------------------------------------------------- init --- */
  function init() {
    fillLinks();
    renderEmbeds();
    renderReleases();
    renderVideos();
    renderShows();
    renderGallery();
    navBehaviour();
    scrollSpy();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
