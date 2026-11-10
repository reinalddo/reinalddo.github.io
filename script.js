(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    var clearCurrent = function () { links.forEach(function (a) { a.removeAttribute('aria-current'); }); };

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        clearCurrent();
        var link = byId[entry.target.id];
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
    var hero = document.getElementById('inicio');
    if (hero) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) clearCurrent();
      }, { rootMargin: '-45% 0px -50% 0px' }).observe(hero);
    }
  }

  /* ---------- Aparición suave al hacer scroll ---------- */
  var revealItems = document.querySelectorAll('[data-reveal]');
  if (!reduceMotion && 'IntersectionObserver' in window && revealItems.length) {
    root.classList.add('reveal-on');
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    Array.prototype.forEach.call(revealItems, function (el) { revealObserver.observe(el); });
  }

  /* ---------- Galerías ----------
     Cada .gallery contiene enlaces .gallery__item con su <img>.
     Si una imagen no existe se quita; si no queda ninguna, se quita la galería
     y la tarjeta queda completa sin ella. */
  var galleries = Array.prototype.slice.call(document.querySelectorAll('[data-gallery]'));

  function galleryItems(gallery) {
    return Array.prototype.slice.call(gallery.querySelectorAll('.gallery__item'));
  }

  function dropItem(item) {
    var gallery = item.closest('[data-gallery]');
    item.remove();
    if (gallery && !galleryItems(gallery).length) gallery.remove();
  }

  galleries.forEach(function (gallery) {
    var items = galleryItems(gallery);
    if (!items.length) { gallery.remove(); return; }

    items.forEach(function (item) {
      var img = item.querySelector('img');
      if (!img) { dropItem(item); return; }
      img.addEventListener('error', function () { dropItem(item); });
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) dropItem(item);
    });

    gallery.addEventListener('click', function (e) {
      var item = e.target.closest('.gallery__item');
      if (!item) return;
      e.preventDefault();
      var current = galleryItems(gallery);
      lightbox.open(current.map(function (it) {
        var im = it.querySelector('img');
        return { src: it.getAttribute('href') || im.currentSrc || im.src, alt: im.alt };
      }), current.indexOf(item));
    });
  });

  /* ---------- Lightbox ---------- */
  var lightbox = (function () {
    var dialog = document.querySelector('[data-lightbox]');
    if (!dialog || typeof dialog.showModal !== 'function') {
      // Navegadores sin <dialog>: el enlace abre la imagen directamente.
      return { open: function (list, index) { window.location.href = list[index].src; } };
    }

    var img = dialog.querySelector('[data-lb-img]');
    var caption = dialog.querySelector('[data-lb-caption]');
    var counter = dialog.querySelector('[data-lb-counter]');
    var btnPrev = dialog.querySelector('[data-lb-prev]');
    var btnNext = dialog.querySelector('[data-lb-next]');
    var btnClose = dialog.querySelector('[data-lb-close]');
    var stage = dialog.querySelector('[data-lb-stage]');

    var list = [];
    var index = 0;
    var savedScroll = 0;

    function preload(i) {
      if (!list.length) return;
      var n = (i + list.length) % list.length;
      var pre = new Image();
      pre.src = list[n].src;
    }

    function render(animate) {
      var item = list[index];
      img.src = item.src;
      img.alt = item.alt || '';
      caption.textContent = item.alt || '';
      counter.textContent = (index + 1) + ' / ' + list.length;
      var multiple = list.length > 1;
      btnPrev.hidden = !multiple;
      btnNext.hidden = !multiple;
      counter.hidden = !multiple;
      if (animate && !reduceMotion) {
        img.classList.remove('is-changing');
        void img.offsetWidth; // reinicia la animación
        img.classList.add('is-changing');
      }
      if (multiple) { preload(index + 1); preload(index - 1); }
    }

    function go(step) {
      if (list.length < 2) return;
      index = (index + step + list.length) % list.length;
      render(true);
    }

    function open(newList, startIndex) {
      if (!newList.length) return;
      list = newList;
      index = Math.max(0, startIndex);
      savedScroll = window.scrollY;
      render(false);
      root.classList.add('has-lightbox');
      dialog.showModal();
      btnClose.focus({ preventScroll: true });
    }

    function close() {
      if (dialog.open) dialog.close();
    }

    // Limpieza única para todos los cierres: X, ESC, clic fuera.
    dialog.addEventListener('close', function () {
      root.classList.remove('has-lightbox');
      img.removeAttribute('src');
      if (Math.abs(window.scrollY - savedScroll) > 1) {
        window.scrollTo({ top: savedScroll, behavior: 'instant' });
      }
    });

    btnClose.addEventListener('click', close);
    btnPrev.addEventListener('click', function () { go(-1); });
    btnNext.addEventListener('click', function () { go(1); });

    // Clic fuera de la imagen y de los botones cierra
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog || e.target === stage || e.target.closest('.lightbox__bar')) close();
    });

    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });

    // Gesto de deslizar en pantallas táctiles
    var startX = 0, startY = 0, tracking = false;
    dialog.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { tracking = false; return; }
      tracking = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    dialog.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - startX;
      var dy = t.clientY - startY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) go(dx < 0 ? 1 : -1);
    }, { passive: true });

    return { open: open };
  })();
})();
