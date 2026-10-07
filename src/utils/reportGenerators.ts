// Report Generators for Data Visualization & Strategic Decision-Making

export interface FinancialPeriodItem {
  periodLabel: string;
  shortLabel: string;
  dateKey?: string;
  servicesRevenue: number;
  retailRevenue: number;
  totalRevenue: number;
  laborExpense: number;
  suppliesExpense: number;
  overheadExpense: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  appointmentCount: number;
  orderCount: number;
  averageTicket: number;
}

export interface ProfitRevenueReportData {
  salonName: string;
  salonAddress: string;
  contactNumber: string;
  generatedDate: string;
  timeGrain: 'daily' | 'weekly' | 'monthly' | 'yearly';
  timeRange: string;
  costAssumptions?: {
    laborCommissionPercent: number;
    suppliesCostPercent: number;
    overheadPercent: number;
  };
  summary: {
    totalGrossRevenue: number;
    totalServicesRevenue: number;
    totalRetailRevenue: number;
    totalLaborExpenses: number;
    totalSuppliesExpenses: number;
    totalOverheadExpenses: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    totalAppointments: number;
    totalOrders: number;
    averageTicket: number;
    peakPeriod: string;
    peakProfit: number;
    peakRevenue: number;
  };
  periods: FinancialPeriodItem[];
}

export interface StoreReportData {
  salonName: string;
  salonAddress: string;
  contactNumber: string;
  generatedDate: string;
  timeRange: string;
  stats: {
    totalAppointments: number;
    completedCount: number;
    confirmedCount: number;
    pendingCount: number;
    cancelledCount: number;
    avgDuration: number;
    completionRate: number;
    monthlyTarget: number;
    targetProgress: number;
    totalRevenue?: number;
  };
  // Trend volume supporting multiple timeframes (Daily, Weekly, Monthly, Yearly) and metrics (Bookings, Income)
  volumeSummary?: {
    grain: 'daily' | 'weekly' | 'monthly' | 'yearly';
    metric: 'bookings' | 'income';
    totalVolume: number;
    totalIncome: number;
    peakPeriod: string;
    trend: Array<{
      label: string;
      shortLabel: string;
      count: number;
      income: number;
      value: number;
      formattedValue: string;
    }>;
  };
  categoryBreakdown: Array<{
    name: string;
    count: number;
    percentage: number;
    income?: number;
  }>;
  treatmentMix?: {
    timeGrain: string;
    metric: string;
    categories: Array<{
      name: string;
      count: number;
      percentage: number;
      income: number;
    }>;
    topServices?: Array<{
      name: string;
      category: string;
      bookings: number;
      income: number;
    }>;
  };
  monthlyTrend: Array<{
    month: string;
    count: number;
    income?: number;
  }>;
  staffScorecard: Array<{
    name: string;
    experience_years: number;
    specialties: string;
    totalBookings: number;
    completedCount: number;
    hoursServiced: number;
    rating: number;
  }>;
  crmSummary: {
    totalClients: number;
    vipCount: number;
    regularCount: number;
    newCount: number;
    atRiskCount: number;
    retentionRate: number;
  };
  clientList: Array<{
    name: string;
    phone: string;
    email: string;
    completedVisits: number;
    lastVisitDate: string;
    tier: string;
    favoriteService: string;
    note?: string;
  }>;
  // Product Inventory & In-Store Pickup Intelligence
  inventorySummary?: {
    totalProducts: number;
    totalUnitsInStock: number;
    totalInventoryValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    pendingPickupOrdersCount: number;
    completedPickupOrdersCount: number;
    pickupRevenue: number;
  };
  inventoryItems?: Array<{
    name: string;
    sku: string;
    category: string;
    price: number;
    stock_quantity: number;
    low_stock_threshold: number;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    inventoryValue: number;
  }>;
  pickupOrders?: Array<{
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    itemsSummary: string;
    totalAmount: number;
    pickupDate: string;
    status: string;
  }>;
  profitRevenueSummary?: ProfitRevenueReportData;
}

export interface AdminReportData {
  generatedDate: string;
  totalSalons: number;
  verifiedSalons: number;
  pendingSalons: number;
  totalUsers: number;
  totalAppointments: number;
  fulfillmentRate: number;
  totalReviews: number;
  avgRating: number;
  salonsList: Array<{
    name: string;
    city: string;
    status: string;
    servicesCount: number;
    staffCount: number;
  }>;
}

/**
 * Generates an executive-grade standalone HTML document with embedded SVG visualizations,
 * styled for instant viewing, printing to PDF, or downloading.
 */
