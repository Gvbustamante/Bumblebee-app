import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LangProvider } from './data/i18n'
import { AuthProvider } from './data/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LangProvider>
  </React.StrictMode>
)
