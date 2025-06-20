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
  Receipt as ReceiptIcon,
  Laptop,
  Zap,
  Car,
  Paperclip,
  FileText,
  Image,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  CircleDollarSign,
  Banknote,
  Building,
  Users,
  Landmark,
} from "lucide-react";

export const financeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/finance",
  component: FinancialDashboard,
});

// Enhanced category icons mapping for expenses
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

// Revenue category icons
const revenueIcons = {
  payment_received: <CircleDollarSign className="h-5 w-5" />,
  refund: <ArrowUpRight className="h-5 w-5" />,
  business_income: <Building className="h-5 w-5" />,
  investment: <TrendingUp className="h-5 w-5" />,
  government: <Landmark className="h-5 w-5" />,
  digital_platform: <Banknote className="h-5 w-5" />,
  sales: <Users className="h-5 w-5" />,
  default: <PiggyBank className="h-5 w-5" />,
};

// Category colors for visual distinction
const categoryColors = {
  // Expense colors (red/orange tones)
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

// Revenue colors (green/blue tones)
const revenueColors = {
  payment_received: "bg-emerald-100 text-emerald-800",
  refund: "bg-teal-100 text-teal-800",
  business_income: "bg-green-100 text-green-800",
  investment: "bg-lime-100 text-lime-800",
  government: "bg-blue-100 text-blue-800",
  digital_platform: "bg-cyan-100 text-cyan-800",
  sales: "bg-mint-100 text-mint-800",
  default: "bg-green-100 text-green-800",
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

function FinancialDashboard() {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState("month");
  const [viewMode, setViewMode] = useState<"all" | "expenses" | "revenue">(
    "all"
  );
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("🔒 User not authenticated, redirecting to login...");
      navigate({ to: "/auth" });
    }
  }, [authLoading, user, navigate]);

  // Fetch expenses (receipts)
  const {
    data: receipts,
    isLoading: receiptsLoading,
    error: receiptsError,
    refetch: refetchReceipts,
  } = useQuery({
    queryKey: ["receipts", timeframe, user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      console.log("📊 Fetching receipts for user:", user.id);

      const now = new Date();
      let startDate = new Date();

      if (timeframe === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (timeframe === "month") {
        startDate.setDate(now.getDate() - 30);
      } else if (timeframe === "quarter") {
        startDate.setDate(now.getDate() - 90);
      } else if (timeframe === "year") {
        startDate.setDate(now.getDate() - 365);
      } else if (timeframe === "all") {
        startDate = new Date(0);
      }

      let query = supabase.from("receipts").select("*").eq("user_id", user.id);

      if (timeframe !== "all") {
        query = query.gte("date", startDate.toISOString());
      }

      query = query.order("date", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("❌ Error fetching receipts:", error);
        throw error;
      }

      console.log("✅ Receipts fetched:", data?.length || 0);
      return data;
    },
    enabled: !!user && !authLoading,
  });

  // Fetch revenue
  const {
    data: revenue,
    isLoading: revenueLoading,
    error: revenueError,
    refetch: refetchRevenue,
  } = useQuery({
    queryKey: ["revenue", timeframe, user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      console.log("💰 Fetching revenue for user:", user.id);

      const now = new Date();
      let startDate = new Date();

      if (timeframe === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (timeframe === "month") {
        startDate.setDate(now.getDate() - 30);
      } else if (timeframe === "quarter") {
        startDate.setDate(now.getDate() - 90);
      } else if (timeframe === "year") {
        startDate.setDate(now.getDate() - 365);
      } else if (timeframe === "all") {
        startDate = new Date(0);
      }

      let query = supabase.from("revenue").select("*").eq("user_id", user.id);

      if (timeframe !== "all") {
        query = query.gte("date", startDate.toISOString());
      }

      query = query.order("date", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("❌ Error fetching revenue:", error);
        throw error;
      }

      console.log("✅ Revenue fetched:", data?.length || 0);
      return data;
    },
    enabled: !!user && !authLoading,
  });

  // Calculate comprehensive financial metrics
  const metrics = useMemo(() => {
    const defaultMetrics = {
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0,
      thisWeekRevenue: 0,
      thisWeekExpenses: 0,
      thisWeekNet: 0,
      thisMonthRevenue: 0,
      thisMonthExpenses: 0,
      thisMonthNet: 0,
      lastMonthNet: 0,
      trend: 0,
    };

    if (!receipts && !revenue) return defaultMetrics;

    const now = new Date();
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Calculate revenue metrics
    const totalRevenue = Array.isArray(revenue)
      ? revenue.reduce((sum, item) => sum + item.amount, 0)
      : 0;
    const thisWeekRevenue = Array.isArray(revenue)
      ? revenue
          .filter((item) => new Date(item.date) >= startOfWeek)
          .reduce((sum, item) => sum + item.amount, 0)
      : 0;
    const thisMonthRevenue = Array.isArray(revenue)
      ? revenue
          .filter((item) => new Date(item.date) >= startOfMonth)
          .reduce((sum, item) => sum + item.amount, 0)
      : 0;

    // Calculate expense metrics
    const totalExpenses = Array.isArray(receipts)
      ? receipts.reduce((sum, receipt) => sum + receipt.amount, 0)
      : 0;
    const thisWeekExpenses = Array.isArray(receipts)
      ? receipts
          .filter((receipt) => new Date(receipt.date) >= startOfWeek)
          .reduce((sum, receipt) => sum + receipt.amount, 0)
      : 0;
    const thisMonthExpenses = Array.isArray(receipts)
      ? receipts
          .filter((receipt) => new Date(receipt.date) >= startOfMonth)
          .reduce((sum, receipt) => sum + receipt.amount, 0)
      : 0;

    // Calculate last month for trend
    const lastMonthRevenue = Array.isArray(revenue)
      ? revenue
          .filter((item) => {
            const itemDate = new Date(item.date);
            return itemDate >= startOfLastMonth && itemDate <= endOfLastMonth;
          })
          .reduce((sum, item) => sum + item.amount, 0)
      : 0;

    const lastMonthExpenses = Array.isArray(receipts)
      ? receipts
          .filter((receipt) => {
            const receiptDate = new Date(receipt.date);
            return (
              receiptDate >= startOfLastMonth && receiptDate <= endOfLastMonth
            );
          })
          .reduce((sum, receipt) => sum + receipt.amount, 0)
      : 0;

    const lastMonthNet = lastMonthRevenue - lastMonthExpenses;
    const thisMonthNet = thisMonthRevenue - thisMonthExpenses;
    const trend = thisMonthNet - lastMonthNet;

    return {
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      thisWeekRevenue,
      thisWeekExpenses,
      thisWeekNet: thisWeekRevenue - thisWeekExpenses,
      thisMonthRevenue,
      thisMonthExpenses,
      thisMonthNet,
      lastMonthNet,
      trend,
    };
  }, [receipts, revenue]);

  // Combine and group financial transactions by date
  const groupedTransactions = useMemo(() => {
    if (!receipts && !revenue) return {};

    const allTransactions = [
      ...(Array.isArray(receipts)
        ? receipts.map((receipt) => ({ ...receipt, type: "expense" }))
        : []),
      ...(Array.isArray(revenue)
        ? revenue.map((rev) => ({
            ...rev,
            type: "revenue",
            merchant: rev.source,
          }))
        : []),
    ];

    // Filter by view mode
    const filteredTransactions = allTransactions.filter((transaction) => {
      if (viewMode === "expenses") return transaction.type === "expense";
      if (viewMode === "revenue") return transaction.type === "revenue";
      return true; // "all"
    });

    const grouped = filteredTransactions.reduce((groups, transaction) => {
      const date = new Date(transaction.date).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {} as Record<string, any[]>);

    return grouped;
  }, [receipts, revenue, viewMode]);

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
  const getDayTotal = (transactionsForDay: unknown) => {
    if (!Array.isArray(transactionsForDay)) return 0;
    return transactionsForDay.reduce((sum: number, transaction: any) => {
      if (transaction.type === "revenue") {
        return sum + transaction.amount; // Revenue adds to total
      } else {
        return sum - transaction.amount; // Expenses subtract from total
      }
    }, 0);
  };

  const getDayRevenue = (transactionsForDay: unknown) => {
    if (!Array.isArray(transactionsForDay)) return 0;
    return transactionsForDay
      .filter((t) => t.type === "revenue")
      .reduce((sum: number, transaction: any) => sum + transaction.amount, 0);
  };

  const getDayExpenses = (transactionsForDay: unknown) => {
    if (!Array.isArray(transactionsForDay)) return 0;
    return transactionsForDay
      .filter((t) => t.type === "expense")
      .reduce((sum: number, transaction: any) => sum + transaction.amount, 0);
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

  if (receiptsError || revenueError) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading financial data
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  {receiptsError?.message ||
                    revenueError?.message ||
                    "An unexpected error occurred"}
                </p>
                <div className="mt-2 text-xs text-red-600">
                  User ID: {user?.id || "Not authenticated"}
                  <br />
                  Email: {user?.email || "Not authenticated"}
                </div>
                <button
                  onClick={() => {
                    refetchReceipts();
                    refetchRevenue();
                  }}
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

  const isLoading = receiptsLoading || revenueLoading;

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Financial Dashboard
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Track your complete financial picture - income, expenses, and cash
              flow
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">View:</span>
            <div className="flex bg-white rounded-lg shadow-sm border border-gray-200">
              {["all", "revenue", "expenses"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as typeof viewMode)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === mode
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {mode === "all"
                    ? "All"
                    : mode === "revenue"
                    ? "Income"
                    : "Expenses"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Section */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {/* Net Income Card */}
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200 sm:col-span-2 lg:col-span-1">
            <div className="px-6 py-6">
              <div className="flex items-center">
                <div
                  className={`flex-shrink-0 rounded-lg p-3 ${
                    metrics.netIncome >= 0 ? "bg-emerald-500" : "bg-red-500"
                  }`}
                >
                  <PiggyBank className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Net Income
                  </dt>
                  <dd
                    className={`text-2xl font-bold ${
                      metrics.netIncome >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {metrics.netIncome >= 0 ? "+" : ""}USD{" "}
                    {metrics.netIncome.toFixed(2)}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
            <div className="px-6 py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-emerald-500 rounded-lg p-3">
                  <ArrowUpRight className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Total Income
                  </dt>
                  <dd className="text-2xl font-bold text-emerald-600">
                    USD {metrics.totalRevenue.toFixed(2)}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
            <div className="px-6 py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-500 rounded-lg p-3">
                  <ArrowDownRight className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Total Expenses
                  </dt>
                  <dd className="text-2xl font-bold text-red-600">
                    USD {metrics.totalExpenses.toFixed(2)}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* This Month Net */}
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
            <div className="px-6 py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-lg p-3">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    This Month
                  </dt>
                  <dd
                    className={`text-2xl font-bold ${
                      metrics.thisMonthNet >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {metrics.thisMonthNet >= 0 ? "+" : ""}USD{" "}
                    {metrics.thisMonthNet.toFixed(2)}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Trend vs Last Month */}
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
            <div className="px-6 py-6">
              <div className="flex items-center">
                <div
                  className={`flex-shrink-0 rounded-lg p-3 ${
                    metrics.trend >= 0 ? "bg-emerald-500" : "bg-red-500"
                  }`}
                >
                  {metrics.trend >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-white" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-white" />
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    vs Last Month
                  </dt>
                  <dd
                    className={`text-2xl font-bold ${
                      metrics.trend >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {metrics.trend >= 0 ? "+" : ""}USD{" "}
                    {Math.abs(metrics.trend).toFixed(2)}
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
              Financial Timeline
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

        {/* Financial Transactions Section */}
        <div className="mt-8">
          {isLoading ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-4 text-lg text-gray-600">
                  Loading financial data...
                </span>
              </div>
            </div>
          ) : Object.keys(groupedTransactions).length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
              <PiggyBank className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No financial transactions found
              </h3>
              <p className="text-gray-500">
                Your {viewMode === "all" ? "financial transactions" : viewMode}{" "}
                will appear here once processed.
                {viewMode === "revenue" && " Time to make some money!"}
                {viewMode === "expenses" &&
                  " Your spending will be tracked here."}
                {viewMode === "all" &&
                  " Start by connecting your email for automatic tracking!"}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedTransactions).map(
                ([dateString, transactionsForDay]) => (
                  <div key={dateString} className="space-y-4">
                    {/* Date Header with Daily Summary */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {formatDateLabel(dateString)}
                      </h3>
                      <div className="text-right space-y-1">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {getDayRevenue(transactionsForDay) > 0 && (
                            <span className="text-emerald-600">
                              +USD{" "}
                              {getDayRevenue(transactionsForDay).toFixed(2)}{" "}
                              income
                            </span>
                          )}
                          {getDayExpenses(transactionsForDay) > 0 && (
                            <span className="text-red-600">
                              -USD{" "}
                              {getDayExpenses(transactionsForDay).toFixed(2)}{" "}
                              expenses
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            getDayTotal(transactionsForDay) >= 0
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          Net: {getDayTotal(transactionsForDay) >= 0 ? "+" : ""}
                          USD {getDayTotal(transactionsForDay).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Transaction Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {(transactionsForDay as any[]).map((transaction: any) => (
                        <div
                          key={`${transaction.type}-${transaction.id}`}
                          className={`bg-white rounded-xl shadow-md border-2 p-6 hover:shadow-lg transition-all duration-200 ${
                            transaction.type === "revenue"
                              ? "border-emerald-200 hover:border-emerald-300"
                              : "border-red-200 hover:border-red-300"
                          }`}
                        >
                          {/* Transaction Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`flex-shrink-0 p-2 rounded-lg ${
                                  transaction.type === "revenue"
                                    ? "bg-emerald-100"
                                    : "bg-red-100"
                                }`}
                              >
                                {transaction.type === "revenue"
                                  ? revenueIcons[
                                      transaction.category as keyof typeof revenueIcons
                                    ] || revenueIcons.default
                                  : categoryIcons[
                                      transaction.category as keyof typeof categoryIcons
                                    ] || categoryIcons.default}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-semibold text-gray-900 truncate">
                                  {transaction.type === "revenue"
                                    ? "Income"
                                    : "Expense"}{" "}
                                  #{transaction.id.slice(-4)}
                                </h4>
                                <p
                                  className={`text-xs font-medium ${
                                    transaction.type === "revenue"
                                      ? "text-emerald-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {transaction.type === "revenue"
                                    ? "↗ Money In"
                                    : "↘ Money Out"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Transaction Content */}
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {transaction.merchant ||
                                  transaction.source ||
                                  "Unknown"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {transaction.description ||
                                  transaction.merchant ||
                                  transaction.source ||
                                  "No description"}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  transaction.type === "revenue"
                                    ? revenueColors[
                                        transaction.category as keyof typeof revenueColors
                                      ] || revenueColors.default
                                    : categoryColors[
                                        transaction.category as keyof typeof categoryColors
                                      ] || categoryColors.default
                                }`}
                              >
                                {transaction.category}
                              </span>
                              <div className="text-right">
                                <div
                                  className={`text-lg font-bold ${
                                    transaction.type === "revenue"
                                      ? "text-emerald-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {transaction.type === "revenue" ? "+" : "-"}
                                  {transaction.currency}{" "}
                                  {transaction.amount.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Attachments Section */}
                          {transaction.attachments &&
                            transaction.attachments.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Paperclip className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                      {transaction.attachment_count} attachment
                                      {transaction.attachment_count > 1
                                        ? "s"
                                        : ""}
                                    </span>
                                  </div>
                                  <div className="flex space-x-1">
                                    {transaction.attachments
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
                                    {transaction.attachments.length > 3 && (
                                      <div className="flex items-center justify-center w-6 h-6 text-xs text-gray-500 bg-gray-100 rounded">
                                        +{transaction.attachments.length - 3}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                          {/* Transaction Footer */}
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-500 text-center">
                              {transaction.type === "revenue"
                                ? "Income"
                                : "Expense"}{" "}
                              from email
                              {transaction.reference_number && (
                                <span className="ml-1">
                                  • Ref: {transaction.reference_number}
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
