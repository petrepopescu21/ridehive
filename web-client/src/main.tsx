import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.tsx'

console.log('🚀 RideHive Web Client starting...')
console.log('📍 Environment:', import.meta.env.MODE)
console.log('🔧 API URL:', import.meta.env.VITE_API_URL || 'http://localhost:3001')

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ Could not find root element!')
} else {
  console.log('✅ Root element found, mounting React app...')
}

createRoot(rootElement!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

console.log('✅ React app mounted successfully!')
