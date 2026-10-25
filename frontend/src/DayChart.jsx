import { useState } from 'react'
import { Card } from '@astryxdesign/core/Card'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack } from '@astryxdesign/core/HStack'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { Text } from '@astryxdesign/core/Text'
import { VStack } from '@astryxdesign/core/VStack'
import { useApi } from './api'
import { gapText, mw } from './format'

const UK = 'Europe/London'
const clock = new Intl.DateTimeFormat('en-GB', { timeZone: UK, hour: '2-digit', minute: '2-digit' })
const published = new Intl.DateTimeFormat('en-GB', {
  timeZone: UK,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})
const SERIES = [
  { key: 'forecast', label: 'Forecast' },
  { key: 'actual', label: 'Actual' },
  { key: 'plan', label: 'Plan' },
]

function Swatch({ series }) {
  return (
    <svg width="24" height="8" aria-hidden="true">
      <line x1="2" y1="4" x2="22" y2="4" className={`series series-${series}`} />
    </svg>
  )
}

// Lines are drawn in a 0-100 box stretched to the plot; labels, dots and the tooltip are HTML placed in %,
// so the chart fits any width without measuring it.
function Plot({ hours, label }) {
  const [active, setActive] = useState(null)
  const last = hours.length - 1
  const top = Math.ceil(Math.max(...hours.flatMap((h) => [h.forecast, h.actual, h.plan ?? 0])) / 5000) * 5000
  const x = (i) => (i / last) * 100
  const y = (value) => 100 - (value / top) * 100
  const line = (key) =>
    hours.every((h) => h[key] != null) ? hours.map((h, i) => `${i ? 'L' : 'M'}${x(i)},${y(h[key])}`).join('') : null
  const gap = `${line('forecast')}${hours.map((h, i) => `L${x(last - i)},${y(hours[last - i].actual)}`).join('')}Z`
  const ticks = Array.from({ length: top / 5000 + 1 }, (_, i) => i * 5000)

  const pick = (event) => {
    const box = event.currentTarget.getBoundingClientRect()
    setActive(Math.min(last, Math.max(0, Math.round(((event.clientX - box.left) / box.width) * last))))
  }
  const step = (event) => {
    const move = { ArrowLeft: -1, ArrowRight: 1, Home: -Infinity, End: Infinity }[event.key]
    if (move === undefined) return
    event.preventDefault()
    // The first key press lands on the first hour, whichever way it points.
    setActive((current) => Math.min(last, Math.max(0, (current ?? (move > 0 ? -1 : 1)) + move)))
  }

  const hour = active === null ? null : hours[active]
  return (
    <div
      className="chart"
      tabIndex={0}
      role="group"
      aria-roledescription="chart"
      aria-label={`${label}. Use the arrow keys to read each hour.`}
      onPointerMove={pick}
      onPointerDown={pick}
      onPointerLeave={() => setActive(null)}
      onKeyDown={step}
      onBlur={() => setActive(null)}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {ticks.map((t) => (
          <line key={t} className="chart-grid" x1="0" x2="100" y1={y(t)} y2={y(t)} />
        ))}
        <path className="chart-gap" d={gap} />
        {SERIES.map(({ key }) => line(key) && <path key={key} className={`series series-${key}`} d={line(key)} />)}
      </svg>
      {ticks.map((t) => (
        <span key={t} className="chart-y" style={{ top: `${y(t)}%` }} aria-hidden="true">
          {t / 1000} GW
        </span>
      ))}
      {hours.map((h, i) =>
        i % 3 ? null : (
          <span
            key={h.startTime}
            className="chart-x"
            style={{ left: `${x(i)}%` }}
            data-minor={i % 6 || undefined}
            aria-hidden="true"
          >
            {clock.format(new Date(h.startTime))}
          </span>
        ),
      )}
      {hour && (
        <>
          <span className="chart-band" style={{ left: `${x(active)}%`, width: `${100 / last}%` }} />
          {SERIES.map(
            ({ key }) =>
              hour[key] != null && (
                <span key={key} className={`chart-dot dot-${key}`} style={{ left: `${x(active)}%`, top: `${y(hour[key])}%` }} />
              ),
          )}
        </>
      )}
      <div
        className="chart-tip"
        data-flip={active > last / 2 || undefined}
        style={{ '--x': `${x(active ?? 0)}%` }}
        hidden={!hour}
        aria-live="polite"
      >
        {hour && (
          <>
            <strong>
              {clock.format(new Date(hour.startTime))} ·{' '}
              {(new Date(hour.startTime) - new Date(hour.publishTime)) / 36e5} h ahead
            </strong>
            {SERIES.map(({ key, label: name }) => (
              <span key={key} className="chart-tip-row">
                <Swatch series={key} />
                {name} {hour[key] == null ? 'not available yet' : mw(hour[key])}
              </span>
            ))}
            <span>{gapText(hour.error)}</span>
            <span className="chart-tip-note">Forecast published {published.format(new Date(hour.publishTime))}</span>
          </>
        )}
      </div>
    </div>
  )
}

export function DayChart({ day, confidence }) {
  const { data: hours, error, loading } = useApi(`/api/day/${day}?confidence=${confidence}`)
  if (error) return <EmptyState title="Could not load this day" description={error} />
  if (!hours) return <Skeleton height={380} />

  const noPlan = hours.every((h) => h.plan == null)
  return (
    <Card>
      <VStack gap={4}>
        <VStack gap={1}>
          <Heading level={2}>Forecast vs actual</Heading>
          <Text color="secondary">
            Forecast published {published.format(new Date(hours[0].publishTime))} UK, the newest before the 11:00
            deadline the day before. The plan is the forecast less a safety margin learned from past errors.
          </Text>
        </VStack>
        <HStack gap={4} wrap="wrap">
          {SERIES.map(({ key, label }) => (
            <HStack key={key} gap={1} vAlign="center">
              <Swatch series={key} />
              <Text>
                {label}
                {key === 'plan' && ` (${Math.round(confidence * 100)}% confidence)`}
              </Text>
            </HStack>
          ))}
        </HStack>
        {noPlan && (
          <Text color="secondary">
            No plan for this day: the first week has too little history to learn a safety margin.
          </Text>
        )}
        <div aria-busy={loading || undefined} className="chart-frame">
          <Plot hours={hours} label={`Hourly wind generation for ${day}: forecast, actual and plan`} />
        </div>
      </VStack>
    </Card>
  )
}
