import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import PropertyGuide from './pages/PropertyGuide';
import AdminPermitRecords from './pages/AdminPermitRecords.jsx';
import ProjectDashboard from './pages/ProjectDashboard.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import PermitWizard from './pages/PermitWizard.jsx';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route path="/" element={
            <LayoutWrapper currentPageName={mainPageKey}>
              <MainPage />
            </LayoutWrapper>
          } />
          {Object.entries(Pages).map(([path, Page]) => (
            <Route
              key={path}
              path={`/${path}`}
              element={
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              }
            />
          ))}
          <Route path="/PropertyGuide" element={<LayoutWrapper currentPageName="PropertyGuide"><PropertyGuide /></LayoutWrapper>} />
          <Route path="/AdminPermitRecords" element={<LayoutWrapper currentPageName="AdminPermitRecords"><AdminPermitRecords /></LayoutWrapper>} />
          <Route path="/ProjectDashboard" element={<LayoutWrapper currentPageName="ProjectDashboard"><ProjectDashboard /></LayoutWrapper>} />
          <Route path="/ProjectDetail" element={<LayoutWrapper currentPageName="ProjectDetail"><ProjectDetail /></LayoutWrapper>} />
          <Route path="/PermitWizard" element={<LayoutWrapper currentPageName="PermitWizard"><PermitWizard /></LayoutWrapper>} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App