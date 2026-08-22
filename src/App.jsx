import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Layout from './components/Layout';
import { AuthContext, useAuthProvider } from './lib/auth';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Permit search — the app
import Home from './pages/Home';
import PermitGuide from './pages/PermitGuide';
import PermitInfo from './pages/PermitInfo';
import CameraScan from './pages/CameraScan';
import PropertyLookup from './pages/PropertyLookup';
import Contractors from './pages/Contractors';

// Supporting answers, reached from a permit rather than the top nav
import FeeCalculator from './pages/FeeCalculator';
import ExemptionChecker from './pages/ExemptionChecker';

// Admin — permit data maintenance, sign-in only exists to reach these
import AuthSignIn from './pages/AuthSignIn';
import ForgotPassword from './pages/ForgotPassword';
import AdminPanel from './pages/AdminPanel.jsx';
import AdminHealth from './pages/AdminHealth.jsx';
import AdminPermitRecords from './pages/AdminPermitRecords.jsx';
import AdminCityManager from './pages/AdminCityManager.jsx';

// Legal / info
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import TermsOfService from './pages/TermsOfService.jsx';
import Accessibility from './pages/Accessibility.jsx';

const LayoutWrapper = ({ children, currentPageName }) =>
  <Layout currentPageName={currentPageName}>{children}</Layout>;

function AuthProvider({ children }) {
  const auth = useAuthProvider();
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* ── PERMIT SEARCH ── */}
            <Route path="/" element={<LayoutWrapper currentPageName="Home"><Home /></LayoutWrapper>} />
            <Route path="/PermitGuide" element={<LayoutWrapper currentPageName="PermitGuide"><PermitGuide /></LayoutWrapper>} />
            <Route path="/PermitInfo" element={<LayoutWrapper currentPageName="PermitInfo"><PermitInfo /></LayoutWrapper>} />
            <Route path="/CameraScan" element={<LayoutWrapper currentPageName="CameraScan"><CameraScan /></LayoutWrapper>} />
            <Route path="/property" element={<LayoutWrapper currentPageName="PropertyLookup"><PropertyLookup /></LayoutWrapper>} />
            <Route path="/contractors" element={<LayoutWrapper currentPageName="Contractors"><Contractors /></LayoutWrapper>} />

            {/* ── PERMIT ANSWERS (linked from permit detail, not the nav) ── */}
            <Route path="/FeeCalculator" element={<LayoutWrapper currentPageName="FeeCalculator"><FeeCalculator /></LayoutWrapper>} />
            <Route path="/ExemptionChecker" element={<LayoutWrapper currentPageName="ExemptionChecker"><ExemptionChecker /></LayoutWrapper>} />

            {/* ── LEGAL ── */}
            <Route path="/privacy" element={<LayoutWrapper currentPageName="PrivacyPolicy"><PrivacyPolicy /></LayoutWrapper>} />
            <Route path="/terms" element={<LayoutWrapper currentPageName="TermsOfService"><TermsOfService /></LayoutWrapper>} />
            <Route path="/accessibility" element={<LayoutWrapper currentPageName="Accessibility"><Accessibility /></LayoutWrapper>} />

            {/* ── ADMIN (unlinked; the only place auth is used) ── */}
            <Route path="/login" element={<AuthSignIn />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            <Route path="/admin/health" element={<LayoutWrapper currentPageName="AdminHealth"><ProtectedRoute><AdminHealth /></ProtectedRoute></LayoutWrapper>} />
            <Route path="/AdminPermitRecords" element={<LayoutWrapper currentPageName="AdminPermitRecords"><ProtectedRoute><AdminPermitRecords /></ProtectedRoute></LayoutWrapper>} />
            <Route path="/admin-city-manager" element={<LayoutWrapper currentPageName="AdminCityManager"><ProtectedRoute><AdminCityManager /></ProtectedRoute></LayoutWrapper>} />

            {/* ── CATCH ALL ── */}
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App
