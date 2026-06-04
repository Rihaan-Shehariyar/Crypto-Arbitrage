import { useEffect } from 'react'

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import axios from 'axios'
import {
	API_URL,
} from '@/config/api'

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

// Admin pages and components
import AdminLogin from '@/pages/admin/Login'
import AdminLayout from '@/components/layout/AdminLayout'
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminUsers from '@/pages/admin/Users'
import AdminUserDetails from '@/pages/admin/UserDetails'
import AdminSystemHealth from '@/pages/admin/SystemHealth'
import {
  ProtectedAdminRoute,
} from '@/components/auth/ProtectedAdminRoute'
import {
  useAuthStore,
} from '@/store/useAuthStore'

import {
  WebSocketProvider,
} from '@/contexts/WebSocketContext'

function RootRoute() {

  const token =
    useAuthStore(
      state => state.token,
    )

  const user =
    useAuthStore(
      state => state.user,
    )

  console.log(
    "TOKEN:",
    token,
  )

  console.log(
    "USER:",
    user,
  )

  if (
    token &&
    user?.role === "admin"
  ) {

    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    )
  }

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

            `${API_URL}/me`,

            {
              headers: {

                Authorization:
                  `Bearer ${token}`,
              },
            },
          )
console.log(
  "ME RESPONSE:",
  res.data,
)

setUser(
  res.data,
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

        {/* ADMIN ROUTES */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        <Route
          path="/admin/*"
          element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <Routes>
                  <Route
                    path="/dashboard"
                    element={<AdminDashboard />}
                  />
                  <Route
                    path="/users"
                    element={<AdminUsers />}
                  />
                  <Route
                    path="/users/:id"
                    element={<AdminUserDetails />}
                  />
                  <Route
                    path="/system"
                    element={<AdminSystemHealth />}
                  />
                  <Route
                    path="*"
                    element={
                      <Navigate
                        to="/admin/dashboard"
                        replace
                      />
                    }
                  />
                </Routes>
              </AdminLayout>
            </ProtectedAdminRoute>
          }
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