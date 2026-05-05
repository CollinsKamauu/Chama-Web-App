import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppModeProvider } from './context/AppModeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import ContributionsPage from './pages/ContributionsPage'
import FinancesPage from './pages/FinancesPage'
import HomePage from './pages/HomePage'
import MembersPage from './pages/MembersPage'
import ReviewTransferPage from './pages/ReviewTransferPage'
import CreateInviteCodePage from './pages/CreateInviteCodePage'
import SettingsPage from './pages/SettingsPage'
import TransferFundsPage from './pages/TransferFundsPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ScreenLoadOverlay from './components/ScreenLoadOverlay'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contributions"
        element={
          <ProtectedRoute>
            <ContributionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/members"
        element={
          <ProtectedRoute>
            <MembersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/finances"
        element={
          <ProtectedRoute>
            <FinancesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transfer-funds"
        element={
          <ProtectedRoute>
            <TransferFundsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transfer-funds/review"
        element={
          <ProtectedRoute>
            <ReviewTransferPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-invite-code"
        element={
          <ProtectedRoute>
            <CreateInviteCodePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppModeProvider>
        <ScreenLoadOverlay />
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </AppModeProvider>
    </BrowserRouter>
  )
}
