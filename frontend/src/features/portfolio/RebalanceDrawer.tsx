import React, { useState } from 'react';
import { useRecommendations } from '../recommendations/useRecommendations';
import { X, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface RebalanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RebalanceDrawer: React.FC<RebalanceDrawerProps> = ({ isOpen, onClose }) => {
  const { useGetRebalance } = useRecommendations();
  // Call hook only when drawer is open to get fresh data
  const { data: rebalanceData, isLoading, error } = useGetRebalance({
    enabled: isOpen
  });

  const [sortField, setSortField] = useState<'class' | 'drift'>('class');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  if (!isOpen) return null;

  const handleSort = (field: 'class' | 'drift') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const getDriftBadgeColor = (drift: number) => {
    if (Math.abs(drift) <= 0.5) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (drift > 0) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  };

  // Compile table rows
  let rows = rebalanceData ? Object.keys(rebalanceData.target_allocations).map(key => {
    const targ = rebalanceData.target_allocations[key];
    const curr = rebalanceData.current_allocations[key] || 0;
    const drift = rebalanceData.drift[key] || 0;
    const diffVal = rebalanceData.total_value * (drift / 100.0);
    return {
      key,
      label: key.replace('_', ' ').toUpperCase(),
      current: curr,
      target: targ,
      drift,
      diffVal
    };
  }) : [];

  // Sort rows
  rows.sort((a, b) => {
    let comparison = 0;
    if (sortField === 'class') {
      comparison = a.label.localeCompare(b.label);
    } else {
      comparison = a.drift - b.drift;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-slate-900 border-l border-wealth-border flex flex-col h-full shadow-2xl transition-transform duration-300">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b border-wealth-border">
          <div>
            <h2 className="text-lg font-bold">Portfolio Rebalancing Advisor</h2>
            <p className="text-xs text-wealth-textSecondary mt-0.5">
              Realign your asset weightings with your target risk profile.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-wealth-textSecondary hover:text-wealth-textPrimary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <RefreshCw className="animate-spin text-wealth-accent" size={28} />
              <p className="text-sm text-wealth-textSecondary">Analyzing weights and compiling ledger recommendations...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-wealth-rose/10 border border-wealth-rose/20 rounded-lg flex gap-3 text-wealth-rose">
              <AlertCircle size={20} className="shrink-0" />
              <div>
                <p className="text-sm font-semibold">Failed to fetch advice</p>
                <p className="text-xs opacity-80 mt-1">Please try again or ensure your portfolio has holdings registered.</p>
              </div>
            </div>
          ) : rebalanceData ? (
            <>
              {/* Portfolio summary status */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-wealth-border/40">
                <div>
                  <span className="text-xxs text-wealth-textSecondary block uppercase font-bold tracking-wider">Total Value</span>
                  <span className="text-lg font-extrabold">{formatCurrency(rebalanceData.total_value)}</span>
                </div>
                <div>
                  <span className="text-xxs text-wealth-textSecondary block uppercase font-bold tracking-wider">Advice Status</span>
                  <span className="text-sm font-semibold flex items-center gap-1 mt-0.5">
                    {rebalanceData.suggestions.length === 0 ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span className="text-emerald-400">Balanced</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={14} className="text-blue-400" />
                        <span className="text-blue-400">Drift Detected</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-wealth-textSecondary">Allocation Comparison</h3>
                <div className="overflow-x-auto border border-wealth-border/40 rounded-lg bg-slate-950/20">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/50 border-b border-wealth-border/40">
                        <th 
                          onClick={() => handleSort('class')}
                          className="p-3 font-semibold text-wealth-textSecondary cursor-pointer hover:text-wealth-textPrimary"
                        >
                          Asset Class {sortField === 'class' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="p-3 font-semibold text-wealth-textSecondary text-right">Current</th>
                        <th className="p-3 font-semibold text-wealth-textSecondary text-right">Target</th>
                        <th 
                          onClick={() => handleSort('drift')}
                          className="p-3 font-semibold text-wealth-textSecondary text-right cursor-pointer hover:text-wealth-textPrimary"
                        >
                          Drift {sortField === 'drift' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-wealth-border/20">
                      {rows.map((row) => (
                        <tr key={row.key} className="hover:bg-slate-800/20">
                          <td className="p-3 font-medium">{row.label}</td>
                          <td className="p-3 text-right">{row.current.toFixed(1)}%</td>
                          <td className="p-3 text-right">{row.target.toFixed(1)}%</td>
                          <td className="p-3 text-right">
                            <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${getDriftBadgeColor(row.drift)}`}>
                              {row.drift >= 0 ? '+' : ''}{row.drift.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actionable Instructions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-wealth-textSecondary">BUY / SELL Suggestions</h3>
                <div className="space-y-3">
                  {rebalanceData.suggestions.length === 0 ? (
                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-center space-y-2">
                      <CheckCircle2 className="text-emerald-400 mx-auto" size={24} />
                      <div>
                        <p className="text-sm font-bold text-emerald-400">Your Portfolio is Balanced!</p>
                        <p className="text-xs text-wealth-textSecondary mt-0.5">
                          All asset classes are within 0.5% of target allocations. No action is required.
                        </p>
                      </div>
                    </div>
                  ) : (
                    rebalanceData.suggestions.map((sug, idx) => (
                      <div 
                        key={idx} 
                        className={`p-4 rounded-xl border flex gap-3 ${
                          sug.action === 'SELL' 
                            ? 'bg-rose-500/5 border-rose-500/20' 
                            : 'bg-emerald-500/5 border-emerald-500/20'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 h-fit ${
                          sug.action === 'SELL' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {sug.action === 'SELL' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold tracking-wide uppercase">
                              {sug.action} {sug.asset_class.replace('_', ' ')}
                            </span>
                            <span className={`text-xs font-extrabold ${sug.action === 'SELL' ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {formatCurrency(sug.amount)}
                            </span>
                          </div>
                          <p className="text-xs text-wealth-textSecondary leading-normal">
                            {sug.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-wealth-textSecondary text-center py-10">No rebalancing recommendations found.</p>
          )}
        </div>
      </div>
    </div>
  );
};
