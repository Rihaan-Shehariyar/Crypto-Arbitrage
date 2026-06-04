import React from 'react'
import {
  Navigate,
  useLocation,
} from 'react-router-dom'

import {
  useAuthStore,
} from '@/store/useAuthStore'

interface ProtectedAdminRouteProps {
  children: React.ReactNode
}

export function ProtectedAdminRoute({
  children,
}: ProtectedAdminRouteProps) {

  const token =
    useAuthStore(
      (state) => state.token,
    )

  const user =
    useAuthStore(
      (state) => state.user,
    )

  const hydrated =
    useAuthStore(
      (state) => state.hydrated,
    )

  const location =
    useLocation()

  console.log(
    "ADMIN TOKEN:",
    token,
  )

  console.log(
    "ADMIN USER:",
    user,
  )

  if (!hydrated) {

    return (
      <div
        className="
          min-h-screen
          bg-[#050505]
          flex
          flex-col
          items-center
          justify-center
          text-primary
          font-mono
        "
      >
        <div
          className="
            w-8
            h-8
            rounded-full
            border-2
            border-primary
            border-t-transparent
            animate-spin
            mb-4
          "
        />

        <div
          className="
            tracking-widest
            uppercase
            text-xs
            text-primary/80
          "
        >
          Initializing Admin Session...
        </div>
      </div>
    )
  }

  if (!token) {

    return (
      <Navigate
        to="/login"
        state={{
          from: location,
        }}
        replace
      />
    )
  }

  if (
    user?.role !== "admin"
  ) {

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  return <>{children}</>
}