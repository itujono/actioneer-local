import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { Toaster } from "sonner";
import "./index.css";

// Import all routes
import { rootRoute } from "./routes/root";
import { indexRoute } from "./routes/index";
import { authRoute } from "./routes/auth";
import { dashboardRoute } from "./routes/dashboard";
import { financeRoute } from "./routes/finance";
import { travelRoute } from "./routes/travel";
import { travelDetailRoute } from "./routes/travel.$id";
import { jobsRoute } from "./routes/jobs";
import { settingsRoute } from "./routes/settings";

// Create the query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Create the router instance
const routeTree = rootRoute.addChildren([
  indexRoute,
  authRoute,
  dashboardRoute,
  financeRoute,
  travelRoute,
  travelDetailRoute,
  jobsRoute,
  settingsRoute,
]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

// Register the router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  </StrictMode>
);
