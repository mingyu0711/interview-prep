import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SetupPage from './pages/SetupPage'
import SessionPage from './pages/SessionPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SetupPage />} />
        <Route path="/session" element={<SessionPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
