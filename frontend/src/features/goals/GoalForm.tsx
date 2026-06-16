import React, { useState, useEffect } from 'react';
import { Goal, GoalType, GoalStatus } from '../../types';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

interface GoalFormProps {
  initialData?: Goal | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const GoalForm: React.FC<GoalFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    goal_name: '',
    goal_type: 'custom' as GoalType,
    target_amount: '',
    current_amount: '',
    monthly_contribution: '',
    target_date: '',
    status: 'active' as GoalStatus,
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        goal_name: initialData.goal_name,
        goal_type: initialData.goal_type,
        target_amount: String(initialData.target_amount),
        current_amount: String(initialData.current_amount),
        monthly_contribution: String(initialData.monthly_contribution),
        target_date: initialData.target_date,
        status: initialData.status,
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onSubmit({
        ...formData,
        target_amount: Number(formData.target_amount),
        current_amount: Number(formData.current_amount) || 0,
        monthly_contribution: Number(formData.monthly_contribution) || 0,
        notes: formData.notes || undefined
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit form');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-wealth-rose/10 border border-wealth-rose/20 text-wealth-rose text-xs rounded-lg">
          {error}
        </div>
      )}

      <Input
        label="Goal Name"
        name="goal_name"
        value={formData.goal_name}
        onChange={handleChange}
        placeholder="e.g. Dream House"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-wealth-textSecondary mb-1.5">
            Goal Type
          </label>
          <select
            name="goal_type"
            value={formData.goal_type}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-wealth-border rounded-lg px-3.5 py-2.5 text-sm text-wealth-textPrimary focus:outline-none focus:ring-2 focus:ring-wealth-accent"
          >
            <option value="retirement">Retirement</option>
            <option value="home">Home</option>
            <option value="education">Education</option>
            <option value="travel">Travel</option>
            <option value="emergency">Emergency</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-wealth-textSecondary mb-1.5">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-wealth-border rounded-lg px-3.5 py-2.5 text-sm text-wealth-textPrimary focus:outline-none focus:ring-2 focus:ring-wealth-accent"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Target Amount (INR)"
          name="target_amount"
          type="number"
          step="0.01"
          value={formData.target_amount}
          onChange={handleChange}
          placeholder="50,00,000"
          required
        />
        <Input
          label="Current Savings (INR)"
          name="current_amount"
          type="number"
          step="0.01"
          value={formData.current_amount}
          onChange={handleChange}
          placeholder="10,00,000"
        />
        <Input
          label="Monthly Contribution"
          name="monthly_contribution"
          type="number"
          step="0.01"
          value={formData.monthly_contribution}
          onChange={handleChange}
          placeholder="25,000"
        />
      </div>

      <Input
        label="Target Date"
        name="target_date"
        type="date"
        value={formData.target_date}
        onChange={handleChange}
        required
      />

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-wealth-textSecondary mb-1.5">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Write short notes about this target..."
          className="w-full bg-slate-900 border border-wealth-border rounded-lg px-3.5 py-2.5 text-sm text-wealth-textPrimary focus:outline-none focus:ring-2 focus:ring-wealth-accent"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-wealth-border/40">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Save Changes' : 'Create Goal'}
        </Button>
      </div>
    </form>
  );
};
