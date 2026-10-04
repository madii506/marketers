// MARKETERS home: page one (the claim, windows scrolling beside it), the roster cards, the pitch room (a camera: picture,
// pitch, pick a marketer, record), the launch, on air, clients, questions.
// Every promo here is made from a real coin picture; when there are none yet, the page says so.
(function () {
  'use strict';
  const C = window.Core, X = window.Cross, L = window.Live;
  const { $, $$, esc } = C;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CAST = [
    { k: 'hype', name: 'Doug', role: 'the street hype', what: 'Megaphone promos on a busy street, your coin held up for the whole city.', img: 1 },
    { k: 'keynote', name: 'Pip', role: 'the keynote', what: 'A stage, a spotlight, your coin on the giant screen.', img: 2 },
    { k: 'infomercial', name: 'Lola', role: 'the infomercial', what: 'Late-night TV. Your coin as the product nobody can live without.', img: 3 },
    { k: 'strategy', name: 'Otto', role: 'the strategist', what: 'A whiteboard of sticky notes with your coin pinned in the middle.', img: 4 },
    { k: 'model', name: 'Bruno', role: 'the face', what: 'A glamour photoshoot next to a statue of your coin.', img: 5 },
    { k: 'hotline', name: 'Kiki', role: 'the hotline', what: 'A call center that only talks about your coin.', img: 6 },
  ];
  const pic = c => '/assets/img/m' + c.img + '.jpg';
  const byKey = k => CAST.find(c => c.k === k) || CAST[0];
  const st = { cast: 'hype', image: null, job: null, still: null, vid: null, cap: '', busy: false, born: null, open: null, board: null, sort: 'new', reel: {} };
  const status = (el, t, bad) => { el.textContent = t || ''; el.classList.toggle('bad', !!bad); };
  function floatHearts(box, n) {
    if (calm || !box) return;
    for (let i = 0; i < n; i++) setTimeout(() => {
      const h = document.createElement('i'); h.style.setProperty('--x', (Math.random() * 80 - 50) + 'px'); h.style.setProperty('--r', (Math.random() * 40 - 20) + 'deg');
      h.style.background = ['var(--rd)', 'var(--rd)', '#fff', 'var(--cy)'][i % 4]; box.appendChild(h); setTimeout(() => h.remove(), 2500);
    }, i * 120);
  }

  // ---------- page one: the wordmark letter by letter, windows scrolling in three columns ----------
  $('#mark').innerHTML = [...'MARKETERS'].map((ch, i) => `<span class="gl" data-t="${ch}" style="--i:${i}">${ch}</span>`).join('');
  if (!calm) setInterval(() => { const m = $('#mark'); if (document.hidden || !m) return; m.classList.add('glitch'); setTimeout(() => m.classList.remove('glitch'), 340); }, 3200);
  (function cols() {
    const order = [[0, 3, 1, 4, 2, 5], [4, 1, 5, 2, 0, 3], [2, 5, 0, 3, 1, 4]];
    const win = (n, j) => { const c = CAST[n]; return `<div class="win${j % 3 === 1 ? ' c' : ''}" data-hire="${c.k}"><img src="${pic(c)}" alt="" loading="${j < 3 ? 'eager' : 'lazy'}"><i class="hh"></i><div class="wl"><b>@${c.name.toLowerCase()}.markets</b>${esc(c.role)}</div><div class="pb"><i style="--dl:-${(j * 1.1).toFixed(1)}s"></i></div></div>`; };
    $('#cols').innerHTML = order.map(o => `<div class="col"><div class="track">${o.map(win).join('')}${o.map(win).join('')}</div></div>`).join('');
  })();

  // ---------- the roster cards ----------
  $('#cards').innerHTML = CAST.map(c => `<article class="card" data-k="${c.k}"><img src="${pic(c)}" alt="${esc(c.name)}, ${esc(c.role)}" loading="lazy"><div class="ct"><b>${esc(c.name)}</b><span>${esc(c.role)}</span><p>${esc(c.what)}</p><button class="btn" type="button" data-hire="${c.k}">hire ${esc(c.name)}</button></div></article>`).join('');
  document.addEventListener('click', e => {
    const h = e.target.closest('[data-hire]'); if (!h) return;
    pickCast(h.dataset.hire); document.getElementById('room').scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });
  });

  // ---------- the pitch room ----------
  const tray = $('#tray'), drop = $('#drop'), picIn = $('#pic'), picNote = $('#picNote'), nm = $('#nm'), tk = $('#tk'), line = $('#line');
  const pitchBtn = $('#pitchBtn'), pitchStatus = $('#pitchStatus'), camMedia = $('#camMedia'), recDot = $('#recDot'), camTitle = $('#camTitle');
  tray.innerHTML = CAST.map(c => `<button type="button" data-k="${c.k}" title="${esc(c.name + ', ' + c.role)}" class="${c.k === st.cast ? 'on' : ''}"><img src="${pic(c)}" alt="${esc(c.name)}"></button>`).join('');
  function pickCast(k) { st.cast = k; $$('#tray button').forEach(b => b.classList.toggle('on', b.dataset.k === k)); $$('.card').forEach(c => c.classList.toggle('on', c.dataset.k === k)); const c = byKey(k); camTitle.textContent = c.name + ' · ' + c.role; checkSteps(); }
  tray.addEventListener('click', e => { const b = e.target.closest('button'); if (b) pickCast(b.dataset.k); });
  function checkSteps() {
    $('#h1').classList.toggle('ok', !!st.image);
    $('#h2').classList.toggle('ok', !!(nm.value.trim() && tk.value.trim() && line.value.trim().length >= 8));
    $('#h3').classList.toggle('ok', !!st.still);
    $('#h4').classList.toggle('ok', !!st.born);
    $('#dSym').textContent = tk.value.trim() ? '$' + tk.value.trim().replace(/^\$/, '') : 'your coin';
  }
  picIn.addEventListener('change', () => {
    const f = picIn.files && picIn.files[0]; if (!f) return;
    if (f.size > 12e6) { picNote.textContent = 'too big'; return; }
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => {
      const s = Math.min(im.width, im.height), c = document.createElement('canvas'); c.width = c.height = 768;
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 768, 768); x.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 768, 768);
      st.image = c.toDataURL('image/jpeg', .9); URL.revokeObjectURL(url);
      drop.classList.add('has'); let p = drop.querySelector('img.pv'); if (!p) { p = document.createElement('img'); p.className = 'pv'; drop.prepend(p); } p.src = st.image;
      st.still = null; st.vid = null; checkSteps(); refreshGo();
    };
    im.onerror = () => { picNote.textContent = 'didn’t open'; URL.revokeObjectURL(url); };
    im.src = url;
  });
  let tickerTouched = false;
  nm.addEventListener('input', () => { if (!tickerTouched) tk.value = nm.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10); checkSteps(); refreshGo(); });
  tk.addEventListener('input', () => { tickerTouched = !!tk.value; tk.value = tk.value.replace(/[^A-Za-z0-9$]/g, '').toUpperCase(); checkSteps(); refreshGo(); });
  line.addEventListener('input', () => { checkSteps(); refreshGo(); });
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
  function showPromo(src, vid) {
    camMedia.querySelectorAll('.promo, .film').forEach(n => n.remove());
    const el = document.createElement(vid ? 'video' : 'img'); el.className = 'promo x-in'; el.src = src;
    if (vid) { el.muted = true; el.loop = true; el.playsInline = true; el.autoplay = true; } el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;pointer-events:none';
    camMedia.appendChild(el); if (vid) el.play().catch(() => {});
    floatHearts($('#camHearts'), 8);
  }
  function downloads() {
    const d = $('#dlBtn'); d.href = st.vid || st.still || '#'; d.setAttribute('download', st.vid ? 'promo.mp4' : 'promo.jpg'); d.setAttribute('aria-disabled', st.still ? 'false' : 'true'); d.textContent = st.vid ? 'video' : 'save';
    $('#copyCap').disabled = !st.cap;
  }
  pitchBtn.addEventListener('click', async () => {
    if (st.busy) return;
    if (!st.image) return status(pitchStatus, 'Add your coin’s picture first: tap the middle.', true);
    if (line.value.trim().length < 8) return status(pitchStatus, 'Write the pitch first.', true);
    st.busy = true; pitchBtn.classList.add('busy'); recDot.classList.add('on');
    const c = byKey(st.cast);
    status(pitchStatus, `${c.name} is shooting your promo… about 30 seconds`);
    camMedia.insertAdjacentHTML('beforeend', `<div class="film"><span>on set</span><small>${esc(c.name)} is shooting</small></div>`);
    try {
      const r = await C.post('/api/pitch', { draft: { name: nm.value, symbol: tk.value, line: line.value, cast: st.cast }, image: st.image });
      if (!r.ok) { status(pitchStatus, r.error || 'The promo didn’t come out. Try again.', true); camMedia.querySelectorAll('.film').forEach(n => n.remove()); return; }
      st.still = r.still; st.cap = r.caption || ''; st.vid = null; st.job = r.job;
      showPromo(r.still); checkSteps(); downloads();
      if (r.filming) {
        status(pitchStatus, 'Promo photo ready. Filming the video…');
        camMedia.insertAdjacentHTML('beforeend', `<div class="film"><span id="filmT">filming</span><small>5 seconds · vertical</small></div>`);
        pollJob(r.job, j => {
          camMedia.querySelectorAll('.film').forEach(n => n.remove());
          if (j && j.status === 'done' && j.url) { st.vid = j.url; showPromo(j.url, true); downloads(); status(pitchStatus, 'Filmed. Launch it and it keeps making promos.'); }
          else status(pitchStatus, 'The video didn’t come out this time; the promo photo is yours.');
        });
      } else status(pitchStatus, r.note ? 'Promo photo ready. ' + r.note : 'Promo photo ready.');
    } catch { status(pitchStatus, 'The promo didn’t come out. Try again.', true); camMedia.querySelectorAll('.film').forEach(n => n.remove()); }
    finally { st.busy = false; pitchBtn.classList.remove('busy'); recDot.classList.remove('on'); }
  });
  $('#copyCap').addEventListener('click', () => { if (st.cap) C.copy(st.cap); });

  // ---------- the launch ----------
  const xh = $('#xh'), goBtn = $('#goBtn'), goStatus = $('#goStatus'), goProg = $('#goProg'), goRes = $('#goRes');
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
    const show = (src, vid) => { box.innerHTML = `<div style="max-width:180px;aspect-ratio:9/16;border-radius:14px;overflow:hidden">${vid ? `<video src="${src}" muted playsinline autoplay loop style="width:100%;height:100%;object-fit:cover"></video>` : `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover">`}</div>`; };
    if (r.still) show(r.still);
    if (r.filming) pollJob(r.job, j => { if (j && j.status === 'done' && j.url) show(j.url, true); });
  }
  goBtn.addEventListener('click', async () => {
    if (st.busy || st.born || st.open === false) return;
    if (!C.S.me) { await C.connect(); refreshGo(); return; }
    const name = clip32(nm.value), symbol = tk.value.trim().replace(/^\$/, '').toUpperCase();
    if (!st.image) return status(goStatus, 'Add your coin’s picture in the pitch room.', true);
    if (!name) return status(goStatus, 'Give it a name in the pitch room.', true);
    if (!/^[A-Z0-9]{1,10}$/.test(symbol)) return status(goStatus, 'The ticker is 1–10 letters or numbers.', true);
    if (line.value.trim().length < 8) return status(goStatus, 'Write the pitch in the pitch room.', true);
    if (handle() && !/^[A-Za-z0-9_]{1,15}$/.test(handle())) return status(goStatus, 'That X handle doesn’t look right.', true);
    if (buy.over()) return status(goStatus, 'Up to 5 SOL in the first buy.', true);
    st.busy = true; goBtn.disabled = true; goBtn.textContent = 'launching…'; status(goStatus, ''); goRes.hidden = true;
    try {
      const r = await X.run({ name, symbol, cast: st.cast, line: line.value.trim(), x: handle(), image: st.image, devBuy: buy.lamports(), onStep: i => X.steps(goProg, i) });
      X.steps(goProg, 99, true);
      const live = r.settle && r.settle.live; st.born = r.mint; checkSteps(); const c = byKey(st.cast);
      goRes.hidden = false;
      goRes.innerHTML = `<p class="ok">$${esc(symbol)} is ${live ? 'live. ' + esc(c.name) + ' is on it.' : 'on pump.fun.'}</p>${r.buyNote ? `<p class="status">${esc(r.buyNote)}</p>` : ''}<div id="firstPromo"></div><div class="acts"><a class="btn" href="/c/${r.mint}">its page →</a><a class="btn line" href="https://pump.fun/coin/${r.mint}" target="_blank" rel="noopener">pump.fun ↗</a><a class="btn line" href="${C.solscan('tx', r.sig)}" target="_blank" rel="noopener">solscan ↗</a></div>`;
      C.toast('$' + symbol + ' is live.'); loadBoard(r.mint);
      if (live) firstPromo(r.mint);
    } catch (e) {
      status(goStatus, C.human(e), true);
      if (e && e.mint) { goRes.hidden = false; goRes.innerHTML = `<div class="acts"><a class="btn" href="/c/${e.mint}">finish it on its page →</a></div>`; }
    } finally { st.busy = false; refreshGo(); }
  });

  // ---------- on air + clients ----------
  const seen = new Set();
  function renderAir() {
    const vs = (st.board && st.board.posts) || [], el = $('#feed');
    if (!vs.length) { el.innerHTML = `<div class="none"><b>nothing on air yet</b>The first client’s promo airs here the minute it launches.</div>`; return; }
    let n = 0;
    el.innerHTML = vs.map(v => { const nw = !seen.has(v.id); seen.add(v.id);
      const media = v.status === 'done' ? `<video src="/api/film?v=${v.id}" muted playsinline loop autoplay preload="metadata" poster="/api/film?s=${v.id}"></video>` : `<img src="/api/film?s=${v.id}" alt="" loading="lazy">`;
      return `<a class="tile${nw ? ' new' : ''}" style="--i:${nw ? n++ : 0}" href="/c/${v.mint}">${media}<b>$${esc(v.symbol)}</b></a>`; }).join('');
  }
  function renderClients(hit) {
    const ks = ((st.board && st.board.infl) || []).slice(), el = $('#clientList'), sol = st.board && st.board.solUsd;
    if (st.sort === 'heavy') ks.sort((x, y) => (y.mcap_sol || 0) - (x.mcap_sol || 0) || y.slot - x.slot); else ks.sort((x, y) => y.slot - x.slot);
    if (!ks.length) { el.innerHTML = `<div class="none"><b>no clients yet</b>The first coin to hire a marketer is yours.</div>`; return; }
    el.innerHTML = ks.slice(0, 200).map(k => {
      const mc = k.mcap_sol != null ? (sol ? C.usd(k.mcap_sol * sol) : k.mcap_sol.toFixed(1) + ' SOL') : '—'; const c = byKey(k.niche);
      return `<a class="cn${k.mint === hit ? ' hit' : ''}" data-m="${k.mint}" href="/c/${k.mint}"><img src="/i/${k.mint}" alt="" loading="lazy"><span><b>$${esc(k.symbol)}</b><small>${esc(k.name)} · ${esc(c.name)} · ${k.vids || 0} promos</small></span><span class="v">${mc}</span></a>`;
    }).join('');
  }
  $('#sorts').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.sort = b.dataset.s; $$('#sorts button').forEach(x => x.classList.toggle('on', x === b)); renderClients(); });
  if (L) { L.births(false); L.on('trade', t => { const c = document.querySelector(`.cn[data-m="${t.mint}"]`); if (!c) return; c.classList.remove('hit'); void c.offsetWidth; c.classList.add('hit'); }); }
  async function loadBoard(hit) {
    let j = null; try { j = await C.get('/api/board'); } catch {}
    if (!j || !j.ok) { if (!st.board) { $('#clientList').innerHTML = `<div class="none"><b>the records didn’t answer</b><button class="btn line sm" type="button" id="retryBoard">try again ↻</button></div>`; const r = $('#retryBoard'); if (r) r.onclick = () => loadBoard(); renderAir(); } return; }
    st.board = j; if (j.open != null) st.open = j.open; refreshGo(); renderClients(hit); renderAir();
    if (L) L.watch((j.infl || []).slice(0, 200).map(k => k.mint));
  }
  C.get('/api/film?reel=1').then(j => { if (j && j.ok) (j.reel || []).forEach(r => { st.reel[r.cast] = r.url; }); }).catch(() => {});

  // ---------- reveals + nav ----------
  (function reveal() {
    if (calm || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => es.forEach(en => { if (!en.isIntersecting) return; en.target.classList.add('seen'); io.unobserve(en.target); }), { rootMargin: '0px 0px -8% 0px' });
    $$('.big, .card, .room > *, .comments li').forEach((el, i) => { el.classList.add('rv'); el.style.setProperty('--dl', (i % 6) * .07 + 's'); io.observe(el); });
    const links = $$('.nav a'); const nio = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) links.forEach(a => a.classList.toggle('on', a.hash === '#' + en.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
    ['roster', 'room', 'air', 'clients', 'faq'].forEach(id => nio.observe(document.getElementById(id)));
  })();

  pickCast(st.cast); splitShow(); refreshGo(); loadBoard(); checkSteps();
  setInterval(() => { if (!document.hidden && !st.busy) loadBoard(); }, 20000);
  if (L) L.start();
})();
