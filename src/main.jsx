import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// registerType: 'autoUpdate' activates a new service worker in the
// background without asking, but an already-open tab (very common for an
// installed PWA left minimized) keeps running the old JS in memory until
// something reloads it — otherwise a family member can be stuck on a
// stale build indefinitely. Reload as soon as the new worker takes over.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
