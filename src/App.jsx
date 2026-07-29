import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CustomerOrder from './pages/CustomerOrder.jsx'
import Admin from './pages/Admin.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerOrder />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
