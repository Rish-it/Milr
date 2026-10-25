const whole = new Intl.NumberFormat('en-GB')

// Sizes only: callers say "below" or "above" in words, so no sign to misread.
export const mw = (value) => `${whole.format(Math.abs(value))} MW`
export const percent = (share) => `${Math.round(share * 100)}%`

export function gapText(error) {
  if (error < 0) return `Wind came in ${mw(error)} below forecast`
  if (error > 0) return `Wind came in ${mw(error)} above forecast`
  return 'Wind matched the forecast'
}
