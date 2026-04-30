import { useState, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  Check,
  X,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { formatCurrency } from '../utils/storage'
import type { Transaction } from '../types'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const emptyForm = { type: 'entrada' as 'entrada' | 'saida', amount: '', description: '', paid: false }

export default function Transactions() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useData()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [entradaForm, setEntradaForm] = useState({ ...emptyForm, type: 'entrada' as const })
  const [saidaForm, setSaidaForm] = useState({ ...emptyForm, type: 'saida' as const })
  const [editingItem, setEditingItem] = useState<Transaction | null>(null)
  const [editForm, setEditForm] = useState({ type: 'entrada' as 'entrada' | 'saida', amount: '', description: '', paid: false })
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [savingEntrada, setSavingEntrada] = useState(false)
  const [savingSaida, setSavingSaida] = useState(false)

  const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(monthStr))
  }, [transactions, monthStr])

  const { entradas, saidas, totalEntradas, totalSaidas, saldo } = useMemo(() => {
    const e = currentMonthTransactions.filter((t) => t.type === 'entrada')
    const s = currentMonthTransactions.filter((t) => t.type === 'saida')
    const te = e.reduce((sum, t) => sum + Number(t.amount || 0), 0)
    const ts = s.reduce((sum, t) => sum + Number(t.amount || 0), 0)
    return {
      entradas: e,
      saidas: s,
      totalEntradas: te,
      totalSaidas: ts,
      saldo: te - ts,
    }
  }, [currentMonthTransactions])

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear((y) => y - 1)
    } else {
      setSelectedMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear((y) => y + 1)
    } else {
      setSelectedMonth((m) => m + 1)
    }
  }

  const handleAddEntrada = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingEntrada(true)
    try {
      await addTransaction({
        type: 'entrada',
        amount: parseFloat(String(entradaForm.amount).replace(',', '.')),
        description: entradaForm.description,
        date: `${monthStr}-01`,
        paid: true,
      })
      setEntradaForm({ ...emptyForm, type: 'entrada' })
    } finally {
      setSavingEntrada(false)
    }
  }

  const handleAddSaida = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSaida(true)
    try {
      await addTransaction({
        type: 'saida',
        amount: parseFloat(String(saidaForm.amount).replace(',', '.')),
        description: saidaForm.description,
        date: `${monthStr}-01`,
        paid: false,
      })
      setSaidaForm({ ...emptyForm, type: 'saida' })
    } finally {
      setSavingSaida(false)
    }
  }

  const openEdit = (t: Transaction) => {
    setEditingItem(t)
    setEditForm({ type: t.type, amount: String(t.amount), description: t.description, paid: !!t.paid })
  }

  const handleEditSave = async () => {
    if (!editingItem) return
    await updateTransaction({
      ...editingItem,
      type: editForm.type,
      amount: parseFloat(String(editForm.amount).replace(',', '.')),
      description: editForm.description,
      paid: editForm.paid,
    })
    setEditingItem(null)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Fluxo de Caixa</h1>
          <p className="text-gray-500 font-medium">Controle detalhado de entradas e saídas mensais.</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm">
          <button onClick={handlePrevMonth} className="rounded-xl p-2 hover:bg-gray-100 transition-colors">
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2 px-4 min-w-[160px] justify-center">
            <Calendar className="h-4 w-4 text-brand-gold" />
            <span className="font-black text-gray-900 uppercase tracking-wider text-sm">
              {MONTHS[selectedMonth]} {selectedYear}
            </span>
          </div>
          <button onClick={handleNextMonth} className="rounded-xl p-2 hover:bg-gray-100 transition-colors">
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Entradas</span>
            <div className="p-2 bg-green-50 rounded-lg"><ArrowUpRight className="h-4 w-4 text-green-600" /></div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-green-600">{formatCurrency(totalEntradas)}</span>
            <span className="text-xs text-gray-400 font-medium italic">Faturamento do período</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Saídas</span>
            <div className="p-2 bg-red-50 rounded-lg"><ArrowDownRight className="h-4 w-4 text-red-600" /></div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-red-600">{formatCurrency(totalSaidas)}</span>
            <span className="text-xs text-gray-400 font-medium italic">Custos e despesas totais</span>
          </div>
        </div>
        <div className={`p-6 rounded-2xl border shadow-sm space-y-4 transition-colors ${saldo >= 0 ? 'bg-brand-600 border-brand-500' : 'bg-red-500 border-red-400'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-white/60 uppercase tracking-widest">Saldo Líquido</span>
            <div className="p-2 bg-white/10 rounded-lg"><DollarSign className="h-4 w-4 text-white" /></div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-white">{formatCurrency(saldo)}</span>
            <span className="text-xs text-white/50 font-medium italic">Resultado final do mês</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* ENTRADAS */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="flex items-center gap-3 border-b border-gray-100 bg-green-50/30 px-6 py-5">
              <div className="p-2 bg-green-100 rounded-xl"><TrendingUp className="h-5 w-5 text-green-600" /></div>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Entradas</h2>
            </div>

            <div className="divide-y divide-gray-50 flex-1 overflow-y-auto max-h-[400px]">
              {entradas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center space-y-2">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center"><ArrowUpRight className="h-8 w-8 text-gray-200" /></div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Sem entradas</p>
                </div>
              ) : (
                entradas.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 md:gap-4 px-4 md:px-6 py-4 hover:bg-gray-50 group transition-all">
                    {editingItem?.id === t.id ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.amount}
                          onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                          className="w-24 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold"
                        />
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold"
                        />
                        <button onClick={handleEditSave} className="p-2 bg-green-500 text-white rounded-xl shadow-sm"><Check className="h-4 w-4" /></button>
                        <button onClick={() => setEditingItem(null)} className="p-2 bg-gray-100 text-gray-500 rounded-xl"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-900 truncate uppercase tracking-tight">{t.description}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.date.split('-').reverse().join('/')}</p>
                        </div>
                        <span className="text-sm font-black text-green-600 bg-green-50 px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0">{formatCurrency(t.amount)}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90">
                          <button onClick={() => openEdit(t)} className="p-2 text-gray-400 hover:bg-brand-50 hover:text-brand-600 rounded-lg">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(t.id)} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddEntrada} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-gray-50/50 px-4 md:px-6 py-5 border-t border-gray-100">
              <input
                type="number"
                step="0.01"
                required
                placeholder="R$ 0,00"
                value={entradaForm.amount}
                onChange={(e) => setEntradaForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full sm:w-28 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-black focus:border-green-400 focus:ring-1 focus:ring-green-400"
              />
              <input
                type="text"
                required
                placeholder="Descrição da entrada..."
                value={entradaForm.description}
                onChange={(e) => setEntradaForm((f) => ({ ...f, description: e.target.value }))}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold focus:border-green-400 focus:ring-1 focus:ring-green-400"
              />
              <button
                type="submit"
                disabled={savingEntrada}
                className="bg-green-600 text-white p-2.5 rounded-xl hover:bg-green-700 shadow-md shadow-green-100 transition-all active:scale-95"
              >
                <Plus className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>

        {/* SAÍDAS */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="flex items-center gap-3 border-b border-gray-100 bg-red-50/30 px-6 py-5">
              <div className="p-2 bg-red-100 rounded-xl"><TrendingDown className="h-5 w-5 text-red-600" /></div>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Saídas</h2>
            </div>

            <div className="divide-y divide-gray-50 flex-1 overflow-y-auto max-h-[400px]">
              {saidas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center space-y-2">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center"><ArrowDownRight className="h-8 w-8 text-gray-200" /></div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Sem saídas</p>
                </div>
              ) : (
                saidas.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 md:gap-4 px-4 md:px-6 py-4 hover:bg-gray-50 group transition-all">
                    {editingItem?.id === t.id ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.amount}
                          onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                          className="w-24 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold"
                        />
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold"
                        />
                        <div className="flex items-center gap-2 px-2 bg-gray-50 rounded-xl">
                          <input type="checkbox" checked={editForm.paid} onChange={e => setEditForm(f => ({ ...f, paid: e.target.checked }))} className="h-4 w-4 text-brand-gold" />
                          <span className="text-[10px] font-black text-gray-400 uppercase">Pago</span>
                        </div>
                        <button onClick={handleEditSave} className="p-2 bg-green-500 text-white rounded-xl shadow-sm"><Check className="h-4 w-4" /></button>
                        <button onClick={() => setEditingItem(null)} className="p-2 bg-gray-100 text-gray-500 rounded-xl"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-gray-900 truncate uppercase tracking-tight">{t.description}</p>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${t.paid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              {t.paid ? 'Pago' : 'Projeção'}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.date.split('-').reverse().join('/')}</p>
                        </div>
                        <span className={`text-sm font-black px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${t.paid ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{formatCurrency(t.amount)}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90">
                          <button onClick={() => openEdit(t)} className="p-2 text-gray-400 hover:bg-brand-50 hover:text-brand-600 rounded-lg">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(t.id)} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddSaida} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-gray-50/50 px-4 md:px-6 py-5 border-t border-gray-100">
              <input
                type="number"
                step="0.01"
                required
                placeholder="R$ 0,00"
                value={saidaForm.amount}
                onChange={(e) => setSaidaForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full sm:w-28 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-black focus:border-red-400 focus:ring-1 focus:ring-red-400"
              />
              <input
                type="text"
                required
                placeholder="Descrição da despesa..."
                value={saidaForm.description}
                onChange={(e) => setSaidaForm((f) => ({ ...f, description: e.target.value }))}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold focus:border-red-400 focus:ring-1 focus:ring-red-400"
              />
              <button
                type="submit"
                disabled={savingSaida}
                className="bg-red-600 text-white p-2.5 rounded-xl hover:bg-red-700 shadow-md shadow-red-100 transition-all active:scale-95"
              >
                <Plus className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL DE EXCLUSÃO */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900">Confirmar Exclusão</h3>
              <p className="text-gray-500 text-sm font-medium">Esta ação não pode ser desfeita. Deseja realmente remover este registro?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors">Cancelar</button>
              <button 
                onClick={async () => {
                  await deleteTransaction(deleteTarget)
                  setDeleteTarget(null)
                }} 
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-200 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
