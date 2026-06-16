import React, { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { RiskProfile } from '../../types';
import { Check, ShieldCheck, AlertCircle } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateProfile, updateRiskProfile, verifyKYCMock } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    date_of_birth: user?.date_of_birth || '',
    address: user?.address || ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [selectedRisk, setSelectedRisk] = useState<RiskProfile>(user?.risk_profile || 'moderate');
  const [isSavingRisk, setIsSavingRisk] = useState(false);
  const [isVerifyingKYC, setIsVerifyingKYC] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);
    setIsSavingProfile(true);
    try {
      await updateProfile(profileForm);
      setProfileSuccess(true);
    } catch (err: any) {
      setProfileError('Failed to update profile details.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRiskSubmit = async () => {
    setIsSavingRisk(true);
    try {
      await updateRiskProfile(selectedRisk);
    } catch (err) {
      // Ignore
    } finally {
      setIsSavingRisk(false);
    }
  };

  const handleKYCVerify = async () => {
    setIsVerifyingKYC(true);
    try {
      await verifyKYCMock();
    } catch (err) {
      // Ignore
    } finally {
      setIsVerifyingKYC(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-wealth-bg text-wealth-textPrimary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />
        
        <main className="p-8 max-w-5xl w-full mx-auto space-y-8">
          <h1 className="text-2xl font-bold tracking-tight">Account Configuration</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Profile Settings */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-wealth-card border border-wealth-border rounded-xl p-6 shadow-md">
                <h3 className="text-lg font-bold mb-4">Edit Profile</h3>
                {profileError && <p className="text-sm text-wealth-rose mb-4">{profileError}</p>}
                {profileSuccess && <p className="text-sm text-wealth-emerald mb-4">Profile updated successfully!</p>}
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <Input 
                    label="Full Name" 
                    value={profileForm.name} 
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} 
                    required 
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="Phone" 
                      value={profileForm.phone} 
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} 
                    />
                    <Input 
                      label="Date of Birth" 
                      type="date" 
                      value={profileForm.date_of_birth} 
                      onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })} 
                    />
                  </div>
                  <Input 
                    label="Address" 
                    value={profileForm.address} 
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} 
                  />
                  <Button type="submit" isLoading={isSavingProfile}>Save Profile</Button>
                </form>
              </div>

              {/* Risk tolerance picker */}
              <div className="bg-wealth-card border border-wealth-border rounded-xl p-6 shadow-md">
                <h3 className="text-lg font-bold mb-1">Risk Profile Settings</h3>
                <p className="text-sm text-wealth-textSecondary mb-6">Select a risk profile. We use this to suggest portfolio asset allocations.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Conservative Card */}
                  <div 
                    onClick={() => setSelectedRisk('conservative')}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${
                      selectedRisk === 'conservative' 
                        ? 'border-teal-500 bg-teal-500/10' 
                        : 'border-wealth-border hover:border-slate-600 bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-teal-400">Conservative</span>
                      {selectedRisk === 'conservative' && <Check size={16} className="text-teal-400" />}
                    </div>
                    <p className="text-xs text-wealth-textSecondary">Prioritizes capital preservation. High allocation to cash and bonds.</p>
                  </div>

                  {/* Moderate Card */}
                  <div 
                    onClick={() => setSelectedRisk('moderate')}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${
                      selectedRisk === 'moderate' 
                        ? 'border-wealth-accent bg-wealth-accent/10' 
                        : 'border-wealth-border hover:border-slate-600 bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-wealth-accent">Moderate</span>
                      {selectedRisk === 'moderate' && <Check size={16} className="text-wealth-accent" />}
                    </div>
                    <p className="text-xs text-wealth-textSecondary">Balances growth and risk. Balanced allocation across equities and fixed income.</p>
                  </div>

                  {/* Aggressive Card */}
                  <div 
                    onClick={() => setSelectedRisk('aggressive')}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${
                      selectedRisk === 'aggressive' 
                        ? 'border-amber-500 bg-amber-500/10' 
                        : 'border-wealth-border hover:border-slate-600 bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-amber-500">Aggressive</span>
                      {selectedRisk === 'aggressive' && <Check size={16} className="text-amber-500" />}
                    </div>
                    <p className="text-xs text-wealth-textSecondary">Prioritizes capital growth. High allocation to equities/stocks.</p>
                  </div>
                </div>

                <Button onClick={handleRiskSubmit} isLoading={isSavingRisk} disabled={user.risk_profile === selectedRisk}>
                  Apply Risk Profile
                </Button>
              </div>
            </div>

            {/* Right: KYC Status Sidebar Card */}
            <div className="space-y-6">
              <div className="bg-wealth-card border border-wealth-border rounded-xl p-6 shadow-md">
                <h3 className="text-lg font-bold mb-4">KYC Compliance</h3>
                
                {user.kyc_status === 'unverified' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg flex gap-3">
                      <AlertCircle className="shrink-0" size={20} />
                      <div>
                        <p className="text-sm font-bold">Unverified Account</p>
                        <p className="text-xs mt-0.5 opacity-90">Verify your KYC status to start goal planning and investment tracking.</p>
                      </div>
                    </div>
                    <Button variant="primary" className="w-full" onClick={handleKYCVerify} isLoading={isVerifyingKYC}>
                      Start KYC Verification
                    </Button>
                  </div>
                )}

                {user.kyc_status === 'verified' && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg flex gap-3">
                    <ShieldCheck className="shrink-0" size={20} />
                    <div>
                      <p className="text-sm font-bold">Identity Verified</p>
                      <p className="text-xs mt-0.5 opacity-90">Your account is fully compliant. Digital wealth advisor functionalities are unlocked.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
