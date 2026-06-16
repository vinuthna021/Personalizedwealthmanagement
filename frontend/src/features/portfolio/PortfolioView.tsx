import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PortfolioSummary } from './PortfolioSummary';
import { InvestmentTable } from './InvestmentTable';
import apiClient from '../../lib/api_client';
import { Investment, PortfolioSummary as SummaryType } from '../../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Briefcase, AlertCircle, Plus, Info, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PortfolioView: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch investments list
  const { data: investments = [], isLoading: isListLoading, error: listError } = useQuery<Investment[]>({
    queryKey: ['investments'],
    queryFn: async () => {
      const response = await apiClient.get('/investments');
      return response.data;
    }
  });

  // Fetch summary metrics
  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useQuery<SummaryType>({
    queryKey: ['portfolio-summary'],
    queryFn: async () => {
      const response = await apiClient.get('/investments/summary');
      return response.data;
    }
  });

  // Delete holding mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiClient.delete(`/investments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary'] });
    }
  });

  // Manual refresh mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/portfolio/refresh');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary'] });
    }
  });

  const handleDeleteHolding = async (id: number) => {
    if (window.confirm('Are you sure you want to remove this holding? This won\'t delete past transaction logs.')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleRefreshPrices = async () => {
    await refreshMutation.mutateAsync();
  };

  const isLoading = isListLoading || isSummaryLoading;
  const error = listError || summaryError;

  // Recharts allocation data mapping
  const allocationData = investments
    .filter((inv) => Number(inv.units) > 0)
    .map((inv) => ({
      name: inv.asset_name,
      value: Number(inv.current_value),
      symbol: inv.symbol,
      percent: Number(inv.allocation_percent)
    }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6'];

  return (
    <div className="flex h-screen bg-wealth-bg text-wealth-textPrimary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />
        
        <main className="p-8 max-w-5xl w-full mx-auto space-y-8">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Portfolio Holdings</h1>
              <p className="text-sm text-wealth-textSecondary mt-1">
                Track your active assets, cost metrics, and allocations.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleRefreshPrices}
                disabled={refreshMutation.isPending}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-sm font-semibold rounded-lg transition-colors border border-wealth-border/60 disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshMutation.isPending ? "animate-spin" : ""} />
                <span>{refreshMutation.isPending ? "Refreshing..." : "Refresh Prices"}</span>
              </button>
              <Link 
                to="/transactions" 
                className="flex items-center gap-2 px-4 py-2.5 bg-wealth-accent hover:bg-wealth-accentHover text-sm font-semibold rounded-lg transition-colors"
              >
                <Plus size={16} />
                <span>Log Transaction</span>
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-wealth-textSecondary">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-wealth-accent"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-wealth-rose/10 border border-wealth-rose/20 text-wealth-rose rounded-lg flex items-center gap-3">
              <AlertCircle size={20} />
              <span>Failed to load portfolio details. Make sure database is online.</span>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              {summary && <PortfolioSummary summary={summary} />}

              {/* Grid: Table & Allocation Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Allocation Pie Chart */}
                {allocationData.length > 0 ? (
                  <div className="bg-wealth-card border border-wealth-border rounded-xl p-6 shadow-md flex flex-col items-center">
                    <h3 className="text-sm font-bold text-wealth-textSecondary uppercase tracking-wider mb-4 w-full">
                      Asset Allocation
                    </h3>
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={allocationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {allocationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Value']}
                            contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px' }}
                            itemStyle={{ color: '#F8FAFC' }}
                          />
                          <Legend 
                            layout="horizontal" 
                            align="center"
                            verticalAlign="bottom"
                            iconSize={10}
                            formatter={(value) => <span className="text-[11px] text-wealth-textSecondary font-semibold">{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="bg-wealth-card border border-wealth-border rounded-xl p-6 shadow-md flex flex-col items-center justify-center text-center">
                    <Info className="text-wealth-textSecondary mb-2" size={24} />
                    <p className="text-xs text-wealth-textSecondary">
                      No assets found. Allocation chart will appear when you buy assets.
                    </p>
                  </div>
                )}

                {/* Info widget */}
                <div className="lg:col-span-2 bg-slate-900/40 border border-wealth-border/50 rounded-xl p-6 flex flex-col justify-center">
                  <h3 className="font-bold text-sm text-wealth-accent flex items-center gap-2 mb-2">
                    <Info size={16} />
                    <span>How Cash Reconciliation Works</span>
                  </h3>
                  <p className="text-xs text-wealth-textSecondary leading-relaxed space-y-2">
                    Our platform automatically tracks your liquid cash balance under the <strong>CASH</strong> ticker. 
                    Adding a <em>contribution</em> transaction deposits cash. Posting stock <em>buys</em> consumes 
                    that cash and logs the asset holdings. Selling holdings transfers the value back into liquid cash.
                  </p>
                  <div className="mt-4 flex gap-4">
                    <Link to="/transactions" className="text-xs text-wealth-accent hover:underline font-bold">
                      Log a deposit &rarr;
                    </Link>
                  </div>
                </div>
              </div>

              {/* Holdings Table */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Briefcase size={20} className="text-wealth-accent" />
                  <span>Holdings Ledger</span>
                </h3>
                <InvestmentTable 
                  investments={investments} 
                  onDelete={handleDeleteHolding} 
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
