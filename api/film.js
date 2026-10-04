// GET  /api/film?job=N   how a promo is doing: its still, and its video once filmed.
// GET  /api/film?s=N     the promo's still (JPEG).   GET /api/film?v=N  the promo's video (MP4, byte ranges).
// GET  /api/film?reel=1  the house reel (the roster's own videos, once filmed).
// POST /api/film {brand, key}  film one roster video for the house reel (once per marketer).
const L = require('./_lib');
const M = require('./_mk');
async function serveMp4(req, res, id) {
  const r = await L.q(`SELECT mp4 FROM m0_vids WHERE id=$1 AND status='done'`, [id]);
  if (!r.length) { res.statusCode = 404; return res.end(); }
  const buf = Buffer.from(r[0].mp4), size = buf.length, range = String(req.headers.range || '');
  res.setHeader('Content-Type', 'video/mp4'); res.setHeader('Accept-Ranges', 'bytes'); res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, immutable');
  const m = range.match(/bytes=(\d*)-(\d*)/);
  if (m) {
    const a = m[1] === '' ? size - Number(m[2]) : Number(m[1]), z = m[2] === '' || m[1] === '' ? size - 1 : Math.min(size - 1, Number(m[2]));
    if (a < 0 || a >= size || z < a) { res.statusCode = 416; res.setHeader('Content-Range', 'bytes */' + size); return res.end(); }
    res.statusCode = 206; res.setHeader('Content-Range', `bytes ${a}-${z}/${size}`); res.setHeader('Content-Length', z - a + 1); return res.end(buf.subarray(a, z + 1));
  }
  res.statusCode = 200; res.setHeader('Content-Length', size); return res.end(buf);
}
const view = v => ({ ok: true, job: v.id, status: v.status, cast: v.trend, caption: v.caption, still: '/api/film?s=' + v.id, url: v.status === 'done' ? '/api/film?v=' + v.id : null });
module.exports = async (req, res) => {
  L.setOidc(req);
  if (!L.dbReady()) return L.send(res, 200, { ok: false, error: 'MARKETERS’ records are offline.' });
  try {
    await L.ready();
    const qy = L.query(req);
    if (req.method === 'GET') {
      if (qy.v && /^\d{1,12}$/.test(String(qy.v))) return serveMp4(req, res, String(qy.v));
      if (qy.s && /^\d{1,12}$/.test(String(qy.s))) {
        const r = await L.q('SELECT still FROM m0_vids WHERE id=$1 AND still IS NOT NULL', [String(qy.s)]);
        if (!r.length) { res.statusCode = 404; return res.end(); }
        res.statusCode = 200; res.setHeader('Content-Type', 'image/jpeg'); res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, immutable'); return res.end(Buffer.from(r[0].still));
      }
      if (qy.reel) {
        const r = await L.q(`SELECT id, trend FROM m0_vids WHERE kind='brand' AND status='done' ORDER BY id`);
        return L.send(res, 200, { ok: true, reel: r.map(v => ({ id: v.id, cast: v.trend, url: '/api/film?v=' + v.id })) }, L.CACHE(30, 600));
      }
      const id = String(qy.job || '');
      if (!/^\d{1,12}$/.test(id)) return L.send(res, 200, { ok: false, error: 'No such promo.' });
      let v = (await L.q('SELECT id, mint, kind, trend, caption, model, op, status, polled_at, at FROM m0_vids WHERE id=$1', [id]))[0];
      if (!v) return L.send(res, 200, { ok: false, error: 'No such promo.' });
      v = await M.poll(v);
      return L.send(res, 200, view(v));
    }
    if (req.method !== 'POST') return L.send(res, 405, { ok: false, error: 'POST only.' });
    const b = await L.body(req, 4096), key = String(b.brand || '');
    const c = M.CAST[key]; if (!c) return L.send(res, 200, { ok: false, error: 'No such marketer.' });
    const have = await L.q(`SELECT id, status FROM m0_vids WHERE kind='brand' AND trend=$1 AND status IN ('pending','done')`, [key]);
    if (have.length) return L.send(res, 200, { ok: true, job: have[0].id, status: have[0].status });
    if (!(await L.spendVid())) return L.send(res, 200, { ok: false, error: 'Today’s video budget is spent.' });
    const img = await fetch(L.origin(req) + '/assets/img/m' + c.img + '.jpg', { signal: AbortSignal.timeout(10000) }).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null);
    if (!img) return L.send(res, 200, { ok: false, error: 'No roster picture.' });
    const still = await M.vertical(Buffer.from(img));
    const prompt = c.motion + ' Photorealistic vertical phone video, natural motion, no text, no captions.';
    let s = L.HF ? await L.hfStart(prompt, L.origin(req) + '/assets/img/m' + c.img + '.jpg') : { ok: false };
    if (!s.ok) s = await L.videoStart(prompt, still.toString('base64'), { resolution: '720x1280' });
    if (!s.ok) return L.send(res, 200, { ok: false, error: 'The camera didn’t start.', why: s.error });
    const r = await L.q(`INSERT INTO m0_vids (kind, trend, caption, still, status, model, op) VALUES ('brand',$1,$2,$3,'pending',$4,$5) RETURNING id`, [key, c.format, still, s.model, JSON.stringify(s.operation)]);
    L.send(res, 200, { ok: true, job: r[0].id });
  } catch (e) { L.send(res, 200, { ok: false, error: 'The promo desk didn’t answer. Try again.', why: String(e && e.message).slice(0, 160) }); }
};
