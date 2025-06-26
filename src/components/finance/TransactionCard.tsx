import { Paperclip } from "lucide-react";
import {
  categoryIcons,
  revenueIcons,
  categoryColors,
  revenueColors,
  getAttachmentIcon,
} from "./constants";
import {
  formatCurrency,
  getCurrencySymbol,
  currencyManager,
} from "../../utils/currency";

interface TransactionCardProps {
  transaction: any;
  baseCurrency: string;
}

export function TransactionCard({
  transaction,
  baseCurrency,
}: TransactionCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-md border-2 p-6 hover:shadow-lg transition-all duration-200 relative ${
        transaction.type === "revenue"
          ? "border-jade hover:border-jade"
          : "border-bittersweet hover:border-bittersweet"
      }`}
    >
      {/* Transaction Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
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
            <h4 className="font-semibold text-black truncate">
              {transaction.type === "revenue" ? "Income" : "Expense"} #
              {transaction.id.slice(-4)}
            </h4>
            <p
              className={`text-xs font-medium ${
                transaction.type === "revenue"
                  ? "text-jade"
                  : "text-bittersweet"
              }`}
            >
              {transaction.type === "revenue" ? "↗ Money In" : "↘ Money Out"}
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
          <p className="text-sm font-medium text-black truncate">
            {transaction.merchant || transaction.source || "Unknown"}
          </p>
          <p className="text-xs text-black mt-1">
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
        </div>
      </div>

      {/* Attachments Section */}
      {transaction.attachments && transaction.attachments.length > 0 && (
        <div className="mt-4 pt-3 border-t border-heliotrope/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Paperclip className="h-4 w-4 text-black" />
              <span className="text-sm text-black">
                {transaction.attachment_count} attachment
                {transaction.attachment_count > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex space-x-1">
              {transaction.attachments
                .slice(0, 3)
                .map((attachment: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center p-1 rounded hover:bg-concrete"
                    title={`${attachment.filename} (${attachment.mimeType})`}
                  >
                    {getAttachmentIcon(attachment.mimeType)}
                  </div>
                ))}
              {transaction.attachments.length > 3 && (
                <div className="flex items-center justify-center w-6 h-6 text-xs text-black bg-concrete rounded">
                  +{transaction.attachments.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
