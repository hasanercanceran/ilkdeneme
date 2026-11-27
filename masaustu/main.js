const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const fs = require('fs');
const path = require('path');

const VERI_KLASORU = path.join(app.getPath('documents'), 'Finans Takip 2027');
const VERI_DOSYASI = path.join(VERI_KLASORU, 'finans2027-veri.json');
const YEDEK_KLASORU = path.join(VERI_KLASORU, 'otomatik-yedekler');

let pencere;

const KAYIT_DOSYASI = path.join(VERI_KLASORU, 'baslangic-kaydi.log');

function kayit(mesaj) {
  try {
    fs.mkdirSync(VERI_KLASORU, { recursive: true });
    fs.appendFileSync(KAYIT_DOSYASI, `${new Date().toISOString()} ${mesaj}\n`);
  } catch (err) {}
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

function yedekAl() {
  if (!fs.existsSync(VERI_DOSYASI)) return;
  fs.mkdirSync(YEDEK_KLASORU, { recursive: true });
  const gun = new Date().toISOString().slice(0, 10);
  const hedef = path.join(YEDEK_KLASORU, `finans2027-${gun}.json`);
  if (!fs.existsSync(hedef)) fs.copyFileSync(VERI_DOSYASI, hedef);
}

ipcMain.on('veri:oku', (e) => {
  try {
    e.returnValue = fs.existsSync(VERI_DOSYASI) ? fs.readFileSync(VERI_DOSYASI, 'utf-8') : null;
  } catch (err) {
    e.returnValue = null;
  }
});

ipcMain.on('veri:yaz', (e, icerik) => {
  try {
    fs.mkdirSync(VERI_KLASORU, { recursive: true });
    const gecici = VERI_DOSYASI + '.tmp';
    fs.writeFileSync(gecici, icerik, 'utf-8');
    fs.renameSync(gecici, VERI_DOSYASI);
    e.returnValue = true;
  } catch (err) {
    dialog.showErrorBox('Kayıt hatası', 'Veriler diske yazılamadı:\n' + err.message);
    e.returnValue = false;
  }
});

ipcMain.on('veri:bozuk', (e) => {
  try {
    const hedef = VERI_DOSYASI.replace('.json', `.bozuk-${Date.now()}.json`);
    fs.renameSync(VERI_DOSYASI, hedef);
  } catch (err) {}
  e.returnValue = true;
});

ipcMain.on('veri:yol', (e) => {
  e.returnValue = VERI_DOSYASI;
});

ipcMain.on('dialog:onay', (e, mesaj) => {
  const secim = dialog.showMessageBoxSync(pencere, {
    type: 'question',
    buttons: ['Evet', 'Hayır'],
    defaultId: 1,
    cancelId: 1,
    title: 'Onay',
    message: mesaj,
  });
  e.returnValue = secim === 0;
});

ipcMain.on('dialog:uyari', (e, mesaj) => {
  dialog.showMessageBoxSync(pencere, { type: 'warning', buttons: ['Tamam'], title: 'Uyarı', message: mesaj });
  e.returnValue = true;
});

function pencereOlustur() {
  pencere = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 760,
    minHeight: 560,
    title: 'Finans Takip 2027',
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  pencere.webContents.on('did-fail-load', (e, kod, aciklama) => kayit(`Sayfa yüklenemedi: ${kod} ${aciklama}`));
  pencere.webContents.on('render-process-gone', (e, ayrinti) => kayit('Arayüz çöktü: ' + JSON.stringify(ayrinti)));
  pencere.loadFile(path.join(__dirname, '..', 'index.html')).then(() => kayit('Pencere açıldı'));
}

app.whenReady().then(() => {
  kayit('Program başlatılıyor, sürüm ' + app.getVersion());
  Menu.setApplicationMenu(null);
  yedekAl();
  pencereOlustur();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) pencereOlustur();
  });
});

app.on('window-all-closed', () => app.quit());
