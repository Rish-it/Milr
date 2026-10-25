import { defineTheme } from '@astryxdesign/core/theme'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'

// The Sea ramp, mint to deep purple, as [position, rgb] stops.
const SEA = [
  [0, [210, 255, 225]],
  [0.16, [110, 245, 175]],
  [0.34, [40, 215, 200]],
  [0.52, [40, 150, 235]],
  [0.72, [80, 70, 205]],
  [0.88, [60, 20, 130]],
  [1, [24, 8, 60]],
]

function sea(t) {
  const i = SEA.findIndex(([at]) => at >= t) || 1
  const [a, from] = SEA[i - 1]
  const [b, to] = SEA[i]
  return `rgb(${from.map((c, k) => Math.round(c + ((to[k] - c) * (t - a)) / (b - a))).join(' ')})`
}

// [light, dark] for a share of 0–1. Light runs the ramp as given, dark runs it backwards, so a bigger share always
// sits further from the card.
const tone = (share) => [sea(share), sea(1 - share)]
export const shade = (share) => `light-dark(${tone(share).join(', ')})`

// [light, dark]. Surfaces are grey and told apart by tone, never by a line.
// Applied at runtime by <Theme>; fine for a client-only app with one theme.
export const milrTheme = defineTheme({
  name: 'milr',
  extends: neutralTheme,
  tokens: {
    '--color-background-body': ['#f1f1f1', '#111111'],
    '--color-background-card': ['#ffffff', '#1c1c1c'],
    // Fields and tiles sit on the card, so they take a raised tone; the neutral dark muted tone matched the card.
    '--color-background-surface': ['#f4f4f4', '#242424'],
    '--color-background-popover': ['#ffffff', '#262626'],
    '--color-background-muted': ['#f4f4f4', '#242424'],
    '--color-text-secondary': ['#525252', '#a3a3a3'],
    '--color-border': ['transparent', 'transparent'],
    '--color-border-emphasized': ['transparent', 'transparent'],
  },
  localTokens: {
    // Chart series, each at least 3:1 against the card in both modes.
    '--chart-actual': ['#111111', '#f1f1f1'],
    '--chart-forecast': ['#595959', '#a6a6a6'],
    '--chart-plan': ['#858585', '#808080'],
    '--chart-grid': ['#ececec', '#262626'],
    // Daily plan bars, from the Sea ramp: the plan strong, the safety margin lighter, each at least 3:1 on the card.
    '--sea-plan': tone(0.88),
    '--sea-margin': tone(0.52),
  },
})
