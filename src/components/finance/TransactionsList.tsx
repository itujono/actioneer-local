import React, { useMemo } from "react";
import { PiggyBank, ChevronDown, Receipt } from "lucide-react";
import { TransactionCard } from "./TransactionCard";
import { TransactionListItem } from "./TransactionListItem";
import { formatDateLabel } from "./constants";
import { formatCurrency, currencyManager } from "../../utils/currency";
import { Button } from "../ui/button";
import Loading from "../Loading";
import { TestEmailButton } from "../ui";

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
    return <Loading message="Loading financial data..." />;
  }

  if (Object.keys(groupedTransactions).length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border-2 border-lime/30 p-12 text-center mt-12">
        <Receipt className="h-16 w-16 text-lime mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-black mb-4">
          Your Financial Hub Awaits! 💰
        </h3>
        <p className="text-thunder text-lg mb-6 max-w-2xl mx-auto leading-relaxed">
          Transform email chaos into financial clarity! We automatically detect
          and organize receipts from your purchases, subscriptions, and business
          expenses.
        </p>

        <div className="bg-sandy border-2 border-gold/30 rounded-lg p-4 mb-6 max-w-lg mx-auto">
          <p className="text-thunder font-medium text-sm">
            💡 <strong>Want instant results?</strong> Send yourself a test
            receipt to watch your spending get tracked automatically!
          </p>
        </div>

        <div className="bg-concrete rounded-lg p-6 mb-6 max-w-xl mx-auto border border-gray-light">
          <h4 className="text-lg font-semibold text-black mb-3">
            📊 What Gets Tracked:
          </h4>
          <ul className="text-left text-thunder space-y-2">
            <li className="flex items-start">
              <span className="text-lime mr-2">✓</span>
              <span>
                <strong>Online purchases</strong> from Amazon, Target, Best Buy
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-lime mr-2">✓</span>
              <span>
                <strong>Subscription services</strong> like Netflix, Spotify,
                Adobe
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-lime mr-2">✓</span>
              <span>
                <strong>Business expenses</strong> and professional services
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-lime mr-2">✓</span>
              <span>
                <strong>Multi-currency support</strong> with automatic
                conversion
              </span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div className="text-sm text-thunder bg-sandy border border-gold rounded-lg px-4 py-2 flex items-center">
            <span className="text-gold mr-2">⚡</span>
            Real-time processing as receipts arrive in your inbox!
          </div>
          <TestEmailButton
            category="receipt"
            variant="primary"
            size="md"
            className="bg-lime hover:bg-lime/90 text-black"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="space-y-8">
        {Object.entries(groupedTransactions).map(
          ([dateString, transactionsForDay]) => (
            <div
              key={dateString}
              className="space-y-2 border-t border-concrete pt-4"
            >
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

              {displayMode === "cards" ? (
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
                <div className="bg-white rounded-xl border border-heliotrope/30 overflow-hidden">
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
          <Button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            variant="outline"
            size="md"
            loading={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              "Loading more..."
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show more transactions
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
