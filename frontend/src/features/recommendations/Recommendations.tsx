import React, { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { useRecommendations } from './useRecommendations';
import { useAuth } from '../../hooks/useAuth';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Sparkles, CheckCircle, RefreshCw, Lightbulb, PieChart as PieIcon, BarChart3 as BarIcon 
} from 'lucide-react';

export const Recommendations: React.FC = () => {
  const { user } = useAuth();
  const { 
    useGetRecommendations, 
    useGenerateRecommendation, 
    useMarkAsRead, 
    useGetRebalance 
  } = useRecommendations();

  const { data: recsResponse, isLoading: recsLoading } = useGetRecommendations();
  const { data: rebalanceData, isLoading: rebalanceLoading, refetch: refetchRebalance } = useGetRebalance();
  const generateMutation = useGenerateRecommendation();
  const markAsReadMutation = useMarkAsRead();

  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  const recommendations = recsResponse?.recommendations || [];
  const latestRec = recommendations[0];
  const historicalRecs = recommendations.slice(1);

  const handleGenerate = async () => {
    try {
      await generateMutation.mutateAsync();
      refetchRebalance();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markAsReadMutation.mutateAsync(id);
    } catch (err) {
      console.error(err);
    }
  };

  // Map data for Recharts comparison
  const chartData = rebalanceData ? Object.keys(rebalanceData.target_allocations).map(key => ({
    name: key.replace('_', ' ').toUpperCase(),
    Current: rebalanceData.current_allocations[key] || 0,
    Target: rebalanceData.target_allocations[key] || 0,
  })) : [];

  // Data for Current Allocation Pie Chart
  const currentPieData = rebalanceData ? Object.keys(rebalanceData.current_allocations)
    .filter(key => rebalanceData.current_allocations[key] > 0)
    .map(key => ({
      name: key.replace('_', ' ').toUpperCase(),
      value: rebalanceData.current_allocations[key]
    })) : [];

  // Data for Target Allocation Pie Chart
  const targetPieData = rebalanceData ? Object.keys(rebalanceData.target_allocations)
    .filter(key => rebalanceData.target_allocations[key] > 0)
    .map(key => ({
      name: key.replace('_', ' ').toUpperCase(),
      value: rebalanceData.target_allocations[key]
    })) : [];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  const formatText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return (
          <h4 key={idx} className="text-base font-bold text-wealth-textPrimary mt-4 mb-2">
            {trimmed.replace('###', '').trim()}
          </h4>
        );
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const listText = trimmed.substring(1).trim();
        // Simple bold replacements
        const formatted = listText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return (
          <li key={idx} className="ml-5 list-disc text-sm text-wealth-textSecondary mb-1" dangerouslySetInnerHTML={{ __html: formatted }} />
        );
      }
      if (trimmed) {
        const formatted = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return (
          <p key={idx} className="text-sm text-wealth-textSecondary mb-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
        );
      }
      return <div key={idx} className="h-2" />;
    });
  };

  const isGenerating = generateMutation.isPending;

  return (
    <div className="flex h-screen bg-wealth-bg text-wealth-textPrimary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />
        
        <main className="p-8 max-w-5xl w-full mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Recommendations Engine</h1>
              <p className="text-sm text-wealth-textSecondary mt-1">
                Personalized target allocation and dynamic rebalancing recommendations.
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2.5 bg-wealth-accent hover:bg-wealth-accentHover text-sm font-semibold rounded-lg transition-colors text-white disabled:opacity-50"
            >
              <Sparkles size={16} className={isGenerating ? "animate-spin" : ""} />
              <span>{isGenerating ? "Analyzing Portfolio..." : "Generate Advice"}</span>
            </button>
          </div>

          {/* Loading States */}
          {recsLoading || rebalanceLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <RefreshCw className="animate-spin text-wealth-accent" size={32} />
              <p className="text-sm text-wealth-textSecondary">Analyzing asset classes and compiling suggestions...</p>
            </div>
          ) : (
            <>
              {/* Drift Comparison Chart */}
              {rebalanceData && (
                <section className="bg-slate-900 border border-wealth-border/60 rounded-xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold">Allocation Model Drift</h2>
                      <p className="text-xs text-wealth-textSecondary mt-0.5">
                        Current vs target allocations based on {user?.risk_profile} model
                      </p>
                    </div>
                    
                    {/* Toggle Bar / Pie */}
                    <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-wealth-border/40">
                      <button
                        onClick={() => setChartType('bar')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          chartType === 'bar' 
                            ? 'bg-wealth-accent text-white' 
                            : 'text-wealth-textSecondary hover:text-wealth-textPrimary'
                        }`}
                      >
                        <BarIcon size={14} />
                        <span>Bar Chart</span>
                      </button>
                      <button
                        onClick={() => setChartType('pie')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          chartType === 'pie' 
                            ? 'bg-wealth-accent text-white' 
                            : 'text-wealth-textSecondary hover:text-wealth-textPrimary'
                        }`}
                      >
                        <PieIcon size={14} />
                        <span>Pie Split</span>
                      </button>
                    </div>
                  </div>

                  <div className="h-80 w-full">
                    {chartType === 'bar' ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                          <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                          <Legend />
                          <Bar dataKey="Current" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Target" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="grid grid-cols-2 h-full">
                        <div className="flex flex-col items-center justify-center">
                          <h3 className="text-xs font-semibold text-wealth-textSecondary mb-2">CURRENT ALLOCATION</h3>
                          {currentPieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="90%">
                              <PieChart>
                                <Pie
                                  data={currentPieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={45}
                                  outerRadius={70}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  {currentPieData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(val) => `${val}%`} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <p className="text-xs text-wealth-textSecondary py-10">No assets in portfolio</p>
                          )}
                        </div>
                        <div className="flex flex-col items-center justify-center border-l border-wealth-border/30">
                          <h3 className="text-xs font-semibold text-wealth-textSecondary mb-2">TARGET ALLOCATION</h3>
                          <ResponsiveContainer width="100%" height="90%">
                            <PieChart>
                              <Pie
                                data={targetPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={70}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {targetPieData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(val) => `${val}%`} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Latest Recommendation Cockpit */}
              {latestRec ? (
                <section className="bg-slate-900 border border-wealth-border/60 rounded-xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    {!latestRec.is_read ? (
                      <button
                        onClick={() => handleMarkRead(latestRec.id)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 bg-wealth-accent/15 border border-wealth-accent/30 text-wealth-accent font-semibold rounded-full hover:bg-wealth-accent/25 transition-colors"
                      >
                        <CheckCircle size={12} />
                        <span>Mark Read</span>
                      </button>
                    ) : (
                      <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 font-semibold rounded-full">
                        Reviewed
                      </span>
                    )}
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-wealth-accent/15 rounded-lg text-wealth-accent">
                      <Lightbulb size={24} />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <h2 className="text-xl font-bold">{latestRec.title}</h2>
                        <p className="text-xs text-wealth-textSecondary mt-1">
                          Generated on {new Date(latestRec.created_at).toLocaleDateString()} at {new Date(latestRec.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      <hr className="border-wealth-border/30" />
                      
                      <div className="space-y-1">
                        {formatText(latestRec.recommendation_text)}
                      </div>
                    </div>
                  </div>
                </section>
              ) : (
                <div className="bg-slate-900/60 border border-dashed border-wealth-border/60 rounded-xl p-10 text-center flex flex-col items-center justify-center space-y-4">
                  <Sparkles size={36} className="text-wealth-textSecondary" />
                  <div>
                    <h3 className="text-base font-bold">No recommendations generated yet</h3>
                    <p className="text-sm text-wealth-textSecondary mt-1">
                      Our engine will analyze your current asset holdings and compare them to your risk tolerance model.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-wealth-accent hover:bg-wealth-accentHover text-sm font-semibold rounded-lg transition-colors text-white"
                  >
                    Generate Initial Advice
                  </button>
                </div>
              )}

              {/* Historical Recommendations */}
              {historicalRecs.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-lg font-bold">Historical Suggestions</h2>
                  <div className="grid gap-4">
                    {historicalRecs.map((rec) => (
                      <div 
                        key={rec.id} 
                        className="bg-slate-900/40 border border-wealth-border/40 rounded-xl p-5 flex items-center justify-between hover:bg-slate-900/70 transition-colors"
                      >
                        <div className="flex gap-3 items-center">
                          <div className={`p-2 rounded-lg ${rec.is_read ? "bg-slate-800 text-slate-400" : "bg-wealth-accent/10 text-wealth-accent"}`}>
                            <Lightbulb size={18} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold">{rec.title}</h3>
                            <p className="text-xs text-wealth-textSecondary mt-0.5">
                              {new Date(rec.created_at).toLocaleDateString()} &bull; {rec.is_read ? 'Reviewed' : 'Unread'}
                            </p>
                          </div>
                        </div>
                        
                        {!rec.is_read && (
                          <button
                            onClick={() => handleMarkRead(rec.id)}
                            className="text-xs font-semibold text-wealth-accent hover:text-wealth-accentHover hover:underline"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
