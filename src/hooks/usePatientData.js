import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchPatients } from '../services/patientApi'
import { normalizePatient, normalizePatientSummary } from '../utils/dataNormalizer'
import { findTargetPatient, TARGET_PATIENT } from '../utils/patientHelpers'

/**
 * One request per mount/retry; cancelled on unmount. Selecting another patient switches locally
 * from the already-loaded response and never triggers a new request.
 */
export function usePatientData() {
  const [state, setState] = useState({
    status: 'loading',
    patient: null,
    patients: [],
    rawList: [],
    error: null,
  })
  // A ref (not state) so a selection change does not re-run the fetch effect.
  const selectedNameRef = useRef(TARGET_PATIENT)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetchPatients({ signal: controller.signal })
      .then((data) => {
        const summaries = data.map(normalizePatientSummary)
        const targetRaw =
          findTargetPatient(data, selectedNameRef.current) ||
          findTargetPatient(data, TARGET_PATIENT) ||
          data[0]

        setState({
          status: targetRaw ? 'success' : 'empty',
          patient: targetRaw ? normalizePatient(targetRaw) : null,
          patients: summaries,
          rawList: data,
          error: null,
        })
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        setState({
          status: 'error',
          patient: null,
          patients: [],
          rawList: [],
          error: error.message,
        })
      })
    return () => controller.abort()
  }, [attempt])

  const selectPatient = useCallback((name) => {
    selectedNameRef.current = name
    setState((prev) => {
      if (!prev.rawList.length) return prev
      const found = findTargetPatient(prev.rawList, name)
      if (!found) return prev
      return {
        ...prev,
        patient: normalizePatient(found),
        status: 'success',
      }
    })
  }, [])

  const retry = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'loading', error: null }))
    setAttempt((n) => n + 1)
  }, [])

  return {
    status: state.status,
    patient: state.patient,
    patients: state.patients,
    selectPatient,
    error: state.error,
    retry,
  }
}
