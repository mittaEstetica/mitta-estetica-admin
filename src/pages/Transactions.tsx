import { useState, useMemo } from 'react'
import {
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { formatCurrency } from '../utils/storage'
import type { Transaction } from '../types'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const emptyForm = { type: 'entrada' as 'entrada' | 'saida', amount: '', description: '' }

export default function Transactions() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useData()

  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const [entradaForm, setEntradaForm] = useState({ ...emptyForm, type: 'entrada' as const })
  const [saidaForm, setSaidaForm] = useState({ ...emptyForm, type: 'saida' as const })
  const [editingItem, setEditingItem] = useState<Transaction | null>(null)
  const [editForm, setEditForm] = useState({ type: 'entrada' as 'entrada' | 'saida', amount: '', description: '' })
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [savingEntrada, setSavingEntrada] = useState(false)
  const [savingSaida, setSavingSaida] = useState(false)

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear((y) => y - 1) }
    else setSelectedMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear((y) => y + 1) }
    else setSelectedMonth((m) => m + 1)
  }

  const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`

  const filtered = useMemo(
    () => transactions.filter((t) => t.date.startsWith(monthStr)),
    [transactions, monthStr],
  )

  const entradas = useMemo(() => filtered.filter((t) => t.type === 'entrada').sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [filtered])
  const saidas = useMemo(() => filtered.filter((t) => t.type === 'saida').sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [filtered])

  const totalEntradas = useMemo(() => entradas.reduce((s, t) => s + t.amount, 0), [entradas])
  const totalSaidas = useMemo(() => saidas.reduce((s, t) => s + t.amount, 0), [saidas])
  const saldo = totalEntradas - totalSaidas

  const handleAddEntrada = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entradaForm.description || !entradaForm.amount) return
    setSavingEntrada(true)
    try {
      await addTransaction({
        type: 'entrada',
        amount: parseFloat(String(entradaForm.amount).replace(',', '.')),
        description: entradaForm.description,
        date: `${monthStr}-01`,
      })
      setEntradaForm({ ...emptyForm, type: 'entrada' })
    } finally {
      setSavingEntrada(false)
    }
  }

  const handleAddSaida = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!saidaForm.description || !saidaForm.amount) return
    setSavingSaida(true)
    try {
      await addTransaction({
        type: 'saida',
        amount: parseFloat(String(saidaForm.amount).replace(',', '.')),
        description: saidaForm.description,
        date: `${monthStr}-01`,
      })
      setSaidaForm({ ...emptyForm, type: 'saida' })
    } finally {
      setSavingSaida(false)
    }
  }

  const openEdit = (t: Transaction) => {
    setEditingItem(t)
    setEditForm({ type: t.type, amount: String(t.amount), description: t.description })
  }

  const handleEditSave = async () => {
    if (!editingItem) return
    await updateTransaction({
      ...editingItem,
      type: editForm.type,
      amount: parseFloat(String(editForm.amount).replace(',', '.')),
      description: editForm.description,
    })
    setEditingItem(null)
  }

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteTransaction(deleteTarget)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entrada e Saída</h1>
          <p className="text-sm text-gray-500 mt-1">Controle de fluxo de caixa mensal</p>
        </div>
        {/* Month navigator */}
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
          <button onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <span className="min-w-[140px] text-center text-sm font-semibold text-gray-800">
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </span>
          <button onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-green-100 bg-green-50 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-green-700">Total Entradas</span>
            <div className="rounded-full bg-green-100 p-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalEntradas)}</p>
          <p className="text-xs text-green-600 mt-1">{entradas.length} registro{entradas.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="rounded-xl border border-red-100 bg-red-50 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-red-700">Total Saídas</span>
            <div className="rounded-full bg-red-100 p-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-700">{formatCurrency(totalSaidas)}</p>
          <p className="text-xs text-red-600 mt-1">{saidas.length} registro{saidas.length !== 1 ? 's' : ''}</p>
        </div>

        <div className={`rounded-xl border p-5 ${saldo >= 0 ? 'border-brand-100 bg-brand-50' : 'border-orange-100 bg-orange-50'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-medium ${saldo >= 0 ? 'text-brand-700' : 'text-orange-700'}`}>
              {saldo >= 0 ? 'Sobra / Lucro' : 'Déficit'}
            </span>
            <div className={`rounded-full p-2 ${saldo >= 0 ? 'bg-brand-100' : 'bg-orange-100'}`}>
              <Wallet className={`h-4 w-4 ${saldo >= 0 ? 'text-brand-700' : 'text-orange-600'}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-brand-700' : 'text-orange-700'}`}>
            {formatCurrency(Math.abs(saldo))}
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
            {totalEntradas > 0 && (
              <div
                className={`h-full rounded-full transition-all ${saldo >= 0 ? 'bg-brand-gold' : 'bg-orange-400'}`}
                style={{ width: `${Math.min(100, (totalSaidas / totalEntradas) * 100)}%` }}
              />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {totalEntradas > 0 ? `${Math.round((totalSaidas / totalEntradas) * 100)}% das entradas em saídas` : 'Sem entradas este mês'}
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ENTRADAS */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-green-50 px-5 py-4">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h2 className="font-semibold text-green-800">Entradas</h2>
            <span className="ml-auto text-sm font-bold text-green-700">{formatCurrency(totalEntradas)}</span>
          </div>

          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {entradas.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">Nenhuma entrada neste mês</p>
            ) : (
              entradas.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group">
                  {editingItem?.id === t.id ? (
                    <div className="flex flex-1 gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.amount}
                        onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                        className="w-24 rounded border border-gray-200 px-2 py-1 text-sm"
                        placeholder="Valor"
                      />
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                        className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm"
                        placeholder="Descrição"
                      />
                      <button onClick={handleEditSave} className="rounded p-1 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingItem(null)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{t.description}</p>
                      </div>
                      <span className="text-sm font-bold text-green-600 flex-shrink-0">{formatCurrency(t.amount)}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(t)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(t.id)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Quick add entrada */}
          <form onSubmit={handleAddEntrada} className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3">
            <Plus className="h-4 w-4 text-green-500 flex-shrink-0" />
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="R$ 0,00"
              value={entradaForm.amount}
              onChange={(e) => setEntradaForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
            />
            <input
              type="text"
              required
              placeholder="Descrição..."
              value={entradaForm.description}
              onChange={(e) => setEntradaForm((f) => ({ ...f, description: e.target.value }))}
              className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
            />
            <button
              type="submit"
              disabled={savingEntrada}
              className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {savingEntrada ? '...' : 'Add'}
            </button>
          </form>
        </div>

        {/* SAÍDAS */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-red-50 px-5 py-4">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <h2 className="font-semibold text-red-800">Saídas</h2>
            <span className="ml-auto text-sm font-bold text-red-700">{formatCurrency(totalSaidas)}</span>
          </div>

          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {saidas.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">Nenhuma saída neste mês</p>
            ) : (
              saidas.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group">
                  {editingItem?.id === t.id ? (
                    <div className="flex flex-1 gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.amount}
                        onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                        className="w-24 rounded border border-gray-200 px-2 py-1 text-sm"
                        placeholder="Valor"
                      />
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                        className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm"
                        placeholder="Descrição"
                      />
                      <button onClick={handleEditSave} className="rounded p-1 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingItem(null)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{t.description}</p>
                      </div>
                      <span className="text-sm font-bold text-red-600 flex-shrink-0">{formatCurrency(t.amount)}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(t)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(t.id)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Quick add saída */}
          <form onSubmit={handleAddSaida} className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3">
            <Plus className="h-4 w-4 text-red-500 flex-shrink-0" />
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="R$ 0,00"
              value={saidaForm.amount}
              onChange={(e) => setSaidaForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
            />
            <input
              type="text"
              required
              placeholder="Descrição..."
              value={saidaForm.description}
              onChange={(e) => setSaidaForm((f) => ({ ...f, description: e.target.value }))}
              className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
            />
            <button
              type="submit"
              disabled={savingSaida}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {savingSaida ? '...' : 'Add'}
            </button>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir registro"
        message="Tem certeza que deseja excluir este registro?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
