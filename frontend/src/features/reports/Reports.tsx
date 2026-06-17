import React, { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../lib/api_client';
import { 
  FileText, Download, FileSpreadsheet, RefreshCw, Info, Calendar, ShieldAlert 
} from 'lucide-react';

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState<{ pdf: boolean; csv: boolean }>({
    pdf: false,
    csv: false
  });

  const downloadReport = async (type: 'pdf' | 'csv') => {
    try {
      setIsDownloading(prev => ({ ...prev, [type]: true }));
      
      const response = await apiClient.get(`/reports/${type}`, {
        responseType: 'blob'
      });
      
      const mimeType = type === 'pdf' ? 'application/pdf' : 'text/csv';
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `portfolio_report_${user?.id || 'export'}.${type}`);
      document.body.appendChild(link);
      
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Failed to download ${type} report:`, err);
    } finally {
      setIsDownloading(prev => ({ ...prev, [type]: false }));
    }
  };

  const reportDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="flex h-screen bg-wealth-bg text-wealth-textPrimary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />
        
        <main className="p-8 max-w-5xl w-full mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports & Data Exports</h1>
            <p className="text-sm text-wealth-textSecondary mt-1">
              Export your investment ledger, financial goals, and portfolio statistics.
            </p>
          </div>

          {/* Alert / Notice */}
          <div className="p-4 bg-slate-900 border border-wealth-border/60 rounded-xl flex gap-3 text-sm text-wealth-textSecondary">
            <Calendar size={18} className="text-wealth-accent shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-wealth-textPrimary">As of today, {reportDate}</span>
              <p className="mt-0.5 text-xs opacity-90">
                Exports reflect all currently settled trades, real-time ticker prices, and active goals.
              </p>
            </div>
          </div>

          {/* Export Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* PDF Report Card */}
            <div className="bg-slate-900 border border-wealth-border/60 rounded-xl p-6 shadow-xl flex flex-col justify-between hover:border-wealth-border transition-colors">
              <div className="space-y-4">
                <div className="p-3 bg-red-500/10 text-red-400 w-fit rounded-lg">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Executive PDF Summary</h2>
                  <p className="text-xs text-wealth-textSecondary mt-1 leading-relaxed">
                    Download a comprehensive, publication-quality executive summary. Includes:
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-wealth-textSecondary list-disc list-inside">
                    <li>Asset allocation drift analysis</li>
                    <li>Detailed breakdown of active holdings</li>
                    <li>Financial goals status and completion progress bars</li>
                    <li>Latest Recommendations Engine advice</li>
                  </ul>
                </div>
              </div>
              
              <button
                onClick={() => downloadReport('pdf')}
                disabled={isDownloading.pdf}
                className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-sm font-semibold rounded-lg transition-colors border border-wealth-border/60 disabled:opacity-50"
              >
                {isDownloading.pdf ? (
                  <>
                    <RefreshCw size={16} className="animate-spin text-red-400" />
                    <span>Compiling PDF...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} className="text-red-400" />
                    <span>Download PDF Report</span>
                  </>
                )}
              </button>
            </div>

            {/* CSV Data Export Card */}
            <div className="bg-slate-900 border border-wealth-border/60 rounded-xl p-6 shadow-xl flex flex-col justify-between hover:border-wealth-border transition-colors">
              <div className="space-y-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 w-fit rounded-lg">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Structured CSV Data Export</h2>
                  <p className="text-xs text-wealth-textSecondary mt-1 leading-relaxed">
                    Download a raw comma-separated value file containing your database records. Includes:
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-wealth-textSecondary list-disc list-inside">
                    <li>Raw portfolio metrics (Cost basis, current value)</li>
                    <li>Full active assets ledger with average cost and last price</li>
                    <li>Detailed target amounts and monthly contributions per goal</li>
                    <li>Perfect format for import to Excel, Google Sheets, or Numbers</li>
                  </ul>
                </div>
              </div>
              
              <button
                onClick={() => downloadReport('csv')}
                disabled={isDownloading.csv}
                className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-sm font-semibold rounded-lg transition-colors border border-wealth-border/60 disabled:opacity-50"
              >
                {isDownloading.csv ? (
                  <>
                    <RefreshCw size={16} className="animate-spin text-emerald-400" />
                    <span>Formatting CSV...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} className="text-emerald-400" />
                    <span>Export CSV Spreadsheet</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Info Card */}
          <div className="bg-slate-950/40 border border-wealth-border/30 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-wealth-accent">
              <Info size={16} />
              <span>Reporting Data Transparency</span>
            </h3>
            <p className="text-xs text-wealth-textSecondary leading-relaxed">
              We aggregate data from standard public APIs (primarily Yahoo Finance). Ticker prices are refreshed 
              automatically upon loading your portfolio, but can be updated manually at any time. Currency conversions 
              and calculations are completed using high-precision data types to minimize round-off errors.
            </p>
            <div className="p-3.5 bg-slate-900 border border-wealth-border/40 rounded-lg flex gap-3 items-start text-xxs text-slate-400 leading-normal">
              <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Security note:</strong> Generated reports contain personal financial info, such as asset balances 
                and goal target dates. Keep downloaded documents in secure local folders and avoid sharing spreadsheets 
                on untrusted public networks.
              </span>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};
