import { useState } from 'react'
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
  const [view, setView] = useState('day')
  const openDay = (value) => {
    setPickedDay(value)
    setView('day')
  }
  // The thumb follows the drag; the API is only asked once the drag ends.
  const [percent, setPercent] = useState(90)
  const [confidence, setConfidence] = useState(0.9)

  return (
    <VStack gap={4} padding={4} className="app">
      <HStack gap={6} wrap="wrap" hAlign="between" vAlign="end">
        <VStack gap={1}>
          <Heading level={1}>Day-ahead wind</Heading>
          <Text color="secondary">The forecast you could see at 11:00 UK the day before, and how far to trust it.</Text>
        </VStack>
        <HStack gap={4} wrap="wrap" vAlign="end">
          <DateInput
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
          <Kpis accuracy={summary.data.accuracy} bands={summary.data.by_wind_band} confidence={confidence} />
          {/* All three views stay mounted, so switching back shows them at once instead of refetching. */}
          <Card className="stage">
            <VStack gap={4} className="fill">
              <SegmentedControl label="View" value={view} onChange={setView}>
                <SegmentedControlItem value="day" label="Day" />
                <SegmentedControlItem value="plan" label="Plan by day" />
                <SegmentedControlItem value="hours" label="Every hour" />
              </SegmentedControl>
              <div className="fill" hidden={view !== 'day'}>
                <DayChart day={day} confidence={confidence} />
              </div>
              <div className="fill" hidden={view !== 'plan'}>
                <PlanBars confidence={confidence} selectedDay={day} onSelectDay={openDay} />
              </div>
              <div className="fill" hidden={view !== 'hours'}>
                <Heatmap days={days} selectedDay={day} onSelectDay={openDay} />
              </div>
            </VStack>
          </Card>
        </>
      ) : (
        <Skeleton height={48} />
      )}
    </VStack>
  )
}
