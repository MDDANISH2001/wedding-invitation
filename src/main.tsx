import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { fxConfig } from './config/env'
import { startFoil } from './fx/foil'
import { dua } from './fx/dua'

if (fxConfig.foil) startFoil()
if (fxConfig.dua) dua.preload()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
