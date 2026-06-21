import { useAuthStore } from '../../store/authStore'
import { renderBillHTML } from './PrintBill'
import { X, Printer, Share2 } from 'lucide-react'
import { printBillDocument, shareWhatsApp } from '../../utils'

export default function BillPreview({ bill, onClose }) {
  const { user } = useAuthStore()
  const settings = user?.settings || {}

  const handlePrint = () => {
    printBillDocument(renderBillHTML(bill, settings))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 animate-fade-in">
      <div className="w-full max-w-4xl my-6">
        <div className="flex items-center justify-between mb-3 sticky top-0 bg-brand-900 rounded-lg px-4 py-2.5 border border-gold-500/30">
          <div className="text-gold-400 font-bold text-sm">⚜ Bill Preview</div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="btn-gold btn-sm gap-1.5"><Printer size={13}/> Print</button>
            <button onClick={() => shareWhatsApp(bill)} className="btn btn-sm gap-1.5 bg-[#25d366] text-white"><Share2 size={13}/> WhatsApp</button>
            <button onClick={onClose} className="btn-icon !p-1.5 bg-brand-800 text-brand-300 hover:text-white"><X size={16}/></button>
          </div>
        </div>
        <div className="bg-white rounded-lg overflow-hidden shadow-2xl" dangerouslySetInnerHTML={{ __html: renderBillHTML(bill, settings) }} />
      </div>
    </div>
  )
}
