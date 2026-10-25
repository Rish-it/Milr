const whole = new Intl.NumberFormat('en-GB')

// Sizes only: callers say "below" or "above" in words, so no sign to misread.
export const mw = (value) => `${whole.format(Math.abs(value))} MW`
