import { defineTheme } from '@astryxdesign/core/theme'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'

// [light, dark]. Surfaces are grey and told apart by tone, never by a line.
// Applied at runtime by <Theme>; fine for a client-only app with one theme.
export const milrTheme = defineTheme({
  name: 'milr',
  extends: neutralTheme,
  tokens: {
    '--color-background-body': ['#f1f1f1', '#111111'],
    '--color-background-card': ['#ffffff', '#1c1c1c'],
    '--color-background-surface': ['#ffffff', '#1c1c1c'],
    '--color-background-popover': ['#ffffff', '#262626'],
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
    // Forecast error: warm where wind came in below forecast, cool where above. Cells mix from low (no gap)
    // toward high (the largest gap), so the strongest shade stands out most against the card in both modes.
    '--heat-low': ['#fbecd0', '#3d1a14'],
    '--heat-high': ['#b3261e', '#ffcf70'],
    '--cool-low': ['#dfeaf7', '#14253a'],
    '--cool-high': ['#1f5fa8', '#8ec5ff'],
  },
})
