/**
 * Playwright check for the header navigation (Overview / Patients / Schedule / Message / Transactions).
 * Runs offline: builds the app with inert credentials, serves it, and mocks the patient API with a
 * synthetic fixture. Exits non-zero if any check fails.
 *
 *   npm run test:nav            (PW_CHANNEL=chromium to use Playwright's bundled browser)
 */
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { buildAndServe, installApiMock, EXPECTED_AUTH, FIXTURE } from './lib/e2e.mjs'

const SHOTS = path.resolve('test-results/screenshots')
fs.mkdirSync(SHOTS, { recursive: true })

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'patients', label: 'Patients' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'message', label: 'Message' },
  { id: 'transactions', label: 'Transactions' },
]
const PLACEHOLDERS = ['Schedule', 'Message', 'Transactions']
const results = []
let pageErrors = []
let consoleErrors = []

async function check(name, fn) {
  try {
    await fn()
    results.push({ name, ok: true })
    console.log(`  PASS  ${name}`)
  } catch (err) {
    results.push({ name, ok: false, err })
    console.log(`  FAIL  ${name}\n        ${String(err.message).split('\n').join('\n        ')}`)
  }
}

const navButton = (page, label) =>
  page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('button', { name: label, exact: true })

async function expectActive(page, label) {
  for (const { label: l } of SECTIONS) {
    const btn = navButton(page, l)
    if (l === label) {
      assert.equal(
        await btn.getAttribute('aria-current'),
        'page',
        `${l} should have aria-current="page"`,
      )
      assert.match(
        (await btn.getAttribute('class')) ?? '',
        /nav-item--active/,
        `${l} should have active class`,
      )
    } else {
      assert.equal(await btn.getAttribute('aria-current'), null, `${l} must NOT have aria-current`)
      assert.doesNotMatch(
        (await btn.getAttribute('class')) ?? '',
        /nav-item--active/,
        `${l} must not be active`,
      )
    }
  }
  assert.equal(
    await page.locator('nav[aria-label="Primary"] [aria-current="page"]').count(),
    1,
    'exactly one aria-current="page"',
  )
}

async function expectFullPatientsDashboard(page) {
  assert.match((await page.textContent('.profile__name')) ?? '', /Jessica Taylor/)
  const details = (await page.textContent('.details'))?.replace(/\s+/g, ' ') ?? ''
  assert.ok(details.includes('August 23, 1996'), `DOB missing: ${details}`)
  const vitals = (await page.textContent('.vitals'))?.replace(/\s+/g, ' ') ?? ''
  for (const v of ['20 bpm', '98.6°F', '78 bpm'])
    assert.ok(vitals.includes(v), `vital ${v} missing`)
  const legend = (await page.textContent('.bp__legend')) ?? ''
  assert.ok(legend.includes('160') && legend.includes('78'), 'BP legend 160/78 missing')
  assert.equal(await page.locator('.bp canvas').count(), 1, 'BP chart canvas')
  assert.equal(await page.locator('.table tbody tr').count(), 3, 'diagnostic rows')
  assert.equal(await page.locator('.lab__item').count(), 4, 'lab items')
  assert.equal(
    await page.locator('.patients__item').count(),
    FIXTURE.length,
    'sidebar count == response length',
  )
}

async function freshPage(
  browser,
  url,
  mockOpts,
  viewport = { width: 1440, height: 900 },
  { collectConsole = true } = {},
) {
  const context = await browser.newContext({ viewport })
  const { apiRequests } = await installApiMock(context, mockOpts)
  const page = await context.newPage()
  page.on('pageerror', (e) => pageErrors.push(String(e)))
  if (collectConsole) {
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text())
    })
  }
  await page.goto(url, { waitUntil: 'load' })
  return { context, page, apiRequests }
}

