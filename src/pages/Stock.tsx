import { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Trash2,
  Edit,
  PackagePlus,
  PackageMinus,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { formatCurrency, formatDateTime } from '../utils/storage'
import { STOCK_CATEGORIES, STOCK_UNITS } from '../utils/services'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import type { StockItem } from '../types'

const emptyForm = {
  name: '',
  category: '',
  quantity: 0,
  minQuantity: 0,
  unit: 'unidade',
  costPrice: 0,
}

export default function Stock() {
  const { stockItems, stockMovements, addStockItem, updateStockItem, deleteStockItem, addStockMovement } = useData()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [movementModal, setMovementModal] = useState<{ item: StockItem; type: 'in' | 'out' } | null>(null)
  const [editing, setEditing] = useState<StockItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [moveQty, setMoveQty] = useState(1)
  const [moveReason, setMoveReason] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState<string | null>(null)

  const filtered = stockItems.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'all' || s.category === catFilter
    return matchSearch && matchCat
  })

  const itemMovements = useMemo(() => {
    if (!showHistory) return []
    return [...stockMovements.filter((m) => m.stockItemId === showHistory)].sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt),
    )
  }, [stockMovements, showHistory])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (item: StockItem) => {
    setEditing(item)
    setForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      unit: item.unit,
      costPrice: item.costPrice,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await updateStockItem({ ...editing, ...form })
    } else {
      await addStockItem(form)
    }
    setModalOpen(false)
  }

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!movementModal) return
    await addStockMovement({
      stockItemId: movementModal.item.id,
      type: movementModal.type,
      quantity: moveQty,
      reason: moveReason || (movementModal.type === 'in' ? 'Entrada manual' : 'Saída manual'),
    })
    setMovementModal(null)
    setMoveQty(1)
    setMoveReason('')
  }

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteStockItem(deleteTarget)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estoque</h1>
          <p className="text-sm text-gray-500 mt-1">Controle de materiais e produtos</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Novo Item
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome do produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        >
          <option value="all">Todas as categorias</option>
          {STOCK_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
          <PackagePlus className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">Nenhum item no estoque</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3 text-left font-medium text-gray-500">Produto</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Categoria</th>
                <th className="px-5 py-3 text-center font-medium text-gray-500">Quantidade</th>
                <th className="px-5 py-3 text-center font-medium text-gray-500">Mín.</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">Custo Un.</th>
                <th className="px-5 py-3 text-center font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => {
                const isLow = item.quantity <= item.minQuantity
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {isLow && <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />}
                        <button
                          onClick={() => setShowHistory(showHistory === item.id ? null : item.id)}
                          className="font-medium text-gray-900 hover:text-brand-gold text-left"
                        >
                          {item.name}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{item.category}</td>
                    <td className={`px-5 py-3 text-center font-semibold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-5 py-3 text-center text-gray-500">{item.minQuantity}</td>
                    <td className="px-5 py-3 text-right text-gray-500">{formatCurrency(item.costPrice)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setMovementModal({ item, type: 'in' })
                            setMoveQty(1)
                            setMoveReason('')
                          }}
                          title="Entrada"
                          className="rounded-lg p-1.5 text-green-500 hover:bg-green-50"
                        >
                          <ArrowDownCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setMovementModal({ item, type: 'out' })
                            setMoveQty(1)
                            setMoveReason('')
                          }}
                          title="Saída"
                          className="rounded-lg p-1.5 text-orange-500 hover:bg-orange-50"
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Movement History */}
      {showHistory && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Histórico: {stockItems.find((s) => s.id === showHistory)?.name}
            </h2>
            <button onClick={() => setShowHistory(null)} className="text-sm text-gray-400 hover:text-gray-600">
              Fechar
            </button>
          </div>
          <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
            {itemMovements.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-gray-400">Nenhuma movimentação</p>
            ) : (
              itemMovements.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    {m.type === 'in' ? (
                      <ArrowDownCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowUpCircle className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm text-gray-900">{m.reason}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(m.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${m.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.type === 'in' ? '+' : '-'}{m.quantity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Item Form Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Item' : 'Novo Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nome *</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Categoria</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              >
                <option value="">Selecione</option>
                {STOCK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Unidade</label>
              <select
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              >
                {STOCK_UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Quantidade</label>
              <input
                type="number"
                min={0}
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Qtd. Mínima</label>
              <input
                type="number"
                min={0}
                value={form.minQuantity}
                onChange={(e) => setForm((f) => ({ ...f, minQuantity: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Custo Un. (R$)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.costPrice || ''}
                onChange={(e) => setForm((f) => ({ ...f, costPrice: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="rounded-lg bg-brand-gold px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              {editing ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Movement Modal */}
      <Modal
        open={!!movementModal}
        onClose={() => setMovementModal(null)}
        title={movementModal?.type === 'in' ? 'Entrada no Estoque' : 'Saída do Estoque'}
      >
        <form onSubmit={handleMovement} className="space-y-4">
          <p className="text-sm text-gray-500">
            Produto: <strong className="text-gray-900">{movementModal?.item.name}</strong>
            <br />
            Estoque atual: <strong>{movementModal?.item.quantity} {movementModal?.item.unit}</strong>
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Quantidade *</label>
            <input
              required
              type="number"
              min={1}
              max={movementModal?.type === 'out' ? movementModal.item.quantity : undefined}
              value={moveQty}
              onChange={(e) => setMoveQty(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Motivo</label>
            <input
              type="text"
              value={moveReason}
              onChange={(e) => setMoveReason(e.target.value)}
              placeholder={movementModal?.type === 'in' ? 'Ex: Compra de reposição' : 'Ex: Uso em atendimento'}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setMovementModal(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="submit"
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                movementModal?.type === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {movementModal?.type === 'in' ? 'Registrar Entrada' : 'Registrar Saída'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir item"
        message="Tem certeza que deseja excluir este item do estoque?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
