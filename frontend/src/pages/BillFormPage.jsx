import { useParams, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { billService } from '../services/billService'
import BillForm from '../components/bills/BillForm'
import Spinner from '../components/ui/Spinner'

export default function BillFormPage() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const isEdit = pathname.endsWith('/edit') && !!id

  const { data, isLoading } = useQuery({
    queryKey: ['bill', id],
    queryFn:  () => billService.getOne(id),
    enabled:  isEdit,
  })

  if (isEdit && isLoading) return (
    <div className="flex items-center justify-center h-64"><Spinner size={28} className="text-gold-400" /></div>
  )

  return <BillForm editData={isEdit ? data?.bill : null} key={isEdit ? id : 'new'} />
}