async function main() {
  console.log('Building e2e bundle (inert credentials) and starting preview server...')
  const { server, url } = await buildAndServe(4174)
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PW_CHANNEL === 'chromium'
      ? {}
      : { channel: process.env.PW_CHANNEL || 'chrome' }),
  })
  console.log(
    `Browser: Chromium/Chrome ${browser.version()}  |  fixture patients: ${FIXTURE.length}\n`,
  )

  try {
    // ---------------------------------------------------------------- 1. default state
    const { context, page, apiRequests } = await freshPage(browser, url)
    // Do not throw here: if the default view is wrong, the checks below should fail one by one.
    await page.waitForSelector('.profile__name', { timeout: 5000 }).catch(() => {})

    console.log('1. Default state')
    await check('Patients is active by default (aria-current + active class, others not)', () =>
      expectActive(page, 'Patients'),
    )
    await check('Default view is the complete Jessica Taylor dashboard', () =>
      expectFullPatientsDashboard(page),
    )
    await check(
      'Exactly one patient API request on load, GET with runtime-built Basic auth',
      async () => {
        assert.equal(apiRequests.length, 1, `requests: ${apiRequests.length}`)
        assert.equal(apiRequests[0].method, 'GET')
        assert.equal(apiRequests[0].auth, EXPECTED_AUTH)
      },
    )
    await check('All five nav items are buttons in the Primary navigation landmark', async () => {
      const names = await page
        .getByRole('navigation', { name: 'Primary' })
        .getByRole('button')
        .allTextContents()
      assert.deepEqual(
        names.map((s) => s.trim()),
        SECTIONS.map((s) => s.label),
      )
    })

    // ---------------------------------------------------------------- 2. every item by click
    console.log('\n2. Click every item (Overview, Patients, Schedule, Message, Transactions)')
    await page.evaluate(() => {
      window.__noReloadSentinel = 'alive'
    })

    await check(
      'Overview: click -> active, summary from existing data, no profile dashboard',
      async () => {
        await navButton(page, 'Overview').click()
        await expectActive(page, 'Overview')
        const main = page.locator('main.overview')
        await main.waitFor()
        assert.equal(await main.getByRole('heading', { name: 'Overview', level: 2 }).count(), 1)
        const text = ((await main.innerText()) ?? '').replace(/\s+/g, ' ')
        for (const expected of [
          'Jessica Taylor',
          'Female, 28 years',
          'March, 2024',
          '160/78 mmHg',
          '78 bpm',
          '20 bpm',
          '98.6°F',
          'Diagnostic records 3',
          '1 Under Observation · 1 Cured · 1 Inactive',
          'Lab results 4',
          'Recorded readings 6',
          `Patients in directory ${FIXTURE.length}`,
        ]) {
          assert.ok(text.includes(expected), `Overview missing "${expected}". Got: ${text}`)
        }
        assert.equal(await page.locator('.profile__name').count(), 0, 'dashboard must be hidden')
        assert.equal(await page.locator('.patients__item').count(), 0)
        assert.equal(
          ((await page.getByTestId('section-announcer').textContent()) ?? '').trim(),
          'Overview section',
        )
        await page.screenshot({ path: path.join(SHOTS, 'nav-overview-1440.png'), fullPage: true })
      },
    )

    for (const label of PLACEHOLDERS) {
      await check(
        `${label}: click -> active, honest out-of-scope placeholder, no invented data`,
        async () => {
          await navButton(page, label).click()
          await expectActive(page, label)
          const main = page.locator('main.section-placeholder')
          await main.waitFor()
          assert.equal(await main.getByRole('heading', { name: label, level: 2 }).count(), 1)
          const text = ((await main.innerText()) ?? '').replace(/\s+/g, ' ').trim()
          assert.ok(
            text.includes('This section is outside the scope of this assessment.'),
            `text: ${text}`,
          )
          // Exact content: heading + two sentences + back button. Anything else would be invented.
          assert.equal(
            text,
            `${label} This section is outside the scope of this assessment. The assessment covers the Patients dashboard only, so no ${label.toLowerCase()} data is shown here. Back to Patients`,
          )
          assert.equal(
            await main.locator('table, ul, ol, li, input, textarea').count(),
            0,
            'no data widgets',
          )
          assert.ok(!/[$€£]|\d/.test(text), `placeholder must contain no figures: ${text}`)
          assert.equal(await page.locator('.profile__name').count(), 0)
          assert.equal(
            ((await page.getByTestId('section-announcer').textContent()) ?? '').trim(),
            `${label} section`,
          )
          await page.screenshot({
            path: path.join(SHOTS, `nav-${label.toLowerCase()}-1440.png`),
            fullPage: true,
          })
        },
      )
    }

    await check('Patients: click back -> active and the full dashboard is restored', async () => {
      await navButton(page, 'Patients').click()
      await expectActive(page, 'Patients')
      await page.waitForSelector('.profile__name')
      await expectFullPatientsDashboard(page)
    })

    await check('Navigation caused no extra API calls and no page reload', async () => {
      assert.equal(
        apiRequests.length,
        1,
        `API requests after navigating everything: ${apiRequests.length}`,
      )
      assert.equal(await page.evaluate(() => window.__noReloadSentinel), 'alive', 'page reloaded')
    })

    await check(
      'Rapid repeated switching ends in a consistent state (one active item)',
      async () => {
        for (const l of [
          'Overview',
          'Message',
          'Patients',
          'Transactions',
          'Overview',
          'Schedule',
          'Patients',
        ]) {
          await navButton(page, l).click()
        }
        await expectActive(page, 'Patients')
        await expectFullPatientsDashboard(page)
        assert.equal(apiRequests.length, 1)
      },
    )

    console.log('\n3. Placeholder "Back to Patients" and logo')
    await check('"Back to Patients" button returns to the dashboard', async () => {
      await navButton(page, 'Schedule').click()
      await page.getByRole('button', { name: 'Back to Patients' }).click()
      await expectActive(page, 'Patients')
      await expectFullPatientsDashboard(page)
    })
    await check('Logo click returns to Patients without reloading or refetching', async () => {
      await navButton(page, 'Transactions').click()
      await page.getByRole('link', { name: 'Tech.Care home' }).click()
      await expectActive(page, 'Patients')
      await expectFullPatientsDashboard(page)
      assert.equal(
        await page.evaluate(() => window.__noReloadSentinel),
        'alive',
        'logo caused reload',
      )
      assert.equal(apiRequests.length, 1)
    })

    // ---------------------------------------------------------------- 4. keyboard
    console.log('\n4. Keyboard accessibility')
    const activeLabel = () => page.evaluate(() => document.activeElement?.textContent?.trim())
    await check('Tab order: every nav item is reachable with Tab, in visual order', async () => {
      await navButton(page, 'Overview').focus()
      const seen = [await activeLabel()]
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press('Tab')
        seen.push(await activeLabel())
      }
      assert.deepEqual(
        seen,
        SECTIONS.map((s) => s.label),
      )
    })
    await check('Enter activates the focused item (Overview)', async () => {
      await navButton(page, 'Overview').focus()
      await page.keyboard.press('Enter')
      await expectActive(page, 'Overview')
      assert.equal(await page.locator('main.overview').count(), 1)
    })
    await check('Space activates the focused item (Message)', async () => {
      await navButton(page, 'Message').focus()
      await page.keyboard.press('Space')
      await expectActive(page, 'Message')
      assert.equal(await page.locator('main.section-placeholder').count(), 1)
    })
    await check(
      'Enter activates Schedule and Transactions; Patients restores the dashboard',
      async () => {
        await navButton(page, 'Schedule').focus()
        await page.keyboard.press('Enter')
        await expectActive(page, 'Schedule')
        await navButton(page, 'Transactions').focus()
        await page.keyboard.press('Enter')
        await expectActive(page, 'Transactions')
        await navButton(page, 'Patients').focus()
        await page.keyboard.press('Enter')
        await expectActive(page, 'Patients')
        await expectFullPatientsDashboard(page)
      },
    )
    await check('Arrow keys move focus only (no activation); wraps at both ends', async () => {
      await navButton(page, 'Patients').focus()
      await page.keyboard.press('ArrowRight')
      assert.equal(await activeLabel(), 'Schedule')
      await expectActive(page, 'Patients') // focus moved, selection did not
      await page.keyboard.press('ArrowLeft')
      assert.equal(await activeLabel(), 'Patients')
      await navButton(page, 'Overview').focus()
      await page.keyboard.press('ArrowLeft')
      assert.equal(await activeLabel(), 'Transactions', 'ArrowLeft wraps to last')
      await page.keyboard.press('ArrowRight')
      assert.equal(await activeLabel(), 'Overview', 'ArrowRight wraps to first')
      await page.keyboard.press('End')
      assert.equal(await activeLabel(), 'Transactions')
      await page.keyboard.press('Home')
      assert.equal(await activeLabel(), 'Overview')
      await expectActive(page, 'Patients')
    })
    await check(
      'Focus stays on the nav button after activation (keyboard user is not displaced)',
      async () => {
        await navButton(page, 'Message').focus()
        await page.keyboard.press('Enter')
        assert.equal(await activeLabel(), 'Message')
        await navButton(page, 'Patients').focus()
        await page.keyboard.press('Enter')
      },
    )
    await check('Focused nav item has a visible focus indicator', async () => {
      await navButton(page, 'Overview').focus()
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab')
      const outline = await navButton(page, 'Overview').evaluate((el) => {
        const s = getComputedStyle(el)
        return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }
      })
      assert.ok(
        outline.style !== 'none' && outline.width > 0,
        `outline: ${JSON.stringify(outline)}`,
      )
    })
    await context.close()

    // ---------------------------------------------------------------- 5. loading / error states
    console.log('\n5. Navigation while loading and on API error')
    await check(
      'While the API is slow: Schedule shows placeholder immediately; Overview waits, then shows data; still 1 request',
      async () => {
        const ctx = await freshPage(browser, url, { delayMs: 1500 })
        await expectActive(ctx.page, 'Patients')
        await navButton(ctx.page, 'Schedule').click()
        await ctx.page.locator('main.section-placeholder').waitFor({ timeout: 800 })
        await navButton(ctx.page, 'Overview').click()
        await expectActive(ctx.page, 'Overview')
        assert.equal(
          await ctx.page.getByText('Loading patient data…').count(),
          1,
          'loading status shown',
        )
        await ctx.page.locator('main.overview').waitFor({ timeout: 8000 })
        assert.ok(
          ((await ctx.page.locator('main.overview').innerText()) ?? '').includes('160/78 mmHg'),
        )
        assert.equal(ctx.apiRequests.length, 1)
        await ctx.context.close()
      },
    )
    await check(
      'API 500: Overview shows the existing error state; placeholders still work; nav stays usable',
      async () => {
        // The browser logs the deliberate HTTP 500 as a console error, so this one context is not collected.
        const ctx = await freshPage(browser, url, { status: 500 }, undefined, {
          collectConsole: false,
        })
        await ctx.page.waitForSelector('[role="alert"]')
        await expectActive(ctx.page, 'Patients')
        await navButton(ctx.page, 'Overview').click()
        await expectActive(ctx.page, 'Overview')
        assert.equal(await ctx.page.locator('[role="alert"]').count(), 1)
        await navButton(ctx.page, 'Transactions').click()
        await expectActive(ctx.page, 'Transactions')
        assert.equal(await ctx.page.locator('main.section-placeholder').count(), 1)
        assert.equal(await ctx.page.locator('[role="alert"]').count(), 0)
        assert.equal(ctx.apiRequests.length, 1, 'no automatic retries from navigation')
        await ctx.context.close()
      },
    )

    // ---------------------------------------------------------------- 6. responsive
    console.log('\n6. Responsive: nav works and nothing overflows horizontally')
    for (const vp of [
      { name: '1024', width: 1024, height: 768 },
      { name: '768', width: 768, height: 1024 },
      { name: '390', width: 390, height: 844 },
      { name: '360', width: 360, height: 740 },
    ]) {
      await check(
        `${vp.width}px: all five items clickable, no page-level horizontal overflow`,
        async () => {
          const ctx = await freshPage(browser, url, {}, { width: vp.width, height: vp.height })
          await ctx.page.waitForSelector('.profile__name')
          for (const { label } of SECTIONS) {
            await navButton(ctx.page, label).scrollIntoViewIfNeeded()
            await navButton(ctx.page, label).click()
            await expectActive(ctx.page, label)
            const overflow = await ctx.page.evaluate(
              () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
            )
            assert.equal(overflow, false, `overflow on ${label} at ${vp.width}px`)
          }
          await ctx.page.screenshot({
            path: path.join(SHOTS, `nav-transactions-${vp.name}.png`),
            fullPage: true,
          })
          await navButton(ctx.page, 'Overview').click()
          await ctx.page.screenshot({
            path: path.join(SHOTS, `nav-overview-${vp.name}.png`),
            fullPage: true,
          })
          assert.equal(ctx.apiRequests.length, 1)
          await ctx.context.close()
        },
      )
    }

    await check(
      '360px and 390px: a keyboard-focused nav item is scrolled fully into view; targets meet the 24px WCAG 2.2 AA minimum',
      async () => {
        for (const width of [360, 390]) {
          const ctx = await freshPage(browser, url, {}, { width, height: 800 })
          await ctx.page.waitForSelector('.profile__name')
          await navButton(ctx.page, 'Overview').focus()
          for (let i = 0; i < 4; i++) await ctx.page.keyboard.press('Tab')
          const r = await ctx.page.evaluate(() => {
            const el = document.activeElement
            const b = el.getBoundingClientRect()
            const c = el.closest('ul').getBoundingClientRect()
            const heights = [...el.closest('ul').querySelectorAll('button')].map(
              (x) => x.getBoundingClientRect().height,
            )
            return {
              label: el.textContent.trim(),
              inside: b.left >= c.left - 1 && b.right <= c.right + 1,
              minHeight: Math.min(...heights),
            }
          })
          assert.equal(r.label, 'Transactions')
          assert.ok(r.inside, `focused item clipped at ${width}px`)
          assert.ok(r.minHeight >= 24, `touch target height ${r.minHeight}px at ${width}px`)
          await ctx.context.close()
        }
      },
    )

    console.log('\n7. Patient selection and sidebar semantics')
    {
      const ctx = await freshPage(browser, url)
      const sp = ctx.page
      await sp.waitForSelector('.profile__name')
      const profileName = async () => ((await sp.textContent('.profile__name')) ?? '').trim()
      const selectBtn = (name) =>
        sp.locator('.patients__item', { hasText: name }).locator('.patients__select')

      await check(
        'Selecting patients switches the profile with NO additional API request',
        async () => {
          for (const n of ['Ryan Johnson', 'Samantha Johnson', 'Jessica Taylor']) {
            await selectBtn(n).click()
            await sp.waitForFunction(
              (x) => document.querySelector('.profile__name')?.textContent?.includes(x),
              n,
            )
            assert.equal(await profileName(), n)
            assert.equal(
              ctx.apiRequests.length,
              1,
              `requests after selecting ${n}: ${ctx.apiRequests.length}`,
            )
          }
        },
      )
      await check(
        'Selected row is exposed with aria-current on its button (exactly one)',
        async () => {
          await selectBtn('Ryan Johnson').click()
          assert.equal(await sp.locator('.patients__select[aria-current="true"]').count(), 1)
          assert.equal(await selectBtn('Ryan Johnson').getAttribute('aria-current'), 'true')
        },
      )
      await check(
        'No nested interactive elements and no role="button" list items in the sidebar',
        async () => {
          const bad = await sp.evaluate(() => ({
            roleButtons: document.querySelectorAll('.patients [role="button"]').length,
            liWithRole: document.querySelectorAll('.patients li[role]').length,
            nested: document.querySelectorAll(
              '.patients button button, .patients button a, .patients a button, .patients button [tabindex]',
            ).length,
            tabindexed: document.querySelectorAll('.patients li[tabindex]').length,
          }))
          assert.deepEqual(bad, { roleButtons: 0, liWithRole: 0, nested: 0, tabindexed: 0 })
          const perRow = await sp
            .locator('.patients__item')
            .evaluateAll((rows) => rows.map((r) => r.querySelectorAll('button').length))
          assert.deepEqual(
            perRow,
            FIXTURE.map(() => 2),
            'each row: one select button + one "More options" button',
          )
        },
      )
      await check(
        'Keyboard: Enter and Space on a row button select that patient; Tab reaches "More options"',
        async () => {
          await selectBtn('Samantha Johnson').focus()
          await sp.keyboard.press('Enter')
          assert.equal(await profileName(), 'Samantha Johnson')
          await selectBtn('Ryan Johnson').focus()
          await sp.keyboard.press('Space')
          assert.equal(await profileName(), 'Ryan Johnson')
          await sp.keyboard.press('Tab')
          const label = await sp.evaluate(() => document.activeElement?.getAttribute('aria-label'))
          assert.equal(label, 'More options for Ryan Johnson')
          assert.equal(ctx.apiRequests.length, 1)
        },
      )
      await check('Keyboard focus on a row shows a visible indicator', async () => {
        await sp
          .locator('.patients__search-input, body')
          .first()
          .focus()
          .catch(() => {})
        await selectBtn('Emily Williams').focus()
        await sp.keyboard.press('Shift+Tab')
        await sp.keyboard.press('Tab')
        const o = await selectBtn('Emily Williams').evaluate((el) => {
          const s = getComputedStyle(el, '::after')
          return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }
        })
        assert.ok(o.style !== 'none' && o.width > 0, JSON.stringify(o))
      })
      await check(
        'The whole row is still clickable (edge of the row), but "More options" does not select',
        async () => {
          const row = sp.locator('.patients__item', { hasText: 'Emily Williams' })
          const box = await row.boundingBox()
          await sp.mouse.click(box.x + 3, box.y + box.height / 2)
          assert.equal(await profileName(), 'Emily Williams')
          await sp.getByRole('button', { name: 'More options for Ryan Johnson' }).click()
          assert.equal(
            await profileName(),
            'Emily Williams',
            '"More options" must not change the selection',
          )
        },
      )
      await check(
        'Selection survives navigation; Overview is derived from the selected patient without inventing data',
        async () => {
          await selectBtn('Ryan Johnson').click()
          await navButton(sp, 'Overview').click()
          const text = ((await sp.locator('main.overview').innerText()) ?? '').replace(/\s+/g, ' ')
          assert.ok(text.includes('Summary for Ryan Johnson (Male, 45 years)'), text)
          assert.ok(
            text.includes('Blood pressure —') &&
              text.includes('Heart rate —') &&
              text.includes('Temperature —'),
            text,
          )
          assert.ok(
            text.includes('Diagnostic records 0') &&
              text.includes(`Patients in directory ${FIXTURE.length}`),
            text,
          )
          await navButton(sp, 'Patients').click()
          assert.equal(await profileName(), 'Ryan Johnson')
          assert.equal(ctx.apiRequests.length, 1, 'still one request after selection + navigation')
        },
      )
      await ctx.context.close()
    }

    console.log('\n8. Empty and malformed API responses')
    await check(
      'Empty list and non-array responses show the shared error card; navigation still works',
      async () => {
        for (const body of [[], { foo: 1 }]) {
          const ctx = await freshPage(browser, url, { body })
          await ctx.page.waitForSelector('[role="alert"]')
          assert.match(
            (await ctx.page.locator('[role="alert"] h2').textContent()) ?? '',
            /Unable to load patient data/,
          )
          assert.equal(await ctx.page.getByRole('button', { name: 'Try again' }).count(), 1)
          await navButton(ctx.page, 'Message').click()
          await expectActive(ctx.page, 'Message')
          assert.equal(await ctx.page.locator('main.section-placeholder').count(), 1)
          await ctx.context.close()
        }
      },
    )
    await check('"Try again" after a failure re-requests once and recovers', async () => {
      const context = await browser.newContext()
      let calls = 0
      const { apiRequests } = await installApiMock(context)
      await context.route(
        (u) => u.hostname.endsWith('workers.dev'),
        async (route) => {
          if (route.request().method() === 'OPTIONS') return route.fallback()
          calls += 1
          if (calls === 1) {
            return route.fulfill({
              status: 500,
              headers: { 'access-control-allow-origin': '*' },
              contentType: 'application/json',
              body: '{}',
            })
          }
          return route.fallback()
        },
      )
      const rp = await context.newPage()
      await rp.goto(url)
      await rp.waitForSelector('[role="alert"]')
      await rp.getByRole('button', { name: 'Try again' }).click()
      await rp.waitForSelector('.profile__name')
      assert.equal(calls, 2, `API calls: ${calls}`)
      assert.equal(apiRequests.length, 1, 'fixture served the retry')
      await context.close()
    })

    console.log('\n9. Runtime errors')
    await check(
      'No page errors and no console errors (unfiltered; the deliberate-500 context excluded)',
      () => {
        assert.deepEqual(pageErrors, [])
        assert.deepEqual(consoleErrors, [], `console errors: ${consoleErrors.join(' | ')}`)
      },
    )
  } finally {
    await browser.close()
    await new Promise((r) => server.httpServer.close(r))
  }

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
  if (consoleErrors.length)
    console.log(`(console error lines seen, incl. expected 500 test: ${consoleErrors.length})`)
  process.exit(failed.length ? 1 : 0)
}

main().catch((err) => {
  console.error('Navigation validation crashed:', err)
  process.exit(1)
})
