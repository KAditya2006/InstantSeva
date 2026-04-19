import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'
import RuntimeTranslator from './i18n/RuntimeTranslator.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RuntimeTranslator>
      <App />
    </RuntimeTranslator>
  </StrictMode>,
)
