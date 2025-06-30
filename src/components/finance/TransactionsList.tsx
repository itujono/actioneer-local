import React, { useMemo } from "react";
import { PiggyBank, ChevronDown, Receipt, Dot, BriefcaseIcon, BadgeDollarSign } from "lucide-react";
import { TransactionCard } from "./TransactionCard";
import { TransactionListItem } from "./TransactionListItem";
import { formatDateLabel } from "./constants";
import { formatCurrency, currencyManager } from "../../utils/currency";
import { Button } from "../ui/button";
import Loading from "../Loading";
import { TestEmailButton } from "../ui";
import { Spiral } from "../illustrations";

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
      const convertedAmount = currencyManager.convert(transaction.amount, transaction.currency || "USD", baseCurrency);
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
      <div className="bg-daisy rounded-xl p-12 mt-8 text-lavender relative overflow-hidden">
        <div className="absolute -bottom-32 right-0 w-1/2 h-1/2 scale-x-[-1]">
          <Spiral className="text-heliotrope text-lg" />
        </div>
        <BadgeDollarSign className="h-16 w-16 mb-6" />
        <p className="text-lg mt-6 max-w-2xl leading-relaxed text-white">
          Transform email chaos into financial clarity! We automatically detect and organize receipts from your
          purchases, subscriptions, and business expenses. The best part? You don't have to do anything.
        </p>

        <ul className="text-left text-white space-y-2 mt-6">
          <li className="flex items-start">
            <Dot className="text-lavender relative right-2" />
            <span>
              <strong className="text-lavender">Online purchases</strong> from Amazon, Target, Best Buy, basically any
              online store
            </span>
          </li>
          <li className="flex items-start">
            <Dot className="text-lavender relative right-2" />
            <span>
              <strong className="text-lavender">Subscription services</strong> like Netflix, Spotify, Adobe
            </span>
          </li>
          <li className="flex items-start">
            <Dot className="text-lavender relative right-2" />
            <span>
              <strong className="text-lavender">Business expenses</strong> and professional services
            </span>
          </li>
          <li className="flex items-start">
            <Dot className="text-lavender relative right-2" />
            <span>
              <strong className="text-lavender">Multi-currency support</strong> with automatic conversion
            </span>
          </li>
        </ul>

        <div className="mb-6 pt-6 max-w-lg mt-6 border-t">
          <p className="text-white font-medium text-sm">
            <strong>Don't have any financial emails yet?</strong> Send yourself test emails to watch your spending and
            income get tracked automatically!
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
            <TestEmailButton category="receipt" variant="primary" className="flex-1" />
            <span className="text-white">or</span>
            <TestEmailButton category="revenue" variant="primary" className="flex-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="space-y-8">
        {Object.entries(groupedTransactions).map(([dateString, transactionsForDay]) => (
          <div key={dateString} className="space-y-2 border-t border-concrete pt-4">
            {/* Date Header with Daily Summary */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-black">{formatDateLabel(dateString)}</h3>
              <div className="text-right">
                <div className="flex items-center space-x-4 text-sm text-black">
                  {getDayRevenue(transactionsForDay) > 0 && (
                    <span className="text-jade">
                      +{formatCurrency(getDayRevenue(transactionsForDay), baseCurrency)} income
                    </span>
                  )}
                  {getDayExpenses(transactionsForDay) > 0 && (
                    <span className="text-bittersweet">
                      -{formatCurrency(getDayExpenses(transactionsForDay), baseCurrency)} expenses
                    </span>
                  )}
                </div>
                <div
                  className={`font-bold text-sm ${
                    getDayTotal(transactionsForDay) >= 0 ? "text-jade" : "text-bittersweet"
                  }`}
                >
                  Net: {getDayTotal(transactionsForDay) >= 0 ? "+" : ""}
                  {formatCurrency(Math.abs(getDayTotal(transactionsForDay)), baseCurrency)}
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
        ))}
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
