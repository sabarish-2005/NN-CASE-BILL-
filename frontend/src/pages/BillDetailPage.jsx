import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Printer, Share2, Edit2, Copy, Download } from 'lucide-react'
import { billService } from '../services/billService'
import { renderBillHTML } from '../components/bills/PrintBill'
import { useAuthStore } from '../store/authStore'
import { printBillDocument, shareWhatsApp } from '../utils'
import Spinner from '../components/ui/Spinner'

export default function BillDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({ queryKey:['bill',id], queryFn:()=>billService.getOne(id) })

  const dupMut = useMutation({
    mutationFn: billService.duplicate,
    onSuccess: (res) => { qc.invalidateQueries({queryKey:['bills']}); toast.success('Bill duplicated!'); navigate(`/bills/${res.bill._id}`) },
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size={28} className="text-gold-400" /></div>

  const bill = data?.bill
  if (!bill) return <div className="text-center py-20 text-gray-400">Bill not found</div>

  const handlePrint = () => {
    printBillDocument(renderBillHTML(bill, user?.settings||{}))
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl mx-auto">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => navigate('/bills')} className="btn-ghost gap-1.5"><ArrowLeft size={14}/> Back</button>
        <button onClick={handlePrint} className="btn-gold gap-1.5"><Printer size={14}/> Print / PDF</button>
        <button onClick={() => shareWhatsApp(bill)} className="btn gap-1.5 bg-[#25d366] text-white hover:bg-[#1ea854]"><Share2 size={14}/> WhatsApp</button>
        <button onClick={() => navigate(`/bills/${id}/edit`)} className="btn-ghost gap-1.5"><Edit2 size={14}/> Edit</button>
        <button onClick={() => dupMut.mutate(id)} className="btn-ghost gap-1.5"><Copy size={14}/> Duplicate</button>
      </div>

      <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200"
        dangerouslySetInnerHTML={{ __html: renderBillHTML(bill, user?.settings||{}) }} />
    </div>
  )
}
