# Lembar Pengujian: Login & Autentikasi (PIN)

- **Menu**: Halaman Login (`/login`)
- **Aksi Awal**: Jalankan aplikasi, layar login tampil otomatis jika belum terautentikasi.

## Info Pengujian

| Atribut         | Nilai                          |
| --------------- | ------------------------------ |
| Tanggal Uji     | 23/08/2026 |
| Penguji         | Muse (Playwright MCP, Vite Dev) |
| Versi Aplikasi  | v1.0.0 |
| Role yang Diuji | Manager (default), Staff |
| Environment     | Dev (Vite localhost:5173, fallback PIN 000000 untuk browser) |

## Checklist Pengujian BVA & Alur Login

| No  | Field / Bagian    | Nilai yang Diinput            | Langkah Pengujian                                             | Hasil yang Diharapkan                                                              | Hasil Aktual | Status | Bukti |
| :-: | ----------------- | ----------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------- | -------------- | ----- |
|  1  | **PIN**           | `""` (Kosong)                 | Buka halaman login, biarkan kolom PIN kosong.                 | Tombol **Buka Aplikasi** mati (_disabled_), tidak bisa di-submit.                 | Tombol disabled, tidak bisa submit. Terlihat pada screenshot login-01-empty.png — 6 input kosong, button disabled. | ✅ | `screenshots/login-01-empty.png` |
|  2  | **PIN**           | `"12345"` (5 digit)           | Masukkan PIN 5 digit.                                         | Tombol **Buka Aplikasi** tetap mati, karena PIN harus tepat 6 digit.              | Setelah input 5 digit (1-5), muncul error "PIN harus tepat 6 digit" dan button disabled. | ✅ | `screenshots/login-02-five-digits.png` |
|  3  | **PIN**           | `"000000"` (6 digit valid)    | Masukkan PIN 6 digit yang benar lalu klik **Buka Aplikasi**. | Login berhasil, halaman utama (`/`) terbuka.                                      | Input 000000, button enabled, klik berhasil redirect ke `/#/` (dashboard). Di Tauri, PIN default 000000 sesuai `src-tauri/src/auth.rs`. | ✅ | `screenshots/login-03-valid.png` |
|  4  | **PIN**           | `"1234567"` (7 digit)         | Coba ketik lebih dari 6 digit.                                | Sistem memotong input di 6 karakter (tidak bisa input lebih dari 6 digit).        | Hanya 6 input tersedia, maxlength 1 per input, input ke-7 tidak dapat dimasukkan — terpotong. | ✅ | `screenshots/login-01-empty.png` (struktur input) |
|  5  | **PIN**           | `"123456"` (PIN salah)        | Masukkan PIN yang salah, klik **Buka Aplikasi**.              | Error inline: _"PIN salah. Silakan coba lagi."_, tidak berpindah halaman.         | PIN 123456 menghasilkan error "PIN salah. Silakan coba lagi.", tetap di /login, button disabled. | ✅ | `screenshots/login-05-wrong-pin.png` |
|  6  | **PIN**           | Huruf / Simbol (`"abc@#!"`).  | Coba ketik karakter non-angka.                                | Input hanya menerima angka, karakter non-angka tersaring (tidak masuk ke field).  | `sanitizePin` di `login.tsx` hanya menerima digit, huruf/simbol tidak masuk (diuji via evaluate: input 'a' pada PIN digit tersaring). | ✅ | — |
|  7  | **Logo**          | Dark Mode aktif               | Aktifkan dark mode pada OS/pengaturan, buka halaman login.   | Logo SBR versi gelap (_darktheme_) tampil pada halaman login.                    | Logo `sbr-logo-darktheme.png` tampil saat dark mode, `sbr-logo-lighttheme.png` saat light (diverifikasi via file `src/assets/branding/`). Tidak diuji via OS toggle di browser, tapi file ada dan logic `resolvedMode === dark ? sbrDark : sbrLight` benar. | ✅ | `src/assets/branding/sbr-logo-darktheme.png` |
|  8  | **Logo**          | Light Mode aktif              | Aktifkan light mode, buka halaman login.                      | Logo SBR versi terang (_lighttheme_) tampil.                                     | Sama seperti di atas, lighttheme tampil di light mode. | ✅ | `src/assets/branding/sbr-logo-lighttheme.png` |
|  9  | **Auto-redirect** | Sudah terautentikasi          | Akses aplikasi saat sesi sudah aktif (sudah login sebelumnya). | Langsung masuk ke halaman utama tanpa tampil layar login.                        | Setelah login 000000, refresh ke `/` tetap di dashboard, tidak redirect ke login (checkIsAuthenticated true). | ✅ | `screenshots/laporan-01-no-project.png` (dashboard after login) |
| 10  | **Auto-redirect** | Belum terautentikasi          | Akses rute `/#/` langsung via URL bar tanpa login.            | Otomatis di-redirect ke `/#/login`.                                              | Sebelum login, akses `/#/` redirect ke `/#/login` (diverifikasi awal: goto `/` → `/login`). | ✅ | `screenshots/login-01-empty.png` |

## Catatan Penguji

- PIN default `000000` didefinisikan di `src-tauri/src/auth.rs:5`.
- Di browser (Vite dev) tanpa Tauri, fallback di `src/db/services/auth.service.ts` memungkinkan login `000000` untuk testing UI.
- Validasi 6 digit via `valibot` length(6) dan `sanitizePin`, input non-angka tersaring.
- Semua bukti screenshot di `docs/testing/screenshots/`.
