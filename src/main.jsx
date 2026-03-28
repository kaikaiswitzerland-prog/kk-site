import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { IslandModeProvider } from './context/IslandModeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <IslandModeProvider>
      <App />
    </IslandModeProvider>
  </StrictMode>,
)
