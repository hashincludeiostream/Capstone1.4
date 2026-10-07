import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  FileText,
  Send,
  Printer,
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
import { getCachedAccessToken, getCachedGmailUserEmail, connectGoogleWorkspace } from '../../lib/firebase';
import { sendEmailNotification, downloadCertifiedPdfFile } from '../../lib/emailService';

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
  const cachedGoogleEmail = getCachedGmailUserEmail();
  const defaultTargetEmail = cachedGoogleEmail || currentUser.email || salon.email || 'salon@nailglamhub.com';
  const ownerName = currentUser.fullname || salon.salon_name || 'Salon Partner';

  const [recipientEmail, setRecipientEmail] = useState(defaultTargetEmail);
  const targetEmail = recipientEmail;

  // Toggle between 'monthly' and 'yearly' reporting frequencies for PDF generation
  const [reportFrequency, setReportFrequency] = useState<'monthly' | 'yearly'>('monthly');

  // Google OAuth Connection state
  const [hasGoogleToken, setHasGoogleToken] = useState(() => Boolean(getCachedAccessToken()));
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // Mandatory Workspace User Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // In-app interactive Report Preview Modal (avoids window.open popup blockers)
  const [previewLog, setPreviewLog] = useState<EmailLog | null>(null);
  const printIframeRef = useRef<HTMLIFrameElement | null>(null);

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

  // Check cached token periodically or on window focus
  useEffect(() => {
    const checkToken = () => {
      setHasGoogleToken(Boolean(getCachedAccessToken()));
    };
    checkToken();
    window.addEventListener('focus', checkToken);
    return () => window.removeEventListener('focus', checkToken);
  }, []);

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const res = await connectGoogleWorkspace();
      if (res.success && res.token) {
        setHasGoogleToken(true);
        if (res.email) {
          setRecipientEmail(res.email);
        }
        showToast(`Google Workspace connected (${res.email || 'Gmail'})!`);
      } else {
        showToast(res.error || 'Failed to connect Google account');
      }
    } catch (err: any) {
      showToast(err?.message || 'Connection error');
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  // Instant direct PDF download
  const handleDownloadDirectPdf = async () => {
    try {
      const filename = `${salon.salon_name.replace(/\s+/g, '_')}_${reportFrequency}_Report.pdf`;
      const ok = downloadCertifiedPdfFile(filename, {
        title: `${salon.salon_name} ${reportFrequency.toUpperCase()} Performance Audit`,
        salonName: salon.salon_name,
        salonAddress: salon.address,
        recipientName: ownerName,
        recipientEmail: recipientEmail.trim() || defaultTargetEmail,
        periodLabel: `${reportFrequency.toUpperCase()} Dossier`,
      });
      if (ok) {
        showToast(`Downloaded ${filename} successfully!`);
      } else {
        showToast('Failed to download PDF document');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error downloading PDF');
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
      const res = await fetch(`/api/email/logs?email=${encodeURIComponent(targetEmail)}`);
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
  const handleConfirmSendReport = async (forceConnectGoogle: boolean = false) => {
    setShowConfirmModal(false);
    setIsGeneratingReport(true);
    setFeedback(null);
    try {
      // 1. If not connected yet or explicitly requested, obtain Google Workspace token
      let activeToken = getCachedAccessToken();
      let connectedGmailEmail = getCachedGmailUserEmail();
      if (!activeToken || forceConnectGoogle) {
        showToast('Connecting Google Workspace to send email...');
        const connResult = await connectGoogleWorkspace();
        if (connResult.success && connResult.token) {
          activeToken = connResult.token;
          setHasGoogleToken(true);
          if (connResult.email) {
            connectedGmailEmail = connResult.email;
            setRecipientEmail(connResult.email);
          }
        }
      }

      const emailToUse = (recipientEmail.trim() || connectedGmailEmail || defaultTargetEmail).trim();

      // 2. Generate certified report payload from backend
      const res = await fetch('/api/email/reports/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: salon.id,
          owner_email: emailToUse,
          owner_name: ownerName,
          time_grain: reportFrequency,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to compile report payload');
      }

      // 3. Dispatch via Gmail API
      let gmailDelivered = false;
      let sendResult: any = null;
      if (data.report) {
        sendResult = await sendEmailNotification({
          ...data.report,
          to: emailToUse,
        });
        if (sendResult.gmailSent) {
          gmailDelivered = true;
        }
      }

      if (gmailDelivered) {
        setFeedback(
          `✅ Official ${reportFrequency === 'monthly' ? 'Monthly' : 'Yearly'} PDF report delivered directly to your Gmail inbox (${emailToUse})!`
        );
        showToast(`Dispatched via Gmail to ${emailToUse}`);
      } else if (sendResult?.error) {
        setFeedback(
          `Report generated and logged to ledger! Note: ${sendResult.error}`
        );
        showToast('Report saved to ledger');
      } else {
        setFeedback(
          `Report compiled and recorded in your ledger! Connect Google Workspace to receive live delivery in your external Gmail.`
        );
        showToast('Report saved to ledger');
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
      let token = getCachedAccessToken();
      if (!token) {
        showToast('Connecting Google Workspace...');
        const conn = await connectGoogleWorkspace();
        if (conn.success && conn.token) {
          token = conn.token;
          setHasGoogleToken(true);
        }
      }

      const sendResult = await sendEmailNotification({
        to: log.recipient_email,
        toName: log.recipient_name,
        role: (log.recipient_role as any) || 'salon_owner',
        subject: log.subject,
        category: (log.category as any) || 'report',
        htmlBody: log.html_body,
        hasPdfAttachment: Boolean(log.has_pdf_attachment),
        attachmentName: log.attachment_name,
        pdfHtml: log.pdf_html,
      });

      if (sendResult.gmailSent) {
        showToast(`✅ Dispatched to ${log.recipient_email} via Gmail!`);
      } else if (sendResult.error) {
        showToast(`Note: ${sendResult.error}`);
      } else {
        showToast('Logged to ledger. Connect Google Workspace for live Gmail delivery.');
      }
      await fetchEmailLogs();
    } catch (err: any) {
      showToast(err.message || 'Error resending email');
    } finally {
      setIsResending(false);
    }
  };

  // Safe in-app print using hidden iframe (zero window.open popups)
  const handlePrintLog = (log: EmailLog) => {
    const htmlToPrint = log.pdf_html || log.html_body;
    if (!htmlToPrint) return;

    if (printIframeRef.current) {
      const doc = printIframeRef.current.contentDocument || printIframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlToPrint);
        doc.close();
        setTimeout(() => {
          printIframeRef.current?.contentWindow?.focus();
          printIframeRef.current?.contentWindow?.print();
        }, 300);
      }
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
      {/* Hidden print iframe for reliable zero-popup printing */}
      <iframe ref={printIframeRef} className="hidden" title="Print Frame" />

      {/* Workspace / Gmail Status Banner */}
      <div className={`p-4 rounded-2xl border transition-all ${
        hasGoogleToken
          ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
          : 'bg-amber-50/90 border-amber-200 text-amber-950'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            {hasGoogleToken ? (
              <div className="p-2 rounded-xl shrink-0 bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : null}
            <div>
              <div className="font-bold text-sm flex items-center gap-2">
                <span>{hasGoogleToken ? 'Gmail Live Delivery Connected' : 'Google Workspace Connection Required for Live Inbox Delivery'}</span>
                <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${hasGoogleToken ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'}`}>
                  {hasGoogleToken ? 'Active' : 'Not Connected'}
                </span>
              </div>
              <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
                {hasGoogleToken
                  ? `Reports and notifications will be sent directly to your verified Gmail inbox: ${targetEmail}`
                  : `To deliver certified PDF reports directly to your Gmail inbox (${targetEmail}), connect your Google account below.`}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {!hasGoogleToken ? (
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isConnectingGoogle}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold rounded-xl border border-gray-300 shadow-sm cursor-pointer transition active:scale-95 disabled:opacity-50"
              >
                {isConnectingGoogle ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-600" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Connect Google / Gmail</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 bg-emerald-100/70 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Ready for Delivery</span>
              </span>
            )}
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
              Automated delivery of customer bookings, in-store orders, and certified printable PDF performance reports dispatched to <strong className="text-white underline">{targetEmail}</strong>.
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
                      {log.status === 'delivered' && (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center">
                          <Check className="w-3 h-3 mr-0.5" /> Delivered
                        </span>
                      )}
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
                      <>
                        <button
                          onClick={() => {
                            const filename = selectedLog.attachment_name || `${salon.salon_name}_Report.pdf`;
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
                          title="Download certified PDF file directly"
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          Download PDF
                        </button>
                        <button
                          onClick={() => handlePrintLog(selectedLog)}
                          className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1.5" />
                          Print / PDF
                        </button>
                      </>
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

              <div className="p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2 bg-gray-50 border-gray-200 text-gray-700">
                <AlertCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  {hasGoogleToken ? (
                    <span className="text-emerald-700 font-medium">
                      ✓ Google Workspace is connected. The certified PDF statement will be delivered directly to <strong>{recipientEmail || defaultTargetEmail}</strong> via Gmail API.
                    </span>
                  ) : (
                    <span>
                      To receive live PDF delivery directly in your Gmail inbox, connecting your Google account is required. Click below to connect and dispatch immediately.
                    </span>
                  )}
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
              
              {!hasGoogleToken ? (
                <button
                  type="button"
                  onClick={() => handleConfirmSendReport(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Connect Gmail & Send Report</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConfirmSendReport(false)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send PDF Report via Gmail</span>
                </button>
              )}
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
                  download={previewLog.attachment_name || `${salon.salon_name.replace(/\s+/g, '_')}_Report.html`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download HTML</span>
                </a>

                {/* Print button */}
                <button
                  onClick={() => handlePrintLog(previewLog)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print / PDF</span>
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
