export const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const pad2 = (n) => String(n).padStart(2, '0');
const isoYap = (y, m, d) => `${y}-${pad2(m)}-${pad2(d)}`;

export function bugun() {
  const d = new Date();
  return isoYap(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function addMonths(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const toplam = m - 1 + n;
  const yy = y + Math.floor(toplam / 12);
  const mm = ((toplam % 12) + 12) % 12;
  const son = new Date(yy, mm + 1, 0).getDate();
  return isoYap(yy, mm + 1, Math.min(d, son));
}

export function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(y, m - 1, d + n);
  return isoYap(t.getFullYear(), t.getMonth() + 1, t.getDate());
}

export function gunFarki(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 864e5);
}

export function tarihGoster(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export function ayEtiketi(ym) {
  const [y, m] = ym.split('-');
  return `${AYLAR[parseInt(m, 10) - 1]} ${y}`;
}

const paraBicim = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' });
const sayiBicim = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const tl = (n) => paraBicim.format(n || 0);
export const tlSayi = (n) => sayiBicim.format(n || 0);

export function tlOku(s) {
  if (typeof s === 'number') return s;
  let t = String(s ?? '').replace(/[₺\sTLtl]/g, '');
  if (t === '') return NaN;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

export const yuvarla = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
export const topla = (liste, f) => yuvarla(liste.reduce((s, x) => s + f(x), 0));

export function seriUret({ adet, ilkVade, aralikAy, tutar, toplamMi }) {
  const n = Math.max(1, Math.min(600, parseInt(adet, 10) || 1));
  const aralik = Math.max(1, parseInt(aralikAy, 10) || 1);
  const satirlar = [];
  let birim = toplamMi ? yuvarla(tutar / n) : tutar;
  for (let i = 0; i < n; i++) satirlar.push({ vade: addMonths(ilkVade, i * aralik), tutar: birim });
  if (toplamMi) {
    const fark = yuvarla(tutar - birim * n);
    satirlar[n - 1].tutar = yuvarla(satirlar[n - 1].tutar + fark);
  }
  return satirlar;
}

export function csvUret(basliklar, satirlar) {
  const hucre = (v) => {
    const t = String(v ?? '');
    return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return [basliklar, ...satirlar].map((s) => s.map(hucre).join(';')).join('\r\n');
}
