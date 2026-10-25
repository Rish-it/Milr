import { useState } from 'react'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { VStack } from '@astryxdesign/core/VStack'
import { useApi } from './api'
import { gapText, mw } from './format'
import { shade } from './theme'

const dayName = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' })
const HOURS = Array.from({ length: 24 }, (_, h) => h)
const pad = (h) => `${String(h).padStart(2, '0')}:00`
const KEYS = [0, 0.25, 0.5, 0.75, 1]

export function Heatmap({ days, selectedDay, onSelectDay }) {
  const { data, error } = useApi('/api/hours')
  const [active, setActive] = useState(null)
  if (error) return <EmptyState title="Could not load the month" description={error} headingLevel={2} />

  const byCell = new Map(data.map((row) => [`${row.day} ${row.hour}`, row]))
  const worst = Math.max(...data.map((row) => Math.abs(row.error)))
  const last = days.length - 1
  const cell = active && byCell.get(`${days[active.d]} ${active.h}`)

  const pick = (event) => {
    const target = event.target.closest('[data-d]')
    if (target) setActive({ d: Number(target.dataset.d), h: Number(target.dataset.h) })
  }
  const step = (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && active) {
      event.preventDefault()
      onSelectDay(days[active.d])
      return
    }
    const move = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]
    if (!move) return
    event.preventDefault()
    setActive((current) => {
      const from = current ?? { d: days.indexOf(selectedDay), h: 0 }
      if (!current) return from
      return { d: Math.min(last, Math.max(0, from.d + move[0])), h: Math.min(23, Math.max(0, from.h + move[1])) }
    })
  }

  return (
    <VStack gap={4} className="fill">
      <VStack gap={1}>
        <Heading level={2}>Every hour of the month</Heading>
        <Text color="secondary">
          One cell per delivery hour, stronger for a bigger gap between forecast and actual: filled where wind came in
          below forecast, outlined where it came in above. Lower rows were forecast further ahead: 14.5 h for 00:00,
          37.5 h for 23:00. Pick a cell to open its day.
        </Text>
      </VStack>
      <HStack gap={4} wrap="wrap" vAlign="center">
        <HStack gap={1} vAlign="center">
          <Text>No gap</Text>
          {KEYS.map((share) => (
            <span key={share} className="heat-key" style={{ '--cell': shade(share) }} />
          ))}
          <Text>{mw(worst)}</Text>
        </HStack>
        <HStack gap={1} vAlign="center">
          <span className="heat-key" style={{ '--cell': shade(0.75) }} />
          <Text>Wind below forecast</Text>
        </HStack>
        <HStack gap={1} vAlign="center">
          <span className="heat-key above" style={{ '--cell': shade(0.75) }} />
          <Text>Wind above forecast</Text>
        </HStack>
      </HStack>
      <div
        className="heat"
        style={{ '--days': days.length }}
        data-active={active ? '' : undefined}
        tabIndex={0}
        role="group"
        aria-roledescription="heatmap"
        aria-label="Forecast error for every delivery hour of the month. Arrow keys move between cells, Enter opens the day."
        onPointerMove={pick}
        onPointerLeave={() => setActive(null)}
        onClick={() => active && onSelectDay(days[active.d])}
        onKeyDown={step}
        onBlur={() => setActive(null)}
      >
        {HOURS.map((h) => [
          <span key={`y${h}`} className="heat-y" aria-hidden="true">
            {h % 6 ? '' : pad(h)}
          </span>,
          ...days.map((day, d) => {
            const row = byCell.get(`${day} ${h}`)
            const lit = active && (active.d === d || active.h === h)
            return (
              <span
                key={`${day} ${h}`}
                data-d={d}
                data-h={h}
                className={`heat-cell${row?.error > 0 ? ' above' : ''}${lit ? ' lit' : ''}`}
                style={{ '--cell': shade(row ? Math.abs(row.error) / worst : 0) }}
              />
            )
          }),
        ])}
        <span />
        {days.map((day, d) => (
          <span
            key={day}
            className="heat-x"
            data-picked={day === selectedDay || undefined}
            data-minor={d % 2 || undefined}
            aria-hidden="true"
          >
            {Number(day.slice(8))}
          </span>
        ))}
        <div
          className="chart-tip"
          data-flip={active?.d > last / 2 || undefined}
          data-up={active?.h > 11 || undefined}
          style={{
            '--x': `calc(2.5rem + (100% - 2.5rem) * ${((active?.d ?? 0) + 0.5) / days.length})`,
            '--y': `calc((100% - 18px) * ${((active?.h ?? 0) + 0.5) / 24})`,
          }}
          hidden={!cell}
          aria-live="polite"
        >
          {cell && (
            <>
              <strong>
                {dayName.format(new Date(cell.day))}, {pad(cell.hour)}
              </strong>
              <span>Forecast {mw(cell.forecast)}</span>
              <span>Actual {mw(cell.actual)}</span>
              <span>{gapText(cell.error)}</span>
              <span className="chart-tip-note">Click or press Enter to open this day</span>
            </>
          )}
        </div>
      </div>
    </VStack>
  )
}
