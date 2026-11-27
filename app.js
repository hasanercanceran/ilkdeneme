const STORAGE_KEY = 'finans2027';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { checks: [], debts: [], others: [], rents: [] };
    const parsed = JSON.parse(raw);
    return {
      checks: parsed.checks || [],
      debts: parsed.debts || [],
      others: parsed.others || [],
      rents: parsed.rents || [],
    };
  } catch (e) {
    console.error('Veri okunamadı', e);
    return { checks: [], debts: [], others: [], rents: [] };
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadData();

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function money(n) {
  return (n || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(item) {
  const pending = item.durum === 'bekliyor';
  return pending && item.vade < todayISO();
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function addMonths(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1 + n, d);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

// ---------- Tabs ----------
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'akis') renderCashFlow();
  });
});

// ---------- Generic form helpers ----------
function fillForm(form, item) {
  Object.keys(item).forEach((key) => {
    const field = form.elements[key];
    if (field) field.value = item[key];
  });
}

function resetForm(form, cancelBtn) {
  form.reset();
  form.elements.id.value = '';
  if (form.elements.taksit) form.elements.taksit.disabled = false;
  cancelBtn.hidden = true;
  form.querySelector('button[type=submit]').textContent = 'Ekle';
}

// ---------- CHECKS (Çek/Senet) ----------
const checkForm = document.getElementById('checkForm');
const checkCancel = document.getElementById('checkCancel');

checkForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = checkForm.elements;
  const isEdit = !!f.id.value;
  const taksit = isEdit ? 1 : Math.max(1, parseInt(f.taksit.value, 10) || 1);
  const baseNot = f.not.value.trim();
  for (let i = 0; i < taksit; i++) {
    const item = {
      id: isEdit ? f.id.value : uid(),
      kisi: f.kisi.value.trim(),
      tutar: parseFloat(f.tutar.value),
      vade: addMonths(f.vade.value, i),
      durum: f.durum.value,
      not: taksit > 1 ? `${baseNot} ${baseNot ? '· ' : ''}(${i + 1}/${taksit})`.trim() : baseNot,
    };
    const idx = state.checks.findIndex((c) => c.id === item.id);
    if (idx >= 0) state.checks[idx] = item;
    else state.checks.push(item);
  }
  saveData();
  resetForm(checkForm, checkCancel);
  renderChecks();
  renderSummary();
});

checkCancel.addEventListener('click', () => resetForm(checkForm, checkCancel));

