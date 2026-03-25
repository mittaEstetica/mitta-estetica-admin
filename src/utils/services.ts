export const FACIAL_SERVICES = [
  'Limpeza de Pele',
  'Peeling Químico',
  'Microagulhamento',
  'Microcorrentes',
  'Radiofrequência Facial',
  'Massagem Craniana',
  'Drenagem Facial (Pós-operatória)',
  'Método Mitta',
] as const

export const CORPORAL_SERVICES = [
  'Ultrassom/US (Gordura e Celulite)',
  'Corrente Russa (Diástase, Tonificação, Metabolização)',
  'Terapia Combinada (US + Corrente Russa)',
  'Radiofrequência (Celulite e Flacidez)',
  'Criolipólise',
  'Massagem Relaxante',
  'Massagem Terapêutica',
  'Massagem com Pedras Quentes',
  'Massagem com Velas',
  'Drenagem Linfática',
  'Drenagem + Modeladora Local',
  'Método Mitta',
] as const

export type ServiceCategory = 'facial' | 'corporal'

export const SERVICE_CATEGORIES: Record<ServiceCategory, { label: string; services: readonly string[] }> = {
  facial: { label: 'Procedimento Facial', services: FACIAL_SERVICES },
  corporal: { label: 'Procedimento Corporal', services: CORPORAL_SERVICES },
}

export const SERVICE_LIST = [...FACIAL_SERVICES, ...CORPORAL_SERVICES] as const

export const STOCK_CATEGORIES = [
  'Cosméticos',
  'Descartáveis',
  'Equipamentos',
  'Óleos e Cremes',
  'Produtos Químicos',
  'Limpeza',
  'Outros',
] as const

export const STOCK_UNITS = [
  'unidade',
  'ml',
  'litro',
  'grama',
  'kg',
  'par',
  'caixa',
  'pacote',
] as const
