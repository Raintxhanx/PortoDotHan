import { defineConfig } from 'vite'
import glslify from 'rollup-plugin-glslify'
import * as path from 'path'

export default defineConfig(({ command }) => ({
  root: 'src',
  appType: 'spa',
  // relative paths in the build keep the site portable (GitHub Pages, subfolders)
  base: command === 'build' ? './' : '/',
  build: {
    outDir: '../dist',
  },
  server: {
    host: true, // test on other devices using the network IP
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [glslify()],
}))
