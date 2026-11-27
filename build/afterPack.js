const fs = require('fs');
const path = require('path');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return;
  try {
    const ResEdit = require('resedit');
    const exe = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`);
    const nt = ResEdit.NtExecutable.from(fs.readFileSync(exe));
    const res = ResEdit.NtExecutableResource.from(nt);
    const ico = ResEdit.Data.IconFile.from(fs.readFileSync(path.join(__dirname, 'icon.ico')));
    const gruplar = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
    const hedefler = gruplar.length ? gruplar.map((g) => ({ id: g.id, lang: g.lang })) : [{ id: 1, lang: 1033 }];
    hedefler.forEach((g) => ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, g.id, g.lang, ico.icons.map((i) => i.data)));
    const vi = ResEdit.Resource.VersionInfo.fromEntries(res.entries)[0];
    if (vi) {
      const surum = context.packager.appInfo.version;
      const [a, b, c] = surum.split('.').map((x) => parseInt(x, 10) || 0);
      vi.setFileVersion(a, b, c, 0, 1033);
      vi.setProductVersion(a, b, c, 0, 1033);
      vi.setStringValues({ lang: 1033, codepage: 1200 }, {
        FileDescription: 'Finans Takip', ProductName: 'Finans Takip', CompanyName: 'Finans Takip', LegalCopyright: '',
        OriginalFilename: 'Finans Takip.exe', InternalName: 'Finans Takip', FileVersion: surum, ProductVersion: surum,
      });
      vi.outputToResourceEntries(res.entries);
    }
    res.outputResource(nt);
    fs.writeFileSync(exe, Buffer.from(nt.generate()));
    console.log('  • exe simgesi ve sürüm bilgisi güncellendi');
  } catch (err) {
    console.warn('  • exe simgesi güncellenemedi:', err.message);
  }
};
