import { useMemo, useRef, useState } from 'react'
import {
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Users,
  UserSquare2,
} from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
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

const FIELD_MESSAGES = {
  name: 'Enter first and last name.',
  cin: 'Government-issued CIN identifier.',
  email: 'Optional but recommended for communication.',
}

function FieldError({ id, error }) {
  if (!error) return null
  return (
    <p id={id} className="text-sm text-destructive" role="alert">
      {error.message}
    </p>
  )
}

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
  const activeTabLabel = TAB_LABELS[activeTab]

  const onSubmit = (values) => {
    const isInternship = values.workerType === 'internship'
    const payload = isInternship
      ? { ...values, contractType: 'Internship', entryDate: values.internshipPeriodFrom || '', position: values.position || 'Intern' }
      : { ...values, internshipPeriodFrom: '', internshipPeriodTo: '', university: '', branch: '', academicYear: '', internshipTasks: '' }

    if (editingWorker) {
      updateWorker(editingWorker.id, payload)
      toast({
        message: `"${payload.name || editingWorker.name}" updated successfully.`,
        variant: 'success',
      })
    } else {
      addWorker(payload)
      toast({
        message: `"${payload.name}" added successfully.`,
        variant: 'success',
      })
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
    <section className="space-y-6 animate-fade-in" aria-labelledby="users-page-title">
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <UserSquare2 className="size-3.5" />
              Team and user management
            </div>
            <h2 id="users-page-title" className="text-xl font-semibold tracking-tight">
              Users
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Manage employees and interns with faster filtering, clearer cards, and mobile-optimized actions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{workers.length} total</Badge>
            <Badge variant="employee">{employeeCount} employees</Badge>
            <Badge variant="intern">{internCount} interns</Badge>
          </div>
        </div>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Find and filter users</CardTitle>
          <CardDescription>
            Use search and type filters to narrow results quickly and reduce list scanning.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, CIN, position, university"
              className="pl-9"
              aria-label="Search users"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <SlidersHorizontal className="size-3.5" />
              Filter by profile type
            </div>
            <Button type="button" onClick={openCreateModal} className="hidden sm:inline-flex">
              <Plus className="size-4" />
              Add user
            </Button>
          </div>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="User type filters">
            {TABS.map((tab) => {
              const count = tab === 'all' ? workers.length : tab === 'worker' ? employeeCount : internCount
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  role="tab"
                  aria-selected={isActive}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground',
                  )}
                >
                  {TAB_LABELS[tab]}
                  <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[11px] leading-none text-current">{count}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4" role="tabpanel" aria-label={`${activeTabLabel} users`}>
          {workers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <Users className="size-10 text-muted-foreground/40" />
                <p className="font-medium">No users yet</p>
                <p className="text-sm text-muted-foreground">Add employees and interns to get started.</p>
                <Button type="button" onClick={openCreateModal} className="mt-1">
                  <Plus className="size-4" />
                  Add first user
                </Button>
              </CardContent>
            </Card>
          ) : filteredWorkers.length === 0 ? (
            <Card>
              <CardContent className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                No users match your current filters.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredWorkers.map((worker) => {
                const isIntern = worker.workerType === 'internship'
                return (
                  <article
                    key={worker.id}
                    className="flex flex-col rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                    aria-label={`User profile for ${worker.name}`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold leading-snug">{worker.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{worker.cin}</p>
                      </div>
                      <Badge variant={isIntern ? 'intern' : 'employee'} className="shrink-0">
                        {isIntern ? 'Intern' : 'Employee'}
                      </Badge>
                    </div>

                    <div className="flex-1 space-y-1 text-sm text-muted-foreground">
                      {isIntern ? (
                        <>
                          {worker.university && <p className="truncate">{worker.university}</p>}
                          {worker.branch && <p className="truncate text-xs">{worker.branch}</p>}
                          {(worker.internshipPeriodFrom || worker.internshipPeriodTo) && (
                            <p className="text-xs">
                              {worker.internshipPeriodFrom || '—'} to {worker.internshipPeriodTo || '—'}
                            </p>
                          )}
                          {worker.email && <p className="truncate text-xs">{worker.email}</p>}
                        </>
                      ) : (
                        <>
                          {worker.position && <p className="truncate">{worker.position}</p>}
                          {worker.contractType && <p className="text-xs">{worker.contractType}</p>}
                          {worker.entryDate && <p className="text-xs">Since {worker.entryDate}</p>}
                          {worker.email && <p className="truncate text-xs">{worker.email}</p>}
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
                        className="text-destructive hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setPendingDeleteWorker(worker)}
                        aria-label={`Delete ${worker.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <aside className="xl:sticky xl:top-24 xl:h-fit">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-base">Directory Health</CardTitle>
              <CardDescription>Quick overview to maintain complete and usable user profiles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="inline-flex items-center gap-2 text-foreground">
                  <BriefcaseBusiness className="size-4 text-muted-foreground" />
                  Employees
                </span>
                <Badge variant="employee">{employeeCount}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="inline-flex items-center gap-2 text-foreground">
                  <GraduationCap className="size-4 text-muted-foreground" />
                  Interns
                </span>
                <Badge variant="intern">{internCount}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="inline-flex items-center gap-2 text-foreground">
                  <ShieldCheck className="size-4 text-muted-foreground" />
                  Filter scope
                </span>
                <Badge variant="muted">{activeTabLabel}</Badge>
              </div>
              <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="size-3.5" />
                Add required fields to improve template reliability and document generation quality.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-background/95 p-3 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <Button type="button" className="flex-1" onClick={openCreateModal}>
            <Plus className="size-4" />
            Add user
          </Button>
        </div>
      </div>

      {/* Add / Edit modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && cancelEdit()}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader>
            <DialogTitle>{editingWorker ? 'Edit User' : 'Add User'}</DialogTitle>
            <DialogDescription>Complete the relevant fields for this profile type.</DialogDescription>
          </DialogHeader>

          <div className="px-6 pt-2 pb-0">
            <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1" role="tablist" aria-label="Profile type">
              {['worker', 'internship'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue('workerType', type)}
                  role="tab"
                  aria-selected={selectedWorkerType === type}
                  className={cn(
                    'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    selectedWorkerType === type
                      ? 'bg-primary text-primary-foreground shadow-sm'
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

            <fieldset className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
              <legend className="mb-1 text-sm font-medium text-foreground">Basic information</legend>

              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  aria-describedby={errors.name ? 'name-error' : 'name-help'}
                  aria-invalid={Boolean(errors.name)}
                  {...register('name', { required: 'Name is required.' })}
                />
                <p id="name-help" className="text-xs text-muted-foreground">{FIELD_MESSAGES.name}</p>
                <FieldError id="name-error" error={errors.name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cin">CIN</Label>
                <Input
                  id="cin"
                  aria-describedby={errors.cin ? 'cin-error' : 'cin-help'}
                  aria-invalid={Boolean(errors.cin)}
                  {...register('cin', { required: 'CIN is required.' })}
                />
                <p id="cin-help" className="text-xs text-muted-foreground">{FIELD_MESSAGES.cin}</p>
                <FieldError id="cin-error" error={errors.cin} />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@domain.com"
                  aria-describedby={errors.email ? 'email-error' : 'email-help'}
                  aria-invalid={Boolean(errors.email)}
                  {...register('email', {
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address.' },
                  })}
                />
                <p id="email-help" className="text-xs text-muted-foreground">{FIELD_MESSAGES.email}</p>
                <FieldError id="email-error" error={errors.email} />
              </div>
            </fieldset>

            {selectedWorkerType === 'worker' ? (
              <fieldset className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                <legend className="mb-1 text-sm font-medium text-foreground">Employment details</legend>

                <div className="space-y-2">
                  <Label htmlFor="contractType">Contract type</Label>
                  <Input
                    id="contractType"
                    placeholder="CDI / CDD"
                    aria-describedby={errors.contractType ? 'contractType-error' : undefined}
                    aria-invalid={Boolean(errors.contractType)}
                    {...register('contractType', { required: 'Required.' })}
                  />
                  <FieldError id="contractType-error" error={errors.contractType} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entryDate">Entry date</Label>
                  <Input
                    id="entryDate"
                    type="date"
                    aria-describedby={errors.entryDate ? 'entryDate-error' : undefined}
                    aria-invalid={Boolean(errors.entryDate)}
                    {...register('entryDate', { required: 'Required.' })}
                  />
                  <FieldError id="entryDate-error" error={errors.entryDate} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    aria-describedby={errors.position ? 'position-error' : undefined}
                    aria-invalid={Boolean(errors.position)}
                    {...register('position', { required: 'Required.' })}
                  />
                  <FieldError id="position-error" error={errors.position} />
                </div>
              </fieldset>
            ) : (
              <fieldset className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                <legend className="mb-1 text-sm font-medium text-foreground">Internship details</legend>

                <div className="space-y-2">
                  <Label htmlFor="internshipPeriodFrom">Period from</Label>
                  <Input
                    id="internshipPeriodFrom"
                    type="date"
                    aria-describedby={errors.internshipPeriodFrom ? 'internshipPeriodFrom-error' : undefined}
                    aria-invalid={Boolean(errors.internshipPeriodFrom)}
                    {...register('internshipPeriodFrom', { required: 'Required.' })}
                  />
                  <FieldError id="internshipPeriodFrom-error" error={errors.internshipPeriodFrom} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="internshipPeriodTo">Period to</Label>
                  <Input
                    id="internshipPeriodTo"
                    type="date"
                    aria-describedby={errors.internshipPeriodTo ? 'internshipPeriodTo-error' : undefined}
                    aria-invalid={Boolean(errors.internshipPeriodTo)}
                    {...register('internshipPeriodTo', { required: 'Required.' })}
                  />
                  <FieldError id="internshipPeriodTo-error" error={errors.internshipPeriodTo} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="university">University</Label>
                  <Input
                    id="university"
                    aria-describedby={errors.university ? 'university-error' : undefined}
                    aria-invalid={Boolean(errors.university)}
                    {...register('university', { required: 'Required.' })}
                  />
                  <FieldError id="university-error" error={errors.university} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch / Major</Label>
                  <Input
                    id="branch"
                    aria-describedby={errors.branch ? 'branch-error' : undefined}
                    aria-invalid={Boolean(errors.branch)}
                    {...register('branch', { required: 'Required.' })}
                  />
                  <FieldError id="branch-error" error={errors.branch} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic year</Label>
                  <Input
                    id="academicYear"
                    placeholder="2025/2026"
                    aria-describedby={errors.academicYear ? 'academicYear-error' : undefined}
                    aria-invalid={Boolean(errors.academicYear)}
                    {...register('academicYear', { required: 'Required.' })}
                  />
                  <FieldError id="academicYear-error" error={errors.academicYear} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Role / Title</Label>
                  <Input id="position" placeholder="Intern" {...register('position')} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="internshipTasks">Internship tasks</Label>
                  <Input id="internshipTasks" placeholder="Main missions..." {...register('internshipTasks')} />
                </div>
              </fieldset>
            )}

            <DialogFooter className="-mx-6 -mb-4 px-6 py-4 sm:col-span-2">
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
              Delete user?
            </DialogTitle>
            <DialogDescription>
              <strong className="text-foreground">{pendingDeleteWorker?.name}</strong> will be removed from the user directory.
              Documents already generated for this user will remain in History.
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