function renderChecks() {
  const tbody = document.querySelector('#checkTable tbody');
  tbody.innerHTML = '';
  const sorted = [...state.checks].sort((a, b) => a.vade.localeCompare(b.vade));
  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Henüz çek/senet eklenmedi.</td></tr>';
    return;
  }
  sorted.forEach((item) => {
    const tr = document.createElement('tr');
    if (isOverdue(item)) tr.classList.add('row-overdue');
    tr.innerHTML = `
      <td>${escapeHtml(item.kisi)}</td>
      <td>${money(item.tutar)}</td>
      <td>${formatDate(item.vade)}</td>
      <td><span class="badge badge-${item.durum}">${statusLabel(item.durum)}</span></td>
      <td>${escapeHtml(item.not || '')}</td>
      <td class="row-actions">
        <button class="icon-btn" data-action="edit" data-id="${item.id}">Düzenle</button>
        <button class="icon-btn" data-action="delete" data-id="${item.id}">Sil</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

document.querySelector('#checkTable tbody').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const item = state.checks.find((c) => c.id === btn.dataset.id);
  if (btn.dataset.action === 'delete') {
    if (confirm('Bu çek/senet kaydını silmek istiyor musun?')) {
      state.checks = state.checks.filter((c) => c.id !== btn.dataset.id);
      saveData();
      renderChecks();
      renderSummary();
    }
  } else if (btn.dataset.action === 'edit') {
    fillForm(checkForm, item);
    checkForm.elements.taksit.value = 1;
    checkForm.elements.taksit.disabled = true;
    checkCancel.hidden = false;
    checkForm.querySelector('button[type=submit]').textContent = 'Güncelle';
    checkForm.scrollIntoView({ behavior: 'smooth' });
  }
});

// ---------- DEBTS (Borçlar) ----------
const debtForm = document.getElementById('debtForm');
const debtCancel = document.getElementById('debtCancel');

debtForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = debtForm.elements;
  const isEdit = !!f.id.value;
  const taksit = isEdit ? 1 : Math.max(1, parseInt(f.taksit.value, 10) || 1);
  const baseNot = f.not.value.trim();
  for (let i = 0; i < taksit; i++) {
    const item = {
      id: isEdit ? f.id.value : uid(),
      kisi: f.kisi.value.trim(),
      tutar: parseFloat(f.tutar.value),
      vade: addMonths(f.vade.value, i),
      durum: f.durum.value,
      not: taksit > 1 ? `${baseNot} ${baseNot ? '· ' : ''}(${i + 1}/${taksit})`.trim() : baseNot,
    };
    const idx = state.debts.findIndex((c) => c.id === item.id);
    if (idx >= 0) state.debts[idx] = item;
    else state.debts.push(item);
  }
  saveData();
  resetForm(debtForm, debtCancel);
  renderDebts();
  renderSummary();
});

debtCancel.addEventListener('click', () => resetForm(debtForm, debtCancel));

function renderDebts() {
  const tbody = document.querySelector('#debtTable tbody');
  tbody.innerHTML = '';
  const sorted = [...state.debts].sort((a, b) => a.vade.localeCompare(b.vade));
  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Henüz borç eklenmedi.</td></tr>';
    return;
  }
  sorted.forEach((item) => {
    const tr = document.createElement('tr');
    if (isOverdue(item)) tr.classList.add('row-overdue');
    tr.innerHTML = `
      <td>${escapeHtml(item.kisi)}</td>
      <td>${money(item.tutar)}</td>
      <td>${formatDate(item.vade)}</td>
      <td><span class="badge badge-${item.durum}">${statusLabel(item.durum)}</span></td>
      <td>${escapeHtml(item.not || '')}</td>
      <td class="row-actions">
        <button class="icon-btn" data-action="edit" data-id="${item.id}">Düzenle</button>
        <button class="icon-btn" data-action="delete" data-id="${item.id}">Sil</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

document.querySelector('#debtTable tbody').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const item = state.debts.find((c) => c.id === btn.dataset.id);
  if (btn.dataset.action === 'delete') {
    if (confirm('Bu borç kaydını silmek istiyor musun?')) {
      state.debts = state.debts.filter((c) => c.id !== btn.dataset.id);
      saveData();
      renderDebts();
      renderSummary();
    }
  } else if (btn.dataset.action === 'edit') {
    fillForm(debtForm, item);
    debtForm.elements.taksit.value = 1;
    debtForm.elements.taksit.disabled = true;
    debtCancel.hidden = false;
    debtForm.querySelector('button[type=submit]').textContent = 'Güncelle';
    debtForm.scrollIntoView({ behavior: 'smooth' });
  }
});

// ---------- OTHERS (Diğer Gelir/Gider) ----------
const otherForm = document.getElementById('otherForm');
const otherCancel = document.getElementById('otherCancel');

otherForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = otherForm.elements;
  const isEdit = !!f.id.value;
  const taksit = isEdit ? 1 : Math.max(1, parseInt(f.taksit.value, 10) || 1);
  const baseAciklama = f.aciklama.value.trim();
  for (let i = 0; i < taksit; i++) {
    const item = {
      id: isEdit ? f.id.value : uid(),
      tur: f.tur.value,
      aciklama: taksit > 1 ? `${baseAciklama} (${i + 1}/${taksit})` : baseAciklama,
      tutar: parseFloat(f.tutar.value),
      vade: addMonths(f.vade.value, i),
      durum: f.durum.value,
    };
    const idx = state.others.findIndex((c) => c.id === item.id);
    if (idx >= 0) state.others[idx] = item;
    else state.others.push(item);
  }
  saveData();
  resetForm(otherForm, otherCancel);
  renderOthers();
  renderSummary();
});

otherCancel.addEventListener('click', () => resetForm(otherForm, otherCancel));

