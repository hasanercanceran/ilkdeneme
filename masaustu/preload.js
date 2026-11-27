const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('finans', {
  oku: () => ipcRenderer.sendSync('veri:oku'),
  yaz: (icerik) => ipcRenderer.invoke('veri:yaz', icerik),
  bozukAyir: () => ipcRenderer.sendSync('veri:bozuk'),
  dosyaKaydet: (secenek) => ipcRenderer.invoke('dosya:kaydet', secenek),
  dosyaAc: () => ipcRenderer.invoke('dosya:ac'),
  pdf: (ad) => ipcRenderer.invoke('rapor:pdf', ad),
  klasorAc: () => ipcRenderer.invoke('klasor:ac'),
});
