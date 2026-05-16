import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  PackageCheck,
  CalendarDays,
  AlertTriangle,
  TrendingUp,
  UserX,
  DollarSign,
  UserCheck,
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency, toISODate } from '../utils/storage'

export default function Dashboard() {
  const { patients, packages, stockItems, appointments, transactions } = useData()
  const { user, isAdmin, hasPermission } = useAuth()

  const stats = useMemo(() => {
    const today = toISODate()
    const tomorrowDate = new Date()
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)
    const tomorrow = toISODate(tomorrowDate)

    const todayAppts = appointments.filter((a) => a.date === today)
    const tomorrowAppts = appointments.filter((a) => a.date === tomorrow)
    const missedTotal = appointments.filter((a) => a.status === 'missed').length
    const activePackages = packages.filter((p) => p.status === 'active')
    const activeClientIds = new Set(activePackages.map(p => p.patientId))
    
    const todayDate = new Date()
    const currentMonth = todayDate.getMonth()
    const currentYear = todayDate.getFullYear()

    const currentMonthTransactions = transactions.filter((t) => {
      const [y, m] = t.date.split('-').map(Number)
      return y === currentYear && m - 1 === currentMonth
    })

    // Sum all 'entrada' for the current month, matching Fluxo de Caixa 'Entradas'
    const totalRevenue = currentMonthTransactions
      .filter((t) => t.type === 'entrada')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const lowStock = stockItems.filter((s) => s.quantity <= s.minQuantity)
    const completedToday = todayAppts.filter((a) => a.status === 'completed').length
    const scheduledToday = todayAppts.filter((a) => a.status === 'scheduled').length
    const scheduledTomorrow = tomorrowAppts.filter((a) => a.status === 'scheduled').length

    // Financial Stats
    const totalPaidExpenses = currentMonthTransactions
      .filter(t => t.type === 'saida' && t.paid)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
    
    // Sum all 'saida' for the current month, matching Fluxo de Caixa 'Saídas'
    const totalProjections = currentMonthTransactions
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    return {
      totalPatients: patients.length,
      activeClients: activeClientIds.size,
      totalRevenue,
      totalPaidExpenses,
      totalProjections,
      missedTotal,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock.slice(0, 5),
      completedToday,
      scheduledToday,
      scheduledTomorrow,
      todayAppts: todayAppts.slice(0, 10),
      tomorrowAppts: tomorrowAppts.slice(0, 10),
      tomorrowDate: tomorrow,
    }
  }, [patients, packages, stockItems, appointments, transactions])

  const apptStatusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    missed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  }
  const apptStatusLabels: Record<string, string> = {
    scheduled: 'Agendado',
    completed: 'Concluído',
    missed: 'Faltou',
    cancelled: 'Cancelado',
  }

  const cards = [
    {
      label: isAdmin ? 'Pacientes' : 'Meus Clientes',
      value: stats.totalPatients,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      link: '/pacientes',
    },
    {
      label: 'Clientes Ativos',
      value: stats.activeClients,
      icon: UserCheck,
      color: 'bg-brand-50 text-brand-700',
      link: '/pacientes',
    },
    ...(isAdmin
      ? [
          {
            label: 'Receita do Mês',
            value: formatCurrency(stats.totalRevenue),
            icon: DollarSign,
            color: 'bg-green-50 text-green-600',
            link: '/financeiro',
          },
          {
            label: 'Contas a Pagar',
            value: formatCurrency(stats.totalProjections),
            icon: AlertTriangle,
            color: 'bg-orange-50 text-orange-600',
            link: '/contas-a-pagar',
          },
        ]
      : []),
    {
      label: 'Faltas Registradas',
      value: stats.missedTotal,
      icon: UserX,
      color: 'bg-red-50 text-red-600',
      link: '/agendamentos',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isAdmin ? 'Dashboard' : `Olá, ${user?.name ?? 'Colaboradora'}`}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAdmin ? 'Visão geral da clínica' : 'Seus agendamentos e clientes'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.link}
            className="flex items-center gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
          >
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${card.color}`}>
              <card.icon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              <p className="text-3xl font-black text-gray-900 tracking-tight mt-0.5">{card.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Agendas lado a lado */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Agenda de Hoje */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-brand-gold" />
              <h2 className="font-semibold text-gray-900">Agenda de Hoje</h2>
            </div>
            <div className="flex gap-2">
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                {stats.completedToday} concluído{stats.completedToday !== 1 ? 's' : ''}
              </span>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {stats.scheduledToday} agendado{stats.scheduledToday !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
            {stats.todayAppts.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Nenhum agendamento hoje</p>
            ) : (
              stats.todayAppts.map((appt) => {
                const patient = patients.find((p) => p.id === appt.patientId)
                return (
                  <div key={appt.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-brand-gold">{appt.time}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{patient?.name ?? '—'}</p>
                        <p className="text-xs text-gray-500">{appt.service}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${apptStatusColors[appt.status]}`}>
                      {apptStatusLabels[appt.status]}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Agenda de Amanhã */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-purple-500" />
              <h2 className="font-semibold text-gray-900">Agenda de Amanhã</h2>
            </div>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
              {stats.scheduledTomorrow} agendado{stats.scheduledTomorrow !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
            {stats.tomorrowAppts.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Nenhum agendamento amanhã</p>
            ) : (
              stats.tomorrowAppts.map((appt) => {
                const patient = patients.find((p) => p.id === appt.patientId)
                return (
                  <div key={appt.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-purple-500">{appt.time}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{patient?.name ?? '—'}</p>
                        <p className="text-xs text-gray-500">{appt.service}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${apptStatusColors[appt.status]}`}>
                      {apptStatusLabels[appt.status]}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Estoque Baixo */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {hasPermission('estoque') && stats.lowStockCount > 0 && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 shadow-sm h-fit">
            <div className="flex items-center gap-2 border-b border-orange-200 px-5 py-4">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h2 className="font-semibold text-orange-800">Estoque Baixo</h2>
              <span className="ml-auto rounded-full bg-orange-200 px-2 py-0.5 text-xs font-bold text-orange-800">
                {stats.lowStockCount}
              </span>
            </div>
            <div className="divide-y divide-orange-100">
              {stats.lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-orange-900">{item.name}</span>
                  <span className="text-sm font-semibold text-orange-700">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-orange-200">
              <Link to="/estoque" className="text-sm font-medium text-orange-700 hover:text-orange-900">
                Ver estoque completo →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
