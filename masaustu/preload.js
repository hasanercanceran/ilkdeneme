const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('finansDisk', {
  oku: () => ipcRenderer.sendSync('veri:oku'),
  yaz: (icerik) => ipcRenderer.sendSync('veri:yaz', icerik),
  bozukDosyayiAyir: () => ipcRenderer.sendSync('veri:bozuk'),
  yol: () => ipcRenderer.sendSync('veri:yol'),
  onay: (mesaj) => ipcRenderer.sendSync('dialog:onay', mesaj),
  uyari: (mesaj) => ipcRenderer.sendSync('dialog:uyari', mesaj),
});
