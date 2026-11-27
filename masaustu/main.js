const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const fs = require('fs');
const path = require('path');

const BELGELER = app.getPath('documents');
const KLASOR = path.join(BELGELER, 'Finans Takip');
const DOSYA = path.join(KLASOR, 'finans-takip-veri.json');
const YEDEK_KLASORU = path.join(KLASOR, 'otomatik-yedekler');
const ESKI_DOSYA = path.join(BELGELER, 'Finans Takip 2027', 'finans2027-veri.json');
const KAYIT_DOSYASI = path.join(KLASOR, 'baslangic-kaydi.log');

let pencere;

function kayit(mesaj) {
  try {
    fs.mkdirSync(KLASOR, { recursive: true });
    fs.appendFileSync(KAYIT_DOSYASI, `${new Date().toISOString()} ${mesaj}\n`);
  } catch (err) {}
}

function yerelGun() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function gunlukYedek() {
  if (!fs.existsSync(DOSYA)) return;
  fs.mkdirSync(YEDEK_KLASORU, { recursive: true });
  const hedef = path.join(YEDEK_KLASORU, `veri-${yerelGun()}.json`);
  if (fs.existsSync(hedef)) return;
  fs.copyFileSync(DOSYA, hedef);
  const eskiler = fs.readdirSync(YEDEK_KLASORU).filter((d) => d.startsWith('veri-')).sort();
  while (eskiler.length > 60) fs.unlinkSync(path.join(YEDEK_KLASORU, eskiler.shift()));
}

process.on('uncaughtException', (err) => {
  kayit('HATA: ' + (err && err.stack ? err.stack : err));
  dialog.showErrorBox('Program hatası', String(err && err.message ? err.message : err));
});

app.disableHardwareAcceleration();

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (pencere) {
      if (pencere.isMinimized()) pencere.restore();
      pencere.focus();
    }
  });
}

ipcMain.on('veri:oku', (e) => {
  let yeni = null;
  let eski = null;
  try {
    if (fs.existsSync(DOSYA)) yeni = fs.readFileSync(DOSYA, 'utf-8');
    else if (fs.existsSync(ESKI_DOSYA)) eski = fs.readFileSync(ESKI_DOSYA, 'utf-8');
  } catch (err) {
    kayit('Okuma hatası: ' + err.message);
  }
  e.returnValue = { yeni, eski, yol: DOSYA };
});

ipcMain.handle('veri:yaz', (e, icerik) => {
  try {
    fs.mkdirSync(KLASOR, { recursive: true });
    gunlukYedek();
    const gecici = DOSYA + '.tmp';
    fs.writeFileSync(gecici, icerik, 'utf-8');
    fs.renameSync(gecici, DOSYA);
    return { tamam: true };
  } catch (err) {
    kayit('Yazma hatası: ' + err.message);
    return { tamam: false, hata: err.message };
  }
});

ipcMain.on('veri:bozuk', (e) => {
  try {
    fs.renameSync(DOSYA, DOSYA.replace('.json', `.bozuk-${Date.now()}.json`));
  } catch (err) {}
  e.returnValue = true;
});

ipcMain.handle('dosya:kaydet', async (e, { ad, icerik, filtreAd, uzanti, bom }) => {
  const r = await dialog.showSaveDialog(pencere, {
    defaultPath: path.join(BELGELER, ad),
    filters: [{ name: filtreAd || 'Dosya', extensions: [uzanti] }],
  });
  if (r.canceled || !r.filePath) return null;
  fs.writeFileSync(r.filePath, (bom ? '﻿' : '') + icerik, 'utf-8');
  return r.filePath;
});

ipcMain.handle('dosya:ac', async () => {
  const r = await dialog.showOpenDialog(pencere, { properties: ['openFile'], filters: [{ name: 'Yedek (JSON)', extensions: ['json'] }] });
  if (r.canceled || !r.filePaths[0]) return null;
  return fs.readFileSync(r.filePaths[0], 'utf-8');
});

ipcMain.handle('rapor:pdf', async (e, ad) => {
  const veri = await pencere.webContents.printToPDF({ printBackground: true, landscape: true, pageSize: 'A4' });
  const r = await dialog.showSaveDialog(pencere, { defaultPath: path.join(BELGELER, ad || 'rapor.pdf'), filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  if (r.canceled || !r.filePath) return null;
  fs.writeFileSync(r.filePath, veri);
  return r.filePath;
});

ipcMain.handle('klasor:ac', async () => {
  fs.mkdirSync(KLASOR, { recursive: true });
  return shell.openPath(KLASOR);
});

function menuKur() {
  const sablon = [
    { label: 'Dosya', submenu: [{ label: 'Yazdır…', accelerator: 'CmdOrCtrl+P', click: () => pencere.webContents.print() }, { type: 'separator' }, { label: 'Çıkış', role: 'quit' }] },
    { label: 'Düzen', submenu: [{ role: 'undo', label: 'Geri Al' }, { role: 'redo', label: 'Yinele' }, { type: 'separator' }, { role: 'cut', label: 'Kes' }, { role: 'copy', label: 'Kopyala' }, { role: 'paste', label: 'Yapıştır' }, { role: 'selectAll', label: 'Tümünü Seç' }] },
    { label: 'Görünüm', submenu: [{ role: 'zoomIn', label: 'Yakınlaştır' }, { role: 'zoomOut', label: 'Uzaklaştır' }, { role: 'resetZoom', label: 'Normal Boyut' }, { type: 'separator' }, { role: 'togglefullscreen', label: 'Tam Ekran' }, { role: 'toggleDevTools', label: 'Geliştirici Araçları' }] },
    {
      label: 'Yardım',
      submenu: [
        { label: 'Veri Klasörünü Aç', click: () => shell.openPath(KLASOR) },
        { label: 'Hakkında', click: () => dialog.showMessageBox(pencere, { type: 'info', title: 'Hakkında', message: 'Finans Takip', detail: `Sürüm ${app.getVersion()}\nÇek/senet, borç, kira ve nakit akışı takip programı.\n\nVeri dosyası:\n${DOSYA}`, buttons: ['Tamam'] }) },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(sablon));
}

function pencereOlustur() {
  pencere = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1040,
    minHeight: 640,
    title: 'Finans Takip',
    backgroundColor: '#0b1f4a',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false },
  });
  pencere.once('ready-to-show', () => pencere.show());
  setTimeout(() => pencere && !pencere.isVisible() && pencere.show(), 4000);
  pencere.webContents.on('did-fail-load', (e, kod, aciklama) => kayit(`Sayfa yüklenemedi: ${kod} ${aciklama}`));
  pencere.webContents.on('render-process-gone', (e, ayrinti) => kayit('Arayüz çöktü: ' + JSON.stringify(ayrinti)));
  pencere.webContents.on('console-message', (e, seviye, mesaj, satir, kaynak) => {
    if (seviye >= 2) kayit(`Arayüz hatası: ${mesaj} (${kaynak}:${satir})`);
  });
  pencere.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  pencere.loadFile(path.join(__dirname, '..', 'src', 'index.html')).then(() => kayit('Pencere açıldı'));
}

app.whenReady().then(() => {
  kayit('Program başlatılıyor, sürüm ' + app.getVersion());
  menuKur();
  pencereOlustur();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) pencereOlustur();
  });
});

app.on('window-all-closed', () => app.quit());
