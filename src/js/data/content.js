/**
 * Portfolio copy for the orbit card.
 *
 * The static page sections are intentionally collapsed into the galaxy HUD, so
 * this file is the single source of richer chapter information that gets
 * injected into `#orbit-details` whenever the active chapter changes.
 */

export const SKILLS = [
  { name: 'Python', note: 'Data, AI and the occasional script that saves a whole afternoon.', level: 'Daily driver' },
  { name: 'Java', note: 'Object-oriented foundations, coursework and clean structure.', level: 'Learning' },
  { name: 'Go', note: 'A newer language in the bag — small binaries, clear concurrency.', level: 'Exploring' },
  { name: 'PyTorch', note: 'Training wheels on. Models, tensors and a lot of reading.', level: 'Beginner' },
  { name: 'TensorFlow', note: 'The other path into deep learning — still finding my footing.', level: 'Beginner' },
  { name: 'MySQL', note: 'Schemas, queries and the quiet satisfaction of a tidy database.', level: 'Comfortable' },
  { name: 'PyQt', note: 'Desktop apps that make abstract data structures feel tangible.', level: 'Practical' },
  { name: 'Excel', note: 'Not a joke. Spreadsheets are my theory-crafting engine.', level: 'Suspiciously good' },
]

export const PROJECTS = [
  {
    title: 'GravidaCompan.io',
    url: 'https://github.com/Raintxhanx/GravidaCompan.io',
    desc: 'A web platform for integrated pregnancy monitoring and early risk detection, powered by AI.',
    tags: ['AI', 'LLM', 'Web'],
  },
  {
    title: 'GravidaChatbot',
    url: 'https://github.com/Raintxhanx/GravidaChatbot',
    desc: 'An LLM-powered medical Q&A system for expectant mothers, grounded in Bahasa Indonesia and maternal health.',
    tags: ['LLM', 'RAG', 'Public health'],
  },
  {
    title: 'Interactive Campus Map',
    url: 'https://github.com/Raintxhanx/Interactive-Campus-Map',
    desc: 'A prototype web app that maps the distribution of campuses across Indonesia.',
    tags: ['JavaScript', 'Mapping', 'CRUD'],
  },
  {
    title: 'Personal Discord Bot',
    url: 'https://github.com/Raintxhanx/Personal-Discord-Bot',
    desc: 'A bot that automates small server chores and simulates Genshin Impact pull mechanics.',
    tags: ['Python', 'Discord API', 'Gacha'],
  },
  {
    title: 'Linked List Visualizer',
    url: 'https://github.com/Raintxhanx/Linked-List-Visualizer',
    desc: 'A PyQt desktop application that makes a linked list visible — insert, delete and manipulate nodes in real time.',
    tags: ['Python', 'PyQt', 'Data structures'],
  },
  {
    title: 'Excel Sheet Extraction',
    url: 'https://github.com/Raintxhanx/Excel-Sheet-Extraction-',
    desc: 'A Windows executable that scans a column for a keyword and splits matching rows into dedicated sheets.',
    tags: ['Python', 'PyQt', 'Automation'],
  },
]

