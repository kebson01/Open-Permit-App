import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Layout from './layout.jsx';

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

// Admin
import AdminPanel from './pages/AdminPanel.jsx';
import AdminHealth from './pages/AdminHealth.jsx';
import AdminPermitRecords from './pages/AdminPermitRecords.jsx';

// Legacy / other
import ProjectDashboard from './pages/ProjectDashboard.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import PermitWizard from './pages/PermitWizard.jsx';
import ARTools from './pages/ARTools.jsx';
import SubmissionGuide from './pages/SubmissionGuide';
import CityPortalPublic from './pages/CityPortalPublic';

const LayoutWrapper = ({ children, currentPageName }) =>
  <Layout currentPageName={currentPageName}>{children}</Layout>;

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          {/* ── PRIMARY NAVIGATION ── */}
          <Route path="/" element={<LayoutWrapper currentPageName="Home"><HomeDashboard /></LayoutWrapper>} />
          <Route path="/MyProperties" element={<LayoutWrapper currentPageName="MyProperties"><MyProperties /></LayoutWrapper>} />
          <Route path="/ApplyForPermit" element={<LayoutWrapper currentPageName="ApplyForPermit"><ApplyForPermit /></LayoutWrapper>} />
          <Route path="/MyProjects" element={<LayoutWrapper currentPageName="MyProjects"><MyProjects /></LayoutWrapper>} />
          <Route path="/MyAccount" element={<LayoutWrapper currentPageName="MyAccount"><MyAccount /></LayoutWrapper>} />

          {/* ── TOOLS ── */}
          <Route path="/FeeCalculator" element={<LayoutWrapper currentPageName="FeeCalculator"><FeeCalculator /></LayoutWrapper>} />
          <Route path="/ExemptionChecker" element={<LayoutWrapper currentPageName="ExemptionChecker"><ExemptionChecker /></LayoutWrapper>} />
          <Route path="/BuildingCodes" element={<LayoutWrapper currentPageName="BuildingCodes"><BuildingCodes /></LayoutWrapper>} />
          <Route path="/PropertyGuide" element={<LayoutWrapper currentPageName="PropertyGuide"><PropertyGuide /></LayoutWrapper>} />

          {/* ── ADMIN ── */}
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/health" element={<LayoutWrapper currentPageName="AdminHealth"><AdminHealth /></LayoutWrapper>} />
          <Route path="/AdminPermitRecords" element={<LayoutWrapper currentPageName="AdminPermitRecords"><AdminPermitRecords /></LayoutWrapper>} />

          {/* ── LEGACY / KEEP ALIVE ── */}
          <Route path="/SubmissionGuide" element={<LayoutWrapper currentPageName="SubmissionGuide"><SubmissionGuide /></LayoutWrapper>} />
          <Route path="/ProjectDashboard" element={<LayoutWrapper currentPageName="ProjectDashboard"><ProjectDashboard /></LayoutWrapper>} />
          <Route path="/ProjectDetail" element={<LayoutWrapper currentPageName="ProjectDetail"><ProjectDetail /></LayoutWrapper>} />
          <Route path="/PermitWizard" element={<LayoutWrapper currentPageName="PermitWizard"><PermitWizard /></LayoutWrapper>} />
          <Route path="/ar-tools" element={<LayoutWrapper currentPageName="ARTools"><ARTools /></LayoutWrapper>} />
          <Route path="/CityPortalPublic" element={<CityPortalPublic />} />

          {/* ── CATCH ALL ── */}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App