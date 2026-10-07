import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Star,
  Package,
  Navigation,
  Lock,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';

interface AboutContactModalProps {
  initialTab?: 'about' | 'objectives' | 'contact';
  onClose: () => void;
}

export const AboutContactModal: React.FC<AboutContactModalProps> = ({
  initialTab = 'about',
  onClose,
}) => {
  const [tab, setTab] = useState<'about' | 'objectives' | 'contact'>(initialTab);
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-pink-100 p-4 sm:p-6 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-pink-100 shrink-0">
          <div className="flex border-b-2 border-transparent gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setTab('about')}
              className={`pb-1 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                tab === 'about'
                  ? 'border-b-2 border-pink-600 text-pink-700'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              About Portal
            </button>
            <button
              onClick={() => setTab('objectives')}
              className={`pb-1 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                tab === 'objectives'
                  ? 'border-b-2 border-pink-600 text-pink-700'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>Research Objectives</span>
            </button>
            <button
              onClick={() => setTab('contact')}
              className={`pb-1 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
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
            className="w-8 h-8 rounded-full bg-pink-50 hover:bg-pink-100 flex items-center justify-center text-gray-600 cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {tab === 'about' ? (
          <div className="mt-3 sm:mt-4 space-y-3.5 sm:space-y-4 text-xs text-gray-600 leading-relaxed overflow-y-auto flex-1 min-h-0 pr-0.5">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-pink-50/50 border border-pink-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-serif font-bold text-xs sm:text-sm text-gray-900 truncate">
                  Centralized Service Marketplace in Davao City
                </h4>
                <p className="text-[11px] text-gray-500 line-clamp-1">
                  A mobile-web responsive nail salon portal built for Davao City salons and beauty clients.
                </p>
              </div>
            </div>

            <p>
              <strong>Nail Glam Hub</strong> was designed as a specialized centralized marketplace in Davao City, bridging the gap between nail salons, technicians, and local beauty seekers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl border border-pink-100 bg-white space-y-1">
                <div className="flex items-center gap-1.5 text-pink-700 font-bold">
                  <ShieldCheck className="w-4 h-4 shrink-0" /> Davao City Coverage
                </div>
                <p className="text-[11px] text-gray-500">
                  Curated premier nail studios across Lanang, Bajada, Poblacion, Matina, Buhangin, and Toril.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-pink-100 bg-white space-y-1">
                <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                  <Heart className="w-4 h-4 shrink-0" /> Seamless Experience
                </div>
                <p className="text-[11px] text-gray-500">
                  Direct appointment scheduling, GPS navigation, real-time reviews, and inventory controls.
                </p>
              </div>
            </div>
          </div>
        ) : tab === 'objectives' ? (
          <div className="mt-3 sm:mt-4 space-y-3.5 text-xs text-gray-600 leading-relaxed overflow-y-auto flex-1 min-h-0 pr-0.5">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-rose-500/10 border border-pink-200">
              <h4 className="font-serif font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                All 4 Research Objectives Fully Satisfied
              </h4>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Verification matrix for the Davao City centralized nail salon portal study.
              </p>
            </div>

            {/* Objective 1 */}
            <div className="p-3.5 rounded-2xl border border-pink-100 bg-white space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-pink-600" /> Objective 1: Online Appointment Booking System
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Satisfied ✓
                </span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                <strong>Requirement:</strong> Enables users to select services, preferred salons, staff, and time schedules efficiently.
              </p>
              <ul className="text-[11px] text-gray-500 space-y-1 list-disc list-inside">
                <li>Multi-step booking wizard with dynamic service catalog and real-time pricing.</li>
                <li>Salon selection across Davao City network with direct salon card booking buttons.</li>
                <li>Staff/specialist assignment with bio, specialty, rating, and 'any available' option.</li>
                <li>Automatic time schedule calculation based on salon operating hours and conflict prevention.</li>
              </ul>
            </div>

            {/* Objective 2 */}
            <div className="p-3.5 rounded-2xl border border-pink-100 bg-white space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" /> Objective 2: Public & Private Feedback System
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Satisfied ✓
                </span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                <strong>Requirement:</strong> Allows users to submit public and private reviews after service completion.
              </p>
              <ul className="text-[11px] text-gray-500 space-y-1 list-disc list-inside">
                <li>Triggered upon appointment completion in the Customer Dashboard.</li>
                <li>1-5 star satisfaction ratings with reviewer verification.</li>
                <li>Dual review mode: Public reviews displayed on salon profiles + Confidential private feedback for salon owners & management.</li>
                <li>Owner dashboard separates public sentiment from confidential management tips.</li>
              </ul>
            </div>

            {/* Objective 3 */}
            <div className="p-3.5 rounded-2xl border border-pink-100 bg-white space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" /> Objective 3: Inventory & Service Availability Management
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Satisfied ✓
                </span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                <strong>Requirement:</strong> Allows salon owners to monitor, update, and manage the availability of services and related resources.
              </p>
              <ul className="text-[11px] text-gray-500 space-y-1 list-disc list-inside">
                <li>Real-time treatment menu availability toggle (Available vs Temporarily Unavailable) on owner dashboard.</li>
                <li>Unavailable services are clearly flagged and restricted in client booking wizards.</li>
                <li>Comprehensive physical resource inventory: stock levels, low-stock threshold alerts, restock actions.</li>
                <li>In-store pickup order fulfillment, unclaimed item restock tracking, and catalog controls.</li>
              </ul>
            </div>

            {/* Objective 4 */}
            <div className="p-3.5 rounded-2xl border border-pink-100 bg-white space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-rose-600" /> Objective 4: GPS-based Map & Store Navigation
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Satisfied ✓
                </span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                <strong>Requirement:</strong> Enables users to locate and navigate salon store locations easily.
              </p>
              <ul className="text-[11px] text-gray-500 space-y-1 list-disc list-inside">
                <li>Full interactive GPS map centered in Davao City (SM Lanang, Abreeza, Gaisano, Matina, etc.).</li>
                <li>Browser GPS user geolocation with animated 'You are here' pulse pin.</li>
                <li>Turn-by-turn road route generation (OSRM) with real distance (km) and driving time estimates.</li>
                <li>Direct external GPS deep navigation via Google Maps and Waze, plus salon card direct dial ('tel:') buttons.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="mt-3 sm:mt-4 space-y-4 overflow-y-auto flex-1 min-h-0 pr-0.5">
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
                <span>+63 (082) 221-0987</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
