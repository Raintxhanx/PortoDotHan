---
layout: ../../layouts/CaseStudyLayout.astro
title: "Platform Chat LLM dengan Sistem Langganan"
shortTitle: "Platform Chat LLM"
description: "Studi kasus backend platform chat LLM: arsitektur langganan, 200 concurrent users, dan 31 pengguna aktif saat rilis."
slug: "platform-chat-llm"
date: 2026-06-10
updated: 2026-11-22
role: "Back End Developer"
period: "2026"
stack: ["LLM API", "Backend", "Langganan", "Queue"]
metrics:
  - value: "200"
    label: "concurrent users"
  - value: "31"
    label: "pengguna aktif saat rilis"
image: "/og/llm.png"
imageAlt: "Sampul studi kasus Platform Chat LLM dengan Sistem Langganan"
schemaType: "SoftwareApplication"
---

Platform chat berbasis LLM terlihat sederhana dari luar: pengguna mengetik pertanyaan, model menjawab. Di balik layar, ada banyak hal yang harus benar sekaligus — autentikasi, kuota langganan, penyimpanan percakapan, batas laju, dan penanganan kegagalan penyedia model. Proyek ini berfokus pada bagian backend tersebut.

Saya berperan sebagai Back End Developer. Tujuannya bukan sekadar membuat endpoint chat yang berfungsi, tetapi membangun layanan yang tetap masuk akal ketika dipakai banyak orang pada waktu yang sama.

## Masalah

Produk chat LLM punya pola beban yang khas. Sebagian besar waktu sistem menganggur, lalu tiba-tiba menerima banyak permintaan bersamaan. Setiap permintaan bisa berlangsung lama karena menunggu respons model. Tanpa desain yang tepat, koneksi menumpuk, kuota langganan bocor, dan pengguna melihat error yang sulit dijelaskan.

Ada tiga masalah utama yang harus diselesaikan. Pertama, memastikan hanya pengguna dengan langganan aktif yang bisa mengakses model. Kedua, menjaga percakapan tetap konsisten meskipun respons datang bertahap. Ketiga, melindungi sistem dari lonjakan permintaan tanpa membuat pengguna menunggu tanpa kepastian.

## Peran dan batasan

Sebagai Back End Developer, saya merancang lapisan API, model data untuk pengguna dan langganan, serta alur komunikasi ke penyedia model. Saya juga menentukan cara sistem menangani penggunaan bersamaan: apa yang diantrekan, apa yang ditolak dengan pesan jelas, dan apa yang boleh dicoba ulang.

Batasan produknya cukup ketat. Pengalaman chat harus terasa responsif, tetapi biaya model harus tetap terkendali. Tidak semua permintaan bisa dilayani seketika, dan tidak semua kegagalan layak ditampilkan sebagai error teknis. Keputusan desain harus mempertimbangkan pengalaman pengguna dan biaya operasional sekaligus.

## Arsitektur dan keputusan teknis

Sistem dipisahkan menjadi beberapa lapisan. Lapisan API menangani autentikasi, validasi input, dan pengecekan hak akses. Lapisan langganan menentukan apakah pengguna masih memiliki kuota dan fitur yang sesuai dengan paketnya. Lapisan percakapan menyimpan pesan, urutan, dan metadata. Lapisan integrasi model bertanggung jawab memanggil penyedia LLM dan menormalkan responsnya.

Salah satu keputusan penting adalah memisahkan "hak untuk memakai" dari "cara memanggil model". Dengan begitu, perubahan paket langganan tidak perlu mengubah logika chat, dan penggantian penyedia model tidak memengaruhi aturan bisnis.

Untuk konkurensi, saya menggunakan kombinasi pembatasan laju, antrean untuk permintaan yang tidak mendesak, dan timeout yang eksplisit. Permintaan yang tidak bisa dilayani langsung diberi respons yang jujur, bukan dibiarkan menggantung. Saya juga menambahkan idempotensi pada operasi penting agar percobaan ulang tidak menghasilkan duplikasi.

Penyimpanan percakapan dirancang agar aman terhadap respons yang datang bertahap. Setiap pesan memiliki peran, urutan, dan status. Jika koneksi terputus di tengah jalan, pengguna bisa melanjutkan tanpa kehilangan konteks.

## Implementasi

Pekerjaan dimulai dari kontrak API dan skenario beban, bukan dari antarmuka. Saya menulis alur untuk skenario normal, lalu menambahkan skenario gagal: token kedaluwarsa, kuota habis, penyedia model lambat, dan permintaan ganda.

Pengujian beban menjadi bagian penting. Targetnya adalah 200 pengguna bersamaan dengan pola permintaan yang realistis, bukan hanya angka di atas kertas. Dari pengujian ini saya menemukan bahwa bottleneck utama bukan di database, tetapi di waktu tunggu model dan pengelolaan koneksi. Perbaikan yang paling berdampak adalah membatasi pekerjaan yang berjalan bersamaan, memperpendek waktu tunggu, dan memberi umpan balik status yang jelas ke klien.

Saya juga menambahkan observability: log terstruktur, metrik latensi per lapisan, dan pencatatan kegagalan penyedia model. Tanpa ini, masalah produksi hanya terlihat sebagai "chat lambat" tanpa petunjuk penyebabnya.

## Hasil

Saat rilis, platform mencatat 31 pengguna aktif. Angka itu kecil, tetapi cukup untuk memvalidasi alur langganan, penyimpanan percakapan, dan perilaku sistem di bawah beban nyata. Pengujian internal menunjukkan sistem mampu menangani 200 pengguna bersamaan dengan batas laju dan antrean yang terkendali.

Yang lebih penting, tim memiliki dasar untuk berkembang: lapisan yang jelas, metrik yang bisa dibaca, dan perilaku yang bisa diprediksi ketika beban naik.

## Pelajaran

Membangun produk LLM bukan hanya soal memilih model. Sebagian besar pekerjaan ada di sekitar model: hak akses, biaya, latensi, kegagalan, dan kejelasan status. Backend yang baik membuat bagian yang tidak terlihat itu terasa sederhana bagi pengguna.

Saya juga belajar bahwa pengujian beban harus meniru pola pemakaian, bukan hanya menaikkan angka. Angka 200 concurrent users baru bermakna ketika sistem tetap memberi respons yang jelas pada skenario gagal.
