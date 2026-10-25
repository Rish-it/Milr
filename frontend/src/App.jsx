import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Heading } from '@astryxdesign/core/Heading'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { Text } from '@astryxdesign/core/Text'
import { VStack } from '@astryxdesign/core/VStack'
import { useApi } from './api'

export default function App() {
  const summary = useApi('/api/summary')
  return (
    <VStack gap={4} padding={4}>
      <Heading level={1}>Day-ahead wind</Heading>
      {summary.error ? (
        <EmptyState title="Could not load the January data" description={summary.error} />
      ) : summary.data ? (
        <Text>{summary.data.days.length} delivery days loaded</Text>
      ) : (
        <Skeleton height={48} />
      )}
    </VStack>
  )
}
