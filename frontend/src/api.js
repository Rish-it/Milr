import { use, useDeferredValue } from 'react'

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

async function getJson(path) {
  const response = await fetch(path).catch((error) => {
    throw new Error(UNREACHABLE, { cause: error })
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(errorMessage(response.status, body))
  }
  return response.json()
}

const requests = new Map()

// One request per path, shared by every caller, settling to { data } or { error }. A failed request stays cached
// too, so a reload is the retry.
export function request(path) {
  if (!requests.has(path)) {
    requests.set(
      path,
      getJson(path).then(
        (data) => ({ data }),
        (error) => ({ error: error.message }),
      ),
    )
  }
  return requests.get(path)
}

// GET a JSON endpoint, suspending on the first load. While a new path loads, the last data stays on screen with
// loading set, instead of falling back to the skeleton.
export function useApi(path) {
  const shown = useDeferredValue(path)
  return { ...use(request(shown)), loading: shown !== path }
}
