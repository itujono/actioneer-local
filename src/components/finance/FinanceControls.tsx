import React from "react";
import { RefreshCw } from "lucide-react";
import { Select, TabSelector } from "../ui";
import { SUPPORTED_CURRENCIES } from "../../utils/currency";

interface FinanceControlsProps {
  viewMode: "all" | "expenses" | "revenue";
  setViewMode: (mode: "all" | "expenses" | "revenue") => void;
  timeframe: string;
  setTimeframe: (timeframe: string) => void;
  displayMode: "cards" | "list";
  setDisplayMode: (mode: "cards" | "list") => void;
  baseCurrency: string;
  setBaseCurrency: (currency: string) => void;
  showCurrencyBreakdown: boolean;
  setShowCurrencyBreakdown: (show: boolean) => void;
  uniqueCurrencies: string[];
}

export function FinanceControls({
  viewMode,
  setViewMode,
  timeframe,
  setTimeframe,
  displayMode,
  setDisplayMode,
  baseCurrency,
  setBaseCurrency,
  showCurrencyBreakdown,
  setShowCurrencyBreakdown,
  uniqueCurrencies,
}: FinanceControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-xl border border-heliotrope/30 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* View Mode Selector */}
        <TabSelector
          label="View:"
          value={viewMode}
          onChange={(value) => setViewMode(value as typeof viewMode)}
          options={[
            { value: "all", label: "All" },
            { value: "revenue", label: "Income" },
            { value: "expenses", label: "Expenses" },
          ]}
        />

        {/* Time Period Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-black">Period:</span>
          <Select
            value={timeframe}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setTimeframe(e.target.value)
            }
            size="sm"
            options={[
              { value: "week", label: "Last Week" },
              { value: "month", label: "Last Month" },
              { value: "quarter", label: "Last Quarter" },
              { value: "year", label: "Last Year" },
              { value: "all", label: "All Time" },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        {/* Display Mode Toggle */}
        <TabSelector
          value={displayMode}
          onChange={(value) => setDisplayMode(value as typeof displayMode)}
          options={[
            { value: "cards", label: "Cards" },
            { value: "list", label: "List" },
          ]}
        />

        {/* Currency Selector */}
        <div className="flex items-center space-x-2">
          <Select
            value={baseCurrency}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setBaseCurrency(e.target.value)
            }
            size="sm"
            options={
              uniqueCurrencies.length > 0
                ? uniqueCurrencies.map((currency) => {
                    const currencyInfo = SUPPORTED_CURRENCIES[currency];
                    return {
                      value: currency,
                      label: `${currencyInfo?.flag || "🌍"} ${currency}`,
                    };
                  })
                : [{ value: "USD", label: "🇺🇸 USD" }]
            }
          />
        </div>

        {/* Currency Breakdown Toggle */}
        {uniqueCurrencies.length > 1 && (
          <button
            onClick={() => setShowCurrencyBreakdown(!showCurrencyBreakdown)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all border ${
              showCurrencyBreakdown
                ? "bg-heliotrope/10 text-heliotrope border-heliotrope/20"
                : "bg-white text-black border-concrete hover:bg-concrete"
            }`}
          >
            <RefreshCw
              className={`h-4 w-4 inline mr-1 ${
                showCurrencyBreakdown ? "rotate-180" : ""
              } transition-transform`}
            />
            {uniqueCurrencies.length} Currencies
          </button>
        )}
      </div>
    </div>
  );
}
