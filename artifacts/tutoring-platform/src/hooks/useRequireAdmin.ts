import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetAdminStatus, getGetAdminStatusQueryKey } from "@workspace/api-client-react";

// CMS role gate: membership in the platform_admins table, checked server-side
// on every admin route regardless of this client-side redirect.
export function useRequireAdmin() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, isLoading: statusLoading } = useGetAdminStatus({
    query: { enabled: isAuthenticated, queryKey: getGetAdminStatusQueryKey() },
  });

  const isChecking = authLoading || (isAuthenticated && statusLoading);
  const isAdmin = !!data?.isAdmin;

  useEffect(() => {
    if (isChecking) return;
    if (!isAuthenticated || !isAdmin) {
      navigate("/");
    }
  }, [isChecking, isAuthenticated, isAdmin, navigate]);

  return { isReady: !isChecking && isAuthenticated && isAdmin, isChecking };
}
