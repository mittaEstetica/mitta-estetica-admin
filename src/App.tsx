import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DataProvider, useData } from './contexts/DataContext'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import PatientDetail from './pages/PatientDetail'
import Stock from './pages/Stock'
import Appointments from './pages/Appointments'
import Collaborators from './pages/Collaborators'
import CollaboratorDetail from './pages/CollaboratorDetail'
import Financial from './pages/Financial'
import WhatsAppConfig from './pages/WhatsAppConfig'
import UsersPage from './pages/Users'
import Leads from './pages/Leads'
import Quotes from './pages/Quotes'
import CompletedPackages from './pages/CompletedPackages'
import Transactions from './pages/Transactions'
import type { Permission } from './types'

function ProtectedRoute({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const { hasPermission } = useAuth()
  if (!hasPermission(permission)) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { loading } = useData()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-gold" />
          <p className="mt-4 text-sm text-gray-500">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pacientes" element={<ProtectedRoute permission="pacientes"><Patients /></ProtectedRoute>} />
          <Route path="/pacientes/:id" element={<ProtectedRoute permission="pacientes"><PatientDetail /></ProtectedRoute>} />
          <Route path="/agendamentos" element={<ProtectedRoute permission="agendamentos"><Appointments /></ProtectedRoute>} />
          <Route path="/colaboradoras" element={<ProtectedRoute permission="colaboradoras"><Collaborators /></ProtectedRoute>} />
          <Route path="/colaboradoras/:id" element={<ProtectedRoute permission="colaboradoras"><CollaboratorDetail /></ProtectedRoute>} />
          <Route path="/pacotes-finalizados" element={<ProtectedRoute permission="pacientes"><CompletedPackages /></ProtectedRoute>} />
          <Route path="/comercial" element={<ProtectedRoute permission="comercial"><Leads /></ProtectedRoute>} />
          <Route path="/orcamentos" element={<ProtectedRoute permission="orcamentos"><Quotes /></ProtectedRoute>} />
          <Route path="/estoque" element={<ProtectedRoute permission="estoque"><Stock /></ProtectedRoute>} />
          <Route path="/financeiro" element={<ProtectedRoute permission="financeiro"><Financial /></ProtectedRoute>} />
          <Route path="/fluxo-caixa" element={<ProtectedRoute permission="fluxo-caixa"><Transactions /></ProtectedRoute>} />
          <Route path="/whatsapp" element={<ProtectedRoute permission="whatsapp"><WhatsAppConfig /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute permission="usuarios"><UsersPage /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function AuthenticatedApp() {
  const { user, loading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-gold" />
        </div>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <DataProvider>
      <AppRoutes />
    </DataProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}
