import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Edit, FileText, Send, CheckCircle, XCircle } from 'lucide-react'
import { api } from '../services/api'
import { useData } from '../contexts/DataContext'
import { formatDate, formatCurrency } from '../utils/storage'
import { SERVICE_LIST } from '../utils/services'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import type { Quote } from '../types'

const PAYMENT_METHODS = [
  'À vista (Pix)',
  'À vista (Dinheiro)',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Boleto Bancário',
  'Transferência Bancária',
  'Parcelado',
]

const statusColors: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-600',
  enviado: 'bg-blue-100 text-blue-700',
  aceito: 'bg-green-100 text-green-700',
  recusado: 'bg-red-100 text-red-700',
}
const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  aceito: 'Aceito',
  recusado: 'Recusado',
}

const emptyForm = {
  patientId: null as string | null,
  leadId: null as string | null,
  clientName: '',
  clientEmail: '',
  procedureName: '',
  sessions: 1,
  totalValue: 0,
  paymentMethod: '',
  status: 'rascunho' as Quote['status'],
  notes: '',
}

export default function Quotes() {
  const { patients } = useData()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Quote | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.quotes.list().then(setQuotes).finally(() => setLoading(false))
  }, [])

  const filtered = quotes.filter((q) => {
    const matchSearch = !search ||
      q.clientName.toLowerCase().includes(search.toLowerCase()) ||
      q.procedureName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || q.status === statusFilter
    return matchSearch && matchStatus
  })

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (quote: Quote) => {
    setEditing(quote)
    setForm({
      patientId: quote.patientId,
      leadId: quote.leadId,
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      procedureName: quote.procedureName,
      sessions: quote.sessions,
      totalValue: quote.totalValue,
      paymentMethod: quote.paymentMethod,
      status: quote.status,
      notes: quote.notes,
    })
    setError('')
    setModalOpen(true)
  }

  const selectPatient = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId)
    if (patient) {
      setForm((f) => ({
        ...f,
        patientId,
        clientName: patient.name,
        clientEmail: patient.email || '',
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        const updated = await api.quotes.update(editing.id, form)
        setQuotes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)))
      } else {
        const created = await api.quotes.create(form)
        setQuotes((prev) => [created, ...prev])
      }
      setModalOpen(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const sendQuote = async (id: string) => {
    setSending(id)
    try {
      const updated = await api.quotes.send(id)
      setQuotes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSending(null)
    }
  }

  const markStatus = async (id: string, status: Quote['status']) => {
    const updated = await api.quotes.update(id, { status } as Partial<Quote>)
    setQuotes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)))
  }

  const confirmDelete = async () => {
    if (deleteTarget) {
      await api.quotes.delete(deleteTarget)
      setQuotes((prev) => prev.filter((q) => q.id !== deleteTarget))
      setDeleteTarget(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-sm text-gray-500 mt-1">{quotes.length} orçamento{quotes.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors">
          <Plus className="h-4 w-4" /> Novo Orçamento
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por cliente ou procedimento..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none">
          <option value="all">Todos</option>
          <option value="rascunho">Rascunhos</option>
          <option value="enviado">Enviados</option>
          <option value="aceito">Aceitos</option>
          <option value="recusado">Recusados</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
          <FileText className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">{search ? 'Nenhum orçamento encontrado' : 'Nenhum orçamento cadastrado'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((quote) => (
            <div key={quote.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{quote.clientName}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[quote.status]}`}>
                      {statusLabels[quote.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{quote.procedureName}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{quote.sessions} sessão(ões)</span>
                    <span className="text-gray-300">·</span>
                    <span className="font-semibold text-brand-gold">{formatCurrency(quote.totalValue)}</span>
                    {quote.paymentMethod && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span>{quote.paymentMethod}</span>
                      </>
                    )}
                    {quote.clientEmail && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span>{quote.clientEmail}</span>
                      </>
                    )}
                  </div>
                  {quote.sentAt && (
                    <p className="text-[10px] text-gray-400 mt-1">Enviado em {formatDate(quote.sentAt.split('T')[0])}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {quote.status === 'rascunho' && quote.clientEmail && (
                    <button onClick={() => sendQuote(quote.id)} disabled={sending === quote.id}
                      className="rounded-lg p-2 text-blue-500 hover:bg-blue-50 disabled:opacity-50" title="Enviar por e-mail">
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                  {quote.status === 'enviado' && (
                    <>
                      <button onClick={() => markStatus(quote.id, 'aceito')} className="rounded-lg p-2 text-green-500 hover:bg-green-50" title="Marcar como aceito">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button onClick={() => markStatus(quote.id, 'recusado')} className="rounded-lg p-2 text-red-500 hover:bg-red-50" title="Marcar como recusado">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button onClick={() => openEdit(quote)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(quote.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Orçamento' : 'Novo Orçamento'} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Vincular a Paciente</label>
            <select
              value={form.patientId || ''}
              onChange={(e) => e.target.value ? selectPatient(e.target.value) : setForm((f) => ({ ...f, patientId: null }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            >
              <option value="">Nenhum (preencher manualmente)</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nome do Cliente *</label>
              <input required type="text" value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">E-mail do Cliente</label>
              <input type="email" value={form.clientEmail} onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
                placeholder="Para envio do orçamento"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Procedimento *</label>
            <select required value={form.procedureName} onChange={(e) => setForm((f) => ({ ...f, procedureName: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400">
              <option value="">Selecione...</option>
              {SERVICE_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Sessões *</label>
              <input required type="number" min={1} value={form.sessions} onChange={(e) => setForm((f) => ({ ...f, sessions: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Valor Total (R$) *</label>
              <input required type="number" min={0} step="0.01" value={form.totalValue || ''} onChange={(e) => setForm((f) => ({ ...f, totalValue: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Pgto</label>
              <select value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400">
                <option value="">Selecione...</option>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {form.totalValue > 0 && form.sessions > 0 && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
              <p className="text-xs font-medium text-gray-700">
                Valor por sessão: <span className="text-brand-gold font-semibold">{formatCurrency(form.totalValue / form.sessions)}</span>
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Observações</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" />
          </div>

          {editing && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Quote['status'] }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400">
                <option value="rascunho">Rascunho</option>
                <option value="enviado">Enviado</option>
                <option value="aceito">Aceito</option>
                <option value="recusado">Recusado</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="rounded-lg bg-brand-gold px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors">{editing ? 'Salvar' : 'Criar Orçamento'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Excluir orçamento" message="Tem certeza que deseja excluir este orçamento?" onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
