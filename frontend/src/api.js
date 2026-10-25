import { useEffect, useState } from 'react'

const UNREACHABLE = 'Cannot reach the server. Is the backend running?'

// FastAPI errors: 404 carries a sentence, 422 a list of field problems.
// 502-504 come from a proxy in front of a backend that is down.
export function errorMessage(status, body) {
  if (status >= 502 && status <= 504) return UNREACHABLE
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  return `The server answered ${status}.`
}

async function getJson(path, signal) {
  const response = await fetch(path, { signal }).catch((error) => {
    throw signal.aborted ? error : new Error(UNREACHABLE, { cause: error })
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(errorMessage(response.status, body))
  }
  return response.json()
}

// GET a JSON endpoint. While a new path loads, the last data stays available so views don't flash empty.
export function useApi(path) {
  const [result, setResult] = useState({})
  useEffect(() => {
    const controller = new AbortController()
    getJson(path, controller.signal)
      .then((data) => setResult({ path, data }))
      .catch((error) => {
        if (!controller.signal.aborted) setResult({ path, error: error.message })
      })
    return () => controller.abort()
  }, [path])
  return result.path === path ? result : { data: result.data, loading: true }
}
