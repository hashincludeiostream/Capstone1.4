import React, { useState, useEffect } from 'react';
import {
  Mail,
  FileText,
  Send,
  Printer,
  CheckCircle2,
  Calendar,
  ShoppingBag,
  Sparkles,
  RefreshCw,
  Clock,
  Shield,
  Check,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import { Salon, User, EmailLog } from '../../types';
import { localStorage as safeLocalStorage } from '../../lib/localStorage';

interface OwnerEmailReportsManagerProps {
  salon: Salon;
  currentUser: User;
  showToast: (msg: string) => void;
}

export const OwnerEmailReportsManager: React.FC<OwnerEmailReportsManagerProps> = ({
  salon,
  currentUser,
  showToast,
}) => {
  // Toggle between 'monthly' and 'yearly' reporting frequencies for PDF generation
  const [reportFrequency, setReportFrequency] = useState<'monthly' | 'yearly'>('monthly');

  // Notification Preferences (with toggle on and off and frequency)
  const prefsKey = `email_prefs_owner_${currentUser.id}_${salon.id}`;
  const [automatedPdfEnabled, setAutomatedPdfEnabled] = useState(() => {
    const saved = safeLocalStorage.getItem(prefsKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.automatedPdfEnabled ?? parsed.monthlyPdfEnabled ?? true;
      } catch (e) {
        return true;
      }
    }
    return true;
  });

  const [deliveryFrequency, setDeliveryFrequency] = useState<'monthly' | 'yearly'>(() => {
    const saved = safeLocalStorage.getItem(prefsKey);
    if (saved) {
      try {
        const freq = JSON.parse(saved).deliveryFrequency;
        return freq === 'yearly' ? 'yearly' : 'monthly';
      } catch (e) {
        return 'monthly';
      }
    }
    return 'monthly';
  });

  const [bookingAlertsEnabled, setBookingAlertsEnabled] = useState(true);
  const [orderAlertsEnabled, setOrderAlertsEnabled] = useState(true);

  // Email Logs
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Save preferences
  const handleToggleAutomatedPdf = () => {
    const newVal = !automatedPdfEnabled;
    setAutomatedPdfEnabled(newVal);
    safeLocalStorage.setItem(
      prefsKey,
      JSON.stringify({ automatedPdfEnabled: newVal, deliveryFrequency })
    );
    showToast(newVal ? `Automated ${deliveryFrequency} PDF reports enabled` : 'Automated PDF reports disabled');
  };

  const handleFrequencyChange = (freq: 'monthly' | 'yearly') => {
    setDeliveryFrequency(freq);
    safeLocalStorage.setItem(
      prefsKey,
      JSON.stringify({ automatedPdfEnabled, deliveryFrequency: freq })
    );
    showToast(`Automated report frequency set to: ${freq.toUpperCase()}`);
  };

  const fetchEmailLogs = async () => {
    setLoadingLogs(true);
    try {
      const email = currentUser.email || salon.email;
      const res = await fetch(`/api/email/logs?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        if (data.length > 0 && !selectedLog) {
          setSelectedLog(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load email logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchEmailLogs();
  }, [salon.id, currentUser.email]);

  // Dispatch PDF Report to email with selected reporting frequency ('monthly' or 'yearly')
  const handleSendReport = async () => {
    setIsGeneratingReport(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/email/reports/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: salon.id,
          owner_email: currentUser.email || salon.email,
          owner_name: currentUser.fullname || salon.salon_name,
          time_grain: reportFrequency,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback(
          data.message ||
            `${reportFrequency === 'monthly' ? 'Monthly' : 'Yearly'} PDF status report generated and delivered to ${currentUser.email}!`
        );
        showToast(`${reportFrequency === 'monthly' ? 'Monthly' : 'Yearly'} PDF report dispatched to your email`);
        await fetchEmailLogs();
      } else {
        setFeedback(data.error || 'Failed to dispatch report');
      }
    } catch (err: any) {
      setFeedback(err.message || 'Error generating report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handlePrintPdf = (log: EmailLog) => {
    const htmlToPrint = log.pdf_html || log.html_body;
    if (!htmlToPrint) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlToPrint);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const frequencyDescriptions: Record<'monthly' | 'yearly', { label: string; periodText: string; desc: string }> = {
    monthly: {
      label: 'Monthly Report',
      periodText: 'Current Month',
      desc: 'Certified monthly turnover, net operating profit, completed appointments, and customer retention audit.',
    },
    yearly: {
      label: 'Yearly Report',
      periodText: 'Current Year',
      desc: 'Annual business turnover, fiscal health, retail product sales, and certified yearly P&L dossier.',
    },
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls & Toggle Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-pink-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold">
            <Mail className="w-3.5 h-3.5 text-pink-300" />
            <span>Automated Reports & Notifications Engine</span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif">
              Email Reports & Transactional Alerts
            </h2>
            <p className="text-purple-200 text-sm mt-1 leading-relaxed">
              Automated delivery of booking requests, customer in-store orders, and certified printable PDF performance reports dispatched to <strong className="text-white underline">{currentUser.email || salon.email}</strong>.
            </p>
          </div>

          {/* Reporting Frequency Toggle: Monthly vs Yearly */}
          <div className="bg-black/25 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-pink-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                <span>PDF Reporting Frequency:</span>
              </span>
              <span className="text-[11px] font-medium text-purple-200">
                {frequencyDescriptions[reportFrequency].desc}
              </span>
            </div>

            <div className="inline-flex p-1 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
              <button
                type="button"
                onClick={() => setReportFrequency('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  reportFrequency === 'monthly'
                    ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
                    : 'text-purple-200 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Monthly</span>
                {reportFrequency === 'monthly' && <Check className="w-3 h-3 text-white ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={() => setReportFrequency('yearly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  reportFrequency === 'yearly'
                    ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
                    : 'text-purple-200 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Yearly</span>
                {reportFrequency === 'yearly' && <Check className="w-3 h-3 text-white ml-0.5" />}
              </button>
            </div>
          </div>

          <div className="pt-1 flex flex-wrap items-center gap-3">
            <button
              onClick={handleSendReport}
              disabled={isGeneratingReport}
              className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <FileText className={`w-4 h-4 mr-2 ${isGeneratingReport ? 'animate-spin' : ''}`} />
              {isGeneratingReport
                ? 'Compiling & Delivering PDF...'
                : `Email ${reportFrequency === 'monthly' ? 'Monthly' : 'Yearly'} PDF Report Now`}
            </button>

            <button
              onClick={handleToggleAutomatedPdf}
              className="inline-flex items-center px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm backdrop-blur-sm transition cursor-pointer"
            >
              {automatedPdfEnabled ? (
                <>
                  <ToggleRight className="w-5 h-5 text-emerald-400 mr-2" />
                  <span>Scheduled Delivery: <strong>ON ({deliveryFrequency.toUpperCase()})</strong></span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-gray-400 mr-2" />
                  <span>Scheduled Delivery: <strong>OFF</strong></span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Info Notice on Simulated vs Real Accounts */}
      <div className="p-4 rounded-2xl bg-purple-50/90 border border-purple-200 text-purple-950 text-xs flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Real Accounts & Simulated Delivery:</span> When your account uses a verified Gmail address with OAuth access, emails and PDF attachments are dispatched directly to your external inbox. For test or simulated accounts, all reports and PDF attachments are recorded in the real-time system database below, where you can view, print, or download them at any time with <strong>Print / PDF</strong>.
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-sm font-medium">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs text-emerald-700 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Automated PDF Performance Audits with Frequency Toggle */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
                <FileText className="w-5 h-5" />
              </span>
              <button
                onClick={handleToggleAutomatedPdf}
                className="cursor-pointer"
                title="Toggle on/off"
              >
                {automatedPdfEnabled ? (
                  <ToggleRight className="w-7 h-7 text-purple-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-gray-400" />
                )}
              </button>
            </div>
            <h3 className="font-bold text-gray-900 text-sm mt-3">Scheduled Audit Reports (PDF)</h3>
            <p className="text-xs text-gray-500 mt-1">
              Automatically compiles revenue, expenses, and booking volumes into a certified PDF report.
            </p>

            {/* Frequency options (Monthly vs Yearly) */}
            <div className="mt-3 pt-3 border-t border-purple-50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block mb-1.5">
                Delivery Cadence:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleFrequencyChange('monthly')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer text-center flex items-center justify-center gap-1 ${
                    deliveryFrequency === 'monthly'
                      ? 'bg-purple-100 text-purple-900 font-bold border border-purple-300'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Monthly</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFrequencyChange('yearly')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer text-center flex items-center justify-center gap-1 ${
                    deliveryFrequency === 'yearly'
                      ? 'bg-purple-100 text-purple-900 font-bold border border-purple-300'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Yearly</span>
                </button>
              </div>
            </div>
          </div>
          <span className={`text-[11px] font-semibold mt-3 ${automatedPdfEnabled ? 'text-emerald-600' : 'text-gray-400'}`}>
            Status: {automatedPdfEnabled ? `Active (${deliveryFrequency.toUpperCase()} Delivery)` : 'Disabled by Owner'}
          </span>
        </div>

        {/* Card 2: Instant Booking Notifications */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-pink-50 text-pink-700">
                <Calendar className="w-5 h-5" />
              </span>
              <button
                onClick={() => setBookingAlertsEnabled(!bookingAlertsEnabled)}
                className="cursor-pointer"
              >
                {bookingAlertsEnabled ? (
                  <ToggleRight className="w-7 h-7 text-pink-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-gray-400" />
                )}
              </button>
            </div>
            <h3 className="font-bold text-gray-900 text-sm mt-3">Instant Booking Notifications</h3>
            <p className="text-xs text-gray-500 mt-1">
              Receive immediate email alerts when a customer books, reschedules, or cancels an appointment.
            </p>
          </div>
          <span className={`text-[11px] font-semibold mt-3 ${bookingAlertsEnabled ? 'text-emerald-600' : 'text-gray-400'}`}>
            Status: {bookingAlertsEnabled ? 'Active (Real-time)' : 'Disabled'}
          </span>
        </div>

        {/* Card 3: In-Store Product Orders */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <button
                onClick={() => setOrderAlertsEnabled(!orderAlertsEnabled)}
                className="cursor-pointer"
              >
                {orderAlertsEnabled ? (
                  <ToggleRight className="w-7 h-7 text-blue-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-gray-400" />
                )}
              </button>
            </div>
            <h3 className="font-bold text-gray-900 text-sm mt-3">In-Store Product Orders</h3>
            <p className="text-xs text-gray-500 mt-1">
              Receive immediate email alerts when customers reserve retail nail supplies for front desk pickup.
            </p>
          </div>
          <span className={`text-[11px] font-semibold mt-3 ${orderAlertsEnabled ? 'text-emerald-600' : 'text-gray-400'}`}>
            Status: {orderAlertsEnabled ? 'Active (Real-time)' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Delivered Email Dispatch History */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-900 text-sm">Delivered PDF Reports & Email Ledger</h3>
          </div>
          <button
            onClick={fetchEmailLogs}
            disabled={loadingLogs}
            className="text-xs text-purple-700 hover:text-purple-900 font-semibold inline-flex items-center cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingLogs ? 'animate-spin' : ''}`} />
            Refresh Inbox
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[400px]">
          {/* Email List */}
          <div className="lg:col-span-5 border-r border-gray-200 divide-y divide-gray-100 max-h-[480px] overflow-y-auto bg-gray-50/40">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">No reports or emails delivered yet</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Click "Email Monthly PDF Report Now" or "Email Yearly PDF Report Now" above to generate your first audit report.
                </p>
              </div>
            ) : (
              logs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                const dateStr = log.sent_at ? new Date(log.sent_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';

                return (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`w-full text-left p-4 transition flex flex-col space-y-1 ${
                      isSelected
                        ? 'bg-white shadow-xs border-l-4 border-l-purple-600'
                        : 'hover:bg-gray-100/70 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {log.category}
                      </span>
                      <span className="text-[11px] text-gray-400">{dateStr}</span>
                    </div>
                    <div className="text-xs font-bold text-gray-900 truncate">
                      {log.subject}
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2">
                      {log.content_preview}
                    </p>
                    {log.has_pdf_attachment && (
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-fit mt-1">
                        <FileText className="w-3 h-3 mr-1" />
                        PDF Attached
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Email Preview Pane */}
          <div className="lg:col-span-7 p-6 overflow-y-auto max-h-[480px]">
            {selectedLog ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{selectedLog.subject}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      To: <strong>{selectedLog.recipient_email}</strong> • {new Date(selectedLog.sent_at).toLocaleString()}
                    </p>
                  </div>
                  {selectedLog.has_pdf_attachment && (
                    <button
                      onClick={() => handlePrintPdf(selectedLog)}
                      className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5" />
                      Print / PDF
                    </button>
                  )}
                </div>

                <div
                  className="prose prose-xs max-w-none text-gray-800"
                  dangerouslySetInnerHTML={{ __html: selectedLog.html_body }}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                Select an email from the left to view contents
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
