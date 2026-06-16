import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { TrendingUp } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-wealth-bg flex flex-col items-center justify-center p-4">
      {/* Brand logo */}
      <div className="flex items-center gap-2 mb-8">
        <TrendingUp className="text-wealth-accent" size={32} />
        <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-wealth-accent to-emerald-400 bg-clip-text text-transparent">
          WealthTrack
        </h1>
      </div>

      {/* Card surface */}
      <div className="w-full max-w-md bg-wealth-card border border-wealth-border rounded-xl shadow-2xl p-8">
        <h2 className="text-xl font-bold text-wealth-textPrimary mb-1">Welcome Back</h2>
        <p className="text-sm text-wealth-textSecondary mb-6">Enter your details to manage your portfolio.</p>

        {error && (
          <div className="p-3.5 bg-wealth-rose/10 border border-wealth-rose/20 text-wealth-rose text-sm rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <p className="text-sm text-wealth-textSecondary text-center mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-wealth-accent hover:underline font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
