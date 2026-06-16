import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { GoalCard } from './GoalCard';
import { GoalForm } from './GoalForm';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import apiClient from '../../lib/api_client';
import { Goal } from '../../types';
import { Target, Plus, AlertCircle, Sparkles } from 'lucide-react';

export const GoalsList: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Fetch goals
  const { data: goals = [], isLoading, error } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await apiClient.get('/goals');
      return response.data;
    }
  });

  // Create Goal Mutation
  const createMutation = useMutation({
    mutationFn: async (newGoal: any) => {
      return apiClient.post('/goals', newGoal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      handleCloseModal();
    }
  });

  // Update Goal Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiClient.put(`/goals/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      handleCloseModal();
    }
  });

  // Delete Goal Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiClient.delete(`/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const handleOpenCreateModal = () => {
    setSelectedGoal(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGoal(null);
  };

  const handleFormSubmit = async (data: any) => {
    if (selectedGoal) {
      await updateMutation.mutateAsync({ id: selectedGoal.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this goal? This cannot be undone.')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  // Aggregated goals metrics
  const totalTarget = goals.reduce((acc, curr) => acc + Number(curr.target_amount), 0);
  const totalSavings = goals.reduce((acc, curr) => acc + Number(curr.current_amount), 0);
  const aggregateProgress = totalTarget > 0 ? (totalSavings / totalTarget) * 100 : 0;

  return (
    <div className="flex h-screen bg-wealth-bg text-wealth-textPrimary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />
        
        <main className="p-8 max-w-5xl w-full mx-auto space-y-8">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Goals Tracker</h1>
              <p className="text-sm text-wealth-textSecondary mt-1">Set and monitor your future wealth targets.</p>
            </div>
            <Button onClick={handleOpenCreateModal} className="flex items-center gap-2">
              <Plus size={16} />
              <span>New Goal</span>
            </Button>
          </div>

          {/* Aggregate Goals Dashboard Panel */}
          {goals.length > 0 && (
            <div className="bg-gradient-to-r from-slate-900 to-wealth-card border border-wealth-border rounded-xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-wealth-accent animate-pulse" size={18} />
                <h3 className="font-bold text-sm text-wealth-textPrimary uppercase tracking-wider">Goal Savings Progress</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 space-y-2.5">
                  <div className="flex justify-between text-xs font-semibold text-wealth-textSecondary">
                    <span>Aggregate Completion</span>
                    <span className="text-wealth-accent font-bold">{aggregateProgress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-wealth-border/50">
                    <div 
                      className="bg-gradient-to-r from-wealth-accent to-emerald-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${aggregateProgress}%` }}
                    />
                  </div>
                </div>
                <div className="bg-slate-950/40 border border-wealth-border/40 rounded-xl p-4 text-center">
                  <p className="text-xs text-wealth-textSecondary uppercase tracking-wider">Total Future Targets</p>
                  <p className="text-2xl font-extrabold text-wealth-accent mt-1">
                    ₹{totalTarget.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-[10px] text-wealth-textSecondary mt-0.5">
                    Saved so far: ₹{totalSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Goals Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-wealth-textSecondary">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-wealth-accent"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-wealth-rose/10 border border-wealth-rose/20 text-wealth-rose rounded-lg flex items-center gap-3">
              <AlertCircle size={20} />
              <span>Failed to fetch goals. Refresh the page.</span>
            </div>
          ) : goals.length === 0 ? (
            <div className="bg-wealth-card border border-wealth-border border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center">
              <Target className="text-wealth-textSecondary mb-4 animate-bounce" size={48} />
              <h3 className="text-lg font-bold">No Goals Configured</h3>
              <p className="text-sm text-wealth-textSecondary max-w-xs mt-1 mb-6">
                You haven't registered any financial targets yet. Set up a retirement or savings milestone.
              </p>
              <Button onClick={handleOpenCreateModal}>Set Your First Goal</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.map((g) => (
                <GoalCard 
                  key={g.id} 
                  goal={g} 
                  onEdit={handleOpenEditModal} 
                  onDelete={handleDeleteGoal} 
                />
              ))}
            </div>
          )}

          {/* Create / Edit Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title={selectedGoal ? 'Edit Financial Goal' : 'Create New Financial Goal'}
          >
            <GoalForm 
              initialData={selectedGoal} 
              onSubmit={handleFormSubmit} 
              onCancel={handleCloseModal} 
            />
          </Modal>
        </main>
      </div>
    </div>
  );
};
