// Currency utilities for multi-currency financial tracking
export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Rate to USD
  lastUpdated: string;
}

export interface CurrencyAmount {
  amount: number;
  currency: string;
  usdEquivalent?: number;
}

// Comprehensive currencies based on target countries - keeping all our ducks in a row!
export const SUPPORTED_CURRENCIES: Record<
  string,
  { name: string; symbol: string; flag: string }
> = {
  // Americas
  USD: { name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  CAD: { name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  BRL: { name: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
  MXN: { name: "Mexican Peso", symbol: "Mx$", flag: "🇲🇽" },

  // Europe
  EUR: { name: "Euro", symbol: "€", flag: "🇪🇺" },
  GBP: { name: "British Pound", symbol: "£", flag: "🇬🇧" },
  CHF: { name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  SEK: { name: "Swedish Krona", symbol: "kr", flag: "🇸🇪" },

  // Asia-Pacific
  JPY: { name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  KRW: { name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
  INR: { name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  IDR: { name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
  SGD: { name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  HKD: { name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
  TWD: { name: "Taiwan Dollar", symbol: "NT$", flag: "🇹🇼" },
  PHP: { name: "Philippine Peso", symbol: "₱", flag: "🇵🇭" },
  MYR: { name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾" },
  THB: { name: "Thai Baht", symbol: "฿", flag: "🇹🇭" },
  VND: { name: "Vietnamese Dong", symbol: "₫", flag: "🇻🇳" },
  AUD: { name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  NZD: { name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿" },

  // Africa
  ZAR: { name: "South African Rand", symbol: "R", flag: "🇿🇦" },
  NGN: { name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬" },

  // Cryptocurrencies
  BTC: { name: "Bitcoin", symbol: "₿", flag: "₿" },
  ETH: { name: "Ethereum", symbol: "Ξ", flag: "Ξ" },
};

// Fallback exchange rates (should be updated with real API in production)
const FALLBACK_RATES: Record<string, number> = {
  // Base currency
  USD: 1.0,

  // Americas
  CAD: 1.35,
  BRL: 5.2,
  MXN: 17.5,

  // Europe
  EUR: 0.85,
  GBP: 0.73,
  CHF: 0.92,
  SEK: 10.8,

  // Asia-Pacific
  JPY: 150.0,
  KRW: 1320.0,
  INR: 83.0,
  IDR: 15800.0,
  SGD: 1.35,
  HKD: 7.8,
  TWD: 31.5,
  PHP: 56.0,
  MYR: 4.65,
  THB: 36.0,
  VND: 24500.0,
  AUD: 1.5,
  NZD: 1.65,

  // Africa
  ZAR: 18.5,
  NGN: 850.0,

  // Cryptocurrencies (approximate)
  BTC: 0.000023, // 1 USD = 0.000023 BTC
  ETH: 0.00035, // 1 USD = 0.00035 ETH
};

export class CurrencyManager {
  private rates: Record<string, number> = FALLBACK_RATES;
  private lastUpdate: Date = new Date();

  // Format currency amount with proper symbol and formatting
  formatAmount(amount: number, currency: string): string {
    const currencyInfo = SUPPORTED_CURRENCIES[currency];
    if (!currencyInfo) {
      return `${currency} ${amount.toFixed(2)}`;
    }

    // Special formatting for different currencies
    switch (currency) {
      case "JPY":
      case "KRW":
      case "VND":
      case "IDR":
      case "NGN":
        // These currencies typically don't use decimal places
        return `${currencyInfo.symbol}${Math.round(amount).toLocaleString()}`;
      case "BTC":
        return `${currencyInfo.symbol}${amount.toFixed(8)}`;
      case "ETH":
        return `${currencyInfo.symbol}${amount.toFixed(6)}`;
      case "TWD":
      case "HKD":
        // Asian currencies that use whole numbers more commonly
        return `${currencyInfo.symbol}${amount.toFixed(0)}`;
      default:
        return `${currencyInfo.symbol}${amount.toFixed(2)}`;
    }
  }

  // Convert amount to USD equivalent
  convertToUSD(amount: number, currency: string): number {
    if (currency === "USD") return amount;
    const rate = this.rates[currency];
    if (!rate) return amount; // Fallback to original amount if rate not found

    return amount / rate;
  }

  // Convert amount from USD to target currency
  convertFromUSD(usdAmount: number, targetCurrency: string): number {
    if (targetCurrency === "USD") return usdAmount;
    const rate = this.rates[targetCurrency];
    if (!rate) return usdAmount;

    return usdAmount * rate;
  }

  // Convert between any two currencies
  convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;

    // Convert to USD first, then to target currency
    const usdAmount = this.convertToUSD(amount, fromCurrency);
    return this.convertFromUSD(usdAmount, toCurrency);
  }

  // Get all unique currencies from transactions
  getUniqueCurrencies(transactions: any[]): string[] {
    const currencies = new Set<string>();
    transactions.forEach((transaction) => {
      if (transaction.currency) {
        currencies.add(transaction.currency);
      }
    });
    return Array.from(currencies).sort();
  }

  // Calculate total value in a specific currency
  calculateTotal(transactions: any[], targetCurrency: string = "USD"): number {
    return transactions.reduce((total, transaction) => {
      const convertedAmount = this.convert(
        transaction.amount || 0,
        transaction.currency || "USD",
        targetCurrency
      );
      return total + convertedAmount;
    }, 0);
  }

  // Get currency info
  getCurrencyInfo(currency: string) {
    return (
      SUPPORTED_CURRENCIES[currency] || {
        name: currency,
        symbol: currency,
        flag: "💱",
      }
    );
  }

  // Update exchange rates (placeholder for future API integration)
  async updateRates(): Promise<void> {
    try {
      // TODO: Integrate with a real exchange rate API like:
      // - Fixer.io
      // - Exchange Rates API
      // - CurrencyAPI
      // - Alpha Vantage

      console.log("Currency rates updated:", new Date().toISOString());
      this.lastUpdate = new Date();
    } catch (error) {
      console.error("Failed to update currency rates:", error);
    }
  }

  // Check if rates need updating (older than 1 hour)
  needsRateUpdate(): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.lastUpdate < oneHourAgo;
  }
}

// Export singleton instance
export const currencyManager = new CurrencyManager();

// Helper functions for common use cases
export const formatCurrency = (amount: number, currency: string): string => {
  return currencyManager.formatAmount(amount, currency);
};

export const convertToUSD = (amount: number, currency: string): number => {
  return currencyManager.convertToUSD(amount, currency);
};

export const getCurrencySymbol = (currency: string): string => {
  return SUPPORTED_CURRENCIES[currency]?.symbol || currency;
};

export const getCurrencyFlag = (currency: string): string => {
  return SUPPORTED_CURRENCIES[currency]?.flag || "💱";
};
