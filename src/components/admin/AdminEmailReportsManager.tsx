import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  FileText,
  Send,
  Printer,
  Download,
  CheckCircle2,
  Users,
  Shield,
  RefreshCw,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Check,
  Search,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { User, EmailLog } from '../../types';
import { localStorage as safeLocalStorage } from '../../lib/localStorage';
import { getCachedAccessToken, connectGoogleWorkspace } from '../../lib/firebase';
import { sendEmailNotification } from '../../lib/emailService';

interface AdminEmailReportsManagerProps {
  currentUser?: User;
  showToast: (msg: string) => void;
}

export const AdminEmailReportsManager: React.FC<AdminEmailReportsManagerProps> = ({
  currentUser,
  showToast,
}) => {
  const adminEmail = currentUser?.email || 'admin@nailglamhub.com';
  const adminName = currentUser?.fullname || 'System Administrator';

  // Google OAuth Connection state
  const [hasGoogleToken, setHasGoogleToken] = useState(() => Boolean(getCachedAccessToken()));
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // Mandatory confirmation dialog state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // In-app interactive Report Preview Modal (avoids window.open popup blockers)
  const [previewLog, setPreviewLog] = useState<EmailLog | null>(null);
  const printIframeRef = useRef<HTMLIFrameElement | null>(null);

  const prefsKey = `email_prefs_admin_${adminEmail}`;
  const [monthlyPdfEnabled, setMonthlyPdfEnabled] = useState(() => {
    const saved = safeLocalStorage.getItem(prefsKey);
    if (saved) {
      try {
        return JSON.parse(saved).monthlyPdfEnabled ?? true;
      } catch (e) {
        return true;
      }
    }
    return true;
  });

  const [registrationAlertsEnabled, setRegistrationAlertsEnabled] = useState(true);
  const [salonApplicationAlertsEnabled, setSalonApplicationAlertsEnabled] = useState(true);

  // Email logs state
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Generating report state
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Broadcast to customers promo state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('Exclusive Weekend Nail Glam Hub Treat! 💅✨');
  const [broadcastMessage, setBroadcastMessage] = useState('Enjoy complimentary nail art on your next booking at any top-rated studio this weekend!');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Check cached token periodically
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
        showToast('Google Workspace connected! Live Gmail delivery is active.');
      } else {
        showToast(res.error || 'Failed to connect Google account');
      }
    } catch (err: any) {
      showToast(err?.message || 'Connection error');
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleToggleMonthlyPdf = () => {
    const newVal = !monthlyPdfEnabled;
    setMonthlyPdfEnabled(newVal);
    safeLocalStorage.setItem(prefsKey, JSON.stringify({ monthlyPdfEnabled: newVal }));
    showToast(newVal ? 'Monthly automated platform PDF reports enabled' : 'Monthly automated platform PDF reports disabled');
  };

  const fetchEmailLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/email/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        if (data.length > 0 && !selectedLog) {
          setSelectedLog(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load admin email logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchEmailLogs();
  }, []);

  const handleInitiatePlatformReport = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSendPlatformReport = async () => {
    setShowConfirmModal(false);
    setIsGeneratingReport(true);
    setFeedback(null);
    try {
      // 1. Generate platform status report from server
      const res = await fetch('/api/email/reports/admin-platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_email: adminEmail,
          admin_name: adminName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to compile platform report');
      }

      // 2. Dispatch via Gmail API if available
      let gmailDelivered = false;
      if (data.report) {
        const sendResult = await sendEmailNotification(data.report);
        if (sendResult.gmailSent) {
          gmailDelivered = true;
        }
      }

      if (gmailDelivered) {
        setFeedback(`✅ Executive Platform Performance PDF Report delivered directly to your Gmail inbox (${adminEmail})!`);
        showToast(`Platform PDF Report dispatched via Gmail to ${adminEmail}`);
      } else if (hasGoogleToken) {
        setFeedback(`Platform Performance PDF Report generated and recorded in admin ledger.`);
        showToast('Platform report generated');
      } else {
        setFeedback(`Platform report generated! To receive it directly in your external Gmail inbox, connect Google Workspace.`);
        showToast('Platform report saved to ledger');
      }

      await fetchEmailLogs();
    } catch (err: any) {
      setFeedback(err.message || 'Error generating platform report');
      showToast(err.message || 'Error generating platform report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleSendCustomerBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      showToast('Subject and message are required.');
      return;
    }

    setIsSendingBroadcast(true);
    try {
      const htmlBody = `
        <div style="font-family: sans-serif; padding: 24px; background: #FFF9FB; border-radius: 12px; border: 1px solid #FCE7F3;">
          <h2 style="color: #BE185D; margin-top: 0;">${broadcastSubject}</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #374151;">${broadcastMessage}</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="https://nailglamhub.com" style="background: #BE185D; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              Book Your Glam Session Now
            </a>
          </div>
          <p style="font-size: 12px; color: #9CA3AF; margin-top: 24px;">Sent by Nail Glam Hub Platform Administration to all subscribed clients.</p>
        </div>
      `;

      // Dispatch via sendEmailNotification
      await sendEmailNotification({
        to: 'customer@nailglamhub.com',
        toName: 'Valued Glam Community',
        role: 'customer',
        subject: broadcastSubject,
        category: 'promo',
        htmlBody,
      });

      showToast('Promotional news broadcast dispatched to registered customer accounts');
      setShowBroadcastModal(false);
      await fetchEmailLogs();
    } catch (err: any) {
      showToast(err.message || 'Error dispatching broadcast');
    } finally {
      setIsSendingBroadcast(false);
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

  const filteredLogs = logs.filter((log) => {
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesSearch =
      searchFilter === '' ||
      log.subject.toLowerCase().includes(searchFilter.toLowerCase()) ||
      log.recipient_email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (log.content_preview && log.content_preview.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Hidden print iframe for reliable zero-popup printing */}
      <iframe ref={printIframeRef} className="hidden" title="Admin Print Frame" />

      {/* Google Workspace / Gmail Status Banner */}
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
                  ? `Executive platform audit reports and alerts will be dispatched directly to your Gmail inbox: ${adminEmail}`
                  : `To deliver platform audit reports directly to your inbox (${adminEmail}), connect your Google account below.`}
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
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
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

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>Administrator Notifications & Status Reports</span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif">
              Platform Email Reports & Ecosystem Audits
            </h2>
            <p className="text-rose-200 text-sm mt-1 leading-relaxed">
              Automated alerts for user registrations, partner salon approvals, and monthly PDF ecosystem audit reports sent to <strong className="text-white underline">{adminEmail}</strong>.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleInitiatePlatformReport}
              disabled={isGeneratingReport}
              className="inline-flex items-center px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <FileText className={`w-4 h-4 mr-2 ${isGeneratingReport ? 'animate-spin' : ''}`} />
              {isGeneratingReport ? 'Generating & Delivering PDF...' : 'Email Platform PDF Report Now'}
            </button>

            <button
              onClick={handleToggleMonthlyPdf}
              className="inline-flex items-center px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm backdrop-blur-sm transition cursor-pointer"
            >
              {monthlyPdfEnabled ? (
                <>
                  <ToggleRight className="w-5 h-5 text-emerald-400 mr-2" />
                  <span>Monthly PDF Delivery: <strong>ON</strong></span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-gray-400 mr-2" />
                  <span>Monthly PDF Delivery: <strong>OFF</strong></span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowBroadcastModal(true)}
              className="inline-flex items-center px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm backdrop-blur-sm transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400 mr-2" />
              <span>Broadcast Promo to Customers</span>
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

      {/* Admin Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-rose-50 text-rose-700">
                <FileText className="w-5 h-5" />
              </span>
              <button onClick={handleToggleMonthlyPdf} className="cursor-pointer">
                {monthlyPdfEnabled ? (
                  <ToggleRight className="w-7 h-7 text-rose-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-gray-400" />
                )}
              </button>
            </div>
            <h3 className="font-bold text-gray-900 text-sm mt-3">Monthly Ecosystem PDF Report</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Automated PDF audit covering active salons, gross transaction volume, and client growth delivered on the 1st of every month.
            </p>
          </div>
          <span className={`text-[11px] font-semibold mt-3 ${monthlyPdfEnabled ? 'text-emerald-600' : 'text-gray-400'}`}>
            Status: {monthlyPdfEnabled ? 'Active (Monthly Delivery)' : 'Disabled by Admin'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <Users className="w-5 h-5" />
              </span>
              <button
                onClick={() => setRegistrationAlertsEnabled(!registrationAlertsEnabled)}
                className="cursor-pointer"
              >
                {registrationAlertsEnabled ? (
                  <ToggleRight className="w-7 h-7 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-gray-400" />
                )}
              </button>
            </div>
            <h3 className="font-bold text-gray-900 text-sm mt-3">New User Registration Alerts</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Receive immediate email alerts whenever a new customer, salon owner, or administrator account is registered or verified.
            </p>
          </div>
          <span className={`text-[11px] font-semibold mt-3 ${registrationAlertsEnabled ? 'text-emerald-600' : 'text-gray-400'}`}>
            Status: {registrationAlertsEnabled ? 'Active (Real-time)' : 'Disabled'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Shield className="w-5 h-5" />
              </span>
              <button
                onClick={() => setSalonApplicationAlertsEnabled(!salonApplicationAlertsEnabled)}
                className="cursor-pointer"
              >
                {salonApplicationAlertsEnabled ? (
                  <ToggleRight className="w-7 h-7 text-blue-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-gray-400" />
                )}
              </button>
            </div>
            <h3 className="font-bold text-gray-900 text-sm mt-3">Salon Approvals Queue Alerts</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Receive security notifications when new salon branches register and await verification before listing.
            </p>
          </div>
          <span className={`text-[11px] font-semibold mt-3 ${salonApplicationAlertsEnabled ? 'text-emerald-600' : 'text-gray-400'}`}>
            Status: {salonApplicationAlertsEnabled ? 'Active (Real-time)' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Global Email Logs & Reports Viewer */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-gray-900 text-sm">Platform Email Dispatches & Reports Ledger</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Filter */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs rounded-xl border border-gray-200 px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="report">Reports</option>
              <option value="alert">Alerts</option>
              <option value="booking">Bookings</option>
              <option value="order">Orders</option>
              <option value="promo">Promo</option>
            </select>

            <button
              onClick={fetchEmailLogs}
              disabled={loadingLogs}
              className="text-xs text-rose-700 hover:text-rose-900 font-semibold inline-flex items-center cursor-pointer p-1.5 rounded-lg hover:bg-gray-100"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
          {/* Logs List */}
          <div className="lg:col-span-5 border-r border-gray-200 divide-y divide-gray-100 max-h-[500px] overflow-y-auto bg-gray-50/40">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">No emails match the filter criteria</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
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
                        ? 'bg-white shadow-xs border-l-4 border-l-rose-600'
                        : 'hover:bg-gray-100/70 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
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
                      <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                        To: {log.recipient_email}
                      </span>
                      {log.has_pdf_attachment && (
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded ml-auto">
                          <FileText className="w-3 h-3 mr-1" />
                          PDF Attached
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Email Preview Pane */}
          <div className="lg:col-span-7 p-6 overflow-y-auto max-h-[500px]">
            {selectedLog ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{selectedLog.subject}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Recipient: <strong>{selectedLog.recipient_email}</strong> ({selectedLog.recipient_role}) • {new Date(selectedLog.sent_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewLog(selectedLog)}
                      className="inline-flex items-center px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      View Full Report
                    </button>

                    {selectedLog.has_pdf_attachment && (
                      <button
                        onClick={() => handlePrintLog(selectedLog)}
                        className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 mr-1.5" />
                        Print / PDF
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
                Select an email log from the left to inspect contents
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MANDATORY USER CONFIRMATION MODAL (Google Workspace Sending Action) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-rose-600 font-bold text-sm">
                <Shield className="w-5 h-5" />
                <span>Confirm Platform Audit Dispatch</span>
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
                Send Platform Status & Ecosystem Audit Report?
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                This will compile and certify current active salons, gross GMV turnover, and ecosystem metrics and deliver the audit dossier to:
              </p>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs font-semibold text-rose-950 flex items-center justify-between">
                <span>Administrator Email:</span>
                <strong className="underline text-rose-700">{adminEmail}</strong>
              </div>

              <div className="p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2 bg-gray-50 border-gray-200 text-gray-700">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  {hasGoogleToken ? (
                    <span>
                      Your Google Workspace account is connected. The report will be dispatched directly to your Gmail inbox via the Gmail API.
                    </span>
                  ) : (
                    <span>
                      The report will be compiled and logged in the platform ledger. Connect Google Workspace above if you wish to receive live emails in your external inbox.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSendPlatformReport}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Audit Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Promo Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-rose-600 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Customer Announcement Broadcast</span>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Subject Header</label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Message Body</label>
                <textarea
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendCustomerBroadcast}
                disabled={isSendingBroadcast}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isSendingBroadcast ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Broadcast...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Announcement</span>
                  </>
                )}
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
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
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
                <a
                  href={`data:text/html;charset=utf-8,${encodeURIComponent(previewLog.pdf_html || previewLog.html_body)}`}
                  download={previewLog.attachment_name || `Platform_Report.html`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download HTML</span>
                </a>

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
                title="Admin Report Document"
                className="w-full h-full min-h-[500px] bg-white rounded-2xl shadow-sm border border-gray-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
