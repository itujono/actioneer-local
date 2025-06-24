import React from "react";
import {
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatCurrency } from "../../utils/currency";

interface FinanceMetricsProps {
  metrics: {
    netIncome: number;
    totalRevenue: number;
    totalExpenses: number;
    thisMonthNet: number;
    trend: number;
  };
  baseCurrency: string;
  timeframe: string;
}

export function FinanceMetrics({
  metrics,
  baseCurrency,
  timeframe,
}: FinanceMetricsProps) {
  return (
    <div className="mt-8 space-y-6">
      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Income - Featured Card */}
        <div className="md:col-span-1 bg-heliotrope/10 border-2 border-heliotrope rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-heliotrope uppercase tracking-wide">
                Net Income
              </p>
              <p
                className={`text-lg font-bold mt-2 ${
                  metrics.netIncome >= 0 ? "text-jade" : "text-black"
                }`}
              >
                {metrics.netIncome >= 0 ? "+" : ""}
                {formatCurrency(Math.abs(metrics.netIncome), baseCurrency)}
              </p>
              <p className="text-sm text-heliotrope mt-1">
                {timeframe === "all" ? "All time" : `Last ${timeframe}`}
              </p>
            </div>
            <div
              className={`p-3 rounded-full ${
                metrics.netIncome >= 0 ? "bg-daisy" : "bg-daisy"
              }`}
            >
              <PiggyBank className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Income & Expenses Summary */}
        <div className="md:col-span-2 bg-white rounded-xl border border-heliotrope/30 p-6">
          <h3 className="text-lg font-semibold text-black mb-4">
            Financial Summary
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-jade/10 rounded-lg">
                  <ArrowUpRight className="h-5 w-5 text-jade" />
                </div>
                <div>
                  <p className="text-sm font-medium text-black">Total Income</p>
                  <p className="font-bold text-jade">
                    {formatCurrency(metrics.totalRevenue, baseCurrency)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-heliotrope/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-heliotrope" />
                </div>
                <div>
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
                <div>
                  <p className="text-sm font-medium text-black">
                    Total Expenses
                  </p>
                  <p className="font-bold text-bittersweet">
                    {formatCurrency(metrics.totalExpenses, baseCurrency)}
                  </p>
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
                <div>
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
