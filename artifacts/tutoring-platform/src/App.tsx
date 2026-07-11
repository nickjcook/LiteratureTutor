import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Onboarding from "@/pages/Onboarding";
import CurriculumMap from "@/pages/CurriculumMap";
import Library from "@/pages/Library";
import DocumentView from "@/pages/DocumentView";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import AdminDocumentList from "@/pages/admin/DocumentList";
import AdminDocumentEditor from "@/pages/admin/DocumentEditor";

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
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
