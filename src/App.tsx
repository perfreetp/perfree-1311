import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Preparation from '@/pages/Preparation'
import Patrol from '@/pages/Patrol'
import Service from '@/pages/Service'
import Catering from '@/pages/Catering'
import Incident from '@/pages/Incident'
import Handover from '@/pages/Handover'
import Statistics from '@/pages/Statistics'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/preparation" replace />} />
          <Route path="preparation" element={<Preparation />} />
          <Route path="patrol" element={<Patrol />} />
          <Route path="service" element={<Service />} />
          <Route path="catering" element={<Catering />} />
          <Route path="incident" element={<Incident />} />
          <Route path="handover" element={<Handover />} />
          <Route path="statistics" element={<Statistics />} />
        </Route>
      </Routes>
    </Router>
  )
}
