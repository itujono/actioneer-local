import React from "react";
import { Paperclip } from "lucide-react";
import {
  categoryIcons,
  revenueIcons,
  categoryColors,
  revenueColors,
} from "./constants";
import {
  formatCurrency,
  getCurrencySymbol,
  currencyManager,
} from "../../utils/currency";

interface TransactionListItemProps {
  transaction: any;
  baseCurrency: string;
}

export function TransactionListItem({
  transaction,
  baseCurrency,
}: TransactionListItemProps) {
  return (
    <div className="p-4 hover:bg-concrete transition-colors duration-150">
      <div className="flex items-center justify-between">
        <section className="flex items-center space-x-4 flex-1 min-w-0">
          <div
            className={`flex-shrink-0 p-2 rounded-lg ${
              transaction.type === "revenue"
                ? "bg-jade/20"
                : "bg-bittersweet/20"
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
              <p className="text-sm font-medium text-black truncate">
                {transaction.merchant || transaction.source || "Unknown"}
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
                    ? "text-jade"
                    : "text-bittersweet"
                }`}
              >
                {transaction.type === "revenue" ? "↗ Income" : "↘ Expense"}
              </span>
              <span className="text-xs text-black">
                #{transaction.id.slice(-4)}
              </span>
              {transaction.attachments &&
                transaction.attachments.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Paperclip className="h-3 w-3 text-black" />
                    <span className="text-xs text-black">
                      {transaction.attachment_count}
                    </span>
                  </div>
                )}
            </div>
            <p className="text-xs text-black mt-1 truncate">
              {transaction.description ||
                transaction.merchant ||
                transaction.source ||
                "No description"}
            </p>
          </div>
        </section>

        <section className="flex-shrink-0 text-right">
          <div
            className={`text-sm font-semibold ${
              transaction.type === "revenue" ? "text-jade" : "text-bittersweet"
            }`}
          >
            {transaction.type === "revenue" ? "+" : "-"}
            {formatCurrency(transaction.amount, transaction.currency)}
          </div>
          {transaction.currency !== baseCurrency && (
            <div className="text-xs text-black mt-1">
              ≈ {getCurrencySymbol(baseCurrency)}
              {currencyManager
                .convert(transaction.amount, transaction.currency, baseCurrency)
                .toFixed(2)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
