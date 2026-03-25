import { useState } from 'react'
import {
  Plus,
  Search,
  Trash2,
  Edit,
  DollarSign,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { formatCurrency, formatDate } from '../utils/storage'
import { SERVICE_LIST } from '../utils/services'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import type { Package } from '../types'

const emptyForm = {
  patientId: '',
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

export default function Packages() {
  const { packages, patients, collaborators, addPackage, updatePackage, deletePackage } = useData()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Package | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = packages.filter((p) => {
    const patient = patients.find((pt) => pt.id === p.patientId)
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (patient?.name || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (pkg: Package) => {
    setEditing(pkg)
    setForm({
      patientId: pkg.patientId,
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
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const sessionValue = form.totalSessions > 0 ? form.totalValue / form.totalSessions : 0
    const data = {
      ...form,
      sessionValue,
      collaboratorId: form.collaboratorId || undefined,
    }
    if (editing) {
      await updatePackage({ ...editing, ...data })
    } else {
      await addPackage(data as typeof form)
    }
    setModalOpen(false)
  }

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deletePackage(deleteTarget)
      setDeleteTarget(null)
    }
  }

  const toggleService = (service: string) => {
    setForm((f) => ({
      ...f,
      services: f.services.includes(service)
        ? f.services.filter((s) => s !== service)
        : [...f.services, service],
    }))
  }

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacotes</h1>
          <p className="text-sm text-gray-500 mt-1">Controle de sessões e valores</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Novo Pacote
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome do pacote ou paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="completed">Concluídos</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
          <DollarSign className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">Nenhum pacote encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pkg) => {
            const patient = patients.find((pt) => pt.id === pkg.patientId)
            const progress = pkg.totalSessions > 0 ? (pkg.completedSessions / pkg.totalSessions) * 100 : 0
            const remaining = pkg.totalValue - pkg.paidValue
            const expanded = expandedId === pkg.id

            return (
              <div
                key={pkg.id}
                className="rounded-xl border border-gray-100 bg-white shadow-sm"
              >
                <div
                  className="flex items-center justify-between p-5 cursor-pointer"
                  onClick={() => setExpandedId(expanded ? null : pkg.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{pkg.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[pkg.status]}`}>
                          {statusLabels[pkg.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{patient?.name ?? 'Paciente removido'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(pkg.paidValue)}</p>
                      <p className="text-xs text-gray-500">de {formatCurrency(pkg.totalValue)}</p>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-brand-gold transition-all"
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">
                        {pkg.completedSessions}/{pkg.totalSessions}
                      </span>
                    </div>
                    {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-4">
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
                          <div className="flex items-center gap-2 mb-2">
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
                      <div className="h-3 w-full rounded-full bg-gray-100">
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
                        onClick={() => openEdit(pkg)}
                        className="inline-flex items-center gap-1 text-xs text-brand-gold hover:text-brand-700"
                      >
                        <Edit className="h-3 w-3" /> Editar
                      </button>
                      <button
                        onClick={() => setDeleteTarget(pkg.id)}
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

      {/* Form Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Pacote' : 'Novo Pacote'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Paciente *</label>
            <select
              required
              value={form.patientId}
              onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            >
              <option value="">Selecione um paciente</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nome do Pacote *</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Pacote Corporal 10 sessões"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Colaboradora Responsável</label>
            <select
              value={form.collaboratorId}
              onChange={(e) => setForm((f) => ({ ...f, collaboratorId: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            >
              <option value="">Sem colaboradora (100% clínica)</option>
              {collaborators.filter((c) => c.active).map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.commissionPercent}% comissão</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Serviços Inclusos</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {SERVICE_LIST.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleService(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    form.services.includes(s)
                      ? 'bg-brand-gold text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Total de Sessões *</label>
              <input
                required
                type="number"
                min={1}
                value={form.totalSessions}
                onChange={(e) => setForm((f) => ({ ...f, totalSessions: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            {editing && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Sessões Realizadas</label>
                <input
                  type="number"
                  min={0}
                  max={form.totalSessions}
                  value={form.completedSessions}
                  onChange={(e) => setForm((f) => ({ ...f, completedSessions: Number(e.target.value) }))}
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
                value={form.totalValue || ''}
                onChange={(e) => setForm((f) => ({ ...f, totalValue: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Valor Pago (R$)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.paidValue || ''}
                onChange={(e) => setForm((f) => ({ ...f, paidValue: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
          </div>

          {form.totalValue > 0 && form.totalSessions > 0 && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 space-y-1">
              <p className="text-xs font-medium text-gray-700">
                Valor por sessão: <span className="text-brand-gold font-semibold">{formatCurrency(form.totalValue / form.totalSessions)}</span>
              </p>
              {form.collaboratorId && (() => {
                const collab = collaborators.find((c) => c.id === form.collaboratorId)
                if (!collab) return null
                const sv = form.totalValue / form.totalSessions
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

          {editing && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Package['status'] }))}
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
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-gold px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              {editing ? 'Salvar' : 'Criar Pacote'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir pacote"
        message="Tem certeza que deseja excluir este pacote? Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
