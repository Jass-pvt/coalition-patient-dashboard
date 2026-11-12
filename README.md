# Coalition Technologies – Patient Dashboard

React + Vite implementation of the Tech.Care patient dashboard (Adobe XD reference), populated from the
Coalition Technologies Patient Data API. Only **Jessica Taylor** is displayed.

## Stack
React 19, Vite, Chart.js 4 + react-chartjs-2, lucide-react, Fetch API, ESLint (flat config), Prettier. Plain CSS with design tokens.

## Features
- Header, patient panel, diagnosis history, blood pressure chart, vitals cards, diagnostic list, profile and lab results.
- Loading skeleton, error state with retry, empty state, and fallbacks for missing fields.
- Responsive layouts for 1440 / 1366 / 1024 / 768 / 390 / 360 px, no horizontal page overflow.
- Semantic landmarks, heading hierarchy, labelled icon buttons, visible focus, chart text alternative.

## Navigation
The header navigation (Overview, Patients, Schedule, Message, Transactions) is plain React state held in
`App.jsx`; there is no router. **Patients** is the default and shows the full Jessica Taylor dashboard.
**Overview** is a lightweight summary built only from the already-loaded patient response (latest vitals,
record counts, directory size). **Schedule**, **Message** and **Transactions** show an honest placeholder
stating they are outside the scope of this assessment; no appointments, messages or transactions are
invented. The data hook lives above the section switch, so navigating never repeats the API request.
Accessibility: native buttons inside a labelled `nav`, `aria-current="page"` on the active item, Tab and
Enter/Space work natively, ArrowLeft/ArrowRight/Home/End move focus along the bar, and a visually hidden
status region announces section changes.

## Architecture
```
src/
  components/{layout,patient,diagnosis,charts,ui}
  hooks/usePatientData.js      request lifecycle (AbortController, retry)
  services/patientApi.js       single GET + Basic Auth built at runtime
  utils/                       normalizer, date formatting, selection helpers
  styles/                      variables, global, layout, components, responsive
```

## Setup
```bash
npm install
cp .env.example .env      # fill in username/password from the Postman docs
npm run dev
```

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | "Get All Patients" endpoint |
| `VITE_API_USERNAME` / `VITE_API_PASSWORD` | Basic Auth credentials |

The `Authorization: Basic …` header is generated at runtime with `btoa` from these values; no encoded
credential is committed. Vite inlines `VITE_*` values into the client bundle, which is inherent to a
client-only app, so they should only ever be test credentials.

## API integration
`fetchPatients` issues one GET request. `usePatientData` finds Jessica Taylor in the array, passes her record
through `normalizePatient` (safe number/text coercion, chronological sort of `diagnosis_history`, dropping
entries without a usable month/year) and exposes `status`, `patient`, `error` and `retry`. The request is aborted on unmount.

## Chart
`chartConfig.js` holds the dataset builder, options and colors; `BloodPressureChart.jsx` only renders. Data is
the last six real readings, systolic and diastolic as separate datasets, y-axis 60–180 (step 20), custom legend
showing the latest reading, tooltips in mmHg, memoized data, and an `aria-label` summarising the values.

## Commands
```bash
npm run dev               # development server
npm run lint              # ESLint
npm test                  # unit tests (no .env needed)
npm run build             # production build to dist/
npm run preview           # serve the build
npm run test:nav          # Playwright navigation checks (offline: mocked API, own build)
npm run validate:browser  # Playwright end-to-end checks against the live API (needs real .env)
npm run validate          # validate:browser followed by test:nav
USE_FIXTURE=1 npm run validate           # both Playwright suites offline with the mocked API
```
Playwright uses installed Google Chrome by default; set `PW_CHANNEL=chromium` for the bundled browser
(`npx playwright install chromium`). Offline runs use `scripts/fixtures/patients.fixture.json`, which is
synthetic test data shaped like the API, not a copy of the live response. The sidebar check compares the
number of rendered patients with the length of the API response instead of a fixed number.
