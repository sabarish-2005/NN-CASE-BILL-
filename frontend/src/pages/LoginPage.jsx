import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'

export default function LoginPage() {
  const { login, isAuth } = useAuthStore()
  const { dark } = useUIStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    if (isAuth) navigate('/dashboard')
  }, [dark, isAuth])

  const onSubmit = async ({ email, password }) => {
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (e) {
      toast.error(e.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-brand-950 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage:'radial-gradient(circle at 25% 25%, #c9a227 0%, transparent 50%), radial-gradient(circle at 75% 75%, #0a2e1a 0%, transparent 50%)' }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3 drop-shadow-lg">⚜</div>
          <h1 className="text-2xl font-black tracking-widest text-gold-400">NACHIMUTHU NATRAYAN</h1>
          <p className="text-xs text-brand-400 tracking-widest mt-1">BILLING SYSTEM v2.0</p>
          <div className="h-px bg-gradient-to-r from-transparent via-gold-600 to-transparent mt-4" />
        </div>

        {/* Card */}
        <div className="bg-brand-900 border border-brand-700 rounded-xl p-6 shadow-2xl shadow-black/50">
          <h2 className="text-base font-bold text-white mb-5">Sign In to Continue</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input type="email" className="inp"
                placeholder="sabarish@nn.com"
                {...register('email', { required: 'Email required', pattern: { value:/\S+@\S+\.\S+/, message:'Valid email required' } })} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="inp pr-10"
                  placeholder="••••••••"
                  {...register('password', { required: 'Password required', minLength:{value:6,message:'Min 6 characters'} })} />
                <button type="button" onClick={() => setShowPw(p=>!p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-gold-400">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="btn-gold w-full justify-center py-2.5 mt-2 text-sm disabled:opacity-60">
              {loading ? <span className="animate-pulse">Signing in...</span> : <><LogIn size={15} /> Sign In</>}
            </button>
          </form>

          <div className="mt-4 p-3 bg-brand-800 rounded text-xs text-brand-400 border border-brand-700">
            <strong className="text-gold-600">Default:</strong> sabarish@nn.com / sabarish123
          </div>
        </div>

        <p className="text-center text-[10px] text-brand-600 mt-6 tracking-wider">
          GROW BAG & OPEN TOP COVER CUTTING · SULUR - 641658
        </p>
      </div>
    </div>
  )
}
