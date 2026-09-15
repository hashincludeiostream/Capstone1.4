import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Download,
  Printer,
  FileSpreadsheet,
  X,
  Sparkles,
  Calendar,
  Layers,
  Percent,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import {
  ProfitRevenueReportData,
  generateProfitRevenueVisualHtmlReport,
  generateProfitRevenueCsv,
  downloadFile,
  openPrintableReport,
} from '../../utils/reportGenerators';

interface ProfitRevenueModalProps {
  reportData: ProfitRevenueReportData;
  onClose: () => void;
  showToast: (msg: string) => void;
  onTimeGrainChange?: (grain: 'daily' | 'weekly' | 'monthly' | 'yearly') => void;
}

export const ProfitRevenueModal: React.FC<ProfitRevenueModalProps> = ({
  reportData,
  onClose,
  showToast,
  onTimeGrainChange,
}) => {
  const [activeTab, setActiveTab] = useState<'statement' | 'visuals' | 'export'>('statement');

  const handlePrint = () => {
    const html = generateProfitRevenueVisualHtmlReport(reportData);
    openPrintableReport(html);
    showToast(`Opening ${reportData.timeGrain} Financial Statement for printing/PDF`);
  };

  const handleDownloadHtml = () => {
    const html = generateProfitRevenueVisualHtmlReport(reportData);
    const filename = `${reportData.salonName.replace(/\s+/g, '_')}_${reportData.timeGrain.toUpperCase()}_Profit_Revenue_${new Date().toISOString().split('T')[0]}.html`;
    downloadFile(html, filename, 'text/html');
    showToast('Visual Financial Statement downloaded');
  };

  const handleDownloadCsv = () => {
    const csv = generateProfitRevenueCsv(reportData);
    const filename = `${reportData.salonName.replace(/\s+/g, '_')}_${reportData.timeGrain.toUpperCase()}_Profit_Revenue_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    downloadFile(csv, filename, 'text/csv');
    showToast('Accountant-ready CSV financial ledger downloaded');
  };

  const maxRevenue = Math.max(...reportData.periods.map((p) => p.totalRevenue), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-emerald-100 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <DollarSign className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-serif font-bold">
                  Profit &amp; Revenue Financial Performance Report
                </h3>
                <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {reportData.timeGrain} Report
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                {reportData.salonName} • Official P&amp;L audit, cost breakdown, and net profit ledger
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-header Controls: Time Grain Selector & Quick Actions */}
        <div className="p-3.5 bg-gray-50 border-b border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Grain Switcher */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-[10px] font-bold text-gray-400 uppercase px-2">Grain:</span>
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((grain) => (
              <button
                key={grain}
                onClick={() => {
                  if (onTimeGrainChange) onTimeGrainChange(grain);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  reportData.timeGrain === grain
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {grain}
              </button>
            ))}
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('statement')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'statement'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              P&amp;L Statement
            </button>
            <button
              onClick={() => setActiveTab('visuals')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'visuals'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              Visual Trends
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'export'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              Export Options
            </button>
          </div>

          {/* Quick Print and Download buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-gray-600" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-800">
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-purple-50/50 border border-purple-100 rounded-2xl text-center shadow-2xs">
              <span className="text-[11px] font-bold text-purple-700 uppercase">Gross Revenue</span>
              <p className="text-2xl font-serif font-bold text-purple-950 mt-1">
                ₱{reportData.summary.totalGrossRevenue.toLocaleString()}
              </p>
              <span className="text-[10px] text-purple-700 font-semibold block mt-0.5">
                ₱{reportData.summary.totalServicesRevenue.toLocaleString()} svc • ₱{reportData.summary.totalRetailRevenue.toLocaleString()} retail
              </span>
            </div>

            <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-2xl text-center shadow-2xs">
              <span className="text-[11px] font-bold text-rose-700 uppercase">Operating Costs</span>
              <p className="text-2xl font-serif font-bold text-rose-950 mt-1">
                ₱{reportData.summary.totalExpenses.toLocaleString()}
              </p>
              <span className="text-[10px] text-rose-700 font-semibold block mt-0.5">
                Staff Comm. &amp; Supplies
              </span>
            </div>

            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-center shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">Net Operating Profit</span>
              <p className="text-2xl font-serif font-bold text-emerald-950 mt-1">
                ₱{reportData.summary.netProfit.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                {reportData.summary.profitMargin.toFixed(1)}% Net Margin
              </span>
            </div>

            <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl text-center shadow-2xs">
              <span className="text-[11px] font-bold text-blue-700 uppercase">Average Ticket</span>
              <p className="text-2xl font-serif font-bold text-blue-950 mt-1">
                ₱{reportData.summary.averageTicket.toLocaleString()}
              </p>
              <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">
                {reportData.summary.totalAppointments + reportData.summary.totalOrders} total transactions
              </span>
            </div>
          </div>

          {/* TAB 1: P&L STATEMENT TABLE */}
          {activeTab === 'statement' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    {reportData.timeGrain.toUpperCase()} Financial Operating Statement
                  </h4>
                  <p className="text-xs text-gray-500">
                    Itemized breakdown of services revenue, merchandise sales, estimated labor commissions, supplies, and net margin.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    Peak: {reportData.summary.peakPeriod}
                  </span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-3.5">Period</th>
                        <th className="py-3 px-2 text-center">Transactions</th>
                        <th className="py-3 px-2 text-right">Services (₱)</th>
                        <th className="py-3 px-2 text-right">Retail (₱)</th>
                        <th className="py-3 px-2 text-right text-purple-900">Gross Rev (₱)</th>
                        <th className="py-3 px-2 text-right text-rose-700">Labor Payout</th>
                        <th className="py-3 px-2 text-right text-rose-700">Supplies/Overhead</th>
                        <th className="py-3 px-2 text-right text-rose-900 font-bold">Total Costs</th>
                        <th className="py-3 px-2 text-right text-emerald-800 font-extrabold">Net Profit (₱)</th>
                        <th className="py-3 px-3 text-center">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.periods.map((p, idx) => {
                        const isHighMargin = p.profitMargin >= 30;
                        const isMidMargin = p.profitMargin >= 15;

                        return (
                          <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3 px-3.5 font-bold text-gray-900 whitespace-nowrap">
                              {p.periodLabel}
                            </td>
                            <td className="py-3 px-2 text-center text-gray-600">
                              {p.appointmentCount} appts • {p.orderCount} ord
                            </td>
                            <td className="py-3 px-2 text-right text-gray-600">
                              ₱{p.servicesRevenue.toLocaleString()}
                            </td>
                            <td className="py-3 px-2 text-right text-gray-600">
                              ₱{p.retailRevenue.toLocaleString()}
                            </td>
                            <td className="py-3 px-2 text-right font-bold text-purple-950">
                              ₱{p.totalRevenue.toLocaleString()}
                            </td>
                            <td className="py-3 px-2 text-right text-rose-600">
                              -₱{p.laborExpense.toLocaleString()}
                            </td>
                            <td className="py-3 px-2 text-right text-rose-600">
                              -₱{(p.suppliesExpense + p.overheadExpense).toLocaleString()}
                            </td>
                            <td className="py-3 px-2 text-right font-bold text-rose-800">
                              -₱{p.totalExpenses.toLocaleString()}
                            </td>
                            <td className="py-3 px-2 text-right font-extrabold text-emerald-800">
                              ₱{p.netProfit.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  isHighMargin
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isMidMargin
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {p.profitMargin.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-100/80 font-bold border-t-2 border-gray-300">
                      <tr>
                        <td className="py-3 px-3.5 text-gray-900 font-extrabold">TOTALS</td>
                        <td className="py-3 px-2 text-center text-gray-700">
                          {reportData.summary.totalAppointments} appts • {reportData.summary.totalOrders} ord
                        </td>
                        <td className="py-3 px-2 text-right text-gray-700">
                          ₱{reportData.summary.totalServicesRevenue.toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-right text-gray-700">
                          ₱{reportData.summary.totalRetailRevenue.toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-right font-black text-purple-950">
                          ₱{reportData.summary.totalGrossRevenue.toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-right text-rose-700 font-bold">
                          -₱{reportData.summary.totalLaborExpenses.toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-right text-rose-700 font-bold">
                          -₱{(reportData.summary.totalSuppliesExpenses + reportData.summary.totalOverheadExpenses).toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-right font-black text-rose-900">
                          -₱{reportData.summary.totalExpenses.toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-right font-black text-emerald-800 text-sm">
                          ₱{reportData.summary.netProfit.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-[11px] font-black bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full">
                            {reportData.summary.profitMargin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VISUAL TRENDS & COMPARISONS */}
          {activeTab === 'visuals' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl border border-gray-200 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    Gross Revenue vs Net Operating Profit ({reportData.timeGrain.toUpperCase()})
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] font-bold">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-purple-700 rounded-xs" />
                      <span className="text-gray-600">Gross Revenue</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-emerald-600 rounded-xs" />
                      <span className="text-gray-600">Net Profit</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-end justify-between gap-3 h-48 border-b border-gray-100 pb-3 overflow-x-auto">
                  {reportData.periods.map((p, i) => {
                    const revHeight = Math.max(12, Math.round((p.totalRevenue / maxRevenue) * 100));
                    const profitHeight = Math.max(6, Math.round((Math.max(0, p.netProfit) / maxRevenue) * 100));

                    return (
                      <div key={i} className="flex flex-col items-center gap-1.5 flex-1 min-w-[50px] h-full justify-end group">
                        <span className="text-[9px] font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          ₱{p.netProfit.toLocaleString()}
                        </span>
                        <div className="flex items-end gap-1.5 h-full justify-center w-full">
                          {/* Revenue Bar */}
                          <div
                            className="w-3.5 rounded-t-md bg-purple-700/90 hover:bg-purple-800 transition-all cursor-pointer"
                            style={{ height: `${revHeight}%` }}
                            title={`Revenue: ₱${p.totalRevenue.toLocaleString()}`}
                          />
                          {/* Profit Bar */}
                          <div
                            className="w-3.5 rounded-t-md bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer shadow-xs"
                            style={{ height: `${profitHeight}%` }}
                            title={`Net Profit: ₱${p.netProfit.toLocaleString()} (${p.profitMargin.toFixed(1)}%)`}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 font-semibold truncate w-full text-center">
                          {p.shortLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                  <span>Hover over any bar to view exact revenue vs retained profit</span>
                  <span className="font-bold text-emerald-800">
                    Highest Profit Period: {reportData.summary.peakPeriod} (₱{reportData.summary.peakProfit.toLocaleString()})
                  </span>
                </div>
              </div>

              {/* Cost Allocation Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">Staff Labor Commission</span>
                    <span className="font-bold text-rose-700">~40%</span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Estimated ₱{reportData.summary.totalLaborExpenses.toLocaleString()} paid directly to technicians across completed appointments.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">Consumables &amp; Supplies</span>
                    <span className="font-bold text-amber-700">~15%</span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Estimated ₱{reportData.summary.totalSuppliesExpenses.toLocaleString()} for professional gels, tips, sanitize solutions, and wholesale retail merchandise.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">Retained Net Margin</span>
                    <span className="font-bold text-emerald-700">{reportData.summary.profitMargin.toFixed(1)}%</span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    ₱{reportData.summary.netProfit.toLocaleString()} net profit retained for salon reserves, equipment upgrade, and owner dividends.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXPORT OPTIONS */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="text-xs text-gray-500">
                Generate and export this official {reportData.timeGrain} Profit &amp; Revenue report for bookkeepers, accountants, tax filing, or business partnership reviews.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Visual HTML / PDF Document */}
                <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
                      <Printer className="w-5 h-5" />
                    </div>
                    <h5 className="text-sm font-bold text-emerald-950">Visual HTML / PDF Statement</h5>
                    <p className="text-xs text-gray-600">
                      Standalone executive document with comparative bar charts, P&amp;L scorecards, and margin directives.
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handlePrint}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print to PDF</span>
                    </button>
                    <button
                      onClick={handleDownloadHtml}
                      className="w-full py-2 px-3 rounded-xl bg-white hover:bg-gray-50 border border-emerald-200 text-emerald-900 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download HTML</span>
                    </button>
                  </div>
                </div>

                {/* Accountant Excel / CSV Spreadsheet */}
                <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/50 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h5 className="text-sm font-bold text-blue-950">Accountant Excel / CSV</h5>
                    <p className="text-xs text-gray-600">
                      Structured financial dataset formatted for Microsoft Excel, Google Sheets, or tax filing.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadCsv}
                    className="w-full py-2 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV Ledger</span>
                  </button>
                </div>

                {/* Quick Executive Clipboard Brief */}
                <div className="p-5 rounded-2xl border border-purple-200 bg-purple-50/50 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <h5 className="text-sm font-bold text-purple-950">Quick Financial Brief</h5>
                    <p className="text-xs text-gray-600">
                      Copy essential P&amp;L numbers directly to your clipboard for WhatsApp, SMS, or executive emails.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const brief = `Financial Performance Statement - ${reportData.salonName}\nScope: ${reportData.timeGrain.toUpperCase()} (${reportData.timeRange})\n• Gross Revenue: ₱${reportData.summary.totalGrossRevenue.toLocaleString()}\n• Services Revenue: ₱${reportData.summary.totalServicesRevenue.toLocaleString()}\n• Retail Sales: ₱${reportData.summary.totalRetailRevenue.toLocaleString()}\n• Operating Costs: ₱${reportData.summary.totalExpenses.toLocaleString()}\n• Net Profit: ₱${reportData.summary.netProfit.toLocaleString()} (${reportData.summary.profitMargin.toFixed(1)}% margin)\n• Peak Period: ${reportData.summary.peakPeriod}`;
                      navigator.clipboard.writeText(brief);
                      showToast('Executive financial brief copied to clipboard');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copy P&amp;L Summary</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-500">
            Nail Glam Hub Salon Financial Intelligence • Daily, Weekly, Monthly &amp; Yearly Reports
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
