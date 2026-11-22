/**
 * Portfolio copy for the orbit card.
 *
 * The six galaxy chapters are a navigational layer over the same facts used by
 * the static pages. Keep names, metrics and links consistent with
 * `src/data/site.ts` and `src/data/projects.ts`.
 */

export const SKILLS = [
  { name: 'Python', note: 'Data, AI, dan skrip kecil yang menghemat satu sore.', level: 'Daily driver' },
  { name: 'Backend & API', note: 'REST API, autentikasi, dan layanan yang bisa dioperasikan.', level: 'Produksi' },
  { name: 'LLM & RAG', note: 'Integrasi model, retrieval, evaluasi, dan batas biaya.', level: 'Praktik' },
  { name: 'Database', note: 'Skema, query, dan data yang bisa diaudit.', level: 'Comfortable' },
  { name: 'Docker & DevOps', note: 'Deployment, observability, dan otomasi rilis.', level: 'Comfortable' },
  { name: 'System Analysis', note: 'Memetakan alur dan menerjemahkannya menjadi requirement.', level: 'Praktik' },
  { name: 'JavaScript', note: 'Antarmuka kecil yang membuat data terasa hidup.', level: 'Praktik' },
  { name: 'Excel', note: 'Bukan lelucon. Spreadsheet adalah mesin theorycrafting saya.', level: 'Suspiciously good' },
]

export const PROJECTS = [
  {
    title: 'Ticketing Management System',
    url: '/proyek/ticketing-management-system/',
    desc: 'Sistem ticketing Laboratorium Informatika Gunadarma: 687 praktikan dan 1.300+ tiket.',
    tags: ['Backend', 'Database', 'Operasional'],
  },
  {
    title: 'Platform Chat LLM',
    url: '/proyek/platform-chat-llm/',
    desc: 'Backend platform chat LLM dengan langganan, antrean, dan 200 concurrent users.',
    tags: ['LLM', 'Backend', 'Langganan'],
  },
  {
    title: 'Asisten Laboratorium',
    url: '/proyek/asisten-laboratorium/',
    desc: 'Membimbing 90+ praktikan pada materi AI, Pengolahan Citra, dan Algoritma.',
    tags: ['AI', 'Pengolahan Citra', 'Algoritma'],
  },
  {
    title: 'GravidaCompan.io',
    url: 'https://github.com/Raintxhanx/GravidaCompan.io',
    desc: 'Platform pemantauan kehamilan dan deteksi risiko awal berbasis AI.',
    tags: ['AI', 'Kesehatan', 'Web'],
  },
  {
    title: 'Interactive Campus Map',
    url: 'https://github.com/Raintxhanx/Interactive-Campus-Map',
    desc: 'Peta sebaran kampus di Indonesia dengan pencarian, filter, dan CRUD.',
    tags: ['JavaScript', 'Peta', 'CRUD'],
  },
  {
    title: 'Excel Sheet Extraction',
    url: 'https://github.com/Raintxhanx/Excel-Sheet-Extraction-',
    desc: 'Aplikasi Windows untuk memisahkan baris Excel berdasarkan kata kunci.',
    tags: ['Python', 'PyQt', 'Otomasi'],
  },
]

export const NOW = [
  {
    label: 'Sedang dibangun',
    title: 'Platform <em>LLM</em>',
    body: 'Backend chat LLM dengan langganan, penyimpanan percakapan, dan kontrol konkurensi.',
    meta: [
      ['Stack', 'LLM · Backend · Queue'],
      ['Fokus', 'Keandalan dan biaya'],
    ],
  },
  {
    label: 'Sedang dipelajari',
    title: 'Sistem yang <em>tenang</em>',
    body: 'Observability, desain API, dan cara membuat sistem besar terasa sederhana.',
    meta: [
      ['Fokus', 'System design'],
      ['Berikutnya', 'Lebih sedikit, lebih jelas'],
    ],
  },
  {
    label: 'Di luar layar',
    title: 'Theory <em>crafting</em>',
    body: 'Excel, mekanika game, musik, dan matematika. Rabbit hole favorit selalu berakhir di spreadsheet.',
    meta: [
      ['Tools', 'Excel · Probabilitas'],
      ['Mood', 'Rasa ingin tahu'],
    ],
  },
]

export const SOCIALS = [
  ['GitHub', '@Raintxhanx', 'https://github.com/Raintxhanx'],
  ['LinkedIn', 'in/raintxhanx', 'https://www.linkedin.com/in/raintxhanx/'],
  ['YouTube', '@raintxhanx', 'https://www.youtube.com/@raintxhanx'],
  ['Instagram', '@raintxhanx', 'https://www.instagram.com/raintxhanx/'],
  ['MyAnimeList', 'raintxhanx', 'https://myanimelist.net/profile/raintxhanx'],
]

