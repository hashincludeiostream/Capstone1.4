import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  MessageCircle,
  X,
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
  Bot,
  User as UserIcon,
  Store,
  Shield,
  Heart,
  Calendar,
  ShoppingBag,
  ExternalLink,
  RotateCcw,
  Minimize2,
  Maximize2,
  Flame,
  Lock,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Compass,
  Search,
  ArrowRight,
} from 'lucide-react';
import { User, Salon } from '../../types';
import { sendChatMessage, ChatApiMessage } from '../../lib/api';
import { CHATBOT_FAQS, ChatbotFaq } from '../../data/chatbotFaqs';

interface ChatWidgetProps {
  currentUser: User | null;
  activeTab: string;
  salons?: Salon[];
  onNavigate: (tab: string, targetDomId?: string) => void;
  onOpenBookingModal?: () => void;
}

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: 'gemini' | 'fallback';
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  currentUser,
  activeTab,
  salons = [],
  onNavigate,
  onOpenBookingModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'faqs'>('chat');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);

  // FAQ state
  const [faqCategory, setFaqCategory] = useState<string>('all');
  const [faqSearchQuery, setFaqSearchQuery] = useState<string>('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-nav-overview');

  // Strictly derive effective role from currently authenticated account
  const effectiveRole: 'customer' | 'salon_owner' | 'admin' =
    currentUser?.user_type === 'salon_owner'
      ? 'salon_owner'
      : currentUser?.user_type === 'admin'
      ? 'admin'
      : 'customer';

  // Distinct isolated storage key per logged-in account type & ID
  const sessionKey = currentUser
    ? `glambot_chat_${currentUser.user_type}_u${currentUser.id}`
    : 'glambot_chat_guest';

  // Messages state with per-session persistence
  const [messages, setMessages] = useState<DisplayMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter FAQs according to session access & search/category
  const filteredFaqs = useMemo(() => {
    return CHATBOT_FAQS.filter((faq) => {
      // 1. Role permission enforcement: hide restricted owner/admin items from customers
      if (faq.roles && !faq.roles.includes(effectiveRole) && !faq.roles.includes('guest')) {
        return false;
      }

      // 2. Category filter
      if (faqCategory !== 'all' && faq.category !== faqCategory) {
        return false;
      }

      // 3. Search query filter
      if (faqSearchQuery.trim()) {
        const q = faqSearchQuery.toLowerCase();
        const matchesQ = faq.question.toLowerCase().includes(q);
        const matchesA = faq.answer.toLowerCase().includes(q);
        const matchesCat = faq.categoryLabel.toLowerCase().includes(q);
        return matchesQ || matchesA || matchesCat;
      }

      return true;
    });
  }, [effectiveRole, faqCategory, faqSearchQuery]);

  // Categories available based on current role
  const availableCategories = useMemo(() => {
    const cats = [
      { id: 'all', label: 'All FAQs' },
      { id: 'navigation', label: '🧭 Navigation' },
      { id: 'general', label: '⚙️ How System Works' },
      { id: 'booking', label: '📅 Bookings' },
      { id: 'pickup', label: '🛍️ In-Store Pickups' },
    ];

    if (effectiveRole === 'salon_owner' || effectiveRole === 'admin') {
      cats.push({ id: 'owner', label: '🏢 Salon Partners' });
    }
    if (effectiveRole === 'admin') {
      cats.push({ id: 'admin', label: '🛡️ Platform Admin' });
    }

    return cats;
  }, [effectiveRole]);

  // Automatically adjust and load session-isolated messages when active account/role changes
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(sessionKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not read chat history from sessionStorage:', e);
    }

    // Default to role-specific greeting if new or empty session
    const greeting = getInitialGreeting(effectiveRole, currentUser?.fullname);
    setMessages([greeting]);
  }, [sessionKey, effectiveRole, currentUser?.fullname]);

  // Persist messages to this specific sessionKey
  useEffect(() => {
    if (messages.length > 0) {
      try {
        sessionStorage.setItem(sessionKey, JSON.stringify(messages));
      } catch (e) {
        console.warn('Could not save chat history to sessionStorage:', e);
      }
    }
  }, [messages, sessionKey]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeView === 'chat') {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, activeView, messages, loading]);

  function getInitialGreeting(role: 'customer' | 'salon_owner' | 'admin', name?: string): DisplayMessage {
    const formattedName = name ? ` ${name}` : '';
    if (role === 'salon_owner') {
      return {
        id: 'init-owner',
        role: 'assistant',
        content: `👋 Hello${formattedName}! I'm **GlamBot**, your executive **Salon Business & Operations Co-Pilot**.

I'm here to assist you with:
- 🧭 **Portal Navigation**: Guiding you through P&L reports, appointments, technicians, and branches.
- 📊 **Financial P&L & Margins**: Understanding gross revenues, commissions, and net profit.
- 📅 **Bookings & Slots**: Managing client appointments and scheduling.
- 📦 **Inventory & Stock**: Reorder thresholds and in-store retail reservations.
- 🏢 **Staff & Branches**: Adding technicians and managing multiple locations.

You can also check the **FAQs & System Guide** tab above for quick answers!
[ACTION:owner-overview|Financial P&L] [ACTION:owner-appointments|Manage Bookings] [ACTION:owner-inventory|Stock & Inventory]`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'fallback',
      };
    }

    if (role === 'admin') {
      return {
        id: 'init-admin',
        role: 'assistant',
        content: `🛡️ Greetings Administrator${formattedName}! I'm **GlamBot**, your **Platform Governance & Intelligence Assistant**.

I can assist with:
- 🧭 **Suite Navigation**: Quick access to salon verification, user management, and broadcast announcements.
- 📋 **Salon Accreditation**: Standards for reviewing and approving salon partners.
- 📢 **Broadcast Announcements**: Deploying promotional campaigns and banners.
- 👥 **User Moderation**: Reviewing customer feedback, accounts, and system access.
- 📈 **Platform Metrics**: Overview of system bookings, revenue, and active venues.

What administrative task would you like to review?
[ACTION:admin-dashboard|Admin Dashboard] [ACTION:admin-salons|Review Salons] [ACTION:admin-announcements|Manage Announcements]`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'fallback',
      };
    }

    return {
      id: 'init-customer',
      role: 'assistant',
      content: `✨ Welcome to **Nail Glam Hub**${formattedName}! I'm **GlamBot**, your all-around website guide and beauty concierge.

I'm here to help you:
- 🧭 **Navigate the Website**: Step-by-step guidance on exploring salons, the interactive map, and services.
- 💅 **Find Salons & Artists**: Discover top-rated verified studios near you in Metro Manila.
- 📅 **Book Appointments**: Reserve dates, pick certified technicians, and pay via PayMongo or Cash on Visit.
- 🛍️ **In-Store Retail Pickups**: Reserve salon-grade cuticle oils and kits with 0 advance fee.
- ❓ **System FAQs**: Tap the **FAQs & System Guide** tab above to explore how everything works!

How can I help you today?
[ACTION:explore|Explore Salons] [ACTION:services|View Services] [ACTION:map|Interactive Map] [ACTION:products|Shop Retail Boutique]`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'fallback',
    };
  }

  // Quick prompt suggestions based strictly on active session role
  const quickPrompts = {
    customer: [
      '🧭 How do I navigate through the website?',
      '⚙️ How does the system work?',
      '📅 How do I book an appointment?',
      '🛍️ How does in-store product pickup work?',
      '🗺️ How do I find salons on the map?',
      '💳 What payment methods are accepted?',
    ],
    salon_owner: [
      '🧭 Salon Owner portal navigation guide',
      '📊 How do labor commissions and P&L work?',
      '📦 Managing low stock inventory',
      '🏢 How does multi-branch management work?',
      '📅 How do I assign staff to appointments?',
    ],
    admin: [
      '🧭 Admin suite navigation guide',
      '📋 Salon accreditation audit criteria',
      '📢 How to broadcast promotional banners',
      '👥 Platform user roles & governance',
    ],
  }[effectiveRole];

  // Send message handler
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMsg: DisplayMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setLoading(true);

    try {
      // Prepare payload for API
      const apiMessages: ChatApiMessage[] = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendChatMessage({
        messages: apiMessages,
        userRole: effectiveRole,
        userId: currentUser?.id,
        userName: currentUser?.fullname,
        currentTab: activeTab,
      });

      const assistantMsg: DisplayMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: response.source,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: DisplayMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          "I apologize, I encountered a temporary connection issue. Please feel free to ask again, or use one of the quick options below!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'fallback',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    const greeting = getInitialGreeting(effectiveRole, currentUser?.fullname);
    setMessages([greeting]);
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify([greeting]));
    } catch (e) {
      console.warn('Could not reset session storage:', e);
    }
  };

  const handleActionClick = (actionKey: string) => {
    // Role boundary enforcement to ensure Customer mode cannot access Owner or Admin modes
    if (actionKey.startsWith('owner-')) {
      if (effectiveRole !== 'salon_owner' && effectiveRole !== 'admin') {
        setPermissionNotice('⚠️ Access Restricted: Salon Owner features require a verified Salon Partner session.');
        setTimeout(() => setPermissionNotice(null), 4000);
        return;
      }
    }

    if (actionKey.startsWith('admin-')) {
      if (effectiveRole !== 'admin') {
        setPermissionNotice('⚠️ Access Restricted: Administrative tools require a verified Platform Administrator session.');
        setTimeout(() => setPermissionNotice(null), 4000);
        return;
      }
    }

    if (actionKey === 'booking') {
      if (onOpenBookingModal) {
        onOpenBookingModal();
      } else {
        onNavigate('explore');
      }
      return;
    }

    onNavigate(actionKey);

    // On mobile or standard screen, minimize chat so user can see destination immediately
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  // Helper to parse message text and render actions as interactive buttons
  const renderMessageContent = (text: string) => {
    // Regex to match [ACTION:key|Label]
    const actionRegex = /\[ACTION:([a-zA-Z0-9_-]+)\|([^\]]+)\]/g;
    const actions: Array<{ key: string; label: string }> = [];

    let match;
    while ((match = actionRegex.exec(text)) !== null) {
      actions.push({ key: match[1], label: match[2] });
    }

    // Clean text by removing action tags for display
    const cleanedText = text.replace(actionRegex, '').trim();

    // Simple markdown parsing for bold and bullet lists
    const lines = cleanedText.split('\n');

    return (
      <div className="space-y-2">
        <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-gray-800">
          {lines.map((line, idx) => {
            if (line.startsWith('### ')) {
              return (
                <h4 key={idx} className="font-bold text-gray-900 text-sm mt-2 mb-1">
                  {line.replace('### ', '')}
                </h4>
              );
            }
            if (line.startsWith('- ') || line.startsWith('* ')) {
              const formatted = formatBoldText(line.substring(2));
              return (
                <div key={idx} className="flex items-start gap-1.5 ml-1 my-0.5">
                  <span className="text-pink-500 font-bold shrink-0">•</span>
                  <span>{formatted}</span>
                </div>
              );
            }
            return (
              <p key={idx} className="my-1">
                {formatBoldText(line)}
              </p>
            );
          })}
        </div>

        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-1.5 border-t border-gray-100 mt-2">
            {actions.map((act, i) => (
              <button
                key={i}
                onClick={() => handleActionClick(act.key)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 hover:text-pink-800 text-xs font-semibold border border-pink-200 shadow-2xs transition-all cursor-pointer"
              >
                <span>{act.label}</span>
                <ExternalLink className="w-3 h-3 opacity-75" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  function formatBoldText(str: string) {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  }

  return (
    <>
      {/* FLOATING TRIGGER BUTTON (When collapsed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          aria-label="Open GlamBot Chatbot"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 animate-pulse text-pink-200" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white ring-1 ring-emerald-500 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold tracking-wide">Ask GlamBot</span>
            <span className="text-[10px] text-pink-100 font-medium hidden sm:inline">
              {effectiveRole === 'salon_owner'
                ? 'Owner Co-Pilot'
                : effectiveRole === 'admin'
                ? 'Admin Intelligence'
                : 'AI Beauty Concierge'}
            </span>
          </div>
        </button>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 shadow-2xl flex flex-col bg-white border border-gray-200 rounded-3xl overflow-hidden ${
            isExpanded
              ? 'bottom-2 right-2 left-2 top-2 sm:bottom-6 sm:right-6 sm:left-auto sm:top-auto sm:w-[540px] sm:h-[680px]'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[410px] h-[550px] max-h-[85vh]'
          }`}
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-purple-700 text-white p-3.5 sm:p-4 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/30 shadow-inner">
                {effectiveRole === 'salon_owner' ? (
                  <Store className="w-5 h-5 text-amber-200" />
                ) : effectiveRole === 'admin' ? (
                  <Shield className="w-5 h-5 text-rose-200" />
                ) : (
                  <Sparkles className="w-5 h-5 text-pink-200" />
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-pink-700" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-tight">GlamBot</h3>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-white/20 text-white uppercase tracking-wider">
                    {effectiveRole === 'salon_owner'
                      ? 'Owner'
                      : effectiveRole === 'admin'
                      ? 'Admin'
                      : 'AI Concierge'}
                  </span>
                </div>
                <p className="text-[11px] text-pink-100 font-medium">
                  {effectiveRole === 'salon_owner'
                    ? 'Salon Operations & P&L Co-Pilot'
                    : effectiveRole === 'admin'
                    ? 'Platform Governance Intelligence'
                    : 'Beauty Discovery & Booking Guide'}
                </p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1.5 text-white">
              {/* Authenticated Session Role Badge */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/20 text-white shadow-2xs"
                title={`Active Session: ${
                  effectiveRole === 'salon_owner'
                    ? 'Salon Partner Mode'
                    : effectiveRole === 'admin'
                    ? 'Platform Administrator Mode'
                    : 'Customer Concierge Mode'
                }`}
              >
                <Lock className="w-3 h-3 text-pink-200" />
                <span className="text-[10px] font-semibold tracking-wide whitespace-nowrap">
                  {effectiveRole === 'salon_owner'
                    ? 'Owner Session'
                    : effectiveRole === 'admin'
                    ? 'Admin Session'
                    : 'Client Session'}
                </span>
              </div>

              <button
                onClick={handleClearChat}
                title="Clear conversation"
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer text-pink-100 hover:text-white"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore size' : 'Expand window'}
                className="hidden sm:inline-flex p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer text-pink-100 hover:text-white"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer text-pink-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PERMISSION VIOLATION ALERT BANNER */}
          {permissionNotice && (
            <div className="bg-amber-600 text-white text-[11px] font-medium px-3.5 py-2 flex items-center justify-between shadow-xs shrink-0">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{permissionNotice}</span>
              </div>
              <button
                onClick={() => setPermissionNotice(null)}
                className="p-0.5 hover:bg-amber-700 rounded transition-colors cursor-pointer ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* VIEW SWITCHER & ACTIVE TAB BAR */}
          <div className="bg-white border-b border-gray-150 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-0.5 bg-gray-100/90 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveView('chat')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'chat'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-pink-600" />
                <span>Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('faqs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'faqs'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                <span>FAQs & Guide</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeView === 'faqs'
                      ? 'bg-pink-100 text-pink-700'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {filteredFaqs.length}
                </span>
              </button>
            </div>

            {/* Context Chip */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-gray-500 font-medium truncate max-w-[140px]">
              <span className="text-gray-400">At:</span>
              <span className="text-gray-800 font-semibold truncate capitalize">
                {activeTab.replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* VIEW: FAQS & SYSTEM GUIDE */}
          {activeView === 'faqs' ? (
            <div className="flex-1 overflow-y-auto flex flex-col bg-gray-50/70">
              {/* FAQ Search Bar */}
              <div className="p-3 bg-white border-b border-gray-150 space-y-2 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={faqSearchQuery}
                    onChange={(e) => setFaqSearchQuery(e.target.value)}
                    placeholder="Search navigation, booking, pickups, or system..."
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-8 py-2 outline-none focus:border-pink-500 focus:bg-white transition-all text-gray-900"
                  />
                  {faqSearchQuery && (
                    <button
                      onClick={() => setFaqSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFaqCategory(cat.id)}
                      className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer shrink-0 ${
                        faqCategory === cat.id
                          ? 'bg-pink-600 text-white shadow-2xs font-semibold'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ Accordion List */}
              <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
                {filteredFaqs.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 text-xs">
                    <HelpCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700">No matching FAQs found</p>
                    <p className="text-gray-400 mt-1">Try another search term or switch categories.</p>
                  </div>
                ) : (
                  filteredFaqs.map((faq) => {
                    const isExpanded = expandedFaqId === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs transition-all hover:border-pink-200"
                      >
                        {/* Question Header */}
                        <button
                          onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                          className="w-full text-left p-3 flex items-start justify-between gap-2.5 hover:bg-gray-50/80 transition-colors cursor-pointer"
                        >
                          <div className="space-y-1">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 border border-pink-100">
                              {faq.categoryLabel}
                            </span>
                            <h4 className="text-xs font-semibold text-gray-900 leading-snug">
                              {faq.question}
                            </h4>
                          </div>
                          <div className="p-1 text-gray-400 shrink-0 mt-0.5">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-pink-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </button>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="px-3 pb-3.5 pt-1 border-t border-gray-100 bg-gray-50/40 text-xs text-gray-700 space-y-3">
                            <div className="whitespace-pre-line leading-relaxed text-gray-700">
                              {faq.answer}
                            </div>

                            {/* Actions inside FAQ */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-150">
                              {faq.actionKey && faq.actionLabel && (
                                <button
                                  onClick={() => handleActionClick(faq.actionKey!)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl text-xs font-semibold hover:shadow-sm transition-all cursor-pointer"
                                >
                                  <span>{faq.actionLabel}</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setActiveView('chat');
                                  handleSendMessage(faq.question);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 hover:border-pink-300 text-gray-700 hover:text-pink-700 rounded-xl text-xs font-medium transition-all cursor-pointer"
                                title="Ask GlamBot more about this"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-pink-500" />
                                <span>Ask GlamBot</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Return Bar */}
              <div className="p-2.5 bg-white border-t border-gray-150 text-center shrink-0">
                <button
                  onClick={() => setActiveView('chat')}
                  className="text-xs text-pink-600 font-semibold hover:text-pink-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Have another question? Chat with GlamBot</span>
                </button>
              </div>
            </div>
          ) : (
            /* VIEW: INTERACTIVE CHAT */
            <>
              {/* MESSAGES BODY */}
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 bg-gray-50/60">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 mt-0.5 border border-pink-200 shadow-2xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-3 shadow-2xs ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-tr-none'
                          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      ) : (
                        renderMessageContent(msg.content)
                      )}

                      <div
                        className={`mt-1 flex items-center gap-1.5 text-[9px] ${
                          msg.role === 'user' ? 'text-pink-200 justify-end' : 'text-gray-400 justify-start'
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {msg.source === 'gemini' && (
                          <span className="px-1 py-0.2 bg-emerald-50 text-emerald-600 rounded text-[9px] font-semibold border border-emerald-200">
                            AI
                          </span>
                        )}
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-xl bg-pink-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Thinking / Typing Indicator */}
                {loading && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-7 h-7 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 border border-pink-200 shadow-2xs animate-pulse">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-3 shadow-2xs flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-gray-500 italic">GlamBot is thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* QUICK PROMPT CHIPS */}
              <div className="p-2 sm:p-2.5 bg-white border-t border-gray-100 overflow-x-auto flex gap-1.5 scrollbar-none shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveView('faqs')}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-semibold border border-purple-200 transition-all cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <BookOpen className="w-3 h-3 text-purple-600" />
                  <span>Browse System FAQs</span>
                </button>
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    disabled={loading}
                    onClick={() => handleSendMessage(prompt)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-gray-100 hover:bg-pink-50 hover:text-pink-700 text-gray-600 text-[11px] font-medium border border-gray-200/80 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* INPUT BAR */}
              <div className="p-2.5 sm:p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  disabled={loading}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    effectiveRole === 'salon_owner'
                      ? 'Ask about P&L, commissions, stock, staff...'
                      : effectiveRole === 'admin'
                      ? 'Ask about salon verification, users, governance...'
                      : 'Ask about navigating the site, salons, booking...'
                  }
                  className="flex-1 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 text-gray-900 transition-all"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || loading}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md transition-all cursor-pointer shrink-0"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
