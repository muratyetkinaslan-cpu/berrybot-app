import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { KitPublicView, VeliPublicView } from './KitTracking'

// QR etiketi okutulunca (?kitqr=KT-XXXXXX) login'siz halka açık kit sayfası açılır.
const params = new URLSearchParams(window.location.search)
const kitQr = params.get('kitqr')
const veliQr = params.get('veliqr')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {veliQr ? <VeliPublicView token={veliQr} /> : kitQr ? <KitPublicView code={kitQr} /> : <App />}
  </React.StrictMode>
)
