import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { Spinner } from './components/ui/Spinner'
import { AuthPage } from './pages/AuthPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { HomeSetupPage } from './pages/HomeSetupPage'
import { HomePage } from './pages/HomePage'
import { AddTaskPage } from './pages/AddTaskPage'
import { HistoryPage } from './pages/HistoryPage'
import { TeamTasksPage } from './pages/TeamTasksPage'
import { OverviewPage } from './pages/OverviewPage'
import { StatsPage } from './pages/StatsPage'
import { SettingsPage } from './pages/SettingsPage'

function AppRoutes() {
  const { firebaseUser, appUser, loading } = useApp()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!firebaseUser) return <AuthPage />
  if (!appUser?.name) return <OnboardingPage />
  if (!appUser?.homeId) return <HomeSetupPage />

  return (
    <Routes>
      <Route path="/home"              element={<HomePage />} />
      <Route path="/add-task"          element={<AddTaskPage />} />
      <Route path="/add-task/:taskId"  element={<AddTaskPage />} />
      <Route path="/history"           element={<HistoryPage />} />
      <Route path="/tasks"             element={<TeamTasksPage />} />
      <Route path="/overview"          element={<OverviewPage />} />
      <Route path="/stats"             element={<StatsPage />} />
      <Route path="/settings"          element={<SettingsPage />} />
      <Route path="*"                  element={<Navigate to="/home" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}
