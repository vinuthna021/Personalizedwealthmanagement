export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';
export type KYCStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  risk_profile: RiskProfile;
  kyc_status: KYCStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type GoalType = 'retirement' | 'home' | 'education' | 'travel' | 'emergency' | 'custom';
export type GoalStatus = 'active' | 'paused' | 'completed';
export type AssetType = 'stock' | 'etf' | 'mutual_fund' | 'bond' | 'cash';
export type TransactionType = 'buy' | 'sell' | 'dividend' | 'contribution' | 'withdrawal';

export interface GoalCalculations {
  progress_percent: number;
  months_remaining: number;
  shortfall: number;
  required_monthly_contribution: number;
  projected_final_amount: number;
  is_on_track: boolean;
}

export interface Goal {
  id: number;
  user_id: number;
  goal_name: string;
  goal_type: GoalType;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  target_date: string;
  status: GoalStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  calculations: GoalCalculations;
}

export interface Investment {
  id: number;
  user_id: number;
  asset_type: AssetType;
  symbol: string;
  asset_name: string;
  units: number;
  avg_buy_price: number;
  cost_basis: number;
  current_value: number;
  last_price: number;
  allocation_percent: number;
  risk_level: RiskProfile;
  last_price_at?: string;
  created_at: string;
  updated_at: string;
  
  // Live market data fields
  ticker_symbol?: string;
  asset_class?: AssetType;
  quantity?: number;
  average_cost?: number;
  exchange?: string;
  data_provider?: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  investment_id?: number;
  symbol: string;
  type: TransactionType;
  quantity: number;
  price: number;
  fees: number;
  total_amount: number;
  notes?: string;
  executed_at: string;
  created_at: string;
}

export interface PortfolioSummary {
  total_value: number;
  total_cost: number;
  stock_value: number;
  stock_cost: number;
  net_profit: number;
  percentage_profit: number;
  cash_balance: number;
}

export interface Simulation {
  id: number;
  user_id: number;
  goal_id?: number;
  scenario_name: string;
  simulation_type: string;
  input_parameters: Record<string, any>;
  result_json: Record<string, any>;
  created_at: string;
}

export interface SimulationResult {
  summary: {
    total_invested: number;
    estimated_earnings: number;
    future_value: number;
    years: number;
    annual_return: number;
  };
  timeline: Array<{
    year: number;
    invested: number;
    earnings: number;
    future_value: number;
  }>;
}

export interface WhatIfResult {
  baseline: SimulationResult;
  scenarios: Record<string, SimulationResult>;
  comparison_timeline: Array<{
    year: number;
    baseline: number;
    [key: string]: number | null;
  }>;
}
