export type Metric = {
  value: string
  label: string
}

export type FeaturedProject = {
  slug: string
  title: string
  shortTitle: string
  subtitle: string
  description: string
  summary: string
  role: string
  period: string
  stack: string[]
  metrics: Metric[]
  image: string
  imageAlt: string
  schemaType: 'SoftwareApplication' | 'Article'
  repo?: string
}

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    slug: 'ticketing-management-system',
    title: 'Ticketing Management System',
    shortTitle: 'Ticketing Management System',
    subtitle: 'Laboratorium Informatika Gunadarma',
    description:
      'Studi kasus membangun sistem ticketing untuk Laboratorium Informatika Gunadarma: 687 praktikan, 1.300+ tiket, dan alur kerja yang jauh lebih cepat.',
    summary:
      'Sistem ticketing terpusat untuk menggantikan pencatatan manual yang memakan 5–20 menit per tiket, dengan riwayat status, penugasan, dan laporan yang bisa diaudit.',
    role: 'Back End Developer',
    period: '2025',
    stack: ['Backend', 'Database', 'REST API'],
    metrics: [
      { value: '687', label: 'praktikan' },
      { value: '1.300+', label: 'tiket' },
      { value: '5–20 menit', label: 'waktu pencatatan manual' },
    ],
    image: '/og/ticketing.png',
    imageAlt: 'Sampul studi kasus Ticketing Management System Laboratorium Informatika Gunadarma',
    schemaType: 'SoftwareApplication',
  },
  {
    slug: 'platform-chat-llm',
    title: 'Platform Chat LLM dengan Sistem Langganan',
    shortTitle: 'Platform Chat LLM',
    subtitle: 'Backend, langganan, dan konkurensi',
    description:
      'Studi kasus backend platform chat LLM: arsitektur langganan, 200 concurrent users, dan 31 pengguna aktif saat rilis.',
    summary:
      'Platform chat berbasis LLM dengan autentikasi, paket langganan, penyimpanan percakapan, dan kontrol konkurensi untuk 200 pengguna simultan.',
    role: 'Back End Developer',
    period: '2026',
    stack: ['LLM API', 'Backend', 'Langganan', 'Queue'],
    metrics: [
      { value: '200', label: 'concurrent users' },
      { value: '31', label: 'pengguna aktif saat rilis' },
    ],
    image: '/og/llm.png',
    imageAlt: 'Sampul studi kasus Platform Chat LLM dengan Sistem Langganan',
    schemaType: 'SoftwareApplication',
  },
  {
    slug: 'asisten-laboratorium',
    title: 'Asisten Laboratorium & Pembimbingan 90+ Praktikan',
    shortTitle: 'Asisten Laboratorium',
    subtitle: 'AI, Pengolahan Citra, dan Algoritma',
    description:
      'Studi kasus peran sebagai asisten laboratorium Informatika Gunadarma: membimbing 90+ praktikan pada materi AI, Pengolahan Citra, dan Algoritma.',
    summary:
      'Pendampingan praktikum, penyusunan materi, dan evaluasi untuk 90+ praktikan di laboratorium Informatika Universitas Gunadarma.',
    role: 'Asisten Laboratorium',
    period: '2024–2025',
    stack: ['AI', 'Pengolahan Citra', 'Algoritma'],
    metrics: [{ value: '90+', label: 'praktikan dibimbing' }],
    image: '/og/lab.png',
    imageAlt: 'Sampul studi kasus Asisten Laboratorium Informatika Gunadarma',
    schemaType: 'Article',
  },
]

export type OtherProject = {
  title: string
  description: string
  tags: string[]
  url: string
  image: string
  imageAlt: string
}

export const OTHER_PROJECTS: OtherProject[] = [
  {
    title: 'GravidaCompan.io',
    description:
      'Platform web untuk pemantauan kehamilan terintegrasi dan deteksi risiko awal berbasis AI, menghubungkan ibu hamil dengan dokter kandungan.',
    tags: ['AI', 'Kesehatan', 'Web'],
    url: 'https://github.com/Raintxhanx/GravidaCompan.io',
    image: '/img/projects/gravida.webp',
    imageAlt: 'Dasbor GravidaCompan.io',
  },
  {
    title: 'GravidaChatbot',
    description:
      'Sistem tanya jawab medis berbasis LLM untuk ibu hamil, berfokus pada edukasi kesehatan preventif dan pencegahan stunting dalam Bahasa Indonesia.',
    tags: ['LLM', 'RAG', 'Kesehatan publik'],
    url: 'https://github.com/Raintxhanx/GravidaChatbot',
    image: '/img/projects/gravida-chatbot.webp',
    imageAlt: 'Visualisasi arsitektur GravidaChatbot',
  },
  {
    title: 'Interactive Campus Map',
    description:
      'Prototipe aplikasi web yang memetakan sebaran kampus di Indonesia, dengan pencarian, filter, dan operasi CRUD.',
    tags: ['JavaScript', 'Peta', 'CRUD'],
    url: 'https://github.com/Raintxhanx/Interactive-Campus-Map',
    image: '/img/projects/campus-map.webp',
    imageAlt: 'Antarmuka Interactive Campus Map',
  },
  {
    title: 'Personal Discord Bot',
    description:
      'Bot yang mengotomasi tugas kecil di server Discord sekaligus menyimulasikan mekanisme pull Genshin Impact.',
    tags: ['Python', 'Discord API', 'Gacha'],
    url: 'https://github.com/Raintxhanx/Personal-Discord-Bot',
    image: '/img/projects/discord-bot.webp',
    imageAlt: 'Personal Discord Bot menampilkan simulasi wish',
  },
  {
    title: 'Linked List Visualizer',
    description:
      'Aplikasi desktop PyQt yang membuat linked list terlihat: sisipkan, hapus, dan ubah node dengan visualisasi real-time.',
    tags: ['Python', 'PyQt', 'Struktur data'],
    url: 'https://github.com/Raintxhanx/Linked-List-Visualizer',
    image: '/img/projects/linked-list.webp',
    imageAlt: 'Aplikasi Linked List Visualizer',
  },
  {
    title: 'Excel Sheet Extraction',
    description:
      'Aplikasi Windows yang memindai kolom berdasarkan kata kunci lalu memisahkan baris yang cocok ke sheet tersendiri.',
    tags: ['Python', 'PyQt', 'Otomasi'],
    url: 'https://github.com/Raintxhanx/Excel-Sheet-Extraction-',
    image: '/img/projects/excel.webp',
    imageAlt: 'Antarmuka Excel Sheet Extraction',
  },
]

export const projectPath = (slug: string) => `/proyek/${slug}/`
