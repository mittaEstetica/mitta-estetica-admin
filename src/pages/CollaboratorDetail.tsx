import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Percent,
  DollarSign,
  PackageCheck,
  TrendingUp,
  Phone,
  Mail,
  Building2,
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { formatCurrency, formatDate } from '../utils/storage'

export default function CollaboratorDetail() {
  const { id } = useParams<{ id: string }>()
  const { collaborators, commissions, packages, patients } = useData()

  const collab = collaborators.find((c) => c.id === id)

  const stats = useMemo(() => {
    if (!collab) return null

    const myCommissions = commissions
      .filter((c) => c.collaboratorId === collab.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const totalEarned = myCommissions.reduce((sum, c) => sum + c.collaboratorAmount, 0)
    const totalClinic = myCommissions.reduce((sum, c) => sum + c.clinicAmount, 0)
    const sessionsCompleted = myCommissions.length

    const myPackages = packages.filter((p) => p.collaboratorId === collab.id)
    const activePackages = myPackages.filter((p) => p.status === 'active')

    const monthlyMap: Record<string, { collaborator: number; clinic: number; count: number }> = {}
    for (const c of myCommissions) {
      const month = c.createdAt.substring(0, 7)
      if (!monthlyMap[month]) monthlyMap[month] = { collaborator: 0, clinic: 0, count: 0 }
      monthlyMap[month].collaborator += c.collaboratorAmount
      monthlyMap[month].clinic += c.clinicAmount
      monthlyMap[month].count += 1
    }
    const monthly = Object.entries(monthlyMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, data]) => ({ month, ...data }))

    return {
      totalEarned,
      totalClinic,
      sessionsCompleted,
      myCommissions,
      myPackages,
      activePackages,
      monthly,
    }
  }, [collab, commissions, packages])

  if (!collab) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500">Colaboradora não encontrada</p>
        <Link to="/colaboradoras" className="mt-4 text-sm text-brand-gold hover:text-brand-700">
          ← Voltar para lista
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        to="/colaboradoras"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700 text-xl font-bold">
              {collab.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{collab.name}</h1>
              <p className="text-sm text-gray-500">{collab.role || 'Sem função definida'}</p>
            </div>
          </div>
          <span
            className={`self-start rounded-full px-3 py-1 text-xs font-medium ${
              collab.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {collab.active ? 'Ativa' : 'Inativa'}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
          {collab.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" /> {collab.phone}
            </span>
          )}
          {collab.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> {collab.email}
            </span>
          )}
        </div>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Percent className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Comissão</p>
                <p className="text-xl font-bold text-gray-900">{collab.commissionPercent}%</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Ganho</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalEarned)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <PackageCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pacotes Ativos</p>
                <p className="text-xl font-bold text-gray-900">{stats.activePackages.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sessões Realizadas</p>
                <p className="text-xl font-bold text-gray-900">{stats.sessionsCompleted}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Resumo Mensal */}
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                <TrendingUp className="h-5 w-5 text-brand-gold" />
                <h2 className="font-semibold text-gray-900">Resumo Mensal</h2>
              </div>
              {stats.monthly.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400">Nenhuma comissão registrada</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {stats.monthly.map((m) => {
                    const [year, month] = m.month.split('-')
                    const monthLabel = new Date(Number(year), Number(month) - 1).toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric',
                    })
                    return (
                      <div key={m.month} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">{monthLabel}</p>
                          <p className="text-xs text-gray-500">{m.count} {m.count === 1 ? 'sessão' : 'sessões'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600">{formatCurrency(m.collaborator)}</p>
                          <p className="text-xs text-gray-400">Clínica: {formatCurrency(m.clinic)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Pacotes Atribuídos */}
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                <PackageCheck className="h-5 w-5 text-brand-gold" />
                <h2 className="font-semibold text-gray-900">Pacotes Atribuídos</h2>
              </div>
              {stats.myPackages.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400">Nenhum pacote atribuído</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {stats.myPackages.map((pkg) => {
                    const patient = patients.find((p) => p.id === pkg.patientId)
                    const progress = pkg.totalSessions > 0 ? (pkg.completedSessions / pkg.totalSessions) * 100 : 0
                    const statusColors: Record<string, string> = {
                      active: 'bg-green-100 text-green-700',
                      completed: 'bg-blue-100 text-blue-700',
                      cancelled: 'bg-gray-100 text-gray-500',
                    }
                    const statusLabels: Record<string, string> = {
                      active: 'Ativo',
                      completed: 'Concluído',
                      cancelled: 'Cancelado',
                    }
                    return (
                      <div key={pkg.id} className="px-5 py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{pkg.name}</p>
                            <p className="text-xs text-gray-500">{patient?.name ?? 'Paciente removido'}</p>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[pkg.status]}`}>
                            {statusLabels[pkg.status]}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-brand-gold"
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {pkg.completedSessions}/{pkg.totalSessions}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">
                          Valor por sessão: {formatCurrency(pkg.sessionValue)} · Comissão: {formatCurrency(pkg.sessionValue * collab.commissionPercent / 100)}/sessão
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Histórico de Comissões */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <Building2 className="h-5 w-5 text-brand-gold" />
              <h2 className="font-semibold text-gray-900">Histórico de Comissões</h2>
            </div>
            {stats.myCommissions.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Nenhuma comissão registrada ainda</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                      <th className="px-5 py-3 font-medium">Data</th>
                      <th className="px-5 py-3 font-medium">Pacote</th>
                      <th className="px-5 py-3 font-medium">Valor Sessão</th>
                      <th className="px-5 py-3 font-medium">Comissão %</th>
                      <th className="px-5 py-3 font-medium">Colaboradora</th>
                      <th className="px-5 py-3 font-medium">Clínica</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats.myCommissions.map((com) => {
                      const pkg = packages.find((p) => p.id === com.packageId)
                      return (
                        <tr key={com.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 text-gray-500">{formatDate(com.createdAt?.split('T')[0])}</td>
                          <td className="px-5 py-3 font-medium text-gray-900">{pkg?.name ?? '—'}</td>
                          <td className="px-5 py-3 text-gray-700">{formatCurrency(com.sessionValue)}</td>
                          <td className="px-5 py-3 text-gray-700">{com.commissionPercent}%</td>
                          <td className="px-5 py-3 font-medium text-green-600">{formatCurrency(com.collaboratorAmount)}</td>
                          <td className="px-5 py-3 text-gray-500">{formatCurrency(com.clinicAmount)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
