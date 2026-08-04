import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { KitPublicView } from './KitTracking'

// QR etiketi okutulunca (?kitqr=KT-XXXXXX) login'siz halka açık kit sayfası açılır.
const kitQr = new URLSearchParams(window.location.search).get('kitqr')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {kitQr ? <KitPublicView code={kitQr} /> : <App />}
  </React.StrictMode>
)
