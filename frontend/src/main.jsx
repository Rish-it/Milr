import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
      <App />
    </Theme>
  </StrictMode>,
)
