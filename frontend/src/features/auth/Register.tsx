import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { TrendingUp } from 'lucide-react';

export const Register: React.FC = () => {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    phone: '',
    date_of_birth: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Register
      await register({
        email: formData.email,
        name: formData.name,
        password: formData.password,
        phone: formData.phone || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        address: formData.address || undefined
      });
      
      // Auto Login
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-wealth-bg flex flex-col items-center justify-center p-4 py-12">
      {/* Brand Logo */}
      <div className="flex items-center gap-2 mb-8">
        <TrendingUp className="text-wealth-accent" size={32} />
        <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-wealth-accent to-emerald-400 bg-clip-text text-transparent">
          WealthTrack
        </h1>
      </div>

      {/* Card surface */}
      <div className="w-full max-w-xl bg-wealth-card border border-wealth-border rounded-xl shadow-2xl p-8">
        <h2 className="text-xl font-bold text-wealth-textPrimary mb-1">Create Account</h2>
        <p className="text-sm text-wealth-textSecondary mb-6">Create your profile to start tracking your goals.</p>

        {error && (
          <div className="p-3.5 bg-wealth-rose/10 border border-wealth-rose/20 text-wealth-rose text-sm rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Password (min 8 chars)"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="border-t border-wealth-border/50 my-6 pt-4">
            <p className="text-xs font-semibold text-wealth-textSecondary uppercase tracking-widest mb-3">
              Optional Information
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                label="Phone Number"
                name="phone"
                placeholder="+919999999999"
                value={formData.phone}
                onChange={handleChange}
              />
              <Input
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
              />
            </div>
            <Input
              label="Residential Address"
              name="address"
              placeholder="Flat 101, Park Avenue, Mumbai"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <Button type="submit" className="w-full mt-4" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <p className="text-sm text-wealth-textSecondary text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-wealth-accent hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
