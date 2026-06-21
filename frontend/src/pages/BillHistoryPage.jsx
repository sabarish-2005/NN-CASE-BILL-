import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Search, Plus, Download, Eye, Printer, Edit2, Copy, Trash2, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { billService } from '../services/billService'
import { BILL_TYPES, fmtCurrency, fmtDate, downloadBlob } from '../utils'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { renderBillHTML } from '../components/bills/PrintBill'
import { useAuthStore } from '../store/authStore'
import { printBillDocument } from '../utils'
import Spinner from '../components/ui/Spinner'

export default function BillHistoryPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [sort, setSort] = useState('-date')
  const [page, setPage] = useState(1)
  const [delId, setDelId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['bills', { search, type, sort, page }],
    queryFn:  () => billService.getAll({ search, type: type==='all'?undefined:type, sort, page, limit: 15 }),
    keepPreviousData: true,
  })

  const delMut = useMutation({
    mutationFn: billService.delete,
    onSuccess: () => { qc.invalidateQueries({queryKey:['bills']}); qc.invalidateQueries({queryKey:['stats']}); toast.success('Bill deleted'); setDelId(null) },
    onError: e => toast.error(e.message),
  })

  const dupMut = useMutation({
    mutationFn: billService.duplicate,
    onSuccess: (res) => { qc.invalidateQueries({queryKey:['bills']}); toast.success('Bill duplicated!'); navigate(`/bills/${res.bill._id}`) },
    onError: e => toast.error(e.message),
  })

  const handlePrint = (bill) => {
    printBillDocument(renderBillHTML(bill, user?.settings||{}))
  }

  const handleExport = async () => {
    try {
      const res = await billService.exportExcel({ type: type==='all'?undefined:type })
      downloadBlob(res.data, `NN_Bills_${Date.now()}.xlsx`)
      toast.success('Excel exported!')
    } catch (e) { toast.error('Export failed') }
  }

  const bills = data?.bills || []
  const total = data?.total || 0
  const pages = data?.pages || 1

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="inp pl-9" placeholder="Search bill number or customer..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="inp w-auto" value={type} onChange={e => { setType(e.target.value); setPage(1) }}>
          <option value="all">All Types</option>
          {Object.entries(BILL_TYPES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="inp w-auto" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="-date">Latest First</option>
          <option value="-total">Highest Amount</option>
          <option value="date">Oldest First</option>
        </select>
        <button onClick={handleExport} className="btn-ghost gap-1.5"><Download size={14}/> Export Excel</button>
        <button onClick={() => navigate('/bills/new')} className="btn-gold gap-1.5"><Plus size={14}/> New Bill</button>
      </div>

      <div className="text-sm text-gray-500 dark:text-brand-400">
        <strong className="text-gray-800 dark:text-white">{total}</strong> bills found
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner size={28} className="text-gold-400" /></div>
        ) : bills.length === 0 ? (
          <EmptyState icon={FileText} title="No bills found" desc="Try adjusting your filters or create a new bill"
            action={<button onClick={() => navigate('/bills/new')} className="btn-gold gap-1.5"><Plus size={14}/>Create Bill</button>} />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-brand-700">
            {bills.map(b => (
              <div key={b._id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-brand-800/40 transition-colors">
                <Badge type={b.type} />
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/bills/${b._id}`)}>
                  <div className="text-sm font-bold font-mono text-gray-800 dark:text-gray-200 truncate">{b.billNo}</div>
                  <div className="text-xs text-gray-400 truncate">{b.custName||'Walk-in'} · {fmtDate(b.date)} · {b.items?.length||0} items</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-black font-mono text-brand-800 dark:text-gold-400">₹{fmtCurrency(b.total)}</div>
                </div>
                <div className="hidden sm:flex gap-1 flex-shrink-0">
                  <button onClick={()=>navigate(`/bills/${b._id}`)} className="btn-icon bg-gray-50 dark:bg-brand-800 hover:!border-gold-400" title="View"><Eye size={13}/></button>
                  <button onClick={()=>handlePrint(b)} className="btn-icon bg-gray-50 dark:bg-brand-800 hover:!border-gold-400" title="Print"><Printer size={13}/></button>
                  <button onClick={()=>navigate(`/bills/${b._id}/edit`)} className="btn-icon bg-gray-50 dark:bg-brand-800 hover:!border-gold-400" title="Edit"><Edit2 size={13}/></button>
                  <button onClick={()=>dupMut.mutate(b._id)} className="btn-icon bg-gray-50 dark:bg-brand-800 hover:!border-gold-400" title="Duplicate"><Copy size={13}/></button>
                  <button onClick={()=>setDelId(b._id)} className="btn-icon bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-500" title="Delete"><Trash2 size={13}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="btn-icon bg-white dark:bg-brand-800 border disabled:opacity-30"><ChevronLeft size={14}/></button>
          <span className="text-sm text-gray-500">Page {page} of {pages}</span>
          <button disabled={page>=pages} onClick={()=>setPage(p=>p+1)} className="btn-icon bg-white dark:bg-brand-800 border disabled:opacity-30"><ChevronRight size={14}/></button>
        </div>
      )}

      <ConfirmDialog open={!!delId} onClose={()=>setDelId(null)} onConfirm={()=>delMut.mutate(delId)}
        title="Delete Bill" message="This bill will be permanently deleted. This cannot be undone." loading={delMut.isPending} />
    </div>
  )
}