function renderOthers() {
  const tbody = document.querySelector('#otherTable tbody');
  tbody.innerHTML = '';
  const sorted = [...state.others].sort((a, b) => a.vade.localeCompare(b.vade));
  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Henüz kayıt eklenmedi.</td></tr>';
    return;
  }
  sorted.forEach((item) => {
    const tr = document.createElement('tr');
    if (isOverdue(item)) tr.classList.add('row-overdue');
    tr.innerHTML = `
      <td>${item.tur === 'gelir' ? 'Gelir' : 'Gider'}</td>
      <td>${escapeHtml(item.aciklama)}</td>
      <td>${money(item.tutar)}</td>
      <td>${formatDate(item.vade)}</td>
      <td><span class="badge badge-${item.durum}">${statusLabel(item.durum)}</span></td>
      <td class="row-actions">
        <button class="icon-btn" data-action="edit" data-id="${item.id}">Düzenle</button>
        <button class="icon-btn" data-action="delete" data-id="${item.id}">Sil</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

document.querySelector('#otherTable tbody').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const item = state.others.find((c) => c.id === btn.dataset.id);
  if (btn.dataset.action === 'delete') {
    if (confirm('Bu kaydı silmek istiyor musun?')) {
      state.others = state.others.filter((c) => c.id !== btn.dataset.id);
      saveData();
      renderOthers();
      renderSummary();
    }
  } else if (btn.dataset.action === 'edit') {
    fillForm(otherForm, item);
    otherForm.elements.taksit.value = 1;
    otherForm.elements.taksit.disabled = true;
    otherCancel.hidden = false;
    otherForm.querySelector('button[type=submit]').textContent = 'Güncelle';
    otherForm.scrollIntoView({ behavior: 'smooth' });
  }
});

// ---------- RENTS (Kira Sözleşmesi) ----------
const rentForm = document.getElementById('rentForm');
const rentCancel = document.getElementById('rentCancel');

rentForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = rentForm.elements;
  const isEdit = !!f.id.value;
  const taksit = isEdit ? 1 : Math.max(1, parseInt(f.taksit.value, 10) || 1);
  const baseNot = f.not.value.trim();
  for (let i = 0; i < taksit; i++) {
    const item = {
      id: isEdit ? f.id.value : uid(),
      kisi: f.kisi.value.trim(),
      tur: f.tur.value,
      tutar: parseFloat(f.tutar.value),
      vade: addMonths(f.vade.value, i),
      durum: f.durum.value,
      not: taksit > 1 ? `${baseNot} ${baseNot ? '· ' : ''}(${i + 1}/${taksit})`.trim() : baseNot,
    };
    const idx = state.rents.findIndex((c) => c.id === item.id);
    if (idx >= 0) state.rents[idx] = item;
    else state.rents.push(item);
  }
  saveData();
  resetForm(rentForm, rentCancel);
  renderRents();
  renderSummary();
});

rentCancel.addEventListener('click', () => resetForm(rentForm, rentCancel));

function renderRents() {
  const tbody = document.querySelector('#rentTable tbody');
  tbody.innerHTML = '';
  const sorted = [...state.rents].sort((a, b) => a.vade.localeCompare(b.vade));
  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty">Henüz kira kaydı eklenmedi.</td></tr>';
    return;
  }
  sorted.forEach((item) => {
    const tr = document.createElement('tr');
    if (isOverdue(item)) tr.classList.add('row-overdue');
    tr.innerHTML = `
      <td>${escapeHtml(item.kisi)}</td>
      <td>${item.tur === 'gelir' ? 'Kira Geliri' : 'Kira Ödemesi'}</td>
      <td>${money(item.tutar)}</td>
      <td>${formatDate(item.vade)}</td>
      <td><span class="badge badge-${item.durum}">${statusLabel(item.durum)}</span></td>
      <td>${escapeHtml(item.not || '')}</td>
      <td class="row-actions">
        <button class="icon-btn" data-action="edit" data-id="${item.id}">Düzenle</button>
        <button class="icon-btn" data-action="delete" data-id="${item.id}">Sil</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

document.querySelector('#rentTable tbody').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const item = state.rents.find((c) => c.id === btn.dataset.id);
  if (btn.dataset.action === 'delete') {
    if (confirm('Bu kira kaydını silmek istiyor musun?')) {
      state.rents = state.rents.filter((c) => c.id !== btn.dataset.id);
      saveData();
      renderRents();
      renderSummary();
    }
  } else if (btn.dataset.action === 'edit') {
    fillForm(rentForm, item);
    rentForm.elements.taksit.value = 1;
    rentForm.elements.taksit.disabled = true;
    rentCancel.hidden = false;
    rentForm.querySelector('button[type=submit]').textContent = 'Güncelle';
    rentForm.scrollIntoView({ behavior: 'smooth' });
  }
});

