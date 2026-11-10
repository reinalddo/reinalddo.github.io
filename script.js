(function () {
  'use strict';

  /* ---------- Navegación ---------- */
  var nav = document.querySelector('[data-nav]');
  var toggle = document.querySelector('[data-nav-toggle]');
  var menu = document.getElementById('nav-menu');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (nav && toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(!nav.classList.contains('is-open'));
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target)) setMenu(false);
    });

    var onScroll = function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Marca en el menú la sección visible */
  var links = menu ? Array.prototype.slice.call(menu.querySelectorAll('a[href^="#"]')) : [];
  if ('IntersectionObserver' in window && links.length) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var link = byId[entry.target.id];
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    var hero = document.getElementById('inicio');
    if (hero) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) links.forEach(function (a) { a.removeAttribute('aria-current'); });
      }, { rootMargin: '-45% 0px -50% 0px' }).observe(hero);
    }
  }

  /* ---------- Capturas ----------
     Si una imagen no existe, se quita su pestaña; si no queda ninguna,
     se quita la figura completa y la tarjeta queda a una sola columna. */
  function setupMedia(figure) {
    var img = figure.querySelector('[data-media-img]');
    var url = figure.querySelector('[data-media-url]');
    var tabsBox = figure.querySelector('.media__tabs');
    if (!img) return;

    function tabs() {
      return tabsBox ? Array.prototype.slice.call(tabsBox.querySelectorAll('button')) : [];
    }

    function show(btn) {
      tabs().forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      img.src = btn.dataset.src;
      img.alt = btn.dataset.alt || '';
      if (btn.dataset.w) img.width = +btn.dataset.w;
      if (btn.dataset.h) img.height = +btn.dataset.h;
      if (url && btn.dataset.url) url.textContent = btn.dataset.url;
    }

    function refreshTabs() {
      if (tabsBox) tabsBox.hidden = tabs().length < 2;
    }

    function fail() {
      var current = tabs().filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0];
      if (current) current.remove();
      var rest = tabs();
      if (rest.length) {
        show(rest[0]);
        refreshTabs();
      } else {
        figure.remove();
      }
    }

    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();

    if (tabsBox) {
      tabsBox.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (btn && btn.getAttribute('aria-pressed') !== 'true') show(btn);
      });
      refreshTabs();
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-media]'), setupMedia);
})();
