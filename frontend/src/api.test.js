import assert from 'node:assert/strict'
import test from 'node:test'
import { errorMessage } from './api.js'

test('error messages come from the FastAPI detail, whatever its shape', () => {
  const notFound = { detail: 'No data for 2026-01-01; available 2026-01-02 to 2026-02-01' }
  assert.equal(errorMessage(404, notFound), notFound.detail)
  const invalid = { detail: [{ loc: ['query', 'confidence'], msg: 'Input should be less than or equal to 0.99' }] }
  assert.equal(errorMessage(422, invalid), 'Input should be less than or equal to 0.99')
  assert.equal(errorMessage(500, null), 'The server answered 500.')
  assert.match(errorMessage(502, null), /Cannot reach the server/)
})
