# 9909 — Resep & Informed Consent

Aplikasi Next.js siap deploy ke Vercel. Kunci OpenAI hanya digunakan di server dan tidak pernah dikirim ke browser. Passcode meminta sesi bertanda tangan (cookie HttpOnly, masa berlaku 12 jam).

## Sebelum dipakai

1. Siapkan API key OpenAI dari [platform.openai.com/api-keys](https://platform.openai.com/api-keys) dan pastikan billing API aktif. ChatGPT Plus/Pro tidak otomatis mencakup kredit API.
2. Buat nilai acak panjang untuk `SESSION_SECRET` (minimal 32 karakter). Di PowerShell, jalankan `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` lalu salin hasilnya.
3. Jangan masukkan `OPENAI_API_KEY` ke kode atau commit GitHub. Masukkan sebagai Environment Variable di Vercel.

## Deploy repo GitHub yang sudah diberikan

1. Buka [github.com/ingridrcl/9909](https://github.com/ingridrcl/9909). Folder proyek yang saya siapkan sudah memiliki commit lokal dan remote `origin` menuju repo tersebut. Dari PowerShell, jika memakai folder proyek ini, cukup jalankan:

   ```powershell
   cd "C:\Users\ingri\Documents\Codex\2026-10-20\buatkan-saya-1-web-app-dari\outputs\9909"
   git push -u origin main
   ```

   Jika GitHub meminta login, selesaikan autentikasi di komputer Anda lalu ulangi perintah tersebut. Alternatifnya, ekstrak ZIP dan unggah file-file di dalamnya ke root repository melalui **Add file → Upload files**. Jika repo ternyata sudah memiliki file/commit, clone repo terlebih dahulu, salin file aplikasi ke folder clone, lalu `git add .`, `git commit`, dan `git push`.
3. Masuk ke [vercel.com/new](https://vercel.com/new) dan pilih **Continue with GitHub**. Beri Vercel akses ke repo `ingridrcl/9909`, lalu klik **Import**.
4. Framework preset akan terdeteksi sebagai **Next.js**. Root Directory biarkan `./` jika file `package.json` berada di root repo.
5. Pada **Environment Variables**, tambahkan ke Production (dan Preview bila diperlukan):

   | Name | Value |
   | --- | --- |
   | `OPENAI_API_KEY` | API key OpenAI Anda |
   | `OPENAI_MODEL` | `gpt-4o-mini` |
   | `APP_PASSCODE` | `2202` |
   | `SESSION_SECRET` | nilai acak panjang yang dibuat di langkah 2 |

6. Klik **Deploy**. Setelah selesai, buka URL `.vercel.app` yang diberikan dan uji masuk dengan passcode `2202`.
7. Setiap kali melakukan perubahan dan push ke branch `main`, Vercel akan membuat deployment baru otomatis.

## Menjalankan secara lokal

Pasang Node.js LTS, lalu dari direktori aplikasi:

```powershell
npm install
Copy-Item .env.example .env.local
```

Edit `.env.local`, isi `OPENAI_API_KEY` dan ubah `SESSION_SECRET` dengan nilai acak yang berbeda. Kemudian:

```powershell
npm run dev
```

Buka `http://localhost:3000`. Jalankan `npm run build` untuk memeriksa build produksi sebelum deploy.

## Cara penggunaan

- **Resep:** dua field tersedia sejak awal. Tambah field dengan **Tambah resep**. Gunakan **Convert resep** pada masing-masing kartu, atau **Convert all** untuk semua field yang terisi. Hasil dapat disalin.
- **Informed Consent:** diagnosis opsional (jika kosong, hasilnya tetap kosong); nama tindakan wajib. Hasil berisi 10 field dan dapat diedit/disalin. Diagnosis serta cara diagnosis diisi sesuai ketentuan tetap aplikasi.
- Seluruh hasil Informed Consent merupakan draft AI yang harus diverifikasi dokter penanggung jawab sebelum dipakai.

## Mengubah passcode atau model

Ubah `APP_PASSCODE` atau `OPENAI_MODEL` di **Vercel → Project → Settings → Environment Variables**, lalu redeploy agar perubahan berlaku. Passcode tidak ditanam di kode sumber.

## Catatan keamanan

Passcode `2202` mudah ditebak. Untuk penggunaan di internet, ubah ke passcode yang lebih kuat sebelum membagikan URL. Ganti `SESSION_SECRET` dengan nilai acak unik. Proteksi passcode ini adalah gerbang akses aplikasi sederhana, bukan akun per pengguna atau sistem audit rumah sakit. Jangan masukkan identitas pasien atau informasi yang dapat mengidentifikasi pasien. Periksa juga kebijakan retensi dan penggunaan data API OpenAI sebelum memasukkan data klinis.
