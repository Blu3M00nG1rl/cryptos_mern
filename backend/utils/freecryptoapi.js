/**
 * FreeCryptoAPI - JavaScript/TypeScript Client Library
 * https://freecryptoapi.com
 *
 * A zero-dependency client for the FreeCryptoAPI cryptocurrency data service.
 * Works in Node.js 18+ and modern browsers.
 *
 * @version 1.0.0
 * @license MIT
 */

const BASE_URL = "https://api.freecryptoapi.com/v1";

class FreeCryptoAPIError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   */
  constructor(message, statusCode) {
    super(message);
    this.name = "FreeCryptoAPIError";
    this.statusCode = statusCode;
  }
}

class FreeCryptoAPI {
  /**
   * Create a new FreeCryptoAPI client.
   * @param {string} apiKey - Your FreeCryptoAPI API key.
   */
  constructor(apiKey) {
    if (!apiKey || typeof apiKey !== "string") {
      throw new FreeCryptoAPIError("API key is required and must be a string.", 0);
    }
    this.apiKey = apiKey;
    this.baseUrl = BASE_URL;
  }

  /**
   * Internal method to perform HTTP requests.
   * @param {string} endpoint - API endpoint path (e.g. "/getCryptoList").
   * @param {Record<string, string | number | undefined>} [params] - Query parameters.
   * @returns {Promise<any>}
   */
  async _request(endpoint, params) {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      let message;
      try {
        const body = await response.json();
        message = body.message || body.error || response.statusText;
      } catch {
        message = response.statusText;
      }
      throw new FreeCryptoAPIError(message, response.status);
    }

