import React, { useState } from 'react';
import { X, Sparkles, Mail, Phone, MapPin, Heart, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AboutContactModalProps {
  initialTab?: 'about' | 'contact';
  onClose: () => void;
}

export const AboutContactModal: React.FC<AboutContactModalProps> = ({
  initialTab = 'about',
  onClose,
}) => {
  const [tab, setTab] = useState<'about' | 'contact'>(initialTab);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-pink-100 p-6">
        <div className="flex items-center justify-between pb-3 border-b border-pink-100">
          <div className="flex border-b-2 border-transparent gap-3">
            <button
              onClick={() => setTab('about')}
              className={`pb-1 text-sm font-bold transition-all cursor-pointer ${
                tab === 'about'
                  ? 'border-b-2 border-pink-600 text-pink-700'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              About Nail Glam Hub
            </button>
            <button
              onClick={() => setTab('contact')}
              className={`pb-1 text-sm font-bold transition-all cursor-pointer ${
                tab === 'contact'
                  ? 'border-b-2 border-pink-600 text-pink-700'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Contact Support
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-pink-50 hover:bg-pink-100 flex items-center justify-center text-gray-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {tab === 'about' ? (
          <div className="mt-4 space-y-4 text-xs text-gray-600 leading-relaxed">
            <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm text-gray-900">
                  Elevating the Nail & Beauty Industry
                </h4>
                <p className="text-[11px] text-gray-500">
                  A modern platform connecting beauty seekers with premier salons.
                </p>
              </div>
            </div>

            <p>
              <strong>Nail Glam Hub</strong> was designed to bridge the gap between creative nail artists and clients seeking bespoke, high-quality beauty experiences. We combine Pinterest-style visual discovery with a frictionless, real-time booking ecosystem.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl border border-pink-100 bg-white space-y-1">
                <div className="flex items-center gap-1.5 text-pink-700 font-bold">
                  <ShieldCheck className="w-4 h-4" /> Verified Quality
                </div>
                <p className="text-[11px] text-gray-500">
                  Every salon is vetted for sanitation, skill certification, and client satisfaction.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-pink-100 bg-white space-y-1">
                <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                  <Heart className="w-4 h-4" /> Artist Empowerment
                </div>
                <p className="text-[11px] text-gray-500">
                  Independent technicians showcase their portfolio and manage appointment queues seamlessly.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {sent ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-900">Message Received!</h4>
                <p className="text-xs text-gray-500">Our concierge support will reach back out within 2 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Maria Clara"
                    className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-xs focus:outline-pink-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Your Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="maria@example.com"
                    className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-xs focus:outline-pink-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Inquiry / Message</label>
                  <textarea
                    rows={3}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="How can we assist you with your booking or salon listing?"
                    className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-xs focus:outline-pink-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-semibold shadow-md shadow-pink-500/20 cursor-pointer"
                >
                  Send Inquiry
                </button>
              </form>
            )}

            <div className="pt-3 border-t border-pink-100 grid grid-cols-2 gap-2 text-[11px] text-gray-500">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-pink-600" />
                <span>support@nailglamhub.com</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-pink-600" />
                <span>+63 (02) 8555-4526</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
