import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import apiClient from '../../lib/api_client';
import { Goal, Transaction, PortfolioSummary } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Wallet, Goal as GoalIcon, ShieldCheck, History, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // 1. Fetch goals query
  const { data: goals = [], isLoading: isGoalsLoading } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await apiClient.get('/goals');
      return response.data;
    }
  });

  // 2. Fetch portfolio summary query
  const { data: summary, isLoading: isSummaryLoading } = useQuery<PortfolioSummary>({
    queryKey: ['portfolio-summary'],
    queryFn: async () => {
      const response = await apiClient.get('/investments/summary');
      return response.data;
    }
  });

  // 3. Fetch recent transactions query
  const { data: transactions = [], isLoading: isTxLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await apiClient.get('/transactions');
      return response.data;
    }
  });

  if (!user) return null;

  const activeGoalsCount = goals.filter((g) => g.status === 'active').length;
  const recentTx = transactions.slice(0, 4);

  // Map goals data for targets chart
  const goalsChartData = goals.map((g) => ({
    name: g.goal_name,
    saved: Number(g.current_amount),
    target: Number(g.target_amount)
  }));

  const isLoading = isGoalsLoading || isSummaryLoading || isTxLoading;

  return (
    <div className="flex h-screen bg-wealth-bg text-wealth-textPrimary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />
        
        <main className="p-8 max-w-5xl w-full mx-auto space-y-8">
          {/* Greeting */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
            <p className="text-sm text-wealth-textSecondary mt-1">
              Your wealth configuration, portfolio aggregates, and goals progress at a glance.
            </p>
          </div>

          {/* Compliance warning */}
          {user.kyc_status === 'unverified' && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl flex items-start gap-3.5 shadow-sm">
              <AlertTriangle className="shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-sm">Action Required: Compliance Verification</h4>
                <p className="text-xs mt-1 opacity-90">
                  Please complete your KYC check in settings to unlock complete portfolio valuation.{' '}
                  <Link to="/profile" className="underline font-bold hover:text-amber-400">
                    Verify Identity &rarr;
                  </Link>
                </p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-wealth-textSecondary">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-wealth-accent"></div>
            </div>
          ) : (
            <>
              {/* Stats Summary Panel */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Net Portfolio Value */}
                <div className="bg-wealth-card border border-wealth-border rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-wealth-textSecondary mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Net Portfolio Value</span>
                    <Wallet size={16} className="text-wealth-accent" />
                  </div>
                  <p className="text-xl font-bold text-wealth-textPrimary">
                    ₹{summary ? Number(summary.total_value).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}
                  </p>
                  <p className="text-[10px] text-wealth-textSecondary mt-1">Securities + Cash Balance</p>
                </div>

                {/* Stock investments P&L */}
                <div className="bg-wealth-card border border-wealth-border rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-wealth-textSecondary mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Securities Profit</span>
                    <TrendingUp size={16} className="text-emerald-400" />
                  </div>
                  <p className={`text-xl font-bold ${summary && summary.net_profit >= 0 ? 'text-wealth-emerald' : 'text-wealth-rose'}`}>
                    ₹{summary ? Number(summary.net_profit).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}
                  </p>
                  <p className="text-[10px] text-wealth-textSecondary mt-1">
                    Return: {summary ? summary.percentage_profit.toFixed(1) : '0.0'}%
                  </p>
                </div>

                {/* Active Goals count */}
                <div className="bg-wealth-card border border-wealth-border rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-wealth-textSecondary mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Active Goals</span>
                    <GoalIcon size={16} className="text-teal-400" />
                  </div>
                  <p className="text-xl font-bold text-wealth-textPrimary">{activeGoalsCount}</p>
                  <p className="text-[10px] text-wealth-textSecondary mt-1">Configured future milestones</p>
                </div>

                {/* Cash Balance */}
                <div className="bg-wealth-card border border-wealth-border rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-wealth-textSecondary mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Cash Balance</span>
                    <ShieldCheck size={16} className="text-emerald-400" />
                  </div>
                  <p className="text-xl font-bold text-wealth-textPrimary">
                    ₹{summary ? Number(summary.cash_balance).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}
                  </p>
                  <p className="text-[10px] text-wealth-textSecondary mt-1">Liquid cash in portfolio</p>
                </div>
              </div>

              {/* Middle Section: Goals target vs savings & Goals List */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Chart */}
                <div className="lg:col-span-2 bg-wealth-card border border-wealth-border rounded-xl p-6 shadow-sm flex flex-col">
                  <h3 className="text-sm font-bold text-wealth-textSecondary uppercase tracking-wider mb-4">
                    Milestone Balances (Target vs Saved)
                  </h3>
                  {goalsChartData.length > 0 ? (
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={goalsChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#243249" />
                          <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                          <YAxis stroke="#94A3B8" fontSize={11} formatter={(v) => `₹${Number(v) / 1000}k`} />
                          <Tooltip 
                            formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`}
                            contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px' }}
                            itemStyle={{ color: '#F8FAFC' }}
                          />
                          <Bar dataKey="saved" fill="#3B82F6" name="Saved" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="target" fill="#1E293B" stroke="#334155" name="Target" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                      <p className="text-xs text-wealth-textSecondary mb-2">No goals configured yet.</p>
                      <Link to="/goals" className="text-xs text-wealth-accent font-bold hover:underline">
                        Set up targets &rarr;
                      </Link>
                    </div>
                  )}
                </div>

                {/* Goals progress list */}
                <div className="bg-wealth-card border border-wealth-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-wealth-textSecondary uppercase tracking-wider mb-4">
                      Goal Progress Status
                    </h3>
                    <div className="space-y-4">
                      {goals.slice(0, 3).map((g) => {
                        const progress = g.calculations.progress_percent;
                        return (
                          <div key={g.id} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-wealth-textPrimary">
                              <span>{g.goal_name}</span>
                              <span>{progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-wealth-accent h-full" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        );
                      })}
                      {goals.length === 0 && (
                        <p className="text-xs text-wealth-textSecondary text-center py-8">
                          No active goals listed.
                        </p>
                      )}
                    </div>
                  </div>
                  {goals.length > 3 && (
                    <Link to="/goals" className="text-xs text-wealth-accent text-right font-semibold mt-4 block">
                      View all goals &rarr;
                    </Link>
                  )}
                </div>
              </div>

              {/* Bottom Row: Recent Transaction Ledger */}
              <div className="bg-wealth-card border border-wealth-border rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-wealth-textSecondary uppercase tracking-wider mb-4 flex items-center gap-2">
                  <History size={16} className="text-wealth-accent" />
                  <span>Recent Transactions</span>
                </h3>

                {recentTx.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-wealth-border/60 text-wealth-textSecondary font-semibold">
                          <th className="pb-2">Date</th>
                          <th className="pb-2">Type</th>
                          <th className="pb-2">Symbol</th>
                          <th className="pb-2 text-right">Quantity</th>
                          <th className="pb-2 text-right">Price</th>
                          <th className="pb-2 text-right">Net Impact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-wealth-border/40">
                        {recentTx.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-800/10">
                            <td className="py-2.5 font-mono text-wealth-textSecondary">
                              {new Date(tx.executed_at).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="py-2.5 font-bold uppercase tracking-wider text-wealth-accent">
                              {tx.type}
                            </td>
                            <td className="py-2.5 font-bold text-wealth-textPrimary">{tx.symbol}</td>
                            <td className="py-2.5 text-right font-mono font-semibold">
                              {Number(tx.quantity).toLocaleString('en-IN', { maximumFractionDigits: 6 })}
                            </td>
                            <td className="py-2.5 text-right font-mono">
                              ₹{Number(tx.price).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 text-right font-bold font-mono">
                              ₹{Number(tx.total_amount).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-wealth-textSecondary text-center py-6">
                    No transactions posted yet.
                  </p>
                )}
                
                {transactions.length > recentTx.length && (
                  <Link to="/transactions" className="text-xs text-wealth-accent font-semibold block text-right mt-4">
                    View full ledger &rarr;
                  </Link>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
