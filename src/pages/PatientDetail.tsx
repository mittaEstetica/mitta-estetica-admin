import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  PackageCheck,
  UserX,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { formatDate, formatCurrency } from '../utils/storage'
import { FACIAL_SERVICES, CORPORAL_SERVICES, type ServiceCategory } from '../utils/services'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SearchableSelect from '../components/ui/SearchableSelect'
import type { Package } from '../types'

const emptyPkgForm = {
  collaboratorId: '',
  name: '',
  services: [] as string[],
  totalSessions: 1,
  completedSessions: 0,
  totalValue: 0,
  sessionValue: 0,
  paidValue: 0,
  status: 'active' as Package['status'],
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    patients,
    packages,
    appointments,
    collaborators,
    addPackage,
    updatePackage,
    deletePackage,
  } = useData()

  const patient = patients.find((p) => p.id === id)
  const patientPackages = useMemo(() => packages.filter((p) => p.patientId === id), [packages, id])
  const patientAppts = useMemo(
    () =>
      [...appointments.filter((a) => a.patientId === id)].sort(
        (a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time),
      ),
    [appointments, id],
  )

  const missedCount = patientAppts.filter((a) => a.status === 'missed').length
  const completedCount = patientAppts.filter((a) => a.status === 'completed').length

  const [pkgModalOpen, setPkgModalOpen] = useState(false)
  const [editingPkg, setEditingPkg] = useState<Package | null>(null)
  const [pkgForm, setPkgForm] = useState(emptyPkgForm)
  const [deletePkgTarget, setDeletePkgTarget] = useState<string | null>(null)
  const [expandedPkgId, setExpandedPkgId] = useState<string | null>(null)
  const [pkgStatusFilter, setPkgStatusFilter] = useState<string>('all')
  const [pkgServiceCategory, setPkgServiceCategory] = useState<ServiceCategory | ''>('')

  const filteredPkgs = patientPackages.filter(
    (p) => pkgStatusFilter === 'all' || p.status === pkgStatusFilter,
  )

  const openNewPkg = () => {
    setEditingPkg(null)
    setPkgForm(emptyPkgForm)
    setPkgServiceCategory('')
    setPkgModalOpen(true)
  }

  const openEditPkg = (pkg: Package) => {
    setEditingPkg(pkg)
    setPkgForm({
      collaboratorId: pkg.collaboratorId ?? '',
      name: pkg.name,
      services: pkg.services,
      totalSessions: pkg.totalSessions,
      completedSessions: pkg.completedSessions,
      totalValue: pkg.totalValue,
      sessionValue: pkg.sessionValue,
      paidValue: pkg.paidValue,
      status: pkg.status,
    })
    const hasFacial = pkg.services.some((s) => FACIAL_SERVICES.includes(s as typeof FACIAL_SERVICES[number]))
    const hasCorporal = pkg.services.some((s) => CORPORAL_SERVICES.includes(s as typeof CORPORAL_SERVICES[number]))
    setPkgServiceCategory(hasFacial ? 'facial' : hasCorporal ? 'corporal' : '')
    setPkgModalOpen(true)
  }

  const handlePkgSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const sessionValue = pkgForm.totalSessions > 0 ? pkgForm.totalValue / pkgForm.totalSessions : 0
    const data = {
      ...pkgForm,
      patientId: id!,
      sessionValue,
      collaboratorId: pkgForm.collaboratorId || undefined,
    }
    if (editingPkg) {
      await updatePackage({ ...editingPkg, ...data })
    } else {
      await addPackage(data as Omit<Package, 'id' | 'createdAt'>)
    }
    setPkgModalOpen(false)
  }

  const confirmDeletePkg = async () => {
    if (deletePkgTarget) {
      await deletePackage(deletePkgTarget)
      setDeletePkgTarget(null)
    }
  }

  const toggleService = (service: string) => {
    setPkgForm((f) => ({
      ...f,
      services: f.services.includes(service)
        ? f.services.filter((s) => s !== service)
        : [...f.services, service],
    }))
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500">Paciente não encontrado</p>
        <button onClick={() => navigate('/pacientes')} className="mt-2 text-sm text-brand-gold">
          Voltar para lista
        </button>
      </div>
    )
  }

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
  const pkgStatusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-gray-100 text-gray-500',
  }
  const pkgStatusLabels: Record<string, string> = {
    active: 'Ativo',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  }

  return (
    <div className="space-y-6">
      <Link to="/pacientes" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          {patient.photo ? (
            <img src={patient.photo} alt="" className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-3xl font-bold">
              {patient.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
            <div className="mt-2 flex flex-wrap justify-center gap-4 sm:justify-start text-sm text-gray-500">
              {patient.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" /> {patient.phone}
                </span>
              )}
              {patient.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" /> {patient.email}
                </span>
              )}
              {patient.birthDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> {formatDate(patient.birthDate)}
                </span>
              )}
            </div>
            {patient.address && (
              <p className="mt-1 flex items-center justify-center sm:justify-start gap-1 text-sm text-gray-400">
                <MapPin className="h-4 w-4" /> {patient.address}
              </p>
            )}
            {patient.notes && (
              <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{patient.notes}</p>
            )}
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-lg font-bold">{completedCount}</span>
              </div>
              <p className="text-xs text-gray-500">Atendimentos</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-red-500">
                <UserX className="h-4 w-4" />
                <span className="text-lg font-bold">{missedCount}</span>
              </div>
              <p className="text-xs text-gray-500">Faltas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pacotes - CRUD completo */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-brand-gold" />
            <h2 className="font-semibold text-gray-900">Pacotes</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {patientPackages.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pkgStatusFilter}
              onChange={(e) => setPkgStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="completed">Concluídos</option>
              <option value="cancelled">Cancelados</option>
            </select>
            <button
              onClick={openNewPkg}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-gold px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Novo Pacote
            </button>
          </div>
        </div>

        {filteredPkgs.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <PackageCheck className="mx-auto h-10 w-10 text-gray-200" />
            <p className="mt-3 text-sm text-gray-400">
              {patientPackages.length === 0 ? 'Nenhum pacote cadastrado para este paciente' : 'Nenhum pacote com este filtro'}
            </p>
            {patientPackages.length === 0 && (
              <button onClick={openNewPkg} className="mt-2 text-sm font-medium text-brand-gold hover:text-brand-700">
                Criar primeiro pacote
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredPkgs.map((pkg) => {
              const progress = pkg.totalSessions > 0 ? (pkg.completedSessions / pkg.totalSessions) * 100 : 0
              const remaining = pkg.totalValue - pkg.paidValue
              const expanded = expandedPkgId === pkg.id

              return (
                <div key={pkg.id}>
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => setExpandedPkgId(expanded ? null : pkg.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 truncate">{pkg.name}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${pkgStatusColors[pkg.status]}`}>
                            {pkgStatusLabels[pkg.status]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500">
                            {pkg.completedSessions}/{pkg.totalSessions} sessões
                          </span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs font-medium text-gray-700">{formatCurrency(pkg.totalValue)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-brand-gold transition-all"
                            style={{ width: `${Math.min(100, progress)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 w-8">{Math.round(progress)}%</span>
                      </div>
                      {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </div>
                  </div>

                  {expanded && (
                    <div className="border-t border-gray-100 bg-gray-50/30 px-5 py-4 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-4">
                        <div>
                          <p className="text-xs text-gray-500">Valor Total</p>
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(pkg.totalValue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Valor por Sessão</p>
                          <p className="text-sm font-semibold text-brand-gold">{formatCurrency(pkg.sessionValue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Valor Pago</p>
                          <p className="text-sm font-semibold text-green-600">{formatCurrency(pkg.paidValue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Restante</p>
                          <p className={`text-sm font-semibold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(remaining)}
                          </p>
                        </div>
                      </div>

                      {(() => {
                        const collab = pkg.collaboratorId ? collaborators.find((c) => c.id === pkg.collaboratorId) : null
                        if (!collab) return null
                        const commissionPerSession = pkg.sessionValue * collab.commissionPercent / 100
                        const clinicPerSession = pkg.sessionValue - commissionPerSession
                        return (
                          <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
                            <div className="flex items-center gap-2 mb-1">
                              <UserCheck className="h-4 w-4 text-amber-600" />
                              <p className="text-xs font-semibold text-amber-700">Responsável: {collab.name} ({collab.commissionPercent}%)</p>
                            </div>
                            <div className="flex gap-4 text-xs text-amber-600">
                              <span>Colaboradora: {formatCurrency(commissionPerSession)}/sessão</span>
                              <span>Clínica: {formatCurrency(clinicPerSession)}/sessão</span>
                            </div>
                          </div>
                        )
                      })()}

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Progresso das Sessões</p>
                        <div className="h-2.5 w-full rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-brand-gold transition-all"
                            style={{ width: `${Math.min(100, progress)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {pkg.completedSessions} de {pkg.totalSessions} sessões realizadas ({Math.round(progress)}%)
                        </p>
                      </div>

                      {pkg.services.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Serviços Inclusos</p>
                          <div className="flex flex-wrap gap-1.5">
                            {pkg.services.map((s) => (
                              <span key={s} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <p className="text-xs text-gray-400">Criado em {formatDate(pkg.createdAt?.split('T')[0])}</p>
                        <span className="text-gray-300">·</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditPkg(pkg) }}
                          className="inline-flex items-center gap-1 text-xs text-brand-gold hover:text-brand-700"
                        >
                          <Edit className="h-3 w-3" /> Editar
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletePkgTarget(pkg.id) }}
                          className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" /> Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Histórico de Agendamentos */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
          <Calendar className="h-5 w-5 text-brand-gold" />
          <h2 className="font-semibold text-gray-900">Histórico de Agendamentos</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {patientAppts.length}
          </span>
        </div>
        <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
          {patientAppts.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">Nenhum agendamento</p>
          ) : (
            patientAppts.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.service}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(a.date)} às {a.time}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${apptStatusColors[a.status]}`}>
                  {apptStatusLabels[a.status]}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Package Form Modal */}
      <Modal
        open={pkgModalOpen}
        onClose={() => setPkgModalOpen(false)}
        title={editingPkg ? 'Editar Pacote' : 'Novo Pacote'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handlePkgSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nome do Pacote *</label>
            <input
              required
              type="text"
              value={pkgForm.name}
              onChange={(e) => setPkgForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Pacote Corporal 10 sessões"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Colaboradora Responsável</label>
            <SearchableSelect
              options={collaborators.filter((c) => c.active).map((c) => ({
                value: c.id,
                label: c.name,
                subtitle: `${c.commissionPercent}% comissão`,
              }))}
              value={pkgForm.collaboratorId}
              onChange={(v) => setPkgForm((f) => ({ ...f, collaboratorId: v }))}
              placeholder="Buscar colaboradora..."
              emptyLabel="Sem colaboradora (100% clínica)"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Tipo de Procedimento</label>
            <div className="flex gap-3">
              <label
                className={`flex-1 cursor-pointer rounded-lg border-2 px-4 py-3 text-center text-sm font-medium transition-all ${
                  pkgServiceCategory === 'facial'
                    ? 'border-brand-gold bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="pkgServiceCategory"
                  value="facial"
                  checked={pkgServiceCategory === 'facial'}
                  onChange={() => { setPkgServiceCategory('facial'); setPkgForm((f) => ({ ...f, services: [] })) }}
                  className="sr-only"
                />
                Procedimento Facial
              </label>
              <label
                className={`flex-1 cursor-pointer rounded-lg border-2 px-4 py-3 text-center text-sm font-medium transition-all ${
                  pkgServiceCategory === 'corporal'
                    ? 'border-brand-gold bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="pkgServiceCategory"
                  value="corporal"
                  checked={pkgServiceCategory === 'corporal'}
                  onChange={() => { setPkgServiceCategory('corporal'); setPkgForm((f) => ({ ...f, services: [] })) }}
                  className="sr-only"
                />
                Procedimento Corporal
              </label>
            </div>
          </div>

          {pkgServiceCategory && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Serviços Inclusos</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(pkgServiceCategory === 'facial' ? FACIAL_SERVICES : CORPORAL_SERVICES).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleService(s)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      pkgForm.services.includes(s)
                        ? 'bg-brand-gold text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Total de Sessões *</label>
              <input
                required
                type="number"
                min={1}
                value={pkgForm.totalSessions}
                onChange={(e) => setPkgForm((f) => ({ ...f, totalSessions: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            {editingPkg && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Sessões Realizadas</label>
                <input
                  type="number"
                  min={0}
                  max={pkgForm.totalSessions}
                  value={pkgForm.completedSessions}
                  onChange={(e) => setPkgForm((f) => ({ ...f, completedSessions: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Valor Total (R$) *</label>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={pkgForm.totalValue || ''}
                onChange={(e) => setPkgForm((f) => ({ ...f, totalValue: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Valor Pago (R$)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={pkgForm.paidValue || ''}
                onChange={(e) => setPkgForm((f) => ({ ...f, paidValue: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
          </div>

          {pkgForm.totalValue > 0 && pkgForm.totalSessions > 0 && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 space-y-1">
              <p className="text-xs font-medium text-gray-700">
                Valor por sessão: <span className="text-brand-gold font-semibold">{formatCurrency(pkgForm.totalValue / pkgForm.totalSessions)}</span>
              </p>
              {pkgForm.collaboratorId && (() => {
                const collab = collaborators.find((c) => c.id === pkgForm.collaboratorId)
                if (!collab) return null
                const sv = pkgForm.totalValue / pkgForm.totalSessions
                return (
                  <>
                    <p className="text-xs text-gray-500">
                      Colaboradora ({collab.name} — {collab.commissionPercent}%): <span className="font-semibold text-green-600">{formatCurrency(sv * collab.commissionPercent / 100)}</span>/sessão
                    </p>
                    <p className="text-xs text-gray-500">
                      Clínica: <span className="font-semibold text-purple-600">{formatCurrency(sv * (100 - collab.commissionPercent) / 100)}</span>/sessão
                    </p>
                  </>
                )
              })()}
            </div>
          )}

          {editingPkg && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select
                value={pkgForm.status}
                onChange={(e) => setPkgForm((f) => ({ ...f, status: e.target.value as Package['status'] }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              >
                <option value="active">Ativo</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPkgModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-gold px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              {editingPkg ? 'Salvar' : 'Criar Pacote'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deletePkgTarget}
        title="Excluir pacote"
        message="Tem certeza que deseja excluir este pacote? Esta ação não pode ser desfeita."
        onConfirm={confirmDeletePkg}
        onCancel={() => setDeletePkgTarget(null)}
      />
    </div>
  )
}
