import { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  UserX,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { formatDate, toISODate } from '../utils/storage'
import { FACIAL_SERVICES, CORPORAL_SERVICES, type ServiceCategory } from '../utils/services'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SearchableSelect from '../components/ui/SearchableSelect'
import type { Appointment } from '../types'

const emptyForm = {
  patientId: '',
  packageId: '',
  collaboratorId: '',
  service: '',
  date: toISODate(),
  time: '09:00',
  status: 'scheduled' as Appointment['status'],
  stockUsed: [] as { stockItemId: string; quantity: number }[],
  notes: '',
}

export default function Appointments() {
  const {
    appointments,
    patients,
    packages,
    stockItems,
    collaborators,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    completeAppointment,
    markMissed,
  } = useData()

  const activeCollaborators = useMemo(
    () => collaborators.filter((c) => c.active),
    [collaborators],
  )

  const patientOptions = useMemo(
    () => patients.map((p) => ({ value: p.id, label: p.name, subtitle: p.phone || undefined })),
    [patients],
  )

  const collaboratorOptions = useMemo(
    () => activeCollaborators.map((c) => ({ value: c.id, label: c.name, subtitle: `${c.commissionPercent}% comissão` })),
    [activeCollaborators],
  )

  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState(toISODate())
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory | ''>('')

  const filtered = useMemo(() => {
    return [...appointments]
      .filter((a) => {
        const patient = patients.find((p) => p.id === a.patientId)
        const matchSearch =
          !search ||
          a.service.toLowerCase().includes(search.toLowerCase()) ||
          (patient?.name || '').toLowerCase().includes(search.toLowerCase())
        const matchDate = !dateFilter || a.date === dateFilter
        const matchStatus = statusFilter === 'all' || a.status === statusFilter
        return matchSearch && matchDate && matchStatus
      })
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [appointments, patients, search, dateFilter, statusFilter])

  const missedStats = useMemo(() => {
    const byPatient: Record<string, number> = {}
    appointments
      .filter((a) => a.status === 'missed')
      .forEach((a) => {
        byPatient[a.patientId] = (byPatient[a.patientId] || 0) + 1
      })
    return Object.entries(byPatient)
      .map(([id, count]) => ({ patient: patients.find((p) => p.id === id), count }))
      .filter((x) => x.patient)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [appointments, patients])

  const shiftDate = (days: number) => {
    const d = new Date(dateFilter + 'T00:00:00')
    d.setDate(d.getDate() + days)
    setDateFilter(toISODate(d))
  }

  const patientPackages = useMemo(() => {
    if (!form.patientId) return []
    return packages.filter((p) => p.patientId === form.patientId && p.status === 'active')
  }, [form.patientId, packages])

  const detectCategory = (service: string): ServiceCategory | '' => {
    if (FACIAL_SERVICES.includes(service as typeof FACIAL_SERVICES[number])) return 'facial'
    if (CORPORAL_SERVICES.includes(service as typeof CORPORAL_SERVICES[number])) return 'corporal'
    return ''
  }

  const openNew = () => {
    setEditing(null)
    setForm({ ...emptyForm, date: dateFilter })
    setServiceCategory('')
    setModalOpen(true)
  }

  const openEdit = (appt: Appointment) => {
    setEditing(appt)
    setForm({
      patientId: appt.patientId,
      packageId: appt.packageId || '',
      collaboratorId: appt.collaboratorId || '',
      service: appt.service,
      date: appt.date,
      time: appt.time,
      status: appt.status,
      stockUsed: appt.stockUsed,
      notes: appt.notes,
    })
    setServiceCategory(detectCategory(appt.service))
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await updateAppointment({ ...editing, ...form })
    } else {
      await addAppointment(form)
    }
    setModalOpen(false)
  }

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteAppointment(deleteTarget)
      setDeleteTarget(null)
    }
  }

  const addStockUsage = () => {
    setForm((f) => ({
      ...f,
      stockUsed: [...f.stockUsed, { stockItemId: '', quantity: 1 }],
    }))
  }

  const updateStockUsage = (idx: number, field: 'stockItemId' | 'quantity', value: string | number) => {
    setForm((f) => ({
      ...f,
      stockUsed: f.stockUsed.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }))
  }

  const removeStockUsage = (idx: number) => {
    setForm((f) => ({
      ...f,
      stockUsed: f.stockUsed.filter((_, i) => i !== idx),
    }))
  }

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    missed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  }
  const statusLabels: Record<string, string> = {
    scheduled: 'Agendado',
    completed: 'Concluído',
    missed: 'Faltou',
    cancelled: 'Cancelado',
  }

  const dayOfWeek = new Date(dateFilter + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-sm text-gray-500 mt-1">Controle de agenda e faltas</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Novo Agendamento
        </button>
      </div>

      {/* Date Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftDate(-1)} className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50">
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
          <button onClick={() => shiftDate(1)} className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50">
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => setDateFilter(toISODate())}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Hoje
          </button>
          <span className="text-sm text-gray-500 capitalize hidden sm:inline">{dayOfWeek}</span>
        </div>

        <div className="flex flex-1 gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar paciente ou serviço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          >
            <option value="all">Todos</option>
            <option value="scheduled">Agendados</option>
            <option value="completed">Concluídos</option>
            <option value="missed">Faltas</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Agenda */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
              <CalendarDays className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">Nenhum agendamento para esta data</p>
            </div>
          ) : (
            filtered.map((appt) => {
              const patient = patients.find((p) => p.id === appt.patientId)
              const pkg = appt.packageId ? packages.find((p) => p.id === appt.packageId) : null
              const collab = appt.collaboratorId ? collaborators.find((c) => c.id === appt.collaboratorId) : null
              return (
                <div
                  key={appt.id}
                  className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col items-center border-r border-gray-100 pr-4">
                    <span className="text-lg font-bold text-brand-gold">{appt.time}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{patient?.name ?? '—'}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[appt.status]}`}>
                        {statusLabels[appt.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{appt.service}</p>
                    {collab && (
                      <p className="text-xs text-purple-600 mt-0.5 flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        {collab.name}
                      </p>
                    )}
                    {pkg && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Pacote: {pkg.name} ({pkg.completedSessions}/{pkg.totalSessions})
                      </p>
                    )}
                    {appt.notes && <p className="text-xs text-gray-400 mt-0.5">{appt.notes}</p>}
                  </div>

                  <div className="flex items-center gap-1">
                    {appt.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => completeAppointment(appt.id)}
                          title="Marcar como concluído"
                          className="rounded-lg p-2 text-green-500 hover:bg-green-50"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => markMissed(appt.id)}
                          title="Marcar falta"
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        >
                          <UserX className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => openEdit(appt)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(appt.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Ranking de Faltas */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm h-fit">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <UserX className="h-5 w-5 text-red-500" />
            <h2 className="font-semibold text-gray-900">Ranking de Faltas</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {missedStats.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Nenhuma falta registrada</p>
            ) : (
              missedStats.map(({ patient, count }, idx) => (
                <div key={patient!.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{patient!.name}</p>
                  </div>
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                    {count} falta{count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-gray-100 px-5 py-3">
            <p className="text-xs text-gray-400 text-center">
              Total geral: {appointments.filter((a) => a.status === 'missed').length} falta(s)
            </p>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Agendamento' : 'Novo Agendamento'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Paciente *</label>
            <SearchableSelect
              options={patientOptions}
              value={form.patientId}
              onChange={(v) => setForm((f) => ({ ...f, patientId: v, packageId: '' }))}
              placeholder="Buscar paciente..."
              required
            />
          </div>

          {patientPackages.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Vincular a Pacote</label>
              <select
                value={form.packageId}
                onChange={(e) => setForm((f) => ({ ...f, packageId: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              >
                <option value="">Nenhum (avulso)</option>
                {patientPackages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.completedSessions}/{p.totalSessions})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Colaboradora Responsável</label>
            <SearchableSelect
              options={collaboratorOptions}
              value={form.collaboratorId}
              onChange={(v) => setForm((f) => ({ ...f, collaboratorId: v }))}
              placeholder="Buscar colaboradora..."
              emptyLabel="Nenhuma (clínica)"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Tipo de Procedimento *</label>
            <div className="flex gap-3">
              <label
                className={`flex-1 cursor-pointer rounded-lg border-2 px-4 py-3 text-center text-sm font-medium transition-all ${
                  serviceCategory === 'facial'
                    ? 'border-brand-gold bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="serviceCategory"
                  value="facial"
                  checked={serviceCategory === 'facial'}
                  onChange={() => { setServiceCategory('facial'); setForm((f) => ({ ...f, service: '' })) }}
                  className="sr-only"
                />
                Procedimento Facial
              </label>
              <label
                className={`flex-1 cursor-pointer rounded-lg border-2 px-4 py-3 text-center text-sm font-medium transition-all ${
                  serviceCategory === 'corporal'
                    ? 'border-brand-gold bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="serviceCategory"
                  value="corporal"
                  checked={serviceCategory === 'corporal'}
                  onChange={() => { setServiceCategory('corporal'); setForm((f) => ({ ...f, service: '' })) }}
                  className="sr-only"
                />
                Procedimento Corporal
              </label>
            </div>
          </div>

          {serviceCategory && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Procedimento *</label>
              <SearchableSelect
                options={(serviceCategory === 'facial' ? FACIAL_SERVICES : CORPORAL_SERVICES).map((s) => ({ value: s, label: s }))}
                value={form.service}
                onChange={(v) => setForm((f) => ({ ...f, service: v }))}
                placeholder="Buscar procedimento..."
                required
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Data *</label>
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Horário *</label>
              <input
                required
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
          </div>

          {/* Stock Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Materiais Utilizados</label>
              <button
                type="button"
                onClick={addStockUsage}
                className="text-xs font-medium text-brand-gold hover:text-brand-700"
              >
                + Adicionar material
              </button>
            </div>
            {form.stockUsed.length === 0 ? (
              <p className="text-xs text-gray-400">
                Nenhum material adicionado. Ao concluir, o estoque será descontado automaticamente.
              </p>
            ) : (
              <div className="space-y-2">
                {form.stockUsed.map((usage, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <SearchableSelect
                      className="flex-1"
                      options={stockItems.map((s) => ({
                        value: s.id,
                        label: s.name,
                        subtitle: `${s.quantity} ${s.unit}`,
                      }))}
                      value={usage.stockItemId}
                      onChange={(v) => updateStockUsage(idx, 'stockItemId', v)}
                      placeholder="Buscar material..."
                    />
                    <input
                      type="number"
                      min={1}
                      value={usage.quantity}
                      onChange={(e) => updateStockUsage(idx, 'quantity', Number(e.target.value))}
                      className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center focus:border-brand-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeStockUsage(idx)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Observações</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>

          {editing && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Appointment['status'] }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              >
                <option value="scheduled">Agendado</option>
                <option value="completed">Concluído</option>
                <option value="missed">Faltou</option>
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
              {editing ? 'Salvar' : 'Agendar'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir agendamento"
        message="Tem certeza que deseja excluir este agendamento?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
