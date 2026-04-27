import { useState, useMemo } from 'react'
import {
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  UserX,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { formatCurrency, toISODate } from '../utils/storage'
import { FACIAL_SERVICES, CORPORAL_SERVICES, type ServiceCategory } from '../utils/services'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SearchableSelect from '../components/ui/SearchableSelect'
import type { Appointment } from '../types'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const emptyForm = {
  patientId: '',
  packageId: '',
  collaboratorId: '',
  service: '',
  date: toISODate(),
  time: '09:00',
  room: 'sala1',
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

  const today = toISODate()
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [selectedDate, setSelectedDate] = useState(today)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory | ''>('')
  const [toastMsg, setToastMsg] = useState('')

  const triggerToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 4000)
  }

  const firstDayOfWeek = new Date(currentMonth.year, currentMonth.month, 1).getDay()
  const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate()

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = []
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }, [firstDayOfWeek, daysInMonth])

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, number> = {}
    appointments.forEach((a) => {
      map[a.date] = (map[a.date] || 0) + 1
    })
    return map
  }, [appointments])

  const dayAppointments = useMemo(
    () => appointments.filter((a) => a.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, selectedDate],
  )
  const sala1 = dayAppointments.filter((a) => (a.room || 'sala1') === 'sala1')
  const sala2 = dayAppointments.filter((a) => (a.room || 'sala1') === 'sala2')

  const patientPackages = useMemo(() => {
    if (!form.patientId) return []
    return packages.filter((p) => p.patientId === form.patientId && p.status === 'active')
  }, [form.patientId, packages])

  const detectCategory = (service: string): ServiceCategory | '' => {
    if (FACIAL_SERVICES.includes(service as typeof FACIAL_SERVICES[number])) return 'facial'
    if (CORPORAL_SERVICES.includes(service as typeof CORPORAL_SERVICES[number])) return 'corporal'
    return ''
  }

  const prevMonth = () =>
    setCurrentMonth((m) => m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 })
  const nextMonth = () =>
    setCurrentMonth((m) => m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 })

  const dateStr = (day: number) =>
    `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const openNew = (date?: string) => {
    setEditing(null)
    setForm({ ...emptyForm, date: date || selectedDate })
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
      room: appt.room || 'sala1',
      status: appt.status,
      stockUsed: appt.stockUsed,
      notes: appt.notes,
    })
    setServiceCategory(detectCategory(appt.service))
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parseTime = (t: string) => {
      if (!t) return 0
      const [h, m] = t.split(':').map(Number)
      return h * 60 + (m || 0)
    }
    const getRange = (timeStr: string) => {
      const parts = timeStr.split(' às ')
      const start = parseTime(parts[0])
      const end = parts[1] ? parseTime(parts[1]) : start + 30
      return [start, end]
    }

    const [newStart, newEnd] = getRange(form.time)

    if (newEnd <= newStart && form.time.includes(' às ')) {
      triggerToast('O horário de término deve ser maior que o de início.')
      return
    }

    const hasOverlap = appointments.some(appt => {
      if (appt.date !== form.date) return false
      if (appt.room !== form.room) return false
      if (appt.status === 'cancelled') return false
      if (editing && appt.id === editing.id) return false

      const [existStart, existEnd] = getRange(appt.time)
      return newStart < existEnd && newEnd > existStart
    })

    if (hasOverlap) {
      triggerToast('Atenção: Já existe um agendamento nesta sala que coincide com este horário!')
      return
    }

    if (editing) {
      await updateAppointment({ ...editing, ...form })
    } else {
      await addAppointment(form as Omit<Appointment, 'id' | 'createdAt'>)
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
    setForm((f) => ({ ...f, stockUsed: [...f.stockUsed, { stockItemId: '', quantity: 1 }] }))
  }

  const updateStockUsage = (idx: number, field: 'stockItemId' | 'quantity', value: string | number) => {
    setForm((f) => ({ ...f, stockUsed: f.stockUsed.map((s, i) => (i === idx ? { ...s, [field]: value } : s)) }))
  }

  const removeStockUsage = (idx: number) => {
    setForm((f) => ({ ...f, stockUsed: f.stockUsed.filter((_, i) => i !== idx) }))
  }

  const statusColors: Record<string, string> = {
    scheduled: 'border-l-blue-400',
    completed: 'border-l-green-400',
    missed: 'border-l-red-400',
    cancelled: 'border-l-gray-300',
  }
  const statusBadge: Record<string, string> = {
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

  const selectedDayOfWeek = new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  function AppointmentCard({ appt }: { appt: Appointment }) {
    const patient = patients.find((p) => p.id === appt.patientId)
    const collab = appt.collaboratorId ? collaborators.find((c) => c.id === appt.collaboratorId) : null
    const pkg = appt.packageId ? packages.find((p) => p.id === appt.packageId) : null

    return (
      <div className={`rounded-lg border border-gray-100 bg-white p-3 shadow-sm border-l-4 ${statusColors[appt.status]} hover:shadow-md transition-shadow`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3 w-3 text-brand-gold flex-shrink-0" />
              <span className="text-xs font-bold text-brand-gold">{appt.time}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${statusBadge[appt.status]}`}>
                {statusLabels[appt.status]}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">{patient?.name ?? '—'}</p>
            <p className="text-xs text-gray-500 truncate">{appt.service}</p>
            {collab && (
              <p className="flex items-center gap-1 text-[10px] text-purple-600 mt-1">
                <UserCheck className="h-2.5 w-2.5" /> {collab.name}
              </p>
            )}
            {pkg && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                {pkg.name} ({pkg.completedSessions}/{pkg.totalSessions})
              </p>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            {appt.status === 'scheduled' && (
              <>
                <button onClick={() => completeAppointment(appt.id)} title="Concluir" className="rounded p-1 text-green-500 hover:bg-green-50">
                  <CheckCircle className="h-4 w-4" />
                </button>
                <button onClick={() => markMissed(appt.id)} title="Falta" className="rounded p-1 text-red-500 hover:bg-red-50">
                  <UserX className="h-4 w-4" />
                </button>
              </>
            )}
            <button onClick={() => openEdit(appt)} className="rounded p-1 text-gray-400 hover:bg-gray-100">
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setDeleteTarget(appt.id)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500 mt-1">Calendário mensal com salas</p>
        </div>
        <button onClick={() => openNew()} className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors">
          <Plus className="h-4 w-4" /> Novo Agendamento
        </button>
      </div>

      {/* Month Calendar */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button onClick={prevMonth} className="rounded-lg p-2 hover:bg-gray-50"><ChevronLeft className="h-5 w-5 text-gray-600" /></button>
          <h2 className="text-lg font-semibold text-gray-900">
            {MONTH_NAMES[currentMonth.month]} {currentMonth.year}
          </h2>
          <button onClick={nextMonth} className="rounded-lg p-2 hover:bg-gray-50"><ChevronRight className="h-5 w-5 text-gray-600" /></button>
        </div>

        <div className="grid grid-cols-7">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 border-b border-gray-100">{d}</div>
          ))}
          {calendarDays.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="min-h-[60px] border-b border-r border-gray-50 bg-gray-50/30" />
            const ds = dateStr(day)
            const count = appointmentsByDate[ds] || 0
            const isSelected = ds === selectedDate
            const isToday = ds === today

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(ds)}
                className={`min-h-[60px] border-b border-r border-gray-50 p-1.5 cursor-pointer transition-colors ${
                  isSelected ? 'bg-brand-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                    isToday ? 'bg-brand-gold text-white' : isSelected ? 'text-brand-700 font-bold' : 'text-gray-700'
                  }`}>
                    {day}
                  </span>
                  {count > 0 && (
                    <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                      {count}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Day Detail with Rooms */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900 capitalize">{selectedDayOfWeek}</h2>
            <p className="text-xs text-gray-500">{dayAppointments.length} agendamento{dayAppointments.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => openNew(selectedDate)}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-gold px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Agendar
          </button>
        </div>

        {dayAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <CalendarDays className="h-12 w-12 text-gray-200" />
            <p className="mt-4 text-sm text-gray-400">Nenhum agendamento neste dia</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3 w-3 rounded-full bg-brand-gold" />
                <h3 className="text-sm font-semibold text-gray-700">Sala 1</h3>
                <span className="text-xs text-gray-400">({sala1.length})</span>
              </div>
              {sala1.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">Nenhum agendamento</p>
              ) : (
                <div className="space-y-2">
                  {sala1.map((appt) => <AppointmentCard key={appt.id} appt={appt} />)}
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3 w-3 rounded-full bg-brand-green" />
                <h3 className="text-sm font-semibold text-gray-700">Sala 2</h3>
                <span className="text-xs text-gray-400">({sala2.length})</span>
              </div>
              {sala2.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">Nenhum agendamento</p>
              ) : (
                <div className="space-y-2">
                  {sala2.map((appt) => <AppointmentCard key={appt.id} appt={appt} />)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Agendamento' : 'Novo Agendamento'} maxWidth="max-w-xl">
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
                  <option key={p.id} value={p.id}>{p.name} ({p.completedSessions}/{p.totalSessions})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Colaboradora Responsável *</label>
            <SearchableSelect
              options={collaboratorOptions}
              value={form.collaboratorId}
              onChange={(v) => setForm((f) => ({ ...f, collaboratorId: v }))}
              placeholder="Buscar colaboradora..."
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Sala *</label>
            <div className="flex gap-3">
              <label className={`flex-1 cursor-pointer rounded-lg border-2 px-4 py-3 text-center text-sm font-medium transition-all ${
                form.room === 'sala1' ? 'border-brand-gold bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
                <input type="radio" name="room" value="sala1" checked={form.room === 'sala1'}
                  onChange={() => setForm((f) => ({ ...f, room: 'sala1' }))} className="sr-only" />
                Sala 1
              </label>
              <label className={`flex-1 cursor-pointer rounded-lg border-2 px-4 py-3 text-center text-sm font-medium transition-all ${
                form.room === 'sala2' ? 'border-brand-gold bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
                <input type="radio" name="room" value="sala2" checked={form.room === 'sala2'}
                  onChange={() => setForm((f) => ({ ...f, room: 'sala2' }))} className="sr-only" />
                Sala 2
              </label>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Tipo de Procedimento *</label>
            <div className="flex gap-3">
              <label className={`flex-1 cursor-pointer rounded-lg border-2 px-4 py-3 text-center text-sm font-medium transition-all ${
                serviceCategory === 'facial' ? 'border-brand-gold bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
                <input type="radio" name="serviceCategory" value="facial" checked={serviceCategory === 'facial'}
                  onChange={() => { setServiceCategory('facial'); setForm((f) => ({ ...f, service: '' })) }} className="sr-only" />
                Facial
              </label>
              <label className={`flex-1 cursor-pointer rounded-lg border-2 px-4 py-3 text-center text-sm font-medium transition-all ${
                serviceCategory === 'corporal' ? 'border-brand-gold bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
                <input type="radio" name="serviceCategory" value="corporal" checked={serviceCategory === 'corporal'}
                  onChange={() => { setServiceCategory('corporal'); setForm((f) => ({ ...f, service: '' })) }} className="sr-only" />
                Corporal
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

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Data *</label>
              <input required type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Início *</label>
              <input required type="time" value={form.time.split(' às ')[0] || ''} onChange={(e) => {
                const endTime = form.time.split(' às ')[1] || ''
                setForm((f) => ({ ...f, time: e.target.value + (endTime ? ' às ' + endTime : '') }))
              }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Fim (opcional)</label>
              <input type="time" value={form.time.split(' às ')[1] || ''} onChange={(e) => {
                const startTime = form.time.split(' às ')[0] || ''
                setForm((f) => ({ ...f, time: startTime + (e.target.value ? ' às ' + e.target.value : '') }))
              }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Materiais Utilizados</label>
              <button type="button" onClick={addStockUsage} className="text-xs font-medium text-brand-gold hover:text-brand-700">
                + Adicionar material
              </button>
            </div>
            {form.stockUsed.length === 0 ? (
              <p className="text-xs text-gray-400">Nenhum material adicionado.</p>
            ) : (
              <div className="space-y-2">
                {form.stockUsed.map((usage, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <SearchableSelect
                      className="flex-1"
                      options={stockItems.map((s) => ({ value: s.id, label: s.name, subtitle: `${s.quantity} ${s.unit}` }))}
                      value={usage.stockItemId}
                      onChange={(v) => updateStockUsage(idx, 'stockItemId', v)}
                      placeholder="Buscar material..."
                    />
                    <input type="number" min={1} value={usage.quantity}
                      onChange={(e) => updateStockUsage(idx, 'quantity', Number(e.target.value))}
                      className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center focus:border-brand-400 focus:outline-none" />
                    <button type="button" onClick={() => removeStockUsage(idx)} className="text-red-400 hover:text-red-600">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Observações</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" />
          </div>

          {editing && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Appointment['status'] }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400">
                <option value="scheduled">Agendado</option>
                <option value="completed">Concluído</option>
                <option value="missed">Faltou</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="rounded-lg bg-brand-gold px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors">
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

      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-[9999] rounded-lg bg-amber-50 border border-amber-200 p-4 shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <p className="text-sm font-medium text-amber-800">{toastMsg}</p>
        </div>
      )}
    </div>
  )
}
