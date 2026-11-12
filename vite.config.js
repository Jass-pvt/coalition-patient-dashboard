import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // Unit tests mock fetch, but patientApi reads credentials at import time. Provide inert
    // placeholders so `npm test` passes on a clean checkout (no .env, as in the submission ZIP).
    env: {
      VITE_API_USERNAME: 'unit-test-user',
      VITE_API_PASSWORD: 'unit-test-password',
    },
  },
})
