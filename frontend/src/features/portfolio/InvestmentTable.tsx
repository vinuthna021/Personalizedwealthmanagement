import React from 'react';
import { Investment } from '../../types';
import { Trash2, TrendingUp, TrendingDown } from 'lucide-react';

interface InvestmentTableProps {
  investments: Investment[];
  onDelete: (id: number) => void;
}

export const InvestmentTable: React.FC<InvestmentTableProps> = ({ investments, onDelete }) => {
  return (
    <div className="bg-wealth-card border border-wealth-border rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-wealth-border bg-slate-900/60 text-wealth-textSecondary text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Asset / Symbol</th>
              <th className="px-6 py-4 font-semibold text-right">Units Held</th>
              <th className="px-6 py-4 font-semibold text-right">Avg Cost</th>
              <th className="px-6 py-4 font-semibold text-right">Market Price</th>
              <th className="px-6 py-4 font-semibold text-right">Total Cost</th>
              <th className="px-6 py-4 font-semibold text-right">Current Value</th>
              <th className="px-6 py-4 font-semibold text-right">Total Gain/Loss</th>
              <th className="px-6 py-4 font-semibold text-right">Allocation</th>
              <th className="px-6 py-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-wealth-border/40">
            {investments.map((inv) => {
              const isCash = inv.symbol === 'CASH';
              const pnl = inv.current_value - inv.cost_basis;
              const pnlPercent = inv.cost_basis > 0 ? (pnl / inv.cost_basis) * 100 : 0;
              const isGain = pnl >= 0;

              return (
                <tr key={inv.id} className="hover:bg-slate-800/20 transition-colors">
                  {/* Asset info */}
                  <td className="px-6 py-4.5">
                    <p className="font-bold text-wealth-textPrimary">{inv.asset_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-wealth-textSecondary font-mono font-bold uppercase">
                        {inv.symbol}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${
                        isCash 
                          ? 'bg-teal-500/10 text-teal-400' 
                          : 'bg-wealth-accent/10 text-wealth-accent'
                      }`}>
                        {inv.asset_type}
                      </span>
                      {inv.data_provider && (
                        <span className="text-[9px] text-slate-500 font-semibold">
                          via {inv.data_provider}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Units */}
                  <td className="px-6 py-4.5 text-right font-semibold font-mono text-wealth-textPrimary">
                    {Number(inv.units).toLocaleString('en-IN', { maximumFractionDigits: 6 })}
                  </td>

                  {/* Avg Cost */}
                  <td className="px-6 py-4.5 text-right font-mono text-wealth-textPrimary">
                    ₹{Number(inv.avg_buy_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Current price */}
                  <td className="px-6 py-4.5 text-right">
                    <p className="font-mono text-wealth-textPrimary">
                      ₹{Number(inv.last_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {inv.last_price_at && (
                      <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">
                        {new Date(inv.last_price_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </td>

                  {/* Total Cost */}
                  <td className="px-6 py-4.5 text-right font-mono text-wealth-textPrimary">
                    ₹{Number(inv.cost_basis).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </td>

                  {/* Valuation */}
                  <td className="px-6 py-4.5 text-right font-bold font-mono text-wealth-textPrimary">
                    ₹{Number(inv.current_value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </td>

                  {/* P&L */}
                  <td className="px-6 py-4.5 text-right">
                    {isCash ? (
                      <span className="text-wealth-textSecondary font-mono">-</span>
                    ) : (
                      <div className={`font-mono font-bold flex items-center justify-end gap-1 ${
                        isGain ? 'text-wealth-emerald' : 'text-wealth-rose'
                      }`}>
                        {isGain ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span>
                          ₹{Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-[10px] font-normal">
                          ({isGain ? '+' : ''}{pnlPercent.toFixed(1)}%)
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Allocation percentage */}
                  <td className="px-6 py-4.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-bold font-mono text-wealth-textPrimary text-xs">
                        {Number(inv.allocation_percent).toFixed(1)}%
                      </span>
                      <div className="w-12 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-wealth-accent h-full rounded-full" 
                          style={{ width: `${inv.allocation_percent}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4.5 text-center">
                    <button
                      onClick={() => onDelete(inv.id)}
                      className="p-1.5 text-wealth-textSecondary hover:text-wealth-rose hover:bg-slate-800 rounded-lg transition-colors"
                      title="Remove Holding"
                      disabled={isCash} // Cash holding cannot be deleted manually
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
