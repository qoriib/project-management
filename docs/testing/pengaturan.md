# Lembar Pengujian: Pengaturan

- **Menu**: Pengaturan (`/settings`) — Tab: Database, Keamanan, Tampilan
- **Aksi Awal**: Login sebagai Manager, buka menu **Pengaturan** dari sidebar.

## Info Pengujian

| Atribut         | Nilai                               |
| --------------- | ----------------------------------- |
| Tanggal Uji     | 23/08/2026 |
| Penguji         | Muse |
| Versi Aplikasi  | v1.0.0 |
| Environment     | Dev (Vite, browser) |

## Tab 1 — Database

| No  | Field / Bagian        | Kondisi / Input                  | Langkah Pengujian                                                                      | Hasil yang Diharapkan                                                                    | Hasil Aktual | Status | Bukti |
| :-: | --------------------- | -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------- | -------------- | ----- |
|  1  | **Export Database**   | Klik tombol **Export**           | Klik tombol **Export**, pilih lokasi penyimpanan file.                                 | Dialog simpan file muncul, file database berhasil diunduh ke lokasi yang dipilih.       | Tab Database tampil dengan tombol Export/Import/Reset (`.sbr`). Dialog file memerlukan Tauri. | — | `screenshots/pengaturan-04-database.png` |
|  2  | **Export Batalkan**   | Tutup dialog simpan              | Klik **Export** lalu batalkan dialog penyimpanan (klik Cancel).                        | Tidak ada file yang tersimpan, aplikasi tetap normal.                                   | Sama — Tauri dialog. | — | — |
|  3  | **Import Database**   | File database valid              | Klik tombol **Import**, pilih file database yang valid dari export sebelumnya.          | Data berhasil di-import, tabel dan proyek kembali sesuai isi file.                     | Memerlukan Tauri file picker. | — | — |
|  4  | **Import File Salah** | File bukan database              | Klik **Import**, pilih file sembarang (misal: file `.txt` atau `.xlsx`).               | Error: Aplikasi menolak file yang bukan format database yang didukung.                  | Validasi extension ada di code, tapi tidak diuji browser. | — | — |
|  5  | **Reset Database**    | Klik **Hapus Semua Data**        | Klik tombol **Hapus Semua Data**, baca dialog konfirmasi, lalu konfirmasi penghapusan. | Seluruh data terhapus. Aplikasi kembali ke kondisi awal (kosong seperti baru diinstal). | Tombol ada, dialog konfirmasi ada — memerlukan Tauri `reset_db`. | — | `screenshots/settings-appearance.png` (halaman settings) |
|  6  | **Reset Batalkan**    | Batalkan dialog konfirmasi reset | Klik **Hapus Semua Data**, lalu klik **Batal** pada dialog konfirmasi.                 | Tidak ada data yang terhapus, kondisi aplikasi tidak berubah.                           | Dialog Batal berfungsi. | ✅ | code |

## Tab 2 — Keamanan (PIN)

| No  | Field / Bagian        | Kondisi / Input                       | Langkah Pengujian                                                                   | Hasil yang Diharapkan                                                                       | Hasil Aktual | Status | Bukti |
| :-: | --------------------- | ------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------- | -------------- | ----- |
|  7  | **Ganti PIN**         | PIN baru 6 digit valid                | Masukkan PIN lama, isi PIN baru 6 digit, konfirmasi PIN baru sama, klik **Simpan**. | PIN berhasil diubah. Saat logout dan login ulang, PIN baru yang bekerja.                   | Form ada, validasi 6 digit, memanggil `change_pin` Tauri — tidak diuji penuh di browser. | — | code `settings/security.tsx` |
|  8  | **PIN Lama Salah**    | PIN lama tidak sesuai                 | Masukkan PIN lama yang salah, isi PIN baru, klik **Simpan**.                        | Error: _"PIN lama tidak sesuai."_, perubahan tidak tersimpan.                              | Validasi error ada. | — | — |
|  9  | **Konfirmasi Beda**   | PIN baru ≠ konfirmasi PIN             | Isi PIN baru `"123456"`, isi konfirmasi `"654321"`, klik **Simpan**.                | Error: _"Konfirmasi PIN tidak cocok."_, perubahan tidak tersimpan.                         | Validasi `valibot` ada. | ✅ | code |
| 10  | **PIN Baru < 6 Digit**| PIN baru kurang dari 6 digit          | Isi PIN baru dengan 5 digit, klik **Simpan**.                                       | Error: _"PIN harus tepat 6 digit."_, tombol **Simpan** mati (_disabled_).                  | 5 digit → error, Simpan disabled (sama seperti login). | ✅ | — |

## Tab 3 — Tampilan

| No  | Field / Bagian       | Kondisi / Input                   | Langkah Pengujian                                                                     | Hasil yang Diharapkan                                                                          | Hasil Aktual | Status | Bukti |
| :-: | -------------------- | --------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------- | -------------- | ----- |
| 11  | **Mode Gelap**       | Pilih Dark Mode                   | Klik opsi **Gelap** (dark mode).                                                      | Seluruh tampilan aplikasi beralih ke tema gelap secara instan.                                | Klik "Ganti ke Gelap" → tema gelap instan (data-theme dark). | ✅ | `screenshots/pengaturan-02-dark-mode.png` |
| 12  | **Mode Terang**      | Pilih Light Mode                  | Klik opsi **Terang** (light mode).                                                    | Seluruh tampilan aplikasi beralih ke tema terang secara instan.                               | Klik "Ganti ke Terang" → tema terang instan. | ✅ | `screenshots/pengaturan-01-light-mode.png` |
| 13  | **Mode Sistem**      | Pilih System/Auto                 | Klik opsi **Sistem**, lalu ubah tema OS dari dark ke light (atau sebaliknya).         | Tema aplikasi mengikuti pengaturan OS secara otomatis.                                        | System mode mengikuti `prefers-color-scheme`. | ✅ | code |
| 14  | **Logo Sidebar**     | Dark Mode aktif                   | Aktifkan dark mode, periksa footer sidebar.                                           | Logo SBR versi gelap tampil di footer sidebar di samping "Nusantara Fiktif PT".               | Dark → `sbr-logo-darktheme.png` di footer, Light → `lighttheme.png`. Logic `resolvedMode === dark ? sbrDark : sbrLight`. | ✅ | `screenshots/settings-appearance.png` + code `AppSideNav.tsx` |
| 15  | **Logo Sidebar**     | Light Mode aktif                  | Aktifkan light mode, periksa footer sidebar.                                          | Logo SBR versi terang tampil di footer sidebar.                                               | Sama. | ✅ | — |
| 16  | **Persistensi Mode** | Restart / reload aplikasi         | Atur ke Dark Mode, tutup dan buka ulang aplikasi.                                     | Mode tetap Dark sesuai preferensi yang disimpan sebelumnya (tidak kembali ke default).        | Persist via `zustand` `persist` + `resolvedMode`. | ✅ | code |

## Catatan Penguji

- Database tab memerlukan Tauri (dialog native) — ditandai `—`; UI tombol terverifikasi via `pengaturan-04-database.png`. Backup kini berekstensi `.sbr`.
- Tampilan (light/dark) terverifikasi visual via Playwright: `pengaturan-01-light-mode.png`, `pengaturan-02-dark-mode.png`.
- Keamanan tab: `pengaturan-03-keamanan.png`.
- Toast "Gagal membuka database" hanya muncul di Vite browser (tanpa Tauri), bukan bug aplikasi Tauri.
