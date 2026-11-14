# Cara penggunaan

- **Resep:** Dua field tersedia sejak awal. Tambah field dengan **Tambah resep**. Pilih **Convert resep** untuk memproses satu resep atau **Convert all** untuk semua field yang terisi. Salin hasil dengan ikon copy.
- **Informed Consent:** Masukkan nama tindakan; diagnosis boleh dikosongkan. Pilih **Buat template persetujuan** untuk menghasilkan 10 field. Hasil dapat diedit dan disalin.
- Diagnosis mengikuti input, dan cara diagnosis diisi otomatis dengan “Anamnesis, pemeriksaan fisik, pemeriksaan penunjang”.
- **Assessment Awal:** Unggah workbook Excel (`.xlsx`/`.xls`) dengan baris pertama sebagai judul kolom dan satu pasien per baris. Pilih **Sebelumnya/Berikutnya** untuk berpindah pasien. Salin nilai per field atau seluruh bagian anamnesis, pemeriksaan umum, maupun pemeriksaan penunjang dan rencana. File dibaca di browser dan tidak dikirim ke server.
- **Assessment dari teks:** Tempel catatan SOAP, asesmen IGD, atau teks rekam medis, lalu pilih **Proses teks**. Data dipetakan ke field yang sama melalui OpenAI API; teks dikirim ke API, jadi pastikan `OPENAI_API_KEY` tersedia. Terapi DPJP diprioritaskan; terapi IGD digunakan bila terapi DPJP tidak ada. Status gizi diisi Sedang, lab/radiologi Terlampir, dan temuan fisik normal dibiarkan kosong.
- Selama tab **Assessment Awal** terbuka, sesi diperpanjang otomatis. Saat menggunakan tab lain, batas sesi normal lima menit berlaku.
