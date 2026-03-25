import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { AuthUser, Permission } from '../types'
import { api, setToken } from '../services/api'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
  isCollaborator: boolean
  hasPermission: (perm: Permission) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setLoading(false)
      return
    }

    api.auth.me()
      .then((u) => setUser(u))
      .catch(() => {
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const { token, user: u } = await api.auth.login(username, password)
    setToken(token)
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    api.auth.logout().catch(() => {})
    setToken(null)
    setUser(null)
  }, [])

  const hasPermission = useCallback(
    (perm: Permission): boolean => {
      if (!user) return false
      if (user.permissions.includes('*')) return true
      return user.permissions.includes(perm)
    },
    [user],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin: user?.role === 'admin',
        isCollaborator: user?.role === 'collaborator',
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
