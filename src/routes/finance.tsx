import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../supabase/client";
import {
  currencyManager,
  formatCurrency,
  getCurrencyFlag,
  getCurrencySymbol,
  SUPPORTED_CURRENCIES,
} from "../utils/currency";
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
  Globe,
  RefreshCw,
  Grid3X3,
  List,
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
  const [timeframe, setTimeframe] = useState("month");
  const [viewMode, setViewMode] = useState<"all" | "expenses" | "revenue">(
    "all"
  );
  const [displayMode, setDisplayMode] = useState<"cards" | "list">("cards");
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [showCurrencyBreakdown, setShowCurrencyBreakdown] = useState(false);

  // Use TanStack Query for auth management
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

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

  // Calculate comprehensive financial metrics with multi-currency support
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
      currencyBreakdown: {} as Record<
        string,
        { revenue: number; expenses: number; net: number }
      >,
      uniqueCurrencies: [] as string[],
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

    // Get all unique currencies
    const allTransactions = [
      ...(Array.isArray(revenue) ? revenue : []),
      ...(Array.isArray(receipts) ? receipts : []),
    ];
    const uniqueCurrencies =
      currencyManager.getUniqueCurrencies(allTransactions);

    // Calculate currency breakdown
    const currencyBreakdown: Record<
      string,
      { revenue: number; expenses: number; net: number }
    > = {};
    uniqueCurrencies.forEach((currency) => {
      const currencyRevenue = Array.isArray(revenue)
        ? revenue
            .filter((item) => item.currency === currency)
            .reduce((sum, item) => sum + item.amount, 0)
        : 0;
      const currencyExpenses = Array.isArray(receipts)
        ? receipts
            .filter((receipt) => receipt.currency === currency)
            .reduce((sum, receipt) => sum + receipt.amount, 0)
        : 0;

      currencyBreakdown[currency] = {
        revenue: currencyRevenue,
        expenses: currencyExpenses,
        net: currencyRevenue - currencyExpenses,
      };
    });

    // Calculate revenue metrics (converted to base currency)
    const totalRevenue = Array.isArray(revenue)
      ? currencyManager.calculateTotal(revenue, baseCurrency)
      : 0;
    const thisWeekRevenue = Array.isArray(revenue)
      ? currencyManager.calculateTotal(
          revenue.filter((item) => new Date(item.date) >= startOfWeek),
          baseCurrency
        )
      : 0;
    const thisMonthRevenue = Array.isArray(revenue)
      ? currencyManager.calculateTotal(
          revenue.filter((item) => new Date(item.date) >= startOfMonth),
          baseCurrency
        )
      : 0;

    // Calculate expense metrics (converted to base currency)
    const totalExpenses = Array.isArray(receipts)
      ? currencyManager.calculateTotal(receipts, baseCurrency)
      : 0;
    const thisWeekExpenses = Array.isArray(receipts)
      ? currencyManager.calculateTotal(
          receipts.filter((receipt) => new Date(receipt.date) >= startOfWeek),
          baseCurrency
        )
      : 0;
    const thisMonthExpenses = Array.isArray(receipts)
      ? currencyManager.calculateTotal(
          receipts.filter((receipt) => new Date(receipt.date) >= startOfMonth),
          baseCurrency
        )
      : 0;

    // Calculate last month for trend (converted to base currency)
    const lastMonthRevenue = Array.isArray(revenue)
      ? currencyManager.calculateTotal(
          revenue.filter((item) => {
            const itemDate = new Date(item.date);
            return itemDate >= startOfLastMonth && itemDate <= endOfLastMonth;
          }),
          baseCurrency
        )
      : 0;

    const lastMonthExpenses = Array.isArray(receipts)
      ? currencyManager.calculateTotal(
          receipts.filter((receipt) => {
            const receiptDate = new Date(receipt.date);
            return (
              receiptDate >= startOfLastMonth && receiptDate <= endOfLastMonth
            );
          }),
          baseCurrency
        )
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
      currencyBreakdown,
      uniqueCurrencies,
    };
  }, [receipts, revenue, baseCurrency]);

  // Auto-select the first available currency when data loads
  useEffect(() => {
    if (
      metrics.uniqueCurrencies.length > 0 &&
      !metrics.uniqueCurrencies.includes(baseCurrency)
    ) {
      setBaseCurrency(metrics.uniqueCurrencies[0]);
    }
  }, [metrics.uniqueCurrencies, baseCurrency]);

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

  // Calculate daily totals with currency conversion
  const getDayTotal = (transactionsForDay: unknown) => {
    if (!Array.isArray(transactionsForDay)) return 0;
    return transactionsForDay.reduce((sum: number, transaction: any) => {
      const convertedAmount = currencyManager.convert(
        transaction.amount,
        transaction.currency || "USD",
        baseCurrency
      );
      if (transaction.type === "revenue") {
        return sum + convertedAmount; // Revenue adds to total
      } else {
        return sum - convertedAmount; // Expenses subtract from total
      }
    }, 0);
  };

  const getDayRevenue = (transactionsForDay: unknown) => {
    if (!Array.isArray(transactionsForDay)) return 0;
    return transactionsForDay
      .filter((t) => t.type === "revenue")
      .reduce((sum: number, transaction: any) => {
        const convertedAmount = currencyManager.convert(
          transaction.amount,
          transaction.currency || "USD",
          baseCurrency
        );
        return sum + convertedAmount;
      }, 0);
  };

  const getDayExpenses = (transactionsForDay: unknown) => {
    if (!Array.isArray(transactionsForDay)) return 0;
    return transactionsForDay
      .filter((t) => t.type === "expense")
      .reduce((sum: number, transaction: any) => {
        const convertedAmount = currencyManager.convert(
          transaction.amount,
          transaction.currency || "USD",
          baseCurrency
        );
        return sum + convertedAmount;
      }, 0);
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
    <div className="min-h-screen bg-gray-50 py-6 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header Section */}
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Financial Dashboard
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Track your complete financial picture across all currencies
              </p>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* View Mode Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">View:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {["all", "revenue", "expenses"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode as typeof viewMode)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        viewMode === mode
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
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

              {/* Time Period Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  Period:
                </span>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {/* Display Mode Toggle */}
              <div className="flex items-center space-x-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setDisplayMode("cards")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center space-x-1 ${
                      displayMode === "cards"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                    <span>Cards</span>
                  </button>
                  <button
                    onClick={() => setDisplayMode("list")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center space-x-1 ${
                      displayMode === "list"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <List className="h-4 w-4" />
                    <span>List</span>
                  </button>
                </div>
              </div>

              {/* Currency Selector */}
              <div className="flex items-center space-x-2">
                <select
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {metrics.uniqueCurrencies.length > 0 ? (
                    // Show only currencies that the user actually has data for
                    metrics.uniqueCurrencies.map((currency) => {
                      const currencyInfo = SUPPORTED_CURRENCIES[currency];
                      return (
                        <option key={currency} value={currency}>
                          {currencyInfo?.flag || "🌍"} {currency}
                        </option>
                      );
                    })
                  ) : (
                    // Fallback: if no data yet, show USD as default
                    <option value="USD">🇺🇸 USD</option>
                  )}
                </select>
              </div>

              {/* Currency Breakdown Toggle */}
              {metrics.uniqueCurrencies.length > 1 && (
                <button
                  onClick={() =>
                    setShowCurrencyBreakdown(!showCurrencyBreakdown)
                  }
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all border ${
                    showCurrencyBreakdown
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <RefreshCw
                    className={`h-4 w-4 inline mr-1 ${
                      showCurrencyBreakdown ? "rotate-180" : ""
                    } transition-transform`}
                  />
                  {metrics.uniqueCurrencies.length} Currencies
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="mt-8 space-y-6">
          {/* Primary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Net Income - Featured Card */}
            <div className="md:col-span-1 bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                    Net Income
                  </p>
                  <p
                    className={`text-lg font-bold mt-2 ${
                      metrics.netIncome >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {metrics.netIncome >= 0 ? "+" : ""}
                    {formatCurrency(Math.abs(metrics.netIncome), baseCurrency)}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    {timeframe === "all" ? "All time" : `Last ${timeframe}`}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-full ${
                    metrics.netIncome >= 0 ? "bg-emerald-500" : "bg-red-500"
                  }`}
                >
                  <PiggyBank className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            {/* Income & Expenses Summary */}
            <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Financial Summary
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Income
                      </p>
                      <p className="font-bold text-emerald-600">
                        {formatCurrency(metrics.totalRevenue, baseCurrency)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        This Month
                      </p>
                      <p
                        className={`font-bold ${
                          metrics.thisMonthNet >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {metrics.thisMonthNet >= 0 ? "+" : ""}
                        {formatCurrency(
                          Math.abs(metrics.thisMonthNet),
                          baseCurrency
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <ArrowDownRight className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Expenses
                      </p>
                      <p className="font-bold text-red-600">
                        {formatCurrency(metrics.totalExpenses, baseCurrency)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        metrics.trend >= 0 ? "bg-emerald-100" : "bg-red-100"
                      }`}
                    >
                      {metrics.trend >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        vs Last Month
                      </p>
                      <p
                        className={`font-bold ${
                          metrics.trend >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {metrics.trend >= 0 ? "+" : ""}
                        {formatCurrency(Math.abs(metrics.trend), baseCurrency)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Currency Breakdown Section */}
        {showCurrencyBreakdown && metrics.uniqueCurrencies.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Currency Breakdown
              </h3>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {metrics.uniqueCurrencies.length} currencies
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {metrics.uniqueCurrencies.map((currency) => {
                const breakdown = metrics.currencyBreakdown[currency];
                const currencyInfo = currencyManager.getCurrencyInfo(currency);
                return (
                  <div
                    key={currency}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{currencyInfo.flag}</span>
                        <span className="font-bold text-gray-900 text-lg">
                          {currency}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                        {currencyInfo.name}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Income:</span>
                        <span className="text-emerald-600 font-semibold">
                          +{formatCurrency(breakdown.revenue, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Expenses:</span>
                        <span className="text-red-600 font-semibold">
                          -{formatCurrency(breakdown.expenses, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                        <span className="text-sm font-medium text-gray-900">
                          Net:
                        </span>
                        <span
                          className={`font-bold ${
                            breakdown.net >= 0
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {breakdown.net >= 0 ? "+" : ""}
                          {formatCurrency(Math.abs(breakdown.net), currency)}
                        </span>
                      </div>
                      {currency !== baseCurrency && (
                        <div className="flex justify-between items-center text-xs text-gray-500 bg-white rounded px-2 py-1">
                          <span>≈ {baseCurrency}:</span>
                          <span className="font-medium">
                            {formatCurrency(
                              currencyManager.convert(
                                breakdown.net,
                                currency,
                                baseCurrency
                              ),
                              baseCurrency
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
                <div key={dateString} className="space-y-2 px-8">
                  {/* Date Header with Daily Summary */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {formatDateLabel(dateString)}
                    </h3>
                    <div className="text-right">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {getDayRevenue(transactionsForDay) > 0 && (
                          <span className="text-emerald-600">
                            +
                            {formatCurrency(
                              getDayRevenue(transactionsForDay),
                              baseCurrency
                            )}{" "}
                            income
                          </span>
                        )}
                        {getDayExpenses(transactionsForDay) > 0 && (
                          <span className="text-red-600">
                            -
                            {formatCurrency(
                              getDayExpenses(transactionsForDay),
                              baseCurrency
                            )}{" "}
                            expenses
                          </span>
                        )}
                      </div>
                      <div
                        className={`font-bold text-sm ${
                          getDayTotal(transactionsForDay) >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        Net: {getDayTotal(transactionsForDay) >= 0 ? "+" : ""}
                        {formatCurrency(
                          Math.abs(getDayTotal(transactionsForDay)),
                          baseCurrency
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Conditional Rendering: Cards or List View */}
                  {displayMode === "cards" ? (
                    /* Transaction Cards Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                      {(transactionsForDay as any[]).map((transaction: any) => (
                        <div
                          key={`${transaction.type}-${transaction.id}`}
                          className={`bg-white rounded-xl shadow-md border-2 p-6 hover:shadow-lg transition-all duration-200 relative ${
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
                                <h4 className="font-semibold text-gray-900 truncate">
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
                            {/* Category tag moved to top-right */}
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium absolute -top-3 right-4 ${
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

                            {/* Amount section - now takes full width */}
                            <div>
                              <div
                                className={`font-bold ${
                                  transaction.type === "revenue"
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                }`}
                              >
                                {transaction.type === "revenue" ? "+" : "-"}
                                {formatCurrency(
                                  transaction.amount,
                                  transaction.currency
                                )}
                              </div>
                              {transaction.currency !== baseCurrency && (
                                <div className="text-xs text-gray-500 mt-1">
                                  ≈ {getCurrencySymbol(baseCurrency)}
                                  {currencyManager
                                    .convert(
                                      transaction.amount,
                                      transaction.currency,
                                      baseCurrency
                                    )
                                    .toFixed(2)}
                                </div>
                              )}
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

                          {/* Transaction Footer - Commented out for now */}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Transaction List View */
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                      <div className="divide-y divide-gray-200">
                        {(transactionsForDay as any[]).map(
                          (transaction: any) => (
                            <div
                              key={`${transaction.type}-${transaction.id}`}
                              className="p-4 hover:bg-gray-50 transition-colors duration-150"
                            >
                              <div className="flex items-center justify-between">
                                {/* Left side: Icon, merchant, and description */}
                                <section className="flex items-center space-x-4 flex-1 min-w-0">
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
                                    <div className="flex items-center space-x-2">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {transaction.merchant ||
                                          transaction.source ||
                                          "Unknown"}
                                      </p>
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
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
                                      <span
                                        className={`text-xs font-medium ${
                                          transaction.type === "revenue"
                                            ? "text-emerald-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        {transaction.type === "revenue"
                                          ? "↗ Income"
                                          : "↘ Expense"}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        #{transaction.id.slice(-4)}
                                      </span>
                                      {transaction.attachments &&
                                        transaction.attachments.length > 0 && (
                                          <div className="flex items-center space-x-1">
                                            <Paperclip className="h-3 w-3 text-gray-400" />
                                            <span className="text-xs text-gray-400">
                                              {transaction.attachment_count}
                                            </span>
                                          </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                      {transaction.description ||
                                        transaction.merchant ||
                                        transaction.source ||
                                        "No description"}
                                    </p>
                                    {/* <div className="flex items-center space-x-3 mt-1">
                                      
                                    </div> */}
                                  </div>
                                </section>

                                {/* Right side: Amount and currency conversion */}
                                <div className="flex-shrink-0 text-right">
                                  <div
                                    className={`text-sm font-semibold ${
                                      transaction.type === "revenue"
                                        ? "text-emerald-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {transaction.type === "revenue" ? "+" : "-"}
                                    {formatCurrency(
                                      transaction.amount,
                                      transaction.currency
                                    )}
                                  </div>
                                  {transaction.currency !== baseCurrency && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      ≈ {getCurrencySymbol(baseCurrency)}
                                      {currencyManager
                                        .convert(
                                          transaction.amount,
                                          transaction.currency,
                                          baseCurrency
                                        )
                                        .toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
