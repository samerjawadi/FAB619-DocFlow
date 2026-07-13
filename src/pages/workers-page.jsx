import { useMemo, useRef, useState } from 'react'
import { Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { useAppData } from '../hooks/use-app-data'
import { useToast } from '../context/toast-context'
import { cn } from '../utils/cn'

const workerDefaults = {
  workerType: 'worker',
  name: '',
  cin: '',
  email: '',
  contractType: '',
  entryDate: '',
  position: '',
  internshipPeriodFrom: '',
  internshipPeriodTo: '',
  university: '',
  branch: '',
  academicYear: '',
  internshipTasks: '',
}

const TABS = ['all', 'worker', 'internship']
const TAB_LABELS = { all: 'All', worker: 'Employees', internship: 'Interns' }

export function WorkersPage() {
  const { workers, addWorker, updateWorker, deleteWorker, restoreWorker } = useAppData()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [pendingDeleteWorker, setPendingDeleteWorker] = useState(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const deletedWorkerRef = useRef(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: workerDefaults })

  const selectedWorkerType = useWatch({ control, name: 'workerType', defaultValue: 'worker' })

  const editingWorker = useMemo(
    () => workers.find((worker) => worker.id === editingId) || null,
    [workers, editingId],
  )

  const filteredWorkers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return workers.filter((w) => {
      const matchesTab = activeTab === 'all' || w.workerType === activeTab
      const matchesSearch = !q || `${w.name} ${w.cin} ${w.position || ''} ${w.university || ''}`.toLowerCase().includes(q)
      return matchesTab && matchesSearch
    })
  }, [workers, search, activeTab])

  const employeeCount = workers.filter((w) => w.workerType !== 'internship').length
  const internCount = workers.filter((w) => w.workerType === 'internship').length

  const onSubmit = (values) => {
    const isInternship = values.workerType === 'internship'
    const payload = isInternship
      ? { ...values, contractType: 'Internship', entryDate: values.internshipPeriodFrom || '', position: values.position || 'Intern' }
      : { ...values, internshipPeriodFrom: '', internshipPeriodTo: '', university: '', branch: '', academicYear: '', internshipTasks: '' }

    if (editingWorker) {
      updateWorker(editingWorker.id, payload)
    } else {
      addWorker(payload)
    }

    setEditingId('')
    setIsModalOpen(false)
    reset(workerDefaults)
  }

  const openCreateModal = () => {
    setEditingId('')
    reset(workerDefaults)
    setIsModalOpen(true)
  }

  const startEdit = (worker) => {
    setEditingId(worker.id)
    const inferredType =
      worker.workerType ||
      (worker.university || worker.branch || worker.academicYear || worker.internshipPeriodFrom ? 'internship' : 'worker')
    reset({ ...workerDefaults, ...worker, workerType: inferredType })
    setIsModalOpen(true)
  }

  const cancelEdit = () => {
    setEditingId('')
    setIsModalOpen(false)
    reset(workerDefaults)
  }

  const confirmDelete = () => {
    if (!pendingDeleteWorker) return
    const workerToDelete = pendingDeleteWorker
    deletedWorkerRef.current = workerToDelete
    deleteWorker(workerToDelete.id)
    setPendingDeleteWorker(null)

    toast({
      message: `"${workerToDelete.name}" removed.`,
      action: {
        label: 'Undo',
        onClick: () => restoreWorker(deletedWorkerRef.current),
      },
      duration: 6000,
    })
  }

  return (
    <section className="space-y-5 animate-fade-in">
      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-card/80 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="mt-1 text-2xl font-semibold">{workers.length}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/80 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Employees</p>
          <p className="mt-1 text-2xl font-semibold">{employeeCount}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/80 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Interns</p>
          <p className="mt-1 text-2xl font-semibold">{internCount}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, CIN, position…"
            className="pl-9"
            aria-label="Search workers"
          />
        </div>
        <div className="flex rounded-lg border border-border bg-muted/40 p-1 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                activeTab === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
        <Button type="button" onClick={openCreateModal}>
          <Plus className="size-4" />
          Add User
        </Button>
      </div>

      {/* Card grid */}
      {workers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="size-10 text-muted-foreground/40" />
            <p className="font-medium">No workers yet</p>
            <p className="text-sm text-muted-foreground">Add employees and interns to get started.</p>
            <Button type="button" onClick={openCreateModal} className="mt-1">
              <Plus className="size-4" />
              Add first worker
            </Button>
          </CardContent>
        </Card>
      ) : filteredWorkers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          No workers match your filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredWorkers.map((worker) => {
            const isIntern = worker.workerType === 'internship'
            return (
              <div
                key={worker.id}
                className="flex flex-col rounded-xl border border-border/70 bg-card p-4 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug truncate">{worker.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{worker.cin}</p>
                  </div>
                  <Badge variant={isIntern ? 'intern' : 'employee'} className="shrink-0">
                    {isIntern ? 'Intern' : 'Employee'}
                  </Badge>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground flex-1">
                  {isIntern ? (
                    <>
                      {worker.university && <p className="truncate">{worker.university}</p>}
                      {worker.branch && <p className="truncate text-xs">{worker.branch}</p>}
                      {(worker.internshipPeriodFrom || worker.internshipPeriodTo) && (
                        <p className="text-xs">
                          {worker.internshipPeriodFrom || '—'} → {worker.internshipPeriodTo || '—'}
                        </p>
                      )}
                      {worker.email && <p className="text-xs truncate">{worker.email}</p>}
                    </>
                  ) : (
                    <>
                      {worker.position && <p className="truncate">{worker.position}</p>}
                      {worker.contractType && <p className="text-xs">{worker.contractType}</p>}
                      {worker.entryDate && <p className="text-xs">Since {worker.entryDate}</p>}
                      {worker.email && <p className="text-xs truncate">{worker.email}</p>}
                    </>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => startEdit(worker)}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                    onClick={() => setPendingDeleteWorker(worker)}
                    aria-label={`Delete ${worker.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && cancelEdit()}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader>
            <DialogTitle>{editingWorker ? 'Edit User' : 'Add User'}</DialogTitle>
            <DialogDescription>Complete the relevant fields for this profile type.</DialogDescription>
          </DialogHeader>

          <div className="px-6 pt-2 pb-0">
            <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
              {['worker', 'internship'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue('workerType', type)}
                  className={cn(
                    'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                    selectedWorkerType === type
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {type === 'worker' ? 'Employee' : 'Intern'}
                </button>
              ))}
            </div>
          </div>

          <form className="grid gap-4 px-6 py-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register('workerType')} />

            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" {...register('name', { required: 'Name is required.' })} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cin">CIN</Label>
              <Input id="cin" {...register('cin', { required: 'CIN is required.' })} />
              {errors.cin && <p className="text-sm text-destructive">{errors.cin.message}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@domain.com"
                {...register('email', {
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address.' },
                })}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            {selectedWorkerType === 'worker' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="contractType">Contract type</Label>
                  <Input id="contractType" placeholder="CDI / CDD" {...register('contractType', { required: 'Required.' })} />
                  {errors.contractType && <p className="text-sm text-destructive">{errors.contractType.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entryDate">Entry date</Label>
                  <Input id="entryDate" type="date" {...register('entryDate', { required: 'Required.' })} />
                  {errors.entryDate && <p className="text-sm text-destructive">{errors.entryDate.message}</p>}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="position">Position</Label>
                  <Input id="position" {...register('position', { required: 'Required.' })} />
                  {errors.position && <p className="text-sm text-destructive">{errors.position.message}</p>}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="internshipPeriodFrom">Period from</Label>
                  <Input id="internshipPeriodFrom" type="date" {...register('internshipPeriodFrom', { required: 'Required.' })} />
                  {errors.internshipPeriodFrom && <p className="text-sm text-destructive">{errors.internshipPeriodFrom.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="internshipPeriodTo">Period to</Label>
                  <Input id="internshipPeriodTo" type="date" {...register('internshipPeriodTo', { required: 'Required.' })} />
                  {errors.internshipPeriodTo && <p className="text-sm text-destructive">{errors.internshipPeriodTo.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="university">University</Label>
                  <Input id="university" {...register('university', { required: 'Required.' })} />
                  {errors.university && <p className="text-sm text-destructive">{errors.university.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch / Major</Label>
                  <Input id="branch" {...register('branch', { required: 'Required.' })} />
                  {errors.branch && <p className="text-sm text-destructive">{errors.branch.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic year</Label>
                  <Input id="academicYear" placeholder="2025/2026" {...register('academicYear', { required: 'Required.' })} />
                  {errors.academicYear && <p className="text-sm text-destructive">{errors.academicYear.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Role / Title</Label>
                  <Input id="position" placeholder="Intern" {...register('position')} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="internshipTasks">Internship tasks</Label>
                  <Input id="internshipTasks" placeholder="Main missions…" {...register('internshipTasks')} />
                </div>
              </>
            )}

            <DialogFooter className="-mx-6 -mb-4 sm:col-span-2 px-6 py-4">
              <Button type="button" variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button type="submit">{editingWorker ? 'Update User' : 'Add User'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={Boolean(pendingDeleteWorker)} onOpenChange={(open) => !open && setPendingDeleteWorker(null)}>
        <DialogContent className="max-w-sm p-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="size-4 text-destructive" />
              Delete worker?
            </DialogTitle>
            <DialogDescription>
              <strong className="text-foreground">{pendingDeleteWorker?.name}</strong> will be removed from the worker list.
              Documents already generated for this worker will remain in History.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDeleteWorker(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
