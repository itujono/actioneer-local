import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import Layout from "../components/layout/Layout";
import { useAuth } from "../hooks/useAuth";

function RootComponent() {
  // Use the existing useAuth hook instead of managing auth state separately
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-concrete">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-heliotrope"></div>
      </div>
    );
  }

  return (
    <>
      <Layout isAuthenticated={isAuthenticated}>
        <Outlet />
      </Layout>
      {process.env.NODE_ENV === "development" && <TanStackRouterDevtools />}
    </>
  );
}

export const rootRoute = createRootRoute({
  component: RootComponent,
});
