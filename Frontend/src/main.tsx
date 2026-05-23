import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { GoogleOAuthProvider } from "@react-oauth/google"
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

createRoot(document.getElementById('root')!).render(

  <StrictMode>

    <GoogleOAuthProvider
      clientId="560044356850-lvlm99cng9i1lusi76dt882eb2b5cvjm.apps.googleusercontent.com"
    >

      <QueryClientProvider client={queryClient}>

        <App />

        <Toaster
          theme="dark"
          position="top-right"
        />

      </QueryClientProvider>

    </GoogleOAuthProvider>

  </StrictMode>,
)