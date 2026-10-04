// POST /api/pitch {draft: {name, symbol, line, cast}, image}  a test promo before launch: the marketer makes a promo of the
//   coin's own picture (the still always; the video when the video budget allows). Kept two days.
// POST /api/pitch {mint}  the first promo of a freshly launched coin (only while it has none).
const L = require('./_lib');
const M = require('./_mk');
async function picture(dataUrl) {
  const m = String(dataUrl || '').match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  const buf = Buffer.from(m[2], 'base64'); if (buf.length > 3e6) return null;
  return require('sharp')(buf, { animated: false, limitInputPixels: 40e6 }).resize(768, 768, { fit: 'cover', position: 'attention' }).flatten({ background: '#ffffff' }).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
}
module.exports = async (req, res) => {
  if (req.method !== 'POST') return L.send(res, 405, { ok: false, error: 'POST only.' });
  L.setOidc(req);
  if (!L.dbReady()) return L.send(res, 200, { ok: false, error: 'MARKETERS’ records are offline.' });
  const b = await L.body(req, 4.2 * 1024 * 1024);
  if (b.tooBig) return L.send(res, 200, { ok: false, error: 'That picture is too big. Try a smaller one.' });
  try {
    await L.ready();
    const site = L.origin(req);
    if (b.draft) {
      if (L.limited('pitch:' + L.ip(req), 4, 3600000)) return L.send(res, 200, { ok: false, error: 'Four test promos an hour. Launch it and your marketer keeps going on its own.' });
      const d = b.draft, line = L.clean(d.line, 300);
      if (line.length < 8) return L.send(res, 200, { ok: false, error: 'Write the one-line pitch first: what the coin is.' });
      const pic = await picture(b.image).catch(() => null);
      if (!pic) return L.send(res, 200, { ok: false, error: 'Add the coin’s picture first (PNG, JPG, WebP or GIF).' });
      const k = { name: L.clean(d.name, 32) || 'this coin', symbol: (L.clean(d.symbol, 10).replace(/^\$/, '').toUpperCase() || 'COIN'), voice: line, niche: M.CAST[String(d.cast)] ? String(d.cast) : 'hype' };
      if (L.BANNED.test(k.name + ' ' + k.symbol + ' ' + line)) return L.send(res, 200, { ok: false, error: 'That pitch breaks the house rules. Try another.' });
      k.look = await M.describe(pic);
      await L.q(`UPDATE m0_vids SET still=NULL, mp4=NULL, status='gone' WHERE kind='test' AND at < now() - interval '2 days'`).catch(() => {});
      return L.send(res, 200, await M.pitch({ k, refB64: pic.toString('base64'), kind: 'test', site }));
    }
    const mint = String(b.mint || '');
    if (!L.isAddr(mint)) return L.send(res, 200, { ok: false, error: 'That isn’t a token address.' });
    if (L.limited('first:' + mint, 2, 600000)) return L.send(res, 200, { ok: false, error: 'Its marketer is already on it.' });
    const k = (await L.q(`SELECT mint, name, symbol, niche, voice, look, img, status, vids FROM m0_coins WHERE mint=$1`, [mint]))[0];
    if (!k || k.status !== 'live') return L.send(res, 200, { ok: false, error: 'It isn’t launched yet.' });
    const any = await L.q(`SELECT id FROM m0_vids WHERE mint=$1 AND status IN ('still','pending','done') LIMIT 1`, [mint]);
    if (any.length) return L.send(res, 200, { ok: true, job: any[0].id, already: true });
    L.send(res, 200, await M.shift(k, site));
  } catch (e) { L.send(res, 200, { ok: false, error: 'The promo didn’t come out. Try again.', why: String(e && e.message).slice(0, 160) }); }
};
