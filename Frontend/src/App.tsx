import { useEffect } from 'react'

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import axios from 'axios'

import { MainLayout } from '@/components/layout/MainLayout'

import {
  ProtectedSubscriptionRoute,
} from '@/components/auth/ProtectedSubscriptionRoute'

import Landing from '@/pages/Landing'
import Pricing from '@/pages/Pricing'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Portfolio from '@/pages/Portfolio'
import Transactions from '@/pages/Transactions'
import Opportunities from '@/pages/Opportunities'
import Profile from '@/pages/Profile'
import Login from '@/pages/Login'

import {
  useAuthStore,
} from '@/store/useAuthStore'

import {
  WebSocketProvider,
} from '@/contexts/WebSocketContext'

function RootRoute() {

  const token =
    useAuthStore(
      (state) => state.token,
    )

  const user =
    useAuthStore(
      (state) => state.user,
    )

  if (
    token &&
    user?.subscription_active
  ) {

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  return <Landing />
}

function App() {

  const token =
    useAuthStore(
      (state) => state.token,
    )

  const setUser =
    useAuthStore(
      (state) => state.setUser,
    )

  const setHydrated =
    useAuthStore(
      (state) =>
        state.setHydrated,
    )

  useEffect(() => {

    const hydrate =
      async () => {

      if (!token) {

        setHydrated(true)

        return
      }

      try {

        const res =
          await axios.get(

            "http://127.0.0.1:8080/me",

            {
              headers: {

                Authorization:
                  `Bearer ${token}`,
              },
            },
          )

        setUser(
          res.data,
        )

      } catch (err) {

        console.error(err)

        useAuthStore
          .getState()
          .logout()
      }

      setHydrated(true)
    }

    hydrate()

  }, [token])

  return (

    <Router>

      <Routes>

        {/* PUBLIC */}

        <Route
          path="/"
          element={<RootRoute />}
        />

        <Route
          path="/landing"
          element={<Landing />}
        />

        <Route
          path="/pricing"
          element={<Pricing />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* PROTECTED */}

        <Route
          path="/*"
          element={

            <ProtectedSubscriptionRoute>

              <WebSocketProvider>

                <MainLayout>

                  <Routes>

                    <Route
                      path="/dashboard"
                      element={<Dashboard />}
                    />

                    <Route
                      path="/opportunities"
                      element={<Opportunities />}
                    />

                    <Route
                      path="/portfolio"
                      element={<Portfolio />}
                    />

                    <Route
                      path="/transactions"
                      element={<Transactions />}
                    />

                    <Route
                      path="/profile"
                      element={<Profile />}
                    />

                  </Routes>

                </MainLayout>

              </WebSocketProvider>

            </ProtectedSubscriptionRoute>
          }
        />

      </Routes>

    </Router>
  )
}

export default App