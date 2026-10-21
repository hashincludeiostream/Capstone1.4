import React, { useState, useEffect } from 'react';
import {
  Mail,
  FileText,
  Send,
  Download,
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
  X,
  Loader2,
} from 'lucide-react';
import { Salon, User, EmailLog } from '../../types';
import { localStorage as safeLocalStorage } from '../../lib/localStorage';
import { sendEmailNotification, downloadCertifiedPdfFile } from '../../lib/emailService';
import { ajax } from '../../lib/ajax';

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
  const defaultTargetEmail = currentUser.email || salon.email || 'salon@nailglamhub.com';
  const ownerName = currentUser.fullname || salon.salon_name || 'Salon Partner';

  const [recipientEmail, setRecipientEmail] = useState(defaultTargetEmail);
  const targetEmail = recipientEmail;

  // Toggle between 'monthly' and 'yearly' reporting frequencies for PDF generation
  const [reportFrequency, setReportFrequency] = useState<'monthly' | 'yearly'>('monthly');

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // In-app interactive Report Preview Modal (avoids window.open popup blockers)
  const [previewLog, setPreviewLog] = useState<EmailLog | null>(null);

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
  const [senderInfo, setSenderInfo] = useState<{ senderFormatted?: string; configured?: boolean } | null>(null);

  useEffect(() => {
    ajax('/api/email/system-status')
      .then((res) => res.json())
      .then((data) => {
        if (data?.senderFormatted) {
          setSenderInfo({ senderFormatted: data.senderFormatted, configured: Boolean(data.configured) });
        }
      })
      .catch(() => {});
  }, []);

  // Instant direct PDF download
  const handleDownloadDirectPdf = async () => {
    try {
      const filename = `${salon.salon_name.replace(/\s+/g, '_')}_All_In_One_Master_Report.pdf`;
      const ok = downloadCertifiedPdfFile(filename, {
        title: `${salon.salon_name} All-in-One Master Performance Audit`,
        salonName: salon.salon_name,
        salonAddress: salon.address,
        recipientName: ownerName,
        recipientEmail: recipientEmail.trim() || defaultTargetEmail,
        periodLabel: `${reportFrequency.toUpperCase()} Master Dossier`,
        summaryText: `Official All-in-One Master Performance Dossier auditing salon gross turnover, net retained operating profit, customer appointment fulfillment, and boutique retail orders.`,
      });
      if (ok) {
        showToast(`Downloaded ${filename} successfully!`);
      } else {
        showToast('Failed to download Master PDF document');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error downloading Master PDF');
    }
  };

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
      const res = await ajax(`/api/email/logs?email=${encodeURIComponent(targetEmail)}`);
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
  }, [salon.id, targetEmail]);

  // Step 1: Open user confirmation dialog (MANDATORY per Workspace guidelines)
  const handleInitiateSendReport = () => {
    setShowConfirmModal(true);
  };

  // Step 2: User explicitly confirmed sending
  const handleConfirmSendReport = async () => {
    setShowConfirmModal(false);
    setIsGeneratingReport(true);
    setFeedback(null);
    try {
      const emailToUse = (recipientEmail.trim() || defaultTargetEmail).trim();

      // 1. Generate certified report payload from backend (compile_only: true to prevent duplicate dispatches)
      const res = await ajax('/api/email/reports/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: salon.id,
          owner_email: emailToUse,
          owner_name: ownerName,
          time_grain: reportFrequency,
          compile_only: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to compile report payload');
      }

      // 2. Dispatch via Specialized System Account
      let sendResult: any = null;
      if (data.report) {
        sendResult = await sendEmailNotification({
          ...data.report,
          to: emailToUse,
          salon_id: salon.id,
          subject: `📊 All-in-One Master Performance Report PDF: ${salon.salon_name} (${reportFrequency.toUpperCase()})`,
          attachmentName: `${salon.salon_name.replace(/\s+/g, '_')}_All_In_One_Master_Report.pdf`,
          salonName: salon.salon_name,
          salonAddress: salon.address,
          periodLabel: `${reportFrequency.toUpperCase()} Master Audit`,
          pdfMetrics: data.metrics ? {
            grossRevenue: data.metrics.totalRevenue,
            netProfit: data.metrics.netProfit,
            profitMargin: data.metrics.profitMargin,
            appointmentCount: data.metrics.appointmentCount,
            orderCount: data.metrics.orderCount,
            averageTicket: data.metrics.averageTicket,
          } : data.report.pdfMetrics,
          masterReportSummary: `All-in-One Master Performance Dossier for ${salon.salon_name}. Covers gross turnover of PHP ${(data.metrics?.totalRevenue || 0).toLocaleString()}, net profit of PHP ${(data.metrics?.netProfit || 0).toLocaleString()}, and operating margins.`,
        });
      }

      if (sendResult?.status === 'accepted') {
        setFeedback(
          `✅ Official All-in-One Master PDF report dispatched from specialized system account to ${emailToUse}!`
        );
        showToast(`Master PDF report dispatched to ${emailToUse}`);
      } else if (sendResult?.status === 'not_configured') {
        setFeedback(
          `⚠️ System SMTP is not configured. Report compiled and recorded in communication ledger for ${emailToUse}.`
        );
        showToast('SMTP unconfigured. Report recorded in audit ledger.');
      } else {
        const errorMsg = sendResult?.error || 'Email dispatch failed.';
        setFeedback(`❌ ${errorMsg}`);
        showToast(`❌ ${errorMsg}`);
      }
      await fetchEmailLogs();
    } catch (err: any) {
      setFeedback(err.message || 'Error generating report');
      showToast(err.message || 'Error generating report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const [isResending, setIsResending] = useState(false);

  const handleResendToGmail = async (log: EmailLog) => {
    setIsResending(true);
    try {
      const sendResult = await sendEmailNotification({
        to: log.recipient_email,
        toName: log.recipient_name,
        role: (log.recipient_role as any) || 'salon_owner',
        subject: log.subject,
        category: (log.category as any) || 'report',
        htmlBody: log.html_body,
        hasPdfAttachment: Boolean(log.has_pdf_attachment),
        attachmentName: log.attachment_name || `${salon.salon_name.replace(/\s+/g, '_')}_All_In_One_Master_Report.pdf`,
        pdfHtml: log.pdf_html,
        salon_id: salon.id,
        salonName: salon.salon_name,
        salonAddress: salon.address,
        periodLabel: 'All-in-One Master Performance Audit',
        masterReportSummary: log.content_preview,
      });

      if (sendResult.status === 'accepted') {
        showToast(`✅ Dispatched from specialized system account to ${log.recipient_email}!`);
      } else if (sendResult.status === 'not_configured') {
        showToast('⚠️ SMTP unconfigured. Record saved in communication ledger.');
      } else {
        showToast(`❌ Dispatch failed: ${sendResult.error || 'SMTP delivery rejected'}`);
      }
      await fetchEmailLogs();
    } catch (err: any) {
      showToast(err.message || 'Error resending email');
    } finally {
      setIsResending(false);
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
      {/* Specialized Platform Email Dispatcher Banner */}
      <div className="p-4 rounded-2xl border bg-emerald-50/90 border-emerald-200 text-emerald-950">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl shrink-0 bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm flex items-center gap-2">
                <span>Centralized System Email Mailer</span>
                <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                  senderInfo?.configured ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  {senderInfo?.configured ? 'Active Central Sender' : 'Configured Central Mailer'}
                </span>
              </div>
              <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
                Central system sender: <strong>{senderInfo?.senderFormatted || 'Configured Central System Mailer'}</strong>. All booking updates, pickup notices, and certified PDF master reports are delivered centrally from this specialized address to your recipient inbox (<strong>{targetEmail}</strong>) without sending from personal accounts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Controls & Toggle Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-pink-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-pink-300" />
            <span>Automated Reports & Notifications Engine</span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif">
              Email Reports & Business Audits
            </h2>
            <p className="text-purple-200 text-sm mt-1 leading-relaxed">
              Automated delivery of customer bookings, in-store orders, and certified downloadable All-in-One Master PDF performance reports dispatched to <strong className="text-white underline">{targetEmail}</strong>.
            </p>
          </div>

          {/* Reporting Frequency Toggle: Monthly vs Yearly */}
          <div className="bg-black/25 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2.5">
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

          {/* Action Buttons */}
          <div className="pt-1 flex flex-wrap items-center gap-3">
            <button
              onClick={handleInitiateSendReport}
              disabled={isGeneratingReport}
              className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <FileText className={`w-4 h-4 mr-2 ${isGeneratingReport ? 'animate-spin' : ''}`} />
              {isGeneratingReport
                ? 'Compiling & Delivering PDF...'
                : `Email ${reportFrequency === 'monthly' ? 'Monthly' : 'Yearly'} PDF Report Now`}
            </button>

            <button
              onClick={handleDownloadDirectPdf}
              className="inline-flex items-center px-4 py-2.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white font-semibold rounded-xl text-xs sm:text-sm backdrop-blur-sm transition cursor-pointer"
              title="Download certified PDF performance report file"
            >
              <Download className="w-4 h-4 mr-2" />
              <span>Download PDF File</span>
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

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-sm font-medium">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs text-emerald-700 hover:underline cursor-pointer shrink-0 ml-3"
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
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
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
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
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
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
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
                <p className="text-xs font-semibold">No reports or emails recorded yet</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Click "Email Monthly PDF Report Now" above to compile your first audit report.
                </p>
              </div>
            ) : (
              logs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                const dateStr = log.sent_at
                  ? new Date(log.sent_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recent';

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
                    <div className="flex items-center gap-2 mt-1">
                      {log.has_pdf_attachment && (
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <FileText className="w-3 h-3 mr-1" />
                          PDF Attached
                        </span>
                      )}
                      {log.status === 'accepted' || log.status === 'delivered' ? (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center">
                          <Check className="w-3 h-3 mr-0.5" /> {log.status === 'accepted' ? 'Accepted' : 'Delivered'}
                        </span>
                      ) : log.status === 'not_configured' ? (
                        <span className="text-[10px] text-amber-600 font-semibold flex items-center">
                          <AlertCircle className="w-3 h-3 mr-0.5" /> Ledger Only
                        </span>
                      ) : log.status === 'failed' ? (
                        <span className="text-[10px] text-rose-600 font-semibold flex items-center">
                          <X className="w-3 h-3 mr-0.5" /> Failed
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Email Preview Pane */}
          <div className="lg:col-span-7 p-6 overflow-y-auto max-h-[480px]">
            {selectedLog ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{selectedLog.subject}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      To: <strong>{selectedLog.recipient_email}</strong> • {new Date(selectedLog.sent_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleResendToGmail(selectedLog)}
                      disabled={isResending}
                      className="inline-flex items-center px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold rounded-lg transition cursor-pointer"
                      title="Dispatch this email report directly to Gmail inbox"
                    >
                      <Mail className="w-3.5 h-3.5 mr-1.5" />
                      {isResending ? 'Sending...' : 'Resend to Gmail'}
                    </button>

                    <button
                      onClick={() => setPreviewLog(selectedLog)}
                      className="inline-flex items-center px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      View Full Report
                    </button>

                    {selectedLog.has_pdf_attachment && (
                      <button
                        onClick={() => {
                          const filename = selectedLog.attachment_name || `${salon.salon_name}_All_In_One_Master_Report.pdf`;
                          downloadCertifiedPdfFile(filename, {
                            title: selectedLog.subject,
                            recipientName: selectedLog.recipient_name,
                            recipientEmail: selectedLog.recipient_email,
                            salonName: salon.salon_name,
                            salonAddress: salon.address,
                            summaryText: selectedLog.content_preview,
                          });
                          showToast(`Downloaded ${filename} successfully!`);
                        }}
                        className="inline-flex items-center px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition cursor-pointer"
                        title="Download certified All-in-One Master PDF file directly"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Download Master PDF
                      </button>
                    )}
                  </div>
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

      {/* MANDATORY USER CONFIRMATION MODAL (Google Workspace Destructive/Sending Action) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-pink-600 font-bold text-sm">
                <Mail className="w-5 h-5" />
                <span>Confirm Email Dispatch</span>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 text-base">
                Send {reportFrequency === 'monthly' ? 'Monthly' : 'Yearly'} PDF Business Report
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                This will compile and certify your {reportFrequency} revenue, appointments, and retail performance report for <strong>{salon.salon_name}</strong>.
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Recipient Gmail / Email Address:
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-semibold text-purple-950 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                  placeholder="e.g. yourname@gmail.com"
                />
              </div>

              <div className="p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2 bg-emerald-50 border-emerald-200 text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-emerald-800">Specialized System Sender:</span> Dispatched from <strong>Nail Glam Hub System &lt;notifications@nailglamhub.com&gt;</strong> directly to <strong>{recipientEmail || defaultTargetEmail}</strong> without requiring personal Gmail authorization.
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer text-center"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  handleDownloadDirectPdf();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition cursor-pointer"
                title="Download certified PDF file directly"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF File</span>
              </button>
              
              <button
                type="button"
                onClick={handleConfirmSendReport}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send PDF Report via System</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP INTERACTIVE REPORT PREVIEW MODAL */}
      {previewLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">{previewLog.subject}</h3>
                  <p className="text-xs text-gray-500">
                    Recipient: {previewLog.recipient_email} • {new Date(previewLog.sent_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Direct download HTML report without window.open */}
                <a
                  href={`data:text/html;charset=utf-8,${encodeURIComponent(previewLog.pdf_html || previewLog.html_body)}`}
                  download={previewLog.attachment_name || `${salon.salon_name.replace(/\s+/g, '_')}_Master_Report.html`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download HTML</span>
                </a>

                {/* Direct Master PDF download */}
                <button
                  onClick={() => {
                    const filename = previewLog.attachment_name || `${salon.salon_name.replace(/\s+/g, '_')}_All_In_One_Master_Report.pdf`;
                    downloadCertifiedPdfFile(filename, {
                      title: previewLog.subject,
                      recipientName: previewLog.recipient_name,
                      recipientEmail: previewLog.recipient_email,
                      salonName: salon.salon_name,
                      salonAddress: salon.address,
                      summaryText: previewLog.content_preview,
                    });
                    showToast(`Downloaded ${filename} successfully!`);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download Master PDF</span>
                </button>

                <button
                  onClick={() => setPreviewLog(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Report iframe */}
            <div className="p-4 flex-1 overflow-auto bg-gray-100 min-h-[450px]">
              <iframe
                srcDoc={previewLog.pdf_html || previewLog.html_body}
                title="Report Document"
                className="w-full h-full min-h-[500px] bg-white rounded-2xl shadow-sm border border-gray-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