// ---------- Helpers ----------
function statusLabel(durum) {
  return {
    bekliyor: 'Bekliyor',
    tahsil: 'Tahsil Edildi',
    karsiliksiz: 'Karşılıksız',
    odendi: 'Ödendi',
    gerceklesti: 'Gerçekleşti',
    tamamlandi: 'Tamamlandı',
  }[durum] || durum;
}

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---------- Summary / Dashboard ----------
function renderSummary() {
  const bekleyenTahsilat = state.checks.filter((c) => c.durum === 'bekliyor').reduce((s, c) => s + c.tutar, 0);
  const bekleyenBorc = state.debts.filter((d) => d.durum === 'bekliyor').reduce((s, d) => s + d.tutar, 0);
  const bekleyenGelir = state.others.filter((o) => o.tur === 'gelir' && o.durum === 'bekliyor').reduce((s, o) => s + o.tutar, 0)
    + state.rents.filter((r) => r.tur === 'gelir' && r.durum === 'bekliyor').reduce((s, r) => s + r.tutar, 0);
  const bekleyenGider = state.others.filter((o) => o.tur === 'gider' && o.durum === 'bekliyor').reduce((s, o) => s + o.tutar, 0)
    + state.rents.filter((r) => r.tur === 'gider' && r.durum === 'bekliyor').reduce((s, r) => s + r.tutar, 0);

  const toplamGelecek = bekleyenTahsilat + bekleyenGelir;
  const toplamGidecek = bekleyenBorc + bekleyenGider;
  const net = toplamGelecek - toplamGidecek;

  const cards = document.getElementById('summaryCards');
  cards.innerHTML = `
    <div class="card">
      <h2>Toplam Gelecek Para</h2>
      <div class="stat positive">${money(toplamGelecek)}</div>
      <div class="stat-sub">Çek/senet + diğer gelirler (bekleyen)</div>
    </div>
    <div class="card">
      <h2>Toplam Gidecek Para</h2>
      <div class="stat negative">${money(toplamGidecek)}</div>
      <div class="stat-sub">Borçlar + diğer giderler (bekleyen)</div>
    </div>
    <div class="card">
      <h2>Net Durum</h2>
      <div class="stat ${net >= 0 ? 'positive' : 'negative'}">${money(net)}</div>
      <div class="stat-sub">Gelecek - Gidecek</div>
    </div>
  `;

  // Bu ay vadesi gelenler
  const now = new Date();
  const ymPrefix = now.toISOString().slice(0, 7);
  const allItems = [
    ...state.checks.map((c) => ({ ...c, kaynak: 'Çek/Senet', isim: c.kisi, yon: 'gelecek' })),
    ...state.debts.map((d) => ({ ...d, kaynak: 'Borç', isim: d.kisi, yon: 'gidecek' })),
    ...state.others.map((o) => ({ ...o, kaynak: o.tur === 'gelir' ? 'Diğer Gelir' : 'Diğer Gider', isim: o.aciklama, yon: o.tur === 'gelir' ? 'gelecek' : 'gidecek' })),
    ...state.rents.map((r) => ({ ...r, kaynak: r.tur === 'gelir' ? 'Kira Geliri' : 'Kira Ödemesi', isim: r.kisi, yon: r.tur === 'gelir' ? 'gelecek' : 'gidecek' })),
  ];

  const dueThisMonth = allItems
    .filter((i) => i.durum === 'bekliyor' && i.vade.startsWith(ymPrefix))
    .sort((a, b) => a.vade.localeCompare(b.vade));

  const dueBox = document.getElementById('dueThisMonth');
  dueBox.innerHTML = dueThisMonth.length
    ? dueThisMonth.map((i) => rowHtml(i)).join('')
    : '<div class="empty">Bu ay vadesi gelen kayıt yok.</div>';

  const overdue = allItems
    .filter((i) => isOverdue(i))
    .sort((a, b) => a.vade.localeCompare(b.vade));

  const overdueBox = document.getElementById('overdueList');
  overdueBox.innerHTML = overdue.length
    ? overdue.map((i) => rowHtml(i)).join('')
    : '<div class="empty">Geciken kayıt yok.</div>';
}

