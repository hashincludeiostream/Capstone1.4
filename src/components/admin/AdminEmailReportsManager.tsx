import React, { useState, useEffect } from 'react';
import {
  Mail,
  FileText,
  Send,
  Printer,
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
} from 'lucide-react';
import { User, EmailLog } from '../../types';
import { localStorage as safeLocalStorage } from '../../lib/localStorage';

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

  const handleToggleMonthlyPdf = () => {
    const newVal = !monthlyPdfEnabled;
    setMonthlyPdfEnabled(newVal);
    safeLocalStorage.setItem(prefsKey, JSON.stringify({ monthlyPdfEnabled: newVal }));
    showToast(newVal ? 'Monthly automated platform PDF reports enabled' : 'Monthly automated platform PDF reports disabled');
  };

  const fetchEmailLogs = async () => {
    setLoadingLogs(true);
    try {
      // Fetch all system logs for admin
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

  const handleSendPlatformReport = async () => {
    setIsGeneratingReport(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/email/reports/admin-platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_email: adminEmail,
          admin_name: adminName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback(`Executive Platform Performance PDF Report delivered to ${adminEmail}!`);
        showToast('Platform PDF Report dispatched to admin inbox');
        await fetchEmailLogs();
      } else {
        setFeedback(data.error || 'Failed to dispatch platform report');
      }
    } catch (err: any) {
      setFeedback(err.message || 'Error generating platform report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleSendCustomerBroadcast = async () => {
    if (!broadcastSubject || !broadcastMessage) {
      alert('Subject and message are required.');
      return;
    }

    setIsSendingBroadcast(true);
    try {
      // Dispatches promo to customers and logs in email_logs
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'customer@nailglamhub.com',
          toName: 'Valued Glam Community',
          role: 'customer',
          subject: broadcastSubject,
          category: 'promo',
          htmlBody: `
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
          `,
        }),
      });

      if (res.ok) {
        showToast('Promotional news broadcast dispatched to registered customer accounts');
        setShowBroadcastModal(false);
        await fetchEmailLogs();
      } else {
        showToast('Failed to dispatch broadcast');
      }
    } catch (err: any) {
      showToast(err.message || 'Error dispatching broadcast');
    } finally {
      setIsSendingBroadcast(false);
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
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-3">
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>Administrator Notifications & Status Reports</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-serif">
            Platform Email Reports & Security Alerts
          </h2>
          <p className="text-rose-200 text-sm mt-2 leading-relaxed">
            Automated alerts for new user registrations, partner salon approvals, and monthly PDF ecosystem audit reports sent to <strong className="text-white underline">{adminEmail}</strong>.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleSendPlatformReport}
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
            <p className="text-xs text-gray-500 mt-1">
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
            <p className="text-xs text-gray-500 mt-1">
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
            <p className="text-xs text-gray-500 mt-1">
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
            <h3 className="font-bold text-gray-900 text-sm">Platform Dispatched Emails & Reports</h3>
            <span className="text-xs text-gray-400 font-normal">({filteredLogs.length} records)</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject or email..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              onClick={fetchEmailLogs}
              disabled={loadingLogs}
              className="text-xs text-rose-700 hover:text-rose-900 font-semibold inline-flex items-center cursor-pointer p-2 hover:bg-rose-50 rounded-lg transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-2 border-b border-gray-100 bg-gray-50 flex items-center space-x-2 overflow-x-auto text-xs">
          <span className="text-gray-400 font-medium">Category:</span>
          {['all', 'alert', 'report', 'booking', 'order', 'promo', 'verification'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-0.5 rounded-full capitalize font-medium transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
          {/* Email List */}
          <div className="lg:col-span-5 border-r border-gray-200 divide-y divide-gray-100 max-h-[500px] overflow-y-auto bg-gray-50/30">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">No emails match filters</p>
                <p className="text-[11px] text-gray-400 mt-1">Dispatched emails appear here in real-time.</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                const dateStr = log.sent_at ? new Date(log.sent_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';

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
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-gray-400">To: {log.recipient_email}</span>
                      {log.has_pdf_attachment && (
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                          <FileText className="w-3 h-3 mr-1" />
                          PDF
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
                <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{selectedLog.subject}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      To: <strong>{selectedLog.recipient_email}</strong> ({selectedLog.recipient_role}) • {new Date(selectedLog.sent_at).toLocaleString()}
                    </p>
                  </div>
                  {selectedLog.has_pdf_attachment && (
                    <button
                      onClick={() => handlePrintPdf(selectedLog)}
                      className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
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
                Select an email from the list to preview
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Broadcast Promo Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-100">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-600" />
              Broadcast Promo to Registered Customers
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Dispatch live promotional news and discount updates directly to client email accounts.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Promo Message / Update
                </label>
                <textarea
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendCustomerBroadcast}
                disabled={isSendingBroadcast}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm transition cursor-pointer disabled:opacity-50 inline-flex items-center"
              >
                <Send className={`w-3.5 h-3.5 mr-1.5 ${isSendingBroadcast ? 'animate-spin' : ''}`} />
                {isSendingBroadcast ? 'Delivering...' : 'Send Promo Emails'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
