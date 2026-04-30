import { useEffect, useState, useMemo, useRef } from 'react'
import { 
  DollarSign, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  X,
  Loader2,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { formatCurrency } from '../utils/storage'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const MONTH_NAMES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
]

const emptyForm = {
  type: 'saida' as 'entrada' | 'saida',
  description: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  paid: true,
  receiptUrl: ''
}

export default function CashFlow() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useData()
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Quick Add State
  const [quickAddEntrada, setQuickAddEntrada] = useState({ amount: '', description: '', paid: true })
  const [quickAddSaida, setQuickAddSaida] = useState({ amount: '', description: '', paid: true })

  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00')
      return d.getFullYear() === currentDate.year && d.getMonth() === currentDate.month
    })
  }, [transactions, currentDate])

  const stats = useMemo(() => {
    const incomes = monthTransactions.filter(t => t.type === 'entrada').reduce((sum, t) => sum + Number(t.amount || 0), 0)
    const expenses = monthTransactions.filter(t => t.type === 'saida').reduce((sum, t) => sum + Number(t.amount || 0), 0)
    return {
      incomes,
      expenses,
      balance: incomes - expenses
    }
  }, [monthTransactions])

  const incomes = useMemo(() => 
    monthTransactions.filter(t => t.type === 'entrada').sort((a, b) => b.date.localeCompare(a.date)),
    [monthTransactions]
  )
  const expenses = useMemo(() => 
    monthTransactions.filter(t => t.type === 'saida').sort((a, b) => b.date.localeCompare(a.date)),
    [monthTransactions]
  )

  const prevMonth = () => {
    setCurrentDate(prev => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 })
  }
  const nextMonth = () => {
    setCurrentDate(prev => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 })
  }

  const handleOpenAdd = (type: 'entrada' | 'saida') => {
    setEditingItem(null)
    setForm({ ...emptyForm, type, date: `${currentDate.year}-${String(currentDate.month + 1).padStart(2, '0')}-01` })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (t: any) => {
    setEditingItem(t)
    setForm({
      type: t.type,
      description: t.description,
      amount: String(t.amount).replace('.', ','),
      date: t.date,
      paid: !!t.paid,
      receiptUrl: t.receiptUrl || ''
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanAmount = form.amount.replace(/[^\d,.-]/g, '').replace(',', '.')
    const data = {
      type: form.type,
      description: form.description,
      amount: parseFloat(cleanAmount) || 0,
      date: form.date,
      paid: form.paid,
      receiptUrl: form.receiptUrl
    }

    try {
      if (editingItem) {
        await updateTransaction({ ...editingItem, ...data })
      } else {
        await addTransaction(data)
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error saving transaction:', err)
      alert('Erro ao salvar lançamento. Verifique os dados.')
    }
  }

  const handleQuickAdd = async (type: 'entrada' | 'saida') => {
    const source = type === 'entrada' ? quickAddEntrada : quickAddSaida
    if (!source.amount || !source.description) return

    const cleanAmount = source.amount.replace(/[^\d,.-]/g, '').replace(',', '.')
    const data = {
      type,
      description: source.description,
      amount: parseFloat(cleanAmount) || 0,
      date: `${currentDate.year}-${String(currentDate.month + 1).padStart(2, '0')}-01`,
      paid: source.paid,
      receiptUrl: ''
    }

    try {
      await addTransaction(data)
      if (type === 'entrada') setQuickAddEntrada({ amount: '', description: '', paid: true })
      else setQuickAddSaida({ amount: '', description: '', paid: true })
    } catch (err) {
      console.error('Quick add error:', err)
      alert('Erro ao realizar lançamento rápido.')
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, receiptUrl: reader.result as string }))
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const formatDateBR = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
      {/* Header with Month Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Fluxo de Caixa</h1>
          <p className="text-gray-500 mt-1 font-medium italic">Controle detalhado de entradas e saídas mensais.</p>
        </div>

        <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-1 shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <ChevronLeft className="h-5 w-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-2 px-4">
            <Calendar className="h-4 w-4 text-brand-gold" />
            <span className="text-sm font-black text-gray-900 tracking-widest uppercase">
              {MONTH_NAMES[currentDate.month]} {currentDate.year}
            </span>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-8 right-8 bg-green-50 p-2.5 rounded-xl">
            <ArrowUpRight className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Entradas</p>
          <h2 className="text-3xl font-black text-green-600 tracking-tight">{formatCurrency(stats.incomes)}</h2>
          <p className="text-xs text-gray-400 mt-2 font-medium italic">Faturamento do período</p>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-8 right-8 bg-red-50 p-2.5 rounded-xl">
            <ArrowDownRight className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Saídas</p>
          <h2 className="text-3xl font-black text-red-600 tracking-tight">{formatCurrency(stats.expenses)}</h2>
          <p className="text-xs text-gray-400 mt-2 font-medium italic">Custos e despesas totais</p>
        </div>

        <div className="bg-brand-gold rounded-[2rem] p-8 shadow-xl shadow-brand-100 relative overflow-hidden group border border-brand-600">
          <div className="absolute top-8 right-8 bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/30">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mb-4">Saldo Líquido</p>
          <h2 className="text-3xl font-black text-white tracking-tight">{formatCurrency(stats.balance)}</h2>
          <p className="text-xs text-white/60 mt-2 font-medium italic">Resultado final do mês</p>
        </div>
      </div>

      {/* Main Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Entradas Column */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
          <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2.5 rounded-2xl">
                <ArrowUpRight className="h-5 w-5 text-green-500" />
              </div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Entradas</h3>
            </div>
            <button onClick={() => handleOpenAdd('entrada')} className="p-2 hover:bg-gray-50 rounded-xl text-brand-gold transition-colors">
              <Plus className="h-6 w-6" />
            </button>
          </div>

          <div className="p-4 space-y-2">
            <div className="max-h-[600px] overflow-y-auto space-y-2 pr-1">
              {incomes.length === 0 ? (
                <p className="text-center py-20 text-gray-400 text-sm italic font-medium">Nenhuma entrada registrada.</p>
              ) : (
                incomes.map(t => (
                  <div key={t.id} onClick={() => handleOpenEdit(t)} className="flex items-center justify-between p-5 hover:bg-gray-50 rounded-3xl transition-all group cursor-pointer border border-transparent hover:border-gray-100">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{t.description}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatDateBR(t.date)}</p>
                    </div>
                    <span className="text-base font-black text-green-600 whitespace-nowrap flex-shrink-0">{formatCurrency(t.amount)}</span>
                  </div>
                ))
              )}
            </div>

            {/* Quick Add Entrada */}
            <div className="mt-4 flex flex-col gap-3 p-3 md:p-4 bg-gray-50 rounded-3xl border border-gray-100 shadow-inner">
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  placeholder="R$ 0,00" 
                  value={quickAddEntrada.amount}
                  onChange={e => setQuickAddEntrada(p => ({ ...p, amount: e.target.value }))}
                  className="w-full sm:w-24 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-black outline-none focus:border-brand-gold shadow-sm"
                />
                <input 
                  type="text" 
                  placeholder="Descrição da entrada..." 
                  value={quickAddEntrada.description}
                  onChange={e => setQuickAddEntrada(p => ({ ...p, description: e.target.value }))}
                  className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:border-brand-gold shadow-sm"
                />
              </div>
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="qa_e_paid"
                    checked={quickAddEntrada.paid}
                    onChange={e => setQuickAddEntrada(p => ({ ...p, paid: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-brand-gold focus:ring-brand-gold"
                  />
                  <label htmlFor="qa_e_paid" className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer">Recebido</label>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setQuickAddEntrada({ amount: '', description: '', paid: true })} className="p-2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                  <button 
                    onClick={() => handleQuickAdd('entrada')}
                    className="bg-green-500 text-white p-2 rounded-2xl hover:bg-green-600 transition-all shadow-md active:scale-95"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Saídas Column */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
          <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-2.5 rounded-2xl">
                <ArrowDownRight className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Saídas</h3>
            </div>
            <button onClick={() => handleOpenAdd('saida')} className="p-2 hover:bg-gray-50 rounded-xl text-brand-gold transition-colors">
              <Plus className="h-6 w-6" />
            </button>
          </div>

          <div className="p-4 space-y-2">
            <div className="max-h-[600px] overflow-y-auto space-y-2 pr-1">
              {expenses.length === 0 ? (
                <p className="text-center py-20 text-gray-400 text-sm italic font-medium">Nenhuma saída registrada.</p>
              ) : (
                expenses.map(t => (
                  <div key={t.id} onClick={() => handleOpenEdit(t)} className="flex items-center justify-between p-5 hover:bg-gray-50 rounded-3xl transition-all group cursor-pointer border border-transparent hover:border-gray-100">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{t.description}</p>
                        {t.paid ? (
                          <span className="bg-green-50 text-green-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border border-green-100">
                            Pago
                          </span>
                        ) : (
                          <span className="bg-orange-50 text-orange-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border border-orange-100">
                            Projeção
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatDateBR(t.date)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-base font-black text-red-600 whitespace-nowrap">{formatCurrency(t.amount)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Add Saída */}
            <div className="mt-4 flex flex-col gap-3 p-3 md:p-4 bg-gray-50 rounded-3xl border border-gray-100 shadow-inner">
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  placeholder="R$ 0,00" 
                  value={quickAddSaida.amount}
                  onChange={e => setQuickAddSaida(p => ({ ...p, amount: e.target.value }))}
                  className="w-full sm:w-24 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-black outline-none focus:border-brand-gold shadow-sm"
                />
                <input 
                  type="text" 
                  placeholder="Descrição da saída..." 
                  value={quickAddSaida.description}
                  onChange={e => setQuickAddSaida(p => ({ ...p, description: e.target.value }))}
                  className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:border-brand-gold shadow-sm"
                />
              </div>
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="qa_s_paid"
                    checked={quickAddSaida.paid}
                    onChange={e => setQuickAddSaida(p => ({ ...p, paid: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-brand-gold focus:ring-brand-gold"
                  />
                  <label htmlFor="qa_s_paid" className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer">Pago</label>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setQuickAddSaida({ amount: '', description: '', paid: true })} className="p-2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                  <button 
                    onClick={() => handleQuickAdd('saida')}
                    className="bg-red-500 text-white p-2 rounded-2xl hover:bg-red-600 transition-all shadow-md active:scale-95"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">
                {editingItem ? 'Editar Lançamento' : `Novo Lançamento (${form.type})`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Descrição</label>
                <input
                  type="text"
                  required
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-900 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all outline-none"
                  placeholder="Ex: Aluguel"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Valor (R$)</label>
                  <input
                    type="text"
                    required
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-black text-gray-900 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all outline-none"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Data</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-900 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <input
                  type="checkbox"
                  id="is_paid"
                  checked={form.paid}
                  onChange={e => setForm(f => ({ ...f, paid: e.target.checked }))}
                  className="h-5 w-5 rounded-lg border-gray-300 text-brand-gold focus:ring-brand-gold cursor-pointer"
                />
                <label htmlFor="is_paid" className="text-[10px] font-black text-gray-700 uppercase tracking-[0.1em] cursor-pointer">
                  Marcar como pago
                </label>
              </div>

              {form.paid && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Arquivo / Comprovante</label>
                  <div className="flex items-center gap-4">
                    {form.receiptUrl ? (
                      <div className="relative group">
                        <img src={form.receiptUrl} alt="Comprovante" className="h-20 w-20 object-cover rounded-2xl border border-gray-200 shadow-sm" />
                        <button 
                          type="button"
                          onClick={() => setForm(f => ({ ...f, receiptUrl: '' }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg border-2 border-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full h-20 border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-brand-gold hover:text-brand-gold hover:bg-brand-50/50 transition-all group"
                      >
                        {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6 group-hover:-translate-y-1 transition-transform" />}
                        <span className="text-[9px] font-black uppercase tracking-[0.1em]">Anexar Arquivo</span>
                      </button>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,application/pdf" className="hidden" />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4">
                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-brand-900 text-white font-black rounded-2xl hover:bg-brand-800 transition-all shadow-lg shadow-brand-100 uppercase text-xs tracking-[0.2em]"
                >
                  Confirmar Lançamento
                </button>
                {editingItem && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTarget(editingItem.id)
                      setIsModalOpen(false)
                    }}
                    className="w-full px-6 py-4 bg-white text-red-500 font-black rounded-2xl hover:bg-red-50 border border-red-100 transition-all uppercase text-xs tracking-[0.2em]"
                  >
                    Excluir Registro
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir Registro"
        message="Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita."
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteTransaction(deleteTarget)
            setDeleteTarget(null)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {viewingReceipt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setViewingReceipt(null)}>
          <div className="relative max-w-4xl w-full max-h-full flex items-center justify-center animate-in zoom-in duration-300">
            <button onClick={() => setViewingReceipt(null)} className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-full transition-colors">
              <X className="h-8 w-8" />
            </button>
            <img src={viewingReceipt} alt="Comprovante" className="max-w-full max-h-[85vh] object-contain rounded-3xl shadow-2xl" onClick={e => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  )
}
