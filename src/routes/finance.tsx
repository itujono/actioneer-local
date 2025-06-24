import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../supabase/client";
import { currencyManager } from "../utils/currency";
import {
  FinanceHeader,
  FinanceControls,
  FinanceMetrics,
  CurrencyBreakdown,
  TransactionsList,
} from "../components/finance";

export const financeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/finance",
  component: FinancialDashboard,
});

function FinancialDashboard() {
  const [timeframe, setTimeframe] = useState("month");
  const [viewMode, setViewMode] = useState<"all" | "expenses" | "revenue">(
    "all"
  );
  const [displayMode, setDisplayMode] = useState<"cards" | "list">("cards");
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [showCurrencyBreakdown, setShowCurrencyBreakdown] = useState(false);

  const { user, isLoading: authLoading } = useAuth();

  const PAGE_SIZE = 20;
  const {
    data: receiptsPages,
    isLoading: receiptsLoading,
    error: receiptsError,
    fetchNextPage: fetchNextReceipts,
    hasNextPage: hasNextReceiptsPage,
    isFetchingNextPage: isFetchingNextReceipts,
    refetch: refetchReceipts,
  } = useInfiniteQuery({
    queryKey: ["receipts", timeframe, user?.id],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      if (!user) throw new Error("User not authenticated");

      console.log(`📊 Fetching receipts page ${pageParam} for user:`, user.id);

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

      query = query
        .order("date", { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      const { data, error } = await query;

      if (error) {
        console.error("❌ Error fetching receipts:", error);
        throw error;
      }

      console.log(`✅ Receipts page ${pageParam} fetched:`, data?.length || 0);
      return { data: data || [], pageParam };
    },
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: { data: any[]; pageParam: number },
      pages: any[]
    ) => {
      if (lastPage.data.length < PAGE_SIZE) {
        return undefined;
      }
      return pages.length;
    },
    enabled: !!user && !authLoading,
  });

  // Flatten receipts from all pages
  const receipts = useMemo(() => {
    return (
      receiptsPages?.pages.flatMap((page: { data: any[] }) => page.data) || []
    );
  }, [receiptsPages]);

  // Fetch revenue with infinite query
  const {
    data: revenuePages,
    isLoading: revenueLoading,
    error: revenueError,
    fetchNextPage: fetchNextRevenue,
    hasNextPage: hasNextRevenuePage,
    isFetchingNextPage: isFetchingNextRevenue,
    refetch: refetchRevenue,
  } = useInfiniteQuery({
    queryKey: ["revenue", timeframe, user?.id],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      if (!user) throw new Error("User not authenticated");

      console.log(`💰 Fetching revenue page ${pageParam} for user:`, user.id);

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

      query = query
        .order("date", { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      const { data, error } = await query;

      if (error) {
        console.error("❌ Error fetching revenue:", error);
        throw error;
      }

      console.log(`✅ Revenue page ${pageParam} fetched:`, data?.length || 0);
      return { data: data || [], pageParam };
    },
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: { data: any[]; pageParam: number },
      pages: any[]
    ) => {
      if (lastPage.data.length < PAGE_SIZE) {
        return undefined;
      }
      return pages.length;
    },
    enabled: !!user && !authLoading,
  });

  // Flatten revenue from all pages
  const revenue = useMemo(() => {
    return (
      revenuePages?.pages.flatMap((page: { data: any[] }) => page.data) || []
    );
  }, [revenuePages]);

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

  // Show auth loading state
  if (authLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-heliotrope"></div>
            <p className="mt-2 text-sm text-black">
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
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-heliotrope"></div>
            <p className="mt-2 text-sm text-black">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  if (receiptsError || revenueError) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="bg-bittersweet/10 border border-bittersweet rounded-lg p-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-bittersweet">
                  Error loading financial data
                </h3>
                <p className="mt-1 text-sm text-bittersweet">
                  {receiptsError?.message ||
                    revenueError?.message ||
                    "An unexpected error occurred"}
                </p>
                <div className="mt-2 text-xs text-bittersweet">
                  User ID: {user?.id || "Not authenticated"}
                  <br />
                  Email: {user?.email || "Not authenticated"}
                </div>
                <button
                  onClick={() => {
                    refetchReceipts();
                    refetchRevenue();
                  }}
                  className="mt-2 text-sm text-bittersweet hover:text-bittersweet underline"
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
    <div className="min-h-screen bg-concrete/10 py-6 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex flex-col space-y-6">
          <FinanceHeader />
          <FinanceControls
            viewMode={viewMode}
            setViewMode={setViewMode}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
            baseCurrency={baseCurrency}
            setBaseCurrency={setBaseCurrency}
            showCurrencyBreakdown={showCurrencyBreakdown}
            setShowCurrencyBreakdown={setShowCurrencyBreakdown}
            uniqueCurrencies={metrics.uniqueCurrencies}
          />
        </div>
        <FinanceMetrics
          metrics={metrics}
          baseCurrency={baseCurrency}
          timeframe={timeframe}
        />
        <CurrencyBreakdown
          showCurrencyBreakdown={showCurrencyBreakdown}
          uniqueCurrencies={metrics.uniqueCurrencies}
          currencyBreakdown={metrics.currencyBreakdown}
          baseCurrency={baseCurrency}
        />
        <TransactionsList
          isLoading={isLoading}
          groupedTransactions={groupedTransactions}
          displayMode={displayMode}
          baseCurrency={baseCurrency}
          viewMode={viewMode}
          hasNextPage={hasNextReceiptsPage || hasNextRevenuePage}
          isFetchingNextPage={isFetchingNextReceipts || isFetchingNextRevenue}
          onLoadMore={() => {
            if (hasNextReceiptsPage) fetchNextReceipts();
            if (hasNextRevenuePage) fetchNextRevenue();
          }}
        />
      </div>
    </div>
  );
}
