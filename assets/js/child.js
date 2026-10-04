// MARKETERS: one coin's page. Its marketer and its promos (download, copy the caption),
// its numbers (read by the cycle from the chain), the split locked into it. A token that landed on pump.fun without its
// split can be finished here by whoever launched it.
(function () {
  'use strict';
  const C = window.Core, X = window.Cross, L = window.Live, $ = C.$, esc = C.esc;
  const mint = (location.pathname.match(/\/c\/([1-9A-HJ-NP-Za-km-z]{32,44})/) || [])[1] || new URLSearchParams(location.search).get('mint');
  const STATE = { awake: 'on the campaign', rot: 'slowing down', dead: 'off the campaign', ascended: 'graduated' };
  const TR = { hype: 'Doug · street hype', keynote: 'Pip · keynote', infomercial: 'Lola · infomercial', strategy: 'Otto · strategy', model: 'Bruno · photoshoot', hotline: 'Kiki · hotline' };
  const IMG = { hype: 1, keynote: 2, infomercial: 3, strategy: 4, model: 5, hotline: 6 };
  const when = t => t ? C.ago(new Date(t).getTime()) : '—';
  let data = null, solUsd = null;
  function lost(text) { $('#cw').innerHTML = `<div class="none"><b>${esc(text)}</b><a class="btn" href="/">back to MARKETERS</a></div>`; }
  async function load() {
    if (!mint) return lost('No coin lives at that address.');
    let j; try { j = await C.get('/api/kid?mint=' + mint); } catch { j = { ok: false, error: 'MARKETERS didn’t answer. Try again.' }; }
    if (!j.ok) return lost(j.missing ? 'No coin lives at that address.' : j.error);
    data = j; render();
  }
  function render() {
    const k = data.infl, pending = k.status === 'pending';
    document.title = '$' + k.symbol + ' · MARKETERS';
    $('#cName').textContent = k.name; $('#cTick').textContent = '$' + k.symbol;
    $('#cState').textContent = (pending ? ['not launched yet'] : [STATE[k.state] || k.state, (k.vids || 0) + ' promo' + (k.vids === 1 ? '' : 's'), 'marketed by ' + (TR[k.niche] || TR.hype), 'live ' + when(k.born_at)]).join(' · ');
    $('#bio').textContent = k.voice;
    const ps = data.posts || [], vd = ps.find(v => v.status === 'done'), sl = ps.find(v => v.status !== 'pending' || true);
    const scr = $('#pvScr');
    if (vd) { if (!scr.querySelector('video')) scr.innerHTML = `<video src="/api/film?v=${vd.id}" muted playsinline autoplay loop></video>`; $('#pvCap').textContent = vd.caption || ''; }
    else if (sl) { if (!scr.querySelector('img[data-s]')) scr.innerHTML = `<img data-s="1" src="/api/film?s=${sl.id}" alt="">`; $('#pvCap').textContent = sl.caption || ''; }
    else if (!scr.querySelector('img')) scr.innerHTML = `<img src="/i/${mint}" alt="">`;
    $('#pvWho').textContent = '@' + (TR[k.niche] || TR.hype).split(' ')[0].toLowerCase() + '.markets';
    const acts = [];
    if (!pending) acts.push(`<a class="btn" href="https://pump.fun/coin/${mint}" target="_blank" rel="noopener">buy on pump.fun ↗</a>`, `<button class="btn line" type="button" id="feedBtn">pay out its fees</button>`);
    else acts.push(`<button class="btn" type="button" id="finishBtn">finish it: lock its split</button>`);
    if (k.xhandle) acts.push(`<a class="btn line" href="https://x.com/${esc(k.xhandle)}" target="_blank" rel="noopener">@${esc(k.xhandle)} ↗</a>`);
    acts.push(`<button class="btn line" type="button" data-copy="${mint}">copy CA</button>`);
    $('#cActs').innerHTML = acts.join('');
    if ($('#feedBtn')) $('#feedBtn').onclick = feed;
    if ($('#finishBtn')) $('#finishBtn').onclick = finish;
    const all = data.posts || [];
    $('#vids').innerHTML = all.length ? all.map(v => `<article class="pc"><div class="ph">${v.status === 'done' ? `<video src="/api/film?v=${v.id}" muted playsinline loop preload="metadata" poster="/api/film?s=${v.id}"></video>` : `<img src="/api/film?s=${v.id}" alt="" loading="lazy">`}${v.status === 'pending' ? '<div class="film"><span class="rec"></span>filming</div>' : ''}</div><div class="meta"><a href="${v.status === 'done' ? '/api/film?v=' + v.id : '/api/film?s=' + v.id}" download="${esc(k.symbol)}-${v.id}.${v.status === 'done' ? 'mp4' : 'jpg'}">${esc(TR[v.trend] || 'promo')} ↓</a><p>${esc(v.caption || '')}</p><div class="acts"><button type="button" class="btn line sm" data-copy="${esc(v.caption || '')}">copy caption</button></div></div></article>`).join('')
      : `<div class="none"><b>${pending ? 'not launched yet' : 'its first promo is on the way'}</b>${pending ? 'Its marketer starts once the coin is launched.' : 'A new promo every six hours while the coin trades.'}</div>`;
    if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => es.forEach(en => { const v = en.target; if (en.isIntersecting) v.play().catch(() => {}); else v.pause(); }), { threshold: .5 }); document.querySelectorAll('#vids video').forEach(v => io.observe(v)); }
    $('#log').innerHTML = (data.log || []).length ? data.log.map(e => `<li>${esc(when(e.at))} · ${esc(e.text)}</li>`).join('') : '<li>Nothing yet.</li>';
    const cap = k.mcap_sol != null ? (solUsd ? C.usd(k.mcap_sol * solUsd) : (+k.mcap_sol).toFixed(1) + ' SOL') : '—';
    $('#nums').innerHTML = [['market cap', pending ? '—' : cap], ['videos', String(k.vids || 0)], ['last trade', pending ? '—' : when(k.last_trade_at)]].map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('');
    const shares = typeof k.shares === 'string' ? JSON.parse(k.shares) : (k.shares || []);
    $('#split').innerHTML = shares.map(s => `<div><dt>${s.address === data.studio ? 'the house · pays the marketers' : s.address === k.payer ? 'its creator' : 'a share'}</dt><dd>${s.bps / 100}%</dd></div>`).join('');
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-copy]'); if (!b) return; C.copy(b.dataset.copy); });
  async function feed() {
    const b = $('#feedBtn'); b.disabled = true; $('#cStatus').textContent = '';
    try { const r = await X.feed(mint); if (r) { C.toast('Paid out to every share.'); $('#cStatus').innerHTML = `<a href="${C.solscan('tx', r.sig)}" target="_blank" rel="noopener">the payout on solscan ↗</a>`; } }
    catch (e) { $('#cStatus').textContent = C.human(e); }
    finally { b.disabled = false; }
  }
  async function finish() {
    const b = $('#finishBtn'); $('#cStatus').textContent = '';
    if (!C.S.me) { const ok = await C.connect(); if (!ok) return; }
    if (C.S.me !== data.infl.payer) { $('#cStatus').textContent = 'Only the wallet that launched it can finish it.'; return; }
    b.disabled = true;
    try { const s = await C.post('/api/settle', { mint }); if (!(s && s.live)) await X.route(mint); C.toast('It’s live.'); await load(); }
    catch (e) { $('#cStatus').textContent = C.human(e); }
    finally { if ($('#finishBtn')) $('#finishBtn').disabled = false; }
  }

  C.get('/api/board').then(j => { if (j && j.solUsd) { solUsd = j.solUsd; if (data) render(); } }).catch(() => {});
  load(); setInterval(() => { if (!document.hidden) load(); }, 15000);
  if (L) { L.births(false); if (mint) L.watch([mint]); L.start(); }
})();
