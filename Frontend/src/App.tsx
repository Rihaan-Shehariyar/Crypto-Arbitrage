import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedSubscriptionRoute } from '@/components/auth/ProtectedSubscriptionRoute';
import Landing from '@/pages/Landing';
import Pricing from '@/pages/Pricing';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Portfolio from '@/pages/Portfolio';
import Transactions from '@/pages/Transactions';
import Opportunities from '@/pages/Opportunities';
import Login from '@/pages/Login';
import { useAuthStore } from '@/store/useAuthStore';

import { WebSocketProvider } from '@/contexts/WebSocketContext';

function RootRoute() {
  const token = useAuthStore((state) => state.token);
  const subscriptionActive = useAuthStore((state) => state.subscriptionActive);

  if (token && subscriptionActive) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Landing />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Marketing & Sales Funnel Pages */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Real-Time Trading Terminal Workspace */}
        <Route path="/*" element={
          <ProtectedSubscriptionRoute>
            <WebSocketProvider>
              <MainLayout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/opportunities" element={<Opportunities />} />
                  <Route path="/portfolio" element={<Portfolio />} />
                  <Route path="/transactions" element={<Transactions />} />
                </Routes>
              </MainLayout>
            </WebSocketProvider>
          </ProtectedSubscriptionRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
