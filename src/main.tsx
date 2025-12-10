import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PaletteProvider } from './contexts/PaletteContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PaletteProvider>
        <App />
      </PaletteProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
