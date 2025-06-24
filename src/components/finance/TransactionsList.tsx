import React from "react";
import { PiggyBank, ChevronDown, Loader2 } from "lucide-react";
import { TransactionCard } from "./TransactionCard";
import { TransactionListItem } from "./TransactionListItem";
import { formatDateLabel } from "./constants";
import { formatCurrency, currencyManager } from "../../utils/currency";

interface TransactionsListProps {
  isLoading: boolean;
  groupedTransactions: Record<string, any[]>;
  displayMode: "cards" | "list";
  baseCurrency: string;
  viewMode: "all" | "expenses" | "revenue";
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export function TransactionsList({
  isLoading,
  groupedTransactions,
  displayMode,
  baseCurrency,
  viewMode,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: TransactionsListProps) {
  // Calculate daily totals with currency conversion
  const getDayTotal = (transactionsForDay: any[]) => {
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

  const getDayRevenue = (transactionsForDay: any[]) => {
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

  const getDayExpenses = (transactionsForDay: any[]) => {
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-heliotrope/30 p-12">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-lg text-thunder">
            Loading financial data...
          </span>
        </div>
      </div>
    );
  }

  if (Object.keys(groupedTransactions).length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-heliotrope/30 p-12 text-center">
        <PiggyBank className="h-16 w-16 text-concrete mx-auto mb-4" />
        <h3 className="text-xl font-medium text-black mb-2">
          No financial transactions found
        </h3>
        <p className="text-black">
          Your {viewMode === "all" ? "financial transactions" : viewMode} will
          appear here once processed.
          {viewMode === "revenue" && " Time to make some money!"}
          {viewMode === "expenses" && " Your spending will be tracked here."}
          {viewMode === "all" &&
            " Start by connecting your email for automatic tracking!"}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="space-y-8">
        {Object.entries(groupedTransactions).map(
          ([dateString, transactionsForDay]) => (
            <div key={dateString} className="space-y-2 px-8">
              {/* Date Header with Daily Summary */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">
                  {formatDateLabel(dateString)}
                </h3>
                <div className="text-right">
                  <div className="flex items-center space-x-4 text-sm text-black">
                    {getDayRevenue(transactionsForDay) > 0 && (
                      <span className="text-jade">
                        +
                        {formatCurrency(
                          getDayRevenue(transactionsForDay),
                          baseCurrency
                        )}{" "}
                        income
                      </span>
                    )}
                    {getDayExpenses(transactionsForDay) > 0 && (
                      <span className="text-bittersweet">
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
                        ? "text-jade"
                        : "text-bittersweet"
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
                  {transactionsForDay.map((transaction: any) => (
                    <TransactionCard
                      key={`${transaction.type}-${transaction.id}`}
                      transaction={transaction}
                      baseCurrency={baseCurrency}
                    />
                  ))}
                </div>
              ) : (
                /* Transaction List View */
                <div className="bg-white rounded-xl shadow-md border border-heliotrope/30 overflow-hidden">
                  <div className="divide-y divide-thunder/30">
                    {transactionsForDay.map((transaction: any) => (
                      <TransactionListItem
                        key={`${transaction.type}-${transaction.id}`}
                        transaction={transaction}
                        baseCurrency={baseCurrency}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Show More Button */}
      {hasNextPage && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="inline-flex items-center px-6 py-3 border border-concrete rounded-lg text-sm font-medium text-black bg-white hover:bg-concrete focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading more...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show more transactions
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
