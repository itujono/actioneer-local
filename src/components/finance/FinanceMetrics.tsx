import {
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatCurrency } from "../../utils/currency";
import { SVGProps } from "react";
import Fling from "../illustrations/Fling";

// Simple SVG Donut Illustration
const DonutIllustration = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 355.15 529.33"
      fill="currentColor"
      {...props}
    >
      <path d="M66.78,529.33C25.92,495.88.97,441.16.03,382.94c-.82-50.76,16.65-97.46,48.32-130.21-.78-12.41-.38-25.12,1.25-37.98,4.67-37.08,18.94-72.52,41.26-102.5C130.8,58.58,195.08,20.51,271.86,5.05c21-4.23,52.48-8.83,83.29-.06l-13.7,48.09c-15.49-4.41-34.47-4.1-59.73.99-64.66,13.01-118.2,44.28-150.76,88.03-16.19,21.75-27.21,48.32-31.25,75.2,28.18-12.28,59.74-16.75,90.28-12.13,30.52,4.62,57.76,24.94,71.1,53.04,12.6,26.55,11.32,56.15-3.51,81.2-10.53,17.79-25.85,30.02-45.52,36.34-17.29,5.56-35.46,5.69-49.36,5.19-20.09-.73-38.31-5.65-54.17-14.61-17.37-9.82-30.99-23.96-40.49-42.04-1.38-2.62-2.69-5.28-3.92-7.97-9.53,19.23-14.49,41.81-14.1,65.81.71,43.7,18.81,84.27,48.43,108.52l-31.68,38.69ZM101.76,272.91c2.4,9.89,5.92,19.32,10.55,28.12,12.42,23.63,35.25,29.32,52.21,29.94,28.88,1.05,41.98-3.41,50.04-17.04,8.52-14.38,4.51-27.66,1.36-34.29-6.3-13.28-19.1-22.88-33.41-25.04-28.04-4.24-57.3,2.55-80.76,18.31Z" />
    </svg>
  );
};

interface FinanceMetricsProps {
  metrics: {
    netIncome: number;
    totalRevenue: number;
    totalExpenses: number;
    thisMonthNet: number;
    trend: number;
    uniqueCurrencies: string[];
    currencyBreakdown: Record<
      string,
      { revenue: number; expenses: number; net: number }
    >;
  };
  baseCurrency: string;
  timeframe: string;
}

export function FinanceMetrics({
  metrics,
  baseCurrency,
  timeframe,
}: FinanceMetricsProps) {
  const hasMultipleCurrencies = metrics.uniqueCurrencies.length > 1;
  const primaryCurrencies = metrics.uniqueCurrencies.slice(0, 3); // Show top 3 currencies

  // Helper function to get the top contributing currencies for a metric
  const getTopCurrencies = (type: "revenue" | "expenses" | "net") => {
    if (!hasMultipleCurrencies) return [];

    return Object.entries(metrics.currencyBreakdown)
      .map(([currency, breakdown]) => ({
        currency,
        amount: Math.abs(breakdown[type]),
        originalAmount: breakdown[type],
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 2); // Show top 2 contributing currencies
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Multi-Currency Indicator */}
      {/* {hasMultipleCurrencies && (
        <div className="bg-gradient-to-r from-heliotrope/5 to-jade/5 border border-heliotrope/20 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-heliotrope/10 rounded-lg">
              <Globe className="h-5 w-5 text-heliotrope" />
            </div>
            <div>
              <p className="text-sm font-medium text-black">
                Multi-Currency Portfolio
              </p>
              <p className="text-xs text-black mt-1">
                Tracking {metrics.uniqueCurrencies.length} currencies: {primaryCurrencies.join(", ")}
                {metrics.uniqueCurrencies.length > 3 && ` +${metrics.uniqueCurrencies.length - 3} more`}
              </p>
            </div>
            <div className="ml-auto text-xs text-heliotrope font-medium">
              Converted to {baseCurrency}
            </div>
          </div>
        </div>
      )} */}

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Income - Featured Card */}
        <div className="md:col-span-1 bg-daisy border-2 border-daisy rounded-xl p-6 bg-[url(/circle-jot.svg)] bg-right-bottom relative overflow-hidden">
          <div className="flex flex-col h-full relative z-10">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Net Income
              </h3>
              <p
                className={`text-2xl font-bold mt-2 ${
                  metrics.netIncome >= 0 ? "text-jade" : "text-lavender"
                }`}
              >
                {metrics.netIncome >= 0 ? "+" : ""}
                {formatCurrency(Math.abs(metrics.netIncome), baseCurrency)}
              </p>
              {hasMultipleCurrencies && (
                <div className="mt-2 space-y-0">
                  {getTopCurrencies("net").map(
                    ({ currency, originalAmount }) => (
                      <div key={currency} className="text-lavender">
                        {currency}: {originalAmount >= 0 ? "+" : ""}
                        {formatCurrency(Math.abs(originalAmount), currency)}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-white mt-4">
              {timeframe === "all" ? "All time" : `Last ${timeframe}`}
            </p>
          </div>

          {/* Donut Illustration positioned in bottom-right */}
          <div className="absolute -bottom-12 -right-16">
            <Fling className="w-72 h-72 text-heliotrope" />
          </div>
        </div>

        {/* Income & Expenses Summary */}
        <div className="md:col-span-2 bg-white rounded-xl border-2 border-gray-light p-6">
          <h3 className="text-lg font-semibold text-black mb-4">
            Financial Summary
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-jade/10 rounded-lg">
                  <ArrowUpRight className="h-5 w-5 text-jade" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-black">Total Income</p>
                  <p className="font-bold text-jade">
                    {formatCurrency(metrics.totalRevenue, baseCurrency)}
                  </p>
                  {hasMultipleCurrencies && (
                    <div className="mt-1 space-y-0.5">
                      {getTopCurrencies("revenue").map(
                        ({ currency, originalAmount }) => (
                          <div key={currency} className="text-xs text-black">
                            {currency}:{" "}
                            {formatCurrency(originalAmount, currency)}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-heliotrope/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-heliotrope" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-black">This Month</p>
                  <p
                    className={`font-bold ${
                      metrics.thisMonthNet >= 0
                        ? "text-jade"
                        : "text-bittersweet"
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
                <div className="p-2 bg-bittersweet/10 rounded-lg">
                  <ArrowDownRight className="h-5 w-5 text-bittersweet" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-black">
                    Total Expenses
                  </p>
                  <p className="font-bold text-bittersweet">
                    {formatCurrency(metrics.totalExpenses, baseCurrency)}
                  </p>
                  {hasMultipleCurrencies && (
                    <div className="mt-1 space-y-0.5">
                      {getTopCurrencies("expenses").map(
                        ({ currency, originalAmount }) => (
                          <div key={currency} className="text-xs text-black">
                            {currency}:{" "}
                            {formatCurrency(originalAmount, currency)}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    metrics.trend >= 0 ? "bg-jade/10" : "bg-bittersweet/10"
                  }`}
                >
                  {metrics.trend >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-jade" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-bittersweet" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-black">
                    vs Last Month
                  </p>
                  <p
                    className={`font-bold ${
                      metrics.trend >= 0 ? "text-jade" : "text-bittersweet"
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
  );
}
