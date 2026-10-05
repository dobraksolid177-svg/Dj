# ™®RD♥ DJ Maker — Fixed Vercel Version

Versi ini memperbaiki tampilan yang menjadi HTML polos saat `style.css` tidak ikut ter-deploy. `index.html` sekarang sudah membawa CSS dan JavaScript di dalam file, sehingga aman untuk deploy sebagai static site di Vercel.

Perbaikan utama:
- Tampilan mobile/DJ kembali normal.
- Preview DJ benar-benar tersambung ke output audio.
- Export WAV memakai jalur efek DJ, bukan audio mentah.
- Slider speed diterapkan saat preview/export.
- Waveform bisa disentuh untuk seek.
- Tetap 100% client-side, tanpa database/API.

## Deploy ke Vercel
1. Upload seluruh isi folder ini ke GitHub.
2. Vercel → Add New → Project → Import repository.
3. Framework Preset: Other.
4. Build Command: kosong.
5. Output Directory: `.`
6. Deploy.

Gunakan hanya audio yang kamu punya izin untuk edit.
