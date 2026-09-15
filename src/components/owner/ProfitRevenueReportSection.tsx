import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Download,
  Printer,
  FileSpreadsheet,
  Sliders,
  Calendar,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  ArrowUpRight,
  BarChart3,
  Percent,
} from 'lucide-react';
import { Salon, Appointment, Service, ProductOrder } from '../../types';
import {
  ProfitRevenueReportData,
  FinancialPeriodItem,
  generateProfitRevenueVisualHtmlReport,
  generateProfitRevenueCsv,
  downloadFile,
  openPrintableReport,
} from '../../utils/reportGenerators';
import { ProfitRevenueModal } from './ProfitRevenueModal';

interface ProfitRevenueReportSectionProps {
  salon: Salon;
  appointments: Appointment[];
  services: Service[];
  productOrders?: ProductOrder[];
  showToast: (msg: string) => void;
}

export const ProfitRevenueReportSection: React.FC<ProfitRevenueReportSectionProps> = ({
  salon,
  appointments,
  services,
  productOrders = [],
  showToast,
}) => {
  // Time grain selection
  const [timeGrain, setTimeGrain] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Daily sub-range filter
  const [dailyDaysCount, setDailyDaysCount] = useState<7 | 14 | 30>(7);

  // Cost model assumptions (percentage sliders/toggles)
  const [showCostSettings, setShowCostSettings] = useState(false);
  const [laborCommissionPercent, setLaborCommissionPercent] = useState(40); // 40% to nail techs
  const [suppliesCostPercent, setSuppliesCostPercent] = useState(15); // 15% salon supplies/gels
  const [overheadPercent, setOverheadPercent] = useState(8); // 8% rent/electricity/software

  // Modal preview state
  const [showReportModal, setShowReportModal] = useState(false);

  // Helper to extract revenue for an appointment
  const getApptIncome = (a: Appointment): number => {
    if (a.status === 'cancelled') return 0;
    const priceFromService = services.find((s) => s.id === a.service_id)?.price;
    const directPrice = a.paid_amount || a.service_price || a.total_price;
    return Number(directPrice || priceFromService || 0);
  };

  // Compute Granular Financial Period Items based on Time Grain
  const { periods, summary } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const periodList: FinancialPeriodItem[] = [];

    // Filter valid appointments & orders (excluding cancelled)
    const validAppts = appointments.filter((a) => a.status !== 'cancelled');
    const validOrders = productOrders.filter((o) => o.status !== 'cancelled');

    // 1. DAILY GRAIN
    if (timeGrain === 'daily') {
      for (let i = dailyDaysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const isToday = i === 0;

        const dayAppts = validAppts.filter((a) => a.appointment_date === dateStr);
        const dayOrders = validOrders.filter((o) => {
          const orderDate = o.pickup_date || o.created_at?.split('T')[0];
          return orderDate === dateStr;
        });

        const servicesRevenue = dayAppts.reduce((sum, a) => sum + getApptIncome(a), 0);
        const retailRevenue = dayOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        const totalRevenue = servicesRevenue + retailRevenue;

        const laborExpense = Math.round(servicesRevenue * (laborCommissionPercent / 100));
        const suppliesExpense = Math.round(
          servicesRevenue * (suppliesCostPercent / 100) + retailRevenue * 0.45
        );
        const overheadExpense = Math.round(totalRevenue * (overheadPercent / 100));
        const totalExpenses = laborExpense + suppliesExpense + overheadExpense;
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const totalTx = dayAppts.length + dayOrders.length;
        const averageTicket = totalTx > 0 ? Math.round(totalRevenue / totalTx) : 0;

        periodList.push({
          periodLabel: `${dayName}, ${monthDay}${isToday ? ' (Today)' : ''}`,
          shortLabel: isToday ? 'Today' : `${dayName} ${d.getDate()}`,
          dateKey: dateStr,
          servicesRevenue,
          retailRevenue,
          totalRevenue,
          laborExpense,
          suppliesExpense,
          overheadExpense,
          totalExpenses,
          netProfit,
          profitMargin,
          appointmentCount: dayAppts.length,
          orderCount: dayOrders.length,
          averageTicket,
        });
      }
    }

    // 2. WEEKLY GRAIN
    else if (timeGrain === 'weekly') {
      const numWeeks = 6;
      for (let w = numWeeks - 1; w >= 0; w--) {
        const endDay = new Date();
        endDay.setDate(endDay.getDate() - w * 7);
        const startDay = new Date(endDay);
        startDay.setDate(startDay.getDate() - 6);

        const startStr = startDay.toISOString().split('T')[0];
        const endStr = endDay.toISOString().split('T')[0];
        const isCurrent = w === 0;

        const weekAppts = validAppts.filter((a) => {
          return a.appointment_date >= startStr && a.appointment_date <= endStr;
        });
        const weekOrders = validOrders.filter((o) => {
          const orderDate = o.pickup_date || o.created_at?.split('T')[0] || '';
          return orderDate >= startStr && orderDate <= endStr;
        });

        const servicesRevenue = weekAppts.reduce((sum, a) => sum + getApptIncome(a), 0);
        const retailRevenue = weekOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        const totalRevenue = servicesRevenue + retailRevenue;

        const laborExpense = Math.round(servicesRevenue * (laborCommissionPercent / 100));
        const suppliesExpense = Math.round(
          servicesRevenue * (suppliesCostPercent / 100) + retailRevenue * 0.45
        );
        const overheadExpense = Math.round(totalRevenue * (overheadPercent / 100));
        const totalExpenses = laborExpense + suppliesExpense + overheadExpense;
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const totalTx = weekAppts.length + weekOrders.length;
        const averageTicket = totalTx > 0 ? Math.round(totalRevenue / totalTx) : 0;

        const startLabel = startDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endLabel = endDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        periodList.push({
          periodLabel: `Week ${numWeeks - w}: ${startLabel} - ${endLabel}${isCurrent ? ' (Current)' : ''}`,
          shortLabel: isCurrent ? 'This Wk' : `Wk ${numWeeks - w}`,
          servicesRevenue,
          retailRevenue,
          totalRevenue,
          laborExpense,
          suppliesExpense,
          overheadExpense,
          totalExpenses,
          netProfit,
          profitMargin,
          appointmentCount: weekAppts.length,
          orderCount: weekOrders.length,
          averageTicket,
        });
      }
    }

    // 3. MONTHLY GRAIN
    else if (timeGrain === 'monthly') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let m = 0; m <= currentMonth; m++) {
        const monthPrefix = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
        const isCurrent = m === currentMonth;

        const monthAppts = validAppts.filter((a) => a.appointment_date.startsWith(monthPrefix));
        const monthOrders = validOrders.filter((o) => {
          const orderDate = o.pickup_date || o.created_at?.split('T')[0] || '';
          return orderDate.startsWith(monthPrefix);
        });

        const servicesRevenue = monthAppts.reduce((sum, a) => sum + getApptIncome(a), 0);
        const retailRevenue = monthOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        const totalRevenue = servicesRevenue + retailRevenue;

        const laborExpense = Math.round(servicesRevenue * (laborCommissionPercent / 100));
        const suppliesExpense = Math.round(
          servicesRevenue * (suppliesCostPercent / 100) + retailRevenue * 0.45
        );
        const overheadExpense = Math.round(totalRevenue * (overheadPercent / 100));
        const totalExpenses = laborExpense + suppliesExpense + overheadExpense;
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const totalTx = monthAppts.length + monthOrders.length;
        const averageTicket = totalTx > 0 ? Math.round(totalRevenue / totalTx) : 0;

        periodList.push({
          periodLabel: `${monthNames[m]} ${currentYear}${isCurrent ? ' (Current Month)' : ''}`,
          shortLabel: monthNames[m],
          servicesRevenue,
          retailRevenue,
          totalRevenue,
          laborExpense,
          suppliesExpense,
          overheadExpense,
          totalExpenses,
          netProfit,
          profitMargin,
          appointmentCount: monthAppts.length,
          orderCount: monthOrders.length,
          averageTicket,
        });
      }
    }

    // 4. YEARLY GRAIN
    else if (timeGrain === 'yearly') {
      const numYears = 4;
      for (let y = numYears - 1; y >= 0; y--) {
        const targetYear = currentYear - y;
        const yearPrefix = `${targetYear}-`;
        const isCurrent = y === 0;

        const yearAppts = validAppts.filter((a) => a.appointment_date.startsWith(yearPrefix));
        const yearOrders = validOrders.filter((o) => {
          const orderDate = o.pickup_date || o.created_at?.split('T')[0] || '';
          return orderDate.startsWith(yearPrefix);
        });

        const servicesRevenue = yearAppts.reduce((sum, a) => sum + getApptIncome(a), 0);
        const retailRevenue = yearOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        const totalRevenue = servicesRevenue + retailRevenue;

        const laborExpense = Math.round(servicesRevenue * (laborCommissionPercent / 100));
        const suppliesExpense = Math.round(
          servicesRevenue * (suppliesCostPercent / 100) + retailRevenue * 0.45
        );
        const overheadExpense = Math.round(totalRevenue * (overheadPercent / 100));
        const totalExpenses = laborExpense + suppliesExpense + overheadExpense;
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const totalTx = yearAppts.length + yearOrders.length;
        const averageTicket = totalTx > 0 ? Math.round(totalRevenue / totalTx) : 0;

        periodList.push({
          periodLabel: `${targetYear} Fiscal Year${isCurrent ? ' (Year to Date)' : ''}`,
          shortLabel: `${targetYear}`,
          servicesRevenue,
          retailRevenue,
          totalRevenue,
          laborExpense,
          suppliesExpense,
          overheadExpense,
          totalExpenses,
          netProfit,
          profitMargin,
          appointmentCount: yearAppts.length,
          orderCount: yearOrders.length,
          averageTicket,
        });
      }
    }

    // Aggregate summary metrics across all periods
    const totalServicesRevenue = periodList.reduce((sum, p) => sum + p.servicesRevenue, 0);
    const totalRetailRevenue = periodList.reduce((sum, p) => sum + p.retailRevenue, 0);
    const totalGrossRevenue = periodList.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalLaborExpenses = periodList.reduce((sum, p) => sum + p.laborExpense, 0);
    const totalSuppliesExpenses = periodList.reduce((sum, p) => sum + p.suppliesExpense, 0);
    const totalOverheadExpenses = periodList.reduce((sum, p) => sum + p.overheadExpense, 0);
    const totalExpenses = totalLaborExpenses + totalSuppliesExpenses + totalOverheadExpenses;
    const netProfit = totalGrossRevenue - totalExpenses;
    const profitMargin = totalGrossRevenue > 0 ? (netProfit / totalGrossRevenue) * 100 : 0;
    const totalAppointments = periodList.reduce((sum, p) => sum + p.appointmentCount, 0);
    const totalOrders = periodList.reduce((sum, p) => sum + p.orderCount, 0);
    const totalTransactions = totalAppointments + totalOrders;
    const averageTicket = totalTransactions > 0 ? Math.round(totalGrossRevenue / totalTransactions) : 0;

    const sortedByProfit = [...periodList].sort((a, b) => b.netProfit - a.netProfit);
    const peakPeriod = sortedByProfit[0]?.periodLabel || 'N/A';
    const peakProfit = sortedByProfit[0]?.netProfit || 0;
    const peakRevenue = sortedByProfit[0]?.totalRevenue || 0;

    return {
      periods: periodList,
      summary: {
        totalGrossRevenue,
        totalServicesRevenue,
        totalRetailRevenue,
        totalLaborExpenses,
        totalSuppliesExpenses,
        totalOverheadExpenses,
        totalExpenses,
        netProfit,
        profitMargin,
        totalAppointments,
        totalOrders,
        averageTicket,
        peakPeriod,
        peakProfit,
        peakRevenue,
      },
    };
  }, [
    appointments,
    services,
    productOrders,
    timeGrain,
    dailyDaysCount,
    laborCommissionPercent,
    suppliesCostPercent,
    overheadPercent,
  ]);

  // Construct official report data bundle
  const fullReportData: ProfitRevenueReportData = useMemo(() => {
    return {
      salonName: salon.salon_name,
      salonAddress: salon.address || `${salon.city}, Philippines`,
      contactNumber: salon.phone || '0917-888-GLAM',
      generatedDate: new Date().toLocaleDateString('en-US', { dateStyle: 'long' }),
      timeGrain,
      timeRange:
        timeGrain === 'daily'
          ? `Past ${dailyDaysCount} Days`
          : timeGrain === 'weekly'
          ? 'Past 6 Weeks'
          : timeGrain === 'monthly'
          ? 'Fiscal Year to Date (Monthly)'
          : 'Multi-Year Historical Trend',
      costAssumptions: {
        laborCommissionPercent,
        suppliesCostPercent,
        overheadPercent,
      },
      summary,
      periods,
    };
  }, [
    salon,
    timeGrain,
    dailyDaysCount,
    laborCommissionPercent,
    suppliesCostPercent,
    overheadPercent,
    summary,
    periods,
  ]);

  const handlePrint = () => {
    const html = generateProfitRevenueVisualHtmlReport(fullReportData);
    openPrintableReport(html);
    showToast(`Opening ${timeGrain} financial statement print preview`);
  };

  const handleExportCsv = () => {
    const csv = generateProfitRevenueCsv(fullReportData);
    const filename = `${salon.salon_name.replace(/\s+/g, '_')}_${timeGrain.toUpperCase()}_Profit_Revenue_${new Date().toISOString().split('T')[0]}.csv`;
    downloadFile(csv, filename, 'text/csv');
    showToast(`${timeGrain.toUpperCase()} Profit & Revenue CSV exported`);
  };

  const maxPeriodRevenue = Math.max(...periods.map((p) => p.totalRevenue), 1);

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
      {/* Section Header & Control Toolbar */}
      <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50/40 via-teal-50/20 to-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                Profit &amp; Revenue Financial Intelligence
              </h3>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Financial P&amp;L
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Generate audited financial reports for daily, weekly, monthly, and yearly operating profit, retail sales, and staff commissions.
            </p>
          </div>

          {/* Action Buttons: Generate Report, Export CSV, Print */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowCostSettings(!showCostSettings)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Cost Assumptions</span>
              {showCostSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>Generate P&amp;L Report</span>
            </button>
          </div>
        </div>

        {/* Granularity & Sub-Grain Bar */}
        <div className="mt-4 pt-3 border-t border-emerald-100/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Reporting Frequency:
            </span>
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((grain) => (
                <button
                  key={grain}
                  onClick={() => setTimeGrain(grain)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    timeGrain === grain
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {grain}
                </button>
              ))}
            </div>
          </div>

          {/* If daily, allow switching between 7, 14, and 30 days */}
          {timeGrain === 'daily' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-500 font-medium">Window:</span>
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setDailyDaysCount(days as 7 | 14 | 30)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    dailyDaysCount === days
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          )}

          {timeGrain === 'monthly' && (
            <div className="text-[11px] text-gray-500 font-medium">
              Showing all months for {new Date().getFullYear()} Fiscal Year
            </div>
          )}

          {timeGrain === 'yearly' && (
            <div className="text-[11px] text-gray-500 font-medium">
              4-Year Multi-Annual Fiscal Performance
            </div>
          )}
        </div>

        {/* Expandable Cost Assumptions Box */}
        {showCostSettings && (
          <div className="mt-4 p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                Salon Economic Cost Assumptions
              </span>
              <span className="text-[11px] text-gray-500">
                Adjust sliders to model realistic nail studio margins
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-gray-700">Technician Commission:</span>
                  <span className="font-bold text-rose-700">{laborCommissionPercent}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="60"
                  step="5"
                  value={laborCommissionPercent}
                  onChange={(e) => setLaborCommissionPercent(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-[10px] text-gray-400">Share paid to nail artists</span>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-gray-700">Supplies &amp; Consumables:</span>
                  <span className="font-bold text-amber-700">{suppliesCostPercent}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={suppliesCostPercent}
                  onChange={(e) => setSuppliesCostPercent(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-[10px] text-gray-400">Gels, tips, sanitizers, files</span>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-gray-700">Facility &amp; Overhead:</span>
                  <span className="font-bold text-purple-700">{overheadPercent}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={overheadPercent}
                  onChange={(e) => setOverheadPercent(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-[10px] text-gray-400">Utilities, rent allocation, POS</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4 Core Financial KPI Cards */}
      <div className="p-5 sm:p-6 border-b border-gray-100 bg-gray-50/50">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Gross Revenue */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-purple-700 uppercase block tracking-wider">
              Total Gross Revenue
            </span>
            <p className="text-2xl font-serif font-black text-purple-950 mt-1">
              ₱{summary.totalGrossRevenue.toLocaleString()}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-purple-700 font-semibold">
              <span>₱{summary.totalServicesRevenue.toLocaleString()} svc</span>
              <span>•</span>
              <span>₱{summary.totalRetailRevenue.toLocaleString()} retail</span>
            </div>
          </div>

          {/* Operating Costs */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-rose-700 uppercase block tracking-wider">
              Total Operating Costs
            </span>
            <p className="text-2xl font-serif font-black text-rose-950 mt-1">
              ₱{summary.totalExpenses.toLocaleString()}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-rose-700 font-semibold">
              <span>₱{summary.totalLaborExpenses.toLocaleString()} labor</span>
              <span>•</span>
              <span>₱{summary.totalSuppliesExpenses.toLocaleString()} supplies</span>
            </div>
          </div>

          {/* Net Profit */}
          <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Net Operating Profit
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  summary.profitMargin >= 30
                    ? 'bg-emerald-100 text-emerald-800'
                    : summary.profitMargin >= 15
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {summary.profitMargin.toFixed(1)}% Margin
              </span>
            </div>
            <p className="text-2xl font-serif font-black text-emerald-950 mt-1">
              ₱{summary.netProfit.toLocaleString()}
            </p>
            <div className="mt-1 text-[11px] text-emerald-700 font-semibold">
              Retained salon net earnings
            </div>
          </div>

          {/* Average Ticket Size */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-blue-700 uppercase block tracking-wider">
              Average Ticket Value
            </span>
            <p className="text-2xl font-serif font-black text-blue-950 mt-1">
              ₱{summary.averageTicket.toLocaleString()}
            </p>
            <div className="mt-1 text-[11px] text-blue-700 font-semibold">
              Across {summary.totalAppointments + summary.totalOrders} total transactions
            </div>
          </div>
        </div>
      </div>

      {/* Visual Chart: Revenue vs Net Profit Bars */}
      <div className="p-5 sm:p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-700" />
              <span>{timeGrain.toUpperCase()} Comparative Revenue &amp; Profit Trend</span>
            </h4>
            <p className="text-xs text-gray-500">
              Side-by-side comparison of total gross revenue intake vs. retained net profit.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-purple-700 rounded-xs" />
              <span className="text-gray-700">Gross Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-emerald-600 rounded-xs" />
              <span className="text-gray-700">Net Profit</span>
            </div>
          </div>
        </div>

        {/* Dual Bar Chart Columns */}
        <div className="pt-4 flex items-end justify-between gap-3 h-48 border-b border-gray-100 pb-3 overflow-x-auto">
          {periods.map((p, i) => {
            const revHeight = Math.max(12, Math.round((p.totalRevenue / maxPeriodRevenue) * 100));
            const profitHeight = Math.max(6, Math.round((Math.max(0, p.netProfit) / maxPeriodRevenue) * 100));

            return (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-1 min-w-[55px] h-full justify-end group">
                <span className="text-[10px] font-bold text-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  ₱{p.netProfit.toLocaleString()}
                </span>
                <div className="flex items-end gap-1.5 h-full justify-center w-full">
                  {/* Revenue Bar */}
                  <div
                    className="w-3.5 rounded-t-md bg-purple-700 hover:bg-purple-800 transition-all cursor-pointer"
                    style={{ height: `${revHeight}%` }}
                    title={`Revenue: ₱${p.totalRevenue.toLocaleString()}`}
                  />
                  {/* Profit Bar */}
                  <div
                    className="w-3.5 rounded-t-md bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer shadow-2xs"
                    style={{ height: `${profitHeight}%` }}
                    title={`Profit: ₱${p.netProfit.toLocaleString()} (${p.profitMargin.toFixed(1)}% margin)`}
                  />
                </div>
                <span className="text-[10px] text-gray-600 font-semibold truncate w-full text-center">
                  {p.shortLabel}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 pt-3 gap-2">
          <span>Peak Profit Period: <strong className="text-emerald-800 font-bold">{summary.peakPeriod} (₱{summary.peakProfit.toLocaleString()})</strong></span>
          <span className="text-[11px] text-gray-400">Click &quot;Generate P&amp;L Report&quot; for complete multi-page audit</span>
        </div>
      </div>

      {/* Itemized P&L Ledger Table */}
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-gray-900">
            {timeGrain.toUpperCase()} Financial Operating Statement
          </h4>
          <span className="text-xs font-semibold text-gray-500">
            {periods.length} {timeGrain} records
          </span>
        </div>

        <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-3.5">Period</th>
                  <th className="py-3 px-2 text-center">Transactions</th>
                  <th className="py-3 px-2 text-right">Services (₱)</th>
                  <th className="py-3 px-2 text-right">Retail (₱)</th>
                  <th className="py-3 px-2 text-right text-purple-900 font-extrabold">Gross Rev (₱)</th>
                  <th className="py-3 px-2 text-right text-rose-700">Staff Comm.</th>
                  <th className="py-3 px-2 text-right text-rose-700">Supplies/Overhead</th>
                  <th className="py-3 px-2 text-right text-rose-900 font-bold">Total Costs</th>
                  <th className="py-3 px-2 text-right text-emerald-800 font-black">Net Profit (₱)</th>
                  <th className="py-3 px-3 text-center">Net Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {periods.map((p, idx) => {
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
                      <td className="py-3 px-2 text-right font-black text-emerald-800">
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
              <tfoot className="bg-gray-100/90 font-bold border-t-2 border-gray-300">
                <tr>
                  <td className="py-3 px-3.5 text-gray-900 font-extrabold">TOTALS</td>
                  <td className="py-3 px-2 text-center text-gray-700">
                    {summary.totalAppointments} appts • {summary.totalOrders} ord
                  </td>
                  <td className="py-3 px-2 text-right text-gray-700">
                    ₱{summary.totalServicesRevenue.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-700">
                    ₱{summary.totalRetailRevenue.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right font-black text-purple-950 text-sm">
                    ₱{summary.totalGrossRevenue.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right text-rose-700 font-bold">
                    -₱{summary.totalLaborExpenses.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right text-rose-700 font-bold">
                    -₱{(summary.totalSuppliesExpenses + summary.totalOverheadExpenses).toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right font-black text-rose-900 text-sm">
                    -₱{summary.totalExpenses.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right font-black text-emerald-800 text-sm">
                    ₱{summary.netProfit.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-[11px] font-black bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full">
                      {summary.profitMargin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Full Screen / Preview Modal */}
      {showReportModal && (
        <ProfitRevenueModal
          reportData={fullReportData}
          onClose={() => setShowReportModal(false)}
          showToast={showToast}
          onTimeGrainChange={(grain) => setTimeGrain(grain)}
        />
      )}
    </div>
  );
};
