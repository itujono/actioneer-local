import { createRoute, useNavigate } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "../supabase/client";
import {
  DollarSign,
  Calendar,
  ShoppingBag,
  Coffee,
  Plane,
  Home,
  ShoppingCart,
  Utensils,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Receipt as ReceiptIcon,
  Laptop,
  Zap,
  Car,
  Paperclip,
  FileText,
  Image,
  Download,
} from "lucide-react";

export const expensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/expenses",
  component: Expenses,
});

// Enhanced category icons mapping
const categoryIcons = {
  software: <Laptop className="h-5 w-5" />,
  office_supplies: <ShoppingBag className="h-5 w-5" />,
  utilities: <Zap className="h-5 w-5" />,
  travel: <Plane className="h-5 w-5" />,
  entertainment: <Utensils className="h-5 w-5" />,
  food: <Utensils className="h-5 w-5" />,
  coffee: <Coffee className="h-5 w-5" />,
  shopping: <ShoppingCart className="h-5 w-5" />,
  groceries: <ShoppingBag className="h-5 w-5" />,
  housing: <Home className="h-5 w-5" />,
  transport: <Car className="h-5 w-5" />,
  other: <ReceiptIcon className="h-5 w-5" />,
  default: <DollarSign className="h-5 w-5" />,
};

// Category colors for visual distinction
const categoryColors = {
  software: "bg-blue-100 text-blue-800",
  office_supplies: "bg-green-100 text-green-800",
  utilities: "bg-yellow-100 text-yellow-800",
  travel: "bg-purple-100 text-purple-800",
  entertainment: "bg-pink-100 text-pink-800",
  food: "bg-orange-100 text-orange-800",
  coffee: "bg-amber-100 text-amber-800",
  shopping: "bg-indigo-100 text-indigo-800",
  groceries: "bg-emerald-100 text-emerald-800",
  housing: "bg-gray-100 text-gray-800",
  transport: "bg-cyan-100 text-cyan-800",
  other: "bg-slate-100 text-slate-800",
  default: "bg-gray-100 text-gray-800",
};

// Attachment icon mapping
const getAttachmentIcon = (mimeType: string) => {
  if (mimeType.includes("pdf")) {
    return <FileText className="h-4 w-4 text-red-600" />;
  } else if (mimeType.includes("image")) {
    return <Image className="h-4 w-4 text-green-600" />;
  } else {
    return <Paperclip className="h-4 w-4 text-gray-600" />;
  }
};