const skillList = () =>
  SKILLS.map(
    (skill, index) => `
      <article class="skill">
        <span class="skill__index mono">${String(index + 1).padStart(2, '0')}</span>
        <h3 class="skill__name">${skill.name}</h3>
        <p class="skill__note">${skill.note}</p>
        <span class="skill__level mono">${skill.level}</span>
      </article>`,
  ).join('')

const projectList = () =>
  PROJECTS.map((project) => {
    const external = project.url.startsWith('http')
    return `
      <li class="orbit-detail__item">
        <a class="orbit-detail__link" href="${project.url}"${external ? ' target="_blank" rel="noopener"' : ''}>
          <span class="orbit-detail__title">${project.title}</span>
          <span class="orbit-detail__arrow" aria-hidden="true">${external ? '↗' : '↘'}</span>
        </a>
        <p class="orbit-detail__note">${project.desc}</p>
        <ul class="orbit-detail__tags">${project.tags.map((tag) => `<li>${tag}</li>`).join('')}</ul>
      </li>`
  }).join('')

const nowList = () =>
  NOW.map(
    (card) => `
      <li class="orbit-detail__item orbit-detail__item--now">
        <span class="orbit-detail__meta mono">${card.label}</span>
        <h3 class="orbit-detail__title">${card.title}</h3>
        <p class="orbit-detail__note">${card.body}</p>
        <dl class="orbit-detail__rows">
          ${card.meta
            .map(
              ([key, value]) =>
                `<div><dt class="mono">${key}</dt><dd>${value}</dd></div>`,
            )
            .join('')}
        </dl>
      </li>`,
  ).join('')

const socialList = () =>
  SOCIALS.map(
    ([name, handle, url]) => `
      <li class="orbit-detail__item">
        <a class="orbit-detail__link" href="${url}" target="_blank" rel="noopener">
          <span class="orbit-detail__title">${name}</span>
          <span class="orbit-detail__handle mono">${handle}</span>
          <span class="orbit-detail__arrow" aria-hidden="true">↗</span>
        </a>
      </li>`,
  ).join('')

export const CHAPTER_DETAILS = {
  hero: {
    html: '',
  },
  about: {
    html: `
      <div class="orbit-detail">
        <blockquote class="orbit-detail__quote">
          <p lang="id">“Manusia biasa, bahagia dengan hal-hal kecil.”</p>
          <cite class="mono">Raihan Ahmad Fathoni</cite>
        </blockquote>
        <p>
          AI Engineer dan Backend Developer yang berbasis di Jakarta Timur.
          Menempuh studi Informatika di <strong>Universitas Gunadarma</strong>
          dengan IPK <strong>3.99/4.00</strong>, membangun sistem backend,
          platform LLM, dan tools yang dipakai ratusan pengguna.
        </p>
        <p>
          Suka bekerja di persimpangan AI, backend, dan operasi sistem: merancang
          alur, menulis layanan, mengukur hasil, lalu menyederhanakan bagian yang
          masih terlalu rumit.
        </p>
        <dl class="orbit-detail__stats">
          <div><dt class="mono">IPK</dt><dd>3.99</dd></div>
          <div><dt class="mono">Praktikan</dt><dd>687</dd></div>
          <div><dt class="mono">Tiket</dt><dd>1.300+</dd></div>
        </dl>
      </div>`,
  },
  toolkit: {
    html: `
      <div class="orbit-detail">
        <p class="orbit-detail__lead">
          Keahlian utama, dengan level yang jujur. Fokus pada sistem yang bisa
          dioperasikan, bukan hanya demo.
        </p>
        <div class="orbit-detail__skills">${skillList()}</div>
      </div>`,
  },
  work: {
    html: `
      <div class="orbit-detail">
        <p class="orbit-detail__lead">Tiga studi kasus utama dan beberapa proyek pendukung.</p>
        <ul class="orbit-detail__list">${projectList()}</ul>
        <a class="orbit-detail__more mono" href="/proyek/">
          Semua proyek <span aria-hidden="true">↘</span>
        </a>
      </div>`,
  },
  now: {
    html: `
      <div class="orbit-detail">
        <p class="orbit-detail__lead">Yang sedang menyita waktu dan rasa ingin tahu.</p>
        <ul class="orbit-detail__list">${nowList()}</ul>
      </div>`,
  },
  contact: {
    html: `
      <div class="orbit-detail">
        <p class="orbit-detail__lead">
          Terbuka untuk kolaborasi open-source, magang, dan diskusi seputar AI,
          data, serta backend.
        </p>
        <a class="orbit-detail__mail" href="mailto:raintxhanx@gmail.com">
          <span class="mono">Kirim email</span>
          <strong>raintxhanx@gmail.com</strong>
          <span aria-hidden="true">↗</span>
        </a>
        <ul class="orbit-detail__list">${socialList()}</ul>
        <p class="orbit-detail__status mono">
          <span class="status-dot" aria-hidden="true"></span>
          Terbuka untuk kolaborasi
        </p>
      </div>`,
  },
}
