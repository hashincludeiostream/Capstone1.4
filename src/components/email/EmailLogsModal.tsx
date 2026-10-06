import React, { useState, useEffect } from 'react';
import {
  Mail,
  X,
  FileText,
  CheckCircle2,
  Calendar,
  ShoppingBag,
  Sparkles,
  Shield,
  Printer,
  Download,
  ExternalLink,
  RefreshCw,
  Send,
  Check,
  AlertCircle,
} from 'lucide-react';
import { EmailLog, User, UserRole } from '../../types';
import { sendEmailNotification } from '../../lib/emailService';

interface EmailLogsModalProps {
  currentUser: User;
  onClose: () => void;
}

export const EmailLogsModal: React.FC<EmailLogsModalProps> = ({ currentUser, onClose }) => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSentFeedback, setTestSentFeedback] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // If admin, can see all logs; if customer or owner, filter by their email
      const queryParam = currentUser.user_type === 'admin' ? '' : `?email=${encodeURIComponent(currentUser.email)}`;
      const res = await fetch(`/api/email/logs${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        if (data.length > 0 && !selectedLog) {
          setSelectedLog(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch email logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentUser]);

  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    setTestSentFeedback(null);
    try {
      const result = await sendEmailNotification({
        to: currentUser.email,
        toName: currentUser.fullname,
        role: currentUser.user_type,
        subject: `Live Test Notification 💅 Delivered to ${currentUser.email}`,
        category: currentUser.user_type === 'salon_owner' ? 'report' : currentUser.user_type === 'admin' ? 'alert' : 'booking',
        htmlBody: `
          <div style="font-family: sans-serif; padding: 20px; background: #FFF9FB; border-radius: 12px; border: 1px solid #FCE7F3;">
            <h2 style="color: #BE185D; margin-top: 0;">Automated System Test Dispatched! 💅</h2>
            <p>Hello <strong>${currentUser.fullname}</strong>,</p>
            <p>This automated test message confirms that real-time email dispatch is connected to your Gmail address: <strong>${currentUser.email}</strong>.</p>
            <div style="background: #ffffff; border: 1px solid #FCE7F3; border-radius: 8px; padding: 12px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>Recipient:</strong> ${currentUser.email}</p>
              <p style="margin: 4px 0;"><strong>Role:</strong> ${currentUser.user_type.replace('_', ' ')}</p>
              <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
              <p style="margin: 4px 0;"><strong>Delivery Engine:</strong> Verified Platform Mailer</p>
            </div>
            <p style="font-size: 13px; color: #6B7280;">You will receive all transactional alerts and status updates here.</p>
          </div>
        `,
      });

      if (result.success) {
        setTestSentFeedback('Test email successfully dispatched!');
        await fetchLogs();
        setTimeout(() => setTestSentFeedback(null), 4000);
      } else {
        setTestSentFeedback(result.error || 'Failed to send test email');
      }
    } catch (err: any) {
      setTestSentFeedback(err.message || 'Error dispatching test email');
    } finally {
      setIsSendingTest(false);
    }
  };

  const handlePrintOrDownloadPdf = (log: EmailLog) => {
    if (!log.pdf_html && !log.html_body) return;
    const content = log.pdf_html || log.html_body;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'booking':
        return <Calendar className="w-4 h-4 text-pink-500" />;
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-purple-500" />;
      case 'report':
        return <FileText className="w-4 h-4 text-emerald-500" />;
      case 'promo':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'alert':
        return <Shield className="w-4 h-4 text-indigo-500" />;
      default:
        return <Mail className="w-4 h-4 text-pink-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-pink-100 my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-pink-100 bg-gradient-to-r from-pink-50 via-white to-pink-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 shadow-sm shrink-0">
              <Mail className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">Email History</h2>
                <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-100 text-emerald-800 shrink-0">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate">
                Delivered notifications for <span className="font-semibold text-gray-700">{currentUser.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end space-x-2 shrink-0">
            <button
              onClick={handleSendTestEmail}
              disabled={isSendingTest}
              className="inline-flex items-center px-2.5 sm:px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className={`w-3.5 h-3.5 mr-1.5 ${isSendingTest ? 'animate-spin' : ''}`} />
              <span className="truncate">{isSendingTest ? 'Sending...' : 'Send Test'}</span>
            </button>
            <button
              onClick={fetchLogs}
              title="Refresh"
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {testSentFeedback && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-800 font-medium animate-in fade-in">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{testSentFeedback}</span>
            </div>
          </div>
        )}

        {/* Two-Column Split Pane */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          
          {/* Left: Email List */}
          <div className="w-full md:w-2/5 max-h-48 md:max-h-none border-b md:border-b-0 md:border-r border-gray-200 overflow-y-auto bg-gray-50/50 shrink-0 md:shrink min-h-0">
            {loading && logs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-pink-500" />
                <p className="text-xs">Loading email records...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold text-gray-600">No email records found</p>
                <p className="text-xs text-gray-400 mt-1">Notifications and reports will appear here when dispatched.</p>
                <button
                  onClick={handleSendTestEmail}
                  className="mt-3 text-xs text-pink-600 font-semibold hover:underline inline-flex items-center"
                >
                  Send a test notification now →
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {logs.map((log) => {
                  const isSelected = selectedLog?.id === log.id;
                  const dateStr = log.sent_at ? new Date(log.sent_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';

                  return (
                    <button
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`w-full text-left p-3 sm:p-3.5 transition flex flex-col space-y-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-white shadow-xs border-l-4 border-l-pink-600'
                          : 'hover:bg-gray-100/70 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 min-w-0 pr-2">
                          {getCategoryIcon(log.category)}
                          <span className="text-xs font-semibold text-gray-800 capitalize truncate">
                            {log.category}
                          </span>
                          {log.has_pdf_attachment && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-pink-100 text-pink-700 shrink-0">
                              PDF
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">{dateStr}</span>
                      </div>

                      <div className="text-xs font-semibold text-gray-900 truncate">
                        {log.subject}
                      </div>

                      <p className="text-[11px] text-gray-500 line-clamp-1 leading-relaxed">
                        {log.content_preview || 'Click to view email body'}
                      </p>

                      <div className="text-[10px] text-gray-400 flex items-center justify-between pt-0.5">
                        <span className="truncate pr-1">To: {log.recipient_email}</span>
                        <span className="text-emerald-600 font-medium shrink-0">Delivered</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Rendered Email Preview */}
          <div className="w-full md:w-3/5 overflow-y-auto bg-white p-4 sm:p-6 flex flex-col flex-1 min-h-0">
            {selectedLog ? (
              <div className="space-y-4">
                
                {/* Email Metadata Card */}
                <div className="bg-gray-50 rounded-xl p-3.5 sm:p-4 border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 break-words">{selectedLog.subject}</h3>
                      <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                        <p className="truncate"><strong>From:</strong> {selectedLog.sender_email || 'notifications@nailglamhub.com'}</p>
                        <p className="truncate"><strong>To:</strong> {selectedLog.recipient_email} ({selectedLog.recipient_name || selectedLog.recipient_role})</p>
                        <p><strong>Date Sent:</strong> {new Date(selectedLog.sent_at).toLocaleString()}</p>
                      </div>
                    </div>

                    {selectedLog.has_pdf_attachment && (
                      <button
                        onClick={() => handlePrintOrDownloadPdf(selectedLog)}
                        className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition shrink-0 cursor-pointer self-start"
                      >
                        <Printer className="w-3.5 h-3.5 mr-1.5" />
                        Print / PDF Report
                      </button>
                    )}
                  </div>

                  {selectedLog.has_pdf_attachment && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center space-x-2 text-xs text-emerald-800">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold shrink-0">Attached PDF:</span>
                      <span className="font-mono text-gray-600 truncate">{selectedLog.attachment_name || 'Monthly_Report.pdf'}</span>
                    </div>
                  )}
                </div>

                {/* Email Body Rendering */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-[#FDF7FA] p-3.5 sm:p-4">
                  <div
                    className="prose prose-sm max-w-none text-gray-800 text-xs sm:text-sm overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: selectedLog.html_body }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-8">
                <Mail className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm font-medium">Select an email to view full content</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="truncate">Gmail API &amp; Server Relay connected. Emails automatically dispatched.</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition cursor-pointer text-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
