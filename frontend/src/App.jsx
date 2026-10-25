import { Suspense, useState } from 'react'
import { Card } from '@astryxdesign/core/Card'
import { DateInput } from '@astryxdesign/core/DateInput'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack } from '@astryxdesign/core/HStack'
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { Slider } from '@astryxdesign/core/Slider'
import { Text } from '@astryxdesign/core/Text'
import { VStack } from '@astryxdesign/core/VStack'
import { useApi } from './api'
import { DayChart } from './DayChart'
import { Heatmap } from './Heatmap'
import { Kpis } from './Kpis'
import { PlanBars } from './PlanBars'

export default function App() {
  const summary = useApi('/api/summary')
  const days = summary.data?.days
  const [pickedDay, setPickedDay] = useState()
  const day = pickedDay ?? days?.at(-1)
  const [view, setView] = useState('overview')
  const openDay = (value) => {
    setPickedDay(value)
    setView('day')
  }
  // The thumb follows the drag; the API is only asked once the drag ends.
  const [percent, setPercent] = useState(90)
  const [confidence, setConfidence] = useState(0.9)

  return (
    <VStack padding={4} className="app">
      <Card className="stage">
        <VStack gap={4} className="fill">
          <HStack gap={6} wrap="wrap" hAlign="between" vAlign="end">
            <VStack gap={1}>
              <Heading level={1}>Day-ahead wind</Heading>
              <Text color="secondary">
                The forecast you could see at 11:00 UK the day before, and how far to trust it.
              </Text>
            </VStack>
            <HStack gap={4} wrap="wrap" vAlign="end">
              {/* The calendar picks the month it opens on when it mounts, so it mounts again once the days arrive. */}
              <DateInput
                key={days ? 'ready' : 'loading'}
                label="Delivery day"
                value={day}
                onChange={(value) => value && openDay(value)}
                min={days?.[0]}
                max={days?.at(-1)}
                isLoading={!days}
                format="date_weekday"
                weekStartsOn="mon"
              />
              <Slider
                label="Confidence"
                description="How sure you want to be that the wind arrives"
                value={percent}
                onChange={setPercent}
                onChangeEnd={(value) => setConfidence(value / 100)}
                min={50}
                max={99}
                formatValue={(value) => `${value}%`}
                valueDisplay="text"
                width={260}
              />
            </HStack>
          </HStack>
          {summary.error ? (
            <EmptyState title="Could not load the January data" description={summary.error} headingLevel={2} />
          ) : summary.data ? (
            <>
              <SegmentedControl label="View" value={view} onChange={setView}>
                <SegmentedControlItem value="overview" label="Overview" />
                <SegmentedControlItem value="day" label="Delivery day" />
                <SegmentedControlItem value="plan" label="Daily plan" />
                <SegmentedControlItem value="hours" label="Error heatmap" />
              </SegmentedControl>
              {/* Every view stays mounted, so switching back shows it at once with its state kept. */}
              <div className="fill" hidden={view !== 'overview'}>
                <Kpis accuracy={summary.data.accuracy} bands={summary.data.by_wind_band} confidence={confidence} />
              </div>
              <div className="fill" hidden={view !== 'day'}>
                <Suspense fallback={<Skeleton height={380} />}>
                  <DayChart day={day} confidence={confidence} />
                </Suspense>
              </div>
              <div className="fill" hidden={view !== 'plan'}>
                <Suspense fallback={<Skeleton height={400} />}>
                  <PlanBars confidence={confidence} selectedDay={day} onSelectDay={openDay} />
                </Suspense>
              </div>
              <div className="fill" hidden={view !== 'hours'}>
                <Suspense fallback={<Skeleton height={460} />}>
                  <Heatmap days={days} selectedDay={day} onSelectDay={openDay} />
                </Suspense>
              </div>
            </>
          ) : (
            <Skeleton height={48} />
          )}
        </VStack>
      </Card>
    </VStack>
  )
}
