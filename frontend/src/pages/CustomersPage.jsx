import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Search, Edit2, Trash2, Phone, MapPin, Users } from 'lucide-react'
import { customerService } from '../services/billService'
import { fmtCurrencyShort } from '../utils'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Spinner from '../components/ui/Spinner'

export default function CustomersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [delId, setDelId] = useState(null)
  const { register, handleSubmit, reset, formState:{errors} } = useForm({
    defaultValues:{ name:'', phone:'', gstin:'', addr:'', city:'', pincode:'' }
  })

  const { data, isLoading } = useQuery({ queryKey:['customers', search], queryFn:()=>customerService.getAll({ search, limit:100 }) })

  const saveMut = useMutation({
    mutationFn: (data) => editing ? customerService.update(editing._id, data) : customerService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({queryKey:['customers']})
      qc.invalidateQueries({queryKey:['customers-all']})
      toast.success(editing ? 'Customer updated!' : 'Customer added!')
      reset(); setEditing(null)
    },
    onError: e => toast.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: customerService.delete,
    onSuccess: () => { qc.invalidateQueries({queryKey:['customers']}); toast.success('Deleted'); setDelId(null) },
    onError: e => { toast.error(e.message); setDelId(null) },
  })

  const onEdit = (c) => { setEditing(c); reset(c) }
  const onCancel = () => { setEditing(null); reset({name:'',phone:'',gstin:'',addr:'',city:'',pincode:''}) }

  const customers = data?.customers || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 animate-fade-in">
      {/* Form */}
      <div className="card h-fit lg:sticky lg:top-16">
        <div className="card-header">⚜ {editing ? 'Edit Customer' : 'Add Customer'}</div>
        <form onSubmit={handleSubmit(d=>saveMut.mutate(d))} className="card-body space-y-3">
          <div className="field">
            <label className="label">Name *</label>
            <input className="inp" {...register('name',{required:true})} placeholder="Business or person name" />
            {errors.name && <p className="text-red-500 text-xs mt-1">Name required</p>}
          </div>
          <div className="field">
            <label className="label">Phone</label>
            <input className="inp" {...register('phone')} placeholder="Mobile number" />
          </div>
          <div className="field">
            <label className="label">GSTIN</label>
            <input className="inp" {...register('gstin')} placeholder="Optional" />
          </div>
          <div className="field">
            <label className="label">Address</label>
            <textarea className="inp !h-16" {...register('addr')} placeholder="Full address" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="field"><label className="label">City</label><input className="inp" {...register('city')} /></div>
            <div className="field"><label className="label">Pincode</label><input className="inp" {...register('pincode')} /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saveMut.isPending} className="btn-gold flex-1 justify-center">
              {saveMut.isPending ? <Spinner size={14}/> : (editing ? 'Update' : 'Save Customer')}
            </button>
            {editing && <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="inp pl-9" placeholder="Search customers..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size={24} className="text-gold-400"/></div>
        ) : customers.length === 0 ? (
          <EmptyState icon={Users} title="No customers yet" desc="Add your first customer using the form" />
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-gray-500 dark:text-brand-400">{customers.length} customers</div>
            {customers.map(c => (
              <div key={c._id} className="card p-4 hover:border-gold-400 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 dark:text-white">{c.name}</div>
                    {c.phone && <div className="text-xs text-gray-500 dark:text-brand-400 mt-1 flex items-center gap-1"><Phone size={11}/> {c.phone}</div>}
                    {c.addr && <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin size={11}/> {c.addr}{c.city?`, ${c.city}`:''}{c.pincode?` - ${c.pincode}`:''}</div>}
                    {c.gstin && <div className="text-xs text-gray-400 mt-0.5">GSTIN: {c.gstin}</div>}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={()=>onEdit(c)} className="btn-icon bg-gray-50 dark:bg-brand-800 hover:!border-gold-400"><Edit2 size={13}/></button>
                    <button onClick={()=>setDelId(c._id)} className="btn-icon bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-500"><Trash2 size={13}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog open={!!delId} onClose={()=>setDelId(null)} onConfirm={()=>delMut.mutate(delId)}
        title="Delete Customer" message="Are you sure? Customers with existing bills cannot be deleted." loading={delMut.isPending} />
    </div>
  )
}
