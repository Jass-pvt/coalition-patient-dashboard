/**
 * Shared helpers for the offline (fixture) browser checks.
 * - buildAndServe(): builds the app into a cache dir with INERT credentials and serves it.
 *   The normal `dist/` and any real `.env` values are never used or modified.
 * - installApiMock(): answers the patient API with scripts/fixtures/patients.fixture.json.
 *   The fixture is synthetic test data shaped like the documented API; it is NOT a copy of
 *   the live response.
 */
import { build, preview } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

export const E2E_USER = 'e2e-user'
export const E2E_PASS = 'e2e-pass'
export const EXPECTED_AUTH = `Basic ${Buffer.from(`${E2E_USER}:${E2E_PASS}`).toString('base64')}`
export const FIXTURE = JSON.parse(
  fs.readFileSync(path.resolve('scripts/fixtures/patients.fixture.json'), 'utf8'),
)

const OUT_DIR = path.resolve('node_modules/.cache/e2e-dist')
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

export async function buildAndServe(port) {
  await build({
    logLevel: 'warn',
    build: { outDir: OUT_DIR, emptyOutDir: true },
    define: {
      'import.meta.env.VITE_API_USERNAME': JSON.stringify(E2E_USER),
      'import.meta.env.VITE_API_PASSWORD': JSON.stringify(E2E_PASS),
    },
  })
  const server = await preview({
    logLevel: 'warn',
    build: { outDir: OUT_DIR },
    preview: { port, strictPort: true },
  })
  return { server, url: `http://localhost:${port}` }
}

const isApi = (u) => u.hostname.endsWith('workers.dev')
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
}

/** Registers fixture routes on a context. Returns { apiRequests } (live array of records). */
export async function installApiMock(context, { delayMs = 0, status = 200, body = FIXTURE } = {}) {
  const apiRequests = []
  await context.route(isApi, async (route) => {
    const req = route.request()
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    apiRequests.push({ method: req.method(), auth: req.headers()['authorization'] })
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs))
    if (status !== 200) {
      return route.fulfill({
        status,
        headers: CORS,
        contentType: 'application/json',
        body: JSON.stringify({ error: true }),
      })
    }
    return route.fulfill({
      status: 200,
      headers: CORS,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
  // Keep runs hermetic: fixture photos and Google Fonts are not fetched.
  await context.route(/fixture\.invalid/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1 }),
  )
  await context.route(/fonts\.googleapis\.com/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/css',
      body: '/* fonts stubbed for offline run */',
    }),
  )
  return { apiRequests }
}
