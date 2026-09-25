# SIRATSI

Sistem Kolaborasi Keamanan Laut Ditpolairud Polda Lampung. Aplikasi memakai MySQL Lerd untuk data operasional dan menyimpan berkas unggahan di `storage/siratsi`.

## Prasyarat

- Node.js 22 atau lebih baru
- Lerd dengan layanan MySQL aktif

## Menjalankan secara lokal

1. Pasang dependensi:

   ```bash
   npx --yes pnpm@11.25.0 install --fetch-timeout 120000 --fetch-retries 3 --network-concurrency 1
   ```

2. Salin `.env.example` menjadi `.env`, lalu isi nilai koneksi MySQL. Saat Node dijalankan dari host, layanan MySQL Lerd menggunakan `DB_HOST=127.0.0.1` dan `DB_PORT=3306`.

3. Pastikan MySQL Lerd berjalan dan inisialisasi tabel:

   ```bash
   lerd service start mysql --no-pull
   npm run db:setup
   ```

4. Jalankan aplikasi:

   ```bash
   npm run dev -- --port 5180
   ```

   Buka `http://127.0.0.1:5180/`.

## Perintah

- `npm run dev -- --port 5180` — server pengembangan
- `npm run db:setup` — membuat database dan tabel bila belum ada
- `npm run db:generate` — menghasilkan migrasi Drizzle MySQL setelah perubahan skema
- `npm run build` — membangun aplikasi
- `npm run start` — menjalankan hasil build

## Penyimpanan data

Data kasus, pengguna, sesi, persetujuan, dan notifikasi berada di MySQL. Foto bukti dan dokumen disimpan secara lokal pada `storage/siratsi`; direktori tersebut sebaiknya dicadangkan bersama database.
# siratsi