function rowHtml(i) {
  const sign = i.yon === 'gelecek' ? '+' : '-';
  const cls = i.yon === 'gelecek' ? 'positive' : 'negative';
  return `<div class="mini-row">
    <span>${escapeHtml(i.isim)} <small>(${i.kaynak})</small></span>
    <span class="${cls}">${sign}${money(i.tutar)} · ${formatDate(i.vade)}</span>
  </div>`;
}

// ---------- Cash flow (Nakit Akışı) ----------
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function renderCashFlow() {
  const allItems = [
    ...state.checks.map((c) => ({ tarih: c.vade, tutar: c.tutar, yon: 1, isim: c.kisi, kaynak: 'Çek/Senet', durum: c.durum })),
    ...state.debts.map((d) => ({ tarih: d.vade, tutar: d.tutar, yon: -1, isim: d.kisi, kaynak: 'Borç', durum: d.durum })),
    ...state.others.map((o) => ({ tarih: o.vade, tutar: o.tutar, yon: o.tur === 'gelir' ? 1 : -1, isim: o.aciklama, kaynak: o.tur === 'gelir' ? 'Gelir' : 'Gider', durum: o.durum })),
    ...state.rents.map((r) => ({ tarih: r.vade, tutar: r.tutar, yon: r.tur === 'gelir' ? 1 : -1, isim: r.kisi, kaynak: r.tur === 'gelir' ? 'Kira Geliri' : 'Kira Ödemesi', durum: r.durum })),
  ].sort((a, b) => a.tarih.localeCompare(b.tarih));

  const container = document.getElementById('cashFlowContainer');
  if (allItems.length === 0) {
    container.innerHTML = '<div class="empty">Henüz nakit akışı kaydı yok.</div>';
    return;
  }

  const groups = {};
  allItems.forEach((item) => {
    const key = item.tarih.slice(0, 7); // YYYY-MM
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  let cumulative = 0;
  const html = Object.keys(groups).sort().map((key) => {
    const [year, month] = key.split('-');
    const monthItems = groups[key];
    const monthTotal = monthItems.reduce((s, i) => s + i.yon * i.tutar, 0);
    cumulative += monthTotal;
    const rows = monthItems.map((i) => {
      const sign = i.yon > 0 ? '+' : '-';
      const cls = i.yon > 0 ? 'positive' : 'negative';
      return `<div class="mini-row">
        <span>${escapeHtml(i.isim)} <small>(${i.kaynak} · ${statusLabel(i.durum)})</small></span>
        <span class="${cls}">${sign}${money(i.tutar)} · ${formatDate(i.tarih)}</span>
      </div>`;
    }).join('');
    return `<div class="month-group">
      <h3><span>${AYLAR[parseInt(month, 10) - 1]} ${year}</span>
        <span class="${monthTotal >= 0 ? 'positive' : 'negative'}">Ay net: ${money(monthTotal)} · Kümülatif: ${money(cumulative)}</span>
      </h3>
      <div class="card">${rows}</div>
    </div>`;
  }).join('');

  container.innerHTML = html;
}

// ---------- Export / Import ----------
document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finans2027-yedek-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('importInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!confirm('Mevcut veriler yedek dosyasıyla değiştirilecek. Onaylıyor musun?')) return;
      state = {
        checks: parsed.checks || [],
        debts: parsed.debts || [],
        others: parsed.others || [],
        rents: parsed.rents || [],
      };
      saveData();
      renderAll();
    } catch (err) {
      alert('Dosya okunamadı, geçerli bir yedek JSON dosyası seç.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

// ---------- Defaults ----------
['checkForm', 'debtForm', 'otherForm', 'rentForm'].forEach((id) => {
  const form = document.getElementById(id);
  if (form.elements.vade) form.elements.vade.value = '2027-01-01';
});

function renderAll() {
  renderChecks();
  renderDebts();
  renderOthers();
  renderRents();
  renderSummary();
  renderCashFlow();
}

renderAll();
