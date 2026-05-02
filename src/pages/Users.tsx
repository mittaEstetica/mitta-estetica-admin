import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  UserCog,
} from 'lucide-react'
import { api } from '../services/api'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import type { SystemUser, Permission } from '../types'

const AVAILABLE_PERMISSIONS: { key: Permission; label: string; description: string }[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'Visão geral e estatísticas' },
  { key: 'pacientes', label: 'Pacientes', description: 'Cadastro e pacotes de pacientes' },
  { key: 'pacotes-finalizados', label: 'Pacotes Finalizados', description: 'Visualização de pacotes concluídos' },
  { key: 'agendamentos', label: 'Agendamentos', description: 'Agenda e sessões' },
  { key: 'colaboradoras', label: 'Colaboradoras', description: 'Gestão de colaboradoras e comissões' },
  { key: 'estoque', label: 'Estoque', description: 'Controle de materiais e insumos' },
  { key: 'financeiro', label: 'Financeiro', description: 'Relatórios financeiros' },
  { key: 'whatsapp', label: 'WhatsApp', description: 'Lembretes e mensagens' },
  { key: 'comercial', label: 'Comercial', description: 'Gestão de leads e prospecção' },
  { key: 'orcamentos', label: 'Orçamentos', description: 'Criação e envio de orçamentos' },
  { key: 'usuarios', label: 'Usuários', description: 'Gerenciar contas e permissões' },
]

const emptyForm = {
  username: '',
  password: '',
  name: '',
  role: 'admin' as 'admin' | 'collaborator',
  permissions: ['*'] as string[],
  active: true,
  fullAccess: true,
}

export default function Users() {
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SystemUser | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const fetchUsers = async () => {
    try {
      const data = await api.users.list()
      setUsers(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()),
  )

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowPassword(false)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (u: SystemUser) => {
    setEditing(u)
    const isFullAccess = u.permissions.includes('*')
    setForm({
      username: u.username,
      password: '',
      name: u.name,
      role: u.role,
      permissions: isFullAccess ? [] : [...u.permissions],
      active: u.active,
      fullAccess: isFullAccess,
    })
    setShowPassword(false)
    setError('')
    setModalOpen(true)
  }

  const togglePermission = (key: string) => {
    setForm((f) => {
      const has = f.permissions.includes(key)
      return {
        ...f,
        permissions: has
          ? f.permissions.filter((p) => p !== key)
          : [...f.permissions, key],
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const perms = form.fullAccess ? ['*'] : form.permissions

    try {
      if (editing) {
        const payload: Record<string, unknown> = {
          username: form.username,
          name: form.name,
          role: form.role,
          permissions: perms,
          active: form.active,
        }
        if (form.password) payload.password = form.password
        await api.users.update(editing.id, payload as never)
      } else {
        if (!form.password) {
          setError('Senha é obrigatória para novos usuários')
          return
        }
        await api.users.create({
          username: form.username,
          password: form.password,
          name: form.name,
          role: form.role,
          permissions: perms,
          active: form.active,
        })
      }
      setModalOpen(false)
      fetchUsers()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.users.delete(deleteTarget)
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir')
    }
    setDeleteTarget(null)
  }

  const getPermissionLabels = (perms: string[]) => {
    if (perms.includes('*')) return 'Acesso total'
    return perms
      .map((p) => AVAILABLE_PERMISSIONS.find((ap) => ap.key === p)?.label ?? p)
      .join(', ')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie contas de acesso e permissões</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Novo Usuário
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou usuário..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
          <UserCog className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${
                    u.permissions.includes('*')
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{u.name}</h3>
                    <p className="text-xs text-gray-500">@{u.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {u.permissions.includes('*') ? (
                    <ShieldCheck className="h-4 w-4 text-purple-500" />
                  ) : (
                    <Shield className="h-4 w-4 text-blue-500" />
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {u.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500 font-medium mb-1">Permissões</p>
                <p className="text-xs text-gray-700">{getPermissionLabels(u.permissions)}</p>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
                <button
                  onClick={() => openEdit(u)}
                  className="inline-flex items-center gap-1 text-xs text-brand-gold hover:text-brand-700 font-medium"
                >
                  <Edit className="h-3 w-3" /> Editar
                </button>
                {u.username !== 'admin' && (
                  <>
                    <span className="text-gray-200">|</span>
                    <button
                      onClick={() => setDeleteTarget(u.id)}
                      className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" /> Excluir
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Usuário' : 'Novo Usuário'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nome *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome do usuário"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Usuário (login) *</label>
              <input
                required
                type="text"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="nome.usuario"
                disabled={editing?.username === 'admin'}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Senha {editing ? '(deixe vazio para manter)' : '*'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={editing ? '••••••••' : 'Crie uma senha'}
                required={!editing}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Nível de Acesso</label>
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, fullAccess: true, permissions: [] }))}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium border transition-colors ${
                  form.fullAccess
                    ? 'bg-purple-50 border-purple-300 text-purple-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                Acesso Total
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, fullAccess: false, permissions: ['dashboard'] }))}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium border transition-colors ${
                  !form.fullAccess
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Shield className="h-4 w-4" />
                Personalizado
              </button>
            </div>

            {!form.fullAccess && (
              <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
                {AVAILABLE_PERMISSIONS.map((perm) => {
                  const checked = form.permissions.includes(perm.key)
                  return (
                    <label
                      key={perm.key}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermission(perm.key)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-gold focus:ring-brand-gold/20"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{perm.label}</p>
                        <p className="text-xs text-gray-500">{perm.description}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {editing && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                disabled={editing.username === 'admin'}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-50 ${
                  form.active ? 'bg-brand-gold' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    form.active ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-500">{form.active ? 'Ativo' : 'Inativo'}</span>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
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
        title="Excluir usuário"
        message="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