function Expenses() {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState("month");
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Force refresh session to handle potential stale sessions
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
          // If there's a session error, try to refresh
          const { data: refreshData } = await supabase.auth.refreshSession();
          setUser(refreshData?.session?.user || null);
        } else {
          setUser(session?.user || null);
        }

        console.log("🔍 Auth status:", {
          authenticated: !!session?.user,
          userId: session?.user?.id,
          email: session?.user?.email,
        });
      } catch (error) {
        console.error("Error checking auth:", error);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      console.log("🔄 Auth state changed:", {
        authenticated: !!session?.user,
        userId: session?.user?.id,
        email: session?.user?.email,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Redirect to login if not authenticated (after loading completes)
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("🔒 User not authenticated, redirecting to login...");
      navigate({ to: "/auth" });
    }
  }, [authLoading, user, navigate]);

  // Fetch receipts only when authenticated
  const {
    data: receipts,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["receipts", timeframe, user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      console.log("📊 Fetching receipts for user:", user.id);
      console.log("📧 User email:", user.email);

      // Let's also check what users exist in the custom users table with this email
      const { data: customUsers, error: customUsersError } = await supabase
        .from("users")
        .select("id, email, source, created_at")
        .eq("email", user.email);

      console.log("🔍 Custom users with this email:", customUsers);
      console.log("🔍 Custom users count:", customUsers?.length || 0);
      if (customUsers && customUsers.length > 0) {
        console.log("🔍 First custom user ID:", customUsers[0].id);
        console.log(
          "🔍 First custom user details:",
          JSON.stringify(customUsers[0], null, 2)
        );
      }

      // Let's also check if there are ANY receipts in the database
      const { data: allReceipts, error: allReceiptsError } = await supabase
        .from("receipts")
        .select("id, user_id, merchant, amount, created_at");

      console.log(
        "🔍 All receipts in database (first 10):",
        allReceipts?.slice(0, 10)
      );

      // Create date range based on timeframe
      const now = new Date();
      let startDate = new Date();

      if (timeframe === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (timeframe === "month") {
        startDate.setDate(now.getDate() - 30); // 30 days ago
      } else if (timeframe === "quarter") {
        startDate.setDate(now.getDate() - 90); // 90 days ago
      } else if (timeframe === "year") {
        startDate.setDate(now.getDate() - 365); // 365 days ago
      } else if (timeframe === "all") {
        startDate = new Date(0); // Beginning of time
      }

      console.log("🔍 Timeframe:", timeframe);
      console.log("🔍 Start date for filtering:", startDate.toISOString());
      console.log("🔍 Current date:", now.toISOString());

      // Prioritize custom user ID if available, fall back to Supabase auth ID
      let primaryUserId = user.id; // Default to Supabase auth ID
      let secondaryUserId = null;

      if (customUsers && customUsers.length > 0) {
        // Use custom user ID as primary, Supabase auth ID as secondary
        primaryUserId = customUsers[0].id;
        secondaryUserId = user.id;
        console.log("✅ Using custom user ID as primary:", primaryUserId);
        console.log("🔄 Will fallback to Supabase auth ID:", secondaryUserId);
      } else {
        console.log(
          "⚠️ No custom user found, using Supabase auth ID only:",
          primaryUserId
        );
      }

      // Primary query with preferred user ID
      let primaryQuery = supabase
        .from("receipts")
        .select("*")
        .eq("user_id", primaryUserId);

      if (timeframe !== "all") {
        primaryQuery = primaryQuery.gte("date", startDate.toISOString());
      }

      primaryQuery = primaryQuery.order("date", { ascending: false });

      const { data: primaryData, error: primaryError } = await primaryQuery;

      if (primaryError) {
        console.error("❌ Primary query error:", primaryError);
        throw primaryError;
      }

      console.log("🔍 Primary query results:", primaryData?.length || 0);

      // Secondary query if we have a fallback user ID
      let secondaryData = [];
      if (secondaryUserId && secondaryUserId !== primaryUserId) {
        console.log(
          "🔍 Running secondary query with user ID:",
          secondaryUserId
        );

        let secondaryQuery = supabase
          .from("receipts")
          .select("*")
          .eq("user_id", secondaryUserId);

        if (timeframe !== "all") {
          secondaryQuery = secondaryQuery.gte("date", startDate.toISOString());
        }

        secondaryQuery = secondaryQuery.order("date", { ascending: false });

        const { data: secData, error: secError } = await secondaryQuery;

        if (!secError && secData) {
          secondaryData = secData;
          console.log("🔍 Secondary query results:", secData?.length || 0);
        } else if (secError) {
          console.error("❌ Secondary query failed:", secError);
        }
      }

      // Combine both results and remove duplicates
      const allData = [...(primaryData || []), ...secondaryData];
      const uniqueData = allData.filter(
        (item, index, self) => index === self.findIndex((t) => t.id === item.id)
      );

      const data = uniqueData;
      // Note: primaryError was already handled above, so we don't need to check again here

      console.log("✅ Receipts fetched:", data?.length || 0);
      return data;
    },
    enabled: !!user && !authLoading, // Only run when user is authenticated
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!receipts) return { total: 0, thisWeek: 0, thisMonth: 0, savings: 0 };

    const now = new Date();
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const total = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);

    const thisWeek = receipts
      .filter((receipt) => new Date(receipt.date) >= startOfWeek)
      .reduce((sum, receipt) => sum + receipt.amount, 0);

    const thisMonth = receipts
      .filter((receipt) => new Date(receipt.date) >= startOfMonth)
      .reduce((sum, receipt) => sum + receipt.amount, 0);

    const lastMonth = receipts
      .filter((receipt) => {
        const receiptDate = new Date(receipt.date);
        return receiptDate >= startOfLastMonth && receiptDate <= endOfLastMonth;
      })
      .reduce((sum, receipt) => sum + receipt.amount, 0);

    const savings = lastMonth - thisMonth; // Positive if spending less this month

    return { total, thisWeek, thisMonth, savings };
  }, [receipts]);

  // Group receipts by date
  const groupedReceipts = useMemo(() => {
    if (!receipts) return {};

    const grouped = receipts.reduce((groups, receipt) => {
      const date = new Date(receipt.date).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(receipt);
      return groups;
    }, {});

    return grouped;
  }, [receipts]);

  // Format date labels
  const formatDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        weekday: "short",
      });
    }
  };

  // Calculate daily totals
  const getDayTotal = (receiptsForDay: any[]) => {
    return receiptsForDay.reduce(
      (sum: number, receipt: any) => sum + receipt.amount,
      0
    );
  };

  // Show auth loading state
  if (authLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">
              Checking authentication...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, the useEffect above will redirect to /auth
  // Show loading while redirect happens
  if (!user) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">
              Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading receipts
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  {error instanceof Error
                    ? error.message
                    : "An unexpected error occurred"}
                </p>
                <div className="mt-2 text-xs text-red-600">
                  User ID: {user?.id || "Not authenticated"}
                  <br />
                  Email: {user?.email || "Not authenticated"}
                </div>
                <button
                  onClick={() => refetch()}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Receipts & Expenses
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Track and analyze your spending from email receipts
        </p>

        {/* Metrics Section */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
            <div className="px-6 py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-lg p-3">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Total Spent
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    USD {metrics.total.toFixed(2)}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
            <div className="px-6 py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-lg p-3">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    This Week
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    USD {metrics.thisWeek.toFixed(2)}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
            <div className="px-6 py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-lg p-3">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    This Month
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    USD {metrics.thisMonth.toFixed(2)}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
            <div className="px-6 py-6">
              <div className="flex items-center">
                <div
                  className={`flex-shrink-0 rounded-lg p-3 ${
                    metrics.savings >= 0 ? "bg-emerald-500" : "bg-red-500"
                  }`}
                >
                  {metrics.savings >= 0 ? (
                    <TrendingDown className="h-6 w-6 text-white" />
                  ) : (
                    <TrendingUp className="h-6 w-6 text-white" />
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    vs Last Month
                  </dt>
                  <dd
                    className={`text-2xl font-bold ${
                      metrics.savings >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {metrics.savings >= 0 ? "-" : "+"}USD{" "}
                    {Math.abs(metrics.savings).toFixed(2)}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Period Filter */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Expense Timeline
            </h2>
            <div className="flex space-x-2">
              {["week", "month", "quarter", "year", "all"].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeframe === period
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {period === "all" ? "All Time" : `Last ${period}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Expense Items Section */}
        <div className="mt-8">
          {isLoading ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-4 text-lg text-gray-600">
                  Loading expenses...
                </span>
              </div>
            </div>
          ) : Object.keys(groupedReceipts).length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
              <ReceiptIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No expenses found
              </h3>
              <p className="text-gray-500">
                Your receipt emails will appear here once processed. Go ahead
                and shop away!
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedReceipts).map(
                ([dateString, receiptsForDay]) => (
                  <div key={dateString} className="space-y-4">
                    {/* Date Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {formatDateLabel(dateString)}
                      </h3>
                      <div className="text-right">
                        <span className="text-sm text-gray-500">
                          Total spent
                        </span>
                        <div className="text-lg font-bold text-gray-900">
                          USD {getDayTotal(receiptsForDay as any[]).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Receipt Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {(receiptsForDay as any[]).map((receipt: any) => (
                        <div
                          key={receipt.id}
                          className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200"
                        >
                          {/* Receipt Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                                {categoryIcons[
                                  receipt.category as keyof typeof categoryIcons
                                ] || categoryIcons.default}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-semibold text-gray-900 truncate">
                                  Receipt #{receipt.id.slice(-4)}
                                </h4>
                              </div>
                            </div>
                          </div>

                          {/* Receipt Content */}
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {receipt.merchant || "Unknown Vendor"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {receipt.description ||
                                  receipt.merchant ||
                                  "No description"}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  categoryColors[
                                    receipt.category as keyof typeof categoryColors
                                  ] || categoryColors.default
                                }`}
                              >
                                {receipt.category}
                              </span>
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">
                                  {receipt.currency} {receipt.amount.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Attachments Section */}
                          {receipt.attachments &&
                            receipt.attachments.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Paperclip className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                      {receipt.attachment_count} attachment
                                      {receipt.attachment_count > 1 ? "s" : ""}
                                    </span>
                                  </div>
                                  <div className="flex space-x-1">
                                    {receipt.attachments
                                      .slice(0, 3)
                                      .map((attachment: any, index: number) => (
                                        <div
                                          key={index}
                                          className="flex items-center p-1 rounded hover:bg-gray-100 cursor-pointer"
                                          title={`${attachment.filename} (${attachment.mimeType})`}
                                        >
                                          {getAttachmentIcon(
                                            attachment.mimeType
                                          )}
                                        </div>
                                      ))}
                                    {receipt.attachments.length > 3 && (
                                      <div className="flex items-center justify-center w-6 h-6 text-xs text-gray-500 bg-gray-100 rounded">
                                        +{receipt.attachments.length - 3}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {/* Attachment List (expandable) */}
                                <div className="mt-2 space-y-1">
                                  {receipt.attachments
                                    .slice(0, 2)
                                    .map((attachment: any, index: number) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                      >
                                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                                          {getAttachmentIcon(
                                            attachment.mimeType
                                          )}
                                          <span className="text-sm text-gray-700 truncate">
                                            {attachment.filename}
                                          </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          {attachment.size && (
                                            <span className="text-xs text-gray-500">
                                              {(attachment.size / 1024).toFixed(
                                                1
                                              )}
                                              KB
                                            </span>
                                          )}
                                          <Download className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                                        </div>
                                      </div>
                                    ))}
                                  {receipt.attachments.length > 2 && (
                                    <div className="text-center">
                                      <button className="text-xs text-blue-600 hover:text-blue-800">
                                        View all {receipt.attachments.length}{" "}
                                        attachments
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Receipt Footer */}
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-500 text-center">
                              Processed from email
                              {receipt.attachments &&
                                receipt.attachments.length > 0 && (
                                  <span className="ml-1">
                                    • {receipt.attachment_count} attachment
                                    {receipt.attachment_count > 1 ? "s" : ""}
                                  </span>
                                )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
