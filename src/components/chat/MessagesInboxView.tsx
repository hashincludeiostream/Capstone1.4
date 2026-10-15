import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  Check,
  CheckCheck,
  Calendar,
  Clock,
  Phone,
  Mail,
  Store,
  User as UserIcon,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Plus,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { User, Salon, ConversationChannel, PrivateMessage } from '../../types';
import { fetchConversations, fetchMessages, sendPrivateMessage, markMessagesRead } from '../../lib/api';

interface MessagesInboxViewProps {
  currentUser: User;
  salons?: Salon[];
  initialConversationId?: string;
  onNavigateToBooking?: (salonId: number) => void;
  onViewSalon?: (salonId: number) => void;
}

export const MessagesInboxView: React.FC<MessagesInboxViewProps> = ({
  currentUser,
  salons = [],
  initialConversationId,
  onNavigateToBooking,
  onViewSalon,
}) => {
  const [conversations, setConversations] = useState<ConversationChannel[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(initialConversationId || null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileViewingThread, setIsMobileViewingThread] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedNewSalonId, setSelectedNewSalonId] = useState<number | null>(salons[0]?.id || 1);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isCustomer = currentUser.user_type === 'customer';
  const isOwner = currentUser.user_type === 'salon_owner';

  // Load conversations
  const loadConversations = async (keepSelection = true) => {
    try {
      const data = await fetchConversations({
        user_id: currentUser.id,
        user_type: currentUser.user_type,
      });
      setConversations(data);
      if (data.length > 0) {
        if (!keepSelection || !selectedConvId || !data.some((c) => c.conversation_id === selectedConvId)) {
          setSelectedConvId(data[0].conversation_id);
        }
      }
    } catch (err) {
      console.warn('Failed to load conversations:', err);
    } finally {
      setLoadingChannels(false);
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(() => loadConversations(true), 12000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Handle selected conversation change
  const activeConversation = conversations.find((c) => c.conversation_id === selectedConvId) || conversations[0];

  // Load messages for selected thread
  const loadMessages = async () => {
    if (!activeConversation) return;
    try {
      const data = await fetchMessages({
        conversation_id: activeConversation.conversation_id,
        salon_id: activeConversation.salon_id,
        customer_id: activeConversation.customer_id,
      });
      setMessages(data);

      // Mark read
      if (activeConversation.unread_count > 0) {
        await markMessagesRead({
          conversation_id: activeConversation.conversation_id,
          salon_id: activeConversation.salon_id,
          customer_id: activeConversation.customer_id,
        });
        // Clear unread in local channel
        setConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === activeConversation.conversation_id ? { ...c, unread_count: 0 } : c
          )
        );
      }
    } catch (err) {
      console.warn('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeConversation) {
      setLoadingMessages(true);
      loadMessages();
      const interval = setInterval(loadMessages, 6000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [selectedConvId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeConversation || sending) return;

    setSending(true);
    setInputText('');

    try {
      const created = await sendPrivateMessage({
        salon_id: activeConversation.salon_id,
        customer_id: activeConversation.customer_id,
        sender_id: currentUser.id,
        sender_name: currentUser.fullname,
        sender_role: currentUser.user_type as any,
        recipient_id: isCustomer ? activeConversation.salon_owner_id : activeConversation.customer_id,
        recipient_name: isCustomer ? activeConversation.salon_name : activeConversation.customer_name,
        content: text,
        appointment_id: activeConversation.active_appointment?.id,
      });

      setMessages((prev) => [...prev, created]);
      // Update snippet in channel list
      setConversations((prev) =>
        prev.map((c) =>
          c.conversation_id === activeConversation.conversation_id
            ? { ...c, last_message: text, last_timestamp: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to send private message:', err);
    } finally {
      setSending(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const targetName = isCustomer ? c.salon_name : c.customer_name;
    const matchName = targetName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchMsg = c.last_message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchName || matchMsg;
  });

  // Start new chat with a salon (for customers)
  const handleStartNewChat = async () => {
    if (!selectedNewSalonId) return;
    const targetSalon = salons.find((s) => s.id === selectedNewSalonId);
    if (!targetSalon) return;

    const convId = `salon_${targetSalon.id}_cust_${currentUser.id}`;
    const newChan: ConversationChannel = {
      conversation_id: convId,
      salon_id: Number(targetSalon.id),
      salon_name: targetSalon.salon_name,
      salon_logo: targetSalon.logo,
      salon_phone: targetSalon.phone,
      salon_owner_id: Number(targetSalon.owner_id),
      customer_id: currentUser.id,
      customer_name: currentUser.fullname,
      customer_phone: currentUser.phone,
      customer_email: currentUser.email,
      last_message: 'Conversation started.',
      last_timestamp: new Date().toISOString(),
      last_sender_id: currentUser.id,
      last_sender_role: 'customer',
      unread_count: 0,
    };

    setConversations((prev) => {
      const exists = prev.find((c) => c.conversation_id === convId);
      return exists ? prev : [newChan, ...prev];
    });

    setSelectedConvId(convId);
    setShowNewChatModal(false);
    setIsMobileViewingThread(true);
  };

  // Preset quick reply suggestions
  const customerQuickReplies = [
    'Can I request a custom chrome finish for my appointment?',
    'Is parking available right outside the salon?',
    'What is the recommended prep before my Russian manicure?',
    'I might arrive 5-10 minutes early!',
  ];

  const ownerQuickReplies = [
    'Hello! Yes, absolutely. We have prepared your station.',
    'Thank you for confirming! See you at our salon atelier.',
    'Please feel free to arrive a few minutes early to relax.',
    'Understood! Our master technician will be ready for you.',
  ];

  const quickReplies = isCustomer ? customerQuickReplies : ownerQuickReplies;

  return (
    <div className="bg-white rounded-3xl border border-pink-100 shadow-xl overflow-hidden flex flex-col h-[750px] max-h-[85vh]">
      {/* Top Header */}
      <div className="px-5 py-4 border-b border-pink-100 bg-gradient-to-r from-pink-50/80 via-white to-pink-50/50 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center text-white shadow-md">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-serif font-bold text-gray-900">Private Salon Messages</h2>
              <span className="text-[11px] font-semibold text-pink-700 bg-pink-100/70 px-2.5 py-0.5 rounded-full">
                {isCustomer ? 'Direct with Salon Owner' : 'Direct Client Communication'}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Direct two-way messaging for inquiries, custom requests, and appointment coordination.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isCustomer && (
            <button
              onClick={() => setShowNewChatModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Conversation</span>
            </button>
          )}
          <button
            onClick={() => loadConversations(true)}
            title="Refresh conversations"
            className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loadingChannels ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left Column: Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-pink-100 bg-stone-50/30 flex flex-col shrink-0 ${
            isMobileViewingThread ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search Bar */}
          <div className="p-3 border-b border-pink-100/70 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-pink-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isCustomer ? 'Search salon or message...' : 'Search client name...'}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-pink-50/30 border border-pink-200 text-xs focus:outline-pink-500 text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto divide-y divide-pink-50">
            {loadingChannels && conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-pink-500" />
                <p className="text-xs">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-pink-400" />
                <p className="text-sm font-semibold text-gray-600">No conversations found</p>
                <p className="text-xs text-gray-400 mt-1">
                  {isCustomer
                    ? 'Start a message with your preferred salon to ask questions.'
                    : 'Customer messages regarding bookings and consultations will appear here.'}
                </p>
                {isCustomer && (
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-800 text-xs font-semibold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Start First Chat</span>
                  </button>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConversation?.conversation_id === conv.conversation_id;
                const displayName = isCustomer ? conv.salon_name : conv.customer_name;
                const dateStr = conv.last_timestamp
                  ? new Date(conv.last_timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <button
                    key={conv.conversation_id}
                    onClick={() => {
                      setSelectedConvId(conv.conversation_id);
                      setIsMobileViewingThread(true);
                    }}
                    className={`w-full text-left p-3.5 transition flex items-start space-x-3 cursor-pointer ${
                      isSelected
                        ? 'bg-pink-50/70 border-l-4 border-l-pink-600'
                        : 'hover:bg-pink-50/30 border-l-4 border-l-transparent'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {isCustomer ? (
                        conv.salon_logo ? (
                          <img
                            src={conv.salon_logo}
                            alt={conv.salon_name}
                            className="w-11 h-11 rounded-2xl object-cover border border-pink-100"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm">
                            <Store className="w-5 h-5" />
                          </div>
                        )
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                          {displayName?.charAt(0).toUpperCase() || 'C'}
                        </div>
                      )}
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>

                    {/* Channel Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-pink-900' : 'text-gray-900'
                          }`}
                        >
                          {displayName}
                        </h4>
                        <span className="text-[10px] text-gray-400 shrink-0 font-mono tabular-nums">{dateStr}</span>
                      </div>

                      <p className="text-xs text-gray-500 truncate leading-snug">
                        {conv.last_message || 'No messages yet'}
                      </p>

                      {/* Attached Appointment Badge */}
                      {conv.active_appointment && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-pink-700 bg-pink-100/50 px-2 py-0.5 rounded-md truncate">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {conv.active_appointment.service_name} · {conv.active_appointment.appointment_date}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Feed & Composer */}
        <div
          className={`flex-1 flex flex-col bg-white min-w-0 ${
            !isMobileViewingThread ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Active Conversation Top Bar */}
              <div className="px-5 py-3 border-b border-pink-100 bg-pink-50/20 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center space-x-3 min-w-0">
                  <button
                    onClick={() => setIsMobileViewingThread(false)}
                    className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-pink-600 hover:bg-pink-100"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center text-pink-700 shrink-0 font-bold text-xs">
                    {isCustomer ? <Store className="w-4.5 h-4.5" /> : <UserIcon className="w-4.5 h-4.5" />}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate">
                      {isCustomer ? activeConversation.salon_name : activeConversation.customer_name}
                    </h3>
                    <div className="flex items-center space-x-3 text-[11px] text-gray-500 truncate">
                      {activeConversation.customer_phone || activeConversation.salon_phone ? (
                        <span className="flex items-center space-x-1 font-mono tabular-nums">
                          <Phone className="w-3 h-3 text-pink-500" />
                          <span>{isCustomer ? activeConversation.salon_phone : activeConversation.customer_phone}</span>
                        </span>
                      ) : null}
                      <span className="hidden sm:inline">· Direct Chat Channel</span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  {isCustomer && onNavigateToBooking && (
                    <button
                      onClick={() => onNavigateToBooking(activeConversation.salon_id)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-800 text-xs font-semibold transition cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book Appointment</span>
                    </button>
                  )}
                  {isCustomer && onViewSalon && (
                    <button
                      onClick={() => onViewSalon(activeConversation.salon_id)}
                      className="p-1.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition"
                      title="View Salon Details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Linked Appointment Notice Banner (if active) */}
              {activeConversation.active_appointment && (
                <div className="px-5 py-2 bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100 text-xs text-pink-900 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center space-x-2 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                    <span className="truncate">
                      <strong>Scheduled Service:</strong> {activeConversation.active_appointment.service_name} on{' '}
                      {activeConversation.active_appointment.appointment_date} at{' '}
                      {activeConversation.active_appointment.appointment_time}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-pink-700 border border-pink-200 uppercase tracking-wider shrink-0">
                    {activeConversation.active_appointment.status}
                  </span>
                </div>
              )}

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-stone-50/20">
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-pink-500 mr-2" />
                    <span className="text-xs">Loading message history...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30 text-pink-400" />
                    <p className="text-sm font-semibold text-gray-700">No messages yet in this conversation</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      Send a message below or pick a quick suggestion to start chatting.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isFromMe = msg.sender_id === currentUser.id;
                    const timeStr = msg.created_at
                      ? new Date(msg.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isFromMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%] ${
                          isFromMe ? 'ml-auto' : 'mr-auto'
                        }`}
                      >
                        {/* Sender Label */}
                        <span className="text-[10px] font-semibold text-gray-400 mb-1 px-1">
                          {isFromMe ? 'You' : msg.sender_name}
                        </span>

                        {/* Bubble */}
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs break-words ${
                            isFromMe
                              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-tr-xs'
                              : 'bg-white text-gray-800 border border-pink-100 rounded-tl-xs'
                          }`}
                        >
                          <p>{msg.content}</p>
                        </div>

                        {/* Timestamp & Status */}
                        <div className="flex items-center space-x-1 mt-1 text-[10px] text-gray-400 px-1 font-mono tabular-nums">
                          <span>{timeStr}</span>
                          {isFromMe && (
                            <span>
                              {msg.is_read ? (
                                <CheckCheck className="w-3.5 h-3.5 text-pink-600 inline" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-gray-400 inline" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Suggestion Chips */}
              <div className="px-4 py-2 bg-pink-50/40 border-t border-pink-100 flex items-center gap-1.5 overflow-x-auto shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-700 shrink-0">
                  Quick:
                </span>
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(reply)}
                    disabled={sending}
                    className="px-2.5 py-1 rounded-full bg-white hover:bg-pink-100 border border-pink-200 text-gray-700 hover:text-pink-900 text-[11px] whitespace-nowrap transition cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Message Composer */}
              <div className="p-3 sm:p-4 bg-white border-t border-pink-100 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      isCustomer
                        ? `Message ${activeConversation.salon_name}...`
                        : `Reply to ${activeConversation.customer_name}...`
                    }
                    disabled={sending}
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-pink-50/30 border border-pink-200 text-xs sm:text-sm focus:outline-pink-500 focus:bg-white text-gray-900 placeholder-gray-400 transition"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-40 cursor-pointer flex items-center space-x-1.5 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-400">
              <div>
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30 text-pink-400" />
                <h3 className="text-base font-bold text-gray-700">Select a Conversation</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  Choose a salon contact on the left to review message history or start a new inquiry.
                </p>
                {isCustomer && (
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    Start a New Conversation
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Start New Conversation Modal (For Customers) */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-pink-100 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-serif font-bold text-gray-900 mb-1">
              Start Conversation with Salon
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Select the salon you want to message privately.
            </p>

            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {salons.map((salon) => (
                <label
                  key={salon.id}
                  className={`p-3 rounded-2xl border flex items-center space-x-3 cursor-pointer transition ${
                    selectedNewSalonId === salon.id
                      ? 'border-pink-600 bg-pink-50/70 shadow-xs'
                      : 'border-pink-100 hover:bg-pink-50/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="newChatSalon"
                    checked={selectedNewSalonId === salon.id}
                    onChange={() => setSelectedNewSalonId(salon.id)}
                    className="text-pink-600 focus:ring-pink-500"
                  />
                  <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{salon.salon_name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{salon.address}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStartNewChat}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Open Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
