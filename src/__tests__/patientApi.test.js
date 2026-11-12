import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchPatients, ApiError } from '../services/patientApi'

describe('patientApi', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('handles 401 Unauthorized status with actionable message', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    })

    await expect(fetchPatients({ timeoutMs: 0 })).rejects.toThrow(ApiError)
    await expect(fetchPatients({ timeoutMs: 0 })).rejects.toMatchObject({
      status: 401,
      message: expect.stringContaining('Authentication failed'),
    })
  })

  it('handles 403 Forbidden status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    })

    await expect(fetchPatients({ timeoutMs: 0 })).rejects.toMatchObject({
      status: 403,
      message: expect.stringContaining('Access forbidden'),
    })
  })

  it('handles 404 Not Found status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    })

    await expect(fetchPatients({ timeoutMs: 0 })).rejects.toMatchObject({
      status: 404,
      message: expect.stringContaining('not found (404)'),
    })
  })

  it('handles 429 Rate Limit status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    })

    await expect(fetchPatients({ timeoutMs: 0 })).rejects.toMatchObject({
      status: 429,
      message: expect.stringContaining('Too many requests'),
    })
  })

  it('handles 500 Server Error status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    })

    await expect(fetchPatients({ timeoutMs: 0 })).rejects.toMatchObject({
      status: 500,
      message: expect.stringContaining('currently unavailable'),
    })
  })

  it('handles non-array response formats gracefully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ error: 'Invalid object' }),
    })

    await expect(fetchPatients({ timeoutMs: 0 })).rejects.toMatchObject({
      message: expect.stringContaining('expected an array of patients'),
    })
  })

  it('handles empty patient list gracefully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    })

    await expect(fetchPatients({ timeoutMs: 0 })).rejects.toMatchObject({
      message: expect.stringContaining('empty patient list'),
    })
  })

  it('handles invalid JSON responses without crashing', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON at position 0')
      },
    })

    await expect(fetchPatients({ timeoutMs: 0 })).rejects.toMatchObject({
      message: expect.stringContaining('invalid JSON response'),
    })
  })

  it('handles network connection failures', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(fetchPatients({ timeoutMs: 0 })).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining('Unable to reach the patient service'),
    })
  })

  it('returns valid patient data array when API succeeds', async () => {
    const mockData = [{ name: 'Jessica Taylor', age: 28 }]
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    })

    const result = await fetchPatients({ timeoutMs: 0 })
    expect(result).toEqual(mockData)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
          Authorization: expect.stringMatching(/^Basic /),
        }),
      }),
    )
  })
})
