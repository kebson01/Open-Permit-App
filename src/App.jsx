import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Layout from './components/Layout';
import { AuthContext, useAuthProvider } from './lib/auth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ForgotPassword from './pages/ForgotPassword';
import AuthSignIn from './pages/AuthSignIn';
import AuthSignUp from './pages/AuthSignUp';

// Core pages
import HomeDashboard from './pages/HomeDashboard';
import MyProperties from './pages/MyProperties';
import ApplyForPermit from './pages/ApplyForPermit';
import MyProjects from './pages/MyProjects';
import MyAccount from './pages/MyAccount';

// Tools
import FeeCalculator from './pages/FeeCalculator';
import ExemptionChecker from './pages/ExemptionChecker';
import BuildingCodes from './pages/BuildingCodes';
import PropertyGuide from './pages/PropertyGuide';
import PermitGuide from './pages/PermitGuide';

// Projects & Tools
import ProjectsPage from './pages/ProjectsPage';
import BuildingCodesPage from './pages/BuildingCodesPage';
import ExemptionCheckerV2 from './pages/ExemptionCheckerV2';

// Private Provider
import ProviderDirectory from './pages/ProviderDirectory';
import ProviderRegister from './pages/ProviderRegister';
import ProviderDashboard from './pages/ProviderDashboard';

// Admin
import AdminPanel from './pages/AdminPanel.jsx';
import AdminHealth from './pages/AdminHealth.jsx';
import AdminPermitRecords from './pages/AdminPermitRecords.jsx';

// Legacy / other
import ProjectDetail from './pages/ProjectDetail.jsx';
import PermitWizard from './pages/PermitWizard.jsx';
import ARTools from './pages/ARTools.jsx';
import CameraScan from './pages/CameraScan.jsx';
import SubmissionGuide from './pages/SubmissionGuide';

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
            {/* ── PUBLIC ── */}
            <Route path="/" element={<LayoutWrapper currentPageName="Home"><HomeDashboard /></LayoutWrapper>} />
            <Route path="/MyProperties" element={<LayoutWrapper currentPageName="MyProperties"><MyProperties /></LayoutWrapper>} />
            <Route path="/FeeCalculator" element={<LayoutWrapper currentPageName="FeeCalculator"><FeeCalculator /></LayoutWrapper>} />
            <Route path="/ExemptionChecker" element={<LayoutWrapper currentPageName="ExemptionChecker"><ExemptionChecker /></LayoutWrapper>} />
            <Route path="/BuildingCodes" element={<LayoutWrapper currentPageName="BuildingCodes"><BuildingCodes /></LayoutWrapper>} />
            <Route path="/PropertyGuide" element={<LayoutWrapper currentPageName="PropertyGuide"><PropertyGuide /></LayoutWrapper>} />
            <Route path="/PermitGuide" element={<LayoutWrapper currentPageName="PermitGuide"><PermitGuide /></LayoutWrapper>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/login" element={<AuthSignIn />} />
            <Route path="/auth/login" element={<AuthSignIn />} />
            <Route path="/signup" element={<AuthSignUp />} />
            <Route path="/auth/signup" element={<AuthSignUp />} />

            {/* ── PROTECTED ── */}
            <Route path="/ApplyForPermit" element={<LayoutWrapper currentPageName="ApplyForPermit"><ProtectedRoute><ApplyForPermit /></ProtectedRoute></LayoutWrapper>} />
            <Route path="/MyProjects" element={<LayoutWrapper currentPageName="MyProjects"><ProtectedRoute><MyProjects /></ProtectedRoute></LayoutWrapper>} />
            <Route path="/MyAccount" element={<LayoutWrapper currentPageName="MyAccount"><ProtectedRoute><MyAccount /></ProtectedRoute></LayoutWrapper>} />

            {/* ── ADMIN ── */}
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            <Route path="/admin/health" element={<LayoutWrapper currentPageName="AdminHealth"><ProtectedRoute><AdminHealth /></ProtectedRoute></LayoutWrapper>} />
            <Route path="/AdminPermitRecords" element={<LayoutWrapper currentPageName="AdminPermitRecords"><ProtectedRoute><AdminPermitRecords /></ProtectedRoute></LayoutWrapper>} />

            {/* ── PROJECTS & TOOLS ── */}
            <Route path="/tools/exemption-checker" element={<LayoutWrapper currentPageName="ExemptionChecker"><ExemptionCheckerV2 /></LayoutWrapper>} />
            <Route path="/projects" element={<LayoutWrapper currentPageName="ProjectsPage"><ProjectsPage /></LayoutWrapper>} />
            <Route path="/tools/building-codes" element={<LayoutWrapper currentPageName="BuildingCodesPage"><BuildingCodesPage /></LayoutWrapper>} />

            {/* ── PRIVATE PROVIDERS ── */}
            <Route path="/providers" element={<LayoutWrapper currentPageName="ProviderDirectory"><ProviderDirectory /></LayoutWrapper>} />
            <Route path="/provider-register" element={<LayoutWrapper currentPageName="ProviderRegister"><ProviderRegister /></LayoutWrapper>} />
            <Route path="/provider-dashboard" element={<LayoutWrapper currentPageName="ProviderDashboard"><ProviderDashboard /></LayoutWrapper>} />

            {/* ── LEGACY ── */}
            <Route path="/SubmissionGuide" element={<LayoutWrapper currentPageName="SubmissionGuide"><SubmissionGuide /></LayoutWrapper>} />
            <Route path="/ProjectDetail" element={<LayoutWrapper currentPageName="ProjectDetail"><ProjectDetail /></LayoutWrapper>} />
            <Route path="/PermitWizard" element={<LayoutWrapper currentPageName="PermitWizard"><PermitWizard /></LayoutWrapper>} />
            <Route path="/ar-tools" element={<LayoutWrapper currentPageName="ARTools"><ARTools /></LayoutWrapper>} />
            <Route path="/CameraScan" element={<LayoutWrapper currentPageName="CameraScan"><CameraScan /></LayoutWrapper>} />

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