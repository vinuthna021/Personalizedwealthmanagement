import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck, ShieldAlert, Info } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const kycConfig = {
    unverified: { text: 'KYC Unverified', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: ShieldAlert },
    pending: { text: 'KYC Pending', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Info },
    verified: { text: 'KYC Verified', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: ShieldCheck },
    rejected: { text: 'KYC Rejected', color: 'bg-wealth-rose/10 text-wealth-rose border-wealth-rose/20', icon: ShieldAlert },
  };

  const riskColors = {
    conservative: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    moderate: 'bg-wealth-accent/15 text-wealth-accent border-wealth-accent/30',
    aggressive: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  };

  const kyc = kycConfig[user.kyc_status];
  const KycIcon = kyc.icon;

  return (
    <header className="bg-slate-900 border-b border-wealth-border px-8 py-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-wealth-textSecondary font-semibold uppercase tracking-wider">Premium Account</p>
        <h2 className="text-lg font-bold text-wealth-textPrimary">Welcome, {user.name}</h2>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Risk tolerance level */}
        <span className={`px-3 py-1 text-xs font-semibold rounded-full border uppercase tracking-wider ${riskColors[user.risk_profile]}`}>
          {user.risk_profile} Risk
        </span>

        {/* KYC Verification status */}
        <span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${kyc.color}`}>
          <KycIcon size={14} />
          {kyc.text}
        </span>
      </div>
    </header>
  );
};
