(function () {
  'use strict';

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector('.nav__toggle');
  var menu = document.getElementById('menu');

  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setMenu(false); toggle.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav')) setMenu(false);
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', function () { setMenu(false); });

  /* ---------- Hero slider ---------- */
  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var imgs = hero.querySelectorAll('.hero__bg img');
    var slides = hero.querySelectorAll('[data-slide]');
    var dots = hero.querySelectorAll('[data-dot]');
    var index = 0, timer = null;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var show = function (n) {
      index = (n + slides.length) % slides.length;
      for (var i = 0; i < slides.length; i++) {
        var on = i === index;
        slides[i].classList.toggle('is-active', on);
        slides[i].setAttribute('aria-hidden', on ? 'false' : 'true');
        imgs[i].classList.toggle('is-active', on);
        dots[i].classList.toggle('is-active', on);
        if (on) dots[i].setAttribute('aria-current', 'true'); else dots[i].removeAttribute('aria-current');
      }
    };
    var start = function () { if (!reduce) { stop(); timer = setInterval(function () { show(index + 1); }, 6000); } };
    var stop = function () { clearInterval(timer); };

    dots.forEach(function (d, i) { d.addEventListener('click', function () { show(i); start(); }); });
    hero.addEventListener('focusin', stop);
    hero.addEventListener('focusout', start);
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    start();
  }

  /* ---------- Highlight current section in nav ---------- */
  var links = document.querySelectorAll('.nav__menu ul a');
  if ('IntersectionObserver' in window && links.length) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (a) { a.classList.remove('is-current'); });
          map[en.target.id].classList.add('is-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* ---------- Sample form (remove when you drop in your own widget) ---------- */
  var form = document.querySelector('form[data-sample]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = form.querySelector('[data-form-note]');
      note.textContent = form.checkValidity()
        ? 'Sample form only: connect your own widget to receive enquiries.'
        : 'Please fill all the fields.';
    });
  }

  /* ---------- Poster carousel + lightbox ---------- */
  var track = document.querySelector('[data-rail-track]');
  if (track) {
    var step = function (dir) { track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' }); };
    document.querySelector('[data-rail-prev]').addEventListener('click', function () { step(-1); });
    document.querySelector('[data-rail-next]').addEventListener('click', function () { step(1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1);
    });

    var lb = document.getElementById('lightbox');
    var lbImg = lb.querySelector('[data-lb-img]');

    /* Clone the posters once so the loop is seamless. */
    var originals = Array.prototype.slice.call(track.children);
    var count = originals.length;
    originals.forEach(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.querySelector('button').tabIndex = -1;
      track.appendChild(c);
    });
    var posters = Array.prototype.slice.call(track.querySelectorAll('[data-poster] img'));
    var cur = 0;
    var openPoster = function (i) {
      cur = (i + count) % count;
      lbImg.src = posters[cur].currentSrc || posters[cur].src;
      lbImg.alt = posters[cur].alt;
      if (!lb.open) lb.showModal();
    };
    posters.forEach(function (img, i) {
      img.closest('button').addEventListener('click', function () { openPoster(i % count); });
    });
    /* Continuous slow auto-scroll; pauses on hover, focus, touch and while the viewer is open. */
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var pos = 0, last = 0, hold = false, resumeAt = 0, SPEED = 40; /* px per second */
    var pause = function () { hold = true; };
    var resume = function (delay) { hold = false; resumeAt = performance.now() + (delay || 0); pos = track.scrollLeft; };
    var tick = function (now) {
      var dt = Math.min(now - last, 200); last = now;
      if (!hold && !lb.open && !document.hidden && now >= resumeAt) {
        var loop = track.scrollWidth / 2;
        pos += SPEED * dt / 1000;
        if (pos >= loop) pos -= loop;
        track.scrollLeft = pos;
      }
      requestAnimationFrame(tick);
    };
    if (!reduceMotion) {
      track.addEventListener('mouseenter', pause);
      track.addEventListener('mouseleave', function () { resume(0); });
      track.addEventListener('focusin', pause);
      track.addEventListener('focusout', function () { resume(0); });
      track.addEventListener('touchstart', pause, { passive: true });
      track.addEventListener('touchend', function () { resume(2500); }, { passive: true });
      track.addEventListener('scroll', function () { if (hold || performance.now() < resumeAt) pos = track.scrollLeft; }, { passive: true });
      document.querySelector('.rail').addEventListener('click', function (e) { if (e.target.closest('.rail__btn')) resume(2500); });
      lb.addEventListener('close', function () { resume(0); });
      requestAnimationFrame(function (t) { last = t; tick(t); });
    }

    lb.querySelector('[data-lb-close]').addEventListener('click', function () { lb.close(); });
    lb.querySelector('[data-lb-prev]').addEventListener('click', function () { openPoster(cur - 1); });
    lb.querySelector('[data-lb-next]').addEventListener('click', function () { openPoster(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') openPoster(cur + 1); else if (e.key === 'ArrowLeft') openPoster(cur - 1);
    });
  }

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
