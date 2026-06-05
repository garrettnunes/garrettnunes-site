/* =========================================================
   Garrett Nunes — site interactions
   Vanilla JS, no dependencies. Respects reduced-motion.
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  /* ---- Footer year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Header scrolled state ---- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 8) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobile nav toggle ---- */
  var navToggle = document.getElementById("nav-toggle");
  var navLinks = document.getElementById("nav-links");
  if (navToggle && navLinks) {
    function closeNav() {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
    }
    function openNav() {
      navLinks.classList.add("open");
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.setAttribute("aria-label", "Close menu");
    }
    navToggle.addEventListener("click", function () {
      if (navLinks.classList.contains("open")) closeNav();
      else openNav();
    });
    // close after picking a destination
    navLinks.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });
    // close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navLinks.classList.contains("open")) {
        closeNav();
        navToggle.focus();
      }
    });
    // close if resized up to desktop
    window.addEventListener("resize", function () {
      if (window.innerWidth > 640) closeNav();
    });
  }

  /* ---- Reveal on scroll ---- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---- Scroll-spy: highlight the active section in the nav ---- */
  var spyLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav-links a[href^="#"]')
  );
  var spyTargets = spyLinks
    .map(function (a) {
      var id = a.getAttribute("href").slice(1);
      var el = id ? document.getElementById(id) : null;
      return el ? { link: a, el: el } : null;
    })
    .filter(Boolean);

  if (spyTargets.length && "IntersectionObserver" in window) {
    var spyObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var match = spyTargets.find(function (t) {
            return t.el === entry.target;
          });
          if (!match) return;
          if (entry.isIntersecting) {
            spyLinks.forEach(function (l) { l.classList.remove("active"); });
            match.link.classList.add("active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    spyTargets.forEach(function (t) { spyObserver.observe(t.el); });
  }

  /* ---- Card pointer glow ---- */
  document.querySelectorAll(".card").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* ---- Terminal typewriter ---- */
  var term = document.getElementById("terminal-body");
  if (term) {
    var lines = [
      { t: "$ ", c: "muted", n: "init systems --autonomous", cn: "" },
      { t: "» ", c: "muted", n: "agents online", cn: "ok" },
      { t: "» ", c: "muted", n: "inbox · catalog · orders watching", cn: "" },
      { t: "» ", c: "muted", n: "running without me", cn: "ok" }
    ];

    if (reduceMotion) {
      term.innerHTML = lines
        .map(function (l) {
          return (
            '<span class="' + l.c + '">' + l.t + "</span>" +
            (l.cn ? '<span class="' + l.cn + '">' + l.n + "</span>" : l.n)
          );
        })
        .join("\n");
    } else {
      var li = 0;
      function typeLine() {
        if (li >= lines.length) {
          term.insertAdjacentHTML("beforeend", '<span class="cursor"></span>');
          return;
        }
        var l = lines[li];
        var prefix = document.createElement("span");
        prefix.className = l.c;
        prefix.textContent = l.t;
        term.appendChild(prefix);

        var body = document.createElement("span");
        if (l.cn) body.className = l.cn;
        term.appendChild(body);

        var i = 0;
        (function typeChar() {
          if (i <= l.n.length) {
            body.textContent = l.n.slice(0, i);
            i++;
            setTimeout(typeChar, 26);
          } else {
            term.appendChild(document.createTextNode("\n"));
            li++;
            setTimeout(typeLine, 360);
          }
        })();
      }
      // kick off after a short beat so the hero settles first
      setTimeout(typeLine, 650);
    }
  }

  /* ---- Background constellation canvas ----
     Lightweight particle field that drifts + links nearby nodes.
     Disabled under reduced-motion or on very small screens.        */
  var canvas = document.getElementById("bg-canvas");
  // Skip the particle field on phones (cost > benefit, saves battery) and
  // under reduced-motion. The CSS radial glow still provides depth.
  var smallScreen = window.matchMedia
    ? window.matchMedia("(max-width: 640px)").matches
    : window.innerWidth <= 640;
  if (canvas && !reduceMotion && !smallScreen) {
    var ctx = canvas.getContext("2d");
    var w, h, dpr, particles, raf;
    var COUNT_BASE = 0.00008; // density per px^2
    var MAX = 90;
    var LINK_DIST = 130;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth = window.innerWidth;
      h = canvas.clientHeight = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(MAX, Math.floor(w * h * COUNT_BASE));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.6 + 0.6
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(94, 234, 212, 0.55)";
        ctx.fill();

        for (var j = i + 1; j < particles.length; j++) {
          var q = particles[j];
          var dx = p.x - q.x;
          var dy = p.y - q.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle =
              "rgba(120, 180, 220," + (0.12 * (1 - dist / LINK_DIST)) + ")";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 180);
    });

    // pause when tab hidden (save cycles / battery)
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(draw);
      }
    });

    resize();
    draw();
  }
})();
