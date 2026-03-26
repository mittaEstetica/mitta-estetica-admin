import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Edit, Megaphone, Phone, Mail } from 'lucide-react'
import { api } from '../services/api'
import { formatDate } from '../utils/storage'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import type { Lead } from '../types'

const SOURCES = ['Instagram', 'Facebook', 'Google', 'Indicação', 'WhatsApp', 'Site', 'Outros']

const statusColors: Record<string, string> = {
  novo: 'bg-blue-100 text-blue-700',
  em_contato: 'bg-yellow-100 text-yellow-700',
  convertido: 'bg-green-100 text-green-700',
  perdido: 'bg-red-100 text-red-700',
}
const statusLabels: Record<string, string> = {
  novo: 'Novo',
  em_contato: 'Em Contato',
  convertido: 'Convertido',
  perdido: 'Perdido',
}

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  source: '',
  status: 'novo' as Lead['status'],
  notes: '',
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    api.leads.list().then(setLeads).finally(() => setLoading(false))
  }, [])

  const filtered = leads.filter((l) => {
    const matchSearch = !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      l.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || l.status === statusFilter
    return matchSearch && matchStatus
  })

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (lead: Lead) => {
    setEditing(lead)
    setForm({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      status: lead.status,
      notes: lead.notes,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      const updated = await api.leads.update(editing.id, form)
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    } else {
      const created = await api.leads.create(form)
      setLeads((prev) => [created, ...prev])
    }
    setModalOpen(false)
  }

  const confirmDelete = async () => {
    if (deleteTarget) {
      await api.leads.delete(deleteTarget)
      setLeads((prev) => prev.filter((l) => l.id !== deleteTarget))
      setDeleteTarget(null)
    }
  }

  const stats = {
    novo: leads.filter((l) => l.status === 'novo').length,
    em_contato: leads.filter((l) => l.status === 'em_contato').length,
    convertido: leads.filter((l) => l.status === 'convertido').length,
    perdido: leads.filter((l) => l.status === 'perdido').length,
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
          <h1 className="text-2xl font-bold text-gray-900">Comercial</h1>
          <p className="text-sm text-gray-500 mt-1">{leads.length} lead{leads.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors">
          <Plus className="h-4 w-4" /> Novo Lead
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(stats).map(([key, count]) => (
          <div key={key} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[key]}`}>
              {statusLabels[key]}
            </span>
            <p className="mt-2 text-2xl font-bold text-gray-900">{count}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
        >
          <option value="all">Todos</option>
          <option value="novo">Novos</option>
          <option value="em_contato">Em Contato</option>
          <option value="convertido">Convertidos</option>
          <option value="perdido">Perdidos</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
          <Megaphone className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">{search ? 'Nenhum lead encontrado' : 'Nenhum lead cadastrado'}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lead) => (
            <div key={lead.id} className="group relative rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(lead)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteTarget(lead.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-gray-900 truncate">{lead.name}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[lead.status]}`}>
                  {statusLabels[lead.status]}
                </span>
              </div>

              {lead.phone && (
                <p className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <Phone className="h-3 w-3" /> {lead.phone}
                </p>
              )}
              {lead.email && (
                <p className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <Mail className="h-3 w-3" /> {lead.email}
                </p>
              )}

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                {lead.source && (
                  <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-600">{lead.source}</span>
                )}
                <span className="text-[10px] text-gray-400 ml-auto">{formatDate(lead.createdAt?.split('T')[0])}</span>
              </div>

              {lead.notes && (
                <p className="mt-2 text-xs text-gray-400 line-clamp-2">{lead.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Lead' : 'Novo Lead'} maxWidth="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nome *</label>
            <input required type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Telefone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(00) 00000-0000"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Origem</label>
              <select value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400">
                <option value="">Selecione...</option>
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Lead['status'] }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400">
                <option value="novo">Novo</option>
                <option value="em_contato">Em Contato</option>
                <option value="convertido">Convertido</option>
                <option value="perdido">Perdido</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Observações</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="rounded-lg bg-brand-gold px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors">{editing ? 'Salvar' : 'Cadastrar'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Excluir lead" message="Tem certeza que deseja excluir este lead?" onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
