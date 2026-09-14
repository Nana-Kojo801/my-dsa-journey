import { useEffect, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'
import { Ticker } from './Loading'

function CornerTicker({ label }: { label: string }) {
  return (
    <div className="fixed left-4 top-4 z-50 bg-ground/90 px-3 py-2 backdrop-blur">
      <Ticker label={label} />
    </div>
  )
}

function FireEnsureProfile() {
  const profile = useQuery(api.profiles.getMyProfile)
  const ensureProfile = useMutation(api.profiles.ensureProfile)
  const { signOut } = useAuthActions()

  useEffect(() => {
    if (profile === null) {
      void ensureProfile({}).catch(() => {
        void signOut()
      })
    }
  }, [profile, ensureProfile, signOut])

  return null
}

export function RequireAuth({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <CornerTicker label="READING THE SEASON…" />
      </AuthLoading>
      <Unauthenticated>
        <Navigate to="/auth" replace />
      </Unauthenticated>
      <Authenticated>
        <FireEnsureProfile />
        {children}
      </Authenticated>
    </>
  )
}