    return response.json();
  }

  // ---------------------------------------------------------------------------
  // Market Data
  // ---------------------------------------------------------------------------

  /**
   * Get a list of all available cryptocurrencies.
   * @returns {Promise<any>}
   */
  async getCryptoList() {
    return this._request("/getCryptoList");
  }

  /**
   * Get current price data for one or more symbols.
   * Separate multiple symbols with "+". Append "@exchange" to query a specific exchange.
   * @param {string} symbol - Symbol(s) to query, e.g. "BTC" or "BTC+ETH" or "BTC@binance".
   * @returns {Promise<any>}
   */
  async getData(symbol) {
    return this._request("/getData", { symbol });
  }

  /**
   * Get the top cryptocurrencies by market cap.
   * @param {number} [top] - Number of top coins to return.
   * @returns {Promise<any>}
   */
  async getTop(top) {
    return this._request("/getTop", { top });
  }

  /**
   * Get price data converted to a specific local/fiat currency.
   * @param {string} symbol - Crypto symbol, e.g. "BTC".
   * @param {string} local - Local currency code, e.g. "EUR".
   * @returns {Promise<any>}
   */
  async getDataCurrency(symbol, local) {
    return this._request("/getDataCurrency", { symbol, local });
  }

  /**
   * Get performance metrics for a cryptocurrency.
   * @param {string} symbol - Crypto symbol, e.g. "BTC".
   * @returns {Promise<any>}
   */
  async getPerformance(symbol) {
    return this._request("/getPerformance", { symbol });
  }

  /**
   * Get volatility data for a specific symbol or top coins.
   * @param {{ symbol?: string; top?: number }} [options]
   * @returns {Promise<any>}
   */
  async getVolatility(options) {
    return this._request("/getVolatility", options);
  }

  /**
   * Get all-time high and all-time low data.
   * @param {{ symbol?: string; months?: number }} [options]
   * @returns {Promise<any>}
   */
  async getATHATL(options) {
    return this._request("/getATHATL", options);
  }

  /**
   * Get the current Crypto Fear & Greed Index.
   * @returns {Promise<any>}
   */
  async getFearGreed() {
    return this._request("/getFearGreed");
  }

  // ---------------------------------------------------------------------------
  // Technical Analysis
  // ---------------------------------------------------------------------------

  /**
   * Get technical analysis indicators for a symbol.
   * @param {string} symbol - Crypto symbol, e.g. "BTC".
   * @returns {Promise<any>}
   */
  async getTechnicalAnalysis(symbol) {
    return this._request("/getTechnicalAnalysis", { symbol });
  }

  /**
   * Get breakout signals, optionally filtered by symbol.
   * @param {string} [symbol] - Crypto symbol to filter by.
   * @returns {Promise<any>}
   */
  async getBreakouts(symbol) {
    return this._request("/getBreakouts", symbol ? { symbol } : undefined);
  }

  /**
   * Get correlation data between multiple symbols.
   * @param {string} symbols - Symbols separated by "+", e.g. "BTC+ETH+SOL".
   * @param {number} [days] - Number of days to compute correlation over.
   * @returns {Promise<any>}
   */
  async getCorrelation(symbols, days) {
    return this._request("/getCorrelation", { symbols, days });
  }

  /**
   * Get support and resistance levels for a symbol.
   * @param {string} symbol - Crypto symbol, e.g. "BTC".
   * @param {string} [period] - Time period for calculation.
   * @returns {Promise<any>}
   */
  async getSupportResistance(symbol, period) {
    return this._request("/getSupportResistance", { symbol, period });
  }

  /**
   * Get Moving Average Ribbon data for a symbol.
   * @param {string} symbol - Crypto symbol, e.g. "BTC".
   * @param {number} [days] - Number of days.
   * @returns {Promise<any>}
   */
  async getMARibbon(symbol, days) {
    return this._request("/getMARibbon", { symbol, days });
  }

  /**
   * Get Bollinger Bands data for a symbol.
   * @param {string} symbol - Crypto symbol, e.g. "BTC".
   * @param {{ days?: number; period?: number; std_dev?: number }} [options]
   * @returns {Promise<any>}
   */
  async getBollinger(symbol, options) {
    return this._request("/getBollinger", { symbol, ...options });
  }

  // ---------------------------------------------------------------------------
  // Exchange Data
  // ---------------------------------------------------------------------------

  /**
   * Get data for a specific exchange.
   * @param {string} exchange - Exchange name, e.g. "binance".
   * @returns {Promise<any>}
   */
  async getExchange(exchange) {
    return this._request("/getExchange", { exchange });
  }

  // ---------------------------------------------------------------------------
  // Conversion
  // ---------------------------------------------------------------------------

  /**
   * Convert an amount from one currency to another.
   * @param {string} from - Source currency symbol, e.g. "BTC".
   * @param {string} to - Target currency symbol, e.g. "USD".
   * @param {number} amount - Amount to convert.
   * @returns {Promise<any>}
   */
  async getConversion(from, to, amount) {
    return this._request("/getConversion", { from, to, amount });
  }

  // ---------------------------------------------------------------------------
  // Historical Data
  // ---------------------------------------------------------------------------

  /**
   * Get historical price data for a symbol over a number of days.
   * @param {string} symbol - Crypto symbol, e.g. "BTC".
   * @param {number} days - Number of past days.
   * @returns {Promise<any>}
   */
  async getHistory(symbol, days) {
    return this._request("/getHistory", { symbol, days });
  }

  /**
   * Get price data for a symbol within a specific date range.
   * @param {string} symbol - Crypto symbol, e.g. "BTC".
   * @param {string} start - Start date (YYYY-MM-DD).
   * @param {string} end - End date (YYYY-MM-DD).
   * @returns {Promise<any>}
   */
  async getTimeframe(symbol, start, end) {
    return this._request("/getTimeframe", { symbol, start, end });
  }

  /**
   * Get OHLC (Open-High-Low-Close) candlestick data.
   * @param {string} symbol - Crypto symbol, e.g. "BTC".
   * @param {{ days?: number; start_date?: string; end_date?: string }} [options]
   * @returns {Promise<any>}
   */
  async getOHLC(symbol, options) {
    return this._request("/getOHLC", { symbol, ...options });
  }
}

// ES Module export
export { FreeCryptoAPI, FreeCryptoAPIError };
export default FreeCryptoAPI;

// CommonJS fallback
if (typeof module !== "undefined" && module.exports) {
  module.exports = { FreeCryptoAPI, FreeCryptoAPIError };
  module.exports.default = FreeCryptoAPI;
}
