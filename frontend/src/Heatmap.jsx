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

const dayName = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' })
const HOURS = Array.from({ length: 24 }, (_, h) => h)
const pad = (h) => `${String(h).padStart(2, '0')}:00`

export function Heatmap({ days, selectedDay, onSelectDay }) {
  const { data, error } = useApi('/api/hours')
  const [active, setActive] = useState(null)
  if (error) return <EmptyState title="Could not load the month" description={error} />
  if (!data) return <Skeleton height={460} />

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
    <Card>
      <VStack gap={4}>
        <VStack gap={1}>
          <Heading level={2}>Every hour of the month</Heading>
          <Text color="secondary">
            One cell per delivery hour. The stronger the shade, the further wind came in below forecast; striped cells
            came in above it. Lower rows were forecast further ahead: 14.5 h for 00:00, 37.5 h for 23:00. Pick a day
            to open it above.
          </Text>
        </VStack>
        <HStack gap={4} wrap="wrap" vAlign="center">
          <HStack gap={1} vAlign="center">
            <span className="heat-key" style={{ '--p': '0%' }} />
            <span className="heat-key" style={{ '--p': '50%' }} />
            <span className="heat-key" style={{ '--p': '100%' }} />
            <Text>Below forecast, up to {mw(worst)}</Text>
          </HStack>
          <HStack gap={1} vAlign="center">
            <span className="heat-key above" style={{ '--p': '60%' }} />
            <Text>Above forecast</Text>
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
                  style={{ '--p': `${row ? Math.round((Math.abs(row.error) / worst) * 100) : 0}%` }}
                />
              )
            }),
          ])}
          <span />
          {days.map((day) => (
            <span key={day} className="heat-x" data-picked={day === selectedDay || undefined} aria-hidden="true">
              {Number(day.slice(8))}
            </span>
          ))}
          <div
            className="chart-tip"
            data-flip={active?.d > last / 2 || undefined}
            style={{
              left: `calc(2.5rem + (100% - 2.5rem) * ${((active?.d ?? 0) + 0.5) / days.length})`,
              top: `${((active?.h ?? 0) + 1) * 16}px`,
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
    </Card>
  )
}
