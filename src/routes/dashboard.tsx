import { createRoute, Link } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { useQuery } from "@tanstack/react-query";
import {
  ReceiptIcon,
  PlaneIcon,
  BriefcaseIcon,
  Calendar,
  DollarSign,
} from "lucide-react";
import { supabase } from "../supabase/client";
import { useAuth } from "../hooks/useAuth";
import DashboardCard from "../components/dashboard/DashboardCard";
import RecentActivityCard from "../components/dashboard/RecentActivityCard";
import { formatDistanceToNow } from "date-fns";

export const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: Dashboard,
  notFoundComponent: () => (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-bold text-black">Are you lost?</h1>
        <p className="text-sm text-black">
          The page you are looking for does not exist.
        </p>
        <Link to="/" className="text-sm text-black">
          Go back to the home page
        </Link>
      </div>
    </div>
  ),
});

function Dashboard() {
  // Use TanStack Query for auth management
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  // Fetch recent emails only when authenticated
  const { data: recentEmails, isLoading: emailsLoading } = useQuery({
    queryKey: ["recent-emails", user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("emails")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!user && !authLoading, // Only run when user is authenticated
  });

  // Fetch receipt summary only when authenticated
  const { data: receiptsSummary, isLoading: receiptsLoading } = useQuery({
    queryKey: ["receipts-summary", user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("receipts")
        .select("*")
        .order("date", { ascending: false })
        .limit(5);

      if (error) throw error;

      // Calculate total spending
      const total = data.reduce((sum, receipt) => sum + receipt.amount, 0);

      return {
        total,
        recentReceipts: data,
      };
    },
    enabled: !!user && !authLoading, // Only run when user is authenticated
  });

  // Fetch travel data only when authenticated
  const { data: travelData, isLoading: travelLoading } = useQuery({
    queryKey: ["travel-summary", user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("travel")
        .select("*")
        .order("start_date", { ascending: true })
        .limit(5);

      if (error) throw error;

      // Find upcoming trips
      const now = new Date();
      const upcomingTrips = data.filter(
        (trip) => new Date(trip.start_date) > now
      );

      return {
        upcomingTrips,
        recentTrips: data,
      };
    },
    enabled: !!user && !authLoading, // Only run when user is authenticated
  });

  // Fetch job applications
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["jobs-summary", user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .order("applied_date", { ascending: false })
        .limit(5);

      if (error) throw error;

      return {
        totalApplications: data.length,
        recentApplications: data,
      };
    },
    enabled: !!user && !authLoading, // Only run when user is authenticated
  });

  // Show auth loading state
  if (authLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-heliotrope"></div>
            <p className="mt-2 text-sm text-thunder">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while redirect happens
  if (!user) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-heliotrope"></div>
            <p className="mt-2 text-thunder">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-bold text-black">Dashboard</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Welcome Banner */}
        <div className="rounded-lg shadow-md overflow-hidden mt-6">
          <div className="bg-heliotrope px-6 py-5 sm:px-8 sm:py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Welcome back, {user?.email?.split("@")[0] || "User"}!
                </h2>
                <p className="mt-1 text-sm text-white/80">
                  Your inbox is being monitored for actionable emails. Here's a
                  summary of your recent activity.
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-heliotrope/20 bg-daisy px-6 py-2">
            <div className="text-sm text-white/90">
              Pro tip: Use the Gmail add-on to see smart actions right in your
              inbox.
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            title="Receipts & Expenses"
            value={
              receiptsLoading
                ? "..."
                : `$${receiptsSummary?.total.toFixed(2) || "0.00"}`
            }
            description="Total spending tracked"
            icon={<ReceiptIcon className="h-6 w-6" />}
            iconBackground="bg-indigo-500"
            link="/receipts"
          />

          <DashboardCard
            title="Travel Plans"
            value={
              travelLoading
                ? "..."
                : travelData?.upcomingTrips.length.toString() || "0"
            }
            description="Upcoming trips"
            icon={<PlaneIcon className="h-6 w-6" />}
            iconBackground="bg-teal-500"
            link="/travel"
          />

          <DashboardCard
            title="Job Applications"
            value={
              jobsLoading
                ? "..."
                : jobsData?.totalApplications.toString() || "0"
            }
            description="Active applications"
            icon={<BriefcaseIcon className="h-6 w-6" />}
            iconBackground="bg-amber-500"
            link="/jobs"
          />
        </div>

        {/* Recent Activity */}
        <h2 className="text-lg font-medium text-black mt-8">Recent Activity</h2>
        <div className="mt-2 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <div className="bg-white">
            {emailsLoading ? (
              <div className="py-12 text-center text-concrete">
                Loading recent activity...
              </div>
            ) : recentEmails?.length ? (
              <ul className="divide-y divide-concrete">
                {recentEmails.map((email) => (
                  <RecentActivityCard
                    key={email.id}
                    title={email.subject}
                    description={email.from_email}
                    type={email.classification}
                    date={formatDistanceToNow(new Date(email.created_at), {
                      addSuffix: true,
                    })}
                  />
                ))}
              </ul>
            ) : (
              <div className="py-12 text-center text-concrete">
                No recent activity to show
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events and Pending Actions */}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Upcoming Events */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg font-medium text-black">
                Upcoming Events
              </h3>
              <Calendar className="h-5 w-5 text-concrete" />
            </div>
            <div className="border-t border-concrete px-4 py-5 sm:p-6">
              {travelLoading ? (
                <div className="py-8 text-center text-concrete">
                  Loading events...
                </div>
              ) : travelData?.upcomingTrips.length ? (
                <ul className="divide-y divide-concrete">
                  {travelData.upcomingTrips.map((trip) => (
                    <li key={trip.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-jade/10 flex items-center justify-center">
                            <PlaneIcon className="h-6 w-6 text-jade" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-black truncate">
                            {trip.type} to {trip.destination}
                          </p>
                          <p className="text-sm text-black truncate">
                            {new Date(trip.start_date).toLocaleDateString()} -{" "}
                            {new Date(trip.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <a
                            href={`/travel/${trip.id}`}
                            className="inline-flex items-center shadow-sm px-2.5 py-0.5 border border-concrete text-sm leading-5 font-medium rounded-full text-black bg-white hover:bg-concrete"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-8 text-center text-concrete">
                  No upcoming events
                </div>
              )}
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg font-medium text-black">
                Recent Expenses
              </h3>
              <DollarSign className="h-5 w-5 text-concrete" />
            </div>
            <div className="border-t border-concrete px-4 py-5 sm:p-6">
              {receiptsLoading ? (
                <div className="py-8 text-center text-concrete">
                  Loading expenses...
                </div>
              ) : receiptsSummary?.recentReceipts.length ? (
                <ul className="divide-y divide-concrete">
                  {receiptsSummary.recentReceipts.map((receipt) => (
                    <li key={receipt.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-concrete/20 flex items-center justify-center">
                            <ReceiptIcon className="h-6 w-6 text-daisy" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-black truncate">
                            {receipt.merchant}
                          </p>
                          <p className="text-sm text-black truncate">
                            {receipt.category} •{" "}
                            {new Date(receipt.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-daisy">
                          {receipt.currency} {receipt.amount.toFixed(2)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-8 text-center text-concrete">
                  No recent expenses
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
