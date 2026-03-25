import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Camera, Trash2, Edit, Phone, Mail, Users, PackageCheck } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { formatDate, formatCurrency } from '../utils/storage'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import type { Patient } from '../types'

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  cpf: '',
  birthDate: '',
  address: '',
  photo: null as string | null,
  notes: '',
}

export default function Patients() {
  const { patients, packages, addPatient, updatePatient, deletePatient } = useData()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.cpf.includes(search) ||
      p.phone.includes(search),
  )

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (p: Patient) => {
    setEditing(p)
    setForm({
      name: p.name,
      phone: p.phone,
      email: p.email,
      cpf: p.cpf,
      birthDate: p.birthDate,
      address: p.address,
      photo: p.photo,
      notes: p.notes,
    })
    setModalOpen(true)
  }

  const handlePhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, photo: reader.result as string }))
    reader.readAsDataURL(file)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await updatePatient({ ...editing, ...form })
    } else {
      await addPatient(form)
    }
    setModalOpen(false)
  }

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deletePatient(deleteTarget)
      setDeleteTarget(null)
    }
  }

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500 mt-1">{patients.length} paciente{patients.length !== 1 ? 's' : ''} cadastrado{patients.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Novo Paciente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome, CPF ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
          <Users className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">
            {search ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado ainda'}
          </p>
          {!search && (
            <button
              onClick={openNew}
              className="mt-3 text-sm font-medium text-brand-gold hover:text-brand-700"
            >
              Cadastrar primeiro paciente
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const patientPkgs = packages.filter((pk) => pk.patientId === p.id)
            const activePkgs = patientPkgs.filter((pk) => pk.status === 'active')
            const totalPaid = patientPkgs.reduce((s, pk) => s + pk.paidValue, 0)

            return (
              <div
                key={p.id}
                className="group relative rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(p)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(p.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <Link to={`/pacientes/${p.id}`} className="block">
                  <div className="flex items-start gap-4">
                    {p.photo ? (
                      <img src={p.photo} alt="" className="h-14 w-14 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold text-lg flex-shrink-0">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                      {p.phone && (
                        <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Phone className="h-3 w-3" /> {p.phone}
                        </p>
                      )}
                      {p.email && (
                        <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <Mail className="h-3 w-3" /> {p.email}
                        </p>
                      )}
                      {p.birthDate && (
                        <p className="text-xs text-gray-400 mt-1">Nasc.: {formatDate(p.birthDate)}</p>
                      )}
                    </div>
                  </div>

                  {patientPkgs.length > 0 && (
                    <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-1 text-xs text-brand-700">
                        <PackageCheck className="h-3.5 w-3.5" />
                        <span className="font-medium">{activePkgs.length} ativo{activePkgs.length !== 1 ? 's' : ''}</span>
                      </div>
                      <span className="text-gray-200">|</span>
                      <span className="text-xs text-gray-500">{patientPkgs.length} pacote{patientPkgs.length !== 1 ? 's' : ''}</span>
                      <span className="text-gray-200">|</span>
                      <span className="text-xs text-green-600 font-medium">{formatCurrency(totalPaid)}</span>
                    </div>
                  )}
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Paciente' : 'Novo Paciente'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photo */}
          <div className="flex flex-col items-center gap-3">
            <div
              onClick={() => fileRef.current?.click()}
              className="relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-full bg-gray-100 overflow-hidden hover:ring-2 hover:ring-brand-400 transition-all"
            >
              {form.photo ? (
                <img src={form.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-8 w-8 text-gray-400" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-brand-gold hover:text-brand-700">
              {form.photo ? 'Trocar foto' : 'Adicionar foto'}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Nome completo *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Telefone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">CPF</label>
              <input
                type="text"
                value={form.cpf}
                onChange={(e) => set('cpf', e.target.value)}
                placeholder="000.000.000-00"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Data de nascimento</label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => set('birthDate', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Endereço</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Observações</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
          </div>

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
        title="Excluir paciente"
        message="Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
