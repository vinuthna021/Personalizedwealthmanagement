import React from 'react';
import { Goal } from '../../types';
import { Home, GraduationCap, Plane, ShieldAlert, AlertTriangle, HelpCircle, Edit2, Trash2 } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: number) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete }) => {
  const { progress_percent, months_remaining, required_monthly_contribution, is_on_track } = goal.calculations;

  const typeIcons = {
    retirement: ShieldAlert,
    home: Home,
    education: GraduationCap,
    travel: Plane,
    emergency: AlertTriangle,
    custom: HelpCircle,
  };

  const Icon = typeIcons[goal.goal_type] || HelpCircle;

  return (
    <div className="bg-wealth-card border border-wealth-border rounded-xl p-6 shadow-md hover:border-slate-600 transition-all flex flex-col justify-between">
      {/* Header Info */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-wealth-accent/10 flex items-center justify-center text-wealth-accent">
              <Icon size={20} />
            </div>
            <div>
              <h4 className="font-bold text-wealth-textPrimary">{goal.goal_name}</h4>
              <p className="text-xs text-wealth-textSecondary capitalize">{goal.goal_type} Goal</p>
            </div>
          </div>
          <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
            goal.status === 'active' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-slate-700/50 text-slate-400'
          }`}>
            {goal.status}
          </span>
        </div>

        {/* Goal metrics progress bar */}
        <div className="space-y-1.5 mb-6">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-wealth-textSecondary">Progress</span>
            <span className="text-wealth-accent">{progress_percent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-wealth-accent h-full rounded-full transition-all duration-500" 
              style={{ width: `${progress_percent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-wealth-textSecondary mt-1">
            <span>₹{Number(goal.current_amount).toLocaleString('en-IN')}</span>
            <span>Target: ₹{Number(goal.target_amount).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Detail statistics */}
        <div className="grid grid-cols-2 gap-4 text-xs mb-6 border-t border-wealth-border/40 pt-4">
          <div>
            <p className="text-wealth-textSecondary">Months Left</p>
            <p className="font-bold text-wealth-textPrimary">{months_remaining} mos</p>
          </div>
          <div>
            <p className="text-wealth-textSecondary">Schedules Status</p>
            <p className={`font-bold ${is_on_track ? 'text-wealth-emerald' : 'text-amber-400'}`}>
              {is_on_track ? 'On Track' : 'Behind Target'}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-wealth-textSecondary">Required Monthly Contribution</p>
            <p className="font-bold text-wealth-textPrimary">₹{required_monthly_contribution.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo</p>
          </div>
        </div>
      </div>

      {/* Action panel */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-wealth-border/40">
        <button 
          onClick={() => onEdit(goal)}
          className="p-2 text-wealth-textSecondary hover:text-wealth-accent hover:bg-slate-800 rounded-lg transition-colors"
          title="Edit Goal"
        >
          <Edit2 size={16} />
        </button>
        <button 
          onClick={() => onDelete(goal.id)}
          className="p-2 text-wealth-textSecondary hover:text-wealth-rose hover:bg-slate-800 rounded-lg transition-colors"
          title="Delete Goal"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
