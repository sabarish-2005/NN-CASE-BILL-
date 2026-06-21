import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import BillFormPage from './pages/BillFormPage'
import BillHistoryPage from './pages/BillHistoryPage'
import BillDetailPage from './pages/BillDetailPage'
import CustomersPage from './pages/CustomersPage'
import ProductsPage from './pages/ProductsPage'
import SettingsPage from './pages/SettingsPage'
import LaborsPage from './pages/LaborsPage'

export default function App() {
  return (
    <>
      {/* Hidden print portal — bills render here for printing */}
      <div id="print-portal"></div>

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/bills" element={<BillHistoryPage />} />
          <Route path="/bills/new" element={<BillFormPage />} />
          <Route path="/bills/:id" element={<BillDetailPage />} />
          <Route path="/bills/:id/edit" element={<BillFormPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/labors" element={<LaborsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}
