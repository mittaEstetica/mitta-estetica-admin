import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  MessageCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Send,
  Clock,
  Bell,
  Save,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Phone,
} from 'lucide-react'
import { api } from '../services/api'
import { useData } from '../contexts/DataContext'
import { toISODate } from '../utils/storage'
import SearchableSelect from '../components/ui/SearchableSelect'

type Status = { status: string; qr: string | null; phone: string | null }
type Settings = { messageTemplate: string; cronHour: string }
type Preview = {
  date: string
  reminders: { appointmentId: string; patientName: string; patientPhone: string; service: string; date: string; time: string }[]
  skipped: { appointmentId: string; patientName: string; reason: string }[]
  total: number
}
type SendResult = {
  date: string
  results: { patient: string; phone: string; status: string; error?: string }[]
  sent: number
  failed: number
}

const DEFAULT_TEMPLATE = `Oii, {nome}, tudo bem?\nPodemos confirmar seu horário de atendimento, amanhã às {horario}?\n\nTemos tolerância de 10 minutos para atrasos. Caso não possa comparecer, pedimos que nos avise com antecedência para reagendarmos.\n\nNosso endereço: Rua Açores, nº 68, sala 305.`

export default function WhatsAppConfig() {
  const { patients, appointments } = useData()
  const [waStatus, setWaStatus] = useState<Status>({ status: 'disconnected', qr: null, phone: null })
  const [settings, setSettings] = useState<Settings>({ messageTemplate: '', cronHour: '8' })
  const [preview, setPreview] = useState<Preview | null>(null)
  const [sendResult, setSendResult] = useState<SendResult | null>(null)
  const [loading, setLoading] = useState({ status: true, settings: true, preview: false, sending: false, saving: false, test: false })
  const [testPhone, setTestPhone] = useState('')
  const [testMsg, setTestMsg] = useState('')
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string } | null>(null)

  const tomorrowStr = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return toISODate(d)
  }, [])

  const phoneOptions = useMemo(
    () =>
      patients
        .filter((p) => p.phone?.trim())
        .map((p) => ({
          value: p.phone,
          label: p.name,
          subtitle: p.phone,
        })),
    [patients],
  )

  const buildTestMessage = useCallback(
    (phone: string) => {
      const patient = patients.find((p) => p.phone === phone)
      if (!patient) return ''

      const appt = appointments.find(
        (a) => a.patientId === patient.id && a.status === 'scheduled' && a.date >= tomorrowStr,
      )

      const nome = patient.name.split(' ')[0]
      const horario = appt?.time || '(horário)'

      return `Oii, ${nome}, tudo bem?\nPodemos confirmar seu horário de atendimento, amanhã às ${horario}?\n\nTemos tolerância de 10 minutos para atrasos. Caso não possa comparecer, pedimos que nos avise com antecedência para reagendarmos.\n\nNosso endereço: Rua Açores, nº 68, sala 305.`
    },
    [patients, appointments, tomorrowStr],
  )

  const handleSelectPhone = useCallback(
    (phone: string) => {
      setTestPhone(phone)
      if (phone) {
        const msg = buildTestMessage(phone)
        if (msg) setTestMsg(msg)
      }
    },
    [buildTestMessage],
  )

  const fetchStatus = useCallback(async () => {
    try {
      const s = await api.whatsapp.status()
      setWaStatus(s)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchStatus().then(() => setLoading((l) => ({ ...l, status: false })))
    api.whatsapp.getSettings()
      .then((s) => setSettings(s))
      .finally(() => setLoading((l) => ({ ...l, settings: false })))
  }, [fetchStatus])

  useEffect(() => {
    if (waStatus.status === 'connecting') {
      const interval = setInterval(fetchStatus, 3000)
      return () => clearInterval(interval)
    }
  }, [waStatus.status, fetchStatus])

  const handleDisconnect = async () => {
    await api.whatsapp.disconnect()
    fetchStatus()
  }

  const handleSaveSettings = async () => {
    setLoading((l) => ({ ...l, saving: true }))
    await api.whatsapp.updateSettings(settings)
    setLoading((l) => ({ ...l, saving: false }))
  }

  const handlePreview = async () => {
    setLoading((l) => ({ ...l, preview: true }))
    setSendResult(null)
    try {
      const p = await api.whatsapp.previewReminders()
      setPreview(p)
    } catch { /* ignore */ }
    setLoading((l) => ({ ...l, preview: false }))
  }

  const handleSendReminders = async () => {
    setLoading((l) => ({ ...l, sending: true }))
    try {
      const r = await api.whatsapp.sendReminders(settings.messageTemplate || undefined)
      setSendResult(r)
    } catch { /* ignore */ }
    setLoading((l) => ({ ...l, sending: false }))
  }

  const handleTestSend = async () => {
    if (!testPhone) return
    setLoading((l) => ({ ...l, test: true }))
    setTestResult(null)
    try {
      await api.whatsapp.sendTest(testPhone, testMsg || DEFAULT_TEMPLATE)
      setTestResult({ success: true })
    } catch (err) {
      setTestResult({ error: err instanceof Error ? err.message : 'Erro ao enviar' })
    }
    setLoading((l) => ({ ...l, test: false }))
  }

  const statusConfig = {
    connected: { color: 'bg-green-100 text-green-700', icon: Wifi, label: 'Conectado' },
    connecting: { color: 'bg-amber-100 text-amber-700', icon: RefreshCw, label: 'Aguardando conexão...' },
    disconnected: { color: 'bg-gray-100 text-gray-500', icon: WifiOff, label: 'Desconectado' },
  }
  const sc = statusConfig[waStatus.status as keyof typeof statusConfig] || statusConfig.disconnected

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp</h1>
        <p className="text-sm text-gray-500 mt-1">Lembretes automáticos de agendamento</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conexão */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <h2 className="font-semibold text-gray-900">Conexão</h2>
            <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.color}`}>
              {sc.label}
            </span>
          </div>
          <div className="p-5">
            {waStatus.status === 'connected' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-100 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-800">WhatsApp conectado</p>
                    <p className="text-xs text-green-600">{waStatus.phone}</p>
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Desconectar
                </button>
              </div>
            ) : waStatus.status === 'connecting' && waStatus.qr ? (
              <div className="space-y-3 text-center">
                <p className="text-sm text-gray-600">Escaneie o QR Code com o WhatsApp:</p>
                <div className="inline-block rounded-xl border-2 border-gray-200 p-2 bg-white">
                  <img src={waStatus.qr} alt="QR Code" className="h-64 w-64" />
                </div>
                <p className="text-xs text-gray-400">
                  Abra o WhatsApp → Menu (⋮) → Aparelhos conectados → Conectar aparelho
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <WifiOff className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">WhatsApp não conectado</p>
                <p className="text-xs text-gray-400 mt-1">Aguardando o QR Code aparecer...</p>
                <button
                  onClick={fetchStatus}
                  className="mt-4 inline-flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Atualizar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Teste de envio */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <Send className="h-5 w-5 text-brand-gold" />
            <h2 className="font-semibold text-gray-900">Teste de Envio</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Paciente / Telefone</label>
              <SearchableSelect
                options={phoneOptions}
                value={testPhone}
                onChange={handleSelectPhone}
                placeholder="Buscar paciente..."
                emptyLabel="Digitar número manualmente"
              />
              {testPhone && !phoneOptions.find((o) => o.value === testPhone) && (
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="(51) 92729-544"
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mensagem</label>
              <textarea
                rows={6}
                value={testMsg}
                onChange={(e) => setTestMsg(e.target.value)}
                placeholder="Selecione um paciente para gerar a mensagem automaticamente"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            <button
              onClick={handleTestSend}
              disabled={loading.test || waStatus.status !== 'connected' || !testPhone}
              className="w-full rounded-lg bg-brand-gold px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.test ? 'Enviando...' : 'Enviar Teste'}
            </button>
            {testResult && (
              <div className={`rounded-lg p-3 text-sm ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {testResult.success ? '✓ Mensagem enviada com sucesso!' : `✗ ${testResult.error}`}
              </div>
            )}
            {waStatus.status !== 'connected' && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Conecte o WhatsApp primeiro
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Template de Mensagem */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
          <Bell className="h-5 w-5 text-brand-gold" />
          <h2 className="font-semibold text-gray-900">Configuração de Lembretes</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mensagem do Lembrete</label>
            <textarea
              rows={6}
              value={settings.messageTemplate}
              onChange={(e) => setSettings((s) => ({ ...s, messageTemplate: e.target.value }))}
              placeholder={DEFAULT_TEMPLATE}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['{nome}', '{nome_completo}', '{data}', '{horario}', '{servico}'].map((tag) => (
                <span key={tag} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{tag}</span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">Use as variáveis acima para personalizar a mensagem.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                <Clock className="inline h-3.5 w-3.5 mr-1" />
                Horário do Envio Automático
              </label>
              <select
                value={settings.cronHour}
                onChange={(e) => setSettings((s) => ({ ...s, cronHour: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              >
                {Array.from({ length: 16 }, (_, i) => i + 6).map((h) => (
                  <option key={h} value={String(h)}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">O lembrete é enviado automaticamente no dia anterior ao agendamento.</p>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSaveSettings}
                disabled={loading.saving}
                className="w-full rounded-lg bg-brand-gold px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" /> {loading.saving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview dos lembretes de amanhã */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-brand-gold" />
            <h2 className="font-semibold text-gray-900">Lembretes de Amanhã</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePreview}
              disabled={loading.preview}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <Eye className="h-3.5 w-3.5" /> {loading.preview ? 'Carregando...' : 'Visualizar'}
            </button>
            <button
              onClick={handleSendReminders}
              disabled={loading.sending || waStatus.status !== 'connected'}
              className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5" /> {loading.sending ? 'Enviando...' : 'Enviar Agora'}
            </button>
          </div>
        </div>
        <div className="p-5">
          {!preview && !sendResult && (
            <p className="text-sm text-gray-400 text-center py-4">
              Clique em "Visualizar" para ver os lembretes pendentes de amanhã.
            </p>
          )}

          {preview && !sendResult && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Agendamentos para <span className="font-semibold text-gray-900">{new Date(preview.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>: {preview.total} total
              </p>
              {preview.reminders.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-green-700 mb-2">Receberão lembrete ({preview.reminders.length}):</p>
                  <div className="divide-y divide-gray-50 rounded-lg border border-gray-100">
                    {preview.reminders.map((r) => (
                      <div key={r.appointmentId} className="flex items-center justify-between px-4 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{r.patientName}</p>
                          <p className="text-xs text-gray-500">{r.service} · {r.time}</p>
                        </div>
                        <span className="text-xs text-gray-400">{r.patientPhone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {preview.skipped.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-600 mb-2">Sem telefone ({preview.skipped.length}):</p>
                  <div className="divide-y divide-gray-50 rounded-lg border border-amber-100 bg-amber-50/30">
                    {preview.skipped.map((s) => (
                      <div key={s.appointmentId} className="flex items-center justify-between px-4 py-2.5">
                        <p className="text-sm text-amber-800">{s.patientName}</p>
                        <span className="text-xs text-amber-600">{s.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {sendResult && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg bg-green-50 p-3 text-center">
                  <CheckCircle className="mx-auto h-5 w-5 text-green-600" />
                  <p className="text-lg font-bold text-green-700 mt-1">{sendResult.sent}</p>
                  <p className="text-xs text-green-600">Enviado(s)</p>
                </div>
                {sendResult.failed > 0 && (
                  <div className="flex-1 rounded-lg bg-red-50 p-3 text-center">
                    <XCircle className="mx-auto h-5 w-5 text-red-600" />
                    <p className="text-lg font-bold text-red-700 mt-1">{sendResult.failed}</p>
                    <p className="text-xs text-red-600">Falha(s)</p>
                  </div>
                )}
              </div>
              <div className="divide-y divide-gray-50 rounded-lg border border-gray-100">
                {sendResult.results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.patient}</p>
                      <p className="text-xs text-gray-500">{r.phone}</p>
                    </div>
                    {r.status === 'sent' ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Enviado</span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700" title={r.error}>Falhou</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
