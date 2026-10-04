// MARKETERS: every coin launched here hires an AI marketer that makes its TikToks: a promo photo starring the coin's own
// picture (FLUX, with the picture as the reference), turned into a short vertical video when the video budget allows.
// This file: the birth, the cycle's reading of every coin from the chain, the roster, the pitch and the video jobs.
const L = require('./_lib');
const DAY = 864e5;
async function routingOf(mint) {
  if (L.MOCK && L.MOCK.routing) return L.MOCK.routing(mint);
  return require('./_pump').routing(mint, L.accounts);
}
const sameShares = (got, want) => got.length === want.length && want.every((w, i) => got[i].address === w.address && got[i].bps === w.bps);
async function settle(mint) {
  const k = (await L.q('SELECT mint, symbol, status, slot, shares FROM m0_coins WHERE mint=$1', [mint]))[0];
  if (!k) return { ok: false, error: 'No coin was recorded for that token.' };
  if (k.status === 'live') return { ok: true, live: true, slot: k.slot };
  if (k.status === 'void') return { ok: true, live: false, void: true };
  const r = await routingOf(mint);
  if (!r.exists) return { ok: true, live: false, waiting: 'coin' };
  const shares = typeof k.shares === 'string' ? JSON.parse(k.shares) : k.shares;
  if (!(r.routed && r.revoked && sameShares(r.shareholders, shares))) return { ok: true, live: false, waiting: 'split', mint };
  for (let i = 0; i < 4; i++) {
    try {
      const u = await L.q(`UPDATE m0_coins SET status='live', slot=(SELECT coalesce(max(slot),-1)+1 FROM m0_coins WHERE status='live'), born_at=now(), state=$4,
        last_trade_at=now(), mcap_sol=$2, complete=$3 WHERE mint=$1 AND status<>'live' RETURNING slot`, [mint, r.mcapSol, !!r.complete, r.complete ? 'ascended' : 'awake']);
      if (u.length) await L.log('born', mint, `$${k.symbol} hired its marketer`);
      const s = (await L.q('SELECT slot FROM m0_coins WHERE mint=$1', [mint]))[0];
      return { ok: true, live: true, slot: s && s.slot };
    } catch (e) { if (!/unique|duplicate/i.test(String(e && e.message))) throw e; }
  }
  return { ok: true, live: false, waiting: 'slot' };
}
async function lastTrade(mint) {
  if (L.MOCK && L.MOCK.lastTrade) return L.MOCK.lastTrade(mint);
  const r = await L.rpc('getSignaturesForAddress', [L.bondingCurveOf(mint), { limit: 1, commitment: 'confirmed' }]).catch(() => null);
  return r && r[0] && r[0].blockTime ? new Date(r[0].blockTime * 1000) : null;
}
const stateFor = (k, now) => k.complete ? 'ascended' : !k.last_trade_at ? 'awake' : now - new Date(k.last_trade_at) >= 7 * DAY ? 'dead' : now - new Date(k.last_trade_at) >= DAY ? 'rot' : 'awake';
async function readBoard() {
  const ks = await L.q(`SELECT mint, symbol, state, mcap_sol, complete, last_trade_at FROM m0_coins WHERE status='live' ORDER BY slot`);
  const vaults = ks.length ? await L.accounts(ks.map(k => L.vaultOf(k.mint))).catch(() => ks.map(() => null)) : [];
  const curves = ks.length ? await L.accounts(ks.map(k => L.bondingCurveOf(k.mint))).catch(() => ks.map(() => null)) : [];
  const now = Date.now(); let changes = 0;
  await L.pool(ks, 6, async (k, i) => {
    let mcap = k.mcap_sol, complete = k.complete;
    if (L.MOCK && L.MOCK.routing) { const r = await L.MOCK.routing(k.mint); mcap = r.mcapSol; complete = !!r.complete; }
    else if (curves[i]) { try { const { PUMP_SDK } = require('@pump-fun/pump-sdk'); const bc = PUMP_SDK.decodeBondingCurve(curves[i]); const vq = bc.virtualSolReserves || bc.virtualQuoteReserves, vt = bc.virtualTokenReserves; complete = !!bc.complete; if (vt && !vt.isZero()) mcap = Number(vq.mul(bc.tokenTotalSupply).div(vt).toString()) / 1e9; } catch {} }
    const vl = vaults[i] ? Math.max(0, vaults[i].lamports - L.RENT0) : 0;
    const t = complete ? null : await lastTrade(k.mint);
    const last = t && (!k.last_trade_at || t > new Date(k.last_trade_at)) ? t : k.last_trade_at;
    const st = stateFor({ ...k, complete, last_trade_at: last }, now);
    if (st !== k.state) { changes++; await L.log(st, k.mint, `$${k.symbol} ${st === 'rot' ? 'is slowing down' : st === 'dead' ? 'went quiet' : st === 'ascended' ? 'graduated: its curve is complete' : 'is back on the campaign'}`); }
    await L.q(`UPDATE m0_coins SET mcap_sol=$2, complete=$3, last_trade_at=$4, state=$5, vault_lamports=$6 WHERE mint=$1`, [k.mint, mcap, complete, last, st, vl]);
  });
  return { coins: ks.length, changes };
}




