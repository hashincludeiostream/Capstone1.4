import React, { useEffect, useState } from 'react';
import {
  X,
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  Scissors,
  Users,
  MessageSquare,
  Sparkles,
  Calendar,
  CheckCircle2,
  Navigation,
  Building,
  Car,
  Compass,
  ExternalLink,
} from 'lucide-react';
import { Salon, Service, Technician, Review, WorkingHour } from '../types';
import { fetchSalonDetails } from '../lib/api';
import { getOpenStreetMapDirectionsUrl } from '../utils/geoUtils';

interface SalonDetailsModalProps {
  salon: Salon;
  onClose: () => void;
  onBookService: (salon: Salon, service?: Service) => void;
  onOpenLeaveReview: (salon: Salon) => void;
}

export const SalonDetailsModal: React.FC<SalonDetailsModalProps> = ({
  salon,
  onClose,
  onBookService,
  onOpenLeaveReview,
}) => {
  const [activeTab, setActiveTab] = useState<'services' | 'technicians' | 'reviews' | 'location' | 'about'>('services');
  const [loading, setLoading] = useState(true);
  const [salonData, setSalonData] = useState<{
    services: Service[];
    technicians: Technician[];
    reviews: Review[];
    working_hours: WorkingHour[];
  }>({
    services: [],
    technicians: [],
    reviews: [],
    working_hours: [],
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetchSalonDetails(salon.id);
      if (res) {
        setSalonData({
          services: res.services || [],
          technicians: res.technicians || [],
          reviews: res.reviews || [],
          working_hours: res.working_hours || [],
        });
      }
      setLoading(false);
    }
    load();
  }, [salon.id]);

  const lat = salon.latitude || 14.5505;
  const lng = salon.longitude || 121.0509;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-pink-100">
        {/* Header / Hero Banner */}
        <div className="relative h-56 sm:h-72 bg-gradient-to-r from-pink-900 via-rose-900 to-purple-950 text-white shrink-0">
          {salon.banner || salon.logo ? (
            <img
              src={salon.banner || salon.logo || undefined}
              alt={salon.salon_name}
              className="w-full h-full object-cover opacity-60"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Salon Banner Info */}
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 right-4 sm:right-6 flex items-end justify-between gap-4">
            <div className="flex items-end gap-3 sm:gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1 shadow-xl border-2 border-white shrink-0 overflow-hidden">
                {salon.logo ? (
                  <img
                    src={salon.logo}
                    alt={`${salon.salon_name} logo`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : null}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-3xl font-serif font-bold text-white leading-tight">
                    {salon.salon_name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-500/80 text-white">
                    {salon.category_name || 'Nail Spa'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs sm:text-sm text-pink-100/90">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold">{salon.review_count ? Number(salon.avg_rating).toFixed(1) : 'Not rated'}</span>
                    <span className="text-white/70">({salon.review_count || 0} verified reviews)</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-pink-300" />
                    <span className="truncate max-w-xs">{salon.address}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onBookService(salon)}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold text-sm shadow-lg shadow-pink-500/30 transition-all cursor-pointer shrink-0"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-pink-100 px-4 sm:px-6 bg-pink-50/40 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('services')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'services'
                ? 'border-pink-600 text-pink-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Services &amp; Treatments ({salonData.services.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('technicians')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'technicians'
                ? 'border-pink-600 text-pink-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff & Specialists ({salonData.technicians.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-pink-600 text-pink-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Reviews ({salonData.reviews.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'location'
                ? 'border-pink-600 text-pink-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-pink-600" />
            <span>Location & Map</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'about'
                ? 'border-pink-600 text-pink-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Hours & Contact</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Services Tab */}
              {activeTab === 'services' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-serif font-bold text-gray-900">
                        Available Treatments & Styling
                      </h4>
                      <p className="text-xs text-gray-500">
                        Select any service below to proceed with fast online scheduling.
                      </p>
                    </div>
                  </div>

                  {salonData.services.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                      No services listed yet for this salon.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {salonData.services.map((service) => (
                        <div
                          key={service.id}
                          className="p-3.5 rounded-2xl border border-pink-100 hover:border-pink-300 hover:bg-pink-50/30 transition-all flex gap-3 group justify-between"
                        >
                          <div className="flex gap-3">
                            {service.image_url && (
                              <img
                                src={service.image_url}
                                alt={service.service_name}
                                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-pink-100"
                              />
                            )}
                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-xs font-bold text-pink-700 bg-pink-100 px-2 py-0.2 rounded-md">
                                  {service.category}
                                </span>
                                {service.difficulty_level && (
                                  <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded-md">
                                    {service.difficulty_level}
                                  </span>
                                )}
                              </div>
                              <h5 className="text-sm font-semibold text-gray-900 group-hover:text-pink-700 transition-colors">
                                {service.service_name}
                              </h5>
                              <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                {service.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs font-medium text-gray-600">
                                <span className="text-pink-700 font-semibold bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100">
                                  Pay In-Store
                                </span>
                                <span>•</span>
                                <span>{service.duration} mins</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col justify-end">
                            <button
                              onClick={() => onBookService(salon, service)}
                              className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                            >
                              Book
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Technicians Tab */}
              {activeTab === 'technicians' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-serif font-bold text-gray-900">
                      Our Master Artists & Technicians
                    </h4>
                    <p className="text-xs text-gray-500">
                      Certified professionals specializing in luxury nail care and art.
                    </p>
                  </div>

                  {salonData.technicians.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                      No technicians listed currently.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {salonData.technicians.map((tech) => (
                        <div
                          key={tech.id}
                          className="p-4 rounded-2xl border border-pink-100 bg-pink-50/20 flex gap-3.5 items-start"
                        >
                          {tech.avatar ? (
                            <img
                              src={tech.avatar}
                              alt={tech.name}
                              className="w-14 h-14 rounded-full object-cover border-2 border-pink-200 shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center border-2 border-pink-200 shrink-0">
                              <span className="text-sm font-bold">{tech.name?.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <div>
                            <h5 className="text-sm font-bold text-gray-900">{tech.name}</h5>
                            <p className="text-xs text-pink-700 font-medium">
                              {tech.experience_years} Years Experience
                            </p>
                            <p className="text-xs text-gray-600 mt-1 font-medium">
                              <span className="font-semibold text-gray-700">Specialties:</span>{' '}
                              {tech.specialties}
                            </p>
                            {tech.bio && (
                              <p className="text-xs text-gray-500 mt-1 italic leading-relaxed">
                                "{tech.bio}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-serif font-bold text-gray-900">
                        Customer Feedback & Experiences
                      </h4>
                      <p className="text-xs text-gray-500">
                        {salon.review_count ? `Rated ${Number(salon.avg_rating).toFixed(1)} out of 5 stars by verified clients.` : 'This salon has not received a rating yet.'}
                      </p>
                    </div>
                    <button
                      onClick={() => onOpenLeaveReview(salon)}
                      className="px-3.5 py-1.5 rounded-xl border border-pink-300 text-pink-700 hover:bg-pink-50 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Write a Review
                    </button>
                  </div>

                  {salonData.reviews.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                      Be the first to review this salon!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {salonData.reviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="p-4 rounded-2xl border border-pink-100 bg-white shadow-xs"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-full bg-pink-100 text-pink-700 font-bold text-xs flex items-center justify-center">
                                {rev.customer_name?.[0] || 'U'}
                              </span>
                              <div>
                                <p className="text-xs font-bold text-gray-900">{rev.customer_name || `Customer #${rev.customer_id}`}</p>
                                <p className="text-[10px] text-gray-400">Verified Client</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < rev.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed">{rev.review_text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Location & Map Tab */}
              {activeTab === 'location' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-pink-600" />
                        Store Location, Interactive Map & Directions
                      </h4>
                      <p className="text-xs text-gray-500">
                        Conveniently located at {salon.address}
                      </p>
                    </div>

                    <a
                      href={getOpenStreetMapDirectionsUrl(lat, lng, salon.salon_name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Open in OpenStreetMap</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>
                  </div>

                  {/* Interactive Map Stage */}
                  <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden border border-pink-200 bg-slate-900 shadow-sm">
                    {/* Visual Street Canvas Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-pink-50/40 to-blue-50">
                      <svg className="w-full h-full stroke-pink-200 opacity-70" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id="modal-map-grid" width="45" height="45" patternUnits="userSpaceOnUse">
                            <path d="M 45 0 L 0 0 0 45" fill="none" strokeWidth="0.75" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#modal-map-grid)" />
                        <path d="M 40,40 Q 200,160 380,240 T 700,400" fill="none" strokeWidth="4" className="stroke-pink-400/70" />
                        <path d="M 600,30 Q 350,220 180,450" fill="none" strokeWidth="3" className="stroke-purple-400/60" />
                      </svg>
                    </div>

                    {/* Centered Map Pin for Salon */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                      <div className="absolute -inset-4 rounded-full bg-pink-500/30 animate-ping pointer-events-none" />
                      <div className="relative flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white px-3.5 py-1.5 rounded-full shadow-2xl border-2 border-white">
                        <img
                          src={salon.logo}
                          alt={salon.salon_name}
                          className="w-5 h-5 rounded-full object-cover border border-white"
                        />
                        <span className="text-xs font-bold whitespace-nowrap">{salon.salon_name}</span>
                      </div>
                      <div className="w-3 h-3 bg-rose-600 rotate-45 -mt-1.5 shadow-md" />
                    </div>

                    {/* Coordinates Overlay */}
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-pink-200 text-[11px] text-gray-700 font-mono shadow-xs">
                      GPS: {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
                    </div>
                  </div>

                  {/* Navigation Details Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-pink-50/40 border border-pink-100 space-y-2">
                      <span className="font-bold text-gray-900 flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-pink-600" />
                        Mall Entrance & Landmark Instructions
                      </span>
                      <p className="text-gray-600 leading-relaxed">
                        {salon.landmark ||
                          'Located inside the main commercial mall wing. Check main directory kiosk on the ground floor.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-pink-50/40 border border-pink-100 space-y-2">
                      <span className="font-bold text-gray-900 flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-pink-600" />
                        Parking & Accessibility
                      </span>
                      <p className="text-gray-600 leading-relaxed">
                        {salon.parking_info ||
                          'Secure multi-level parking available on site with elevator and ramp accessibility.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* About & Working Hours Tab */}
              {activeTab === 'about' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-base font-serif font-bold text-gray-900 mb-2">
                      About the Salon
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{salon.description}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 rounded-2xl border border-pink-100 bg-pink-50/30 space-y-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-pink-900">
                        Contact Details
                      </h5>
                      <div className="space-y-2 text-xs text-gray-700">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-pink-600" />
                          <span>{salon.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-pink-600" />
                          <span>{salon.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                          <span>{salon.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-pink-100 bg-pink-50/30 space-y-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-pink-900">
                        Weekly Working Hours
                      </h5>
                      <div className="space-y-1.5 text-xs text-gray-700">
                        {[
                          'Monday',
                          'Tuesday',
                          'Wednesday',
                          'Thursday',
                          'Friday',
                          'Saturday',
                          'Sunday',
                        ].map((day) => {
                          const sched = salonData.working_hours.find((h) => h.day_of_week === day);
                          return (
                            <div key={day} className="flex justify-between py-0.5 border-b border-pink-100/50">
                              <span className="font-medium text-gray-600">{day}</span>
                              <span className="font-semibold text-gray-900">
                                {sched
                                  ? sched.is_closed
                                    ? 'Closed'
                                    : `${sched.opening_time} - ${sched.closing_time}`
                                  : '09:00 - 19:00'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Bottom CTA */}
        <div className="p-4 bg-pink-50 border-t border-pink-100 flex items-center justify-between gap-3 shrink-0">
          <div>
            <p className="text-xs font-semibold text-gray-800">Ready to pamper your nails?</p>
            <p className="text-[11px] text-gray-500">Fast confirmation with instant calendar booking</p>
          </div>
          <button
            onClick={() => onBookService(salon)}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold text-sm shadow-md shadow-pink-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Book with {salon.salon_name.split(' ')[0]}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
