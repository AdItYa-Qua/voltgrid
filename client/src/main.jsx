import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { activateMockBackend } from './services/mockBackend.js'

// Activate mock backend for GitHub Pages (production without a real server)
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  activateMockBackend();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
