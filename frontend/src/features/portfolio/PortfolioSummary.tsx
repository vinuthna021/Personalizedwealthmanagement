import React from 'react';
import { PortfolioSummary as SummaryType } from '../../types';
import { Wallet, Landmark, TrendingUp, TrendingDown } from 'lucide-react';

interface PortfolioSummaryProps {
  summary: SummaryType;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ summary }) => {
  const isProfit = summary.net_profit >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Total Valuation */}
      <div className="bg-wealth-card border border-wealth-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between text-wealth-textSecondary mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Net Portfolio Value</span>
          <Wallet size={16} className="text-wealth-accent" />
        </div>
        <p className="text-xl font-bold text-wealth-textPrimary">
          ₹{Number(summary.total_value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-wealth-textSecondary mt-1">Cash + Securities Valuation</p>
      </div>

      {/* Stock Holdings Valuation */}
      <div className="bg-wealth-card border border-wealth-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between text-wealth-textSecondary mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Securities Value</span>
          <TrendingUp size={16} className="text-emerald-400" />
        </div>
        <p className="text-xl font-bold text-wealth-textPrimary">
          ₹{Number(summary.stock_value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-wealth-textSecondary mt-1">
          Cost basis: ₹{Number(summary.stock_cost).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </p>
      </div>

      {/* Cash Liquid Balance */}
      <div className="bg-wealth-card border border-wealth-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between text-wealth-textSecondary mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Cash Balance</span>
          <Landmark size={16} className="text-teal-400" />
        </div>
        <p className="text-xl font-bold text-wealth-textPrimary">
          ₹{Number(summary.cash_balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-wealth-textSecondary mt-1">Available for trades & withdraws</p>
      </div>

      {/* Net Profit & Loss */}
      <div className="bg-wealth-card border border-wealth-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between text-wealth-textSecondary mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Net Returns (P&L)</span>
          {isProfit ? (
            <TrendingUp size={16} className="text-wealth-emerald" />
          ) : (
            <TrendingDown size={16} className="text-wealth-rose" />
          )}
        </div>
        <p className={`text-xl font-bold ${isProfit ? 'text-wealth-emerald' : 'text-wealth-rose'}`}>
          ₹{Number(summary.net_profit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className={`text-xs mt-1 font-semibold ${isProfit ? 'text-wealth-emerald' : 'text-wealth-rose'}`}>
          {isProfit ? '+' : ''}{Number(summary.percentage_profit).toFixed(2)}% ROI
        </p>
      </div>
    </div>
  );
};
