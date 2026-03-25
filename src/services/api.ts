import type { Patient, Package, StockItem, StockMovement, Appointment, Collaborator, Commission, AuthUser, SystemUser } from '../types'

const API_BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('auth_token')
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('auth_token', token)
  } else {
    localStorage.removeItem('auth_token')
  }
}

async function request<T>(url: string, options?: RequestInit & { skipAuthRedirect?: boolean }): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const { skipAuthRedirect, ...fetchOptions } = options ?? {}

  const res = await fetch(`${API_BASE}${url}`, {
    headers,
    ...fetchOptions,
  })

  if (res.status === 401 && !skipAuthRedirect) {
    setToken(null)
    window.location.reload()
    throw new Error('Sessão expirada')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API error: ${res.status}`)
  }
  return res.json()
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        skipAuthRedirect: true,
      }),
    me: () => request<AuthUser>('/auth/me', { skipAuthRedirect: true }),
    logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST', skipAuthRedirect: true }),
  },

  patients: {
    list: () => request<Patient[]>('/patients'),
    get: (id: string) => request<Patient>(`/patients/${id}`),
    create: (data: Omit<Patient, 'id' | 'createdAt'>) =>
      request<Patient>('/patients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Patient>) =>
      request<Patient>(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/patients/${id}`, { method: 'DELETE' }),
  },

  collaborators: {
    list: () => request<Collaborator[]>('/collaborators'),
    get: (id: string) => request<Collaborator>(`/collaborators/${id}`),
    create: (data: Omit<Collaborator, 'id' | 'createdAt'> & { password?: string }) =>
      request<Collaborator>('/collaborators', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Collaborator> & { password?: string }) =>
      request<Collaborator>(`/collaborators/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/collaborators/${id}`, { method: 'DELETE' }),
  },

  commissions: {
    list: () => request<Commission[]>('/commissions'),
    listByCollaborator: (collaboratorId: string) =>
      request<Commission[]>(`/commissions?collaboratorId=${collaboratorId}`),
  },

  packages: {
    list: () => request<Package[]>('/packages'),
    get: (id: string) => request<Package>(`/packages/${id}`),
    create: (data: Omit<Package, 'id' | 'createdAt'>) =>
      request<Package>('/packages', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Package>) =>
      request<Package>(`/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/packages/${id}`, { method: 'DELETE' }),
  },

  stockItems: {
    list: () => request<StockItem[]>('/stock-items'),
    get: (id: string) => request<StockItem>(`/stock-items/${id}`),
    create: (data: Omit<StockItem, 'id' | 'createdAt'>) =>
      request<StockItem>('/stock-items', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<StockItem>) =>
      request<StockItem>(`/stock-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/stock-items/${id}`, { method: 'DELETE' }),
  },

  stockMovements: {
    list: () => request<StockMovement[]>('/stock-movements'),
    create: (data: Omit<StockMovement, 'id' | 'createdAt'>) =>
      request<StockMovement>('/stock-movements', { method: 'POST', body: JSON.stringify(data) }),
  },

  appointments: {
    list: () => request<Appointment[]>('/appointments'),
    get: (id: string) => request<Appointment>(`/appointments/${id}`),
    create: (data: Omit<Appointment, 'id' | 'createdAt'>) =>
      request<Appointment>('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Appointment>) =>
      request<Appointment>(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/appointments/${id}`, { method: 'DELETE' }),
    complete: (id: string) =>
      request<Appointment>(`/appointments/${id}/complete`, { method: 'POST' }),
    miss: (id: string) =>
      request<Appointment>(`/appointments/${id}/miss`, { method: 'POST' }),
  },

  users: {
    list: () => request<SystemUser[]>('/users'),
    get: (id: string) => request<SystemUser>(`/users/${id}`),
    create: (data: { username: string; password: string; name?: string; role?: string; permissions?: string[]; collaboratorId?: string; active?: boolean }) =>
      request<SystemUser>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { username?: string; password?: string; name?: string; role?: string; permissions?: string[]; collaboratorId?: string; active?: boolean }) =>
      request<SystemUser>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),
  },

  whatsapp: {
    status: () => request<{ status: string; qr: string | null; phone: string | null }>('/whatsapp/status'),
    disconnect: () => request<{ success: boolean }>('/whatsapp/disconnect', { method: 'POST' }),
    sendTest: (phone: string, message: string) =>
      request<{ success: boolean; to: string }>('/whatsapp/send-test', { method: 'POST', body: JSON.stringify({ phone, message }) }),
    previewReminders: () =>
      request<{ date: string; reminders: { appointmentId: string; patientName: string; patientPhone: string; service: string; date: string; time: string }[]; skipped: { appointmentId: string; patientName: string; reason: string }[]; total: number }>('/whatsapp/reminders/preview'),
    sendReminders: (messageTemplate?: string) =>
      request<{ date: string; results: { patient: string; phone: string; status: string; error?: string }[]; sent: number; failed: number }>('/whatsapp/reminders/send', { method: 'POST', body: JSON.stringify({ messageTemplate }) }),
    getSettings: () =>
      request<{ messageTemplate: string; cronHour: string }>('/whatsapp/settings'),
    updateSettings: (data: { messageTemplate?: string; cronHour?: string }) =>
      request<{ success: boolean }>('/whatsapp/settings', { method: 'PUT', body: JSON.stringify(data) }),
  },
}
