# Kebijakan Privasi PesanBotol

Template operasional: isi nama pengelola, email bantuan, tanggal berlaku, dan
jangka retensi transaksi sebelum menerbitkan dokumen ini pada URL HTTPS publik.
Tinjau agar sesuai dengan praktik layanan yang benar-benar dijalankan.

## Data yang diproses

PesanBotol menggunakan email dan autentikasi Supabase untuk akun, isi cerita dan
balasan untuk fitur botol, serta laporan dan daftar blokir untuk moderasi.
Identitas penulis tidak ditampilkan dalam pembacaan cerita publik. Moderator
tetap memiliki akses administratif untuk menangani penyalahgunaan.

Firebase Cloud Messaging memproses token perangkat Android untuk notifikasi.
Isi notifikasi bersifat umum, tanpa isi cerita atau nama penulis. Pengguna dapat
menolak izin notifikasi melalui pengaturan perangkat.

Pembayaran diproses Google Play. Backend memverifikasi token pembelian dan
menyimpan hash token serta catatan hak akses untuk mencegah transaksi ganda dan
menangani refund. Aplikasi tidak mengumpulkan nomor kartu pembayaran.

## Penghapusan akun

Buka menu Akun, pilih Hapus akun permanen, lalu konfirmasi kata sandi.
Profil dan identitas login dihapus, isi pesan penulis diganti penanda penghapusan,
dan laut privat milik akun dinonaktifkan. Catatan transaksi tanpa relasi ke akun
tetap disimpan untuk penanganan refund dan audit selama [ISI JANGKA RETENSI].
Penghapusan akun tidak otomatis menghasilkan refund Google Play.

Untuk permintaan penghapusan tanpa aplikasi, kunjungi [ISI URL HALAMAN PENGHAPUSAN]
atau hubungi [ISI EMAIL BANTUAN]. Pengelola perlu memverifikasi kepemilikan akun.

## Penyedia layanan dan kontak

Infrastruktur melibatkan Supabase, Firebase/Google, dan Google Play. Pengelola
bertanggung jawab mengatur akses administratif, lokasi layanan, cadangan,
penanganan laporan, dan retensi sesuai kebutuhan operasional yang dipublikasikan.

Pengelola: [ISI NAMA PENGELOLA]. Kontak: [ISI EMAIL]. Berlaku: [ISI TANGGAL].
