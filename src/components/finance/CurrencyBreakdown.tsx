import { currencyManager, formatCurrency } from "../../utils/currency";

interface CurrencyBreakdownProps {
  showCurrencyBreakdown: boolean;
  uniqueCurrencies: string[];
  currencyBreakdown: Record<
    string,
    { revenue: number; expenses: number; net: number }
  >;
  baseCurrency: string;
}

export function CurrencyBreakdown({
  showCurrencyBreakdown,
  uniqueCurrencies,
  currencyBreakdown,
  baseCurrency,
}: CurrencyBreakdownProps) {
  if (!showCurrencyBreakdown || uniqueCurrencies.length <= 1) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-light p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-black">Currency Breakdown</h3>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-heliotrope/10 text-heliotrope">
          {uniqueCurrencies.length} currencies
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {uniqueCurrencies.map((currency) => {
          const breakdown = currencyBreakdown[currency];
          const currencyInfo = currencyManager.getCurrencyInfo(currency);
          return (
            <div
              key={currency}
              className="bg-concrete/50 rounded-lg p-4 border border-gray-light hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{currencyInfo.flag}</span>
                  <span className="font-bold text-black text-lg">
                    {currency}
                  </span>
                </div>
                <span className="text-xs text-black bg-white px-2 py-1 rounded">
                  {currencyInfo.name}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-black">Income:</span>
                  <span className="text-jade font-semibold">
                    +{formatCurrency(breakdown.revenue, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-black">Expenses:</span>
                  <span className="text-bittersweet font-semibold">
                    -{formatCurrency(breakdown.expenses, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-heliotrope/30">
                  <span className="text-sm font-medium text-black">Net:</span>
                  <span
                    className={`font-bold ${
                      breakdown.net >= 0 ? "text-jade" : "text-bittersweet"
                    }`}
                  >
                    {breakdown.net >= 0 ? "+" : ""}
                    {formatCurrency(Math.abs(breakdown.net), currency)}
                  </span>
                </div>
                {currency !== baseCurrency && (
                  <div className="flex justify-between items-center text-xs text-black bg-white rounded px-2 py-1">
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
  );
}
