import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { TransactionForm } from './TransactionForm';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import apiClient from '../../lib/api_client';
import { Transaction } from '../../types';
import { Plus, History, Trash2, AlertCircle } from 'lucide-react';

export const TransactionsList: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch transaction logs
  const { data: transactions = [], isLoading, error } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await apiClient.get('/transactions');
      return response.data;
    }
  });

  // Post Transaction mutation
  const createMutation = useMutation({
    mutationFn: async (newTx: any) => {
      return apiClient.post('/transactions', newTx);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary'] });
      setIsModalOpen(false);
    }
  });

  // Reverse/Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiClient.delete(`/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary'] });
    }
  });

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleFormSubmit = async (data: any) => {
    await createMutation.mutateAsync(data);
  };

  const handleDeleteTx = async (id: number) => {
    if (window.confirm('Are you sure you want to reverse this transaction? This will restore cash and holdings values.')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err: any) {
        alert(err.response?.data?.error?.message || 'Failed to reverse transaction');
      }
    }
  };

  return (
    <div className="flex h-screen bg-wealth-bg text-wealth-textPrimary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />
        
        <main className="p-8 max-w-5xl w-full mx-auto space-y-8">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Transaction Ledger</h1>
              <p className="text-sm text-wealth-textSecondary mt-1">
                Log purchases, sales, cash deposits, and withdrawals.
              </p>
            </div>
            <Button onClick={handleOpenModal} className="flex items-center gap-2">
              <Plus size={16} />
              <span>Log Transaction</span>
            </Button>
          </div>

          {/* Transaction Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-wealth-textSecondary">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-wealth-accent"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-wealth-rose/10 border border-wealth-rose/20 text-wealth-rose rounded-lg flex items-center gap-3">
              <AlertCircle size={20} />
              <span>Failed to load transaction logs.</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-wealth-card border border-wealth-border border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center">
              <History className="text-wealth-textSecondary mb-4" size={48} />
              <h3 className="text-lg font-bold">No Transactions Logged</h3>
              <p className="text-sm text-wealth-textSecondary max-w-xs mt-1 mb-6">
                You haven't registered any transactions yet. Start by logging a cash contribution.
              </p>
              <Button onClick={handleOpenModal}>Log Your First Transaction</Button>
            </div>
          ) : (
            <div className="bg-wealth-card border border-wealth-border rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-wealth-border bg-slate-900/60 text-wealth-textSecondary text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Type</th>
                      <th className="px-6 py-4 font-semibold">Symbol</th>
                      <th className="px-6 py-4 font-semibold text-right">Quantity</th>
                      <th className="px-6 py-4 font-semibold text-right">Price</th>
                      <th className="px-6 py-4 font-semibold text-right">Fees</th>
                      <th className="px-6 py-4 font-semibold text-right">Net Impact</th>
                      <th className="px-6 py-4 font-semibold">Notes</th>
                      <th className="px-6 py-4 font-semibold text-center">Reverse</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-wealth-border/40">
                    {transactions.map((tx) => {
                      const dateStr = new Date(tx.executed_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      });

                      const typeColors = {
                        buy: 'bg-wealth-rose/10 text-wealth-rose border border-wealth-rose/25',
                        sell: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
                        contribution: 'bg-teal-500/10 text-teal-400 border border-teal-500/25',
                        withdrawal: 'bg-orange-500/10 text-orange-400 border border-orange-500/25',
                        dividend: 'bg-purple-500/10 text-purple-400 border border-purple-500/25',
                      };

                      return (
                        <tr key={tx.id} className="hover:bg-slate-800/20 transition-colors">
                          {/* Date */}
                          <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                            {dateStr}
                          </td>

                          {/* Type */}
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded uppercase tracking-wider ${typeColors[tx.type]}`}>
                              {tx.type}
                            </span>
                          </td>

                          {/* Symbol */}
                          <td className="px-6 py-4 font-bold font-mono text-wealth-textPrimary">
                            {tx.symbol}
                          </td>

                          {/* Quantity */}
                          <td className="px-6 py-4 text-right font-mono font-semibold">
                            {Number(tx.quantity).toLocaleString('en-IN', { maximumFractionDigits: 6 })}
                          </td>

                          {/* Price */}
                          <td className="px-6 py-4 text-right font-mono">
                            ₹{Number(tx.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Fees */}
                          <td className="px-6 py-4 text-right font-mono text-wealth-textSecondary">
                            ₹{Number(tx.fees).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Net Cash Impact */}
                          <td className="px-6 py-4 text-right font-bold font-mono text-wealth-textPrimary">
                            ₹{Number(tx.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Notes */}
                          <td className="px-6 py-4 text-xs text-wealth-textSecondary max-w-xs truncate" title={tx.notes || ''}>
                            {tx.notes || '-'}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleDeleteTx(tx.id)}
                              className="p-1.5 text-wealth-textSecondary hover:text-wealth-rose hover:bg-slate-800 rounded-lg transition-colors"
                              title="Reverse Transaction"
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
          )}

          {/* Form Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title="Log New Transaction"
          >
            <TransactionForm 
              onSubmit={handleFormSubmit} 
              onCancel={handleCloseModal} 
            />
          </Modal>
        </main>
      </div>
    </div>
  );
};
