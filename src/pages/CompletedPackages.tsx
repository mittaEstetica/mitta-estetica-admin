import { useState, useMemo } from 'react'
import { Search, PackageCheck, ChevronDown, ChevronUp, UserCheck, Calendar } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { formatDate, formatCurrency } from '../utils/storage'
import { Link } from 'react-router-dom'

export default function CompletedPackages() {
  const { packages, patients, appointments, collaborators } = useData()
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const completedPkgs = useMemo(() =>
    packages.filter((p) => p.status === 'completed'),
    [packages],
  )

  const filtered = useMemo(() =>
    completedPkgs.filter((pkg) => {
      const patient = patients.find((p) => p.id === pkg.patientId)
      return !search ||
        pkg.name.toLowerCase().includes(search.toLowerCase()) ||
        (patient?.name || '').toLowerCase().includes(search.toLowerCase())
    }),
    [completedPkgs, patients, search],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pacotes Finalizados</h1>
        <p className="text-sm text-gray-500 mt-1">{completedPkgs.length} pacote{completedPkgs.length !== 1 ? 's' : ''} concluído{completedPkgs.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por paciente ou nome do pacote..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
          <PackageCheck className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">
            {search ? 'Nenhum pacote encontrado' : 'Nenhum pacote finalizado ainda'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pkg) => {
            const patient = patients.find((p) => p.id === pkg.patientId)
            const expanded = expandedId === pkg.id
            const pkgAppointments = appointments
              .filter((a) => a.packageId === pkg.id && a.status === 'completed')
              .sort((a, b) => a.date.localeCompare(b.date))

            return (
              <div key={pkg.id} className="rounded-xl border border-gray-100 bg-white shadow-sm">
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : pkg.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {patient?.photo ? (
                      <img src={patient.photo} alt="" className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold text-sm flex-shrink-0">
                        {patient?.name.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/pacientes/${pkg.patientId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-gray-900 truncate hover:text-brand-gold"
                        >
                          {patient?.name || 'Paciente removido'}
                        </Link>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                          Concluído
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{pkg.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400">{pkg.totalSessions} sessões</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs font-medium text-gray-600">{formatCurrency(pkg.totalValue)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{pkgAppointments.length} sessões realizadas</span>
                    {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-gray-100 bg-gray-50/30">
                    {pkg.services.length > 0 && (
                      <div className="px-5 pt-4 pb-2">
                        <p className="text-xs text-gray-500 mb-2">Serviços</p>
                        <div className="flex flex-wrap gap-1.5">
                          {pkg.services.map((s) => (
                            <span key={s} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="px-5 pb-4">
                      <p className="text-xs text-gray-500 mb-3 mt-3">Histórico de Sessões</p>
                      {pkgAppointments.length === 0 ? (
                        <p className="text-xs text-gray-400">Nenhuma sessão registrada</p>
                      ) : (
                        <div className="space-y-2">
                          {pkgAppointments.map((appt, idx) => {
                            const collab = appt.collaboratorId ? collaborators.find((c) => c.id === appt.collaboratorId) : null
                            return (
                              <div key={appt.id} className="flex items-center gap-3 rounded-lg bg-white border border-gray-100 px-4 py-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600 flex-shrink-0">
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">{appt.service}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                      <Calendar className="h-3 w-3" /> {formatDate(appt.date)}
                                    </span>
                                    {collab && (
                                      <span className="flex items-center gap-1 text-xs text-purple-600">
                                        <UserCheck className="h-3 w-3" /> {collab.name}
                                      </span>
                                    )}
                                    {appt.room && (
                                      <span className="text-xs text-gray-400">
                                        {appt.room === 'sala2' ? 'Sala 2' : 'Sala 1'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
