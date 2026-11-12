const API_URL =
  import.meta.env.VITE_API_URL || 'https://fedskillstest.coalitiontechnologies.workers.dev'
const API_USERNAME = import.meta.env.VITE_API_USERNAME
const API_PASSWORD = import.meta.env.VITE_API_PASSWORD

const DEFAULT_TIMEOUT_MS = 15000

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Builds the HTTP Basic credential at runtime from env values (never hard-coded). */
function buildAuthHeader() {
  if (!API_USERNAME || !API_PASSWORD) {
    throw new ApiError(
      'API credentials are missing. Copy .env.example to .env and fill in the required values.',
      0,
    )
  }
  const bytes = new TextEncoder().encode(`${API_USERNAME}:${API_PASSWORD}`)
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return `Basic ${btoa(binary)}`
}

/** Single GET request for the patient list. Pass an AbortSignal to cancel. */
export async function fetchPatients({ signal, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  let response
  const timeoutController = new AbortController()
  let timeoutId

  // Link caller signal with timeout
  const onCallerAbort = () => timeoutController.abort(signal?.reason)
  if (signal) {
    if (signal.aborted) {
      throw signal.reason || new DOMException('Request aborted by caller', 'AbortError')
    }
    signal.addEventListener('abort', onCallerAbort, { once: true })
  }

  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      timeoutController.abort(new DOMException('Request timeout', 'TimeoutError'))
    }, timeoutMs)
  }

  try {
    response = await fetch(API_URL, {
      method: 'GET',
      headers: { Authorization: buildAuthHeader(), Accept: 'application/json' },
      signal: timeoutController.signal,
    })
  } catch (error) {
    if (error.name === 'AbortError' && signal?.aborted) throw error
    if (error.name === 'TimeoutError' || timeoutController.signal.reason?.name === 'TimeoutError') {
      throw new ApiError('The request timed out while connecting to the patient service. Please try again.', 0)
    }
    if (error instanceof ApiError) throw error
    throw new ApiError('Unable to reach the patient service. Check your network connection.', 0)
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    if (signal) signal.removeEventListener('abort', onCallerAbort)
  }

  if (!response.ok) {
    let message
    switch (response.status) {
      case 401:
        message = 'Authentication failed. Please check the API credentials in your .env file.'
        break
      case 403:
        message = 'Access forbidden. You do not have permission to view patient data.'
        break
      case 404:
        message = 'Patient service endpoint was not found (404). Please verify your API URL.'
        break
      case 429:
        message = 'Too many requests. Please wait a moment and try again.'
        break
      default:
        if (response.status >= 500) {
          message = `The patient service is currently unavailable (status ${response.status}). Please try again later.`
        } else {
          message = `The patient service responded with an error (status ${response.status}).`
        }
    }
    throw new ApiError(message, response.status)
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new ApiError('Received an invalid JSON response from the patient service.', response.status)
  }

  if (!Array.isArray(data)) {
    throw new ApiError('Unexpected response format from the API: expected an array of patients.', 200)
  }

  if (data.length === 0) {
    throw new ApiError('The patient service returned an empty patient list.', 200)
  }

  return data
}