export function generateStoreVisualHtmlReport(data: StoreReportData): string {
  const primaryColor = '#831843'; // pink-900 / wine
  const accentColor = '#6b21a8'; // purple-800

  // Category & Treatment Breakdown HTML
  const categoriesToRender = data.treatmentMix?.categories || data.categoryBreakdown.map(c => ({
    name: c.name,
    count: c.count,
    percentage: c.percentage,
    income: c.income || 0,
  }));

  const isTreatmentIncome = data.treatmentMix?.metric === 'income';
  const categoryBarsHtml = categoriesToRender
    .map(
      (cat) => `
    <div style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #1f2937;">
        <span>${cat.name}</span>
        <span style="color: ${primaryColor}; font-weight: 700;">
          ${cat.count} bookings (${cat.percentage}%)
          ${cat.income ? `• ₱${cat.income.toLocaleString()}` : ''}
        </span>
      </div>
      <div style="background-color: #f3f4f6; height: 10px; border-radius: 9999px; overflow: hidden;">
        <div style="background: linear-gradient(90deg, #ec4899, #8b5cf6); width: ${Math.max(5, cat.percentage)}%; height: 100%; border-radius: 9999px;"></div>
      </div>
    </div>
  `
    )
    .join('');

  // Multi-grain Trend Chart Columns (Daily, Weekly, Monthly, Yearly)
  const isIncomeMetric = data.volumeSummary?.metric === 'income';
  const trendItems = data.volumeSummary?.trend || data.monthlyTrend.map(m => ({
    label: m.month,
    shortLabel: m.month.split(' ')[0],
    count: m.count,
    income: m.income || 0,
    value: isIncomeMetric ? (m.income || 0) : m.count,
    formattedValue: isIncomeMetric ? `₱${(m.income || 0).toLocaleString()}` : `${m.count} bookings`,
  }));

  const maxTrend = Math.max(...trendItems.map((m) => m.value), 1);
  const trendColumnsHtml = trendItems
    .map((m) => {
      const heightPercent = Math.round((m.value / maxTrend) * 100);
      return `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 160px; flex: 1;">
        <span style="font-size: 10px; font-weight: 700; color: #374151; margin-bottom: 6px; white-space: nowrap;">${m.formattedValue}</span>
        <div style="width: 70%; max-width: 44px; height: ${Math.max(12, heightPercent)}%; background: linear-gradient(180deg, #db2777, #6b21a8); border-radius: 6px 6px 0 0;"></div>
        <span style="font-size: 11px; font-weight: 600; color: #6b7280; margin-top: 8px; white-space: nowrap;">${m.shortLabel}</span>
      </div>
    `;
    })
    .join('');

  // Staff Scorecard Rows
  const staffRowsHtml = data.staffScorecard
    .map(
      (staff) => `
    <tr style="border-bottom: 1px solid #f3f4f6;">
      <td style="padding: 10px 8px; font-weight: 600; color: #111827;">${staff.name}</td>
      <td style="padding: 10px 8px; color: #4b5563; font-size: 12px;">${staff.specialties}</td>
      <td style="padding: 10px 8px; text-align: center; font-weight: 700; color: #111827;">${staff.completedCount} / ${staff.totalBookings}</td>
      <td style="padding: 10px 8px; text-align: center; font-weight: 700; color: #6b21a8;">${staff.hoursServiced} hrs</td>
      <td style="padding: 10px 8px; text-align: center; color: #d97706; font-weight: 700;">★ ${staff.rating}</td>
    </tr>
  `
    )
    .join('');

  // Financial Profit & Loss (P&L) Section HTML (All-in-One Master Report)
  let profitSectionHtml = '';
  if (data.profitRevenueSummary) {
    const pData = data.profitRevenueSummary;
    const maxPeriodRev = Math.max(...pData.periods.map((p) => p.totalRevenue), 1);
    const pChartHtml = pData.periods
      .map((p) => {
        const revHeight = Math.max(10, Math.round((p.totalRevenue / maxPeriodRev) * 100));
        const profitHeight = Math.max(6, Math.round((Math.max(0, p.netProfit) / maxPeriodRev) * 100));
        return `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 160px; flex: 1; min-width: 45px;">
          <div style="font-size: 9px; font-weight: 700; color: #1e1b4b; margin-bottom: 4px; white-space: nowrap;">
            ₱${p.totalRevenue.toLocaleString()}
          </div>
          <div style="display: flex; align-items: flex-end; gap: 4px; height: 100%; width: 100%; justify-content: center;">
            <div style="width: 14px; height: ${revHeight}%; background: linear-gradient(180deg, #7e22ce, #4338ca); border-radius: 4px 4px 0 0;" title="Revenue: ₱${p.totalRevenue.toLocaleString()}"></div>
            <div style="width: 14px; height: ${profitHeight}%; background: linear-gradient(180deg, #10b981, #059669); border-radius: 4px 4px 0 0;" title="Profit: ₱${p.netProfit.toLocaleString()}"></div>
          </div>
          <span style="font-size: 10px; font-weight: 600; color: #64748b; margin-top: 6px; white-space: nowrap;">${p.shortLabel}</span>
        </div>
      `;
      })
      .join('');

    const pLedgerRowsHtml = pData.periods
      .map((p) => {
        const rowMarginColor = p.profitMargin >= 30 ? '#059669' : p.profitMargin >= 15 ? '#d97706' : '#dc2626';
        const rowMarginBg = p.profitMargin >= 30 ? '#ecfdf5' : p.profitMargin >= 15 ? '#fffbeb' : '#fef2f2';
        return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 8px; font-weight: 700; color: #1e293b;">${p.periodLabel}</td>
          <td style="padding: 10px 8px; text-align: center; color: #475569; font-size: 11px;">${p.appointmentCount} appts • ${p.orderCount} retail</td>
          <td style="padding: 10px 8px; text-align: right; color: #475569;">₱${p.servicesRevenue.toLocaleString()}</td>
          <td style="padding: 10px 8px; text-align: right; color: #475569;">₱${p.retailRevenue.toLocaleString()}</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 800; color: #1e1b4b;">₱${p.totalRevenue.toLocaleString()}</td>
          <td style="padding: 10px 8px; text-align: right; color: #dc2626;">-₱${p.laborExpense.toLocaleString()}</td>
          <td style="padding: 10px 8px; text-align: right; color: #dc2626;">-₱${(p.suppliesExpense + p.overheadExpense).toLocaleString()}</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: #991b1b;">-₱${p.totalExpenses.toLocaleString()}</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 900; color: #065f46;">₱${p.netProfit.toLocaleString()}</td>
          <td style="padding: 10px 8px; text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; background-color: ${rowMarginBg}; color: ${rowMarginColor};">
              ${p.profitMargin.toFixed(1)}%
            </span>
          </td>
        </tr>
      `;
      })
      .join('');

    profitSectionHtml = `
      <div class="section-title">
        💰 Financial Profit &amp; Loss (P&amp;L) Operating Statement (${pData.timeGrain.toUpperCase()})
      </div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px;">
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Gross Operating Revenue</div>
          <div style="font-size: 20px; font-weight: 800; color: #1e1b4b; margin-top: 2px;">₱${pData.summary.totalGrossRevenue.toLocaleString()}</div>
          <div style="font-size: 11px; color: #059669; font-weight: 600;">Services + Retail Sales</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Operating Costs</div>
          <div style="font-size: 20px; font-weight: 800; color: #dc2626; margin-top: 2px;">-₱${pData.summary.totalExpenses.toLocaleString()}</div>
          <div style="font-size: 11px; color: #64748b;">Commissions, Supplies & Overhead</div>
        </div>
        <div style="background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 10px; padding: 12px; text-align: center;">
          <div style="font-size: 10px; font-weight: 700; color: #065f46; text-transform: uppercase;">Retained Net Profit</div>
          <div style="font-size: 20px; font-weight: 900; color: #065f46; margin-top: 2px;">₱${pData.summary.netProfit.toLocaleString()}</div>
          <div style="font-size: 11px; color: #047857; font-weight: 700;">${pData.summary.profitMargin.toFixed(1)}% Operating Margin</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Average Ticket Size</div>
          <div style="font-size: 20px; font-weight: 800; color: #7e22ce; margin-top: 2px;">₱${pData.summary.averageTicket.toLocaleString()}</div>
          <div style="font-size: 11px; color: #64748b;">Per Client Transaction</div>
        </div>
      </div>

      <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">
            📈 Period Revenue vs Retained Net Profit
          </h3>
          <div style="display: flex; align-items: center; gap: 12px; font-size: 11px; font-weight: 600;">
            <span style="display: flex; align-items: center; gap: 4px; color: #7e22ce;">
              <span style="width: 10px; height: 10px; background: #7e22ce; border-radius: 2px;"></span> Revenue
            </span>
            <span style="display: flex; align-items: center; gap: 4px; color: #059669;">
              <span style="width: 10px; height: 10px; background: #059669; border-radius: 2px;"></span> Net Profit
            </span>
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: flex-end; height: 160px; padding-top: 10px; border-bottom: 1px solid #e2e8f0; overflow-x: auto;">
          ${pChartHtml}
        </div>
      </div>

      <div class="card" style="margin-bottom: 24px;">
        <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 10px;">
          Audited Period Operating Statement (${pData.periods.length} Periods Recorded)
        </div>
        <table>
          <thead>
            <tr>
              <th>Period</th>
              <th style="text-align: center;">Activity</th>
              <th style="text-align: right;">Services</th>
              <th style="text-align: right;">Retail</th>
              <th style="text-align: right;">Gross Revenue</th>
              <th style="text-align: right;">Commissions</th>
              <th style="text-align: right;">Supplies & Overhead</th>
              <th style="text-align: right;">Total Costs</th>
              <th style="text-align: right;">Net Profit</th>
              <th style="text-align: center;">Margin</th>
            </tr>
          </thead>
          <tbody>
            ${pLedgerRowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  // Strategic Action Matrix for Decision-Making
  const strategicRecommendations = [
    {
      domain: 'Staffing & Peak Capacity',
      status: 'High Impact',
      statusBg: '#fef3c7',
      statusColor: '#92400e',
      action: data.volumeSummary?.peakPeriod
        ? `Optimize Specialist Allocation for Peak (${data.volumeSummary.peakPeriod})`
        : 'Increase Saturday Specialist Allocation',
      details: data.volumeSummary?.peakPeriod
        ? `Peak appointment volume is recorded during ${data.volumeSummary.peakPeriod}. Ensure full technician availability and schedule staggered buffers to maximize chair turnaround.`
        : `Saturday represents peak weekly bookings. Consider scheduling technicians with staggered 15-minute buffers to prevent client turnaround delays.`,
    },
    {
      domain: 'Menu & Treatment Mix',
      status: 'Growth Opportunity',
      statusBg: '#ede9fe',
      statusColor: '#5b21b6',
      action: 'Promote Signature Builder Gel & Russian Bundles',
      details: `Russian Manicure & Japanese Gel extensions exhibit high repeat client retention. Feature these high-margin treatments prominently to elevate average ticket size.`,
    },
    {
      domain: 'Product Inventory & Retail',
      status: data.inventorySummary && (data.inventorySummary.lowStockCount > 0 || data.inventorySummary.outOfStockCount > 0)
        ? 'Restock Required'
        : 'Retail Optimized',
      statusBg: data.inventorySummary && (data.inventorySummary.lowStockCount > 0 || data.inventorySummary.outOfStockCount > 0)
        ? '#fee2e2'
        : '#d1fae5',
      statusColor: data.inventorySummary && (data.inventorySummary.lowStockCount > 0 || data.inventorySummary.outOfStockCount > 0)
        ? '#991b1b'
        : '#065f46',
      action: data.inventorySummary && (data.inventorySummary.lowStockCount > 0 || data.inventorySummary.outOfStockCount > 0)
        ? `Replenish ${data.inventorySummary.lowStockCount + data.inventorySummary.outOfStockCount} Low/Depleted Retail Items`
        : 'Bundle Retail Nail Oils with Gel Appointments',
      details: data.inventorySummary && (data.inventorySummary.lowStockCount > 0 || data.inventorySummary.outOfStockCount > 0)
        ? `${data.inventorySummary.outOfStockCount} item(s) are completely out of stock and ${data.inventorySummary.lowStockCount} item(s) are below threshold. Reorder from beauty distributors immediately to avoid lost retail sales.`
        : `Total on-hand retail valuation is ₱${(data.inventorySummary?.totalInventoryValue || 0).toLocaleString()}. Upsell aftercare cuticle oils at payment checkout to increase in-store merchandise yield.`,
    },
    {
      domain: 'CRM Churn Mitigation',
      status: 'Retention Focus',
      statusBg: '#fee2e2',
      statusColor: '#991b1b',
      action: `Re-Engage ${data.crmSummary.atRiskCount} Inactive Clients (>30 Days)`,
      details: `Dispatch automated 15% VIP Welcome-Back SMS and email vouchers to reconnect with clients approaching overdue nail care maintenance cycles.`,
    },
  ];

  const recommendationsHtml = strategicRecommendations
    .map(
      (rec) => `
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-left: 4px solid ${rec.statusColor}; border-radius: 8px; padding: 14px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #6b7280; letter-spacing: 0.5px;">${rec.domain}</span>
        <span style="font-size: 11px; font-weight: 700; background-color: ${rec.statusBg}; color: ${rec.statusColor}; padding: 2px 8px; border-radius: 9999px;">${rec.status}</span>
      </div>
      <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #111827;">${rec.action}</h4>
      <p style="margin: 0; font-size: 12px; color: #4b5563; line-height: 1.5;">${rec.details}</p>
    </div>
  `
    )
    .join('');

  // Inventory Table Rows HTML
  const inventoryRowsHtml = (data.inventoryItems || [])
    .map((item) => {
      const statusColor =
        item.status === 'In Stock'
          ? '#065f46'
          : item.status === 'Low Stock'
          ? '#92400e'
          : '#991b1b';
      const statusBg =
        item.status === 'In Stock'
          ? '#d1fae5'
          : item.status === 'Low Stock'
          ? '#fef3c7'
          : '#fee2e2';

      return `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 10px 8px;">
          <div style="font-weight: 700; color: #111827;">${item.name}</div>
          <div style="font-size: 11px; color: #6b7280;">SKU: ${item.sku || 'N/A'} • ${item.category}</div>
        </td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 600; color: #374151;">₱${item.price.toLocaleString()}</td>
        <td style="padding: 10px 8px; text-align: center; font-weight: 700; color: #111827;">${item.stock_quantity} units</td>
        <td style="padding: 10px 8px; text-align: center;">
          <span style="font-size: 10px; font-weight: 800; background-color: ${statusBg}; color: ${statusColor}; padding: 3px 8px; border-radius: 9999px; text-transform: uppercase;">
            ${item.status}
          </span>
        </td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: #6b21a8;">₱${item.inventoryValue.toLocaleString()}</td>
      </tr>
    `;
    })
    .join('');

  // Pickup Orders Rows HTML
  const pickupRowsHtml = (data.pickupOrders || [])
    .map(
      (order) => `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 10px 8px; font-weight: 700; color: #111827;">${order.orderNumber}</td>
        <td style="padding: 10px 8px;">
          <div style="font-weight: 600; color: #111827;">${order.customerName}</div>
          <div style="font-size: 11px; color: #6b7280;">${order.customerPhone}</div>
        </td>
        <td style="padding: 10px 8px; font-size: 12px; color: #4b5563;">${order.itemsSummary}</td>
        <td style="padding: 10px 8px; text-align: center; font-size: 11px; color: #6b7280;">${order.pickupDate}</td>
        <td style="padding: 10px 8px; text-align: center;">
          <span style="font-size: 10px; font-weight: 700; background-color: #ede9fe; color: #5b21b6; padding: 2px 8px; border-radius: 9999px;">
            ${order.status.replace(/_/g, ' ').toUpperCase()}
          </span>
        </td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: #065f46;">₱${order.totalAmount.toLocaleString()}</td>
      </tr>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Executive Decision Report - ${data.salonName}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 30px;
      background-color: #f8fafc;
      color: #1e293b;
      line-height: 1.4;
    }
    .report-container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 36px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }
    .kpi-card {
      background-color: #faf5ff;
      border: 1px solid #f3e8ff;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .kpi-title {
      font-size: 11px;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .kpi-value {
      font-size: 24px;
      font-weight: 800;
      color: #581c87;
    }
    .kpi-sub {
      font-size: 11px;
      color: #059669;
      font-weight: 600;
      margin-top: 4px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      margin: 28px 0 14px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      padding: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #7e22ce;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      text-decoration: none;
    }
    .btn-outline {
      background: #ffffff;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <!-- Action Bar (Hidden on Print) -->
    <div class="no-print" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
      <span style="font-size: 13px; font-weight: 600; color: #64748b;">
        Nail Glam Hub • Executive Decision-Making Dossier
      </span>
      <div style="display: flex; gap: 10px;">
        <button class="btn" onclick="window.print()">
          🖨️ Print / Save as PDF
        </button>
      </div>
    </div>

    <!-- Header -->
    <div class="header">
      <div>
        <span style="background-color: #fdf2f8; color: #9d174d; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
          Store Executive Dossier
        </span>
        <h1 style="margin: 8px 0 4px 0; font-size: 24px; font-weight: 900; color: #1e1b4b;">
          ${data.salonName}
        </h1>
        <p style="margin: 0; font-size: 13px; color: #64748b;">
          📍 ${data.salonAddress} • 📞 ${data.contactNumber}
        </p>
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; font-size: 12px; font-weight: 700; color: #475569;">
          Report Period: <span style="color: #7e22ce;">${data.timeRange.toUpperCase()}</span>
        </p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">
          Generated: ${data.generatedDate}
        </p>
      </div>
    </div>

    <!-- Core KPI Grid -->
    <div class="kpi-grid" style="grid-template-columns: repeat(${data.profitRevenueSummary ? 6 : data.inventorySummary ? 5 : 4}, 1fr);">
      ${
        data.profitRevenueSummary
          ? `
      <div class="kpi-card" style="background-color: #faf5ff; border-color: #e9d5ff;">
        <div class="kpi-title" style="color: #6b21a8;">Gross Revenue</div>
        <div class="kpi-value" style="color: #581c87; font-size: 20px;">₱${data.profitRevenueSummary.summary.totalGrossRevenue.toLocaleString()}</div>
        <div class="kpi-sub" style="color: #6b21a8;">₱${data.profitRevenueSummary.summary.totalServicesRevenue.toLocaleString()} Services • ₱${data.profitRevenueSummary.summary.totalRetailRevenue.toLocaleString()} Retail</div>
      </div>
      <div class="kpi-card" style="background-color: #ecfdf5; border-color: #d1fae5;">
        <div class="kpi-title" style="color: #065f46;">Retained Net Profit</div>
        <div class="kpi-value" style="color: #065f46; font-size: 20px;">₱${data.profitRevenueSummary.summary.netProfit.toLocaleString()}</div>
        <div class="kpi-sub" style="color: #047857; font-weight: 700;">${data.profitRevenueSummary.summary.profitMargin.toFixed(1)}% Net Margin</div>
      </div>
      `
          : data.stats.totalRevenue
          ? `
      <div class="kpi-card" style="background-color: #faf5ff; border-color: #e9d5ff;">
        <div class="kpi-title" style="color: #6b21a8;">Services Revenue</div>
        <div class="kpi-value" style="color: #581c87; font-size: 20px;">₱${data.stats.totalRevenue.toLocaleString()}</div>
        <div class="kpi-sub" style="color: #6b21a8;">Completed Appointments</div>
      </div>
      `
          : ''
      }
      <div class="kpi-card">
        <div class="kpi-title">Completed Visits</div>
        <div class="kpi-value">${data.stats.completedCount}</div>
        <div class="kpi-sub">+${data.stats.confirmedCount} Upcoming</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Fulfillment Rate</div>
        <div class="kpi-value">${data.stats.completionRate}%</div>
        <div class="kpi-sub">Target: &gt;90%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Avg Duration</div>
        <div class="kpi-value">${data.stats.avgDuration}m</div>
        <div class="kpi-sub">Per Treatment</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Client Retention</div>
        <div class="kpi-value">${data.crmSummary.retentionRate}%</div>
        <div class="kpi-sub">${data.crmSummary.vipCount + data.crmSummary.regularCount} Repeat Clients</div>
      </div>
      ${
        data.inventorySummary
          ? `
      <div class="kpi-card" style="background-color: #ecfdf5; border-color: #d1fae5;">
        <div class="kpi-title" style="color: #065f46;">Inventory Asset Value</div>
        <div class="kpi-value" style="color: #065f46; font-size: 20px;">₱${data.inventorySummary.totalInventoryValue.toLocaleString()}</div>
        <div class="kpi-sub" style="color: #047857;">${data.inventorySummary.totalUnitsInStock} Units • ${data.inventorySummary.totalProducts} Items</div>
      </div>
      `
          : ''
      }
    </div>

    ${profitSectionHtml}

    <!-- 1. Strategic Decision Matrix -->
    <div class="section-title">
      🎯 Strategic Decision Matrix & Management Action Plan
    </div>
    <div style="margin-bottom: 24px;">
      ${recommendationsHtml}
    </div>

    <!-- 2. Visual Trends & Category Demand -->
    <div class="two-col">
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">
            📊 ${data.volumeSummary ? `${data.volumeSummary.grain.toUpperCase()} Appointment ${data.volumeSummary.metric === 'income' ? 'Income (₱)' : 'Volume'}` : 'Appointment Volume Trend'}
          </h3>
          <span style="font-size: 10px; font-weight: 700; background: #faf5ff; color: #6b21a8; padding: 2px 8px; border-radius: 6px; border: 1px solid #f3e8ff;">
            ${data.volumeSummary ? `${data.volumeSummary.metric.toUpperCase()} • ${data.volumeSummary.grain.toUpperCase()}` : '6-MONTH TREND'}
          </span>
        </div>
        <div style="display: flex; gap: 8px; align-items: flex-end; height: 160px; padding-top: 10px; border-bottom: 1px solid #e2e8f0;">
          ${trendColumnsHtml}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-size: 11px; color: #64748b;">
          <span>${data.volumeSummary ? `Total: ${data.volumeSummary.metric === 'income' ? `₱${data.volumeSummary.totalIncome.toLocaleString()}` : `${data.volumeSummary.totalVolume} bookings`}` : 'Sustained booking volume'}</span>
          <span style="font-weight: 700; color: #6b21a8;">${data.volumeSummary?.peakPeriod ? `Peak: ${data.volumeSummary.peakPeriod}` : ''}</span>
        </div>
      </div>

      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">
            💅 Treatment Mix & Popularity
          </h3>
          <span style="font-size: 10px; font-weight: 700; background: #fdf2f8; color: #9d174d; padding: 2px 8px; border-radius: 6px; border: 1px solid #fce7f3;">
            ${data.treatmentMix?.timeGrain ? data.treatmentMix.timeGrain.toUpperCase() : 'ALL TIME'}
          </span>
        </div>
        ${categoryBarsHtml}
        <p style="margin: 10px 0 0 0; font-size: 11px; color: #64748b;">
          Category demand distribution calculated from verified salon booking records.
        </p>
      </div>
    </div>

    ${
      data.inventorySummary
        ? `
    <!-- Product Inventory & Stock Health Audit -->
    <div class="section-title">
      📦 Store Product Inventory & Stock Health Audit
    </div>

    <!-- Inventory KPIs -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px;">
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Catalog Products</div>
        <div style="font-size: 20px; font-weight: 800; color: #1e1b4b; margin-top: 2px;">${data.inventorySummary.totalProducts} Items</div>
        <div style="font-size: 11px; color: #059669; font-weight: 600;">${data.inventorySummary.totalUnitsInStock} total units in store</div>
      </div>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Retail Stock Valuation</div>
        <div style="font-size: 20px; font-weight: 800; color: #065f46; margin-top: 2px;">₱${data.inventorySummary.totalInventoryValue.toLocaleString()}</div>
        <div style="font-size: 11px; color: #64748b;">Asset value on shelf</div>
      </div>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Stock Attention Alerts</div>
        <div style="font-size: 20px; font-weight: 800; color: ${data.inventorySummary.lowStockCount + data.inventorySummary.outOfStockCount > 0 ? '#b91c1c' : '#059669'}; margin-top: 2px;">
          ${data.inventorySummary.lowStockCount + data.inventorySummary.outOfStockCount} Items
        </div>
        <div style="font-size: 11px; color: #64748b;">${data.inventorySummary.lowStockCount} Low • ${data.inventorySummary.outOfStockCount} Out of stock</div>
      </div>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">In-Store Customer Pickups</div>
        <div style="font-size: 20px; font-weight: 800; color: #7e22ce; margin-top: 2px;">${data.inventorySummary.pendingPickupOrdersCount} Pending</div>
        <div style="font-size: 11px; color: #64748b;">₱${data.inventorySummary.pickupRevenue.toLocaleString()} reserved value</div>
      </div>
    </div>

    ${
      data.inventorySummary.lowStockCount > 0 || data.inventorySummary.outOfStockCount > 0
        ? `
    <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-left: 4px solid #e11d48; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 12px; color: #9f1239;">
      <strong>⚠️ Restock Action Required:</strong> ${data.inventorySummary.outOfStockCount} product(s) are depleted and ${data.inventorySummary.lowStockCount} product(s) are below the safe threshold. Place wholesale vendor replenishment orders to prevent missed in-salon merchandise sales.
    </div>
    `
        : ''
    }

    <!-- Product Stock Table -->
    <div class="card" style="margin-bottom: 24px;">
      <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 10px;">
        Products & On-Hand Stock Ledger (${data.inventoryItems?.length || 0} Registered SKUs)
      </div>
      <table>
        <thead>
          <tr>
            <th>Product Name & SKU</th>
            <th style="text-align: right;">Unit Price (PHP)</th>
            <th style="text-align: center;">On-Hand Stock</th>
            <th style="text-align: center;">Stock Status</th>
            <th style="text-align: right;">Total Stock Value</th>
          </tr>
        </thead>
        <tbody>
          ${inventoryRowsHtml || '<tr><td colspan="5" style="padding: 12px; text-align: center; color: #94a3b8;">No products recorded in inventory.</td></tr>'}
        </tbody>
      </table>
    </div>

    ${
      data.pickupOrders && data.pickupOrders.length > 0
        ? `
    <div class="card" style="margin-bottom: 24px;">
      <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 10px;">
        In-Store Customer Pickup Orders (${data.pickupOrders.length} Recent Records)
      </div>
      <table>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Reserved Products</th>
            <th style="text-align: center;">Pickup Date</th>
            <th style="text-align: center;">Status</th>
            <th style="text-align: right;">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${pickupRowsHtml}
        </tbody>
      </table>
    </div>
    `
        : ''
    }
    `
        : ''
    }

    <!-- 3. Specialist Team Performance Matrix -->
    <div class="section-title">
      👩‍🎨 Specialist Team Productivity & Capacity Scorecard
    </div>
    <div class="card" style="margin-bottom: 24px;">
      <table>
        <thead>
          <tr>
            <th>Technician</th>
            <th>Primary Specialties</th>
            <th style="text-align: center;">Completed Sessions</th>
            <th style="text-align: center;">Serviced Hours</th>
            <th style="text-align: center;">Rating</th>
          </tr>
        </thead>
        <tbody>
          ${staffRowsHtml}
        </tbody>
      </table>
    </div>

    <!-- 4. CRM Directory & Churn Risk -->
    <div class="section-title">
      👥 Client Loyalty Directory (${data.clientList.length} Active Records)
    </div>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Client Name</th>
            <th>Tier</th>
            <th>Completed Visits</th>
            <th>Last Visit</th>
            <th>Preferred Service</th>
            <th>Custom Notes</th>
          </tr>
        </thead>
        <tbody>
          ${data.clientList
            .slice(0, 8)
            .map(
              (c) => `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 8px; font-weight: 600; color: #111827;">${c.name}</td>
              <td style="padding: 8px;"><span style="font-size: 10px; font-weight: 700; background-color: #fdf2f8; color: #9d174d; padding: 2px 6px; border-radius: 4px;">${c.tier}</span></td>
              <td style="padding: 8px; text-align: center; font-weight: 700;">${c.completedVisits}</td>
              <td style="padding: 8px; color: #6b7280; font-size: 11px;">${c.lastVisitDate}</td>
              <td style="padding: 8px; color: #4b5563; font-size: 11px;">${c.favoriteService}</td>
              <td style="padding: 8px; color: #6b7280; font-size: 11px; font-style: italic; max-width: 200px;">${c.note || '—'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      ${
        data.clientList.length > 8
          ? `<p style="font-size: 11px; color: #94a3b8; margin-top: 10px; text-align: center;">Showing top 8 clients of ${data.clientList.length} total client records. Full dataset available in exported CSV.</p>`
          : ''
      }
    </div>

    <!-- Footer Note -->
    <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8;">
      <span>Generated by Nail Glam Hub Store Analytics Engine</span>
      <span>Physical Salon Directory • In-Salon Payment &amp; Services Settlement</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates an executive Platform Growth & Strategic Decision Report for Admins
 */
export function generateAdminVisualHtmlReport(data: AdminReportData): string {
  const salonsRowsHtml = data.salonsList
    .map(
      (s) => `
    <tr style="border-bottom: 1px solid #f3f4f6;">
      <td style="padding: 10px 8px; font-weight: 600; color: #111827;">${s.name}</td>
      <td style="padding: 10px 8px; color: #4b5563;">${s.city}</td>
      <td style="padding: 10px 8px; text-align: center;">
        <span style="font-size: 10px; font-weight: 700; background-color: ${s.status === 'verified' ? '#d1fae5' : '#fef3c7'}; color: ${s.status === 'verified' ? '#065f46' : '#92400e'}; padding: 2px 8px; border-radius: 9999px;">
          ${s.status.toUpperCase()}
        </span>
      </td>
      <td style="padding: 10px 8px; text-align: center; font-weight: 600;">${s.servicesCount}</td>
      <td style="padding: 10px 8px; text-align: center; font-weight: 600;">${s.staffCount}</td>
    </tr>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Nail Glam Hub - Platform Executive Decision Dossier</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 30px;
      background-color: #f8fafc;
      color: #1e293b;
      line-height: 1.4;
    }
    .report-container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 36px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }
    .kpi-card {
      background-color: #fdf2f8;
      border: 1px solid #fce7f3;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .kpi-title {
      font-size: 11px;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .kpi-value {
      font-size: 24px;
      font-weight: 800;
      color: #831843;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      padding: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    .btn {
      background: #831843;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="no-print" style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <span style="font-weight: 700; color: #475569;">Nail Glam Hub • Administrative Intelligence Report</span>
      <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>

    <div class="header">
      <div>
        <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 900; color: #831843;">
          Platform Strategic Growth & Governance Report
        </h1>
        <p style="margin: 0; font-size: 13px; color: #64748b;">
          Directory ecosystem metrics, partner compliance, and booking demand distribution.
        </p>
      </div>
      <div style="text-align: right; font-size: 11px; color: #94a3b8;">
        Generated: ${data.generatedDate}
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">Active Salons</div>
        <div class="kpi-value">${data.totalSalons}</div>
        <div style="font-size: 11px; color: #059669; font-weight: 600; margin-top: 4px;">${data.verifiedSalons} Verified Partners</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Total Bookings</div>
        <div class="kpi-value">${data.totalAppointments}</div>
        <div style="font-size: 11px; color: #059669; font-weight: 600; margin-top: 4px;">Across all branches</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Registered Accounts</div>
        <div class="kpi-value">${data.totalUsers}</div>
        <div style="font-size: 11px; color: #6b21a8; font-weight: 600; margin-top: 4px;">Clients & Salon Staff</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Review Sentiment</div>
        <div class="kpi-value">★ ${data.avgRating}</div>
        <div style="font-size: 11px; color: #d97706; font-weight: 600; margin-top: 4px;">${data.totalReviews} Total Reviews</div>
      </div>
    </div>

    <!-- Platform Strategic Directives -->
    <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 12px; color: #1e1b4b;">
      🚀 Platform Growth & Partnership Directives
    </h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px;">
      <div style="background: #fdf4ff; border: 1px solid #f5d0fe; padding: 14px; border-radius: 10px;">
        <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #86198f;">1. Salon Onboarding Review</h4>
        <p style="margin: 0; font-size: 11px; color: #701a75; line-height: 1.5;">Review current salon coverage and pending applications before approving additional marketplace listings.</p>
      </div>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 10px;">
        <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #166534;">2. Verification Quality Review</h4>
        <p style="margin: 0; font-size: 11px; color: #14532d; line-height: 1.5;">Confirm that active listings meet the platform&apos;s verification requirements before keeping them visible to customers.</p>
      </div>
    </div>

    <!-- Partner Salons Table -->
    <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 12px; color: #1e1b4b;">
      🏢 Directory Partner Directory & Status
    </h3>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Salon Brand</th>
            <th>Location</th>
            <th style="text-align: center;">Verification</th>
            <th style="text-align: center;">Active Services</th>
            <th style="text-align: center;">Technicians</th>
          </tr>
        </thead>
        <tbody>
          ${salonsRowsHtml}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates an executive Profit & Revenue Financial Statement in standalone HTML/PDF format
 */
export function generateProfitRevenueVisualHtmlReport(data: ProfitRevenueReportData): string {
  const grainTitles: Record<string, string> = {
    daily: 'Daily Profit & Revenue Financial Ledger',
    weekly: 'Weekly Profit & Revenue Operating Statement',
    monthly: 'Monthly P&L (Profit & Loss) Performance Report',
    yearly: 'Annual Fiscal Year Profit & Revenue Audit',
  };

  const reportTitle = grainTitles[data.timeGrain] || 'Profit & Revenue Financial Performance Report';
  const marginColor = data.summary.profitMargin >= 30 ? '#059669' : data.summary.profitMargin >= 15 ? '#d97706' : '#dc2626';

  // Comparative Visual Chart Columns (Revenue vs Net Profit)
  const maxRevenue = Math.max(...data.periods.map((p) => p.totalRevenue), 1);
  const chartColumnsHtml = data.periods
    .map((p) => {
      const revHeight = Math.max(10, Math.round((p.totalRevenue / maxRevenue) * 100));
      const profitHeight = Math.max(6, Math.round((Math.max(0, p.netProfit) / maxRevenue) * 100));

      return `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 180px; flex: 1; min-width: 45px;">
        <div style="font-size: 9px; font-weight: 700; color: #1e1b4b; margin-bottom: 4px; white-space: nowrap;">
          ₱${p.totalRevenue.toLocaleString()}
        </div>
        <div style="display: flex; align-items: flex-end; gap: 4px; height: 100%; width: 100%; justify-content: center;">
          <!-- Revenue Bar -->
          <div style="width: 14px; height: ${revHeight}%; background: linear-gradient(180deg, #7e22ce, #4338ca); border-radius: 4px 4px 0 0;" title="Revenue: ₱${p.totalRevenue.toLocaleString()}"></div>
          <!-- Net Profit Bar -->
          <div style="width: 14px; height: ${profitHeight}%; background: linear-gradient(180deg, #10b981, #059669); border-radius: 4px 4px 0 0;" title="Profit: ₱${p.netProfit.toLocaleString()} (${p.profitMargin.toFixed(1)}%)"></div>
        </div>
        <span style="font-size: 10px; font-weight: 600; color: #64748b; margin-top: 6px; white-space: nowrap;">${p.shortLabel}</span>
      </div>
    `;
    })
    .join('');

  // Financial Ledger Table Rows
  const ledgerRowsHtml = data.periods
    .map((p) => {
      const rowMarginColor = p.profitMargin >= 30 ? '#059669' : p.profitMargin >= 15 ? '#d97706' : '#dc2626';
      const rowMarginBg = p.profitMargin >= 30 ? '#ecfdf5' : p.profitMargin >= 15 ? '#fffbeb' : '#fef2f2';

      return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 8px; font-weight: 700; color: #1e293b;">${p.periodLabel}</td>
        <td style="padding: 10px 8px; text-align: center; color: #475569; font-weight: 600;">${p.appointmentCount} appts • ${p.orderCount} orders</td>
        <td style="padding: 10px 8px; text-align: right; color: #475569;">₱${p.servicesRevenue.toLocaleString()}</td>
        <td style="padding: 10px 8px; text-align: right; color: #475569;">₱${p.retailRevenue.toLocaleString()}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 800; color: #1e1b4b;">₱${p.totalRevenue.toLocaleString()}</td>
        <td style="padding: 10px 8px; text-align: right; color: #dc2626;">-₱${p.laborExpense.toLocaleString()}</td>
        <td style="padding: 10px 8px; text-align: right; color: #dc2626;">-₱${(p.suppliesExpense + p.overheadExpense).toLocaleString()}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: #991b1b;">-₱${p.totalExpenses.toLocaleString()}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 900; color: #065f46;">₱${p.netProfit.toLocaleString()}</td>
        <td style="padding: 10px 8px; text-align: center;">
          <span style="font-size: 10px; font-weight: 800; background-color: ${rowMarginBg}; color: ${rowMarginColor}; padding: 3px 8px; border-radius: 9999px;">
            ${p.profitMargin.toFixed(1)}%
          </span>
        </td>
      </tr>
    `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${data.salonName} - ${reportTitle}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 30px;
      background-color: #f8fafc;
      color: #1e293b;
      line-height: 1.4;
    }
    .report-container {
      max-width: 960px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 36px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }
    .kpi-card {
      background-color: #faf5ff;
      border: 1px solid #f3e8ff;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .kpi-title {
      font-size: 11px;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .kpi-value {
      font-size: 24px;
      font-weight: 800;
      color: #1e1b4b;
    }
    .kpi-sub {
      font-size: 11px;
      color: #059669;
      font-weight: 600;
      margin-top: 4px;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      padding: 10px 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    .btn {
      background: #7e22ce;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <!-- Action Bar (Hidden on Print) -->
    <div class="no-print" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
      <span style="font-size: 13px; font-weight: 600; color: #64748b;">
        Nail Glam Hub • Financial Operations & Profit Ledger
      </span>
      <div style="display: flex; gap: 10px;">
        <button class="btn" onclick="window.print()">
          🖨️ Print / Save as PDF
        </button>
      </div>
    </div>

    <!-- Header -->
    <div class="header">
      <div>
        <span style="background-color: #ecfdf5; color: #065f46; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
          Financial P&amp;L Statement (${data.timeGrain.toUpperCase()})
        </span>
        <h1 style="margin: 8px 0 4px 0; font-size: 24px; font-weight: 900; color: #1e1b4b;">
          ${data.salonName}
        </h1>
        <p style="margin: 0; font-size: 13px; color: #64748b;">
          📍 ${data.salonAddress} • 📞 ${data.contactNumber}
        </p>
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; font-size: 12px; font-weight: 700; color: #475569;">
          Time Scope: <span style="color: #7e22ce;">${data.timeRange.toUpperCase()}</span>
        </p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">
          Audit Date: ${data.generatedDate}
        </p>
      </div>
    </div>

    <!-- Financial KPI Scorecard -->
    <div class="kpi-grid">
      <div class="kpi-card" style="background-color: #faf5ff; border-color: #f3e8ff;">
        <div class="kpi-title">Gross Revenue</div>
        <div class="kpi-value" style="color: #6b21a8;">₱${data.summary.totalGrossRevenue.toLocaleString()}</div>
        <div class="kpi-sub" style="color: #6b21a8;">₱${data.summary.totalServicesRevenue.toLocaleString()} services • ₱${data.summary.totalRetailRevenue.toLocaleString()} retail</div>
      </div>
      <div class="kpi-card" style="background-color: #fef2f2; border-color: #fee2e2;">
        <div class="kpi-title" style="color: #991b1b;">Total Operating Costs</div>
        <div class="kpi-value" style="color: #991b1b;">₱${data.summary.totalExpenses.toLocaleString()}</div>
        <div class="kpi-sub" style="color: #b91c1c;">Commissions, Supplies &amp; Overheads</div>
      </div>
      <div class="kpi-card" style="background-color: #ecfdf5; border-color: #d1fae5;">
        <div class="kpi-title" style="color: #065f46;">Net Operating Profit</div>
        <div class="kpi-value" style="color: #065f46;">₱${data.summary.netProfit.toLocaleString()}</div>
        <div class="kpi-sub" style="color: ${marginColor}; font-weight: 800;">${data.summary.profitMargin.toFixed(1)}% Net Margin</div>
      </div>
      <div class="kpi-card" style="background-color: #eff6ff; border-color: #dbeafe;">
        <div class="kpi-title" style="color: #1d4ed8;">Average Ticket Size</div>
        <div class="kpi-value" style="color: #1d4ed8;">₱${data.summary.averageTicket.toLocaleString()}</div>
        <div class="kpi-sub" style="color: #1e40af;">Across ${data.summary.totalAppointments + data.summary.totalOrders} total tickets</div>
      </div>
    </div>

    <!-- Comparative Revenue vs Net Profit Chart -->
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>
          <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #1e293b;">
            📊 ${data.timeGrain.toUpperCase()} Revenue vs Net Profit Comparison
          </h3>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">
            Side-by-side visualization of gross revenue intake against retained net profit after commissions and supplies.
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: 14px; font-size: 11px; font-weight: 700;">
          <div style="display: flex; align-items: center; gap: 5px;">
            <div style="width: 10px; height: 10px; background: #6b21a8; border-radius: 2px;"></div>
            <span>Gross Revenue</span>
          </div>
          <div style="display: flex; align-items: center; gap: 5px;">
            <div style="width: 10px; height: 10px; background: #10b981; border-radius: 2px;"></div>
            <span>Net Profit</span>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 10px; align-items: flex-end; height: 190px; padding-top: 10px; border-bottom: 1px solid #e2e8f0; overflow-x: auto;">
        ${chartColumnsHtml}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; font-size: 11px; color: #64748b;">
        <span>Peak Profit Period: <strong style="color: #065f46;">${data.summary.peakPeriod} (₱${data.summary.peakProfit.toLocaleString()})</strong></span>
        <span>Cost Model: 40% Staff Commission • 15% Salon Consumables • 8% Overheads</span>
      </div>
    </div>

    <!-- Comprehensive Financial Statement Table -->
    <div class="card">
      <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 800; color: #1e293b;">
        📑 Detailed Financial P&amp;L Ledger
      </h3>
      <table>
        <thead>
          <tr>
            <th>Period (${data.timeGrain})</th>
            <th style="text-align: center;">Transactions</th>
            <th style="text-align: right;">Services Rev</th>
            <th style="text-align: right;">Retail Rev</th>
            <th style="text-align: right;">Gross Revenue</th>
            <th style="text-align: right;">Staff Comm.</th>
            <th style="text-align: right;">Supplies/Overhead</th>
            <th style="text-align: right;">Total Costs</th>
            <th style="text-align: right;">Net Profit</th>
            <th style="text-align: center;">Net Margin</th>
          </tr>
        </thead>
        <tbody>
          ${ledgerRowsHtml}
        </tbody>
        <tfoot>
          <tr style="background-color: #f8fafc; font-weight: 800; border-top: 2px solid #cbd5e1;">
            <td style="padding: 12px 8px; color: #0f172a;">TOTALS / SUMMARY</td>
            <td style="padding: 12px 8px; text-align: center; color: #475569;">${data.summary.totalAppointments} appts • ${data.summary.totalOrders} orders</td>
            <td style="padding: 12px 8px; text-align: right; color: #475569;">₱${data.summary.totalServicesRevenue.toLocaleString()}</td>
            <td style="padding: 12px 8px; text-align: right; color: #475569;">₱${data.summary.totalRetailRevenue.toLocaleString()}</td>
            <td style="padding: 12px 8px; text-align: right; color: #6b21a8; font-size: 13px;">₱${data.summary.totalGrossRevenue.toLocaleString()}</td>
            <td style="padding: 12px 8px; text-align: right; color: #dc2626;">-₱${data.summary.totalLaborExpenses.toLocaleString()}</td>
            <td style="padding: 12px 8px; text-align: right; color: #dc2626;">-₱${(data.summary.totalSuppliesExpenses + data.summary.totalOverheadExpenses).toLocaleString()}</td>
            <td style="padding: 12px 8px; text-align: right; color: #991b1b; font-size: 13px;">-₱${data.summary.totalExpenses.toLocaleString()}</td>
            <td style="padding: 12px 8px; text-align: right; color: #065f46; font-size: 14px;">₱${data.summary.netProfit.toLocaleString()}</td>
            <td style="padding: 12px 8px; text-align: center;">
              <span style="font-size: 11px; font-weight: 800; background-color: #ecfdf5; color: #065f46; padding: 4px 10px; border-radius: 9999px;">
                ${data.summary.profitMargin.toFixed(1)}%
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Strategic Profit Directives -->
    <div class="card" style="background-color: #faf5ff; border-color: #e9d5ff;">
      <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 800; color: #581c87;">
        💡 Strategic Profit &amp; Margin Optimization Directives
      </h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 12px;">
        <div style="background: white; border: 1px solid #f3e8ff; padding: 12px; border-radius: 8px;">
          <strong style="color: #6b21a8; font-size: 12px;">1. High-Margin Service Prioritization:</strong>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #4b5563; line-height: 1.5;">
            Japanese builder gel and Russian manicures yield >65% service margin after consumable cost. Encourage technicians to recommend treatment add-ons during consultations.
          </p>
        </div>
        <div style="background: white; border: 1px solid #f3e8ff; padding: 12px; border-radius: 8px;">
          <strong style="color: #065f46; font-size: 12px;">2. Retail Attachment Uplift:</strong>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #4b5563; line-height: 1.5;">
            In-store retail currently accounts for ${data.summary.totalGrossRevenue > 0 ? Math.round((data.summary.totalRetailRevenue / data.summary.totalGrossRevenue) * 100) : 0}% of gross revenue. Pairing cuticle oils and hand creams with manicures boosts ticket value with 0 additional chair time.
          </p>
        </div>
      </div>
    </div>

    <!-- Footer Note -->
    <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8;">
      <span>Generated by Nail Glam Hub Salon Financial Intelligence System</span>
      <span>P&amp;L Statements • Operational Cash Flow &amp; Margin Audit</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates an accountant-ready CSV string for Profit & Revenue data
 */
export function generateProfitRevenueCsv(data: ProfitRevenueReportData): string {
  let csv = `Nail Glam Hub - ${data.timeGrain.toUpperCase()} Profit & Revenue Financial Statement\n`;
  csv += `Salon Name: "${data.salonName}"\n`;
  csv += `Address: "${data.salonAddress}"\n`;
  csv += `Generated Date: "${data.generatedDate}"\n`;
  csv += `Reporting Scope: "${data.timeRange}"\n\n`;

  // Summary KPIs
  csv += `--- EXECUTIVE FINANCIAL P&L SUMMARY ---\n`;
  csv += `Metric,Amount (PHP),Notes\n`;
  csv += `Total Gross Revenue,${data.summary.totalGrossRevenue},"Services + Retail Sales"\n`;
  csv += `Services Booking Revenue,${data.summary.totalServicesRevenue},"Appointments completed & confirmed"\n`;
  csv += `Retail Merchandise Revenue,${data.summary.totalRetailRevenue},"In-store pickup orders fulfilled"\n`;
  csv += `Technician Labor / Commissions,${data.summary.totalLaborExpenses},"Estimated 40% staff payout"\n`;
  csv += `Consumables & Product COGS,${data.summary.totalSuppliesExpenses},"Estimated 15% service supplies + product wholesale"\n`;
  csv += `Operating Utilities & Overheads,${data.summary.totalOverheadExpenses},"Estimated 8% facility/software overhead"\n`;
  csv += `Total Operating Expenses,${data.summary.totalExpenses},"Total cost base"\n`;
  csv += `Net Operating Profit,${data.summary.netProfit},"Gross Revenue minus Operating Costs"\n`;
  csv += `Net Profit Margin (%),${data.summary.profitMargin.toFixed(2)}%,"Net Profit / Gross Revenue"\n`;
  csv += `Average Ticket Value,${data.summary.averageTicket},"Average revenue per customer transaction"\n`;
  csv += `Peak Period,"${data.summary.peakPeriod}","Peak Net Profit: ₱${data.summary.peakProfit.toLocaleString()}"\n\n`;

  // Granular Ledger Table
  csv += `--- GRANULAR ${data.timeGrain.toUpperCase()} FINANCIAL LEDGER ---\n`;
  csv += `Period,Bookings,Retail Orders,Services Revenue (PHP),Retail Revenue (PHP),Gross Revenue (PHP),Labor Commissions (PHP),Supplies & Overheads (PHP),Total Costs (PHP),Net Profit (PHP),Profit Margin (%)\n`;

  data.periods.forEach((p) => {
    csv += `"${p.periodLabel}",${p.appointmentCount},${p.orderCount},${p.servicesRevenue},${p.retailRevenue},${p.totalRevenue},${p.laborExpense},${p.suppliesExpense + p.overheadExpense},${p.totalExpenses},${p.netProfit},${p.profitMargin.toFixed(2)}%\n`;
  });

  csv += `\n`;
  csv += `"TOTALS",${data.summary.totalAppointments},${data.summary.totalOrders},${data.summary.totalServicesRevenue},${data.summary.totalRetailRevenue},${data.summary.totalGrossRevenue},${data.summary.totalLaborExpenses},${data.summary.totalSuppliesExpenses + data.summary.totalOverheadExpenses},${data.summary.totalExpenses},${data.summary.netProfit},${data.summary.profitMargin.toFixed(2)}%\n`;

  return csv;
}

/**
 * Downloads arbitrary text/HTML content as a local file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Opens an HTML report in a new popup window with auto-print trigger
 */
export function openPrintableReport(htmlContent: string) {
  const printWindow = window.open('', '_blank', 'width=950,height=800,scrollbars=yes,resizable=yes');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}
