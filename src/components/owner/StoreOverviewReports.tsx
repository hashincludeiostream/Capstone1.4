import React, { useState, useMemo } from 'react';
import {
  Users,
  Sparkles,
  Download,
  Search,
  Award,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  MessageSquare,
  Send,
  BarChart3,
  PieChart,
  RefreshCw,
  Store,
  CheckCheck,
  FileText,
  Edit3,
  Star,
  Package,
  AlertTriangle,
  ShoppingBag,
  Layers,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { Salon, Service, Technician, Appointment, Review, Product, ProductOrder } from '../../types';
import { DecisionReportModal } from './DecisionReportModal';
import {
  StoreReportData,
  FinancialPeriodItem,
  ProfitRevenueReportData,
  generateStoreVisualHtmlReport,
  downloadFile,
  openPrintableReport,
} from '../../utils/reportGenerators';

interface StoreOverviewReportsProps {
  salon: Salon;
  appointments: Appointment[];
  services: Service[];
  technicians: Technician[];
  reviews: Review[];
  products?: Product[];
  productOrders?: ProductOrder[];
  onNavigateToInventory?: () => void;
  onRefreshProducts?: () => void;
  showToast: (msg: string) => void;
}

export const StoreOverviewReports: React.FC<StoreOverviewReportsProps> = ({
  salon,
  appointments,
  services,
  technicians,
  reviews,
  products = [],
  productOrders = [],
  onNavigateToInventory,
  onRefreshProducts,
  showToast,
}) => {
  // Time period filter
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'quarter' | 'all'>('month');

  // Appointment Volume granular toggles
  const [volumeTimeGrain, setVolumeTimeGrain] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [volumeMetric, setVolumeMetric] = useState<'bookings' | 'income'>('bookings');

  // Treatment Popularity Mix granular toggles
  const [treatmentTimeGrain, setTreatmentTimeGrain] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'>('monthly');
  const [treatmentMetric, setTreatmentMetric] = useState<'bookings' | 'income'>('bookings');

  // Integrated Executive Financial P&L Time Grain
  const [financialTimeGrain, setFinancialTimeGrain] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Master All-in-One Report Modal State
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  // CRM search and filters
  const [crmSearch, setCrmSearch] = useState('');
  const [crmSegment, setCrmSegment] = useState<'all' | 'vip' | 'regular' | 'new' | 'at_risk'>('all');

  // Custom CRM Notes state stored locally per client
  const [clientNotes, setClientNotes] = useState<Record<string, string>>({});

  const [editingNoteClient, setEditingNoteClient] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  // Review reply state
  const [replyingReviewId, setReplyingReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [ownerReplies, setOwnerReplies] = useState<Record<number, string>>({});

  // Re-engagement promo modal
  const [promoModalClient, setPromoModalClient] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState('15');

  // Helper to get estimated or recorded revenue for an appointment
  const getApptIncome = (a: Appointment): number => {
    if (a.status === 'cancelled') return 0;
    const priceFromService = services.find((s) => s.id === a.service_id)?.price;
    const directPrice = a.paid_amount || a.service_price || a.total_price;
    return Number(directPrice || priceFromService || 0);
  };

  // Compute Core Store Operational & Capacity Statistics
  const stats = useMemo(() => {
    const totalAppointments = appointments.length;
    const completedAppts = appointments.filter((a) => a.status === 'completed');
    const confirmedAppts = appointments.filter((a) => a.status === 'confirmed');
    const pendingAppts = appointments.filter((a) => a.status === 'pending');
    const cancelledAppts = appointments.filter((a) => a.status === 'cancelled');

    // Average duration
    const totalMinutes = completedAppts.reduce((sum, a) => sum + (a.service_duration || 60), 0);
    const avgDuration = completedAppts.length > 0 ? Math.round(totalMinutes / completedAppts.length) : 0;

    // Completion rate
    const validCount = completedAppts.length + cancelledAppts.length;
    const completionRate = validCount > 0 ? Math.round((completedAppts.length / validCount) * 100) : 0;

    // Monthly Target Bookings (configurable per salon)
    const monthlyTarget = salon.monthly_target_bookings || 30;
    const targetProgress = Math.min(100, Math.round(((completedAppts.length + confirmedAppts.length) / monthlyTarget) * 100));

    // Total Revenue from appointments
    const totalRevenue = completedAppts.reduce((sum, a) => sum + getApptIncome(a), 0);

    return {
      totalAppointments,
      completedCount: completedAppts.length,
      confirmedCount: confirmedAppts.length,
      pendingCount: pendingAppts.length,
      cancelledCount: cancelledAppts.length,
      avgDuration,
      completionRate,
      monthlyTarget,
      targetProgress,
      totalRevenue,
    };
  }, [appointments, salon.monthly_target_bookings]);

  const averageTreatmentsPerClient = useMemo(() => {
    const clients = new Set(
      appointments.map((appointment) => appointment.customer_id || appointment.customer_email || appointment.customer_name)
    );
    return clients.size > 0 ? (appointments.length / clients.size).toFixed(1) : null;
  }, [appointments]);

  const cancellationRate = appointments.length > 0
    ? ((appointments.filter((appointment) => appointment.status === 'cancelled').length / appointments.length) * 100).toFixed(1)
    : null;

  const peakBookingDay = useMemo(() => {
    if (appointments.length === 0) return null;
    const counts = new Map<string, number>();
    appointments.forEach((appointment) => {
      const day = new Date(`${appointment.appointment_date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
      counts.set(day, (counts.get(day) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
  }, [appointments]);

  // Appointment Volume Trend across Daily, Weekly, Monthly, Yearly and Metric (Bookings vs Income)
  const volumeTrendData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (volumeTimeGrain === 'daily') {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const isToday = i === 0;

        const matchingAppts = appointments.filter((a) => a.appointment_date === dateStr);
        const count = matchingAppts.length;
        const income = matchingAppts.reduce((sum, a) => sum + getApptIncome(a), 0);
        const value = volumeMetric === 'bookings' ? count : income;

        days.push({
          label: `${dayName}, ${monthDay}${isToday ? ' (Today)' : ''}`,
          shortLabel: isToday ? 'Today' : `${dayName} ${d.getDate()}`,
          dateStr,
          count,
          income,
          value,
          formattedValue: volumeMetric === 'bookings' ? `${count} bookings` : `₱${income.toLocaleString()}`,
          isActive: isToday,
        });
      }
      return days;
    }

    if (volumeTimeGrain === 'weekly') {
      const weeks = [];
      for (let w = 5; w >= 0; w--) {
        const endDay = new Date();
        endDay.setDate(endDay.getDate() - (w * 7));
        const startDay = new Date(endDay);
        startDay.setDate(startDay.getDate() - 6);

        const startStr = startDay.toISOString().split('T')[0];
        const endStr = endDay.toISOString().split('T')[0];
        const isCurrent = w === 0;

        const matchingAppts = appointments.filter((a) => {
          return a.appointment_date >= startStr && a.appointment_date <= endStr;
        });

        const count = matchingAppts.length;
        const income = matchingAppts.reduce((sum, a) => sum + getApptIncome(a), 0);
        const value = volumeMetric === 'bookings' ? count : income;

        const startLabel = startDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endLabel = endDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        weeks.push({
          label: `Week ${6 - w}: ${startLabel} - ${endLabel}${isCurrent ? ' (Current)' : ''}`,
          shortLabel: isCurrent ? 'This Wk' : `Wk ${6 - w}`,
          count,
          income,
          value,
          formattedValue: volumeMetric === 'bookings' ? `${count} bookings` : `₱${income.toLocaleString()}`,
          isActive: isCurrent,
        });
      }
      return weeks;
    }

    if (volumeTimeGrain === 'yearly') {
      const years = [];
      for (let y = 3; y >= 0; y--) {
        const targetYear = currentYear - y;
        const yearPrefix = `${targetYear}-`;
        const isCurrent = y === 0;

        const matchingAppts = appointments.filter((a) => a.appointment_date.startsWith(yearPrefix));
        const count = matchingAppts.length;
        const income = matchingAppts.reduce((sum, a) => sum + getApptIncome(a), 0);
        const value = volumeMetric === 'bookings' ? count : income;

        years.push({
          label: `${targetYear}${isCurrent ? ' (Current Year)' : ''}`,
          shortLabel: `${targetYear}`,
          count,
          income,
          value,
          formattedValue: volumeMetric === 'bookings' ? `${count} bookings` : `₱${income.toLocaleString()}`,
          isActive: isCurrent,
        });
      }
      return years;
    }

    // Default: Monthly (past 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthly = [];
    for (let m = 5; m >= 0; m--) {
      const targetDate = new Date(currentYear, currentMonth - m, 1);
      const yyyy = targetDate.getFullYear();
      const monthIdx = targetDate.getMonth();
      const monthPrefix = `${yyyy}-${String(monthIdx + 1).padStart(2, '0')}`;
      const isCurrent = m === 0;

      const matchingAppts = appointments.filter((a) => a.appointment_date.startsWith(monthPrefix));
      const count = matchingAppts.length;
      const income = matchingAppts.reduce((sum, a) => sum + getApptIncome(a), 0);
      const value = volumeMetric === 'bookings' ? count : income;

      monthly.push({
        label: `${months[monthIdx]} ${yyyy}${isCurrent ? ' (Current)' : ''}`,
        shortLabel: `${months[monthIdx]} '${String(yyyy).slice(2)}`,
        count,
        income,
        value,
        formattedValue: volumeMetric === 'bookings' ? `${count} bookings` : `₱${income.toLocaleString()}`,
        isActive: isCurrent,
      });
    }
    return monthly;
  }, [appointments, services, volumeTimeGrain, volumeMetric]);

  // Peak Period in Volume Data
  const peakVolumePeriod = useMemo(() => {
    if (volumeTrendData.length === 0) return null;
    return [...volumeTrendData].sort((a, b) => b.value - a.value)[0];
  }, [volumeTrendData]);

  // Treatment Popularity Mix filtered by Time Grain & Metric
  const treatmentMixData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const filteredAppts = appointments.filter((a) => {
      if (treatmentTimeGrain === 'all') return true;
      if (!a.appointment_date) return false;

      const apptDate = new Date(`${a.appointment_date}T00:00:00`);
      const diffMs = now.getTime() - apptDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (treatmentTimeGrain === 'daily') {
        return a.appointment_date === todayStr || diffDays <= 1;
      }
      if (treatmentTimeGrain === 'weekly') {
        return diffDays <= 7 && diffDays >= 0;
      }
      if (treatmentTimeGrain === 'monthly') {
        return diffDays <= 30 && diffDays >= 0;
      }
      if (treatmentTimeGrain === 'yearly') {
        return diffDays <= 365 && diffDays >= 0;
      }
      return true;
    });

    const categoryMap: Record<string, { count: number; income: number }> = {
      'Manicure': { count: 0, income: 0 },
      'Nail Art': { count: 0, income: 0 },
      'Spa & Wellness': { count: 0, income: 0 },
      'Extensions': { count: 0, income: 0 },
    };

    const serviceMap = new Map<string, { name: string; category: string; count: number; income: number }>();

    filteredAppts.forEach((appt) => {
      const s = services.find((srv) => srv.id === appt.service_id);
      const cat = s?.category || 'Manicure';
      const serviceName = appt.service_name || s?.service_name || 'Custom Nail Treatment';
      const income = getApptIncome(appt);

      if (!categoryMap[cat]) {
        categoryMap[cat] = { count: 0, income: 0 };
      }
      categoryMap[cat].count += 1;
      categoryMap[cat].income += income;

      if (!serviceMap.has(serviceName)) {
        serviceMap.set(serviceName, { name: serviceName, category: cat, count: 0, income: 0 });
      }
      const srvRecord = serviceMap.get(serviceName)!;
      srvRecord.count += 1;
      srvRecord.income += income;
    });

    const totalBookings = Object.values(categoryMap).reduce((sum, c) => sum + c.count, 0);
    const totalIncome = Object.values(categoryMap).reduce((sum, c) => sum + c.income, 0);
    const totalBase = treatmentMetric === 'bookings' ? totalBookings : totalIncome;

    const categories = Object.entries(categoryMap).map(([name, data]) => {
      const val = treatmentMetric === 'bookings' ? data.count : data.income;
      const percentage = totalBase > 0 ? Math.round((val / totalBase) * 100) : 0;
      return {
        name,
        count: data.count,
        income: data.income,
        value: val,
        percentage,
      };
    }).sort((a, b) => b.value - a.value);

    const topServices = Array.from(serviceMap.values())
      .sort((a, b) => (treatmentMetric === 'bookings' ? b.count - a.count : b.income - a.income))
      .slice(0, 5);

    return {
      filteredCount: filteredAppts.length,
      totalBookings,
      totalIncome,
      categories,
      topServices,
    };
  }, [appointments, services, treatmentTimeGrain, treatmentMetric]);

  // Standard legacy categoryBreakdown fallback for compatibility
  const categoryBreakdown = useMemo(() => {
    return treatmentMixData.categories.map((c) => ({
      name: c.name,
      count: c.count,
      percentage: c.percentage,
    }));
  }, [treatmentMixData]);

  // Compute CRM Client Profiles from appointment histories
  const crmClients = useMemo(() => {
    const clientMap = new Map<string, {
      name: string;
      email: string;
      phone: string;
      appointments: Appointment[];
      completedVisits: number;
      lastVisitDate: string;
      favoriteService: string;
      preferredTechnician: string;
    }>();

    appointments.forEach((appt) => {
      const name = appt.customer_name || 'Client';
      if (!clientMap.has(name)) {
        clientMap.set(name, {
          name,
          email: appt.customer_email || 'Not provided',
          phone: appt.customer_phone || 'Not provided',
          appointments: [],
          completedVisits: 0,
          lastVisitDate: appt.appointment_date,
          favoriteService: appt.service_name || 'Nail Service',
          preferredTechnician: appt.staff_name || 'Not assigned',
        });
      }

      const client = clientMap.get(name)!;
      client.appointments.push(appt);
      if (appt.status === 'completed') {
        client.completedVisits += 1;
      }
      if (new Date(appt.appointment_date) > new Date(client.lastVisitDate)) {
        client.lastVisitDate = appt.appointment_date;
      }
    });

    return Array.from(clientMap.values()).map((c) => {
      let tier: 'VIP Diamond' | 'Loyal Regular' | 'New Client' | 'At-Risk' = 'New Client';
      if (c.completedVisits >= 3) {
        tier = 'VIP Diamond';
      } else if (c.completedVisits >= 2) {
        tier = 'Loyal Regular';
      } else {
        const lastDate = new Date(c.lastVisitDate);
        const daysAgo = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysAgo > 30) {
          tier = 'At-Risk';
        } else {
          tier = 'New Client';
        }
      }

      return {
        ...c,
        tier,
      };
    });
  }, [appointments]);

  // Calculate retention rate from actual CRM data
  const retentionRate = useMemo(() => {
    const repeatClients = crmClients.filter((c) => c.completedVisits >= 2).length;
    return crmClients.length > 0 ? Math.round((repeatClients / crmClients.length) * 100) : 0;
  }, [crmClients]);

  // Standard legacy monthlyTrend for backward compatibility
  const monthlyTrend = useMemo(() => {
    return volumeTrendData.map((d) => ({
      month: d.label,
      count: d.count,
    }));
  }, [volumeTrendData]);

  // Filter CRM Clients
  const filteredClients = useMemo(() => {
    return crmClients.filter((c) => {
      const matchSearch =
        !crmSearch ||
        c.name.toLowerCase().includes(crmSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(crmSearch.toLowerCase()) ||
        c.phone.includes(crmSearch);

      const matchSegment =
        crmSegment === 'all'
          ? true
          : crmSegment === 'vip'
          ? c.tier === 'VIP Diamond'
          : crmSegment === 'regular'
          ? c.tier === 'Loyal Regular'
          : crmSegment === 'new'
          ? c.tier === 'New Client'
          : c.tier === 'At-Risk';

      return matchSearch && matchSegment;
    });
  }, [crmClients, crmSearch, crmSegment]);

  // Staff Productivity Scorecard
  const staffScorecard = useMemo(() => {
    return technicians.map((tech) => {
      const techAppts = appointments.filter((a) => a.staff_id === tech.id || a.staff_name === tech.name);
      const completed = techAppts.filter((a) => a.status === 'completed');
      const hoursServiced = Math.round((completed.length * 60) / 60);

      return {
        ...tech,
        name: tech.name || tech.fullname || 'Technician',
        experience_years: tech.experience_years || 0,
        specialties: tech.specialties || 'General',
        totalBookings: techAppts.length,
        completedCount: completed.length,
        hoursServiced,
        rating: tech.rating || 0,
      };
    });
  }, [technicians, appointments]);

  // --- INVENTORY METRICS & CONSOLIDATED STOCK CONTROL ---
  const salonProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => p.salon_id === salon.id);
  }, [products, salon]);

  const salonOrders = useMemo(() => {
    if (!productOrders) return [];
    return productOrders.filter((o) => o.salon_id === salon.id);
  }, [productOrders, salon]);

  const inventoryMetrics = useMemo(() => {
    let totalUnitsInStock = 0;
    let totalInventoryValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    salonProducts.forEach((p) => {
      totalUnitsInStock += Number(p.stock_quantity || 0);
      totalInventoryValue += (Number(p.price || 0) * Number(p.stock_quantity || 0));
      if (Number(p.stock_quantity || 0) <= 0) {
        outOfStockCount += 1;
      } else if (Number(p.stock_quantity || 0) <= (p.low_stock_threshold || 5)) {
        lowStockCount += 1;
      }
    });

    const pendingOrders = salonOrders.filter((o) => o.status === 'pending_pickup' || o.status === 'ready_for_pickup');
    const completedOrders = salonOrders.filter((o) => o.status === 'completed');
    const pickupRevenue = salonOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    return {
      totalProducts: salonProducts.length,
      totalUnitsInStock,
      totalInventoryValue,
      lowStockCount,
      outOfStockCount,
      pendingPickupOrdersCount: pendingOrders.length,
      completedPickupOrdersCount: completedOrders.length,
      pickupRevenue,
    };
  }, [salonProducts, salonOrders]);

  // Integrated Financial P&L Calculation for Executive Overview & Master Dossier
  const profitRevenueData: ProfitRevenueReportData = useMemo(() => {
    const laborPercent = 40;
    const suppliesPercent = 15;
    const overheadPercent = 8;

    const validAppts = appointments.filter((a) => a.status !== 'cancelled');
    const validOrders = (productOrders || []).filter((o) => o.status !== 'cancelled');

    const totalServices = validAppts.reduce((sum, a) => sum + getApptIncome(a), 0);
    const totalRetail = validOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const grossRev = totalServices + totalRetail;
    const labor = Math.round(totalServices * (laborPercent / 100));
    const supplies = Math.round(totalServices * (suppliesPercent / 100) + totalRetail * 0.45);
    const overhead = Math.round(grossRev * (overheadPercent / 100));
    const totalExp = labor + supplies + overhead;
    const profit = grossRev - totalExp;
    const margin = grossRev > 0 ? (profit / grossRev) * 100 : 0;
    const totalTx = validAppts.length + validOrders.length;
    const avgTicket = totalTx > 0 ? Math.round(grossRev / totalTx) : 0;

    const periodList: FinancialPeriodItem[] = [];

    if (financialTimeGrain === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const dAppts = validAppts.filter((a) => a.appointment_date === dateStr);
        const dOrders = validOrders.filter((o) => (o.pickup_date || o.created_at?.split('T')[0]) === dateStr);
        const sRev = dAppts.reduce((sum, a) => sum + getApptIncome(a), 0);
        const rRev = dOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        const tRev = sRev + rRev;
        const lExp = Math.round(sRev * (laborPercent / 100));
        const supExp = Math.round(sRev * (suppliesPercent / 100) + rRev * 0.45);
        const ovExp = Math.round(tRev * (overheadPercent / 100));
        const tExp = lExp + supExp + ovExp;
        const p = tRev - tExp;

        periodList.push({
          periodLabel: `${dayName}, ${monthDay}`,
          shortLabel: dayName,
          dateKey: dateStr,
          servicesRevenue: sRev,
          retailRevenue: rRev,
          totalRevenue: tRev,
          appointmentCount: dAppts.length,
          orderCount: dOrders.length,
          laborExpense: lExp,
          suppliesExpense: supExp,
          overheadExpense: ovExp,
          totalExpenses: tExp,
          netProfit: p,
          profitMargin: tRev > 0 ? (p / tRev) * 100 : 0,
          averageTicket: (dAppts.length + dOrders.length) > 0 ? Math.round(tRev / (dAppts.length + dOrders.length)) : 0,
        });
      }
    } else if (financialTimeGrain === 'weekly') {
      for (let i = 3; i >= 0; i--) {
        const start = new Date();
        start.setDate(start.getDate() - (i + 1) * 7);
        const end = new Date();
        end.setDate(end.getDate() - i * 7);

        const wAppts = validAppts.filter((a) => {
          if (!a.appointment_date) return false;
          const ad = new Date(a.appointment_date);
          return ad >= start && ad <= end;
        });
        const wOrders = validOrders.filter((o) => {
          const odStr = o.pickup_date || o.created_at?.split('T')[0];
          if (!odStr) return false;
          const od = new Date(odStr);
          return od >= start && od <= end;
        });

        const sRev = wAppts.reduce((sum, a) => sum + getApptIncome(a), 0);
        const rRev = wOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        const tRev = sRev + rRev;
        const lExp = Math.round(sRev * (laborPercent / 100));
        const supExp = Math.round(sRev * (suppliesPercent / 100) + rRev * 0.45);
        const ovExp = Math.round(tRev * (overheadPercent / 100));
        const tExp = lExp + supExp + ovExp;
        const p = tRev - tExp;

        periodList.push({
          periodLabel: i === 0 ? 'Current Week' : `${i} Weeks Ago`,
          shortLabel: `W-${i === 0 ? 'Now' : i}`,
          dateKey: `W${i}`,
          servicesRevenue: sRev,
          retailRevenue: rRev,
          totalRevenue: tRev,
          appointmentCount: wAppts.length,
          orderCount: wOrders.length,
          laborExpense: lExp,
          suppliesExpense: supExp,
          overheadExpense: ovExp,
          totalExpenses: tExp,
          netProfit: p,
          profitMargin: tRev > 0 ? (p / tRev) * 100 : 0,
          averageTicket: (wAppts.length + wOrders.length) > 0 ? Math.round(tRev / (wAppts.length + wOrders.length)) : 0,
        });
      }
    } else if (financialTimeGrain === 'yearly') {
      const currentYear = new Date().getFullYear();
      for (let y = currentYear - 2; y <= currentYear; y++) {
        const yAppts = validAppts.filter((a) => a.appointment_date?.startsWith(String(y)));
        const yOrders = validOrders.filter((o) => (o.pickup_date || o.created_at?.split('T')[0])?.startsWith(String(y)));
        const sRev = yAppts.reduce((sum, a) => sum + getApptIncome(a), 0);
        const rRev = yOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        const tRev = sRev + rRev;
        const lExp = Math.round(sRev * (laborPercent / 100));
        const supExp = Math.round(sRev * (suppliesPercent / 100) + rRev * 0.45);
        const ovExp = Math.round(tRev * (overheadPercent / 100));
        const tExp = lExp + supExp + ovExp;
        const p = tRev - tExp;

        periodList.push({
          periodLabel: `Year ${y}`,
          shortLabel: String(y),
          dateKey: String(y),
          servicesRevenue: sRev,
          retailRevenue: rRev,
          totalRevenue: tRev,
          appointmentCount: yAppts.length,
          orderCount: yOrders.length,
          laborExpense: lExp,
          suppliesExpense: supExp,
          overheadExpense: ovExp,
          totalExpenses: tExp,
          netProfit: p,
          profitMargin: tRev > 0 ? (p / tRev) * 100 : 0,
          averageTicket: (yAppts.length + yOrders.length) > 0 ? Math.round(tRev / (yAppts.length + yOrders.length)) : 0,
        });
      }
    } else {
      // Monthly (last 6 months)
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const monthKey = `${yyyy}-${mm}`;
        const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const shortLabel = d.toLocaleDateString('en-US', { month: 'short' });

        const mAppts = validAppts.filter((a) => a.appointment_date?.startsWith(monthKey));
        const mOrders = validOrders.filter((o) => (o.pickup_date || o.created_at?.split('T')[0])?.startsWith(monthKey));
        const sRev = mAppts.reduce((sum, a) => sum + getApptIncome(a), 0);
        const rRev = mOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        const tRev = sRev + rRev;
        const lExp = Math.round(sRev * (laborPercent / 100));
        const supExp = Math.round(sRev * (suppliesPercent / 100) + rRev * 0.45);
        const ovExp = Math.round(tRev * (overheadPercent / 100));
        const tExp = lExp + supExp + ovExp;
        const p = tRev - tExp;

        periodList.push({
          periodLabel: monthLabel,
          shortLabel,
          dateKey: monthKey,
          servicesRevenue: sRev,
          retailRevenue: rRev,
          totalRevenue: tRev,
          appointmentCount: mAppts.length,
          orderCount: mOrders.length,
          laborExpense: lExp,
          suppliesExpense: supExp,
          overheadExpense: ovExp,
          totalExpenses: tExp,
          netProfit: p,
          profitMargin: tRev > 0 ? (p / tRev) * 100 : 0,
          averageTicket: (mAppts.length + mOrders.length) > 0 ? Math.round(tRev / (mAppts.length + mOrders.length)) : 0,
        });
      }
    }

    return {
      salonName: salon.salon_name,
      salonAddress: salon.address || salon.city || 'Salon Physical Premises',
      contactNumber: salon.phone || 'N/A',
      generatedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timeGrain: financialTimeGrain,
      timeRange: financialTimeGrain === 'daily' ? 'Past 7 Days' : financialTimeGrain === 'weekly' ? 'Past 4 Weeks' : financialTimeGrain === 'yearly' ? 'Past 3 Years' : 'Past 6 Months',
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
        totalAppointments: validAppts.length,
        totalOrders: validOrders.length,
        averageTicket: avgTicket,
        peakPeriod: periodList[periodList.length - 1]?.periodLabel || 'Current Period',
        peakProfit: Math.max(...periodList.map((p) => p.netProfit), 0),
        peakRevenue: Math.max(...periodList.map((p) => p.totalRevenue), 0),
      },
      periods: periodList,
    };
  }, [salon, appointments, services, productOrders, financialTimeGrain]);

  // Top Shelved Products Preview for Analytics
  const topShelvedProducts = useMemo(() => {
    return [...salonProducts]
      .sort((a, b) => (b.price * b.stock_quantity) - (a.price * a.stock_quantity))
      .slice(0, 5);
  }, [salonProducts]);

  // Low Stock Alert Items
  const lowStockAlertItems = useMemo(() => {
    return salonProducts.filter((p) => p.stock_quantity <= (p.low_stock_threshold || 5));
  }, [salonProducts]);

  // Compiled Complete Report Data Structure for Visual HTML and Downloadable PDF/CSV
  const storeReportData: StoreReportData = useMemo(() => {
    const vipCount = crmClients.filter((c) => c.tier === 'VIP Diamond').length;
    const regularCount = crmClients.filter((c) => c.tier === 'Loyal Regular').length;
    const newCount = crmClients.filter((c) => c.tier === 'New Client').length;
    const atRiskCount = crmClients.filter((c) => c.tier === 'At-Risk').length;
    const retentionRateVal = crmClients.length > 0 ? Math.round(((vipCount + regularCount) / crmClients.length) * 100) : 0;

    const clientList = crmClients.map((c) => ({
      name: c.name,
      phone: c.phone,
      email: c.email,
      completedVisits: c.completedVisits,
      lastVisitDate: c.lastVisitDate,
      tier: c.tier,
      favoriteService: c.favoriteService,
      note: clientNotes[c.name] || '',
    }));

    return {
      salonName: salon.salon_name,
      salonAddress: salon.address || `${salon.city}, Philippines`,
      contactNumber: salon.phone || '0917-888-GLAM',
      generatedDate: new Date().toLocaleDateString('en-US', { dateStyle: 'long' }),
      timeRange: timeRange === 'all' ? 'All Time' : timeRange === 'month' ? 'Current Month' : timeRange,
      stats,
      categoryBreakdown,
      monthlyTrend,
      volumeSummary: {
        grain: volumeTimeGrain,
        metric: volumeMetric,
        totalVolume: volumeTrendData.reduce((sum, b) => sum + b.count, 0),
        totalIncome: volumeTrendData.reduce((sum, b) => sum + b.income, 0),
        peakPeriod: peakVolumePeriod?.label || 'Current Period',
        trend: volumeTrendData,
      },
      treatmentMix: {
        timeGrain: treatmentTimeGrain,
        metric: treatmentMetric,
        categories: treatmentMixData.categories,
        topServices: treatmentMixData.topServices.map((s) => ({
          name: s.name,
          category: s.category,
          bookings: s.count,
          income: s.income,
        })),
      },
      inventorySummary: inventoryMetrics,
      inventoryItems: salonProducts.map((p) => ({
        name: p.name,
        sku: p.sku || 'N/A',
        category: p.category,
        price: p.price,
        stock_quantity: p.stock_quantity,
        low_stock_threshold: p.low_stock_threshold || 5,
        status: p.stock_quantity <= 0 ? 'Out of Stock' : p.stock_quantity <= (p.low_stock_threshold || 5) ? 'Low Stock' : 'In Stock',
        inventoryValue: p.price * p.stock_quantity,
      })),
      pickupOrders: salonOrders.map((o) => ({
        orderNumber: o.order_number || `ORD-${o.id}`,
        customerName: o.customer_name || 'In-Store Client',
        customerPhone: o.customer_phone || 'N/A',
        itemsSummary: o.items ? o.items.map((i) => `${i.product_name} (x${i.quantity})`).join(', ') : 'Retail Products',
        totalAmount: o.total_amount,
        pickupDate: o.pickup_date || 'In-Store Pickup',
        status: o.status,
      })),
      staffScorecard,
      profitRevenueSummary: profitRevenueData,
      crmSummary: {
        totalClients: crmClients.length,
        vipCount,
        regularCount,
        newCount,
        atRiskCount,
        retentionRate: retentionRateVal,
      },
      clientList,
    };
  }, [
    salon,
    timeRange,
    stats,
    categoryBreakdown,
    monthlyTrend,
    volumeTimeGrain,
    volumeMetric,
    volumeTrendData,
    peakVolumePeriod,
    treatmentTimeGrain,
    treatmentMetric,
    treatmentMixData,
    inventoryMetrics,
    salonProducts,
    salonOrders,
    staffScorecard,
    profitRevenueData,
    crmClients,
    clientNotes,
  ]);

  // Comprehensive CSV Report Export containing all statistics and full product inventory
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Nail Glam Hub - All-in-One Store Performance, Financial P&L, Analytics & Inventory Dossier\n`;
    csvContent += `Salon Name: "${salon.salon_name}"\n`;
    csvContent += `Generated Date: "${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}"\n`;
    csvContent += `Reporting Scope: "${timeRange === 'all' ? 'All Time' : timeRange}"\n\n`;

    // 1. Audited Operating Profit & Loss Statement
    csvContent += `--- 1. AUDITED OPERATING PROFIT & LOSS (P&L) STATEMENT (${financialTimeGrain.toUpperCase()}) ---\n`;
    csvContent += `Period Label,Completed Appts,Retail Orders,Services Revenue (PHP),Retail Sales (PHP),Gross Revenue (PHP),Technician Commissions (PHP),Supplies & COGS (PHP),Facility Overhead (PHP),Total Operating Costs (PHP),Net Retained Profit (PHP),Profit Margin %\n`;
    profitRevenueData.periods.forEach((p) => {
      csvContent += `"${p.periodLabel}",${p.appointmentCount},${p.orderCount},${p.servicesRevenue},${p.retailRevenue},${p.totalRevenue},-${p.laborExpense},-${p.suppliesExpense},-${p.overheadExpense},-${p.totalExpenses},${p.netProfit},${p.profitMargin.toFixed(1)}%\n`;
    });
    csvContent += `P&L Totals: Gross Revenue: ₱${profitRevenueData.summary.totalGrossRevenue.toLocaleString()} | Operating Costs: -₱${profitRevenueData.summary.totalExpenses.toLocaleString()} | Net Operating Profit: ₱${profitRevenueData.summary.netProfit.toLocaleString()} | Operating Margin: ${profitRevenueData.summary.profitMargin.toFixed(1)}%\n\n`;

    // 2. Store Operational Summary
    csvContent += `--- 2. STORE OPERATIONAL & APPOINTMENT METRICS ---\n`;
    csvContent += `Metric,Value\n`;
    csvContent += `Total Bookings Recorded,${stats.totalAppointments}\n`;
    csvContent += `Completed In-Store Sessions,${stats.completedCount}\n`;
    csvContent += `Confirmed Upcoming Sessions,${stats.confirmedCount}\n`;
    csvContent += `Average Session Duration,${stats.avgDuration} mins\n`;
    csvContent += `Fulfillment Rate,${stats.completionRate}%\n`;
    csvContent += `Estimated Completed Services Revenue (PHP),₱${stats.totalRevenue.toLocaleString()}\n\n`;

    // 3. Volume & Revenue Granular Trend
    csvContent += `--- 3. APPOINTMENT VOLUME & REVENUE BREAKDOWN (${volumeTimeGrain.toUpperCase()} • ${volumeMetric.toUpperCase()}) ---\n`;
    csvContent += `Period Label,Bookings Count,Estimated Income (PHP),Primary Display Value\n`;
    volumeTrendData.forEach((b) => {
      csvContent += `"${b.label}",${b.count},${b.income},"${b.formattedValue}"\n`;
    });
    csvContent += `\n`;

    // 4. Treatment Mix Popularity & Revenue
    csvContent += `--- 4. TREATMENT CATEGORY POPULARITY & REVENUE (${treatmentTimeGrain.toUpperCase()}) ---\n`;
    csvContent += `Category Name,Bookings Share,Total Bookings,Category Revenue (PHP)\n`;
    treatmentMixData.categories.forEach((cat) => {
      csvContent += `"${cat.name}",${cat.percentage}%,${cat.count},${cat.income}\n`;
    });
    csvContent += `\n`;

    // 5. Retail Inventory & Stock Health Dataset
    csvContent += `--- 5. PRODUCT INVENTORY & STOCK VALUATION DATASET ---\n`;
    csvContent += `Product Name,SKU,Category,Retail Price (PHP),Stock On Hand,Low Stock Threshold,Stock Status,Total Inventory Value (PHP)\n`;
    salonProducts.forEach((p) => {
      const stockVal = p.price * p.stock_quantity;
      const status = p.stock_quantity <= 0 ? 'Out of Stock' : p.stock_quantity <= (p.low_stock_threshold || 5) ? 'Low Stock' : 'In Stock';
      csvContent += `"${p.name}","${p.sku || 'N/A'}","${p.category}",${p.price},${p.stock_quantity},${p.low_stock_threshold || 5},"${status}",${stockVal}\n`;
    });
    csvContent += `\n`;
    csvContent += `Inventory Summary Valuation: Total Products: ${inventoryMetrics.totalProducts} | Total Units: ${inventoryMetrics.totalUnitsInStock} | Total Stock Value: ₱${inventoryMetrics.totalInventoryValue.toLocaleString()} | Low/Out Stock: ${inventoryMetrics.lowStockCount + inventoryMetrics.outOfStockCount}\n\n`;

    // 6. In-Store Customer Pickup Reservations
    csvContent += `--- 6. IN-STORE CUSTOMER PICKUP RESERVATIONS ---\n`;
    csvContent += `Order Number,Customer Name,Phone Number,Pickup Date,Items Summary,Total Amount (PHP),Status\n`;
    salonOrders.forEach((o) => {
      const items = o.items ? o.items.map((i) => `${i.product_name} (x${i.quantity})`).join('; ') : 'Retail Products';
      csvContent += `"${o.order_number || `ORD-${o.id}`}","${o.customer_name || 'Client'}","${o.customer_phone || 'N/A'}","${o.pickup_date || 'N/A'}","${items}",${o.total_amount},"${o.status}"\n`;
    });
    csvContent += `\n`;

    // 7. Staff Productivity Scorecard
    csvContent += `--- 7. STAFF TALENT & PRODUCTIVITY SCORECARD ---\n`;
    csvContent += `Staff Name,Specialties,Experience Years,Completed Sessions,Hours Serviced,Rating\n`;
    staffScorecard.forEach((s) => {
      csvContent += `"${s.name}","${s.specialties}",${s.experience_years},${s.completedCount},${s.hoursServiced},${s.rating}\n`;
    });
    csvContent += `\n`;

    // 8. CRM Client Directory
    csvContent += `--- 8. CRM CLIENT DIRECTORY & RETENTION PROFILES ---\n`;
    csvContent += `Client Name,Phone,Email,Completed Visits,Last Visit Date,Loyalty Tier,Preferred Service,CRM Notes\n`;
    crmClients.forEach((c) => {
      const note = (clientNotes[c.name] || '').replace(/,/g, ';');
      csvContent += `"${c.name}","${c.phone}","${c.email}",${c.completedVisits},"${c.lastVisitDate}","${c.tier}","${c.favoriteService}","${note}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${salon.salon_name.replace(/\s+/g, '_')}_All_In_One_Master_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('All-in-One Master CSV report exported successfully');
  };

  const handleDownloadHtmlReport = () => {
    const html = generateStoreVisualHtmlReport(storeReportData);
    const filename = `${salon.salon_name.replace(/\s+/g, '_')}_Decision_Report_${new Date().toISOString().split('T')[0]}.html`;
    downloadFile(html, filename, 'text/html');
    showToast('Visual Decision Report (HTML) downloaded');
  };

  const handlePrintReport = () => {
    const html = generateStoreVisualHtmlReport(storeReportData);
    openPrintableReport(html);
    showToast('Opening print preview for PDF report');
  };

  const handleSaveNote = (clientName: string) => {
    setClientNotes((prev) => ({
      ...prev,
      [clientName]: noteInput,
    }));
    setEditingNoteClient(null);
    setNoteInput('');
    showToast(`CRM note updated for ${clientName}`);
  };

  const handleSendReengagementPromo = (clientName: string) => {
    showToast(`VIP ${promoDiscount}% voucher dispatched to ${clientName} via SMS & Email`);
    setPromoModalClient(null);
  };

  const handleSaveReply = (reviewId: number) => {
    if (!replyText.trim()) return;
    setOwnerReplies((prev) => ({ ...prev, [reviewId]: replyText }));
    setReplyingReviewId(null);
    setReplyText('');
    showToast('Owner response published to public review feed');
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Notice Banner */}
      <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200/80 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Store className="w-5 h-5 text-purple-700 shrink-0" />
          <div className="text-xs text-purple-950">
            <span className="font-bold">Physical Salon Directory & Reservation System:</span> Customers browse treatments and book appointments through the website. All services, consultations, and payments are settled in-person at your physical salon premises.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDecisionModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>All-in-One Master Report</span>
          </button>
        </div>
      </div>

      {/* Report Header Controls & Period Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-pink-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-serif font-bold text-gray-900">
              Store Executive Reports & CRM Analytics
            </h3>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
              Real-time
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Store appointment volume, client retention intelligence, treatment mix popularity, and staff scorecards.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Time Filter Pills */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            {(['today', 'week', 'month', 'quarter', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                  timeRange === range
                    ? 'bg-white text-purple-900 shadow-xs font-bold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {range === 'all' ? 'All Time' : range === 'month' ? 'This Month' : range === 'week' ? 'This Week' : range}
              </button>
            ))}
          </div>

          {/* Master All-in-One Report Action */}
          <button
            onClick={() => setShowDecisionModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-800 to-pink-700 hover:from-purple-900 hover:to-pink-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>All-in-One Master Report</span>
          </button>

          {/* Print Master PDF Action */}
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-purple-700" />
            <span>Print Master (PDF)</span>
          </button>

          {/* Export All-in-One CSV Action */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Master CSV</span>
          </button>
        </div>
      </div>

      {/* 1. STORE OPERATIONAL & KEY PERFORMANCE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Completed In-Store Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-xs hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Completed Visits</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
              {stats.completedCount} Visits
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium text-emerald-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{stats.totalAppointments > 0 ? 'Current period' : 'No period data yet'}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              +{stats.confirmedCount} upcoming confirmed sessions
            </p>
          </div>
        </div>

        {/* Metric 2: Average Treatment Duration */}
        <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-xs hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Avg Session Duration</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
              {stats.avgDuration} mins
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium text-purple-600">
              <span>{averageTreatmentsPerClient ? `Avg ${averageTreatmentsPerClient} treatments per client` : 'No treatment data yet'}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Specialized Japanese & Russian techniques
            </p>
          </div>
        </div>

        {/* Metric 3: Booking Completion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-xs hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Booking Fulfillment Rate</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
              {stats.completionRate}%
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium text-blue-600">
              <span>{stats.completedCount} Completed / {stats.totalAppointments} Booked</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {cancellationRate ? `${cancellationRate}% of bookings cancelled` : 'No cancellation data yet'}
            </p>
          </div>
        </div>

        {/* Metric 4: Client Retention Rate */}
        <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-xs hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Repeat Client Retention</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
              {retentionRate}%
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium text-rose-600">
              <span>{crmClients.filter(c => c.completedVisits >= 2).length} repeat clients</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Based on {crmClients.length} total clients
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Target Progress Bar */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-950 rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-purple-200">
              Monthly In-Salon Bookings Benchmark
            </span>
            <h4 className="text-lg font-serif font-bold">
              {stats.completedCount + stats.confirmedCount} of {stats.monthlyTarget} Target Bookings
            </h4>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {stats.targetProgress}% Target Achieved
            </span>
          </div>
        </div>
        <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-pink-400 via-purple-300 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${stats.targetProgress}%` }}
          />
        </div>
      </div>

      {/* 2. EXECUTIVE OPERATING PROFIT & LOSS (P&L) FINANCIAL OVERVIEW */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h4 className="text-base font-serif font-bold text-gray-900">
                Executive Operating Profit & Loss (P&L) Health
              </h4>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                Audited Ledger
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Integrated salon profitability, service revenue vs retail product sales, technician commissions, and retained net profit.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Frequency Selector */}
            <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((grain) => (
                <button
                  key={grain}
                  type="button"
                  onClick={() => setFinancialTimeGrain(grain)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${
                    financialTimeGrain === grain
                      ? 'bg-purple-800 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {grain}
                </button>
              ))}
            </div>

            {/* Deep-Dive into All-in-One Master Modal */}
            <button
              type="button"
              onClick={() => setShowDecisionModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-purple-200/60"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              <span>Full P&L in All-in-One Report →</span>
            </button>
          </div>
        </div>

        {/* 4 Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100/80">
            <span className="text-xs font-semibold text-emerald-900 block">Gross Salon Revenue</span>
            <p className="text-2xl font-serif font-bold text-emerald-950 mt-1">
              ₱{profitRevenueData.summary.totalGrossRevenue.toLocaleString()}
            </p>
            <div className="text-[11px] text-emerald-700 mt-1 flex items-center justify-between">
              <span>Services: ₱{profitRevenueData.summary.totalServicesRevenue.toLocaleString()}</span>
              <span>Retail: ₱{profitRevenueData.summary.totalRetailRevenue.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100/80">
            <span className="text-xs font-semibold text-rose-900 block">Operating Costs & Expenses</span>
            <p className="text-2xl font-serif font-bold text-rose-950 mt-1">
              -₱{profitRevenueData.summary.totalExpenses.toLocaleString()}
            </p>
            <span className="text-[11px] text-rose-700 mt-1 block">
              Commissions (40%), Supplies (15%), Overhead (8%)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-900">Retained Net Profit</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200 text-purple-900">
                {profitRevenueData.summary.profitMargin.toFixed(1)}% Margin
              </span>
            </div>
            <p className="text-2xl font-serif font-bold text-purple-950 mt-1">
              ₱{profitRevenueData.summary.netProfit.toLocaleString()}
            </p>
            <span className="text-[11px] text-purple-700 mt-1 block">
              Direct salon owner operating earnings
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100/80">
            <span className="text-xs font-semibold text-blue-900 block">Average Ticket & Activity</span>
            <p className="text-2xl font-serif font-bold text-blue-950 mt-1">
              ₱{profitRevenueData.summary.averageTicket.toLocaleString()}
            </p>
            <span className="text-[11px] text-blue-700 mt-1 block">
              Across {profitRevenueData.summary.totalAppointments} visits & {profitRevenueData.summary.totalOrders || 0} retail orders
            </span>
          </div>
        </div>

        {/* Financial Flow & Allocation Summary */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
              <span>Revenue Composition</span>
              <span>
                Services {profitRevenueData.summary.totalGrossRevenue > 0 ? Math.round((profitRevenueData.summary.totalServicesRevenue / profitRevenueData.summary.totalGrossRevenue) * 100) : 100}% • Retail {profitRevenueData.summary.totalGrossRevenue > 0 ? Math.round((profitRevenueData.summary.totalRetailRevenue / profitRevenueData.summary.totalGrossRevenue) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden flex">
              <div
                className="bg-purple-600 h-full"
                style={{ width: `${profitRevenueData.summary.totalGrossRevenue > 0 ? (profitRevenueData.summary.totalServicesRevenue / profitRevenueData.summary.totalGrossRevenue) * 100 : 100}%` }}
                title="Services Revenue"
              />
              <div
                className="bg-pink-500 h-full"
                style={{ width: `${profitRevenueData.summary.totalGrossRevenue > 0 ? (profitRevenueData.summary.totalRetailRevenue / profitRevenueData.summary.totalGrossRevenue) * 100 : 0}%` }}
                title="Retail Products Sales"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <span className="text-gray-600">Salon Services</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
              <span className="text-gray-600">Retail Products</span>
            </div>
            <button
              type="button"
              onClick={() => setShowDecisionModal(true)}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 underline ml-2 cursor-pointer"
            >
              Export Statement in Master Dossier
            </button>
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC APPOINTMENT & REVENUE VOLUME TRENDS + TREATMENT POPULARITY MIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointment & Revenue Volume Trend Visualization with Granularity & Metric Toggles */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-pink-100 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <h4 className="text-sm font-serif font-bold text-gray-900">
                  Store Appointment & Revenue Volume
                </h4>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {volumeMetric === 'bookings'
                  ? `Appointment booking count across ${volumeTimeGrain} intervals`
                  : `Estimated salon services income (PHP) across ${volumeTimeGrain} intervals`}
              </p>
            </div>

            {/* Controls: Metric Toggle & Time Grain Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Metric Toggle: Bookings vs Income */}
              <div className="inline-flex rounded-xl bg-gray-100 p-0.5 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setVolumeMetric('bookings')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    volumeMetric === 'bookings'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Bookings
                </button>
                <button
                  type="button"
                  onClick={() => setVolumeMetric('income')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    volumeMetric === 'income'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Income (₱)
                </button>
              </div>

              {/* Time Grain Toggle: Daily | Weekly | Monthly | Yearly */}
              <div className="inline-flex rounded-xl bg-purple-50 p-0.5 border border-purple-200">
                {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((grain) => (
                  <button
                    key={grain}
                    type="button"
                    onClick={() => setVolumeTimeGrain(grain)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg capitalize transition-all cursor-pointer ${
                      volumeTimeGrain === grain
                        ? 'bg-purple-900 text-white shadow-xs'
                        : 'text-purple-800 hover:bg-purple-100/70'
                    }`}
                  >
                    {grain}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats Strip for Current Volume Window */}
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs">
            <div>
              <span className="text-[10px] text-gray-500 block uppercase font-semibold">Total in View</span>
              <span className="font-serif font-bold text-gray-900 text-sm">
                {volumeMetric === 'bookings'
                  ? `${volumeTrendData.reduce((acc, b) => acc + b.count, 0)} Bookings`
                  : `₱${volumeTrendData.reduce((acc, b) => acc + b.income, 0).toLocaleString()}`}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block uppercase font-semibold">Peak Period</span>
              <span className="font-serif font-bold text-purple-900 text-sm truncate block">
                {peakVolumePeriod?.shortLabel || 'N/A'} ({peakVolumePeriod?.formattedValue})
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block uppercase font-semibold">Granularity</span>
              <span className="font-semibold text-emerald-700 text-sm capitalize">
                {volumeTimeGrain} View
              </span>
            </div>
          </div>

          {/* Dynamic Bar Visualizer */}
          <div className="pt-2 flex items-end justify-between gap-2 sm:gap-3 h-52 border-b border-gray-100 pb-2">
            {volumeTrendData.map((bar, i) => {
              const maxValue = Math.max(...volumeTrendData.map((t) => t.value), 1);
              const heightPercent = bar.value === 0 ? 6 : Math.max(8, Math.round((bar.value / maxValue) * 100));
              const height = `${heightPercent}%`;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                  {/* Floating Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 absolute -top-8 bg-gray-900 text-white text-[10px] py-1 px-2 rounded-md shadow-lg whitespace-nowrap z-20">
                    <span className="font-bold">{bar.label}:</span> {bar.formattedValue} ({bar.count} appts)
                  </div>

                  <span className="text-[10px] font-bold text-gray-600 opacity-80 group-hover:opacity-100 transition-opacity truncate max-w-full">
                    {volumeMetric === 'bookings' ? bar.count : `₱${(bar.income / 1000).toFixed(bar.income >= 10000 ? 0 : 1)}k`}
                  </span>

                  <div
                    className={`w-full rounded-t-xl transition-all duration-300 group-hover:scale-105 cursor-pointer ${
                      bar.isActive
                        ? 'bg-gradient-to-t from-purple-700 via-purple-600 to-pink-500 shadow-md shadow-purple-500/20'
                        : 'bg-purple-100 hover:bg-purple-200'
                    }`}
                    style={{ height }}
                  />

                  <span className={`text-[10px] font-medium truncate w-full text-center ${bar.isActive ? 'font-bold text-purple-900' : 'text-gray-500'}`}>
                    {bar.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-700"></span> Active Period
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-100"></span> Prior Periods
              </span>
            </div>
            <span className="font-semibold text-purple-900">
              {peakBookingDay ? `Historical Peak Day: ${peakBookingDay[0]} (${peakBookingDay[1]} bookings)` : 'Peak Day: Calculating...'}
            </span>
          </div>
        </div>

        {/* Treatment Popularity Mix with Daily, Weekly, Monthly, Yearly, All Time Toggles */}
        <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-col gap-2 pb-2 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-serif font-bold text-gray-900 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-pink-600" />
                  Treatment Popularity Mix
                </h4>
                <button
                  type="button"
                  onClick={() => setTreatmentMetric((prev) => (prev === 'bookings' ? 'income' : 'bookings'))}
                  className="text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 transition-colors cursor-pointer"
                >
                  By: {treatmentMetric === 'bookings' ? 'Bookings' : 'Income (₱)'}
                </button>
              </div>

              {/* Treatment Time Grain Toggle: Daily | Weekly | Monthly | Yearly | All Time */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {(['daily', 'weekly', 'monthly', 'yearly', 'all'] as const).map((grain) => (
                  <button
                    key={grain}
                    type="button"
                    onClick={() => setTreatmentTimeGrain(grain)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md capitalize transition-all cursor-pointer shrink-0 ${
                      treatmentTimeGrain === grain
                        ? 'bg-pink-600 text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {grain === 'all' ? 'All Time' : grain}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-gray-500 pt-2 pb-1 flex justify-between">
              <span>{treatmentMixData.filteredCount} appointments analyzed</span>
              <span className="font-semibold text-purple-900">
                {treatmentMetric === 'bookings'
                  ? `${treatmentMixData.totalBookings} total bookings`
                  : `₱${treatmentMixData.totalIncome.toLocaleString()} services revenue`}
              </span>
            </div>

            {/* Category Breakdown Bars */}
            <div className="space-y-3 pt-1">
              {treatmentMixData.categories.map((cat, i) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-700">{cat.name}</span>
                    <span className="text-purple-900">
                      {treatmentMetric === 'bookings'
                        ? `${cat.count} bookings (${cat.percentage}%)`
                        : `₱${cat.income.toLocaleString()} (${cat.percentage}%)`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        i === 0
                          ? 'bg-purple-600'
                          : i === 1
                          ? 'bg-pink-500'
                          : i === 2
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(cat.value > 0 ? 8 : 0, cat.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Top Individual Services */}
            {treatmentMixData.topServices.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Top Treatments in this Scope
                </span>
                {treatmentMixData.topServices.slice(0, 3).map((srv, idx) => (
                  <div key={srv.name} className="flex items-center justify-between text-[11px] py-0.5">
                    <span className="text-gray-800 font-medium truncate max-w-[160px]">
                      {idx + 1}. {srv.name}
                    </span>
                    <span className="text-purple-700 font-bold">
                      {treatmentMetric === 'bookings' ? `${srv.count} visits` : `₱${srv.income.toLocaleString()}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900 space-y-1 mt-3">
            <p className="font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Dynamic Scope Insight
            </p>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              Viewing <span className="font-bold text-purple-900">{treatmentTimeGrain}</span> popularity by <span className="font-bold text-purple-900">{treatmentMetric}</span>.
              {treatmentMixData.categories[0] && treatmentMixData.categories[0].value > 0 && (
                <span> {treatmentMixData.categories[0].name} leads demand at {treatmentMixData.categories[0].percentage}% share.</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 3. CRM & CLIENT INTELLIGENCE HUB */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-700" />
                Salon Client Directory & CRM Intelligence
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold">
                {crmClients.length} Profiles
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Client visit histories, customized care notes, and loyalty re-engagement campaigns.
            </p>
          </div>

          {/* CRM Re-engagement Action Alert */}
          {crmClients.some((c) => c.tier === 'At-Risk') && (
            <button
              onClick={() => {
                const atRisk = crmClients.filter((c) => c.tier === 'At-Risk');
                showToast(`Sent 15% VIP Re-engagement voucher to ${atRisk.length} inactive client(s)`);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
              <span>Re-engage {crmClients.filter((c) => c.tier === 'At-Risk').length} Inactive Clients</span>
            </button>
          )}
        </div>

        {/* CRM Search & Segment Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={crmSearch}
              onChange={(e) => setCrmSearch(e.target.value)}
              placeholder="Search client name, phone, email..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
            />
          </div>

          {/* Segment Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
            {[
              { id: 'all', label: 'All Clients', count: crmClients.length },
              { id: 'vip', label: 'VIP Diamond', count: crmClients.filter((c) => c.tier === 'VIP Diamond').length },
              { id: 'regular', label: 'Regulars', count: crmClients.filter((c) => c.tier === 'Loyal Regular').length },
              { id: 'new', label: 'First Timers', count: crmClients.filter((c) => c.tier === 'New Client').length },
              { id: 'at_risk', label: 'At-Risk (>30d)', count: crmClients.filter((c) => c.tier === 'At-Risk').length },
            ].map((seg) => (
              <button
                key={seg.id}
                onClick={() => setCrmSegment(seg.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  crmSegment === seg.id
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {seg.label} ({seg.count})
              </button>
            ))}
          </div>
        </div>

        {/* CRM Client Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((client) => {
            const hasNote = Boolean(clientNotes[client.name]);
            const isEditing = editingNoteClient === client.name;

            return (
              <div
                key={client.name}
                className="p-4 rounded-2xl border border-pink-100 hover:border-purple-200 bg-white shadow-xs space-y-3 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                      {client.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs sm:text-sm font-bold text-gray-900">{client.name}</h5>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                            client.tier === 'VIP Diamond'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : client.tier === 'Loyal Regular'
                              ? 'bg-purple-100 text-purple-800'
                              : client.tier === 'At-Risk'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {client.tier}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {client.phone} • {client.email}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPromoModalClient(client.name);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 text-[11px] font-bold border border-pink-200 transition-colors cursor-pointer"
                  >
                    + Offer Promo
                  </button>
                </div>

                {/* Client Stats Row */}
                <div className="grid grid-cols-2 gap-2 py-2 px-3 bg-gray-50/70 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">Completed Visits</span>
                    <span className="font-bold text-purple-900">{client.completedVisits} visits</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">Last Visit</span>
                    <span className="font-bold text-gray-800">{client.lastVisitDate}</span>
                  </div>
                </div>

                {/* Preferences */}
                <div className="text-[11px] text-gray-600 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-700">Preferred:</span>
                  <span className="bg-pink-50 text-pink-800 px-2 py-0.5 rounded-md font-medium">
                    {client.favoriteService}
                  </span>
                  <span>•</span>
                  <span>Artist: {client.preferredTechnician}</span>
                </div>

                {/* CRM Private Notes Box */}
                <div className="pt-2 border-t border-gray-100">
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Client nail shape preference, cuticle notes, product allergies..."
                        className="w-full p-2 text-xs bg-gray-50 border border-purple-300 rounded-xl focus:bg-white focus:outline-none"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingNoteClient(null)}
                          className="px-2.5 py-1 rounded-lg border border-gray-300 text-xs text-gray-600"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveNote(client.name)}
                          className="px-3 py-1 rounded-lg bg-purple-700 text-white text-xs font-semibold"
                        >
                          Save CRM Note
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[11px] text-gray-500 italic">
                        <span className="font-semibold text-purple-950 not-italic">Private CRM Note: </span>
                        {hasNote ? `"${clientNotes[client.name]}"` : 'No custom notes recorded yet.'}
                      </div>
                      <button
                        onClick={() => {
                          setEditingNoteClient(client.name);
                          setNoteInput(clientNotes[client.name] || '');
                        }}
                        className="p-1 text-gray-400 hover:text-purple-700 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer shrink-0"
                        title="Edit Client Note"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. STAFF PRODUCTIVITY & CAPACITY SCORECARD */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              Specialist & Artist Productivity Scorecard
            </h4>
            <p className="text-xs text-gray-500">
              Completed bookings volume, service hours logged, and client satisfaction ratings.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase font-semibold text-[10px]">
                <th className="pb-3 font-medium">Technician</th>
                <th className="pb-3 font-medium">Specialties</th>
                <th className="pb-3 font-medium text-center">Completed Sessions</th>
                <th className="pb-3 font-medium text-center">Hours Serviced</th>
                <th className="pb-3 font-medium text-center">Satisfaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staffScorecard.map((tech) => (
                <tr key={tech.id} className="hover:bg-pink-50/30 transition-colors">
                  <td className="py-3.5 pr-3">
                    <div className="flex items-center gap-2.5">
                      {tech.avatar ? (
                        <img
                          src={tech.avatar}
                          alt={tech.name}
                          className="w-8 h-8 rounded-full object-cover border border-pink-200 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center border border-pink-200 shrink-0">
                          <span className="text-[10px] font-bold">{tech.name?.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-gray-900 block">{tech.name}</span>
                        <span className="text-[10px] text-gray-400">{tech.experience_years} yrs experience</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 pr-3 text-gray-600 max-w-xs truncate">
                    {tech.specialties}
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-gray-900">
                    {tech.completedCount} / {tech.totalBookings}
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-purple-900">
                    {tech.hoursServiced} hrs
                  </td>
                  <td className="py-3.5 pl-3 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-[11px]">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {tech.rating ? tech.rating : 'Not rated yet'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. CUSTOMER REVIEWS SENTIMENT & OWNER RESPONSES */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              Client Reviews & Satisfaction Sentiment
            </h4>
            <p className="text-xs text-gray-500">
              Verified customer feedback and instant owner reply management.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-serif font-bold text-gray-900">
              {salon.avg_rating || 0}
            </span>
            <div className="text-[10px] text-gray-400 leading-tight">
              <div className="flex text-amber-400">
                {'★★★★★'}
              </div>
              <span>{reviews.length} Reviews</span>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-3">
          {reviews.slice(0, 3).map((rev) => {
            const hasReply = Boolean(ownerReplies[rev.id]);
            const isReplying = replyingReviewId === rev.id;

            return (
              <div
                key={rev.id}
                className="p-4 rounded-2xl bg-pink-50/30 border border-pink-100/80 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{rev.customer_name || rev.user_name || `Customer #${rev.customer_id || rev.user_id}`}</span>
                    <div className="flex text-amber-400 text-xs">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed italic">
                  "{rev.review_text || rev.comment || 'No review text provided'}"
                </p>

                {/* Owner Reply Box */}
                {hasReply && (
                  <div className="p-3 bg-white rounded-xl border border-purple-100 text-xs space-y-1">
                    <span className="font-bold text-purple-900 flex items-center gap-1.5 text-[11px]">
                      <Store className="w-3 h-3" /> Salon Owner Response:
                    </span>
                    <p className="text-gray-600 text-[11px]">{ownerReplies[rev.id]}</p>
                  </div>
                )}

                {isReplying ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your public reply to this client review..."
                      className="w-full p-2 text-xs bg-white border border-purple-300 rounded-xl focus:outline-none"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setReplyingReviewId(null)}
                        className="px-2.5 py-1 text-xs text-gray-500 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveReply(rev.id)}
                        className="px-3 py-1 bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        Post Response
                      </button>
                    </div>
                  </div>
                ) : (
                  !hasReply && (
                    <button
                      onClick={() => {
                        setReplyingReviewId(rev.id);
                        setReplyText('');
                      }}
                      className="text-xs text-purple-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" /> Reply as Owner
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. STORE RETAIL INVENTORY & IN-STORE PICKUP MANAGEMENT */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-700" />
              <h4 className="text-base font-serif font-bold text-gray-900">
                Store Retail Inventory & Stock Health Ledger
              </h4>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                Live Physical Shelves
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Consolidated shelf inventory valuation, low-stock warnings, and in-store customer pickup reservations
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToInventory && (
              <button
                type="button"
                onClick={onNavigateToInventory}
                className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-purple-700" />
                <span>Add / Manage Products</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All Stock & Stats</span>
            </button>
          </div>
        </div>

        {/* 4 Key Inventory KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100/80">
            <span className="text-xs font-semibold text-purple-900 block">Retail Inventory Valuation</span>
            <p className="text-2xl font-serif font-bold text-purple-950 mt-1">
              ₱{inventoryMetrics.totalInventoryValue.toLocaleString()}
            </p>
            <span className="text-[11px] text-purple-700 mt-1 block">
              Across {inventoryMetrics.totalProducts} registered products
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100/80">
            <span className="text-xs font-semibold text-indigo-900 block">Physical Units On Hand</span>
            <p className="text-2xl font-serif font-bold text-indigo-950 mt-1">
              {inventoryMetrics.totalUnitsInStock} Units
            </p>
            <span className="text-[11px] text-indigo-700 mt-1 block">
              Available for retail & salon usage
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900">Restock Urgency</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-serif font-bold text-amber-950 mt-1">
              {inventoryMetrics.lowStockCount + inventoryMetrics.outOfStockCount} Items
            </p>
            <span className="text-[11px] text-amber-700 mt-1 block">
              {inventoryMetrics.outOfStockCount} out of stock, {inventoryMetrics.lowStockCount} below threshold
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900">In-Store Pickup Orders</span>
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-serif font-bold text-emerald-950 mt-1">
              {inventoryMetrics.pendingPickupOrdersCount} Awaiting
            </p>
            <span className="text-[11px] text-emerald-700 mt-1 block">
              ₱{inventoryMetrics.pickupRevenue.toLocaleString()} total reservation volume
            </span>
          </div>
        </div>

        {/* Low Stock Urgent Alert Banner */}
        {lowStockAlertItems.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="text-xs font-bold text-amber-900 block">
                  Restock Attention Required ({lowStockAlertItems.length} Products Low or Out of Stock)
                </span>
                <span className="text-[11px] text-amber-700">
                  {lowStockAlertItems.map((p) => `${p.name} (${p.stock_quantity <= 0 ? 'Out of stock' : `${p.stock_quantity} left`})`).slice(0, 3).join(', ')}
                  {lowStockAlertItems.length > 3 ? ` and ${lowStockAlertItems.length - 3} more...` : ''}
                </span>
              </div>
            </div>

            {onNavigateToInventory && (
              <button
                type="button"
                onClick={onNavigateToInventory}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>Restock in Inventory Manager →</span>
              </button>
            )}
          </div>
        )}

        {/* Category Asset Distribution & Top Shelved Products Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Top Asset-Value Products */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Top Retail Products by Shelf Valuation
              </h5>
              {onNavigateToInventory && (
                <button
                  type="button"
                  onClick={onNavigateToInventory}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
                >
                  Manage All Products ({salonProducts.length}) →
                </button>
              )}
            </div>

            <div className="overflow-x-auto border border-gray-100 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-[10px] border-b border-gray-100">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-center">Stock</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Asset Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topShelvedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-400">
                        No retail products cataloged yet.
                      </td>
                    </tr>
                  ) : (
                    topShelvedProducts.map((p) => {
                      const isOut = p.stock_quantity <= 0;
                      const isLow = !isOut && p.stock_quantity <= (p.low_stock_threshold || 5);
                      const val = p.price * p.stock_quantity;

                      return (
                        <tr key={p.id} className="hover:bg-purple-50/20">
                          <td className="py-2.5 px-3 font-semibold text-gray-900">
                            {p.name}
                          </td>
                          <td className="py-2.5 px-3 text-gray-500 text-[11px]">
                            {p.category}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-gray-900">
                            ₱{p.price.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-gray-900">
                            {p.stock_quantity}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isOut ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-purple-900">
                            ₱{val.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dedicated Inventory Hub Callout */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-purple-900">
                <Package className="w-4 h-4 text-purple-700" />
                <h5 className="font-serif font-bold text-sm">Centralized Inventory Control</h5>
              </div>
              <p className="text-xs text-purple-950/80 leading-relaxed">
                All physical stock additions, barcode SKU edits, manual count adjustments, low-stock threshold triggers, and customer pickup order status transitions are handled inside the dedicated <span className="font-bold">Products & Stock</span> tab.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-purple-200/50">
              <div className="flex items-center justify-between text-xs text-purple-900">
                <span>Active Shelved SKUs:</span>
                <span className="font-bold">{inventoryMetrics.totalProducts}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-purple-900">
                <span>Pending Client Pickups:</span>
                <span className="font-bold">{inventoryMetrics.pendingPickupOrdersCount}</span>
              </div>

              {onNavigateToInventory && (
                <button
                  type="button"
                  onClick={onNavigateToInventory}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Dedicated Inventory Manager</span>
                  <ArrowRight className="w-3.5 h-3.5 text-pink-300" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Offer Promo Modal */}
      {promoModalClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-pink-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-900">
                <Sparkles className="w-5 h-5 text-pink-600" />
                <h4 className="font-serif font-bold text-lg">Send Exclusive VIP Promo</h4>
              </div>
              <button
                onClick={() => setPromoModalClient(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Reward or re-engage <span className="font-bold text-gray-900">{promoModalClient}</span> with a custom voucher code dispatched directly to their SMS and email.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Voucher Incentive
                </label>
                <select
                  value={promoDiscount}
                  onChange={(e) => setPromoDiscount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
                >
                  <option value="10">10% Off Any In-Store Treatment</option>
                  <option value="15">15% Off VIP Welcome Back Voucher</option>
                  <option value="20">20% Off Luxury Gel Builder Overlay</option>
                  <option value="25">25% Off Spa Pedicure + Manicure Bundle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Custom Personal Message
                </label>
                <textarea
                  defaultValue={`Dear ${promoModalClient}, we miss having you at ${salon.salon_name}! Enjoy an exclusive ${promoDiscount}% discount on your next visit with code VIP${promoDiscount}.`}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPromoModalClient(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendReengagementPromo(promoModalClient)}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decision-Making & Analytics Report Modal */}
      {showDecisionModal && (
        <DecisionReportModal
          reportData={storeReportData}
          onClose={() => setShowDecisionModal(false)}
          onExportCsv={handleExportCSV}
          showToast={showToast}
        />
      )}
    </div>
  );
};
