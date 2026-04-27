import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react'
import type { Patient, Package, StockItem, StockMovement, Appointment, Collaborator, Commission, Transaction } from '../types'
import { api } from '../services/api'
import { useAuth } from './AuthContext'

interface DataContextType {
  patients: Patient[]
  packages: Package[]
  stockItems: StockItem[]
  stockMovements: StockMovement[]
  appointments: Appointment[]
  collaborators: Collaborator[]
  commissions: Commission[]
  loading: boolean

  addPatient: (p: Omit<Patient, 'id' | 'createdAt'>) => Promise<Patient>
  updatePatient: (p: Patient) => Promise<void>
  deletePatient: (id: string) => Promise<void>

  addCollaborator: (c: Omit<Collaborator, 'id' | 'createdAt'>) => Promise<Collaborator>
  updateCollaborator: (c: Collaborator) => Promise<void>
  deleteCollaborator: (id: string) => Promise<void>

  addPackage: (p: Omit<Package, 'id' | 'createdAt'>) => Promise<Package>
  updatePackage: (p: Package) => Promise<void>
  deletePackage: (id: string) => Promise<void>

  addStockItem: (s: Omit<StockItem, 'id' | 'createdAt'>) => Promise<StockItem>
  updateStockItem: (s: StockItem) => Promise<void>
  deleteStockItem: (id: string) => Promise<void>
  addStockMovement: (m: Omit<StockMovement, 'id' | 'createdAt'>) => Promise<void>

  addAppointment: (a: Omit<Appointment, 'id' | 'createdAt'>) => Promise<Appointment>
  updateAppointment: (a: Appointment) => Promise<void>
  deleteAppointment: (id: string) => Promise<void>
  completeAppointment: (id: string) => Promise<void>
  markMissed: (id: string) => Promise<void>

  refreshCommissions: () => Promise<void>

  transactions: Transaction[]
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>
  updateTransaction: (t: Transaction) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
}