// ---------- the roster: six marketers, each with a format. The promo is built around the coin's own picture ----------
const CAST = {
  hype: { name: 'Doug', role: 'the street hype', img: 1, format: 'megaphone street promo',
    scene: 'A dachshund salesman in a striped suit shouts into a megaphone on a busy city street while proudly holding up a big plush toy of the exact character or logo from this image',
    motion: 'The dachshund shouts excitedly into the megaphone and waves the plush toy at people walking by, handheld street video.' },
  keynote: { name: 'Pip', role: 'the keynote', img: 2, format: 'stage keynote',
    scene: 'A pigeon in a tiny tailored suit gives a keynote on a big conference stage, spotlight on it, and the giant screen behind it shows the exact character or logo from this image',
    motion: 'The pigeon spreads its wings dramatically as the camera slowly pushes in, the crowd silhouettes nodding.' },
  infomercial: { name: 'Lola', role: 'the infomercial', img: 3, format: 'late-night infomercial',
    scene: 'A llama TV host on a bright late-night infomercial set proudly presents a shiny figurine of the exact character or logo from this image on a glass table',
    motion: 'The llama gestures at the figurine with excitement and turns to the camera, bright studio lights, infomercial energy.' },
  strategy: { name: 'Otto', role: 'the strategist', img: 4, format: 'whiteboard strategy',
    scene: 'An owl marketing director with glasses stands at a whiteboard covered in colorful sticky notes and points at a big printed picture of the exact character or logo from this image pinned in the middle',
    motion: 'The owl taps the picture on the whiteboard and nods confidently at the camera, office video.' },
  model: { name: 'Bruno', role: 'the face', img: 5, format: 'glamour photoshoot',
    scene: 'A bulldog in sunglasses poses like a supermodel at a glamorous photoshoot next to a life-size statue of the exact character or logo from this image, cameras flashing',
    motion: 'The bulldog turns its head to pose as camera flashes pop around it, slow push-in, fashion video.' },
  hotline: { name: 'Kiki', role: 'the hotline', img: 6, format: 'call-center hype',
    scene: 'A parrot in a headset at a busy call center desk excitedly holds up a plush toy of the exact character or logo from this image toward the camera',
    motion: 'The parrot bobs its head and squawks happily into the headset while shaking the plush toy, office video.' },
};
const CAST_KEYS = Object.keys(CAST);
const castOf = k => CAST[k && k.niche] || CAST[k && k.cast] || CAST.hype;
const RULES = 'Rules: no financial advice, no price predictions, no promises of gains, never tell anyone to buy or sell, never say "100x", "moon" or "guaranteed", no real people, nothing sexual, no links.';
const KEEP = ' Keep the character or logo from the image exactly as it is: same shape, colours and features. Photorealistic, vertical 9:16 phone video still, funny viral AI TikTok energy, sharp detail. Every screen, sign, wall and banner is blank: no words or letters anywhere, no captions, no logos other than the one from the image, no watermark.';
async function vertical(buf) {
  return require('sharp')(buf, { limitInputPixels: 60e6 }).resize(720, 1280, { fit: 'cover', position: 'attention' }).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
}
// what the coin's picture shows, so the caption can talk about it
async function describe(jpeg) {
  const r = await L.ai([{ role: 'user', content: [{ type: 'text', text: 'Describe the main character, mascot or logo in this image in under 30 words: what it is, colours, vibe.' },
    { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + jpeg.toString('base64') } }] }], 90, 15000).catch(() => null);
  return r && r.ok ? L.clean(r.text, 300) : null;
}
// the caption for a promo, in the marketer's voice
async function caption(k, c) {
  const r = await L.ai([{ role: 'system', content: `You are ${c.name}, ${c.role}: an AI marketer making a ${c.format} TikTok for the memecoin ${k.name} ($${k.symbol}). What the coin is, in its creator's words: """${L.clean(k.voice, 500)}""". ${k.look ? 'Its picture shows: ' + L.clean(k.look, 300) + '. ' : ''}${RULES}` },
    { role: 'user', content: `Write the TikTok caption for this promo: one punchy hook line under 110 characters in your voice, then three hashtags including #aigenerated, and $${k.symbol} once. Plain text only.` }], 100, 15000).catch(() => null);
  const t = r && r.ok ? L.scrub(String(r.text || '').replace(/^"|"$/g, '').replace(/#\$/g, '$').replace(/\*/g, ''), 180) : '';
  return t && !L.BANNED.test(t) ? t : `${c.name} has a word about $${k.symbol}. #aigenerated #fyp #memecoin`;
}
// the promo still: the marketer's scene, starring the coin's own picture
async function promo(c, refB64) {
  let ph = await L.photo(c.scene + '.' + KEEP, refB64, 55000, '768x1344');
  if (!ph.ok && /size|dimension|width|height/i.test(ph.error || '')) ph = await L.photo(c.scene + '.' + KEEP, refB64, 50000);
  if (!ph.ok) return ph;
  return { ok: true, img: await vertical(ph.buf), model: ph.model };
}
// start the video from a still (JPEG buffer); returns {ok, model, operation} or a paused reason
async function startVideo(c, still, imageUrl) {
  if (!(await L.spendVid())) return { ok: false, error: 'Today’s video budget is spent. It resets at 00:00 UTC.' };
  const prompt = `${c.motion} Keep everything in the image the same, including the character or logo from the coin. Photorealistic vertical phone video, natural motion, no text, no captions.`;
  let s = L.HF && imageUrl ? await L.hfStart(prompt, imageUrl) : { ok: false };
  if (!s.ok) s = await L.videoStart(prompt, still.toString('base64'), { resolution: '720x1280' });
  if (!s.ok && /resolution/i.test(s.error || '')) s = await L.videoStart(prompt, still.toString('base64'));
  if (!s.ok) return { ok: false, paused: /balance|credit/i.test(s.error || ''), error: /balance|credit/i.test(s.error || '') ? 'Videos open soon: the house’s video credits aren’t loaded yet. The promo photo is ready.' : 'The camera didn’t start. Try again in a minute.', why: s.error };
  return { ok: true, model: s.model, operation: s.operation };
}
// one promo, kept as a row: the still always, the video when it's filmed
async function pitch({ k, refB64, kind, mint = null, site = null }) {
  const c = castOf(k);
  if (!(await L.spendShot())) return { ok: false, error: 'Today’s photo budget is spent. It resets at 00:00 UTC.' };
  const p = await promo(c, refB64);
  if (!p.ok) return { ok: false, error: 'The promo didn’t come out. Try again in a minute.', why: p.error };
  const cap = await caption(k, c);
  const r = await L.q(`INSERT INTO m0_vids (mint, kind, trend, caption, still, status) VALUES ($1,$2,$3,$4,$5,'still') RETURNING id`, [mint, kind, k.niche || 'hype', cap, p.img]);
  const id = r[0].id, url = site ? site + '/api/film?s=' + id : null;
  const v = await startVideo(c, p.img, url);
  if (v.ok) await L.q(`UPDATE m0_vids SET status='pending', model=$2, op=$3 WHERE id=$1`, [id, v.model, JSON.stringify(v.operation)]);
  if (mint) { await L.q(`UPDATE m0_coins SET vid_at=now() WHERE mint=$1`, [mint]); await L.log('promo', mint, `${c.name} made a ${c.format} for $${k.symbol}`); }
  return { ok: true, job: id, still: '/api/film?s=' + id, caption: cap, filming: !!v.ok, note: v.ok ? null : v.error, cast: k.niche };
}
// ask the video model how a job is doing; when it's done, keep the MP4
async function poll(v) {
  if (v.status !== 'pending') return v;
  if (v.polled_at && Date.now() - new Date(v.polled_at) < 3000) return v;
  await L.q(`UPDATE m0_vids SET polled_at=now() WHERE id=$1`, [v.id]);
  const op = typeof v.op === 'string' ? JSON.parse(v.op) : v.op;
  const st = String(v.model || '').startsWith('higgsfield/') ? await L.hfStatus(op && op.hf) : await L.videoStatus(v.model, op);
  const old = Date.now() - new Date(v.at);
  if (!st.ok) { if (old > 15 * 60000) { await L.q(`UPDATE m0_vids SET status='still', err=$2 WHERE id=$1`, [v.id, st.error]); return { ...v, status: 'still' }; } return v; }
  if (st.status === 'pending') { if (old > 20 * 60000) { await L.q(`UPDATE m0_vids SET status='still', err='timed out' WHERE id=$1`, [v.id]); return { ...v, status: 'still' }; } return v; }
  if (st.status === 'error') { await L.q(`UPDATE m0_vids SET status='still', err=$2 WHERE id=$1`, [v.id, st.error]); return { ...v, status: 'still' }; }
  const buf = await L.videoBytes(st.video).catch(() => null);
  if (!buf || buf.length < 1000) { await L.q(`UPDATE m0_vids SET status='still', err='empty video' WHERE id=$1`, [v.id]); return { ...v, status: 'still' }; }
  await L.q(`UPDATE m0_vids SET status='done', mp4=$2, done_at=now(), op=NULL WHERE id=$1 AND status='pending'`, [v.id, buf]);
  return { ...v, status: 'done' };
}
// a launched coin's next promo, from its own picture, by its marketer
async function shift(k, site) {
  if (!k.img) return { ok: false, error: 'no picture' };
  const r = await pitch({ k, refB64: Buffer.from(k.img).toString('base64'), kind: 'shift', mint: k.mint, site });
  if (r.ok) await L.q(`UPDATE m0_coins SET vids = vids + 1 WHERE mint=$1`, [k.mint]);
  return r;
}
module.exports = { settle, routingOf, readBoard, CAST, CAST_KEYS, castOf, describe, caption, pitch, poll, shift, vertical };
