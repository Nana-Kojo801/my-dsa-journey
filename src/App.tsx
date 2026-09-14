import { Routes, Route, useParams } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import { RequireAuth } from './components/RequireAuth'
import { AppShell } from './components/AppShell'
import { ErrorBoundary } from './components/ErrorBoundary'

import LandingPage from './pages/LandingPage'
import PublicTreePage from './pages/PublicTreePage'
import AuthPage from './pages/AuthPage'
import TodayPage from './pages/TodayPage'
import StagePage from './pages/StagePage'
import SyllabusPage from './pages/SyllabusPage'
import WeeksPage from './pages/WeeksPage'
import BoardPage from './pages/BoardPage'
import RevealPage from './pages/RevealPage'
import ProfilePage from './pages/ProfilePage'
import CommentsPage from './pages/CommentsPage'
import AdminPage from './pages/AdminPage'
import NotFoundPage from './pages/NotFoundPage'

function SyllabusRoute() {
  const { weekNumber } = useParams()
  return <SyllabusPage weekNumber={Number(weekNumber)} />
}

function StageRoute() {
  const { questionId } = useParams()
  return <StagePage questionId={questionId as string} />
}

function CommentsRoute() {
  const { questionId } = useParams()
  return <CommentsPage questionId={questionId as string} />
}

function RevealRoute() {
  const { weekNumber } = useParams()
  return <RevealPage weekNumber={weekNumber ? Number(weekNumber) : undefined} />
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tree" element={<PublicTreePage />} />
        <Route path="/auth" element={<AuthPage />} />

        <Route
          path="/today"
          element={
            <RequireAuth>
              <AppShell>
                <TodayPage />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/question/:questionId"
          element={
            <RequireAuth>
              <AppShell>
                <StageRoute />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/level/:weekNumber"
          element={
            <RequireAuth>
              <AppShell>
                <SyllabusRoute />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/weeks"
          element={
            <RequireAuth>
              <AppShell>
                <WeeksPage />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/board"
          element={
            <RequireAuth>
              <AppShell>
                <BoardPage />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/reveal"
          element={
            <RequireAuth>
              <AppShell>
                <RevealRoute />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/reveal/:weekNumber"
          element={
            <RequireAuth>
              <AppShell>
                <RevealRoute />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <AppShell>
                <ProfilePage />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/comments/:questionId"
          element={
            <RequireAuth>
              <AppShell>
                <CommentsRoute />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AppShell>
                <AdminPage />
              </AppShell>
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ToastProvider>
    </ErrorBoundary>
  )
}
