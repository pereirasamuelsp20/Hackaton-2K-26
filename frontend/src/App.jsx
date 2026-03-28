import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAppStore from './store/useAppStore';
import { useEffect } from 'react';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';

// Dashboards
import AdminDashboard from './pages/dashboards/AdminDashboard';
import DoctorDashboard from './pages/dashboards/DoctorDashboard';
import NurseDashboard from './pages/dashboards/NurseDashboard';
import CleaningDashboard from './pages/dashboards/CleaningDashboard';

function App() {
  const { user, initSocket } = useAppStore();

  useEffect(() => {
    if (user) {
      initSocket();
    }
  }, [user, initSocket]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        {user && (
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={
              (() => {
                const role = user.role?.toUpperCase();
                if (role === 'ADMINISTRATOR' || role === 'ADMIN') return <AdminDashboard />;
                if (role === 'DOCTOR') return <DoctorDashboard />;
                if (role === 'NURSE') return <NurseDashboard />;
                if (role === 'CLEANING STAFF' || role === 'CLEANING') return <CleaningDashboard />;
                return <Navigate to="/" replace />;
              })()
            } />
          </Route>
        )}
        
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
