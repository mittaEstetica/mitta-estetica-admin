import { useMemo, useState } from 'react'
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Percent,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { formatCurrency } from '../utils/storage'

export default function Financial() {
  const { collaborators, commissions, packages } = useData()
  const [periodFilter, setPeriodFilter] = useState<string>('all')

  const stats = useMemo(() => {
    let filteredCommissions = commissions
    if (periodFilter !== 'all') {
      const now = new Date()
      let startDate: Date
      if (periodFilter === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      } else if (periodFilter === 'quarter') {
        const quarterStart = Math.floor(now.getMonth() / 3) * 3
        startDate = new Date(now.getFullYear(), quarterStart, 1)
      } else {
        startDate = new Date(now.getFullYear(), 0, 1)
      }
      filteredCommissions = commissions.filter((c) => new Date(c.createdAt) >= startDate)
    }

    const totalCollaborators = filteredCommissions.reduce((sum, c) => sum + c.clinicAmount, 0)
    const totalClinic = filteredCommissions.reduce((sum, c) => sum + c.collaboratorAmount, 0)
    const totalRevenue = totalCollaborators + totalClinic
    const totalSessions = filteredCommissions.length

    const byCollaborator: Record<string, { earned: number; sessions: number; clinic: number }> = {}
    for (const com of filteredCommissions) {
      if (!byCollaborator[com.collaboratorId]) {
        byCollaborator[com.collaboratorId] = { earned: 0, sessions: 0, clinic: 0 }
      }
      byCollaborator[com.collaboratorId].earned += com.clinicAmount
      byCollaborator[com.collaboratorId].sessions += 1
      byCollaborator[com.collaboratorId].clinic += com.collaboratorAmount
    }

    const collaboratorBreakdown = Object.entries(byCollaborator)
      .map(([collaboratorId, data]) => {
        const collab = collaborators.find((c) => c.id === collaboratorId)
        return { collaboratorId, name: collab?.name ?? 'Removida', commissionPercent: collab?.commissionPercent ?? 0, ...data }
      })
      .sort((a, b) => b.earned - a.earned)

    const activePackagesWithCollab = packages.filter((p) => p.collaboratorId && p.status === 'active')
    const pendingRevenue = activePackagesWithCollab.reduce((sum, p) => {
      const remainingSessions = p.totalSessions - p.completedSessions
      return sum + remainingSessions * p.sessionValue
    }, 0)

    return {
      totalRevenue,
      totalCollaborators,
      totalClinic,
      totalSessions,
      collaboratorBreakdown,
      pendingRevenue,
      activePackagesWithCollab,
    }
  }, [commissions, collaborators, packages, periodFilter])

  const clinicPercent = stats.totalRevenue > 0 ? (stats.totalClinic / stats.totalRevenue) * 100 : 100
  const collabPercent = stats.totalRevenue > 0 ? (stats.totalCollaborators / stats.totalRevenue) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-sm text-gray-500 mt-1">Visão geral da divisão clínica × colaboradoras</p>
        </div>
        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        >
          <option value="all">Todo período</option>
          <option value="month">Este mês</option>
          <option value="quarter">Este trimestre</option>
          <option value="year">Este ano</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Receita Total (sessões)</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Clínica</p>
            <p className="text-xl font-bold text-purple-600">{formatCurrency(stats.totalClinic)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Colaboradoras</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalCollaborators)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Receita Pendente</p>
            <p className="text-xl font-bold text-amber-600">{formatCurrency(stats.pendingRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Barra de distribuição visual */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Distribuição da Receita</h2>
        {stats.totalRevenue === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma receita registrada no período</p>
        ) : (
          <>
            <div className="h-6 w-full rounded-full overflow-hidden flex">
              <div
                className="bg-purple-500 transition-all duration-500"
                style={{ width: `${clinicPercent}%` }}
              />
              <div
                className="bg-green-500 transition-all duration-500"
                style={{ width: `${collabPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                Clínica: {clinicPercent.toFixed(1)}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                Colaboradoras: {collabPercent.toFixed(1)}%
              </span>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Ranking por Colaboradora */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <Percent className="h-5 w-5 text-brand-gold" />
            <h2 className="font-semibold text-gray-900">Ganhos por Colaboradora</h2>
          </div>
          {stats.collaboratorBreakdown.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">Nenhuma comissão no período</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {stats.collaboratorBreakdown.map((item) => (
                <div key={item.collaboratorId} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700 text-xs font-bold">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.sessions} {item.sessions === 1 ? 'sessão' : 'sessões'} · {item.commissionPercent}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">{formatCurrency(item.earned)}</p>
                    <Link
                      to={`/colaboradoras/${item.collaboratorId}`}
                      className="inline-flex items-center gap-0.5 text-[10px] text-brand-gold hover:text-brand-700"
                    >
                      Ver <ArrowRight className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pacotes Ativos com Colaboradora */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <DollarSign className="h-5 w-5 text-brand-gold" />
            <h2 className="font-semibold text-gray-900">Pacotes com Comissão Ativa</h2>
          </div>
          {stats.activePackagesWithCollab.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">Nenhum pacote ativo com colaboradora</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {stats.activePackagesWithCollab.map((pkg) => {
                const collab = collaborators.find((c) => c.id === pkg.collaboratorId)
                const remaining = pkg.totalSessions - pkg.completedSessions
                const commissionPerSession = pkg.sessionValue * (collab?.commissionPercent ?? 0) / 100
                const clinicPerSession = pkg.sessionValue - commissionPerSession
                return (
                  <div key={pkg.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{pkg.name}</p>
                        <p className="text-xs text-gray-500">{collab?.name ?? '—'} · {remaining} sessões restantes</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-700">{formatCurrency(pkg.sessionValue)}/sessão</p>
                    </div>
                    <div className="mt-1 flex gap-3 text-xs text-gray-400">
                      <span>Colaboradora: {formatCurrency(commissionPerSession)}</span>
                      <span>Clínica: {formatCurrency(clinicPerSession)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
