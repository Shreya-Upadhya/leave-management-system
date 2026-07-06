import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AIProvider } from './context/AIContext'; 
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AIProvider> 
        <App />
      </AIProvider>
    </AuthProvider>
  </React.StrictMode>,
)