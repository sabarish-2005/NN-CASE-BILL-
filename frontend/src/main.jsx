import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background:'#0a2e1a', color:'#c9a227', border:'1px solid #c9a227', fontWeight:700, fontFamily:'Inter' },
            success: { iconTheme: { primary:'#c9a227', secondary:'#0a2e1a' } },
            error:   { style: { background:'#1a0000', color:'#ff6b6b', border:'1px solid #dc2626' } },
            duration: 2800,
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
