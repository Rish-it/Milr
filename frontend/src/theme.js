import { defineTheme } from '@astryxdesign/core/theme'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'

// Greys only, [light, dark]. Surfaces are told apart by tone, never by a line.
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
  },
  localTokens: {
    // Chart series, each at least 3:1 against the card in both modes.
    '--chart-actual': ['#111111', '#f1f1f1'],
    '--chart-forecast': ['#595959', '#a6a6a6'],
    '--chart-plan': ['#858585', '#808080'],
    '--chart-grid': ['#ececec', '#262626'],
  },
})
