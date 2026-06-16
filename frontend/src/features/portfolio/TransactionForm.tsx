import React, { useState, useEffect } from 'react';
import { TransactionType } from '../../types';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

interface TransactionFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    type: 'buy' as TransactionType,
    symbol: '',
    quantity: '',
    price: '',
    fees: '0',
    notes: '',
    executed_at: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isCashAction = 
    formData.type === 'contribution' || 
    formData.type === 'withdrawal' || 
    formData.type === 'dividend';

  // Force symbol and price for CASH actions
  useEffect(() => {
    if (isCashAction) {
      setFormData((prev) => ({
        ...prev,
        symbol: 'CASH',
        price: '1.00'
      }));
    } else if (formData.symbol === 'CASH') {
      setFormData((prev) => ({
        ...prev,
        symbol: ''
      }));
    }
  }, [formData.type, isCashAction]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onSubmit({
        type: formData.type,
        symbol: formData.symbol.toUpperCase(),
        quantity: Number(formData.quantity),
        price: Number(formData.price),
        fees: Number(formData.fees) || 0,
        notes: formData.notes || undefined,
        executed_at: formData.executed_at ? new Date(formData.executed_at).toISOString() : undefined
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to post transaction.');
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

      {/* Transaction Type */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-wealth-textSecondary mb-1.5">
          Transaction Type
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full bg-slate-900 border border-wealth-border rounded-lg px-3.5 py-2.5 text-sm text-wealth-textPrimary focus:outline-none focus:ring-2 focus:ring-wealth-accent"
        >
          <option value="buy">BUY Asset</option>
          <option value="sell">SELL Asset</option>
          <option value="contribution">CONTRIBUTION (Deposit Cash)</option>
          <option value="withdrawal">WITHDRAWAL (Extract Cash)</option>
          <option value="dividend">DIVIDEND (Collect Dividend)</option>
        </select>
      </div>

      {/* Symbol (disabled for Cash actions) */}
      <Input
        label="Symbol Ticker"
        name="symbol"
        value={formData.symbol}
        onChange={handleChange}
        placeholder="e.g. RELIANCE.NS, TCS.NS"
        required
        disabled={isCashAction}
      />

      {/* Quantity / Amount */}
      <Input
        label={isCashAction ? "Amount (INR)" : "Quantity (Units)"}
        name="quantity"
        type="number"
        step="0.000001"
        value={formData.quantity}
        onChange={handleChange}
        placeholder={isCashAction ? "e.g. 10000" : "e.g. 15.5"}
        required
      />

      {/* Price & Fees (price disabled for Cash actions) */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Price (INR per Unit)"
          name="price"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={handleChange}
          placeholder="e.g. 2450.50"
          required
          disabled={isCashAction}
        />
        <Input
          label="Transaction Fees"
          name="fees"
          type="number"
          step="0.01"
          value={formData.fees}
          onChange={handleChange}
          placeholder="e.g. 25.00"
        />
      </div>

      {/* Executed At */}
      <Input
        label="Execution Date (Optional)"
        name="executed_at"
        type="datetime-local"
        value={formData.executed_at}
        onChange={handleChange}
      />

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-wealth-textSecondary mb-1.5">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={2}
          placeholder="e.g. Purchased through Zerodha broker..."
          className="w-full bg-slate-900 border border-wealth-border rounded-lg px-3.5 py-2.5 text-sm text-wealth-textPrimary focus:outline-none focus:ring-2 focus:ring-wealth-accent"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-wealth-border/40">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Log Transaction
        </Button>
      </div>
    </form>
  );
};
