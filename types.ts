export interface Trade {
  id: string;
  assetName: string;
  entryPrice: number;
  tradeValue: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  takeProfit: number; // Expected profit (positive value)
  stopLoss: number; // Expected loss (should be a positive value, handled as negative in logic)
  status: 'open' | 'closed';
  pnl: number; // Final PnL, 0 for open trades.
  capitalBeforeTrade: number;
  openDate?: number; // Timestamp of when the trade was opened
  closeDate?: number; // Timestamp of when the trade was closed
  notes?: string; // For trading journal entries
}

export interface Target {
  id: string;
  name: string;
  amount: number;
}

export interface Portfolio {
  id: string;
  portfolioName: string;
  initialCapital: number;
  targets: Target[];
  trades: Trade[];
  currency: string;
}

export interface UserProfile {
  displayName: string;
  phoneNumber: string;
  photoURL: string; // Can be a URL from Google or a Base64 string from upload
}
