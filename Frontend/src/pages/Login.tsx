import { useState } from 'react'

import {
  useNavigate,
  useLocation,
  Link,
} from 'react-router-dom'

import {
  Activity,
} from 'lucide-react'

import {
  useAuthStore,
} from '@/store/useAuthStore'

import { login } from '@/services/endpoints'

import { toast } from 'sonner'

import axios, {
  isAxiosError,
} from 'axios'

import {
  motion,
  AnimatePresence,
} from 'framer-motion'

import {
  GoogleLogin,
} from "@react-oauth/google"

export default function Login() {

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [isLoading, setIsLoading] =
    useState(false)

  const [loadingStep, setLoadingStep] =
    useState(0)

  const setToken =
    useAuthStore(
      (state) => state.setToken,
    )

  const setUser =
    useAuthStore(
      (state) => state.setUser,
    )

  const navigate =
    useNavigate()

  const location =
    useLocation()

  const searchParams =
    new URLSearchParams(
      location.search,
    )

  const queryRedirect =
    searchParams.get(
      'redirect',
    )

  const redirectPath =
    queryRedirect ||
    (location.state as any)
      ?.from?.pathname

  const loadingTexts = [

    'ESTABLISHING SECURE CONNECTION...',

    'VALIDATING WORKSPACE CREDENTIALS...',

    'DECRYPTING ACCESS TOKEN...',

    'SYNCING TELEMETRY STATE...',

    'AUTHORIZATION APPROVED.',
  ]

  const handleLogin =
    async (
      e: React.FormEvent,
    ) => {

    e.preventDefault()

    setIsLoading(true)

    setLoadingStep(0)

    const stepInterval =
      setInterval(() => {

        setLoadingStep(

          (prev) =>
            (prev < 3
              ? prev + 1
              : prev),
        )

      }, 450)

    try {

      const res =
        await login({

          email,
          password,
        })

      clearInterval(
        stepInterval,
      )

      setLoadingStep(4)

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            300,
          ),
      )

      setToken(
        res.token,
      )

      setUser(
        res.user,
      )

      toast.success(
        'Access terminal unlocked.',
      )

      if (
        res.user
          .subscription_active
      ) {

        navigate(
          '/dashboard',
        )

      } else {

        navigate(
          redirectPath ||
          '/pricing',
        )
      }

    } catch (error) {

      clearInterval(
        stepInterval,
      )

      if (
        isAxiosError(error)
      ) {

        if (
          error.response
            ?.status === 401
        ) {

          toast.error(
            'Invalid credentials.',
          )

        } else {

          toast.error(
            error.response
              ?.data?.message ||
            'Connection timeout.',
          )
        }

      } else {

        toast.error(
          'Unexpected handshake error.',
        )
      }

      console.error(error)

    } finally {

      setIsLoading(false)
    }
  }

  return (

    <div
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-[#0D0D0D]
        text-foreground
        p-4
        select-none
        relative
        overflow-hidden
        font-mono
      "
    >

      <motion.div

        initial={{
          opacity: 0,
          y: 15,
        }}

        animate={{
          opacity: 1,
          y: 0,
        }}

        transition={{
          duration: 0.5,
        }}

        className="
          w-full
          max-w-md
          bg-[#111111]/90
          border
          border-border/80
          rounded
          shadow-2xl
          relative
          z-10
          overflow-hidden
        "
      >

        <div className="p-8">

          <div
            className="
              flex
              flex-col
              items-center
              mb-8
            "
          >

            <div
              className="
                w-14
                h-14
                bg-primary/10
                border
                border-primary/30
                flex
                items-center
                justify-center
                mb-3
              "
            >

              <Activity
                className="
                  text-primary
                  w-7
                  h-7
                "
              />

            </div>

            <h1
              className="
                text-xl
                font-bold
                uppercase
              "
            >
              Access Terminal
            </h1>

          </div>

          <AnimatePresence mode="wait">

            {!isLoading ? (

              <motion.form

                key="form"

                initial={{
                  opacity: 0,
                }}

                animate={{
                  opacity: 1,
                }}

                exit={{
                  opacity: 0,
                }}

                onSubmit={
                  handleLogin
                }

                className="
                  space-y-4
                "
              >

                <input

                  type="email"

                  required

                  placeholder="Email"

                  className="
                    w-full
                    bg-[#151515]
                    border
                    border-border
                    rounded
                    px-4
                    py-3
                    text-sm
                  "

                  value={email}

                  onChange={(e) =>
                    setEmail(
                      e.target.value,
                    )
                  }
                />

                <input

                  type="password"

                  required

                  placeholder="Password"

                  className="
                    w-full
                    bg-[#151515]
                    border
                    border-border
                    rounded
                    px-4
                    py-3
                    text-sm
                  "

                  value={password}

                  onChange={(e) =>
                    setPassword(
                      e.target.value,
                    )
                  }
                />

                <button

                  type="submit"

                  className="
                    w-full
                    bg-primary
                    text-primary-foreground
                    font-bold
                    py-3
                    rounded
                  "
                >

                  Unlock Console

                </button>

                {/* GOOGLE LOGIN */}

                <div
                  className="
                    flex
                    justify-center
                    mt-4
                  "
                >

                  <GoogleLogin

                    onSuccess={
                      async (
                        credentialResponse,
                      ) => {

                      try {

                        const token =
                          credentialResponse
                            .credential

                        const res =
                          await axios.post(

                            "http://127.0.0.1:8080/login/google",

                            {
                              token,
                            },
                          )

                        setToken(
                          res.data.token,
                        )

                        setUser(
                          res.data.user,
                        )

                        toast.success(
                          "Google authentication success",
                        )

                        if (
                          res.data.user
                            .subscription_active
                        ) {

                          navigate(
                            "/dashboard",
                          )

                        } else {

                          navigate(
                            "/pricing",
                          )
                        }

                      } catch (err) {

                        console.error(
                          err,
                        )

                        toast.error(
                          "Google authentication failed",
                        )
                      }
                    }}

                    onError={() => {

                      toast.error(
                        "Google authentication failed",
                      )
                    }}
                  />

                </div>

              </motion.form>

            ) : (

              <div
                className="
                  text-primary
                  text-center
                  py-10
                "
              >

                {
                  loadingTexts[
                    loadingStep
                  ]
                }

              </div>

            )}

          </AnimatePresence>

          <div
            className="
              mt-6
              pt-6
              border-t
              border-border/50
              text-center
            "
          >

            <Link
              to="/register"
              className="
                text-primary
                hover:underline
              "
            >
              Register Profile
            </Link>

          </div>

        </div>

      </motion.div>

    </div>
  )
}