import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Trash2,
  Edit,
  UserCheck,
  Percent,
  Eye,
  KeyRound,
  Power,
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { formatCurrency } from '../utils/storage'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import type { Collaborator } from '../types'

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  commissionPercent: 25,
  role: '',
  active: true,
  password: '',
}

export default function Collaborators() {
  const { collaborators, commissions, packages, addCollaborator, updateCollaborator, deleteCollaborator } = useData()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Collaborator | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filtered = collaborators.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase()),
  )

  const earningsMap = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {}
    for (const com of commissions) {
      if (!map[com.collaboratorId]) map[com.collaboratorId] = { total: 0, count: 0 }
      map[com.collaboratorId].total += com.collaboratorAmount
      map[com.collaboratorId].count += 1
    }
    return map
  }, [commissions])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (c: Collaborator) => {
    setEditing(c)
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      commissionPercent: c.commissionPercent,
      role: c.role,
      active: c.active,
      password: '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { password, ...rest } = form
    if (editing) {
      await updateCollaborator({ ...editing, ...rest, ...(password ? { password } : {}) } as never)
    } else {
      await addCollaborator({ ...rest, ...(password ? { password } : {}) } as never)
    }
    setModalOpen(false)
  }

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteCollaborator(deleteTarget)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Colaboradoras</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie a equipe e comissões</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Nova Colaboradora
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou função..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
          <UserCheck className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">Nenhuma colaboradora encontrada</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((collab) => {
            const earnings = earningsMap[collab.id]
            const assignedPackages = packages.filter((p) => p.collaboratorId === collab.id && p.status === 'active').length
            return (
              <div
                key={collab.id}
                className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-700 text-sm font-bold">
                      {collab.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{collab.name}</h3>
                      <p className="text-xs text-gray-500">{collab.role || 'Sem função definida'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {collab.hasPassword && (
                      <span className="rounded-full bg-purple-100 p-1" title="Tem acesso ao sistema">
                        <KeyRound className="h-3 w-3 text-purple-600" />
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        collab.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {collab.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-amber-50 px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Percent className="h-3 w-3 text-amber-600" />
                      <span className="text-lg font-bold text-amber-700">{collab.commissionPercent}</span>
                    </div>
                    <p className="text-[10px] text-amber-600 font-medium">Comissão</p>
                  </div>
                  <div className="rounded-lg bg-green-50 px-3 py-2 text-center">
                    <p className="text-sm font-bold text-green-700">{formatCurrency(earnings?.total ?? 0)}</p>
                    <p className="text-[10px] text-green-600 font-medium">Ganhos</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">
                    <p className="text-sm font-bold text-blue-700">{assignedPackages}</p>
                    <p className="text-[10px] text-blue-600 font-medium">Pacotes</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                  <Link
                    to={`/colaboradoras/${collab.id}`}
                    className="inline-flex items-center gap-1 text-xs text-brand-gold hover:text-brand-700 font-medium"
                  >
                    <Eye className="h-3 w-3" /> Detalhes
                  </Link>
                  <span className="text-gray-200">|</span>
                  <button
                    onClick={() => openEdit(collab)}
                    className="inline-flex items-center gap-1 text-xs text-brand-gold hover:text-brand-700"
                  >
                    <Edit className="h-3 w-3" /> Editar
                  </button>
                  <span className="text-gray-200">|</span>
                  <button
                    onClick={() => updateCollaborator({ ...collab, active: !collab.active } as never)}
                    className={`inline-flex items-center gap-1 text-xs ${collab.active ? 'text-amber-500 hover:text-amber-700' : 'text-green-500 hover:text-green-700'}`}
                  >
                    <Power className="h-3 w-3" /> {collab.active ? 'Inativar' : 'Ativar'}
                  </button>
                  <span className="text-gray-200">|</span>
                  <button
                    onClick={() => setDeleteTarget(collab.id)}
                    className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" /> Excluir
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Colaboradora' : 'Nova Colaboradora'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nome *</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nome completo"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Função</label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              placeholder="Ex: Esteticista, Massoterapeuta"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Telefone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="(00) 00000-0000"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@exemplo.com"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Senha de Acesso {!editing && '*'}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={editing ? 'Deixe vazio para manter a atual' : 'Senha para login'}
              required={!editing}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
            <p className="mt-1 text-xs text-gray-400">
              A colaboradora faz login usando o e-mail e esta senha.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Comissão (%) *</label>
            <div className="relative">
              <input
                required
                type="number"
                min={0}
                max={100}
                step={1}
                value={form.commissionPercent}
                onChange={(e) => setForm((f) => ({ ...f, commissionPercent: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
              <Percent className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Define quanto a colaboradora ganha por sessão concluída. Ex: 25% = ela recebe 25% do valor da sessão.
            </p>
          </div>

          {editing && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  form.active ? 'bg-brand-gold' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    form.active ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-500">{form.active ? 'Ativa' : 'Inativa'}</span>
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
              {editing ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir colaboradora"
        message="Tem certeza que deseja excluir esta colaboradora? Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
