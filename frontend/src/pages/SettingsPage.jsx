import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Upload, Trash2, Download, Save } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { billService } from '../services/billService'
import { CO, getFY, downloadBlob } from '../utils'
import Spinner from '../components/ui/Spinner'

export default function SettingsPage() {
  const { user, updateSettings } = useAuthStore()
  const [gstin, setGstin] = useState(user?.settings?.gstin || '')
  const [accountNo, setAccountNo] = useState(user?.settings?.accountNo || '45172475098')
  const [ifsc, setIfsc] = useState(user?.settings?.ifsc || 'SBIN0071059')
  const [bankName, setBankName] = useState(user?.settings?.bankName || 'State Bank of India (SBI)')
  const [bankBranch, setBankBranch] = useState(user?.settings?.bankBranch || 'Kalangal Branch')
  const [accountHolder, setAccountHolder] = useState(user?.settings?.accountHolder || 'Mr. SABARISH V')
  const [logo, setLogo] = useState(user?.settings?.logo || '')
  const [signature, setSignature] = useState(user?.settings?.signature || '')
  const logoRef = useRef(), sigRef = useRef()

  const saveMut = useMutation({
    mutationFn: (data) => updateSettings(data),
    onSuccess: () => toast.success('Settings saved!'),
    onError: e => toast.error(e.message),
  })

  const handleImg = (e, setter, key) => {
    const file = e.target.files[0]; if (!file) return
    if (file.size > 2*1024*1024) return toast.error('Image must be under 2MB')
    const r = new FileReader()
    r.onload = ev => {
      setter(ev.target.result)
      saveMut.mutate({
        ...user.settings,
        gstin,
        accountNo,
        ifsc,
        bankName,
        bankBranch,
        accountHolder,
        logo: key==='logo'?ev.target.result:logo,
        signature: key==='signature'?ev.target.result:signature,
      })
    }
    r.readAsDataURL(file)
  }

  const handleSaveSettings = () => saveMut.mutate({ ...user.settings, gstin, accountNo, ifsc, bankName, bankBranch, accountHolder, logo, signature })
  const clearImages = () => { setLogo(''); setSignature(''); saveMut.mutate({ ...user.settings, gstin, accountNo, ifsc, logo:'', signature:'' }) }

  const handleExportExcel = async () => {
    try {
      const res = await billService.exportExcel({})
      downloadBlob(res.data, `NN_Full_Export_${Date.now()}.xlsx`)
      toast.success('Excel exported!')
    } catch { toast.error('Export failed') }
  }

  return (
    <div className="max-w-2xl space-y-4 animate-fade-in">
      {/* Company Settings */}
      <div className="card">
        <div className="card-header">⚜ Company Settings</div>
        <div className="card-body space-y-4">
          <div className="field">
            <label className="label">GSTIN (Optional)</label>
            <div className="flex gap-2">
              <input className="inp" value={gstin} onChange={e=>setGstin(e.target.value)} placeholder="33XXXXX1234F1ZV" />
              <button onClick={handleSaveSettings} disabled={saveMut.isPending} className="btn-gold gap-1.5 flex-shrink-0">
                {saveMut.isPending ? <Spinner size={14}/> : <Save size={14}/>} Save
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field">
              <label className="label">Account Number</label>
              <input
                className="inp"
                value={accountNo}
                onChange={e=>setAccountNo(e.target.value.replace(/\D/g, ''))}
                placeholder="45172475098"
              />
            </div>
            <div className="field">
              <label className="label">IFSC Code</label>
              <input
                className="inp uppercase"
                value={ifsc}
                onChange={e=>setIfsc(e.target.value.toUpperCase())}
                placeholder="SBIN0071059"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field">
              <label className="label">Bank Name</label>
              <input className="inp" value={bankName} onChange={e=>setBankName(e.target.value)} placeholder="State Bank of India (SBI)" />
            </div>
            <div className="field">
              <label className="label">Branch Name</label>
              <input className="inp" value={bankBranch} onChange={e=>setBankBranch(e.target.value)} placeholder="Kalangal Branch" />
            </div>
          </div>

          <div className="field">
            <label className="label">Account Holder Name</label>
            <input className="inp" value={accountHolder} onChange={e=>setAccountHolder(e.target.value)} placeholder="Mr. SABARISH V" />
          </div>

          <button onClick={handleSaveSettings} disabled={saveMut.isPending} className="btn-gold gap-1.5">
            {saveMut.isPending ? <Spinner size={14}/> : <Save size={14}/>} Save My Details
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Company Logo</label>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e=>handleImg(e,setLogo,'logo')} />
              <button onClick={()=>logoRef.current.click()} className="btn-ghost gap-1.5 text-xs"><Upload size={13}/> Upload Logo</button>
              {logo ? (
                <div className="mt-2 p-2 bg-white border border-gray-200 rounded inline-block">
                  <img src={logo} alt="Logo" className="h-14 object-contain" />
                </div>
              ) : <div className="mt-2 text-xs text-gray-400">No logo uploaded — Vel symbol used by default</div>}
            </div>
            <div>
              <label className="label">Digital Signature</label>
              <input ref={sigRef} type="file" accept="image/*" className="hidden" onChange={e=>handleImg(e,setSignature,'signature')} />
              <button onClick={()=>sigRef.current.click()} className="btn-ghost gap-1.5 text-xs"><Upload size={13}/> Upload Signature</button>
              {signature ? (
                <div className="mt-2 p-2 bg-white border border-gray-200 rounded inline-block">
                  <img src={signature} alt="Signature" className="h-14 object-contain" />
                </div>
              ) : <div className="mt-2 text-xs text-gray-400">No signature uploaded</div>}
            </div>
          </div>

          {(logo || signature) && (
            <button onClick={clearImages} className="btn-danger gap-1.5 text-xs"><Trash2 size={13}/> Clear All Images</button>
          )}
        </div>
      </div>

      {/* Data Export */}
      <div className="card">
        <div className="card-header">⚜ Data Export</div>
        <div className="card-body">
          <button onClick={handleExportExcel} className="btn-ghost gap-1.5"><Download size={14}/> Export All Bills (Excel)</button>
          <div className="mt-3 p-3 bg-brand-50 dark:bg-brand-800 border-l-4 border-gold-400 rounded text-xs text-brand-700 dark:text-brand-300">
            ⚜ Data is stored securely in MongoDB and synced in real-time across devices.
          </div>
        </div>
      </div>

      {/* Business Info */}
      <div className="card">
        <div className="card-header">⚜ Business Information</div>
        <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            ['Business Name',CO.name],
            ['Proprietor',CO.owner],
            ['Phone',CO.phone],
            ['Address',CO.addr+', Sulur'],
            ['State Code',CO.stateCode+' — Tamil Nadu'],
            ['Bank',bankName || 'Not set'],
            ['Branch',bankBranch || 'Not set'],
            ['Account Number',accountNo || 'Not set'],
            ['IFSC Code',ifsc || 'Not set'],
            ['A/C Holder',accountHolder || 'Not set'],
            ['Financial Year',getFY()],
          ].map(([l,v]) => (
            <div key={l} className="p-3 bg-gray-50 dark:bg-brand-800 border border-gray-100 dark:border-brand-700 rounded">
              <div className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mb-1">{l}</div>
              <div className="text-sm font-bold text-gray-800 dark:text-white">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
