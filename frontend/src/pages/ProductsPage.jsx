import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Edit2, Trash2, Package } from 'lucide-react'
import { productService } from '../services/billService'
import { UNITS, GST_RATES, CATEGORIES, fmtCurrency } from '../utils'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Spinner from '../components/ui/Spinner'

export default function ProductsPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null)
  const [delId, setDelId] = useState(null)
  const { register, handleSubmit, reset, formState:{errors} } = useForm({
    defaultValues:{ name:'', hsn:'3923', unit:'Nos', rate:0, gstRate:12, category:'General' }
  })

  const { data, isLoading } = useQuery({ queryKey:['products'], queryFn:()=>productService.getAll() })

  const saveMut = useMutation({
    mutationFn: (data) => editing ? productService.update(editing._id, data) : productService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({queryKey:['products']})
      qc.invalidateQueries({queryKey:['products-all']})
      toast.success(editing ? 'Product updated!' : 'Product added!')
      reset({ name:'', hsn:'3923', unit:'Nos', rate:0, gstRate:12, category:'General' }); setEditing(null)
    },
    onError: e => toast.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: productService.delete,
    onSuccess: () => { qc.invalidateQueries({queryKey:['products']}); toast.success('Product removed'); setDelId(null) },
  })

  const onEdit = (p) => { setEditing(p); reset(p) }
  const onCancel = () => { setEditing(null); reset({ name:'', hsn:'3923', unit:'Nos', rate:0, gstRate:12, category:'General' }) }

  const products = data?.products || []
  const grouped = products.reduce((acc, p) => { (acc[p.category||'General'] ||= []).push(p); return acc }, {})

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 animate-fade-in">
      {/* Form */}
      <div className="card h-fit lg:sticky lg:top-16">
        <div className="card-header">⚜ {editing ? 'Edit Product' : 'Add Product'}</div>
        <form onSubmit={handleSubmit(d=>saveMut.mutate({...d, rate:parseFloat(d.rate), gstRate:parseInt(d.gstRate)}))} className="card-body space-y-3">
          <div className="field">
            <label className="label">Product Name *</label>
            <input className="inp" {...register('name',{required:true})} placeholder="Product name" />
            {errors.name && <p className="text-red-500 text-xs mt-1">Name required</p>}
          </div>
          <div className="field">
            <label className="label">HSN Code</label>
            <input className="inp" {...register('hsn')} placeholder="3923" />
          </div>
          <div className="field">
            <label className="label">Category</label>
            <select className="inp" {...register('category')}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="field"><label className="label">Rate (₹)</label><input type="number" step="0.01" min="0" className="inp" {...register('rate',{required:true})} /></div>
            <div className="field"><label className="label">Unit</label><select className="inp" {...register('unit')}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></div>
          </div>
          <div className="field">
            <label className="label">GST Rate</label>
            <select className="inp" {...register('gstRate')}>{GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}</select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saveMut.isPending} className="btn-gold flex-1 justify-center">
              {saveMut.isPending ? <Spinner size={14}/> : (editing ? 'Update' : 'Save Product')}
            </button>
            {editing && <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        <div className="card-header">⚜ Product Catalog ({products.length})</div>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size={24} className="text-gold-400"/></div>
        ) : products.length === 0 ? (
          <EmptyState icon={Package} title="No products yet" desc="Add your first product using the form" />
        ) : (
          <div className="overflow-x-auto">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="px-4 py-1.5 bg-brand-50 dark:bg-brand-800 text-xs font-bold text-brand-700 dark:text-gold-400 tracking-wider">{cat}</div>
                <table className="w-full text-sm">
                  <tbody>
                    {items.map(p => (
                      <tr key={p._id} className="tbl-row border-b border-gray-100 dark:border-brand-700">
                        <td className="tbl-cell font-semibold">{p.name}</td>
                        <td className="tbl-cell font-mono text-xs text-gray-400">{p.hsn}</td>
                        <td className="tbl-cell text-gray-500">{p.unit}</td>
                        <td className="tbl-cell font-mono font-bold text-brand-800 dark:text-gold-400">₹{fmtCurrency(p.rate)}</td>
                        <td className="tbl-cell"><span className="badge bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">{p.gstRate}%</span></td>
                        <td className="tbl-cell">
                          <div className="flex gap-1.5">
                            <button onClick={()=>onEdit(p)} className="btn-icon bg-gray-50 dark:bg-brand-800 hover:!border-gold-400"><Edit2 size={12}/></button>
                            <button onClick={()=>setDelId(p._id)} className="btn-icon bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-500"><Trash2 size={12}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog open={!!delId} onClose={()=>setDelId(null)} onConfirm={()=>delMut.mutate(delId)}
        title="Remove Product" message="This product will be removed from the catalog." loading={delMut.isPending} />
    </div>
  )
}
