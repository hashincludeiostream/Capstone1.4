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
} from 'lucide-react';
import { Salon, Service, Technician, Appointment, Review } from '../../types';
import { DecisionReportModal } from './DecisionReportModal';
import {
  StoreReportData,
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
  showToast: (msg: string) => void;
}

export const StoreOverviewReports: React.FC<StoreOverviewReportsProps> = ({
  salon,
  appointments,
  services,
  technicians,
  reviews,
  showToast,
}) => {
  // Time period filter
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'quarter' | 'all'>('month');

  // Decision Report Preview Modal State
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
    };
  }, [appointments]);

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

  // Compute Category Booking Volume Breakdown
  const categoryBreakdown = useMemo(() => {
    const categories: Record<string, { count: number }> = {
      'Manicure': { count: 0 },
      'Nail Art': { count: 0 },
      'Spa & Wellness': { count: 0 },
      'Extensions': { count: 0 },
    };

    appointments.forEach((appt) => {
      const s = services.find((srv) => srv.id === appt.service_id);
      const cat = s?.category || 'Manicure';
      if (!categories[cat]) {
        categories[cat] = { count: 0 };
      }
      categories[cat].count += 1;
    });

    const totalCount = Object.values(categories).reduce((acc, curr) => acc + curr.count, 0) || 1;

    return Object.entries(categories).map(([name, data]) => ({
      name,
      count: data.count,
      percentage: Math.round((data.count / totalCount) * 100),
    }));
  }, [appointments, services]);

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
      // Classify CRM Tier
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

  // Calculate actual monthly trend from appointment dates for visualization
  const monthlyTrend = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return [
      { month: `${months[(currentMonth - 5 + 12) % 12]} ${currentYear - 1}`, count: appointments.filter(a => a.appointment_date.startsWith(`${currentYear - 1}-${String((currentMonth - 5 + 12) % 12 + 1).padStart(2, '0')}`)).length },
      { month: `${months[(currentMonth - 4 + 12) % 12]} ${currentYear - 1}`, count: appointments.filter(a => a.appointment_date.startsWith(`${currentYear - 1}-${String((currentMonth - 4 + 12) % 12 + 1).padStart(2, '0')}`)).length },
      { month: `${months[(currentMonth - 3 + 12) % 12]} ${currentYear - 1}`, count: appointments.filter(a => a.appointment_date.startsWith(`${currentYear - 1}-${String((currentMonth - 3 + 12) % 12 + 1).padStart(2, '0')}`)).length },
      { month: `${months[(currentMonth - 2 + 12) % 12]} ${currentYear - 1}`, count: appointments.filter(a => a.appointment_date.startsWith(`${currentYear - 1}-${String((currentMonth - 2 + 12) % 12 + 1).padStart(2, '0')}`)).length },
      { month: `${months[(currentMonth - 1 + 12) % 12]} ${currentYear - 1}`, count: appointments.filter(a => a.appointment_date.startsWith(`${currentYear - 1}-${String((currentMonth - 1 + 12) % 12 + 1).padStart(2, '0')}`)).length },
      { month: `${months[currentMonth]} ${currentYear} (Current)`, count: appointments.filter(a => a.appointment_date.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)).length },
    ];
  }, [appointments]);

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
        totalBookings: techAppts.length,
        completedCount: completed.length,
        hoursServiced,
        rating: tech.rating || 0,
      };
    });
  }, [technicians, appointments]);

  // Compiled Report Data Structure for Visual Export and Decision Making
  const storeReportData: StoreReportData = useMemo(() => {
    const vipCount = crmClients.filter((c) => c.tier === 'VIP Diamond').length;
    const regularCount = crmClients.filter((c) => c.tier === 'Loyal Regular').length;
    const newCount = crmClients.filter((c) => c.tier === 'New Client').length;
    const atRiskCount = crmClients.filter((c) => c.tier === 'At-Risk').length;
    const retentionRate = crmClients.length > 0 ? Math.round(((vipCount + regularCount) / crmClients.length) * 100) : 0;

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
      staffScorecard,
      crmSummary: {
        totalClients: crmClients.length,
        vipCount,
        regularCount,
        newCount,
        atRiskCount,
        retentionRate,
      },
      clientList,
    };
  }, [salon, timeRange, stats, categoryBreakdown, staffScorecard, crmClients, clientNotes]);

  // Export Store Report to CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Nail Glam Hub - Store Performance & CRM Report\n`;
    csvContent += `Salon: ${salon.salon_name}\n`;
    csvContent += `Date Generated: ${new Date().toLocaleDateString()}\n\n`;

    csvContent += `--- STORE OPERATIONAL SUMMARY ---\n`;
    csvContent += `Total Bookings,${stats.totalAppointments}\n`;
    csvContent += `Completed In-Store Sessions,${stats.completedCount}\n`;
    csvContent += `Confirmed Upcoming Sessions,${stats.confirmedCount}\n`;
    csvContent += `Average Session Duration,${stats.avgDuration} mins\n`;
    csvContent += `Fulfillment Rate,${stats.completionRate}%\n\n`;

    csvContent += `--- CRM CLIENT DIRECTORY ---\n`;
    csvContent += `Client Name,Phone,Email,Completed Visits,Last Visit,Loyalty Tier,CRM Notes\n`;
    crmClients.forEach((c) => {
      const note = (clientNotes[c.name] || '').replace(/,/g, ';');
      csvContent += `"${c.name}","${c.phone}","${c.email}",${c.completedVisits},"${c.lastVisitDate}","${c.tier}","${note}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${salon.salon_name.replace(/\s+/g, '_')}_Store_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Store report CSV exported successfully');
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
            <FileText className="w-3.5 h-3.5 text-pink-300" />
            <span>Decision Dossier</span>
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

          {/* Download Decision Report Action */}
          <button
            onClick={() => setShowDecisionModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-800 to-pink-700 hover:from-purple-900 hover:to-pink-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Decision Report</span>
          </button>

          {/* Export Report Action */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
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

      {/* 2. BOOKINGS TRENDS & CATEGORY SERVICE MIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Multi-Month Booking Trend Visualization */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-pink-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-serif font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                Store Monthly Appointment Volume
              </h4>
              <p className="text-xs text-gray-500">Historical completed sessions across the past 6 months</p>
            </div>
            <span className="text-xs font-semibold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
              FY {new Date().getFullYear()}
            </span>
          </div>

          {/* Clean Bar Visualizer */}
          <div className="pt-4 grid grid-cols-6 gap-2 sm:gap-4 items-end h-48 border-b border-gray-100 pb-2">
            {monthlyTrend.map((bar, i) => {
              const maxCount = Math.max(...monthlyTrend.map(t => t.count), 1);
              const height = Math.max(8, Math.round((bar.count / maxCount) * 100)) + '%';
              const isActive = i === monthlyTrend.length - 1;
              const monthShort = bar.month.split(' ')[0];

              return (
                <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    {bar.count} sessions
                  </span>
                  <div
                    className={`w-full rounded-t-xl transition-all duration-300 group-hover:scale-102 ${
                      isActive
                        ? 'bg-gradient-to-t from-purple-700 to-pink-500 shadow-md shadow-purple-500/20'
                        : 'bg-purple-100 hover:bg-purple-200'
                    }`}
                    style={{ height }}
                  />
                  <span className={`text-[11px] font-medium truncate w-full text-center ${isActive ? 'font-bold text-purple-900' : 'text-gray-500'}`}>
                    {monthShort}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-700"></span> Current Active Cycle
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-100"></span> Previous Closed Cycles
              </span>
            </div>
            <span className="font-semibold text-purple-900">
              {peakBookingDay ? `Peak Day: ${peakBookingDay[0]} (${peakBookingDay[1]} bookings)` : 'Peak Day: Not enough data'}
            </span>
          </div>
        </div>

        {/* Category Contribution Mix */}
        <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-serif font-bold text-gray-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-pink-600" />
                Treatment Popularity Mix
              </h4>
              <p className="text-xs text-gray-500">Booking share by treatment category</p>
            </div>
          </div>

          <div className="space-y-3.5 pt-2">
            {categoryBreakdown.filter((cat) => cat.count > 0).map((cat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-gray-700">{cat.name}</span>
                  <span className="text-purple-900">
                    {cat.count} bookings ({cat.percentage}%)
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
                    style={{ width: `${Math.max(8, cat.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              CRM Strategy Insight
            </p>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              {averageTreatmentsPerClient
                ? `Clients currently average ${averageTreatmentsPerClient} treatments in the loaded booking history.`
                : 'Repeat-treatment insight will appear after bookings are recorded.'}
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
