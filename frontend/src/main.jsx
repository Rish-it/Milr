import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { Theme } from '@astryxdesign/core/theme'
import '@astryxdesign/core/reset.css'
import '@astryxdesign/core/astryx.css'
import '@astryxdesign/theme-neutral/fonts.css'
import { milrTheme } from './theme'
import './app.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Theme theme={milrTheme}>
      {/* The app waits for the January summary; each view under it has its own fallback. */}
      <Suspense fallback={<Skeleton height="100dvh" />}>
        <App />
      </Suspense>
    </Theme>
  </StrictMode>,
)
