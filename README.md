# ™®RD♥ DJ Maker

Vercel-ready browser DJ maker.

## Deploy ke Vercel lewat GitHub
1. Buat repository baru di GitHub.
2. Upload semua isi folder ini.
3. Buka Vercel.
4. Pilih **Add New → Project**.
5. Import repository GitHub tersebut.
6. Framework Preset: **Other**.
7. Build Command: kosongkan.
8. Output Directory: `.` 
9. Klik **Deploy**.

Tidak membutuhkan API key atau database untuk fitur dasar. Audio diproses lokal di browser pengguna.

## Fitur
- Upload audio
- Preset CLUB / NIGHT / HARD / CHILL
- Bass, Treble, Echo, Width, Energy, Speed
- Waveform
- Preview DJ
- Export WAV
- Responsive untuk Android, iPhone, dan desktop

Catatan: versi ini adalah client-side audio processor. Untuk fitur DJ yang lebih canggih seperti beat detection, auto drop, vocal isolation, time-stretch tanpa mengubah pitch, dan mastering yang lebih kompleks, dapat ditambahkan engine DSP/WebAssembly pada tahap berikutnya.
