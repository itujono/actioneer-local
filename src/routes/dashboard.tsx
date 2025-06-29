import { createRoute, Link } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ReceiptIcon,
  PlaneIcon,
  BriefcaseIcon,
  Calendar,
  DollarSign,
} from "lucide-react";
import { supabase } from "../supabase/client";
import { useAuth } from "../hooks/useAuth";
import {
  DashboardCard,
  DashboardContainer,
  DashboardSkeleton,
  DashboardSkeletonSimple,
  GmailOAuthSetup,
  RecentActivityCard,
  WelcomeOnboarding,
} from "../components/dashboard";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import Nothing from "../components/Nothing";
import { currencyManager, formatCurrency } from "../utils/currency";

export const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: Dashboard,
  notFoundComponent: () => (
    <DashboardContainer
      title="Are you lost?"
      description="The page you are looking for does not exist."
    >
      <div className="mt-4">
        <Link
          to="/"
          className="text-sm text-heliotrope hover:text-heliotrope/80 underline"
        >
          Go back to the home page
        </Link>
      </div>
    </DashboardContainer>
  ),
});

function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showWelcomeOnboarding, setShowWelcomeOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Check if user has any processed emails (to determine if they're new)
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: emailCount } = await supabase
        .from("emails")
        .select("id", { count: "exact" })
        .eq("user_id", user.id);

      const { data: hasSeenOnboarding } = await supabase
        .from("users")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      return {
        totalEmails: emailCount?.length || 0,
        hasSeenOnboarding: hasSeenOnboarding?.onboarding_completed || false,
      };
    },
    enabled: !!user,
  });

  // Check Gmail OAuth setup status
  const { data: gmailOAuthStatus, isLoading: gmailOAuthLoading } = useQuery({
    queryKey: ["gmail-oauth-status", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { data: tokens, error: tokenError } = await supabase
        .from("user_auth_tokens")
        .select("gmail_access_token, token_expires_at")
        .eq("user_id", user.id)
        .single();

      if (tokenError && tokenError.code !== "PGRST116") {
        throw tokenError;
      }

      const hasTokens = !!tokens?.gmail_access_token;
      const isTokenValid =
        hasTokens && tokens.token_expires_at
          ? new Date(tokens.token_expires_at) > new Date()
          : false;

      return { isSetup: hasTokens && isTokenValid };
    },
    enabled: !!user,
  });

  // Check if Gmail processing is enabled (OAuth only)
  const isGmailProcessingEnabled = gmailOAuthStatus?.isSetup;

  // Fetch recent actionable emails only when authenticated
  const { data: recentEmails, isLoading: emailsLoading } = useQuery({
    queryKey: ["recent-emails", user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Only fetch emails that are actionable - exclude 'other' classification
      const { data, error } = await supabase
        .from("emails")
        .select("*")
        .in("classification", [
          "receipt",
          "revenue",
          "travel",
          "job_application",
        ])
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!user && !statsLoading, // Only run when user is authenticated
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

      // Get unique currencies and calculate multi-currency breakdown
      const uniqueCurrencies = currencyManager.getUniqueCurrencies(data);
      const baseCurrency =
        uniqueCurrencies.length > 0 ? uniqueCurrencies[0] : "USD";

      // Calculate total in base currency for primary display
      const totalInBaseCurrency = currencyManager.calculateTotal(
        data,
        baseCurrency
      );

      // Calculate currency breakdown for multi-currency display
      const currencyBreakdown: Record<
        string,
        { amount: number; count: number }
      > = {};
      data.forEach((receipt) => {
        const currency = receipt.currency || "USD";
        if (!currencyBreakdown[currency]) {
          currencyBreakdown[currency] = { amount: 0, count: 0 };
        }
        currencyBreakdown[currency].amount += receipt.amount;
        currencyBreakdown[currency].count += 1;
      });

      return {
        total: totalInBaseCurrency,
        recentReceipts: data,
        uniqueCurrencies,
        baseCurrency,
        currencyBreakdown,
        hasMultipleCurrencies: uniqueCurrencies.length > 1,
      };
    },
    enabled: !!user && !statsLoading, // Only run when user is authenticated
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
    enabled: !!user && !statsLoading, // Only run when user is authenticated
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
    enabled: !!user && !statsLoading, // Only run when user is authenticated
  });

  // Determine if user should see welcome onboarding
  const shouldShowOnboarding =
    !statsLoading &&
    userStats &&
    !userStats.hasSeenOnboarding &&
    !onboardingCompleted;

  // Handle showing onboarding with useEffect to avoid race conditions
  useEffect(() => {
    if (shouldShowOnboarding && !showWelcomeOnboarding) {
      setShowWelcomeOnboarding(true);
    }
  }, [shouldShowOnboarding, showWelcomeOnboarding]);

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    if (!user) {
      console.error("No user found when trying to complete onboarding");
      return;
    }

    console.log("Completing onboarding for user:", user.id);

    try {
      // Mark onboarding as completed in database
      const { data, error } = await supabase
        .from("users")
        .update({ onboarding_completed: true })
        .eq("id", user.id)
        .select();

      if (error) {
        console.error("Error updating onboarding status:", error);
        return;
      }

      console.log("Database update successful. Updated rows:", data);

      if (!data || data.length === 0) {
        console.error(
          "No rows were updated. User ID might not exist:",
          user.id
        );
        return;
      }

      console.log("Onboarding marked as complete in database");
      setOnboardingCompleted(true);
      setShowWelcomeOnboarding(false);

      // Invalidate the user-stats query to refetch the updated data
      // This will ensure the onboarding doesn't show again
      queryClient.invalidateQueries({ queryKey: ["user-stats", user.id] });
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  // Show auth loading state
  if (statsLoading || gmailOAuthLoading) {
    return (
      <DashboardContainer title="Dashboard">
        <DashboardSkeletonSimple />
      </DashboardContainer>
    );
  }

  // Show loading while redirect happens
  if (!user) {
    return (
      <DashboardContainer title="Dashboard">
        <DashboardSkeletonSimple />
      </DashboardContainer>
    );
  }

  // Show appropriate skeleton based on Gmail processing status
  if (
    gmailOAuthStatus?.isSetup &&
    (receiptsLoading || emailsLoading || travelLoading || jobsLoading)
  ) {
    return (
      <DashboardContainer title="Dashboard">
        <DashboardSkeleton />
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer title="Dashboard">
      {/* Welcome Onboarding Dialog */}
      <WelcomeOnboarding
        open={showWelcomeOnboarding}
        onComplete={handleOnboardingComplete}
      />

      {/* Welcome Banner */}
      <div className="rounded-lg shadow-md overflow-hidden mt-6">
        <div className="bg-daisy px-6 py-5 sm:px-6 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                Welcome back,{" "}
                <span className="text-lavender">
                  {user?.email?.split("@")[0] || "User"}
                </span>
              </h2>
              <p className="mt-1 text-sm text-white/80">
                {isGmailProcessingEnabled
                  ? "Your inbox is being monitored for actionable emails. Here's a summary of your recent activity."
                  : "Let's get you set up with Gmail access to start processing your emails automatically."}
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-heliotrope/20 bg-daisy px-6 py-2">
          <div className="text-sm text-white/90">
            {isGmailProcessingEnabled
              ? "Your emails are processed automatically within seconds of arrival."
              : "Once set up, your emails will be processed automatically in real-time."}
          </div>
        </div>
      </div>

      {/* Gmail OAuth Setup */}
      <GmailOAuthSetup className="mt-6" />

      {/* Only show dashboard content if Gmail processing is enabled */}
      {isGmailProcessingEnabled && (
        <>
          {/* Stats Grid */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <DashboardCard
              title="Receipts & Expenses"
              value={
                receiptsLoading
                  ? "..."
                  : receiptsSummary?.hasMultipleCurrencies
                  ? `${formatCurrency(
                      receiptsSummary.total,
                      receiptsSummary.baseCurrency
                    )}`
                  : `${formatCurrency(
                      receiptsSummary?.total || 0,
                      receiptsSummary?.baseCurrency || "USD"
                    )}`
              }
              description={
                receiptsLoading
                  ? "Loading expenses..."
                  : receiptsSummary?.hasMultipleCurrencies
                  ? `${receiptsSummary.uniqueCurrencies.length} currencies • Total spending tracked`
                  : "Total spending tracked"
              }
              icon={<ReceiptIcon className="h-6 w-6" />}
              iconBackground="bg-bittersweet/15"
              link="/finance"
              // Add multi-currency breakdown in the additional info when applicable
              additionalInfo={
                !receiptsLoading && receiptsSummary?.hasMultipleCurrencies ? (
                  <div className="mt-2 pt-2 border-t border-gray-light/30">
                    <div className="text-xs text-thunder space-y-1">
                      {Object.entries(receiptsSummary.currencyBreakdown)
                        .sort(([, a], [, b]) => b.amount - a.amount)
                        .slice(0, 3) // Show top 3 currencies
                        .map(([currency, breakdown]) => (
                          <div
                            key={currency}
                            className="flex justify-between items-center"
                          >
                            <span className="text-thunder">
                              {currency} ({breakdown.count}{" "}
                              {breakdown.count === 1 ? "receipt" : "receipts"})
                            </span>
                            <span className="font-medium">
                              {formatCurrency(breakdown.amount, currency)}
                            </span>
                          </div>
                        ))}
                      {receiptsSummary.uniqueCurrencies.length > 3 && (
                        <div className="text-thunder italic">
                          +{receiptsSummary.uniqueCurrencies.length - 3} more
                          currencies
                        </div>
                      )}
                    </div>
                  </div>
                ) : undefined
              }
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
              iconBackground="bg-jade/15"
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
              iconBackground="bg-heliotrope/15"
              link="/jobs"
            />
          </div>

          {/* Recent Actionable Insights */}
          <h2 className="text-lg font-medium text-black mt-8">
            Recent Actionable Insights
          </h2>
          <div className="mt-2 overflow-hidden border-2 border-gray-light sm:rounded-lg">
            <div className="bg-white">
              {emailsLoading ? (
                <div className="py-12 text-center text-concrete">
                  Loading actionable insights...
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
                <Nothing>
                  No actionable emails found yet. We'll show insights here as we
                  process your receipts, travel plans, job applications, and
                  income emails.
                </Nothing>
              )}
            </div>
          </div>

          {/* Upcoming Events and Pending Actions */}
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Upcoming Events */}
            <div className="bg-white overflow-hidden rounded-lg border-2 border-gray-light">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg font-medium text-black">
                  Upcoming Events
                </h3>
                <Calendar className="h-5 w-5 text-gray-light" />
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
                            <div className="h-10 w-10 rounded-full bg-jade/15 flex items-center justify-center">
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
                  <Nothing>No upcoming events</Nothing>
                )}
              </div>
            </div>

            {/* Recent Expenses */}
            <div className="bg-white overflow-hidden rounded-lg border-2 border-gray-light">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg font-medium text-black">
                  Recent Expenses
                </h3>
                <DollarSign className="h-5 w-5 text-gray-light" />
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
                            <div className="h-10 w-10 rounded-full bg-lime/15 flex items-center justify-center">
                              <ReceiptIcon className="h-6 w-6 text-thunder" />
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
                          <div className="text-sm font-medium text-thunder">
                            {formatCurrency(receipt.amount, receipt.currency)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Nothing>No recent expenses</Nothing>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardContainer>
  );
}
