/* ═══════════════════════════════════════════════════════════════
   LAVYA — app.js
   No framework, no build step, no dependencies.
   Every module is independent and fails quietly if its DOM is absent.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Environment ──────────────────────────────────────────── */

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  function reduced() { return motionQuery.matches; }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* rAF-coalesced callback: many events in, one frame out. */
  function framed(fn) {
    var queued = false, lastArgs;
    return function () {
      lastArgs = arguments;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        fn.apply(null, lastArgs);
      });
    };
  }


  /* ── Static bits: year, platform modifier key ──────────────── */

  var Chrome = {
    init: function () {
      var year = $('[data-year]');
      if (year) year.textContent = String(new Date().getFullYear());

      var isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
      $$('[data-modkey]').forEach(function (el) { el.textContent = isMac ? '⌘' : 'Ctrl'; });
    }
  };


  /* ── Local clock (hero spec sheet) ─────────────────────────── */

  var Clock = {
    init: function () {
      var el = $('[data-clock]');
      if (!el) return;

      function tick() {
        var now = new Date();
        var hh = String(now.getHours()).padStart(2, '0');
        var mm = String(now.getMinutes()).padStart(2, '0');
        el.textContent = hh + ':' + mm;
        el.setAttribute('datetime', now.toISOString());
      }
      tick();
      // Align to the next minute boundary, then tick once a minute.
      setTimeout(function () {
        tick();
        setInterval(tick, 60000);
      }, (60 - new Date().getSeconds()) * 1000);
    }
  };


  /* ── Scroll: progress bar, sticky topbar, active section ───── */

  var Scroll = {
    init: function () {
      var bar     = $('[data-progress]');
      var topbar  = $('[data-topbar]');
      var targets = $$('[data-section]');
      var navMap  = {};

      $$('[data-navlink]').forEach(function (a) {
        (navMap[a.dataset.navlink] = navMap[a.dataset.navlink] || []).push(a);
      });
      $$('[data-raillink]').forEach(function (a) {
        (navMap[a.dataset.raillink] = navMap[a.dataset.raillink] || []).push(a);
      });

      var current = null;

      function update() {
        var y      = window.scrollY || window.pageYOffset;
        var height = document.documentElement.scrollHeight - window.innerHeight;

        if (bar) bar.style.height = (height > 0 ? Math.min(1, y / height) * 100 : 0) + '%';
        if (topbar) topbar.dataset.stuck = y > 12 ? 'true' : 'false';

        // The active section is the last one whose top has passed the reading line.
        var line = y + window.innerHeight * 0.32;
        var active = targets.length ? targets[0].dataset.section : null;

        for (var i = 0; i < targets.length; i++) {
          if (targets[i].offsetTop <= line) active = targets[i].dataset.section;
        }
        // Bottom of the page always resolves to the last section.
        if (height > 0 && y >= height - 4 && targets.length) {
          active = targets[targets.length - 1].dataset.section;
        }

        if (active !== current) {
          if (current && navMap[current]) {
            navMap[current].forEach(function (a) {
              a.removeAttribute('data-active');
              a.removeAttribute('aria-current');
            });
          }
          if (active && navMap[active]) {
            navMap[active].forEach(function (a) {
              a.dataset.active = 'true';
              a.setAttribute('aria-current', 'true');
            });
          }
          current = active;
        }
      }

      var onScroll = framed(update);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      update();
    }
  };


  /* ── Reveal on enter ──────────────────────────────────────── */

  var Reveal = {
    init: function () {
      var items = $$('[data-reveal], [data-mask]');
      if (!items.length) return;

      if (reduced() || !('IntersectionObserver' in window)) {
        items.forEach(function (el) { el.classList.add('is-in'); });
        return;
      }

      // Stagger siblings that share a parent, so groups cascade.
      items.forEach(function (el) {
        var siblings = $$('[data-reveal], [data-mask]', el.parentElement);
        el.style.setProperty('--i', Math.min(siblings.indexOf(el), 5));
      });

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

      items.forEach(function (el) { io.observe(el); });
    }
  };


  /* ── Hero field: the grid is always there, the cursor reveals it ── */

  var Field = {
    init: function () {
      var hero = $('.hero__pin') || $('.hero');
      var grid = $('.field__grid');
      if (!hero || !grid || !finePointer.matches || reduced()) return;

      document.body.dataset.field = 'on';

      var move = framed(function (x, y) {
        var rect = hero.getBoundingClientRect();
        grid.style.setProperty('--mx', (x - rect.left) + 'px');
        grid.style.setProperty('--my', (y - rect.top) + 'px');
      });

      hero.addEventListener('pointermove', function (e) { move(e.clientX, e.clientY); });
      hero.addEventListener('pointerleave', function () {
        grid.style.setProperty('--mx', '50%');
        grid.style.setProperty('--my', '40%');
      });
    }
  };


  /* ── Magnetic buttons (fine pointers only, small displacement) ── */

  var Magnetic = {
    init: function () {
      if (!finePointer.matches || reduced()) return;

      $$('[data-magnetic]').forEach(function (el) {
        var strength = 0.22, max = 7;

        var move = framed(function (e) {
          var r  = el.getBoundingClientRect();
          var dx = (e.clientX - (r.left + r.width / 2)) * strength;
          var dy = (e.clientY - (r.top + r.height / 2)) * strength;
          var clamp = function (v) { return Math.max(-max, Math.min(max, v)); };
          el.style.transform = 'translate(' + clamp(dx) + 'px,' + clamp(dy) + 'px)';
        });

        el.addEventListener('pointermove', move);
        el.addEventListener('pointerleave', function () { el.style.transform = ''; });
        el.addEventListener('blur', function () { el.style.transform = ''; });
      });
    }
  };


  /* ── Stack: technology notes ──────────────────────────────── */

  var Stack = {
    init: function () {
      var out = $('[data-stack-note]');
      if (!out) return;

      var idle = out.innerHTML;

      function show(el) {
        var note = el.dataset.note || '';
        out.innerHTML = '';
        var label = document.createElement('span');
        label.style.color = 'var(--signal)';
        label.textContent = el.textContent.trim() + ' — ';
        out.appendChild(label);
        out.appendChild(document.createTextNode(note));
      }

      function clear() { out.innerHTML = idle; }

      $$('.tech').forEach(function (el) {
        el.addEventListener('pointerenter', function () { show(el); });
        el.addEventListener('focus', function () { show(el); });
        el.addEventListener('pointerleave', clear);
        el.addEventListener('blur', clear);
        // Tapping on touch is a click; keep the note pinned until another tap.
        el.addEventListener('click', function (e) { e.preventDefault(); show(el); });
      });
    }
  };


  /* ── Command palette (Ctrl/Cmd-K, or "/") ─────────────────── */

  var Palette = {
    items: [
      { idx: '00', label: 'Index',                   hint: 'Section', href: '#top' },
      { idx: '01', label: 'Identity',                hint: 'Section', href: '#identity' },
      { idx: '02', label: 'Work',                    hint: 'Section', href: '#work' },
      { idx: '03', label: 'World Coffee Atlas',      hint: 'Case study', href: '#atlas' },
      { idx: '04', label: 'Anti-Gravity Simulation', hint: 'Case study', href: '#simulation' },
      { idx: '05', label: 'Stack',                   hint: 'Section', href: '#stack' },
      { idx: '06', label: 'Exploring',               hint: 'Section', href: '#exploring' },
      { idx: '07', label: 'Contact',                 hint: 'Section', href: '#contact' },
      { idx: '→', label: 'GitHub',            hint: 'External', href: null, from: 'github.com/LavyaS' },
      { idx: '→', label: 'LinkedIn',          hint: 'External', href: null, from: 'linkedin.com/in' },
      { idx: '→', label: 'Atlas — live site', hint: 'External', href: null, from: 'netlify.app' },
      { idx: '→', label: 'Email',             hint: 'External', href: null, from: 'mailto:' },
      { idx: '→', label: 'Résumé',            hint: 'External', href: null, from: 'resume' }
    ],

    init: function () {
      var root  = $('[data-palette]');
      var input = $('[data-palette-input]');
      var list  = $('[data-palette-list]');
      if (!root || !input || !list) return;

      var self = this, active = 0, results = [], lastFocus = null;

      // Resolve external destinations from the footer so there is one
      // source of truth for the real URLs: the markup.
      this.items.forEach(function (item) {
        if (item.href || !item.from) return;
        var match = $$('a[href]').filter(function (a) {
          return a.getAttribute('href').indexOf(item.from) !== -1;
        })[0];
        item.href = match ? match.getAttribute('href') : null;
      });

      function open() {
        lastFocus = document.activeElement;
        root.hidden = false;
        document.body.classList.add('palette-open');
        input.value = '';
        render('');
        if (finePointer.matches) input.focus();
      }

      function close() {
        root.hidden = true;
        document.body.classList.remove('palette-open');
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      }

      function render(query) {
        var q = query.trim().toLowerCase();
        results = self.items.filter(function (item) {
          return item.href && (!q || item.label.toLowerCase().indexOf(q) !== -1);
        });
        active = 0;
        list.innerHTML = '';

        if (!results.length) {
          var empty = document.createElement('li');
          empty.className = 'palette__empty';
          empty.setAttribute('role', 'presentation');
          empty.textContent = 'No matches';
          list.appendChild(empty);
          return;
        }

        results.forEach(function (item, i) {
          var li = document.createElement('li');
          li.setAttribute('role', 'option');
          li.id = 'palette-opt-' + i;
          li.setAttribute('aria-selected', String(i === 0));

          var b = document.createElement('b');
          b.textContent = item.idx;
          var span = document.createElement('span');
          span.textContent = item.label;
          var em = document.createElement('em');
          em.textContent = item.hint;

          li.append(b, span, em);
          li.addEventListener('mouseenter', function () { select(i); });
          li.addEventListener('click', function () { go(item); });
          list.appendChild(li);
        });
        syncActive();
      }

      function select(i) { active = i; syncActive(); }

      function syncActive() {
        $$('li[role="option"]', list).forEach(function (li, i) {
          li.setAttribute('aria-selected', String(i === active));
          if (i === active) {
            input.setAttribute('aria-activedescendant', li.id);
            li.scrollIntoView({ block: 'nearest' });
          }
        });
      }

      function go(item) {
        close();
        if (!item || !item.href) return;
        if (item.href.charAt(0) === '#') {
          var target = document.querySelector(item.href);
          if (target) {
            target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
            // Move keyboard focus with the viewport, not just the scroll position.
            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
          }
        } else {
          window.location.href = item.href;
        }
      }

      input.addEventListener('input', function () { render(input.value); });

      root.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); close(); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); if (results.length) select((active + 1) % results.length); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); if (results.length) select((active - 1 + results.length) % results.length); }
        if (e.key === 'Enter')     { e.preventDefault(); go(results[active]); }
        if (e.key === 'Tab')       { e.preventDefault(); } // simple trap: one focusable field
      });

      $$('[data-palette-close]').forEach(function (el) { el.addEventListener('click', close); });
      $$('[data-palette-open]').forEach(function (el) { el.addEventListener('click', open); });

      document.addEventListener('keydown', function (e) {
        var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) ||
                     document.activeElement.isContentEditable;

        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          root.hidden ? open() : close();
          return;
        }
        if (e.key === '/' && !typing && root.hidden) { e.preventDefault(); open(); }
      });
    }
  };


  /* ── Easter egg: reveal the grid this page is built on (G) ── */

  var GridReveal = {
    init: function () {
      document.addEventListener('keydown', function (e) {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) ||
                     document.activeElement.isContentEditable;
        if (typing) return;

        if (e.key.toLowerCase() === 'g') {
          document.body.classList.toggle('show-grid');
        }
      });
    }
  };


  /* ── Content lint ─────────────────────────────────────────────
     Placeholders are a stage, not a state. This warns in the
     console until every slot is filled — delete it when done.  */

  var Lint = {
    init: function () {
      var slots = $$('[data-slot]');
      if (!slots.length) return;

      var byZone = {};
      slots.forEach(function (el) {
        var section = el.closest('section, footer');
        var zone = section ? (section.id || 'page') : 'page';
        byZone[zone] = (byZone[zone] || 0) + 1;
      });

      if (!console.groupCollapsed) return;
      console.groupCollapsed(
        '%c CONTENT %c ' + slots.length + ' placeholder' + (slots.length === 1 ? '' : 's') + ' left to fill',
        'background:#FF4A1C;color:#0B0B0C;font-weight:700', 'color:#96938D'
      );
      Object.keys(byZone).forEach(function (zone) {
        console.log('#' + zone + ' → ' + byZone[zone]);
      });
      console.log('Search the markup for data-slot and the EDIT comments.');
      console.groupEnd();
    }
  };


  /* ── Signature ────────────────────────────────────────────── */

  function signature() {
    if (!window.console || !console.log) return;
    console.log(
      '%cLavya%c\nHand-written HTML, CSS and JS. No framework, no build step.\nPress G on the page to see the grid it is built on.\nIf you are reading this, we should probably talk.',
      'font:700 22px/1 ui-sans-serif,system-ui;color:#FF4A1C',
      'font:12px/1.7 ui-monospace,monospace;color:#96938D'
    );
  }


  /* ── Boot ─────────────────────────────────────────────────── */

  function boot() {
    [Chrome, Clock, Scroll, Reveal, Field, Magnetic, Stack, Palette, GridReveal, Lint]
      .forEach(function (mod) {
        try { mod.init(); }
        catch (err) { if (console && console.warn) console.warn('[module failed]', err); }
      });
    signature();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
