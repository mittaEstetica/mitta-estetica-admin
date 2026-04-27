import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Warehouse,
  CalendarDays,
  UserCheck,
  DollarSign,
  MessageCircle,
  UserCog,
  X,
  Sparkles,
  LogOut,
  Megaphone,
  FileText,
  PackageCheck,
  ArrowLeftRight,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import type { Permission } from '../../types'

const allLinks: { to: string; icon: typeof LayoutDashboard; label: string; permission: Permission }[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', permission: 'dashboard' },
  { to: '/pacientes', icon: Users, label: 'Pacientes', permission: 'pacientes' },
  { to: '/agendamentos', icon: CalendarDays, label: 'Agenda', permission: 'agendamentos' },
  { to: '/colaboradoras', icon: UserCheck, label: 'Colaboradoras', permission: 'colaboradoras' },
  { to: '/pacotes-finalizados', icon: PackageCheck, label: 'Pacotes Finalizados', permission: 'pacientes' },
  { to: '/comercial', icon: Megaphone, label: 'Comercial', permission: 'comercial' },
  { to: '/orcamentos', icon: FileText, label: 'Orçamentos', permission: 'orcamentos' },
  { to: '/estoque', icon: Warehouse, label: 'Estoque', permission: 'estoque' },
  { to: '/financeiro', icon: DollarSign, label: 'Financeiro', permission: 'financeiro' },
  { to: '/fluxo-caixa', icon: ArrowLeftRight, label: 'Entrada e Saída', permission: 'fluxo-caixa' },
  { to: '/whatsapp', icon: MessageCircle, label: 'WhatsApp', permission: 'whatsapp' },
  { to: '/usuarios', icon: UserCog, label: 'Usuários', permission: 'usuarios' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: Props) {
  const { user, logout, hasPermission } = useAuth()

  const links = allLinks.filter((l) => hasPermission(l.permission))

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white border-r border-gray-200 transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand-gold" />
            <span className="text-lg font-semibold text-brand-text">Mitta Admin</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-4 space-y-3">
          {user && (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {user.role === 'admin' ? 'Administrador' : 'Colaboradora'}
                </p>
              </div>
              <button
                onClick={logout}
                className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
          <p className="text-xs text-gray-400 text-center">Mitta Estética &copy; 2026</p>
        </div>
      </aside>
    </>
  )
}
