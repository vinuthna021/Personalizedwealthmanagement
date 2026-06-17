import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import apiClient from '../../lib/api_client';
import { Goal, Simulation, WhatIfResult } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle, Trash2, Save, FileSpreadsheet, PlusCircle, RefreshCw } from 'lucide-react';

export const Simulations: React.FC = () => {
  const queryClient = useQueryClient();

  // Baseline input states
  const [currentAmount, setCurrentAmount] = useState<number>(10000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(2000);
  const [annualReturn, setAnnualReturn] = useState<number>(8.0);
  const [years, setYears] = useState<number>(10);
  const [simulationName, setSimulationName] = useState<string>('My Wealth Simulation');
  const [linkedGoalId, setLinkedGoalId] = useState<number | ''>('');

  // What-If scenarios state
  const [scenarios, setScenarios] = useState<Array<{
    id: string;
    name: string;
    monthly_contribution: number;
    annual_return: number;
    years: number;
  }>>([]);

  // Result state
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runError, setRunError] = useState<string | null>(null);

  // Fetch linked goals
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await apiClient.get('/goals');
      return response.data;
    }
  });

  // Fetch saved simulations
  const { data: savedSimulations = [], isLoading: isHistoryLoading } = useQuery<Simulation[]>({
    queryKey: ['simulations'],
    queryFn: async () => {
      const response = await apiClient.get('/simulations');
      return response.data;
    }
  });

  // Save Simulation mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: {
      goal_id: number | null;
      scenario_name: string;
      simulation_type: string;
      input_parameters: any;
      result_json: any;
    }) => {
      return apiClient.post('/simulations/save', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      alert('Simulation saved successfully!');
    },
    onError: (err: any) => {
      alert(`Failed to save: ${err.response?.data?.detail || err.message}`);
    }
  });

  // Delete Simulation mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiClient.delete(`/simulations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
    }
  });

  // Handle adding a what-if scenario
  const handleAddScenario = () => {
    const scCount = scenarios.length + 1;
    setScenarios([
      ...scenarios,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: `Scenario ${String.fromCharCode(65 + scCount - 1)}`, // A, B, C...
        monthly_contribution: monthlyContribution * 1.25, // default variation (+25%)
        annual_return: annualReturn,
        years: years
      }
    ]);
  };

  // Handle updating a scenario input
  const handleUpdateScenario = (id: string, field: string, val: any) => {
    setScenarios(
      scenarios.map((sc) => (sc.id === id ? { ...sc, [field]: val } : sc))
    );
  };

  // Handle removing a scenario
  const handleRemoveScenario = (id: string) => {
    setScenarios(scenarios.filter((sc) => sc.id !== id));
  };

  // Run calculation API request
  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    setRunError(null);

    const payload = {
      current_amount: currentAmount,
      monthly_contribution: monthlyContribution,
      annual_return: annualReturn,
      years: years,
      simulation_type: 'custom',
      goal_id: linkedGoalId || null,
      scenarios: scenarios.map((sc) => ({
        name: sc.name,
        monthly_contribution: sc.monthly_contribution,
        annual_return: sc.annual_return,
        years: sc.years
      }))
    };

    try {
      const resp = await apiClient.post('/simulations/run', payload);
      setResult(resp.data);
    } catch (err: any) {
      setRunError(err.response?.data?.detail || err.message || 'Run failed');
    } finally {
      setIsRunning(false);
    }
  };

  // Handle saving the calculation result to DB
  const handleSaveSimulation = () => {
    if (!result) return;
    
    const payload = {
      goal_id: linkedGoalId || null,
      scenario_name: simulationName,
      simulation_type: 'what_if_comparison',
      input_parameters: {
        baseline: { currentAmount, monthlyContribution, annualReturn, years },
        scenarios: scenarios.map(sc => ({
          name: sc.name,
          monthly_contribution: sc.monthly_contribution,
          annual_return: sc.annual_return,
          years: sc.years
        }))
      },
      result_json: result
    };

    saveMutation.mutate(payload);
  };

  // Load a historical simulation
  const handleLoadSimulation = (sim: Simulation) => {
    const params = sim.input_parameters;
    if (params.baseline) {
      setCurrentAmount(params.baseline.currentAmount || 0);
      setMonthlyContribution(params.baseline.monthlyContribution || 0);
      setAnnualReturn(params.baseline.annualReturn || 0);
      setYears(params.baseline.years || 10);
    }
    setSimulationName(sim.scenario_name);
    setLinkedGoalId(sim.goal_id || '');
    
    if (params.scenarios) {
      setScenarios(params.scenarios.map((sc: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: sc.name,
        monthly_contribution: sc.monthly_contribution,
        annual_return: sc.annual_return,
        years: sc.years
      })));
    } else {
      setScenarios([]);
    }
    
    // Set the saved result directly to display
    setResult(sim.result_json as WhatIfResult);
  };

  const handleDeleteSimulation = async (id: number) => {
    if (window.confirm('Delete this saved simulation?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  // Recharts color list
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6'];

  return (
    <div className="flex h-screen bg-wealth-bg text-wealth-textPrimary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />
        
        <main className="p-8 max-w-5xl w-full mx-auto space-y-8">
          {/* Header Row */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">What-If Growth Projections</h1>
            <p className="text-sm text-wealth-textSecondary mt-1">
              Simulate investment growth timelines, compare plans, and run goal rebalancing calculations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Form Column */}
            <div className="lg:col-span-2 space-y-8">
              <form onSubmit={handleRunSimulation} className="bg-wealth-card border border-wealth-border rounded-xl p-6 shadow-md space-y-6">
                <h3 className="text-sm font-bold text-wealth-textSecondary uppercase tracking-wider">
                  Baseline Parameters
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-wealth-textSecondary mb-2">Simulation Name</label>
                    <input 
                      type="text" 
                      value={simulationName}
                      onChange={(e) => setSimulationName(e.target.value)}
                      className="w-full bg-slate-900 border border-wealth-border rounded-lg px-4 py-2 text-sm text-wealth-textPrimary focus:border-wealth-accent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-wealth-textSecondary mb-2">Link with Financial Goal</label>
                    <select
                      value={linkedGoalId}
                      onChange={(e) => setLinkedGoalId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-slate-900 border border-wealth-border rounded-lg px-4 py-2 text-sm text-wealth-textPrimary focus:border-wealth-accent outline-none capitalize"
                    >
                      <option value="">-- No Linked Goal --</option>
                      {goals.map((g) => (
                        <option key={g.id} value={g.id}>{g.goal_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-wealth-textSecondary mb-2">Initial Savings (PV)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-wealth-border rounded-lg px-4 py-2 text-sm text-wealth-textPrimary focus:border-wealth-accent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-wealth-textSecondary mb-2">Monthly Contribution (PMT)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-wealth-border rounded-lg px-4 py-2 text-sm text-wealth-textPrimary focus:border-wealth-accent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-wealth-textSecondary mb-2">Expected Annual Return (%)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      step="0.1"
                      value={annualReturn}
                      onChange={(e) => setAnnualReturn(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-wealth-border rounded-lg px-4 py-2 text-sm text-wealth-textPrimary focus:border-wealth-accent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-wealth-textSecondary mb-2">Duration (Years)</label>
                    <input 
                      type="number" 
                      min="1"
                      max="50"
                      value={years}
                      onChange={(e) => setYears(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-wealth-border rounded-lg px-4 py-2 text-sm text-wealth-textPrimary focus:border-wealth-accent outline-none"
                      required
                    />
                  </div>
                </div>

                {/* What-If Variations Section */}
                <div className="border-t border-wealth-border/40 pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-wealth-textSecondary uppercase tracking-wider">
                      What-If Scenario Comparisons
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddScenario}
                      className="flex items-center gap-1.5 text-xs text-wealth-accent hover:text-emerald-400 font-bold transition-colors"
                    >
                      <PlusCircle size={16} />
                      <span>Add Scenario Compare</span>
                    </button>
                  </div>

                  {scenarios.length > 0 ? (
                    <div className="space-y-4">
                      {scenarios.map((sc) => (
                        <div key={sc.id} className="bg-slate-950/40 border border-wealth-border/60 rounded-xl p-4 space-y-4 relative">
                          <button
                            type="button"
                            onClick={() => handleRemoveScenario(sc.id)}
                            className="absolute top-4 right-4 text-wealth-textSecondary hover:text-wealth-rose transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pr-8">
                            <div className="sm:col-span-1">
                              <label className="block text-[11px] font-bold text-wealth-textSecondary mb-1.5">Scenario Name</label>
                              <input 
                                type="text"
                                value={sc.name}
                                onChange={(e) => handleUpdateScenario(sc.id, 'name', e.target.value)}
                                className="w-full bg-slate-900 border border-wealth-border rounded px-3 py-1.5 text-xs text-wealth-textPrimary focus:border-wealth-accent outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-wealth-textSecondary mb-1.5">Monthly Contribution</label>
                              <input 
                                type="number"
                                min="0"
                                value={sc.monthly_contribution}
                                onChange={(e) => handleUpdateScenario(sc.id, 'monthly_contribution', Number(e.target.value))}
                                className="w-full bg-slate-900 border border-wealth-border rounded px-3 py-1.5 text-xs text-wealth-textPrimary focus:border-wealth-accent outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-wealth-textSecondary mb-1.5">Annual Return (%)</label>
                              <input 
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={sc.annual_return}
                                onChange={(e) => handleUpdateScenario(sc.id, 'annual_return', Number(e.target.value))}
                                className="w-full bg-slate-900 border border-wealth-border rounded px-3 py-1.5 text-xs text-wealth-textPrimary focus:border-wealth-accent outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-wealth-textSecondary mb-1.5">Years</label>
                              <input 
                                type="number"
                                min="1"
                                max="50"
                                value={sc.years}
                                onChange={(e) => handleUpdateScenario(sc.id, 'years', Number(e.target.value))}
                                className="w-full bg-slate-900 border border-wealth-border rounded px-3 py-1.5 text-xs text-wealth-textPrimary focus:border-wealth-accent outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-wealth-textSecondary italic">
                      No comparison scenarios configured. Add one to see curves compared side-by-side.
                    </p>
                  )}
                </div>

                {/* Form buttons */}
                <div className="flex gap-4 pt-4 border-t border-wealth-border/40 justify-end">
                  <button
                    type="submit"
                    disabled={isRunning}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-wealth-accent hover:bg-wealth-accentHover text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} />
                        <span>Running simulation...</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp size={16} />
                        <span>Run Projections</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Render calculation results */}
              {runError && (
                <div className="p-4 bg-wealth-rose/10 border border-wealth-rose/20 text-wealth-rose rounded-lg flex items-center gap-3">
                  <AlertCircle size={20} />
                  <span>Failed to calculate projection: {runError}</span>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  {/* Results comparison card summaries */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Baseline Summary */}
                    <div className="bg-wealth-card border border-wealth-border rounded-xl p-5 shadow-sm space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Baseline Model</span>
                        <h4 className="font-bold text-lg text-wealth-textPrimary">₹{result.baseline.summary.future_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h4>
                      </div>
                      <div className="text-xs space-y-1 text-wealth-textSecondary">
                        <p>Total Invested: ₹{result.baseline.summary.total_invested.toLocaleString('en-IN')}</p>
                        <p>Earnings: ₹{result.baseline.summary.estimated_earnings.toLocaleString('en-IN')}</p>
                        <p>Return rate: {result.baseline.summary.annual_return}%</p>
                      </div>
                    </div>
                    
                    {/* Scenarios Summaries */}
                    {Object.entries(result.scenarios || {}).map(([name, scRes], idx) => (
                      <div key={name} className="bg-wealth-card border border-wealth-border rounded-xl p-5 shadow-sm space-y-3">
                        <div>
                          <span 
                            className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: COLORS[(idx + 1) % COLORS.length] }}
                          >
                            {name}
                          </span>
                          <h4 className="font-bold text-lg text-wealth-textPrimary">₹{scRes.summary.future_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h4>
                        </div>
                        <div className="text-xs space-y-1 text-wealth-textSecondary">
                          <p>Total Invested: ₹{scRes.summary.total_invested.toLocaleString('en-IN')}</p>
                          <p>Earnings: ₹{scRes.summary.estimated_earnings.toLocaleString('en-IN')}</p>
                          <p>Return rate: {scRes.summary.annual_return}%</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Growth Projection Line Chart */}
                  <div className="bg-wealth-card border border-wealth-border rounded-xl p-6 shadow-md">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-wealth-textSecondary uppercase tracking-wider">
                        Future Value Growth Projections
                      </h3>
                      
                      <button
                        onClick={handleSaveSimulation}
                        disabled={saveMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-wealth-emerald/15 hover:bg-wealth-emerald/25 border border-wealth-emerald/20 text-wealth-emerald text-xs font-bold rounded-lg transition-colors"
                      >
                        <Save size={14} />
                        <span>Save Projection</span>
                      </button>
                    </div>

                    <div className="w-full h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={result.comparison_timeline}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                          <XAxis 
                            dataKey="year" 
                            stroke="#94A3B8" 
                            fontSize={11} 
                            tickFormatter={(v) => `Yr ${v}`} 
                          />
                          <YAxis 
                            stroke="#94A3B8" 
                            fontSize={11} 
                            tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} 
                          />
                          <Tooltip 
                            formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 'Value']}
                            contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px' }}
                            itemStyle={{ color: '#F8FAFC' }}
                            labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
                            labelFormatter={(label) => `Year ${label}`}
                          />
                          <Legend verticalAlign="bottom" iconType="circle" />
                          <Line 
                            type="monotone" 
                            dataKey="baseline" 
                            name="Baseline" 
                            stroke="#3B82F6" 
                            strokeWidth={2.5}
                            activeDot={{ r: 6 }} 
                          />
                          {scenarios.map((sc, idx) => (
                            <Line 
                              key={sc.name}
                              type="monotone" 
                              dataKey={sc.name} 
                              name={sc.name} 
                              stroke={COLORS[(idx + 1) % COLORS.length]} 
                              strokeWidth={2}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar History Column */}
            <div className="space-y-6">
              <div className="bg-wealth-card border border-wealth-border rounded-xl p-6 shadow-md">
                <h3 className="text-sm font-bold text-wealth-textSecondary uppercase tracking-wider mb-4">
                  Saved Projections Log
                </h3>

                {isHistoryLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-wealth-accent"></div>
                  </div>
                ) : savedSimulations.length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {savedSimulations.map((sim) => (
                      <div 
                        key={sim.id} 
                        className="p-3 border border-wealth-border/60 hover:border-slate-600 rounded-lg flex flex-col justify-between transition-colors bg-slate-900/30 group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="truncate pr-4">
                            <h4 className="text-xs font-bold text-wealth-textPrimary truncate">{sim.scenario_name}</h4>
                            <p className="text-[10px] text-wealth-textSecondary mt-0.5">
                              {new Date(sim.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteSimulation(sim.id)}
                            className="text-wealth-textSecondary hover:text-wealth-rose opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Log"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-wealth-border/20">
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded uppercase">
                            {sim.simulation_type.replace('_', ' ')}
                          </span>
                          <button
                            onClick={() => handleLoadSimulation(sim)}
                            className="text-[10px] text-wealth-accent hover:underline font-bold"
                          >
                            Load Projection &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-wealth-textSecondary italic text-center py-6">
                    No saved simulations found. Save a running projection to build your history.
                  </p>
                )}
              </div>

              {/* Tips Widget */}
              <div className="bg-slate-900/40 border border-wealth-border/40 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-wealth-accent flex items-center gap-1.5">
                  <FileSpreadsheet size={16} />
                  <span>Interactive SIP Planning</span>
                </h4>
                <p className="text-xs text-wealth-textSecondary leading-relaxed">
                  Modify returns and contributions in comparison scenarios to model changes like:
                </p>
                <ul className="text-xs text-wealth-textSecondary list-disc pl-4 space-y-1">
                  <li><strong>Aggressive Allocation</strong>: higher return rate</li>
                  <li><strong>Step-Up SIP</strong>: increased monthly contributions</li>
                  <li><strong>Early Exit</strong>: fewer years of growth</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
