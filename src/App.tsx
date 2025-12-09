import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'

import { HomePage } from './pages/HomePage'
import { ProgramsPage } from './pages/ProgramsPage'
import { AboutPage } from './pages/AboutPage'
import { OrganizationsPage } from './pages/OrganizationsPage'
import { LoginPage } from './pages/LoginPage'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { OrgDashboard } from './pages/organization/OrgDashboard'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/programs" element={<ProgramsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/organizations" element={<OrganizationsPage />} />
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/organizations"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/carousel"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/announcements"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/programs"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requireOrganization>
                    <OrgDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/carousel"
                element={
                  <ProtectedRoute requireOrganization>
                    <OrgDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/announcements"
                element={
                  <ProtectedRoute requireOrganization>
                    <OrgDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/programs"
                element={
                  <ProtectedRoute requireOrganization>
                    <OrgDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/files"
                element={
                  <ProtectedRoute requireOrganization>
                    <OrgDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
