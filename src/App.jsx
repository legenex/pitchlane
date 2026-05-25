import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Onboarding from './pages/Onboarding';
import ClientLayout from '@/components/layouts/ClientLayout.jsx';
import Dashboard from './pages/app/Dashboard';
import Knowledge from './pages/app/Knowledge';
import ClientSettings from './pages/app/Settings';
import Artifacts from './pages/app/Artifacts';
import ArtifactNew from './pages/app/ArtifactNew';
import ArtifactEdit from './pages/app/ArtifactEdit';
import ArtifactAnalytics from './pages/app/ArtifactAnalytics';
import Prospects from './pages/app/Prospects';
import ProspectDetail from './pages/app/ProspectDetail';
import AudienceRequestForm from './pages/app/AudienceRequestForm';
import AudienceRequestHistory from './pages/app/AudienceRequestHistory';
import AudienceRequestDetail from './pages/app/AudienceRequestDetail';
import Credits from './pages/app/Credits';
import Billing from './pages/app/Billing';
import BillingSuccess from './pages/app/BillingSuccess';
import BillingCancel from './pages/app/BillingCancel';
import Notifications from './pages/app/Notifications';
import ProspectImport from './pages/app/ProspectImport';
import AdminLayout from '@/components/layouts/AdminLayout.jsx';
import AdminOverview from './pages/admin/Overview';
import AdminClients from './pages/admin/Clients';
import AdminPlans from './pages/admin/Plans';
import AdminSettings from './pages/admin/Settings';
import ClientArtifacts from './pages/admin/ClientArtifacts';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AudienceRequests from './pages/admin/AudienceRequests';
import AudienceRequestFulfill from './pages/admin/AudienceRequestFulfill';
import AdminProspects from './pages/admin/AdminProspects';
import EmailDeliverability from './pages/admin/EmailDeliverability';
import BillingHealth from './pages/admin/BillingHealth';
import AuditLog from './pages/admin/AuditLog';
import ArtifactViewer from './pages/public/ArtifactViewer';
import Home from './pages/Home';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/app/onboarding" element={<Onboarding />} />

      {/* Public artifact viewer — no auth required */}
      <Route path="/p/:slug" element={<ArtifactViewer />} />

      {/* Client app */}
      <Route element={<ClientLayout />}>
        <Route path="/app" element={<Dashboard />} />
        <Route path="/app/knowledge" element={<Knowledge />} />
        <Route path="/app/settings" element={<ClientSettings />} />
        <Route path="/app/artifacts" element={<Artifacts />} />
        <Route path="/app/artifacts/new" element={<ArtifactNew />} />
        <Route path="/app/artifacts/:id/edit" element={<ArtifactEdit />} />
        <Route path="/app/artifacts/:id/analytics" element={<ArtifactAnalytics />} />
        <Route path="/app/prospects" element={<Prospects />} />
        <Route path="/app/prospects/request" element={<AudienceRequestForm />} />
        <Route path="/app/prospects/requests" element={<AudienceRequestHistory />} />
        <Route path="/app/prospects/requests/:id" element={<AudienceRequestDetail />} />
        <Route path="/app/prospects/import" element={<ProspectImport />} />
        <Route path="/app/prospects/:id" element={<ProspectDetail />} />
        <Route path="/app/credits" element={<Credits />} />
        <Route path="/app/billing" element={<Billing />} />
        <Route path="/app/billing/checkout/success" element={<BillingSuccess />} />
        <Route path="/app/billing/checkout/cancel" element={<BillingCancel />} />
        <Route path="/app/notifications" element={<Notifications />} />
      </Route>

      {/* Admin */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/clients" element={<AdminClients />} />
        <Route path="/admin/clients/:slug/artifacts" element={<ClientArtifacts />} />
        <Route path="/admin/plans" element={<AdminPlans />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/audience-requests" element={<AudienceRequests />} />
        <Route path="/admin/audience-requests/:id" element={<AudienceRequestFulfill />} />
        <Route path="/admin/prospects" element={<AdminProspects />} />
        <Route path="/admin/email-deliverability" element={<EmailDeliverability />} />
        <Route path="/admin/billing" element={<BillingHealth />} />
        <Route path="/admin/audit-log" element={<AuditLog />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App