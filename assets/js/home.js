// MARKETERS home: the roster turning in the hero, the roster rows, the pitch room (brief → promo → launch), on air, clients.
// Every promo on this page is made here from a real coin picture; when there are none yet, the page says so.
(function () {
  'use strict';
  const C = window.Core, X = window.Cross, L = window.Live;
  const { $, $$, esc } = C;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CAST = [
    { k: 'hype', name: 'Doug', role: 'the street hype', fmt: 'megaphone street promos', img: 1 },
    { k: 'keynote', name: 'Pip', role: 'the keynote', fmt: 'stage keynotes', img: 2 },
    { k: 'infomercial', name: 'Lola', role: 'the infomercial', fmt: 'late-night infomercials', img: 3 },
    { k: 'strategy', name: 'Otto', role: 'the strategist', fmt: 'whiteboard plans', img: 4 },
    { k: 'model', name: 'Bruno', role: 'the face', fmt: 'glamour photoshoots', img: 5 },
    { k: 'hotline', name: 'Kiki', role: 'the hotline', fmt: 'call-center hype', img: 6 },
  ];
  const pic = c => '/assets/img/m' + c.img + '.jpg';
  const byKey = k => CAST.find(c => c.k === k) || CAST[0];
  const st = { cast: 'hype', image: null, job: null, still: null, busy: false, born: null, open: null, board: null, sort: 'new', shown: 24, reel: {}, step: 1 };
  const status = (el, t, bad) => { el.textContent = t || ''; el.classList.toggle('bad', !!bad); };
  function heartBurst(box, n, cls) {
    if (calm || !box) return;
    for (let i = 0; i < n; i++) setTimeout(() => {
      const h = document.createElement('i'); h.style.setProperty('--x', (Math.random() * 70 - 35) + 'px'); h.style.setProperty('--r', (Math.random() * 40 - 20) + 'deg');
      h.style.background = ['var(--rd)', 'var(--rd)', '#fff', 'var(--cy)'][i % 4]; if (cls) h.className = cls;
      box.appendChild(h); setTimeout(() => h.remove(), 2700);
    }, i * 140);
  }

  // ---------- the hero: the roster as a turning coverflow, likes rising off the front card ----------
  (function flow() {
    const box = $('#flow');
    box.innerHTML = CAST.map((c, i) => `<div class="fc" data-i="${i}"><img src="${pic(c)}" alt="${esc(c.name)}, ${esc(c.role)}"${i > 2 ? ' loading="lazy"' : ''}><div class="tag"><b>${esc(c.name)}</b><span>${esc(c.role)}</span></div></div>`).join('') + '<div class="hearts" id="hh"></div>';
    const cards = $$('.fc', box); let at = 0, timer = null;
    function lay() {
      const w = innerWidth < 560 ? 150 : 230;
      cards.forEach((c, i) => {
        let d = i - at; const n = cards.length; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
        const a = Math.abs(d);
        c.style.transform = `translateX(${d * w}px) translateZ(${-a * 160}px) rotateY(${-d * 18}deg)`;
        c.style.zIndex = 10 - a; c.style.opacity = a > 2 ? 0 : 1; c.style.filter = a ? `brightness(${1 - a * .25})` : 'none';
        c.classList.toggle('c0', d === 0);
        const r = st.reel[CAST[i].k];
        if (d === 0 && r && !c.querySelector('video')) { const v = document.createElement('video'); v.src = r; v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true; v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover'; c.prepend(v); v.play().catch(() => {}); }
      });
      heartBurst($('#hh'), 5);
    }
    function next() { at = (at + 1) % cards.length; lay(); }
    cards.forEach(c => c.addEventListener('click', () => { at = Number(c.dataset.i); lay(); pickCast(CAST[at].k); clearInterval(timer); timer = setInterval(next, 3200); }));
    lay(); if (!calm) timer = setInterval(next, 3200);
    addEventListener('resize', lay);
    C.get('/api/film?reel=1').then(j => { if (j && j.ok) { (j.reel || []).forEach(r => { st.reel[r.cast] = r.url; }); lay(); } }).catch(() => {});
  })();

  // ---------- the roster rows: hover shows the marketer, click hires them ----------
  (function roster() {
    const rows = $('#rows'), peek = $('#peek'), pim = peek.querySelector('img');
    rows.innerHTML = CAST.map((c, i) => `<li class="row" data-k="${c.k}"><span class="no">0${i + 1}</span><span class="nm">${esc(c.name)}</span><span class="rl">${esc(c.role)}</span><span class="fm">${esc(c.fmt)}</span><img class="th" src="${pic(c)}" alt="" loading="lazy"><button type="button" class="btn sm line">hire</button></li>`).join('');
    rows.addEventListener('click', e => { const r = e.target.closest('.row'); if (!r) return; pickCast(r.dataset.k); document.getElementById('room').scrollIntoView({ behavior: calm ? 'auto' : 'smooth' }); });
    if (matchMedia('(hover: none)').matches) return;
    let x = 0, y = 0, px = 0, py = 0, on = false;
    rows.addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; const r = e.target.closest('.row'); if (r) { const c = byKey(r.dataset.k); if (!pim.src.endsWith(pic(c))) pim.src = pic(c); if (!on) { on = true; px = x; py = y; peek.classList.add('on'); } } });
    rows.addEventListener('mouseleave', () => { on = false; peek.classList.remove('on'); });
    (function loop() { px += (x - px) * .18; py += (y - py) * .18; peek.style.left = (px + 150) + 'px'; peek.style.top = py + 'px'; requestAnimationFrame(loop); })();
  })();

  // ---------- the pitch room ----------
  const castBox = $('#cast'), line = $('#line'), nm = $('#nm'), tk = $('#tk'), xh = $('#xh');
  const pitchBtn = $('#pitchBtn'), pitchStatus = $('#pitchStatus'), pvScr = $('#pvScr'), pvWho = $('#pvWho'), pvCap = $('#pvCap'), kit = $('#kit');
  const goBtn = $('#goBtn'), goStatus = $('#goStatus'), goProg = $('#goProg'), goRes = $('#goRes');
  castBox.innerHTML = CAST.map(c => `<button type="button" class="ca${c.k === st.cast ? ' on' : ''}" data-k="${c.k}" title="${esc(c.name + ', ' + c.role)}"><img src="${pic(c)}" alt="" loading="lazy"><b>${esc(c.name)}</b></button>`).join('');
  function pickCast(k) {
    st.cast = k; $$('.ca', castBox).forEach(b => b.classList.toggle('on', b.dataset.k === k)); $$('.row').forEach(r => r.classList.toggle('on', r.dataset.k === k));
    const c = byKey(k); pvWho.textContent = '@' + c.name.toLowerCase() + '.markets';
    if (!st.still && !st.image) pvScr.innerHTML = `<img src="${pic(c)}" alt="">`;
  }
  castBox.addEventListener('click', e => { const b = e.target.closest('.ca'); if (b) pickCast(b.dataset.k); });
  function stepTo(n) {
    st.step = Math.max(st.step, n);
    $$('#rail3 span').forEach(s => { const k = Number(s.dataset.s); s.classList.toggle('on', k === st.step); s.classList.toggle('done', k < st.step); });
    $$('#rail3 i').forEach((i, k) => i.classList.toggle('done', k + 1 < st.step));
  }
  // the coin's picture, squared to 768 in the browser
  const drop = $('#drop'), picIn = $('#pic'), picImg = $('#picImg'), picNote = $('#picNote');
  picIn.addEventListener('change', () => {
    const f = picIn.files && picIn.files[0]; if (!f) return;
    if (f.size > 12e6) { picNote.textContent = 'too big'; return; }
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => {
      const s = Math.min(im.width, im.height), c = document.createElement('canvas'); c.width = c.height = 768;
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 768, 768); x.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 768, 768);
      st.image = c.toDataURL('image/jpeg', .9); picImg.src = st.image; drop.classList.add('on'); picNote.textContent = 'tap to change'; URL.revokeObjectURL(url); refreshGo();
    };
    im.onerror = () => { picNote.textContent = 'didn’t open'; URL.revokeObjectURL(url); };
    im.src = url;
  });
  let tickerTouched = false;
  nm.addEventListener('input', () => { if (!tickerTouched) tk.value = nm.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10); refreshGo(); });
  tk.addEventListener('input', () => { tickerTouched = !!tk.value; tk.value = tk.value.replace(/[^A-Za-z0-9$]/g, '').toUpperCase(); refreshGo(); });
  line.addEventListener('input', refreshGo);

  async function pollJob(job, onDone) {
    const t0 = Date.now();
    while (Date.now() - t0 < 6 * 60000) {
      await new Promise(r => setTimeout(r, 4000));
      let j = null; try { j = await C.get('/api/film?job=' + job); } catch {}
      const el = $('#filmT'); if (el) el.textContent = 'filming · ' + Math.round((Date.now() - t0) / 1000) + 's';
      if (j && j.ok && j.status !== 'pending') return onDone(j);
    }
    onDone(null);
  }
  function showStill(url, cap) {
    st.still = url;
    pvScr.innerHTML = `<img src="${url}" alt="">`;
    pvCap.textContent = cap || ''; $('#kCap').textContent = cap || ''; $('#dlStill').href = url; $('#dlVid').hidden = true; kit.hidden = false;
    heartBurst($('#likes'), 8);
  }
  pitchBtn.addEventListener('click', async () => {
    if (st.busy) return;
    if (!st.image) return status(pitchStatus, 'Add the coin’s picture first.', true);
    if (line.value.trim().length < 8) return status(pitchStatus, 'Write the one-line pitch first.', true);
    st.busy = true; pitchBtn.disabled = true; pitchBtn.textContent = 'pitching…'; stepTo(2);
    const c = byKey(st.cast);
    status(pitchStatus, `${c.name} is making a ${c.fmt.replace(/s$/, '')} starring your coin. About 30 seconds.`);
    pvScr.insertAdjacentHTML('beforeend', `<div class="film" id="filmOv"><span class="rec"></span>on set<small>${esc(c.name)} is shooting your promo</small></div>`);
    try {
      const r = await C.post('/api/pitch', { draft: { name: nm.value, symbol: tk.value, line: line.value, cast: st.cast }, image: st.image });
      if (!r.ok) { status(pitchStatus, r.error || 'The promo didn’t come out. Try again.', true); const o = $('#filmOv'); if (o) o.remove(); return; }
      showStill(r.still, r.caption); st.job = r.job;
      if (r.filming) {
        status(pitchStatus, 'The promo photo is ready. Now filming the video (about a minute).');
        pvScr.insertAdjacentHTML('beforeend', `<div class="film" id="filmOv"><span class="rec"></span><span id="filmT">filming</span><small>5 seconds · vertical</small></div>`);
        pollJob(r.job, j => {
          const o = $('#filmOv'); if (o) o.remove();
          if (j && j.status === 'done' && j.url) { pvScr.innerHTML = `<video src="${j.url}" muted playsinline autoplay loop></video>`; const v = pvScr.querySelector('video'); v.play().catch(() => {}); const d = $('#dlVid'); d.href = j.url; d.hidden = false; status(pitchStatus, 'Your promo is filmed. Download it, or launch and it keeps going.'); heartBurst($('#likes'), 10); }
          else status(pitchStatus, 'The video didn’t come out this time; the promo photo is yours.');
        });
      } else status(pitchStatus, r.note ? 'The promo photo is ready. ' + r.note : 'The promo photo is ready.');
      stepTo(3);
    } catch { status(pitchStatus, 'The promo didn’t come out. Try again.', true); const o = $('#filmOv'); if (o) o.remove(); }
    finally { st.busy = false; pitchBtn.disabled = false; pitchBtn.textContent = 'make another promo'; }
  });
  $('#copyCap').addEventListener('click', () => { const t = $('#kCap').textContent; if (t) C.copy(t); });

  // ---------- the split and the launch ----------
  const handle = () => xh.value.trim().replace(/^@/, '');
  const clip32 = s => { s = s.trim(); while (new TextEncoder().encode(s).length > 32) s = s.slice(0, -1); return s; };
  function splitShow() {
    const me = C.S.me || '\u0000you', H = '\u0000house';
    $('#split').innerHTML = X.sharesOf(me, H).map(r => `<div class="${r.address === me ? 'me' : ''}"><dt>${r.address === me ? 'you' : 'the house · pays the marketers'}</dt><dd>${r.bps / 100}%</dd></div>`).join('');
  }
  function refreshGo() {
    if (st.busy) return;
    if (st.open === false) { goBtn.disabled = true; goBtn.textContent = 'Launching opens soon'; return; }
    if (st.born) { goBtn.disabled = true; goBtn.textContent = 'launched ✓'; return; }
    goBtn.disabled = false; goBtn.textContent = C.S.me ? 'launch it' : 'Connect wallet to launch';
  }
  const buy = X.buyBox($('#buyBox'));
  C.onWallet(() => { splitShow(); refreshGo(); });
  async function firstPromo(mint) {
    const box = $('#firstPromo'); if (!box) return;
    box.innerHTML = '<p class="status">its marketer is making the first promo…</p>';
    let r = null; try { r = await C.post('/api/pitch', { mint }); } catch {}
    if (!r || !r.ok || !r.job) { box.innerHTML = `<p class="status">${esc((r && r.error) || 'Its first promo comes with the next cycle.')}</p>`; return; }
    const show = (src, vid) => { box.innerHTML = `<div class="ph" style="max-width:200px">${vid ? `<video src="${src}" muted playsinline autoplay loop></video>` : `<img src="${src}" alt="">`}</div>`; };
    if (r.still) show(r.still);
    if (r.filming) pollJob(r.job, j => { if (j && j.status === 'done' && j.url) show(j.url, true); });
  }
  goBtn.addEventListener('click', async () => {
    if (st.busy || st.born || st.open === false) return;
    if (!C.S.me) { await C.connect(); refreshGo(); return; }
    const name = clip32(nm.value), symbol = tk.value.trim().replace(/^\$/, '').toUpperCase();
    if (!st.image) return status(goStatus, 'Add the coin’s picture (up top).', true);
    if (!name) return status(goStatus, 'Give it a name.', true);
    if (!/^[A-Z0-9]{1,10}$/.test(symbol)) return status(goStatus, 'The ticker is 1–10 letters or numbers.', true);
    if (line.value.trim().length < 8) return status(goStatus, 'Write the one-line pitch.', true);
    if (handle() && !/^[A-Za-z0-9_]{1,15}$/.test(handle())) return status(goStatus, 'That X handle doesn’t look right.', true);
    if (buy.over()) return status(goStatus, 'Up to 5 SOL in the first buy.', true);
    st.busy = true; goBtn.disabled = true; goBtn.textContent = 'launching…'; status(goStatus, ''); goRes.hidden = true; stepTo(3);
    try {
      const r = await X.run({ name, symbol, cast: st.cast, line: line.value.trim(), x: handle(), image: st.image, devBuy: buy.lamports(), onStep: i => X.steps(goProg, i) });
      X.steps(goProg, 99, true);
      const live = r.settle && r.settle.live; st.born = r.mint; const c = byKey(st.cast);
      goRes.hidden = false;
      goRes.innerHTML = `<p class="ok">$${esc(symbol)} is ${live ? 'live. ' + esc(c.name) + ' is on the campaign.' : 'on pump.fun.'}</p>${r.buyNote ? `<p class="status">${esc(r.buyNote)}</p>` : ''}<div id="firstPromo"></div><div class="acts"><a class="btn" href="/c/${r.mint}">its page →</a><a class="btn line" href="https://pump.fun/coin/${r.mint}" target="_blank" rel="noopener">pump.fun ↗</a><a class="btn line" href="${C.solscan('tx', r.sig)}" target="_blank" rel="noopener">solscan ↗</a></div>`;
      C.toast('$' + symbol + ' is live.'); loadBoard(r.mint);
      if (live) firstPromo(r.mint);
    } catch (e) {
      status(goStatus, C.human(e), true);
      if (e && e.mint) { goRes.hidden = false; goRes.innerHTML = `<div class="acts"><a class="btn" href="/c/${e.mint}">finish it on its page →</a></div>`; }
    } finally { st.busy = false; refreshGo(); }
  });

  // ---------- on air + clients ----------
  const seen = new Set();
  function renderFeed() {
    const vs = (st.board && st.board.posts) || [], el = $('#feed');
    if (!vs.length) { el.innerHTML = `<div class="none"><b>nothing on air yet</b>The first client’s promo airs here the minute it launches.</div>`; return; }
    let n = 0;
    el.innerHTML = vs.map(v => { const nw = !seen.has(v.id); seen.add(v.id);
      const media = v.status === 'done' ? `<video src="/api/film?v=${v.id}" muted playsinline loop preload="metadata" poster="/api/film?s=${v.id}"></video>` : `<img src="/api/film?s=${v.id}" alt="" loading="lazy">`;
      return `<article class="pc${nw ? ' new' : ''}" style="--i:${nw ? n++ : 0}"><div class="ph">${media}</div><div class="meta"><a href="/c/${v.mint}">$${esc(v.symbol)}</a><p>${esc(v.caption || '')}</p></div></article>`; }).join('');
    if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => es.forEach(en => { const v = en.target; if (en.isIntersecting && !calm) v.play().catch(() => {}); else v.pause(); }), { threshold: .5 }); $$('#feed video').forEach(v => io.observe(v)); }
  }
  function sorted() {
    const ks = ((st.board && st.board.infl) || []).slice();
    if (st.sort === 'heavy') ks.sort((x, y) => (y.mcap_sol || 0) - (x.mcap_sol || 0) || y.slot - x.slot); else ks.sort((x, y) => y.slot - x.slot);
    return ks;
  }
  function renderCoins(hit) {
    const ks = sorted(), el = $('#nursery'), sol = st.board && st.board.solUsd;
    if (!ks.length) { el.innerHTML = `<div class="none"><b>no clients yet</b>The first coin to hire a marketer is yours.</div>`; $('#moreBtn').hidden = true; return; }
    el.innerHTML = ks.slice(0, st.shown).map(k => {
      const mc = k.mcap_sol != null ? (sol ? C.usd(k.mcap_sol * sol) : k.mcap_sol.toFixed(1) + ' SOL') : '—'; const c = byKey(k.niche);
      return `<a class="cn${k.mint === hit ? ' hit' : ''}" data-m="${k.mint}" href="/c/${k.mint}"><img src="/i/${k.mint}" alt="" loading="lazy"><span><b>$${esc(k.symbol)}</b><small>${esc(k.name)} · marketed by ${esc(c.name)}</small></span><span class="v m">${k.vids || 0} promos</span><span class="v">${mc}</span></a>`;
    }).join('');
    $('#moreBtn').hidden = ks.length <= st.shown;
  }
  $('#moreBtn').addEventListener('click', () => { st.shown += 24; renderCoins(); });
  $('#sorts').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.sort = b.dataset.s; $$('#sorts button').forEach(x => x.classList.toggle('on', x === b)); renderCoins(); });
  if (L) { L.births(false); L.on('trade', t => { const c = document.querySelector(`.cn[data-m="${t.mint}"]`); if (!c) return; c.classList.remove('hit'); void c.offsetWidth; c.classList.add('hit'); }); }
  async function loadBoard(hit) {
    let j = null; try { j = await C.get('/api/board'); } catch {}
    if (!j || !j.ok) { if (!st.board) { $('#nursery').innerHTML = `<div class="none"><b>the records didn’t answer</b><button class="btn line sm" type="button" id="retryBoard">try again ↻</button></div>`; const r = $('#retryBoard'); if (r) r.onclick = () => loadBoard(); renderFeed(); } return; }
    st.board = j; if (j.open != null) st.open = j.open; refreshGo(); renderCoins(hit); renderFeed();
    if (L) L.watch((j.infl || []).slice(0, 200).map(k => k.mint));
  }

  // ---------- reveals + nav ----------
  (function reveal() {
    if (calm || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => es.forEach(en => { if (!en.isIntersecting) return; en.target.classList.add('seen'); io.unobserve(en.target); }), { rootMargin: '0px 0px -8% 0px' });
    $$('.big, .row, .card, .ad, .faq details, .rail3').forEach((el, i) => { el.classList.add('rv'); el.style.setProperty('--dl', (i % 6) * .06 + 's'); io.observe(el); });
    const links = $$('.nav a'); const nio = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) links.forEach(a => a.classList.toggle('on', a.hash === '#' + en.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
    ['roster', 'room', 'onair', 'clients', 'faq'].forEach(id => nio.observe(document.getElementById(id)));
  })();

  pickCast(st.cast); splitShow(); refreshGo(); loadBoard();
  setInterval(() => { if (!document.hidden && !st.busy) loadBoard(); }, 20000);
  if (L) L.start();
})();
