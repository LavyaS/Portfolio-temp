/* ═══════════════════════════════════════════════════════════════
   LAVYA — scenes.js
   Scroll choreography, cursor, and the two project set-pieces.

   Design rule for this file: JavaScript never writes layout
   properties. It writes one custom property per scene per frame
   (--p, 0 → 1) and CSS decides what that means. Geometry is read
   in a single batched pass on resize, never inside the scroll
   loop, so there is no forced reflow while scrolling.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  function reduced() { return motionQuery.matches; }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }


  /* ── Scroll scenes ────────────────────────────────────────────
     Each [data-scene] is a scroll runway. Progress is how far the
     viewport has travelled through it, 0 at the top, 1 once its
     pinned child is about to release.                          */

  var Scenes = {
    items: [],

    init: function () {
      var els = $$('[data-scene]');
      if (!els.length) return;

      this.items = els.map(function (el) { return { el: el, top: 0, span: 1, last: -1 }; });

      var self = this;
      var pending = false;

      function frame() {
        pending = false;
        self.write(window.scrollY || window.pageYOffset);
      }
      function onScroll() {
        if (pending) return;
        pending = true;
        requestAnimationFrame(frame);
      }

      var resizeTimer;
      function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () { self.measure(); frame(); }, 120);
      }

      this.measure();
      frame();

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
      window.addEventListener('orientationchange', onResize);

      // Web fonts change line heights, which changes every offset.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { self.measure(); frame(); });
      }
    },

    /* One batched read pass. Never called from the scroll loop. */
    measure: function () {
      var scrollY = window.scrollY || window.pageYOffset;
      var vh = window.innerHeight;
      this.items.forEach(function (it) {
        var rect = it.el.getBoundingClientRect();
        it.top = rect.top + scrollY;
        it.span = Math.max(1, it.el.offsetHeight - vh);
        it.last = -1;
      });
    },

    /* One write pass. No reads, so nothing can thrash layout. */
    write: function (y) {
      for (var i = 0; i < this.items.length; i++) {
        var it = this.items[i];
        var p = clamp((y - it.top) / it.span, 0, 1);
        // Skip sub-pixel churn; the CSS cannot show it anyway.
        if (Math.abs(p - it.last) < 0.0015 && p !== 0 && p !== 1) continue;
        it.last = p;
        it.el.style.setProperty('--p', p.toFixed(4));
      }
    }
  };


  /* ── Topbar: reclaim the viewport when reading downward ────── */

  var Nav = {
    init: function () {
      var bar = $('[data-topbar]');
      if (!bar || reduced()) return;

      var lastY = window.scrollY || 0;
      var pending = false;

      function frame() {
        pending = false;
        var y = window.scrollY || window.pageYOffset;
        var past = y > window.innerHeight * 1.2;
        var down = y > lastY + 4;
        var up = y < lastY - 4;

        if (!past || up) bar.dataset.hide = 'false';
        else if (down && !document.body.classList.contains('palette-open')) bar.dataset.hide = 'true';

        if (Math.abs(y - lastY) > 3) lastY = y;
      }

      window.addEventListener('scroll', function () {
        if (pending) return;
        pending = true;
        requestAnimationFrame(frame);
      }, { passive: true });
    }
  };


  /* ── Custom cursor ────────────────────────────────────────────
     Desktop, fine pointer, motion allowed. Everywhere else the
     native cursor is left alone.                               */

  var Cursor = {
    init: function () {
      var root = $('[data-cursor]');
      if (!root || !finePointer.matches || reduced()) return;

      var label = $('[data-cursor-label]', root);
      document.body.classList.add('has-cursor');

      var tx = 0, ty = 0, cx = 0, cy = 0, raf = null, started = false;

      function loop() {
        cx += (tx - cx) * 0.22;
        cy += (ty - cy) * 0.22;
        root.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
        raf = (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1)
          ? requestAnimationFrame(loop) : null;
      }

      document.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        tx = e.clientX; ty = e.clientY;
        if (!started) { cx = tx; cy = ty; started = true; root.dataset.ready = 'true'; }
        if (!raf) raf = requestAnimationFrame(loop);
      }, { passive: true });

      document.addEventListener('pointerover', function (e) {
        var t = e.target;
        if (!t || !t.closest) return;

        var labelled = t.closest('[data-cursor-label]');
        if (labelled) {
          label.textContent = labelled.getAttribute('data-cursor-label');
          root.dataset.state = 'label';
          return;
        }
        root.dataset.state = t.closest('a, button, [role="option"]') ? 'link' : '';
      }, { passive: true });

      // Leaving the window should not strand the dot at the edge.
      document.addEventListener('mouseleave', function () { root.style.opacity = '0'; });
      document.addEventListener('mouseenter', function () { root.style.opacity = ''; });
    }
  };


  /* ── Atlas: the coffee belt ───────────────────────────────────
     A technical diagram, not a decorative map. Every country
     plotted here is one the project actually covers; positions
     are real latitude/longitude on an equirectangular grid
     cropped to the growing band.                               */

  var COUNTRIES = [
    ['Brazil', -15, -47],        ['Colombia', 4, -74],     ['Ethiopia', 9, 38],
    ['Vietnam', 16, 106],        ['Indonesia', -2, 118],   ['Honduras', 14, -87],
    ['India', 13, 76],           ['Uganda', 1, 32],        ['Mexico', 17, -96],
    ['Peru', -9, -75],           ['Guatemala', 15, -90],   ['Nicaragua', 13, -85],
    ['China', 24, 101],          ['Costa Rica', 10, -84],  ['Kenya', -1, 37],
    ['Papua New Guinea', -6, 145], ['Tanzania', -6, 35],   ['El Salvador', 14, -89],
    ['Ecuador', -1, -78],        ['Rwanda', -2, 30],       ['Burundi', -3, 30],
    ['Panama', 9, -80],          ['Yemen', 15, 44],        ['Jamaica', 18, -77],
    ['Bolivia', -17, -65]
  ];

  var Belt = {
    init: function () {
      var fig = $('[data-belt]');
      if (!fig) return;

      var W = 1000, H = 300, LAT = 30;      // viewBox, cropped to ±30°
      var x = function (lon) { return (lon + 180) / 360 * W; };
      var y = function (lat) { return (LAT - lat) / (LAT * 2) * H; };

      var NS = 'http://www.w3.org/2000/svg';
      var grid = $('[data-belt-grid]', fig);
      var dots = $('[data-belt-dots]', fig);
      if (!grid || !dots) return;

      function line(cls, y1, x1, x2) {
        var el = document.createElementNS(NS, 'line');
        el.setAttribute('class', cls);
        el.setAttribute('x1', x1); el.setAttribute('x2', x2);
        el.setAttribute('y1', y1); el.setAttribute('y2', y1);
        grid.appendChild(el);
      }
      function text(str, px, py) {
        var el = document.createElementNS(NS, 'text');
        el.setAttribute('class', 'belt-lbl');
        el.setAttribute('x', px); el.setAttribute('y', py);
        el.textContent = str;
        grid.appendChild(el);
      }

      // Latitude structure: the two tropics bound the growing band.
      line('belt-trop', y(23.5), 0, W);
      line('belt-line', y(0), 0, W);
      line('belt-trop', y(-23.5), 0, W);
      text('23.5°N', 4, y(23.5) - 7);
      text('0°', 4, y(0) - 7);
      text('23.5°S', 4, y(-23.5) - 7);

      // Longitude ticks every 60°.
      for (var lon = -120; lon <= 120; lon += 60) {
        var v = document.createElementNS(NS, 'line');
        v.setAttribute('class', 'belt-line');
        v.setAttribute('x1', x(lon)); v.setAttribute('x2', x(lon));
        v.setAttribute('y1', 0); v.setAttribute('y2', H);
        v.setAttribute('opacity', '0.5');
        grid.appendChild(v);
      }

      COUNTRIES.forEach(function (c, i) {
        var dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('cx', x(c[2]).toFixed(1));
        dot.setAttribute('cy', y(c[1]).toFixed(1));
        dot.setAttribute('r', '5');
        dot.style.setProperty('--i', i);
        var t = document.createElementNS(NS, 'title');
        t.textContent = c[0];
        dot.appendChild(t);
        dots.appendChild(dot);
      });

      // Bring the diagram to life once it is genuinely on screen.
      if (!('IntersectionObserver' in window)) { fig.classList.add('is-live'); Counters.run(fig); return; }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          fig.classList.add('is-live');
          Counters.run(fig);
          io.disconnect();
        });
      }, { threshold: 0.25 });
      io.observe(fig);
    }
  };


  /* ── Counters ─────────────────────────────────────────────── */

  var Counters = {
    run: function (root) {
      $$('[data-count]', root).forEach(function (el) {
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        if (reduced()) { el.textContent = target; return; }

        var started = null, dur = 1100;
        function step(now) {
          if (started === null) started = now;
          var t = clamp((now - started) / dur, 0, 1);
          // easeOutCubic — fast, then settles
          var v = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(target * v);
          if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }
  };


  /* ── Simulation: a real PID controller ────────────────────────
     Same control law as the Python project: a proportional,
     integral and derivative term summed into a corrective force,
     with anti-windup on the integral and a velocity clamp
     standing in for the rule-based emergency damping.          */

  function PID(kp, ki, kd) {
    this.kp = kp; this.ki = ki; this.kd = kd;
    this.integral = 0; this.prev = 0;
    this.p = this.i = this.d = 0;
  }
  PID.prototype.step = function (err, dt) {
    this.integral = clamp(this.integral + err * dt, -40, 40);   // anti-windup
    var deriv = (err - this.prev) / dt;
    this.prev = err;
    this.p = this.kp * err;
    this.i = this.ki * this.integral;
    this.d = this.kd * deriv;
    return this.p + this.i + this.d;
  };

  var Sim = {
    init: function () {
      var canvas = $('[data-sim]');
      if (!canvas) return;

      var ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      var stage = canvas.parentElement;
      var toggle = $('[data-sim-toggle]');
      var toggleLabel = $('[data-sim-toggle-label]');
      var out = {
        p: $('[data-sim-p]'), i: $('[data-sim-i]'),
        d: $('[data-sim-d]'), e: $('[data-sim-e]')
      };

      var W = 0, H = 0, dpr = 1;
      var bodies = [];
      var stabilize = true;
      var visible = false;
      var raf = null;
      var last = 0;
      var pointer = { x: null, y: null };
      var GRAVITY = 330;

      function size() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = stage.clientWidth;
        H = stage.clientHeight;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (!bodies.length) seed(); else retarget();
      }

      function seed() {
        bodies = [];
        var n = W < 700 ? 4 : 6;
        for (var k = 0; k < n; k++) {
          bodies.push({
            x: 0, y: 0, vx: 0, vy: 0,
            mass: 1 + k * 0.22,
            r: 5 + (k % 3) * 2.5,
            pid: new PID(9.5, 26, 7.0),
            trail: []
          });
        }
        retarget();
        bodies.forEach(function (b) { b.x = b.tx; b.y = b.ty - 120; });
      }

      function retarget() {
        var n = bodies.length;
        bodies.forEach(function (b, k) {
          b.baseX = W * (0.5 + (k - (n - 1) / 2) * 0.088);
          b.baseY = H * 0.52;
          b.tx = b.baseX; b.ty = b.baseY;
        });
      }

      function stepPhysics(dt) {
        var meanErr = 0;
        var lead = bodies[0];

        bodies.forEach(function (b) {
          // Target follows the pointer, softly, keeping the constellation.
          var wantX = b.baseX, wantY = b.baseY;
          if (pointer.x !== null) {
            wantX = b.baseX + (pointer.x - W / 2) * 0.55;
            wantY = b.baseY + (pointer.y - H / 2) * 0.55;
          }
          b.tx += (wantX - b.tx) * Math.min(1, dt * 3);
          b.ty += (wantY - b.ty) * Math.min(1, dt * 3);

          // Newton: gravity always, correction only when stabilizing.
          var fy = GRAVITY * b.mass;
          var fx = 0;

          if (stabilize) {
            fy += b.pid.step(b.ty - b.y, dt) * b.mass;
            var ex = b.tx - b.x;
            fx += (ex * 9.5 - b.vx * 5.2) * b.mass;
          }

          b.vy += (fy / b.mass) * dt;
          b.vx += (fx / b.mass) * dt;

          // Rule-based override: clamp runaway velocity.
          b.vy = clamp(b.vy, -900, 900);
          b.vx = clamp(b.vx, -900, 900);

          b.x += b.vx * dt;
          b.y += b.vy * dt;

          // Floor, so a released body settles instead of vanishing.
          if (b.y > H + 60) { b.y = -40; b.vy = 0; b.pid.integral = 0; }

          meanErr += Math.abs(b.ty - b.y);

          b.trail.push(b.x, b.y);
          if (b.trail.length > 26) b.trail.splice(0, 2);
        });

        if (out.p) {
          out.p.textContent = (lead.pid.p / 100).toFixed(2);
          out.i.textContent = (lead.pid.i / 100).toFixed(2);
          out.d.textContent = (lead.pid.d / 100).toFixed(2);
          out.e.textContent = (meanErr / bodies.length).toFixed(2);
        }
      }

      function draw() {
        ctx.clearRect(0, 0, W, H);

        // Target crosshair — where the controller is aiming.
        if (stabilize) {
          var t = bodies[Math.floor(bodies.length / 2)];
          ctx.strokeStyle = 'rgba(255,74,28,0.30)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, t.ty); ctx.lineTo(W, t.ty);
          ctx.moveTo(t.tx, 0); ctx.lineTo(t.tx, H);
          ctx.stroke();
        }

        bodies.forEach(function (b) {
          // Trail
          if (b.trail.length > 3) {
            ctx.strokeStyle = 'rgba(239,237,232,0.13)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(b.trail[0], b.trail[1]);
            for (var k = 2; k < b.trail.length; k += 2) ctx.lineTo(b.trail[k], b.trail[k + 1]);
            ctx.stroke();
          }
          // Tether to target
          if (stabilize) {
            ctx.strokeStyle = 'rgba(255,74,28,0.16)';
            ctx.beginPath();
            ctx.moveTo(b.x, b.y); ctx.lineTo(b.tx, b.ty);
            ctx.stroke();
          }
          // Body
          ctx.fillStyle = stabilize ? '#FF4A1C' : 'rgba(239,237,232,0.55)';
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      function loop(now) {
        if (!visible) { raf = null; return; }
        var dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
        last = now;
        stepPhysics(dt);
        draw();
        raf = requestAnimationFrame(loop);
      }

      function start() {
        if (raf || reduced()) return;
        last = 0;
        raf = requestAnimationFrame(loop);
      }

      size();
      window.addEventListener('resize', function () { size(); }, { passive: true });

      stage.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = stage.getBoundingClientRect();
        pointer.x = e.clientX - r.left;
        pointer.y = e.clientY - r.top;
      }, { passive: true });
      stage.addEventListener('pointerleave', function () { pointer.x = pointer.y = null; });

      if (toggle) {
        toggle.addEventListener('click', function () {
          stabilize = !stabilize;
          toggle.setAttribute('aria-pressed', String(stabilize));
          if (toggleLabel) toggleLabel.textContent = stabilize ? 'Stabilizer on' : 'Stabilizer off';
          if (stabilize) bodies.forEach(function (b) { b.pid.integral = 0; });
        });
      }

      // Reduced motion gets one honest static frame, not an empty box.
      if (reduced()) { stepPhysics(1 / 60); draw(); return; }

      if (!('IntersectionObserver' in window)) { visible = true; start(); return; }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          visible = en.isIntersecting;
          if (visible) start();
        });
      }, { threshold: 0.05 });
      io.observe(stage);

      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { visible = false; }
        else if (!document.hidden) { visible = true; start(); }
      });
    }
  };


  /* ── Boot ─────────────────────────────────────────────────── */

  function boot() {
    [Scenes, Nav, Cursor, Belt, Sim].forEach(function (mod) {
      try { mod.init(); }
      catch (err) { if (window.console && console.warn) console.warn('[scene module failed]', err); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
