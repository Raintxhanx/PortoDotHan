export type FaqItem = {
  question: string
  answer: string
}

/**
 * Keep the answers short and factual (2–3 sentences). These are also rendered
 * as FAQPage structured data on /tentang/.
 */
export const FAQ: FaqItem[] = [
  {
    question: 'Siapa Raihan Ahmad Fathoni?',
    answer:
      'Raihan Ahmad Fathoni adalah AI Engineer dan Backend Developer yang berbasis di Jakarta Timur. Ia menempuh studi Informatika di Universitas Gunadarma dengan IPK 3.99/4.00 dan membangun sistem backend, platform LLM, serta tools yang dipakai ratusan pengguna.',
  },
  {
    question: 'Di mana Raihan Ahmad Fathoni berkuliah?',
    answer:
      'Raihan menempuh studi Informatika di Universitas Gunadarma, Indonesia, dengan IPK 3.99 dari skala 4.00. Ia juga aktif sebagai asisten laboratorium yang membimbing lebih dari 90 praktikan.',
  },
  {
    question: 'Apa saja proyek AI dan backend yang pernah dikerjakan?',
    answer:
      'Proyek utamanya meliputi Ticketing Management System untuk Laboratorium Informatika Gunadarma, platform chat LLM dengan sistem langganan, dan pendampingan praktikum AI. Ia juga mengerjakan GravidaCompan.io dan GravidaChatbot untuk kesehatan ibu.',
  },
  {
    question: 'Apa keahlian utama Raihan?',
    answer:
      'Keahlian utamanya adalah AI Engineering, Backend Development, DevOps, dan System Analysis. Bahasa dan tools yang ia gunakan antara lain Python, LLM, REST API, database, Docker, serta observability.',
  },
  {
    question: 'Apakah Raihan terbuka untuk kolaborasi atau magang?',
    answer:
      'Ya. Raihan terbuka untuk kolaborasi open-source, magang, dan diskusi seputar AI, data, serta backend. Cara tercepat menghubunginya adalah melalui email raintxhanx@gmail.com atau LinkedIn.',
  },
  {
    question: 'Bagaimana cara menghubungi Raihan Ahmad Fathoni?',
    answer:
      'Kirim email ke raintxhanx@gmail.com atau hubungi melalui LinkedIn di linkedin.com/in/raintxhanx. Profil GitHub dan tautan lainnya tersedia di halaman kontak.',
  },
]