export const NOW = [
  {
    label: 'Studying',
    title: 'Gunadarma <em>University</em>',
    body: 'Object-oriented programming and AI engineering, one semester at a time. Currently trying to make the theory stick.',
    meta: [
      ['Focus', 'OOP · AI Engineering'],
      ['Next', 'Better models, smaller tools'],
    ],
  },
  {
    label: 'Building',
    title: 'The Gravida <em>suite</em>',
    body: 'A maternal health platform and its Bahasa Indonesia LLM companion. The project where code, care and consequence meet.',
    meta: [
      ['Stack', 'Python · LLM · Web'],
      ['Why', 'Small tools, real stakes'],
    ],
  },
  {
    label: 'Off-screen',
    title: 'Theory <em>crafting</em>',
    body: 'Excel, game mechanics, music and mathematics. My favourite kind of rabbit hole is the one with a spreadsheet at the bottom.',
    meta: [
      ['Tools', 'Excel · Probability'],
      ['Mood', 'Curiosity, unclaimed'],
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
  PROJECTS.map(
    (project) => `
      <li class="orbit-detail__item">
        <a class="orbit-detail__link" href="${project.url}" target="_blank" rel="noopener">
          <span class="orbit-detail__title">${project.title}</span>
          <span class="orbit-detail__arrow" aria-hidden="true">↗</span>
        </a>
        <p class="orbit-detail__note">${project.desc}</p>
        <ul class="orbit-detail__tags">${project.tags.map((tag) => `<li>${tag}</li>`).join('')}</ul>
      </li>`,
  ).join('')

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
          <p lang="id">“Hanya manusia biasa yang bahagia dengan hal-hal kecil.”</p>
          <cite class="mono">Just an ordinary human, happy with small things.</cite>
        </blockquote>
        <p>
          Student at <strong>Gunadarma University</strong> and a beginner developer
          diving into <strong>AI</strong>, <strong>backend engineering</strong> and
          <strong>data analysis</strong>. My curiosity refuses to stay in one lane:
          mathematics, science, music, open source — and the occasional spreadsheet
          rabbit hole.
        </p>
        <p>
          I like software that feels small, deliberate and quietly useful. The kind
          you don’t notice until it saves someone an afternoon.
        </p>
        <dl class="orbit-detail__stats">
          <div><dt class="mono">Repos</dt><dd>11</dd></div>
          <div><dt class="mono">Languages</dt><dd>03</dd></div>
          <div><dt class="mono">Questions</dt><dd>∞</dd></div>
        </dl>
      </div>`,
  },
  toolkit: {
    html: `
      <div class="orbit-detail">
        <p class="orbit-detail__lead">
          A small, growing collection. Some are daily companions, some are currently
          being wrestled with — honest levels only.
        </p>
        <div class="orbit-detail__skills">${skillList()}</div>
      </div>`,
  },
  work: {
    html: `
      <div class="orbit-detail">
        <p class="orbit-detail__lead">Six selected projects — small things, built well.</p>
        <ul class="orbit-detail__list">${projectList()}</ul>
        <a class="orbit-detail__more mono" href="https://github.com/Raintxhanx?tab=repositories" target="_blank" rel="noopener">
          More on GitHub <span aria-hidden="true">↗</span>
        </a>
      </div>`,
  },
  now: {
    html: `
      <div class="orbit-detail">
        <p class="orbit-detail__lead">Lately, quietly — what is taking up the hours.</p>
        <ul class="orbit-detail__list">${nowList()}</ul>
      </div>`,
  },
  contact: {
    html: `
      <div class="orbit-detail">
        <p class="orbit-detail__lead">
          Open to open-source collaboration, internships, and conversations about AI,
          data, mathematics or music. I reply faster than my models train.
        </p>
        <a class="orbit-detail__mail" href="mailto:raintxhanx@gmail.com">
          <span class="mono">Write to me</span>
          <strong>raintxhanx@gmail.com</strong>
          <span aria-hidden="true">↗</span>
        </a>
        <ul class="orbit-detail__list">${socialList()}</ul>
        <p class="orbit-detail__status mono">
          <span class="status-dot" aria-hidden="true"></span>
          Available for collaboration
        </p>
      </div>`,
  },
}

/* Kept for backwards compatibility with the earlier page-section builder. */
export const SECTIONS = {
  about: { title: 'The ordinary <em>human.</em>', html: CHAPTER_DETAILS.about.html },
  toolkit: { title: 'Tools I <em>reach for.</em>', html: CHAPTER_DETAILS.toolkit.html },
  work: { title: 'Small things, <em>built well.</em>', html: CHAPTER_DETAILS.work.html },
  now: { title: 'Lately, <em>quietly.</em>', html: CHAPTER_DETAILS.now.html },
  contact: { title: 'Let’s build something <em>small that matters.</em>', html: CHAPTER_DETAILS.contact.html },
}