const DataContext = createContext<DataContextType | null>(null)

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, isCollaborator } = useAuth()

  const [allPatients, setAllPatients] = useState<Patient[]>([])
  const [allPackages, setAllPackages] = useState<Package[]>([])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.patients.list(),
      api.packages.list(),
      api.stockItems.list(),
      api.stockMovements.list(),
      api.appointments.list(),
      api.collaborators.list(),
      api.commissions.list(),
      api.transactions.list(),
    ]).then(([p, pkg, si, sm, a, c, com, tr]) => {
      setAllPatients(p)
      setAllPackages(pkg)
      setStockItems(si)
      setStockMovements(sm)
      setAllAppointments(a)
      setCollaborators(c)
      setCommissions(com)
      setTransactions(tr)
    }).finally(() => setLoading(false))
  }, [])

  // Filter data for collaborator: only their assigned patients and appointments
  const packages = useMemo(() => {
    if (!isCollaborator || !user?.collaboratorId) return allPackages
    return allPackages.filter((p) => p.collaboratorId === user.collaboratorId)
  }, [allPackages, isCollaborator, user?.collaboratorId])

  const patients = useMemo(() => {
    if (!isCollaborator || !user?.collaboratorId) return allPatients
    const myPatientIds = new Set(packages.map((p) => p.patientId))
    return allPatients.filter((p) => myPatientIds.has(p.id))
  }, [allPatients, packages, isCollaborator, user?.collaboratorId])

  const appointments = useMemo(() => {
    if (!isCollaborator || !user?.collaboratorId) return allAppointments
    const myPatientIds = new Set(patients.map((p) => p.id))
    return allAppointments.filter(
      (a) => myPatientIds.has(a.patientId) || a.collaboratorId === user.collaboratorId,
    )
  }, [allAppointments, patients, isCollaborator, user?.collaboratorId])

  const addPatient = useCallback(async (p: Omit<Patient, 'id' | 'createdAt'>) => {
    const patient = await api.patients.create(p)
    setAllPatients((prev) => [...prev, patient])
    return patient
  }, [])

  const updatePatient = useCallback(async (p: Patient) => {
    const updated = await api.patients.update(p.id, p)
    setAllPatients((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
  }, [])

  const deletePatient = useCallback(async (id: string) => {
    await api.patients.delete(id)
    setAllPatients((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const addCollaborator = useCallback(async (c: Omit<Collaborator, 'id' | 'createdAt'>) => {
    const collab = await api.collaborators.create(c)
    setCollaborators((prev) => [...prev, collab])
    return collab
  }, [])

  const updateCollaborator = useCallback(async (c: Collaborator) => {
    const updated = await api.collaborators.update(c.id, c)
    setCollaborators((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
  }, [])

  const deleteCollaborator = useCallback(async (id: string) => {
    await api.collaborators.delete(id)
    setCollaborators((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const addPackage = useCallback(async (p: Omit<Package, 'id' | 'createdAt'>) => {
    const pkg = await api.packages.create(p)
    setAllPackages((prev) => [...prev, pkg])
    return pkg
  }, [])

  const updatePackage = useCallback(async (p: Package) => {
    const updated = await api.packages.update(p.id, p)
    setAllPackages((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
  }, [])

  const deletePackage = useCallback(async (id: string) => {
    await api.packages.delete(id)
    setAllPackages((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const addStockItem = useCallback(async (s: Omit<StockItem, 'id' | 'createdAt'>) => {
    const item = await api.stockItems.create(s)
    setStockItems((prev) => [...prev, item])
    return item
  }, [])

  const updateStockItem = useCallback(async (s: StockItem) => {
    const updated = await api.stockItems.update(s.id, s)
    setStockItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
  }, [])

  const deleteStockItem = useCallback(async (id: string) => {
    await api.stockItems.delete(id)
    setStockItems((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const addStockMovement = useCallback(async (m: Omit<StockMovement, 'id' | 'createdAt'>) => {
    const movement = await api.stockMovements.create(m)
    setStockMovements((prev) => [...prev, movement])
    const delta = m.type === 'in' ? m.quantity : -m.quantity
    setStockItems((prev) =>
      prev.map((item) => {
        if (item.id !== m.stockItemId) return item
        return { ...item, quantity: Math.max(0, item.quantity + delta) }
      }),
    )
  }, [])

  const addAppointment = useCallback(async (a: Omit<Appointment, 'id' | 'createdAt'>) => {
    const appt = await api.appointments.create(a)
    setAllAppointments((prev) => [...prev, appt])
    return appt
  }, [])

  const updateAppointment = useCallback(async (a: Appointment) => {
    const updated = await api.appointments.update(a.id, a)
    setAllAppointments((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
  }, [])

  const deleteAppointment = useCallback(async (id: string) => {
    await api.appointments.delete(id)
    setAllAppointments((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const refreshCommissions = useCallback(async () => {
    const com = await api.commissions.list()
    setCommissions(com)
  }, [])

  const completeAppointment = useCallback(async (id: string) => {
    await api.appointments.complete(id)
    const [appts, items, movements, pkgs, com] = await Promise.all([
      api.appointments.list(),
      api.stockItems.list(),
      api.stockMovements.list(),
      api.packages.list(),
      api.commissions.list(),
    ])
    setAllAppointments(appts)
    setStockItems(items)
    setStockMovements(movements)
    setAllPackages(pkgs)
    setCommissions(com)
  }, [])

  const markMissed = useCallback(async (id: string) => {
    const updated = await api.appointments.miss(id)
    setAllAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
  }, [])

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const created = await api.transactions.create(t)
    setTransactions((prev) => [created, ...prev])
    return created
  }, [])

  const updateTransaction = useCallback(async (t: Transaction) => {
    const updated = await api.transactions.update(t.id, t)
    setTransactions((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
  }, [])

  const deleteTransaction = useCallback(async (id: string) => {
    await api.transactions.delete(id)
    setTransactions((prev) => prev.filter((x) => x.id !== id))
  }, [])

  return (
    <DataContext.Provider
      value={{
        patients,
        packages,
        stockItems,
        stockMovements,
        appointments,
        collaborators,
        commissions,
        loading,
        addPatient,
        updatePatient,
        deletePatient,
        addCollaborator,
        updateCollaborator,
        deleteCollaborator,
        addPackage,
        updatePackage,
        deletePackage,
        addStockItem,
        updateStockItem,
        deleteStockItem,
        addStockMovement,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        completeAppointment,
        markMissed,
        refreshCommissions,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}
