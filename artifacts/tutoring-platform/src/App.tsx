import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PreferencesProvider } from "@/lib/preferences";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Onboarding from "@/pages/Onboarding";
import CurriculumMap from "@/pages/CurriculumMap";
import Library from "@/pages/Library";
import DocumentView from "@/pages/DocumentView";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Terms from "@/pages/Terms";
import Faq from "@/pages/Faq";
import AdminDocumentList from "@/pages/admin/DocumentList";
import AdminDocumentEditor from "@/pages/admin/DocumentEditor";
import AdminSettings from "@/pages/admin/Settings";
import AdminUsers from "@/pages/admin/Users";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/map" component={CurriculumMap} />
      <Route path="/library" component={Library} />
      <Route path="/documents/:slug" component={DocumentView} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={Terms} />
      <Route path="/faq" component={Faq} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/documents/:id" component={AdminDocumentEditor} />
      <Route path="/admin/documents" component={AdminDocumentList} />
      <Route path="/admin" component={AdminDocumentList} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  );
}

export default App;
