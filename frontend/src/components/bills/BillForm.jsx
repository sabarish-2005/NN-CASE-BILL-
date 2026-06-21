import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Minus, Save, Printer, Eye, Share2, RotateCcw } from 'lucide-react'
import { billService, customerService, productService } from '../../services/billService'
import { BILL_TYPES, TRANSPORT, UNITS, GST_RATES, calcBillTotals, today, fmtCurrency, numberToWords, shareWhatsApp, uid } from '../../utils'
import BillPreview from './BillPreview'
import { renderBillHTML } from './PrintBill'
import { useAuthStore } from '../../store/authStore'
import { printBillDocument } from '../../utils'
import Spinner from '../ui/Spinner'

const mkItem = () => ({ _uid: uid(), desc:'', hsn:'3923', qty:1, unit:'Nos', rate:0, gstRate:0, amt:0 })

export default function BillForm({ editData }) {
  const navigate    = useNavigate()
  const [params]    = useSearchParams()
  const qc          = useQueryClient()
  const initType    = params.get('type') || editData?.type || 'dc'

  const [type,      setType]      = useState(initType)
  const [billNo,    setBillNo]    = useState(editData?.billNo || '')
  const [date,      setDate]      = useState(editData?.date ? editData.date.slice(0,10) : today())
  const [transport, setTransport] = useState(editData?.transport || 'By Hand')
  const [vehicleNo, setVehicleNo] = useState(editData?.vehicleNo || '')
  const [gstRate,   setGstRate]   = useState(editData?.gstRate || 0)
  const [notes,     setNotes]     = useState(editData?.notes || '')
  const [custName,  setCustName]  = useState(editData?.custName || '')
  const [custAddr,  setCustAddr]  = useState(editData?.custAddr || '')
  const [custPhone, setCustPhone] = useState(editData?.custPhone || '')
  const [custGST,   setCustGST]   = useState(editData?.custGST || '')
  const [customerId,setCustomerId]= useState(editData?.customerId || null)
  const [items,     setItems]     = useState(editData?.items?.map(i=>({...i,_uid:uid()}))||[mkItem()])
  const [showPreview, setShowPreview] = useState(false)
  const [custDropOpen, setCustDropOpen] = useState(false)
  const [custSearch, setCustSearch] = useState('')

  // Fetch next bill number
  const { data: nextNoData } = useQuery({
    queryKey: ['nextBillNo', type],
    queryFn: () => billService.getNextNo(type),
    enabled: !editData,
  })
  useEffect(() => { if (!editData && nextNoData?.billNo) setBillNo(nextNoData.billNo) }, [nextNoData])

  // Customers for search
  const { data: custData } = useQuery({ queryKey:['customers-all'], queryFn:()=>customerService.getAll({limit:200}) })
  const customers = custData?.customers || []

  // Products
  const { data: prodData } = useQuery({ queryKey:['products-all'], queryFn:()=>productService.getAll() })
  const products = prodData?.products || []

  // Totals
  const totals = calcBillTotals(items, type, gstRate)
  const isGST  = type === 'gst'

  // Save mutation
  const saveMut = useMutation({
    mutationFn: (data) => editData ? billService.update(editData._id, data) : billService.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey:['bills'] })
      qc.invalidateQueries({ queryKey:['stats'] })
      toast.success(`Bill ${editData ? 'updated' : 'created'}!`)
      navigate(`/bills/${res.bill._id}`)
    },
    onError: (e) => toast.error(e.message),
  })

  const buildPayload = () => ({
    billNo, type, date, transport, vehicleNo, gstRate: isGST ? gstRate : 0,
    custName, custAddr, custPhone, custGST, customerId,
    items: totals.items, notes,
    subtotal: totals.subtotal, cgstTotal: totals.cgstTotal, sgstTotal: totals.sgstTotal,
    gstTotal: totals.gstTotal, roundOff: totals.roundOff, total: totals.total, words: totals.words,
    taxable: totals.subtotal,
  })

  const handleSave = () => saveMut.mutate(buildPayload())
  const handlePrint = () => {
    const b = { ...buildPayload(), billNo, type }
    const settings = useAuthStore.getState().user?.settings || {}
    printBillDocument(renderBillHTML(b, settings))
  }

  // Item handlers
  const updItem = useCallback((uid, field, val) => {
    setItems(prev => prev.map(it => it._uid === uid ? { ...it, [field]: ['qty','rate','gstRate'].includes(field) ? parseFloat(val)||0 : val } : it))
  }, [])
  const addItem   = () => setItems(p => [...p, mkItem()])
  const remItem   = (uid) => setItems(p => p.filter(i => i._uid !== uid))

  const selectProduct = (uid, prod) => {
    setItems(prev => prev.map(it => it._uid === uid ? { ...it, desc:prod.name, hsn:prod.hsn, unit:prod.unit, rate:prod.rate, gstRate:prod.gstRate } : it))
  }
  const selectCustomer = (c) => {
    setCustName(c.name); setCustAddr(c.addr||''); setCustPhone(c.phone||'')
    setCustGST(c.gstin||''); setCustomerId(c._id); setCustDropOpen(false); setCustSearch('')
  }

  const filteredCusts = customers.filter(c => !custSearch || c.name.toLowerCase().includes(custSearch.toLowerCase()) || c.phone?.includes(custSearch))

  const bt = BILL_TYPES[type]
  const previewBill = { ...buildPayload(), billNo, type, date, custName, custAddr, custPhone, custGST, items:totals.items, ...totals }

  return (
    <div className="space-y-4 animate-fade-in max-w-5xl mx-auto">
      {showPreview && (
        <BillPreview bill={previewBill} onClose={() => setShowPreview(false)} />
      )}

      {/* Bill Type */}
      <div className="card">
        <div className="card-header">⚜ Bill Type</div>
        <div className="card-body flex flex-wrap gap-2">
          {Object.entries(BILL_TYPES).map(([k, v]) => (
            <button key={k} onClick={() => { setType(k); if(!editData) setBillNo('') }}
              className="px-4 py-2 rounded-lg border-2 text-xs font-black transition-all hover:scale-105"
              style={{ borderColor: type===k ? v.color : '#e5e7eb', background: type===k ? v.bg : 'transparent', color: type===k ? v.color : '#9ca3af' }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bill Info */}
      <div className="card">
        <div className="card-header">⚜ Bill Information</div>
        <div className="card-body grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="field">
            <label className="label">Bill Number</label>
            <input className="inp font-mono font-bold" value={billNo} onChange={e=>setBillNo(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Date</label>
            <input type="date" className="inp" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Transport Mode</label>
            <select className="inp" value={transport} onChange={e=>setTransport(e.target.value)}>
              {TRANSPORT.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {(transport === 'By Vehicle' || transport === 'By Lorry') && (
            <div className="field">
              <label className="label">Vehicle Number</label>
              <input className="inp" value={vehicleNo} onChange={e=>setVehicleNo(e.target.value)} placeholder="TN 39 XX 0000" />
            </div>
          )}
        </div>
      </div>

      {/* Customer */}
      <div className="card">
        <div className="card-header">⚜ Customer / Party Details</div>
        <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="field sm:col-span-2 relative">
            <label className="label">Customer Name</label>
            <div className="flex gap-2">
              <input className="inp flex-1" value={custName}
                onChange={e => { setCustName(e.target.value); setCustSearch(e.target.value); setCustDropOpen(true) }}
                onFocus={() => setCustDropOpen(true)}
                onBlur={() => setTimeout(() => setCustDropOpen(false), 200)}
                placeholder="Search or type name..." />
              <select onChange={e => { const c = customers.find(x=>x._id===e.target.value); if(c) selectCustomer(c) }}
                className="inp w-10 !px-1 cursor-pointer" title="Select from list">
                <option value="">▼</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            {custDropOpen && filteredCusts.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 bg-white dark:bg-brand-900 border-2 border-gold-400 border-t-0 rounded-b-lg shadow-xl max-h-44 overflow-y-auto">
                {filteredCusts.slice(0,8).map(c => (
                  <div key={c._id} onMouseDown={() => selectCustomer(c)}
                    className="px-3 py-2.5 cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-800 border-b border-gray-100 dark:border-brand-700 last:border-0">
                    <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{c.name}</div>
                    <div className="text-xs text-gray-400">{c.phone} · {c.addr?.slice(0,40)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="field">
            <label className="label">Phone</label>
            <input className="inp" value={custPhone} onChange={e=>setCustPhone(e.target.value)} placeholder="Mobile number" />
          </div>
          <div className="field">
            <label className="label">GSTIN (Optional)</label>
            <input className="inp" value={custGST} onChange={e=>setCustGST(e.target.value)} placeholder="33XXXXX1234F1ZV" />
          </div>
          <div className="field sm:col-span-2">
            <label className="label">Delivery Address</label>
            <textarea className="inp !h-16" value={custAddr} onChange={e=>setCustAddr(e.target.value)} placeholder="Full address..." />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card">
        <div className="card-header justify-between">
          <span>⚜ Items / Products</span>
          {isGST && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-gold-300 mr-1">GST Rate:</span>
              {GST_RATES.map(r => (
                <button key={r} onClick={() => setGstRate(r)}
                  className={`px-2 py-0.5 rounded text-xs font-bold border transition-all ${gstRate===r ? 'bg-gold-400 text-brand-900 border-gold-400' : 'border-brand-600 text-brand-300 hover:border-gold-400'}`}>
                  {r}%
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 700 }}>
            <thead>
              <tr className="tbl-head">
                {['#','Description','HSN','Qty','Unit','Rate (₹)', ...(isGST?['GST%']:[]
                ), 'Amount (₹)',''].map(h => (
                  <th key={h} className="px-2 py-2.5 text-left font-black text-[10px] tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <ItemRow key={it._uid} it={it} idx={idx} isGST={isGST}
                  products={products} onUpdate={updItem} onRemove={remItem}
                  canRemove={items.length > 1} onSelectProduct={selectProduct}
                  totals={totals.items.find(i=>i._uid===it._uid)} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-gray-100 dark:border-brand-700">
          <button onClick={addItem} className="btn-ghost text-xs gap-1.5 hover:!border-gold-400">
            <Plus size={13} /> Add Row
          </button>
        </div>
      </div>

      {/* Totals + Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Notes */}
        <div className="lg:col-span-3 card">
          <div className="card-header">⚜ Notes & Amount in Words</div>
          <div className="card-body">
            <textarea className="inp !h-20" value={notes} onChange={e=>setNotes(e.target.value)}
              placeholder="Payment terms, instructions..." />
            <div className="mt-3 p-3 bg-brand-50 dark:bg-brand-800 border-l-4 border-gold-400 rounded">
              <div className="text-[9px] font-black text-brand-400 tracking-widest mb-1">AMOUNT IN WORDS:</div>
              <div className="text-xs font-bold text-brand-800 dark:text-gold-300 uppercase leading-relaxed">{totals.words}</div>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-brand-900 to-brand-800 border-2 border-gold-500 rounded-lg p-4 text-white">
            <div className="text-[10px] font-black text-gold-400 tracking-widest mb-3">BILL SUMMARY</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-brand-300">
                <span>Sub Total</span><span className="font-mono">₹ {fmtCurrency(totals.subtotal)}</span>
              </div>
              {isGST && gstRate > 0 && <>
                <div className="flex justify-between text-sm text-brand-300">
                  <span>CGST @ {gstRate/2}%</span><span className="font-mono">₹ {fmtCurrency(totals.cgstTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-brand-300">
                  <span>SGST @ {gstRate/2}%</span><span className="font-mono">₹ {fmtCurrency(totals.sgstTotal)}</span>
                </div>
              </>}
              {totals.roundOff !== 0 && (
                <div className="flex justify-between text-xs text-brand-400">
                  <span>Round Off</span><span className="font-mono">{totals.roundOff > 0 ? '+':''}{fmtCurrency(totals.roundOff)}</span>
                </div>
              )}
            </div>
            <div className="border-t-2 border-gold-500/50 mt-3 pt-3 flex justify-between">
              <span className="font-black text-lg">TOTAL</span>
              <span className="font-black text-2xl text-gold-400 font-mono">₹ {fmtCurrency(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pb-6">
        <button onClick={handleSave} disabled={saveMut.isPending} className="btn-gold gap-2">
          {saveMut.isPending ? <Spinner size={15} /> : <Save size={15} />}
          {saveMut.isPending ? 'Saving...' : 'Save Bill'}
        </button>
        <button onClick={handlePrint} className="btn-primary gap-2">
          <Printer size={15} /> Print / PDF
        </button>
        <button onClick={() => setShowPreview(true)} className="btn-ghost gap-2">
          <Eye size={15} /> Preview
        </button>
        <button onClick={() => shareWhatsApp(previewBill)} className="btn gap-2 bg-[#25d366] text-white hover:bg-[#1ea854]">
          <Share2 size={15} /> WhatsApp
        </button>
        {!editData && (
          <button onClick={() => { setItems([mkItem()]); setCustName(''); setCustPhone(''); setCustAddr(''); setCustGST('') }}
            className="btn-ghost gap-2 ml-auto">
            <RotateCcw size={13} /> Reset
          </button>
        )}
      </div>
    </div>
  )
}

// ── Item Row ──────────────────────────────────────
function ItemRow({ it, idx, isGST, products, onUpdate, onRemove, canRemove, onSelectProduct, totals }) {
  const [prodOpen, setProdOpen] = useState(false)
  const [prodSearch, setProdSearch] = useState('')

  const filtered = products.filter(p => !prodSearch || p.name.toLowerCase().includes(prodSearch.toLowerCase())).slice(0,8)
  const amt = totals?.amt ?? (it.qty * it.rate)

  const handleDescChange = (v) => {
    onUpdate(it._uid, 'desc', v)
    setProdSearch(v)
    setProdOpen(true)
  }

  return (
    <tr className="tbl-row border-b border-gray-100 dark:border-brand-700">
      <td className="tbl-cell text-center text-gray-400 w-8">{idx+1}</td>
      <td className="tbl-cell w-48 relative">
        <div className="flex gap-1">
          <input className="inp inp-sm flex-1" value={it.desc}
            onChange={e => handleDescChange(e.target.value)}
            onFocus={() => setProdOpen(true)}
            onBlur={() => setTimeout(() => setProdOpen(false), 220)}
            placeholder="Product..." />
          <select onChange={e => { const p = products.find(x=>x._id===e.target.value); if(p) onSelectProduct(it._uid, p) }}
            className="inp inp-sm !w-7 !px-0.5 cursor-pointer" title="Select product">
            <option value="">▼</option>
            {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
        {prodOpen && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-20 bg-white dark:bg-brand-900 border-2 border-gold-400 rounded-b shadow-xl max-h-36 overflow-y-auto">
            {filtered.map(p => (
              <div key={p._id} onMouseDown={() => { onSelectProduct(it._uid, p); setProdSearch(''); setProdOpen(false) }}
                className="px-2 py-2 cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-800 border-b border-gray-100 dark:border-brand-700 last:border-0">
                <div className="text-xs font-bold text-gray-800 dark:text-white">{p.name}</div>
                <div className="text-[10px] text-gray-400">₹{fmtCurrency(p.rate)} / {p.unit} · HSN {p.hsn}</div>
              </div>
            ))}
          </div>
        )}
      </td>
      <td className="tbl-cell w-16">
        <input className="inp inp-sm w-full" value={it.hsn} onChange={e => onUpdate(it._uid,'hsn',e.target.value)} />
      </td>
      <td className="tbl-cell w-16">
        <input type="number" min="0" step="0.001" className="inp inp-sm w-full text-right" value={it.qty}
          onChange={e => onUpdate(it._uid,'qty',e.target.value)} />
      </td>
      <td className="tbl-cell w-16">
        <select className="inp inp-sm w-full" value={it.unit} onChange={e => onUpdate(it._uid,'unit',e.target.value)}>
          {UNITS.map(u => <option key={u}>{u}</option>)}
        </select>
      </td>
      <td className="tbl-cell w-24">
        <input type="number" min="0" step="0.01" className="inp inp-sm w-full text-right" value={it.rate}
          onChange={e => onUpdate(it._uid,'rate',e.target.value)} />
      </td>
      {isGST && (
        <td className="tbl-cell w-16">
          <select className="inp inp-sm w-full" value={it.gstRate} onChange={e => onUpdate(it._uid,'gstRate',e.target.value)}>
            {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
          </select>
        </td>
      )}
      <td className="tbl-cell w-24 text-right font-black font-mono text-brand-800 dark:text-gold-400 bg-brand-50 dark:bg-brand-800/50">
        ₹ {fmtCurrency(amt)}
      </td>
      <td className="tbl-cell w-8 text-center">
        {canRemove && (
          <button onClick={() => onRemove(it._uid)}
            className="w-6 h-6 flex items-center justify-center rounded bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-100">
            <Minus size={11} />
          </button>
        )}
      </td>
    </tr>
  )
}
