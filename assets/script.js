(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var root = document.documentElement;
  var reduce = false; // animações mantidas mesmo com economia de bateria
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- language ---------- */
  function getLang() { return root.getAttribute('data-lang') || 'pt'; }
  var T = function (pt, en) { return getLang() === 'pt' ? pt : en; };
  var fmt = function (n, d) { var s = n.toFixed(d); return getLang() === 'pt' ? s.replace('.', ',') : s; };
  function setLang(l) {
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l === 'pt' ? 'pt-BR' : 'en');
    document.title = l === 'pt' ? 'Matheus Mavignier · Analista Químico' : 'Matheus Mavignier · Chemical Analyst';
    try { localStorage.setItem('mm-lang', l); } catch (e) {}
    typerRestart();
  }
  function vt(fn, cls) {
    if (!document.startViewTransition || reduce) { fn(); return; }
    if (cls) root.classList.add(cls);
    var t = document.startViewTransition(fn);
    t.finished.then(function () { if (cls) root.classList.remove(cls); });
  }
  $('#langBtn').addEventListener('click', function () { vt(function () { setLang(getLang() === 'pt' ? 'en' : 'pt'); moveInd(); }); });

  /* ---------- theme ---------- */
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('mm-theme', t); } catch (e) {}
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'dark' ? '#0b1a1f' : '#f4f8f8');
  }
  $('#themeBtn').addEventListener('click', function (e) {
    var r = e.currentTarget.getBoundingClientRect();
    root.style.setProperty('--vx', (r.left + r.width / 2) + 'px');
    root.style.setProperty('--vy', (r.top + r.height / 2) + 'px');
    vt(function () { setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }, 'vt-theme');
  });

  /* ---------- drawer menu ---------- */
  var menuBtn = $('#menuBtn'), drawer = $('#drawer'), scrim = $('#scrim');
  var menuHist = false, pendingTarget = null;
  function applyMenu(open) {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    drawer.style.transform = '';
    if (open) setTimeout(function () { $('#drawerClose').focus(); }, 300); else menuBtn.focus({ preventScroll: true });
  }
  function setMenu(open) {
    if (open) {
      if (!menuHist) { history.pushState({ mmMenu: 1 }, ''); menuHist = true; }
      applyMenu(true);
    } else {
      applyMenu(false);
      if (menuHist) { menuHist = false; history.back(); } else goPending();
    }
  }
  function goPending() {
    if (!pendingTarget) return;
    var t = document.querySelector(pendingTarget); pendingTarget = null;
    if (t) setTimeout(function () { t.scrollIntoView({ behavior: 'smooth' }); }, 60);
  }
  // back button (PC or phone) closes the drawer instead of leaving the page
  window.addEventListener('popstate', function () {
    if (root.classList.contains('menu-open')) { menuHist = false; applyMenu(false); }
    goPending();
  });
  menuBtn.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
  $('#drawerClose').addEventListener('click', function () { setMenu(false); });
  scrim.addEventListener('click', function () { setMenu(false); });
  $$('.drawer a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); pendingTarget = a.getAttribute('href'); setMenu(false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('menu-open')) setMenu(false); });
  // swipe right to close
  var sx = null, dx = 0;
  drawer.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; dx = 0; drawer.style.transition = 'none'; }, { passive: true });
  drawer.addEventListener('touchmove', function (e) { if (sx === null) return; dx = Math.max(0, e.touches[0].clientX - sx); drawer.style.transform = 'translateX(' + dx + 'px)'; }, { passive: true });
  drawer.addEventListener('touchend', function () { drawer.style.transition = ''; if (dx > 80) setMenu(false); else drawer.style.transform = ''; sx = null; });

  /* ---------- typer ---------- */
  var PHR = {
    pt: ['Controle de Qualidade de matérias-primas', 'Análises físico-químicas', 'Laudos e certificados de análise', 'Reometria e vulcanização', 'Borracha e elastômeros'],
    en: ['Raw material Quality Control', 'Physicochemical testing', 'Test reports and CoA', 'Rheometry and vulcanization', 'Rubber and elastomers']
  };
  var typerEl = $('#typer'), tTimer = null, tI = 0, tC = 0, tDel = false;
  function typerTick() {
    var list = PHR[getLang()], word = list[tI % list.length];
    if (!tDel) { tC++; typerEl.textContent = word.slice(0, tC); if (tC >= word.length) { tDel = true; tTimer = setTimeout(typerTick, 1800); return; } }
    else { tC--; typerEl.textContent = word.slice(0, tC); if (tC <= 0) { tDel = false; tI++; } }
    tTimer = setTimeout(typerTick, tDel ? 28 : 55);
  }
  function typerRestart() {
    clearTimeout(tTimer); tI = 0; tC = 0; tDel = false;
    if (reduce) { typerEl.textContent = PHR[getLang()][0]; return; }
    typerTick();
  }

  /* ---------- scroll: progress, header, active nav, timeline fill ---------- */
  var prog = $('#progress'), top = $('.top'), tl = $('#timeline'), fill = $('.tl-fill');
  var secs = ['sobre', 'competencias', 'trajetoria', 'contato'].map(function (id) { return document.getElementById(id); });
  var ind = $('.ind'), ring = $('#ringFg'), toTop = $('#toTop');
  var nativeProg = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');
  function moveInd() {
    var a = $('.desk-nav a.active');
    if (!ind) return;
    if (!a) { ind.style.opacity = 0; return; }
    ind.style.opacity = 1; ind.style.width = a.offsetWidth + 'px'; ind.style.transform = 'translateX(' + a.offsetLeft + 'px)';
  }
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  var ticking = false;
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    var pr = h > 0 ? y / h : 0;
    if (!nativeProg) prog.style.transform = 'scaleX(' + pr + ')';
    ring.style.strokeDashoffset = 132 * (1 - pr);
    toTop.classList.toggle('show', y > window.innerHeight * .8);
    top.classList.toggle('scrolled', y > 10);
    var cur = null;
    secs.forEach(function (s) { if (s && s.getBoundingClientRect().top < window.innerHeight * .4) cur = s.id; });
    $$('.desk-nav a, .drawer-nav a').forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + cur); });
    moveInd();
    if (tl) {
      var r = tl.getBoundingClientRect(), total = r.height - 32;
      var done = Math.max(0, Math.min(total, window.innerHeight * .6 - r.top));
      fill.style.height = done + 'px';
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- accordion ---------- */
  $$('.acc > .acc-h').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.parentNode, open = !item.classList.contains('open');
      if (open) Array.prototype.forEach.call(item.parentNode.children, function (sib) {
        if (sib !== item && sib.classList.contains('open')) { sib.classList.remove('open'); var h = sib.querySelector('.acc-h'); if (h) h.setAttribute('aria-expanded', 'false'); }
      });
      var y0 = btn.getBoundingClientRect().top, minTop = (top ? top.offsetHeight : 66) + 12;
      var target = Math.max(minTop, Math.min(y0, window.innerHeight * .45));
      item.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      // keep the tapped header on screen while siblings collapse/expand
      var tStart = null;
      (function keep(ts) {
        if (tStart === null) tStart = ts;
        var d = btn.getBoundingClientRect().top - target;
        if (Math.abs(d) > 1) window.scrollBy(0, d);
        if (ts - tStart < 650) requestAnimationFrame(keep); else onScroll();
      })(performance.now());
    });
  });
  // stagger indexes
  $$('.chips, .ticks').forEach(function (ul) { $$('li', ul).forEach(function (li, i) { li.style.setProperty('--i', i); li.style.transitionDelay = li.style.transitionDelay || ''; }); });
  $$('.reveal .chips').forEach(function (ul) { $$('li', ul).forEach(function (li, i) { li.style.transitionDelay = (0.25 + i * 0.03) + 's'; }); });

  /* ---------- reveal + counters ---------- */
  function countUp(el) {
    var to = +el.getAttribute('data-to'), t0 = null;
    function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1300); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  var obs = $$('.reveal, .count');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        var t = en.target, isCount = t.classList.contains('count');
        if (en.isIntersecting) {
          if (isCount) { if (!t._on) { t._on = true; countUp(t); } }
          else t.classList.add('in');
        } else if (en.boundingClientRect.top > 0 || en.boundingClientRect.bottom < 0) {
          // left the screen (above or below): reset so it animates again next time
          if (isCount) { t._on = false; t.textContent = '0'; }
          else t.classList.remove('in');
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    obs.forEach(function (e) { io.observe(e); });
  } else {
    obs.forEach(function (e) { e.classList.add('in'); if (e.classList.contains('count')) e.textContent = e.getAttribute('data-to'); });
  }

  /* ---------- spotlight + tilt (pointer devices) ---------- */
  if (window.matchMedia('(hover: hover)').matches && !reduce) {
    $$('.spot').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    var tilt = $('#tilt');
    if (tilt) {
      tilt.addEventListener('mousemove', function (e) {
        var r = tilt.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        tilt.style.transform = 'perspective(900px) rotateY(' + (x * 7) + 'deg) rotateX(' + (-y * 7) + 'deg)';
      });
      tilt.addEventListener('mouseleave', function () { tilt.style.transform = ''; });
    }
  }

  /* ---------- hero rheometer (illustrative, animated) ---------- */
  (function () {
    var svg = $('#heroChart');
    if (!svg) return;
    var W = 340, H = 210, L = 30, R = 12, Tp = 12, B = 24, TMAX = 12, SMAX = 20;
    var ML = 1.6, MH = 16, TI = 1.2, K = 0.55;
    function torque(t) { var w = 1.4 * Math.exp(-t / 0.25); return t <= TI ? ML + w : ML + w + (MH - ML) * (1 - Math.exp(-K * (t - TI))); }
    var x = function (t) { return L + (W - L - R) * t / TMAX; };
    var y = function (v) { return H - B - (H - Tp - B) * v / SMAX; };
    function el(tag, a, txt) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; svg.appendChild(e); return e; }
    // precompute
    var pts = [], i, mn = 1e9, mx = -1e9;
    for (i = 0; i <= 600; i++) { var t = TMAX * i / 600, v = torque(t); pts.push([t, v]); if (v < mn) mn = v; if (v > mx) mx = v; }
    var ts2 = null, t90 = null, past = false;
    pts.forEach(function (p) { if (p[1] <= mn + 1e-9) past = true; if (past && ts2 === null && p[1] >= mn + 2) ts2 = p[0]; if (past && t90 === null && p[1] >= mn + .9 * (mx - mn)) t90 = p[0]; });
    // static
    var g;
    for (g = 0; g <= 20; g += 5) { el('line', { x1: L, x2: W - R, y1: y(g), y2: y(g), class: 'ch-grid' }); el('text', { x: L - 6, y: y(g) + 3, 'text-anchor': 'end', class: 'ch-tk' }, g); }
    for (g = 0; g <= TMAX; g += 3) { el('line', { x1: x(g), x2: x(g), y1: Tp, y2: H - B, class: 'ch-grid' }); el('text', { x: x(g), y: H - B + 13, 'text-anchor': 'middle', class: 'ch-tk' }, g); }
    el('line', { x1: L, x2: L, y1: Tp, y2: H - B, class: 'ch-ax' });
    el('line', { x1: L, x2: W - R, y1: H - B, y2: H - B, class: 'ch-ax' });
    var defs = el('defs', {});
    defs.innerHTML = '<linearGradient id="cg" x1="0" x2="1"><stop offset="0" stop-color="#0e7c86"/><stop offset=".6" stop-color="#22a3a0"/><stop offset="1" stop-color="#f2a33a"/></linearGradient>' +
      '<linearGradient id="ca" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#22a3a0" stop-opacity=".25"/><stop offset="1" stop-color="#22a3a0" stop-opacity="0"/></linearGradient>';
    var area = el('path', { fill: 'url(#ca)', d: '' });
    var line = el('path', { fill: 'none', stroke: 'url(#cg)', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: '' });
    var mhL = el('line', { x1: L, x2: W - R, y1: y(mx), y2: y(mx), stroke: '#9fb3b6', 'stroke-dasharray': '3 4', opacity: 0 });
    var mhT = el('text', { x: W - R - 2, y: y(mx) - 5, 'text-anchor': 'end', class: 'ch-mark ch-mark-ink', opacity: 0 }, 'MH');
    var mlL = el('line', { x1: L, x2: W - R, y1: y(mn), y2: y(mn), stroke: '#9fb3b6', 'stroke-dasharray': '3 4', opacity: 0 });
    var mlT = el('text', { x: W - R - 2, y: y(mn) - 5, 'text-anchor': 'end', class: 'ch-mark ch-mark-ink', opacity: 0 }, 'ML');
    function marker(tm, label, color) {
      var v = torque(tm);
      return {
        t: tm,
        l: el('line', { x1: x(tm), x2: x(tm), y1: y(v), y2: H - B, stroke: color, 'stroke-dasharray': '3 3', opacity: 0 }),
        c: el('circle', { cx: x(tm), cy: y(v), r: 4, fill: '#fff', stroke: color, 'stroke-width': 2, opacity: 0 }),
        x: el('text', { x: x(tm) + 6, y: y(v) + 14, class: 'ch-mark', fill: color, opacity: 0 }, label)
      };
    }
    var mk = [marker(ts2, 'ts2', '#0e7c86'), marker(t90, 't90', '#d8861c')];
    var head = el('circle', { r: 5.5, fill: '#f2a33a', stroke: '#fff', 'stroke-width': 2 });
    var halo = el('circle', { r: 11, fill: '#f2a33a', opacity: .2 });
    var rT = $('#rT'), rS = $('#rS'), rP = $('#rP');

    function render(tc, alpha) {
      var d = '', a, n = 0;
      for (i = 0; i < pts.length && pts[i][0] <= tc; i++) { d += (i ? 'L' : 'M') + x(pts[i][0]).toFixed(1) + ' ' + y(pts[i][1]).toFixed(1); n = i; }
      var v = torque(tc);
      d += 'L' + x(tc).toFixed(1) + ' ' + y(v).toFixed(1);
      line.setAttribute('d', d);
      area.setAttribute('d', d + 'L' + x(tc).toFixed(1) + ' ' + y(0) + 'L' + x(0) + ' ' + y(0) + 'Z');
      line.setAttribute('opacity', alpha); area.setAttribute('opacity', alpha);
      head.setAttribute('cx', x(tc)); head.setAttribute('cy', y(v)); head.setAttribute('opacity', alpha);
      halo.setAttribute('cx', x(tc)); halo.setAttribute('cy', y(v)); halo.setAttribute('opacity', .2 * alpha);
      var minShown = tc > TI + .2 ? alpha : 0;
      mlL.setAttribute('opacity', minShown); mlT.setAttribute('opacity', minShown);
      var maxShown = tc > 10 ? alpha : 0;
      mhL.setAttribute('opacity', maxShown); mhT.setAttribute('opacity', maxShown);
      mk.forEach(function (m) { var o = tc >= m.t ? alpha : 0; m.l.setAttribute('opacity', o); m.c.setAttribute('opacity', o); m.x.setAttribute('opacity', o); });
      rT.textContent = fmt(tc, 2); rS.textContent = fmt(v, 2);
      rP.textContent = tc < ts2 ? T('indução', 'induction') : tc < t90 ? T('vulcanização', 'curing') : T('platô', 'plateau');
    }
    if (reduce) { render(TMAX, 1); return; }
    var DRAW = 5200, HOLD = 1800, FADE = 500, CYCLE = DRAW + HOLD + FADE, t0 = null, visible = true, raf = null;
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var e = (ts - t0) % CYCLE, tc, alpha = 1;
      if (e < DRAW) { var p = e / DRAW; tc = TMAX * (p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2) ; tc = TMAX * p * .35 + tc * .65; }
      else if (e < DRAW + HOLD) tc = TMAX;
      else { tc = TMAX; alpha = 1 - (e - DRAW - HOLD) / FADE; }
      render(Math.min(TMAX, tc), alpha);
      raf = visible ? requestAnimationFrame(frame) : null;
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(frame);
      }).observe(svg);
    }
    raf = requestAnimationFrame(frame);
  })();

  /* ---------- copy e-mail + toast ---------- */
  var toast = $('#toast'), toastT = null;
  function showToast(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('show'); }, 2200); }
  var cp = $('#copyMail');
  if (cp) cp.addEventListener('click', function () {
    var txt = cp.getAttribute('data-copy');
    function ok() { showToast(T('E-mail copiado', 'E-mail copied')); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(ok, fallback); else fallback();
    function fallback() { var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) {} document.body.removeChild(ta); }
  });


  /* ---------- bubbles in strip ---------- */
  (function () {
    var box = $('#bubbles'); if (!box) return;
    for (var i = 0; i < 16; i++) {
      var b = document.createElement('span'), s = 6 + Math.random() * 16;
      b.style.width = b.style.height = s + 'px';
      b.style.left = (Math.random() * 100) + '%';
      b.style.animationDuration = (5 + Math.random() * 6) + 's';
      b.style.animationDelay = (-Math.random() * 10) + 's';
      b.style.setProperty('--sw', ((Math.random() - .5) * 40) + 'px');
      box.appendChild(b);
    }
  })();

  /* ---------- molecular network in hero ---------- */
  (function () {
    var cv = $('#net'); if (!cv || !cv.getContext) return;
    var hero = cv.parentNode, ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = 0, H = 0, atoms = [], mouse = { x: -999, y: -999 }, run = true;
    var EL = [{ s: 'C', r: 4, c: [14, 124, 134] }, { s: 'C', r: 4, c: [14, 124, 134] }, { s: 'H', r: 2.6, c: [120, 150, 156] }, { s: 'O', r: 4.4, c: [229, 72, 77] }, { s: 'N', r: 4.2, c: [60, 110, 200] }, { s: 'S', r: 5, c: [242, 163, 58] }];
    function resize() {
      W = hero.clientWidth; H = hero.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(70, Math.max(26, Math.round(W * H / 16000)));
      while (atoms.length < n) {
        var e = EL[Math.floor(Math.random() * EL.length)];
        atoms.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, e: e });
      }
      atoms.length = n;
    }
    function dark() { return root.getAttribute('data-theme') === 'dark'; }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      var D = Math.min(130, W / 6), i, k, a, b, dx, dy, d;
      var lineCol = dark() ? '143,220,216' : '14,124,134';
      for (i = 0; i < atoms.length; i++) {
        a = atoms[i];
        dx = a.x - mouse.x; dy = a.y - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
        if (d < 110 && d > 0) { a.vx += dx / d * .06; a.vy += dy / d * .06; }
        a.vx *= .985; a.vy *= .985;
        var sp = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
        if (sp < .12) { a.vx += (Math.random() - .5) * .05; a.vy += (Math.random() - .5) * .05; }
        a.x += a.vx; a.y += a.vy;
        if (a.x < -10) a.x = W + 10; if (a.x > W + 10) a.x = -10;
        if (a.y < -10) a.y = H + 10; if (a.y > H + 10) a.y = -10;
      }
      for (i = 0; i < atoms.length; i++) for (k = i + 1; k < atoms.length; k++) {
        a = atoms[i]; b = atoms[k]; dx = a.x - b.x; dy = a.y - b.y; d = Math.sqrt(dx * dx + dy * dy);
        if (d < D) {
          var al = (1 - d / D) * (dark() ? .35 : .28);
          ctx.strokeStyle = 'rgba(' + lineCol + ',' + al + ')'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          if (d < D * .45 && (i + k) % 3 === 0) { // double bond
            var nx = -dy / d * 3, ny = dx / d * 3;
            ctx.beginPath(); ctx.moveTo(a.x + nx, a.y + ny); ctx.lineTo(b.x + nx, b.y + ny); ctx.stroke();
          }
        }
      }
      for (i = 0; i < atoms.length; i++) {
        a = atoms[i]; var c = a.e.c;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.e.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (dark() ? .7 : .45) + ')'; ctx.fill();
        if (a.e.r >= 4.4) { ctx.font = '600 8px "IBM Plex Mono",monospace'; ctx.fillStyle = dark() ? 'rgba(230,240,240,.6)' : 'rgba(13,40,48,.4)'; ctx.fillText(a.e.s, a.x + 6, a.y - 5); }
      }
      if (run) requestAnimationFrame(frame);
    }
    function pt(e) { var r = hero.getBoundingClientRect(), s = e.touches ? e.touches[0] : e; mouse.x = s.clientX - r.left; mouse.y = s.clientY - r.top; }
    hero.addEventListener('mousemove', pt);
    hero.addEventListener('touchstart', pt, { passive: true });
    hero.addEventListener('touchmove', pt, { passive: true });
    hero.addEventListener('mouseleave', function () { mouse.x = mouse.y = -999; });
    hero.addEventListener('touchend', function () { mouse.x = mouse.y = -999; });
    window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { var v = es[0].isIntersecting; if (v && !run) { run = true; requestAnimationFrame(frame); } else if (!v) run = false; }).observe(hero);
    resize(); requestAnimationFrame(frame);
  })();


  /* ---------- touch/tap feedback: ripple ---------- */
  function ripple(e) {
    var el = e.currentTarget, r = el.getBoundingClientRect(), p = e.touches ? e.touches[0] : e;
    var s = Math.max(r.width, r.height) * 1.2, d = document.createElement('span');
    d.className = 'rip'; d.style.width = d.style.height = s + 'px';
    d.style.left = (p.clientX - r.left - s / 2) + 'px'; d.style.top = (p.clientY - r.top - s / 2) + 'px';
    el.appendChild(d); setTimeout(function () { d.remove(); }, 700);
  }
  $$('.cc, .btn, .acc-h, .card, .cc-btn, .icon-btn, .drawer-nav a').forEach(function (el) {
    el.classList.add('has-rip');
    el.addEventListener('pointerdown', ripple);
  });

  /* ---------- staggered entrance for card groups (great on mobile) ---------- */
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        var kids = Array.prototype.slice.call(en.target.children);
        if (en.isIntersecting) kids.forEach(function (k, i) { k.style.transitionDelay = (i * 110) + 'ms'; k.classList.add('pop'); });
        else if (en.boundingClientRect.top > 0) kids.forEach(function (k) { k.style.transitionDelay = '0ms'; k.classList.remove('pop'); });
      });
    }, { threshold: 0.15 });
    $$('.stagger').forEach(function (g) { so.observe(g); });
  }

  /* ---------- init ---------- */
  var saved = null;
  try { saved = localStorage.getItem('mm-lang'); } catch (e) {}
  setLang(saved === 'en' ? 'en' : 'pt');
  onScroll();
})();
