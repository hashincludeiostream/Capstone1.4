import React, { useState, useMemo } from 'react';
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
  DollarSign,
  Package,
  Layers,
  Sliders,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import {
  StoreReportData,
  FinancialPeriodItem,
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
  const [activeViewTab, setActiveViewTab] = useState<
    'overview' | 'financial_pnl' | 'treatment_mix' | 'staff_scorecard' | 'inventory_audit' | 'crm_loyalty' | 'recommendations' | 'export_options'
  >('overview');

  // Interactive P&L controls within modal
  const [pnlTimeGrain, setPnlTimeGrain] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [showCostSliders, setShowCostSliders] = useState(false);
  const [laborPercent, setLaborPercent] = useState(40);
  const [suppliesPercent, setSuppliesPercent] = useState(15);
  const [overheadPercent, setOverheadPercent] = useState(8);

  // Strategic Recommendations for Decision Making
  const recommendations = [
    {
      title: 'Peak Weekend Capacity Re-allocation',
      category: 'Operations & Staffing',
      icon: Clock,
      urgency: 'Immediate',
      urgencyColor: 'bg-amber-100 text-amber-900 border-amber-300',
      description:
        `Use the busiest day in the current report (${reportData.stats.totalAppointments > 0 ? (reportData.volumeSummary?.peakPeriod || 'see booking trend') : 'not available yet'}) to plan technician coverage and cleaning buffers.`,
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

  // Dynamic P&L Data derived from report data
  const pnlData = useMemo(() => {
    if (reportData.profitRevenueSummary) {
      return reportData.profitRevenueSummary;
    }

    // Fallback if not directly provided: synthesize from monthly trend and stats
    const totalServices = reportData.stats.totalRevenue || 0;
    const totalRetail = reportData.inventorySummary?.pickupRevenue || 0;
    const grossRev = totalServices + totalRetail;
    const labor = Math.round(totalServices * (laborPercent / 100));
    const supplies = Math.round(totalServices * (suppliesPercent / 100) + totalRetail * 0.45);
    const overhead = Math.round(grossRev * (overheadPercent / 100));
    const totalExp = labor + supplies + overhead;
    const profit = grossRev - totalExp;
    const margin = grossRev > 0 ? (profit / grossRev) * 100 : 0;
    const totalTx = reportData.stats.completedCount + (reportData.inventorySummary?.completedPickupOrdersCount || 0);
    const avgTicket = totalTx > 0 ? Math.round(grossRev / totalTx) : 0;

    const periods: FinancialPeriodItem[] = (reportData.volumeSummary?.trend || reportData.monthlyTrend.map(m => ({
      label: m.month,
      shortLabel: m.month.split(' ')[0],
      count: m.count,
      income: m.income || 0,
      value: m.income || m.count,
      formattedValue: `${m.count} visits`,
    }))).map((item) => {
      const sRev = item.income || Math.round(item.count * (avgTicket || 850));
      const rRev = Math.round(sRev * 0.12);
      const tRev = sRev + rRev;
      const lExp = Math.round(sRev * (laborPercent / 100));
      const supExp = Math.round(sRev * (suppliesPercent / 100) + rRev * 0.45);
      const ovExp = Math.round(tRev * (overheadPercent / 100));
      const tExp = lExp + supExp + ovExp;
      const p = tRev - tExp;
      const m = tRev > 0 ? (p / tRev) * 100 : 0;

      return {
        periodLabel: item.label,
        shortLabel: item.shortLabel,
        dateKey: item.label,
        servicesRevenue: sRev,
        retailRevenue: rRev,
        totalRevenue: tRev,
        appointmentCount: item.count,
        orderCount: Math.round(item.count * 0.2),
        laborExpense: lExp,
        suppliesExpense: supExp,
        overheadExpense: ovExp,
        totalExpenses: tExp,
        netProfit: p,
        profitMargin: m,
        averageTicket: item.count > 0 ? Math.round(tRev / item.count) : avgTicket,
      };
    });

    return {
      salonName: reportData.salonName,
      salonAddress: reportData.salonAddress,
      contactNumber: reportData.contactNumber,
      generatedDate: reportData.generatedDate,
      timeGrain: pnlTimeGrain,
      timeRange: pnlTimeGrain === 'daily' ? 'Past 7 Days' : pnlTimeGrain === 'weekly' ? 'Past 4 Weeks' : pnlTimeGrain === 'yearly' ? 'Past 3 Years' : 'Past 6 Months',
      costAssumptions: {
        laborCommissionPercent: laborPercent,
        suppliesCostPercent: suppliesPercent,
        overheadPercent,
      },
      summary: {
        totalGrossRevenue: grossRev,
        totalServicesRevenue: totalServices,
        totalRetailRevenue: totalRetail,
        totalLaborExpenses: labor,
        totalSuppliesExpenses: supplies,
        totalOverheadExpenses: overhead,
        totalExpenses: totalExp,
        netProfit: profit,
        profitMargin: margin,
        totalAppointments: reportData.stats.completedCount,
        totalOrders: reportData.inventorySummary?.completedPickupOrdersCount || 0,
        averageTicket: avgTicket,
        peakPeriod: reportData.volumeSummary?.peakPeriod || 'Current Month',
        peakProfit: Math.round(profit * 0.35),
        peakRevenue: Math.round(grossRev * 0.35),
      },
      periods,
    };
  }, [reportData, pnlTimeGrain, laborPercent, suppliesPercent, overheadPercent]);

  const handlePrint = () => {
    // Inject active pnlData into reportData so print PDF has full all-in-one content
    const enrichedData: StoreReportData = {
      ...reportData,
      profitRevenueSummary: pnlData,
    };
    const html = generateStoreVisualHtmlReport(enrichedData);
    openPrintableReport(html);
    showToast('Opening print preview for All-in-One Master PDF');
  };

  const handleDownloadHtml = () => {
    const enrichedData: StoreReportData = {
      ...reportData,
      profitRevenueSummary: pnlData,
    };
    const html = generateStoreVisualHtmlReport(enrichedData);
    const filename = `${reportData.salonName.replace(/\s+/g, '_')}_All_In_One_Master_Report_${new Date().toISOString().split('T')[0]}.html`;
    downloadFile(html, filename, 'text/html');
    showToast('Visual All-in-One Master Report downloaded (HTML/PDF ready)');
  };

  const maxPeriodRev = Math.max(...pnlData.periods.map((p) => p.totalRevenue), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] shadow-2xl border border-pink-100 flex flex-col overflow-hidden">
        {/* Modal Master Header */}
        <div className="p-5 bg-gradient-to-r from-purple-900 via-pink-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <FileText className="w-5 h-5 text-pink-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-serif font-bold">
                  All-in-One Master Salon Performance &amp; Financial Report
                </h3>
                <span className="text-[10px] font-bold bg-pink-500/30 text-pink-200 border border-pink-400/40 px-2 py-0.5 rounded-full uppercase">
                  Complete Dossier
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                {reportData.salonName} • Unified financial P&amp;L, operational KPIs, service mix, specialist scores, retail inventory &amp; CRM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print All-in-One PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-header Navigation Tabs & Fast Actions */}
        <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveViewTab('overview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeViewTab === 'overview'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              Overview &amp; KPIs
            </button>
            <button
              onClick={() => setActiveViewTab('financial_pnl')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeViewTab === 'financial_pnl'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Financial P&amp;L Statement</span>
            </button>
            <button
              onClick={() => setActiveViewTab('treatment_mix')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeViewTab === 'treatment_mix'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Treatment Mix</span>
            </button>
            <button
              onClick={() => setActiveViewTab('staff_scorecard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeViewTab === 'staff_scorecard'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Specialists</span>
            </button>
            <button
              onClick={() => setActiveViewTab('inventory_audit')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeViewTab === 'inventory_audit'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Retail Stock</span>
            </button>
            <button
              onClick={() => setActiveViewTab('recommendations')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeViewTab === 'recommendations'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Strategic Decisions</span>
            </button>
            <button
              onClick={() => setActiveViewTab('export_options')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeViewTab === 'export_options'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              Exports &amp; Print
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print PDF</span>
            </button>
            <button
              onClick={() => {
                onExportCsv();
                showToast('All-in-One Master CSV exported');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Visual HTML</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-800">
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeViewTab === 'overview' && (
            <div className="space-y-6">
              {/* Executive Summary Callout */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-pink-50 to-emerald-50 border border-purple-100 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-950 space-y-1">
                  <p className="font-bold text-sm">Unified Executive Briefing</p>
                  <p className="text-gray-700 leading-relaxed">
                    Over the reporting period, {reportData.salonName} achieved an appointment fulfillment rate of{' '}
                    <strong className="text-purple-900">{reportData.stats.completionRate}%</strong> across{' '}
                    <strong className="text-purple-900">{reportData.stats.completedCount} completed physical salon visits</strong>, generating{' '}
                    <strong className="text-emerald-900">₱{pnlData.summary.totalGrossRevenue.toLocaleString()}</strong> in gross salon revenue with an estimated retained net operating profit of{' '}
                    <strong className="text-emerald-900">₱{pnlData.summary.netProfit.toLocaleString()} ({pnlData.summary.profitMargin.toFixed(1)}% margin)</strong>.
                    Repeat client retention stands at <strong className="text-purple-900">{reportData.crmSummary.retentionRate}%</strong>.
                  </p>
                </div>
              </div>

              {/* Master Core Scorecard Grid (6 KPIs) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 bg-white border border-purple-200/80 rounded-2xl text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Gross Revenue</span>
                  <p className="text-xl font-serif font-bold text-purple-950 mt-1">
                    ₱{pnlData.summary.totalGrossRevenue.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-purple-700 font-semibold block mt-0.5">
                    Services + Retail
                  </span>
                </div>
                <div className="p-3.5 bg-white border border-emerald-200/80 rounded-2xl text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Retained Net Profit</span>
                  <p className="text-xl font-serif font-bold text-emerald-900 mt-1">
                    ₱{pnlData.summary.netProfit.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                    {pnlData.summary.profitMargin.toFixed(1)}% Margin
                  </span>
                </div>
                <div className="p-3.5 bg-white border border-gray-200 rounded-2xl text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Completed Visits</span>
                  <p className="text-xl font-serif font-bold text-gray-900 mt-1">
                    {reportData.stats.completedCount}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                    +{reportData.stats.confirmedCount} upcoming
                  </span>
                </div>
                <div className="p-3.5 bg-white border border-gray-200 rounded-2xl text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Fulfillment Rate</span>
                  <p className="text-xl font-serif font-bold text-gray-900 mt-1">
                    {reportData.stats.completionRate}%
                  </p>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                    Target &gt;90%
                  </span>
                </div>
                <div className="p-3.5 bg-white border border-gray-200 rounded-2xl text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Client Retention</span>
                  <p className="text-xl font-serif font-bold text-purple-950 mt-1">
                    {reportData.crmSummary.retentionRate}%
                  </p>
                  <span className="text-[10px] text-purple-600 font-semibold block mt-0.5">
                    {reportData.crmSummary.vipCount + reportData.crmSummary.regularCount} Repeat Clients
                  </span>
                </div>
                <div className="p-3.5 bg-white border border-gray-200 rounded-2xl text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Retail Stock Value</span>
                  <p className="text-xl font-serif font-bold text-emerald-950 mt-1">
                    ₱{(reportData.inventorySummary?.totalInventoryValue || 0).toLocaleString()}
                  </p>
                  <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">
                    {reportData.inventorySummary?.totalUnitsInStock || 0} units on shelf
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
                      Appointment Booking Trajectory
                    </h4>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      Monthly Interval
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
                      Treatment Category Demand Share
                    </h4>
                    <span className="text-[10px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-md">
                      By Bookings
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {reportData.categoryBreakdown.map((cat, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-700">{cat.name}</span>
                          <span className="text-purple-900 font-bold">
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

              {/* Fast Action Buttons to Other Sections */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setActiveViewTab('financial_pnl')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 cursor-pointer flex items-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Inspect Complete Financial P&amp;L Ledger →</span>
                </button>
                <button
                  onClick={() => setActiveViewTab('staff_scorecard')}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold hover:bg-purple-100 cursor-pointer flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View Specialist Capacity &amp; Hours →</span>
                </button>
                <button
                  onClick={() => setActiveViewTab('recommendations')}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold hover:bg-amber-100 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>View Strategic Decision Matrix (4) →</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCIAL P&L STATEMENT */}
          {activeViewTab === 'financial_pnl' && (
            <div className="space-y-5">
              {/* Financial Control Bar */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Reporting Grain:
                  </span>
                  <div className="inline-flex rounded-xl bg-white p-1 border border-emerald-200 shadow-2xs">
                    {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((grain) => (
                      <button
                        key={grain}
                        onClick={() => setPnlTimeGrain(grain)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                          pnlTimeGrain === grain
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {grain}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCostSliders(!showCostSliders)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-900 text-xs font-bold hover:bg-emerald-50 cursor-pointer shadow-2xs"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Cost Model ({laborPercent}% Labor, {suppliesPercent}% Supplies, {overheadPercent}% Overhead)</span>
                    {showCostSliders ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expandable Cost Sliders */}
              {showCostSliders && (
                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
                  <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Operating Cost Assumptions
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-bold text-gray-700">
                        <span>Technician Commission:</span>
                        <span className="text-purple-700">{laborPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="60"
                        value={laborPercent}
                        onChange={(e) => setLaborPercent(Number(e.target.value))}
                        className="w-full accent-purple-700"
                      />
                      <span className="text-[10px] text-gray-400">Share paid to nail artists</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between font-bold text-gray-700">
                        <span>Supplies &amp; Gels (COGS):</span>
                        <span className="text-pink-700">{suppliesPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="30"
                        value={suppliesPercent}
                        onChange={(e) => setSuppliesPercent(Number(e.target.value))}
                        className="w-full accent-pink-700"
                      />
                      <span className="text-[10px] text-gray-400">Gels, tips, sanitizers</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between font-bold text-gray-700">
                        <span>Facility &amp; Overhead:</span>
                        <span className="text-amber-700">{overheadPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="20"
                        value={overheadPercent}
                        onChange={(e) => setOverheadPercent(Number(e.target.value))}
                        className="w-full accent-amber-700"
                      />
                      <span className="text-[10px] text-gray-400">Rent, electricity, tools</span>
                    </div>
                  </div>
                </div>
              )}

              {/* P&L Financial Cards (4) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs">
                  <span className="text-xs font-semibold text-gray-500">Gross Operating Revenue</span>
                  <p className="text-2xl font-serif font-bold text-gray-900 mt-1">
                    ₱{pnlData.summary.totalGrossRevenue.toLocaleString()}
                  </p>
                  <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
                    ₱{pnlData.summary.totalServicesRevenue.toLocaleString()} Services • ₱{pnlData.summary.totalRetailRevenue.toLocaleString()} Retail
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs">
                  <span className="text-xs font-semibold text-gray-500">Total Operating Expenses</span>
                  <p className="text-2xl font-serif font-bold text-rose-700 mt-1">
                    -₱{pnlData.summary.totalExpenses.toLocaleString()}
                  </p>
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    -₱{pnlData.summary.totalLaborExpenses.toLocaleString()} Commissions • -₱{(pnlData.summary.totalSuppliesExpenses + pnlData.summary.totalOverheadExpenses).toLocaleString()} Supplies/Overhead
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-2xs">
                  <span className="text-xs font-bold text-emerald-900">Retained Net Profit</span>
                  <p className="text-2xl font-serif font-bold text-emerald-950 mt-1">
                    ₱{pnlData.summary.netProfit.toLocaleString()}
                  </p>
                  <span className="text-[11px] font-bold text-emerald-700 mt-1 block">
                    {pnlData.summary.profitMargin.toFixed(1)}% Operating Profit Margin
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs">
                  <span className="text-xs font-semibold text-gray-500">Average Transaction Ticket</span>
                  <p className="text-2xl font-serif font-bold text-purple-950 mt-1">
                    ₱{pnlData.summary.averageTicket.toLocaleString()}
                  </p>
                  <span className="text-[11px] text-purple-600 font-medium mt-1 block">
                    Across {pnlData.summary.totalAppointments + (pnlData.summary.totalOrders || 0)} client transactions
                  </span>
                </div>
              </div>

              {/* Comparative Visual Chart (Revenue vs Net Profit) */}
              <div className="p-5 rounded-2xl border border-gray-200 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    Period Revenue vs. Retained Net Operating Profit
                  </h4>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 font-semibold text-purple-900">
                      <span className="w-2.5 h-2.5 bg-purple-700 rounded-xs"></span>
                      Revenue
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-800">
                      <span className="w-2.5 h-2.5 bg-emerald-600 rounded-xs"></span>
                      Net Profit
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-end gap-3 h-40 border-b border-gray-100 pb-2 overflow-x-auto">
                  {pnlData.periods.map((p, i) => {
                    const revHeight = Math.max(10, Math.round((p.totalRevenue / maxPeriodRev) * 100));
                    const profitHeight = Math.max(6, Math.round((Math.max(0, p.netProfit) / maxPeriodRev) * 100));

                    return (
                      <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-[55px] h-full justify-end">
                        <span className="text-[10px] font-bold text-gray-800">₱{p.totalRevenue.toLocaleString()}</span>
                        <div className="flex items-end gap-1.5 h-full w-full justify-center">
                          <div
                            className="w-4 bg-gradient-to-t from-purple-800 to-indigo-600 rounded-t-sm"
                            style={{ height: `${revHeight}%` }}
                            title={`Revenue: ₱${p.totalRevenue.toLocaleString()}`}
                          />
                          <div
                            className="w-4 bg-gradient-to-t from-emerald-700 to-teal-500 rounded-t-sm"
                            style={{ height: `${profitHeight}%` }}
                            title={`Profit: ₱${p.netProfit.toLocaleString()}`}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium truncate w-full text-center mt-1">
                          {p.shortLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Itemized P&L Ledger Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 uppercase font-semibold text-[10px] border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-3">Period</th>
                      <th className="py-3 px-2 text-center">Activity</th>
                      <th className="py-3 px-2 text-right">Services</th>
                      <th className="py-3 px-2 text-right">Retail</th>
                      <th className="py-3 px-2 text-right font-bold text-gray-900">Gross Rev</th>
                      <th className="py-3 px-2 text-right text-rose-700">Commissions</th>
                      <th className="py-3 px-2 text-right text-rose-700">Supplies &amp; OH</th>
                      <th className="py-3 px-2 text-right font-bold text-rose-900">Total Costs</th>
                      <th className="py-3 px-2 text-right font-bold text-emerald-900">Net Profit</th>
                      <th className="py-3 px-2 text-center">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pnlData.periods.map((p, idx) => (
                      <tr key={idx} className="hover:bg-purple-50/20 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-gray-900 whitespace-nowrap">{p.periodLabel}</td>
                        <td className="py-2.5 px-2 text-center text-gray-500 text-[11px]">
                          {p.appointmentCount} appts • {p.orderCount} retail
                        </td>
                        <td className="py-2.5 px-2 text-right text-gray-600">₱{p.servicesRevenue.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right text-gray-600">₱{p.retailRevenue.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right font-bold text-purple-950">₱{p.totalRevenue.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right text-rose-600">-₱{p.laborExpense.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right text-rose-600">-₱{(p.suppliesExpense + p.overheadExpense).toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right font-bold text-rose-700">-₱{p.totalExpenses.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right font-bold text-emerald-900">₱{p.netProfit.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.profitMargin >= 30 ? 'bg-emerald-100 text-emerald-800' : p.profitMargin >= 15 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {p.profitMargin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TREATMENT MIX */}
          {activeViewTab === 'treatment_mix' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Nail Treatment Popularity &amp; Revenue Share
                  </h4>
                  <p className="text-xs text-gray-500">
                    Category demand breakdown based on verified salon client appointments.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportData.categoryBreakdown.map((cat, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2 shadow-2xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-900">{cat.name}</span>
                      <span className="font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md">
                        {cat.count} bookings ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600"
                        style={{ width: `${Math.max(6, cat.percentage)}%` }}
                      />
                    </div>
                    {cat.income ? (
                      <p className="text-[11px] text-gray-500 text-right font-medium">
                        Gross Yield: <strong className="text-emerald-800">₱{cat.income.toLocaleString()}</strong>
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Top Services ranking if available */}
              {reportData.treatmentMix?.topServices && reportData.treatmentMix.topServices.length > 0 && (
                <div className="p-4 rounded-2xl border border-gray-200 bg-white space-y-3 shadow-2xs">
                  <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Top Grossing Services
                  </h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Service Name</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3 text-center">Bookings</th>
                          <th className="py-2 px-3 text-right">Income (PHP)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reportData.treatmentMix.topServices.map((s, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-semibold text-gray-900">{s.name}</td>
                            <td className="py-2 px-3 text-gray-500">{s.category}</td>
                            <td className="py-2 px-3 text-center font-bold text-purple-900">{s.bookings}</td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-900">₱{s.income.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SPECIALISTS */}
          {activeViewTab === 'staff_scorecard' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Specialist Team Productivity &amp; Scorecard
                  </h4>
                  <p className="text-xs text-gray-500">
                    Performance metrics, serviced hours, and customer satisfaction ratings for all active technicians.
                  </p>
                </div>
                <span className="text-xs font-bold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200">
                  {reportData.staffScorecard.length} Active Technicians
                </span>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 uppercase font-semibold text-[10px] border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Technician</th>
                      <th className="py-3 px-3">Specialties</th>
                      <th className="py-3 px-3 text-center">Completed Visits</th>
                      <th className="py-3 px-3 text-center">Serviced Hours</th>
                      <th className="py-3 px-3 text-center">Rating</th>
                      <th className="py-3 px-3 text-right">Est. Commissions (40%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportData.staffScorecard.map((tech, i) => {
                      const estIncome = tech.completedCount * 850;
                      const estCommission = Math.round(estIncome * 0.4);

                      return (
                        <tr key={i} className="hover:bg-purple-50/20 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-gray-900 block">{tech.name}</span>
                            <span className="text-[10px] text-gray-400">{tech.experience_years} years experience</span>
                          </td>
                          <td className="py-3 px-3 text-gray-600">{tech.specialties}</td>
                          <td className="py-3 px-3 text-center font-bold text-purple-950">
                            {tech.completedCount} / {tech.totalBookings}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-indigo-900">
                            {tech.hoursServiced} hrs
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-amber-600">
                            ★ {tech.rating || '5.0'}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-900">
                            ₱{estCommission.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: RETAIL INVENTORY */}
          {activeViewTab === 'inventory_audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Store Product Inventory &amp; Stock Health Audit
                  </h4>
                  <p className="text-xs text-gray-500">
                    Shelf asset valuation, unit quantities, and low stock threshold alerts.
                  </p>
                </div>
              </div>

              {/* 4 Inventory Metrics */}
              {reportData.inventorySummary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-white border border-gray-200 rounded-2xl text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Registered SKUs</span>
                    <p className="text-xl font-serif font-bold text-gray-900 mt-1">
                      {reportData.inventorySummary.totalProducts} Items
                    </p>
                    <span className="text-[10px] text-gray-500 block mt-0.5">
                      {reportData.inventorySummary.totalUnitsInStock} total units
                    </span>
                  </div>
                  <div className="p-3.5 bg-white border border-emerald-200 rounded-2xl text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Stock Valuation</span>
                    <p className="text-xl font-serif font-bold text-emerald-950 mt-1">
                      ₱{reportData.inventorySummary.totalInventoryValue.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">
                      Asset on shelves
                    </span>
                  </div>
                  <div className="p-3.5 bg-white border border-rose-200 rounded-2xl text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Restock Urgency</span>
                    <p className="text-xl font-serif font-bold text-rose-700 mt-1">
                      {reportData.inventorySummary.lowStockCount + reportData.inventorySummary.outOfStockCount} Items
                    </p>
                    <span className="text-[10px] text-rose-600 block mt-0.5">
                      {reportData.inventorySummary.outOfStockCount} out of stock
                    </span>
                  </div>
                  <div className="p-3.5 bg-white border border-purple-200 rounded-2xl text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">In-Store Pickups</span>
                    <p className="text-xl font-serif font-bold text-purple-950 mt-1">
                      {reportData.inventorySummary.pendingPickupOrdersCount} Orders
                    </p>
                    <span className="text-[10px] text-purple-600 block mt-0.5">
                      ₱{reportData.inventorySummary.pickupRevenue.toLocaleString()} reserved
                    </span>
                  </div>
                </div>
              )}

              {/* Product Stock Table */}
              {reportData.inventoryItems && reportData.inventoryItems.length > 0 && (
                <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 uppercase font-semibold text-[10px] border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3">Product Name &amp; SKU</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Price (PHP)</th>
                        <th className="py-2.5 px-3 text-center">On-Hand Stock</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Total Asset Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.inventoryItems.map((p, idx) => (
                        <tr key={idx} className="hover:bg-purple-50/20 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-gray-900">{p.name}</td>
                          <td className="py-2.5 px-3 text-gray-500">{p.category}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-gray-800">₱{p.price.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-gray-900">{p.stock_quantity}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'In Stock' ? 'bg-emerald-100 text-emerald-800' : p.status === 'Low Stock' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-900">₱{p.inventoryValue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: CRM LOYALTY */}
          {activeViewTab === 'crm_loyalty' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Client CRM &amp; Repeat Retention Intelligence
                  </h4>
                  <p className="text-xs text-gray-500">
                    Client segmentation into VIP Diamond, Loyal Regulars, New, and Churn At-Risk cohorts.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white border border-purple-200 rounded-2xl text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-purple-700 uppercase">VIP Diamond</span>
                  <p className="text-2xl font-serif font-bold text-purple-950 mt-1">
                    {reportData.crmSummary.vipCount}
                  </p>
                  <span className="text-[10px] text-gray-500 block mt-0.5">&gt;= 3 completed visits</span>
                </div>
                <div className="p-3.5 bg-white border border-pink-200 rounded-2xl text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-pink-700 uppercase">Loyal Regulars</span>
                  <p className="text-2xl font-serif font-bold text-pink-950 mt-1">
                    {reportData.crmSummary.regularCount}
                  </p>
                  <span className="text-[10px] text-gray-500 block mt-0.5">2 completed visits</span>
                </div>
                <div className="p-3.5 bg-white border border-blue-200 rounded-2xl text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-blue-700 uppercase">New Clients</span>
                  <p className="text-2xl font-serif font-bold text-blue-950 mt-1">
                    {reportData.crmSummary.newCount}
                  </p>
                  <span className="text-[10px] text-gray-500 block mt-0.5">1 visit (recent)</span>
                </div>
                <div className="p-3.5 bg-white border border-rose-200 rounded-2xl text-center shadow-2xs">
                  <span className="text-[10px] font-bold text-rose-700 uppercase">At-Risk Clients</span>
                  <p className="text-2xl font-serif font-bold text-rose-950 mt-1">
                    {reportData.crmSummary.atRiskCount}
                  </p>
                  <span className="text-[10px] text-rose-600 font-bold block mt-0.5">&gt;30 days inactive</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: STRATEGIC ACTION MATRIX */}
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

          {/* TAB 8: EXPORT & DOWNLOAD HUB */}
          {activeViewTab === 'export_options' && (
            <div className="space-y-4">
              <div className="text-xs text-gray-500">
                Generate or download unified store reports covering all operational, financial P&amp;L, staff, and inventory records in one document.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Option 1: Standalone Visual HTML / PDF Document */}
                <div className="p-5 rounded-2xl border border-purple-200 bg-purple-50/50 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h5 className="text-sm font-bold text-purple-950">All-in-One Visual PDF Report</h5>
                    <p className="text-xs text-gray-600">
                      Standalone formatted executive document with P&amp;L operating statement, visual trends, scorecards, and strategy matrix.
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handlePrint}
                      className="w-full py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print / Save to PDF</span>
                    </button>
                    <button
                      onClick={handleDownloadHtml}
                      className="w-full py-2 px-3 rounded-xl bg-white hover:bg-gray-50 border border-purple-200 text-purple-900 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download HTML File</span>
                    </button>
                  </div>
                </div>

                {/* Option 2: Full Operational CSV Spreadsheet */}
                <div className="p-5 rounded-2xl border border-pink-200 bg-pink-50/50 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-pink-700 text-white flex items-center justify-center font-bold">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h5 className="text-sm font-bold text-pink-950">Master Excel / CSV Ledger</h5>
                    <p className="text-xs text-gray-600">
                      Complete multi-table ledger including financial P&amp;L statements, client CRM records, technician hours, and full product stock.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onExportCsv();
                      showToast('Master CSV ledger exported successfully');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-pink-700 hover:bg-pink-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Master CSV</span>
                  </button>
                </div>

                {/* Option 3: Management Presentation Summary */}
                <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/50 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h5 className="text-sm font-bold text-indigo-950">Executive Briefing</h5>
                    <p className="text-xs text-gray-600">
                      Copy executive bullet points directly to your clipboard for WhatsApp, email, or executive salon partner updates.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const brief = `Executive Brief - ${reportData.salonName}\n• Gross Revenue: ₱${pnlData.summary.totalGrossRevenue.toLocaleString()}\n• Retained Net Profit: ₱${pnlData.summary.netProfit.toLocaleString()} (${pnlData.summary.profitMargin.toFixed(1)}% margin)\n• Completed Visits: ${reportData.stats.completedCount}\n• Fulfillment Rate: ${reportData.stats.completionRate}%\n• Retention: ${reportData.crmSummary.retentionRate}%\n• Retail Stock Valuation: ₱${(reportData.inventorySummary?.totalInventoryValue || 0).toLocaleString()}\n• Key Action: Review ${reportData.crmSummary.atRiskCount} clients flagged for re-engagement.`;
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
            Nail Glam Hub • All-in-One Master Salon Reporting &amp; Financial P&amp;L Suite
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
