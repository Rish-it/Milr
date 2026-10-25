import assert from 'node:assert/strict'
import test from 'node:test'
import { errorMessage, request } from './api.js'

test('error messages come from the FastAPI detail, whatever its shape', () => {
  const notFound = { detail: 'No data for 2026-01-01; available 2026-01-02 to 2026-02-01' }
  assert.equal(errorMessage(404, notFound), notFound.detail)
  const invalid = { detail: [{ loc: ['query', 'confidence'], msg: 'Input should be less than or equal to 0.99' }] }
  assert.equal(errorMessage(422, invalid), 'Input should be less than or equal to 0.99')
  assert.equal(errorMessage(500, null), 'The server answered 500.')
  assert.match(errorMessage(502, null), /Cannot reach the server/)
})

test('a path is fetched once and settles to its data or a readable error', async () => {
  const calls = []
  globalThis.fetch = async (path) => {
    calls.push(path)
    if (path === '/down') throw new TypeError('Failed to fetch')
    if (path === '/missing') return new Response(JSON.stringify({ detail: 'No data' }), { status: 404 })
    return new Response(JSON.stringify([1, 2]))
  }
  assert.equal(request('/ok'), request('/ok'))
  assert.deepEqual(await request('/ok'), { data: [1, 2] })
  assert.deepEqual(await request('/missing'), { error: 'No data' })
  assert.match((await request('/down')).error, /Cannot reach the server/)
  assert.deepEqual(calls, ['/ok', '/missing', '/down'])
})
