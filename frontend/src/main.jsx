import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Theme } from '@astryxdesign/core/theme'
import { Heading } from '@astryxdesign/core/Heading'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import '@astryxdesign/core/reset.css'
import '@astryxdesign/core/astryx.css'
import '@astryxdesign/theme-neutral/fonts.css'
import { milrTheme } from './theme'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Theme theme={milrTheme}>
      <Heading level={1}>Milr</Heading>
      <Card>
        <Text>Day-ahead wind</Text>
      </Card>
    </Theme>
  </StrictMode>,
)
