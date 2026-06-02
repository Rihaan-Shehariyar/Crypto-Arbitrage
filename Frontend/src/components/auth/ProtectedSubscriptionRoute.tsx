import React from 'react'

import {
  Navigate,
  useLocation,
} from 'react-router-dom'

import {
  useAuthStore,
} from '@/store/useAuthStore'

interface Props {

  children: React.ReactNode
}

export function
ProtectedSubscriptionRoute({

  children,

}: Props) {

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

  if (!hydrated) {

    return (

      <div
        className="
          min-h-screen
          bg-black
          flex
          items-center
          justify-center
          text-primary
          font-mono
        "
      >
        INITIALIZING SESSION...
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
    user &&
    !user.subscription_active
  ) {

    return (
      <Navigate
        to="/pricing"
        replace
      />
    )
  }

  return <>{children}</>
}