import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.onerror = (msg, src, line, col, err) => {
  document.body.innerHTML = `<div style="color:#fff;background:#1a0000;padding:20px;font-family:monospace;font-size:13px;word-break:break-all"><b style="color:#ef4444">JS ERROR</b><br><br>${msg}<br><br>${src}:${line}:${col}<br><br>${err?.stack || ''}</div>`
}
window.onunhandledrejection = (e) => {
  document.body.innerHTML = `<div style="color:#fff;background:#1a0000;padding:20px;font-family:monospace;font-size:13px;word-break:break-all"><b style="color:#ef4444">PROMISE ERROR</b><br><br>${e.reason?.message || e.reason}<br><br>${e.reason?.stack || ''}</div>`
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
