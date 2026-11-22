---
layout: ../../layouts/CaseStudyLayout.astro
title: "Ticketing Management System — Laboratorium Informatika Gunadarma"
shortTitle: "Ticketing Management System"
description: "Studi kasus membangun sistem ticketing untuk Laboratorium Informatika Gunadarma: 687 praktikan, 1.300+ tiket, dan alur kerja yang jauh lebih cepat."
slug: "ticketing-management-system"
date: 2026-01-15
updated: 2026-11-22
role: "Back End Developer"
period: "2025"
stack: ["Backend", "Database", "REST API"]
metrics:
  - value: "687"
    label: "praktikan"
  - value: "1.300+"
    label: "tiket"
  - value: "5–20 menit"
    label: "waktu pencatatan manual"
image: "/og/ticketing.png"
imageAlt: "Sampul studi kasus Ticketing Management System Laboratorium Informatika Gunadarma"
schemaType: "SoftwareApplication"
---

Laboratorium Informatika Gunadarma melayani ratusan praktikan setiap periode. Setiap masalah — komputer yang tidak bisa login, alat yang rusak, atau akses yang tertahan — awalnya dicatat secara manual. Ketika jumlah praktikan mencapai 687 orang dan tiket menembus 1.300, pencatatan manual berubah dari rutinitas kecil menjadi beban operasional.

Proyek ini membangun sistem ticketing terpusat untuk menggantikan proses tersebut. Fokusnya bukan menambah fitur, tetapi menghilangkan friksi: satu tempat untuk melaporkan masalah, satu alur status yang jelas, dan satu riwayat yang bisa ditelusuri.

## Masalah

Sebelum sistem ini ada, satu tiket bisa memakan 5–20 menit hanya untuk dicatat dan diteruskan. Petugas harus menuliskan identitas praktikan, jenis masalah, waktu, dan tindak lanjut di tempat yang berbeda-beda. Akibatnya, beberapa masalah tercatat ganda, sebagian tidak pernah tercatat, dan sulit mengetahui apakah sebuah laporan sudah selesai atau masih menunggu.

Pada skala 687 praktikan, dampaknya terasa di dua sisi. Praktikan menunggu lebih lama karena antrean tidak terlihat. Asisten laboratorium kesulitan memprioritaskan pekerjaan karena tidak ada gambaran beban yang sedang berjalan. Laporan bulanan juga harus disusun ulang secara manual dari catatan yang tersebar.

## Peran dan batasan

Saya masuk sebagai Back End Developer. Tanggung jawab utama saya adalah merancang model data, membangun API, dan memastikan alur status tiket konsisten dari laporan pertama sampai selesai. Saya juga terlibat dalam keputusan operasional: status apa yang benar-benar dibutuhkan, siapa yang boleh mengubahnya, dan data apa yang perlu disimpan untuk audit.

Batasan utamanya adalah proses lama tidak bisa langsung dimatikan. Praktikum tetap berjalan, sehingga sistem baru harus bisa digunakan bertahap tanpa mengganggu layanan yang sedang berjalan. Solusinya adalah memulai dari alur inti — buat tiket, tugaskan, ubah status, dan lihat riwayat — lalu menambahkan pelaporan setelah alur tersebut stabil.

## Arsitektur dan keputusan teknis

Sistem ini dibangun sebagai layanan backend dengan database relasional. Keputusan paling penting bukan pada framework, melainkan pada model status. Setiap tiket memiliki siklus yang eksplisit: dilaporkan, diverifikasi, ditugaskan, dikerjakan, dan selesai. Status tambahan seperti ditolak atau duplikat disimpan sebagai kasus terpisah agar laporan tetap bersih.

API dibuat sederhana dan konsisten. Setiap endpoint mengembalikan struktur yang sama, sehingga antarmuka depan tidak perlu menebak bentuk respons. Autentikasi membedakan praktikan, asisten, dan administrator. Praktikan hanya bisa melihat tiketnya sendiri; asisten melihat antrean yang ditugaskan; administrator melihat seluruh data dan laporan.

Untuk menjaga kualitas data, setiap perubahan status dicatat sebagai peristiwa, bukan hanya menimpa nilai terakhir. Dengan cara ini, pertanyaan seperti "siapa yang menutup tiket ini?" atau "berapa lama tiket menunggu?" bisa dijawab tanpa rekonstruksi manual.

## Implementasi

Pekerjaan dimulai dari skema database dan kontrak API, bukan dari tampilan. Saya mendefinisikan entitas tiket, pengguna, kategori masalah, penugasan, dan riwayat status. Setelah itu saya membangun endpoint untuk membuat tiket, mengambil daftar dengan filter, mengubah status, dan mengekspor laporan.

Salah satu bagian yang paling banyak memakan waktu adalah menangani kasus tepi: tiket yang dipindahkan antar-asisten, tiket duplikat, dan tiket yang dibuka kembali setelah selesai. Alih-alih menambal dengan pengecekan tersebar, saya memusatkan aturan transisi status di satu lapisan. Dengan begitu, antarmuka dan integrasi lain tidak bisa melompati aturan yang sama.

Saya juga menambahkan validasi di sisi server untuk semua input penting, logging untuk aksi administratif, dan penanganan error yang memberi pesan jelas tanpa membocorkan detail internal. Tujuannya sederhana: sistem harus tetap bisa dipercaya ketika dipakai sehari-hari oleh banyak orang.

## Hasil

Sistem ini sekarang menangani 687 praktikan dan lebih dari 1.300 tiket. Waktu yang sebelumnya habis untuk mencatat dan mencari riwayat bisa dialihkan ke pekerjaan yang lebih berguna: membantu praktikan, memeriksa laboratorium, dan memperbaiki masalah yang berulang.

Yang paling terasa bukan hanya kecepatan, tetapi visibilitas. Antrean bisa dilihat, status bisa ditanyakan, dan laporan bisa dihasilkan dari data yang sama dengan yang dipakai sehari-hari. Untuk laboratorium, ini berarti keputusan operasional tidak lagi bergantung pada ingatan atau catatan pribadi.

## Pelajaran

Proyek ini mengingatkan saya bahwa sistem yang baik sering kali terlihat biasa. Tidak ada model AI, tidak ada arsitektur eksotis. Yang ada adalah alur yang jelas, aturan status yang konsisten, dan data yang bisa dipercaya.

Saya juga belajar bahwa pekerjaan backend yang serius dimulai dari pemahaman proses, bukan dari daftar teknologi. Ketika alur dan batasannya sudah jelas, implementasi menjadi jauh lebih tenang — dan hasilnya lebih mudah diukur.
