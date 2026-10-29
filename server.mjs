/**
 * Minimal static server for the production build.
 *
 * No dependencies — serves `dist/` with SPA fallback, cache headers and
 * byte-range support. Meant to sit behind a Cloudflare Tunnel, so it binds
 * to all interfaces inside the container and relies on the host port mapping
 * (127.0.0.1) for exposure.
 */
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(process.env.STATIC_ROOT ?? fileURLToPath(new URL('./dist', import.meta.url)))
const PORT = Number.parseInt(process.env.PORT ?? '8080', 10)
const HOST = process.env.HOST ?? '0.0.0.0'

const MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.xml', 'application/xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.avif', 'image/avif'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.ico', 'image/x-icon'],
  ['.mp3', 'audio/mpeg'],
  ['.ogg', 'audio/ogg'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
])

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

const CACHEABLE_FILE = /\.(?:css|js|mjs|webp|avif|png|jpe?g|gif|svg|ico|mp3|ogg|woff2?)$/i

function cacheControl(pathname) {
  if (pathname.startsWith('/assets/')) return 'public, max-age=31536000, immutable'
  if (CACHEABLE_FILE.test(pathname)) return 'public, max-age=2592000'
  return 'no-cache'
}

function send(res, status, headers = {}, body = '') {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers })
  res.end(body)
}

function notFound(res) {
  send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not found\n')
}

/** Resolve a decoded URL path to a file inside ROOT, or null if it escapes. */
function toFilePath(pathname) {
  if (pathname.includes('\0')) return null

  const filePath = resolve(join(ROOT, pathname))
  if (filePath !== ROOT && !filePath.startsWith(ROOT + sep)) return null

  return filePath
}

async function lookup(filePath) {
  try {
    const info = await stat(filePath)

    if (info.isDirectory()) {
      const indexPath = join(filePath, 'index.html')
      const indexInfo = await stat(indexPath)
      return indexInfo.isFile() ? { filePath: indexPath, info: indexInfo } : null
    }

    return info.isFile() ? { filePath, info } : null
  } catch {
    return null
  }
}

async function handle(req, res) {
  const method = req.method ?? 'GET'

  if (method !== 'GET' && method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    return send(res, 405, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Method not allowed\n')
  }

  let pathname
  try {
    pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
  } catch {
    return send(res, 400, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Bad request\n')
  }

  if (pathname === '/healthz') {
    return send(res, 200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }, 'ok\n')
  }

  const isAsset = pathname.startsWith('/assets/') || CACHEABLE_FILE.test(pathname)
  const requestedPath = toFilePath(pathname)
  if (!requestedPath) {
    return send(res, 400, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Bad request\n')
  }

  let target = await lookup(requestedPath)

  // Client-side routes fall back to the HTML shell; missing assets stay 404.
  if (!target && !isAsset) target = await lookup(join(ROOT, 'index.html'))
  if (!target) return notFound(res)

  const { filePath, info } = target
  const etag = `W/"${info.size.toString(16)}-${Math.trunc(info.mtimeMs).toString(16)}"`

  const headers = {
    'Content-Type': MIME_TYPES.get(extname(filePath).toLowerCase()) ?? 'application/octet-stream',
    'Cache-Control': cacheControl(pathname),
    'ETag': etag,
    'Last-Modified': info.mtime.toUTCString(),
    'Accept-Ranges': 'bytes',
  }

  const ifNoneMatch = req.headers['if-none-match']
  if (ifNoneMatch && (ifNoneMatch === '*' || ifNoneMatch.split(',').some((tag) => tag.trim() === etag))) {
    return send(res, 304, headers)
  }

  const range = req.headers.range
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range)
    if (match) {
      const size = info.size
      let start = match[1] ? Number.parseInt(match[1], 10) : null
      let end = match[2] ? Number.parseInt(match[2], 10) : null

      if (start === null && end !== null) {
        start = Math.max(size - end, 0)
        end = size - 1
      } else if (start !== null && end === null) {
        end = size - 1
      }

      if (start === null || end === null || start > end || start >= size) {
        return send(res, 416, { ...headers, 'Content-Range': `bytes */${size}` })
      }

      end = Math.min(end, size - 1)
      headers['Content-Range'] = `bytes ${start}-${end}/${size}`
      headers['Content-Length'] = end - start + 1

      res.writeHead(206, { ...SECURITY_HEADERS, ...headers })
      if (method === 'HEAD') return res.end()

      const stream = createReadStream(filePath, { start, end })
      stream.on('error', () => res.destroy())
      return stream.pipe(res)
    }
  }

  headers['Content-Length'] = info.size
  res.writeHead(200, { ...SECURITY_HEADERS, ...headers })
  if (method === 'HEAD') return res.end()

  const stream = createReadStream(filePath)
  stream.on('error', () => res.destroy())
  stream.pipe(res)
}

const server = createServer((req, res) => {
  handle(req, res).catch((error) => {
    console.error(error)
    if (res.headersSent) res.destroy()
    else send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Internal server error\n')
  })
})

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 10_000).unref()
  })
}

server.listen(PORT, HOST, () => {
  console.log(`Serving ${ROOT} on http://${HOST}:${PORT}`)
})
