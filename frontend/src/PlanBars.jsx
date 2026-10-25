import { useState } from 'react'
import { Card } from '@astryxdesign/core/Card'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack } from '@astryxdesign/core/HStack'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { Text } from '@astryxdesign/core/Text'
import { VStack } from '@astryxdesign/core/VStack'
import { useApi } from './api'
import { mw, percent } from './format'

const dayName = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' })

function planText(day) {
  if (day.plan == null) return 'No plan yet: too little history'
  if (day.actual >= day.plan) return 'Wind reached the plan'
  return `Wind came in ${mw(day.plan - day.actual)} below the plan`
}

export function PlanBars({ confidence, selectedDay, onSelectDay }) {
  const { data, error, loading } = useApi(`/api/days?confidence=${confidence}`)
  const [active, setActive] = useState(null)
  if (error) return <EmptyState title="Could not load the month's plans" description={error} />
  if (!data) return <Skeleton height={400} />

  const last = data.length - 1
  const top = Math.ceil(Math.max(...data.flatMap((d) => [d.forecast, d.actual])) / 5000) * 5000
  const height = (value) => `${(Math.max(0, value) / top) * 100}%`
  const ticks = Array.from({ length: top / 5000 + 1 }, (_, i) => i * 5000)
  const day = active === null ? null : data[active]

  const pick = (event) => {
    const target = event.target.closest('[data-i]')
    if (target) setActive(Number(target.dataset.i))
  }
  const step = (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && day) {
      event.preventDefault()
      onSelectDay(day.day)
      return
    }
    const move = { ArrowLeft: -1, ArrowRight: 1, Home: -Infinity, End: Infinity }[event.key]
    if (move === undefined) return
    event.preventDefault()
    setActive((current) => Math.min(last, Math.max(0, (current ?? (move > 0 ? -1 : 1)) + move)))
  }

  return (
    <Card>
      <VStack gap={4}>
        <VStack gap={1}>
          <Heading level={2}>The plan, day by day</Heading>
          <Text color="secondary">
            Each bar is a delivery day&apos;s average forecast, split into what the plan counted on and the safety margin
            it held back at {percent(confidence)} confidence. The mark is where wind actually averaged. Averages hide
            single hours: open a day to see them.
          </Text>
        </VStack>
        <HStack gap={4} wrap="wrap" vAlign="center">
          <HStack gap={1} vAlign="center">
            <span className="bar-key planned" />
            <Text>Plan</Text>
          </HStack>
          <HStack gap={1} vAlign="center">
            <span className="bar-key margin" />
            <Text>Safety margin</Text>
          </HStack>
          <HStack gap={1} vAlign="center">
            <span className="bar-key unplanned" />
            <Text>Forecast, no plan yet (first week)</Text>
          </HStack>
          <HStack gap={1} vAlign="center">
            <span className="bar-key actual" />
            <Text>Actual</Text>
          </HStack>
        </HStack>
        <div className="bars-frame" aria-busy={loading || undefined}>
          <div
            className="bars"
            style={{ '--bars': data.length }}
            data-active={day ? '' : undefined}
            tabIndex={0}
            role="group"
            aria-roledescription="bar chart"
            aria-label="Daily average forecast split into plan and safety margin, with the actual average. Arrow keys move between days, Enter opens the day."
            onPointerMove={pick}
            onPointerLeave={() => setActive(null)}
            onClick={() => day && onSelectDay(day.day)}
            onKeyDown={step}
            onBlur={() => setActive(null)}
          >
            {ticks.map((t) => (
              <span key={t} className="chart-y" style={{ top: `${100 - (t / top) * 100}%` }} aria-hidden="true">
                {t / 1000} GW
              </span>
            ))}
            {data.map((d, i) => (
              <div
                key={d.day}
                className="bar"
                data-i={i}
                data-lit={active === i || undefined}
                style={{ '--i': i }}
                aria-hidden="true"
              >
                {d.plan == null ? (
                  <span className="bar-seg unplanned" style={{ height: height(d.forecast) }} />
                ) : (
                  <>
                    <span className="bar-seg planned" style={{ height: height(d.plan) }} />
                    <span className="bar-seg margin" style={{ height: height(d.forecast - d.plan) }} />
                  </>
                )}
                <span className="bar-actual" style={{ bottom: height(d.actual) }} />
              </div>
            ))}
            <div
              className="chart-tip"
              data-flip={active > last / 2 || undefined}
              style={{ '--x': `${((active ?? 0) + 0.5) * (100 / data.length)}%` }}
              hidden={!day}
              aria-live="polite"
            >
              {day && (
                <>
                  <strong>{dayName.format(new Date(day.day))} · daily average</strong>
                  <span>Forecast {mw(day.forecast)}</span>
                  {day.plan != null && (
                    <span>
                      Plan {mw(day.plan)}, holding back {mw(day.forecast - day.plan)}
                    </span>
                  )}
                  <span>Actual {mw(day.actual)}</span>
                  <span>{planText(day)}</span>
                  <span className="chart-tip-note">Click or press Enter to open this day</span>
                </>
              )}
            </div>
          </div>
          <div className="bars-x" style={{ '--bars': data.length }} aria-hidden="true">
            {data.map((d) => (
              <span key={d.day} className="heat-x" data-picked={d.day === selectedDay || undefined}>
                {Number(d.day.slice(8))}
              </span>
            ))}
          </div>
        </div>
      </VStack>
    </Card>
  )
}
