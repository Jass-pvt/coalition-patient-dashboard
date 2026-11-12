/**
 * End-to-end browser validation of the built app (run `npm run build` first).
 *
 *   npm run validate:browser                 live API (needs real credentials in .env at build time)
 *   USE_FIXTURE=1 npm run validate:browser   offline: builds with inert credentials and mocks the
 *                                            API with scripts/fixtures/patients.fixture.json
 *   PW_CHANNEL=chromium                      use Playwright's bundled Chromium instead of Chrome
 */
import { preview } from 'vite'
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { buildAndServe, installApiMock } from './lib/e2e.mjs'

const USE_FIXTURE = process.env.USE_FIXTURE === '1'
const isApiUrl = (u) => u.hostname.endsWith('workers.dev')

const SCREENSHOT_DIR = path.resolve('test-results/screenshots')
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

async function run() {
  console.log('--- 1. Starting Vite Preview Server ---')
  let server
  let url
  if (USE_FIXTURE) {
    ;({ server, url } = await buildAndServe(4173))
    console.log(`FIXTURE MODE: inert-credential build + mocked API at ${url}`)
  } else {
    server = await preview({ preview: { port: 4173 } })
    url = 'http://localhost:4173'
    console.log(`Server running at ${url} (live API)`)
  }

  console.log('--- 2. Launching Playwright Chrome Browser ---')
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PW_CHANNEL === 'chromium'
      ? {}
      : { channel: process.env.PW_CHANNEL || 'chrome' }),
  })
  const context = await browser.newContext()
  if (USE_FIXTURE) await installApiMock(context)
  const page = await context.newPage()

  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  console.log('--- 3. Navigating to Dashboard ---')
  // The expected patient count comes from the API response itself, never from a constant.
  const apiResponse = page.waitForResponse(
    (r) => isApiUrl(new URL(r.url())) && r.request().method() === 'GET',
    { timeout: 20000 },
  )
  await page.goto(url, { waitUntil: 'networkidle' })
  const apiPatients = await (await apiResponse).json()
  if (!Array.isArray(apiPatients) || apiPatients.length === 0) {
    throw new Error('API response was not a non-empty array of patients')
  }
  console.log(`API returned ${apiPatients.length} patients`)

  console.log('--- 4. Validating Jessica Taylor Data Rendering ---')
  await page.waitForSelector('.profile__name', { timeout: 10000 })
  const profileName = await page.textContent('.profile__name')
  console.log(`Profile Name: "${profileName?.trim()}"`)
  if (!profileName?.includes('Jessica Taylor')) {
    throw new Error(`Expected Jessica Taylor but got: "${profileName}"`)
  }

  // Validate Date of Birth
  const dobText = await page.textContent('.details')
  console.log('Details text preview:\n', dobText?.replace(/\s+/g, ' ').trim())
  if (!dobText?.includes('August 23, 1996')) {
    throw new Error('Date of birth "August 23, 1996" was NOT found in patient details!')
  }

  // Validate Vitals
  const vitalsText = await page.textContent('.vitals')
  console.log('Vitals text preview:\n', vitalsText?.replace(/\s+/g, ' ').trim())
  if (
    !vitalsText?.includes('20 bpm') ||
    !vitalsText?.includes('98.6°F') ||
    !vitalsText?.includes('78 bpm')
  ) {
    throw new Error('Vitals readings (20 bpm, 98.6°F, 78 bpm) did not match expectations!')
  }

  // Validate BP Legend
  const bpLegendText = await page.textContent('.bp__legend')
  console.log('BP Legend text preview:\n', bpLegendText?.replace(/\s+/g, ' ').trim())
  if (!bpLegendText?.includes('160') || !bpLegendText?.includes('78')) {
    throw new Error('BP Legend values (160 / 78) did not match expectations!')
  }

  // Validate Diagnostic List
  const diagnosticsCount = await page.locator('.table tbody tr').count()
  console.log(`Diagnostic records rendered: ${diagnosticsCount}`)
  if (diagnosticsCount === 0) {
    throw new Error('Diagnostic list rendered 0 rows!')
  }

  // Validate Lab Results
  const labCount = await page.locator('.lab__item').count()
  console.log(`Lab results rendered: ${labCount}`)
  if (labCount === 0) {
    throw new Error('Lab results rendered 0 items!')
  }

  // Validate Patients in Sidebar: it lists every patient the API returned, no more and no fewer.
  const patientCount = await page.locator('.patients__item').count()
  console.log(`Patients in sidebar: ${patientCount} (API returned ${apiPatients.length})`)
  if (patientCount !== apiPatients.length) {
    throw new Error(
      `Sidebar shows ${patientCount} patients but the API response contained ${apiPatients.length}`,
    )
  }

  console.log('--- 5. Capturing Responsive Viewports ---')
  const viewports = [
    { name: '1440-desktop', width: 1440, height: 900 },
    { name: '1280-desktop', width: 1280, height: 800 },
    { name: '1024-tablet-landscape', width: 1024, height: 768 },
    { name: '768-tablet-portrait', width: 768, height: 1024 },
    { name: '390-mobile-large', width: 390, height: 844 },
    { name: '360-mobile-small', width: 360, height: 740 },
  ]

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.waitForTimeout(300)

    // Check horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    console.log(
      `Viewport ${vp.name} (${vp.width}x${vp.height}): overflow = ${hasHorizontalOverflow}`,
    )
    if (hasHorizontalOverflow) {
      console.warn(`WARNING: Viewport ${vp.name} has horizontal scroll overflow!`)
    }

    const screenshotPath = path.join(SCREENSHOT_DIR, `${vp.name}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`Saved screenshot: ${screenshotPath}`)
  }

  console.log('--- 6. Testing Patient Switching ---')
  const secondPatient = page.locator('.patients__item').nth(1)
  const secondPatientName = await secondPatient.locator('.patients__name').textContent()
  console.log(`Clicking second patient: ${secondPatientName}`)
  await secondPatient.click()
  await page.waitForTimeout(400)
  const updatedProfileName = await page.textContent('.profile__name')
  console.log(`Updated Profile Name: ${updatedProfileName?.trim()}`)
  if (!updatedProfileName?.includes(secondPatientName.trim())) {
    throw new Error(
      `Expected profile to switch to ${secondPatientName}, got: ${updatedProfileName}`,
    )
  }

  // Switch back to Jessica Taylor
  const jessicaItem = page.locator('.patients__item', { hasText: 'Jessica Taylor' })
  await jessicaItem.click()
  await page.waitForTimeout(400)
  const revertedName = await page.textContent('.profile__name')
  console.log(`Reverted Profile Name: ${revertedName?.trim()}`)

  console.log('--- 7. Testing Search Filtering in Sidebar ---')
  const searchBtn = page.locator('button[aria-label="Search patients"]')
  await searchBtn.click()
  await page.waitForSelector('.patients__search-input')
  await page.fill('.patients__search-input', 'Samantha')
  await page.waitForTimeout(200)
  const filteredCount = await page.locator('.patients__item').count()
  console.log(`Search for "Samantha": ${filteredCount} item(s) found`)
  if (filteredCount === 0) {
    throw new Error('Search for Samantha returned 0 results!')
  }
  // Close search
  await page.locator('button[aria-label="Close search"]').click()

  console.log('--- 8. Testing API Failure & Retry Flow ---')
  const failPage = await context.newPage()
  await failPage.route(
    (u) => isApiUrl(u),
    (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: true, error_message: 'Simulated Server Error' }),
      }),
  )

  await failPage.goto(url, { waitUntil: 'domcontentloaded' })
  await failPage.waitForSelector('[role="alert"]', { timeout: 10000 })
  const alertText = await failPage.textContent('[role="alert"]')
  console.log(`Error state rendered: "${alertText?.replace(/\s+/g, ' ').trim()}"`)

  // Unroute and click retry
  await failPage.unrouteAll({ behavior: 'ignoreErrors' })
  const retryBtn = failPage.locator('button:has-text("Try again")')
  await retryBtn.click()
  await failPage.waitForSelector('.profile__name', { timeout: 10000 })
  const recoveredName = await failPage.textContent('.profile__name')
  console.log(`Recovered after retry: "${recoveredName?.trim()}"`)
  if (!recoveredName?.includes('Jessica Taylor')) {
    throw new Error('Retry did not recover Jessica Taylor profile!')
  }

  console.log('--- 9. Console Error Verification ---')
  console.log(`Console error count: ${consoleErrors.length}`)
  if (consoleErrors.length > 0) {
    console.error('Console errors logged:', consoleErrors)
  }

  await browser.close()
  server.httpServer.close()
  console.log('--- ALL BROWSER VALIDATIONS PASSED! ---')
}

run().catch((err) => {
  console.error('Validation failed:', err)
  process.exit(1)
})
