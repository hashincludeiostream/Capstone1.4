import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Plus, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { Review, Salon } from '../types';
import { fetchReviews } from '../lib/api';

interface ReviewsViewProps {
  salons: Salon[];
  onOpenLeaveReview: (salon: Salon) => void;
}

export const ReviewsView: React.FC<ReviewsViewProps> = ({ salons, onOpenLeaveReview }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSalonId, setSelectedSalonId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const list = await fetchReviews(selectedSalonId || undefined);
      console.log('Fetched reviews:', list);
      setReviews(list);
      setLoading(false);
    }
    load();
  }, [selectedSalonId]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-pink-900 via-rose-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-pink-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            Verified Customer Feedback
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold">
            Real Experiences & Salon Reviews
          </h2>
          <p className="text-xs sm:text-sm text-pink-100/80 mt-1">
            Read honest impressions and service reviews from real appointments across our network.
          </p>
        </div>

        <button
          onClick={() => onOpenLeaveReview(salons[0])}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-semibold shadow-md shadow-pink-500/20 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Salon Filter Pills */}
      <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-xs flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-gray-500 flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5 text-pink-500" /> Filter:
        </span>
        <button
          onClick={() => setSelectedSalonId(null)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedSalonId === null
              ? 'bg-pink-600 text-white shadow-xs'
              : 'bg-pink-50 text-gray-700 hover:bg-pink-100'
          }`}
        >
          All Salons ({reviews.length})
        </button>
        {salons.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSalonId(s.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              selectedSalonId === s.id
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-pink-50 text-gray-700 hover:bg-pink-100'
            }`}
          >
            {s.salon_name}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">
          No reviews found for this salon yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-5 rounded-3xl border border-pink-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-pink-100 text-pink-700 font-bold text-sm flex items-center justify-center">
                      {rev.customer_name?.[0] || 'U'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{rev.customer_name || `Customer #${rev.customer_id}`}</h4>
                      <p className="text-[10px] text-pink-700 font-semibold">{rev.salon_name || 'Salon'}</p>
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

                <p className="text-xs text-gray-700 leading-relaxed italic">
                  "{rev.review_text}"
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-pink-50 flex items-center justify-between text-[11px] text-gray-400">
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Verified Client
                </span>
                <span>{new Date(rev.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
