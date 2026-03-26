export interface Patient {
  id: string
  name: string
  phone: string
  email: string
  cpf: string
  birthDate: string
  address: string
  photo: string | null
  notes: string
  createdAt: string
}

export interface PatientPhoto {
  id: string
  patientId: string
  photo: string
  procedureName: string
  date: string
  notes: string
  createdAt: string
}

export interface Collaborator {
  id: string
  name: string
  phone: string
  email: string
  commissionPercent: number
  role: string
  active: boolean
  hasPassword?: boolean
  createdAt: string
}

export type UserRole = 'admin' | 'collaborator'

export type Permission =
  | '*'
  | 'dashboard'
  | 'pacientes'
  | 'agendamentos'
  | 'colaboradoras'
  | 'estoque'
  | 'financeiro'
  | 'whatsapp'
  | 'usuarios'
  | 'comercial'
  | 'orcamentos'

export interface AuthUser {
  id: string
  username: string
  role: UserRole
  collaboratorId: string | null
  name: string
  permissions: Permission[]
}

export interface SystemUser {
  id: string
  username: string
  name: string
  role: UserRole
  permissions: Permission[]
  collaboratorId: string | null
  active: boolean
  createdAt: string
}

export interface Package {
  id: string
  patientId: string
  collaboratorId?: string
  name: string
  services: string[]
  totalSessions: number
  completedSessions: number
  totalValue: number
  sessionValue: number
  paidValue: number
  status: 'active' | 'completed' | 'cancelled'
  createdAt: string
}

export interface Commission {
  id: string
  collaboratorId: string
  packageId: string
  appointmentId: string
  sessionValue: number
  commissionPercent: number
  collaboratorAmount: number
  clinicAmount: number
  createdAt: string
}

export interface StockItem {
  id: string
  name: string
  category: string
  quantity: number
  minQuantity: number
  unit: string
  costPrice: number
  createdAt: string
}

export interface StockMovement {
  id: string
  stockItemId: string
  type: 'in' | 'out'
  quantity: number
  reason: string
  appointmentId?: string
  createdAt: string
}

export interface Appointment {
  id: string
  patientId: string
  packageId?: string
  collaboratorId?: string
  service: string
  date: string
  time: string
  room: string
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled'
  stockUsed: { stockItemId: string; quantity: number }[]
  notes: string
  createdAt: string
}

export interface Lead {
  id: string
  name: string
  phone: string
  email: string
  source: string
  status: 'novo' | 'em_contato' | 'convertido' | 'perdido'
  notes: string
  createdAt: string
}

export interface Quote {
  id: string
  patientId: string | null
  leadId: string | null
  clientName: string
  clientEmail: string
  procedureName: string
  sessions: number
  totalValue: number
  paymentMethod: string
  status: 'rascunho' | 'enviado' | 'aceito' | 'recusado'
  sentAt: string | null
  notes: string
  createdAt: string
}
