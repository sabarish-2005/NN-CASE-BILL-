import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = process.env.REACT_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.message || err.message || 'Something went wrong'
    if (err.response?.status === 401) {
      localStorage.removeItem('nn-auth')
      window.location.href = '/login'
    } else if (err.response?.status >= 500) {
      toast.error('Server error. Please try again.')
    }
    return Promise.reject(new Error(msg))
  }
)

export default api
