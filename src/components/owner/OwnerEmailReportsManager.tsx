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
  // Notification Preferences (with toggle on and off)
  const prefsKey = `email_prefs_owner_${currentUser.id}_${salon.id}`;
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

  const [bookingAlertsEnabled, setBookingAlertsEnabled] = useState(true);
  const [orderAlertsEnabled, setOrderAlertsEnabled] = useState(true);

  // Email Logs
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Save preferences
  const handleToggleMonthlyPdf = () => {
    const newVal = !monthlyPdfEnabled;
    setMonthlyPdfEnabled(newVal);
    safeLocalStorage.setItem(prefsKey, JSON.stringify({ monthlyPdfEnabled: newVal }));
    showToast(newVal ? 'Monthly automated PDF reports enabled' : 'Monthly automated PDF reports disabled');
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

  // Dispatch Monthly PDF Report to email
  const handleSendMonthlyReport = async () => {
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
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback(`Monthly PDF status report generated and delivered to ${currentUser.email}!`);
        showToast('Monthly PDF report sent to your email');
        await fetchEmailLogs();
      } else {
        setFeedback(data.error || 'Failed to dispatch monthly report');
      }
    } catch (err: any) {
      setFeedback(err.message || 'Error generating monthly report');
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

  return (
    <div className="space-y-6">
      
      {/* Top Controls & Toggle Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-pink-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-3">
            <Mail className="w-3.5 h-3.5 text-pink-300" />
            <span>Automated Reports & Notifications Engine</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-serif">
            Email Reports & Transactional Alerts
          </h2>
          <p className="text-purple-200 text-sm mt-2 leading-relaxed">
            Automatic delivery of booking requests, customer in-store pickup orders, and certified monthly PDF performance reports directly to <strong className="text-white underline">{currentUser.email}</strong>.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleSendMonthlyReport}
              disabled={isGeneratingReport}
              className="inline-flex items-center px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <FileText className={`w-4 h-4 mr-2 ${isGeneratingReport ? 'animate-spin' : ''}`} />
              {isGeneratingReport ? 'Compiling & Delivering PDF...' : 'Email Monthly PDF Report Now'}
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
          </div>
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
            className="text-xs text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
                <FileText className="w-5 h-5" />
              </span>
              <button
                onClick={handleToggleMonthlyPdf}
                className="cursor-pointer"
                title="Toggle on/off"
              >
                {monthlyPdfEnabled ? (
                  <ToggleRight className="w-7 h-7 text-purple-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-gray-400" />
                )}
              </button>
            </div>
            <h3 className="font-bold text-gray-900 text-sm mt-3">Monthly Audit Reports (PDF)</h3>
            <p className="text-xs text-gray-500 mt-1">
              Automatically compiles revenue, expenses, and booking volumes into a PDF delivered on the 1st of every month.
            </p>
          </div>
          <span className={`text-[11px] font-semibold mt-3 ${monthlyPdfEnabled ? 'text-emerald-600' : 'text-gray-400'}`}>
            Status: {monthlyPdfEnabled ? 'Active (Monthly Delivery)' : 'Disabled by Owner'}
          </span>
        </div>

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
            <h3 className="font-bold text-gray-900 text-sm">Delivered Emails & Monthly PDF Reports</h3>
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
                <p className="text-xs font-semibold">No emails delivered yet</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Click "Email Monthly PDF Report Now" above to generate your first audit report.
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
