import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  BarChart3,
  Users,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  Scissors,
  Share2,
  X,
} from 'lucide-react';
import {
  StoreReportData,
  generateStoreVisualHtmlReport,
  downloadFile,
  openPrintableReport,
} from '../../utils/reportGenerators';

interface DecisionReportModalProps {
  reportData: StoreReportData;
  onClose: () => void;
  onExportCsv: () => void;
  showToast: (msg: string) => void;
}

export const DecisionReportModal: React.FC<DecisionReportModalProps> = ({
  reportData,
  onClose,
  onExportCsv,
  showToast,
}) => {
  const [activeViewTab, setActiveViewTab] = useState<'preview' | 'recommendations' | 'export_options'>('preview');

  // Strategic Recommendations for Decision Making
  const recommendations = [
    {
      title: 'Peak Weekend Capacity Re-allocation',
      category: 'Operations & Staffing',
      icon: Clock,
      urgency: 'Immediate',
      urgencyColor: 'bg-amber-100 text-amber-900 border-amber-300',
      description:
        `Use the busiest day in the current report (${reportData.stats.totalAppointments > 0 ? 'see booking trend' : 'not available yet'}) to plan technician coverage and cleaning buffers.`,
      impact: 'Capacity planning based on recorded bookings',
    },
    {
      title: 'Signature Russian Manicure & Gel Bundling',
      category: 'Treatment Mix Optimization',
      icon: Scissors,
      urgency: 'High Impact',
      urgencyColor: 'bg-purple-100 text-purple-900 border-purple-300',
      description:
        'Use the treatment mix and repeat-client counts in this report to identify services that merit bundled offers.',
      impact: 'Promote services supported by recorded booking history',
    },
    {
      title: `Automated Re-engagement for ${reportData.crmSummary.atRiskCount} Inactive Clients`,
      category: 'CRM & Client Retention',
      icon: Users,
      urgency: 'Action Required',
      urgencyColor: 'bg-rose-100 text-rose-900 border-rose-300',
      description:
        'Clients with no recent completed visit can be reviewed for a re-engagement campaign using approved salon offers.',
      impact: 'Re-engage clients identified by recorded visit history',
    },
    {
      title: 'Technician 3D Art Skill Cross-Training',
      category: 'Talent & Service Quality',
      icon: Award,
      urgency: 'Medium Term',
      urgencyColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      description:
        'Demand for advanced Japanese 3D nail art exceeds single-specialist availability. Pair senior artists with junior staff for hands-on mentorship.',
      impact: 'Distributes high-value bookings evenly across staff',
    },
  ];

  const handlePrint = () => {
    const html = generateStoreVisualHtmlReport(reportData);
    openPrintableReport(html);
    showToast('Opening print preview for PDF export');
  };

  const handleDownloadHtml = () => {
    const html = generateStoreVisualHtmlReport(reportData);
    const filename = `${reportData.salonName.replace(/\s+/g, '_')}_Decision_Report_${new Date().toISOString().split('T')[0]}.html`;
    downloadFile(html, filename, 'text/html');
    showToast('Visual Decision Report downloaded (HTML/PDF ready)');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-pink-100 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-purple-900 via-pink-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <FileText className="w-5 h-5 text-pink-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-serif font-bold">
                  Executive Decision-Making & Analytics Report
                </h3>
                <span className="text-[10px] font-bold bg-pink-500/30 text-pink-200 border border-pink-400/40 px-2 py-0.5 rounded-full uppercase">
                  Data-Driven Insights
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                {reportData.salonName} • Actionable intelligence for staffing, capacity, and retention
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-header Navigation Tabs & Instant Download Actions */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveViewTab('preview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeViewTab === 'preview'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              Report Overview
            </button>
            <button
              onClick={() => setActiveViewTab('recommendations')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeViewTab === 'recommendations'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Strategic Action Matrix (4)</span>
            </button>
            <button
              onClick={() => setActiveViewTab('export_options')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeViewTab === 'export_options'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              Export & Download Formats
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Visual HTML</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-800">
          {/* TAB 1: REPORT PREVIEW */}
          {activeViewTab === 'preview' && (
            <div className="space-y-6">
              {/* Executive Summary Callout */}
              <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-100 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-950 space-y-1">
                  <p className="font-bold text-sm">Executive Operational Summary</p>
                  <p className="text-gray-600 leading-relaxed">
                    Over the selected period, {reportData.salonName} achieved an appointment fulfillment rate of{' '}
                    <strong className="text-purple-900">{reportData.stats.completionRate}%</strong> with{' '}
                    <strong className="text-purple-900">{reportData.stats.completedCount} completed physical salon visits</strong>.
                    Repeat client retention currently stands at{' '}
                    <strong className="text-purple-900">{reportData.crmSummary.retentionRate}%</strong>.
                  </p>
                </div>
              </div>

              {/* Core Scorecard Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white border border-gray-200 rounded-2xl text-center shadow-2xs">
                  <span className="text-[11px] font-bold text-gray-400 uppercase">Completed Sessions</span>
                  <p className="text-2xl font-serif font-bold text-purple-950 mt-1">
                    {reportData.stats.completedCount}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                    +{reportData.stats.confirmedCount} upcoming
                  </span>
                </div>
                <div className="p-3.5 bg-white border border-gray-200 rounded-2xl text-center shadow-2xs">
                  <span className="text-[11px] font-bold text-gray-400 uppercase">Fulfillment Rate</span>
                  <p className="text-2xl font-serif font-bold text-purple-950 mt-1">
                    {reportData.stats.completionRate}%
                  </p>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                    {reportData.stats.completionRate >= 90 ? 'At or above 90% benchmark' : 'Below 90% benchmark'}
                  </span>
                </div>
                <div className="p-3.5 bg-white border border-gray-200 rounded-2xl text-center shadow-2xs">
                  <span className="text-[11px] font-bold text-gray-400 uppercase">Avg Treatment Time</span>
                  <p className="text-2xl font-serif font-bold text-purple-950 mt-1">
                    {reportData.stats.avgDuration}m
                  </p>
                  <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">
                    Per appointment
                  </span>
                </div>
                <div className="p-3.5 bg-white border border-gray-200 rounded-2xl text-center shadow-2xs">
                  <span className="text-[11px] font-bold text-gray-400 uppercase">Client Retention</span>
                  <p className="text-2xl font-serif font-bold text-purple-950 mt-1">
                    {reportData.crmSummary.retentionRate}%
                  </p>
                  <span className="text-[10px] text-purple-600 font-semibold block mt-0.5">
                    {reportData.crmSummary.vipCount + reportData.crmSummary.regularCount} Repeat Clients
                  </span>
                </div>
              </div>

              {/* Two Column Visual Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 6-Month Booking Volume */}
                <div className="p-4 rounded-2xl border border-gray-200 bg-white space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                      Monthly Appointment Volume
                    </h4>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      6-Month Trend
                    </span>
                  </div>

                  <div className="pt-2 flex items-end justify-between gap-2 h-32 border-b border-gray-100 pb-2">
                    {reportData.monthlyTrend.map((m, i) => {
                      const maxVal = Math.max(...reportData.monthlyTrend.map((x) => x.count), 1);
                      const heightPercent = Math.round((m.count / maxVal) * 100);
                      const isLatest = i === reportData.monthlyTrend.length - 1;

                      return (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
                          <span className="text-[10px] font-bold text-gray-600">{m.count}</span>
                          <div
                            className={`w-full rounded-t-lg transition-all ${
                              isLatest ? 'bg-purple-700 shadow-xs' : 'bg-purple-200'
                            }`}
                            style={{ height: `${Math.max(15, heightPercent)}%` }}
                          />
                          <span className="text-[10px] text-gray-500 font-medium truncate w-full text-center">
                            {m.month.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Treatment Popularity Breakdown */}
                <div className="p-4 rounded-2xl border border-gray-200 bg-white space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-pink-600" />
                      Treatment Popularity Share
                    </h4>
                    <span className="text-[10px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-md">
                      By Category
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {reportData.categoryBreakdown.map((cat, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-700">{cat.name}</span>
                          <span className="text-purple-900">
                            {cat.count} ({cat.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              i === 0
                                ? 'bg-purple-600'
                                : i === 1
                                ? 'bg-pink-500'
                                : i === 2
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(6, cat.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Staff Capacity & CRM Summary Snippet */}
              <div className="p-4 rounded-2xl border border-gray-200 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    Specialist Team Productivity Snapshot
                  </h4>
                  <span className="text-[10px] text-gray-500">
                    {reportData.staffScorecard.length} Active Technicians
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {reportData.staffScorecard.map((tech, i) => (
                    <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{tech.name}</span>
                        <span className="text-[10px] text-amber-600 font-bold">{tech.rating ? `★ ${tech.rating}` : 'Not rated yet'}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">{tech.specialties}</p>
                      <div className="flex justify-between pt-1 text-[11px] border-t border-gray-200/60 font-semibold text-purple-950">
                        <span>{tech.completedCount} Completed</span>
                        <span>{tech.hoursServiced} hrs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STRATEGIC ACTION MATRIX */}
          {activeViewTab === 'recommendations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Actionable Decisions for Salon Management
                  </h4>
                  <p className="text-xs text-gray-500">
                    Algorithmically generated recommendations based on your appointment capacity, staff hours, and CRM return cycles.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {recommendations.map((rec, i) => {
                  const Icon = rec.icon;
                  return (
                    <div
                      key={i}
                      className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-purple-300 transition-all space-y-2 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                              {rec.category}
                            </span>
                            <h5 className="text-sm font-bold text-gray-900">{rec.title}</h5>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rec.urgencyColor}`}>
                          {rec.urgency}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed">{rec.description}</p>

                      <div className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Expected Impact: {rec.impact}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: EXPORT & DOWNLOAD FORMATS */}
          {activeViewTab === 'export_options' && (
            <div className="space-y-4">
              <div className="text-xs text-gray-500">
                Choose the preferred export format to share with branch managers, business partners, or external accountants.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Option 1: Standalone Visual HTML / PDF Document */}
                <div className="p-5 rounded-2xl border border-purple-200 bg-purple-50/50 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h5 className="text-sm font-bold text-purple-950">Visual HTML / PDF Report</h5>
                    <p className="text-xs text-gray-600">
                      Standalone formatted executive document with interactive visual charts, scorecards, and strategy matrix.
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleDownloadHtml}
                      className="w-full py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download HTML File</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="w-full py-2 px-3 rounded-xl bg-white hover:bg-gray-50 border border-purple-200 text-purple-900 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print to PDF</span>
                    </button>
                  </div>
                </div>

                {/* Option 2: Full Operational CSV Spreadsheet */}
                <div className="p-5 rounded-2xl border border-pink-200 bg-pink-50/50 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-pink-700 text-white flex items-center justify-center font-bold">
                      <Download className="w-5 h-5" />
                    </div>
                    <h5 className="text-sm font-bold text-pink-950">Excel / CSV Dataset</h5>
                    <p className="text-xs text-gray-600">
                      Multi-table spreadsheet dataset including raw client CRM records, technician hours, and service volumes.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onExportCsv();
                      showToast('CSV dataset exported successfully');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-pink-700 hover:bg-pink-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV Dataset</span>
                  </button>
                </div>

                {/* Option 3: Management Presentation Summary */}
                <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/50 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h5 className="text-sm font-bold text-indigo-950">Quick Strategic Brief</h5>
                    <p className="text-xs text-gray-600">
                      Copy executive bullet points directly to your clipboard for WhatsApp, email, or executive board updates.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const brief = `Executive Brief - ${reportData.salonName}\n• Completed Visits: ${reportData.stats.completedCount}\n• Fulfillment Rate: ${reportData.stats.completionRate}%\n• Retention: ${reportData.crmSummary.retentionRate}%\n• Peak Load: See monthly trend\n• Key Action: Review ${reportData.crmSummary.atRiskCount} clients flagged for re-engagement.`;
                      navigator.clipboard.writeText(brief);
                      showToast('Executive brief copied to clipboard');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copy Executive Brief</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-500">
            Physical Salon Reservation &amp; CRM Intelligence System
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
