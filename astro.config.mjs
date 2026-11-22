import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'

const src = fileURLToPath(new URL('./src', import.meta.url))

// Static output for Cloudflare Pages. No Node server in production.
export default defineConfig({
  site: 'https://raintxhanx.uk',
  output: 'static',
  trailingSlash: 'always',
  publicDir: './src/public',
  build: {
    format: 'directory',
  },
  vite: {
    resolve: {
      alias: {
        '@': src,
      },
    },
    server: {
      host: true,
    },
  },
})
