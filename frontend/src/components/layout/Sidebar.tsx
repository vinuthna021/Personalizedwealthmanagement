import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, User, LogOut, TrendingUp, Goal, Briefcase, History, LineChart } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/goals', label: 'Goals Tracker', icon: Goal },
    { to: '/portfolio', label: 'Portfolio Holdings', icon: Briefcase },
    { to: '/transactions', label: 'Transaction Ledger', icon: History },
    { to: '/simulations', label: 'What-If Projections', icon: LineChart },
    { to: '/profile', label: 'Profile & KYC', icon: User },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-wealth-border flex flex-col h-screen sticky top-0">
      {/* Brand Info */}
      <div className="p-6 border-b border-wealth-border flex items-center gap-2">
        <TrendingUp className="text-wealth-accent" size={24} />
        <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-wealth-accent to-emerald-400 bg-clip-text text-transparent">
          WealthTrack
        </h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                isActive
                  ? 'bg-wealth-accent/15 text-wealth-accent font-semibold border-l-4 border-wealth-accent pl-3'
                  : 'text-wealth-textSecondary hover:bg-slate-800 hover:text-wealth-textPrimary'
              }`
            }
          >
            <link.icon size={18} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile Summary & Logout */}
      {user && (
        <div className="p-4 border-t border-wealth-border bg-slate-950/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-wealth-accent/20 border border-wealth-accent/30 flex items-center justify-center font-bold text-wealth-accent">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="truncate flex-1">
              <p className="text-sm font-semibold truncate text-wealth-textPrimary">{user.name}</p>
              <p className="text-xs text-wealth-textSecondary truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-wealth-rose hover:bg-wealth-rose/10 rounded-lg transition-colors border border-transparent hover:border-wealth-rose/20"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
};
