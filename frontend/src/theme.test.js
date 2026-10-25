import assert from 'node:assert/strict'
import test from 'node:test'
import { shade } from './theme.js'

test('shades run the Sea ramp one way in light and the other in dark', () => {
  assert.equal(shade(0), 'light-dark(rgb(210 255 225), rgb(24 8 60))')
  assert.equal(shade(1), 'light-dark(rgb(24 8 60), rgb(210 255 225))')
  assert.equal(shade(0.52), 'light-dark(rgb(40 150 235), rgb(40 164 227))')
})
