import { Card } from '@astryxdesign/core/Card'
import { Grid } from '@astryxdesign/core/Grid'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { Text } from '@astryxdesign/core/Text'
import { VStack } from '@astryxdesign/core/VStack'
import { useApi } from './api'
import { mw, percent } from './format'

function Kpi({ label, value, children }) {
  return (
    <Card>
      <VStack gap={1}>
        <Text type="label" color="secondary">
          {label}
        </Text>
        <Text type="display-3">{value}</Text>
        <Text type="supporting">{children}</Text>
      </VStack>
    </Card>
  )
}

function Coverage({ confidence }) {
  const { data, error, loading } = useApi(`/api/backtest?confidence=${confidence}`)
  const label = `Hours covered by the ${percent(confidence)} plan`
  if (error) return <Kpi label={label} value="–">{error}</Kpi>
  if (!data) return <Skeleton height={160} />
  return (
    <div aria-busy={loading || undefined} className="kpi-frame">
      <Kpi label={label} value={percent(data.plan.covered)}>
        Of {data.hours} hours replayed, wind reached the plan in {percent(data.plan.covered)}; the forecast alone
        in {percent(data.forecast.covered)}, too high in the other {percent(1 - data.forecast.covered)}. Holding back{' '}
        {mw(data.avg_margin_mw)} cut the average gap below plan from {mw(data.forecast.avg_shortfall_mw)} to{' '}
        {mw(data.plan.avg_shortfall_mw)}.
      </Kpi>
    </div>
  )
}

const way = (bias) => (bias < 0 ? 'below' : 'above')

export function Kpis({ accuracy, bands, confidence }) {
  const high = accuracy.bias < 0
  const [calm, windy] = [bands[0], bands.at(-1)]
  return (
    <Grid columns={{ minWidth: 240, repeat: 'fit' }} gap={4}>
      <Kpi label="Typical miss" value={mw(accuracy.mae)}>
        Average gap between forecast and actual, in either direction, over {accuracy.hours} hours.
      </Kpi>
      <Kpi label={high ? 'Forecast ran high by' : 'Forecast ran low by'} value={mw(accuracy.bias)}>
        On average wind came in this far {way(accuracy.bias)} forecast. The gap grows with wind: {mw(calm.bias)}{' '}
        {way(calm.bias)} when the forecast was {calm.band}, {mw(windy.bias)} at {windy.band}. Curtailment is the likely
        cause.
      </Kpi>
      <Kpi label="Miss, weighting big ones (RMSE)" value={mw(accuracy.rmse)}>
        Like the typical miss, but large misses count extra. Well above it means some hours missed badly.
      </Kpi>
      <Coverage confidence={confidence} />
    </Grid>
  )
}
