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
